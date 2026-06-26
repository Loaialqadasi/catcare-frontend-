// Mohamed Abdelgawwad — CCU-S1-04 | Foundation Module
// Cats API: CRUD + restore + care history.

import type {
  Cat,
  CatFilters,
  CreateCatFormData,
  CareHistoryEntry,
  PaginatedResponse,
} from '../types';
import { normalizeCat, normalizeCareHistory } from './normalizers';
import type { RawCat, RawCareHistory } from './types';
import { apiFetch, API_BASE, readEnvelope } from './client';

export async function fetchCats(
  filters: CatFilters = {},
): Promise<PaginatedResponse<Cat>> {
  const { page = 1, pageSize = 10, search = '', healthStatus = '' } = filters;

  const params = new URLSearchParams({
    page: String(page),
    pageSize: String(pageSize),
  });
  if (search) params.set('search', search);
  if (healthStatus) params.set('healthStatus', healthStatus);

  const res = await apiFetch(`${API_BASE}/cats?${params}`);
  const data = await readEnvelope<{ items: RawCat[]; pagination: PaginatedResponse<Cat>['pagination'] }>(
    res,
    'Failed to fetch cats',
  );
  return {
    items: data.items.map(normalizeCat),
    pagination: data.pagination,
  };
}

export async function fetchCatById(id: string): Promise<Cat> {
  const res = await apiFetch(`${API_BASE}/cats/${id}`);
  const data = await readEnvelope<RawCat>(res, 'Failed to fetch cat');
  return normalizeCat(data);
}

export async function createCat(data: CreateCatFormData): Promise<Cat> {
  const formData = new FormData();
  Object.entries(data).forEach(([key, value]) => {
    if (value === undefined || value === null) return;
    // File objects must be appended directly — String() would produce "[object File]"
    if (value instanceof File) {
      formData.append(key, value);
    } else {
      formData.append(key, String(value));
    }
  });
  const res = await apiFetch(`${API_BASE}/cats`, {
    method: 'POST',
    body: formData,
  });
  const raw = await readEnvelope<RawCat>(res, 'Failed to create cat');
  return normalizeCat(raw);
}

export async function updateCat(
  id: string,
  data: Partial<Omit<CreateCatFormData, 'photo'>> & { photo?: File; photoUrl?: string | null },
): Promise<Cat> {
  const formData = new FormData();
  Object.entries(data).forEach(([key, value]) => {
    if (value === undefined) return;
    // Handle explicit null for photoUrl (photo removal) — send as empty string
    // so the backend knows the field was intentionally cleared
    if (value === null) {
      formData.append(key, '');
      return;
    }
    if (value instanceof File) {
      formData.append(key, value);
    } else {
      formData.append(key, String(value));
    }
  });
  const res = await apiFetch(`${API_BASE}/cats/${id}`, {
    method: 'PATCH',
    body: formData,
  });
  const raw = await readEnvelope<RawCat>(res, 'Failed to update cat');
  return normalizeCat(raw);
}

export async function deleteCat(id: string): Promise<void> {
  const res = await apiFetch(`${API_BASE}/cats/${id}`, { method: 'DELETE' });
  await readEnvelope<unknown>(res, 'Failed to delete cat');
}

export async function restoreCat(id: string): Promise<Cat> {
  const res = await apiFetch(`${API_BASE}/cats/${id}/restore`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
  });
  const raw = await readEnvelope<RawCat>(res, 'Failed to restore cat');
  return normalizeCat(raw);
}

// ─────────────────────────────────────────────────────────────────────────────
// Care history
// ─────────────────────────────────────────────────────────────────────────────

export async function fetchCareHistory(catId: string): Promise<CareHistoryEntry[]> {
  const res = await apiFetch(`${API_BASE}/cats/${catId}/care-history`);
  const data = await readEnvelope<RawCareHistory[]>(res, 'Failed to fetch care history');
  return data.map(normalizeCareHistory);
}
