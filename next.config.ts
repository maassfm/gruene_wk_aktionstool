import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV === "development";

// In dev mode Turbopack requires 'unsafe-eval' and 'unsafe-inline' for HMR.
// In production the strict CSP is enforced.
const csp = isDev
  ? "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; connect-src 'self' ws: wss: https://*.tile.openstreetmap.org; font-src 'self'; frame-src 'none'; object-src 'none'; base-uri 'self'"
  : "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; connect-src 'self' https://*.tile.openstreetmap.org; font-src 'self'; frame-src 'none'; object-src 'none'; base-uri 'self'";

const nextConfig: NextConfig = {
  headers: async () => [
    {
      source: "/(.*)",
      headers: [
        { key: "X-Frame-Options", value: "DENY" },
        { key: "X-Content-Type-Options", value: "nosniff" },
        { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        { key: "Content-Security-Policy", value: csp },
      ],
    },
  ],
};

export default nextConfig;
