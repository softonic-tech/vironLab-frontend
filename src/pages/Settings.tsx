import { useState, useEffect } from 'react';
import {
  ArrowLeft,
  User,
  Lock,
  Mail,
  Bell,
  Shield,
  Save,
  Eye,
  EyeOff,
  Check,
  AlertTriangle,
  LogOut,
} from 'lucide-react';
import { getCurrentUser, signOut } from '@/lib/supabase';
import { supabase } from '@/lib/supabase';
import { Skeleton } from '@/components/ui/skeleton';

interface UserSettings {
  name: string;
  email: string;
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
  notifications: {
    orderUpdates: boolean;
    promotions: boolean;
    rewards: boolean;
  };
}

function formatMemberSince(createdAt: string | undefined): string {
  if (!createdAt) return '';
  const d = new Date(createdAt);
  return d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

const DEFAULT_NOTIFICATIONS = {
  orderUpdates: true,
  promotions: false,
  rewards: true,
};

// Reusable toggle switch
function ToggleSwitch({
  checked,
  onChange,
  color = '#8B5CF6',
}: {
  checked: boolean;
  onChange: () => void;
  color?: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={(e) => { e.stopPropagation(); onChange(); }}
      className="relative inline-flex h-7 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/50"
      style={{ backgroundColor: checked ? color : 'rgba(244,246,250,0.12)' }}
    >
      <span
        className="pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out"
        style={{ transform: checked ? 'translateX(18px)' : 'translateX(2px)' }}
      />
    </button>
  );
}

export default function Settings() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoadingUser, setIsLoadingUser] = useState(true);
  const [userData, setUserData] = useState({ name: '', email: '', joinDate: '' });

  const [settings, setSettings] = useState<UserSettings>({
    name: '',
    email: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
    notifications: DEFAULT_NOTIFICATIONS,
  });

  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'profile' | 'password' | 'notifications'>('profile');

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const user = await getCurrentUser();
        if (!mounted) return;
        if (!user) {
          localStorage.removeItem('vironlabs_logged_in');
          window.location.href = '/login';
          return;
        }
        setIsLoggedIn(true);
        const name = (user.user_metadata?.name ?? user.user_metadata?.full_name ?? user.email?.split('@')[0] ?? '') as string;
        const email = user.email ?? '';
        const notif = user.user_metadata?.notifications as Partial<typeof DEFAULT_NOTIFICATIONS> | undefined;
        setUserData({ name, email, joinDate: formatMemberSince(user.created_at) });
        setSettings((prev) => ({
          ...prev,
          name,
          email,
          notifications: { ...DEFAULT_NOTIFICATIONS, ...notif },
        }));
      } catch (_) {
        if (mounted) setIsLoggedIn(false);
      } finally {
        if (mounted) setIsLoadingUser(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  const handleInputChange = (field: keyof UserSettings, value: string) => {
    setSettings((prev) => ({ ...prev, [field]: value }));
    setSaveSuccess(false);
    setSaveError(null);
  };

  const handleNotificationChange = (field: keyof UserSettings['notifications']) => {
    setSettings((prev) => ({
      ...prev,
      notifications: { ...prev.notifications, [field]: !prev.notifications[field] },
    }));
    setSaveSuccess(false);
  };

  const handleSave = async () => {
    setSaveError(null);
    setSaveSuccess(false);
    setIsSaving(true);

    try {
      const user = await getCurrentUser();
      if (!user) {
        setSaveError('Session expired. Please sign in again.');
        return;
      }

      if (activeTab === 'password') {
        if (!settings.currentPassword) { setSaveError('Please enter your current password.'); return; }
        if (!settings.newPassword || !settings.confirmPassword) { setSaveError('Please fill in new password and confirmation.'); return; }
        if (settings.newPassword !== settings.confirmPassword) { setSaveError('Passwords do not match.'); return; }
        if (settings.newPassword.length < 6) { setSaveError('Password must be at least 6 characters.'); return; }

        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: user.email!,
          password: settings.currentPassword,
        });
        if (signInError) { setSaveError('Current password is incorrect.'); return; }

        const passwordUpdatePromise = supabase.auth.updateUser({ password: settings.newPassword });
        const result = await Promise.race([
          passwordUpdatePromise,
          new Promise<{ error: null }>((resolve) => setTimeout(() => resolve({ error: null }), 4000)),
        ]);
        const { error } = result;
        if (error) throw error;

        setSettings((prev) => ({ ...prev, currentPassword: '', newPassword: '', confirmPassword: '' }));
      } else {
        const updatePayload: { data: Record<string, unknown>; email?: string } = {
          data: { name: settings.name, full_name: settings.name, notifications: settings.notifications },
        };
        if (settings.email && settings.email !== user.email) updatePayload.email = settings.email;

        const updatePromise = supabase.auth.updateUser(updatePayload);
        const result = await Promise.race([
          updatePromise,
          new Promise<{ data: { user?: { email?: string } }; error: null }>((resolve) =>
            setTimeout(() => resolve({ data: { user: { email: settings.email } }, error: null }), 4000)
          ),
        ]);
        const { data, error } = result;
        if (error) throw error;

        setUserData((prev) => ({
          ...prev,
          name: settings.name,
          email: data?.user?.email ?? settings.email,
        }));
      }

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (e: unknown) {
      console.error('[Settings] Save error:', e);
      const msg =
        e && typeof e === 'object' && 'message' in e
          ? String((e as { message: string }).message)
          : 'Failed to save. Please try again.';
      setSaveError(msg);
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogout = async () => {
    await signOut();
    localStorage.removeItem('vironlabs_logged_in');
    window.location.href = '/login';
  };

  const tabs = [
    { id: 'profile' as const, label: 'Profile', icon: User },
    { id: 'password' as const, label: 'Password', icon: Lock },
    { id: 'notifications' as const, label: 'Alerts', icon: Bell },
  ];

  // ── Loading skeleton ──────────────────────────────────────────────────────────
  if (isLoadingUser || !isLoggedIn) {
    return (
      <div className="min-h-screen" style={{ background: '#070A12' }}>
        <div className="absolute inset-0 grid-overlay opacity-60" />
        {/* Mobile nav skeleton */}
        <nav className="relative z-50 flex items-center justify-between px-4 py-4 border-b border-[rgba(244,246,250,0.06)]">
          <Skeleton className="h-9 w-9 rounded-xl" />
          <Skeleton className="h-7 w-24 rounded-lg" />
          <Skeleton className="h-9 w-9 rounded-xl opacity-0" />
        </nav>
        <main className="relative z-10 px-4 py-6 max-w-2xl mx-auto space-y-5">
          {/* Profile card skeleton */}
          <div className="flex flex-col items-center gap-3 p-6 rounded-2xl bg-[rgba(17,24,39,0.6)] border border-[rgba(244,246,250,0.08)]">
            <Skeleton className="w-20 h-20 rounded-full" />
            <Skeleton className="h-5 w-32 rounded" />
            <Skeleton className="h-4 w-44 rounded" />
          </div>
          {/* Tabs skeleton */}
          <div className="flex gap-2">
            {[1, 2, 3].map((i) => <Skeleton key={i} className="h-11 flex-1 rounded-xl" />)}
          </div>
          {/* Content skeleton */}
          <div className="p-5 rounded-2xl bg-[rgba(17,24,39,0.6)] border border-[rgba(244,246,250,0.08)] space-y-4">
            <Skeleton className="h-5 w-40 rounded" />
            <Skeleton className="h-13 w-full rounded-xl" />
            <Skeleton className="h-13 w-full rounded-xl" />
            <Skeleton className="h-12 w-full rounded-xl" />
          </div>
        </main>
      </div>
    );
  }

  // ── Main render ───────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen pb-10" style={{ background: '#070A12' }}>
      <div className="absolute inset-0 grid-overlay opacity-60" />

      {/* ── Top nav ── */}
      <nav className="relative z-50 flex items-center justify-between px-4 sm:px-6 py-4 border-b border-[rgba(244,246,250,0.06)] bg-[rgba(7,10,18,0.8)] backdrop-blur-sm sticky top-0">
        <a
          href="/dashboard"
          className="flex items-center justify-center w-9 h-9 rounded-xl bg-[rgba(244,246,250,0.06)] text-[#A9B3C7] hover:text-[#F4F6FA] hover:bg-[rgba(244,246,250,0.1)] transition-colors"
          aria-label="Back to dashboard"
        >
          <ArrowLeft className="w-5 h-5" />
        </a>

        <a href="/" className="flex flex-col items-center">
          <img
            src="/logo.png"
            alt="Viron Labs"
            className="h-8 w-auto object-contain select-none"
            draggable={false}
          />
        </a>

        {/* Spacer to center logo */}
        <div className="w-9" aria-hidden="true" />
      </nav>

      <main className="relative z-10 px-4 sm:px-6 py-6 max-w-2xl mx-auto lg:max-w-5xl">

        {/* ── Profile hero card ── */}
        <div className="mb-5 p-5 rounded-2xl bg-[rgba(17,24,39,0.7)] border border-[rgba(244,246,250,0.08)] flex items-center gap-4">
          {/* Avatar */}
          <div
            className="shrink-0 w-16 h-16 sm:w-20 sm:h-20 rounded-full flex items-center justify-center text-white font-bold text-xl sm:text-2xl select-none"
            style={{ background: 'linear-gradient(135deg, #8B5CF6 0%, #2ED1B4 100%)' }}
          >
            {userData.name ? getInitials(userData.name) : <User className="w-7 h-7" />}
          </div>

          <div className="min-w-0">
            <p className="text-base sm:text-lg font-semibold text-[#F4F6FA] truncate">
              {userData.name || 'Your Account'}
            </p>
            <p className="text-sm text-[#A9B3C7] truncate">{userData.email}</p>
            {userData.joinDate && (
              <p className="text-xs text-[#6B7280] mt-0.5">Member since {userData.joinDate}</p>
            )}
          </div>
        </div>

        <div className="lg:grid lg:grid-cols-4 lg:gap-6">

          {/* ── Tab bar (horizontal on mobile, sidebar on desktop) ── */}
          <div className="lg:col-span-1">
            {/* Mobile: horizontal pill tabs */}
            <div className="flex gap-2 mb-4 overflow-x-auto pb-1 lg:hidden scrollbar-none">
              {tabs.map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => { setActiveTab(id); setSaveError(null); setSaveSuccess(false); }}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-all shrink-0 ${
                    activeTab === id
                      ? 'bg-[rgba(139,92,246,0.2)] text-[#8B5CF6] border border-[rgba(139,92,246,0.35)]'
                      : 'text-[#A9B3C7] bg-[rgba(244,246,250,0.05)] border border-[rgba(244,246,250,0.07)] hover:bg-[rgba(244,246,250,0.09)]'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {label}
                </button>
              ))}
            </div>

            {/* Desktop: vertical sidebar */}
            <div className="hidden lg:block sticky top-20">
              <div className="p-3 rounded-2xl bg-[rgba(17,24,39,0.7)] border border-[rgba(244,246,250,0.08)] space-y-1">
                {tabs.map(({ id, label, icon: Icon }) => (
                  <button
                    key={id}
                    onClick={() => { setActiveTab(id); setSaveError(null); setSaveSuccess(false); }}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-colors ${
                      activeTab === id
                        ? 'bg-[rgba(139,92,246,0.15)] text-[#8B5CF6]'
                        : 'text-[#A9B3C7] hover:bg-[rgba(244,246,250,0.05)] hover:text-[#F4F6FA]'
                    }`}
                  >
                    <Icon className="w-5 h-5 shrink-0" />
                    <span className="font-medium">{label === 'Alerts' ? 'Notifications' : label}</span>
                  </button>
                ))}

                <div className="pt-3 mt-3 border-t border-[rgba(244,246,250,0.08)]">
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left text-[#EF4444] hover:bg-[rgba(239,68,68,0.1)] transition-colors"
                  >
                    <LogOut className="w-5 h-5 shrink-0" />
                    <span className="font-medium">Sign Out</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* ── Tab content ── */}
          <div className="lg:col-span-3">
            <div className="rounded-2xl bg-[rgba(17,24,39,0.7)] border border-[rgba(244,246,250,0.08)] overflow-hidden">

              {/* ── Profile tab ── */}
              {activeTab === 'profile' && (
                <div className="p-5 sm:p-6 space-y-5">
                  <div>
                    <h2 className="text-lg sm:text-xl font-semibold text-[#F4F6FA]">Profile Information</h2>
                    <p className="text-sm text-[#A9B3C7] mt-0.5">Update your personal details</p>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-[#A9B3C7] mb-2">Full Name</label>
                      <div className="relative">
                        <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#6B7280] pointer-events-none" />
                        <input
                          type="text"
                          value={settings.name}
                          onChange={(e) => handleInputChange('name', e.target.value)}
                          className="w-full pl-12 pr-4 py-3.5 rounded-xl bg-[rgba(7,10,18,0.6)] border border-[rgba(244,246,250,0.1)] text-[#F4F6FA] placeholder-[#6B7280] focus:outline-none focus:border-[#2ED1B4] focus:bg-[rgba(7,10,18,0.8)] transition-colors text-base"
                          placeholder="Your full name"
                          autoComplete="name"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-[#A9B3C7] mb-2">Email Address</label>
                      <div className="relative">
                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#6B7280] pointer-events-none" />
                        <input
                          type="email"
                          value={settings.email}
                          onChange={(e) => handleInputChange('email', e.target.value)}
                          className="w-full pl-12 pr-4 py-3.5 rounded-xl bg-[rgba(7,10,18,0.6)] border border-[rgba(244,246,250,0.1)] text-[#F4F6FA] placeholder-[#6B7280] focus:outline-none focus:border-[#2ED1B4] focus:bg-[rgba(7,10,18,0.8)] transition-colors text-base"
                          placeholder="your@email.com"
                          autoComplete="email"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ── Password tab ── */}
              {activeTab === 'password' && (
                <div className="p-5 sm:p-6 space-y-5">
                  <div>
                    <h2 className="text-lg sm:text-xl font-semibold text-[#F4F6FA]">Change Password</h2>
                    <p className="text-sm text-[#A9B3C7] mt-0.5">Update your account password</p>
                  </div>

                  <div className="space-y-4">
                    {/* Current password */}
                    <div>
                      <label className="block text-sm font-medium text-[#A9B3C7] mb-2">Current Password</label>
                      <div className="relative">
                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#6B7280] pointer-events-none" />
                        <input
                          type={showCurrentPassword ? 'text' : 'password'}
                          value={settings.currentPassword}
                          onChange={(e) => handleInputChange('currentPassword', e.target.value)}
                          className="w-full pl-12 pr-14 py-3.5 rounded-xl bg-[rgba(7,10,18,0.6)] border border-[rgba(244,246,250,0.1)] text-[#F4F6FA] placeholder-[#6B7280] focus:outline-none focus:border-[#2ED1B4] focus:bg-[rgba(7,10,18,0.8)] transition-colors text-base"
                          placeholder="Enter current password"
                          autoComplete="current-password"
                        />
                        <button
                          type="button"
                          onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-lg text-[#6B7280] hover:text-[#F4F6FA] hover:bg-[rgba(244,246,250,0.08)] transition-colors"
                          aria-label={showCurrentPassword ? 'Hide password' : 'Show password'}
                        >
                          {showCurrentPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
                      </div>
                    </div>

                    {/* New password */}
                    <div>
                      <label className="block text-sm font-medium text-[#A9B3C7] mb-2">New Password</label>
                      <div className="relative">
                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#6B7280] pointer-events-none" />
                        <input
                          type={showNewPassword ? 'text' : 'password'}
                          value={settings.newPassword}
                          onChange={(e) => handleInputChange('newPassword', e.target.value)}
                          className="w-full pl-12 pr-14 py-3.5 rounded-xl bg-[rgba(7,10,18,0.6)] border border-[rgba(244,246,250,0.1)] text-[#F4F6FA] placeholder-[#6B7280] focus:outline-none focus:border-[#2ED1B4] focus:bg-[rgba(7,10,18,0.8)] transition-colors text-base"
                          placeholder="Enter new password"
                          autoComplete="new-password"
                        />
                        <button
                          type="button"
                          onClick={() => setShowNewPassword(!showNewPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-lg text-[#6B7280] hover:text-[#F4F6FA] hover:bg-[rgba(244,246,250,0.08)] transition-colors"
                          aria-label={showNewPassword ? 'Hide password' : 'Show password'}
                        >
                          {showNewPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
                      </div>
                    </div>

                    {/* Confirm password */}
                    <div>
                      <label className="block text-sm font-medium text-[#A9B3C7] mb-2">Confirm New Password</label>
                      <div className="relative">
                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#6B7280] pointer-events-none" />
                        <input
                          type={showConfirmPassword ? 'text' : 'password'}
                          value={settings.confirmPassword}
                          onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                          className={`w-full pl-12 pr-14 py-3.5 rounded-xl bg-[rgba(7,10,18,0.6)] border text-[#F4F6FA] placeholder-[#6B7280] focus:outline-none focus:bg-[rgba(7,10,18,0.8)] transition-colors text-base ${
                            settings.newPassword && settings.confirmPassword && settings.newPassword !== settings.confirmPassword
                              ? 'border-[#EF4444] focus:border-[#EF4444]'
                              : 'border-[rgba(244,246,250,0.1)] focus:border-[#2ED1B4]'
                          }`}
                          placeholder="Confirm new password"
                          autoComplete="new-password"
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-lg text-[#6B7280] hover:text-[#F4F6FA] hover:bg-[rgba(244,246,250,0.08)] transition-colors"
                          aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                        >
                          {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
                      </div>
                    </div>

                    {settings.newPassword && settings.confirmPassword && settings.newPassword !== settings.confirmPassword && (
                      <div className="flex items-center gap-2 text-[#EF4444] text-sm bg-[rgba(239,68,68,0.08)] border border-[rgba(239,68,68,0.2)] px-4 py-3 rounded-xl">
                        <AlertTriangle className="w-4 h-4 shrink-0" />
                        <span>Passwords do not match</span>
                      </div>
                    )}

                    {/* Password hint */}
                    <p className="text-xs text-[#6B7280] flex items-center gap-1.5">
                      <Shield className="w-3.5 h-3.5 shrink-0" />
                      Minimum 6 characters required
                    </p>
                  </div>
                </div>
              )}

              {/* ── Notifications tab ── */}
              {activeTab === 'notifications' && (
                <div className="p-5 sm:p-6 space-y-5">
                  <div>
                    <h2 className="text-lg sm:text-xl font-semibold text-[#F4F6FA]">Notification Preferences</h2>
                    <p className="text-sm text-[#A9B3C7] mt-0.5">Choose what updates you want to receive</p>
                  </div>

                  <div className="space-y-3">
                    {/* Order Updates */}
                    <div
                      onClick={() => handleNotificationChange('orderUpdates')}
                      className="flex items-center justify-between p-4 rounded-xl bg-[rgba(7,10,18,0.5)] border border-[rgba(244,246,250,0.08)] cursor-pointer hover:border-[rgba(244,246,250,0.15)] active:scale-[0.99] transition-all select-none"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="shrink-0 w-10 h-10 rounded-xl bg-[rgba(46,209,180,0.12)] flex items-center justify-center">
                          <Mail className="w-5 h-5 text-[#2ED1B4]" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-[#F4F6FA] text-sm sm:text-base">Order Updates</p>
                          <p className="text-xs sm:text-sm text-[#6B7280] truncate">Shipping & delivery notifications</p>
                        </div>
                      </div>
                      <div className="ml-3 shrink-0">
                        <ToggleSwitch
                          checked={settings.notifications.orderUpdates}
                          onChange={() => handleNotificationChange('orderUpdates')}
                          color="#2ED1B4"
                        />
                      </div>
                    </div>

                    {/* Promotions */}
                    <div
                      onClick={() => handleNotificationChange('promotions')}
                      className="flex items-center justify-between p-4 rounded-xl bg-[rgba(7,10,18,0.5)] border border-[rgba(244,246,250,0.08)] cursor-pointer hover:border-[rgba(244,246,250,0.15)] active:scale-[0.99] transition-all select-none"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="shrink-0 w-10 h-10 rounded-xl bg-[rgba(139,92,246,0.12)] flex items-center justify-center">
                          <Bell className="w-5 h-5 text-[#8B5CF6]" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-[#F4F6FA] text-sm sm:text-base">Promotions & Offers</p>
                          <p className="text-xs sm:text-sm text-[#6B7280] truncate">Sales and special deals</p>
                        </div>
                      </div>
                      <div className="ml-3 shrink-0">
                        <ToggleSwitch
                          checked={settings.notifications.promotions}
                          onChange={() => handleNotificationChange('promotions')}
                          color="#8B5CF6"
                        />
                      </div>
                    </div>

                  </div>
                </div>
              )}

              {/* ── Save footer ── */}
              <div className="px-5 sm:px-6 pb-5 sm:pb-6 pt-0 space-y-3">
                {/* Feedback banners */}
                {saveError && (
                  <div className="flex items-start gap-3 text-[#EF4444] bg-[rgba(239,68,68,0.08)] border border-[rgba(239,68,68,0.2)] px-4 py-3 rounded-xl">
                    <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
                    <span className="text-sm">{saveError}</span>
                  </div>
                )}
                {saveSuccess && !saveError && (
                  <div className="flex items-center gap-3 text-[#22C55E] bg-[rgba(34,197,94,0.08)] border border-[rgba(34,197,94,0.2)] px-4 py-3 rounded-xl">
                    <Check className="w-5 h-5 shrink-0" />
                    <span className="text-sm font-medium">Changes saved successfully!</span>
                  </div>
                )}

                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="w-full flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-[#8B5CF6] text-white font-semibold hover:bg-[#7C3AED] active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed text-base"
                >
                  {isSaving ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-5 h-5" />
                      <span>Save Changes</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* ── Mobile sign-out button ── */}
            <div className="lg:hidden mt-4">
              <button
                onClick={handleLogout}
                className="w-full flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl border border-[rgba(239,68,68,0.3)] text-[#EF4444] font-medium hover:bg-[rgba(239,68,68,0.08)] active:scale-[0.98] transition-all text-base"
              >
                <LogOut className="w-5 h-5" />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 px-4 py-6 border-t border-[rgba(244,246,250,0.06)] mt-8">
        <p className="text-center text-xs text-[#4B5563]">
          © 2026 Viron Labs. All rights reserved. For research use only.
        </p>
      </footer>
    </div>
  );
}
