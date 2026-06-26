// Mohamed Abdelgawwad — CCU-S1-04 | Foundation Module
// Emergencies API: list / get / create / status update / priority feed.

import type {
  CreateEmergencyFormData,
  EmergencyFilters,
  EmergencyReport,
  EmergencyStatus,
  PaginatedResponse,
} from '../types';
import { normalizeEmergency } from './normalizers';
import type { RawEmergency } from './types';
import { apiFetch, API_BASE, readEnvelope } from './client';

export async function fetchEmergencies(
  filters: EmergencyFilters = {},
): Promise<PaginatedResponse<EmergencyReport>> {
  const { page = 1, pageSize = 10, status = '', priority = '' } = filters;

  const params = new URLSearchParams({
    page: String(page),
    pageSize: String(pageSize),
  });
  if (status) params.set('status', status);
  if (priority) params.set('priority', priority);

  const res = await apiFetch(`${API_BASE}/emergencies?${params}`);
  const data = await readEnvelope<{ items: RawEmergency[]; pagination: PaginatedResponse<EmergencyReport>['pagination'] }>(
    res,
    'Failed to fetch emergencies',
  );
  return {
    items: data.items.map(normalizeEmergency),
    pagination: data.pagination,
  };
}

export async function fetchEmergencyById(id: string): Promise<EmergencyReport> {
  const res = await apiFetch(`${API_BASE}/emergencies/${id}`);
  const data = await readEnvelope<RawEmergency>(res, 'Failed to fetch emergency');
  return normalizeEmergency(data);
}

export async function fetchPriorityFeed(): Promise<EmergencyReport[]> {
  const res = await apiFetch(`${API_BASE}/emergencies/priority-feed`);
  const data = await readEnvelope<RawEmergency[]>(res, 'Failed to fetch priority feed');
  return data.map(normalizeEmergency);
}

export async function createEmergency(
  data: CreateEmergencyFormData,
): Promise<EmergencyReport> {
  const res = await apiFetch(`${API_BASE}/emergencies`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  const raw = await readEnvelope<RawEmergency>(res, 'Failed to create emergency');
  return normalizeEmergency(raw);
}

export async function updateEmergencyStatus(
  id: string,
  status: EmergencyStatus,
): Promise<EmergencyReport> {
  const res = await apiFetch(`${API_BASE}/emergencies/${id}/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status }),
  });
  const raw = await readEnvelope<RawEmergency>(res, 'Failed to update status');
  return normalizeEmergency(raw);
}
