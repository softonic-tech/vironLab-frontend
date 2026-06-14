import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Copy, Check, DollarSign, ShoppingBag, TrendingUp,
  Users, Link2, CreditCard, LogOut, Award, ExternalLink,
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { supabase, getCurrentUser, signOut } from '@/lib/supabase';
import { useAffiliate } from '@/context/AffiliateContext';
import { COMMISSION_TIERS, getTierForSales, type AffiliateOrder, type StoreCreditTransaction } from '@/lib/affiliates';
import { CONFIG } from '@/lib/config';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import { useTranslation, useLanguage } from '@/i18n';

export default function PromoterDashboard() {
  const { t } = useTranslation();
  const { language } = useLanguage();
  const navigate = useNavigate();
  const {
    myPromoter,
    myAffiliateOrders,
    myCreditTransactions,
    isPromoterLoading,
    refreshPromoterData,
  } = useAffiliate();

  const [user, setUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [showAllOrders, setShowAllOrders] = useState(false);
  const [showAllCredits, setShowAllCredits] = useState(false);

  useEffect(() => {
    const load = async () => {
      const u = await getCurrentUser();
      if (!u) { navigate('/login'); return; }
      setUser(u);
      setIsLoading(false);
    };
    load();
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, s) => {
      if (!s?.user) navigate('/login');
    });
    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleLogout = async () => {
    await signOut();
    navigate('/login');
  };

  const referralLink = myPromoter
    ? `${CONFIG.SITE_URL || window.location.origin}/?aff=${myPromoter.referral_code}`
    : '';

  const handleCopyLink = () => {
    navigator.clipboard.writeText(referralLink);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleCopyCode = () => {
    if (!myPromoter) return;
    navigator.clipboard.writeText(myPromoter.referral_code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString(language === 'sv' ? 'sv-SE' : 'en-GB', { day: 'numeric', month: 'short', year: 'numeric' });

  const formatCurrency = (n: number) => `${Number(n || 0).toFixed(2)} kr`;

  if (isLoading || isPromoterLoading) {
    return (
      <div className="min-h-screen" style={{ background: '#070A12' }}>
        <div className="absolute inset-0 grid-overlay opacity-60" />
        <nav className="relative z-50 px-4 py-3 border-b border-[rgba(244,246,250,0.06)]">
          <div className="flex items-center justify-between">
            <Skeleton className="h-9 w-9 rounded-xl" />
            <Skeleton className="h-7 w-32 rounded" />
            <Skeleton className="h-9 w-9 rounded-xl" />
          </div>
        </nav>
        <main className="relative z-10 px-4 py-5">
          <div className="max-w-4xl mx-auto space-y-4">
            <Skeleton className="h-32 w-full rounded-2xl" />
            <div className="grid grid-cols-2 gap-3">
              {[...Array(4)].map((_, i) => (
                <Skeleton key={i} className="h-24 rounded-xl" />
              ))}
            </div>
            <Skeleton className="h-48 w-full rounded-2xl" />
          </div>
        </main>
      </div>
    );
  }

  if (!myPromoter) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#070A12' }}>
        <div className="absolute inset-0 grid-overlay opacity-60" />
        <div className="relative z-10 text-center px-4 max-w-md">
          <div className="w-16 h-16 rounded-full bg-[rgba(139,92,246,0.15)] border border-[rgba(139,92,246,0.3)] flex items-center justify-center mx-auto mb-4">
            <Users className="w-8 h-8 text-[#8B5CF6]" />
          </div>
          <h1 className="text-xl font-bold text-[#F4F6FA] mb-2">{t('dashboard.promoter.notYet')}</h1>
          <p className="text-sm text-[#A9B3C7] mb-6">{t('dashboard.promoter.notYetDesc')}</p>
          <div className="flex flex-col gap-3">
            <a
              href="/dashboard"
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-[#2ED1B4] to-[#8B5CF6] text-white font-semibold text-sm text-center"
            >
              {t('dashboard.promoter.goDashboard')}
            </a>
            <a href="/" className="text-sm text-[#A9B3C7] hover:text-[#F4F6FA] transition-colors">
              {t('dashboard.backToShop')}
            </a>
          </div>
        </div>
      </div>
    );
  }

  const currentTier = getTierForSales(myPromoter.total_sales);
  const nextTier = COMMISSION_TIERS.find(t => t.minSales > myPromoter.total_sales);
  const progressToNext = nextTier
    ? Math.min((myPromoter.total_sales / nextTier.minSales) * 100, 100)
    : 100;

  const creditedOrders = myAffiliateOrders.filter(o => o.status === 'credited');
  const pendingOrders = myAffiliateOrders.filter(o => o.status === 'pending');
  const displayedOrders = showAllOrders ? myAffiliateOrders : myAffiliateOrders.slice(0, 5);
  const displayedCredits = showAllCredits ? myCreditTransactions : myCreditTransactions.slice(0, 5);

  return (
    <div className="min-h-screen" style={{ background: '#070A12' }}>
      <div className="absolute inset-0 grid-overlay opacity-60" />

      {/* Header */}
      <nav className="lg:hidden relative z-50 sticky top-0 bg-[rgba(7,10,18,0.95)] backdrop-blur-sm border-b border-[rgba(244,246,250,0.06)]">
        <div className="flex items-center justify-between px-4 py-3">
          <a href="/" className="flex items-center justify-center w-9 h-9 rounded-xl bg-[rgba(244,246,250,0.06)] text-[#A9B3C7] hover:text-[#F4F6FA] transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </a>
          <div className="flex flex-col items-center">
            <img
              src="/logo.png"
              alt="Viron Labs"
              className="h-8 w-auto object-contain select-none"
              draggable={false}
            />
            <span className="text-[10px] font-mono uppercase tracking-[0.3em] text-[#22C55E] mt-0.5">{t('dashboard.promoter.eyebrow')}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <LanguageSwitcher />
            <button onClick={handleLogout} className="w-9 h-9 rounded-xl bg-[rgba(244,246,250,0.06)] flex items-center justify-center text-[#A9B3C7] hover:text-[#EF4444] transition-colors">
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </nav>

      <nav className="hidden lg:block relative z-50 px-12 py-6">
        <div className="flex items-center justify-between">
          <a href="/" className="flex flex-col items-start">
            <img
              src="/logo.png"
              alt="Viron Labs"
              className="h-14 w-auto object-contain select-none"
              draggable={false}
            />
            <span className="text-sm font-mono uppercase tracking-[0.5em] text-[#22C55E] mt-0.5">{t('dashboard.promoter.panel')}</span>
          </a>
          <div className="flex items-center gap-4">
            <LanguageSwitcher />
            <a href="/dashboard" className="text-sm text-[#A9B3C7] hover:text-[#F4F6FA] transition-colors">
              {t('dashboard.promoter.myAccount')}
            </a>
            <button onClick={handleLogout} className="flex items-center gap-2 text-sm text-[#A9B3C7] hover:text-[#EF4444] transition-colors">
              <LogOut className="w-4 h-4" /> {t('dashboard.logout')}
            </button>
          </div>
        </div>
      </nav>

      <main className="relative z-10 px-4 lg:px-12 py-5 lg:py-12">
        <div className="max-w-5xl mx-auto">

          {/* Welcome */}
          <div className="hidden lg:block mb-8">
            <h1 className="text-3xl font-bold text-[#F4F6FA] mb-1">
              {t('dashboard.promoter.welcome')} <span className="text-[#22C55E]">{myPromoter.name}</span>
            </h1>
            <p className="text-[#A9B3C7]">{t('dashboard.promoter.subtitle')}</p>
          </div>

          {/* Referral Code & Link */}
          <div className="p-4 sm:p-6 rounded-2xl bg-gradient-to-br from-[rgba(34,197,94,0.15)] to-[rgba(139,92,246,0.1)] border border-[rgba(34,197,94,0.3)] mb-4 lg:mb-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-[#22C55E]/20 flex items-center justify-center">
                <Link2 className="w-5 h-5 text-[#22C55E]" />
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-semibold text-[#F4F6FA]">{t('dashboard.promoter.yourReferral')}</h2>
                <p className="text-xs text-[#A9B3C7]">{t('dashboard.promoter.shareCode')}</p>
              </div>
            </div>
            <div className="grid sm:grid-cols-2 gap-3">
              {/* Code */}
              <div className="p-3 rounded-xl bg-[rgba(7,10,18,0.5)] border border-[rgba(244,246,250,0.08)]">
                <p className="text-[10px] uppercase tracking-wider text-[#A9B3C7] mb-1.5">{t('dashboard.promoter.yourCode')}</p>
                <div className="flex items-center justify-between">
                  <span className="text-xl font-bold text-[#22C55E] font-mono tracking-wider">{myPromoter.referral_code}</span>
                  <button onClick={handleCopyCode} className="p-2 rounded-lg bg-[rgba(34,197,94,0.2)] text-[#22C55E] hover:bg-[rgba(34,197,94,0.3)] transition-colors">
                    {copiedCode ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              {/* Link */}
              <div className="p-3 rounded-xl bg-[rgba(7,10,18,0.5)] border border-[rgba(244,246,250,0.08)]">
                <p className="text-[10px] uppercase tracking-wider text-[#A9B3C7] mb-1.5">{t('dashboard.promoter.yourLink')}</p>
                <div className="flex items-center gap-2">
                  <input type="text" readOnly value={referralLink} className="flex-1 bg-transparent text-xs text-[#A9B3C7] outline-none min-w-0 truncate" />
                  <button onClick={handleCopyLink} className="p-2 rounded-lg bg-[rgba(139,92,246,0.2)] text-[#8B5CF6] hover:bg-[rgba(139,92,246,0.3)] transition-colors shrink-0">
                    {copiedLink ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>
            <div className="mt-3 flex items-center gap-2 text-xs text-[#A9B3C7]">
              <Award className="w-3.5 h-3.5 text-[#22C55E]" />
              <span>{t('dashboard.promoter.customerDiscount')} <strong className="text-[#F4F6FA]">{myPromoter.customer_discount_percent}% off</strong> — {t('dashboard.promoter.youEarn')} <strong className="text-[#22C55E]">{myPromoter.commission_percent}% {t('dashboard.promoter.commission')}</strong></span>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4 lg:mb-6">
            <div className="p-3 sm:p-4 rounded-xl bg-[rgba(17,24,39,0.6)] border border-[rgba(244,246,250,0.08)]">
              <DollarSign className="w-5 h-5 text-[#22C55E] mb-1.5" />
              <p className="text-xl sm:text-2xl font-bold text-[#F4F6FA]">{formatCurrency(myPromoter.total_sales)}</p>
              <p className="text-[10px] sm:text-xs text-[#A9B3C7]">{t('dashboard.promoter.totalSales')}</p>
            </div>
            <div className="p-3 sm:p-4 rounded-xl bg-[rgba(17,24,39,0.6)] border border-[rgba(244,246,250,0.08)]">
              <ShoppingBag className="w-5 h-5 text-[#8B5CF6] mb-1.5" />
              <p className="text-xl sm:text-2xl font-bold text-[#F4F6FA]">{myPromoter.total_orders}</p>
              <p className="text-[10px] sm:text-xs text-[#A9B3C7]">{t('dashboard.orders')}</p>
            </div>
            <div className="p-3 sm:p-4 rounded-xl bg-[rgba(17,24,39,0.6)] border border-[rgba(244,246,250,0.08)]">
              <TrendingUp className="w-5 h-5 text-[#F59E0B] mb-1.5" />
              <p className="text-xl sm:text-2xl font-bold text-[#F4F6FA]">{formatCurrency(myPromoter.total_commission)}</p>
              <p className="text-[10px] sm:text-xs text-[#A9B3C7]">{t('dashboard.promoter.totalEarned')}</p>
            </div>
            <div className="p-3 sm:p-4 rounded-xl bg-gradient-to-br from-[rgba(34,197,94,0.15)] to-[rgba(34,197,94,0.05)] border border-[rgba(34,197,94,0.3)]">
              <CreditCard className="w-5 h-5 text-[#22C55E] mb-1.5" />
              <p className="text-xl sm:text-2xl font-bold text-[#22C55E]">{formatCurrency(myPromoter.store_credit)}</p>
              <p className="text-[10px] sm:text-xs text-[#22C55E]">{t('dashboard.promoter.storeCredit')}</p>
            </div>
          </div>

          {/* Tier Progress */}
          <div className="p-4 sm:p-6 rounded-2xl bg-[rgba(17,24,39,0.6)] border border-[rgba(244,246,250,0.08)] mb-4 lg:mb-6">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Award className="w-5 h-5 text-[#F59E0B]" />
                <h3 className="text-sm sm:text-base font-semibold text-[#F4F6FA]">{t('dashboard.promoter.commissionTier')}</h3>
              </div>
              <span className="px-3 py-1 rounded-full bg-[rgba(245,158,11,0.15)] text-[#F59E0B] text-xs font-semibold">
                {currentTier.label} — {currentTier.commission}%
              </span>
            </div>
            {nextTier && (
              <>
                <div className="flex items-center justify-between text-xs text-[#A9B3C7] mb-2">
                  <span>{t('dashboard.promoter.sales', { amount: formatCurrency(myPromoter.total_sales) })}</span>
                  <span>{t('dashboard.promoter.nextTier', { label: nextTier.label, amount: formatCurrency(nextTier.minSales) })}</span>
                </div>
                <div className="h-2 rounded-full bg-[rgba(244,246,250,0.08)] overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-[#F59E0B] to-[#22C55E] transition-all"
                    style={{ width: `${progressToNext}%` }}
                  />
                </div>
              </>
            )}
            <div className="mt-3 flex flex-wrap gap-2">
              {COMMISSION_TIERS.map((tier) => (
                <span
                  key={tier.name}
                  className={`px-2.5 py-1 rounded-full text-[10px] font-medium ${
                    tier.name === currentTier.name
                      ? 'bg-[rgba(245,158,11,0.2)] text-[#F59E0B] border border-[rgba(245,158,11,0.3)]'
                      : 'bg-[rgba(244,246,250,0.05)] text-[#A9B3C7] border border-[rgba(244,246,250,0.08)]'
                  }`}
                >
                  {tier.label}: {tier.commission}% (${tier.minSales}+)
                </span>
              ))}
            </div>
          </div>

          {/* Recent Referral Orders */}
          <div className="p-4 sm:p-6 rounded-2xl bg-[rgba(17,24,39,0.6)] border border-[rgba(244,246,250,0.08)] mb-4 lg:mb-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-[#8B5CF6]" />
                <h3 className="text-sm sm:text-base font-semibold text-[#F4F6FA]">{t('dashboard.promoter.referralOrders')}</h3>
              </div>
              <div className="flex items-center gap-3 text-xs">
                <span className="text-[#22C55E]">{t('dashboard.promoter.credited', { count: String(creditedOrders.length) })}</span>
                {pendingOrders.length > 0 && (
                  <span className="text-[#F59E0B]">{t('dashboard.promoter.pending', { count: String(pendingOrders.length) })}</span>
                )}
              </div>
            </div>
            {myAffiliateOrders.length === 0 ? (
              <div className="text-center py-8">
                <ShoppingBag className="w-10 h-10 mx-auto text-[rgba(244,246,250,0.15)] mb-2" />
                <p className="text-sm text-[#A9B3C7]">{t('dashboard.promoter.noReferralOrders')}</p>
              </div>
            ) : (
              <>
                <div className="space-y-2">
                  {displayedOrders.map(order => (
                    <div key={order.id} className="p-3 rounded-xl bg-[rgba(7,10,18,0.5)] border border-[rgba(244,246,250,0.05)]">
                      <div className="flex items-center justify-between mb-1.5">
                        <div>
                          <span className="text-xs font-mono font-semibold text-[#F4F6FA]">{order.order_number}</span>
                          <span className="text-[10px] text-[#A9B3C7] ml-2">{formatDate(order.created_at)}</span>
                        </div>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${
                          order.status === 'credited'
                            ? 'bg-[rgba(34,197,94,0.15)] text-[#22C55E]'
                            : 'bg-[rgba(245,158,11,0.15)] text-[#F59E0B]'
                        }`}>{order.status === 'credited' ? t('dashboard.promoter.statusCredited') : t('dashboard.promoter.statusPending')}</span>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-[#A9B3C7]">{t('dashboard.promoter.orderLabel')} {formatCurrency(order.order_total)}</span>
                        <span className="text-[#22C55E] font-semibold">+{formatCurrency(order.commission_amount)}</span>
                      </div>
                    </div>
                  ))}
                </div>
                {myAffiliateOrders.length > 5 && (
                  <button
                    onClick={() => setShowAllOrders(!showAllOrders)}
                    className="w-full mt-3 py-2.5 text-xs text-[#A9B3C7] hover:text-[#F4F6FA] transition-colors rounded-xl"
                  >
                    {showAllOrders ? t('dashboard.promoter.showLess') : t('dashboard.promoter.showAll', { count: String(myAffiliateOrders.length) })}
                  </button>
                )}
              </>
            )}
          </div>

          {/* Store Credit History */}
          {myCreditTransactions.length > 0 && (
            <div className="p-4 sm:p-6 rounded-2xl bg-[rgba(17,24,39,0.6)] border border-[rgba(244,246,250,0.08)] mb-4 lg:mb-6">
              <div className="flex items-center gap-2 mb-4">
                <CreditCard className="w-5 h-5 text-[#22C55E]" />
                <h3 className="text-sm sm:text-base font-semibold text-[#F4F6FA]">{t('dashboard.promoter.creditHistory')}</h3>
              </div>
              <div className="space-y-2">
                {displayedCredits.map(txn => (
                  <div key={txn.id} className="flex items-center justify-between p-3 rounded-xl bg-[rgba(7,10,18,0.5)] border border-[rgba(244,246,250,0.05)]">
                    <div>
                      <p className="text-xs text-[#F4F6FA]">{txn.description || txn.type}</p>
                      <p className="text-[10px] text-[#A9B3C7]">{formatDate(txn.created_at)}</p>
                    </div>
                    <span className={`text-sm font-bold ${txn.amount > 0 ? 'text-[#22C55E]' : 'text-[#EF4444]'}`}>
                      {txn.amount > 0 ? '+' : ''}{formatCurrency(Math.abs(txn.amount))}
                    </span>
                  </div>
                ))}
              </div>
              {myCreditTransactions.length > 5 && (
                <button
                  onClick={() => setShowAllCredits(!showAllCredits)}
                  className="w-full mt-3 py-2.5 text-xs text-[#A9B3C7] hover:text-[#F4F6FA] transition-colors rounded-xl"
                >
                  {showAllCredits ? t('dashboard.promoter.showLess') : t('dashboard.promoter.showAll', { count: String(myCreditTransactions.length) })}
                </button>
              )}
            </div>
          )}

          {/* Quick Actions */}
          <div className="p-4 sm:p-6 rounded-2xl bg-gradient-to-br from-[rgba(46,209,180,0.1)] to-[rgba(139,92,246,0.1)] border border-[rgba(46,209,180,0.2)]">
            <h3 className="text-sm font-semibold text-[#F4F6FA] mb-3">{t('dashboard.promoter.quickActions')}</h3>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={handleCopyLink}
                className="p-3 rounded-xl bg-[rgba(7,10,18,0.5)] border border-[rgba(244,246,250,0.08)] text-center hover:border-[rgba(34,197,94,0.3)] transition-colors"
              >
                <Link2 className="w-5 h-5 mx-auto mb-1 text-[#22C55E]" />
                <p className="text-xs text-[#F4F6FA]">{t('dashboard.promoter.copyLink')}</p>
              </button>
              <a
                href="/"
                className="p-3 rounded-xl bg-[rgba(7,10,18,0.5)] border border-[rgba(244,246,250,0.08)] text-center hover:border-[rgba(139,92,246,0.3)] transition-colors block"
              >
                <ShoppingBag className="w-5 h-5 mx-auto mb-1 text-[#8B5CF6]" />
                <p className="text-xs text-[#F4F6FA]">{t('dashboard.promoter.shopNow')}</p>
              </a>
            </div>
          </div>
        </div>
      </main>

      <footer className="relative z-0 px-4 lg:px-12 py-6 border-t border-[rgba(244,246,250,0.08)]">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-[10px] text-[#A9B3C7]">{t('dashboard.promoter.footer')}</p>
        </div>
      </footer>
    </div>
  );
}
