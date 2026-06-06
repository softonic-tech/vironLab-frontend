import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Elements, PaymentElement, useElements, useStripe } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { 
  ArrowLeft, 
  Truck, 
  MapPin,
  Check,
  ShoppingBag,
  Building2,
  Copy,
  CheckCircle2,
  Loader2,
  AlertCircle,
  X,
  Lock,
  Tag,
} from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { useAffiliate } from '@/context/AffiliateContext';
import { supabase, getCurrentUser } from '@/lib/supabase';
import { CONFIG } from '@/lib/config';
import { getSiteSetting, DEFAULT_BANK_DETAILS, type BankDetails } from '@/lib/settings';
import { recordAffiliateOrder } from '@/lib/affiliates';
import { sendOrderConfirmation } from '@/lib/email';
import { generateOrderNumberForCheckout } from '@/lib/orderNumber';
import { copyTextToClipboard } from '@/lib/clipboard';
import { formatOrderNumberDisplay } from '@/utils/order-number';
import {
  createStripePaymentIntent,
  type CreateStripeSessionRequest,
} from '@/lib/stripe';
import { useCurrency } from '@/context/CurrencyContext';

interface ShippingMethod {
  id: string;
  name: string;
  description: string;
  price: number;
  estimatedDays: string;
}

const shippingMethods: ShippingMethod[] = [
  { id: 'standard', name: 'Standard Shipping', description: 'Reliable tracked delivery', price: 149, estimatedDays: '5-8 business days' }
];

const countryRegionOptions = [
  'United Kingdom',
  'Ireland',
  'United States',
  'Canada',
  'Australia',
  'New Zealand',
  'Afghanistan',
  'Albania',
  'Algeria',
  'Andorra',
  'Angola',
  'Antigua and Barbuda',
  'Argentina',
  'Armenia',
  'Austria',
  'Azerbaijan',
  'Bahamas',
  'Bahrain',
  'Bangladesh',
  'Barbados',
  'Belarus',
  'Belgium',
  'Belize',
  'Benin',
  'Bhutan',
  'Bolivia',
  'Bosnia and Herzegovina',
  'Botswana',
  'Brazil',
  'Brunei',
  'Bulgaria',
  'Burkina Faso',
  'Burundi',
  'Cambodia',
  'Cameroon',
  'Cape Verde',
  'Central African Republic',
  'Chad',
  'Chile',
  'China',
  'Colombia',
  'Comoros',
  'Congo',
  'Costa Rica',
  'Croatia',
  'Cuba',
  'Cyprus',
  'Czech Republic',
  'Denmark',
  'Djibouti',
  'Dominica',
  'Dominican Republic',
  'Ecuador',
  'Egypt',
  'El Salvador',
  'Estonia',
  'Ethiopia',
  'Fiji',
  'Finland',
  'France',
  'Georgia',
  'Germany',
  'Ghana',
  'Greece',
  'Grenada',
  'Guatemala',
  'Guinea',
  'Guyana',
  'Haiti',
  'Honduras',
  'Hong Kong',
  'Hungary',
  'Iceland',
  'India',
  'Indonesia',
  'Iran',
  'Iraq',
  'Israel',
  'Italy',
  'Jamaica',
  'Japan',
  'Jordan',
  'Kazakhstan',
  'Kenya',
  'Kuwait',
  'Latvia',
  'Lebanon',
  'Lithuania',
  'Luxembourg',
  'Malaysia',
  'Maldives',
  'Malta',
  'Mexico',
  'Monaco',
  'Morocco',
  'Nepal',
  'Netherlands',
  'Nigeria',
  'Norway',
  'Pakistan',
  'Panama',
  'Peru',
  'Philippines',
  'Poland',
  'Portugal',
  'Qatar',
  'Romania',
  'Saudi Arabia',
  'Serbia',
  'Singapore',
  'Slovakia',
  'Slovenia',
  'South Africa',
  'South Korea',
  'Spain',
  'Sri Lanka',
  'Sweden',
  'Switzerland',
  'Taiwan',
  'Thailand',
  'Tunisia',
  'Turkey',
  'Ukraine',
  'United Arab Emirates',
  'Uruguay',
  'Vietnam',
].sort((a, b) => a.localeCompare(b));

function formatShippingForEmail(
  a: { firstName: string; lastName: string; address: string; apartment: string; suburb: string; state: string; postcode: string; phone: string }
): string {
  const name = [a.firstName, a.lastName].filter(Boolean).join(' ').trim();
  const line3 = [a.suburb, a.state, a.postcode].filter(Boolean).join(' ').trim();
  return [name, a.address, a.apartment, line3, a.phone].filter(Boolean).join(', ');
}

const stripePromise = CONFIG.STRIPE_PUBLISHABLE_KEY
  ? loadStripe(CONFIG.STRIPE_PUBLISHABLE_KEY)
  : null;

function StripeElementsInline({
  amountLabel,
  onSuccess,
}: {
  amountLabel: string;
  onSuccess: () => Promise<void>;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [elementReady, setElementReady] = useState(false);

  const handlePay = async () => {
    if (!stripe || !elements || !elementReady) return;
    setPaying(true);
    setError(null);
    try {
      const { error: submitErr } = await elements.submit();
      if (submitErr) {
        setError(submitErr.message || 'Card form is still loading. Please try again.');
        return;
      }
      const { error: confirmErr } = await stripe.confirmPayment({
        elements,
        redirect: 'if_required',
      });
      if (confirmErr) {
        setError(confirmErr.message || 'Payment failed. Please try again.');
        return;
      }
      await onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Payment failed. Please try again.');
    } finally {
      setPaying(false);
    }
  };

  return (
    <div className="p-3 rounded-xl bg-white/5 border border-white/10 space-y-3">
      <h3 className="text-xs font-semibold text-white">Card details</h3>
      <PaymentElement
        onReady={() => setElementReady(true)}
      />
      {error && (
        <p className="text-[11px] text-red-400">{error}</p>
      )}
      <button
        type="button"
        onClick={handlePay}
        disabled={!stripe || !elements || !elementReady || paying}
        className="w-full py-3 rounded-xl bg-gradient-to-r from-[#2ED1B4] to-[#8B5CF6] text-white font-semibold text-sm disabled:opacity-50"
      >
        {paying ? 'Processing payment…' : `Pay now — ${amountLabel}`}
      </button>
    </div>
  );
}

export default function Checkout() {
  const [searchParams] = useSearchParams();
  const { items, paidItemsTotal, clearCart } = useCart();
  const { appliedCode, appliedPromotion, applyCode, clearCode } = useAffiliate();
  const [userId, setUserId] = useState<string | null>(null);

  // Affiliate code input state
  const [affiliateInput, setAffiliateInput] = useState('');
  const [affiliateLoading, setAffiliateLoading] = useState(false);
  const [affiliateError, setAffiliateError] = useState<string | null>(null);

  const [contactEmail, setContactEmail] = useState('');
  const [shippingAddress, setShippingAddress] = useState({
    firstName: '',
    lastName: '',
    address: '',
    apartment: '',
    suburb: '',
    state: '',
    postcode: '',
    phone: ''
  });
  const [selectedShipping, setSelectedShipping] = useState<string>('standard');
  const [agreedToTerms, setAgreedToTerms] = useState(true);
  const [ageVerified, setAgeVerified] = useState(false);

  // Points/rewards are disabled; keep order payload fields stable at zero.
  const pointsDiscount = 0;
  const redeemPointsAmount = 0;

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderComplete, setOrderComplete] = useState(false);
  const [orderNumber, setOrderNumber] = useState('');
  const [orderTotal, setOrderTotal] = useState(0);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  /** Shown on success screen if Resend failed (order still saved). */
  const [orderEmailNotice, setOrderEmailNotice] = useState<string | null>(null);
  const [copyNotice, setCopyNotice] = useState<string | null>(null);

  const [bankDetails, setBankDetails] = useState<BankDetails>(DEFAULT_BANK_DETAILS);
  const { currency: selectedCurrency, symbol: ccySymbol, convert: toSelectedCurrency } = useCurrency();
  const [elementsClientSecret, setElementsClientSecret] = useState<string | null>(null);

  // Get current user on mount
  useEffect(() => {
    const getUser = async () => {
      const user = await getCurrentUser();
      if (user) {
        setUserId(user.id);
        if (user.email) setContactEmail(user.email);
      }
    };
    getUser();
  }, []);

  // Load admin-editable bank details for the order confirmation page.
  useEffect(() => {
    let cancelled = false;
    const loadBankDetails = async () => {
      try {
        const data = await getSiteSetting<BankDetails>('bank_details', DEFAULT_BANK_DETAILS);
        if (!cancelled) setBankDetails(data);
      } catch (e) {
        // Keep fallback defaults if DB is unavailable.
        console.error('Failed to load bank_details:', e);
      }
    };
    loadBankDetails();
    return () => {
      cancelled = true;
    };
  }, []);

  // Auto-apply affiliate code from URL/sessionStorage
  useEffect(() => {
    if (appliedCode) return;
    try {
      const saved = sessionStorage.getItem('vironlabs_affiliate_code');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.autoApply && parsed.code && !appliedCode) {
          applyCode(parsed.code);
        }
      }
    } catch (_) {}
  }, []);

  const affiliateDiscountPercent = appliedPromotion?.valid ? (appliedPromotion.discount_percent ?? 10) : 0;
  const affiliateDiscountAmount = appliedPromotion?.valid
    ? Math.round(paidItemsTotal * affiliateDiscountPercent) / 100
    : 0;

  const handleApplyAffiliate = async () => {
    if (!affiliateInput.trim()) return;
    setAffiliateLoading(true);
    setAffiliateError(null);

    // Fraud check: self-referral
    if (contactEmail && appliedPromotion?.promoter_id) {
      // Already applied — skip
    }

    const result = await applyCode(affiliateInput.trim());
    if (!result.valid) {
      setAffiliateError(result.error || 'Invalid code');
    } else {
      setAffiliateInput('');
    }
    setAffiliateLoading(false);
  };

  const shippingCost = shippingMethods.find(m => m.id === selectedShipping)?.price || 149;
  const finalTotal = paidItemsTotal + shippingCost - pointsDiscount - affiliateDiscountAmount;

  // Legacy: Stripe or bookmarks pointed at `/checkout?order=…` or `?cancelled=1` (success/cancel use dedicated routes now).
  useEffect(() => {
    if (window.location.pathname !== '/checkout') return;
    const fromHash = window.location.hash.includes('?')
      ? new URLSearchParams(window.location.hash.split('?')[1] || '')
      : null;
    const orderParam =
      searchParams.get('order') ??
      fromHash?.get('order') ??
      new URLSearchParams(window.location.search.slice(1)).get('order');
    const cancelled =
      searchParams.get('cancelled') === '1' ||
      searchParams.get('cancelled') === 'true' ||
      fromHash?.get('cancelled') === '1' ||
      fromHash?.get('cancelled') === 'true';
    if (orderParam && !cancelled) {
      try {
        setOrderNumber(decodeURIComponent(orderParam));
      } catch {
        setOrderNumber(orderParam);
      }
      setOrderComplete(true);
      try {
        clearCart();
      } catch (err) {
        console.error('clearCart after Stripe redirect failed:', err);
      }
    }
    if (cancelled) {
      setSubmitError('Payment was cancelled. Your cart is still here — try again when you\'re ready.');
    }
    // Run once on mount — we explicitly don't want this rerunning when clearCart's
    // identity changes mid-session.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitError(null);
    setOrderEmailNotice(null);

    const finalOrderTotal = paidItemsTotal + shippingCost - pointsDiscount - affiliateDiscountAmount;
    const shippingCombined = `${shippingAddress.address}${shippingAddress.apartment ? ', ' + shippingAddress.apartment : ''}`;

    try {
      if (CONFIG.PAYMENT_PROVIDER === 'stripe') {
        // === Stripe Elements path ==============================================
        // One call creates pending order + PaymentIntent and returns client secret.
        const stripePayload: CreateStripeSessionRequest = {
          customer_email: contactEmail.trim(),
          customer_first_name: shippingAddress.firstName,
          customer_last_name: shippingAddress.lastName,
          customer_phone: shippingAddress.phone,
          shipping_address: shippingCombined,
          shipping_suburb: shippingAddress.suburb,
          shipping_state: shippingAddress.state,
          shipping_postcode: shippingAddress.postcode,
          shipping_method: selectedShipping,
          shipping_cost: shippingCost,
          subtotal: paidItemsTotal,
          discount_amount: pointsDiscount + affiliateDiscountAmount,
          points_redeemed: redeemPointsAmount,
          total: finalOrderTotal,
          currency: selectedCurrency,
          age_verified: ageVerified,
          affiliate_code: appliedCode && appliedPromotion?.valid ? appliedCode : null,
          user_id: userId,
          items: items.map((item) => ({
            product_id: item.productId,
            name: item.name,
            dosage: typeof item.dosage === 'number' ? `${item.dosage}mg` : String(item.dosage),
            price: item.price,
            quantity: item.quantity,
            is_free: item.isFree,
          })),
        };
        const intent = await createStripePaymentIntent(stripePayload);
        setElementsClientSecret(intent.client_secret);
        setOrderNumber(intent.order_number);
        setOrderTotal(toSelectedCurrency(finalOrderTotal));
        return;
      }

      // === Bank-transfer fallback (legacy) ===================================
      const newOrderNumber = await generateOrderNumberForCheckout();
      setOrderNumber(newOrderNumber);
      setOrderTotal(finalOrderTotal);
      const shippingForEmail = formatShippingForEmail(shippingAddress);

      const orderPayload: Record<string, unknown> = {
        order_number: newOrderNumber,
        user_id: userId,
        customer_email: contactEmail,
        customer_first_name: shippingAddress.firstName,
        customer_last_name: shippingAddress.lastName,
        customer_phone: shippingAddress.phone,
        shipping_address: shippingCombined,
        shipping_suburb: shippingAddress.suburb,
        shipping_state: shippingAddress.state,
        shipping_postcode: shippingAddress.postcode,
        shipping_method: selectedShipping,
        subtotal: paidItemsTotal,
        shipping_cost: shippingCost,
        discount_amount: pointsDiscount + affiliateDiscountAmount,
        points_redeemed: redeemPointsAmount,
        total: finalOrderTotal,
        age_verified: ageVerified,
        status: 'pending_payment',
        payment_status: 'pending',
        payment_method: 'bank_transfer',
        items: items.map(item => ({
          product_id: item.productId,
          name: item.name,
          dosage: item.dosage,
          quantity: item.quantity,
          price: item.price,
          is_free: item.isFree,
        })),
      };

      if (appliedCode && appliedPromotion?.valid) {
        orderPayload.affiliate_code = appliedCode;
        orderPayload.affiliate_discount = affiliateDiscountAmount;
      }

      const { error } = await supabase.from('orders').insert(orderPayload);

      if (error) {
        console.error('Order save error:', error);
        const fallbackOrder = { ...orderPayload, created_at: new Date().toISOString() };
        const orders = JSON.parse(localStorage.getItem('vironlabs_orders') || '[]');
        orders.push(fallbackOrder);
        localStorage.setItem('vironlabs_orders', JSON.stringify(orders));
      }

      if (!error && appliedCode && appliedPromotion?.valid && appliedPromotion.promoter_id) {
        try {
          const { data: orderId, error: idErr } = await supabase.rpc('get_order_id_by_number', {
            p_order_number: newOrderNumber,
            p_email: contactEmail,
          });
          if (!idErr && orderId) {
            await recordAffiliateOrder({
              promoter_id: appliedPromotion.promoter_id,
              order_id: orderId as string,
              order_number: newOrderNumber,
              customer_email: contactEmail,
              order_total: finalOrderTotal,
              customer_discount: affiliateDiscountAmount,
            }).catch((e) => console.error('Affiliate tracking error:', e));
            clearCode();
          } else if (idErr) {
            console.error('Could not resolve order id for affiliate tracking:', idErr);
          }
        } catch (e) {
          console.error('Affiliate id-resolution error:', e);
        }
      }

      if (contactEmail.trim()) {
        const itemsForEmail = items
          .filter((item) => !item.isFree)
          .map((item) => ({
            name: item.name,
            dosage: item.dosage,
            quantity: item.quantity,
            price: item.price,
          }));
        const emailResult = await sendOrderConfirmation(contactEmail.trim(), {
          order_number: newOrderNumber,
          total: finalOrderTotal,
          items: itemsForEmail,
          shipping_address: shippingForEmail,
        });
        if (!emailResult.ok) {
          setOrderEmailNotice(
            emailResult.error
              ? `We could not send the confirmation email: ${emailResult.error}. Your order is still valid — save your order number and payment details below.`
              : 'We could not send the confirmation email. Check spam, or save your order number below.'
          );
        }
      }

      clearCart();
      setOrderComplete(true);
    } catch (err) {
      console.error('Order submission error:', err);
      const msg = err instanceof Error ? err.message : 'Failed to create order. Please try again.';
      setSubmitError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const copyToClipboard = async (text: string, field: string) => {
    setCopyNotice(null);
    const ok = await copyTextToClipboard(text);
    if (ok) {
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
    } else {
      setCopyNotice('Could not copy automatically. Select the text and copy it manually.');
      setTimeout(() => setCopyNotice(null), 5000);
    }
  };

  // ORDER CONFIRMATION PAGE
  if (orderComplete) {
    return (
      <div className="min-h-screen bg-[#070A12]">
        <nav className="px-4 py-4 border-b border-white/10">
          <a href="/" className="inline-flex items-center">
            <img
              src="/logo.png"
              alt="Viron Labs"
              className="h-8 w-auto object-contain select-none"
              draggable={false}
            />
          </a>
        </nav>

        <main className="px-4 py-6 max-w-md mx-auto">
          {/* Success */}
          <div className="text-center mb-6">
            <div className="w-16 h-16 rounded-full bg-green-500/10 border border-green-500/30 flex items-center justify-center mx-auto mb-3">
              <CheckCircle2 className="w-8 h-8 text-green-500" />
            </div>
            <h1 className="text-xl font-bold text-white mb-1">Order Confirmed!</h1>
            <p className="text-sm text-gray-400">Thanks, {shippingAddress.firstName}</p>
          </div>

          {orderEmailNotice && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/35 mb-4 text-left">
              <p className="text-xs text-rose-200 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{orderEmailNotice}</span>
              </p>
            </div>
          )}

          {CONFIG.PAYMENT_PROVIDER === 'stripe' ? (
            <>
              <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 mb-4">
                <h2 className="text-lg font-bold text-emerald-400 text-center mb-1">PAYMENT RECEIVED</h2>
                <p className="text-xs text-emerald-300/80 text-center">A confirmation email is on its way — we dispatch within 24 hours.</p>
              </div>
              <div className="p-4 rounded-xl bg-white/5 border border-white/10 mb-4">
                <div className="flex justify-between mb-2">
                  <span className="text-sm text-gray-400">Order #</span>
                  <span className="text-sm font-mono text-white">{formatOrderNumberDisplay(orderNumber)}</span>
                </div>
                {orderTotal > 0 && (
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-400">Paid</span>
                    <span className="text-lg font-bold text-[#2ED1B4]">{ccySymbol}{orderTotal.toFixed(2)}</span>
                  </div>
                )}
              </div>
            </>
          ) : (
          <>
          {/* MAKE PAYMENT Reminder */}
          <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 mb-4">
            <h2 className="text-lg font-bold text-amber-500 text-center mb-1">MAKE PAYMENT</h2>
            <p className="text-xs text-amber-400 text-center">Complete your order by making a bank transfer</p>
          </div>

          {/* Order Details */}
          <div className="p-4 rounded-xl bg-white/5 border border-white/10 mb-4">
            <div className="flex justify-between mb-2">
              <span className="text-sm text-gray-400">Order #</span>
              <span className="text-sm font-mono text-white">{formatOrderNumberDisplay(orderNumber)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-400">Amount to Pay</span>
              <span className="text-lg font-bold text-[#2ED1B4]">{ccySymbol}{toSelectedCurrency(orderTotal).toFixed(2)}</span>
            </div>
          </div>

          {/* Bank Details */}
          <div className="p-4 rounded-xl bg-gradient-to-br from-[#2ED1B4]/10 to-[#8B5CF6]/10 border border-[#2ED1B4]/20 mb-4">
            <div className="flex items-center gap-2 mb-3">
              <Building2 className="w-5 h-5 text-[#2ED1B4]" />
              <span className="font-semibold text-white">Bank Transfer</span>
            </div>

            {copyNotice && (
              <p className="mb-2 text-xs text-amber-200/95 bg-amber-500/15 border border-amber-500/25 rounded-lg px-3 py-2">
                {copyNotice}
              </p>
            )}

            <div className="space-y-2">
              {/* Sort Code & Account Number (UK Faster Payments) */}
              <div className="grid grid-cols-2 gap-2">
                <div className="p-3 rounded-lg bg-black/30 border border-white/10">
                  <div className="flex justify-between items-start gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="text-xs text-gray-400">Sort Code</p>
                      <p className="text-sm font-mono text-white break-all">{bankDetails.sort_code}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => void copyToClipboard(bankDetails.sort_code, 'sort_code')}
                      className="p-2 rounded bg-white/10 shrink-0"
                      aria-label="Copy sort code"
                    >
                      {copiedField === 'sort_code' ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4 text-gray-400" />}
                    </button>
                  </div>
                </div>
                <div className="p-3 rounded-lg bg-black/30 border border-white/10">
                  <div className="flex justify-between items-start gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="text-xs text-gray-400">Account</p>
                      <p className="text-sm font-mono text-white break-all">{bankDetails.account_number}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => void copyToClipboard(bankDetails.account_number, 'account')}
                      className="p-2 rounded bg-white/10 shrink-0"
                      aria-label="Copy account number"
                    >
                      {copiedField === 'account' ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4 text-gray-400" />}
                    </button>
                  </div>
                </div>
              </div>

              {/* Account Name */}
              <div className="p-3 rounded-lg bg-black/30 border border-white/10">
                <div className="flex justify-between items-center gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="text-xs text-gray-400">Account Name</p>
                    <p className="text-sm text-white">{bankDetails.account_name}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => void copyToClipboard(bankDetails.account_name, 'account_name')}
                    className="p-2 rounded bg-white/10 shrink-0"
                    aria-label="Copy account name"
                  >
                    {copiedField === 'account_name' ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4 text-gray-400" />}
                  </button>
                </div>
              </div>

              {/* Reference */}
              <div className="p-3 rounded-lg bg-amber-500/15 border border-amber-500/30">
                <p className="text-xs text-amber-500 font-bold">Reference (REQUIRED)</p>
                <div className="flex justify-between items-center">
                  <p className="text-sm font-mono text-white font-bold">{formatOrderNumberDisplay(orderNumber)}</p>
                  <button
                    type="button"
                    onClick={() => void copyToClipboard(formatOrderNumberDisplay(orderNumber), 'ref')}
                    className="p-1"
                    aria-label="Copy payment reference"
                  >
                    {copiedField === 'ref' ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4 text-amber-500" />}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Instructions */}
          <div className="p-4 rounded-xl bg-white/5 border border-white/10 mb-4">
            <p className="text-xs text-gray-400 mb-2">How to pay:</p>
            <ol className="text-sm text-white space-y-1">
              <li>1. Transfer <span className="text-[#2ED1B4] font-bold">{ccySymbol}{toSelectedCurrency(orderTotal).toFixed(2)}</span></li>
              <li>2. Use <span className="text-amber-500 font-mono">{formatOrderNumberDisplay(orderNumber)}</span> as reference</li>
              <li>3. We'll ship within 24 hours</li>
            </ol>
          </div>
          </>
          )}

          {/* Telegram Support */}
          <a 
            href={CONFIG.SOCIAL.TELEGRAM}
            target="_blank" 
            rel="noopener noreferrer"
            className="w-full py-3 rounded-xl bg-[#0088cc] text-white font-semibold text-center flex items-center justify-center gap-2 mb-3"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
            </svg>
            Support on Telegram
          </a>

          <a href="/" className="w-full py-3 rounded-xl bg-gradient-to-r from-[#2ED1B4] to-[#8B5CF6] text-white font-semibold text-center block">
            Continue Shopping
          </a>

          {/* Research Disclaimer */}
          <p className="mt-4 text-[10px] text-gray-500 text-center">
            For research use only. Not for human consumption.
          </p>
        </main>
      </div>
    );
  }

  // Empty cart
  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-[#070A12] flex items-center justify-center">
        <div className="text-center px-4">
          <ShoppingBag className="w-16 h-16 mx-auto text-white/20 mb-4" />
          <h1 className="text-xl font-bold text-white mb-2">Your cart is empty</h1>
          <a href="/" className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-[#2ED1B4] to-[#8B5CF6] text-white font-semibold">
            <ArrowLeft className="w-4 h-4" />
            Continue Shopping
          </a>
        </div>
      </div>
    );
  }

  // CHECKOUT FORM
  return (
    <div className="min-h-screen bg-[#070A12]">
      {/* Header */}
      <nav className="px-4 py-4 border-b border-white/10 flex items-center justify-between">
        <a href="/" className="inline-flex items-center">
          <img
            src="/logo.png"
            alt="Viron Labs"
            className="h-8 w-auto object-contain select-none"
            draggable={false}
          />
        </a>
        <a href="/" className="text-sm text-gray-400 flex items-center gap-1">
          <ArrowLeft className="w-4 h-4" />
          Back
        </a>
      </nav>

      <main className="px-4 py-3 max-w-lg mx-auto">
        {/* Title */}
        <h1 className="text-lg font-bold text-white mb-3">Complete Your Order</h1>

        {submitError && (
          <div className="mb-3 p-2.5 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
            <p className="text-xs text-red-400">{submitError}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3">
          {/* Order Summary */}
          <div className="p-3 rounded-xl bg-white/5 border border-white/10">
            <h2 className="text-xs font-semibold text-white mb-2 flex items-center gap-2">
              <ShoppingBag className="w-3.5 h-3.5 text-[#2ED1B4]" />
              Order ({items.length} items)
            </h2>
            <div className="space-y-1.5 mb-2">
              {items.map((item) => (
                <div key={`${item.productId}-${item.dosage}`} className="flex items-center gap-2">
                  <img src={item.image} alt={item.name} className="w-10 h-10 object-contain rounded bg-black/30" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-white truncate">{item.name}</p>
                    <p className="text-[10px] text-gray-400">{item.dosage} x{item.quantity}</p>
                  </div>
                  <span className="text-xs text-[#2ED1B4]">{item.isFree ? 'FREE' : `${ccySymbol}${toSelectedCurrency(item.price * item.quantity).toFixed(2)}`}</span>
                </div>
              ))}
            </div>
            <div className="border-t border-white/10 pt-2 space-y-0.5">
              <div className="flex justify-between text-xs">
                <span className="text-gray-400">Subtotal</span>
                <span className="text-white">{ccySymbol}{toSelectedCurrency(paidItemsTotal).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-gray-400">Shipping</span>
                <span className="text-white">
                  {`${ccySymbol}${toSelectedCurrency(shippingCost).toFixed(2)}`}
                </span>
              </div>
              {affiliateDiscountAmount > 0 && (
                <div className="flex justify-between text-xs">
                  <span className="flex items-center gap-1 text-[#22C55E]">
                    <Tag className="w-3 h-3" />
                    Code {appliedCode} ({affiliateDiscountPercent}%)
                  </span>
                  <span className="text-[#22C55E] font-medium">−{ccySymbol}{toSelectedCurrency(affiliateDiscountAmount).toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between text-sm font-bold pt-1.5 border-t border-white/10">
                <span className="text-white">Total</span>
                <span className="text-[#2ED1B4]">{ccySymbol}{toSelectedCurrency(finalTotal).toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Contact */}
          <div className="p-3 rounded-xl bg-white/5 border border-white/10">
            <h2 className="text-xs font-semibold text-white mb-2">Contact</h2>
            <input 
              type="email" 
              value={contactEmail} 
              onChange={(e) => setContactEmail(e.target.value)} 
              required
              className="w-full px-3 py-2 rounded-lg bg-black/30 border border-white/10 text-white text-xs focus:border-[#2ED1B4] outline-none"
              placeholder="Email"
            />
          </div>

          {/* Delivery */}
          <div className="p-3 rounded-xl bg-white/5 border border-white/10">
            <h2 className="text-xs font-semibold text-white mb-2 flex items-center gap-2">
              <MapPin className="w-3.5 h-3.5 text-[#8B5CF6]" />
              Delivery
            </h2>
            <div className="space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <input 
                  type="text" 
                  value={shippingAddress.firstName} 
                  onChange={(e) => setShippingAddress({...shippingAddress, firstName: e.target.value})} 
                  required
                  className="w-full px-3 py-2 rounded-lg bg-black/30 border border-white/10 text-white text-xs focus:border-[#2ED1B4] outline-none"
                  placeholder="First name"
                />
                <input 
                  type="text" 
                  value={shippingAddress.lastName} 
                  onChange={(e) => setShippingAddress({...shippingAddress, lastName: e.target.value})} 
                  required
                  className="w-full px-3 py-2 rounded-lg bg-black/30 border border-white/10 text-white text-xs focus:border-[#2ED1B4] outline-none"
                  placeholder="Last name"
                />
              </div>
              <input 
                type="text" 
                value={shippingAddress.address} 
                onChange={(e) => setShippingAddress({...shippingAddress, address: e.target.value})} 
                required
                className="w-full px-3 py-2 rounded-lg bg-black/30 border border-white/10 text-white text-xs focus:border-[#2ED1B4] outline-none"
                placeholder="Street address"
              />
              <div className="grid grid-cols-2 gap-2">
                <input 
                  type="text" 
                  value={shippingAddress.suburb} 
                  onChange={(e) => setShippingAddress({...shippingAddress, suburb: e.target.value})} 
                  required
                  className="w-full px-3 py-2 rounded-lg bg-black/30 border border-white/10 text-white text-xs focus:border-[#2ED1B4] outline-none"
                  placeholder="Town / City"
                />
                <input 
                  type="text" 
                  value={shippingAddress.postcode} 
                  onChange={(e) => setShippingAddress({...shippingAddress, postcode: e.target.value})} 
                  required
                  className="w-full px-3 py-2 rounded-lg bg-black/30 border border-white/10 text-white text-xs focus:border-[#2ED1B4] outline-none"
                  placeholder="Postcode / ZIP"
                  autoComplete="postal-code"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <select
                  value={shippingAddress.state}
                  onChange={(e) => setShippingAddress({...shippingAddress, state: e.target.value})}
                  required
                  className="w-full px-3 py-2 rounded-lg bg-black/30 border border-white/10 text-white text-xs focus:border-[#2ED1B4] outline-none"
                  autoComplete="country-name"
                >
                  <option value="">Country / Region</option>
                  {countryRegionOptions.map((region) => (
                    <option key={region} value={region}>
                      {region}
                    </option>
                  ))}
                </select>
                <input 
                  type="tel" 
                  value={shippingAddress.phone} 
                  onChange={(e) => setShippingAddress({...shippingAddress, phone: e.target.value})} 
                  required
                  className="w-full px-3 py-2 rounded-lg bg-black/30 border border-white/10 text-white text-xs focus:border-[#2ED1B4] outline-none"
                  placeholder="Phone"
                />
              </div>
            </div>
          </div>

          {/* Shipping */}
          <div className="p-3 rounded-xl bg-white/5 border border-white/10">
            <h2 className="text-xs font-semibold text-white mb-2 flex items-center gap-2">
              <Truck className="w-3.5 h-3.5 text-blue-400" />
              Shipping
            </h2>
            <div className="space-y-1.5">
              {shippingMethods.map((method) => (
                <label 
                  key={method.id} 
                  className={`flex items-center gap-2 p-2 rounded-lg border cursor-pointer ${
                    selectedShipping === method.id ? 'border-[#2ED1B4] bg-[#2ED1B4]/5' : 'border-white/10'
                  }`}
                >
                  <input 
                    type="radio" 
                    name="shipping" 
                    value={method.id} 
                    checked={selectedShipping === method.id} 
                    onChange={() => setSelectedShipping(method.id)} 
                    className="w-3.5 h-3.5 accent-[#2ED1B4]"
                  />
                  <div className="flex-1">
                    <div className="flex justify-between">
                      <span className="text-xs text-white">{method.name}</span>
                      <span className="text-xs text-[#2ED1B4]">
                        {`${ccySymbol}${toSelectedCurrency(method.price).toFixed(2)}`}
                      </span>
                    </div>
                    <p className="text-[10px] text-gray-400">{method.estimatedDays}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* ── AFFILIATE / REFERRAL CODE ── */}
          <div className="p-3 rounded-xl bg-white/5 border border-white/10">
            <h2 className="text-xs font-semibold text-white mb-2 flex items-center gap-2">
              <Tag className="w-3.5 h-3.5 text-[#22C55E]" />
              Referral Code
            </h2>
            {appliedCode && appliedPromotion?.valid ? (
              <div className="flex items-center justify-between p-2.5 rounded-lg bg-green-500/10 border border-green-500/25">
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded-full bg-green-500/20 flex items-center justify-center">
                    <Check className="w-3 h-3 text-green-400" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-green-400">
                      {appliedCode} — {affiliateDiscountPercent}% off
                    </p>
                    <p className="text-[10px] text-green-500/70">
                      Saving {ccySymbol}{toSelectedCurrency(affiliateDiscountAmount).toFixed(2)}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={clearCode}
                  className="flex items-center gap-1 px-2 py-1 rounded-lg bg-red-500/15 border border-red-500/20 text-[10px] text-red-400 hover:bg-red-500/25 transition-colors"
                >
                  <X className="w-3 h-3" />
                  Remove
                </button>
              </div>
            ) : (
              <>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={affiliateInput}
                    onChange={(e) => { setAffiliateInput(e.target.value.toUpperCase()); setAffiliateError(null); }}
                    placeholder="Enter code (e.g. MIKE10)"
                    className="flex-1 px-3 py-2 rounded-lg bg-black/30 border border-white/10 text-white text-xs focus:border-[#22C55E] outline-none uppercase"
                  />
                  <button
                    type="button"
                    onClick={handleApplyAffiliate}
                    disabled={affiliateLoading || !affiliateInput.trim()}
                    className="px-4 py-2 rounded-lg bg-[#22C55E] text-[#070A12] text-xs font-semibold hover:bg-[#16A34A] disabled:opacity-50 transition-colors"
                  >
                    {affiliateLoading ? '...' : 'Apply'}
                  </button>
                </div>
                {affiliateError && (
                  <p className="mt-1.5 text-[10px] text-red-400">{affiliateError}</p>
                )}
              </>
            )}
          </div>

          {/* Payment Info */}
          <div className="p-3 rounded-xl bg-gradient-to-br from-[#2ED1B4]/10 to-[#8B5CF6]/10 border border-[#2ED1B4]/20">
            <div className="flex items-center gap-2 mb-1.5">
              {CONFIG.PAYMENT_PROVIDER === 'stripe' ? (
                <Lock className="w-3.5 h-3.5 text-[#2ED1B4]" />
              ) : (
                <Building2 className="w-3.5 h-3.5 text-[#2ED1B4]" />
              )}
              <span className="text-xs font-medium text-white">Payment Methods</span>
            </div>
            {CONFIG.PAYMENT_PROVIDER === 'stripe' ? (
              <ul className="text-[10px] text-gray-400 space-y-0.5">
                <li>• Secure card payment via Stripe (you'll be redirected)</li>
                <li>• We never see or store your card details</li>
                <li>• <a href={CONFIG.SOCIAL.TELEGRAM} target="_blank" rel="noopener noreferrer" className="text-[#2ED1B4] underline">Message us on Telegram</a> for any questions</li>
              </ul>
            ) : (
              <ul className="text-[10px] text-gray-400 space-y-0.5">
                <li>• Bank Transfer (details after order)</li>
                <li>• Cash on pickup</li>
                <li>• <a href={CONFIG.SOCIAL.TELEGRAM} target="_blank" rel="noopener noreferrer" className="text-[#2ED1B4] underline">Message us on Telegram</a> for more info</li>
              </ul>
            )}
          </div>

          {/* Age Verification */}
          <div className="p-3 rounded-xl bg-amber-500/5 border border-amber-500/20">
            <div className="flex items-start gap-2">
              <input 
                type="checkbox" 
                id="age" 
                checked={ageVerified} 
                onChange={(e) => setAgeVerified(e.target.checked)} 
                required
                className="w-3.5 h-3.5 mt-0.5 accent-amber-500"
              />
              <label htmlFor="age" className="text-[10px] text-gray-400">
                <span className="text-amber-500 font-medium">I confirm I am 18 years or older</span> and purchasing these products for lawful research purposes only.
              </label>
            </div>
          </div>

          {/* Terms */}
          <div className="flex items-start gap-2">
            <input 
              type="checkbox" 
              id="terms" 
              checked={agreedToTerms} 
              onChange={(e) => setAgreedToTerms(e.target.checked)} 
              required
              className="w-3.5 h-3.5 mt-0.5 accent-[#2ED1B4]"
            />
            <label htmlFor="terms" className="text-[10px] text-gray-400">
              I agree to the <a href="/terms" className="text-[#2ED1B4]">Terms</a> & <a href="/privacy" className="text-[#2ED1B4]">Privacy</a>
            </label>
          </div>

          {/* Submit */}
          {!(CONFIG.PAYMENT_PROVIDER === 'stripe' && elementsClientSecret) && (
            <button 
              type="submit" 
              disabled={!agreedToTerms || !ageVerified || isSubmitting}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-[#2ED1B4] to-[#8B5CF6] text-white font-semibold text-sm disabled:opacity-50"
            >
              {isSubmitting ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  {CONFIG.PAYMENT_PROVIDER === 'stripe' ? 'Preparing secure card form…' : 'Processing...'}
                </span>
              ) : (
                CONFIG.PAYMENT_PROVIDER === 'stripe'
                  ? `Continue to card details — ${ccySymbol}${toSelectedCurrency(finalTotal).toFixed(2)}`
                  : `Complete Order — ${ccySymbol}${toSelectedCurrency(finalTotal).toFixed(2)}`
              )}
            </button>
          )}

          {CONFIG.PAYMENT_PROVIDER === 'stripe' && elementsClientSecret && stripePromise && (
            <Elements
              stripe={stripePromise}
              options={{
                clientSecret: elementsClientSecret,
                appearance: {
                  theme: 'night',
                  variables: {
                    colorBackground: '#0A0A0A',
                    colorText: '#F5F5F5',
                    colorDanger: '#EF4444',
                    colorPrimary: '#2ED1B4',
                  },
                },
              }}
            >
              <StripeElementsInline
                amountLabel={`${ccySymbol}${toSelectedCurrency(finalTotal).toFixed(2)}`}
                onSuccess={async () => {
                  if (appliedCode && appliedPromotion?.valid) clearCode();
                  clearCart();
                  setOrderComplete(true);
                }}
              />
            </Elements>
          )}

          {/* Research Disclaimer */}
          <p className="text-[9px] text-gray-500 text-center">
            For research use only. Not for human consumption.
          </p>
        </form>
      </main>
    </div>
  );
}
