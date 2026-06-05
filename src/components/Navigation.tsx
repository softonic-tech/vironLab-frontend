import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { ShoppingCart, Menu, X, User, LayoutDashboard, Settings, HelpCircle, TrendingUp, ChevronDown } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { useCart } from '@/context/CartContext';
import { useAffiliate } from '@/context/AffiliateContext';
import { useCurrency } from '@/context/CurrencyContext';
import { supabase, getCurrentUser } from '@/lib/supabase';
import { checkIsAdmin } from '@/lib/supabase-db';
export default function Navigation() {
  const location = useLocation();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isAdminUser, setIsAdminUser] = useState(false);
  const { totalItems, setIsCartOpen } = useCart();
  const { myPromoter } = useAffiliate();
  const { currency, setCurrency } = useCurrency();

  // Check login + admin state — read from Supabase session directly
  useEffect(() => {
    const syncAuthState = async () => {
      const user = await getCurrentUser();
      if (user) {
        setIsLoggedIn(true);
        localStorage.setItem('vironlabs_logged_in', 'true');
        const admin = await checkIsAdmin(user.id);
        setIsAdminUser(admin);
        localStorage.setItem('vironlabs_is_admin', admin ? 'true' : 'false');
      } else {
        setIsLoggedIn(false);
        setIsAdminUser(false);
        localStorage.removeItem('vironlabs_logged_in');
        localStorage.removeItem('vironlabs_is_admin');
      }
    };

    syncAuthState();

    // Re-sync whenever auth changes (login / logout in another tab etc.)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        setIsLoggedIn(true);
        localStorage.setItem('vironlabs_logged_in', 'true');
        const admin = await checkIsAdmin(session.user.id);
        setIsAdminUser(admin);
        localStorage.setItem('vironlabs_is_admin', admin ? 'true' : 'false');
      } else {
        setIsLoggedIn(false);
        setIsAdminUser(false);
        localStorage.removeItem('vironlabs_logged_in');
        localStorage.removeItem('vironlabs_is_admin');
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 100);
    };
    
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
    setIsMobileMenuOpen(false);
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setIsMobileMenuOpen(false);
  };

  const openContact = () => {
    window.location.href = '/contact-info';
    setIsMobileMenuOpen(false);
  };

  const scrollOrFaq = () => {
    if (location.pathname === '/') {
      const el = document.getElementById('landing-faq');
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      else window.location.assign('/faq');
    } else {
      window.location.assign('/faq');
    }
    setIsMobileMenuOpen(false);
  };

  const navLinks = [
    { label: 'Catalog', action: scrollToTop },
    { label: 'Trust', id: 'trust' },
    { label: 'Quality', id: 'quality' },
    { label: 'Lab guide', id: 'tutorial' },
    { label: 'Contact', action: openContact },
  ];

  const CurrencyDropdown = ({
    isMobile = false,
  }: {
    isMobile?: boolean;
  }) => {
    const [open, setOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
      const handleOutsideClick = (event: MouseEvent) => {
        if (!dropdownRef.current?.contains(event.target as Node)) {
          setOpen(false);
        }
      };

      document.addEventListener('mousedown', handleOutsideClick);
      return () => document.removeEventListener('mousedown', handleOutsideClick);
    }, []);

    const triggerLabel =
      currency === 'sek' ? 'SEK kr' : currency === 'gbp' ? 'GBP £' : currency === 'eur' ? 'EUR €' : 'USD $';

    return (
      <div
        ref={dropdownRef}
        className={isMobile ? 'relative w-full' : 'relative hidden md:block w-[108px]'}
      >
        <button
          type="button"
          onClick={() => setOpen((prev) => !prev)}
          className={
            isMobile
              ? 'flex h-10 w-full items-center justify-between rounded-lg border border-[rgba(244,246,250,0.15)] bg-[rgba(7,10,18,0.5)] px-3 text-sm text-[#F4F6FA] transition-colors duration-300 hover:bg-[rgba(14,18,30,0.85)] focus:outline-none focus:border-amber-400/60 focus:ring-2 focus:ring-amber-400/25'
              : 'flex h-10 w-full items-center justify-between rounded-full border border-amber-500/35 bg-amber-500/10 px-3 text-sm font-medium text-amber-200 transition-colors duration-300 hover:bg-amber-500/18 hover:text-amber-50 focus:outline-none focus:border-amber-400/70 focus:ring-2 focus:ring-amber-400/25'
          }
          aria-label="Currency selector"
          aria-expanded={open}
          aria-haspopup="listbox"
        >
          <span>{triggerLabel}</span>
          <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${open ? 'rotate-180' : ''} ${isMobile ? 'text-[#A9B3C7]' : 'text-amber-300/85'}`} />
        </button>

        {open && (
          <div
            className={
              isMobile
                ? 'absolute z-50 mt-2 w-full overflow-hidden rounded-lg border border-[rgba(244,246,250,0.14)] bg-[rgba(7,10,18,0.96)] backdrop-blur-xl'
                : 'absolute right-0 z-50 mt-2 w-[96px] overflow-hidden rounded-2xl border border-[rgba(244,246,250,0.14)] bg-[rgba(7,10,18,0.96)] backdrop-blur-xl'
            }
            role="listbox"
            aria-label="Select currency"
          >
            {[
              { value: 'sek', label: 'SEK kr' },
              { value: 'gbp', label: 'GBP £' },
              { value: 'eur', label: 'EUR €' },
              { value: 'usd', label: 'USD $' },
            ].map((option) => {
              const isActive = currency === option.value;
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => {
                    setCurrency(option.value as 'sek' | 'gbp' | 'eur' | 'usd');
                    setOpen(false);
                  }}
                  className={`flex w-full items-center justify-between px-3 py-2 text-left text-sm transition-colors ${
                    isActive
                      ? 'bg-amber-500/20 text-amber-200'
                      : 'text-[#F4F6FA] hover:bg-[rgba(244,246,250,0.08)]'
                  }`}
                  role="option"
                  aria-selected={isActive}
                >
                  <span>{option.label}</span>
                  {isActive && <span className="text-xs">✓</span>}
                </button>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
          isScrolled
            ? 'bg-[rgba(7,10,18,0.92)] backdrop-blur-md border-b border-amber-500/15 shadow-[0_8px_32px_rgba(0,0,0,0.35)]'
            : 'bg-transparent'
        }`}
      >
        <div className="w-full max-w-[1680px] mx-auto px-4 sm:px-6 lg:px-10 xl:px-12">
          <div className="flex items-center gap-4 lg:gap-6 min-h-16 h-16 sm:h-20 lg:h-24">
            {/* Brand — logo only */}
            <button
              type="button"
              onClick={scrollToTop}
              className="flex shrink-0 items-center pr-1 lg:pr-2"
              aria-label="VIRON — back to top"
            >
              <motion.span whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.98 }} className="block">
                <img
                  src="/logo.png"
                  alt=""
                  className="h-9 w-auto max-h-9 sm:h-11 sm:max-h-11 max-w-[min(200px,42vw)] object-contain object-left"
                  width={180}
                  height={44}
                  draggable={false}
                />
              </motion.span>
            </button>

            {/* Desktop Navigation — centered in the row so logo + actions stay balanced */}
            <nav
              className="hidden lg:flex flex-1 justify-center items-center min-w-0 px-2 xl:px-4"
              aria-label="Primary"
            >
              <div className="flex flex-nowrap items-center justify-center gap-x-5 xl:gap-x-8">
                {navLinks.map((link) => (
                  <button
                    key={link.label}
                    type="button"
                    onClick={link.action ? link.action : () => link.id && scrollToSection(link.id)}
                    className="whitespace-nowrap text-sm font-medium text-slate-400 hover:text-amber-200/95 transition-colors duration-300"
                  >
                    {link.label}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={scrollOrFaq}
                  className="inline-flex items-center gap-1.5 whitespace-nowrap text-sm font-medium text-slate-400 hover:text-amber-200/95 transition-colors duration-300"
                >
                  <HelpCircle className="w-4 h-4 shrink-0 opacity-85" aria-hidden />
                  FAQ
                </button>
              </div>
            </nav>

            {/* Right Side */}
            <div className="flex shrink-0 items-center gap-1.5 sm:gap-2 md:gap-2.5 lg:gap-3 ml-auto lg:ml-0">
              {/* Currency Selector */}
              <CurrencyDropdown />

              {/* Dashboard/Login Button - Desktop */}
              {isLoggedIn ? (
                <div className="hidden sm:flex items-center gap-2">
                  {myPromoter && (
                  <a
                    href="/promoter"
                    className="flex items-center gap-2 px-3 sm:px-3.5 py-2 rounded-full bg-[rgba(34,197,94,0.15)] border border-[rgba(34,197,94,0.3)] text-[#22C55E] hover:bg-[rgba(34,197,94,0.25)] transition-colors duration-300"
                    title="Promoter"
                    aria-label="Promoter dashboard"
                  >
                      <TrendingUp className="w-4 h-4 shrink-0" />
                      <span className="hidden min-[1180px]:inline text-sm font-medium whitespace-nowrap">Promoter</span>
                    </a>
                  )}
                  <a
                    href="/dashboard"
                    className="flex items-center gap-2 px-3 sm:px-3.5 py-2 rounded-full bg-amber-500/12 border border-amber-500/35 text-amber-200 hover:bg-amber-500/22 hover:text-amber-50 hover:border-amber-400/45 transition-colors duration-300"
                    title="Dashboard"
                    aria-label="Dashboard"
                  >
                    <LayoutDashboard className="w-4 h-4 shrink-0" />
                    <span className="hidden min-[1180px]:inline text-sm font-medium whitespace-nowrap">Dashboard</span>
                  </a>
                  <a
                    href="/settings"
                    className="flex items-center justify-center w-10 h-10 rounded-full bg-[rgba(244,246,250,0.08)] border border-[rgba(244,246,250,0.15)] text-[#A9B3C7] hover:text-[#F4F6FA] hover:bg-[rgba(244,246,250,0.12)] transition-colors duration-300"
                    title="Account Settings"
                  >
                    <Settings className="w-4 h-4" />
                  </a>
                </div>
              ) : (
                <a
                  href="/login"
                  className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-full bg-amber-500/12 border border-amber-500/40 text-amber-200 hover:bg-amber-500/22 hover:text-amber-50 hover:border-amber-400/55 transition-colors duration-300 shadow-[0_0_22px_rgba(234,179,8,0.14)]"
                >
                  <User className="w-4 h-4" />
                  <span className="text-sm font-medium">Login</span>
                </a>
              )}

              {/* Cart Button */}
              <button
                onClick={() => setIsCartOpen(true)}
                className="relative p-2.5 sm:p-3 rounded-full hover:bg-[rgba(244,246,250,0.08)] transition-colors duration-300"
              >
                <ShoppingCart className="w-6 h-6 sm:w-7 sm:h-7 text-[#F4F6FA]" />
                {totalItems > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 text-zinc-950 ring-2 ring-[rgba(7,10,18,0.9)] text-xs sm:text-sm font-bold flex items-center justify-center">
                    {totalItems}
                  </span>
                )}
              </button>

              {/* Mobile Menu Button */}
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="lg:hidden p-2 rounded-full hover:bg-[rgba(244,246,250,0.08)] transition-colors duration-300"
              >
                {isMobileMenuOpen ? (
                  <X className="w-6 h-6 text-[#F4F6FA]" />
                ) : (
                  <Menu className="w-6 h-6 text-[#F4F6FA]" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        <div
          className={`lg:hidden absolute top-full left-0 right-0 bg-[rgba(7,10,18,0.98)] backdrop-blur-md border-b border-amber-500/12 transition-all duration-300 ${
            isMobileMenuOpen
              ? 'opacity-100 translate-y-0'
              : 'opacity-0 -translate-y-4 pointer-events-none'
          }`}
        >
          <div className="px-6 py-6 space-y-4">
            <div className="pt-1">
              <label className="block text-[11px] text-[#A9B3C7] mb-1">Currency</label>
              <CurrencyDropdown isMobile />
            </div>
            
            {navLinks.map((link) => (
              <button
                key={link.label}
                onClick={link.action ? link.action : () => link.id && scrollToSection(link.id)}
                className="block w-full text-left text-lg font-medium text-slate-400 hover:text-amber-200 transition-colors duration-300 py-2"
              >
                {link.label}
              </button>
            ))}

            <button
              type="button"
              onClick={scrollOrFaq}
              className="flex items-center gap-2 text-lg font-medium text-slate-400 hover:text-amber-200 transition-colors duration-300 py-2 w-full text-left"
            >
              <HelpCircle className="w-5 h-5" />
              FAQ
            </button>

            {/* Mobile Login/Dashboard Button */}
            {isLoggedIn ? (
              <>
                {myPromoter && (
                  <a
                    href="/promoter"
                    className="flex items-center gap-2 text-lg font-medium text-[#22C55E] hover:text-[#4ADE80] transition-colors duration-300 py-2"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <TrendingUp className="w-5 h-5" />
                    Promoter Dashboard
                  </a>
                )}
                <a
                  href="/dashboard"
                  className="flex items-center gap-2 text-lg font-medium text-amber-200 hover:text-amber-100 transition-colors duration-300 py-2"
                >
                  <LayoutDashboard className="w-5 h-5" />
                  Dashboard
                </a>
                <a
                  href="/settings"
                  className="flex items-center gap-2 text-lg font-medium text-[#A9B3C7] hover:text-[#F4F6FA] transition-colors duration-300 py-2"
                >
                  <Settings className="w-5 h-5" />
                  Account Settings
                </a>
              </>
            ) : (
              <a
                href="/login"
                className="flex items-center gap-2 text-lg font-medium text-amber-200 hover:text-amber-50 transition-colors duration-300 py-2"
              >
                <User className="w-5 h-5" />
                Login
              </a>
            )}
          </div>
        </div>
      </nav>
    </>
  );
}
