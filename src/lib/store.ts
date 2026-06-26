// Mohamed Abdelgawwad — CCU-S1-04 | Foundation Module

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User, Cat, EmergencyReport } from './types';
import { clearCsrfToken, startTokenRefreshTimer, stopTokenRefreshTimer } from './api-client';

interface AppState {
  // Auth state
  user: User | null;
  isAuthenticated: boolean;

  // Sidebar state
  sidebarOpen: boolean;

  // Auth actions
  setUser: (user: User) => void;
  login: (user: User) => void;
  logout: () => void;

  // Sidebar actions
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      // starts logged out — users must sign in with a valid UTM email
      user: null,
      isAuthenticated: false,

      // Sidebar state
      sidebarOpen: false,

      // Auth actions
      setUser: (user) => set({ user }),
      login: (user) => {
        clearCsrfToken(); // Clear stale CSRF token — new user session needs fresh token
        startTokenRefreshTimer();
        set({ user, isAuthenticated: true });
      },
      logout: () => {
        clearCsrfToken(); // Clear CSRF token on logout
        stopTokenRefreshTimer();
        set({
          user: null,
          isAuthenticated: false,
        });
      },

      // Sidebar actions
      toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
      setSidebarOpen: (open) => set({ sidebarOpen: open }),
    }),
    {
      name: 'catcare-storage',
      // Persist both isAuthenticated flag and user object.
      // Token is in an HttpOnly cookie — never in localStorage.
      // User object is persisted so the UI can show user info immediately
      // on page load without waiting for getMe(), preventing flash of empty state.
      partialize: (state) => ({
        isAuthenticated: state.isAuthenticated,
        user: state.user,
      }),
      // Skip hydration SSR mismatch: on the server there is no localStorage,
      // so the store would initialize with defaults (isAuthenticated: false).
      // On the client, we want to wait for the persisted state to load before
      // rendering anything that depends on auth — otherwise the layout briefly
      // sees isAuthenticated: false and redirects to /login.
      skipHydration: true,
    }
  )
);

// Rehydrate the store manually and return a promise that resolves when done.
// This lets the layout wait for auth state before deciding whether to redirect.
export async function rehydrateAuth(): Promise<void> {
  await useAppStore.persist.rehydrate();
}

// --- data cache ---
// MIN-4 Fix: Added loading flags per resource
// Cache now tracks the filter key that produced the cached data — switching
// filters is treated as stale even if the timestamp is fresh.

/** Serialize filter params to a string key for cache comparison. */
function filterKey(filters: Record<string, unknown>): string {
  return JSON.stringify(filters, (_, v) => (v === undefined ? '' : v));
}

interface DataCacheState {
  cats: Cat[];
  catsPagination: { page: number; pageSize: number; totalItems: number; totalPages: number };
  catsLastFetched: number | null;
  catsFilterKey: string | null;
  catsLoading: boolean;
  emergencies: EmergencyReport[];
  emergenciesPagination: { page: number; pageSize: number; totalItems: number; totalPages: number };
  emergenciesLastFetched: number | null;
  emergenciesFilterKey: string | null;
  emergenciesLoading: boolean;
  priorityFeed: EmergencyReport[];
  priorityFeedLastFetched: number | null;
  priorityFeedLoading: boolean;

  setCats: (cats: Cat[], pagination: DataCacheState['catsPagination'], filters?: Record<string, unknown>) => void;
  setCatsLoading: (loading: boolean) => void;
  setEmergencies: (emergencies: EmergencyReport[], pagination: DataCacheState['emergenciesPagination'], filters?: Record<string, unknown>) => void;
  setEmergenciesLoading: (loading: boolean) => void;
  setPriorityFeed: (feed: EmergencyReport[]) => void;
  setPriorityFeedLoading: (loading: boolean) => void;
  invalidateCats: () => void;
  invalidateEmergencies: () => void;
  invalidatePriorityFeed: () => void;
  isCatsStale: (filters?: Record<string, unknown>, maxAgeMs?: number) => boolean;
  isEmergenciesStale: (filters?: Record<string, unknown>, maxAgeMs?: number) => boolean;
  isPriorityFeedStale: (maxAgeMs?: number) => boolean;
}

const CACHE_STALE_MS = 30_000; // 30 seconds

export const useDataCache = create<DataCacheState>((set, get) => ({
  cats: [],
  catsPagination: { page: 1, pageSize: 10, totalItems: 0, totalPages: 0 },
  catsLastFetched: null,
  catsFilterKey: null,
  catsLoading: false,
  emergencies: [],
  emergenciesPagination: { page: 1, pageSize: 10, totalItems: 0, totalPages: 0 },
  emergenciesLastFetched: null,
  emergenciesFilterKey: null,
  emergenciesLoading: false,
  priorityFeed: [],
  priorityFeedLastFetched: null,
  priorityFeedLoading: false,

  setCats: (cats, pagination, filters) => set({
    cats,
    catsPagination: pagination,
    catsLastFetched: Date.now(),
    catsFilterKey: filters ? filterKey(filters) : null,
    catsLoading: false,
  }),
  setCatsLoading: (loading) => set({ catsLoading: loading }),
  setEmergencies: (emergencies, pagination, filters) => set({
    emergencies,
    emergenciesPagination: pagination,
    emergenciesLastFetched: Date.now(),
    emergenciesFilterKey: filters ? filterKey(filters) : null,
    emergenciesLoading: false,
  }),
  setEmergenciesLoading: (loading) => set({ emergenciesLoading: loading }),
  setPriorityFeed: (feed) => set({ priorityFeed: feed, priorityFeedLastFetched: Date.now(), priorityFeedLoading: false }),
  setPriorityFeedLoading: (loading) => set({ priorityFeedLoading: loading }),
  invalidateCats: () => set({ catsLastFetched: null, catsFilterKey: null }),
  invalidateEmergencies: () => set({ emergenciesLastFetched: null, emergenciesFilterKey: null }),
  invalidatePriorityFeed: () => set({ priorityFeedLastFetched: null }),
  isCatsStale: (filters, maxAgeMs = CACHE_STALE_MS) => {
    const { catsLastFetched, catsFilterKey } = get();
    if (catsLastFetched === null) return true;
    // If filters are provided and they differ from the cached filter key, treat as stale
    if (filters !== undefined && catsFilterKey !== null && catsFilterKey !== filterKey(filters)) return true;
    return Date.now() - catsLastFetched > maxAgeMs;
  },
  isEmergenciesStale: (filters, maxAgeMs = CACHE_STALE_MS) => {
    const { emergenciesLastFetched, emergenciesFilterKey } = get();
    if (emergenciesLastFetched === null) return true;
    if (filters !== undefined && emergenciesFilterKey !== null && emergenciesFilterKey !== filterKey(filters)) return true;
    return Date.now() - emergenciesLastFetched > maxAgeMs;
  },
  isPriorityFeedStale: (maxAgeMs = CACHE_STALE_MS) => {
    const last = get().priorityFeedLastFetched;
    return last === null || Date.now() - last > maxAgeMs;
  },
}));
