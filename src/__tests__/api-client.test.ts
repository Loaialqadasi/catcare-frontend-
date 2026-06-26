// Tests for the apiFetch client wrapper.
// We mock global `fetch` so the tests run in isolation — no network, no CSRF
// server required. The goal is to lock in the contract:
//   • credentials: 'include' is always set
//   • state-changing requests attach a CSRF token (after fetching one)
//   • 401 from a non-auth endpoint triggers a silent refresh + single retry
//   • 403 with CSRF_INVALID refreshes the CSRF token and retries once

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { apiFetch, ensureCsrfToken, clearCsrfToken, API_BASE } from '@/lib/api/client';

// ─────────────────────────────────────────────────────────────────────────────
// Mocks
// ─────────────────────────────────────────────────────────────────────────────

// `sonner` toast is called from inside apiFetch on session expiry — silence it
vi.mock('sonner', () => ({
  toast: { error: vi.fn(), success: vi.fn(), info: vi.fn() },
}));

// Lazy import path inside client.ts — mock the store module
vi.mock('@/lib/store', () => ({
  useAppStore: {
    getState: () => ({ logout: vi.fn() }),
  },
}));

// Stub `fetch` so we can assert call args and replay canned responses
const fetchMock = vi.fn();
vi.stubGlobal('fetch', fetchMock);

// Helper: build a minimal ok Response
function ok(data: unknown, init?: Partial<Response>): Response {
  return {
    ok: true,
    status: 200,
    json: async () => data,
    clone: () => ok(data, init),
    headers: new Headers(),
    ...init,
  } as Response;
}

beforeEach(() => {
  fetchMock.mockReset();
  clearCsrfToken();
});

describe('apiFetch — GET', () => {
  it('attaches credentials: "include"', async () => {
    fetchMock.mockResolvedValueOnce(ok({ success: true, data: {} }));
    await apiFetch(`${API_BASE}/cats`);
    const init = fetchMock.mock.calls[0][1] as RequestInit;
    expect(init.credentials).toBe('include');
  });

  it('does not fetch a CSRF token for GET requests', async () => {
    fetchMock.mockResolvedValueOnce(ok({ success: true, data: {} }));
    await apiFetch(`${API_BASE}/cats`);
    // Only one fetch call should have happened — the GET itself
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});

describe('apiFetch — POST with CSRF', () => {
  it('fetches a CSRF token and attaches it for non-exempt state-changing requests', async () => {
    // 1) CSRF token fetch
    fetchMock.mockResolvedValueOnce(
      ok({ success: true, data: { token: 'csrf-abc' } }),
    );
    // 2) Actual POST
    fetchMock.mockResolvedValueOnce(ok({ success: true, data: {} }));

    await apiFetch(`${API_BASE}/cats`, { method: 'POST' });

    // First call = CSRF token endpoint
    expect(fetchMock.mock.calls[0][0]).toContain('/csrf-token');
    // Second call = the actual POST
    const [, postInit] = fetchMock.mock.calls[1];
    const headers = new Headers((postInit as RequestInit).headers);
    expect(headers.get('X-CSRF-Token')).toBe('csrf-abc');
  });

  it('skips CSRF for /auth/login (exempt endpoint)', async () => {
    fetchMock.mockResolvedValueOnce(ok({ success: true, data: {} }));

    await apiFetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'x', password: 'y' }),
    });

    // No CSRF fetch — only one network call total
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [, init] = fetchMock.mock.calls[0];
    const headers = new Headers((init as RequestInit).headers);
    expect(headers.get('X-CSRF-Token')).toBeNull();
  });
});

describe('apiFetch — 401 refresh + retry', () => {
  it('attempts a token refresh on 401 from a non-auth endpoint, then retries', async () => {
    // 1) Original GET → 401
    fetchMock.mockResolvedValueOnce(
      ok({ success: false, error: { code: 'UNAUTHORIZED', message: 'no' } }, { status: 401 }),
    );
    // 2) Refresh attempt → 200
    fetchMock.mockResolvedValueOnce(ok({ success: true }, { status: 200 }));
    // 3) Retry → 200 with real data
    fetchMock.mockResolvedValueOnce(ok({ success: true, data: { ok: true } }));

    const res = await apiFetch(`${API_BASE}/cats`);
    expect(res.status).toBe(200);
    // Three calls: original, refresh, retry
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });

  it('does NOT attempt refresh on /auth/login 401 (bad credentials)', async () => {
    fetchMock.mockResolvedValueOnce(
      ok({ success: false, error: { code: 'BAD_CREDENTIALS', message: 'Invalid email or password' } }, { status: 401 }),
    );
    // Refresh should never be called, but if it is, the test should fail
    fetchMock.mockResolvedValueOnce(ok({ success: true }, { status: 200 }));

    // Login 401s now surface the backend's error message (not 'SESSION_EXPIRED')
    // so the login form can show "Invalid email or password" to the user instead
    // of a misleading "session expired" toast.
    await expect(apiFetch(`${API_BASE}/auth/login`, { method: 'POST' })).rejects.toThrow(
      'Invalid email or password',
    );
    // Only the original login call — no refresh attempt
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});

describe('ensureCsrfToken — dedupe', () => {
  it('caches the token across calls (no second network fetch)', async () => {
    fetchMock.mockResolvedValueOnce(
      ok({ success: true, data: { token: 'cached-token' } }),
    );

    const t1 = await ensureCsrfToken();
    const t2 = await ensureCsrfToken();
    expect(t1).toBe('cached-token');
    expect(t2).toBe('cached-token');
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('clearCsrfToken() forces a re-fetch on next call', async () => {
    fetchMock.mockResolvedValueOnce(
      ok({ success: true, data: { token: 'first' } }),
    );
    await ensureCsrfToken();

    clearCsrfToken();

    fetchMock.mockResolvedValueOnce(
      ok({ success: true, data: { token: 'second' } }),
    );
    const t = await ensureCsrfToken();
    expect(t).toBe('second');
  });
});
