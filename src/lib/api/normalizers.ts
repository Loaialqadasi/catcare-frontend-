// Mohamed Abdelgawwad — CCU-S1-04 | Foundation Module
// Normalizers convert raw API responses (string IDs, string decimals, optional
// nested objects) into the strongly-typed domain models used across the UI.
// Centralizing them here keeps the per-domain API modules thin and ensures
// every consumer sees consistent shapes — no scattered `String(raw.id)` calls.

import type {
  Cat,
  CareHistoryEntry,
  Donation,
  EmergencyReport,
  User,
  Volunteer,
} from '../types';
import type {
  RawCat,
  RawCareHistory,
  RawDonation,
  RawEmergency,
  RawUser,
  RawVolunteer,
} from './types';

/** Convert a possibly-null numeric ID into the string IDs the UI uses everywhere. */
function toId(value: number | null | undefined): string | null {
  return value != null ? String(value) : null;
}

/** Parse a numeric latitude/longitude, preserving null when absent. */
function toCoord(value: number | string | null | undefined): number | null {
  if (value == null) return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

export function normalizeUser(raw: RawUser): User {
  return {
    id: String(raw.id),
    fullName: raw.fullName,
    email: raw.email,
    role: raw.role as User['role'],
    emailVerified: raw.emailVerified,
    createdAt: raw.createdAt,
    updatedAt: raw.updatedAt,
  };
}

export function normalizeCat(raw: RawCat): Cat {
  return {
    id: String(raw.id),
    nickname: raw.nickname,
    description: raw.description,
    photoUrl: raw.photoUrl,
    locationName: raw.locationName,
    latitude: toCoord(raw.latitude),
    longitude: toCoord(raw.longitude),
    healthStatus: raw.healthStatus as Cat['healthStatus'],
    ownershipTag: raw.ownershipTag as Cat['ownershipTag'],
    createdByUserId: toId(raw.createdByUserId),
    createdAt: raw.createdAt,
    updatedAt: raw.updatedAt,
  };
}

export function normalizeEmergency(raw: RawEmergency): EmergencyReport {
  return {
    id: String(raw.id),
    catId: toId(raw.catId),
    title: raw.title,
    description: raw.description,
    emergencyType: raw.emergencyType as EmergencyReport['emergencyType'],
    priority: raw.priority as EmergencyReport['priority'],
    status: raw.status as EmergencyReport['status'],
    locationName: raw.locationName,
    latitude: toCoord(raw.latitude),
    longitude: toCoord(raw.longitude),
    reportedByUserId: toId(raw.reportedByUserId),
    createdAt: raw.createdAt,
    updatedAt: raw.updatedAt,
    resolvedAt: raw.resolvedAt,
    cat: raw.cat ? { id: String(raw.cat.id), nickname: raw.cat.nickname } : raw.cat,
  };
}

export function normalizeDonation(raw: RawDonation): Donation {
  return {
    id: String(raw.id),
    donorName: raw.donorName,
    donorEmail: raw.donorEmail,
    amount: Number(raw.amount),
    receiptUrl: raw.receiptUrl,
    note: raw.note,
    status: raw.status as Donation['status'],
    rejectionReason: raw.rejectionReason,
    donorUserId: toId(raw.donorUserId),
    reviewedByUserId: toId(raw.reviewedByUserId),
    reviewedAt: raw.reviewedAt,
    createdAt: raw.createdAt,
    updatedAt: raw.updatedAt,
  };
}

export function normalizeCareHistory(raw: RawCareHistory): CareHistoryEntry {
  return {
    id: String(raw.id),
    catId: String(raw.catId),
    careType: raw.careType as CareHistoryEntry['careType'],
    description: raw.description,
    performedBy: raw.performedBy,
    performedByUserId: toId(raw.performedByUserId),
    createdAt: raw.createdAt,
  };
}

export function normalizeVolunteer(raw: RawVolunteer): Volunteer {
  return {
    id: String(raw.id),
    studentName: raw.studentName,
    studentId: raw.studentId,
    age: Number(raw.age),
    faculty: raw.faculty,
    interests: raw.interests,
    userId: toId(raw.userId),
    status: raw.status as Volunteer['status'],
    createdAt: raw.createdAt,
    updatedAt: raw.updatedAt,
  };
}
