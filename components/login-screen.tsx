// src/components/login-screen.tsx
'use client';
import { useTranslations } from 'next-intl';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Shield, ChevronRight, Loader2 } from 'lucide-react';
import useToast from '@/hooks/use-toast';

export function LoginScreen() {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const router = useRouter();
  const t = useTranslations();

  async function authenticateUser() {
    setIsLoading(true);
    try {
      const webApp = (await import("@twa-dev/sdk")).default;
      webApp.ready();
      const initData = webApp.initData;

      if (!initData) {
        throw new Error('Telegram Web App not initialized. Please open via Telegram.');
      }

      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ initData }),
      });

      const data = await res.json();
      console.log('Auth response:', data); // Keep for debugging

      if (!res.ok) {
        throw new Error(data.message || 'Authentication failed');
      }

      // Success: Force full page reload to trigger server-side middleware with new cookie
      // Client-side router.push('/') may not re-run middleware on same path
      toast({
        title: 'Welcome!',
        description: `Logged in as ${data.user.first_name}. Redirecting...`,
      });
      window.location.href = '/'; // Hard redirect: Ensures server request + middleware
    } catch (error) {
      console.error('Error authenticating user:', error);
      // Only show toast if it's NOT just the initial "not initialized" error, 
      // or if it's a real failure. Let's keep it for now.
      toast({
        title: 'Login Failed',
        description: error instanceof Error ? error.message : 'An unexpected error occurred. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    // Automatically attempt authentication on mount
    authenticateUser();
  }, []);

  return (<div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-emerald-50 to-sky-50 p-6">
    <Card className="w-full max-w-md shadow-2xl border-emerald-100 bg-white/80 backdrop-blur-sm">
      <CardHeader className="text-center space-y-2">
        <Shield className="mx-auto h-12 w-12 text-primary" />
        <CardTitle className="text-2xl font-semibold text-card-foreground">{t('Dashboard')}</CardTitle>
        <CardDescription className="text-muted-foreground">
          {t('Log in with your Telegram account')}
        </CardDescription>
      </CardHeader>
      {/* ... */}
      <Button onClick={authenticateUser} disabled={isLoading} className="w-full" size="lg">
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            {t('Authenticating')}
          </>
        ) : (
          <>
            {t('Login with Telegram')}
            <ChevronRight className="ml-auto h-4 w-4" />
          </>
        )}
      </Button>
      {/* ... */}
    </Card>
  </div>
  );
}
