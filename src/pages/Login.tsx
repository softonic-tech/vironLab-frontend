import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, User, History, Star } from 'lucide-react';
import { supabase, signUp, signIn, getCurrentUser } from '@/lib/supabase';
import { checkIsAdmin } from '@/lib/supabase-db';
import { sendSignUpWelcome } from '@/lib/email';
import PageTopBar from '@/components/PageTopBar';
import { useTranslation } from '@/i18n';

export default function Login() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const friendlyAuthErrorMessage = (raw: string | undefined | null): string => {
    const m = (raw || '').trim();
    if (/email\s+not\s+confirmed/i.test(m)) return t('auth.emailNotConfirmed');
    return m || t('common.error');
  };
  const [isLoading, setIsLoading] = useState(true);
  const [isSignUp, setIsSignUp] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
  });
  const [error, setError] = useState<string | null>(null);

  const checkUser = useCallback(async () => {
    const currentUser = await getCurrentUser();
    if (currentUser) {
      localStorage.setItem('vironlabs_logged_in', 'true');
      navigate('/dashboard');
      return;
    }
    localStorage.removeItem('vironlabs_logged_in');
    setIsLoading(false);
  }, [navigate]);

  // Check for existing session on mount
  useEffect(() => {
    checkUser();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      void event;
      const nextUser = session?.user ?? null;
      if (nextUser) {
        localStorage.setItem('vironlabs_logged_in', 'true');
        navigate('/dashboard');
      } else {
        localStorage.removeItem('vironlabs_logged_in');
      }
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [checkUser, navigate]);

  const REF_STORAGE_KEY = 'vironlabs_ref';

  /** Get referrer user id from URL (?ref=...) or sessionStorage (so ref survives navigation from home to login). */
  const getReferrerIdFromUrl = (): string | null => {
    const hash = window.location.hash || '';
    const search = window.location.search || '';
    const hashQuery = hash.includes('?') ? hash.slice(hash.indexOf('?') + 1) : '';
    const params = new URLSearchParams(hashQuery || search);
    let ref = params.get('ref');
    if (ref && /^[0-9a-f-]{36}$/i.test(ref)) {
      try {
        sessionStorage.setItem(REF_STORAGE_KEY, ref);
      } catch (err) {
        void err;
      }
      return ref;
    }
    try {
      ref = sessionStorage.getItem(REF_STORAGE_KEY);
      return ref && /^[0-9a-f-]{36}$/i.test(ref) ? ref : null;
    } catch (err) {
      void err;
      return null;
    }
  };

  /** Clear stored ref after use (so we don't award twice). */
  const clearStoredRef = () => {
    try {
      sessionStorage.removeItem(REF_STORAGE_KEY);
    } catch (err) {
      void err;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      if (isSignUp) {
        const referrerId = getReferrerIdFromUrl();
        // Store referrer_id in user metadata so referral is created when account is confirmed (works with Supabase email confirmation)
        const { error: signUpError } = await signUp(formData.email, formData.password, {
          name: formData.name,
          ...(referrerId ? { referrer_id: referrerId } : {}),
        });

        if (signUpError) {
          setError(friendlyAuthErrorMessage(signUpError.message));
          setError(friendlyAuthErrorMessage(signUpError.message));
          return;
        }

        // Auto sign in after signup (if email confirmation is disabled)
        const { error: signInError } = await signIn(formData.email, formData.password);
        if (signInError) {
          setError(friendlyAuthErrorMessage(signInError.message));
          setError(friendlyAuthErrorMessage(signInError.message));
          return;
        }
        // If signed in immediately, the user can continue to their account dashboard.
        void sendSignUpWelcome(formData.email, formData.name);
        clearStoredRef();
      } else {
        // Sign in
        const { error: signInError } = await signIn(formData.email, formData.password);
        if (signInError) {
          setError(friendlyAuthErrorMessage(signInError.message));
          setError(friendlyAuthErrorMessage(signInError.message));
          return;
        }
      }
      // Check if logged-in user is admin → redirect accordingly
      const signedInUser = await getCurrentUser();
      if (signedInUser && await checkIsAdmin(signedInUser.id)) {
        localStorage.setItem('vironlabs_is_admin', 'true');
      } else {
        localStorage.removeItem('vironlabs_is_admin');
      }
      navigate('/dashboard');
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : typeof err === 'string' ? err : JSON.stringify(err);
      setError(friendlyAuthErrorMessage(msg));
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#070A12' }}>
        <div className="w-8 h-8 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }


  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#070A12' }}>
      {/* Grid Overlay */}
      <div className="absolute inset-0 grid-overlay opacity-60" />

      <PageTopBar backHref="/" backLabel={t('auth.backToShop')} />

      {/* Main Content */}
      <main className="relative z-10 px-6 lg:px-12 py-6 lg:py-8 flex-1 flex items-center">
        <div className="max-w-md mx-auto w-full">
          {/* Header */}
          <div className="text-center mb-5">
            <span className="eyebrow mb-2 block">{t('auth.membersArea')}</span>
            <h1 className="text-3xl sm:text-4xl font-bold text-[#F4F6FA] mb-2">
              {isSignUp ? t('auth.createAccount') : t('auth.welcomeBack')}
            </h1>
            <p className="text-[#A9B3C7]">
              {isSignUp ? t('auth.signUpSubtitle') : t('auth.signInSubtitle')}
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-4 p-4 rounded-xl bg-[rgba(239,68,68,0.1)] border border-[rgba(239,68,68,0.2)]">
              <p className="text-sm text-[#EF4444]">{error}</p>
            </div>
          )}

          {/* Form */}
          <div className="p-5 sm:p-6 rounded-2xl bg-[rgba(17,24,39,0.6)] border border-[rgba(244,246,250,0.08)]">
            <form onSubmit={handleSubmit} className="space-y-5">
              {isSignUp && (
                <div>
                  <label className="block text-sm text-[#A9B3C7] mb-2">{t('auth.fullName')}</label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#A9B3C7]" />
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                      className="w-full pl-12 pr-4 py-3 rounded-xl bg-[rgba(7,10,18,0.5)] border border-[rgba(244,246,250,0.1)] text-[#F4F6FA] placeholder-[#A9B3C7] focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400/25 transition-colors"
                      placeholder={t('auth.yourName')}
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm text-[#A9B3C7] mb-2">{t('auth.email')}</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#A9B3C7]" />
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                    className="w-full pl-12 pr-4 py-3 rounded-xl bg-[rgba(7,10,18,0.5)] border border-[rgba(244,246,250,0.1)] text-[#F4F6FA] placeholder-[#A9B3C7] focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400/25 transition-colors"
                    placeholder={t('auth.emailPlaceholder')}
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm text-[#A9B3C7]">{t('auth.password')}</label>
                  {!isSignUp && (
                    <a href="/forgot-password" className="text-xs text-amber-400 hover:text-amber-300 hover:underline">
                      {t('auth.forgotPassword')}
                    </a>
                  )}
                </div>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#A9B3C7]" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    required
                    minLength={8}
                    className="w-full pl-12 pr-12 py-3 rounded-xl bg-[rgba(7,10,18,0.5)] border border-[rgba(244,246,250,0.1)] text-[#F4F6FA] placeholder-[#A9B3C7] focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400/25 transition-colors"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-[#A9B3C7] hover:text-[#F4F6FA] transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-semibold transition-colors disabled:opacity-50 bg-gradient-to-r from-amber-500 to-amber-600 text-zinc-950 hover:from-amber-400 hover:to-amber-500 shadow-[0_6px_24px_rgba(245,158,11,0.3)]"
              >
                {isLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    {isSignUp ? t('auth.creatingAccount') : t('auth.signingIn')}
                  </>
                ) : (
                  <>
                    {isSignUp ? t('auth.createAccount') : t('auth.signIn')}
                  </>
                )}
              </button>
            </form>

            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-[rgba(244,246,250,0.1)]" />
              </div>
              <div className="relative flex justify-center">
                <span className="px-4 bg-[#111827] text-xs text-[#A9B3C7]">{t('common.or')}</span>
              </div>
            </div>

            <p className="text-center text-sm text-[#A9B3C7]">
              {isSignUp ? t('auth.haveAccount') : t('auth.noAccount')}{' '}
              <button
                type="button"
                onClick={() => setIsSignUp(!isSignUp)}
                className="text-amber-400 hover:text-amber-300 hover:underline font-medium"
              >
                {isSignUp ? t('auth.signIn') : t('auth.createAccount')}
              </button>
            </p>
          </div>

          <div className="mt-5 grid grid-cols-2 gap-3">
            <div className="p-3 rounded-xl bg-[rgba(17,24,39,0.4)] border border-[rgba(244,246,250,0.05)] text-center">
              <History className="w-6 h-6 text-sky-400 mx-auto mb-2" />
              <p className="text-sm text-[#F4F6FA] font-medium">{t('auth.trackOrders')}</p>
              <p className="text-xs text-[#A9B3C7]">{t('auth.viewHistory')}</p>
            </div>
            <div className="p-3 rounded-xl bg-[rgba(17,24,39,0.4)] border border-[rgba(244,246,250,0.05)] text-center">
              <Star className="w-6 h-6 text-[#F59E0B] mx-auto mb-2" />
              <p className="text-sm text-[#F4F6FA] font-medium">{t('auth.leaveReviews')}</p>
              <p className="text-xs text-[#A9B3C7]">{t('auth.afterPurchase')}</p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 px-6 lg:px-12 py-4 border-t border-amber-500/15">
        <div className="max-w-md mx-auto text-center">
          <p className="text-xs text-[#A9B3C7]">
            {t('auth.copyright')}
          </p>
        </div>
      </footer>
    </div>
  );
}
