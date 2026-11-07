import type { NextConfig } from "next"
import { withSentryConfig } from "@sentry/nextjs/config"

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Frame-Options",        value: "DENY" },
          { key: "X-Content-Type-Options",  value: "nosniff" },
          { key: "Referrer-Policy",         value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy",      value: "camera=(), microphone=(), geolocation=()" },
        ],
      },
    ]
  },
}

export default withSentryConfig(nextConfig, {
  // Your Sentry organization and project slugs (set these after creating a project at sentry.io)
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,

  // Auth token for uploading source maps (set SENTRY_AUTH_TOKEN in your CI/Vercel env)
  authToken: process.env.SENTRY_AUTH_TOKEN,

  // Upload source maps to Sentry during production builds so stack traces
  // map back to your original TypeScript source.
  sourcemaps: {
    disable: false,
    deleteSourcemapsAfterUpload: true,
  },

  // Silence the Sentry CLI output during builds.
  silent: !process.env.CI,

  // Automatically instrument Next.js Server Components and Route Handlers.
  webpack: {
    autoInstrumentServerFunctions: true,
    autoInstrumentAppDirectory: true,
  },

  // Include Next.js-internal code and code from dependencies when uploading source maps.
  widenClientFileUpload: true,

  // Annotate React components for better error tracking.
  reactComponentAnnotation: {
    enabled: true,
  },
})
