import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft, User, ShoppingBag, History, Star, LogOut, Tag, TrendingUp, Check, X, Shield
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { supabase, signOut, getCurrentUser } from '@/lib/supabase';
import { getUserOrders, getUserReviews, createReview, getProductUuidBySlug, getUserReviewCount, checkIsAdmin, type OrderFromDB, type UserReview } from '@/lib/supabase-db';
import { useAffiliate } from '@/context/AffiliateContext';
import { invalidateCache } from '@/lib/cache';
import { formatOrderNumberDisplay } from '@/utils/order-number';

export default function Dashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdminUser, setIsAdminUser] = useState(false);
  const [orders, setOrders] = useState<OrderFromDB[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [reviewCount, setReviewCount] = useState(0);
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [reviewProductId, setReviewProductId] = useState('');
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewTitle, setReviewTitle] = useState('');
  const [reviewComment, setReviewComment] = useState('');
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [reviewError, setReviewError] = useState<string | null>(null);
  const [reviewSuccess, setReviewSuccess] = useState(false);
  const [userReviews, setUserReviews] = useState<UserReview[]>([]);
  const [userReviewsLoading, setUserReviewsLoading] = useState(false);

  const { myPromoter } = useAffiliate();

  useEffect(() => {
    checkUser();
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      const nextUser = session?.user ?? null;
      setUser(nextUser);
      if (!nextUser) navigate('/login');
    });
    return () => subscription.unsubscribe();
  }, [navigate]);

  const checkUser = async () => {
    const currentUser = await getCurrentUser();
    setUser(currentUser);
    if (!currentUser) {
      navigate('/login');
      return;
    }
    const admin = await checkIsAdmin(currentUser.id);
    setIsAdminUser(admin);
    if (admin) localStorage.setItem('vironlabs_is_admin', 'true');
    else localStorage.removeItem('vironlabs_is_admin');
    setIsLoading(false);
  };

  useEffect(() => {
    if (reviewModalOpen) {
      document.body.style.overflow = 'hidden';
      return () => { document.body.style.overflow = ''; };
    }
  }, [reviewModalOpen]);

  useEffect(() => {
    if (!user?.id) {
      setOrders([]);
      setOrdersLoading(false);
      return;
    }
    let cancelled = false;
    setOrdersLoading(true);
    getUserOrders(user.id)
      .then((data) => {
        if (!cancelled) setOrders(data);
      })
      .catch(() => {
        if (!cancelled) setOrders([]);
      })
      .finally(() => {
        if (!cancelled) setOrdersLoading(false);
      });
    return () => { cancelled = true; };
  }, [user?.id]);

  useEffect(() => {
    if (!user?.id) {
      setReviewCount(0);
      return;
    }
    let cancelled = false;
    getUserReviewCount(user.id).then((count) => {
      if (!cancelled) setReviewCount(count);
    });
    return () => { cancelled = true; };
  }, [user?.id]);

  useEffect(() => {
    if (!user?.id) {
      setUserReviews([]);
      return;
    }
    let cancelled = false;
    setUserReviewsLoading(true);
    getUserReviews(user.id)
      .then((data) => { if (!cancelled) setUserReviews(data); })
      .catch(() => { if (!cancelled) setUserReviews([]); })
      .finally(() => { if (!cancelled) setUserReviewsLoading(false); });
    return () => { cancelled = true; };
  }, [user?.id, reviewSuccess]);

  const handleLogout = async () => {
    await signOut();
    setUser(null);
    localStorage.removeItem('vironlabs_logged_in');
    localStorage.removeItem('vironlabs_is_admin');
    navigate('/login');
  };

  // Products user can review (from orders): unique product_id + name
  const reviewableProducts = (() => {
    const seen = new Set<string>();
    const out: { product_id: string; name: string }[] = [];

    const slugify = (s: string) =>
      s
        .trim()
        .toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/[^a-z0-9-]/gi, '');

    for (const order of orders) {
      const items = Array.isArray(order.items) ? order.items : [];
      for (const item of items) {
        const rawProductId = (item as any)?.product_id;
        const rawName = (item as any)?.name;

        // Orders should store `product_id` as a slug, but older data may only have `name`.
        // If we can't get a product_id, normalize the name into a slug.
        const idCandidate =
          rawProductId != null && String(rawProductId).trim() !== ''
            ? String(rawProductId).trim()
            : rawName != null
              ? slugify(String(rawName))
              : '';

        const id = idCandidate || '';
        const name = rawName ?? rawProductId ?? id;
        if (id && !seen.has(id)) {
          seen.add(id);
          out.push({ product_id: String(id), name: String(name) });
        }
      }
    }
    return out;
  })();

  const openReviewModal = () => {
    setReviewModalOpen(true);
    setReviewError(null);
    setReviewSuccess(false);
    setReviewProductId(reviewableProducts[0]?.product_id ?? '');
    setReviewRating(0);
    setReviewTitle('');
    setReviewComment('');
  };

  const closeReviewModal = () => {
    setReviewModalOpen(false);
    setReviewError(null);
    setReviewSubmitting(false);
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id || !reviewProductId.trim() || reviewRating < 1 || !reviewComment.trim()) {
      setReviewError('Please select a product, give a rating (1–5 stars), and write a comment.');
      return;
    }
    setReviewError(null);
    setReviewSubmitting(true);
    try {
      const productUuid = await getProductUuidBySlug(reviewProductId.trim());
      if (!productUuid) {
        setReviewError('Product not found. Please try again or choose another product.');
        return;
      }

      const isVerified = reviewableProducts.some((p) => p.product_id === reviewProductId);
      const result = await createReview({
        user_id: user.id,
        product_id: productUuid,
        rating: reviewRating,
        title: reviewTitle.trim() || undefined,
        comment: reviewComment.trim(),
        is_verified_purchase: isVerified,
      });

      if ('id' in result) {
        // Bust review caches so the new review and updated count are fetched fresh
        invalidateCache(`user_reviews:${user.id}`);
        invalidateCache(`review_count:${user.id}`);
        setReviewCount((c) => c + 1);
        setReviewSuccess(true);
        setTimeout(() => closeReviewModal(), 1500);
      } else {
        setReviewError(result.error || 'Could not submit review. Please try again.');
      }
    } finally {
      setReviewSubmitting(false);
    }
  };

  // Only count orders that are paid/shipped for dashboard stats
  const paidStatuses = ['processing', 'shipped', 'delivered'];
  const paidOrders = orders.filter((o) => o.status && paidStatuses.includes(o.status));
  const totalSpent = paidOrders.reduce((sum, o) => sum + Number(o.total ?? 0), 0);
  const paidOrderCount = paidOrders.length;

  if (isLoading) {
    return (
      <div className="landing-page dashboard-page min-h-screen relative overflow-hidden">
        <div className="landing-aurora" aria-hidden="true" />
        <div className="noise-overlay" aria-hidden="true" />
        <div className="absolute inset-0 grid-overlay opacity-60" />
        {/* Nav skeleton — mobile */}
        <nav className="lg:hidden relative z-50 px-4 py-3 border-b border-[rgba(244,246,250,0.06)]">
          <div className="flex items-center justify-between">
            <Skeleton className="h-9 w-9 rounded-xl" />
            <Skeleton className="h-7 w-20 rounded" />
            <Skeleton className="h-9 w-9 rounded-xl" />
          </div>
        </nav>
        {/* Nav skeleton — desktop */}
        <nav className="hidden lg:block relative z-50 px-12 py-6">
          <div className="flex items-center justify-between">
            <Skeleton className="h-10 w-36 rounded-lg" />
            <div className="flex items-center gap-4">
              <Skeleton className="h-8 w-20 rounded-full" />
              <Skeleton className="h-8 w-28 rounded-full" />
            </div>
          </div>
        </nav>
        <main className="relative z-10 px-4 lg:px-12 py-5 lg:py-16">
          <div className="max-w-6xl mx-auto space-y-4 sm:space-y-8">
            {/* Profile card — mobile */}
            <div className="lg:hidden p-4 rounded-2xl bg-[rgba(17,24,39,0.7)] border border-[rgba(244,246,250,0.08)] flex items-center gap-3">
              <Skeleton className="h-14 w-14 rounded-full shrink-0" />
              <div className="space-y-1.5 flex-1">
                <Skeleton className="h-4 w-28 rounded" />
                <Skeleton className="h-3 w-20 rounded" />
              </div>
            </div>
            {/* Header — desktop */}
            <div className="hidden lg:block space-y-2">
              <Skeleton className="h-9 w-72 rounded-lg" />
              <Skeleton className="h-4 w-40 rounded" />
            </div>
            {/* Stat cards */}
            <div className="grid grid-cols-3 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 sm:gap-4">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-[rgba(17,24,39,0.6)] border border-[rgba(244,246,250,0.08)] space-y-2 sm:space-y-3">
                  <Skeleton className="h-5 w-5 sm:h-6 sm:w-6 rounded" />
                  <Skeleton className="h-5 sm:h-7 w-10 sm:w-14 rounded" />
                  <Skeleton className="h-2.5 sm:h-3 w-12 sm:w-20 rounded" />
                </div>
              ))}
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (!user) return null;

  const userName = user.user_metadata?.name || user.email?.split('@')[0] || 'Member';
  const joinDate = new Date(user.created_at).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });

  return (
    <div className="landing-page dashboard-page min-h-screen relative overflow-hidden">
      <div className="landing-aurora" aria-hidden="true" />
      <div className="noise-overlay" aria-hidden="true" />
      <div className="absolute inset-0 grid-overlay opacity-60" />

      {/* Mobile header */}
      <nav className="lg:hidden relative z-50 sticky top-0 bg-[rgba(7,10,18,0.95)] backdrop-blur-sm border-b border-[rgba(244,246,250,0.06)]">
        <div className="flex items-center justify-between px-4 py-3">
          <a href="/" className="flex items-center justify-center w-9 h-9 rounded-xl bg-[rgba(244,246,250,0.06)] text-[#A9B3C7] hover:text-[#F4F6FA] transition-colors" aria-label="Back to shop">
            <ArrowLeft className="w-5 h-5" />
          </a>
          <a href="/" className="flex flex-col items-center">
            <img
              src="/logo.png"
              alt="Viron Labs"
              className="h-8 w-auto object-contain select-none"
              draggable={false}
            />
            <span className="text-[10px] font-mono uppercase tracking-[0.3em] text-[#8B5CF6] mt-0.5">DASHBOARD</span>
          </a>
          <div className="flex items-center gap-1.5">
            {myPromoter && (
              <a href="/promoter" className="w-9 h-9 rounded-xl bg-[rgba(34,197,94,0.1)] border border-[rgba(34,197,94,0.2)] flex items-center justify-center text-[#22C55E]" aria-label="Promoter panel">
                <TrendingUp className="w-4 h-4" />
              </a>
            )}
            {isAdminUser && (
              <a href="/admin/dashboard" className="w-9 h-9 rounded-xl bg-[rgba(239,68,68,0.1)] border border-[rgba(239,68,68,0.2)] flex items-center justify-center text-[#EF4444]" aria-label="Admin panel">
                <Shield className="w-4 h-4" />
              </a>
            )}
            <button onClick={handleLogout} className="w-9 h-9 rounded-xl bg-[rgba(244,246,250,0.06)] flex items-center justify-center text-[#A9B3C7] hover:text-[#EF4444] transition-colors" aria-label="Logout">
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </nav>

      {/* Desktop header */}
      <nav className="hidden lg:block relative z-50 px-12 py-6">
        <div className="flex items-center justify-between">
          <a href="/" className="flex flex-col items-start">
            <img
              src="/logo.png"
              alt="Viron Labs"
              className="h-14 w-auto object-contain select-none"
              draggable={false}
            />
          </a>
          <div className="flex items-center gap-4">
            {myPromoter && (
              <a href="/promoter" className="flex items-center gap-2 text-sm px-3 py-2 rounded-full bg-[rgba(34,197,94,0.12)] border border-[rgba(34,197,94,0.25)] text-[#22C55E] hover:bg-[rgba(34,197,94,0.2)] transition-colors">
                Promoter Panel
              </a>
            )}
            {isAdminUser && (
              <a href="/admin/dashboard" className="flex items-center gap-2 text-sm px-3 py-2 rounded-full bg-[rgba(239,68,68,0.12)] border border-[rgba(239,68,68,0.25)] text-[#EF4444] hover:bg-[rgba(239,68,68,0.2)] transition-colors">
                Admin Panel
              </a>
            )}
            <button onClick={handleLogout} className="flex items-center gap-2 text-sm text-[#A9B3C7] hover:text-[#EF4444] transition-colors">
              <LogOut className="w-4 h-4" /> Logout
            </button>
            <a href="/" className="flex items-center gap-2 text-sm text-[#A9B3C7] hover:text-[#F4F6FA] transition-colors">
              <ArrowLeft className="w-4 h-4" /> Back to Shop
            </a>
          </div>
        </div>
      </nav>

      <main className="relative z-10 px-4 lg:px-12 py-5 lg:py-20">
        <div className="max-w-6xl mx-auto">
          {/* Profile hero — mobile */}
          <div className="lg:hidden mb-4 p-4 rounded-2xl bg-[rgba(17,24,39,0.7)] border border-[rgba(244,246,250,0.08)] flex items-center gap-3">
            <div className="shrink-0 w-14 h-14 rounded-full flex items-center justify-center text-white font-bold text-lg select-none" style={{ background: 'linear-gradient(135deg, #8B5CF6 0%, #2ED1B4 100%)' }}>
              {userName ? userName.split(' ').map((w: string) => w[0]).join('').toUpperCase().slice(0, 2) : <User className="w-6 h-6" />}
            </div>
            <div className="min-w-0">
              <p className="text-base font-semibold text-[#F4F6FA] truncate">{userName}</p>
              <p className="text-xs text-[#A9B3C7]">Member since {joinDate}</p>
            </div>
            <a href="/settings" className="ml-auto shrink-0 w-9 h-9 rounded-xl bg-[rgba(244,246,250,0.06)] flex items-center justify-center text-[#A9B3C7] hover:text-[#F4F6FA] transition-colors" aria-label="Settings">
              <User className="w-4 h-4" />
            </a>
          </div>
          {/* Desktop welcome */}
          <div className="hidden lg:block mb-8">
            <h1 className="text-4xl font-bold text-[#F4F6FA] mb-2">
              Welcome back, <span className="gradient-text">{userName}</span>
            </h1>
            <p className="text-[#A9B3C7]">Member since {joinDate}</p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5 sm:gap-4 mb-5 lg:mb-8">
            <div className="p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-[rgba(17,24,39,0.6)] border border-[rgba(244,246,250,0.08)]">
              <ShoppingBag className="w-5 h-5 sm:w-6 sm:h-6 text-[#2ED1B4] mb-1.5 sm:mb-2" />
              <p className="text-lg sm:text-2xl font-bold text-[#F4F6FA]">{paidOrderCount}</p>
              <p className="text-[10px] sm:text-xs text-[#A9B3C7]">Orders</p>
            </div>
            <div className="p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-[rgba(17,24,39,0.6)] border border-[rgba(244,246,250,0.08)]">
              <History className="w-5 h-5 sm:w-6 sm:h-6 text-[#8B5CF6] mb-1.5 sm:mb-2" />
              <p className="text-lg sm:text-2xl font-bold text-[#F4F6FA]">£{totalSpent.toFixed(0)}</p>
              <p className="text-[10px] sm:text-xs text-[#A9B3C7]">Spent</p>
            </div>
            <div className="p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-[rgba(34,197,94,0.1)] border border-[rgba(34,197,94,0.2)]">
              <Tag className="w-5 h-5 sm:w-6 sm:h-6 text-[#22C55E] mb-1.5 sm:mb-2" />
              <p className="text-lg sm:text-2xl font-bold text-[#22C55E]">£0</p>
              <p className="text-[10px] sm:text-xs text-[#22C55E]">Saved</p>
            </div>
            <div className="p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-[rgba(17,24,39,0.6)] border border-[rgba(244,246,250,0.08)]">
              <Star className="w-5 h-5 sm:w-6 sm:h-6 text-[#F59E0B] mb-1.5 sm:mb-2" />
              <p className="text-lg sm:text-2xl font-bold text-[#F4F6FA]">{reviewCount}</p>
              <p className="text-[10px] sm:text-xs text-[#A9B3C7]">Reviews</p>
            </div>
            <div className="p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-[rgba(17,24,39,0.6)] border border-[rgba(244,246,250,0.08)]">
              <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-[#22C55E] flex items-center justify-center mb-1.5 sm:mb-2">
                <span className="text-[8px] sm:text-[10px] text-[#070A12] font-bold">✓</span>
              </div>
              <p className="text-lg sm:text-2xl font-bold text-[#F4F6FA]">Active</p>
              <p className="text-[10px] sm:text-xs text-[#A9B3C7]">Status</p>
            </div>
          </div>

          <div className="p-4 sm:p-6 rounded-2xl bg-[rgba(17,24,39,0.6)] border border-[rgba(244,246,250,0.08)]">
            <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
              <History className="w-4 h-4 sm:w-5 sm:h-5 text-[#8B5CF6]" />
              <h2 className="text-base sm:text-xl font-semibold text-[#F4F6FA]">Purchase History</h2>
            </div>
            {ordersLoading ? (
              <div className="space-y-3">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="p-3 sm:p-4 rounded-xl bg-[rgba(7,10,18,0.5)] border border-[rgba(244,246,250,0.08)] space-y-2.5">
                    <div className="flex items-center justify-between">
                      <div className="space-y-1.5">
                        <Skeleton className="h-4 w-28 rounded" />
                        <Skeleton className="h-3 w-20 rounded" />
                      </div>
                      <Skeleton className="h-5 w-16 rounded-full" />
                    </div>
                    <div className="flex gap-1.5">
                      <Skeleton className="h-5 w-20 rounded-md" />
                      <Skeleton className="h-5 w-16 rounded-md" />
                    </div>
                    <div className="flex items-center justify-between pt-2 border-t border-[rgba(244,246,250,0.08)]">
                      <Skeleton className="h-3 w-8 rounded" />
                      <Skeleton className="h-5 w-14 rounded" />
                    </div>
                  </div>
                ))}
              </div>
            ) : orders.length === 0 ? (
              <div className="text-center py-8">
                <ShoppingBag className="w-10 h-10 sm:w-12 sm:h-12 mx-auto text-[rgba(244,246,250,0.2)] mb-3" />
                <p className="text-sm text-[#A9B3C7]">No orders yet</p>
                <a href="/" className="text-[#2ED1B4] hover:underline text-sm mt-2 inline-block">Start Shopping</a>
              </div>
            ) : (
              <div className="space-y-3">
                {orders.map((order) => {
                  const items = Array.isArray(order.items) ? order.items : [];
                  const itemLabels = items.map((item: any) =>
                    typeof item === 'string' ? item : [item.name, item.quantity].filter(Boolean).join(' × ')
                  );
                  return (
                    <div key={order.id} className="p-3 sm:p-4 rounded-xl bg-[rgba(7,10,18,0.5)] border border-[rgba(244,246,250,0.08)]">
                      <div className="flex items-center justify-between mb-2 sm:mb-3">
                        <div className="min-w-0 flex-1">
                          <p className="text-xs sm:text-sm font-semibold text-[#F4F6FA] font-mono truncate">{formatOrderNumberDisplay(order.order_number) || order.id}</p>
                          <p className="text-[10px] sm:text-xs text-[#A9B3C7]">{new Date(order.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                        </div>
                        <span className={`px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-xs font-medium whitespace-nowrap shrink-0 ml-2 ${order.status === 'Delivered' || order.status === 'delivered' ? 'bg-[rgba(34,197,94,0.15)] text-[#22C55E]' : 'bg-[rgba(245,158,11,0.15)] text-[#F59E0B]'}`}>{order.status || 'Processing'}</span>
                      </div>
                      <div className="mb-2 sm:mb-3">
                        <div className="flex flex-wrap gap-1.5">
                          {itemLabels.length > 0 ? itemLabels.map((label, idx) => (
                            <span key={idx} className="px-2 py-0.5 sm:py-1 rounded-md bg-[rgba(139,92,246,0.1)] text-[#8B5CF6] text-[10px] sm:text-xs">{label}</span>
                          )) : (
                            <span className="text-[10px] sm:text-xs text-[#A9B3C7]">—</span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center justify-between pt-2 sm:pt-3 border-t border-[rgba(244,246,250,0.08)]">
                        <span className="text-xs text-[#A9B3C7]">Total</span>
                        <span className="text-base sm:text-lg font-bold text-[#2ED1B4]">£{Number(order.total ?? 0).toFixed(2)}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="mt-4 sm:mt-6 p-4 sm:p-6 rounded-2xl bg-[rgba(17,24,39,0.6)] border border-[rgba(244,246,250,0.08)]">
            <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
              <Star className="w-4 h-4 sm:w-5 sm:h-5 text-[#F59E0B]" />
              <h3 className="text-base sm:text-xl font-semibold text-[#F4F6FA]">Your Reviews</h3>
            </div>

            {userReviewsLoading ? (
              <div className="space-y-3">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="p-3 sm:p-4 rounded-xl bg-[rgba(7,10,18,0.5)] border border-[rgba(244,246,250,0.08)] space-y-2.5">
                    <div className="flex items-center justify-between gap-3">
                      <div className="space-y-1.5 flex-1">
                        <Skeleton className="h-4 w-28 sm:w-36 rounded" />
                        <Skeleton className="h-3 w-20 sm:w-28 rounded" />
                      </div>
                      <div className="text-right space-y-1.5">
                        <Skeleton className="h-4 w-8 rounded ml-auto" />
                        <Skeleton className="h-3 w-14 rounded ml-auto" />
                      </div>
                    </div>
                    <Skeleton className="h-10 w-full rounded" />
                  </div>
                ))}
              </div>
            ) : userReviews.length === 0 ? (
              <div className="text-center py-6 sm:py-8">
                <Star className="w-8 h-8 sm:w-10 sm:h-10 mx-auto text-[rgba(244,246,250,0.15)] mb-2" />
                <p className="text-sm text-[#A9B3C7]">No reviews yet. Write your first one below.</p>
              </div>
            ) : (
              <div className="space-y-2.5 sm:space-y-4">
                {userReviews.slice(0, 5).map((r: any) => (
                  <div key={r.id} className="p-3 sm:p-4 rounded-xl bg-[rgba(7,10,18,0.5)] border border-[rgba(244,246,250,0.08)]">
                    <div className="flex items-center justify-between gap-3 mb-1.5 sm:mb-2">
                      <div className="min-w-0">
                        <p className="text-xs sm:text-sm font-medium text-[#F4F6FA] truncate">{r.title || 'Review'}</p>
                        <p className="text-[10px] sm:text-xs text-[#A9B3C7] truncate">
                          {r.products?.name || 'Unknown product'}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-xs text-[#F59E0B] font-medium">{r.rating}★</p>
                        <p className="text-[10px] text-[#A9B3C7]">{new Date(r.created_at).toLocaleDateString('en-GB')}</p>
                      </div>
                    </div>
                    <p className="text-xs sm:text-sm text-[#A9B3C7] whitespace-pre-wrap line-clamp-3">{r.comment}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="mt-4 sm:mt-6 p-4 sm:p-6 rounded-2xl bg-gradient-to-br from-[rgba(46,209,180,0.1)] to-[rgba(139,92,246,0.1)] border border-[rgba(46,209,180,0.2)]">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
              <div>
                <h3 className="text-base sm:text-lg font-semibold text-[#F4F6FA] mb-1">Share Your Experience</h3>
                <p className="text-xs sm:text-sm text-[#A9B3C7]">Leave a review for products you've purchased.</p>
              </div>
              <button
                type="button"
                onClick={openReviewModal}
                className="w-full sm:w-auto btn-primary whitespace-nowrap flex items-center justify-center gap-2 py-3 sm:py-2.5 active:scale-[0.97] transition-all"
              >
                <Star className="w-4 h-4" /> Write a Review
              </button>
            </div>
          </div>

          {reviewModalOpen && (
            <div
              className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center sm:p-4 bg-black/60 backdrop-blur-sm"
              style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}
              onClick={closeReviewModal}
            >
              <div
                className="relative w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl bg-[#111827] border border-[rgba(244,246,250,0.12)] border-b-0 sm:border-b shadow-xl flex flex-col max-h-[85vh] sm:max-h-[min(90vh,32rem)]"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="w-10 h-1 rounded-full bg-[rgba(244,246,250,0.15)] mx-auto mt-2 sm:hidden" />
                <div className="flex items-center justify-between flex-shrink-0 px-4 py-3 sm:px-5 sm:py-4 border-b border-[rgba(244,246,250,0.08)]">
                  <h3 className="text-base sm:text-lg font-semibold text-[#F4F6FA]">Write a Review</h3>
                  <button type="button" onClick={closeReviewModal} className="p-1.5 sm:p-2 rounded-lg text-[#A9B3C7] hover:text-[#F4F6FA] hover:bg-[rgba(244,246,250,0.08)] transition-colors">
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <form onSubmit={handleSubmitReview} className="flex flex-col flex-1 min-h-0 overflow-hidden">
                  <div className="flex-1 overflow-y-auto px-4 py-3 sm:px-5 sm:py-4 space-y-3">
                    {reviewSuccess ? (
                      <div className="py-6 text-center">
                        <Check className="w-10 h-10 mx-auto text-[#22C55E] mb-2" />
                        <p className="text-sm text-[#F4F6FA] font-medium">Thank you! Your review has been submitted.</p>
                      </div>
                    ) : reviewableProducts.length === 0 ? (
                      <div className="py-6 text-center">
                        <ShoppingBag className="w-10 h-10 mx-auto text-[rgba(244,246,250,0.2)] mb-2" />
                        <p className="text-xs sm:text-sm text-[#A9B3C7]">Complete a purchase to leave a verified review.</p>
                      </div>
                    ) : (
                      <>
                        {reviewError && (
                          <div className="p-2.5 rounded-xl bg-[rgba(239,68,68,0.1)] border border-[rgba(239,68,68,0.2)]">
                            <p className="text-xs text-[#EF4444]">{reviewError}</p>
                          </div>
                        )}
                        <div className="space-y-3">
                          <div>
                            <label className="block text-[10px] sm:text-xs uppercase tracking-wider font-semibold text-[#A9B3C7] mb-1.5">Product</label>
                            <select
                              value={reviewProductId}
                              onChange={(e) => setReviewProductId(e.target.value)}
                              className="w-full px-3 py-3 rounded-xl bg-[rgba(7,10,18,0.6)] border border-[rgba(244,246,250,0.1)] text-[#F4F6FA] text-base focus:outline-none focus:border-[#2ED1B4] transition-colors appearance-none"
                            >
                              {reviewableProducts.map((p) => (
                                <option key={p.product_id} value={p.product_id}>{p.name}</option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <label className="block text-[10px] sm:text-xs uppercase tracking-wider font-semibold text-[#A9B3C7] mb-1.5">Rating</label>
                            <div className="flex gap-1">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <button
                                  key={star}
                                  type="button"
                                  onClick={() => setReviewRating(star)}
                                  className="p-1 rounded-lg focus:outline-none focus:ring-2 ring-[#2ED1B4] active:scale-90 transition-transform"
                                >
                                  <Star className={`w-8 h-8 ${star <= reviewRating ? 'text-[#F59E0B] fill-[#F59E0B]' : 'text-[rgba(244,246,250,0.15)]'}`} />
                                </button>
                              ))}
                            </div>
                          </div>
                          <div>
                            <label className="block text-[10px] sm:text-xs uppercase tracking-wider font-semibold text-[#A9B3C7] mb-1.5">Title (optional)</label>
                            <input
                              type="text"
                              value={reviewTitle}
                              onChange={(e) => setReviewTitle(e.target.value)}
                              placeholder="e.g. Great quality"
                              className="w-full px-3 py-3 rounded-xl bg-[rgba(7,10,18,0.6)] border border-[rgba(244,246,250,0.1)] text-[#F4F6FA] text-base placeholder-[#A9B3C7] focus:outline-none focus:border-[#2ED1B4] transition-colors"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] sm:text-xs uppercase tracking-wider font-semibold text-[#A9B3C7] mb-1.5">Your review *</label>
                            <textarea
                              value={reviewComment}
                              onChange={(e) => setReviewComment(e.target.value)}
                              required
                              rows={3}
                              placeholder="Share your experience..."
                              className="w-full px-3 py-3 rounded-xl bg-[rgba(7,10,18,0.6)] border border-[rgba(244,246,250,0.1)] text-[#F4F6FA] text-base placeholder-[#A9B3C7] focus:outline-none focus:border-[#2ED1B4] transition-colors resize-none"
                            />
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                  <div className="flex-shrink-0 flex gap-2 p-4 sm:p-5 pt-3 border-t border-[rgba(244,246,250,0.08)] bg-[#111827] pb-[calc(1rem+env(safe-area-inset-bottom,0px))] sm:pb-5">
                    <button type="button" onClick={closeReviewModal} className="flex-1 py-3 rounded-xl border border-[rgba(244,246,250,0.2)] text-sm text-[#A9B3C7] hover:bg-[rgba(244,246,250,0.06)] active:scale-[0.97] transition-all">
                      Cancel
                    </button>
                    <button type="submit" disabled={reviewSubmitting} className="flex-1 py-3 rounded-xl bg-[#2ED1B4] text-[#070A12] text-sm font-semibold hover:bg-[#26b89e] disabled:opacity-50 active:scale-[0.97] transition-all">
                      {reviewSubmitting ? 'Submitting...' : 'Submit'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      </main>

      <footer className="relative z-0 px-4 lg:px-12 py-6 lg:py-8 border-t border-[rgba(244,246,250,0.08)]">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-[10px] sm:text-xs text-[#A9B3C7]">© 2026 Viron Labs. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
