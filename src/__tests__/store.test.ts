// Tests for the Zustand app store + data cache.
// The app store is the single source of truth for auth + sidebar UI state;
// a regression here breaks every authenticated screen.

import { describe, it, expect, beforeEach } from 'vitest';
import { useAppStore, useDataCache } from '@/lib/store';

describe('useAppStore', () => {
  beforeEach(() => {
    // Reset to logged-out state before each test
    useAppStore.getState().logout();
    useAppStore.setState({ sidebarOpen: false });
  });

  it('starts logged out', () => {
    const state = useAppStore.getState();
    expect(state.user).toBeNull();
    expect(state.isAuthenticated).toBe(false);
  });

  it('login() sets the user and isAuthenticated=true', () => {
    const user = {
      id: '1',
      fullName: 'Test User',
      email: 'test@utm.my',
      role: 'student' as const,
      emailVerified: true,
      createdAt: '',
      updatedAt: '',
    };
    useAppStore.getState().login(user);
    const state = useAppStore.getState();
    expect(state.isAuthenticated).toBe(true);
    expect(state.user?.email).toBe('test@utm.my');
  });

  it('logout() clears the user and isAuthenticated', () => {
    useAppStore.getState().login({
      id: '1',
      fullName: 'Test',
      email: 't@utm.my',
      role: 'student',
      emailVerified: false,
      createdAt: '',
      updatedAt: '',
    });
    useAppStore.getState().logout();
    expect(useAppStore.getState().isAuthenticated).toBe(false);
    expect(useAppStore.getState().user).toBeNull();
  });

  it('toggleSidebar() flips the sidebar state', () => {
    expect(useAppStore.getState().sidebarOpen).toBe(false);
    useAppStore.getState().toggleSidebar();
    expect(useAppStore.getState().sidebarOpen).toBe(true);
    useAppStore.getState().toggleSidebar();
    expect(useAppStore.getState().sidebarOpen).toBe(false);
  });

  it('setUser() updates only the user, not isAuthenticated', () => {
    useAppStore.getState().login({
      id: '1',
      fullName: 'Old',
      email: 'old@utm.my',
      role: 'student',
      emailVerified: false,
      createdAt: '',
      updatedAt: '',
    });
    useAppStore.getState().setUser({
      id: '1',
      fullName: 'New',
      email: 'new@utm.my',
      role: 'volunteer',
      emailVerified: true,
      createdAt: '',
      updatedAt: '',
    });
    const state = useAppStore.getState();
    expect(state.user?.fullName).toBe('New');
    expect(state.user?.role).toBe('volunteer');
    expect(state.isAuthenticated).toBe(true); // unchanged
  });
});

describe('useDataCache', () => {
  beforeEach(() => {
    // Reset all cache state
    useDataCache.getState().invalidateCats();
    useDataCache.getState().invalidateEmergencies();
    useDataCache.getState().invalidatePriorityFeed();
    useDataCache.setState({
      cats: [],
      catsPagination: { page: 1, pageSize: 10, totalItems: 0, totalPages: 0 },
      emergencies: [],
      emergenciesPagination: { page: 1, pageSize: 10, totalItems: 0, totalPages: 0 },
      priorityFeed: [],
      catsLoading: false,
      emergenciesLoading: false,
      priorityFeedLoading: false,
    });
  });

  it('treats never-fetched data as stale', () => {
    expect(useDataCache.getState().isCatsStale()).toBe(true);
    expect(useDataCache.getState().isEmergenciesStale()).toBe(true);
    expect(useDataCache.getState().isPriorityFeedStale()).toBe(true);
  });

  it('setCats() marks cats as fresh for the same filter key', () => {
    const filters = { page: 1, search: 'milo' };
    useDataCache.getState().setCats(
      [{ id: '1', nickname: 'Milo', description: null, photoUrl: null,
        locationName: '', latitude: null, longitude: null,
        healthStatus: 'healthy', ownershipTag: 'stray',
        createdByUserId: null, createdAt: '', updatedAt: '' }],
      { page: 1, pageSize: 10, totalItems: 1, totalPages: 1 },
      filters,
    );
    expect(useDataCache.getState().isCatsStale(filters)).toBe(false);
  });

  it('setCats() with different filter key is treated as stale', () => {
    const filtersA = { page: 1, search: 'milo' };
    const filtersB = { page: 1, search: 'luna' };
    useDataCache.getState().setCats(
      [],
      { page: 1, pageSize: 10, totalItems: 0, totalPages: 0 },
      filtersA,
    );
    expect(useDataCache.getState().isCatsStale(filtersA)).toBe(false);
    expect(useDataCache.getState().isCatsStale(filtersB)).toBe(true);
  });

  it('invalidateCats() forces stale on next check', () => {
    useDataCache.getState().setCats(
      [],
      { page: 1, pageSize: 10, totalItems: 0, totalPages: 0 },
      {},
    );
    expect(useDataCache.getState().isCatsStale({})).toBe(false);
    useDataCache.getState().invalidateCats();
    expect(useDataCache.getState().isCatsStale({})).toBe(true);
  });

  it('isCatsStale() respects the maxAgeMs argument', async () => {
    useDataCache.getState().setCats(
      [],
      { page: 1, pageSize: 10, totalItems: 0, totalPages: 0 },
      {},
    );
    // With a huge max age, should be fresh
    expect(useDataCache.getState().isCatsStale({}, 60_000_000)).toBe(false);
    // With maxAge=0, anything fetched in the past is stale.
    // setCats set catsLastFetched to Date.now() — wait 5ms so
    // (Date.now() - catsLastFetched) > 0 is true.
    await new Promise((r) => setTimeout(r, 5));
    expect(useDataCache.getState().isCatsStale({}, 0)).toBe(true);
  });
});
