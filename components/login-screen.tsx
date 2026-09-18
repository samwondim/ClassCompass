// src/components/login-screen.tsx
'use client';
import { useState, useEffect } from 'react';
import { LayoutGrid, Briefcase, GraduationCap } from 'lucide-react';
import useToast from '@/hooks/use-toast';

const DEV_LOGIN_ENABLED = process.env.NEXT_PUBLIC_DEV_LOGIN === 'true';
const DEV_USERS: { username: string; label: string; icon: typeof LayoutGrid; iconBg: string; iconColor: string }[] = [
  { username: 'admin', label: 'Login as Admin', icon: LayoutGrid, iconBg: 'rgba(85,76,158,0.35)', iconColor: '#C9BEEF' },
  { username: 'manager', label: 'Login as Manager', icon: Briefcase, iconBg: 'rgba(43,110,106,0.35)', iconColor: '#B9E4DF' },
  { username: 'teacher', label: 'Login as Teacher', icon: GraduationCap, iconBg: 'rgba(201,147,47,0.35)', iconColor: '#F3DDA6' },
];

export function LoginScreen() {
  const [dotCount, setDotCount] = useState(1);
  const [devMode, setDevMode] = useState(false);
  const [devLoading, setDevLoading] = useState<string | null>(null);
  const [appName, setAppName] = useState('Sunday School Reminder');
  const { toast } = useToast();

  useEffect(() => {
    let cancelled = false;
    fetch('/api/settings')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!cancelled && data?.settings?.app_name) setAppName(data.settings.app_name);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  async function authenticateUser() {
    try {
      const webApp = (await import("@twa-dev/sdk")).default;
      webApp.ready();
      const initData = webApp.initData;

      if (!initData) {
        if (DEV_LOGIN_ENABLED) {
          setDevMode(true);
          return;
        }
        throw new Error('Telegram Web App not initialized. Please open via Telegram.');
      }

      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ initData }),
      });

      const data = await res.json();
      console.log('Auth response:', data);

      if (!res.ok) {
        throw new Error(data.message || 'Authentication failed');
      }

      window.location.href = '/';
    } catch (error) {
      console.error('Error authenticating user:', error);
      toast({
        title: 'Login Failed',
        description: error instanceof Error ? error.message : 'An unexpected error occurred. Please try again.',
        variant: 'destructive',
      });
    }
  }

  async function devLogin(tg_username: string) {
    setDevLoading(tg_username);
    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ devLogin: true, tg_username }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Dev login failed');
      }

      window.location.href = '/';
    } catch (error) {
      console.error('Dev login error:', error);
      toast({
        title: 'Login Failed',
        description: error instanceof Error ? error.message : 'Dev login failed',
        variant: 'destructive',
      });
      setDevLoading(null);
    }
  }

  // Animate the dots: 1 → 2 → 3 → 1 …
  useEffect(() => {
    const interval = setInterval(() => {
      setDotCount(prev => (prev % 3) + 1);
    }, 500);
    return () => clearInterval(interval);
  }, []);

  // Auto-authenticate on mount
  useEffect(() => {
    authenticateUser();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      className="relative flex min-h-screen flex-col items-center overflow-hidden px-7 pb-8 pt-24 text-center"
      style={{
        background: 'linear-gradient(165deg, #1F1B3A 0%, #322B5E 45%, #241C15 100%)',
        fontFamily: "'Noto Sans Ethiopic', sans-serif",
        color: '#F4EFE4',
      }}
    >
      <div
        className="pointer-events-none absolute -top-24 left-1/2 h-[360px] w-[360px] -translate-x-1/2 rounded-full"
        style={{ background: 'radial-gradient(circle, rgba(232,200,136,0.30) 0%, rgba(232,200,136,0) 70%)' }}
      />

      <div className="relative flex flex-col items-center gap-6">
        {/* Glowing badge */}
        <div
          className="flex h-[78px] w-[78px] items-center justify-center rounded-full"
          style={{
            background: 'radial-gradient(circle at 34% 30%, #F6E3AE, #C9932F 58%, #7A4816 100%)',
            boxShadow: '0 0 44px rgba(232,200,136,0.5)',
          }}
        >
          <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="#2A1D0D" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 3v6M12 15v6M3 12h6M15 12h6M6 6l4 4M14 14l4 4M18 6l-4 4M10 14l-4 4" />
          </svg>
        </div>

        <div>
          <h1
            className="font-display text-3xl leading-tight sm:text-4xl"
            style={{ color: '#F3E4C8', textShadow: '0 0 30px rgba(201,147,47,0.55)' }}
          >
            {appName}
          </h1>
          <p className="mt-3 text-[11.5px] uppercase" style={{ color: '#A79BD1', letterSpacing: '0.26em' }}>
            እንኳን ደህና መጡ
          </p>
        </div>

        {/* Loading dots */}
        <div className="mt-2 flex items-center gap-2.5">
          <span className="h-1.5 w-1.5 rounded-full" style={{ background: '#E8C888', opacity: dotCount === 1 ? 1 : 0.28 }} />
          <span className="h-1.5 w-1.5 rounded-full" style={{ background: '#E8C888', opacity: dotCount === 2 ? 1 : 0.28 }} />
          <span className="h-1.5 w-1.5 rounded-full" style={{ background: '#E8C888', opacity: dotCount === 3 ? 1 : 0.28 }} />
          <span className="ml-2 text-sm" style={{ color: '#CFC6EA' }}>በመጫን ላይ</span>
        </div>
      </div>

      {/* Dev login panel (local development only) */}
      {devMode && DEV_LOGIN_ENABLED && (
        <div
          className="relative mt-auto w-full max-w-xs rounded-[20px] p-[18px]"
          style={{ border: '1px solid rgba(244,239,228,0.16)', background: 'rgba(244,239,228,0.06)' }}
        >
          <p className="mb-3.5 text-center text-[10.5px] uppercase" style={{ color: '#B9AEE0', letterSpacing: '0.24em' }}>
            Dev Login
          </p>
          <div className="flex flex-col gap-2">
            {DEV_USERS.map(({ username, label, icon: Icon, iconBg, iconColor }) => (
              <button
                key={username}
                type="button"
                disabled={devLoading !== null}
                onClick={() => devLogin(username)}
                className="flex w-full items-center gap-3 rounded-[14px] px-3.5 py-3 text-left text-sm font-semibold transition disabled:opacity-50"
                style={{ border: '1px solid rgba(244,239,228,0.14)', background: 'rgba(244,239,228,0.07)', color: '#F4EFE4' }}
              >
                <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-[10px]" style={{ background: iconBg }}>
                  <Icon className="h-4 w-4" style={{ color: iconColor }} />
                </span>
                {devLoading === username ? 'Signing in…' : label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
