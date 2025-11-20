import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getSession, getUserRole } from '@/utils/session'

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname
  console.log("PATH NAME", pathname)

  // Skip static/API
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api')
  ) {
    return NextResponse.next()
  }

  // Optional: Skip/redirect /login if separate (but since merged to root, not needed)
  // if (pathname === '/login') return NextResponse.redirect(new URL('/', request.url))

  const session = await getSession()
  console.log("SESSION", session)
  if (!session) {
    // Unauthed: Redirect to root (shows login) unless already there
    if (pathname !== '/') {
      console.log(`[Middleware] No session on ${pathname} → Redirect to /`)
      return NextResponse.redirect(new URL('/', request.url))
    }
    return NextResponse.next() // Show landing on /
  }

  const role = session.fetched_user.user_role
  if (!role) {
    console.log(`[Middleware] Invalid role from session on ${pathname}`)
    return NextResponse.redirect(new URL('/', request.url))
  }

  console.log(`[Middleware] Session valid, role: ${role} on ${pathname}`)

  // Root /: Redirect authed to role dashboard
  if (pathname === '/') {
    const rolePath = `/${role.toLowerCase()}`
    console.log(`[Middleware] Redirecting from / to ${rolePath}`)
    return NextResponse.redirect(new URL(rolePath, request.url))
  }

  // Skip non-protected
  if (
    !pathname.startsWith('/admin') &&
    !pathname.startsWith('/manager') &&
    !pathname.startsWith('/teacher')
  ) {
    return NextResponse.next()
  }

  // Protect role routes
  let requiredRole: string | null = null
  if (pathname.startsWith('/admin')) requiredRole = 'ADMIN'
  else if (pathname.startsWith('/manager')) requiredRole = 'MANAGER'
  else if (pathname.startsWith('/teacher')) requiredRole = 'TEACHER'

  if (requiredRole && role !== requiredRole) {
    const rolePath = `/${role.toLowerCase()}`
    console.log(`[Middleware] Wrong role ${role} for ${pathname} → Redirect to ${rolePath}`)
    return NextResponse.redirect(new URL(rolePath, request.url))
  }

  console.log(`[Middleware] Access granted to ${pathname} for role ${role}`)
  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)', // Adds image file exclusions
  ],
}
