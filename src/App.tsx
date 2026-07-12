import { Suspense, lazy, useEffect, useLayoutEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

import { CartProvider } from '@/context/CartContext';
import { RewardsProvider } from '@/context/RewardsContext';
import { AffiliateProvider } from '@/context/AffiliateContext';
import { CurrencyProvider } from '@/context/CurrencyContext';
import { LanguageProvider } from '@/i18n';
import { getSiteSetting, DEFAULT_LANDING_PAGE_SETTINGS } from '@/lib/settings';
import Navigation from '@/components/Navigation';
import CartDrawer from '@/components/CartDrawer';
import TrustMetrics from '@/components/landing/TrustMetrics';
import WhyViron from '@/components/landing/WhyViron';
import LandingFAQ from '@/components/landing/LandingFAQ';
import FinalCta from '@/components/landing/FinalCta';
import { useTranslation } from '@/i18n';

import LandingSplash from '@/components/landing/LandingSplash';
import LandingHero from '@/sections/LandingHero';
import Catalog from '@/sections/Catalog';
import Quality from '@/sections/Quality';
import Tutorial from '@/sections/Tutorial';
import Reviews from '@/sections/Reviews';
import Footer from '@/sections/Footer';

// Route-level code-splitting: keeps initial bundle smaller (faster deploy + faster first load).
const Contact = lazy(() => import('@/pages/Contact'));
const Checkout = lazy(() => import('@/pages/Checkout'));
const CheckoutSuccess = lazy(() => import('@/pages/CheckoutSuccess'));
const CheckoutCancel = lazy(() => import('@/pages/CheckoutCancel'));
const Privacy = lazy(() => import('@/pages/Privacy'));
const Terms = lazy(() => import('@/pages/Terms'));
const Refund = lazy(() => import('@/pages/Refund'));
const Legal = lazy(() => import('@/pages/Legal'));
const Shipping = lazy(() => import('@/pages/Shipping'));
const ContactInfo = lazy(() => import('@/pages/ContactInfo'));
const Standards = lazy(() => import('@/pages/Standards'));
const Login = lazy(() => import('@/pages/Login'));
const Dashboard = lazy(() => import('@/pages/Dashboard'));
const ForgotPassword = lazy(() => import('@/pages/ForgotPassword'));
const ResetPassword = lazy(() => import('@/pages/ResetPassword'));
const Settings = lazy(() => import('@/pages/Settings'));
const AdminLogin = lazy(() => import('@/pages/AdminLogin'));
const AdminDashboard = lazy(() => import('@/pages/AdminDashboard'));
const FAQ = lazy(() => import('@/pages/FAQ'));
const NotFound = lazy(() => import('@/pages/NotFound'));
const ProductPage = lazy(() => import('@/pages/Product'));
const PromoterDashboard = lazy(() => import('@/pages/PromoterDashboard'));
const TrackOrder = lazy(() => import('@/pages/TrackOrder'));
const Analysis = lazy(() => import('@/pages/Analysis'));

gsap.registerPlugin(ScrollTrigger);

function HomePage() {
  useEffect(() => {
    // Wait for all ScrollTriggers to be created
    const timeout = setTimeout(() => {
      const pinned = ScrollTrigger.getAll()
        .filter((st) => st.vars.pin)
        .sort((a, b) => a.start - b.start);

      const maxScroll = ScrollTrigger.maxScroll(window);

      if (!maxScroll || pinned.length === 0) return;

      // Build ranges and snap targets from pinned sections
      const pinnedRanges = pinned.map((st) => ({
        start: st.start / maxScroll,
        end: (st.end ?? st.start) / maxScroll,
        center: (st.start + ((st.end ?? st.start) - st.start) * 0.5) / maxScroll,
      }));

      // Create global snap
      ScrollTrigger.create({
        snap: {
          snapTo: (value) => {
            // Check if within any pinned range (allow small buffer)
            const inPinned = pinnedRanges.some(
              (r) => value >= r.start - 0.02 && value <= r.end + 0.02
            );

            // If not in a pinned section, allow free scroll
            if (!inPinned) return value;

            // Find nearest pinned center
            const target = pinnedRanges.reduce(
              (closest, r) =>
                Math.abs(r.center - value) < Math.abs(closest - value)
                  ? r.center
                  : closest,
              pinnedRanges[0]?.center ?? 0
            );

            return target;
          },
          duration: { min: 0.15, max: 0.35 },
          delay: 0,
          ease: 'power2.out',
        },
      });
    }, 100);

    return () => {
      clearTimeout(timeout);
      ScrollTrigger.getAll().forEach((st) => st.kill());
    };
  }, []);

  return (
    <div className="landing-page">
      <LandingSplash />

      {/* Premium ambient gradient backdrop — landing-page only */}
      <div className="landing-aurora" aria-hidden="true" />

      {/* Noise Overlay */}
      <div className="noise-overlay" />

      {/* Navigation */}
      <Navigation />

      {/* Cart Drawer */}
      <CartDrawer />

      {/* Main Content */}
      <main className="relative">
        <LandingHero />

        <TrustMetrics />

        <Catalog />

        <WhyViron />

        <Quality />
        
        {/* Tutorial - Reconstitution Steps */}
        <Tutorial />
        
        <Reviews />

        <LandingFAQ />

        <FinalCta />

        <Footer />
      </main>
    </div>
  );
}

function LandingPageUnavailable() {
  const { t } = useTranslation();
  return (
    <div className="min-h-screen bg-[#030308] flex items-center justify-center px-4">
      <div className="w-full max-w-xl rounded-2xl border border-amber-500/30 bg-[rgba(12,14,26,0.85)] backdrop-blur-xl p-7 text-center shadow-[0_0_60px_rgba(234,179,8,0.12)]">
        <p className="text-[11px] tracking-[0.28em] uppercase text-amber-300 mb-2 font-mono">VIRON</p>
        <h1 className="text-3xl font-bold text-[#F4F6FA] mb-3 font-['Syne',sans-serif]">{t('app.comingSoon')}</h1>
        <p className="text-sm text-[#A9B3C7] leading-relaxed">
          {t('app.comingSoonMessage')}
        </p>
      </div>
    </div>
  );
}

function HomeRoute() {
  const [isEnabled, setIsEnabled] = useState(true);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const loadLandingState = async () => {
      try {
        const data = await getSiteSetting('landing_page_settings', DEFAULT_LANDING_PAGE_SETTINGS);
        if (!cancelled) setIsEnabled(data.enabled !== false);
      } catch (error) {
        console.error('Failed to load landing page setting:', error);
        if (!cancelled) setIsEnabled(true);
      } finally {
        if (!cancelled) setIsChecking(false);
      }
    };
    loadLandingState();
    return () => {
      cancelled = true;
    };
  }, []);

  if (isChecking) return <div className="min-h-screen bg-[#070A12]" />;
  return isEnabled ? <HomePage /> : <LandingPageUnavailable />;
}

/**
 * Old links and bookmarks used HashRouter (`/#/path`). One-shot migrate to
 * path URLs (`/path`) so BrowserRouter matches.
 */
function LegacyHashRedirect() {
  const navigate = useNavigate();
  useLayoutEffect(() => {
    const h = window.location.hash;
    if (!h.startsWith('#/')) return;
    const pathAndQuery = h.slice(1);
    navigate(pathAndQuery, { replace: true });
  }, [navigate]);
  return null;
}

/** Persist referral ref and affiliate code from URL to sessionStorage. */
function PersistReferralRef() {
  const location = useLocation();
  useEffect(() => {
    const params = new URLSearchParams(location.search || '');
    const ref = params.get('ref');
    if (ref && /^[0-9a-f-]{36}$/i.test(ref)) {
      try { sessionStorage.setItem('vironlabs_ref', ref); } catch (_) {}
    }
    // Affiliate code auto-apply: ?aff=MIKE10 or ?code=MIKE10
    const affCode = params.get('aff') || params.get('code');
    if (affCode && /^[A-Za-z0-9_-]{2,30}$/.test(affCode)) {
      try { sessionStorage.setItem('vironlabs_affiliate_code', JSON.stringify({ code: affCode.toUpperCase(), promotion: null, autoApply: true })); } catch (_) {}
    }
  }, [location.search]);
  return null;
}

/**
 * After a long backgrounded period (e.g. user spent the day on Facebook), the browser's
 * HTTP connections, the Supabase auth client's internal lock queue, and the cached access
 * token can all end up in a degraded state where every Supabase call hangs forever.
 * Symptoms: app stays on a loading skeleton until a manual hard-refresh.
 *
 * The persisted Supabase session in localStorage survives a reload, so the user stays
 * logged in. We use *three* independent detectors because no single one is reliable
 * across all browsers, OSes and window-management setups:
 *
 *   1. visibilitychange — fires on tab switches inside the same window.
 *   2. window focus/blur — fires when switching between OS windows.
 *   3. setInterval heartbeat — browsers throttle or pause timers in background tabs;
 *      a "missed heartbeat" gap is a reliable signal that the tab was sleeping, even
 *      when 1 and 2 don't fire.
 *
 * We deliberately skip the reload on /checkout to avoid wiping a half-filled order form,
 * and skip if a form input is focused so we never destroy data the user is typing.
 */
function StaleTabReloader() {
  useEffect(() => {
    const STALE_RELOAD_MS = 90 * 1000;
    const HEARTBEAT_MS = 15 * 1000;
    let lastSeenAt = Date.now();
    let reloading = false;

    const isUserActivelyEditing = () => {
      const el = document.activeElement as HTMLElement | null;
      if (!el) return false;
      const tag = el.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return true;
      if (el.isContentEditable) return true;
      return false;
    };

    const isOnSensitiveRoute = () => {
      const path = window.location.pathname || '';
      return path.startsWith('/checkout');
    };

    const maybeReload = (gap: number) => {
      if (reloading) return;
      if (gap < STALE_RELOAD_MS) return;
      if (isOnSensitiveRoute() || isUserActivelyEditing()) return;
      reloading = true;
      window.location.reload();
    };

    const checkGap = () => {
      const now = Date.now();
      const gap = now - lastSeenAt;
      lastSeenAt = now;
      maybeReload(gap);
    };

    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') checkGap();
      else lastSeenAt = Date.now();
    };

    const onFocus = () => checkGap();
    const onPageShow = (e: PageTransitionEvent) => {
      // bfcache restore — also a strong signal the tab was paused
      if (e.persisted) checkGap();
    };

    const interval = window.setInterval(() => {
      const now = Date.now();
      const gap = now - lastSeenAt;
      lastSeenAt = now;
      // Heartbeat catches throttled/paused timers when no visibility/focus event fires.
      if (gap > HEARTBEAT_MS * 2) maybeReload(gap);
    }, HEARTBEAT_MS);

    document.addEventListener('visibilitychange', onVisibilityChange);
    window.addEventListener('focus', onFocus);
    window.addEventListener('pageshow', onPageShow);

    return () => {
      window.clearInterval(interval);
      document.removeEventListener('visibilitychange', onVisibilityChange);
      window.removeEventListener('focus', onFocus);
      window.removeEventListener('pageshow', onPageShow);
    };
  }, []);
  return null;
}

function App() {
  return (
    <LanguageProvider>
    <CurrencyProvider>
      <CartProvider>
        <RewardsProvider>
          <AffiliateProvider>
        <BrowserRouter>
          <LegacyHashRedirect />
          <PersistReferralRef />
          <StaleTabReloader />
          <Suspense fallback={<div className="min-h-screen bg-[#070A12]" />}>
            <Routes>
              <Route path="/" element={<HomeRoute />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="/checkout" element={<Checkout />} />
              <Route path="/checkout/success" element={<CheckoutSuccess />} />
              <Route path="/checkout/cancel" element={<CheckoutCancel />} />
              <Route path="/privacy" element={<Privacy />} />
              <Route path="/terms" element={<Terms />} />
              <Route path="/refund" element={<Refund />} />
              <Route path="/legal" element={<Legal />} />
              <Route path="/shipping" element={<Shipping />} />
              <Route path="/contact-info" element={<ContactInfo />} />
              <Route path="/standards" element={<Standards />} />
              <Route path="/login" element={<Login />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/admin/login" element={<AdminLogin />} />
              <Route path="/admin/dashboard" element={<AdminDashboard />} />
              <Route path="/faq" element={<FAQ />} />
              <Route path="/product/:slug" element={<ProductPage />} />
              <Route path="/promoter" element={<PromoterDashboard />} />
              <Route path="/track-order" element={<TrackOrder />} />
              <Route path="/analysis" element={<Analysis />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
          </AffiliateProvider>
        </RewardsProvider>
      </CartProvider>
    </CurrencyProvider>
    </LanguageProvider>
  );
}

export default App;