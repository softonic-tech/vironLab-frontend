import { Beaker, Shield, FileText, MessageCircle, Heart } from 'lucide-react';
import PageTopBar from '@/components/PageTopBar';
import { useTranslation } from '@/i18n';

export default function Standards() {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen" style={{ background: '#070A12' }}>
      <div className="absolute inset-0 grid-overlay opacity-60" />
      <PageTopBar backHref="/" backLabel={t('legal.backToShop')} />

      <main className="relative z-10 px-6 lg:px-12 py-12 lg:py-20">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-[rgba(46,209,180,0.1)] flex items-center justify-center mb-6">
              <Beaker className="w-8 h-8 text-[#2ED1B4]" />
            </div>
            <span className="eyebrow mb-4 block">{t('legal.standards.eyebrow')}</span>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-[#F4F6FA] mb-4">
              {t('legal.standards.title')} <span className="gradient-text">{t('legal.standards.titleHighlight')}</span>
            </h1>
            <p className="text-base sm:text-lg text-[#A9B3C7] max-w-2xl mx-auto">
              {t('legal.standards.subtitle')}
            </p>
          </div>

          <div className="space-y-6">
            <div className="p-6 sm:p-8 rounded-2xl bg-[rgba(17,24,39,0.6)] border border-[rgba(244,246,250,0.08)]">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-[rgba(46,209,180,0.1)] flex items-center justify-center flex-shrink-0">
                  <Beaker className="w-6 h-6 text-[#2ED1B4]" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-[#F4F6FA] mb-3">{t('legal.standards.standard1')}</h2>
                  <ul className="space-y-2 text-[#A9B3C7]">
                    <li className="flex items-start gap-2">
                      <span className="text-[#2ED1B4] mt-1">•</span>
                      <span>All products are intended strictly for laboratory research and are manufactured to meet high-purity standards.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-[#2ED1B4] mt-1">•</span>
                      <span>Every batch undergoes rigorous quality control testing to ensure accuracy and consistency.</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="p-6 sm:p-8 rounded-2xl bg-[rgba(17,24,39,0.6)] border border-[rgba(244,246,250,0.08)]">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-[rgba(139,92,246,0.1)] flex items-center justify-center flex-shrink-0">
                  <Shield className="w-6 h-6 text-[#8B5CF6]" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-[#F4F6FA] mb-3">{t('legal.standards.standard2')}</h2>
                  <ul className="space-y-2 text-[#A9B3C7]">
                    <li className="flex items-start gap-2">
                      <span className="text-[#8B5CF6] mt-1">•</span>
                      <span>We adhere to local and international regulations governing the production, handling, and distribution of research chemicals.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-[#8B5CF6] mt-1">•</span>
                      <span>Our products are not for human or animal consumption, nor for therapeutic, diagnostic, or cosmetic use.</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="p-6 sm:p-8 rounded-2xl bg-[rgba(17,24,39,0.6)] border border-[rgba(244,246,250,0.08)]">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-[rgba(59,130,246,0.1)] flex items-center justify-center flex-shrink-0">
                  <FileText className="w-6 h-6 text-[#3B82F6]" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-[#F4F6FA] mb-3">{t('legal.standards.standard3')}</h2>
                  <ul className="space-y-2 text-[#A9B3C7]">
                    <li className="flex items-start gap-2">
                      <span className="text-[#3B82F6] mt-1">•</span>
                      <span>Product specifications, certificates of analysis (COA), and safety information are provided to support research and compliance.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-[#3B82F6] mt-1">•</span>
                      <span>We maintain clear records of all batches, shipping, and customer orders.</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="p-6 sm:p-8 rounded-2xl bg-[rgba(17,24,39,0.6)] border border-[rgba(244,246,250,0.08)]">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-[rgba(236,72,153,0.1)] flex items-center justify-center flex-shrink-0">
                  <MessageCircle className="w-6 h-6 text-[#EC4899]" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-[#F4F6FA] mb-3">{t('legal.standards.standard4')}</h2>
                  <ul className="space-y-2 text-[#A9B3C7]">
                    <li className="flex items-start gap-2">
                      <span className="text-[#EC4899] mt-1">•</span>
                      <span>Our team is available to provide guidance on proper storage, handling, and research usage.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-[#EC4899] mt-1">•</span>
                      <span>
                        Live chat support via Telegram ({' '}
                        <a
                          href="https://t.me/vironlabs"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[#2ED1B4] hover:underline"
                        >
                          @VironLabs
                        </a>
                        {' '} ) and email ensures quick and reliable assistance.
                      </span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="p-6 sm:p-8 rounded-2xl bg-[rgba(17,24,39,0.6)] border border-[rgba(244,246,250,0.08)]">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-[rgba(16,185,129,0.1)] flex items-center justify-center flex-shrink-0">
                  <Heart className="w-6 h-6 text-[#10B981]" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-[#F4F6FA] mb-3">{t('legal.standards.standard5')}</h2>
                  <ul className="space-y-2 text-[#A9B3C7]">
                    <li className="flex items-start gap-2">
                      <span className="text-[#10B981] mt-1">•</span>
                      <span>We operate with integrity and professionalism, serving only qualified researchers and institutions.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-[#10B981] mt-1">•</span>
                      <span>We continuously review our processes to uphold ethical and scientific best practices.</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-12 text-center">
            <p className="text-[#A9B3C7] mb-6">{t('legal.standards.ctaQuestion')}</p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <a href="/contact-info" className="btn-primary inline-flex items-center gap-2">
                <MessageCircle className="w-4 h-4" />
                {t('legal.standards.contactUs')}
              </a>
              <a href="/#tutorial" className="btn-outline inline-flex items-center gap-2">
                {t('legal.standards.reconstitutionGuide')}
              </a>
            </div>
          </div>
        </div>
      </main>

      <footer className="relative z-10 px-6 lg:px-12 py-8 border-t border-[rgba(244,246,250,0.08)]">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-[#A9B3C7]">{t('legal.copyright', { year: String(new Date().getFullYear()) })}</p>
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
