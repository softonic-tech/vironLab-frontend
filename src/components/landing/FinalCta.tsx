import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { fadeUp, staggerContainer } from './motion';
import { useTranslation } from '@/i18n';

export default function FinalCta() {
  const { t } = useTranslation();
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-15%' });

  const toCatalog = () => {
    document.getElementById('catalog')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };
  const toTutorial = () => {
    document.getElementById('tutorial')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <section
      id="final-cta"
      ref={ref}
      className="relative z-25 py-16 sm:py-20 lg:py-24"
      style={{ background: 'transparent' }}
    >
      <div className="px-4 sm:px-6 lg:px-12 max-w-5xl mx-auto">
        <motion.div
          initial="hidden"
          animate={inView ? 'show' : 'hidden'}
          variants={staggerContainer}
          className="relative overflow-hidden rounded-3xl border border-amber-500/30 bg-[linear-gradient(135deg,rgba(12,16,28,0.95),rgba(28,12,18,0.88))] px-6 sm:px-12 py-12 sm:py-16 text-center shadow-[0_0_80px_rgba(234,179,8,0.12),inset_0_1px_0_rgba(255,255,255,0.08)]"
        >
          <div
            className="pointer-events-none absolute -left-24 top-1/2 h-64 w-64 -translate-y-1/2 rounded-full bg-amber-500/20 blur-3xl"
            aria-hidden
          />
          <div
            className="pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full bg-blue-600/20 blur-3xl"
            aria-hidden
          />
          <motion.p variants={fadeUp} className="relative font-mono text-[11px] uppercase tracking-[0.26em] text-amber-200/90 mb-4">
            {t('landing.cta.eyebrow')}
          </motion.p>
          <motion.h2 variants={fadeUp} className="relative text-3xl sm:text-4xl md:text-5xl font-bold text-white tracking-tight max-w-3xl mx-auto">
            {t('landing.cta.title')} <span className="gradient-text">{t('landing.cta.titleHighlight')}</span> {t('landing.cta.titleEnd')}
          </motion.h2>
          <motion.p variants={fadeUp} className="relative mt-4 text-sm sm:text-base text-[var(--viron-muted)] max-w-xl mx-auto leading-relaxed">
            {t('landing.cta.subtitle')}
          </motion.p>
          <motion.div variants={fadeUp} className="relative mt-8 flex flex-col sm:flex-row gap-3 justify-center">
            <button type="button" onClick={toCatalog} className="btn-primary text-sm sm:text-base px-8 py-3.5">
              {t('landing.cta.openCatalog')}
            </button>
            <button type="button" onClick={toTutorial} className="btn-outline text-sm sm:text-base px-8 py-3.5">
              {t('landing.cta.reconstitutionLab')}
            </button>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
