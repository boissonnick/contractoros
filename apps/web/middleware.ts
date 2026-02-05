import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Next.js middleware for server-side auth pre-check.
 *
 * Checks for __session cookie on protected routes.
 * This prevents flash of protected content during hydration.
 *
 * Note: This only checks cookie existence, not validity.
 * Full auth verification happens client-side via AuthProvider.
 */
export function middleware(request: NextRequest) {
  const session = request.cookies.get('__session');
  const { pathname } = request.nextUrl;

  // If no session cookie, redirect to login with return URL
  if (!session) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('returnTo', pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/field/:path*',
    '/client/:path*',
    '/sub/:path*',
  ],
};
