import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  // Capture all server-side traces — server functions are cheap to trace.
  tracesSampleRate: process.env.NODE_ENV === "production" ? 0.2 : 1.0,

  enabled: process.env.NODE_ENV === "production",

  environment: process.env.NODE_ENV,

  // Ignore noisy errors that are not actionable.
  ignoreErrors: [
    // Firebase auth errors that users cause themselves
    "auth/user-not-found",
    "auth/wrong-password",
    "auth/email-already-in-use",
    "auth/too-many-requests",
    // Next.js navigation
    "NEXT_NOT_FOUND",
    "NEXT_REDIRECT",
  ],
});
