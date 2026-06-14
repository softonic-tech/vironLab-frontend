import { useEffect, useMemo, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { motion } from 'framer-motion';
import { Star, ThumbsUp, CheckCircle } from 'lucide-react';
import { getHomepageReviews, type HomepageReviewRow } from '@/lib/supabase-db';
import { useTranslation } from '@/i18n';

gsap.registerPlugin(ScrollTrigger);

interface HomepageReview {
  id: string;
  title?: string;
  product_name?: string;
  rating: number;
  comment: string;
  is_verified_purchase: boolean;
  helpful_count?: number;
}

function useReviewsPerView() {
  const [n, setN] = useState(4);
  useEffect(() => {
    const update = () => {
      const w = window.innerWidth;
      setN(w < 640 ? 1 : w < 1024 ? 2 : 4);
    };
    update();
    window.addEventListener('resize', update, { passive: true });
    return () => window.removeEventListener('resize', update);
  }, []);
  return n;
}

export default function Reviews() {
  const { t } = useTranslation();
  const sectionRef = useRef<HTMLElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const [reviews, setReviews] = useState<HomepageReview[]>([]);
  const [totalVerifiedReviews, setTotalVerifiedReviews] = useState<number>(0);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const autoPlayRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const reviewsPerView = useReviewsPerView();

  const maxIndex = useMemo(
    () => Math.max(0, reviews.length - reviewsPerView),
    [reviews.length, reviewsPerView]
  );

  useEffect(() => {
    getHomepageReviews()
      .then((data: HomepageReviewRow[]) => {
        const rows: HomepageReview[] = data.map((row) => ({
          id: row.id,
          title: row.title || '',
          product_name: row.products?.name || t('landing.reviews.defaultProduct'),
          rating: Math.max(1, Math.min(5, Number(row.rating) || 5)),
          comment: row.comment || '',
          is_verified_purchase: Boolean(row.is_verified_purchase),
          helpful_count: Number(row.helpful_count) || 0,
        }));
        setReviews(rows);
        setTotalVerifiedReviews(rows.filter((r) => r.is_verified_purchase).length);
      })
      .catch((err) => console.error('Failed to load homepage reviews:', err));
  }, [t]);

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
    }, section);

    return () => ctx.revert();
  }, []);

  useEffect(() => {
    if (!isAutoPlaying) return;

    autoPlayRef.current = setInterval(() => {
      setCurrentIndex((prev) => (prev >= maxIndex ? 0 : prev + 1));
    }, 4500);

    return () => {
      if (autoPlayRef.current) clearInterval(autoPlayRef.current);
    };
  }, [isAutoPlaying, maxIndex]);

  useEffect(() => {
    setCurrentIndex((prev) => Math.min(prev, maxIndex));
  }, [maxIndex]);

  const averageRating = reviews.length
    ? (reviews.reduce((sum, r) => sum + (Number(r.rating) || 0), 0) / reviews.length).toFixed(1)
    : '5.0';

  const edgeFadeStyle = 'linear-gradient(to right, rgba(5,8,23,1) 0%, transparent 100%)';

  return (
    <section ref={sectionRef} id="reviews" className="relative z-30 py-20 lg:py-28" style={{ background: '#070A12' }}>
      <div className="absolute inset-0 opacity-55 grid-overlay" />

      <div className="relative z-10 px-6 lg:px-12">
        <div ref={headerRef} className="text-center mb-14">
          <motion.span
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="inline-flex rounded-full border border-white/10 px-4 py-1.5 font-mono text-[10px] uppercase tracking-[0.26em] text-amber-200/90 mb-5"
          >
            {t('landing.reviews.eyebrow')}
          </motion.span>
          <motion.h2
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.05 }}
            className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-6 font-['Syne',sans-serif] tracking-tight"
          >
            {t('landing.reviews.title')} <span className="gradient-text">{t('landing.reviews.titleHighlight')}</span>
          </motion.h2>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-6 mb-10">
            <div className="flex items-center gap-3 px-6 py-3 rounded-2xl border border-white/[0.1] bg-[rgba(10,12,22,0.55)] backdrop-blur-xl shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]">
              <span className="text-4xl font-bold tabular-nums text-white">{averageRating}</span>
              <div className="flex">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-5 h-5 fill-amber-400 text-amber-400" aria-hidden />
                ))}
              </div>
            </div>
            <div className="h-10 w-px bg-white/[0.12] hidden sm:block" />
            <div className="flex items-center gap-2 text-slate-400">
              <CheckCircle className="w-6 h-6 text-emerald-400" aria-hidden />
              <span>
                (<span className="text-emerald-300 font-semibold">{totalVerifiedReviews}</span>) {t('landing.reviews.verifiedPurchases')}
              </span>
            </div>
          </div>
        </div>

        <div className="relative max-w-[1400px] mx-auto">
          <div className="hidden lg:block absolute left-0 top-0 bottom-0 w-16 z-[2] pointer-events-none" style={{ background: edgeFadeStyle }} />
          <div className="hidden lg:block absolute right-0 top-0 bottom-0 w-16 z-[2] pointer-events-none" style={{ background: edgeFadeStyle, transform: 'scaleX(-1)' }} />

          <div className="overflow-hidden pb-3">
            <div
              className="flex transition-transform duration-500 ease-out"
              style={{ transform: `translateX(-${currentIndex * (100 / reviewsPerView)}%)` }}
            >
              {reviews.map((review) => (
                <div key={review.id} className="w-full sm:w-1/2 lg:w-1/4 flex-shrink-0 px-3">
                  <motion.div
                    whileHover={{ y: -6, transition: { type: 'spring', stiffness: 360, damping: 22 } }}
                    className="h-full rounded-3xl border border-white/[0.1] bg-[linear-gradient(165deg,rgba(14,18,38,0.85),rgba(8,10,18,0.78))] p-6 backdrop-blur-2xl shadow-[0_28px_60px_rgba(0,0,0,0.45),inset_0_1px_0_rgba(255,255,255,0.06)]"
                  >
                    <div className="flex items-start justify-between gap-3 mb-5">
                      <div>
                        <h4 className="font-semibold text-white">{review.title || t('landing.reviews.verifiedInsight')}</h4>
                        <p className="text-xs uppercase tracking-[0.12em] text-violet-300/85 mt-1">{review.product_name}</p>
                      </div>
                      {review.is_verified_purchase && (
                        <div className="flex items-center gap-1 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-400/35 text-emerald-300 shrink-0">
                          <CheckCircle className="w-3.5 h-3.5" aria-hidden />
                          <span className="text-[10px] font-semibold tracking-wide uppercase">{t('landing.reviews.verified')}</span>
                        </div>
                      )}
                    </div>

                    <div className="flex gap-0.5 mb-4">
                      {[...Array(review.rating)].map((_, i) => (
                        <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" aria-hidden />
                      ))}
                    </div>

                    <p className="text-sm text-slate-300 mb-8 leading-relaxed line-clamp-6">“{review.comment}”</p>

                    <div className="flex items-center justify-between pt-5 border-t border-white/[0.08] mt-auto">
                      <div className="text-xs text-slate-500 uppercase tracking-[0.16em]">Signal share</div>
                      <div className="flex items-center gap-1 text-slate-400">
                        <ThumbsUp className="w-4 h-4 text-amber-300/85" aria-hidden />
                        <span className="text-sm font-semibold">{review.helpful_count || 0}</span>
                      </div>
                    </div>
                  </motion.div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-center gap-3 mt-4">
            {maxIndex <= 0
              ? null
              : [...Array(maxIndex + 1)].map((_, i) => (
                  <button
                    key={`dot-${i}`}
                    type="button"
                    onClick={() => {
                      setIsAutoPlaying(false);
                      setCurrentIndex(i);
                    }}
                    className={`h-2 rounded-full transition-all duration-300 ${
                      i === currentIndex ? 'w-9 bg-gradient-to-r from-amber-400 to-blue-500' : 'w-2 bg-white/25 hover:bg-white/40'
                    }`}
                    aria-label={t('landing.reviews.showSlide', { n: i + 1 })}
                  />
                ))}
          </div>
        </div>
      </div>
    </section>
  );
}
