import { useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { XCircle } from 'lucide-react';
import { formatOrderNumberDisplay } from '@/utils/order-number';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import { useTranslation } from '@/i18n';

export default function CheckoutCancel() {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const orderRaw = searchParams.get('order');
  let displayOrder = '';
  if (orderRaw) {
    try {
      displayOrder = formatOrderNumberDisplay(decodeURIComponent(orderRaw));
    } catch {
      displayOrder = formatOrderNumberDisplay(orderRaw);
    }
  }

  useEffect(() => {
    document.title = `${t('checkout.cancelTitle')} | Viron Labs`;
  }, [t]);

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

      <main className="px-4 py-10 max-w-md mx-auto text-center">
        <div className="w-16 h-16 rounded-full bg-rose-500/10 border border-rose-500/30 flex items-center justify-center mx-auto mb-4">
          <XCircle className="w-8 h-8 text-rose-400" />
        </div>
        <h1 className="text-xl font-bold text-white mb-2">{t('checkout.cancelTitle')}</h1>
        <p className="text-sm text-gray-400 mb-6">{t('checkout.cancelDesc')}</p>
        {displayOrder && (
          <p className="text-xs text-gray-500 mb-6">
            {t('checkout.refOrderNotCompleted', { order: displayOrder })}
          </p>
        )}

        <div className="flex flex-col gap-3">
          <Link
            to="/checkout"
            className="w-full py-3 rounded-xl bg-gradient-to-r from-[#2ED1B4] to-[#8B5CF6] text-white font-semibold text-center block"
          >
            {t('checkout.returnToCheckout')}
          </Link>
          <Link
            to="/"
            className="w-full py-3 rounded-xl border border-white/15 text-[#F4F6FA] font-semibold text-center hover:bg-white/5 transition-colors"
          >
            {t('checkout.backToShop')}
          </Link>
        </div>
      </main>
    </div>
  );
}
