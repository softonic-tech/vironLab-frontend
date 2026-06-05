import { useCallback, useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';

/** Once per browser tab session — first paint of the home landing only. */
const SESSION_KEY = 'viron_landing_splash_seen';

/** Product shots from `/public` — surrounding the logo in a 3×3 splash grid. */
const SPLASH_IMAGES = [
  '/BPC-157.jpeg',
  '/GHK-Cu.jpeg',
  '/CJC-1295.jpeg',
  '/IPAMORELIN.jpeg',
  '/TB-500.jpeg',
  '/GLOW.jpeg',
  '/IGF-1.jpeg',
  '/TRIZEPATIDE.jpeg',
] as const;

/** Safety: dismiss if a completion callback never fires (e.g. animation quirks). */
const FALLBACK_DISMISS_MS = 4000;

/** Brief beat after tiles settle before removing overlay (no long “hold”). */
const AFTER_SETTLE_MS = 220;

/** Initial translate per grid slot — tiles fly in from screen edges & corners (0–8, center = logo). */
function enterFromSide(slot: number): { x: string; y: string } {
  switch (slot) {
    case 0:
      return { x: '-40vw', y: '-38vh' };
    case 1:
      return { x: '0vw', y: '-42vh' };
    case 2:
      return { x: '40vw', y: '-38vh' };
    case 3:
      return { x: '-44vw', y: '0vh' };
    case 5:
      return { x: '44vw', y: '0vh' };
    case 6:
      return { x: '-40vw', y: '38vh' };
    case 7:
      return { x: '0vw', y: '42vh' };
    case 8:
      return { x: '40vw', y: '38vh' };
    default:
      return { x: '0vw', y: '0vh' };
  }
}

/** Stagger order around the ring (corners & edges first feel more dynamic). */
function staggerIndex(slot: number): number {
  const order: Record<number, number> = { 0: 0, 1: 1, 2: 2, 3: 3, 5: 4, 6: 5, 7: 6, 8: 7 };
  return order[slot] ?? 0;
}

const tileSpring = {
  type: 'spring' as const,
  stiffness: 380,
  damping: 28,
  mass: 0.85,
};

const logoSpring = {
  type: 'spring' as const,
  stiffness: 280,
  damping: 22,
  mass: 0.9,
};

/**
 * Full-viewport intro: product images slide in from the sides; logo resolves in the center.
 * Respects `prefers-reduced-motion`. Session-gated (once per tab session).
 */
export default function LandingSplash() {
  const prefersReduced = useReducedMotion();
  const [visible, setVisible] = useState(false);
  const settledRef = useRef(false);

  const dismiss = useCallback(() => {
    settledRef.current = true;
    setVisible(false);
    try {
      sessionStorage.setItem(SESSION_KEY, '1');
    } catch {
      /* ignore */
    }
  }, []);

  /** Last product tile (slot 8) finishes last — then reveal landing with a tiny buffer. */
  const onEntranceSettled = useCallback(() => {
    if (settledRef.current) return;
    settledRef.current = true;
    window.setTimeout(dismiss, AFTER_SETTLE_MS);
  }, [dismiss]);

  useEffect(() => {
    if (prefersReduced) return;
    try {
      if (sessionStorage.getItem(SESSION_KEY)) return;
    } catch {
      /* ignore */
    }
    setVisible(true);
    settledRef.current = false;
  }, [prefersReduced]);

  /** Rare fallback so the overlay never sticks forever. */
  useEffect(() => {
    if (!visible || prefersReduced) return;
    const t = window.setTimeout(() => {
      if (!settledRef.current) dismiss();
    }, FALLBACK_DISMISS_MS);
    return () => clearTimeout(t);
  }, [visible, prefersReduced, dismiss]);

  useEffect(() => {
    if (!visible) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [visible]);

  let imageIdx = 0;
  const tiles = Array.from({ length: 9 }, (_, i) => {
    if (i === 4) return { type: 'logo' as const };
    const src = SPLASH_IMAGES[imageIdx % SPLASH_IMAGES.length];
    imageIdx += 1;
    return { type: 'img' as const, src, slot: i };
  });

  return (
    <AnimatePresence mode="wait">
      {visible && (
        <motion.div
          key="splash"
          role="dialog"
          aria-modal="true"
          aria-label="Welcome to VIRON"
          className="fixed inset-0 z-[100000] flex flex-col items-center justify-center overflow-hidden px-4"
          style={{
            background:
              'radial-gradient(ellipse 120% 80% at 50% 40%, rgba(15,18,40,0.97) 0%, #030308 55%, #000 100%)',
          }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        >
          {/* Brand aurora — fades up after panel */}
          <div className="pointer-events-none absolute inset-0" aria-hidden>
            <motion.div
              className="absolute -top-1/4 left-1/2 h-[70vmin] w-[70vmin] -translate-x-1/2 rounded-full bg-amber-400/15 blur-[100px]"
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.15, duration: 1, ease: 'easeOut' }}
            />
            <motion.div
              className="absolute bottom-0 right-0 h-[50vmin] w-[50vmin] translate-x-1/4 translate-y-1/4 rounded-full bg-blue-600/14 blur-[90px]"
              initial={{ opacity: 0, x: '15vw' }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.25, duration: 0.9, ease: 'easeOut' }}
            />
            <motion.div
              className="absolute top-1/3 left-0 h-[35vmin] w-[35vmin] -translate-x-1/3 rounded-full bg-red-500/10 blur-[80px]"
              initial={{ opacity: 0, x: '-12vw' }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.35, duration: 0.85, ease: 'easeOut' }}
            />
          </div>

          <motion.button
            type="button"
            onClick={dismiss}
            className="absolute right-4 top-4 z-10 rounded-full border border-white/10 bg-white/5 px-4 py-2 font-mono text-[10px] uppercase tracking-[0.2em] text-slate-400 backdrop-blur-sm transition-colors hover:border-amber-500/40 hover:text-amber-100 sm:right-8 sm:top-8"
            initial={{ opacity: 0, x: 28 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ ...tileSpring, delay: 0.55 }}
          >
            Skip
          </motion.button>

          <div className="relative z-[1] grid w-[min(92vw,400px)] grid-cols-3 grid-rows-3 gap-2 overflow-visible sm:w-[min(90vw,440px)] sm:gap-3">
            {tiles.map((cell) => {
              if (cell.type === 'logo') {
                return (
                  <motion.div
                    key="logo"
                    className="relative col-span-1 row-span-1 flex items-center justify-center overflow-visible"
                    initial={{ opacity: 0, scale: 0.2, filter: 'blur(24px)' }}
                    animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
                    transition={{ ...logoSpring, delay: 0.42 }}
                  >
                    <motion.div
                      className="pointer-events-none absolute inset-[-8px] rounded-2xl border border-amber-400/25 bg-gradient-to-br from-amber-500/15 via-transparent to-blue-500/12"
                      initial={{ opacity: 0, scale: 0.75 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ ...logoSpring, delay: 0.55 }}
                    />
                    <img
                      src="/logo.png"
                      alt="VIRON"
                      className="relative w-[min(52vw,200px)] max-w-[220px] object-contain drop-shadow-[0_0_48px_rgba(234,179,8,0.4)]"
                      width={220}
                      height={80}
                      draggable={false}
                    />
                  </motion.div>
                );
              }

              const from = enterFromSide(cell.slot);
              const si = staggerIndex(cell.slot);
              return (
                <motion.div
                  key={`${cell.src}-${cell.slot}`}
                  className="relative aspect-square overflow-hidden rounded-xl border border-white/[0.12] bg-black/40 shadow-[0_16px_48px_rgba(0,0,0,0.55)]"
                  initial={{
                    opacity: 0,
                    x: from.x,
                    y: from.y,
                    scale: 0.86,
                    rotate: cell.slot % 2 === 0 ? -6 : 6,
                  }}
                  animate={{
                    opacity: 1,
                    x: 0,
                    y: 0,
                    scale: 1,
                    rotate: 0,
                  }}
                  transition={{
                    ...tileSpring,
                    delay: 0.05 + si * 0.07,
                  }}
                  onAnimationComplete={
                    cell.slot === 8
                      ? () => {
                          onEntranceSettled();
                        }
                      : undefined
                  }
                >
                  <img
                    src={cell.src}
                    alt=""
                    className="h-full w-full object-cover"
                    loading="eager"
                    decoding="async"
                  />
                  <div
                    className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/55 to-transparent opacity-75"
                    aria-hidden
                  />
                </motion.div>
              );
            })}
          </div>

          <motion.p
            className="relative z-[1] mt-8 max-w-sm text-center font-mono text-[10px] uppercase tracking-[0.35em] text-slate-500"
            initial={{ opacity: 0, y: 22 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.95, duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
          >
            Research-grade peptides
          </motion.p>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
