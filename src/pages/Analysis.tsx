import { useState } from 'react';
import { FlaskConical, ShieldCheck, FileBadge2, ScanLine, X, ExternalLink, MessageCircle, Download } from 'lucide-react';
import PageTopBar from '@/components/PageTopBar';
import { useTranslation } from '@/i18n';

/**
 * COA_DATA holds the raw, factual data pulled directly from each physical
 * certificate image (product name, lot, purity %, method, reported date).
 * These values are intentionally NOT translated — they are literal facts
 * from the source documents, just like an invoice number or lab ID.
 * User-facing labels around them are localized via `t()`.
 */
type Coa = {
  id: 'analyser1' | 'analyser2' | 'analyser3' | 'analyser4';
  src: string;
  lab: string;
  product: string;
  lot: string;
  purity: string;
  method: string;
  reportedOn: string;
};

const COA_DATA: Coa[] = [
  {
    id: 'analyser1',
    src: '/analyser1.jpeg',
    lab: 'Leader Peptide — Analytical Testing',
    product: 'Tirzepatide (T10) 10.84 mg',
    lot: 'T10-LP',
    purity: '99.91%',
    method: 'HPLC with UV Detection + Mass Spectrometry',
    reportedOn: '05/14/2026',
  },
  {
    id: 'analyser2',
    src: '/analyser2.jpeg',
    lab: 'Peptegrity Analytics — Peptide ID, Mass & Purity Report',
    product: 'TB-500 / TB4 — 10 mg',
    lot: 'Task 157b',
    purity: '98.53%',
    method: 'HPLC Sample Chromatogram + Mass ID',
    reportedOn: '13/03/2026',
  },
  {
    id: 'analyser3',
    src: '/analyser3.jpeg',
    lab: 'Freedom Diagnostics — Certificate of Analysis',
    product: 'Tesamorelin 20 mg',
    lot: 'TSM 20',
    purity: '99.43%',
    method: 'LC-MS (HPLC with UV detection coupled with MS)',
    reportedOn: '04/30/2026',
  },
  {
    id: 'analyser4',
    src: '/analyser4.jpeg',
    lab: 'Leader Peptide — Analytical Testing',
    product: 'BPC-157 (BC10) 11.80 mg',
    lot: 'BC10-LP',
    purity: '99.22%',
    method: 'HPLC with UV Detection + Mass Spectrometry',
    reportedOn: '05/08/2026',
  },
];

const HIGHLIGHT_KEYS = ['h1', 'h2', 'h3'] as const;

export default function Analysis() {
  const { t } = useTranslation();
  const [lightbox, setLightbox] = useState<Coa | null>(null);

  const stats = [
    {
      icon: ShieldCheck,
      label: t('analysis.stats.purityLabel'),
      value: t('analysis.stats.purityValue'),
      accent: 'text-[#2ED1B4]',
      ring: 'bg-[rgba(46,209,180,0.1)]',
    },
    {
      icon: FlaskConical,
      label: t('analysis.stats.methodLabel'),
      value: t('analysis.stats.methodValue'),
      accent: 'text-amber-300',
      ring: 'bg-[rgba(234,179,8,0.12)]',
    },
    {
      icon: FileBadge2,
      label: t('analysis.stats.labsLabel'),
      value: t('analysis.stats.labsValue'),
      accent: 'text-[#3B82F6]',
      ring: 'bg-[rgba(59,130,246,0.12)]',
    },
    {
      icon: ScanLine,
      label: t('analysis.stats.traceabilityLabel'),
      value: t('analysis.stats.traceabilityValue'),
      accent: 'text-[#8B5CF6]',
      ring: 'bg-[rgba(139,92,246,0.12)]',
    },
  ];

  return (
    <div className="min-h-screen relative" style={{ background: '#070A12' }}>
      <div className="absolute inset-0 grid-overlay opacity-60 pointer-events-none" />
      <PageTopBar backHref="/" backLabel={t('legal.backToShop')} />

      <main className="relative z-10 px-6 lg:px-12 py-12 lg:py-16">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="text-center mb-14">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-[rgba(46,209,180,0.1)] flex items-center justify-center mb-6">
              <FlaskConical className="w-8 h-8 text-[#2ED1B4]" />
            </div>
            <span className="inline-flex items-center justify-center rounded-full border border-white/10 bg-white/[0.03] px-4 py-1.5 font-mono text-[10px] uppercase tracking-[0.24em] text-amber-200/95 mb-5">
              {t('analysis.eyebrow')}
            </span>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-[#F4F6FA] mb-4 font-['Syne',sans-serif] tracking-tight">
              {t('analysis.title')} <span className="gradient-text">{t('analysis.titleHighlight')}</span>
            </h1>
            <p className="text-base sm:text-lg text-[#A9B3C7] max-w-2xl mx-auto leading-relaxed">
              {t('analysis.subtitle')}
            </p>
          </div>

          {/* Highlight stat strip */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mb-14">
            {stats.map((s) => (
              <div
                key={s.label}
                className="rounded-2xl border border-white/[0.08] bg-[rgba(10,12,22,0.55)] backdrop-blur-xl p-4 sm:p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]"
              >
                <div className={`w-10 h-10 rounded-xl ${s.ring} flex items-center justify-center mb-3`}>
                  <s.icon className={`w-5 h-5 ${s.accent}`} />
                </div>
                <p className="text-xs text-[#A9B3C7] uppercase tracking-[0.18em] font-mono mb-1">
                  {s.label}
                </p>
                <p className="text-lg font-bold text-[#F4F6FA]">{s.value}</p>
              </div>
            ))}
          </div>

          {/* COA cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {COA_DATA.map((coa, i) => (
              <article
                key={coa.id}
                className="group relative rounded-3xl border border-white/[0.08] bg-[rgba(10,12,22,0.6)] backdrop-blur-2xl overflow-hidden hover:border-amber-500/40 transition-colors shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]"
              >
                <div className="pointer-events-none absolute -top-20 -right-16 h-40 w-40 rounded-full bg-amber-400/10 blur-3xl group-hover:bg-amber-400/20 transition-colors" aria-hidden />

                <button
                  type="button"
                  onClick={() => setLightbox(coa)}
                  className="relative block w-full aspect-[4/5] bg-white overflow-hidden focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/60"
                  aria-label={t('analysis.card.openAria', { product: coa.product })}
                >
                  <img
                    src={coa.src}
                    alt={t('analysis.card.imageAlt', { product: coa.product })}
                    className="w-full h-full object-contain transition-transform duration-500 group-hover:scale-[1.02]"
                    loading={i < 2 ? 'eager' : 'lazy'}
                    draggable={false}
                  />
                  <span className="absolute top-3 right-3 inline-flex items-center gap-1.5 rounded-full bg-black/70 backdrop-blur px-3 py-1 text-[10px] font-mono uppercase tracking-[0.18em] text-amber-200/90 border border-amber-500/30">
                    <ExternalLink className="w-3 h-3" /> {t('analysis.card.viewFull')}
                  </span>
                </button>

                <div className="relative p-5 sm:p-6">
                  <p className="text-[10px] font-mono uppercase tracking-[0.22em] text-amber-300/90 mb-2">
                    {coa.lab}
                  </p>
                  <h2 className="text-lg sm:text-xl font-bold text-[#F4F6FA] mb-4 font-['Syne',sans-serif]">
                    {coa.product}
                  </h2>

                  <dl className="grid grid-cols-3 gap-3 mb-5">
                    <div>
                      <dt className="text-[10px] text-[#A9B3C7] uppercase tracking-[0.16em] font-mono mb-1">{t('analysis.card.lot')}</dt>
                      <dd className="text-sm font-semibold text-[#F4F6FA]">{coa.lot}</dd>
                    </div>
                    <div>
                      <dt className="text-[10px] text-[#A9B3C7] uppercase tracking-[0.16em] font-mono mb-1">{t('analysis.card.purity')}</dt>
                      <dd className="text-sm font-semibold text-[#2ED1B4]">{coa.purity}</dd>
                    </div>
                    <div>
                      <dt className="text-[10px] text-[#A9B3C7] uppercase tracking-[0.16em] font-mono mb-1">{t('analysis.card.reported')}</dt>
                      <dd className="text-sm font-semibold text-[#F4F6FA]">{coa.reportedOn}</dd>
                    </div>
                  </dl>

                  <p className="text-xs text-[#A9B3C7] mb-4">
                    <span className="text-[#F4F6FA] font-semibold">{t('analysis.card.method')} </span>
                    {coa.method}
                  </p>

                  <ul className="space-y-2 mb-5">
                    {HIGHLIGHT_KEYS.map((hk) => (
                      <li key={hk} className="flex items-start gap-2 text-sm text-[#A9B3C7]">
                        <span className="text-amber-300 mt-1">•</span>
                        <span>{t(`analysis.coas.${coa.id}.${hk}`)}</span>
                      </li>
                    ))}
                  </ul>

                  <div className="flex flex-wrap items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setLightbox(coa)}
                      className="btn-primary inline-flex items-center gap-2 text-sm"
                    >
                      <ExternalLink className="w-4 h-4" />
                      {t('analysis.card.openReport')}
                    </button>
                    <a
                      href={coa.src}
                      download
                      className="btn-outline inline-flex items-center gap-2 text-sm"
                    >
                      <Download className="w-4 h-4" />
                      {t('analysis.card.download')}
                    </a>
                  </div>
                </div>
              </article>
            ))}
          </div>

          {/* Disclaimer */}
          <div className="mt-14 p-6 sm:p-7 rounded-2xl border border-amber-500/20 bg-[rgba(234,179,8,0.05)]">
            <p className="text-[10px] font-mono uppercase tracking-[0.22em] text-amber-300/90 mb-2">
              {t('analysis.disclaimer.eyebrow')}
            </p>
            <p className="text-sm text-[#A9B3C7] leading-relaxed">
              {t('analysis.disclaimer.body')}
            </p>
          </div>

          {/* CTA */}
          <div className="mt-14 text-center">
            <p className="text-[#A9B3C7] mb-6">
              {t('analysis.cta.question')}
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <a href="/contact-info" className="btn-primary inline-flex items-center gap-2">
                <MessageCircle className="w-4 h-4" />
                {t('analysis.cta.request')}
              </a>
              <a href="/standards" className="btn-outline inline-flex items-center gap-2">
                {t('analysis.cta.viewStandards')}
              </a>
            </div>
          </div>
        </div>
      </main>

      <footer className="relative z-10 px-6 lg:px-12 py-8 border-t border-[rgba(244,246,250,0.08)] mt-6">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-[#A9B3C7]">
            {t('legal.copyright', { year: String(new Date().getFullYear()) })}
          </p>
          <div className="flex items-center gap-4 text-xs text-[#A9B3C7]">
            <a href="/privacy" className="hover:text-[#F4F6FA] transition-colors">{t('footer.privacy')}</a>
            <a href="/terms" className="hover:text-[#F4F6FA] transition-colors">{t('footer.terms')}</a>
            <a href="/refund" className="hover:text-[#F4F6FA] transition-colors">{t('footer.refunds')}</a>
            <a href="/shipping" className="hover:text-[#F4F6FA] transition-colors">{t('footer.shipping')}</a>
          </div>
        </div>
      </footer>

      {/* Lightbox */}
      {lightbox ? (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/85 backdrop-blur-md p-4 sm:p-8"
          role="dialog"
          aria-modal="true"
          aria-label={t('analysis.lightbox.aria', { product: lightbox.product })}
          onClick={() => setLightbox(null)}
        >
          <div
            className="relative max-w-4xl w-full max-h-full flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-3 text-white">
              <div>
                <p className="text-[10px] font-mono uppercase tracking-[0.22em] text-amber-300/90">
                  {lightbox.lab}
                </p>
                <p className="text-sm font-semibold">{lightbox.product}</p>
              </div>
              <button
                type="button"
                onClick={() => setLightbox(null)}
                className="inline-flex items-center justify-center h-10 w-10 rounded-full border border-white/20 bg-white/[0.06] text-white hover:bg-white/[0.14] transition-colors"
                aria-label={t('analysis.lightbox.close')}
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 min-h-0 rounded-2xl overflow-hidden bg-white flex items-center justify-center">
              <img
                src={lightbox.src}
                alt={t('analysis.card.imageAlt', { product: lightbox.product })}
                className="max-w-full max-h-[80vh] object-contain"
                draggable={false}
              />
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
