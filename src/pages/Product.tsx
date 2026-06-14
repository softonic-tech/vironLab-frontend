import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import ProductCard from '@/components/ProductCard';
import { SEO } from '@/components/SEO';
import type { Product } from '@/products';
import { getVironProductBySlug } from '@/data/viron-catalog';
import { getProductBySlug } from '@/lib/supabase-db';
import { Skeleton } from '@/components/ui/skeleton';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import { useTranslation } from '@/i18n';

export default function ProductPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const params = useParams();
  const slug = (params as { slug?: string }).slug;

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    if (!slug) {
      setLoading(false);
      setError(t('product.missingSlug'));
      return;
    }

    setLoading(true);
    setError(null);

    getProductBySlug(slug)
      .then((dbProduct) => {
        if (cancelled) return;
        const fallback = getVironProductBySlug(slug);
        const resolved = dbProduct || fallback || null;
        if (!resolved) {
          setProduct(null);
          setError(t('product.notFound'));
        } else {
          setProduct(resolved);
        }
      })
      .catch(() => {
        if (cancelled) return;
        const fallback = getVironProductBySlug(slug);
        if (!fallback) {
          setProduct(null);
          setError(t('product.notFound'));
        } else {
          setProduct(fallback);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [slug, t]);

  const seo = useMemo(() => {
    if (!product) return null;
    const title = `${product.name} | VIRON`;
    const description = product.description || product.moreInfo || undefined;
    const keywords = `${product.name}, peptides, research purposes`;
    return { title, description, keywords };
  }, [product]);

  if (loading) {
    return (
      <main className="min-h-screen" style={{ background: '#070A12' }}>
        <div className="max-w-6xl mx-auto px-6 py-10">
          <Skeleton className="h-4 w-16 rounded mb-6" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
            <div className="rounded-2xl bg-[rgba(17,24,39,0.6)] border border-[rgba(244,246,250,0.08)] overflow-hidden">
              <Skeleton className="h-64 w-full rounded-none" />
              <div className="p-5 space-y-3">
                <Skeleton className="h-6 w-2/3 rounded" />
                <Skeleton className="h-4 w-full rounded" />
                <Skeleton className="h-4 w-3/4 rounded" />
                <div className="flex items-center justify-between pt-2">
                  <Skeleton className="h-7 w-20 rounded" />
                  <Skeleton className="h-10 w-28 rounded-xl" />
                </div>
              </div>
            </div>
            <div className="p-6 rounded-2xl bg-[rgba(17,24,39,0.6)] border border-[rgba(244,246,250,0.08)] space-y-4">
              <Skeleton className="h-7 w-3/4 rounded" />
              <Skeleton className="h-4 w-full rounded" />
              <Skeleton className="h-4 w-5/6 rounded" />
              <Skeleton className="h-4 w-2/3 rounded" />
              <div className="mt-6 p-4 rounded-xl bg-[rgba(17,24,39,0.4)] space-y-3">
                <Skeleton className="h-4 w-32 rounded" />
                <Skeleton className="h-3 w-full rounded" />
                <Skeleton className="h-3 w-full rounded" />
                <Skeleton className="h-3 w-4/5 rounded" />
              </div>
            </div>
          </div>
        </div>
      </main>
    );
  }

  if (!product || error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6" style={{ background: '#070A12' }}>
        <div className="absolute top-4 right-4">
          <LanguageSwitcher />
        </div>
        <p className="text-[#EF4444] text-sm mb-4">{error || t('product.notFound')}</p>
        <button
          className="px-4 py-2 rounded-xl bg-[#2ED1B4] text-white hover:bg-[#25b89d]"
          type="button"
          onClick={() => navigate('/')}
        >
          {t('product.backToShop')}
        </button>
      </div>
    );
  }

  return (
    <>
      {seo && <SEO title={seo.title} description={seo.description} keywords={seo.keywords} />}

      <main className="min-h-screen" style={{ background: '#070A12' }}>
        <div className="max-w-6xl mx-auto px-6 py-10">
          <div className="mb-6 flex items-center justify-between">
            <button
              type="button"
              onClick={() => navigate('/')}
              className="text-sm text-[#A9B3C7] hover:text-[#F4F6FA] transition-colors"
            >
              {t('product.back')}
            </button>
            <LanguageSwitcher />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
            <div>
              <ProductCard product={product} />
            </div>

            <div className="p-6 rounded-2xl bg-[rgba(17,24,39,0.6)] border border-[rgba(244,246,250,0.08)]">
              <h1 className="text-2xl font-bold text-[#F4F6FA] mb-2">{product.name}</h1>
              <p className="text-sm text-[#A9B3C7] whitespace-pre-wrap">{product.description}</p>

              {product.moreInfo ? (
                <div className="mt-6 p-4 rounded-xl bg-[rgba(239,68,68,0.08)] border border-[rgba(239,68,68,0.2)]">
                  <h2 className="text-sm font-semibold text-[#EF4444] mb-3">{t('product.moreInformation')}</h2>
                  <div className="text-[10px] text-[#A9B3C7] whitespace-pre-wrap">{product.moreInfo}</div>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
