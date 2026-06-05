import { useState, useEffect, useRef, useMemo } from 'react';
import { 
  LayoutDashboard, Users, Package, ShoppingCart, Truck, Shield, LogOut,
  Search, Plus, CheckCircle, XCircle, Eye, DollarSign,
  Settings, Phone, Mail, MapPin,
  CreditCard, Box, Send, Ban, Save, Tag, Gift, X, Pencil, Trash2,
  ChevronUp, ChevronDown, Star, MessageSquare, Upload, Image as ImageIcon,
  Printer, ArrowUp, ArrowDown, MinusCircle, PlusCircle, Link2, Copy, Check,
  TrendingUp, BarChart2, FlaskConical, UserPlus
} from 'lucide-react';
import { supabase, getCurrentUser } from '@/lib/supabase';
import { Skeleton } from '@/components/ui/skeleton';
import { cached, invalidateCache, TTL_ADMIN_OVERVIEW, TTL_ADMIN_ORDERS, TTL_ADMIN_PRODUCTS, TTL_ADMIN_USERS, TTL_ADMIN_REVIEWS } from '@/lib/cache';
import { CONFIG } from '@/lib/config';
import { fetchAllSiteSettings, updateSiteSetting, DEFAULT_BANK_DETAILS, DEFAULT_DISCOUNT_SETTINGS, DEFAULT_FREE_GIFT_SETTINGS, DEFAULT_SUPPORT_LINKS, DEFAULT_LANDING_PAGE_SETTINGS } from '@/lib/settings';
import { addUserPoints, normalizeImageUrl, getUserTransactions, logAdminAction, type PointsEvent } from '@/lib/supabase-db';
import { DEFAULT_MORE_INFO_TEXT } from '@/lib/defaultMoreInfo';
import { getBundlePricing } from '@/utils/pricing';
import { POINT_TYPE_LABELS } from '@/utils/points';
import {
  getAllPromoters, adminCreateInfluencer, updatePromoter, deletePromoter,
  getAllAffiliateOrders, adjustStoreCredit, creditAffiliateCommission,
  COMMISSION_TIERS, type Promoter, type AffiliateOrder,
} from '@/lib/affiliates';
import { formatOrderNumberDisplay } from '@/utils/order-number';
import { sendPaymentReceived, sendOrderShipped } from '@/lib/email';

const POINTS_SYSTEM_ENABLED = false;

// Types
interface Order {
  id: string;
  order_number: string;
  user_id: string | null;
  customer_email: string;
  customer_first_name: string;
  customer_last_name: string;
  customer_phone: string;
  items: any[];
  subtotal: number;
  shipping_cost: number;
  discount_amount: number;
  total: number;
  status: string;
  payment_status: string;
  shipping_address: string;
  shipping_suburb: string;
  shipping_state: string;
  shipping_postcode: string;
  shipping_method: string;
  tracking_number: string;
  notes: string;
  created_at: string;
  paid_at: string;
  payment_email_sent?: boolean;
  shipped_email_sent?: boolean;
  confirmation_email_sent?: boolean;
}

interface Product {
  id: string;
  name: string;
  slug: string;
  category: string;
  description: string;
  image_url: string;
  review_count?: number;
  more_info?: string | null;
  coa_url?: string | null;
  is_active: boolean;
  product_dosages?: any[];
}

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<'overview' | 'orders' | 'products' | 'users' | 'reviews' | 'affiliates' | 'settings'>('overview');
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [adminEmail, setAdminEmail] = useState('');

  useEffect(() => {
    const checkAdminAccess = async () => {
      try {
        const user = await getCurrentUser();
        if (!user) {
          window.location.href = '/login';
          return;
        }

        setAdminEmail(user.email || '');

        if (user.user_metadata?.role === 'admin') {
          setIsAdmin(true);
          return;
        }

        const { data: profile } = await supabase
          .from('profiles')
          .select('is_admin')
          .eq('id', user.id)
          .single();

        if (profile?.is_admin) {
          setIsAdmin(true);
        } else {
          window.location.href = '/';
        }
      } catch (error) {
        console.error('[Admin] Auth check failed:', error);
        window.location.href = '/login';
      } finally {
        setIsLoading(false);
      }
    };

    checkAdminAccess();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    localStorage.removeItem('vironlabs_logged_in');
    localStorage.removeItem('vironlabs_is_admin');
    window.location.href = '/login';
  };

  if (isLoading) {
    return (
      <div className="landing-page admin-theme min-h-screen relative overflow-hidden">
        <div className="landing-aurora" aria-hidden="true" />
        <div className="noise-overlay" aria-hidden="true" />
        {/* Mobile loading skeleton */}
        <div className="lg:hidden">
          <div className="sticky top-0 z-50 flex items-center justify-between px-4 py-3 bg-[rgba(17,24,39,0.95)] border-b border-[rgba(244,246,250,0.08)]">
            <Skeleton className="h-7 w-28 rounded-lg" />
            <Skeleton className="h-8 w-8 rounded-lg" />
          </div>
          <div className="p-4 space-y-4">
            <div className="grid grid-cols-2 gap-3">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="p-4 rounded-xl bg-[rgba(17,24,39,0.6)] border border-[rgba(244,246,250,0.08)] space-y-2">
                  <Skeleton className="h-4 w-4 rounded" />
                  <Skeleton className="h-6 w-14 rounded" />
                  <Skeleton className="h-3 w-20 rounded" />
                </div>
              ))}
            </div>
            {[...Array(5)].map((_, i) => (
              <div key={i} className="p-4 rounded-xl bg-[rgba(17,24,39,0.6)] border border-[rgba(244,246,250,0.08)] flex items-center gap-3">
                <Skeleton className="h-10 w-10 rounded-lg shrink-0" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-32 rounded" />
                  <Skeleton className="h-3 w-48 rounded" />
                </div>
                <Skeleton className="h-6 w-16 rounded-full shrink-0" />
              </div>
            ))}
          </div>
          {/* Bottom nav skeleton */}
          <div className="fixed bottom-0 left-0 right-0 bg-[rgba(17,24,39,0.95)] border-t border-[rgba(244,246,250,0.08)] px-2 py-2 flex justify-around">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="flex flex-col items-center gap-1 p-2">
                <Skeleton className="h-5 w-5 rounded" />
                <Skeleton className="h-2.5 w-8 rounded" />
              </div>
            ))}
          </div>
        </div>

        {/* Desktop loading skeleton */}
        <div className="hidden lg:flex min-h-screen">
          <div className="w-64 shrink-0 border-r border-[rgba(244,246,250,0.08)] p-6 space-y-4">
            <Skeleton className="h-8 w-36 rounded-lg mb-8" />
            {[...Array(6)].map((_, i) => (
              <div key={i} className="flex items-center gap-3">
                <Skeleton className="h-5 w-5 rounded" />
                <Skeleton className="h-4 w-28 rounded" />
              </div>
            ))}
          </div>
          <div className="flex-1 p-8 space-y-6">
            <Skeleton className="h-8 w-48 rounded-lg" />
            <div className="grid grid-cols-4 gap-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="p-5 rounded-2xl bg-[rgba(17,24,39,0.6)] border border-[rgba(244,246,250,0.08)] space-y-3">
                  <Skeleton className="h-5 w-5 rounded" />
                  <Skeleton className="h-8 w-20 rounded" />
                  <Skeleton className="h-3 w-24 rounded" />
                </div>
              ))}
            </div>
            <div className="p-6 rounded-2xl bg-[rgba(17,24,39,0.6)] border border-[rgba(244,246,250,0.08)] space-y-4">
              <Skeleton className="h-6 w-32 rounded" />
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center gap-4 py-3 border-b border-[rgba(244,246,250,0.06)]">
                  <Skeleton className="h-4 w-24 rounded" />
                  <Skeleton className="h-4 w-32 rounded" />
                  <Skeleton className="h-4 w-20 rounded ml-auto" />
                  <Skeleton className="h-6 w-20 rounded-full" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!isAdmin) return null;

  const navItems = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'orders', label: 'Orders', icon: ShoppingCart },
    { id: 'products', label: 'Products', icon: Package },
    { id: 'users', label: 'Users', icon: Users },
    { id: 'reviews', label: 'Reviews', icon: MessageSquare },
    { id: 'affiliates', label: 'Influencers', icon: Link2 },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <div className="landing-page admin-theme min-h-screen relative overflow-hidden">
      <div className="landing-aurora" aria-hidden="true" />
      <div className="noise-overlay" aria-hidden="true" />
      <div className="absolute inset-0 grid-overlay opacity-35 pointer-events-none" aria-hidden />

      {/* Sidebar - Desktop */}
      <aside className="fixed left-0 top-0 bottom-0 w-64 bg-[rgba(17,24,39,0.95)] border-r border-[rgba(244,246,250,0.08)] z-50 hidden lg:block">
        <div className="p-6 border-b border-[rgba(244,246,250,0.08)]">
          <a href="/" className="flex flex-col items-start">
            <img
              src="/logo.png"
              alt="Viron Labs"
              className="h-9 w-auto object-contain select-none"
              draggable={false}
            />
          </a>
        </div>

        <nav className="p-4 space-y-1">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id as any)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-colors ${
                activeTab === item.id
                  ? 'bg-[rgba(46,209,180,0.15)] text-[#2ED1B4]'
                  : 'text-[#A9B3C7] hover:bg-[rgba(244,246,250,0.05)] hover:text-[#F4F6FA]'
              }`}
            >
              <item.icon className="w-5 h-5" />
              <span className="font-medium">{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-[rgba(244,246,250,0.08)]">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-full bg-[rgba(46,209,180,0.2)] flex items-center justify-center shrink-0">
              <Shield className="w-4 h-4 text-[#2ED1B4]" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-[#F4F6FA] truncate">{adminEmail.split('@')[0]}</p>
              <p className="text-xs text-[#2ED1B4]">Administrator</p>
            </div>
          </div>
          <button onClick={handleLogout} className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[rgba(239,68,68,0.1)] border border-[rgba(239,68,68,0.15)] text-[#EF4444] hover:bg-[rgba(239,68,68,0.2)] transition-colors text-sm font-medium">
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Mobile Header */}
      <header className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-[rgba(17,24,39,0.97)] border-b border-[rgba(244,246,250,0.08)] backdrop-blur-sm">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-[rgba(46,209,180,0.15)] flex items-center justify-center shrink-0">
              {(() => { const n = navItems.find(n => n.id === activeTab); return n ? <n.icon className="w-4 h-4 text-[#2ED1B4]" /> : null; })()}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-bold text-[#F4F6FA] truncate">
                {navItems.find(n => n.id === activeTab)?.label}
              </p>
              <p className="text-[10px] font-mono uppercase tracking-[0.3em] text-[#2ED1B4]">Viron Labs ADMIN</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[rgba(239,68,68,0.1)] border border-[rgba(239,68,68,0.2)] text-[#EF4444] text-xs font-medium active:scale-95 transition-all"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign out</span>
          </button>
        </div>
      </header>

      {/* Mobile Bottom Nav */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-[rgba(17,24,39,0.97)] border-t border-[rgba(244,246,250,0.08)] backdrop-blur-sm safe-area-bottom">
        <div className="flex justify-around px-1 py-1">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id as any)}
                className={`flex flex-col items-center gap-1 px-2 py-2 rounded-xl min-w-[52px] transition-all active:scale-95 ${
                  isActive
                    ? 'bg-[rgba(46,209,180,0.12)] text-[#2ED1B4]'
                    : 'text-[#6B7280] hover:text-[#A9B3C7]'
                }`}
              >
                <item.icon className={`w-5 h-5 transition-transform ${isActive ? 'scale-110' : ''}`} />
                <span className={`text-[10px] font-medium leading-none ${isActive ? 'text-[#2ED1B4]' : ''}`}>
                  {item.label}
                </span>
                {isActive && (
                  <span className="w-1 h-1 rounded-full bg-[#2ED1B4]" />
                )}
              </button>
            );
          })}
        </div>
      </nav>

      {/* Main Content */}
      <main className="relative z-10 lg:ml-64 pt-[60px] lg:pt-0 pb-[72px] lg:pb-0 min-h-screen">
        <div className="p-4 lg:p-8">
          <div className="flex items-center justify-between mb-5 lg:mb-6">
            <h1 className="text-xl lg:text-3xl font-bold text-[#F4F6FA]">
              {navItems.find(n => n.id === activeTab)?.label}
            </h1>
            <div className="hidden sm:block text-sm text-[#A9B3C7]">
              {new Date().toLocaleDateString('en-GB', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </div>
            <div className="sm:hidden text-xs text-[#A9B3C7]">
              {new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
            </div>
          </div>

          {activeTab === 'overview' && <OverviewSection />}
          {activeTab === 'orders' && <OrdersSection />}
          {activeTab === 'products' && <ProductsSection />}
          {activeTab === 'users' && <UsersSection />}
          {activeTab === 'reviews' && <ReviewsAdminSection />}
          {activeTab === 'affiliates' && <AffiliatesSection />}
          {activeTab === 'settings' && <SettingsSection />}
        </div>
      </main>
    </div>
  );
}

// ─── Best-sellers aggregation ──────────────────────────────────────────────
interface BestSellerItem {
  key: string;        // "name||dosage" composite
  name: string;
  dosage: string;
  unitsSold: number;
  revenue: number;
}

type BsTimeFilter = '7d' | '30d' | '90d' | 'all';
type BsSortBy = 'units' | 'revenue';

function aggregateBestSellers(
  ordersWithItems: Array<{ items: any[]; created_at: string; status: string }>,
  timeFilter: BsTimeFilter,
): BestSellerItem[] {
  const now = Date.now();
  const cutoffs: Record<BsTimeFilter, number> = {
    '7d': now - 7 * 86400_000,
    '30d': now - 30 * 86400_000,
    '90d': now - 90 * 86400_000,
    all: 0,
  };
  const cutoff = cutoffs[timeFilter];

  const map = new Map<string, BestSellerItem>();

  for (const order of ordersWithItems) {
    // Exclude cancelled orders from the tally.
    if ((order.status || '').toLowerCase() === 'cancelled') continue;
    if (cutoff > 0 && new Date(order.created_at).getTime() < cutoff) continue;

    const items: any[] = Array.isArray(order.items) ? order.items : [];
    for (const item of items) {
      // Skip free gifts / zero-price items from the revenue tally but still count units.
      const name = String(item.name ?? '').trim();
      const dosage = String(item.dosage ?? '').trim();
      if (!name) continue;
      const key = `${name}||${dosage}`;
      const qty = Number(item.quantity) || 1;
      const price = item.is_free ? 0 : Number(item.price) || 0;

      const existing = map.get(key);
      if (existing) {
        existing.unitsSold += qty;
        existing.revenue += price * qty;
      } else {
        map.set(key, { key, name, dosage, unitsSold: qty, revenue: price * qty });
      }
    }
  }

  return Array.from(map.values());
}

// Overview Section
function OverviewSection() {
  const [stats, setStats] = useState({
    totalOrders: 0,
    pendingPayment: 0,
    totalRevenue: 0,
    totalUsers: 0,
    totalProducts: 0
  });
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [allOrderItems, setAllOrderItems] = useState<Array<{ items: any[]; created_at: string; status: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [bsTime, setBsTime] = useState<BsTimeFilter>('30d');
  const [bsSort, setBsSort] = useState<BsSortBy>('units');

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async (bust = false) => {
    if (bust) invalidateCache('admin:overview');
    setLoading(true);
    try {
      const result = await cached('admin:overview', async () => {
        const [
          { data: orders },
          { data: recent },
          { count: userCount },
          { count: productCount },
          { data: itemOrders },
        ] = await Promise.all([
          supabase.from('orders').select('status, total'),
          supabase.from('orders').select('*').order('created_at', { ascending: false }).limit(5),
          supabase.from('profiles').select('*', { count: 'exact', head: true }),
          supabase.from('products').select('*', { count: 'exact', head: true }),
          supabase.from('orders').select('items, created_at, status').neq('status', 'cancelled'),
        ]);
        return {
          orders: orders || [],
          recent: recent || [],
          userCount: userCount || 0,
          productCount: productCount || 0,
          itemOrders: itemOrders || [],
        };
      }, TTL_ADMIN_OVERVIEW);

      setStats({
        totalOrders: result.orders.length,
        pendingPayment: result.orders.filter((o: any) => o.status === 'pending_payment').length,
        totalRevenue: result.orders.reduce((sum: number, o: any) => sum + (o.total || 0), 0),
        totalUsers: result.userCount,
        totalProducts: result.productCount,
      });
      setRecentOrders(result.recent);
      setAllOrderItems(result.itemOrders as Array<{ items: any[]; created_at: string; status: string }>);
    } catch (error) {
      console.error('Error loading stats:', error);
    } finally {
      setLoading(false);
    }
  };

  // Hooks must always be called unconditionally — these must come before any early return.
  const bestSellers = useMemo<BestSellerItem[]>(() => {
    const all = aggregateBestSellers(allOrderItems, bsTime);
    return all.sort((a, b) =>
      bsSort === 'revenue' ? b.revenue - a.revenue : b.unitsSold - a.unitsSold,
    ).slice(0, 10);
  }, [allOrderItems, bsTime, bsSort]);

  const bsMax = useMemo(
    () => (bestSellers.length ? (bsSort === 'revenue' ? bestSellers[0].revenue : bestSellers[0].unitsSold) : 1),
    [bestSellers, bsSort],
  );

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="p-5 rounded-2xl bg-[rgba(17,24,39,0.6)] border border-[rgba(244,246,250,0.08)] space-y-3">
              <Skeleton className="h-5 w-5 rounded" />
              <Skeleton className="h-8 w-16 rounded" />
              <Skeleton className="h-3 w-24 rounded" />
            </div>
          ))}
        </div>
        <div className="p-6 rounded-2xl bg-[rgba(17,24,39,0.6)] border border-[rgba(46,209,180,0.2)] space-y-3">
          <Skeleton className="h-6 w-56 rounded" />
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-14 rounded-lg" />)}
          </div>
        </div>
        <div className="p-6 rounded-2xl bg-[rgba(17,24,39,0.6)] border border-[rgba(244,246,250,0.08)] space-y-3">
          <Skeleton className="h-6 w-40 rounded" />
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center gap-3">
              <Skeleton className="h-7 w-7 rounded-lg shrink-0" />
              <div className="flex-1 space-y-1.5">
                <div className="flex justify-between">
                  <Skeleton className="h-4 w-32 rounded" />
                  <Skeleton className="h-4 w-16 rounded" />
                </div>
                <Skeleton className="h-1.5 w-full rounded-full" />
              </div>
            </div>
          ))}
        </div>
        <div className="p-6 rounded-2xl bg-[rgba(17,24,39,0.6)] border border-[rgba(244,246,250,0.08)] space-y-3">
          <Skeleton className="h-6 w-36 rounded" />
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-[rgba(7,10,18,0.5)]">
              <div className="space-y-1.5">
                <Skeleton className="h-4 w-24 rounded" />
                <Skeleton className="h-3 w-36 rounded" />
              </div>
              <div className="flex items-center gap-3">
                <Skeleton className="h-6 w-20 rounded" />
                <Skeleton className="h-5 w-14 rounded" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard label="Total Orders" value={stats.totalOrders.toString()} icon={ShoppingCart} color="#8B5CF6" />
        <StatCard label="Awaiting Payment" value={stats.pendingPayment.toString()} icon={CreditCard} color="#F59E0B" />
        <StatCard label="Revenue" value={`kr ${stats.totalRevenue.toFixed(0)}`} icon={DollarSign} color="#22C55E" />
        <StatCard label="Users" value={stats.totalUsers.toString()} icon={Users} color="#3B82F6" />
        <StatCard label="Products" value={stats.totalProducts.toString()} icon={Package} color="#2ED1B4" />
      </div>

      {/* Best Sellers */}
      <div className="p-4 sm:p-6 rounded-2xl bg-[rgba(17,24,39,0.6)] border border-[rgba(244,246,250,0.08)]">
        {/* Header row */}
        <div className="flex flex-wrap items-start sm:items-center justify-between gap-3 mb-5">
          <h3 className="text-base sm:text-lg font-semibold text-[#F4F6FA] flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-[#2ED1B4]" />
            Best Sellers
          </h3>

          {/* Controls */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Time period */}
            <div className="flex rounded-xl overflow-hidden border border-[rgba(244,246,250,0.08)]">
              {(['7d', '30d', '90d', 'all'] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setBsTime(t)}
                  className={`px-3 py-1.5 text-xs font-semibold transition-colors ${
                    bsTime === t
                      ? 'bg-[rgba(46,209,180,0.2)] text-[#2ED1B4]'
                      : 'text-[#6B7280] hover:text-[#A9B3C7]'
                  }`}
                >
                  {t === 'all' ? 'All time' : t === '7d' ? '7 days' : t === '30d' ? '30 days' : '90 days'}
                </button>
              ))}
            </div>

            {/* Sort toggle */}
            <div className="flex rounded-xl overflow-hidden border border-[rgba(244,246,250,0.08)]">
              <button
                type="button"
                onClick={() => setBsSort('units')}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold transition-colors ${
                  bsSort === 'units'
                    ? 'bg-[rgba(139,92,246,0.2)] text-[#8B5CF6]'
                    : 'text-[#6B7280] hover:text-[#A9B3C7]'
                }`}
              >
                <BarChart2 className="w-3.5 h-3.5" />
                Units
              </button>
              <button
                type="button"
                onClick={() => setBsSort('revenue')}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold transition-colors ${
                  bsSort === 'revenue'
                    ? 'bg-[rgba(34,197,94,0.2)] text-[#22C55E]'
                    : 'text-[#6B7280] hover:text-[#A9B3C7]'
                }`}
              >
                <DollarSign className="w-3.5 h-3.5" />
                Revenue
              </button>
            </div>
          </div>
        </div>

        {bestSellers.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-10 text-[#5A667E]">
            <FlaskConical className="w-8 h-8 opacity-40" />
            <p className="text-sm">No sales data for this period yet.</p>
          </div>
        ) : (
          <ol className="space-y-3">
            {bestSellers.map((item, idx) => {
              const barPct = bsMax > 0 ? (bsSort === 'revenue' ? item.revenue : item.unitsSold) / bsMax : 0;
              const rankColors = ['#2ED1B4', '#8B5CF6', '#3B82F6', '#F59E0B', '#22C55E'];
              const rankColor = rankColors[idx] ?? '#6B7280';

              return (
                <li key={item.key} className="flex items-center gap-3 group">
                  {/* Rank badge */}
                  <span
                    className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold shrink-0"
                    style={{ background: `${rankColor}18`, color: rankColor, border: `1px solid ${rankColor}30` }}
                  >
                    {idx + 1}
                  </span>

                  {/* Name + bar */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline justify-between gap-2 mb-1">
                      <div className="min-w-0">
                        <span className="text-sm font-semibold text-[#F4F6FA] truncate block leading-tight">
                          {item.name}
                        </span>
                        {item.dosage && (
                          <span className="text-[11px] text-[#6B7280] font-mono">{item.dosage}</span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 shrink-0 text-right">
                        <span className="text-xs text-[#A9B3C7] whitespace-nowrap">
                          {item.unitsSold} {item.unitsSold === 1 ? 'unit' : 'units'}
                        </span>
                        <span className="text-sm font-bold whitespace-nowrap" style={{ color: rankColor }}>
                          kr {item.revenue.toFixed(0)}
                        </span>
                      </div>
                    </div>
                    {/* Progress bar */}
                    <div className="h-1.5 rounded-full bg-[rgba(244,246,250,0.06)] overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{ width: `${(barPct * 100).toFixed(1)}%`, background: rankColor, opacity: 0.75 }}
                      />
                    </div>
                  </div>
                </li>
              );
            })}
          </ol>
        )}

        <p className="mt-5 text-[11px] text-[#5A667E]">
          Excludes cancelled orders and free-gift items from revenue.
          Counts all confirmed, processing, shipped, and delivered orders.
        </p>
      </div>

      {/* Bank Details Quick Reference */}
      <div className="p-6 rounded-2xl bg-gradient-to-br from-[rgba(46,209,180,0.1)] to-[rgba(139,92,246,0.1)] border border-[rgba(46,209,180,0.2)]">
        <h3 className="text-lg font-semibold text-[#F4F6FA] mb-4 flex items-center gap-2">
          <CreditCard className="w-5 h-5 text-[#2ED1B4]" />
          Bank Account Details (For Customer Payments)
        </h3>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-3 rounded-lg bg-[rgba(7,10,18,0.5)]">
            <p className="text-[10px] text-[#A9B3C7] uppercase">Sort Code</p>
            <p className="text-sm font-mono text-[#F4F6FA]">{CONFIG.BANK_DETAILS.SORT_CODE}</p>
          </div>
          <div className="p-3 rounded-lg bg-[rgba(7,10,18,0.5)]">
            <p className="text-[10px] text-[#A9B3C7] uppercase">Account Number</p>
            <p className="text-sm font-mono text-[#F4F6FA]">{CONFIG.BANK_DETAILS.ACCOUNT_NUMBER}</p>
          </div>
          <div className="p-3 rounded-lg bg-[rgba(7,10,18,0.5)]">
            <p className="text-[10px] text-[#A9B3C7] uppercase">Account Name</p>
            <p className="text-sm text-[#F4F6FA]">{CONFIG.BANK_DETAILS.ACCOUNT_NAME}</p>
          </div>
          <div className="p-3 rounded-lg bg-[rgba(7,10,18,0.5)]">
            <p className="text-[10px] text-[#A9B3C7] uppercase">Bank</p>
            <p className="text-sm text-[#F4F6FA]">{CONFIG.BANK_DETAILS.BANK_NAME}</p>
          </div>
        </div>
      </div>

      {/* Recent Orders */}
      <div className="p-4 sm:p-6 rounded-2xl bg-[rgba(17,24,39,0.6)] border border-[rgba(244,246,250,0.08)]">
        <h3 className="text-base sm:text-lg font-semibold text-[#F4F6FA] mb-3">Recent Orders</h3>
        {recentOrders.length === 0 ? (
          <p className="text-[#A9B3C7] text-center py-8">No orders yet</p>
        ) : (
          <div className="space-y-2">
            {recentOrders.map(order => (
              <div key={order.id} className="flex items-center gap-3 p-3 rounded-xl bg-[rgba(7,10,18,0.5)]">
                {/* Left: order # + email */}
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-[#F4F6FA] font-mono leading-tight">
                    #{formatOrderNumberDisplay(order.order_number)}
                  </p>
                  <p className="text-xs text-[#A9B3C7] truncate mt-0.5">
                    {order.customer_email}
                  </p>
                </div>
                {/* Right: status badge + total */}
                <div className="shrink-0 flex flex-col items-end gap-1">
                  <span className={`px-2 py-0.5 rounded-md text-[10px] font-semibold leading-tight whitespace-nowrap ${getStatusColor(order.status)}`}>
                    {order.status.replace(/_/g, ' ')}
                  </span>
                  <span className="text-sm font-bold text-[#2ED1B4]">kr {order.total?.toFixed(2)}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function isLikelyNetworkFailure(err: unknown): boolean {
  const m =
    err && typeof err === 'object' && 'message' in err
      ? String((err as { message: unknown }).message)
      : typeof err === 'string'
        ? err
        : '';
  return /failed to fetch|networkerror|internet disconnected|load failed|network request failed|err_internet_disconnected|fetcherror/i.test(
    m
  );
}

/** User-facing copy for admin alerts (avoids raw "TypeError: Failed to fetch"). */
function adminRequestErrorMessage(err: unknown): string {
  if (isLikelyNetworkFailure(err)) {
    return 'No internet connection or the browser blocked the request. Check Wi‑Fi/VPN, then try again.';
  }
  if (err && typeof err === 'object') {
    const o = err as Record<string, unknown>;
    if (typeof o.message === 'string' && o.message.trim()) return o.message;
    if (typeof o.error_description === 'string' && o.error_description.trim()) return o.error_description;
    if (o.error != null) return String(o.error);
  }
  return 'Unknown error';
}

// Orders Section - Full Order Management
function OrdersSection() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [trackingNumber, setTrackingNumber] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [deleteOrderId, setDeleteOrderId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const loadOrdersRequestIdRef = useRef(0);

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async (bust = false) => {
    const requestId = ++loadOrdersRequestIdRef.current;
    if (bust) invalidateCache('admin:orders');
    setLoading(true);
    try {
      const data = await cached('admin:orders', async () => {
        const { data, error } = await supabase
          .from('orders')
          .select('*')
          .order('created_at', { ascending: false });
        if (error) throw error;
        return data || [];
      }, TTL_ADMIN_ORDERS);

      if (requestId === loadOrdersRequestIdRef.current) {
        setOrders(data);
      }
    } catch (error) {
      console.error('Error loading orders:', error);
    } finally {
      if (requestId === loadOrdersRequestIdRef.current) {
        setLoading(false);
      }
    }
  };

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    setIsUpdating(true);
    try {
      const updates: any = { status: newStatus, updated_at: new Date().toISOString() };
      if (newStatus === 'shipped') updates.shipped_at = new Date().toISOString();
      if (newStatus === 'delivered') updates.delivered_at = new Date().toISOString();
      if (newStatus === 'cancelled') updates.cancelled_at = new Date().toISOString();

      const { error } = await supabase.from('orders').update(updates).eq('id', orderId);
      if (error) throw error;
      
      await loadOrders(true);
      setSelectedOrder((prev) => (prev && prev.id === orderId ? { ...prev, status: newStatus } : prev));
    } catch (error) {
      console.error('Error updating order:', error);
      alert('Failed to update order status: ' + adminRequestErrorMessage(error));
    } finally {
      setIsUpdating(false);
    }
  };

  const updatePaymentStatus = async (orderId: string, paymentStatus: string, order?: Order | null) => {
    try {
      setIsUpdating(true);

      // 1) Update the order FIRST (fast path). UI should stop "Processing..." right after this succeeds.
      const { error } = await supabase
        .from('orders')
        .update({
          payment_status: paymentStatus,
          status: paymentStatus === 'confirmed' ? 'processing' : 'pending_payment',
          paid_at: paymentStatus === 'confirmed' ? new Date().toISOString() : null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', orderId);

      if (error) throw error;

      // 2) Refresh UI
      await loadOrders(true);
      setSelectedOrder((prev) => {
        if (!prev || prev.id !== orderId) return prev;
        return {
          ...prev,
          payment_status: paymentStatus,
          status: paymentStatus === 'confirmed' ? 'processing' : 'pending_payment',
        };
      });

      if (paymentStatus === 'confirmed' && order?.customer_email && !order.payment_email_sent) {
        void sendPaymentReceived(order.customer_email, {
          order_number: order.order_number,
          total: Number(order.total) || 0,
        });
      }

      if (paymentStatus === 'confirmed') {
        creditAffiliateCommission(orderId).catch(e =>
          console.error('[updatePaymentStatus] affiliate credit failed', e)
        );
      }
    } catch (err: unknown) {
      console.error('Error updating payment:', err);
      alert('Failed to update payment status: ' + adminRequestErrorMessage(err));
    } finally {
      setIsUpdating(false);
    }
  };

  const addTracking = async (
    orderId: string,
    subtotal: number,
    userId: string | null,
    orderNumber: string,
    customerEmail: string,
    shippedEmailSent?: boolean
  ) => {
    if (!trackingNumber.trim()) return;
    const trimmedTracking = trackingNumber.trim();
    setIsUpdating(true);
    try {
      // Update order with tracking number
      const { error } = await supabase.from('orders').update({
        tracking_number: trimmedTracking,
        status: 'shipped',
        shipped_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }).eq('id', orderId);

      if (error) throw error;

      if (customerEmail && !shippedEmailSent) {
        void sendOrderShipped(customerEmail, {
          order_number: orderNumber,
          tracking_number: trimmedTracking,
        });
      }

      // Refresh orders in the background so tracking UI never gets stuck
      // if the fetch is slow or temporarily fails.
      void loadOrders();
      setTrackingNumber('');
      setSelectedOrder((prev) => {
        if (!prev || prev.id !== orderId) return prev;
        return { ...prev, tracking_number: trimmedTracking, status: 'shipped' };
      });

      alert('Tracking added!');
    } catch (error) {
      console.error('Error adding tracking:', error);
      alert('Failed to add tracking number: ' + adminRequestErrorMessage(error));
    } finally {
      setIsUpdating(false);
    }
  };

  const deleteOrder = async (orderId: string) => {
    setIsDeleting(true);
    try {
      // Delete the order
      const { error } = await supabase.from('orders').delete().eq('id', orderId);
      if (error) throw error;
      setDeleteOrderId(null);
      setShowOrderModal(false);
      setSelectedOrder(null);
      await loadOrders(true);
    } catch (err: any) {
      console.error('Error deleting order:', err);
      alert('Failed to delete order: ' + (err?.message || 'Unknown error'));
    } finally {
      setIsDeleting(false);
    }
  };

  const filteredOrders = orders.filter(order => {
    const orderStatus = (order.status || '').toLowerCase().replace(/\s/g, '_');
    const matchesStatus = statusFilter === 'all' || orderStatus === statusFilter;
    const q = (searchQuery || '').trim().toLowerCase();
    const matchesSearch =
      !q ||
      (order.order_number &&
        (order.order_number.toLowerCase().includes(q) ||
          formatOrderNumberDisplay(order.order_number).toLowerCase().includes(q))) ||
      (order.customer_email && order.customer_email.toLowerCase().includes(q)) ||
      (order.customer_first_name && order.customer_first_name.toLowerCase().includes(q)) ||
      (order.customer_last_name && order.customer_last_name.toLowerCase().includes(q));
    return matchesStatus && matchesSearch;
  });

  const statusLabels: Record<string, string> = {
    all: 'All',
    pending_payment: 'Awaiting payment',
    processing: 'Processing',
    shipped: 'Shipped',
    delivered: 'Delivered',
    cancelled: 'Cancelled',
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  };

  if (loading) return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="p-5 rounded-2xl bg-[rgba(17,24,39,0.6)] border border-[rgba(244,246,250,0.08)] space-y-3">
            <Skeleton className="h-5 w-5 rounded" />
            <Skeleton className="h-8 w-16 rounded" />
            <Skeleton className="h-3 w-24 rounded" />
          </div>
        ))}
      </div>
      <div className="p-5 rounded-2xl bg-[rgba(17,24,39,0.5)] border border-[rgba(244,246,250,0.08)] space-y-3">
        <div className="flex gap-3">
          <Skeleton className="h-10 flex-1 rounded-xl" />
          <Skeleton className="h-10 w-32 rounded-xl" />
        </div>
      </div>
      <div className="rounded-2xl bg-[rgba(17,24,39,0.6)] border border-[rgba(244,246,250,0.08)] overflow-hidden">
        <div className="p-4 border-b border-[rgba(244,246,250,0.08)]">
          <Skeleton className="h-5 w-28 rounded" />
        </div>
        {[...Array(8)].map((_, i) => (
          <div key={i} className="flex items-center gap-4 p-4 border-b border-[rgba(244,246,250,0.06)]">
            <Skeleton className="h-4 w-20 rounded" />
            <Skeleton className="h-4 w-40 rounded" />
            <Skeleton className="h-4 w-28 rounded" />
            <Skeleton className="h-6 w-24 rounded-full ml-auto" />
            <Skeleton className="h-5 w-16 rounded" />
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Stats - status cards clickable to filter */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
        <button type="button" onClick={() => setStatusFilter('all')} className="text-left">
          <StatCard label="All Orders" value={orders.length.toString()} icon={ShoppingCart} color="#8B5CF6" />
        </button>
        <button type="button" onClick={() => setStatusFilter('pending_payment')} className="text-left">
          <StatCard label="Awaiting Payment" value={orders.filter(o => o.status === 'pending_payment').length.toString()} icon={CreditCard} color="#F59E0B" />
        </button>
        <button type="button" onClick={() => setStatusFilter('processing')} className="text-left">
          <StatCard label="Processing" value={orders.filter(o => o.status === 'processing').length.toString()} icon={Box} color="#8B5CF6" />
        </button>
        <button type="button" onClick={() => setStatusFilter('shipped')} className="text-left">
          <StatCard label="Shipped" value={orders.filter(o => o.status === 'shipped').length.toString()} icon={Truck} color="#2ED1B4" />
        </button>
        <StatCard label="Revenue" value={`kr ${orders.reduce((sum, o) => sum + (o.total || 0), 0).toFixed(0)}`} icon={DollarSign} color="#22C55E" />
      </div>

      {/* Filters card */}
      <div className="p-4 sm:p-5 rounded-2xl bg-[rgba(17,24,39,0.5)] border border-[rgba(244,246,250,0.08)]">
        <div className="flex flex-col gap-4">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#A9B3C7]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by order #, email, or customer name..."
              className="w-full pl-12 pr-4 py-3 rounded-xl bg-[rgba(7,10,18,0.6)] border border-[rgba(244,246,250,0.1)] text-[#F4F6FA] placeholder-[#A9B3C7] focus:outline-none focus:border-[#2ED1B4] transition-colors"
            />
          </div>
          <div className="flex flex-wrap items-center gap-2 relative z-10">
            <span className="text-xs text-[#A9B3C7] mr-1">Status:</span>
            {(['all', 'pending_payment', 'processing', 'shipped', 'delivered', 'cancelled'] as const).map((status) => (
              <button
                key={status}
                type="button"
                role="button"
                tabIndex={0}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setStatusFilter(status);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    setStatusFilter(status);
                  }
                }}
                className={`min-h-[36px] px-3 py-1.5 rounded-lg text-sm font-medium transition-colors cursor-pointer select-none ${
                  statusFilter === status
                    ? 'bg-[#2ED1B4] text-[#070A12]'
                    : 'bg-[rgba(244,246,250,0.06)] text-[#A9B3C7] hover:bg-[rgba(244,246,250,0.1)] hover:text-[#F4F6FA]'
                }`}
              >
                {statusLabels[status] ?? status.replace('_', ' ')}
              </button>
            ))}
          </div>
          <p className="text-sm text-[#A9B3C7]">
            Showing <span className="font-medium text-[#F4F6FA]">{filteredOrders.length}</span>
            {filteredOrders.length !== orders.length && ` of ${orders.length}`} orders
          </p>
        </div>
      </div>

      {/* Orders list - table on desktop, cards on mobile */}
      {filteredOrders.length === 0 ? (
        <div className="p-12 sm:p-16 rounded-2xl bg-[rgba(17,24,39,0.5)] border border-[rgba(244,246,250,0.08)] text-center">
          <ShoppingCart className="w-14 h-14 sm:w-16 sm:h-16 mx-auto text-[rgba(244,246,250,0.2)] mb-4" />
          <p className="text-[#F4F6FA] font-medium mb-1">No orders found</p>
          <p className="text-sm text-[#A9B3C7]">
            {orders.length === 0 ? 'Orders will appear here once customers place them.' : 'Try changing the filter or search.'}
          </p>
        </div>
      ) : (
        <div className="rounded-2xl border border-[rgba(244,246,250,0.08)] overflow-hidden bg-[rgba(17,24,39,0.3)]">
          {/* Desktop table */}
          <div className="hidden lg:block overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[rgba(244,246,250,0.08)] bg-[rgba(7,10,18,0.4)]">
                  <th className="text-left text-xs font-semibold text-[#A9B3C7] uppercase tracking-wider px-4 py-3">Order</th>
                  <th className="text-left text-xs font-semibold text-[#A9B3C7] uppercase tracking-wider px-4 py-3">Customer</th>
                  <th className="text-left text-xs font-semibold text-[#A9B3C7] uppercase tracking-wider px-4 py-3">Date</th>
                  <th className="text-left text-xs font-semibold text-[#A9B3C7] uppercase tracking-wider px-4 py-3">Status</th>
                  <th className="text-right text-xs font-semibold text-[#A9B3C7] uppercase tracking-wider px-4 py-3">Total</th>
                  <th className="w-10 px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {filteredOrders.map((order) => (
                  <tr
                    key={order.id}
                    onClick={() => { setSelectedOrder(order); setShowOrderModal(true); }}
                    className="border-b border-[rgba(244,246,250,0.05)] hover:bg-[rgba(46,209,180,0.06)] cursor-pointer transition-colors"
                  >
                    <td className="px-4 py-3">
                      <span className="font-mono font-semibold text-[#8B5CF6]">#{formatOrderNumberDisplay(order.order_number)}</span>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-sm font-medium text-[#F4F6FA]">{order.customer_first_name} {order.customer_last_name}</p>
                      <p className="text-xs text-[#A9B3C7]">{order.customer_email}</p>
                    </td>
                    <td className="px-4 py-3 text-sm text-[#A9B3C7]">{formatDate(order.created_at)}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex px-2 py-1 rounded-lg text-xs font-medium ${getStatusColor(order.status)}`}>
                        {order.status.replace('_', ' ')}
                      </span>
                      {order.payment_status === 'pending' && order.status === 'pending_payment' && (
                        <span className="ml-1 inline-flex px-2 py-1 rounded-lg text-[10px] font-medium bg-[#F59E0B] text-white">Unpaid</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="font-semibold text-[#2ED1B4]">kr {order.total?.toFixed(2)}</span>
                      <span className="block text-xs text-[#A9B3C7]">{order.items?.length || 0} items</span>
                    </td>
                    <td className="px-4 py-3">
                      <Eye className="w-4 h-4 text-[#A9B3C7]" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {/* Mobile cards */}
          <div className="lg:hidden divide-y divide-[rgba(244,246,250,0.06)]">
            {filteredOrders.map((order) => (
              <div
                key={order.id}
                onClick={() => { setSelectedOrder(order); setShowOrderModal(true); }}
                className="p-4 active:bg-[rgba(46,209,180,0.08)] transition-colors"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="font-mono font-semibold text-[#8B5CF6]">#{formatOrderNumberDisplay(order.order_number)}</p>
                    <p className="text-sm font-medium text-[#F4F6FA] truncate">{order.customer_first_name} {order.customer_last_name}</p>
                    <p className="text-xs text-[#A9B3C7] truncate">{order.customer_email}</p>
                    <p className="text-xs text-[#A9B3C7] mt-1">{formatDate(order.created_at)}</p>
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-medium ${getStatusColor(order.status)}`}>
                        {order.status.replace('_', ' ')}
                      </span>
                      {order.payment_status === 'pending' && order.status === 'pending_payment' && (
                        <span className="inline-flex px-2 py-0.5 rounded text-[10px] font-medium bg-[#F59E0B] text-white">Unpaid</span>
                      )}
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="font-semibold text-[#2ED1B4]">kr {order.total?.toFixed(2)}</p>
                    <p className="text-xs text-[#A9B3C7]">{order.items?.length || 0} items</p>
                    <Eye className="w-4 h-4 text-[#A9B3C7] mt-1 ml-auto" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Order Detail Modal */}
      {showOrderModal && selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4">
          <div className="absolute inset-0 bg-[rgba(0,0,0,0.8)] backdrop-blur-sm" onClick={() => setShowOrderModal(false)} />
          <div className="relative w-full sm:max-w-3xl max-h-[92vh] sm:max-h-[90vh] overflow-y-auto p-5 sm:p-6 rounded-t-2xl sm:rounded-2xl bg-[#111827] border border-[rgba(244,246,250,0.1)] border-b-0 sm:border-b mb-[72px] sm:mb-0">
            {/* Mobile drag handle */}
            <div className="sm:hidden w-10 h-1 rounded-full bg-[rgba(244,246,250,0.2)] mx-auto mb-4" />
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-xl font-bold text-[#F4F6FA]">Order #{formatOrderNumberDisplay(selectedOrder.order_number)}</h3>
                <p className="text-sm text-[#A9B3C7]">{formatDate(selectedOrder.created_at)}</p>
              </div>
              <button onClick={() => setShowOrderModal(false)} className="p-2 rounded-lg bg-[rgba(244,246,250,0.08)] text-[#A9B3C7] hover:text-[#F4F6FA]">
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            {/* Status Badges */}
            <div className="flex flex-wrap gap-2 mb-6">
              <span className={`px-3 py-1 rounded-full text-sm ${getStatusColor(selectedOrder.status)}`}>
                {selectedOrder.status.replace('_', ' ')}
              </span>
              <span className={`px-3 py-1 rounded-full text-sm ${
                selectedOrder.payment_status === 'confirmed' ? 'bg-[#22C55E] text-white' : 'bg-[#F59E0B] text-white'
              }`}>
                Payment: {selectedOrder.payment_status}
              </span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
              {/* Customer Info */}
              <div className="p-4 rounded-xl bg-[rgba(7,10,18,0.5)]">
                <h4 className="text-sm font-semibold text-[#F4F6FA] mb-3 flex items-center gap-2">
                  <Users className="w-4 h-4 text-[#8B5CF6]" />
                  Customer
                </h4>
                <div className="space-y-2 text-sm">
                  <p className="text-[#F4F6FA]">{selectedOrder.customer_first_name} {selectedOrder.customer_last_name}</p>
                  <p className="text-[#A9B3C7] flex items-center gap-2"><Mail className="w-3 h-3" /> {selectedOrder.customer_email}</p>
                  <p className="text-[#A9B3C7] flex items-center gap-2"><Phone className="w-3 h-3" /> {selectedOrder.customer_phone || 'N/A'}</p>
                </div>
              </div>

              {/* Shipping Address */}
              <div className="p-4 rounded-xl bg-[rgba(7,10,18,0.5)]">
                <h4 className="text-sm font-semibold text-[#F4F6FA] mb-3 flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-[#2ED1B4]" />
                  Shipping Address
                </h4>
                <div className="space-y-1 text-sm">
                  <p className="text-[#F4F6FA]">{selectedOrder.shipping_address}</p>
                  <p className="text-[#F4F6FA]">{selectedOrder.shipping_suburb}, {selectedOrder.shipping_state} {selectedOrder.shipping_postcode}</p>
                  <p className="text-[#A9B3C7] mt-2">Method: {selectedOrder.shipping_method}</p>
                </div>
              </div>
            </div>

            {/* Order Items */}
            <div className="mb-6">
              <h4 className="text-sm font-semibold text-[#F4F6FA] mb-3 flex items-center gap-2">
                <Box className="w-4 h-4 text-[#8B5CF6]" />
                Items
              </h4>
              <div className="space-y-2">
                {selectedOrder.items?.map((item: any, idx: number) => (
                  <div key={idx} className="flex items-center justify-between p-3 rounded-lg bg-[rgba(7,10,18,0.5)]">
                    <div>
                      <p className="text-sm text-[#F4F6FA]">{item.name} ({item.dosage})</p>
                      <p className="text-xs text-[#A9B3C7]">Qty: {item.quantity} × kr {item.price}</p>
                    </div>
                    <p className="text-sm text-[#2ED1B4]">kr {(item.price * item.quantity).toFixed(2)}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Order Total */}
            <div className="p-4 rounded-xl bg-[rgba(46,209,180,0.1)] border border-[rgba(46,209,180,0.2)] mb-6">
              <div className="flex justify-between text-sm mb-1">
                <span className="text-[#A9B3C7]">Subtotal</span>
                <span className="text-[#F4F6FA]">kr {selectedOrder.subtotal?.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-[#A9B3C7]">Shipping</span>
                <span className="text-[#F4F6FA]">kr {selectedOrder.shipping_cost?.toFixed(2)}</span>
              </div>
              {selectedOrder.discount_amount > 0 && (
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-[#A9B3C7]">Discount</span>
                  <span className="text-[#22C55E]">-kr {selectedOrder.discount_amount?.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between text-lg font-bold pt-2 border-t border-[rgba(244,246,250,0.1)]">
                <span className="text-[#F4F6FA]">Total</span>
                <span className="text-[#2ED1B4]">kr {selectedOrder.total?.toFixed(2)}</span>
              </div>
            </div>

            {/* Payment Actions - Mark as Paid */}
            {selectedOrder.status === 'pending_payment' && (
              <div className="p-4 rounded-xl bg-[rgba(245,158,11,0.1)] border border-[rgba(245,158,11,0.2)] mb-4">
                <p className="text-sm text-[#F59E0B] mb-3">
                  Customer should transfer <span className="font-bold">kr {selectedOrder.total?.toFixed(2)}</span> with reference: <span className="font-mono font-bold">{formatOrderNumberDisplay(selectedOrder.order_number)}</span>
                </p>
                <button
                  onClick={() => updatePaymentStatus(selectedOrder.id, 'confirmed', selectedOrder)}
                  disabled={isUpdating}
                  className="w-full px-4 py-3 rounded-xl bg-[#22C55E] text-white hover:bg-[#16A34A] disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <CheckCircle className="w-5 h-5" />
                  {isUpdating ? 'Processing...' : 'I Received Payment - Mark as Paid'}
                </button>
              </div>
            )}

            {/* Tracking Number */}
            {(selectedOrder.status === 'processing' || selectedOrder.status === 'shipped') && (
              <div className="p-4 rounded-xl bg-[rgba(139,92,246,0.1)] border border-[rgba(139,92,246,0.2)] mb-4">
                <h4 className="text-sm font-semibold text-[#F4F6FA] mb-3 flex items-center gap-2">
                  <Truck className="w-4 h-4 text-[#8B5CF6]" />
                  Tracking Information
                </h4>
                {selectedOrder.tracking_number ? (
                  <div className="flex items-center justify-between p-3 rounded-lg bg-[rgba(7,10,18,0.5)]">
                    <p className="text-sm font-mono text-[#F4F6FA]">{selectedOrder.tracking_number}</p>
                    <span className="text-xs text-[#22C55E] flex items-center gap-1"><CheckCircle className="w-3 h-3" /> Shipped</span>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={trackingNumber}
                      onChange={(e) => setTrackingNumber(e.target.value)}
                      placeholder="Enter Royal Mail tracking number"
                      className="flex-1 px-3 py-2 rounded-lg bg-[rgba(7,10,18,0.5)] border border-[rgba(244,246,250,0.1)] text-[#F4F6FA] text-sm"
                    />
                    <button
                      onClick={() =>
                        addTracking(
                          selectedOrder.id,
                          selectedOrder.subtotal,
                          selectedOrder.user_id,
                          selectedOrder.order_number,
                          selectedOrder.customer_email,
                          selectedOrder.shipped_email_sent
                        )
                      }
                      disabled={isUpdating || !trackingNumber.trim()}
                      className="px-4 py-2 rounded-lg bg-[#8B5CF6] text-white hover:bg-[#7C3AED] disabled:opacity-50 flex items-center gap-2"
                    >
                      <Send className="w-4 h-4" />
                      Add Tracking
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Print Shipping Label */}
            {(selectedOrder.status === 'processing' || selectedOrder.status === 'shipped') && (
              <div className="p-4 rounded-xl bg-[rgba(46,209,180,0.1)] border border-[rgba(46,209,180,0.2)] mb-4">
                <h4 className="text-sm font-semibold text-[#F4F6FA] mb-3 flex items-center gap-2">
                  <Printer className="w-4 h-4 text-[#2ED1B4]" />
                  Shipping Label
                </h4>
                <button
                  type="button"
                  onClick={() => {
                    const labelWindow = window.open('', '_blank', 'width=400,height=600');
                    if (!labelWindow) { alert('Please allow popups to print labels'); return; }
                    const o = selectedOrder;
                    const ordDisplay = formatOrderNumberDisplay(o.order_number);
                    labelWindow.document.write(`
                      <html><head><title>Shipping Label - ${ordDisplay}</title>
                      <style>
                        body { font-family: Arial, sans-serif; padding: 20px; max-width: 400px; margin: 0 auto; }
                        .label { border: 2px solid #000; padding: 20px; }
                        .from, .to { margin-bottom: 15px; }
                        .from { font-size: 11px; color: #666; border-bottom: 1px dashed #999; padding-bottom: 10px; }
                        .to { font-size: 14px; font-weight: bold; }
                        .order-ref { font-size: 12px; color: #333; margin-top: 10px; padding-top: 10px; border-top: 1px dashed #999; }
                        .tracking { font-family: monospace; font-size: 14px; margin-top: 5px; }
                        h3 { margin: 0 0 5px; font-size: 11px; text-transform: uppercase; color: #999; }
                        @media print { body { padding: 0; } .no-print { display: none; } }
                      </style></head><body>
                      <div class="no-print" style="margin-bottom:15px;">
                        <button onclick="window.print()" style="padding:8px 16px;background:#2ED1B4;color:white;border:none;border-radius:8px;cursor:pointer;font-size:14px;">Print Label</button>
                        <button onclick="document.querySelector('.label').contentEditable='true';this.textContent='Editing...'" style="padding:8px 16px;background:#8B5CF6;color:white;border:none;border-radius:8px;cursor:pointer;font-size:14px;margin-left:8px;">Edit Label</button>
                      </div>
                      <div class="label">
                        <div class="from">
                          <h3>From</h3>
                          Viron Labs UK<br/>London, SW1A 1AA
                        </div>
                        <div class="to">
                          <h3>To</h3>
                          ${o.customer_first_name} ${o.customer_last_name}<br/>
                          ${o.shipping_address}<br/>
                          ${o.shipping_suburb}, ${o.shipping_state} ${o.shipping_postcode}<br/>
                          ${o.customer_phone ? 'Ph: ' + o.customer_phone : ''}
                        </div>
                        <div class="order-ref">
                          <strong>Order:</strong> #${ordDisplay}<br/>
                          <strong>Method:</strong> ${o.shipping_method || 'Standard'}<br/>
                          ${o.tracking_number ? '<strong>Tracking:</strong> <span class="tracking">' + o.tracking_number + '</span>' : ''}
                        </div>
                      </div>
                      </body></html>
                    `);
                    labelWindow.document.close();
                  }}
                  className="w-full px-4 py-2.5 rounded-lg bg-[rgba(46,209,180,0.15)] border border-[rgba(46,209,180,0.3)] text-[#2ED1B4] hover:bg-[rgba(46,209,180,0.25)] flex items-center justify-center gap-2 text-sm"
                >
                  <Printer className="w-4 h-4" />
                  Print / Edit Shipping Label
                </button>
                <p className="text-xs text-[#A9B3C7] mt-2">Opens printable label in a new window. Click "Edit Label" to modify before printing.</p>
              </div>
            )}

            {/* Status Action Buttons */}
            <div className="flex flex-wrap gap-2">
              {selectedOrder.status === 'processing' && !selectedOrder.tracking_number && (
                <button
                  onClick={() => updateOrderStatus(selectedOrder.id, 'shipped')}
                  disabled={isUpdating}
                  className="flex-1 px-4 py-3 rounded-xl bg-[#2ED1B4] text-white hover:bg-[#25b89d] disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <Truck className="w-5 h-5" />
                  Mark as Shipped (No Tracking)
                </button>
              )}
              {selectedOrder.status === 'shipped' && (
                <button
                  onClick={() => updateOrderStatus(selectedOrder.id, 'delivered')}
                  disabled={isUpdating}
                  className="flex-1 px-4 py-3 rounded-xl bg-[#22C55E] text-white hover:bg-[#16A34A] disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <CheckCircle className="w-5 h-5" />
                  Mark as Delivered
                </button>
              )}
              {(selectedOrder.status === 'pending_payment' || selectedOrder.status === 'processing') && (
                <button
                  onClick={async () => {
                    const orderIdToCancel = selectedOrder.id;

                    setIsUpdating(true);
                    try {
                      // Update order status FIRST so UI never hangs
                      const nowIso = new Date().toISOString();
                      const { error } = await supabase
                        .from('orders')
                        .update({
                          status: 'cancelled',
                          updated_at: nowIso,
                          cancelled_at: nowIso,
                        })
                        .eq('id', orderIdToCancel);

                      if (error) throw error;

                      // Refresh UI
                      await loadOrders(true);
                      setSelectedOrder((prev) => (prev && prev.id === orderIdToCancel ? { ...prev, status: 'cancelled' } : prev));
                    } catch (e: any) {
                      console.error('Error cancelling order:', e);
                      alert('Failed to cancel order: ' + (e?.message || 'Unknown error'));
                      return;
                    } finally {
                      setIsUpdating(false);
                    }
                  }}
                  disabled={isUpdating}
                  className="px-4 py-3 rounded-xl bg-[#EF4444] text-white hover:bg-[#DC2626] disabled:opacity-50 flex items-center gap-2"
                >
                  <Ban className="w-5 h-5" />
                  Cancel Order
                </button>
              )}
              {/* Delete Order (for fake/test orders) */}
              <button
                onClick={() => setDeleteOrderId(selectedOrder.id)}
                disabled={isUpdating || isDeleting}
                className="px-4 py-3 rounded-xl border border-[#EF4444] text-[#EF4444] hover:bg-[rgba(239,68,68,0.1)] disabled:opacity-50 flex items-center gap-2"
              >
                <Trash2 className="w-5 h-5" />
                Delete Order
              </button>
            </div>

            {/* Delete Order Confirmation */}
            {deleteOrderId === selectedOrder.id && (
              <div className="mt-4 p-4 rounded-xl bg-[rgba(239,68,68,0.1)] border border-[rgba(239,68,68,0.3)]">
                <p className="text-sm text-[#EF4444] mb-3">Are you sure? This will permanently delete order #{formatOrderNumberDisplay(selectedOrder.order_number)}. This cannot be undone.</p>
                <div className="flex gap-2">
                  <button onClick={() => setDeleteOrderId(null)} className="flex-1 px-3 py-2 rounded-lg border border-[rgba(244,246,250,0.2)] text-[#A9B3C7] text-sm">Cancel</button>
                  <button onClick={() => deleteOrder(selectedOrder.id)} disabled={isDeleting} className="flex-1 px-3 py-2 rounded-lg bg-[#EF4444] text-white text-sm disabled:opacity-50">
                    {isDeleting ? 'Deleting...' : 'Confirm Delete'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// Product image with same normalization as home page + fallback when missing/broken
function ProductImage({ product }: { product: Product }) {
  const [imgFailed, setImgFailed] = useState(false);
  const imgSrc = normalizeImageUrl((product as any).image ?? product.image_url);
  if (!imgSrc || imgFailed) {
    return (
      <div className="w-16 h-16 rounded-lg bg-[rgba(7,10,18,0.5)] flex items-center justify-center text-2xl font-bold text-[#2ED1B4] shrink-0">
        {product.name.charAt(0)}
      </div>
    );
  }
  return (
    <img
      src={imgSrc}
      alt={product.name}
      className="w-16 h-16 object-contain rounded-lg bg-[rgba(7,10,18,0.5)]"
      onError={() => setImgFailed(true)}
    />
  );
}

// Add Product modal form
function AddProductModal({
  onClose,
  onSaved,
  setError,
  error,
}: {
  onClose: () => void;
  onSaved: () => void;
  setError: (s: string | null) => void;
  error?: string | null;
}) {
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [moreInfo, setMoreInfo] = useState(DEFAULT_MORE_INFO_TEXT);
  const [coaUrl, setCoaUrl] = useState<string>('');
  const [imageUrl, setImageUrl] = useState('');
  const [reviewCount, setReviewCount] = useState('0');
  const [isActive, setIsActive] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [isCoaUploading, setIsCoaUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dosageMg, setDosageMg] = useState<string>('5');
  const [dosageUnit, setDosageUnit] = useState<string>('MG');
  const [originalPrice, setOriginalPrice] = useState('');
  const [stockQuantity, setStockQuantity] = useState('100');
  const [inStock, setInStock] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const originalPriceNum = parseFloat(originalPrice) || 0;
  const bundlePreview = originalPriceNum > 0 ? getBundlePricing(originalPriceNum) : null;

  const handleNameChange = (value: string) => {
    setName(value);
    if (!slug || slug === name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/gi, '')) {
      setSlug(value.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/gi, ''));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSaving(true);
    const productSlug = slug.trim() || name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/gi, '');
    if (!productSlug || !name.trim()) {
      setError('Name and slug are required.');
      setIsSaving(false);
      return;
    }
    const mgVal = dosageMg.trim();
    const stockQty = parseInt(stockQuantity, 10) || 0;
    try {
      const { data: newProduct, error: insertProductError } = await supabase
        .from('products')
        .insert({
          name: name.trim(),
          slug: productSlug,
          category: category.trim() || 'Popular',
          description: description.trim() || 'No description',
          more_info: (moreInfo || '').trim() || DEFAULT_MORE_INFO_TEXT,
          coa_url: coaUrl.trim() || null,
          image: imageUrl.trim() || '/placeholder.png',
          is_active: isActive,
          review_count: Math.max(0, parseInt(reviewCount, 10) || 0),
        })
        .select('id')
        .single();
      if (insertProductError) throw insertProductError;
      const productId = newProduct?.id;
      if (!productId) throw new Error('Product was created but no id returned.');

      const mgNum = parseFloat(String(mgVal).replace(/[^\d.]/g, '')) || 0;
      const { error: insertDosageError } = await supabase.from('product_dosages').insert({
        product_id: productId,
        mg: mgNum,
        unit: dosageUnit,
        originalPrice: originalPriceNum,
        in_stock: inStock,
        stock_quantity: stockQty,
      });
      if (insertDosageError) throw insertDosageError;

      onSaved();
    } catch (err: any) {
      setError(err?.message || 'Failed to add product.');
    } finally {
      setIsSaving(false);
    }
  };

  const ic = 'w-full px-3 py-3 rounded-xl bg-[rgba(7,10,18,0.6)] border border-[rgba(244,246,250,0.1)] text-[#F4F6FA] text-base focus:outline-none focus:border-[#2ED1B4] transition-colors placeholder-[#4B5563]';
  const sc = 'w-full px-3 py-3 pr-9 rounded-xl bg-[rgba(7,10,18,0.6)] border border-[rgba(244,246,250,0.1)] text-[#F4F6FA] text-base focus:outline-none focus:border-[#2ED1B4] transition-colors appearance-none';
  const lc = 'block text-xs font-semibold text-[#A9B3C7] uppercase tracking-wider mb-1.5';
  const SelectWrap = ({ children }: { children: React.ReactNode }) => (
    <div className="relative">
      {children}
      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#A9B3C7]" />
    </div>
  );

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center sm:p-4 bg-black/70 backdrop-blur-sm" onClick={onClose}>
      <div
        className="bg-[#0F172A] border border-[rgba(244,246,250,0.08)] rounded-t-2xl sm:rounded-2xl w-full sm:max-w-lg max-h-[94vh] sm:max-h-[90vh] overflow-y-auto shadow-2xl mb-[72px] sm:mb-0"
        onClick={e => e.stopPropagation()}
      >
        {/* Drag handle (mobile) */}
        <div className="sm:hidden flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-[rgba(244,246,250,0.2)]" />
        </div>

        {/* Header */}
        <div className="px-5 py-4 flex items-center justify-between border-b border-[rgba(244,246,250,0.08)] sticky top-0 bg-[#0F172A] z-10">
          <div>
            <h3 className="text-base font-bold text-[#F4F6FA]">Add Product</h3>
            <p className="text-xs text-[#A9B3C7] mt-0.5">Fill in the details below</p>
          </div>
          <button type="button" onClick={onClose} className="p-2 rounded-xl bg-[rgba(244,246,250,0.06)] text-[#A9B3C7] hover:bg-[rgba(244,246,250,0.12)] hover:text-[#F4F6FA] transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form id="add-product-form" onSubmit={handleSubmit} className="p-5 pb-2 space-y-4">
          {/* Name + Slug side by side on sm+ */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={lc}>Product Name *</label>
              <input type="text" value={name} onChange={e => handleNameChange(e.target.value)} className={ic} placeholder="e.g. BPC-157" required />
            </div>
            <div>
              <label className={lc}>Slug (URL ID)</label>
              <input type="text" value={slug} onChange={e => setSlug(e.target.value)} className={ic} placeholder="e.g. bpc-157" />
            </div>
          </div>

          {/* Category */}
          <div>
            <label className={lc}>Category</label>
            <SelectWrap>
              <select value={category} onChange={e => setCategory(e.target.value)} className={sc}>
                <option value="">Select category...</option>
                <option value="Best Seller">Best Seller</option>
                <option value="High Popularity">High Popularity</option>
                <option value="Popular">Popular</option>
                <option value="Essentials">Essentials</option>
              </select>
            </SelectWrap>
          </div>

          {/* Description */}
          <div>
            <label className={lc}>Description</label>
            <textarea value={description} onChange={e => setDescription(e.target.value)} className={ic} rows={2} placeholder="Short product description" />
          </div>

          {/* More Info */}
          <div>
            <label className={lc}>More Info <span className="text-[#4B5563] normal-case font-normal">(storefront popup)</span></label>
            <textarea value={moreInfo} onChange={e => setMoreInfo(e.target.value)} className={ic} rows={4} placeholder="Research & regulatory information..." />
          </div>

          {/* Review count + Active toggle on one row */}
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <label className={lc}>Review Count</label>
              <input type="number" min={0} value={reviewCount} onChange={e => setReviewCount(e.target.value)} className={ic} placeholder="0" />
            </div>
            <div className="shrink-0 pt-5">
              <button
                type="button"
                onClick={() => setIsActive(v => !v)}
                className={`flex items-center gap-2 px-4 py-3 rounded-xl border text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-[rgba(46,209,180,0.12)] border-[rgba(46,209,180,0.3)] text-[#2ED1B4]'
                    : 'bg-[rgba(244,246,250,0.05)] border-[rgba(244,246,250,0.12)] text-[#6B7280]'
                }`}
              >
                <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${isActive ? 'border-[#2ED1B4] bg-[#2ED1B4]' : 'border-[#6B7280]'}`}>
                  {isActive && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                </div>
                {isActive ? 'Active' : 'Inactive'}
              </button>
            </div>
          </div>

          {/* COA PDF */}
          <div>
            <label className={lc}>COA PDF <span className="text-[#4B5563] normal-case font-normal">(optional)</span></label>
            <div className="space-y-2">
              <label className={`flex items-center justify-center gap-2 w-full px-4 py-3 rounded-xl border border-dashed cursor-pointer transition-colors ${
                isCoaUploading ? 'border-[rgba(244,246,250,0.1)] text-[#4B5563]' : 'border-[rgba(46,209,180,0.35)] text-[#2ED1B4] hover:bg-[rgba(46,209,180,0.06)]'
              }`}>
                <Upload className="w-4 h-4 shrink-0" />
                <span className="text-sm font-medium">{isCoaUploading ? 'Uploading COA...' : 'Upload COA PDF'}</span>
                <input
                  type="file"
                  accept="application/pdf"
                  className="hidden"
                  disabled={isCoaUploading}
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    setIsCoaUploading(true);
                    try {
                      const ext = 'pdf';
                      const base = (slug || name || 'product').toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/gi, '');
                      const fileName = `${base}-${Date.now()}.${ext}`;
                      const { data: uploadData, error: uploadErr } = await supabase.storage.from('coa_file').upload(fileName, file, { upsert: true });
                      if (uploadErr) throw uploadErr;
                      setCoaUrl(uploadData.publicUrl);
                    } catch (err: any) {
                      alert('COA upload failed: ' + (err?.message || 'Unknown error'));
                    } finally {
                      setIsCoaUploading(false);
                    }
                  }}
                />
              </label>
              {coaUrl && (
                <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-[rgba(46,209,180,0.08)] border border-[rgba(46,209,180,0.2)]">
                  <CheckCircle className="w-4 h-4 text-[#2ED1B4] shrink-0" />
                  <span className="text-xs text-[#2ED1B4] truncate flex-1">COA uploaded</span>
                  <button type="button" onClick={() => window.open(coaUrl, '_blank', 'noopener,noreferrer')} className="text-xs text-[#2ED1B4] underline shrink-0">View</button>
                </div>
              )}
            </div>
          </div>

          {/* Product Image */}
          <div>
            <label className={lc}>Product Image</label>
            <div className="space-y-2">
              <div className="flex gap-2 items-center">
                {imageUrl && (
                  <img
                    src={normalizeImageUrl(imageUrl)}
                    alt="Preview"
                    className="w-14 h-14 object-contain rounded-xl bg-[rgba(7,10,18,0.5)] shrink-0 border border-[rgba(244,246,250,0.08)]"
                    onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                  />
                )}
                <input type="text" value={imageUrl} onChange={e => setImageUrl(e.target.value)} className={ic} placeholder="Paste URL or upload below" />
              </div>
              <input type="file" ref={fileInputRef} accept="image/*" className="hidden" onChange={async (e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                setIsUploading(true);
                try {
                  const ext = file.name.split('.').pop() || 'png';
                  const fileName = `${slug || name.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}.${ext}`;
                  const { data, error } = await supabase.storage.from('product-images').upload(fileName, file, { cacheControl: '3600', upsert: true });
                  if (error) throw error;
                  setImageUrl(data.publicUrl);
                } catch (err: any) {
                  alert('Upload failed: ' + (err?.message || 'Unknown error'));
                } finally {
                  setIsUploading(false);
                }
              }} />
              <button type="button" onClick={() => fileInputRef.current?.click()} disabled={isUploading} className="w-full px-3 py-3 rounded-xl border border-dashed border-[rgba(46,209,180,0.35)] text-sm font-medium text-[#2ED1B4] hover:bg-[rgba(46,209,180,0.06)] flex items-center justify-center gap-2 transition-colors disabled:opacity-50">
                <ImageIcon className="w-4 h-4" />
                {isUploading ? 'Uploading...' : 'Upload from Device'}
              </button>
            </div>
          </div>

          {/* First Dosage */}
          <div className="pt-3 border-t border-[rgba(244,246,250,0.08)]">
            <p className="text-sm font-bold text-[#F4F6FA] mb-3 flex items-center gap-2">
              <Tag className="w-4 h-4 text-[#2ED1B4]" />
              First Dosage Variant
            </p>
            <div className="space-y-3">
              {/* Dosage value + Unit */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={lc}>Dosage Value</label>
                  <input type="text" value={dosageMg} onChange={e => setDosageMg(e.target.value)} className={ic} placeholder="e.g. 5" />
                </div>
                <div>
                  <label className={lc}>Unit</label>
                  <SelectWrap>
                    <select value={dosageUnit} onChange={e => setDosageUnit(e.target.value)} className={sc}>
                      <option value="MG">MG</option>
                      <option value="ML">ML</option>
                      <option value="IU">IU</option>
                      <option value="L">L</option>
                      <option value="PCS">PCS</option>
                    </select>
                  </SelectWrap>
                </div>
              </div>
              {/* Price + Stock */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={lc}>Original Price (SEK) *</label>
                  <input type="number" step="0.01" min={0} value={originalPrice} onChange={e => setOriginalPrice(e.target.value)} className={ic} placeholder="e.g. 149.00" required />
                </div>
                <div>
                  <label className={lc}>Stock Quantity</label>
                  <input type="number" min={0} value={stockQuantity} onChange={e => setStockQuantity(e.target.value)} className={ic} />
                </div>
              </div>
              {/* In stock toggle */}
              <button
                type="button"
                onClick={() => setInStock(v => !v)}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border transition-all ${
                  inStock
                    ? 'bg-[rgba(34,197,94,0.08)] border-[rgba(34,197,94,0.25)] text-[#22C55E]'
                    : 'bg-[rgba(239,68,68,0.08)] border-[rgba(239,68,68,0.2)] text-[#EF4444]'
                }`}
              >
                <span className="text-sm font-medium">{inStock ? 'In Stock' : 'Out of Stock'}</span>
                <div className={`w-11 h-7 rounded-full inline-flex items-center shrink-0 transition-colors ${inStock ? 'bg-[#22C55E]' : 'bg-[rgba(244,246,250,0.12)]'}`}>
                  <span className={`inline-block w-5 h-5 rounded-full bg-white shadow transition-transform ${inStock ? 'translate-x-[22px]' : 'translate-x-[3px]'}`} />
                </div>
              </button>
            </div>
          </div>

          {/* Bundle preview */}
          {bundlePreview && (
            <div className="p-3 rounded-xl bg-[rgba(46,209,180,0.06)] border border-[rgba(46,209,180,0.2)]">
              <p className="text-xs font-bold text-[#2ED1B4] mb-2 uppercase tracking-wider">Bundle Pricing Preview</p>
              <div className="grid grid-cols-5 gap-1 text-center">
                {[
                  { label: 'Buy 1', price: bundlePreview.buy1, disc: '20%' },
                  { label: 'Buy 2', price: bundlePreview.buy2, disc: '25%' },
                  { label: 'Buy 3', price: bundlePreview.buy3, disc: '30%' },
                  { label: 'Buy 5', price: bundlePreview.buy5, disc: '36%' },
                  { label: 'Buy 10', price: bundlePreview.buy10, disc: '44%' },
                ].map(t => (
                  <div key={t.label} className="p-2 rounded-lg bg-[rgba(7,10,18,0.5)]">
                    <p className="text-[10px] text-[#A9B3C7]">{t.label}</p>
                    <p className="text-xs font-bold text-[#2ED1B4]">kr {t.price.toFixed(2)}</p>
                    <p className="text-[9px] text-[#22C55E]">{t.disc}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="flex items-start gap-2 px-4 py-3 rounded-xl bg-[rgba(239,68,68,0.08)] border border-[rgba(239,68,68,0.2)] text-[#EF4444] text-sm">
              <XCircle className="w-4 h-4 shrink-0 mt-0.5" />
              {error}
            </div>
          )}

        </form>

        {/* Sticky action footer — always visible above the bottom nav */}
        <div className="sticky bottom-0 left-0 right-0 bg-[#0F172A] border-t border-[rgba(244,246,250,0.08)] px-5 pt-3 pb-[calc(0.75rem+env(safe-area-inset-bottom,0px))] flex gap-3">
          <button type="button" onClick={onClose} className="flex-1 sm:flex-none px-5 py-3 rounded-xl border border-[rgba(244,246,250,0.15)] text-[#A9B3C7] hover:bg-[rgba(244,246,250,0.05)] font-medium transition-colors">
            Cancel
          </button>
          <button
            form="add-product-form"
            type="submit"
            disabled={isSaving}
            className="flex-1 px-5 py-3 rounded-xl bg-[#2ED1B4] text-white hover:bg-[#25b89d] active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2 font-semibold transition-all"
          >
            {isSaving ? (
              <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Saving...</>
            ) : (
              <><Save className="w-4 h-4" /> Save Product</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// Edit Product modal
interface DosageEditRow {
  id?: string;
  mg: string;
  unit: string;
  originalPrice: string;
  stockQuantity: string;
  inStock: boolean;
  isNew: boolean;
}

function EditProductModal({
  product,
  onClose,
  onSaved,
  setError,
  error,
}: {
  product: Product & { product_dosages?: any[] };
  onClose: () => void;
  onSaved: () => void;
  setError: (s: string | null) => void;
  error?: string | null;
}) {
  const [name, setName] = useState(product.name);
  const [slug, setSlug] = useState(product.slug);
  const [category, setCategory] = useState(product.category || '');
  const [description, setDescription] = useState(product.description || '');
  const [reviewCount, setReviewCount] = useState(String(product.review_count ?? 0));
  const [moreInfo, setMoreInfo] = useState((product as any).more_info ?? DEFAULT_MORE_INFO_TEXT);
  const [coaUrl, setCoaUrl] = useState((product as any).coa_url ?? '');
  const [imageUrl, setImageUrl] = useState((product as any).image ?? product.image_url ?? '');
  const [isActive, setIsActive] = useState(product.is_active !== false);
  const [isUploading, setIsUploading] = useState(false);
  const [isCoaUploading, setIsCoaUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [removedDosageIds, setRemovedDosageIds] = useState<string[]>([]);

  // Initialise all dosage rows from the existing dosages on the product
  const [dosages, setDosages] = useState<DosageEditRow[]>(() => {
    const existing = product.product_dosages ?? [];
    if (existing.length > 0) {
      return existing.map(d => ({
        id: d.id,
        mg: String(d.mg ?? ''),
        unit: String(d.unit ?? 'MG'),
        originalPrice: String(d.originalPrice ?? d.originalPrice ?? d.price ?? ''),
        stockQuantity: String(d.stock_quantity ?? 100),
        inStock: d.in_stock !== false,
        isNew: false,
      }));
    }
    return [{ mg: '', unit: 'MG', originalPrice: '', stockQuantity: '100', inStock: true, isNew: true }];
  });

  const addDosageRow = () => {
    setDosages(prev => [...prev, { mg: '', unit: 'MG', originalPrice: '', stockQuantity: '100', inStock: true, isNew: true }]);
  };

  const removeDosageRow = (idx: number) => {
    const row = dosages[idx];
    if (row.id) setRemovedDosageIds(prev => [...prev, row.id!]);
    setDosages(prev => prev.filter((_, i) => i !== idx));
  };

  const updateDosage = (idx: number, field: keyof DosageEditRow, value: string | boolean) => {
    setDosages(prev => prev.map((d, i) => i === idx ? { ...d, [field]: value } : d));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSaving(true);
    const productSlug = slug.trim() || name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/gi, '');
    if (!productSlug || !name.trim()) {
      setError('Name and slug are required.');
      setIsSaving(false);
      return;
    }
    if (dosages.length === 0) {
      setError('At least one dosage is required.');
      setIsSaving(false);
      return;
    }
    try {
      // Update the product row
      const { error: updateProductError } = await supabase
        .from('products')
        .update({
          name: name.trim(),
          slug: productSlug,
          category: category.trim() || 'Popular',
          description: description.trim() || 'No description',
          review_count: Math.max(0, parseInt(reviewCount, 10) || 0),
          more_info: (moreInfo || '').trim() || DEFAULT_MORE_INFO_TEXT,
          coa_url: coaUrl.trim() || null,
          image: imageUrl.trim() || '/placeholder.png',
          is_active: isActive,
          updated_at: new Date().toISOString(),
        })
        .eq('id', product.id);
      if (updateProductError) throw updateProductError;

      // Delete removed dosages
      for (const dosageId of removedDosageIds) {
        await supabase.from('product_dosages').delete().eq('id', dosageId);
      }

      // Update or insert each dosage row
      for (const row of dosages) {
        const mgNum = parseFloat(row.mg.trim().replace(/[^\d.]/g, '')) || 0;
        const price = parseFloat(row.originalPrice) || 0;
        const stockQty = parseInt(row.stockQuantity, 10) || 0;
        const unit = row.unit || 'MG';

        if (row.isNew || !row.id) {
          const { error: insertErr } = await supabase.from('product_dosages').insert({
            product_id: product.id,
            mg: mgNum,
            unit,
            originalPrice: price,
            in_stock: row.inStock,
            stock_quantity: stockQty,
          });
          if (insertErr) throw insertErr;
        } else {
          const { error: updateErr } = await supabase
            .from('product_dosages')
            .update({
              mg: mgNum,
              unit,
              originalPrice: price,
              in_stock: row.inStock,
              stock_quantity: stockQty,
              updated_at: new Date().toISOString(),
            })
            .eq('id', row.id);
          if (updateErr) throw updateErr;
        }
      }

      onSaved();
    } catch (err: any) {
      setError(err?.message || 'Failed to update product.');
    } finally {
      setIsSaving(false);
    }
  };

  const ic = 'w-full px-3 py-3 rounded-xl bg-[rgba(7,10,18,0.6)] border border-[rgba(244,246,250,0.1)] text-[#F4F6FA] text-base focus:outline-none focus:border-[#2ED1B4] transition-colors placeholder-[#4B5563]';
  const sc = 'w-full px-3 py-3 pr-9 rounded-xl bg-[rgba(7,10,18,0.6)] border border-[rgba(244,246,250,0.1)] text-[#F4F6FA] text-base focus:outline-none focus:border-[#2ED1B4] transition-colors appearance-none';
  const lc = 'block text-xs font-semibold text-[#A9B3C7] uppercase tracking-wider mb-1.5';
  const dic = 'w-full px-3 py-3 rounded-xl bg-[rgba(17,24,39,0.7)] border border-[rgba(244,246,250,0.1)] text-[#F4F6FA] text-base focus:outline-none focus:border-[#2ED1B4] transition-colors';
  const dsc = 'w-full px-3 py-3 pr-9 rounded-xl bg-[rgba(17,24,39,0.7)] border border-[rgba(244,246,250,0.1)] text-[#F4F6FA] text-base focus:outline-none focus:border-[#2ED1B4] transition-colors appearance-none';
  const SelectWrap = ({ children }: { children: React.ReactNode }) => (
    <div className="relative">
      {children}
      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#A9B3C7]" />
    </div>
  );

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center sm:p-4 bg-black/70 backdrop-blur-sm" onClick={onClose}>
      <div
        className="bg-[#0F172A] border border-[rgba(244,246,250,0.08)] rounded-t-2xl sm:rounded-2xl w-full sm:max-w-2xl max-h-[94vh] sm:max-h-[90vh] overflow-y-auto shadow-2xl mb-[72px] sm:mb-0"
        onClick={e => e.stopPropagation()}
      >
        {/* Drag handle (mobile) */}
        <div className="sm:hidden flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-[rgba(244,246,250,0.2)]" />
        </div>

        {/* Sticky header */}
        <div className="px-5 py-4 flex items-center justify-between border-b border-[rgba(244,246,250,0.08)] sticky top-0 bg-[#0F172A] z-10">
          <div className="min-w-0">
            <h3 className="text-base font-bold text-[#F4F6FA] truncate">Edit: {product.name}</h3>
            <p className="text-xs text-[#A9B3C7] mt-0.5">Update product details below</p>
          </div>
          <button type="button" onClick={onClose} className="ml-3 shrink-0 p-2 rounded-xl bg-[rgba(244,246,250,0.06)] text-[#A9B3C7] hover:bg-[rgba(244,246,250,0.12)] hover:text-[#F4F6FA] transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form id="edit-product-form" onSubmit={handleSubmit} className="p-5 pb-2 space-y-4">
          {/* Name + Slug */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={lc}>Product Name *</label>
              <input type="text" value={name} onChange={e => setName(e.target.value)} className={ic} placeholder="e.g. BPC-157" required />
            </div>
            <div>
              <label className={lc}>Slug (URL ID)</label>
              <input type="text" value={slug} onChange={e => setSlug(e.target.value)} className={ic} placeholder="e.g. bpc-157" />
            </div>
          </div>

          {/* Category */}
          <div>
            <label className={lc}>Category</label>
            <SelectWrap>
              <select value={category} onChange={e => setCategory(e.target.value)} className={sc}>
                <option value="">Select category...</option>
                <option value="Best Seller">Best Seller</option>
                <option value="High Popularity">High Popularity</option>
                <option value="Popular">Popular</option>
                <option value="Essentials">Essentials</option>
              </select>
            </SelectWrap>
          </div>

          {/* Description */}
          <div>
            <label className={lc}>Description</label>
            <textarea value={description} onChange={e => setDescription(e.target.value)} className={ic} rows={2} placeholder="Short product description" />
          </div>

          {/* Review count + Active toggle */}
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <label className={lc}>Review Count</label>
              <input type="number" min={0} value={reviewCount} onChange={e => setReviewCount(e.target.value)} className={ic} placeholder="0" />
            </div>
            <div className="shrink-0 pt-5">
              <button
                type="button"
                onClick={() => setIsActive(v => !v)}
                className={`flex items-center gap-2 px-4 py-3 rounded-xl border text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-[rgba(46,209,180,0.12)] border-[rgba(46,209,180,0.3)] text-[#2ED1B4]'
                    : 'bg-[rgba(244,246,250,0.05)] border-[rgba(244,246,250,0.12)] text-[#6B7280]'
                }`}
              >
                <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${isActive ? 'border-[#2ED1B4] bg-[#2ED1B4]' : 'border-[#6B7280]'}`}>
                  {isActive && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                </div>
                {isActive ? 'Active' : 'Inactive'}
              </button>
            </div>
          </div>

          {/* More Info */}
          <div>
            <label className={lc}>More Info <span className="text-[#4B5563] normal-case font-normal">(storefront popup)</span></label>
            <textarea value={moreInfo} onChange={e => setMoreInfo(e.target.value)} className={ic} rows={4} placeholder="Research & regulatory information..." />
          </div>

          {/* COA PDF */}
          <div>
            <label className={lc}>COA PDF <span className="text-[#4B5563] normal-case font-normal">(optional)</span></label>
            <div className="space-y-2">
              <label className={`flex items-center justify-center gap-2 w-full px-4 py-3 rounded-xl border border-dashed cursor-pointer transition-colors ${
                isCoaUploading ? 'border-[rgba(244,246,250,0.1)] text-[#4B5563]' : 'border-[rgba(46,209,180,0.35)] text-[#2ED1B4] hover:bg-[rgba(46,209,180,0.06)]'
              }`}>
                <Upload className="w-4 h-4 shrink-0" />
                <span className="text-sm font-medium">{isCoaUploading ? 'Uploading COA...' : 'Replace COA PDF'}</span>
                <input
                  type="file"
                  accept="application/pdf"
                  className="hidden"
                  disabled={isCoaUploading}
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    setIsCoaUploading(true);
                    try {
                      const ext = 'pdf';
                      const base = (slug || name || 'product').toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/gi, '');
                      const fileName = `${base}-${Date.now()}.${ext}`;
                      const { data: uploadData, error: uploadErr } = await supabase.storage.from('coa_file').upload(fileName, file, { upsert: true });
                      if (uploadErr) throw uploadErr;
                      setCoaUrl(uploadData.publicUrl);
                    } catch (err: any) {
                      alert('COA upload failed: ' + (err?.message || 'Unknown error'));
                    } finally {
                      setIsCoaUploading(false);
                    }
                  }}
                />
              </label>
              {coaUrl && (
                <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-[rgba(46,209,180,0.08)] border border-[rgba(46,209,180,0.2)]">
                  <CheckCircle className="w-4 h-4 text-[#2ED1B4] shrink-0" />
                  <span className="text-xs text-[#2ED1B4] truncate flex-1">COA uploaded</span>
                  <button type="button" onClick={() => window.open(coaUrl, '_blank', 'noopener,noreferrer')} className="text-xs text-[#2ED1B4] underline shrink-0">View</button>
                </div>
              )}
            </div>
          </div>

          {/* Product Image */}
          <div>
            <label className={lc}>Product Image</label>
            <div className="space-y-2">
              <div className="flex gap-2 items-center">
                {imageUrl && (
                  <img
                    src={normalizeImageUrl(imageUrl)}
                    alt="Preview"
                    className="w-14 h-14 object-contain rounded-xl bg-[rgba(7,10,18,0.5)] shrink-0 border border-[rgba(244,246,250,0.08)]"
                    onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                  />
                )}
                <input type="text" value={imageUrl} onChange={e => setImageUrl(e.target.value)} className={ic} placeholder="Paste URL or upload below" />
              </div>
              <input type="file" ref={fileInputRef} accept="image/*" className="hidden" onChange={async (e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                setIsUploading(true);
                try {
                  const ext = file.name.split('.').pop() || 'png';
                  const fileName = `${slug || name.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}.${ext}`;
                  const { data, error } = await supabase.storage.from('product-images').upload(fileName, file, { cacheControl: '3600', upsert: true });
                  if (error) throw error;
                  setImageUrl(data.publicUrl);
                } catch (err: any) {
                  alert('Upload failed: ' + (err?.message || 'Unknown error'));
                } finally {
                  setIsUploading(false);
                }
              }} />
              <button type="button" onClick={() => fileInputRef.current?.click()} disabled={isUploading} className="w-full px-3 py-3 rounded-xl border border-dashed border-[rgba(46,209,180,0.35)] text-sm font-medium text-[#2ED1B4] hover:bg-[rgba(46,209,180,0.06)] flex items-center justify-center gap-2 transition-colors disabled:opacity-50">
                <ImageIcon className="w-4 h-4" />
                {isUploading ? 'Uploading...' : 'Upload from Device'}
              </button>
            </div>
          </div>

          {/* Dosage Variations */}
          <div className="pt-3 border-t border-[rgba(244,246,250,0.08)]">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-bold text-[#F4F6FA] flex items-center gap-2">
                <Tag className="w-4 h-4 text-[#2ED1B4]" />
                Dosage Variants ({dosages.length})
              </p>
              <button
                type="button"
                onClick={addDosageRow}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[rgba(46,209,180,0.12)] border border-[rgba(46,209,180,0.25)] text-[#2ED1B4] text-xs font-semibold hover:bg-[rgba(46,209,180,0.2)] transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Variant
              </button>
            </div>

            <div className="space-y-3">
              {dosages.map((row, idx) => {
                const priceNum = parseFloat(row.originalPrice) || 0;
                const preview = priceNum > 0 ? getBundlePricing(priceNum) : null;
                return (
                  <div key={idx} className="rounded-xl bg-[rgba(7,10,18,0.5)] border border-[rgba(244,246,250,0.08)] p-3 space-y-3">
                    {/* Row header: dosage # + remove */}
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-[#2ED1B4]">Variant {idx + 1}</span>
                      <button
                        type="button"
                        onClick={() => removeDosageRow(idx)}
                        disabled={dosages.length === 1}
                        className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[#EF4444] bg-[rgba(239,68,68,0.08)] hover:bg-[rgba(239,68,68,0.15)] disabled:opacity-30 disabled:cursor-not-allowed transition-colors text-xs font-medium"
                      >
                        <Trash2 className="w-3.5 h-3.5" /> Remove
                      </button>
                    </div>

                    {/* Dosage value + Unit */}
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] font-semibold text-[#6B7280] uppercase mb-1">Dosage</label>
                        <input
                          type="text"
                          value={row.mg}
                          onChange={e => updateDosage(idx, 'mg', e.target.value)}
                          placeholder="e.g. 5"
                          className={dic}
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-semibold text-[#6B7280] uppercase mb-1">Unit</label>
                        <SelectWrap>
                          <select value={row.unit} onChange={(e) => updateDosage(idx, 'unit', e.target.value)} className={dsc}>
                            <option value="MG">MG</option>
                            <option value="ML">ML</option>
                            <option value="IU">IU</option>
                            <option value="L">L</option>
                            <option value="PCS">PCS</option>
                          </select>
                        </SelectWrap>
                      </div>
                    </div>

                    {/* Price + Stock qty */}
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] font-semibold text-[#6B7280] uppercase mb-1">Price (SEK)</label>
                        <input
                          type="number"
                          step="0.01"
                          min={0}
                          value={row.originalPrice}
                          onChange={e => updateDosage(idx, 'originalPrice', e.target.value)}
                          placeholder="0.00"
                          className={dic}
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-semibold text-[#6B7280] uppercase mb-1">Stock Qty</label>
                        <input
                          type="number"
                          min={0}
                          value={row.stockQuantity}
                          onChange={e => updateDosage(idx, 'stockQuantity', e.target.value)}
                          className={dic}
                        />
                      </div>
                    </div>

                    {/* In stock toggle */}
                    <button
                      type="button"
                      onClick={() => updateDosage(idx, 'inStock', !row.inStock)}
                      className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl border transition-all ${
                        row.inStock
                          ? 'bg-[rgba(34,197,94,0.08)] border-[rgba(34,197,94,0.25)] text-[#22C55E]'
                          : 'bg-[rgba(239,68,68,0.08)] border-[rgba(239,68,68,0.2)] text-[#EF4444]'
                      }`}
                    >
                      <span className="text-sm font-medium">{row.inStock ? 'In Stock' : 'Out of Stock'}</span>
                      <div className={`w-11 h-7 rounded-full inline-flex items-center shrink-0 transition-colors ${row.inStock ? 'bg-[#22C55E]' : 'bg-[rgba(244,246,250,0.12)]'}`}>
                        <span className={`inline-block w-5 h-5 rounded-full bg-white shadow transition-transform ${row.inStock ? 'translate-x-[22px]' : 'translate-x-[3px]'}`} />
                      </div>
                    </button>

                    {/* Bundle pricing preview */}
                    {preview && (
                      <div className="pt-2 border-t border-[rgba(244,246,250,0.06)]">
                        <p className="text-[10px] font-semibold text-[#2ED1B4] uppercase mb-1.5">Bundle preview</p>
                        <div className="flex gap-1.5 flex-wrap">
                          {[
                            { label: 'Buy 1', price: preview.buy1, disc: '20%' },
                            { label: 'Buy 2', price: preview.buy2, disc: '25%' },
                            { label: 'Buy 3', price: preview.buy3, disc: '30%' },
                            { label: 'Buy 5', price: preview.buy5, disc: '36%' },
                            { label: 'Buy 10', price: preview.buy10, disc: '44%' },
                          ].map(t => (
                            <div key={t.label} className="px-2 py-1.5 rounded-lg bg-[rgba(46,209,180,0.08)] text-center min-w-[50px]">
                              <p className="text-[9px] text-[#A9B3C7]">{t.label}</p>
                              <p className="text-xs font-bold text-[#2ED1B4]">kr {t.price.toFixed(2)}</p>
                              <p className="text-[9px] text-[#22C55E]">{t.disc}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
              {dosages.length === 0 && (
                <p className="text-sm text-[#A9B3C7] text-center py-6">No variants yet. Tap "Add Variant".</p>
              )}
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="flex items-start gap-2 px-4 py-3 rounded-xl bg-[rgba(239,68,68,0.08)] border border-[rgba(239,68,68,0.2)] text-[#EF4444] text-sm">
              <XCircle className="w-4 h-4 shrink-0 mt-0.5" />
              {error}
            </div>
          )}

        </form>

        {/* Sticky action footer — always visible above the bottom nav */}
        <div className="sticky bottom-0 left-0 right-0 bg-[#0F172A] border-t border-[rgba(244,246,250,0.08)] px-5 pt-3 pb-[calc(0.75rem+env(safe-area-inset-bottom,0px))] flex gap-3">
          <button type="button" onClick={onClose} className="flex-1 sm:flex-none px-5 py-3 rounded-xl border border-[rgba(244,246,250,0.15)] text-[#A9B3C7] hover:bg-[rgba(244,246,250,0.05)] font-medium transition-colors">
            Cancel
          </button>
          <button
            form="edit-product-form"
            type="submit"
            disabled={isSaving}
            className="flex-1 px-5 py-3 rounded-xl bg-[#2ED1B4] text-white hover:bg-[#25b89d] active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2 font-semibold transition-all"
          >
            {isSaving ? (
              <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Saving...</>
            ) : (
              <><Save className="w-4 h-4" /> Update</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

/** Rows from `product_waitlist` (admin API), grouped by product_id for the Products tab. */
interface AdminWaitlistRow {
  id?: string;
  product_id: string;
  email: string;
  phone?: string | null;
  created_at?: string;
}

function groupWaitlistByProduct(rows: AdminWaitlistRow[]): Record<string, AdminWaitlistRow[]> {
  const m: Record<string, AdminWaitlistRow[]> = {};
  for (const r of rows) {
    const pid = r.product_id;
    if (!m[pid]) m[pid] = [];
    m[pid].push(r);
  }
  return m;
}

/**
 * Storefront waitlist saves `product_id` as the human slug (see `transformProductFromDB`:
 * `id: dbProduct.slug`). Admin products use Mongo `_id` as `product.id`. Map waitlist
 * rows onto admin cards using UUID and/or slug so counts match reality.
 */
function indexWaitlistForAdminProducts(
  rows: AdminWaitlistRow[],
  products: Product[],
): Record<string, AdminWaitlistRow[]> {
  const byStored = groupWaitlistByProduct(rows);
  const out: Record<string, AdminWaitlistRow[]> = {};
  const dedupe = (list: AdminWaitlistRow[]) => {
    const seen = new Set<string>();
    const acc: AdminWaitlistRow[] = [];
    for (const r of list) {
      const k = (r.id && String(r.id)) || `${r.email}:${r.created_at ?? ''}`;
      if (seen.has(k)) continue;
      seen.add(k);
      acc.push(r);
    }
    return acc;
  };
  for (const p of products) {
    const a = byStored[p.id] ?? [];
    const b = p.slug && p.slug !== p.id ? (byStored[p.slug] ?? []) : [];
    const merged = dedupe([...a, ...b]);
    if (merged.length) out[p.id] = merged;
  }
  return out;
}

// Products Section
function ProductsSection() {
  const [products, setProducts] = useState<Product[]>([]);
  const [waitlistByProduct, setWaitlistByProduct] = useState<Record<string, AdminWaitlistRow[]>>({});
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);
  const [editProduct, setEditProduct] = useState<(Product & { product_dosages?: any[] }) | null>(null);
  const [editError, setEditError] = useState<string | null>(null);
  const [deleteProduct, setDeleteProduct] = useState<Product | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [isReordering, setIsReordering] = useState(false);
  const [productsError, setProductsError] = useState<string | null>(null);
  const loadProductsRequestIdRef = useRef(0);
  /** Prevents overlapping reorders + burst requests if arrows are clicked rapidly. */
  const reorderInFlightRef = useRef(false);

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async (bust = false) => {
    const requestId = ++loadProductsRequestIdRef.current;
    if (bust) {
      invalidateCache('admin:products');
      invalidateCache('admin:product_waitlist');
      invalidateCache('products');
    }
    setLoading(true);
    try {
      const [data, waitlistRows] = await Promise.all([
        cached('admin:products', async () => {
          const { data, error } = await supabase
            .from('products')
            .select('*, product_dosages(*)')
            .order('display_order', { ascending: true, nullsFirst: false })
            .order('name', { ascending: true });
          if (error && error.message?.includes('display_order')) {
            const { data: fallback } = await supabase.from('products').select('*, product_dosages(*)').order('name');
            return fallback || [];
          }
          return data || [];
        }, TTL_ADMIN_PRODUCTS),
        cached('admin:product_waitlist', async () => {
          const { data, error } = await supabase
            .from('product_waitlist')
            .select('id, product_id, email, phone, created_at')
            .order('created_at', { ascending: false });
          if (error) {
            console.warn('Admin product waitlist fetch:', error.message);
            return [] as AdminWaitlistRow[];
          }
          return (data || []) as AdminWaitlistRow[];
        }, TTL_ADMIN_PRODUCTS),
      ]);

      if (requestId === loadProductsRequestIdRef.current) {
        setProducts(data);
        setWaitlistByProduct(indexWaitlistForAdminProducts(waitlistRows, data));
        setProductsError(null);
      }
    } catch (error) {
      console.error('Error loading products:', error);
    } finally {
      if (requestId === loadProductsRequestIdRef.current) setLoading(false);
    }
  };

  const toggleStock = async (dosageId: string, currentStatus: boolean) => {
    if (!dosageId) {
      setProductsError('Missing dosage id. Try refreshing the product list.');
      return;
    }
    try {
      const { error } = await supabase
        .from('product_dosages')
        .update({ in_stock: currentStatus !== true })
        .eq('id', dosageId);
      if (error) {
        setProductsError(error.message || 'Failed to update stock.');
        return;
      }
      await loadProducts(true);
    } catch (error) {
      console.error('Error updating stock:', error);
      setProductsError(error instanceof Error ? error.message : 'Failed to update stock.');
    }
  };

  const handleDeleteProduct = async () => {
    if (!deleteProduct) return;
    setDeleting(true);
    try {
      const { error } = await supabase.from('products').delete().eq('id', deleteProduct.id);
      if (error) throw error;
      setDeleteProduct(null);
      await loadProducts(true);
    } catch (err: any) {
      console.error('Delete product error:', err);
      setEditError(err?.message || 'Failed to delete product.');
    } finally {
      setDeleting(false);
    }
  };

  const moveProduct = async (productId: string, direction: 'up' | 'down') => {
    if (reorderInFlightRef.current) return;
    reorderInFlightRef.current = true;
    setIsReordering(true);
    setProductsError(null);
    try {
      const subset =
        categoryFilter === 'all'
          ? [...products]
          : products.filter(
              (p) =>
                (p.category || '').toLowerCase().replace(/\s+/g, '-') === categoryFilter,
            );

      const idx = subset.findIndex((p) => p.id === productId);
      if (idx < 0) return;
      const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
      if (swapIdx < 0 || swapIdx >= subset.length) return;

      const newSubsetOrder = [...subset];
      [newSubsetOrder[idx], newSubsetOrder[swapIdx]] = [
        newSubsetOrder[swapIdx],
        newSubsetOrder[idx],
      ];

      const subsetIds = new Set(newSubsetOrder.map((p) => p.id));
      const merged: Product[] = [];
      let injectedSubset = false;
      for (const p of products) {
        if (subsetIds.has(p.id)) {
          if (!injectedSubset) {
            merged.push(...newSubsetOrder);
            injectedSubset = true;
          }
          continue;
        }
        merged.push(p);
      }

      const prevById = new Map(products.map((p) => [p.id, (p as { display_order?: unknown }).display_order]));
      const pending: { id: string; display_order: number }[] = [];
      merged.forEach((p, display_order) => {
        const raw = prevById.get(p.id);
        const prevNum =
          raw === undefined || raw === null || raw === ''
            ? null
            : Number(raw);
        const prevNorm = prevNum !== null && Number.isFinite(prevNum) ? prevNum : null;
        if (prevNorm !== display_order) pending.push({ id: p.id, display_order });
      });

      if (pending.length === 0) {
        await loadProducts(true);
        return;
      }

      for (const { id, display_order } of pending) {
        const { error } = await supabase.from('products').update({ display_order }).eq('id', id);
        if (error) {
          setProductsError(error.message || 'Failed to reorder products.');
          await loadProducts(true);
          return;
        }
      }

      await loadProducts(true);
    } catch (err) {
      console.error('Error reordering:', err);
      setProductsError(err instanceof Error ? err.message : 'Failed to reorder.');
      alert('Failed to reorder products.');
    } finally {
      reorderInFlightRef.current = false;
      setIsReordering(false);
    }
  };

  const categories = ['all', ...Array.from(new Set(products.map(p => (p.category || '').toLowerCase().replace(/\s+/g, '-'))))];
  const filteredProducts = categoryFilter === 'all' ? products : products.filter(p => (p.category || '').toLowerCase().replace(/\s+/g, '-') === categoryFilter);

  if (loading) return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Skeleton className="h-7 w-32 rounded" />
        <Skeleton className="h-10 w-36 rounded-xl" />
      </div>
      <div className="flex gap-2">
        {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-8 w-24 rounded-full" />)}
      </div>
      <div className="rounded-2xl bg-[rgba(17,24,39,0.6)] border border-[rgba(244,246,250,0.08)] overflow-hidden">
        <div className="p-4 border-b border-[rgba(244,246,250,0.08)] flex gap-4">
          <Skeleton className="h-4 w-32 rounded" />
          <Skeleton className="h-4 w-24 rounded" />
          <Skeleton className="h-4 w-20 rounded" />
          <Skeleton className="h-4 w-20 rounded ml-auto" />
        </div>
        {[...Array(8)].map((_, i) => (
          <div key={i} className="flex items-center gap-4 p-4 border-b border-[rgba(244,246,250,0.06)]">
            <Skeleton className="h-12 w-12 rounded-lg flex-shrink-0" />
            <div className="flex-1 space-y-1.5">
              <Skeleton className="h-4 w-40 rounded" />
              <Skeleton className="h-3 w-24 rounded" />
            </div>
            <Skeleton className="h-6 w-20 rounded-full" />
            <Skeleton className="h-8 w-16 rounded-lg" />
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap justify-between items-center gap-3">
        <h2 className="text-xl font-bold text-[#F4F6FA]">Products ({products.length})</h2>
        <button
          type="button"
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2 rounded-xl bg-[#2ED1B4] text-white hover:bg-[#25b89d] flex items-center gap-2 transition-colors cursor-pointer relative z-10"
        >
          <Plus className="w-4 h-4" />
          Add Product
        </button>
      </div>

      {/* Category Filter */}
      <div className="flex flex-wrap gap-2">
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setCategoryFilter(cat)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              categoryFilter === cat
                ? 'bg-[#2ED1B4] text-[#070A12]'
                : 'bg-[rgba(244,246,250,0.06)] text-[#A9B3C7] hover:bg-[rgba(244,246,250,0.1)]'
            }`}
          >
            {cat === 'all' ? 'All' : cat.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
          </button>
        ))}
      </div>

      {productsError && (
        <p className="text-sm text-[#EF4444] rounded-lg px-3 py-2 bg-[rgba(239,68,68,0.12)] border border-[rgba(239,68,68,0.25)]">{productsError}</p>
      )}

      {showAddModal && (
        <AddProductModal
          onClose={() => { setShowAddModal(false); setAddError(null); }}
          onSaved={() => { setShowAddModal(false); setAddError(null); void loadProducts(true); }}
          setError={setAddError}
          error={addError}
        />
      )}

      {editProduct && (
        <EditProductModal
          product={editProduct}
          onClose={() => { setEditProduct(null); setEditError(null); }}
          onSaved={() => { setEditProduct(null); setEditError(null); void loadProducts(true); }}
          setError={setEditError}
          error={editError}
        />
      )}

      {deleteProduct && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60" onClick={() => { setDeleteProduct(null); setEditError(null); }}>
          <div className="bg-[#111827] border border-[rgba(244,246,250,0.08)] rounded-2xl max-w-sm w-full p-6 shadow-xl" onClick={e => e.stopPropagation()}>
            <p className="text-[#F4F6FA] font-medium mb-2">Delete product?</p>
            <p className="text-sm text-[#A9B3C7] mb-4">“{deleteProduct.name}” will be removed. Dosages will be deleted. This cannot be undone.</p>
            {editError && <p className="text-sm text-[#EF4444] mb-3">{editError}</p>}
            <div className="flex gap-3">
              <button type="button" onClick={() => { setDeleteProduct(null); setEditError(null); }} className="flex-1 px-4 py-2 rounded-xl border border-[rgba(244,246,250,0.2)] text-[#A9B3C7] hover:bg-[rgba(244,246,250,0.05)]">Cancel</button>
              <button type="button" onClick={handleDeleteProduct} disabled={deleting} className="flex-1 px-4 py-2 rounded-xl bg-[#EF4444] text-white hover:bg-[#DC2626] disabled:opacity-50">
                {deleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {filteredProducts.map((product, idx) => (
          <div key={product.id} className={`p-4 rounded-xl bg-[rgba(17,24,39,0.6)] border ${product.is_active ? 'border-[rgba(244,246,250,0.08)]' : 'border-[#EF4444] opacity-60'}`}>
            <div className="flex items-start gap-4 mb-4">
              {/* Move up/down buttons */}
              <div className="flex flex-col gap-1 shrink-0">
                <button
                  type="button"
                  disabled={idx === 0 || isReordering}
                  onClick={() => moveProduct(product.id, 'up')}
                  className="p-1 rounded text-[#A9B3C7] hover:text-[#2ED1B4] hover:bg-[rgba(46,209,180,0.1)] disabled:opacity-30 disabled:cursor-not-allowed"
                  title="Move up"
                >
                  <ArrowUp className="w-4 h-4" />
                </button>
                <span className="text-[10px] text-center text-[#A9B3C7]">{idx + 1}</span>
                <button
                  type="button"
                  disabled={idx === filteredProducts.length - 1 || isReordering}
                  onClick={() => moveProduct(product.id, 'down')}
                  className="p-1 rounded text-[#A9B3C7] hover:text-[#2ED1B4] hover:bg-[rgba(46,209,180,0.1)] disabled:opacity-30 disabled:cursor-not-allowed"
                  title="Move down"
                >
                  <ArrowDown className="w-4 h-4" />
                </button>
              </div>
              <ProductImage product={product} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h4 className="font-medium text-[#F4F6FA]">{product.name}</h4>
                  {!product.is_active && <span className="px-2 py-0.5 rounded bg-[#EF4444] text-white text-[10px]">INACTIVE</span>}
                  <div className="ml-auto flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => setEditProduct(product as Product & { product_dosages?: any[] })}
                      className="p-2 rounded-lg text-[#A9B3C7] hover:bg-[rgba(46,209,180,0.15)] hover:text-[#2ED1B4]"
                      title="Edit product"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => { setEditError(null); setDeleteProduct(product); }}
                      className="p-2 rounded-lg text-[#A9B3C7] hover:bg-[rgba(239,68,68,0.15)] hover:text-[#EF4444]"
                      title="Delete product"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <p className="text-xs text-[#A9B3C7] mt-1">{product.category}</p>
                <p className="text-xs text-[#A9B3C7] mt-1">Displayed reviews: {product.review_count ?? 0}</p>
                <div className="flex items-center gap-2 mt-2">
                  <span className={`w-2 h-2 rounded-full ${product.product_dosages?.some((d: any) => d.in_stock) ? 'bg-[#22C55E]' : 'bg-[#EF4444]'}`} />
                  <span className="text-xs text-[#A9B3C7]">
                    {product.product_dosages?.filter((d: any) => d.in_stock).length || 0}/{product.product_dosages?.length || 0} in stock
                  </span>
                </div>
                {(() => {
                  const wl = waitlistByProduct[product.id] ?? [];
                  if (wl.length === 0) {
                    return (
                      <p className="text-xs text-[#A9B3C7]/70 mt-2 flex items-center gap-1.5">
                        <UserPlus className="w-3.5 h-3.5 shrink-0 opacity-70" />
                        Priority waitlist: 0
                      </p>
                    );
                  }
                  return (
                    <details className="mt-2 rounded-lg bg-[rgba(139,92,246,0.08)] border border-[rgba(139,92,246,0.2)] px-2.5 py-2">
                      <summary className="text-xs font-medium text-[#C4B5FD] cursor-pointer list-none flex items-center gap-2 [&::-webkit-details-marker]:hidden">
                        <UserPlus className="w-3.5 h-3.5 shrink-0" />
                        Priority waitlist: {wl.length} {wl.length === 1 ? 'person' : 'people'}
                        <span className="text-[#A9B3C7] font-normal">— click to show emails</span>
                      </summary>
                      <ul className="mt-2 space-y-1.5 max-h-36 overflow-y-auto border-t border-[rgba(139,92,246,0.15)] pt-2">
                        {wl.map((w) => (
                          <li key={w.id ?? `${w.email}-${w.created_at ?? ''}`} className="text-[11px] leading-snug">
                            <span className="text-[#F4F6FA]">{w.email}</span>
                            {w.phone ? <span className="text-[#A9B3C7]"> · {w.phone}</span> : null}
                          </li>
                        ))}
                      </ul>
                    </details>
                  );
                })()}
              </div>
            </div>

            <div className="space-y-2">
              {product.product_dosages?.map((dosage: any) => (
                <div key={dosage.id} className="flex items-center justify-between p-2 rounded-lg bg-[rgba(7,10,18,0.5)]">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => toggleStock(dosage.id, dosage.in_stock)}
                      className={`w-8 h-8 rounded-lg flex items-center justify-center ${dosage.in_stock ? 'bg-[#22C55E]' : 'bg-[#EF4444]'}`}
                    >
                      {dosage.in_stock ? <CheckCircle className="w-4 h-4 text-white" /> : <XCircle className="w-4 h-4 text-white" />}
                    </button>
                    <span className="text-sm text-[#F4F6FA]">{dosage.mg} {dosage.unit ?? 'MG'}</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-xs text-[#A9B3C7]">Stock: {dosage.stock_quantity}</span>
                    <span className="text-sm text-[#2ED1B4]">kr {dosage.originalPrice ?? dosage.price ?? '—'}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Users Section
function UsersSection() {
  const [users, setUsers] = useState<any[]>([]);
  const [userBalances, setUserBalances] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [deleteUser, setDeleteUser] = useState<any>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [adminEmail, setAdminEmail] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [pointsModal, setPointsModal] = useState<{ user: any; mode: 'add' | 'deduct' } | null>(null);
  const [pointsAmount, setPointsAmount] = useState('');
  const [pointsReason, setPointsReason] = useState('');
  const [pointsLoading, setPointsLoading] = useState(false);
  const [banUser, setBanUser] = useState<any>(null);
  const [banning, setBanning] = useState(false);
  // Points history per user (expanded view)
  const [expandedUserId, setExpandedUserId] = useState<string | null>(null);
  const [userPointsHistory, setUserPointsHistory] = useState<PointsEvent[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const loadUsersRequestIdRef = useRef(0);

  useEffect(() => {
    (async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      setAdminEmail(session?.user?.email || '');
    })();
  }, []);

  useEffect(() => { loadUsers(); }, []);

  useEffect(() => {
    if (!POINTS_SYSTEM_ENABLED) return;
    const onPointsUpdated = () => {
      void loadUsers();
    };
    window.addEventListener('vironlabs:points-updated', onPointsUpdated);
    return () => window.removeEventListener('vironlabs:points-updated', onPointsUpdated);
  }, []);

  const loadUsers = async (bust = false) => {
    const requestId = ++loadUsersRequestIdRef.current;
    if (bust) invalidateCache('admin:users');
    setLoading(true);
    try {
      const result = await cached('admin:users', async () => {
        const { data, error } = await supabase.rpc('admin_get_all_users');
        const users = error
          ? ((await supabase.from('profiles').select('*').order('created_at', { ascending: false })).data || [])
          : (data || []);
        const balMap: Record<string, number> = {};
        if (POINTS_SYSTEM_ENABLED) {
          const { data: balRows, error: balErr } = await supabase.from('user_points_balance').select('user_id, balance');
          if (balErr) {
            const { data: rawRows } = await supabase.from('user_points').select('user_id, points');
            (rawRows || []).forEach((r: any) => { balMap[r.user_id] = (balMap[r.user_id] || 0) + (r.points || 0); });
          } else {
            (balRows || []).forEach((r: any) => { balMap[r.user_id] = Number(r.balance || 0); });
          }
        }
        return { users, balMap };
      }, TTL_ADMIN_USERS);
      if (requestId === loadUsersRequestIdRef.current) { setUsers(result.users); setUserBalances(result.balMap); }
    } catch (error) { console.error('Error loading users:', error); }
    finally {
      if (requestId === loadUsersRequestIdRef.current) setLoading(false);
    }
  };

  const handleExpandUser = async (userId: string) => {
    if (!POINTS_SYSTEM_ENABLED) return;
    if (expandedUserId === userId) {
      setExpandedUserId(null);
      setUserPointsHistory([]);
      return;
    }
    setExpandedUserId(userId);
    setHistoryLoading(true);
    try {
      const history = await getUserTransactions(userId);
      setUserPointsHistory(history);
    } catch (err) { console.error('Error loading history:', err); }
    finally { setHistoryLoading(false); }
  };

  const handleDeleteUser = async () => {
    if (!deleteUser) return;
    setDeleting(true); setDeleteError(null);
    try {
      const userId = deleteUser.id;
      const { error: errProfiles } = await supabase.from('profiles').delete().eq('id', userId);
      if (errProfiles) throw errProfiles;
      setDeleteUser(null); await loadUsers(true);
    } catch (err: any) { setDeleteError(err?.message || 'Failed to delete user.'); }
    finally { setDeleting(false); }
  };

  const handlePointsSubmit = async () => {
    if (!POINTS_SYSTEM_ENABLED) return;
    if (!pointsModal || !pointsAmount) return;
    setPointsLoading(true);
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const adminId = session?.user?.id ?? 'unknown';

      const amount = parseInt(pointsAmount);
      if (isNaN(amount) || amount <= 0) { alert('Enter a valid positive number'); setPointsLoading(false); return; }
      const pts = pointsModal.mode === 'deduct' ? -amount : amount;
      const desc = pointsReason || (pointsModal.mode === 'add' ? 'Admin adjustment' : 'Admin deduction');
      try {
        await addUserPoints(pointsModal.user.id, pts, 'admin_adjustment', desc, null);
        await logAdminAction(adminId, pointsModal.mode === 'add' ? 'add_points' : 'deduct_points', 'user', String(pointsModal.user.id), {
          points: pts,
          reason: desc,
        });
      } catch (rpcErr: unknown) {
        const msg = (rpcErr as { message?: string } | null)?.message ?? String(rpcErr);
        await logAdminAction(adminId, 'points_update_failed', 'user', String(pointsModal.user.id), {
          attemptedPoints: pts,
          reason: desc,
          error: msg,
        });
        throw new Error(msg);
      }

      setPointsModal(null); setPointsAmount(''); setPointsReason(''); await loadUsers(true);
    } catch (err: any) { alert('Failed: ' + (err?.message || 'Unknown error')); }
    finally { setPointsLoading(false); }
  };

  const handleBanUser = async () => {
    if (!banUser) return;
    setBanning(true);
    try {
      const { error } = await supabase.from('profiles').update({ is_banned: true }).eq('id', banUser.id);
      if (error) throw error;
      setBanUser(null); await loadUsers(true);
    } catch (err: any) { alert('Failed to ban: ' + (err?.message || 'Unknown error')); }
    finally { setBanning(false); }
  };

  const handleUnbanUser = async (userId: string) => {
    try { await supabase.from('profiles').update({ is_banned: false }).eq('id', userId); await loadUsers(true); }
    catch (err: any) { alert('Failed to unban: ' + (err?.message || 'Unknown error')); }
  };

  const filteredUsers = users.filter(u => {
    const q = searchQuery.toLowerCase();
    if (!q) return true;
    return (u.email || '').toLowerCase().includes(q) || (u.full_name || '').toLowerCase().includes(q);
  });

  if (loading) return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Skeleton className="h-7 w-28 rounded" />
      </div>
      <Skeleton className="h-12 w-full rounded-xl" />
      <div className="rounded-2xl bg-[rgba(17,24,39,0.6)] border border-[rgba(244,246,250,0.08)] overflow-hidden">
        <div className="p-4 border-b border-[rgba(244,246,250,0.08)] flex gap-6">
          <Skeleton className="h-4 w-48 rounded" />
          <Skeleton className="h-4 w-32 rounded" />
          <Skeleton className="h-4 w-20 rounded ml-auto" />
        </div>
        {[...Array(8)].map((_, i) => (
          <div key={i} className="flex items-center gap-4 p-4 border-b border-[rgba(244,246,250,0.06)]">
            <Skeleton className="h-9 w-9 rounded-full flex-shrink-0" />
            <div className="flex-1 space-y-1.5">
              <Skeleton className="h-4 w-40 rounded" />
              <Skeleton className="h-3 w-28 rounded" />
            </div>
            <Skeleton className="h-6 w-16 rounded-full" />
            <Skeleton className="h-8 w-20 rounded-lg" />
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-[#F4F6FA]">Users ({users.length})</h2>
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#A9B3C7]" />
        <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search users..." className="w-full pl-12 pr-4 py-3 rounded-xl bg-[rgba(7,10,18,0.6)] border border-[rgba(244,246,250,0.1)] text-[#F4F6FA] placeholder-[#A9B3C7] focus:outline-none focus:border-[#2ED1B4]" />
      </div>

      {POINTS_SYSTEM_ENABLED && pointsModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60" onClick={() => setPointsModal(null)}>
          <div className="bg-[#111827] border border-[rgba(244,246,250,0.08)] rounded-2xl max-w-sm w-full p-6 shadow-xl" onClick={e => e.stopPropagation()}>
            <h3 className="text-[#F4F6FA] font-medium mb-1">{pointsModal.mode === 'add' ? 'Add Points' : 'Deduct Points'}</h3>
            <p className="text-sm text-[#A9B3C7] mb-4">For: {pointsModal.user.email}</p>
            <div className="space-y-3">
              <input type="number" min="1" value={pointsAmount} onChange={e => setPointsAmount(e.target.value)} placeholder="Points amount" className="w-full px-3 py-2 rounded-lg bg-[rgba(7,10,18,0.5)] border border-[rgba(244,246,250,0.1)] text-[#F4F6FA] text-sm" />
              <input type="text" value={pointsReason} onChange={e => setPointsReason(e.target.value)} placeholder="Reason (optional)" className="w-full px-3 py-2 rounded-lg bg-[rgba(7,10,18,0.5)] border border-[rgba(244,246,250,0.1)] text-[#F4F6FA] text-sm" />
            </div>
            <div className="flex gap-3 mt-4">
              <button onClick={() => setPointsModal(null)} className="flex-1 px-4 py-2 rounded-xl border border-[rgba(244,246,250,0.2)] text-[#A9B3C7]">Cancel</button>
              <button onClick={handlePointsSubmit} disabled={pointsLoading || !pointsAmount} className={`flex-1 px-4 py-2 rounded-xl text-white disabled:opacity-50 ${pointsModal.mode === 'add' ? 'bg-[#22C55E] hover:bg-[#16A34A]' : 'bg-[#EF4444] hover:bg-[#DC2626]'}`}>
                {pointsLoading ? 'Processing...' : pointsModal.mode === 'add' ? 'Add Points' : 'Deduct Points'}
              </button>
            </div>
          </div>
        </div>
      )}

      {banUser && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60" onClick={() => setBanUser(null)}>
          <div className="bg-[#111827] border border-[rgba(244,246,250,0.08)] rounded-2xl max-w-sm w-full p-6 shadow-xl" onClick={e => e.stopPropagation()}>
            <p className="text-[#F4F6FA] font-medium mb-2">Ban user?</p>
            <p className="text-sm text-[#A9B3C7] mb-4">&quot;{banUser.email}&quot; will be banned.</p>
            <div className="flex gap-3">
              <button onClick={() => setBanUser(null)} className="flex-1 px-4 py-2 rounded-xl border border-[rgba(244,246,250,0.2)] text-[#A9B3C7]">Cancel</button>
              <button onClick={handleBanUser} disabled={banning} className="flex-1 px-4 py-2 rounded-xl bg-[#EF4444] text-white disabled:opacity-50">{banning ? 'Banning...' : 'Ban User'}</button>
            </div>
          </div>
        </div>
      )}

      {deleteUser && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60" onClick={() => { setDeleteUser(null); setDeleteError(null); }}>
          <div className="bg-[#111827] border border-[rgba(244,246,250,0.08)] rounded-2xl max-w-sm w-full p-6 shadow-xl" onClick={e => e.stopPropagation()}>
            <p className="text-[#F4F6FA] font-medium mb-2">Delete user?</p>
            <p className="text-sm text-[#A9B3C7] mb-4">&quot;{deleteUser.email}&quot; will be removed permanently.</p>
            {deleteError && <p className="text-sm text-[#EF4444] mb-3">{deleteError}</p>}
            <div className="flex gap-3">
              <button onClick={() => { setDeleteUser(null); setDeleteError(null); }} className="flex-1 px-4 py-2 rounded-xl border border-[rgba(244,246,250,0.2)] text-[#A9B3C7]">Cancel</button>
              <button onClick={handleDeleteUser} disabled={deleting} className="flex-1 px-4 py-2 rounded-xl bg-[#EF4444] text-white disabled:opacity-50">{deleting ? 'Deleting...' : 'Delete'}</button>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-3">
        {filteredUsers.map((user) => {
          const isExpanded = expandedUserId === user.id;
          return (
            <div key={user.id} className={`rounded-xl bg-[rgba(17,24,39,0.6)] border overflow-hidden ${user.is_banned ? 'border-[#EF4444] opacity-70' : 'border-[rgba(244,246,250,0.08)]'}`}>
              <div className="p-3 sm:p-4">
                {/* Top row: name + badges */}
                <div className="flex items-start justify-between gap-3 mb-2 sm:mb-0">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <p className="font-medium text-[#F4F6FA] text-sm truncate">{user.full_name || user.email}</p>
                      {user.is_banned && <span className="px-1.5 py-0.5 rounded bg-[#EF4444] text-white text-[9px] font-bold">BANNED</span>}
                      {user.is_admin && <span className="px-1.5 py-0.5 rounded bg-[#8B5CF6] text-white text-[9px] font-bold">ADMIN</span>}
                    </div>
                    <p className="text-xs text-[#A9B3C7] truncate mt-0.5">{user.email}</p>
                  </div>
                  {POINTS_SYSTEM_ENABLED && (
                    <div className="text-right shrink-0">
                      <button
                        onClick={() => handleExpandUser(user.id)}
                        className="text-[10px] text-[#2ED1B4] hover:underline"
                      >
                        {isExpanded ? 'Hide history' : 'History'}
                      </button>
                    </div>
                  )}
                </div>
                {/* Action buttons row */}
                <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                  {POINTS_SYSTEM_ENABLED && (
                    <>
                      <button type="button" onClick={() => setPointsModal({ user, mode: 'add' })} className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[#22C55E] bg-[rgba(34,197,94,0.08)] hover:bg-[rgba(34,197,94,0.15)] text-xs font-medium transition-colors" title="Add points">
                        <PlusCircle className="w-3.5 h-3.5" /> Add pts
                      </button>
                      <button type="button" onClick={() => setPointsModal({ user, mode: 'deduct' })} className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[#F59E0B] bg-[rgba(245,158,11,0.08)] hover:bg-[rgba(245,158,11,0.15)] text-xs font-medium transition-colors" title="Deduct points">
                        <MinusCircle className="w-3.5 h-3.5" /> Deduct
                      </button>
                    </>
                  )}
                  {user.email !== adminEmail ? (
                    <>
                      {user.is_banned ? (
                        <button type="button" onClick={() => handleUnbanUser(user.id)} className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[#22C55E] bg-[rgba(34,197,94,0.08)] hover:bg-[rgba(34,197,94,0.15)] text-xs font-medium transition-colors" title="Unban">
                          <CheckCircle className="w-3.5 h-3.5" /> Unban
                        </button>
                      ) : (
                        <button type="button" onClick={() => setBanUser(user)} className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[#F59E0B] bg-[rgba(245,158,11,0.08)] hover:bg-[rgba(245,158,11,0.15)] text-xs font-medium transition-colors" title="Ban">
                          <Ban className="w-3.5 h-3.5" /> Ban
                        </button>
                      )}
                      <button type="button" onClick={() => { setDeleteError(null); setDeleteUser(user); }} className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[#EF4444] bg-[rgba(239,68,68,0.08)] hover:bg-[rgba(239,68,68,0.15)] text-xs font-medium transition-colors ml-auto" title="Delete">
                        <Trash2 className="w-3.5 h-3.5" /> Delete
                      </button>
                    </>
                  ) : <span className="text-xs text-[#A9B3C7] px-2 ml-auto">(you)</span>}
                </div>
              </div>
              {POINTS_SYSTEM_ENABLED && isExpanded && (
                <div className="border-t border-[rgba(244,246,250,0.06)] bg-[rgba(7,10,18,0.4)] p-4">
                  <p className="text-xs font-semibold text-[#A9B3C7] uppercase tracking-wider mb-3">
                    Points History
                  </p>
                  {historyLoading ? (
                    <div className="py-4 text-center text-sm text-[#A9B3C7]">Loading...</div>
                  ) : userPointsHistory.length === 0 ? (
                    <p className="text-sm text-[#A9B3C7]">No points history found.</p>
                  ) : (
                    <div className="space-y-2 max-h-60 overflow-y-auto">
                      {userPointsHistory.map((ev) => (
                        <div key={ev.id} className="flex items-center justify-between px-3 py-2 rounded-lg bg-[rgba(17,24,39,0.5)] text-sm">
                          <div>
                            <span className="text-[#F4F6FA] font-medium">{POINT_TYPE_LABELS[ev.type as keyof typeof POINT_TYPE_LABELS] || ev.type}</span>
                            {ev.description && <span className="ml-2 text-[#A9B3C7] text-xs">· {ev.description}</span>}
                            <p className="text-[10px] text-[rgba(169,179,199,0.6)]">{new Date(ev.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                          </div>
                          <span className={`font-bold text-sm ml-4 ${ev.points >= 0 ? 'text-[#22C55E]' : 'text-[#EF4444]'}`}>
                            {ev.points >= 0 ? '+' : ''}{ev.points}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Reviews Admin Section
function ReviewsAdminSection() {
  const [reviews, setReviews] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingReview, setEditingReview] = useState<any>(null);
  const [deleteReview, setDeleteReview] = useState<any>(null);
  const [deleting, setDeleting] = useState(false);

  // Add review form state
  const [reviewProductId, setReviewProductId] = useState('');
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewTitle, setReviewTitle] = useState('');
  const [reviewComment, setReviewComment] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editError, setEditError] = useState<string | null>(null);
  const [userMap, setUserMap] = useState<Record<string, string>>({});
  const [editProductId, setEditProductId] = useState('');
  const [editRating, setEditRating] = useState(5);
  const [editTitle, setEditTitle] = useState('');
  const [editComment, setEditComment] = useState('');
  const [editHelpfulCount, setEditHelpfulCount] = useState('0');
  const [editVerifiedPurchase, setEditVerifiedPurchase] = useState(false);
  const [editApproved, setEditApproved] = useState(true);

  useEffect(() => { loadData(); }, []);

  const loadData = async (bust = false) => {
    if (bust) invalidateCache('admin:reviews');
    setLoading(true);
    try {
      const result = await cached('admin:reviews', async () => {
        const [{ data: reviewsData }, { data: productsData }, { data: profilesData }] = await Promise.all([
          supabase.from('reviews').select('*, products(name)').order('created_at', { ascending: false }),
          supabase.from('products').select('id, name, slug').order('name'),
          supabase.from('profiles').select('id, full_name, email'),
        ]);
        const map: Record<string, string> = {};
        (profilesData || []).forEach((p: any) => { map[p.id] = p.full_name || p.email || 'User'; });
        return { reviews: reviewsData || [], products: productsData || [], userMap: map };
      }, TTL_ADMIN_REVIEWS);

      setReviews(result.reviews);
      setProducts(result.products);
      setUserMap(result.userMap);
    } catch (err) {
      console.error('Error loading reviews:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddReview = async () => {
    if (!reviewProductId || !reviewComment.trim()) { setError('Product and comment are required'); return; }
    setIsSaving(true); setError(null);
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const user = session?.user;
      if (!user) throw new Error('Not authenticated');

      const { error: insertErr } = await supabase.from('reviews').insert({
        user_id: user.id,
        product_id: reviewProductId,
        rating: reviewRating,
        title: reviewTitle.trim() || null,
        comment: reviewComment.trim(),
        is_verified_purchase: true,
        is_approved: true,
        helpful_count: 0,
      });
      if (insertErr) throw insertErr;

      setShowAddModal(false);
      setReviewProductId('');
      setReviewRating(5);
      setReviewTitle('');
      setReviewComment('');
      await loadData(true);
    } catch (err: any) {
      setError(err?.message || 'Failed to add review');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteReview = async () => {
    if (!deleteReview) return;
    setDeleting(true);
    try {
      const { error: delErr } = await supabase.from('reviews').delete().eq('id', deleteReview.id);
      if (delErr) throw delErr;
      setDeleteReview(null);
      await loadData(true);
    } catch (err: any) {
      alert('Failed to delete: ' + (err?.message || 'Unknown error'));
    } finally {
      setDeleting(false);
    }
  };

  const openEditReview = (review: any) => {
    setEditingReview(review);
    setEditProductId(review.product_id || '');
    setEditRating(Math.max(1, Math.min(5, Number(review.rating) || 5)));
    setEditTitle(review.title || '');
    setEditComment(review.comment || '');
    setEditHelpfulCount(String(Math.max(0, Number(review.helpful_count) || 0)));
    setEditVerifiedPurchase(Boolean(review.is_verified_purchase));
    setEditApproved(review.is_approved !== false);
    setEditError(null);
    setShowEditModal(true);
  };

  const handleUpdateReview = async () => {
    if (!editingReview?.id) return;
    if (!editProductId || !editComment.trim()) {
      setEditError('Product and comment are required');
      return;
    }

    setIsUpdating(true);
    setEditError(null);
    try {
      const payload = {
        product_id: editProductId,
        rating: Math.max(1, Math.min(5, Number(editRating) || 5)),
        title: editTitle.trim() || null,
        comment: editComment.trim(),
        is_verified_purchase: editVerifiedPurchase,
        is_approved: editApproved,
        helpful_count: Math.max(0, parseInt(editHelpfulCount, 10) || 0),
      };

      const { error: updateErr } = await supabase
        .from('reviews')
        .update(payload)
        .eq('id', editingReview.id);
      if (updateErr) throw updateErr;

      setShowEditModal(false);
      setEditingReview(null);
      await loadData(true);
    } catch (err: any) {
      setEditError(err?.message || 'Failed to update review');
    } finally {
      setIsUpdating(false);
    }
  };

  if (loading) return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Skeleton className="h-7 w-36 rounded" />
        <Skeleton className="h-10 w-36 rounded-xl" />
      </div>
      <div className="rounded-2xl bg-[rgba(17,24,39,0.6)] border border-[rgba(244,246,250,0.08)] overflow-hidden">
        <div className="p-4 border-b border-[rgba(244,246,250,0.08)] flex gap-4">
          <Skeleton className="h-4 w-32 rounded" />
          <Skeleton className="h-4 w-24 rounded" />
          <Skeleton className="h-4 w-16 rounded ml-auto" />
        </div>
        {[...Array(8)].map((_, i) => (
          <div key={i} className="flex items-start gap-4 p-4 border-b border-[rgba(244,246,250,0.06)]">
            <div className="flex-1 space-y-2">
              <div className="flex items-center gap-3">
                <Skeleton className="h-4 w-28 rounded" />
                <Skeleton className="h-4 w-20 rounded" />
                <Skeleton className="h-5 w-24 rounded-full ml-auto" />
              </div>
              <Skeleton className="h-3 w-full max-w-md rounded" />
            </div>
            <div className="flex gap-2 flex-shrink-0">
              <Skeleton className="h-8 w-8 rounded-lg" />
              <Skeleton className="h-8 w-8 rounded-lg" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-[#F4F6FA]">Reviews ({reviews.length})</h2>
        <button onClick={() => setShowAddModal(true)} className="px-4 py-2 rounded-xl bg-[#2ED1B4] text-white hover:bg-[#25b89d] flex items-center gap-2">
          <Plus className="w-4 h-4" /> Write Review
        </button>
      </div>

      {/* Add Review Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60" onClick={() => setShowAddModal(false)}>
          <div className="bg-[#111827] border border-[rgba(244,246,250,0.08)] rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-xl" onClick={e => e.stopPropagation()}>
            <div className="p-6 flex justify-between items-center border-b border-[rgba(244,246,250,0.08)]">
              <h3 className="text-lg font-semibold text-[#F4F6FA]">Write a Review</h3>
              <button onClick={() => setShowAddModal(false)} className="p-2 rounded-lg text-[#A9B3C7] hover:text-[#F4F6FA]"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-[#A9B3C7] mb-1.5">Product *</label>
                <div className="relative">
                  <select value={reviewProductId} onChange={e => setReviewProductId(e.target.value)} className="w-full px-3 py-3 pr-9 rounded-xl bg-[rgba(7,10,18,0.5)] border border-[rgba(244,246,250,0.1)] text-[#F4F6FA] text-base focus:outline-none focus:border-[#2ED1B4] transition-colors appearance-none">
                    <option value="">Select product...</option>
                    {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#A9B3C7]" />
                </div>
              </div>
              <div>
                <label className="block text-sm text-[#A9B3C7] mb-1">Rating</label>
                <div className="flex gap-1">
                  {[1,2,3,4,5].map(s => (
                    <button key={s} type="button" onClick={() => setReviewRating(s)} className="p-1">
                      <Star className={`w-6 h-6 ${s <= reviewRating ? 'fill-[#F59E0B] text-[#F59E0B]' : 'text-[rgba(244,246,250,0.2)]'}`} />
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm text-[#A9B3C7] mb-1">Title (optional)</label>
                <input type="text" value={reviewTitle} onChange={e => setReviewTitle(e.target.value)} className="w-full px-3 py-2 rounded-lg bg-[rgba(7,10,18,0.5)] border border-[rgba(244,246,250,0.1)] text-[#F4F6FA]" placeholder="Great product!" />
              </div>
              <div>
                <label className="block text-sm text-[#A9B3C7] mb-1">Comment *</label>
                <textarea value={reviewComment} onChange={e => setReviewComment(e.target.value)} className="w-full px-3 py-2 rounded-lg bg-[rgba(7,10,18,0.5)] border border-[rgba(244,246,250,0.1)] text-[#F4F6FA]" rows={3} placeholder="Write your review..." />
              </div>
              {error && <p className="text-sm text-[#EF4444]">{error}</p>}
              <div className="flex gap-3">
                <button onClick={() => setShowAddModal(false)} className="px-4 py-2 rounded-xl border border-[rgba(244,246,250,0.2)] text-[#A9B3C7]">Cancel</button>
                <button onClick={handleAddReview} disabled={isSaving} className="px-4 py-2 rounded-xl bg-[#2ED1B4] text-white disabled:opacity-50">
                  {isSaving ? 'Saving...' : 'Post Review'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Review Modal */}
      {deleteReview && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60" onClick={() => setDeleteReview(null)}>
          <div className="bg-[#111827] border border-[rgba(244,246,250,0.08)] rounded-2xl max-w-sm w-full p-6 shadow-xl" onClick={e => e.stopPropagation()}>
            <p className="text-[#F4F6FA] font-medium mb-2">Delete review?</p>
            <p className="text-sm text-[#A9B3C7] mb-4">This review will be permanently removed.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteReview(null)} className="flex-1 px-4 py-2 rounded-xl border border-[rgba(244,246,250,0.2)] text-[#A9B3C7]">Cancel</button>
              <button onClick={handleDeleteReview} disabled={deleting} className="flex-1 px-4 py-2 rounded-xl bg-[#EF4444] text-white disabled:opacity-50">{deleting ? 'Deleting...' : 'Delete'}</button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Review Modal */}
      {showEditModal && editingReview && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60" onClick={() => setShowEditModal(false)}>
          <div className="bg-[#111827] border border-[rgba(244,246,250,0.08)] rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-xl" onClick={e => e.stopPropagation()}>
            <div className="p-6 flex justify-between items-center border-b border-[rgba(244,246,250,0.08)]">
              <h3 className="text-lg font-semibold text-[#F4F6FA]">Edit Review</h3>
              <button onClick={() => setShowEditModal(false)} className="p-2 rounded-lg text-[#A9B3C7] hover:text-[#F4F6FA]"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-[#A9B3C7] mb-1.5">Product *</label>
                <div className="relative">
                  <select value={editProductId} onChange={e => setEditProductId(e.target.value)} className="w-full px-3 py-3 pr-9 rounded-xl bg-[rgba(7,10,18,0.5)] border border-[rgba(244,246,250,0.1)] text-[#F4F6FA] text-base focus:outline-none focus:border-[#2ED1B4] transition-colors appearance-none">
                    <option value="">Select product...</option>
                    {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#A9B3C7]" />
                </div>
              </div>
              <div>
                <label className="block text-sm text-[#A9B3C7] mb-1">Rating</label>
                <div className="flex gap-1">
                  {[1,2,3,4,5].map(s => (
                    <button key={s} type="button" onClick={() => setEditRating(s)} className="p-1">
                      <Star className={`w-6 h-6 ${s <= editRating ? 'fill-[#F59E0B] text-[#F59E0B]' : 'text-[rgba(244,246,250,0.2)]'}`} />
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm text-[#A9B3C7] mb-1">Title (optional)</label>
                <input type="text" value={editTitle} onChange={e => setEditTitle(e.target.value)} className="w-full px-3 py-2 rounded-lg bg-[rgba(7,10,18,0.5)] border border-[rgba(244,246,250,0.1)] text-[#F4F6FA]" placeholder="Great product!" />
              </div>
              <div>
                <label className="block text-sm text-[#A9B3C7] mb-1">Comment *</label>
                <textarea value={editComment} onChange={e => setEditComment(e.target.value)} className="w-full px-3 py-2 rounded-lg bg-[rgba(7,10,18,0.5)] border border-[rgba(244,246,250,0.1)] text-[#F4F6FA]" rows={3} placeholder="Write your review..." />
              </div>
              <div>
                <label className="block text-sm text-[#A9B3C7] mb-1">Helpful votes</label>
                <input type="number" min={0} value={editHelpfulCount} onChange={e => setEditHelpfulCount(e.target.value)} className="w-full px-3 py-2 rounded-lg bg-[rgba(7,10,18,0.5)] border border-[rgba(244,246,250,0.1)] text-[#F4F6FA]" />
                <p className="text-[11px] text-[#A9B3C7] mt-1">This is the number of users who marked this review as helpful.</p>
              </div>
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 text-sm text-[#A9B3C7]">
                  <input type="checkbox" checked={editVerifiedPurchase} onChange={e => setEditVerifiedPurchase(e.target.checked)} className="rounded accent-[#2ED1B4]" />
                  Verified purchase
                </label>
                <label className="flex items-center gap-2 text-sm text-[#A9B3C7]">
                  <input type="checkbox" checked={editApproved} onChange={e => setEditApproved(e.target.checked)} className="rounded accent-[#2ED1B4]" />
                  Approved for display
                </label>
              </div>
              {editError && <p className="text-sm text-[#EF4444]">{editError}</p>}
              <div className="flex gap-3">
                <button onClick={() => setShowEditModal(false)} className="px-4 py-2 rounded-xl border border-[rgba(244,246,250,0.2)] text-[#A9B3C7]">Cancel</button>
                <button onClick={handleUpdateReview} disabled={isUpdating} className="px-4 py-2 rounded-xl bg-[#8B5CF6] text-white disabled:opacity-50">
                  {isUpdating ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reviews List */}
      <div className="space-y-3">
        {reviews.length === 0 ? (
          <div className="p-12 text-center text-[#A9B3C7]">No reviews yet. Click "Write Review" to add one.</div>
        ) : reviews.map(review => (
          <div key={review.id} className="p-4 rounded-xl bg-[rgba(17,24,39,0.6)] border border-[rgba(244,246,250,0.08)]">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <div className="flex gap-0.5">
                    {[1,2,3,4,5].map(s => (
                      <Star key={s} className={`w-3.5 h-3.5 ${s <= review.rating ? 'fill-[#F59E0B] text-[#F59E0B]' : 'text-[rgba(244,246,250,0.2)]'}`} />
                    ))}
                  </div>
                  <span className="text-xs text-[#8B5CF6]">{review.products?.name || 'Unknown Product'}</span>
                  {review.is_verified_purchase && <span className="text-[10px] text-[#22C55E] flex items-center gap-0.5"><CheckCircle className="w-3 h-3" /> Verified</span>}
                </div>
                {review.title && <p className="text-sm font-medium text-[#F4F6FA]">{review.title}</p>}
                <p className="text-sm text-[#A9B3C7] mt-1">{review.comment}</p>
                <div className="flex items-center gap-3 mt-2 text-xs text-[#A9B3C7]">
                  <span>{userMap[review.user_id] || 'Anonymous'}</span>
                  <span>{new Date(review.created_at).toLocaleDateString('en-GB')}</span>
                  <span>{review.helpful_count || 0} people found this helpful</span>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button onClick={() => openEditReview(review)} className="p-2 rounded-lg text-[#A9B3C7] hover:bg-[rgba(46,209,180,0.15)] hover:text-[#2ED1B4]" title="Edit review">
                  <Pencil className="w-4 h-4" />
                </button>
                <button onClick={() => setDeleteReview(review)} className="p-2 rounded-lg text-[#A9B3C7] hover:bg-[rgba(239,68,68,0.15)] hover:text-[#EF4444]" title="Delete review">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Settings Section
function SettingsSection() {
  const [bankDetails, setBankDetails] = useState(DEFAULT_BANK_DETAILS);
  const [discountSettings, setDiscountSettings] = useState(DEFAULT_DISCOUNT_SETTINGS);
  const [freeGiftSettings, setFreeGiftSettings] = useState(DEFAULT_FREE_GIFT_SETTINGS);
  const [supportLinks, setSupportLinks] = useState(DEFAULT_SUPPORT_LINKS);
  const [landingPageSettings, setLandingPageSettings] = useState(DEFAULT_LANDING_PAGE_SETTINGS);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');

  const loadSettings = async (showLoading = true) => {
    if (showLoading) setIsLoading(true);
    else setIsRefreshing(true);
    try {
      console.log('[Settings] Loading settings...');
      const {
        bankDetails: bank,
        discountSettings: discount,
        freeGiftSettings: gift,
        supportLinks: support,
        landingPageSettings: landingPage,
      } = await fetchAllSiteSettings();
      console.log('[Settings] Settings loaded OK');
      setBankDetails(bank);
      setDiscountSettings(discount);
      setFreeGiftSettings(gift);
      setSupportLinks(support);
      setLandingPageSettings(landingPage);
    } catch (error) {
      console.error('Error loading settings:', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadSettings(true);
  }, []);

  const saveSettings = async () => {
    setIsSaving(true);
    setSaveMessage('');
    try {
      await Promise.all([
        updateSiteSetting('bank_details', bankDetails),
        updateSiteSetting('discount_settings', discountSettings),
        updateSiteSetting('free_gift_settings', freeGiftSettings),
        updateSiteSetting('telegram_link', { url: supportLinks.telegram_link }),
        updateSiteSetting('whatsapp_link', { url: supportLinks.whatsapp_link }),
        updateSiteSetting('landing_page_settings', landingPageSettings),
      ]);
      setSaveMessage('Settings saved successfully!');
      setTimeout(() => setSaveMessage(''), 3000);
    } catch (error) {
      console.error('Error saving settings:', error);
      setSaveMessage('Error saving settings. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <Skeleton className="h-10 w-44 rounded-xl" />
      </div>
      {[...Array(4)].map((_, i) => (
        <div key={i} className="p-6 rounded-2xl bg-[rgba(17,24,39,0.6)] border border-[rgba(244,246,250,0.08)] space-y-4">
          <Skeleton className="h-6 w-48 rounded" />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {[...Array(4)].map((__, j) => (
              <div key={j} className="space-y-1.5">
                <Skeleton className="h-3 w-24 rounded" />
                <Skeleton className="h-10 w-full rounded-xl" />
              </div>
            ))}
          </div>
        </div>
      ))}
      <div className="flex justify-end">
        <Skeleton className="h-11 w-36 rounded-xl" />
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-end gap-2">
        <button
          type="button"
          onClick={() => loadSettings(false)}
          disabled={isRefreshing}
          className="px-4 py-2 rounded-xl border border-[rgba(244,246,250,0.2)] text-[#A9B3C7] hover:bg-[rgba(244,246,250,0.05)] hover:text-[#F4F6FA] text-sm flex items-center gap-2 disabled:opacity-50"
        >
          {isRefreshing ? 'Refreshing...' : 'Refresh from database'}
        </button>
      </div>
      {/* Bank Transfer Details */}
      <div className="p-6 rounded-2xl bg-gradient-to-br from-[rgba(46,209,180,0.1)] to-[rgba(139,92,246,0.1)] border border-[rgba(46,209,180,0.2)]">
        <h3 className="text-lg font-semibold text-[#F4F6FA] mb-4 flex items-center gap-2">
          <CreditCard className="w-5 h-5 text-[#2ED1B4]" />
          Bank Transfer Details
        </h3>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div>
            <label className="text-[10px] text-[#A9B3C7] uppercase">Account Name</label>
            <input
              type="text"
              value={bankDetails.account_name}
              onChange={(e) => setBankDetails({ ...bankDetails, account_name: e.target.value })}
              className="w-full px-3 py-2 rounded-lg bg-[rgba(7,10,18,0.5)] border border-[rgba(244,246,250,0.1)] text-[#F4F6FA] text-sm"
            />
          </div>
          <div>
            <label className="text-[10px] text-[#A9B3C7] uppercase">Bank Name</label>
            <input
              type="text"
              value={bankDetails.bank_name}
              onChange={(e) => setBankDetails({ ...bankDetails, bank_name: e.target.value })}
              className="w-full px-3 py-2 rounded-lg bg-[rgba(7,10,18,0.5)] border border-[rgba(244,246,250,0.1)] text-[#F4F6FA] text-sm"
            />
          </div>
          <div>
            <label className="text-[10px] text-[#A9B3C7] uppercase">Sort Code</label>
            <input
              type="text"
              placeholder="00-00-00"
              value={bankDetails.sort_code}
              onChange={(e) => setBankDetails({ ...bankDetails, sort_code: e.target.value })}
              className="w-full px-3 py-2 rounded-lg bg-[rgba(7,10,18,0.5)] border border-[rgba(244,246,250,0.1)] text-[#F4F6FA] text-sm"
            />
          </div>
          <div>
            <label className="text-[10px] text-[#A9B3C7] uppercase">Account Number</label>
            <input
              type="text"
              placeholder="12345678"
              value={bankDetails.account_number}
              onChange={(e) => setBankDetails({ ...bankDetails, account_number: e.target.value })}
              className="w-full px-3 py-2 rounded-lg bg-[rgba(7,10,18,0.5)] border border-[rgba(244,246,250,0.1)] text-[#F4F6FA] text-sm"
            />
          </div>
          <div className="lg:col-span-2">
            <label className="text-[10px] text-[#A9B3C7] uppercase">Payment reference hint (optional)</label>
            <input
              type="text"
              placeholder="Use your order number as payment reference"
              value={bankDetails.reference_hint ?? ''}
              onChange={(e) => setBankDetails({ ...bankDetails, reference_hint: e.target.value })}
              className="w-full px-3 py-2 rounded-lg bg-[rgba(7,10,18,0.5)] border border-[rgba(244,246,250,0.1)] text-[#F4F6FA] text-sm"
            />
          </div>
        </div>
      </div>

      {/* Landing Page Control */}
      <div className="p-6 rounded-2xl bg-gradient-to-br from-[rgba(59,130,246,0.1)] to-[rgba(139,92,246,0.1)] border border-[rgba(59,130,246,0.2)]">
        <h3 className="text-lg font-semibold text-[#F4F6FA] mb-1 flex items-center gap-2">
          <Eye className="w-5 h-5 text-[#3B82F6]" />
          Landing Page Control
        </h3>
        <p className="text-xs text-[#A9B3C7] mb-5">
          Turn the homepage on or off. When off, visitors see a temporary unavailable screen.
        </p>
        <div className="flex items-center justify-between p-4 rounded-xl bg-[rgba(7,10,18,0.5)] border border-[rgba(244,246,250,0.08)]">
          <div>
            <p className="text-sm font-medium text-[#F4F6FA]">Landing Page Enabled</p>
            <p className="text-xs text-[#A9B3C7] mt-0.5">
              {landingPageSettings.enabled
                ? 'Active — homepage is visible to customers'
                : 'Disabled — homepage is temporarily hidden'}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setLandingPageSettings({ ...landingPageSettings, enabled: !landingPageSettings.enabled })}
            className={`relative inline-flex items-center w-11 h-7 shrink-0 rounded-full transition-colors duration-200 focus:outline-none ${
              landingPageSettings.enabled ? 'bg-[#22C55E]' : 'bg-[rgba(244,246,250,0.15)]'
            }`}
          >
            <span className={`inline-block w-5 h-5 rounded-full bg-white shadow transition-transform duration-200 ${
              landingPageSettings.enabled ? 'translate-x-[22px]' : 'translate-x-[3px]'
            }`} />
          </button>
        </div>
      </div>

      {/* Discount Settings */}
      <div className="p-6 rounded-2xl bg-gradient-to-br from-[rgba(245,158,11,0.1)] to-[rgba(239,68,68,0.1)] border border-[rgba(245,158,11,0.2)]">
        <h3 className="text-lg font-semibold text-[#F4F6FA] mb-1 flex items-center gap-2">
          <Tag className="w-5 h-5 text-[#F59E0B]" />
          Discount Settings
        </h3>
        <p className="text-xs text-[#A9B3C7] mb-5">
          Control whether storefront prices show a discount and what percentage is applied globally.
        </p>

        {/* Master toggle */}
        <div className="flex items-center justify-between p-4 rounded-xl bg-[rgba(7,10,18,0.5)] border border-[rgba(244,246,250,0.08)] mb-4">
          <div>
            <p className="text-sm font-medium text-[#F4F6FA]">Discounts Enabled</p>
            <p className="text-xs text-[#A9B3C7] mt-0.5">
              {discountSettings.discount_enabled
                ? `Active — Buy 1: ${discountSettings.discount_percentage ?? 20}% · Buy 2: ${discountSettings.buy2_percentage ?? 25}% · Buy 3: ${discountSettings.buy3_percentage ?? 30}%`
                : 'Disabled — kr 200 original prices shown, no discounts applied'}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setDiscountSettings({ ...discountSettings, discount_enabled: !discountSettings.discount_enabled })}
            className={`relative inline-flex items-center w-11 h-7 shrink-0 rounded-full transition-colors duration-200 focus:outline-none ${
              discountSettings.discount_enabled ? 'bg-[#22C55E]' : 'bg-[rgba(244,246,250,0.15)]'
            }`}
          >
            <span className={`inline-block w-5 h-5 rounded-full bg-white shadow transition-transform duration-200 ${
              discountSettings.discount_enabled ? 'translate-x-[22px]' : 'translate-x-[3px]'
            }`} />
          </button>
        </div>

        {/* Per-tier percentage controls */}
        <div className={`space-y-3 transition-opacity duration-200 ${discountSettings.discount_enabled ? 'opacity-100' : 'opacity-40 pointer-events-none'}`}>

          {/* Helper: reusable tier row */}
          {(
            [
              { key: 'discount_percentage' as const, label: 'Buy 1', default: 20, color: '#F59E0B', presets: [5,10,15,20,25,30] },
              { key: 'buy2_percentage'      as const, label: 'Buy 2', default: 25, color: '#8B5CF6', presets: [15,20,25,30,35,40] },
              { key: 'buy3_percentage'      as const, label: 'Buy 3', default: 30, color: '#2ED1B4', presets: [20,25,30,35,40,45] },
            ] as const
          ).map(({ key, label, default: def, color, presets }) => {
            const current = (discountSettings[key] as number) ?? def;
            return (
              <div key={key} className="p-4 rounded-xl bg-[rgba(7,10,18,0.5)] border border-[rgba(244,246,250,0.06)]">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-md text-xs font-bold" style={{ background: `${color}22`, color }}>{label}</span>
                    <span className="text-xs text-[#A9B3C7]">per unit discount</span>
                  </div>
                  <span className="text-sm font-bold" style={{ color }}>{current}% OFF</span>
                </div>

                {/* Slider + number input */}
                <div className="flex items-center gap-3 mb-3">
                  <input
                    type="range"
                    min={1}
                    max={70}
                    step={1}
                    value={current}
                    onChange={(e) => setDiscountSettings({ ...discountSettings, [key]: parseInt(e.target.value) })}
                    className="flex-1"
                    style={{ accentColor: color }}
                  />
                  <input
                    type="number"
                    min={1}
                    max={70}
                    value={current}
                    onChange={(e) => setDiscountSettings({ ...discountSettings, [key]: Math.min(70, Math.max(1, parseInt(e.target.value) || 1)) })}
                    className="w-14 px-2 py-1 rounded-lg bg-[rgba(17,24,39,0.8)] border border-[rgba(244,246,250,0.1)] text-[#F4F6FA] text-sm text-center"
                  />
                  <span className="text-sm text-[#A9B3C7]">%</span>
                </div>

                {/* Preset buttons */}
                <div className="flex flex-wrap gap-1.5">
                  {presets.map(pct => (
                    <button
                      key={pct}
                      type="button"
                      onClick={() => setDiscountSettings({ ...discountSettings, [key]: pct })}
                      className="px-2.5 py-1 rounded-md text-xs font-medium transition-colors"
                      style={
                        current === pct
                          ? { background: color, color: '#070A12' }
                          : { background: 'rgba(244,246,250,0.06)', color: '#A9B3C7' }
                      }
                    >
                      {pct}%
                    </button>
                  ))}
                </div>
              </div>
            );
          })}

          {/* Live preview table */}
          <div className="p-4 rounded-xl bg-[rgba(7,10,18,0.4)] border border-[rgba(245,158,11,0.1)]">
            <p className="text-xs text-[#A9B3C7] mb-3 uppercase tracking-wide">Live preview — kr 200 original price</p>
            <div className="space-y-2">
              {(
                [
                  { label: 'Buy 1', qty: 1,  pct: discountSettings.discount_percentage ?? 20, color: '#F59E0B' },
                  { label: 'Buy 2', qty: 2,  pct: discountSettings.buy2_percentage ?? 25,     color: '#8B5CF6' },
                  { label: 'Buy 3', qty: 3,  pct: discountSettings.buy3_percentage ?? 30,     color: '#2ED1B4' },
                ] as const
              ).map(({ label, qty, pct, color }) => {
                const unit  = +(200 * (1 - pct / 100)).toFixed(2);
                const total = +(unit * qty).toFixed(2);
                const save  = +(200 * qty - total).toFixed(2);
                return (
                  <div key={label} className="flex items-center gap-3 text-sm">
                    <span className="w-12 text-xs font-bold" style={{ color }}>{label}</span>
                    <span className="text-[#A9B3C7] line-through text-xs">kr {(200 * qty).toFixed(2)}</span>
                    <span className="font-bold text-[#F4F6FA]">kr {total.toFixed(2)}</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded font-bold" style={{ background: `${color}22`, color }}>{pct}% OFF</span>
                    <span className="text-[10px] text-[#22C55E] ml-auto">Save kr {save.toFixed(2)}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Badge display options */}
        <div className="mt-4 pt-4 border-t border-[rgba(244,246,250,0.06)]">
          <p className="text-xs font-medium text-[#A9B3C7] uppercase mb-3">Badge Display Options</p>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div>
              <label className="text-[10px] text-[#A9B3C7] uppercase">Badge Text</label>
              <input
                type="text"
                value={discountSettings.badge_text}
                onChange={(e) => setDiscountSettings({ ...discountSettings, badge_text: e.target.value })}
                className="w-full px-3 py-2 rounded-lg bg-[rgba(7,10,18,0.5)] border border-[rgba(244,246,250,0.1)] text-[#F4F6FA] text-sm"
              />
            </div>
            <div>
              <label className="block text-[10px] font-semibold text-[#A9B3C7] uppercase tracking-wider mb-1.5">Show Percentage</label>
              <div className="relative">
                <select
                  value={discountSettings.show_percentage ? 'true' : 'false'}
                  onChange={(e) => setDiscountSettings({ ...discountSettings, show_percentage: e.target.value === 'true' })}
                  className="w-full px-3 py-3 pr-9 rounded-xl bg-[rgba(7,10,18,0.5)] border border-[rgba(244,246,250,0.1)] text-[#F4F6FA] text-base focus:outline-none focus:border-[#2ED1B4] transition-colors appearance-none"
                >
                  <option value="true">Yes</option>
                  <option value="false">No</option>
                </select>
                <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#A9B3C7]" />
              </div>
            </div>
            <div>
              <label className="block text-[10px] font-semibold text-[#A9B3C7] uppercase tracking-wider mb-1.5">Badge Enabled</label>
              <div className="relative">
                <select
                  value={discountSettings.enabled ? 'true' : 'false'}
                  onChange={(e) => setDiscountSettings({ ...discountSettings, enabled: e.target.value === 'true' })}
                  className="w-full px-3 py-3 pr-9 rounded-xl bg-[rgba(7,10,18,0.5)] border border-[rgba(244,246,250,0.1)] text-[#F4F6FA] text-base focus:outline-none focus:border-[#2ED1B4] transition-colors appearance-none"
                >
                  <option value="true">Yes</option>
                  <option value="false">No</option>
                </select>
                <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#A9B3C7]" />
              </div>
            </div>
            <div className="lg:col-span-2">
              <label className="block text-[10px] font-semibold text-[#A9B3C7] uppercase tracking-wider mb-1.5">Badge Position</label>
              <div className="relative">
                <select
                  value={discountSettings.badge_position || 'top-right'}
                  onChange={(e) => setDiscountSettings({ ...discountSettings, badge_position: e.target.value })}
                  className="w-full px-3 py-3 pr-9 rounded-xl bg-[rgba(7,10,18,0.5)] border border-[rgba(244,246,250,0.1)] text-[#F4F6FA] text-base focus:outline-none focus:border-[#2ED1B4] transition-colors appearance-none"
                >
                  <option value="top-right">Top right</option>
                  <option value="top-left">Top left</option>
                  <option value="bottom-right">Bottom right</option>
                  <option value="bottom-left">Bottom left</option>
                </select>
                <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#A9B3C7]" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Free Gift Settings */}
      <div className="p-6 rounded-2xl bg-gradient-to-br from-[rgba(139,92,246,0.1)] to-[rgba(46,209,180,0.1)] border border-[rgba(139,92,246,0.2)]">
        <h3 className="text-lg font-semibold text-[#F4F6FA] mb-4 flex items-center gap-2">
          <Gift className="w-5 h-5 text-[#8B5CF6]" />
          Free Gift Settings
        </h3>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="free-gift-enabled"
              checked={freeGiftSettings.enabled !== false}
              onChange={(e) => setFreeGiftSettings({ ...freeGiftSettings, enabled: e.target.checked })}
              className="rounded accent-[#8B5CF6] w-4 h-4"
            />
            <label htmlFor="free-gift-enabled" className="text-sm text-[#A9B3C7]">Free gift enabled (add to cart when threshold met)</label>
          </div>
          <div>
            <label className="text-[10px] text-[#A9B3C7] uppercase">Gift name</label>
            <input
              type="text"
              value={freeGiftSettings.name || ''}
              onChange={(e) => setFreeGiftSettings({ ...freeGiftSettings, name: e.target.value })}
              className="w-full px-3 py-2 rounded-lg bg-[rgba(7,10,18,0.5)] border border-[rgba(244,246,250,0.1)] text-[#F4F6FA] text-sm"
              placeholder="e.g. BAC Water"
            />
          </div>
          <div>
            <label className="text-[10px] text-[#A9B3C7] uppercase">Threshold (SEK)</label>
            <input
              type="number"
              value={freeGiftSettings.threshold}
              onChange={(e) => setFreeGiftSettings({ ...freeGiftSettings, threshold: parseInt(e.target.value) || 300 })}
              className="w-full px-3 py-2 rounded-lg bg-[rgba(7,10,18,0.5)] border border-[rgba(244,246,250,0.1)] text-[#F4F6FA] text-sm"
            />
          </div>
          <div>
            <label className="text-[10px] text-[#A9B3C7] uppercase">Product ID</label>
            <input
              type="text"
              value={freeGiftSettings.product_id}
              onChange={(e) => setFreeGiftSettings({ ...freeGiftSettings, product_id: e.target.value })}
              className="w-full px-3 py-2 rounded-lg bg-[rgba(7,10,18,0.5)] border border-[rgba(244,246,250,0.1)] text-[#F4F6FA] text-sm"
              placeholder="e.g. bac-water or product UUID"
            />
          </div>
          <div>
            <label className="text-[10px] text-[#A9B3C7] uppercase">Dosage</label>
            <input
              type="text"
              value={freeGiftSettings.dosage}
              onChange={(e) => setFreeGiftSettings({ ...freeGiftSettings, dosage: e.target.value })}
              className="w-full px-3 py-2 rounded-lg bg-[rgba(7,10,18,0.5)] border border-[rgba(244,246,250,0.1)] text-[#F4F6FA] text-sm"
              placeholder="e.g. 3 mL"
            />
          </div>
        </div>
        <p className="text-xs text-[#A9B3C7] mt-3">
          When enabled, the free gift is added to cart when customer spends kr {freeGiftSettings.threshold} or more.
        </p>
      </div>

      {/* Support Links */}
      <div className="p-6 rounded-2xl bg-gradient-to-br from-[rgba(139,92,246,0.1)] to-[rgba(46,209,180,0.1)] border border-[rgba(139,92,246,0.2)]">
        <h3 className="text-lg font-semibold text-[#F4F6FA] mb-4 flex items-center gap-2">
          <Mail className="w-5 h-5 text-[#8B5CF6]" />
          Support Links
        </h3>
        <div className="space-y-4">
          <div>
            <label className="text-[10px] text-[#A9B3C7] uppercase">Telegram Link</label>
            <input
              type="url"
              value={supportLinks.telegram_link || ''}
              onChange={(e) => setSupportLinks({ ...supportLinks, telegram_link: e.target.value })}
              className="w-full px-3 py-2 rounded-lg bg-[rgba(7,10,18,0.5)] border border-[rgba(244,246,250,0.1)] text-[#F4F6FA] text-sm"
              placeholder="https://t.me/YourLink"
            />
          </div>
          <div>
            <label className="text-[10px] text-[#A9B3C7] uppercase">WhatsApp Link</label>
            <input
              type="url"
              value={supportLinks.whatsapp_link || ''}
              onChange={(e) => setSupportLinks({ ...supportLinks, whatsapp_link: e.target.value })}
              className="w-full px-3 py-2 rounded-lg bg-[rgba(7,10,18,0.5)] border border-[rgba(244,246,250,0.1)] text-[#F4F6FA] text-sm"
              placeholder="https://wa.me/YourNumber"
            />
          </div>
          <p className="text-xs text-[#A9B3C7]">
            WhatsApp button will only show when the link is set.
          </p>
        </div>
      </div>

      {/* Save Button */}
      <div className="space-y-3">
        {saveMessage && (
          <div className={`flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium ${
            saveMessage.includes('Error')
              ? 'bg-[rgba(239,68,68,0.1)] border border-[rgba(239,68,68,0.2)] text-[#EF4444]'
              : 'bg-[rgba(34,197,94,0.1)] border border-[rgba(34,197,94,0.2)] text-[#22C55E]'
          }`}>
            {saveMessage.includes('Error') ? <XCircle className="w-4 h-4 shrink-0" /> : <CheckCircle className="w-4 h-4 shrink-0" />}
            {saveMessage}
          </div>
        )}
        <button
          onClick={saveSettings}
          disabled={isSaving}
          className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-[#2ED1B4] text-white hover:bg-[#25b89d] active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2 font-semibold transition-all"
        >
          <Save className="w-5 h-5" />
          {isSaving ? 'Saving...' : 'Save All Settings'}
        </button>
      </div>

      {/* Order Processing Guide */}
      <div className="p-6 rounded-2xl bg-[rgba(17,24,39,0.6)] border border-[rgba(244,246,250,0.08)]">
        <h3 className="text-lg font-semibold text-[#F4F6FA] mb-4">How Order Processing Works</h3>
        <div className="space-y-3 text-sm text-[#A9B3C7]">
          <p className="flex items-start gap-2">
            <span className="text-[#2ED1B4] font-bold">1.</span>
            Customer places order → Status: "Awaiting Payment"
          </p>
          <p className="flex items-start gap-2">
            <span className="text-[#2ED1B4] font-bold">2.</span>
            Customer pays via bank transfer with order number as reference
          </p>
          <p className="flex items-start gap-2">
            <span className="text-[#2ED1B4] font-bold">3.</span>
            You check your bank and click "I Received Payment" in admin
          </p>
          <p className="flex items-start gap-2">
            <span className="text-[#2ED1B4] font-bold">4.</span>
            Pack order and add tracking number → Status: "Shipped"
          </p>
          <p className="flex items-start gap-2">
            <span className="text-[#2ED1B4] font-bold">5.</span>
            Mark as "Delivered" when customer receives it
          </p>
        </div>
      </div>
    </div>
  );
}

// Helper Components
function StatCard({ label, value, icon: Icon, color }: { label: string; value: string; icon: any; color: string }) {
  return (
    <div className="p-3 sm:p-4 rounded-xl bg-[rgba(17,24,39,0.6)] border border-[rgba(244,246,250,0.08)] active:scale-[0.98] transition-transform">
      <div className="flex items-center justify-between mb-2">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: `${color}20` }}>
          <Icon className="w-4 h-4" style={{ color }} />
        </div>
      </div>
      <p className="text-xl sm:text-2xl font-bold text-[#F4F6FA] leading-tight">{value}</p>
      <p className="text-[11px] sm:text-xs text-[#A9B3C7] mt-0.5 leading-tight">{label}</p>
    </div>
  );
}

function getStatusColor(status: string) {
  switch (status) {
    case 'pending_payment': return 'bg-[#F59E0B] text-white';
    case 'payment_received': return 'bg-[#3B82F6] text-white';
    case 'processing': return 'bg-[#8B5CF6] text-white';
    case 'shipped': return 'bg-[#2ED1B4] text-white';
    case 'delivered': return 'bg-[#22C55E] text-white';
    case 'cancelled': return 'bg-[#EF4444] text-white';
    case 'refunded': return 'bg-[#6B7280] text-white';
    default: return 'bg-[#A9B3C7] text-white';
  }
}

// ============================================
// INFLUENCERS SECTION (promoters / affiliate codes)
// ============================================

function AffiliatesSection() {
  const [promoters, setPromoters] = useState<Promoter[]>([]);
  const [affOrders, setAffOrders] = useState<(AffiliateOrder & { promoter_name?: string; promoter_code?: string })[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [view, setView] = useState<'promoters' | 'orders'>('promoters');

  // Create form
  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState({ name: '', email: '', referral_code: '', commission_percent: '10', customer_discount_percent: '10' });
  const [createError, setCreateError] = useState('');
  const [createLoading, setCreateLoading] = useState(false);
  const [createSuccess, setCreateSuccess] = useState<string | null>(null);

  // Edit
  const [editId, setEditId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Record<string, string>>({});

  // Adjust credit
  const [creditPromoId, setCreditPromoId] = useState<string | null>(null);
  const [creditAmount, setCreditAmount] = useState('');
  const [creditDesc, setCreditDesc] = useState('');

  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    const [p, o] = await Promise.all([getAllPromoters(), getAllAffiliateOrders()]);
    setPromoters(p);
    setAffOrders(o);
    setLoading(false);
  };

  useEffect(() => { loadData(); }, []);

  const handleCreate = async () => {
    setCreateError('');
    setCreateSuccess(null);
    if (!createForm.name.trim() || !createForm.email.trim() || !createForm.referral_code.trim()) {
      setCreateError('Name, email, and promo code are required');
      return;
    }
    setCreateLoading(true);
    const result = await adminCreateInfluencer({
      name: createForm.name.trim(),
      email: createForm.email.trim(),
      referral_code: createForm.referral_code.trim(),
      commission_percent: Number(createForm.commission_percent) || 10,
      customer_discount_percent: Number(createForm.customer_discount_percent) || 10,
    });
    setCreateLoading(false);
    if (!result.ok) {
      setCreateError(result.error || 'Failed to create influencer');
      return;
    }
    const sent = result.email_sent;
    if (result.account_action === 'created') {
      setCreateSuccess(
        sent
          ? 'Influencer account created. They were emailed a temporary password, promo code, and a link to set a new password.'
          : 'Influencer account created, but the welcome email was not sent (check Resend / pending queue). Share the code manually if needed.',
      );
    } else {
      setCreateSuccess(
        sent
          ? 'Linked to an existing Viron Labs login. They were emailed their promo code and a password reset link.'
          : 'Linked to an existing account. Email could not be sent — share the code from the list below if needed.',
      );
    }
    setShowCreate(false);
    setCreateForm({ name: '', email: '', referral_code: '', commission_percent: '10', customer_discount_percent: '10' });
    loadData();
  };

  const handleSaveEdit = async (id: string) => {
    const updates: Record<string, unknown> = {};
    if (editForm.name) updates.name = editForm.name;
    if (editForm.email) updates.email = editForm.email;
    if (editForm.commission_percent) updates.commission_percent = Number(editForm.commission_percent);
    if (editForm.customer_discount_percent) updates.customer_discount_percent = Number(editForm.customer_discount_percent);
    if (editForm.is_active !== undefined) updates.is_active = editForm.is_active === 'true';
    await updatePromoter(id, updates);
    setEditId(null);
    setEditForm({});
    loadData();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this influencer? This cannot be undone.')) return;
    await deletePromoter(id);
    loadData();
  };

  const handleAdjustCredit = async () => {
    if (!creditPromoId || !creditAmount) return;
    await adjustStoreCredit(creditPromoId, Number(creditAmount), creditDesc || 'Admin adjustment');
    setCreditPromoId(null);
    setCreditAmount('');
    setCreditDesc('');
    loadData();
  };

  const handleCreditOrder = async (orderId: string) => {
    const result = await creditAffiliateCommission(orderId);
    if (result.ok) loadData();
    else alert(result.error || 'Failed to credit');
  };

  const handleCopy = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const filtered = promoters.filter(p =>
    !search || p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.email.toLowerCase().includes(search.toLowerCase()) ||
    p.referral_code.toLowerCase().includes(search.toLowerCase())
  );

  const totalCommission = promoters.reduce((s, p) => s + Number(p.total_commission || 0), 0);
  const totalSales = promoters.reduce((s, p) => s + Number(p.total_sales || 0), 0);
  const activePromoters = promoters.filter(p => p.is_active).length;
  const totalCodeDiscountGiven = affOrders.reduce((s, o) => s + Number(o.customer_discount || 0), 0);

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} className="h-20 rounded-xl" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4 lg:space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard icon={Users} value={promoters.length.toString()} label="Influencers" color="#8B5CF6" />
        <StatCard icon={CheckCircle} value={activePromoters.toString()} label="Active codes" color="#22C55E" />
        <StatCard icon={DollarSign} value={`kr ${totalSales.toFixed(0)}`} label="Tracked sales" color="#2ED1B4" />
        <StatCard icon={CreditCard} value={`kr ${totalCommission.toFixed(0)}`} label="Commission earned" color="#F59E0B" />
      </div>

      {createSuccess && (
        <div className="p-4 rounded-xl bg-[rgba(34,197,94,0.12)] border border-[rgba(34,197,94,0.35)] text-sm text-[#F4F6FA] flex flex-wrap items-start justify-between gap-3">
          <p className="text-[#22C55E] font-medium pr-2">{createSuccess}</p>
          <button type="button" onClick={() => setCreateSuccess(null)} className="text-xs text-[#A9B3C7] hover:text-[#F4F6FA] shrink-0">
            Dismiss
          </button>
        </div>
      )}

      {/* View Tabs + Actions */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-2">
          <button
            onClick={() => setView('promoters')}
            className={`px-4 py-2 rounded-xl text-xs font-medium transition-colors ${view === 'promoters' ? 'bg-[rgba(46,209,180,0.15)] text-[#2ED1B4]' : 'bg-[rgba(244,246,250,0.05)] text-[#A9B3C7] hover:text-[#F4F6FA]'}`}
          >
            Influencers
          </button>
          <button
            onClick={() => setView('orders')}
            className={`px-4 py-2 rounded-xl text-xs font-medium transition-colors ${view === 'orders' ? 'bg-[rgba(46,209,180,0.15)] text-[#2ED1B4]' : 'bg-[rgba(244,246,250,0.05)] text-[#A9B3C7] hover:text-[#F4F6FA]'}`}
          >
            Code usage
          </button>
        </div>
        <div className="flex gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#A9B3C7]" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search..."
              className="pl-9 pr-3 py-2 rounded-xl bg-[rgba(17,24,39,0.6)] border border-[rgba(244,246,250,0.08)] text-xs text-[#F4F6FA] placeholder-[#A9B3C7] focus:outline-none focus:border-[#2ED1B4] w-40 sm:w-56"
            />
          </div>
          <button
            onClick={() => { setShowCreate(true); setCreateError(''); setCreateSuccess(null); }}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#22C55E] text-[#070A12] text-xs font-semibold hover:bg-[#16A34A] transition-colors"
          >
            <Plus className="w-3.5 h-3.5" /> Add influencer
          </button>
        </div>
      </div>

      {/* Create influencer */}
      {showCreate && (
        <div className="p-4 sm:p-6 rounded-2xl bg-[rgba(17,24,39,0.9)] border border-[rgba(34,197,94,0.3)]">
          <h3 className="text-sm font-semibold text-[#F4F6FA] mb-1">New influencer</h3>
          <p className="text-[11px] text-[#A9B3C7] mb-3">
            Creates a promo code, links or creates their login, and emails them the code (new accounts also get a temporary password and reset link).
          </p>
          {createError && (
            <p className="text-xs text-[#EF4444] mb-2 p-2 rounded-lg bg-[rgba(239,68,68,0.1)]">{createError}</p>
          )}
          <div className="grid sm:grid-cols-2 gap-3 mb-4">
            <input
              value={createForm.name}
              onChange={e => setCreateForm(f => ({ ...f, name: e.target.value }))}
              placeholder="Name"
              className="px-3 py-2.5 rounded-xl bg-[rgba(7,10,18,0.6)] border border-[rgba(244,246,250,0.1)] text-sm text-[#F4F6FA] placeholder-[#A9B3C7] focus:outline-none focus:border-[#2ED1B4]"
            />
            <input
              value={createForm.email}
              onChange={e => setCreateForm(f => ({ ...f, email: e.target.value }))}
              placeholder="Email"
              type="email"
              className="px-3 py-2.5 rounded-xl bg-[rgba(7,10,18,0.6)] border border-[rgba(244,246,250,0.1)] text-sm text-[#F4F6FA] placeholder-[#A9B3C7] focus:outline-none focus:border-[#2ED1B4]"
            />
            <input
              value={createForm.referral_code}
              onChange={e => setCreateForm(f => ({ ...f, referral_code: e.target.value.toUpperCase() }))}
              placeholder="Promo code (e.g. MIKE10)"
              className="px-3 py-2.5 rounded-xl bg-[rgba(7,10,18,0.6)] border border-[rgba(244,246,250,0.1)] text-sm text-[#F4F6FA] placeholder-[#A9B3C7] focus:outline-none focus:border-[#2ED1B4] uppercase"
            />
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] text-[#A9B3C7] block mb-1">Commission %</label>
                <input
                  value={createForm.commission_percent}
                  onChange={e => setCreateForm(f => ({ ...f, commission_percent: e.target.value }))}
                  type="number"
                  min="0"
                  max="100"
                  className="w-full px-3 py-2.5 rounded-xl bg-[rgba(7,10,18,0.6)] border border-[rgba(244,246,250,0.1)] text-sm text-[#F4F6FA] focus:outline-none focus:border-[#2ED1B4]"
                />
              </div>
              <div>
                <label className="text-[10px] text-[#A9B3C7] block mb-1">Customer Discount %</label>
                <input
                  value={createForm.customer_discount_percent}
                  onChange={e => setCreateForm(f => ({ ...f, customer_discount_percent: e.target.value }))}
                  type="number"
                  min="0"
                  max="100"
                  className="w-full px-3 py-2.5 rounded-xl bg-[rgba(7,10,18,0.6)] border border-[rgba(244,246,250,0.1)] text-sm text-[#F4F6FA] focus:outline-none focus:border-[#2ED1B4]"
                />
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleCreate}
              disabled={createLoading}
              className="px-6 py-2.5 rounded-xl bg-[#22C55E] text-[#070A12] text-xs font-semibold disabled:opacity-50"
            >
              {createLoading ? 'Creating...' : 'Create influencer'}
            </button>
            <button onClick={() => { setShowCreate(false); setCreateError(''); }} className="px-4 py-2.5 rounded-xl border border-[rgba(244,246,250,0.15)] text-xs text-[#A9B3C7]">
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Influencers list */}
      {view === 'promoters' && (
        <div className="space-y-3">
          {filtered.length === 0 ? (
            <div className="text-center py-12 text-[#A9B3C7]">
              <Users className="w-10 h-10 mx-auto opacity-30 mb-2" />
              <p className="text-sm">No influencers found</p>
            </div>
          ) : filtered.map(p => (
            <div key={p.id} className="p-4 rounded-xl bg-[rgba(17,24,39,0.6)] border border-[rgba(244,246,250,0.08)]">
              {editId === p.id ? (
                /* Edit mode */
                <div className="space-y-3">
                  <div className="grid sm:grid-cols-3 gap-2">
                    <input
                      value={editForm.name ?? p.name}
                      onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))}
                      className="px-3 py-2 rounded-lg bg-[rgba(7,10,18,0.5)] border border-[rgba(244,246,250,0.1)] text-sm text-[#F4F6FA] focus:outline-none focus:border-[#2ED1B4]"
                      placeholder="Name"
                    />
                    <input
                      value={editForm.commission_percent ?? String(p.commission_percent)}
                      onChange={e => setEditForm(f => ({ ...f, commission_percent: e.target.value }))}
                      type="number"
                      className="px-3 py-2 rounded-lg bg-[rgba(7,10,18,0.5)] border border-[rgba(244,246,250,0.1)] text-sm text-[#F4F6FA] focus:outline-none focus:border-[#2ED1B4]"
                      placeholder="Commission %"
                    />
                    <input
                      value={editForm.customer_discount_percent ?? String(p.customer_discount_percent)}
                      onChange={e => setEditForm(f => ({ ...f, customer_discount_percent: e.target.value }))}
                      type="number"
                      className="px-3 py-2 rounded-lg bg-[rgba(7,10,18,0.5)] border border-[rgba(244,246,250,0.1)] text-sm text-[#F4F6FA] focus:outline-none focus:border-[#2ED1B4]"
                      placeholder="Discount %"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <label className="flex items-center gap-2 text-xs text-[#A9B3C7]">
                      <input
                        type="checkbox"
                        checked={(editForm.is_active ?? String(p.is_active)) === 'true'}
                        onChange={e => setEditForm(f => ({ ...f, is_active: e.target.checked ? 'true' : 'false' }))}
                        className="w-3.5 h-3.5 accent-[#22C55E]"
                      />
                      Active
                    </label>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => handleSaveEdit(p.id)} className="px-4 py-1.5 rounded-lg bg-[#22C55E] text-[#070A12] text-xs font-semibold">Save</button>
                    <button onClick={() => { setEditId(null); setEditForm({}); }} className="px-4 py-1.5 rounded-lg border border-[rgba(244,246,250,0.15)] text-xs text-[#A9B3C7]">Cancel</button>
                  </div>
                </div>
              ) : (
                /* View mode */
                <>
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-semibold text-[#F4F6FA]">{p.name}</span>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${p.is_active ? 'bg-[rgba(34,197,94,0.15)] text-[#22C55E]' : 'bg-[rgba(239,68,68,0.15)] text-[#EF4444]'}`}>
                          {p.is_active ? 'Active' : 'Inactive'}
                        </span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-[rgba(245,158,11,0.15)] text-[#F59E0B]">{p.tier}</span>
                      </div>
                      <p className="text-xs text-[#A9B3C7] truncate">{p.email}</p>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button onClick={() => handleCopy(p.referral_code)} className="p-1.5 rounded-lg bg-[rgba(34,197,94,0.1)] text-[#22C55E] hover:bg-[rgba(34,197,94,0.2)] transition-colors" title="Copy code">
                        {copiedCode === p.referral_code ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                      <button onClick={() => { setEditId(p.id); setEditForm({}); }} className="p-1.5 rounded-lg bg-[rgba(139,92,246,0.1)] text-[#8B5CF6] hover:bg-[rgba(139,92,246,0.2)] transition-colors" title="Edit">
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => setCreditPromoId(p.id)} className="p-1.5 rounded-lg bg-[rgba(245,158,11,0.1)] text-[#F59E0B] hover:bg-[rgba(245,158,11,0.2)] transition-colors" title="Adjust credit">
                        <DollarSign className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => handleDelete(p.id)} className="p-1.5 rounded-lg bg-[rgba(239,68,68,0.1)] text-[#EF4444] hover:bg-[rgba(239,68,68,0.2)] transition-colors" title="Delete">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs mb-2">
                    <span className="font-mono text-[#22C55E] font-semibold">{p.referral_code}</span>
                    <span className="text-[#A9B3C7]">{p.commission_percent}% commission</span>
                    <span className="text-[#A9B3C7]">{p.customer_discount_percent}% customer discount</span>
                  </div>
                  <div className="grid grid-cols-4 gap-2 text-center">
                    <div className="p-2 rounded-lg bg-[rgba(7,10,18,0.5)]">
                      <p className="text-sm font-bold text-[#F4F6FA]">{p.total_orders}</p>
                      <p className="text-[10px] text-[#A9B3C7]">Orders</p>
                    </div>
                    <div className="p-2 rounded-lg bg-[rgba(7,10,18,0.5)]">
                      <p className="text-sm font-bold text-[#F4F6FA]">kr {Number(p.total_sales || 0).toFixed(0)}</p>
                      <p className="text-[10px] text-[#A9B3C7]">Sales</p>
                    </div>
                    <div className="p-2 rounded-lg bg-[rgba(7,10,18,0.5)]">
                      <p className="text-sm font-bold text-[#F59E0B]">kr {Number(p.total_commission || 0).toFixed(2)}</p>
                      <p className="text-[10px] text-[#A9B3C7]">Earned</p>
                    </div>
                    <div className="p-2 rounded-lg bg-[rgba(34,197,94,0.1)] border border-[rgba(34,197,94,0.2)]">
                      <p className="text-sm font-bold text-[#22C55E]">kr {Number(p.store_credit || 0).toFixed(2)}</p>
                      <p className="text-[10px] text-[#22C55E]">Credit</p>
                    </div>
                  </div>

                  {/* Inline credit adjustment */}
                  {creditPromoId === p.id && (
                    <div className="mt-3 p-3 rounded-xl bg-[rgba(7,10,18,0.5)] border border-[rgba(245,158,11,0.2)]">
                      <p className="text-xs font-semibold text-[#F4F6FA] mb-2">Adjust Store Credit</p>
                      <div className="flex gap-2">
                        <input
                          value={creditAmount}
                          onChange={e => setCreditAmount(e.target.value)}
                          type="number"
                          placeholder="Amount (negative to deduct)"
                          className="flex-1 px-3 py-2 rounded-lg bg-[rgba(7,10,18,0.5)] border border-[rgba(244,246,250,0.1)] text-sm text-[#F4F6FA] focus:outline-none focus:border-[#F59E0B]"
                        />
                        <input
                          value={creditDesc}
                          onChange={e => setCreditDesc(e.target.value)}
                          placeholder="Reason"
                          className="flex-1 px-3 py-2 rounded-lg bg-[rgba(7,10,18,0.5)] border border-[rgba(244,246,250,0.1)] text-sm text-[#F4F6FA] focus:outline-none focus:border-[#F59E0B]"
                        />
                      </div>
                      <div className="flex gap-2 mt-2">
                        <button onClick={handleAdjustCredit} className="px-4 py-1.5 rounded-lg bg-[#F59E0B] text-[#070A12] text-xs font-semibold">Apply</button>
                        <button onClick={() => { setCreditPromoId(null); setCreditAmount(''); setCreditDesc(''); }} className="px-4 py-1.5 rounded-lg border border-[rgba(244,246,250,0.15)] text-xs text-[#A9B3C7]">Cancel</button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Code usage / affiliate orders */}
      {view === 'orders' && (
        <div className="space-y-3">
          {affOrders.length > 0 && (
            <div className="flex flex-wrap gap-4 text-xs text-[#A9B3C7] p-3 rounded-xl bg-[rgba(7,10,18,0.45)] border border-[rgba(244,246,250,0.06)]">
              <span>
                <strong className="text-[#F4F6FA]">{affOrders.length}</strong> orders with an influencer code
              </span>
              <span>
                Total customer discount given: <strong className="text-[#8B5CF6]">kr {totalCodeDiscountGiven.toFixed(2)}</strong>
              </span>
            </div>
          )}
          {affOrders.length === 0 ? (
            <div className="text-center py-12 text-[#A9B3C7]">
              <ShoppingCart className="w-10 h-10 mx-auto opacity-30 mb-2" />
              <p className="text-sm">No orders with a promo code yet</p>
            </div>
          ) : affOrders.map(o => (
            <div key={o.id} className="p-4 rounded-xl bg-[rgba(17,24,39,0.6)] border border-[rgba(244,246,250,0.08)]">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <span className="text-sm font-mono font-semibold text-[#F4F6FA]">{o.order_number}</span>
                  <span className="text-xs text-[#A9B3C7] ml-2">{new Date(o.created_at).toLocaleDateString('en-GB')}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${
                    o.status === 'credited' ? 'bg-[rgba(34,197,94,0.15)] text-[#22C55E]' : 'bg-[rgba(245,158,11,0.15)] text-[#F59E0B]'
                  }`}>{o.status}</span>
                  {o.status === 'pending' && (
                    <button
                      onClick={() => handleCreditOrder(o.order_id)}
                      className="px-3 py-1 rounded-lg bg-[#22C55E] text-[#070A12] text-[10px] font-semibold hover:bg-[#16A34A] transition-colors"
                    >
                      Credit Now
                    </button>
                  )}
                </div>
              </div>
              <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-[#A9B3C7]">
                <span>Influencer: <strong className="text-[#F4F6FA]">{o.promoter_name || '—'}</strong> ({o.promoter_code})</span>
                <span>Customer: {o.customer_email}</span>
                <span>Order: kr {Number(o.order_total).toFixed(2)}</span>
                <span className="text-[#22C55E] font-semibold">Commission: kr {Number(o.commission_amount).toFixed(2)} ({o.commission_percent}%)</span>
                {o.customer_discount > 0 && (
                  <span className="text-[#8B5CF6]">Customer Discount: kr {Number(o.customer_discount).toFixed(2)}</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}