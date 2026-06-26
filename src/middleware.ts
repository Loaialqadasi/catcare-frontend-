// Mohamed Abdelgawwad — CCU-S1-04 | Foundation Module
//
// Edge middleware for route protection.
//
// The backend sets two HttpOnly cookies:
//   • `token`        — short-lived JWT (15 min)
//   • `refreshToken` — long-lived JWT (7 days)
//
// Both are HttpOnly, so client-side JS cannot read them. Edge middleware
// runs server-side, so it CAN read them. We treat the presence of EITHER
// cookie as a "likely logged in" signal and let the request through; the
// (main) layout then calls `getMe()` to validate the JWT and the apiFetch
// client transparently refreshes the access token via /auth/refresh when
// needed.
//
// This two-layer approach gives us:
//   1. Instant edge-level redirect for unauthenticated users (no flash of
//      protected UI, no wasted API call)
//   2. Defense-in-depth via the JWT validation in the layout
//
// Note: the cookie presence is a *hint*, not an auth proof. An expired
// `token` cookie will still pass the edge check and the layout's getMe()
// call will fail — at which point the apiFetch interceptor attempts a
// silent refresh, and only if THAT fails does the user get logged out.

import { NextResponse, type NextRequest } from 'next/server';

const PUBLIC_PATHS = new Set<string>([
  '/login',
  '/register',
  '/forgot-password',
  '/reset-password',
  '/verify-email',
]);

function isPublic(pathname: string): boolean {
  return PUBLIC_PATHS.has(pathname);
}

export function middleware(req: NextRequest) {
  const { pathname, search } = req.nextUrl;

  // Allow public auth routes
  if (isPublic(pathname)) {
    return NextResponse.next();
  }

  // Allow public assets and Next.js internals
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname === '/favicon.ico' ||
    pathname === '/logo.svg' ||
    pathname === '/og-image.png' ||
    pathname === '/robots.txt' ||
    pathname === '/Loai-qr.png' ||
    pathname === '/manifest.json'
  ) {
    return NextResponse.next();
  }

  const hasAccessToken = Boolean(req.cookies.get('token')?.value);
  const hasRefreshToken = Boolean(req.cookies.get('refreshToken')?.value);
  const likelyLoggedIn = hasAccessToken || hasRefreshToken;

  // If user is logged in and tries to visit /, redirect to dashboard
  if (likelyLoggedIn && pathname === '/') {
    const url = req.nextUrl.clone();
    url.pathname = '/dashboard';
    return NextResponse.redirect(url);
  }

  // If user is NOT logged in and tries to visit a protected route, redirect to /login
  if (!likelyLoggedIn && pathname !== '/') {
    const url = req.nextUrl.clone();
    url.pathname = '/login';
    url.searchParams.set('redirect', `${pathname}${search}`);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  // Run on every path except Next.js internals and API routes.
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
