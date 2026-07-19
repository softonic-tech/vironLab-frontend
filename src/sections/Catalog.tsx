import { useEffect, useMemo, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { motion } from 'framer-motion';
import { Search, MessageCircle } from 'lucide-react';
import ProductCard from '@/components/ProductCard';
import { VIRION_LOCAL_PRODUCTS } from '@/data/viron-catalog';
import { loadProductsFromSupabase } from '@/lib/supabase-db';
import { getSiteSetting, DEFAULT_DISCOUNT_SETTINGS, DEFAULT_SUPPORT_LINKS, type DiscountSettings } from '@/lib/settings';
import type { Product } from '@/products';
import { Skeleton } from '@/components/ui/skeleton';
import { useTranslation } from '@/i18n';

gsap.registerPlugin(ScrollTrigger);

/** Normalised category key + stable heading text from admin `category` (slug or label). */
function categoryKeyFromProduct(p: Product): string {
  return String(p.category ?? '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-') || 'shop';
}

function formatCategoryHeading(categoryKey: string): string {
  const s = categoryKey.trim() || 'shop';
  return s
    .split(/[-_\s]+/)
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ');
}

/** Keys that should render as the first catalog section (landing page). */
function isBestSellerCategoryKey(key: string): boolean {
  const k = key.toLowerCase().replace(/[-_\s]+/g, '');
  return (
    k === 'bestseller' ||
    k === 'bestsellers' ||
    k.startsWith('bestseller') ||
    key.toLowerCase() === 'best-seller'
  );
}

export default function Catalog() {
  const { t } = useTranslation();
  const sectionRef = useRef<HTMLElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [discountSettings, setDiscountSettings] = useState<DiscountSettings>(DEFAULT_DISCOUNT_SETTINGS);
  const [whatsappLink, setWhatsappLink] = useState(DEFAULT_SUPPORT_LINKS.whatsapp_link);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    Promise.all([
      loadProductsFromSupabase(),
      getSiteSetting('discount_settings', DEFAULT_DISCOUNT_SETTINGS),
      getSiteSetting<{ url: string }>('whatsapp_link', { url: DEFAULT_SUPPORT_LINKS.whatsapp_link }),
    ])
      .then(([dbProducts, discount, whatsapp]) => {
        if (!cancelled) {
          setProducts(dbProducts.length > 0 ? dbProducts : VIRION_LOCAL_PRODUCTS);
          setDiscountSettings(discount);
          setWhatsappLink(whatsapp?.url || '');
        }
      })
      .catch((err) => {
        if (!cancelled) {
          console.error('Error loading storefront settings:', err);
          setError('Failed to load storefront settings.');
          setProducts(VIRION_LOCAL_PRODUCTS);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (loading || products.length === 0) return;

    let ctx: gsap.Context | null = null;
    let cancelled = false;

    const start = () => {
      if (cancelled) return;
      const section = sectionRef.current;
      const header = headerRef.current;
      const grid = gridRef.current;
      if (!section || !header || !grid) return;

      const cards = grid.querySelectorAll('.pc');
      if (cards.length === 0) return;

      ctx = gsap.context(() => {
        gsap.fromTo(
          header,
          { y: '6vh', opacity: 0 },
          {
            y: 0,
            opacity: 1,
            duration: 0.8,
            ease: 'power2.out',
            scrollTrigger: {
              trigger: header,
              start: 'top 80%',
              end: 'top 55%',
              scrub: true,
            },
          }
        );

        gsap.fromTo(
          cards,
          { y: '10vh', opacity: 0, scale: 0.98 },
          {
            y: 0,
            opacity: 1,
            scale: 1,
            duration: 0.6,
            stagger: 0.08,
            ease: 'power2.out',
            scrollTrigger: {
              trigger: grid,
              start: 'top 85%',
              end: 'top 50%',
              scrub: true,
            },
          }
        );
      }, section);
    };

    const id = requestAnimationFrame(start);

    return () => {
      cancelled = true;
      cancelAnimationFrame(id);
      ctx?.revert();
    };
  }, [products.length, loading]);

  const filteredProducts = products.filter((product) => {
    const matchesSearch =
      searchQuery === '' ||
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  /** Preserve API order (`display_order` from admin). Search only hides rows — does not reshuffle. */
  const displayProducts = filteredProducts;

  /** Group into category sections; category block order follows first appearance in admin sort. */
  const productsByCategory = useMemo(() => {
    const order: string[] = [];
    const map = new Map<string, Product[]>();
    for (const p of displayProducts) {
      const key = categoryKeyFromProduct(p);
      if (!map.has(key)) {
        map.set(key, []);
        order.push(key);
      }
      map.get(key)!.push(p);
    }
    const sortedOrder = [...order].sort((a, b) => {
      const aBs = isBestSellerCategoryKey(a) ? 0 : 1;
      const bBs = isBestSellerCategoryKey(b) ? 0 : 1;
      if (aBs !== bBs) return aBs - bBs;
      return order.indexOf(a) - order.indexOf(b);
    });
    return { order: sortedOrder, map };
  }, [displayProducts]);

  return (
    <section
      ref={sectionRef}
      id="catalog"
      className="relative z-60 py-16 lg:py-24"
      style={{ background: '#070A12' }}
    >
      {/* Grid Overlay */}
      <div className="absolute inset-0 grid-overlay opacity-60" />

      <div className="relative z-10 px-4 sm:px-6 lg:px-12">
        {whatsappLink ? (
          <motion.div className="flex flex-wrap items-center justify-start gap-3 mb-5 sm:mb-7">
            <a
              href={whatsappLink}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-[rgba(34,197,94,0.15)] border border-[rgba(34,197,94,0.3)] hover:bg-[rgba(34,197,94,0.25)] hover:border-[rgba(34,197,94,0.5)] transition-all"
            >
              <MessageCircle className="w-4 h-4 text-[#22C55E]" />
              <span className="text-xs font-medium text-[#F4F6FA]">{t('landing.catalog.whatsappSupport')}</span>
            </a>
          </motion.div>
        ) : null}

        {/* Header */}
        <div ref={headerRef} className="mb-8">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-4 font-['Syne',sans-serif] tracking-tight">
            {t('landing.catalog.title')} <span className="gradient-text">{t('landing.catalog.titleHighlight')}</span>
          </h2>

          {/* Search */}
          <div className="relative max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="text"
              placeholder={t('landing.catalog.searchPlaceholder')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-11 pr-4 py-3.5 rounded-full bg-[rgba(8,10,18,0.72)] border border-white/[0.1] text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-400/35 focus:border-amber-400/50 transition-colors backdrop-blur-md"
            />
          </div>
        </div>

        {/* Products Grid */}
        <div ref={gridRef} className="space-y-12">
          {loading && (
            <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-6">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="rounded-2xl bg-[rgba(17,24,39,0.6)] border border-[rgba(244,246,250,0.08)] overflow-hidden flex flex-col">
                  {/* Square image area — matches ProductCard aspect-ratio: 1/1 */}
                  <div className="p-1.5 sm:p-2.5">
                    <Skeleton className="w-full aspect-square rounded-xl" />
                  </div>
                  {/* Body */}
                  <div className="px-2 pb-2 pt-1 sm:px-3 sm:pb-3 sm:pt-1.5 space-y-2 flex flex-col flex-1">
                    {/* Name */}
                    <Skeleton className="h-3.5 sm:h-5 w-4/5 rounded" />
                    {/* Stars row */}
                    <Skeleton className="h-2.5 sm:h-3 w-1/2 rounded" />
                    {/* Stock + dosage pill */}
                    <Skeleton className="h-7 sm:h-8 w-full rounded-lg" />
                    {/* Price */}
                    <Skeleton className="h-5 sm:h-7 w-1/3 rounded" />
                    {/* CTA button */}
                    <Skeleton className="h-8 sm:h-9 w-full rounded-xl mt-auto" />
                  </div>
                </div>
              ))}
            </div>
          )}
          {error && (
            <div className="text-center py-16">
              <p className="text-[#EF4444] mb-2">{error}</p>
              <button
                onClick={() => window.location.reload()}
                className="text-amber-400 hover:text-amber-300 hover:underline"
              >
                {t('landing.catalog.retry')}
              </button>
            </div>
          )}
          {!loading && !error && products.length === 0 && (
            <div className="text-center py-16">
              <p className="text-[#A9B3C7] text-lg">{t('landing.catalog.noProducts')}</p>
            </div>
          )}
          {!loading && !error && products.length > 0 && (
            <>
          {displayProducts.length > 0 && (
            <div className="space-y-14 sm:space-y-16">
              {productsByCategory.order.map((catKey) => {
                const items = productsByCategory.map.get(catKey)!;
                return (
                  <div key={catKey} id={`catalog-cat-${catKey}`} className="scroll-mt-28">
                    <div className="flex flex-wrap items-baseline justify-between gap-2 mb-4 pb-3 border-b border-[rgba(244,246,250,0.1)]">
                      <h3 className="text-lg sm:text-xl font-bold text-[#F4F6FA] tracking-tight">
                        {formatCategoryHeading(catKey)}
                      </h3>
                      <span className="text-[11px] sm:text-xs text-[#A9B3C7] font-medium">
                        {items.length} {items.length === 1 ? 'product' : 'products'}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                      {items.map((product) => (
                        <ProductCard key={product.id} product={product} discountSettings={discountSettings} />
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* No Results (search filtered empty) */}
          {filteredProducts.length === 0 && (
            <div className="text-center py-16">
              <p className="text-[#A9B3C7] text-lg">No products found matching your criteria.</p>
              <button
                onClick={() => setSearchQuery('')}
                className="mt-4 text-amber-400 hover:text-amber-300 hover:underline"
              >
                Clear search
              </button>
            </div>
          )}
            </>
          )}
        </div>
      </div>
    </section>
  );
}
