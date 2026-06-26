// Mohamed Abdelgawwad — CCU-S1-04 | Foundation Module
// Donations API: list / get / create / review / approve / reject / summary.

import type {
  CreateDonationFormData,
  Donation,
  DonationFilters,
  DonationSummary,
  PaginatedResponse,
} from '../types';
import { normalizeDonation } from './normalizers';
import type { RawDonation } from './types';
import { apiFetch, API_BASE, readEnvelope } from './client';

export async function fetchDonations(
  filters: DonationFilters = {},
): Promise<PaginatedResponse<Donation>> {
  const { page = 1, pageSize = 10, status = '' } = filters;

  const params = new URLSearchParams({
    page: String(page),
    pageSize: String(pageSize),
  });
  if (status) params.set('status', status);

  const res = await apiFetch(`${API_BASE}/donations?${params}`);
  const data = await readEnvelope<{ items: RawDonation[]; pagination: PaginatedResponse<Donation>['pagination'] }>(
    res,
    'Failed to fetch donations',
  );
  return {
    items: data.items.map(normalizeDonation),
    pagination: data.pagination,
  };
}

export async function fetchMyDonations(): Promise<PaginatedResponse<Donation>> {
  const res = await apiFetch(`${API_BASE}/donations/my`);
  const data = await readEnvelope<{ items: RawDonation[]; pagination: PaginatedResponse<Donation>['pagination'] }>(
    res,
    'Failed to fetch donations',
  );
  return {
    items: data.items.map(normalizeDonation),
    pagination: data.pagination,
  };
}

export async function fetchDonationById(id: string): Promise<Donation> {
  const res = await apiFetch(`${API_BASE}/donations/${id}`);
  const data = await readEnvelope<RawDonation>(res, 'Failed to fetch donation');
  return normalizeDonation(data);
}

export async function fetchDonationSummary(): Promise<DonationSummary> {
  const res = await apiFetch(`${API_BASE}/donations/summary`);
  return readEnvelope<DonationSummary>(res, 'Failed to fetch donation summary');
}

export async function createDonation(
  data: CreateDonationFormData,
): Promise<Donation> {
  // Use FormData if there's a receipt file, otherwise JSON
  if (data.receipt) {
    const formData = new FormData();
    Object.entries(data).forEach(([key, value]) => {
      if (value === undefined || value === null) return;
      if (value instanceof File) {
        formData.append(key, value);
      } else {
        formData.append(key, String(value));
      }
    });
    const res = await apiFetch(`${API_BASE}/donations`, {
      method: 'POST',
      body: formData,
    });
    const raw = await readEnvelope<RawDonation>(res, 'Failed to create donation');
    return normalizeDonation(raw);
  }

  const res = await apiFetch(`${API_BASE}/donations`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  const raw = await readEnvelope<RawDonation>(res, 'Failed to create donation');
  return normalizeDonation(raw);
}

export async function reviewDonation(id: string): Promise<Donation> {
  const res = await apiFetch(`${API_BASE}/donations/${id}/review`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status: 'reviewed' }),
  });
  const raw = await readEnvelope<RawDonation>(res, 'Failed to review donation');
  return normalizeDonation(raw);
}

export async function approveDonation(id: string): Promise<Donation> {
  const res = await apiFetch(`${API_BASE}/donations/${id}/approve`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status: 'approved' }),
  });
  const raw = await readEnvelope<RawDonation>(res, 'Failed to approve donation');
  return normalizeDonation(raw);
}

export async function rejectDonation(
  id: string,
  rejectionReason: string,
): Promise<Donation> {
  const res = await apiFetch(`${API_BASE}/donations/${id}/reject`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status: 'rejected', rejectionReason }),
  });
  const raw = await readEnvelope<RawDonation>(res, 'Failed to reject donation');
  return normalizeDonation(raw);
}
