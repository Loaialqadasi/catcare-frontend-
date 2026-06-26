// Mohamed Abdelgawwad — CCU-S1-04 | Foundation Module

// --- user ---
export type UserRole = 'student' | 'volunteer' | 'manager' | 'admin';

/**
 * Role display metadata — used by badges, dropdowns, and access checks.
 * Keep in sync with backend `ROLE_RANK` (Mohamed_Abdelgawwad-CCU-S1-04-Foundation/types.ts).
 */
export const ROLE_META: Record<UserRole, { label: string; rank: number; color: string }> = {
  student:  { label: 'Student',  rank: 0, color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300' },
  volunteer:{ label: 'Volunteer',rank: 1, color: 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300' },
  manager:  { label: 'Manager',  rank: 2, color: 'bg-violet-100 text-violet-700 dark:bg-violet-950/40 dark:text-violet-300' },
  admin:    { label: 'Admin',    rank: 3, color: 'bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-300' },
};

export function hasMinRole(userRole: UserRole | undefined, minRole: UserRole): boolean {
  if (!userRole) return false;
  return ROLE_META[userRole].rank >= ROLE_META[minRole].rank;
}

export interface User {
  id: string;
  fullName: string;
  email: string;
  role: UserRole;
  emailVerified: boolean;
  createdAt: string;
  updatedAt: string;
}

// --- cats ---
export type HealthStatus = 'healthy' | 'needs_attention' | 'injured' | 'unknown';
export type OwnershipTag = 'stray' | 'adopted' | 'campus_managed' | 'unknown';

export interface Cat {
  id: string;
  nickname: string;
  description: string | null;
  photoUrl: string | null;
  locationName: string;
  latitude: number | null;
  longitude: number | null;
  healthStatus: HealthStatus;
  ownershipTag: OwnershipTag;
  createdByUserId: string | null;
  createdAt: string;
  updatedAt: string;
}

// --- emergencies ---
export type EmergencyType = 'injury' | 'sickness' | 'missing' | 'feeding_urgent' | 'danger' | 'other';
export type Priority = 'low' | 'medium' | 'high' | 'critical';
export type EmergencyStatus = 'open' | 'in_progress' | 'resolved' | 'cancelled';

export interface EmergencyReport {
  id: string;
  catId: string | null;
  title: string;
  description: string;
  emergencyType: EmergencyType;
  priority: Priority;
  status: EmergencyStatus;
  locationName: string;
  latitude: number | null;
  longitude: number | null;
  reportedByUserId: string | null;
  createdAt: string;
  updatedAt: string;
  resolvedAt: string | null;
  cat: { id: string; nickname: string } | null;
}

// --- api responses ---
export interface ApiResponse<T> {
  success: boolean;
  data: T;
}

export interface ApiError {
  success: false;
  error: {
    code: string;
    message: string;
    details?: Record<string, string[]>;
  };
}

export interface PaginatedResponse<T> {
  items: T[];
  pagination: {
    page: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
  };
}

// --- donations ---
export type DonationStatus = 'pending' | 'reviewed' | 'approved' | 'rejected';

export interface Donation {
  id: string;
  donorName: string;
  donorEmail: string;
  amount: number;
  receiptUrl: string | null;
  note: string | null;
  status: DonationStatus;
  rejectionReason: string | null;
  donorUserId: string | null;
  reviewedByUserId: string | null;
  reviewedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface DonationSummary {
  total: number;
  pending: number;
  reviewed: number;
  approved: number;
  rejected: number;
  totalAmount: number;
  approvedAmount: number;
}

export interface CreateDonationFormData {
  donorName: string;
  donorEmail: string;
  amount: number;
  note?: string;
  receipt?: File;
}

export interface DonationFilters {
  page?: number;
  pageSize?: number;
  status?: DonationStatus | '';
}

// --- volunteers ---
export type VolunteerStatus = 'pending' | 'approved' | 'rejected';

export interface Volunteer {
  id: string;
  studentName: string;
  studentId: string;
  age: number;
  faculty: string;
  interests: string;
  userId: string | null;
  status: VolunteerStatus;
  createdAt: string;
  updatedAt: string;
}

export interface CreateVolunteerFormData {
  studentName: string;
  studentId: string;
  age: number;
  faculty: string;
  interests: string;
}

// --- care history ---
export type CareType = 'feeding' | 'medical' | 'grooming' | 'shelter' | 'rescue' | 'other';

export interface CareHistoryEntry {
  id: string;
  catId: string;
  careType: CareType;
  description: string;
  performedBy: string;
  performedByUserId: string | null;
  createdAt: string;
}

// --- user activity / history timeline ---
// Unified shape for every action a user has taken across CatCare.
export type ActivityType =
  | 'cat_created'
  | 'care_logged'
  | 'emergency_reported'
  | 'donation_made'
  | 'volunteer_applied'
  | 'volunteer_status_changed';

export type ActivityResourceType =
  | 'cat'
  | 'care_history'
  | 'emergency'
  | 'donation'
  | 'volunteer';

export interface UserActivity {
  id: string;
  type: ActivityType;
  title: string;
  description: string;
  status: string | null;
  resourceId: number;
  resourceType: ActivityResourceType;
  href: string | null;
  createdAt: string;
}

export interface ActivitySummary {
  totalCats: number;
  totalCareActions: number;
  totalEmergencies: number;
  totalDonations: number;
  totalDonationAmount: number;
  approvedDonationAmount: number;
  volunteerStatus: string | null;
  totalActivities: number;
}

export interface UserActivityResponse {
  activities: UserActivity[];
  summary: ActivitySummary;
}

// --- views / pages ---
// Routing is now handled by Next.js App Router — no AppView type needed.

// --- form data ---
export interface LoginFormData {
  email: string;
  password: string;
}

export interface RegisterFormData {
  fullName: string;
  email: string;
  password: string;
}

export interface CreateCatFormData {
  nickname: string;
  description: string;
  photo?: File;
  locationName: string;
  latitude?: number;
  longitude?: number;
  healthStatus: HealthStatus;
  ownershipTag: OwnershipTag;
}

export interface CreateEmergencyFormData {
  catId?: string;
  title: string;
  description: string;
  emergencyType: EmergencyType;
  priority: Priority;
  locationName: string;
  latitude?: number;
  longitude?: number;
}

// --- filters ---
export interface CatFilters {
  page?: number;
  pageSize?: number;
  search?: string;
  healthStatus?: HealthStatus | '';
}

export interface EmergencyFilters {
  page?: number;
  pageSize?: number;
  status?: EmergencyStatus | '';
  priority?: Priority | '';
}
