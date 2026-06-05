import { useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { CheckCircle2 } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { CONFIG } from '@/lib/config';
import { formatOrderNumberDisplay } from '@/utils/order-number';

/**
 * Shown after Stripe redirects to `/checkout/success?order=…` (and optional `session_id`).
 * Not the full checkout form — only confirmation + next steps.
 */
export default function CheckoutSuccess() {
  const [searchParams] = useSearchParams();
  const { clearCart } = useCart();

  const orderRaw = searchParams.get('order');
  const sessionId = searchParams.get('session_id');
  let displayOrder = '';
  if (orderRaw) {
    try {
      displayOrder = formatOrderNumberDisplay(decodeURIComponent(orderRaw));
    } catch {
      displayOrder = formatOrderNumberDisplay(orderRaw);
    }
  }

  useEffect(() => {
    document.title = 'Order confirmed | Viron Labs';
    try {
      clearCart();
    } catch (err) {
      console.error('clearCart after checkout success:', err);
    }
  }, [clearCart]);

  const isStripe = CONFIG.PAYMENT_PROVIDER === 'stripe';

  return (
    <div className="min-h-screen bg-[#070A12]">
      <nav className="px-4 py-4 border-b border-white/10">
        <Link to="/" className="inline-flex items-center">
          <img
            src="/logo.png"
            alt="Viron Labs"
            className="h-8 w-auto object-contain select-none"
            draggable={false}
          />
        </Link>
      </nav>

      <main className="px-4 py-6 max-w-md mx-auto">
        <div className="text-center mb-6">
          <div className="w-16 h-16 rounded-full bg-green-500/10 border border-green-500/30 flex items-center justify-center mx-auto mb-3">
            <CheckCircle2 className="w-8 h-8 text-green-500" />
          </div>
          <h1 className="text-xl font-bold text-white mb-1">Payment received</h1>
          <p className="text-sm text-gray-400">
            Thank you — your order is confirmed. We will email you shortly.
          </p>
        </div>

        {isStripe ? (
          <>
            <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 mb-4">
              <h2 className="text-lg font-bold text-emerald-400 text-center mb-1">ORDER CONFIRMED</h2>
              <p className="text-xs text-emerald-300/80 text-center">
                Confirmation is on its way. We dispatch within 24 hours of cleared payment.
              </p>
            </div>
            {displayOrder ? (
              <div className="p-4 rounded-xl bg-white/5 border border-white/10 mb-4">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-400">Order #</span>
                  <span className="text-sm font-mono text-white">{displayOrder}</span>
                </div>
              </div>
            ) : (
              <div className="p-4 rounded-xl bg-white/5 border border-white/10 mb-4 text-center">
                <p className="text-xs text-gray-400">
                  Save this page or check your inbox — your confirmation email includes your order number.
                </p>
              </div>
            )}
            {sessionId && (
              <p className="text-[10px] text-gray-500 text-center mb-4 font-mono break-all">
                Ref: {sessionId}
              </p>
            )}
          </>
        ) : (
          <p className="text-sm text-gray-400 text-center mb-4">
            If you were paying by bank transfer, return to checkout or check your email for bank details.
          </p>
        )}

        <Link
          to="/track-order"
          className="w-full py-3 rounded-xl border border-white/15 text-[#F4F6FA] font-semibold text-center block mb-3 hover:bg-white/5 transition-colors"
        >
          Track an order
        </Link>

        <a
          href={CONFIG.SOCIAL.TELEGRAM}
          target="_blank"
          rel="noopener noreferrer"
          className="w-full py-3 rounded-xl bg-[#0088cc] text-white font-semibold text-center flex items-center justify-center gap-2 mb-3"
        >
          Support on Telegram
        </a>

        <Link
          to="/"
          className="w-full py-3 rounded-xl bg-gradient-to-r from-[#2ED1B4] to-[#8B5CF6] text-white font-semibold text-center block"
        >
          Continue shopping
        </Link>

        <p className="mt-4 text-[10px] text-gray-500 text-center">
          For research use only. Not for human consumption.
        </p>
      </main>
    </div>
  );
}
