// Mohamed Abdelgawwad — CCU-S1-04 | Foundation Module
// Raw API response shapes — mirror what the backend actually sends over the wire.
// Normalizers in `./normalizers.ts` convert these into the strongly-typed
// domain models declared in `../types.ts`.

export interface RawUser {
  id: number;
  fullName: string;
  email: string;
  role: string;
  emailVerified: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface RawCat {
  id: number;
  nickname: string;
  description: string | null;
  photoUrl: string | null;
  locationName: string;
  latitude: number | null;
  longitude: number | null;
  healthStatus: string;
  ownershipTag: string;
  createdByUserId: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface RawEmergency {
  id: number;
  catId: number | null;
  title: string;
  description: string;
  emergencyType: string;
  priority: string;
  status: string;
  locationName: string;
  latitude: number | null;
  longitude: number | null;
  reportedByUserId: number | null;
  createdAt: string;
  updatedAt: string;
  resolvedAt: string | null;
  cat: { id: number; nickname: string } | null;
}

export interface RawDonation {
  id: number;
  donorName: string;
  donorEmail: string;
  amount: number;
  receiptUrl: string | null;
  note: string | null;
  status: string;
  rejectionReason: string | null;
  donorUserId: number | null;
  reviewedByUserId: number | null;
  reviewedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface RawCareHistory {
  id: number;
  catId: number;
  careType: string;
  description: string;
  performedBy: string;
  performedByUserId: number | null;
  createdAt: string;
}

export interface RawVolunteer {
  id: number;
  studentName: string;
  studentId: string;
  age: number;
  faculty: string;
  interests: string;
  userId: number | null;
  status: string;
  createdAt: string;
  updatedAt: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// User Activity timeline — returned by GET /api/auth/me/activity
// ─────────────────────────────────────────────────────────────────────────────
// Each entry represents one user action across the CatCare platform
// (registering a cat, reporting an emergency, donating, volunteering, etc.).

export type RawActivityType =
  | 'cat_created'
  | 'care_logged'
  | 'emergency_reported'
  | 'donation_made'
  | 'volunteer_applied'
  | 'volunteer_status_changed';

export type RawActivityResourceType =
  | 'cat'
  | 'care_history'
  | 'emergency'
  | 'donation'
  | 'volunteer';

export interface RawUserActivity {
  id: string;
  type: RawActivityType;
  title: string;
  description: string;
  status: string | null;
  resourceId: number;
  resourceType: RawActivityResourceType;
  href: string | null;
  createdAt: string;
}

export interface RawActivitySummary {
  totalCats: number;
  totalCareActions: number;
  totalEmergencies: number;
  totalDonations: number;
  totalDonationAmount: number;
  approvedDonationAmount: number;
  volunteerStatus: string | null;
  totalActivities: number;
}

export interface RawUserActivityResponse {
  activities: RawUserActivity[];
  summary: RawActivitySummary;
}

// Backend envelope: { success: true, data: T } | { success: false, error: {...} }
export interface ApiEnvelope<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: {
      issues?: { fieldErrors?: Record<string, string[]> };
    };
  };
}
