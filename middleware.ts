import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

import createMiddleware from 'next-intl/middleware';
import { getSession } from './utils/session';

// -------------------------
// CORS allowlist
// -------------------------
// The Mini App makes same-origin requests, so CORS is only needed for dev
// (ngrok/localhost) or when the app origin differs from the request origin.
// We reflect only explicitly-allowed origins instead of a wildcard.
function getAllowedOrigins(): string[] {
  const origins = new Set<string>();

  if (process.env.NODE_ENV !== 'production') {
    origins.add('http://localhost:3000');
    origins.add('http://127.0.0.1:3000');
  }

  for (const value of [process.env.NEXT_PUBLIC_APP_URL, process.env.NEXT_PUBLIC_BASE_URL]) {
    if (!value) continue;
    try {
      origins.add(new URL(value).origin);
    } catch {
      // ignore malformed URLs
    }
  }

  return Array.from(origins);
}

function isAllowedOrigin(origin: string | null): boolean {
  if (!origin) return false;
  if (getAllowedOrigins().includes(origin)) return true;
  // Allow ngrok tunnels during development.
  if (process.env.NODE_ENV !== 'production' && /^https:\/\/[a-z0-9-]+\.ngrok[a-z0-9-]*\.(app|dev)$/.test(origin)) {
    return true;
  }
  return false;
}

function applyCors(request: NextRequest, response: NextResponse): void {
  const origin = request.headers.get('origin');
  if (isAllowedOrigin(origin)) {
    response.headers.set('Access-Control-Allow-Origin', origin as string);
    response.headers.set('Vary', 'Origin');
  }
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
}

// -------------------------
// 1. next-intl middleware
// -------------------------
const intlMiddleware = createMiddleware({
  locales: ['am'],
  defaultLocale: 'am',
  localePrefix: 'always',
});

// -------------------------
// 2. Auth middleware
// -------------------------
async function authMiddleware(request: NextRequest) {
  const url = request.nextUrl;
  const locale = url.locale || 'am';
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
  const session = await getSession(request);
  const sessionCookie = request.cookies.get("session")?.value;

  if (!session) {
    // Not logged in
    if (cleanPath !== '/') {
      // If trying to access a specific page while logged out, redirect to login (root)
      return NextResponse.redirect(new URL(`/${locale}/`, request.url));
    }
    // If already at root, allow access to login page
    return NextResponse.next();
  }

  // Logged in
  const role = session.fetched_user?.user_role;

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
    const preflight = new NextResponse(null, { status: 200 });
    applyCors(request, preflight);
    preflight.headers.set('Access-Control-Max-Age', '86400');
    return preflight;
  }

  // Handle root path redirect manually to ensure it goes to /am
  if (request.nextUrl.pathname === '/') {
    return NextResponse.redirect(new URL('/am', request.url));
  }

  // First apply next-intl
  const intlResponse = intlMiddleware(request);

  // If intl generated a redirect, return immediately
  if (intlResponse && intlResponse.redirected) return intlResponse;

  // Continue with custom auth
  const authResponse = await authMiddleware(request);

  // Add CORS headers to all responses
  applyCors(request, authResponse);

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
