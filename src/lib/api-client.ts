// Mohamed Abdelgawwad — CCU-S1-04 | Foundation Module
//
// Legacy entry point — kept for backward compatibility with existing imports
// across the codebase (`import { ... } from '@/lib/api-client'`).
//
// The actual implementation now lives in `./api/*`:
//   • ./api/client.ts       — apiFetch, CSRF, refresh, readEnvelope
//   • ./api/auth.ts         — login, register, getMe, logout, user mgmt, passwords
//   • ./api/cats.ts         — CRUD + restore + care history
//   • ./api/emergencies.ts  — list / get / create / status / priority feed
//   • ./api/donations.ts    — list / get / create / review / approve / reject / summary
//   • ./api/volunteers.ts   — apply / list mine / list all / update status
//   • ./api/map.ts          — geocode / places
//   • ./api/normalizers.ts  — raw → typed domain models
//   • ./api/types.ts        — Raw* response shapes
//
// New code should import from `@/lib/api/<domain>` directly for better
// tree-shaking and clearer dependency graphs.

export * from './api/index';
