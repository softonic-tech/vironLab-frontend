import { useEffect, useRef, useState } from 'react';
import { motion, useInView, useReducedMotion } from 'framer-motion';
import { Microscope, ShieldCheck, Truck, Zap } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { fadeUp, staggerContainer } from './motion';

function useCountUp(target: number, durationMs: number, enabled: boolean, decimals = 0) {
  const [v, setV] = useState(0);
  useEffect(() => {
    if (!enabled) {
      setV(target);
      return;
    }
    const start = performance.now();
    let raf = 0;
    const step = (now: number) => {
      const t = Math.min(1, (now - start) / durationMs);
      const eased = 1 - (1 - t) ** 3;
      setV(Number((target * eased).toFixed(decimals)));
      if (t < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [target, durationMs, enabled, decimals]);
  return v;
}

const metrics = [
  {
    icon: Microscope,
    value: 99,
    prefix: '',
    suffix: '%',
    decimals: 0,
    label: 'Purity floor',
    sub: 'Batch HPLC identity & purity',
  },
  {
    icon: ShieldCheck,
    value: 3,
    prefix: '',
    suffix: '',
    decimals: 0,
    label: 'QC gates',
    sub: 'Documentation you can trace',
  },
  {
    icon: Truck,
    value: 2500,
    prefix: '',
    suffix: ' SEK',
    decimals: 0,
    label: 'Free shipping',
    sub: 'Standard shipping threshold',
  },
  {
    icon: Zap,
    value: 30,
    prefix: '',
    suffix: '',
    decimals: 0,
    label: 'Day cold stability',
    sub: 'Post-reconstitution guidance',
  },
] as const;

export default function TrustMetrics() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-12%' });
  const reduced = useReducedMotion();

  return (
    <section
      id="trust"
      ref={ref}
      className="relative z-20 py-16 sm:py-20 lg:py-24"
      style={{ background: 'transparent' }}
    >
      <div className="absolute inset-0 pointer-events-none opacity-[0.35] grid-overlay" />
      <div className="relative z-10 px-4 sm:px-6 lg:px-12 max-w-6xl mx-auto">
        <motion.div
          initial="hidden"
          animate={inView ? 'show' : 'hidden'}
          variants={staggerContainer}
          className="text-center mb-10 sm:mb-14"
        >
          <motion.p variants={fadeUp} className="font-mono text-[11px] uppercase tracking-[0.22em] text-[var(--viron-cyan)] mb-3">
            Signal you can measure
          </motion.p>
          <motion.h2 variants={fadeUp} className="text-3xl sm:text-4xl md:text-5xl font-bold text-[var(--viron-text)] tracking-tight">
            Built for <span className="gradient-text">precision labs</span>
          </motion.h2>
          <motion.p variants={fadeUp} className="mt-4 text-sm sm:text-base text-[var(--viron-muted)] max-w-2xl mx-auto leading-relaxed">
            Every interaction is designed to reduce friction from discovery to documentation—without compromising compliance narrative.
          </motion.p>
        </motion.div>

        <motion.div
          initial="hidden"
          animate={inView ? 'show' : 'hidden'}
          variants={staggerContainer}
          className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4"
        >
          {metrics.map((m) => (
            <MetricCard key={m.label} {...m} active={inView && !reduced} reduced={reduced} />
          ))}
        </motion.div>
      </div>
    </section>
  );
}

function MetricCard({
  icon: Icon,
  value,
  prefix = '',
  suffix,
  decimals,
  label,
  sub,
  active,
  reduced,
}: {
  icon: LucideIcon;
  value: number;
  prefix?: string;
  suffix: string;
  decimals: number;
  label: string;
  sub: string;
  active: boolean;
  reduced: boolean | null;
}) {
  const n = useCountUp(value, 1400, Boolean(active));
  const display = reduced ? value : n;
  return (
    <motion.div
      variants={fadeUp}
      whileHover={{ y: -4, transition: { type: 'spring', stiffness: 400, damping: 24 } }}
      className="group relative rounded-2xl sm:rounded-3xl p-4 sm:p-6 border border-white/[0.08] bg-[rgba(12,14,22,0.55)] backdrop-blur-xl shadow-[0_0_0_1px_rgba(234,179,8,0.08),inset_0_1px_0_rgba(255,255,255,0.06)] overflow-hidden"
    >
      <div
        className="absolute -right-6 -top-6 h-24 w-24 rounded-full opacity-40 blur-2xl bg-[radial-gradient(circle_at_center,rgba(59,130,246,0.5),transparent_70%)] group-hover:opacity-70 transition-opacity"
        aria-hidden
      />
      <div className="relative flex items-center gap-2 mb-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-amber-500/25 bg-gradient-to-br from-amber-500/18 to-blue-600/10 text-amber-200">
          <Icon className="h-5 w-5" aria-hidden />
        </div>
      </div>
      <p className="relative font-mono text-2xl sm:text-3xl font-bold tracking-tight text-white tabular-nums">
        <span className="text-amber-300/90">{prefix}</span>
        {display.toLocaleString(undefined, { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}
        <span className="text-violet-300/90">{suffix}</span>
      </p>
      <p className="relative mt-2 text-sm font-semibold text-[var(--viron-text-soft)]">{label}</p>
      <p className="relative mt-1 text-xs text-[var(--viron-muted)] leading-snug">{sub}</p>
    </motion.div>
  );
}
