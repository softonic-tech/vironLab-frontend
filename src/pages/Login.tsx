import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Mail, Lock, Eye, EyeOff, User, History, Star } from 'lucide-react';
import { supabase, signUp, signIn, getCurrentUser } from '@/lib/supabase';
import { checkIsAdmin } from '@/lib/supabase-db';
import { sendSignUpWelcome } from '@/lib/email';

const EMAIL_NOT_CONFIRMED_COPY =
  "We've sent you a confirmation email. Please check your inbox and verify your account.";

/** Replace Supabase’s terse “Email not confirmed” with clearer storefront copy. */
function friendlyAuthErrorMessage(raw: string | undefined | null): string {
  const m = (raw || '').trim();
  if (/email\s+not\s+confirmed/i.test(m)) return EMAIL_NOT_CONFIRMED_COPY;
  return m || 'An error occurred';
}

export default function Login() {
  const navigate = useNavigate();
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

      {/* Navigation */}
      <nav className="relative z-50 px-6 lg:px-12 py-4">
        <div className="flex items-center justify-between">
          <a href="/" className="flex flex-col items-start">
            <img
              src="/logo.png"
              alt="Viron Labs"
              className="h-10 sm:h-12 lg:h-14 w-auto object-contain select-none"
              draggable={false}
            />
          </a>
          <a
            href="/"
            className="flex items-center gap-2 text-sm text-[#A9B3C7] hover:text-[#F4F6FA] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Shop
          </a>
        </div>
      </nav>

      {/* Main Content */}
      <main className="relative z-10 px-6 lg:px-12 py-6 lg:py-8 flex-1 flex items-center">
        <div className="max-w-md mx-auto w-full">
          {/* Header */}
          <div className="text-center mb-5">
            <span className="eyebrow mb-2 block">MEMBERS AREA</span>
            <h1 className="text-3xl sm:text-4xl font-bold text-[#F4F6FA] mb-2">
              {isSignUp ? 'Create Account' : 'Welcome Back'}
            </h1>
            <p className="text-[#A9B3C7]">
              {isSignUp
                ? 'Join Viron Labs to track your orders and manage your account'
                : 'Sign in to access your account and order history'}
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
                  <label className="block text-sm text-[#A9B3C7] mb-2">Full Name</label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#A9B3C7]" />
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                      className="w-full pl-12 pr-4 py-3 rounded-xl bg-[rgba(7,10,18,0.5)] border border-[rgba(244,246,250,0.1)] text-[#F4F6FA] placeholder-[#A9B3C7] focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400/25 transition-colors"
                      placeholder="Your name"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm text-[#A9B3C7] mb-2">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#A9B3C7]" />
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                    className="w-full pl-12 pr-4 py-3 rounded-xl bg-[rgba(7,10,18,0.5)] border border-[rgba(244,246,250,0.1)] text-[#F4F6FA] placeholder-[#A9B3C7] focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400/25 transition-colors"
                    placeholder="you@example.com"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm text-[#A9B3C7]">Password</label>
                  {!isSignUp && (
                    <a href="/forgot-password" className="text-xs text-amber-400 hover:text-amber-300 hover:underline">
                      Forgot password?
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
                    {isSignUp ? 'Creating Account...' : 'Signing In...'}
                  </>
                ) : (
                  <>
                    {isSignUp ? 'Create Account' : 'Sign In'}
                  </>
                )}
              </button>
            </form>

            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-[rgba(244,246,250,0.1)]" />
              </div>
              <div className="relative flex justify-center">
                <span className="px-4 bg-[#111827] text-xs text-[#A9B3C7]">or</span>
              </div>
            </div>

            <p className="text-center text-sm text-[#A9B3C7]">
              {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
              <button
                type="button"
                onClick={() => setIsSignUp(!isSignUp)}
                className="text-amber-400 hover:text-amber-300 hover:underline font-medium"
              >
                {isSignUp ? 'Sign In' : 'Create Account'}
              </button>
            </p>
          </div>

          <div className="mt-5 grid grid-cols-2 gap-3">
            <div className="p-3 rounded-xl bg-[rgba(17,24,39,0.4)] border border-[rgba(244,246,250,0.05)] text-center">
              <History className="w-6 h-6 text-sky-400 mx-auto mb-2" />
              <p className="text-sm text-[#F4F6FA] font-medium">Track Orders</p>
              <p className="text-xs text-[#A9B3C7]">View purchase history</p>
            </div>
            <div className="p-3 rounded-xl bg-[rgba(17,24,39,0.4)] border border-[rgba(244,246,250,0.05)] text-center">
              <Star className="w-6 h-6 text-[#F59E0B] mx-auto mb-2" />
              <p className="text-sm text-[#F4F6FA] font-medium">Leave Reviews</p>
              <p className="text-xs text-[#A9B3C7]">After purchase</p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 px-6 lg:px-12 py-4 border-t border-amber-500/15">
        <div className="max-w-md mx-auto text-center">
          <p className="text-xs text-[#A9B3C7]">
            © 2026 Viron Labs. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
