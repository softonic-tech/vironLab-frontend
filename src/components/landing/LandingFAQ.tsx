import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { ArrowUpRight } from 'lucide-react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { fadeUp, staggerContainer } from './motion';
import { useTranslation } from '@/i18n';

const FAQ_COUNT = 4;

export default function LandingFAQ() {
  const { t } = useTranslation();
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-10%' });

  const items = Array.from({ length: FAQ_COUNT }, (_, i) => ({
    q: t(`landing.faq.items.${i}.q`),
    a: t(`landing.faq.items.${i}.a`),
  }));

  return (
    <section
      id="landing-faq"
      ref={ref}
      className="relative z-20 py-16 sm:py-20 lg:py-28"
      style={{ background: 'transparent' }}
    >
      <div className="relative z-10 px-4 sm:px-6 lg:px-12 max-w-3xl mx-auto">
        <motion.div
          initial="hidden"
          animate={inView ? 'show' : 'hidden'}
          variants={staggerContainer}
          className="text-center mb-10"
        >
          <motion.p variants={fadeUp} className="font-mono text-[11px] uppercase tracking-[0.22em] text-[var(--viron-cyan)] mb-3">
            {t('landing.faq.eyebrow')}
          </motion.p>
          <motion.h2 variants={fadeUp} className="text-3xl sm:text-4xl font-bold text-[var(--viron-text)] tracking-tight">
            {t('landing.faq.title')} <span className="gradient-text">{t('landing.faq.titleHighlight')}</span>
          </motion.h2>
          <motion.p variants={fadeUp} className="mt-3 text-sm text-[var(--viron-muted)]">
            {t('landing.faq.subtitle')}
          </motion.p>
        </motion.div>

        <motion.div
          initial="hidden"
          animate={inView ? 'show' : 'hidden'}
          variants={staggerContainer}
          className="rounded-2xl sm:rounded-3xl border border-white/[0.1] bg-[rgba(8,10,18,0.72)] backdrop-blur-2xl px-3 sm:px-6 py-2 shadow-[0_0_60px_rgba(59,130,246,0.08)]"
        >
          <motion.div variants={fadeUp}>
            <Accordion type="single" collapsible className="w-full">
              {items.map((it, i) => (
                <AccordionItem
                  key={`faq-${i}`}
                  value={`item-${i}`}
                  className="border-white/[0.06] data-[state=open]:bg-white/[0.02] rounded-xl px-2"
                >
                  <AccordionTrigger className="text-left text-[15px] sm:text-base font-semibold text-[var(--viron-text)] hover:no-underline py-5 [&>svg]:text-amber-400/85">
                    {it.q}
                  </AccordionTrigger>
                  <AccordionContent className="text-sm text-[var(--viron-muted)] leading-relaxed pb-5">
                    {it.a}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </motion.div>

          <motion.div variants={fadeUp} className="flex justify-center pb-6 pt-2">
            <a
              href="/faq"
              className="inline-flex items-center gap-2 text-sm font-medium text-blue-400 hover:text-amber-200 transition-colors"
            >
              {t('landing.faq.fullFaq')}
              <ArrowUpRight className="h-4 w-4" aria-hidden />
            </a>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
