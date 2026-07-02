import { Mail, MessageCircle, Clock, MapPin, ExternalLink } from 'lucide-react';
import PageTopBar from '@/components/PageTopBar';
import { CONFIG } from '@/lib/config';
import { useTranslation } from '@/i18n';

export default function ContactInfo() {
  const { t } = useTranslation();
  const contactEmail = CONFIG.CONTACT_EMAIL;

  return (
    <div className="min-h-screen" style={{ background: '#070A12' }}>
      <div className="absolute inset-0 grid-overlay opacity-60" />
      <PageTopBar backHref="/" backLabel={t('contact.backToShop')} />

      <main className="relative z-10 px-6 lg:px-12 py-12 lg:py-20">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <span className="eyebrow mb-4 block">{t('contact.info.eyebrow')}</span>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-[#F4F6FA] mb-4">
              {t('contact.info.title')} <span className="gradient-text">{t('contact.info.titleHighlight')}</span>
            </h1>
            <p className="text-base sm:text-lg text-[#A9B3C7] max-w-xl mx-auto">
              {t('contact.info.subtitle')}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
            <div className="p-6 rounded-2xl bg-[rgba(17,24,39,0.6)] border border-[rgba(244,246,250,0.08)] hover:border-amber-500/35 transition-colors">
              <div className="w-12 h-12 rounded-xl bg-amber-500/10 flex items-center justify-center mb-4">
                <Mail className="w-6 h-6 text-amber-400" />
              </div>
              <h3 className="text-lg font-bold text-[#F4F6FA] mb-2">{t('contact.email')}</h3>
              <p className="text-sm text-[#A9B3C7] mb-4">{t('contact.info.emailDesc')}</p>
              <a
                href={`mailto:${contactEmail}`}
                className="inline-flex items-center gap-2 text-amber-400 hover:text-amber-300 hover:underline"
              >
                {contactEmail}
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>

            <div className="p-6 rounded-2xl bg-[rgba(17,24,39,0.6)] border border-[rgba(244,246,250,0.08)] hover:border-amber-500/25 transition-colors">
              <div className="w-12 h-12 rounded-xl bg-amber-500/8 flex items-center justify-center mb-4">
                <Clock className="w-6 h-6 text-amber-300" />
              </div>
              <h3 className="text-lg font-bold text-[#F4F6FA] mb-2">{t('contact.responseTime')}</h3>
              <p className="text-sm text-[#A9B3C7] mb-4">{t('contact.info.responseTimeDesc')}</p>
              <span className="text-amber-200/95 font-medium">{t('contact.responseTimeValue')}</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-6 rounded-2xl bg-[rgba(17,24,39,0.6)] border border-[rgba(244,246,250,0.08)]">
              <div className="flex items-center gap-3 mb-4">
                <MapPin className="w-5 h-5 text-sky-400" />
                <h3 className="text-lg font-bold text-[#F4F6FA]">{t('contact.info.location')}</h3>
              </div>
              <p className="text-[#A9B3C7]">{t('contact.info.locationDesc')}</p>
            </div>

            <div className="p-6 rounded-2xl bg-[rgba(72, 78, 92, 0.6)] border border-[rgba(244,246,250,0.08)]">
              <div className="flex items-center gap-3 mb-4">
                <MessageCircle className="w-5 h-5 text-amber-400" />
                <h3 className="text-lg font-bold text-[#F4F6FA]">{t('contact.info.supportHours')}</h3>
              </div>
              <p className="text-[#A9B3C7]">{t('contact.info.supportHoursDesc')}</p>
            </div>
          </div>

          <div className="mt-12 text-center">
            <p className="text-[#A9B3C7] mb-4">{t('contact.info.preferForm')}</p>
            <a
              href="/contact"
              className="inline-flex items-center gap-2 btn-primary"
            >
              <MessageCircle className="w-4 h-4" />
              {t('contact.info.goToForm')}
            </a>
          </div>
        </div>
      </main>

      <footer className="relative z-10 px-6 lg:px-12 py-8 border-t border-amber-500/15">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-[#A9B3C7]">{t('contact.info.copyright')}</p>
          <div className="flex items-center gap-4 text-xs text-[#A9B3C7]">
            <a href="/privacy" className="hover:text-[#F4F6FA] transition-colors">{t('footer.privacy')}</a>
            <a href="/terms" className="hover:text-[#F4F6FA] transition-colors">{t('footer.terms')}</a>
            <a href="/refund" className="hover:text-[#F4F6FA] transition-colors">{t('footer.refunds')}</a>
            <a href="/shipping" className="hover:text-[#F4F6FA] transition-colors">{t('footer.shipping')}</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
