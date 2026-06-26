// Mohamed Abdelgawwad — CCU-S1-04 | Foundation Module
// Core HTTP client — every domain module routes through `apiFetch`.
//
// Responsibilities:
//   • Attach credentials: 'include' so the HttpOnly JWT cookie is sent
//   • Attach (and refresh) the CSRF token on state-changing requests
//   • Transparently refresh the access token on 401 (single retry)
//   • Force logout when the session is genuinely expired
//   • Retry once on CSRF_INVALID (token expired in flight)

import { toast } from 'sonner';

// API URL — defaults to same-origin `/api` so requests are proxied through
// Next.js rewrites (see next.config.ts). This avoids ALL cross-origin cookie
// problems: SameSite=None blocking, third-party cookie restrictions, CORS
// preflight failures, etc. The browser only ever sees same-origin requests.
//
// Set NEXT_PUBLIC_API_URL to call the backend directly (e.g. for local dev
// where you don't want to run the Next.js rewrite layer, or for debugging).
// In production, leave it unset to use the proxy — this is the recommended setup.
export const API_BASE =
  process.env.NEXT_PUBLIC_API_URL || '/api';

if (typeof window !== 'undefined' && !API_BASE) {
  console.error('API URL is not configured. API calls will fail.');
}

// ─────────────────────────────────────────────────────────────────────────────
// Auth store hook (lazy import to avoid a circular dependency with `../store`)
// ─────────────────────────────────────────────────────────────────────────────

let _storeLogout: (() => void) | null = null;
async function getStoreLogout(): Promise<() => void> {
  if (!_storeLogout) {
    const mod = await import('../store');
    _storeLogout = () => mod.useAppStore.getState().logout();
  }
  return _storeLogout;
}

// ─────────────────────────────────────────────────────────────────────────────
// Automatic token refresh
// ─────────────────────────────────────────────────────────────────────────────

let _isRefreshing = false;

async function refreshAccessToken(): Promise<boolean> {
  if (_isRefreshing) return false; // Prevent concurrent refresh attempts
  _isRefreshing = true;
  try {
    const res = await fetch(`${API_BASE}/auth/refresh`, {
      method: 'POST',
      credentials: 'include',
    });
    return res.ok;
  } catch {
    return false;
  } finally {
    _isRefreshing = false;
  }
}

// Proactive refresh: refresh the access token every 12 minutes (token lasts 15 min)
let _refreshInterval: ReturnType<typeof setInterval> | null = null;

export function startTokenRefreshTimer(): void {
  stopTokenRefreshTimer();
  _refreshInterval = setInterval(async () => {
    const success = await refreshAccessToken();
    if (!success) {
      // Silent failure — the 401 interceptor will handle logout when needed
      console.warn('Proactive token refresh failed');
    }
  }, 12 * 60 * 1000);
}

export function stopTokenRefreshTimer(): void {
  if (_refreshInterval) {
    clearInterval(_refreshInterval);
    _refreshInterval = null;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// CSRF token cache (double-submit cookie pattern)
// ─────────────────────────────────────────────────────────────────────────────
// The CSRF token can expire or become invalid, so we cache it but clear it on
// errors. Concurrent requests deduplicate the fetch via a shared promise.

let _csrfToken: string | null = null;
let _csrfTokenPromise: Promise<string> | null = null;

export async function ensureCsrfToken(): Promise<string> {
  if (_csrfToken) return _csrfToken;
  if (_csrfTokenPromise) return _csrfTokenPromise;

  _csrfTokenPromise = (async () => {
    try {
      const res = await fetch(`${API_BASE}/csrf-token`, { credentials: 'include' });
      const json = await res.json();
      if (json.success && json.data?.token) {
        _csrfToken = json.data.token;
        return _csrfToken as string;
      }
    } catch {
      // CSRF token fetch failed — will retry on next request
    } finally {
      _csrfTokenPromise = null;
    }
    return '';
  })();

  return _csrfTokenPromise;
}

export function clearCsrfToken(): void {
  _csrfToken = null;
  _csrfTokenPromise = null;
}

function isStateChanging(method?: string): boolean {
  return method === 'POST' || method === 'PATCH' || method === 'PUT' || method === 'DELETE';
}

// ─────────────────────────────────────────────────────────────────────────────
// CSRF-exempt endpoints
// ─────────────────────────────────────────────────────────────────────────────
// The backend intentionally does NOT apply `csrfProtection` to any of these
// routes (see backend/src/Layth_Amgad-CCU-S1-01-Auth/auth.routes.ts). The
// double-submit CSRF cookie uses SameSite=None (required for the Vercel↔Render
// cross-origin setup), which is increasingly blocked by modern browsers as a
// third-party cookie — so fetching a CSRF token for these endpoints is a
// wasted network round-trip at best, and a request-hanging failure point at
// worst. Skip it entirely.
const CSRF_EXEMPT_PATH_PREFIXES = [
  '/auth/login',
  '/auth/register',
  '/auth/forgot-password',
  '/auth/reset-password',
  '/auth/refresh',
  '/auth/verify-email',
  '/auth/resend-verification',
  '/auth/change-password',
  '/auth/logout',
];

function isCsrfExempt(url: string): boolean {
  let path = url;
  if (path.startsWith(API_BASE)) {
    path = path.slice(API_BASE.length);
  }
  const qIdx = path.indexOf('?');
  if (qIdx >= 0) path = path.slice(0, qIdx);
  return CSRF_EXEMPT_PATH_PREFIXES.some((prefix) => path.startsWith(prefix));
}

// ─────────────────────────────────────────────────────────────────────────────
// apiFetch — the single point of entry for all API calls
// ─────────────────────────────────────────────────────────────────────────────

export async function apiFetch(url: string, options?: RequestInit): Promise<Response> {
  const headers = new Headers(options?.headers);

  if (isStateChanging(options?.method) && !isCsrfExempt(url)) {
    const token = await ensureCsrfToken();
    if (token) {
      headers.set('X-CSRF-Token', token);
    }
  }

  const res = await fetch(url, {
    ...options,
    headers,
    credentials: 'include', // CRIT-1: Send HttpOnly cookies automatically
  });

  // CRIT-4: If CSRF validation failed, refresh token and retry once.
  if (res.status === 403) {
    const json = await res.clone().json().catch(() => ({}));
    if (json.error?.code === 'CSRF_INVALID') {
      clearCsrfToken();
      const freshToken = await ensureCsrfToken();
      if (freshToken) {
        const retryHeaders = new Headers(options?.headers);
        retryHeaders.set('X-CSRF-Token', freshToken);
        const retryRes = await fetch(url, {
          ...options,
          headers: retryHeaders,
          credentials: 'include',
        });
        if (retryRes.status === 401) {
          getStoreLogout().then((fn) => fn());
          toast.error('Your session has expired. Please log in again.');
          throw new Error('SESSION_EXPIRED');
        }
        return retryRes;
      }
      toast.error('Security token expired. Please try again.');
      throw new Error('CSRF_TOKEN_EXPIRED');
    }
  }

  // MED-4: Global 401 interceptor with automatic token refresh
  if (res.status === 401) {
    // Don't try to refresh if this was a login/register request — those are
    // "wrong credentials" 401s, not "expired session" 401s. Showing "session
    // expired" for a wrong-password login attempt is misleading, so we throw
    // a typed error with the backend's actual message instead.
    const isAuthEndpoint = url.includes('/auth/login') || url.includes('/auth/register');
    if (isAuthEndpoint) {
      // Parse the backend's error envelope and surface its message.
      // Falls back to a generic "Invalid credentials" if parsing fails.
      let backendMessage = 'Invalid email or password';
      try {
        const json = await res.clone().json();
        if (json?.error?.message) backendMessage = json.error.message;
      } catch {
        // Response wasn't JSON — keep the default message.
      }
      throw new Error(backendMessage);
    }

    // For non-auth endpoints, try to refresh the access token once.
    try {
      const refreshed = await refreshAccessToken();
      if (refreshed) {
        const retryHeaders = new Headers(options?.headers);
        if (isStateChanging(options?.method) && !isCsrfExempt(url)) {
          const freshToken = await ensureCsrfToken();
          if (freshToken) retryHeaders.set('X-CSRF-Token', freshToken);
        }
        const retryRes = await fetch(url, {
          ...options,
          headers: retryHeaders,
          credentials: 'include',
        });
        if (retryRes.status !== 401) return retryRes;
      }
    } catch {
      // Network error during refresh — don't force logout.
      // The user might just have a temporary connectivity issue.
    }
    // Refresh failed or retry still returned 401 — force logout
    stopTokenRefreshTimer();
    getStoreLogout().then((fn) => fn());
    toast.error('Your session has expired. Please log in again.');
    throw new Error('SESSION_EXPIRED');
  }

  // Network-level errors (backend unreachable, DNS failure, etc.) — fetch throws
  // a TypeError with message "Failed to fetch". The browser console shows the
  // real cause (CORS, DNS, connection refused). We re-throw with a friendlier
  // message so the UI can show actionable guidance instead of a cryptic string.
  // (No code needed here — the throw happens in `fetch()` itself. The caller's
  // catch block receives the original TypeError and can inspect it.)

  return res;
}

// ─────────────────────────────────────────────────────────────────────────────
// Helper: read the envelope, throw a friendly Error on failure
// ─────────────────────────────────────────────────────────────────────────────

import type { ApiEnvelope } from './types';

export async function readEnvelope<T>(res: Response, fallbackMessage: string): Promise<T> {
  // Read the response body as text first so we can detect non-JSON responses
  // (e.g. the Next.js proxy returns "Internal Server Error" as plain text when
  // the backend is unreachable, or a 502 from a reverse proxy HTML page).
  const text = await res.text();

  let json: ApiEnvelope<T> | null = null;
  if (text) {
    try {
      json = JSON.parse(text) as ApiEnvelope<T>;
    } catch {
      // Not JSON — handle below based on status code.
    }
  }

  // Non-JSON response — surface a friendly error.
  if (!json) {
    if (res.status >= 500) {
      throw new Error(
        'The server is unreachable or returned an internal error. ' +
          'Check that the backend is running and BACKEND_URL is configured correctly.',
      );
    }
    if (res.status === 404) {
      throw new Error('The requested resource was not found.');
    }
    throw new Error(fallbackMessage);
  }

  if (!json.success || json.data === undefined) {
    // Surface Zod field errors if the backend provided them
    const fieldErrors = json.error?.details?.issues?.fieldErrors;
    if (fieldErrors) {
      const messages = Object.values(fieldErrors).flat().filter(Boolean).join(', ');
      throw new Error(messages || json.error?.message || fallbackMessage);
    }
    throw new Error(json.error?.message || fallbackMessage);
  }
  return json.data;
}
