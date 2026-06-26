// Layth Amgad — CCU-S1-01 | Auth Module
// Activity API: fetches the authenticated user's activity / history timeline.
//
// The backend aggregates actions across cats, care history, emergencies,
// donations, and volunteer applications into a single sorted timeline plus a
// summary stats block. This module is the thin client for that endpoint.

import type { UserActivityResponse } from '../types';
import type { RawUserActivityResponse } from './types';
import { apiFetch, API_BASE, readEnvelope } from './client';

/**
 * Fetch the current user's activity timeline + summary stats.
 *
 * @param signal Optional AbortSignal to cancel the request (e.g. on unmount).
 * @returns Normalized activities array + summary, ready to render.
 */
export async function fetchMyActivity(
  signal?: AbortSignal,
): Promise<UserActivityResponse> {
  const res = await apiFetch(`${API_BASE}/auth/me/activity`, { signal });
  const raw = await readEnvelope<RawUserActivityResponse>(
    res,
    'Failed to load your activity',
  );

  return {
    activities: raw.activities.map((a) => ({
      id: a.id,
      type: a.type,
      title: a.title,
      description: a.description,
      status: a.status,
      resourceId: a.resourceId,
      resourceType: a.resourceType,
      href: a.href,
      createdAt: a.createdAt,
    })),
    summary: { ...raw.summary },
  };
}
