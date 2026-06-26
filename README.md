# CatCare UTM — Frontend

A comprehensive campus cat management system for Universiti Teknologi Malaysia. Built with Next.js 16 (App Router), React 19, Tailwind CSS 4, and shadcn/ui.

## Tech Stack

| Layer            | Technology                                              |
| ---------------- | ------------------------------------------------------- |
| Framework        | Next.js 16 (App Router, RSC)                            |
| UI Library       | React 19                                                 |
| Styling          | Tailwind CSS 4 + `tw-animate-css`                        |
| Components       | shadcn/ui (Radix primitives)                            |
| State Management | Zustand (auth + data cache)                             |
| Forms            | react-hook-form + Zod                                    |
| Maps             | Leaflet + react-leaflet                                  |
| Toasts           | sonner                                                   |
| Testing          | Vitest + @testing-library/react                          |
| Type Checking    | TypeScript 5 (`strict: true`)                           |
| Linting          | ESLint 9 + eslint-config-next                            |

## Getting Started

```bash
# 1. Install dependencies
npm install

# 2. Configure environment
cp .env.example .env.local
# Edit .env.local — set BACKEND_URL to your backend's root URL
# (e.g. http://localhost:10000 for local dev, https://your-backend.onrender.com for prod)

# 3. Run dev server
npm run dev
# → http://localhost:3000
```

### API connection modes

The frontend supports two ways to talk to the backend:

| Mode | Env var | When to use | Cookies |
|------|---------|-------------|---------|
| **Proxy (recommended)** | `BACKEND_URL=https://backend.example.com` | Production, normal dev | Same-origin (no third-party cookie issues) |
| **Direct (debug only)** | `NEXT_PUBLIC_API_URL=https://backend.example.com/api` | Debugging raw network traffic | Cross-origin (may be blocked by Chrome 120+) |

The proxy mode is configured in `next.config.ts` via `rewrites()`. The browser calls `/api/*` on the frontend's own domain, and Next.js forwards the request to `BACKEND_URL`. This makes all cookies first-party, avoiding the `SameSite=None` third-party cookie blocking that prevents login on modern browsers.

## Scripts

| Script                    | What it does                                              |
| ------------------------- | --------------------------------------------------------- |
| `npm run dev`             | Start the dev server on port 3000                         |
| `npm run build`           | Production build                                          |
| `npm run start`           | Start the production server                               |
| `npm run lint`            | Run ESLint                                                |
| `npm run typecheck`       | Run TypeScript compiler (`tsc --noEmit`)                  |
| `npm run test`            | Run Vitest unit tests once                                |
| `npm run test:watch`      | Run Vitest in watch mode                                  |
| `npm run test:coverage`   | Run tests with V8 coverage                                |
| `npm run verify`          | `typecheck && lint && test` — the CI gate                 |

## Project Structure

```
src/
├── app/                          # Next.js App Router
│   ├── (auth)/                   # Public auth route group (login, register, …)
│   ├── (main)/                   # Authenticated route group (dashboard, cats, …)
│   │   ├── admin/                # Admin-only pages (users, cats, emergencies, …)
│   │   ├── cats/                 # Cat list / detail / create
│   │   ├── emergencies/          # Emergency list / detail / create
│   │   ├── donations/            # Donation list / detail / create
│   │   ├── map/                  # Interactive campus map
│   │   ├── volunteers/           # Volunteer application form
│   │   ├── profile/              # User profile + password change
│   │   ├── dashboard/            # Authenticated home page
│   │   ├── error.tsx             # Route-level error boundary
│   │   ├── loading.tsx           # Route-level loading skeleton
│   │   └── layout.tsx            # Authenticated layout (sidebar + header)
│   ├── error.tsx                 # Global route error boundary
│   ├── global-error.tsx          # Last-resort error boundary (replaces <html>)
│   ├── loading.tsx               # Global loading skeleton
│   ├── not-found.tsx             # 404 page
│   ├── layout.tsx                # Root layout (<html>, <body>, Toaster)
│   └── page.tsx                  # / → redirects to /dashboard
├── components/
│   ├── ui/                       # shadcn/ui primitives (button, card, dialog, …)
│   ├── auth/                     # login-form, register-form
│   ├── cats/                     # cat-card, cat-list, cat-detail, create-cat-form
│   ├── emergencies/              # emergency-card, emergency-list, emergency-detail, …
│   ├── donations/                # my-donations, create-donation-form, admin dashboard
│   ├── dashboard/                # stats-cards, recent-cats, recent-emergencies
│   ├── layout/                   # sidebar, header
│   ├── map/                      # location-picker (click-to-pin + place search)
│   └── profile/                  # user-profile
├── lib/
│   ├── api/                      # ← Domain-split API client (NEW)
│   │   ├── client.ts             # apiFetch, CSRF, refresh, readEnvelope
│   │   ├── auth.ts               # login, register, getMe, logout, users, passwords
│   │   ├── cats.ts               # CRUD + restore + care history
│   │   ├── emergencies.ts        # list / get / create / status / priority feed
│   │   ├── donations.ts          # list / get / create / review / approve / reject
│   │   ├── volunteers.ts         # apply / list mine / list all / update status
│   │   ├── map.ts                # geocode / places
│   │   ├── normalizers.ts        # raw → typed domain models
│   │   ├── types.ts              # Raw* response shapes
│   │   └── index.ts              # Barrel re-export
│   ├── api-client.ts             # ← Legacy re-export from ./api (kept for compat)
│   ├── store.ts                  # Zustand auth store + data cache
│   ├── types.ts                  # Frontend domain types (User, Cat, …)
│   ├── validators.ts             # Zod schemas for forms
│   └── utils.ts                  # cn() and other small helpers
├── hooks/
│   └── use-mobile.ts             # useIsMobile hook
├── __tests__/                    # Vitest unit tests
│   ├── setup.ts                  # Test environment setup
│   ├── api-client.test.ts        # apiFetch, CSRF, 401 refresh, dedupe
│   ├── middleware.test.ts        # Route-protection edge middleware
│   ├── normalizers.test.ts       # Raw → typed model conversions
│   └── store.test.ts             # Zustand auth + data cache
└── middleware.ts                 # Edge middleware — auth-gate at the edge
```

## Architecture Decisions

### 1. Domain-split API client

The original `api-client.ts` was a 1034-line god-module containing every API
call, every normalizer, the CSRF logic, and the token refresh logic. It has
been split into `src/lib/api/<domain>.ts` modules:

- **`client.ts`** — `apiFetch`, CSRF, refresh, `readEnvelope`. No domain logic.
- **`auth.ts`** — auth + user management + password flows.
- **`cats.ts`, `emergencies.ts`, `donations.ts`, `volunteers.ts`, `map.ts`**
  — one module per backend resource.
- **`normalizers.ts`** — all raw → typed conversions, centralized.
- **`types.ts`** — Raw* response shapes (mirror of backend wire format).

The legacy `src/lib/api-client.ts` is kept as a one-line re-export for
backward compatibility — existing imports keep working.

### 2. Edge middleware for route protection

`src/middleware.ts` runs at the edge before any page renders. It checks for
the presence of the `token` or `refreshToken` HttpOnly cookie:

- **No cookie + protected route** → redirect to `/login?redirect=...`
- **Cookie present + `/`** → redirect to `/dashboard`
- **Otherwise** → let the request through

The cookie presence is a *hint*, not an auth proof. The `(main)` layout
calls `getMe()` to actually validate the JWT, and the `apiFetch` client
transparently refreshes the access token via `/auth/refresh` on 401. This
two-layer approach gives us instant redirects without sacrificing security.

### 3. Next.js App Router conventions

- `app/error.tsx` — route-level error boundary (catches runtime errors)
- `app/global-error.tsx` — last-resort boundary (replaces `<html>`)
- `app/loading.tsx` — automatic loading skeleton during route transitions
- `app/not-found.tsx` — 404 page
- `app/(main)/error.tsx` + `app/(main)/loading.tsx` — segment-level equivalents

### 4. Comprehensive test suite

37 unit tests cover:

- **Normalizers** (7 tests) — every raw → typed conversion
- **apiFetch** (8 tests) — CSRF attachment, 401 refresh + retry, CSRF dedupe
- **Zustand store** (10 tests) — auth state + data cache freshness logic
- **Middleware** (12 tests) — every public/protected/redirect path

Run with `npm run test` (or `npm run test:watch` for TDD).

### 5. CI pipeline

`.github/workflows/ci.yml` runs on every push and pull request:

- **Frontend**: typecheck, lint, test, production build (parallel jobs)
- **Backend**: typecheck, unit tests

All jobs must pass before merge to `main`.

## Security

- **JWT in HttpOnly cookies** — never exposed to client-side JS
- **CSRF protection** — double-submit cookie pattern, with automatic refresh
  on `CSRF_INVALID` (one retry)
- **Automatic token refresh** — every 12 minutes (token lasts 15 min)
- **Session expiry handling** — `apiFetch` intercepts 401, attempts refresh,
  and force-logs-out only if refresh fails
- **Edge-level auth gate** — middleware redirects unauthenticated users
  before any protected UI is rendered

## Accessibility

- Skip-to-content link in the root layout
- `aria-busy` / `aria-live` regions on loading + error states
- `sr-only` text on icon-only buttons
- Semantic HTML (`<main>`, `<header>`, `<nav>`, `<button>`)
- Keyboard-focusable interactive elements via Radix primitives

## License

Internal capstone project — Universiti Teknologi Malaysia.
