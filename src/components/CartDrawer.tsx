import { X, Plus, Minus, ShoppingBag, Truck, Tag, Award } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { useEffect, useState } from 'react';
import { formatDosageLabel, getDefaultStorefrontDosage } from '@/products';
import { loadEssentialProductsFromSupabase } from '@/lib/supabase-db';
import {
  getSiteSetting,
  DEFAULT_DISCOUNT_SETTINGS,
  DEFAULT_FREE_GIFT_SETTINGS,
  type FreeGiftSettings,
} from '@/lib/settings';
import { getStorefrontPrice, getStorefrontListPrice, getStorefrontSavings, getListPriceDiscountPercent } from '@/utils/pricing';
import { useCurrency } from '@/context/CurrencyContext';
import { useTranslation } from '@/i18n';

export default function CartDrawer() {
  const { t } = useTranslation();
  const {
    items,
    addItem,
    removeItem,
    updateQuantity,
    totalItems,
    isCartOpen,
    setIsCartOpen,
    freeGiftAdded,
  } = useCart();
  const { format, convert, symbol } = useCurrency();
  const [freeGiftSettings, setFreeGiftSettings] = useState<FreeGiftSettings>(DEFAULT_FREE_GIFT_SETTINGS);

  type SuggestedItem = {
    productId: string;
    name: string;
    description?: string;
    image: string;
    dosage: number | string;
    inStock: boolean;
    originalPrice: number;
    unitPrice: number; // price for quantity=1 (already discounted)
    discountEnabled: boolean;
    discountPercentage: number;
    savings: number;
  };

  const [suggestedItems, setSuggestedItems] = useState<SuggestedItem[]>([]);

  const freeShippingThreshold = 2500;
  const freeGiftThreshold = freeGiftSettings.threshold || 2500;
  const freeGiftEnabled = freeGiftSettings.enabled !== false;
  const freeGiftName = freeGiftSettings.name || 'BAC Water';
  
  const paidItems = items.filter(item => !item.isFree);
  const freeItems = items.filter(item => item.isFree);
  const paidTotal = paidItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  
  // Calculate points to be earned (1 point per 100 kr on subtotal)
  const pointsToEarn = Math.floor(paidTotal / 100);
  
  // Calculate total savings using originalPrice stored on each CartItem
  const totalSavings = paidItems.reduce((sum, item) => {
    if (item.originalPrice && item.originalPrice > item.price) {
      return sum + (item.originalPrice - item.price) * item.quantity;
    }
    return sum;
  }, 0);
  
  const remainingForFreeShipping = Math.max(0, freeShippingThreshold - paidTotal);
  const remainingForFreeGift = Math.max(0, freeGiftThreshold - paidTotal);

  const paidProductIdsInCart = new Set(
    items.filter((item) => !item.isFree).map((item) => item.productId),
  );
  const suggestedToShow = suggestedItems.filter((s) => !paidProductIdsInCart.has(s.productId));

  const handleAddSuggested = (product: SuggestedItem) => {
    if (!product.inStock) return;
    addItem({
      productId: product.productId,
      name: product.name,
      dosage: product.dosage,
      basePrice: product.unitPrice,
      price: product.unitPrice,
      originalPrice: product.originalPrice,
      quantity: 1,
      image: product.image,
    });
  };

  useEffect(() => {
    if (!isCartOpen) return;

    let cancelled = false;

    const loadSuggested = async () => {
      try {
        const [discountSettings, essentials, giftSettings] = await Promise.all([
          getSiteSetting('discount_settings', DEFAULT_DISCOUNT_SETTINGS),
          loadEssentialProductsFromSupabase(),
          getSiteSetting('free_gift_settings', DEFAULT_FREE_GIFT_SETTINGS),
        ]);

        if (cancelled) return;

        setFreeGiftSettings(giftSettings);

        const discountEnabled = discountSettings.discount_enabled ?? true;
        const discountPercentage = discountSettings.discount_percentage ?? 20;

        const list: SuggestedItem[] = [];
        for (const product of essentials) {
          if (!product.dosages?.length) continue;
          const dosage = getDefaultStorefrontDosage(product);
          if (!dosage) continue;
          const sellPrice = dosage.originalPrice;
          const unitPrice = getStorefrontPrice(sellPrice, discountEnabled, discountPercentage);
          const listPrice = getStorefrontListPrice(sellPrice, discountEnabled, discountPercentage);
          const savings = getStorefrontSavings(sellPrice, discountEnabled, discountPercentage);
          list.push({
            productId: product.id,
            name: product.name,
            description: product.description,
            image: product.image,
            dosage: formatDosageLabel(dosage.mg, dosage.unit),
            inStock: dosage.inStock,
            originalPrice: listPrice,
            unitPrice,
            discountEnabled,
            discountPercentage,
            savings,
          });
        }

        setSuggestedItems(list);
      } catch (e) {
        console.error('Failed to load suggested products:', e);
        if (!cancelled) setSuggestedItems([]);
      }
    };

    loadSuggested();
    return () => {
      cancelled = true;
    };
  }, [isCartOpen]);

  if (!isCartOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
        onClick={() => setIsCartOpen(false)}
      />

      {/* Drawer - More compact on mobile */}
      <div className="fixed right-0 top-0 h-full w-full max-w-md bg-[#0D1117] border-l border-[rgba(244,246,250,0.08)] z-50 flex flex-col">
        {/* Header - Compact */}
        <div className="flex items-center justify-between p-3 sm:p-4 border-b border-[rgba(244,246,250,0.08)]">
          <div className="flex items-center gap-2">
            <ShoppingBag className="w-4 h-4 sm:w-5 sm:h-5 text-[#2ED1B4]" />
            <h2 className="text-sm sm:text-base font-semibold text-[#F4F6FA]">{t('cart.title')}</h2>
            <span className="px-1.5 py-0.5 rounded-full bg-[rgba(46,209,180,0.15)] text-[#2ED1B4] text-[10px] sm:text-xs font-medium">
              {totalItems}
            </span>
          </div>
          <button
            onClick={() => setIsCartOpen(false)}
            className="p-1 sm:p-1.5 rounded-full hover:bg-[rgba(244,246,250,0.08)] transition-colors"
          >
            <X className="w-4 h-4 sm:w-5 sm:h-5 text-[#A9B3C7]" />
          </button>
        </div>

        {/* Progress Section - Compact */}
        {paidItems.length > 0 && (
          <div className="px-3 py-2 sm:px-4 sm:py-3 bg-[rgba(7,10,18,0.5)] border-b border-[rgba(244,246,250,0.08)] space-y-2 sm:space-y-3">
            <div>
              <div className="flex items-center justify-between mb-0.5 sm:mb-1">
                <div className="flex items-center gap-1 sm:gap-1.5">
                  <Truck className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-[#2ED1B4]" />
                  {remainingForFreeShipping > 0 ? (
                    <span className="text-[10px] sm:text-xs text-[#A9B3C7]">
                      {t('cart.addForFreeShipping', {
                        amount: format(remainingForFreeShipping),
                      })}
                    </span>
                  ) : (
                    <span className="text-[10px] sm:text-xs text-[#2ED1B4] font-medium">
                      {t('cart.freeShippingUnlocked')}
                    </span>
                  )}
                </div>
                <span className="text-[9px] sm:text-[10px] text-[#A9B3C7]">
                  {symbol}{convert(paidTotal).toFixed(0)}/{symbol}{convert(freeShippingThreshold).toFixed(0)}
                </span>
              </div>
              <div className="h-1 sm:h-1.5 bg-[rgba(244,246,250,0.08)] rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-[#2ED1B4] to-[#3B82F6] transition-all duration-500"
                  style={{ width: `${Math.min(100, (paidTotal / freeShippingThreshold) * 100)}%` }}
                />
              </div>
            </div>

            {freeGiftEnabled && (
              <div>
                <div className="flex items-center justify-between mb-0.5 sm:mb-1">
                  <div className="flex items-center gap-1 sm:gap-1.5">
                    <Award className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-amber-400" />
                    {remainingForFreeGift > 0 && !freeGiftAdded ? (
                      <span className="text-[10px] sm:text-xs text-[#A9B3C7]">
                        {t('cart.addForFreeGift', {
                          amount: format(remainingForFreeGift),
                          name: freeGiftName,
                        })}
                      </span>
                    ) : (
                      <span className="text-[10px] sm:text-xs text-amber-300 font-medium">
                        {t('cart.freeGiftUnlocked', { name: freeGiftName })}
                      </span>
                    )}
                  </div>
                </div>
                <div className="h-1 sm:h-1.5 bg-[rgba(244,246,250,0.08)] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-amber-400 to-amber-500 transition-all duration-500"
                    style={{ width: `${Math.min(100, (paidTotal / freeGiftThreshold) * 100)}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {/* Cart Items - Compact */}
        <div className="flex-1 overflow-y-auto">
          {paidItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center p-4 sm:p-6">
              <ShoppingBag className="w-10 h-10 sm:w-12 sm:h-12 text-[rgba(244,246,250,0.2)] mb-2 sm:mb-3" />
              <p className="text-[#A9B3C7] text-sm mb-0.5">{t('cart.empty')}</p>
              <p className="text-[10px] sm:text-xs text-[rgba(169,179,199,0.6)]">
                {t('cart.emptyHint')}
              </p>
            </div>
          ) : (
            <div className="p-2 sm:p-3 space-y-1.5 sm:space-y-2">
              {freeItems.map((item) => (
                <div
                  key={`free-${item.productId}-${item.dosage}`}
                  className="flex gap-2 sm:gap-3 p-2 sm:p-2.5 rounded-lg border bg-amber-500/10 border-amber-500/25"
                >
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-10 h-10 sm:w-12 sm:h-12 object-contain rounded bg-[rgba(7,10,18,0.5)] flex-shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <h3 className="font-medium text-[#F4F6FA] text-xs sm:text-sm truncate">{item.name}</h3>
                      <span className="px-1 py-0.5 rounded bg-amber-500/20 text-amber-300 text-[8px] font-bold uppercase">
                        {t('cart.free')}
                      </span>
                    </div>
                    <p className="text-[9px] sm:text-[10px] text-[#A9B3C7]">{item.dosage}</p>
                  </div>
                  <span className="text-xs text-amber-300 font-medium">{t('cart.free')}</span>
                </div>
              ))}
              {paidItems.map((item) => (
                <div
                  key={`${item.productId}-${item.dosage}`}
                  className="flex gap-2 sm:gap-3 p-2 sm:p-2.5 rounded-lg border bg-[rgba(17,24,39,0.6)] border-[rgba(244,246,250,0.08)]"
                >
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-10 h-10 sm:w-12 sm:h-12 object-contain rounded bg-[rgba(7,10,18,0.5)] flex-shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1">
                      <h3 className="font-medium text-[#F4F6FA] text-xs sm:text-sm truncate">{item.name}</h3>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <p className="text-[9px] sm:text-[10px] text-[#A9B3C7]">{item.dosage}</p>
                      {(() => {
                        if (item.quantity <= 1) return null;
                        const list = item.originalPrice ?? item.basePrice ?? 0;
                        const pct = getListPriceDiscountPercent(list, item.price);
                        if (pct <= 0) return null;
                        return (
                          <span className="px-1 py-0.5 rounded bg-[rgba(34,197,94,0.15)] text-[#22C55E] text-[7px] sm:text-[8px] font-bold">
                            {pct}% {t('common.off')}
                          </span>
                        );
                      })()}
                    </div>
                    <div className="flex items-center justify-between mt-1">
                      <div className="flex items-center gap-1 sm:gap-1.5">
                        <button
                          onClick={() =>
                            updateQuantity(item.productId, item.dosage, item.quantity - 1)
                          }
                          className="w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-[rgba(244,246,250,0.08)] flex items-center justify-center hover:bg-[rgba(244,246,250,0.15)] transition-colors"
                        >
                          <Minus className="w-2 h-2 sm:w-2.5 sm:h-2.5 text-[#F4F6FA]" />
                        </button>
                        <span className="text-[10px] sm:text-xs font-medium text-[#F4F6FA] w-3 sm:w-4 text-center">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() =>
                            updateQuantity(item.productId, item.dosage, item.quantity + 1)
                          }
                          className="w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-[rgba(244,246,250,0.08)] flex items-center justify-center hover:bg-[rgba(244,246,250,0.15)] transition-colors"
                        >
                          <Plus className="w-2 h-2 sm:w-2.5 sm:h-2.5 text-[#F4F6FA]" />
                        </button>
                      </div>
                      <span className="text-[10px] sm:text-xs font-medium text-[#2ED1B4]">
                        {format(item.price * item.quantity)}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => removeItem(item.productId, item.dosage)}
                    className="p-0.5 sm:p-1 h-fit rounded-full hover:bg-[rgba(244,246,250,0.08)] transition-colors flex-shrink-0"
                  >
                    <X className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-[#A9B3C7]" />
                  </button>
                </div>
              ))}

              {/* Suggested: all Essentials category products from Supabase (one query) */}
              {paidItems.length > 0 && suggestedToShow.length > 0 && (
                <div className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-[rgba(244,246,250,0.08)]">
                  <p className="text-[10px] sm:text-xs text-[#A9B3C7] mb-2">{t('cart.youMightNeed')}</p>
                  <div className="space-y-1.5 sm:space-y-2">
                    {suggestedToShow.map((s) => (
                      <div
                        key={s.productId}
                        className="flex items-center gap-2 sm:gap-3 p-2 sm:p-2.5 rounded-lg bg-[rgba(17,24,39,0.6)] border border-[rgba(244,246,250,0.08)]"
                      >
                        <img
                          src={s.image}
                          alt={s.name}
                          className="w-8 h-8 sm:w-10 sm:h-10 object-contain rounded bg-[rgba(7,10,18,0.5)]"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs sm:text-sm font-medium text-[#F4F6FA] truncate">{s.name}</p>
                          <p className="text-[9px] sm:text-[10px] text-[#A9B3C7] truncate">{s.dosage}</p>
                        </div>
                        <div className="flex items-center gap-2 sm:gap-3">
                          <div className="flex flex-col items-end leading-tight">
                            {s.discountEnabled && s.savings > 0 ? (
                              <span className="text-[9px] sm:text-[10px] text-[#A9B3C7] line-through">
                                {format(s.originalPrice)}
                              </span>
                            ) : null}
                            <span className="text-xs sm:text-sm font-medium text-[#2ED1B4]">
                              {format(s.unitPrice)}
                            </span>
                            {s.discountEnabled && s.savings > 0 ? (
                              <span className="text-[9px] sm:text-[10px] text-[#22C55E] font-medium">
                                {t('cart.savePercent', { percent: s.discountPercentage, amount: format(s.savings) })}
                              </span>
                            ) : null}
                          </div>
                          <button
                            type="button"
                            onClick={() => handleAddSuggested(s)}
                            disabled={!s.inStock}
                            className={`w-5 h-5 sm:w-6 sm:h-6 rounded-full flex items-center justify-center transition-colors ${
                              s.inStock
                                ? 'bg-[#2ED1B4] hover:bg-[#25b89d]'
                                : 'bg-[rgba(169,179,199,0.3)] cursor-not-allowed'
                            }`}
                          >
                            <Plus className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-[#070A12]" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer - Compact */}
        {paidItems.length > 0 && (
          <div className="p-3 sm:p-4 border-t border-[rgba(244,246,250,0.08)] space-y-2 sm:space-y-3">
            {/* Savings Banner */}
            {totalSavings > 0 && (
              <div className="p-1.5 sm:p-2 rounded-lg bg-[rgba(34,197,94,0.1)] border border-[rgba(34,197,94,0.2)] flex items-center gap-1.5 sm:gap-2">
                <Tag className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-[#22C55E]" />
                <span className="text-[10px] sm:text-xs text-[#22C55E] font-medium">
                  {t('cart.saving')} <span className="font-bold">{format(totalSavings)}</span>
                </span>
              </div>
            )}
            
            {/* Points Summary */}
            <div className="p-1.5 sm:p-2 rounded-lg bg-[rgba(139,92,246,0.1)] border border-[rgba(139,92,246,0.2)]">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1 sm:gap-1.5">
                  <Award className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-[#8B5CF6]" />
                  <span className="text-[10px] sm:text-xs text-[#A9B3C7]">Points to earn</span>
                </div>
                <span className="text-[10px] sm:text-xs font-bold text-[#8B5CF6]">{t('cart.earnPoints', { points: pointsToEarn })}</span>
              </div>
            </div>
            
            <div className="flex items-center justify-between pt-1">
              <span className="text-xs sm:text-sm text-[#A9B3C7]">{t('cart.subtotal')}</span>
              <span className="text-base sm:text-lg font-semibold text-[#F4F6FA]">
                {format(paidTotal)}
              </span>
            </div>
            <a 
              href="/checkout"
              onClick={() => setIsCartOpen(false)}
              className="w-full py-2 sm:py-2.5 rounded-full bg-[#2ED1B4] text-[#070A12] font-medium text-xs sm:text-sm flex items-center justify-center gap-2 hover:bg-[#25b89d] transition-colors"
            >
              <span>{t('cart.checkout')}</span>
              <span className="opacity-80">{format(paidTotal)}</span>
            </a>
            <p className="text-[9px] sm:text-[10px] text-center text-[rgba(169,179,199,0.6)]">
              Shipping & taxes calculated at checkout
            </p>
          </div>
        )}
      </div>
    </>
  );
}
