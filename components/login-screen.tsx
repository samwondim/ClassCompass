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
      // const webApp = (await import("@twa-dev/sdk")).default;
      // webApp.ready();
      // const initData = webApp.initData;
      //
      // if (!initData) {
      //   throw new Error('Telegram Web App not initialized. Please open via Telegram.');
      // }

      const { initData } = {
        "initData":
          "user=%7B%22id%22%3A1845537164%2C%22first_name%22%3A%22Sam%22%2C%22last_name%22%3A%22%22%2C%22username%22%3A%22triviosa%22%2C%22language_code%22%3A%22en%22%2C%22allows_write_to_pm%22%3Atrue%2C%22photo_url%22%3A%22https%3A%5C%2F%5C%2Ft.me%5C%2Fi%5C%2Fuserpic%5C%2F320%5C%2FaMUFOe5cu11VbYZNpOC5ziSHBZLfje2U2B-RjvbGd4M.svg%22%7D&chat_instance=-7201700833685701877&chat_type=private&auth_date=1764497960&signature=lL-1KJ1dZVUXcpJEz6n637gA4M1offvHTjE0U8mvBeW-2cdCbEC9d7vlAS3agt4eTNM7XYddvBNtb5spitk2CA&hash=e2fc4177ede877442d64eb168b0cc01bd3c5e46fb073c4df6ca566e9d8ced6e6"
      };
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
      toast({
        title: 'Login Failed',
        description: error instanceof Error ? error.message : 'An unexpected error occurred. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (<div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-gray-50 to-gray-100 p-6">
    <Card className="w-full max-w-md shadow-lg border-0 bg-white">
      <CardHeader className="text-center space-y-2">
        <Shield className="mx-auto h-12 w-12 text-indigo-600" />
        <CardTitle className="text-2xl font-semibold text-gray-800">{t('Dashboard')} {/* Translates dynamically */}</CardTitle>
        <CardDescription className="text-gray-600">
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
