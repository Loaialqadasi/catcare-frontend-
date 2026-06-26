// Mohamed Abdelgawwad — CCU-S1-04 | Foundation Module
// Volunteers API: apply / list mine / list all (admin) / update status.

import type {
  CreateVolunteerFormData,
  PaginatedResponse,
  Volunteer,
} from '../types';
import { normalizeVolunteer } from './normalizers';
import type { RawVolunteer } from './types';
import { apiFetch, API_BASE, readEnvelope } from './client';

export async function createVolunteer(
  data: CreateVolunteerFormData,
): Promise<Volunteer> {
  const res = await apiFetch(`${API_BASE}/volunteers`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  const raw = await readEnvelope<RawVolunteer>(res, 'Failed to submit volunteer application');
  return normalizeVolunteer(raw);
}

export async function fetchMyVolunteerings(): Promise<Volunteer[]> {
  const res = await apiFetch(`${API_BASE}/volunteers/my`);
  const data = await readEnvelope<RawVolunteer[]>(res, 'Failed to fetch volunteer applications');
  return data.map(normalizeVolunteer);
}

// ─────────────────────────────────────────────────────────────────────────────
// Admin: volunteer management
// ─────────────────────────────────────────────────────────────────────────────

export async function fetchAllVolunteers(params?: {
  page?: number;
  pageSize?: number;
  status?: string;
}): Promise<PaginatedResponse<Volunteer>> {
  const searchParams = new URLSearchParams();
  if (params?.page) searchParams.set('page', String(params.page));
  if (params?.pageSize) searchParams.set('pageSize', String(params.pageSize));
  if (params?.status) searchParams.set('status', params.status);
  const query = searchParams.toString();

  const res = await apiFetch(`${API_BASE}/volunteers${query ? `?${query}` : ''}`);
  const data = await readEnvelope<{ items: RawVolunteer[]; pagination: PaginatedResponse<Volunteer>['pagination'] }>(
    res,
    'Failed to fetch volunteers',
  );
  return {
    items: data.items.map(normalizeVolunteer),
    pagination: data.pagination,
  };
}

export async function updateVolunteerStatus(
  id: string,
  status: 'approved' | 'rejected',
): Promise<Volunteer> {
  const res = await apiFetch(`${API_BASE}/volunteers/${id}/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status }),
  });
  const raw = await readEnvelope<RawVolunteer>(res, 'Failed to update volunteer status');
  return normalizeVolunteer(raw);
}
