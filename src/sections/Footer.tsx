import { useEffect, useRef, useState } from 'react';
import { motion, useInView } from 'framer-motion';
import { Mail, ArrowRight, Shield, Beaker, CreditCard, Hexagon } from 'lucide-react';
import { getSiteSetting, DEFAULT_SUPPORT_LINKS } from '@/lib/settings';
import { fadeUp, staggerContainer } from '@/components/landing/motion';
import { useTranslation } from '@/i18n';

const socialBtn =
  'inline-flex h-10 w-10 items-center justify-center rounded-xl border border-white/[0.1] bg-white/[0.04] text-slate-300 transition-all hover:border-amber-400/45 hover:bg-amber-500/12 hover:text-amber-100 hover:shadow-[0_0_22px_rgba(234,179,8,0.22)]';

export default function Footer() {
  const { t } = useTranslation();
  const sectionRef = useRef<HTMLElement>(null);
  const footerLinksRef = useRef<HTMLDivElement>(null);
  const headlineRef = useRef(null);
  const inViewHead = useInView(headlineRef, { once: true, margin: '-10%' });
  const linksInView = useInView(footerLinksRef, { once: true, margin: '-8%' });

  const [telegramLink, setTelegramLink] = useState(DEFAULT_SUPPORT_LINKS.telegram_link);
  const [whatsappLink, setWhatsappLink] = useState(DEFAULT_SUPPORT_LINKS.whatsapp_link);

  useEffect(() => {
    (async () => {
      try {
        const telegramVal = await getSiteSetting('telegram_link', { url: DEFAULT_SUPPORT_LINKS.telegram_link });
        setTelegramLink((telegramVal as { url?: string })?.url || DEFAULT_SUPPORT_LINKS.telegram_link);

        const whatsappVal = await getSiteSetting('whatsapp_link', { url: DEFAULT_SUPPORT_LINKS.whatsapp_link });
        setWhatsappLink((whatsappVal as { url?: string })?.url || '');
      } catch (_) {
        /* keep defaults */
      }
    })();
  }, []);
  return (
    <footer
      ref={sectionRef}
      id="footer"
      className="relative z-[90] border-t border-amber-500/15 pt-16 lg:pt-24 pb-10 overflow-hidden"
      style={{ background: 'linear-gradient(180deg,#030712 0%,#020617 42%,#000 100%)' }}
    >
      <div className="pointer-events-none absolute inset-x-0 top-0 h-48 bg-[radial-gradient(ellipse_at_50%_0%,rgba(234,179,8,0.12),rgba(59,130,246,0.08),rgba(239,68,68,0.05),transparent_65%)]" aria-hidden />

      <div className="absolute inset-0 grid-overlay opacity-25" />

      <div className="relative z-10 px-6 lg:px-12">
        {/* Newsletter */}
        <div ref={headlineRef} className="max-w-3xl mx-auto text-center mb-16">
          <motion.div initial="hidden" animate={inViewHead ? 'show' : 'hidden'} variants={staggerContainer}>
            <motion.span variants={fadeUp} className="inline-flex items-center gap-2 rounded-full border border-amber-500/30 px-4 py-1.5 font-mono text-[10px] uppercase tracking-[0.24em] text-amber-200/90 mb-5">
              <Hexagon className="h-3.5 w-3.5" aria-hidden /> {t('footer.fieldNotes')}
            </motion.span>
            <motion.h2 variants={fadeUp} className="text-3xl sm:text-4xl font-bold text-white mb-4 font-['Syne',sans-serif] tracking-tight">
              {t('footer.stayCalibrated')} <span className="gradient-text">{t('common.brand')}</span>
            </motion.h2>
            <motion.p variants={fadeUp} className="text-slate-400 mb-8 text-sm sm:text-base max-w-xl mx-auto">
              {t('footer.newsletterSub')}
            </motion.p>
            <motion.div variants={fadeUp} className="flex flex-col sm:flex-row gap-3 max-w-lg mx-auto">
              <div className="relative flex-1">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="email"
                  placeholder={t('footer.emailPlaceholder')}
                  className="w-full pl-11 pr-4 py-3.5 rounded-full bg-[rgba(8,10,18,0.75)] border border-white/[0.1] text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-400/35 focus:border-amber-500/40 transition-all backdrop-blur-md"
                  aria-label={t('footer.emailAria')}
                />
              </div>
              <button type="button" className="btn-primary flex items-center justify-center gap-2 whitespace-nowrap rounded-full">
                {t('footer.subscribe')}
                <ArrowRight className="w-4 h-4" />
              </button>
            </motion.div>
          </motion.div>
        </div>

        {/* Feature strip */}
        <div className="mb-16 py-10 border-y border-amber-500/15 rounded-3xl px-4 sm:px-8 bg-[linear-gradient(105deg,rgba(234,179,8,0.07),rgba(59,130,246,0.06),rgba(239,68,68,0.04),rgba(30,14,54,0.2))] backdrop-blur-md shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
            {[
              { icon: Beaker, title: t('footer.hplcVerified'), sub: t('footer.purityFloor') },
              { icon: Shield, title: t('footer.labTested'), sub: t('footer.traceableQa') },
              { icon: CreditCard, title: t('footer.secureCheckout'), sub: t('footer.encryptedPayments') },
            ].map((f) => (
              <div key={f.title} className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-amber-500/30 bg-gradient-to-br from-amber-500/14 via-blue-600/10 to-red-600/8 text-amber-100">
                  <f.icon className="w-5 h-5" aria-hidden />
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">{f.title}</p>
                  <p className="text-xs text-slate-400">{f.sub}</p>
                </div>
              </div>
            ))}
          </div>
          <p className="text-center text-[11px] text-slate-500 tracking-wide uppercase">
            {t('footer.stripTagline')}
          </p>
        </div>

        <motion.div
          ref={footerLinksRef}
          initial="hidden"
          animate={linksInView ? 'show' : 'hidden'}
          variants={staggerContainer}
          className="grid grid-cols-2 md:grid-cols-4 gap-10 mb-14"
        >
          {[
            {
              title: t('footer.shop'),
              links: (
                <>
                  <li><a href="/" className="transition-colors hover:text-amber-200/95 text-slate-400 text-sm">{t('footer.allProducts')}</a></li>
                  <li><a href="/#catalog" className="transition-colors hover:text-amber-200/95 text-slate-400 text-sm">{t('footer.catalog')}</a></li>
                  <li><button type="button" onClick={() => document.getElementById('why-viron')?.scrollIntoView({ behavior: 'smooth' })} className="transition-colors hover:text-amber-200/95 text-slate-400 text-sm text-left">{t('footer.whyViron')}</button></li>
                </>
              ),
            },
            {
              title: t('footer.quality'),
              links: (
                <>
                  <li><a href="/standards" className="transition-colors hover:text-amber-200/95 text-slate-400 text-sm">{t('footer.ourStandards')}</a></li>
                  <li>
                    <button
                      type="button"
                      onClick={() => {
                        document.getElementById('tutorial')?.scrollIntoView({ behavior: 'smooth' }) ?? window.location.assign('/#tutorial');
                      }}
                      className="transition-colors hover:text-amber-200/95 text-slate-400 text-sm text-left"
                    >
                      {t('footer.reconstitutionGuide')}
                    </button>
                  </li>
                </>
              ),
            },
            {
              title: t('footer.support'),
              links: (
                <>
                  <li><a href="/track-order" className="transition-colors hover:text-amber-200/95 text-slate-400 text-sm">{t('footer.trackOrder')}</a></li>
                  <li><a href="/contact-info" className="transition-colors hover:text-amber-200/95 text-slate-400 text-sm">{t('common.contact')}</a></li>
                  <li><a href={telegramLink} target="_blank" rel="noopener noreferrer" className="transition-colors hover:text-amber-200/95 text-slate-400 text-sm">Telegram</a></li>
                  {whatsappLink ? (
                    <li><a href={whatsappLink} target="_blank" rel="noopener noreferrer" className="transition-colors hover:text-amber-200/95 text-slate-400 text-sm">WhatsApp</a></li>
                  ) : null}
                  <li><a href="/shipping" className="transition-colors hover:text-amber-200/95 text-slate-400 text-sm">{t('footer.shipping')}</a></li>
                </>
              ),
            },
            {
              title: t('footer.legal'),
              links: (
                <>
                  <li><a href="/privacy" className="transition-colors hover:text-amber-200/95 text-slate-400 text-sm">{t('footer.privacy')}</a></li>
                  <li><a href="/terms" className="transition-colors hover:text-amber-200/95 text-slate-400 text-sm">{t('footer.terms')}</a></li>
                  <li><a href="/refund" className="transition-colors hover:text-amber-200/95 text-slate-400 text-sm">{t('footer.refunds')}</a></li>
                  <li><a href="/legal" className="transition-colors hover:text-amber-200/95 text-slate-400 text-sm">{t('footer.compliance')}</a></li>
                </>
              ),
            },
          ].map((col) => (
            <motion.div key={col.title} variants={fadeUp} className="footer-column">
              <h4 className="text-xs font-bold text-amber-200/95 mb-5 uppercase tracking-[0.2em] font-mono">{col.title}</h4>
              <ul className="space-y-2.5">{col.links}</ul>
            </motion.div>
          ))}
        </motion.div>

        {/* Bottom */}
        <div className="pt-10 border-t border-amber-500/15">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-8">
            <div className="flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left">
              <div className="flex items-center gap-3">
                <img
                  src="/logo.png"
                  alt=""
                  className="h-11 w-auto max-w-[min(220px,55vw)] object-contain object-left"
                  width={220}
                  height={48}
                  draggable={false}
                />
                <div className="flex items-center gap-2">
                <a href={telegramLink} target="_blank" rel="noopener noreferrer" className={socialBtn} aria-label="Telegram">
                  <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current" aria-hidden><path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.147-.056-.207s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.559z"/></svg>
                </a>
                {whatsappLink ? (
                  <a href={whatsappLink} target="_blank" rel="noopener noreferrer" className={socialBtn} aria-label="WhatsApp">
                    <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current" aria-hidden><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.435 9.884-9.883 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                  </a>
                ) : null}
              </div>
              </div>
            </div>

            <p className="text-xs text-slate-500 text-center max-w-md leading-relaxed">
              {t('common.researchUseOnly')}
            </p>

            <p className="text-xs font-mono text-slate-500">
              {t('footer.copyright')}
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
