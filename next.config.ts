import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV === "development";
const allowedEmbedDomain = process.env.ALLOWED_EMBED_DOMAIN || "";

// In dev mode Turbopack requires 'unsafe-eval' and 'unsafe-inline' for HMR.
// In production the strict CSP is enforced.
const cspBase = (extra: string) =>
  isDev
    ? `default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; connect-src 'self' ws: wss: https://*.tile.openstreetmap.org; font-src 'self'; frame-src 'none'; object-src 'none'; base-uri 'self'${extra}`
    : `default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; connect-src 'self' https://*.tile.openstreetmap.org; font-src 'self'; frame-src 'none'; object-src 'none'; base-uri 'self'${extra}`;

// Regular routes: no embedding allowed
const csp = cspBase("; frame-ancestors 'none'");

// Embed routes: embedding from allowed domain only
const frameAncestors = allowedEmbedDomain ? `'self' ${allowedEmbedDomain}` : "'self'";
const embedCsp = cspBase(`; frame-ancestors ${frameAncestors}`);

const sharedHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
];

const nextConfig: NextConfig = {
  headers: async () => [
    {
      // All non-embed routes: full iframe lockdown
      source: "/((?!embed).*)",
      headers: [
        { key: "X-Frame-Options", value: "DENY" },
        ...sharedHeaders,
        { key: "Content-Security-Policy", value: csp },
      ],
    },
    {
      // Embed routes: allow framing from ALLOWED_EMBED_DOMAIN only
      // No X-Frame-Options — CSP frame-ancestors takes precedence in modern browsers
      source: "/embed/(.*)",
      headers: [
        ...sharedHeaders,
        { key: "Content-Security-Policy", value: embedCsp },
      ],
    },
  ],
};

export default nextConfig;
