import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

import createMiddleware from 'next-intl/middleware';
import { getSession, getUserRole } from '@/utils/session';
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

  console.log("SESSION", session)
  if (!session) {
    // Not logged in
    if (cleanPath !== '/') {
      return NextResponse.redirect(new URL(`/${locale}/`, request.url));
    }
    return NextResponse.next();
  }

  // Logged in → get role
  const role = session.fetched_user.user_role;
  console.log("ROLE", role)

  if (!role) {
    return NextResponse.redirect(new URL(`/${locale}/`, request.url));
  }

  // If visiting root: redirect to role dashboard
  if (cleanPath === '/') {
    const rolePath = `${locale}/${role.toLowerCase()}`;
    console.log("redirecting to", rolePath)
    return NextResponse.redirect(new URL(rolePath, request.url));
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
    const redirectPath = `/${locale}/${role.toLowerCase()}`;
    return NextResponse.redirect(new URL(redirectPath, request.url));
  }

  return NextResponse.next();
}

// ------------------------------
// 3. Combined i18n + auth logic
// ------------------------------
export default async function middleware(request: NextRequest) {
  // First apply next-intl
  const intlResponse = intlMiddleware(request);

  // If intl generated a redirect, return immediately
  if (intlResponse && intlResponse.redirected) return intlResponse;

  // Continue with custom auth
  return authMiddleware(request);
}

// ------------------------------
// 4. Route matcher
// ------------------------------
export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|api|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
