import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { Atom, Binary, Cpu, LineChart, Lock, Sparkles } from 'lucide-react';
import { fadeUp, staggerContainer } from './motion';
import { useTranslation } from '@/i18n';

const TILE_DEFS = [
  { icon: Atom, className: 'md:col-span-2 md:row-span-1', accent: 'from-amber-500/22 to-blue-600/12' },
  { icon: LineChart, className: 'md:col-span-1', accent: 'from-violet-500/15 to-transparent' },
  { icon: Cpu, className: 'md:col-span-1', accent: 'from-blue-500/15 to-transparent' },
  { icon: Lock, className: 'md:col-span-1 md:row-span-2', accent: 'from-amber-500/12 via-transparent to-red-500/8' },
  { icon: Sparkles, className: 'md:col-span-1', accent: 'from-red-500/10 to-amber-500/10' },
  { icon: Binary, className: 'md:col-span-1', accent: 'from-blue-500/14 to-amber-500/8' },
] as const;

export default function WhyViron() {
  const { t } = useTranslation();
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-10%' });

  const tiles = TILE_DEFS.map((tile, i) => ({
    ...tile,
    title: t(`landing.why.tiles.${i}.title`),
    body: t(`landing.why.tiles.${i}.body`),
  }));

  return (
    <section
      id="why-viron"
      ref={ref}
      className="relative z-20 py-16 sm:py-20 lg:py-28"
      style={{ background: 'transparent' }}
    >
      <div className="relative z-10 px-4 sm:px-6 lg:px-12 max-w-6xl mx-auto">
        <motion.div
          initial="hidden"
          animate={inView ? 'show' : 'hidden'}
          variants={staggerContainer}
          className="mb-10 sm:mb-14"
        >
          <motion.p variants={fadeUp} className="font-mono text-[11px] uppercase tracking-[0.22em] text-[var(--viron-cyan)] mb-3">
            {t('landing.why.eyebrow')}
          </motion.p>
          <motion.h2 variants={fadeUp} className="text-3xl sm:text-4xl md:text-5xl font-bold text-[var(--viron-text)] tracking-tight max-w-3xl">
            {t('landing.why.title')} <span className="gradient-text">{t('landing.why.titleHighlight')}</span> {t('landing.why.titleEnd')}
          </motion.h2>
        </motion.div>

        <motion.div
          initial="hidden"
          animate={inView ? 'show' : 'hidden'}
          variants={staggerContainer}
          className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4 auto-rows-fr"
        >
          {tiles.map((tile) => (
            <motion.div
              key={tile.title}
              variants={fadeUp}
              whileHover={{ scale: 1.01 }}
              transition={{ type: 'spring', stiffness: 420, damping: 28 }}
              className={`relative rounded-2xl sm:rounded-3xl border border-white/[0.08] bg-[rgba(10,12,20,0.65)] backdrop-blur-2xl p-5 sm:p-6 overflow-hidden group ${tile.className}`}
            >
              <div
                className={`pointer-events-none absolute inset-0 opacity-60 bg-gradient-to-br ${tile.accent}`}
                aria-hidden
              />
              <div className="relative flex h-11 w-11 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] text-amber-200 mb-4 group-hover:border-amber-400/35 group-hover:shadow-[0_0_24px_rgba(234,179,8,0.22)] transition-all">
                <tile.icon className="h-5 w-5" aria-hidden />
              </div>
              <h3 className="relative text-lg font-bold text-white tracking-tight">{tile.title}</h3>
              <p className="relative mt-2 text-sm text-[var(--viron-muted)] leading-relaxed">{tile.body}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
