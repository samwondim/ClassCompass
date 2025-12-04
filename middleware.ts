import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

import createMiddleware from 'next-intl/middleware';
import { getSession } from './utils/session';
// import { getSession, getUserRole } from '@/utils/session'; // Commented out due to Prisma incompatibility in Edge Runtime
// -------------------------
// 1. next-intl middleware
// -------------------------
const intlMiddleware = createMiddleware({
  locales: ['en', 'am'],
  defaultLocale: 'en',
  localePrefix: 'always', // ensures /en/* and /am/* both exist
});

// -------------------------
// 2. Auth middleware
// -------------------------
async function authMiddleware(request: NextRequest) {
  const url = request.nextUrl;
  const locale = url.locale;
  const pathname = url.pathname;

  // Remove locale prefix for routing checks
  const cleanPath =
    pathname.startsWith(`/${locale}`)
      ? pathname.replace(`/${locale}`, '') || '/'
      : pathname;

  // Skip static/API routes
  if (cleanPath.startsWith('/_next') || cleanPath.startsWith('/__next') || cleanPath.startsWith('/api'))
    return NextResponse.next();

  // Load session using request
  const session = await getSession();
  const sessionCookie = request.cookies.get("session")?.value;

  console.log("SESSION", sessionCookie ? "Session exists" : "No session");

  if (!session || !sessionCookie) {
    // Not logged in
    if (cleanPath !== '/') {
      return NextResponse.redirect(new URL(`/${locale}/`, request.url));
    }
    return NextResponse.next();
  }

  // Logged in
  const role = session.fetched_user?.user_role;
  console.log("ROLE", role)

  if (!role) {
    // If no role found in session, redirect to home (login)
    if (cleanPath !== '/') {
      return NextResponse.redirect(new URL(`/${locale}/`, request.url));
    }
    return NextResponse.next();
  }

  // If visiting root: redirect to role dashboard
  if (cleanPath === '/') {
    const redirectPath = `/${locale}/${role.toLowerCase()}`;
    return NextResponse.redirect(new URL(redirectPath, request.url));
  }

  // Role-protected routes
  const protectedRole =
    cleanPath.startsWith('/admin')
      ? 'ADMIN'
      : cleanPath.startsWith('/manager')
        ? 'MANAGER'
        : cleanPath.startsWith('/teacher')
          ? 'TEACHER'
          : null;

  if (protectedRole && protectedRole !== role) {
    // Redirect to their own dashboard if they try to access another role's area
    const redirectPath = `/${locale}/${role.toLowerCase()}`;
    return NextResponse.redirect(new URL(redirectPath, request.url));
  }

  return NextResponse.next();
}

// ------------------------------
// 3. Combined i18n + auth logic
// ------------------------------
export default async function middleware(request: NextRequest) {
  // Handle CORS preflight requests
  if (request.method === 'OPTIONS') {
    return new NextResponse(null, {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-phone-number',
        'Access-Control-Max-Age': '86400',
      },
    });
  }

  // First apply next-intl
  const intlResponse = intlMiddleware(request);

  // If intl generated a redirect, return immediately
  if (intlResponse && intlResponse.redirected) return intlResponse;

  // Continue with custom auth
  const authResponse = await authMiddleware(request);

  // Add CORS headers to all responses
  authResponse.headers.set('Access-Control-Allow-Origin', '*');
  authResponse.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
  authResponse.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-phone-number');

  return authResponse;
}

// ------------------------------
// 4. Route matcher
// ------------------------------
export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|api|.*\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};

