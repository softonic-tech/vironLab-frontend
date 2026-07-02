import { useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { CheckCircle2 } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { CONFIG } from '@/lib/config';
import { formatOrderNumberDisplay } from '@/utils/order-number';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import { useTranslation } from '@/i18n';

export default function CheckoutSuccess() {
  const { t } = useTranslation();
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
    document.title = `${t('checkout.successTitle')} | Viron Labs`;
    try {
      clearCart();
    } catch (err) {
      console.error('clearCart after checkout success:', err);
    }
  }, [clearCart, t]);

  const isStripe = CONFIG.PAYMENT_PROVIDER === 'stripe';

  return (
    <div className="min-h-screen bg-[#070A12]">
      <nav className="px-4 py-4 border-b border-white/10 flex items-center justify-between">
        <Link to="/" className="inline-flex items-center">
          <img
            src="/logo.png"
            alt="Viron Labs"
            className="h-8 w-auto object-contain select-none"
            draggable={false}
          />
        </Link>
        <LanguageSwitcher />
      </nav>

      <main className="px-4 py-6 max-w-md mx-auto">
        <div className="text-center mb-6">
          <div className="w-16 h-16 rounded-full bg-green-500/10 border border-green-500/30 flex items-center justify-center mx-auto mb-3">
            <CheckCircle2 className="w-8 h-8 text-green-500" />
          </div>
          <h1 className="text-xl font-bold text-white mb-1">{t('checkout.successTitle')}</h1>
          <p className="text-sm text-gray-400">{t('checkout.successDesc')}</p>
        </div>

        {isStripe ? (
          <>
            <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 mb-4">
              <h2 className="text-lg font-bold text-emerald-400 text-center mb-1">{t('checkout.orderConfirmedBanner')}</h2>
              <p className="text-xs text-emerald-300/80 text-center">{t('checkout.orderConfirmedBannerDesc')}</p>
            </div>
            {displayOrder ? (
              <div className="p-4 rounded-xl bg-white/5 border border-white/10 mb-4">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-400">{t('checkout.orderNumber')}</span>
                  <span className="text-sm font-mono text-white">{displayOrder}</span>
                </div>
              </div>
            ) : (
              <div className="p-4 rounded-xl bg-white/5 border border-white/10 mb-4 text-center">
                <p className="text-xs text-gray-400">{t('checkout.savePageHint')}</p>
              </div>
            )}
            {sessionId && (
              <p className="text-[10px] text-gray-500 text-center mb-4 font-mono break-all">
                {t('checkout.ref')}: {sessionId}
              </p>
            )}
          </>
        ) : (
          <p className="text-sm text-gray-400 text-center mb-4">{t('checkout.bankTransferHint')}</p>
        )}

        <Link
          to="/track-order"
          className="w-full py-3 rounded-xl border border-white/15 text-[#F4F6FA] font-semibold text-center block mb-3 hover:bg-white/5 transition-colors"
        >
          {t('checkout.trackOrder')}
        </Link>

        <a
          href={`mailto:${CONFIG.CONTACT_EMAIL}`}
          className="w-full py-3 rounded-xl bg-amber-500/90 text-[#070A12] font-semibold text-center flex items-center justify-center gap-2 mb-3 hover:bg-amber-400 transition-colors"
        >
          {t('checkout.supportEmail')}
        </a>

        <Link
          to="/"
          className="w-full py-3 rounded-xl bg-gradient-to-r from-[#2ED1B4] to-[#8B5CF6] text-white font-semibold text-center block"
        >
          {t('checkout.continueShopping')}
        </Link>

        <p className="mt-4 text-[10px] text-gray-500 text-center">{t('common.researchUseOnly')}</p>
      </main>
    </div>
  );
}
