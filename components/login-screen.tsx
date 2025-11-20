// src/components/login-screen.tsx
'use client';

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
      toast({
        title: 'Login Failed',
        description: error instanceof Error ? error.message : 'An unexpected error occurred. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-gray-50 to-gray-100 p-6">
      <Card className="w-full max-w-md shadow-lg border-0 bg-white">
        <CardHeader className="text-center space-y-2">
          <Shield className="mx-auto h-12 w-12 text-indigo-600" />
          <CardTitle className="text-2xl font-semibold text-gray-800">ClassCompass</CardTitle>
          <CardDescription className="text-gray-600">
            Secure access for Sunday School management. Log in with your Telegram account.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Featured Bible Verse */}
          <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-indigo-500">
            <blockquote className="text-xl italic text-gray-700 mb-2">
              "Your word is a lamp for my feet, a light on my path."
            </blockquote>
            <cite className="text-sm text-gray-500 not-italic">— Psalm 119:105</cite>
          </div>

          <Button
            onClick={authenticateUser}
            disabled={isLoading}
            className="w-full"
            size="lg"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Authenticating...
              </>
            ) : (
              <>
                Login
                <ChevronRight className="ml-auto h-4 w-4" />
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
