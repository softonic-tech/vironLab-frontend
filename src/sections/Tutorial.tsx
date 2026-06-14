import { useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { motion } from 'framer-motion';
import { Droplets, Syringe, RotateCw, Calculator, Beaker, Sparkles } from 'lucide-react';
import { useTranslation } from '@/i18n';

gsap.registerPlugin(ScrollTrigger);

const STEP_DEFS = [
  { number: '01', icon: Droplets },
  { number: '02', icon: Syringe },
  { number: '03', icon: RotateCw },
] as const;

// Reconstitution Calculator Component
function ReconstitutionCalculator() {
  const { t } = useTranslation();
  const [peptideAmount, setPeptideAmount] = useState<number>(5);
  const [bacWater, setBacWater] = useState<number>(1);
  const [desiredDose, setDesiredDose] = useState<number>(0.25);
  
  // Calculate concentration: mg peptide / mL BAC water
  const concentration = peptideAmount / bacWater; // mg/mL
  
  // Calculate volume to draw for desired dose
  const volumeToDraw = desiredDose / concentration; // mL
  
  // Calculate units on insulin syringe (100 units = 1 mL)
  const unitsOnSyringe = volumeToDraw * 100;
  
  // Calculate total doses per vial
  const totalDoses = Math.floor(peptideAmount / desiredDose);

  const inp =
    'w-full rounded-xl border border-white/[0.1] bg-[rgba(6,8,14,0.85)] px-3 py-3 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-400/35 focus:border-amber-400/40 transition-[box-shadow,border-color] shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] tabular-nums';

  return (
    <motion.div
      layout
      className="viron-calc-shell mt-10 relative overflow-hidden rounded-3xl border border-amber-500/25 bg-[linear-gradient(145deg,rgba(10,14,28,0.92),rgba(14,10,34,0.88))] p-6 sm:p-8 shadow-[0_0_60px_rgba(59,130,246,0.12)]"
    >
      <div className="pointer-events-none absolute -right-20 -top-20 h-48 w-48 rounded-full bg-amber-400/15 blur-3xl" aria-hidden />
      <div className="pointer-events-none absolute -left-16 bottom-0 h-40 w-40 rounded-full bg-violet-500/15 blur-3xl" aria-hidden />

      <div className="relative flex flex-col sm:flex-row sm:items-center gap-4 sm:justify-between mb-8">
        <div className="flex items-start gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] shadow-[0_0_30px_rgba(234,179,8,0.18)]">
            <Calculator className="h-7 w-7 text-amber-300" aria-hidden />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Sparkles className="h-4 w-4 text-violet-300" aria-hidden />
              <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-amber-400/85">{t('landing.tutorial.calcEyebrow')}</span>
            </div>
            <h3 className="text-xl sm:text-2xl font-bold text-white tracking-tight">{t('landing.tutorial.calcTitle')}</h3>
            <p className="text-sm text-slate-400 mt-1">{t('landing.tutorial.calcSubtitle')}</p>
          </div>
        </div>
        <Beaker className="hidden xl:block h-10 w-10 text-slate-600/70" aria-hidden />
      </div>

      <div className="relative grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="space-y-2">
          <label className="text-xs font-mono uppercase tracking-wider text-slate-500 block">{t('landing.tutorial.peptideAmount')}</label>
          <div className="flex items-center gap-2">
            <input
              type="number"
              value={peptideAmount}
              onChange={(e) => setPeptideAmount(Math.max(0.1, parseFloat(e.target.value) || 0))}
              className={inp}
              step="0.1"
              min="0.1"
              aria-label={t('landing.tutorial.peptideAria')}
            />
            <span className="text-xs font-mono text-amber-500/70 shrink-0">mg</span>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-mono uppercase tracking-wider text-slate-500 block">{t('landing.tutorial.bacWater')}</label>
          <div className="flex items-center gap-2">
            <input
              type="number"
              value={bacWater}
              onChange={(e) => setBacWater(Math.max(0.1, parseFloat(e.target.value) || 0))}
              className={inp}
              step="0.1"
              min="0.1"
              aria-label={t('landing.tutorial.bacAria')}
            />
            <span className="text-xs font-mono text-amber-500/70 shrink-0">mL</span>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-mono uppercase tracking-wider text-slate-500 block">{t('landing.tutorial.desiredDose')}</label>
          <div className="flex items-center gap-2">
            <input
              type="number"
              value={desiredDose}
              onChange={(e) => setDesiredDose(Math.max(0.01, parseFloat(e.target.value) || 0))}
              className={inp}
              step="0.01"
              min="0.01"
              aria-label={t('landing.tutorial.doseAria')}
            />
            <span className="text-xs font-mono text-amber-500/70 shrink-0">mg</span>
          </div>
        </div>
      </div>

      <div className="relative grid grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
        {[
          {
            title: t('landing.tutorial.concentration'),
            value: concentration.toFixed(2),
            unit: 'mg/mL',
            ring: 'from-amber-400/70 to-blue-600/60',
          },
          {
            title: t('landing.tutorial.volumeToDraw'),
            value: volumeToDraw.toFixed(3),
            unit: 'mL',
            ring: 'from-blue-400/65 to-indigo-600/55',
          },
          {
            title: t('landing.tutorial.syringeUnits'),
            value: unitsOnSyringe.toFixed(1),
            unit: t('landing.tutorial.units'),
            ring: 'from-violet-400/65 to-purple-700/55',
          },
          {
            title: t('landing.tutorial.dosesPerVial'),
            value: String(totalDoses),
            unit: t('landing.tutorial.doses'),
            ring: 'from-amber-400/60 to-blue-600/55',
          },
        ].map((r) => (
          <motion.div
            key={r.title}
            className="relative rounded-2xl border border-white/[0.1] bg-[rgba(6,8,14,0.75)] px-4 py-4 backdrop-blur-md overflow-hidden"
            whileHover={{ y: -2 }}
          >
            <div
              className={`pointer-events-none absolute inset-px rounded-[15px] opacity-50 bg-gradient-to-br ${r.ring} blur-xl`}
              aria-hidden
            />
            <p className="relative text-[10px] uppercase tracking-[0.16em] text-slate-500 mb-2 font-mono">{r.title}</p>
            <p className="relative font-mono text-lg sm:text-xl font-semibold tracking-tight text-white">
              {r.value}{' '}
              <span className="text-xs font-normal text-slate-400">{r.unit}</span>
            </p>
          </motion.div>
        ))}
      </div>

      <div className="relative pt-6 border-t border-white/[0.08]">
        <p className="text-xs font-mono uppercase tracking-wider text-slate-500 mb-3">Quick presets</p>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => { setPeptideAmount(5); setBacWater(1); setDesiredDose(0.25); }}
            className="rounded-full border border-amber-500/25 bg-amber-500/10 px-4 py-2 text-xs font-medium text-amber-200 hover:bg-amber-500/20 hover:border-amber-400/40 transition-colors"
          >
            5mg + 1mL @ 250mcg
          </button>
          <button
            type="button"
            onClick={() => { setPeptideAmount(10); setBacWater(2); setDesiredDose(0.5); }}
            className="rounded-full border border-blue-500/25 bg-blue-500/10 px-4 py-2 text-xs font-medium text-blue-200 hover:bg-blue-500/20 transition-colors"
          >
            10mg + 2mL @ 500mcg
          </button>
          <button
            type="button"
            onClick={() => { setPeptideAmount(2); setBacWater(1); setDesiredDose(0.1); }}
            className="rounded-full border border-violet-500/25 bg-violet-500/10 px-4 py-2 text-xs font-medium text-violet-200 hover:bg-violet-500/20 transition-colors"
          >
            2mg + 1mL @ 100mcg
          </button>
        </div>
      </div>
    </motion.div>
  );
}

export default function Tutorial() {
  const { t } = useTranslation();
  const sectionRef = useRef<HTMLElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const stepsRef = useRef<HTMLDivElement>(null);

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

      const stepCards = stepsRef.current?.querySelectorAll('.step-card');
      if (stepCards) {
        gsap.fromTo(
          stepCards,
          { y: 40, opacity: 0 },
          {
            y: 0,
            opacity: 1,
            duration: 0.6,
            stagger: 0.15,
            ease: 'power2.out',
            scrollTrigger: {
              trigger: stepsRef.current,
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

  const steps = STEP_DEFS.map((step, i) => ({
    ...step,
    title: t(`landing.tutorial.steps.${i}.title`),
    description: t(`landing.tutorial.steps.${i}.description`),
  }));

  return (
    <section
      ref={sectionRef}
      id="tutorial"
      className="relative z-30 py-20 lg:py-28"
      style={{ background: '#070A12' }}
    >
      {/* Grid Overlay */}
      <div className="absolute inset-0 grid-overlay opacity-60" />

      <div className="relative z-10 px-6 lg:px-12 max-w-5xl mx-auto">
        <div ref={headerRef}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-10%' }}
            transition={{ duration: 0.5 }}
            className="text-center mb-12 sm:mb-14"
          >
            <span className="inline-flex items-center rounded-full border border-amber-500/25 bg-amber-500/5 px-4 py-1.5 font-mono text-[10px] uppercase tracking-[0.24em] text-amber-300 mb-6">
              {t('landing.tutorial.eyebrow')}
            </span>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-5 font-['Syne',sans-serif] tracking-tight">
              {t('landing.tutorial.title')} <span className="gradient-text">{t('landing.tutorial.titleHighlight')}</span>
            </h2>
            <p className="text-base sm:text-lg text-slate-400 max-w-xl mx-auto leading-relaxed">
              {t('landing.tutorial.subtitle')}
            </p>
          </motion.div>
        </div>

        {/* Steps */}
        <div ref={stepsRef} className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
          {steps.map((step, index) => (
            <motion.div
              key={step.title}
              className="step-card group relative rounded-3xl border border-white/[0.08] bg-[rgba(8,10,18,0.55)] backdrop-blur-xl px-6 py-8 text-center shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] hover:border-amber-500/35 transition-colors"
              whileHover={{ y: -6 }}
              transition={{ type: 'spring', stiffness: 380, damping: 22 }}
            >
              {/* Step Number */}
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-gradient-to-r from-amber-300 to-blue-500 text-[#050508] text-xs font-bold tracking-wide shadow-[0_0_20px_rgba(234,179,8,0.35)]">
                Step {step.number}
              </div>

              {/* Icon */}
              <div className="mt-4 w-16 h-16 mx-auto rounded-2xl border border-amber-400/25 bg-[linear-gradient(160deg,rgba(234,179,8,0.14),rgba(59,130,246,0.1))] flex items-center justify-center mb-4 group-hover:shadow-[0_0_26px_rgba(234,179,8,0.2)] transition-shadow">
                <step.icon className="w-8 h-8 text-amber-300" />
              </div>

              {/* Content */}
              <h3 className="text-lg font-bold text-white mb-2">{step.title}</h3>
              <p className="text-sm text-slate-400 leading-snug">{step.description}</p>
            </motion.div>
          ))}
        </div>

        {/* Note */}
        <div className="mt-10 rounded-2xl border border-amber-500/25 bg-[rgba(6,20,26,0.45)] backdrop-blur-md px-4 py-4 sm:p-5">
          <p className="text-center text-sm text-slate-400 leading-relaxed">
            <span className="text-amber-300 font-semibold">Note:</span> Always use bacteriostatic water (BAC) for reconstitution. Store reconstituted
            peptides at 2–8°C and use within 30 days for optimal stability.
          </p>
        </div>

        {/* Reconstitution Calculator */}
        <ReconstitutionCalculator />
      </div>
    </section>
  );
}
