import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import { supabase, getCurrentUser } from '@/lib/supabase';
import { CONFIG } from '@/lib/config';
import { sendAbandonedCart } from '@/lib/email';
import {
  getSiteSetting,
  DEFAULT_DISCOUNT_SETTINGS,
  DEFAULT_FREE_GIFT_SETTINGS,
  type DiscountSettings,
  type FreeGiftSettings,
} from '@/lib/settings';
import { getCartUnitPrice, repriceCartItems } from '@/utils/pricing';

export interface CartItem {
  productId: string;
  name: string;
  dosage: number | string;
  basePrice?: number;
  price: number;
  /** Original undiscounted price per unit — used to display savings in CartDrawer. */
  originalPrice?: number;
  quantity: number;
  image: string;
  isFree?: boolean;
}

interface CartContextType {
  items: CartItem[];
  addItem: (item: CartItem) => void;
  removeItem: (productId: string, dosage: number | string) => void;
  updateQuantity: (productId: string, dosage: number | string, quantity: number) => void;
  clearCart: () => void;
  totalItems: number;
  totalPrice: number;
  paidItemsTotal: number;
  isCartOpen: boolean;
  setIsCartOpen: (open: boolean) => void;
  freeGiftAdded: boolean;
  isLoading: boolean;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [freeGiftAdded, setFreeGiftAdded] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  /** Last server-side cart update (for abandoned-cart email timing) */
  const [cartRemoteUpdatedAt, setCartRemoteUpdatedAt] = useState<string | null>(null);
  const abandonedReminderSentRef = useRef(false);
  /** Site discount_settings — ref so addItem/updateQuantity always match PDP bundle math without stale closures. */
  const discountParamsRef = useRef<DiscountSettings>(DEFAULT_DISCOUNT_SETTINGS);

  const refreshDiscountParams = useCallback(async () => {
    const s = await getSiteSetting('discount_settings', DEFAULT_DISCOUNT_SETTINGS);
    discountParamsRef.current = s;
    return s;
  }, []);

  // Load cart from Supabase
  const loadCartFromSupabase = useCallback(async (uid: string, settings: DiscountSettings) => {
    try {
      const { data, error } = await supabase
        .from('user_carts')
        .select('items, updated_at')
        .eq('user_id', uid)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error loading cart:', error);
        return;
      }

      if (data?.items) {
        const raw = data.items as CartItem[];
        const repriced = repriceCartItems(raw, settings);
        setItems(repriced);
        if (JSON.stringify(repriced) !== JSON.stringify(raw)) {
          const nowIso = new Date().toISOString();
          await supabase.from('user_carts').upsert(
            { user_id: uid, items: repriced, updated_at: nowIso },
            { onConflict: 'user_id' },
          );
          setCartRemoteUpdatedAt(nowIso);
        } else {
          setCartRemoteUpdatedAt(
            (data as { updated_at?: string })?.updated_at
              ? String((data as { updated_at: string }).updated_at)
              : null
          );
        }
      } else {
        setCartRemoteUpdatedAt(null);
      }
    } catch (error) {
      console.error('Error loading cart from Supabase:', error);
    }
  }, []);

  // Load from localStorage (fallback)
  const loadFromLocalStorage = useCallback((settings: DiscountSettings) => {
    const savedCart = localStorage.getItem('vironlabs_cart');
    if (savedCart) {
      try {
        const raw = JSON.parse(savedCart) as CartItem[];
        const repriced = repriceCartItems(raw, settings);
        setItems(repriced);
        if (JSON.stringify(repriced) !== JSON.stringify(raw)) {
          localStorage.setItem('vironlabs_cart', JSON.stringify(repriced));
        }
      } catch (e) {
        console.error('Failed to load cart:', e);
      }
    }
  }, []);

  // Load cart from Supabase or localStorage on mount
  useEffect(() => {
    const loadCart = async () => {
      setIsLoading(true);
      try {
        const settings = await refreshDiscountParams();
        const user = await getCurrentUser();

        if (user) {
          setUserId(user.id);
          await loadCartFromSupabase(user.id, settings);
        } else {
          setUserId(null);
          setCartRemoteUpdatedAt(null);
          loadFromLocalStorage(settings);
        }
      } catch (error) {
        console.error('Error loading cart:', error);
        discountParamsRef.current = DEFAULT_DISCOUNT_SETTINGS;
        loadFromLocalStorage(DEFAULT_DISCOUNT_SETTINGS);
      } finally {
        setIsLoading(false);
      }
    };

    loadCart();

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      const settings = await refreshDiscountParams();
      if (session?.user) {
        setUserId(session.user.id);
        await loadCartFromSupabase(session.user.id, settings);
      } else {
        setUserId(null);
        setCartRemoteUpdatedAt(null);
        loadFromLocalStorage(settings);
      }
    });

    return () => subscription.unsubscribe();
  }, [loadCartFromSupabase, loadFromLocalStorage, refreshDiscountParams]);

  // Save cart to Supabase
  const saveCartToSupabase = async (newItems: CartItem[]) => {
    if (!userId) {
      // Save to localStorage if no user
      localStorage.setItem('vironlabs_cart', JSON.stringify(newItems));
      return;
    }

    const nowIso = new Date().toISOString();
    try {
      const { error } = await supabase
        .from('user_carts')
        .upsert(
          {
            user_id: userId,
            items: newItems,
            updated_at: nowIso,
          },
          {
            onConflict: 'user_id',
          }
        );

      if (error) {
        console.error('Error saving cart to Supabase:', error);
        localStorage.setItem('vironlabs_cart', JSON.stringify(newItems));
      } else {
        setCartRemoteUpdatedAt(nowIso);
      }
    } catch (error) {
      console.error('Error saving cart to Supabase:', error);
      localStorage.setItem('vironlabs_cart', JSON.stringify(newItems));
    }
  };

  // Calculate total price excluding free items
  const paidItemsTotal = items
    .filter(item => !item.isFree)
    .reduce((sum, item) => sum + item.price * item.quantity, 0);

  const hasFreeGiftItem = items.some((item) => item.isFree);

  // Auto-add free BAC Water when paid cart reaches the configured threshold.
  useEffect(() => {
    if (isLoading) return;

    let cancelled = false;

    const syncFreeGift = async () => {
      const settings: FreeGiftSettings = await getSiteSetting(
        'free_gift_settings',
        DEFAULT_FREE_GIFT_SETTINGS
      );
      if (cancelled) return;

      const paidItems = items.filter((item) => !item.isFree);
      const paidTotal = paidItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
      const freeItems = items.filter((item) => item.isFree);
      const giftId = settings.product_id || 'bac-water';
      const hasMatchingGift = freeItems.some((item) => item.productId === giftId);

      if (!settings.enabled) {
        if (freeItems.length > 0) {
          const cleaned = paidItems;
          setItems(cleaned);
          await saveCartToSupabase(cleaned);
          setFreeGiftAdded(false);
        } else {
          setFreeGiftAdded(false);
        }
        return;
      }

      if (paidItems.length === 0) {
        if (freeItems.length > 0) {
          setItems([]);
          await saveCartToSupabase([]);
        }
        setFreeGiftAdded(false);
        return;
      }

      if (paidTotal >= settings.threshold && !hasMatchingGift) {
        const gift: CartItem = {
          productId: giftId,
          name: settings.name || 'BAC Water',
          dosage: settings.dosage || '3 mL',
          price: 0,
          quantity: 1,
          image: giftId === 'bac-water' ? '/bac-water.png' : '/bac-water.png',
          isFree: true,
        };
        const updated = [...paidItems, gift];
        setItems(updated);
        await saveCartToSupabase(updated);
        setFreeGiftAdded(true);
        return;
      }

      if (paidTotal < settings.threshold && freeItems.length > 0) {
        const cleaned = paidItems;
        setItems(cleaned);
        await saveCartToSupabase(cleaned);
        setFreeGiftAdded(false);
        return;
      }

      setFreeGiftAdded(hasMatchingGift);
    };

    void syncFreeGift();
    return () => {
      cancelled = true;
    };
    // Intentionally keyed on paid total + free-gift presence to avoid loops on every item mutation.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoading, paidItemsTotal, hasFreeGiftItem, items.length]);

  // Logged-in users: one cart reminder per ~7 days if the cart was last updated 24+ hours ago and still has items.
  useEffect(() => {
    if (isLoading || !userId) return;
    if (abandonedReminderSentRef.current) return;

    const paid = items.filter((i) => !i.isFree);
    if (paid.length === 0) return;
    if (!cartRemoteUpdatedAt) return;

    const staleMs = Date.now() - new Date(cartRemoteUpdatedAt).getTime();
    if (staleMs < 24 * 60 * 60 * 1000) return;

    const storageKey = `vironlabs_cart_reminder_ts_${userId}`;
    let lastSent = 0;
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) lastSent = parseInt(raw, 10) || 0;
    } catch {
      // ignore
    }
    if (lastSent && Date.now() - lastSent < 7 * 24 * 60 * 60 * 1000) return;

    let cancelled = false;
    void (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (cancelled || !user?.email) return;

      const checkoutUrl = `${CONFIG.SITE_URL.replace(/\/$/, '')}/checkout`;
      const ok = await sendAbandonedCart(user.email, { items: paid, checkoutUrl });
      if (ok) {
        try {
          localStorage.setItem(storageKey, String(Date.now()));
        } catch {
          // ignore
        }
        abandonedReminderSentRef.current = true;
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isLoading, userId, items, cartRemoteUpdatedAt]);

  const addItem = useCallback((newItem: CartItem) => {
    setItems((prev) => {
      const existingIndex = prev.findIndex(
        (item) => item.productId === newItem.productId && item.dosage === newItem.dosage
      );
      
      let updated;
      if (existingIndex >= 0) {
        updated = [...prev];
        const newQty = updated[existingIndex].quantity + newItem.quantity;
        const base = updated[existingIndex].basePrice || newItem.basePrice;
        const disc = discountParamsRef.current;
        updated[existingIndex] = {
          ...updated[existingIndex],
          quantity: newQty,
          basePrice: base,
          price: base != null ? getCartUnitPrice(base, newQty, disc) : updated[existingIndex].price,
        };
      } else {
        const base = newItem.basePrice;
        const disc = discountParamsRef.current;
        updated = [...prev, {
          ...newItem,
          price: base != null ? getCartUnitPrice(base, newItem.quantity, disc) : newItem.price,
        }];
      }
      
      saveCartToSupabase(updated);
      return updated;
    });
  }, [userId]);

  const removeItem = useCallback((productId: string, dosage: number | string) => {
    setItems((prev) => {
      const updated = prev.filter((item) => !(item.productId === productId && item.dosage === dosage));
      saveCartToSupabase(updated);
      return updated;
    });
  }, [userId]);

  const updateQuantity = useCallback((productId: string, dosage: number | string, quantity: number) => {
    if (quantity <= 0) {
      removeItem(productId, dosage);
      return;
    }
    
    setItems((prev) => {
      const updated = prev.map((item) => {
        if (item.productId === productId && item.dosage === dosage) {
          const newPrice =
            item.basePrice != null
              ? getCartUnitPrice(item.basePrice, quantity, discountParamsRef.current)
              : item.price;
          return { ...item, quantity, price: newPrice };
        }
        return item;
      });
      saveCartToSupabase(updated);
      return updated;
    });
  }, [removeItem, userId]);

  const clearCart = useCallback(() => {
    setItems([]);
    saveCartToSupabase([]);
    setFreeGiftAdded(false);
  }, [userId]);

  const totalItems = items.filter(item => !item.isFree).reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        items,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        totalItems,
        totalPrice,
        paidItemsTotal,
        isCartOpen,
        setIsCartOpen,
        freeGiftAdded,
        isLoading,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
