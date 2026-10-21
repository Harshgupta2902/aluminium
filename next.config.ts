import type { NextConfig } from "next";

// Supabase origin (for CSP connect-src). Falls back to wildcard *.supabase.co
// if the env var isn't available at build time.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const supabaseOrigin = (() => {
  try {
    return new URL(supabaseUrl).origin;
  } catch {
    return "https://*.supabase.co";
  }
})();
const supabaseWs = supabaseOrigin.replace(/^http/, "ws");

/**
 * Content-Security-Policy.
 * - 'unsafe-inline' is kept for styles (Tailwind + inline styles in the canvas
 *   designer) and scripts (Next.js inlines a small bootstrap). Tightening to
 *   nonces is a larger change; this is a pragmatic, app-safe baseline.
 * - connect-src allows Supabase REST + Realtime (wss).
 * - img-src allows data:/blob: for the canvas previews and Supabase storage.
 */
const csp = [
  "default-src 'self'",
  "base-uri 'self'",
  "object-src 'none'",
  "frame-ancestors 'none'",
  "form-action 'self'",
  // 'unsafe-inline' kept for Next.js App Router inline bootstrap/flight scripts
  // and the JSON-LD block. 'unsafe-eval' removed — no client dep needs it.
  "script-src 'self' 'unsafe-inline'",
  // 'unsafe-inline' kept for Tailwind + the canvas designer's inline style=.
  "style-src 'self' 'unsafe-inline'",
  // Narrowed from a blanket https: to just what's used (self/data/blob + Supabase storage).
  `img-src 'self' data: blob: ${supabaseOrigin}`,
  "font-src 'self' data:",
  `connect-src 'self' ${supabaseOrigin} ${supabaseWs}`,
  "worker-src 'self' blob:",
  "frame-src 'self'",
  "manifest-src 'self'",
  "upgrade-insecure-requests",
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: csp },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), interest-cohort=()",
  },
  { key: "X-DNS-Prefetch-Control", value: "on" },
];

const nextConfig: NextConfig = {
  cacheComponents: false,
  partialPrefetching: false,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
