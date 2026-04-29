// src/components/login-screen.tsx
'use client';
import { useState, useEffect } from 'react';
import useToast from '@/hooks/use-toast';

export function LoginScreen() {
  const [dotCount, setDotCount] = useState(1);
  const { toast } = useToast();

  async function authenticateUser() {
    try {
      const webApp = (await import("@twa-dev/sdk")).default;
      webApp.ready();
      const initData = webApp.initData;

      if (!initData) {
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

  const dots = '.'.repeat(dotCount);

  return (
    <div
      className="flex min-h-screen items-center justify-center"
      style={{
        background: 'linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%)',
      }}
    >
      <div className="flex flex-col items-center gap-8 select-none">
        {/* Pulsing orb */}
        <div className="relative flex items-center justify-center">
          <span
            className="absolute inline-flex h-24 w-24 rounded-full opacity-30 animate-ping"
            style={{ background: 'radial-gradient(circle, #818cf8, #6366f1)' }}
          />
          <span
            className="relative inline-flex h-16 w-16 rounded-full"
            style={{ background: 'radial-gradient(circle, #a5b4fc, #6366f1)' }}
          />
        </div>

        {/* Animated text */}
        <div className="text-center">
          <p
            className="text-3xl sm:text-4xl font-bold tracking-wide"
            style={{
              color: '#e0e7ff',
              fontFamily: "'Noto Sans Ethiopic', 'Segoe UI', sans-serif",
              textShadow: '0 0 24px rgba(129, 140, 248, 0.8)',
              letterSpacing: '0.04em',
            }}
          >
            loading bot{' '}
            <span
              style={{
                display: 'inline-block',
                minWidth: '2.5ch',
                color: '#a5b4fc',
                textShadow: '0 0 12px rgba(165, 180, 252, 0.9)',
              }}
            >
              {dots}
            </span>
          </p>
          <p
            className="mt-3 text-sm tracking-widest uppercase"
            style={{ color: '#6366f1', letterSpacing: '0.2em' }}
          >
            ጵርስቅላ
          </p>
        </div>
      </div>
    </div>
  );
}
