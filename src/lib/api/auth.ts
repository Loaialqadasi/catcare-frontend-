// Mohamed Abdelgawwad — CCU-S1-04 | Foundation Module
// Auth API: login, register, getMe, logout, password management.

import type {
  LoginFormData,
  RegisterFormData,
  User,
} from '../types';
import { normalizeUser } from './normalizers';
import type { RawUser } from './types';
import { apiFetch, API_BASE, clearCsrfToken, readEnvelope } from './client';

// Re-exported so consumers can keep importing from `@/lib/api-client` if they wish.
export { clearCsrfToken, startTokenRefreshTimer, stopTokenRefreshTimer } from './client';

// ─────────────────────────────────────────────────────────────────────────────
// AdminUser — exported from here for backward compatibility with the old
// api-client.ts surface. Lives in auth.ts because user management is part of
// the auth domain on the backend (/api/auth/users).
// ─────────────────────────────────────────────────────────────────────────────
export interface AdminUser {
  id: string;
  fullName: string;
  email: string;
  role: string;
  emailVerified: boolean;
  createdAt: string;
  updatedAt: string;
}

function normalizeAdminUser(raw: RawUser): AdminUser {
  return {
    id: String(raw.id),
    fullName: raw.fullName,
    email: raw.email,
    role: raw.role,
    emailVerified: raw.emailVerified,
    createdAt: raw.createdAt,
    updatedAt: raw.updatedAt,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Session endpoints
// ─────────────────────────────────────────────────────────────────────────────

export async function login(data: LoginFormData): Promise<{ user: User }> {
  const res = await apiFetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  const data_ = await readEnvelope<{ user: RawUser }>(res, 'Login failed');
  return { user: normalizeUser(data_.user) };
}

export async function register(data: RegisterFormData): Promise<{ user: User }> {
  const res = await apiFetch(`${API_BASE}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  const data_ = await readEnvelope<{ user: RawUser }>(res, 'Registration failed');
  return { user: normalizeUser(data_.user) };
}

export async function getMe(): Promise<User> {
  const res = await apiFetch(`${API_BASE}/auth/me`);
  const data = await readEnvelope<RawUser>(res, 'Failed to get user');
  return normalizeUser(data);
}

export async function logout(): Promise<void> {
  clearCsrfToken();
  await apiFetch(`${API_BASE}/auth/logout`, { method: 'POST' });
}

// ─────────────────────────────────────────────────────────────────────────────
// Password management
// ─────────────────────────────────────────────────────────────────────────────

export async function changePassword(
  currentPassword: string,
  newPassword: string,
): Promise<{ message: string }> {
  const res = await apiFetch(`${API_BASE}/auth/change-password`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ currentPassword, newPassword }),
  });
  return readEnvelope<{ message: string }>(res, 'Failed to change password');
}

export async function adminResetUserPassword(
  userId: string,
  password: string,
): Promise<{ message: string }> {
  const res = await apiFetch(`${API_BASE}/auth/users/${userId}/password`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ password }),
  });
  return readEnvelope<{ message: string }>(res, 'Failed to reset password');
}

export async function forgotPassword(
  email: string,
): Promise<{ message: string; token?: string }> {
  const res = await apiFetch(`${API_BASE}/auth/forgot-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  });
  return readEnvelope<{ message: string; token?: string }>(res, 'Failed to process request');
}

export async function resetPassword(
  token: string,
  password: string,
): Promise<{ message: string }> {
  const res = await apiFetch(`${API_BASE}/auth/reset-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token, password }),
  });
  return readEnvelope<{ message: string }>(res, 'Failed to reset password');
}

// ─────────────────────────────────────────────────────────────────────────────
// Admin: user management (/api/auth/users)
// ─────────────────────────────────────────────────────────────────────────────

export async function fetchAllUsers(): Promise<AdminUser[]> {
  const res = await apiFetch(`${API_BASE}/auth/users`);
  const data = await readEnvelope<RawUser[] | { items: RawUser[] }>(
    res,
    'Failed to fetch users',
  );
  // Backend returns paginated { items, pagination } — extract the items array
  const items = Array.isArray(data) ? data : (data?.items ?? []);
  return items.map(normalizeAdminUser);
}

export async function updateUserRole(
  userId: string,
  role: string,
): Promise<AdminUser> {
  const res = await apiFetch(`${API_BASE}/auth/users/${userId}/role`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ role }),
  });
  const data = await readEnvelope<RawUser>(res, 'Failed to update user role');
  return normalizeAdminUser(data);
}

export async function createUser(data: {
  fullName: string;
  email: string;
  password: string;
  role: string;
}): Promise<AdminUser> {
  const res = await apiFetch(`${API_BASE}/auth/users`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  const raw = await readEnvelope<RawUser>(res, 'Failed to create user');
  return normalizeAdminUser(raw);
}

export async function updateUser(
  userId: string,
  data: { fullName?: string; email?: string },
): Promise<AdminUser> {
  const res = await apiFetch(`${API_BASE}/auth/users/${userId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  const raw = await readEnvelope<RawUser>(res, 'Failed to update user');
  return normalizeAdminUser(raw);
}

export async function deleteUser(userId: string): Promise<void> {
  const res = await apiFetch(`${API_BASE}/auth/users/${userId}`, {
    method: 'DELETE',
  });
  await readEnvelope<unknown>(res, 'Failed to delete user');
}
