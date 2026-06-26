// Tests for the edge middleware route-protection logic.
// We mock NextRequest and assert on the redirected URL / next() calls.

import { describe, it, expect, vi, beforeEach } from 'vitest';

// ─────────────────────────────────────────────────────────────────────────────
// Mock NextResponse so we can inspect what middleware returned
// ─────────────────────────────────────────────────────────────────────────────

const nextMock = vi.fn();
const redirectMock = vi.fn((url: URL) => ({ type: 'redirect', url }));

vi.mock('next/server', () => ({
  NextResponse: {
    next: () => nextMock(),
    redirect: (url: URL) => redirectMock(url),
  },
}));

// Helper: build a minimal NextRequest-like object
function makeReq(pathname: string, opts: { cookies?: Record<string, string>; search?: string } = {}) {
  const url = new URL(`https://catcare.example${pathname}${opts.search ?? ''}`);
  return {
    nextUrl: {
      pathname,
      search: opts.search ?? '',
      clone: () => ({
        pathname,
        search: opts.search ?? '',
        searchParams: new URLSearchParams(),
      }),
    },
    cookies: {
      get: (name: string) => (opts.cookies?.[name] ? { value: opts.cookies[name] } : undefined),
    },
    url: url.toString(),
  } as unknown as import('next/server').NextRequest;
}

// Import after mocks are in place
import { middleware } from '@/middleware';

describe('middleware — route protection', () => {
  beforeEach(() => {
    nextMock.mockClear();
    redirectMock.mockClear();
  });

  it('lets public auth routes through with no auth cookies', () => {
    middleware(makeReq('/login'));
    expect(nextMock).toHaveBeenCalled();
    expect(redirectMock).not.toHaveBeenCalled();
  });

  it('lets /register through unauthenticated', () => {
    middleware(makeReq('/register'));
    expect(nextMock).toHaveBeenCalled();
  });

  it('lets /forgot-password through unauthenticated', () => {
    middleware(makeReq('/forgot-password'));
    expect(nextMock).toHaveBeenCalled();
  });

  it('lets /reset-password through unauthenticated (token query)', () => {
    middleware(makeReq('/reset-password', { search: '?token=abc' }));
    expect(nextMock).toHaveBeenCalled();
  });

  it('lets /verify-email through unauthenticated (token query)', () => {
    middleware(makeReq('/verify-email', { search: '?token=abc' }));
    expect(nextMock).toHaveBeenCalled();
  });

  it('redirects unauthenticated users away from /dashboard to /login', () => {
    middleware(makeReq('/dashboard'));
    expect(redirectMock).toHaveBeenCalledTimes(1);
    const target = redirectMock.mock.calls[0][0] as URL;
    expect(target.pathname).toBe('/login');
    expect(target.searchParams.get('redirect')).toBe('/dashboard');
  });

  it('lets authenticated users (token cookie) through to /dashboard', () => {
    middleware(makeReq('/dashboard', { cookies: { token: 'abc' } }));
    expect(nextMock).toHaveBeenCalled();
    expect(redirectMock).not.toHaveBeenCalled();
  });

  it('lets authenticated users (refreshToken cookie only) through', () => {
    middleware(makeReq('/cats', { cookies: { refreshToken: 'abc' } }));
    expect(nextMock).toHaveBeenCalled();
  });

  it('redirects authenticated users from / to /dashboard', () => {
    middleware(makeReq('/', { cookies: { token: 'abc' } }));
    expect(redirectMock).toHaveBeenCalledTimes(1);
    const target = redirectMock.mock.calls[0][0] as URL;
    expect(target.pathname).toBe('/dashboard');
  });

  it('preserves the original path + query string in the redirect param', () => {
    middleware(makeReq('/cats/42', { search: '?tab=history' }));
    expect(redirectMock).toHaveBeenCalled();
    const target = redirectMock.mock.calls[0][0] as URL;
    expect(target.searchParams.get('redirect')).toBe('/cats/42?tab=history');
  });

  it('lets Next.js internals (_next, favicon, api) through unauthenticated', () => {
    middleware(makeReq('/_next/static/chunk.js'));
    expect(nextMock).toHaveBeenCalled();
    middleware(makeReq('/api/health'));
    expect(nextMock).toHaveBeenCalledTimes(2);
    middleware(makeReq('/favicon.ico'));
    expect(nextMock).toHaveBeenCalledTimes(3);
  });

  it('lets static assets (logo.svg, og-image.png, robots.txt) through', () => {
    for (const path of ['/logo.svg', '/og-image.png', '/robots.txt', '/Loai-qr.png']) {
      middleware(makeReq(path));
    }
    expect(nextMock).toHaveBeenCalledTimes(4);
    expect(redirectMock).not.toHaveBeenCalled();
  });
});
