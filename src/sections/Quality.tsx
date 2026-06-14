import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { motion, useInView } from 'framer-motion';
import { Check, FlaskConical, Shield, Award, MessageCircle, Pipette, ScanLine, Archive, Truck } from 'lucide-react';
import { fadeUp, staggerContainer } from '@/components/landing/motion';
import { useTranslation } from '@/i18n';

gsap.registerPlugin(ScrollTrigger);

const FEATURE_ICONS = [FlaskConical, Check, Shield] as const;

const PIPELINE_DEFS = [
  { step: '01', icon: Pipette },
  { step: '02', icon: ScanLine },
  { step: '03', icon: Archive },
  { step: '04', icon: Truck },
] as const;

function ResearchPipeline() {
  const { t } = useTranslation();
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-12%' });

  const pipeline = PIPELINE_DEFS.map((p, i) => ({
    ...p,
    title: t(`landing.quality.pipeline.${i}.title`),
    body: t(`landing.quality.pipeline.${i}.body`),
  }));

  return (
    <div ref={ref} className="mt-16 lg:mt-20">
      <motion.div
        initial="hidden"
        animate={inView ? 'show' : 'hidden'}
        variants={staggerContainer}
        className="text-center mb-10"
      >
        <motion.p variants={fadeUp} className="font-mono text-[11px] uppercase tracking-[0.22em] text-amber-300/90 mb-3">
          {t('landing.quality.pipelineEyebrow')}
        </motion.p>
        <motion.h3 variants={fadeUp} className="text-2xl sm:text-3xl font-bold text-white font-['Syne',sans-serif]">
          {t('landing.quality.pipelineTitle')} <span className="gradient-text">{t('landing.quality.pipelineHighlight')}</span>
        </motion.h3>
      </motion.div>
      <motion.ol
        initial="hidden"
        animate={inView ? 'show' : 'hidden'}
        variants={staggerContainer}
        className="relative grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
      >
        <div className="hidden lg:block absolute top-[2.75rem] left-[6%] right-[6%] h-px bg-gradient-to-r from-transparent via-white/25 to-transparent" aria-hidden />
        {pipeline.map((p) => (
          <motion.li key={p.step} variants={fadeUp} className="relative list-none">
            <div className="h-full rounded-3xl border border-white/[0.08] bg-[rgba(8,10,18,0.55)] backdrop-blur-xl px-5 py-6 hover:border-violet-500/30 transition-colors">
              <div className="flex items-center gap-3 mb-4">
                <span className="flex h-10 w-10 items-center justify-center rounded-full border border-amber-500/40 bg-black/40 font-mono text-xs text-amber-200 shadow-[0_0_22px_rgba(234,179,8,0.22)] relative z-[1]">
                  {p.step}
                </span>
                <p.icon className="h-6 w-6 text-blue-400/85" aria-hidden />
              </div>
              <p className="font-semibold text-white mb-2">{p.title}</p>
              <p className="text-sm text-slate-400 leading-relaxed">{p.body}</p>
            </div>
          </motion.li>
        ))}
      </motion.ol>
    </div>
  );
}

export default function Quality() {
  const { t } = useTranslation();
  const sectionRef = useRef<HTMLElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const cardsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    const ctx = gsap.context(() => {
      gsap.fromTo(
        headerRef.current,
        { y: 30, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.8,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: headerRef.current,
            start: 'top 85%',
            end: 'top 60%',
            scrub: true,
          },
        }
      );

      const cards = cardsRef.current?.querySelectorAll('.quality-card');
      if (cards) {
        gsap.fromTo(
          cards,
          { y: 40, opacity: 0 },
          {
            y: 0,
            opacity: 1,
            duration: 0.6,
            stagger: 0.15,
            ease: 'power2.out',
            scrollTrigger: {
              trigger: cardsRef.current,
              start: 'top 85%',
              end: 'top 50%',
              scrub: true,
            },
          }
        );
      }
    }, section);

    return () => ctx.revert();
  }, []);

  const features = FEATURE_ICONS.map((icon, i) => ({
    icon,
    title: t(`landing.quality.features.${i}.title`),
    description: t(`landing.quality.features.${i}.description`),
  }));

  return (
    <section ref={sectionRef} id="quality" className="relative z-20 py-20 lg:py-28" style={{ background: '#070A12' }}>
      <div className="absolute inset-0 grid-overlay opacity-45" />

      <div className="relative z-10 px-6 lg:px-12 max-w-6xl mx-auto">
        <div ref={headerRef} className="text-center mb-14">
          <span className="inline-flex items-center justify-center rounded-full border border-white/10 bg-white/[0.03] px-4 py-1.5 font-mono text-[10px] uppercase tracking-[0.24em] text-amber-200/95 mb-6">
            {t('landing.quality.badge')}
          </span>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-5 font-['Syne',sans-serif] tracking-tight">
            {t('landing.quality.title')} <span className="gradient-text">{t('landing.quality.titleHighlight')}</span>
          </h2>
          <p className="text-base sm:text-lg text-slate-400 max-w-2xl mx-auto leading-relaxed">
            {t('landing.quality.subtitle')}
          </p>
        </div>

        <div ref={cardsRef} className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
          {features.map((feature, index) => (
            <div
              key={index}
              className="quality-card group relative rounded-3xl border border-white/[0.08] bg-[rgba(10,12,22,0.55)] backdrop-blur-2xl p-7 hover:border-amber-500/40 transition-colors overflow-hidden shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]"
            >
              <div className="pointer-events-none absolute -top-24 -right-12 h-40 w-40 rounded-full bg-amber-400/14 blur-3xl group-hover:bg-amber-400/22 transition-colors" aria-hidden />
              <div className="relative mb-6 flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-[linear-gradient(145deg,rgba(234,179,8,0.16),rgba(59,130,246,0.12))] text-amber-200">
                <feature.icon className="h-6 w-6" aria-hidden />
              </div>
              <h3 className="relative text-lg font-bold text-white mb-3">{feature.title}</h3>
              <p className="relative text-sm text-slate-400 leading-relaxed">{feature.description}</p>
            </div>
          ))}
        </div>

        {/* Trust badges */}
        <div className="mt-14 flex flex-wrap items-center justify-center gap-3 sm:gap-4">
          {[
            { icon: Award, label: '≥99% purity', ring: 'from-amber-400/75 to-blue-700/55' },
            { icon: FlaskConical, label: 'HPLC verified', ring: 'from-blue-400/65 to-blue-900/55' },
            { icon: Shield, label: 'Lab-grade specs', ring: 'from-indigo-400/60 to-violet-900/55' },
            { icon: MessageCircle, label: 'Expert channels', ring: 'from-purple-400/60 to-pink-800/55' },
          ].map((b) => (
            <div
              key={b.label}
              className="inline-flex items-center gap-2 rounded-full border border-white/[0.1] bg-[rgba(8,10,18,0.65)] backdrop-blur-md px-5 py-2.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]"
            >
              <span className={`flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br ${b.ring}`}>
                <b.icon className="h-[18px] w-[18px] text-white" aria-hidden />
              </span>
              <span className="text-xs font-semibold text-slate-200">{b.label}</span>
            </div>
          ))}
        </div>

        <ResearchPipeline />
      </div>
    </section>
  );
}
