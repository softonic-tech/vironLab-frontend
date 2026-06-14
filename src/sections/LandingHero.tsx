import { motion, useReducedMotion } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import ParticleCanvas from '@/components/landing/ParticleCanvas';
import { fadeUp, staggerContainer } from '@/components/landing/motion';
import { VIRION_LOCAL_PRODUCTS } from '@/data/viron-catalog';
import { useTranslation } from '@/i18n';

const CUBE_FACE_KEYS = ['front', 'back', 'right', 'left', 'top', 'bottom'] as const;

/** Six faces of the hero cube — images from `public/` via the catalog. */
const HERO_CUBE_FACES = VIRION_LOCAL_PRODUCTS.slice(0, 6).map((p) => p.image);

function LandingHeroImageCube({ staticView }: { staticView: boolean }) {
  return (
    <div
      className={`lp-hero-cube-scene${staticView ? ' lp-hero-cube-scene--static' : ''}`}
      aria-hidden="true"
    >
      <div className="lp-hero-cube-tilt">
        <div className="lp-hero-cube-tumble">
          <div className="lp-hero-cube-tumble-inner">
            <div className="lp-hero-cube">
              {HERO_CUBE_FACES.map((src, i) => (
                <div
                  key={`${CUBE_FACE_KEYS[i]}-${src}`}
                  className={`lp-hero-cube-face lp-hero-cube-face--${CUBE_FACE_KEYS[i]}`}
                >
                  <img
                    src={src}
                    alt=""
                    className="lp-hero-cube-img"
                    width={512}
                    height={512}
                    loading="eager"
                    decoding="async"
                    draggable={false}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LandingHero() {
  const { t } = useTranslation();
  const reduce = useReducedMotion();

  const scrollToCatalog = () => {
    document.getElementById('catalog')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };
  const scrollToQuality = () => {
    document.getElementById('quality')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };
  const scrollToTrust = () => {
    document.getElementById('trust')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <section className="viron-hero lp-hero relative" aria-label={t('landing.hero.ariaLabel')}>
      <ParticleCanvas className="absolute inset-0 w-full h-[min(55vh,520px)] sm:h-[min(62vh,600px)] lg:h-full lg:top-[-5%] opacity-95 pointer-events-none z-0" />

      <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-amber-400/45 to-transparent z-[2]" aria-hidden />

      <div className="lp-hero-grid relative z-[1] !max-w-[min(1240px,100%)]">
        <motion.div
          className="lp-hero-intro"
          initial="hidden"
          animate="show"
          variants={staggerContainer}
        >
          <motion.span variants={fadeUp} className="lp-hero-eyebrow">
            {t('landing.hero.eyebrow')}
          </motion.span>
          <motion.h1 variants={fadeUp} className="lp-hero-title font-['Syne',sans-serif]">
            {t('landing.hero.title')} <span className="gradient-text">{t('landing.hero.titleHighlight')}</span>
          </motion.h1>
        </motion.div>

        <div className="lp-hero-visual">
          <div className="lp-hero-visual-stage">
            <LandingHeroImageCube staticView={!!reduce} />
          </div>
        </div>

        <motion.div
          className="lp-hero-tail"
          initial="hidden"
          animate="show"
          variants={staggerContainer}
        >
          <motion.p variants={fadeUp} className="lp-hero-lede">
            {t('landing.hero.lede')}
          </motion.p>
          <motion.div variants={fadeUp} className="lp-hero-ctas">
            <button type="button" className="btn-primary" onClick={scrollToCatalog}>
              {t('landing.hero.enterCatalog')}
            </button>
            <button type="button" className="btn-outline" onClick={scrollToQuality}>
              {t('landing.hero.qualitySystem')}
            </button>
          </motion.div>
          <motion.ul variants={fadeUp} className="lp-hero-trust" aria-label={t('landing.hero.trustMarkers')}>
            <li>
              <span className="lp-trust-dot" />
              {t('landing.hero.purity')}
            </li>
            <li>
              <span className="lp-trust-dot" />
              {t('landing.hero.hplc')}
            </li>
            <li>
              <span className="lp-trust-dot" />
              {t('landing.hero.freeShipping')}
            </li>
          </motion.ul>
        </motion.div>
      </div>

      <motion.button
        type="button"
        className="mx-auto mb-6 flex flex-col items-center gap-1 text-[11px] font-mono uppercase tracking-[0.2em] text-amber-300/75 hover:text-amber-200/95 transition-colors"
        onClick={scrollToTrust}
        aria-label={t('landing.hero.scrollToTrust')}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.9, duration: 0.5 }}
      >
        <span>{t('landing.hero.explore')}</span>
        <motion.span
          animate={reduce ? undefined : { y: [0, 6, 0] }}
          transition={reduce ? undefined : { duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
        >
          <ChevronDown className="h-5 w-5" aria-hidden />
        </motion.span>
      </motion.button>
    </section>
  );
}
