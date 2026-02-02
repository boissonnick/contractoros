/**
 * Next.js Middleware for Route Protection
 * SECURITY FIX (H-002): Server-side route protection
 *
 * Note: Firebase Auth uses client-side tokens. This middleware provides
 * basic route protection by checking for the session cookie. Full token
 * verification happens in API routes via Firebase Admin SDK.
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Routes that require authentication (dashboard, admin areas)
const protectedRoutes = ['/dashboard', '/admin', '/field', '/sub'];

// Routes that are always public (no auth required)
const publicRoutes = [
  '/login',
  '/signup',
  '/register',
  '/forgot-password',
  '/reset-password',
  '/client',      // Client portal (token-based)
  '/sign',        // E-signature (token-based)
  '/pay',         // Payment pages (token-based)
  '/onboard',     // Client onboarding
  '/api/webhooks', // External webhooks (Stripe, Twilio)
  '/api/health',  // Health check
  '/api/client',  // Client portal API (token-based)
];

// Static assets and Next.js internals to skip
const skipPatterns = [
  '/_next',
  '/favicon.ico',
  '/images',
  '/fonts',
  '/manifest.json',
  '/robots.txt',
  '/sitemap.xml',
];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip static assets and internals
  if (skipPatterns.some(pattern => pathname.startsWith(pattern))) {
    return NextResponse.next();
  }

  // Skip file extensions (static files)
  if (pathname.includes('.')) {
    return NextResponse.next();
  }

  // Allow public routes
  if (publicRoutes.some(route => pathname.startsWith(route))) {
    return NextResponse.next();
  }

  // Check if accessing protected route
  if (protectedRoutes.some(route => pathname.startsWith(route))) {
    // Check for Firebase session cookie
    // Firebase Auth sets '__session' cookie when using session cookies
    // or the app may use a custom session token
    const sessionCookie = request.cookies.get('__session')?.value;
    const authToken = request.cookies.get('auth-token')?.value;

    // If no session/token found, redirect to login
    if (!sessionCookie && !authToken) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }

    // Note: Full token verification happens in individual API routes
    // This middleware just ensures users have SOME credential before
    // serving protected pages, preventing unnecessary server load
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files with extensions
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\..*$).*)',
  ],
};
