import type { NextConfig } from "next";

// Backend URL for the Next.js rewrite proxy.
//
// In production: set BACKEND_URL on Vercel (server-side env var, NOT
// NEXT_PUBLIC_*). The proxy forwards /api/* requests to this URL. The browser
// only ever sees same-origin requests — no CORS, no SameSite=None cookies, no
// third-party cookie blocking. This is the standard production setup for a
// split Next.js + Express architecture.
//
// In local dev: set BACKEND_URL=http://localhost:10000 in .env.local, OR set
// NEXT_PUBLIC_API_URL=http://localhost:10000/api to bypass the proxy and call
// the backend directly (useful for debugging).
const BACKEND_URL = process.env.BACKEND_URL || process.env.NEXT_PUBLIC_API_URL || "http://localhost:10000";

const nextConfig: NextConfig = {
  // CRIT-07 Fix: Remove ignoreBuildErrors — fix underlying TS errors instead
  // CRIT-08 Fix: Enable React Strict Mode to catch real bugs
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
      },
      {
        protocol: "https",
        hostname: "unpkg.com",
      },
      // Supabase Storage — supports both standard and custom domains
      {
        protocol: "https",
        hostname: "*.supabase.co",
      },
      {
        protocol: "https",
        hostname: "supabase.com",
      },
      // Placecats placeholder
      {
        protocol: "https",
        hostname: "placecats.com",
      },
      // Backend host — serves uploaded cat/donation photos
      // Update this if your backend is hosted elsewhere
      {
        protocol: "https",
        hostname: "catcare-backend.onrender.com",
      },
    ],
  },
  // ─── API proxy ────────────────────────────────────────────────────────────
  // Forward all /api/* requests to the backend. The browser only sees same-origin
  // requests, so cookies are first-party (SameSite=Lax works, no third-party
  // blocking). This is the fix for "I can log in but immediately get sent back
  // to the login page" on cross-origin deployments (Vercel frontend + Render
  // backend) where SameSite=None cookies are increasingly blocked by browsers.
  //
  // The proxy is skipped if NEXT_PUBLIC_API_URL is set — in that case the
  // frontend calls the backend directly (cross-origin). This is useful for
  // local dev where you want to inspect raw network traffic to the backend.
  async rewrites() {
    // If the frontend is configured to call the backend directly, don't install
    // the proxy — it would shadow the direct calls.
    if (process.env.NEXT_PUBLIC_API_URL) {
      return [];
    }
    return [
      {
        source: "/api/:path*",
        destination: `${BACKEND_URL}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
