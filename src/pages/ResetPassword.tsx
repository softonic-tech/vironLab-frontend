import { useState, useEffect } from 'react';
import { Lock, Eye, EyeOff, CheckCircle, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { request, sessionStore } from '@/lib/api/client';
import type { AuthSession } from '@/lib/api/auth';

export default function ResetPassword() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  /** Recovery JWT from email link (`?token=`) */
  const [recoveryToken, setRecoveryToken] = useState<string | null>(null);
  const [linkReady, setLinkReady] = useState(false);
  const [isValidLink, setIsValidLink] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      try {
        const params = new URLSearchParams(window.location.search);
        const t = params.get('token');
        if (t) {
          if (!cancelled) {
            setRecoveryToken(t);
            setIsValidLink(true);
          }
          return;
        }

        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (!cancelled) {
          setIsValidLink(!!session);
        }
      } finally {
        if (!cancelled) setLinkReady(true);
      }
    };

    void run();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      if (recoveryToken) {
        const { data, error: reqErr } = await request<{
          user?: unknown;
          session?: AuthSession;
        }>({
          path: '/api/auth/user',
          method: 'PATCH',
          body: { password },
          auth: false,
          headers: { Authorization: `Bearer ${recoveryToken}` },
        });

        if (reqErr) {
          setError(reqErr.message);
        } else {
          if (data?.session) {
            sessionStore.write(data.session);
          }
          setIsSuccess(true);
        }
      } else {
        const { error: upErr } = await supabase.auth.updateUser({
          password: password,
        });

        if (upErr) {
          setError(upErr.message);
        } else {
          setIsSuccess(true);
        }
      }
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!linkReady) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#070A12' }}>
        <Loader2 className="w-10 h-10 text-amber-400 animate-spin" aria-label="Loading" />
      </div>
    );
  }

  if (!isValidLink) {
    return (
      <div className="min-h-screen" style={{ background: '#070A12' }}>
        <div className="absolute inset-0 grid-overlay opacity-60" />
        <main className="relative z-10 px-6 lg:px-12 py-12 lg:py-20">
          <div className="max-w-md mx-auto text-center">
            <div className="p-6 sm:p-8 rounded-2xl bg-[rgba(239,68,68,0.1)] border border-[rgba(239,68,68,0.2)]">
              <h1 className="text-2xl font-bold text-[#F4F6FA] mb-4">Invalid or Expired Link</h1>
              <p className="text-[#A9B3C7] mb-6">
                This password reset link is invalid or has expired. Please request a new one.
              </p>
              <a
                href="/forgot-password"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold bg-gradient-to-r from-amber-500 to-amber-600 text-zinc-950 hover:from-amber-400 hover:to-amber-500 shadow-[0_6px_24px_rgba(245,158,11,0.28)] transition-colors"
              >
                Request New Link
              </a>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: '#070A12' }}>
      {/* Grid Overlay */}
      <div className="absolute inset-0 grid-overlay opacity-60" />

      {/* Navigation */}
      <nav className="relative z-50 px-6 lg:px-12 py-6">
        <div className="flex items-center justify-between">
          <a href="/" className="flex flex-col items-start">
            <img
              src="/logo.png"
              alt="Viron Labs"
              className="h-10 sm:h-12 lg:h-14 w-auto object-contain select-none"
              draggable={false}
            />
          </a>
        </div>
      </nav>

      {/* Main Content */}
      <main className="relative z-10 px-6 lg:px-12 py-12 lg:py-20">
        <div className="max-w-md mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <span className="eyebrow mb-4 block">NEW PASSWORD</span>
            <h1 className="text-3xl sm:text-4xl font-bold text-[#F4F6FA] mb-2">
              {isSuccess ? 'Password Updated!' : 'Set New Password'}
            </h1>
            <p className="text-[#A9B3C7]">
              {isSuccess
                ? 'Your password has been successfully changed'
                : 'Create a new password for your account'}
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-4 p-4 rounded-xl bg-[rgba(239,68,68,0.1)] border border-[rgba(239,68,68,0.2)]">
              <p className="text-sm text-[#EF4444]">{error}</p>
            </div>
          )}

          {/* Form */}
          {!isSuccess ? (
            <div className="p-6 sm:p-8 rounded-2xl bg-[rgba(17,24,39,0.6)] border border-[rgba(244,246,250,0.08)]">
              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="block text-sm text-[#A9B3C7] mb-2">New Password</label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#A9B3C7]" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      minLength={8}
                      className="w-full pl-12 pr-12 py-3 rounded-xl bg-[rgba(7,10,18,0.5)] border border-[rgba(244,246,250,0.1)] text-[#F4F6FA] placeholder-[#A9B3C7] focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400/25 transition-colors"
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-[#A9B3C7] hover:text-[#F4F6FA]"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                  <p className="text-xs text-[#A9B3C7] mt-1">Minimum 8 characters</p>
                </div>

                <div>
                  <label className="block text-sm text-[#A9B3C7] mb-2">Confirm Password</label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#A9B3C7]" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      className="w-full pl-12 pr-4 py-3 rounded-xl bg-[rgba(7,10,18,0.5)] border border-[rgba(244,246,250,0.1)] text-[#F4F6FA] placeholder-[#A9B3C7] focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400/25 transition-colors"
                      placeholder="••••••••"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-semibold bg-gradient-to-r from-amber-500 to-amber-600 text-zinc-950 hover:from-amber-400 hover:to-amber-500 shadow-[0_6px_24px_rgba(245,158,11,0.28)] transition-colors disabled:opacity-50"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Updating...
                    </>
                  ) : (
                    'Update Password'
                  )}
                </button>
              </form>
            </div>
          ) : (
            <div className="p-6 sm:p-8 rounded-2xl bg-[rgba(34,197,94,0.1)] border border-[rgba(34,197,94,0.2)] text-center">
              <CheckCircle className="w-16 h-16 mx-auto text-[#22C55E] mb-4" />
              <p className="text-[#F4F6FA] mb-6">
                Your password has been successfully updated. You can now log in with your new password.
              </p>
              <a
                href="/login"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold bg-gradient-to-r from-amber-500 to-amber-600 text-zinc-950 hover:from-amber-400 hover:to-amber-500 shadow-[0_6px_24px_rgba(245,158,11,0.28)] transition-colors"
              >
                Go to Login
              </a>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
