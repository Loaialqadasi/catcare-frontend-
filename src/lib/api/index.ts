// Mohamed Abdelgawwad — CCU-S1-04 | Foundation Module
// Barrel re-export — single import surface for all API code.
//
// Consumers can do:
//   import { fetchCats, login, type AdminUser } from '@/lib/api-client';
// (the legacy path re-exports from here) OR
//   import { fetchCats } from '@/lib/api/cats';
// for tree-shakable per-domain imports.

export * from './client';
export * from './auth';
export * from './cats';
export * from './emergencies';
export * from './donations';
export * from './volunteers';
export * from './map';
export * from './activity';

// Normalizers are not part of the public surface but are exported for tests.
export {
  normalizeCat,
  normalizeCareHistory,
  normalizeDonation,
  normalizeEmergency,
  normalizeUser,
  normalizeVolunteer,
} from './normalizers';
