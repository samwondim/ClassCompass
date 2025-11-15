// src/components/login-screen.tsx
'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { init, retrieveLaunchParams, requestContact } from '@telegram-apps/sdk-react'; // Updated imports
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Shield, ChevronRight } from 'lucide-react';
import useToast from '@/hooks/use-toast';

export function LoginScreen() { // Ensure named export
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const router = useRouter()

  useEffect(
    () => {
      checkAuth()
    }, []
  )

  async function checkAuth() {
    const response = await fetch('/api/session');
    if (response.ok) {
      setIsAuthenticated(true);
    } else {
      authenticateUser();
    }
  }

  function handleRoleRedirect(role: string) {
    switch (role) {
      case 'ADMIN':
        router.push('/admin');
        break;
      case 'MANAGER':
        router.push('/manager');
        break;
      case 'TEACHER':
        router.push('/teacher');
        break;
      default:
        router.push('/');
    }
  }

  async function authenticateUser() {
    const webApp = (await import("@twa-dev/sdk")).default
    webApp.ready()

    const initData = webApp.initData;

    if (initData) {
      try {
        const res = await fetch('/api/auth', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',

          },
          body: JSON.stringify({ initData })
        })

        const data = await res.json();
        if (!res.ok) throw new Error(data.message || 'Authentication failed');

        handleRoleRedirect(data.user_role);
        // if (res.ok) {
        //   setIsAuthenticated(true)
        //   router.refresh()
        // } else {
        //   console.error("Authentication Failed")
        //   setIsAuthenticated(false)
        // }

      } catch (error) {
        console.error('Error authenticating user:', error);
        setIsAuthenticated(false)
      }
    }
  }



  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-gray-50 to-gray-100 p-6">
      <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full text-center border border-gray-200">
        <h2 className="text-2xl font-semibold text-gray-800 mb-3">
          Access Restricted
        </h2>
        <p className="text-gray-600 mb-6">
          You need to be an <span className="font-medium text-indigo-600">owner</span> of this account to continue.
        </p>

        <button
          onClick={authenticateUser}
          className="px-6 py-2.5 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition-colors duration-200 focus:outline-none focus:ring-4 focus:ring-indigo-300"
        >
          Login
        </button>
      </div>
    </div>
  );
}
