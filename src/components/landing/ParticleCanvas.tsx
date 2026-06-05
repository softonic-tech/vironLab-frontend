import { useEffect, useRef } from 'react';
import { useReducedMotion } from 'framer-motion';

type Particle = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  /** 0 = gold, 1 = blue, 2 = red — matches logo DNA palette */
  c: number;
};

/** Logo-inspired accents: metallic gold, DNA blue, signal red */
const ACCENTS = [
  { r: 250, g: 204, b: 21 },
  { r: 59, g: 130, b: 246 },
  { r: 248, g: 113, b: 113 },
] as const;

/** Lightweight canvas molecule field — cosmetic only */
export default function ParticleCanvas({ className = '' }: { className?: string }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const reduced = useReducedMotion();

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas || reduced) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let raf = 0;
    let particles: Particle[] = [];

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const { clientWidth: w, clientHeight: h } = canvas;
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      particles = Array.from({ length: 42 }, (_, i) => ({
        x: Math.random() * w,
        y: Math.random() * h,
        vx: (Math.random() - 0.5) * 0.35,
        vy: (Math.random() - 0.5) * 0.35,
        r: Math.random() * 1.2 + 0.4,
        c: i % 3,
      }));
    };

    const ro = new ResizeObserver(resize);
    ro.observe(canvas);
    resize();

    const tick = () => {
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      ctx.clearRect(0, 0, w, h);

      for (const p of particles) {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0 || p.x > w) p.vx *= -1;
        if (p.y < 0 || p.y > h) p.vy *= -1;
      }

      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const a = particles[i];
          const b = particles[j];
          const dx = a.x - b.x;
          const dy = a.y - b.y;
          const d = Math.hypot(dx, dy);
          if (d < 88) {
            const ca = ACCENTS[a.c];
            const cb = ACCENTS[b.c];
            const alpha = 0.11 * (1 - d / 88);
            ctx.strokeStyle = `rgba(${Math.round((ca.r + cb.r) / 2)}, ${Math.round((ca.g + cb.g) / 2)}, ${Math.round((ca.b + cb.b) / 2)}, ${alpha})`;
            ctx.lineWidth = 0.6;
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.stroke();
          }
        }
      }

      for (const p of particles) {
        const col = ACCENTS[p.c];
        const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r * 4);
        g.addColorStop(0, `rgba(${col.r}, ${col.g}, ${col.b}, 0.5)`);
        g.addColorStop(1, `rgba(${col.r}, ${col.g}, ${col.b}, 0)`);
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r * 3, 0, Math.PI * 2);
        ctx.fill();
      }

      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, [reduced]);

  return (
    <canvas
      ref={ref}
      className={className}
      aria-hidden
      style={reduced ? { display: 'none' } : undefined}
    />
  );
}
