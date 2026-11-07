import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  // Capture 10% of transactions for performance monitoring in production,
  // 100% in development so you can see traces locally.
  tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,

  // Capture 10% of sessions for session replay in production.
  replaysSessionSampleRate: 0.1,

  // Always capture replays when an error occurs.
  replaysOnErrorSampleRate: 1.0,

  // Only load the replay integration in the browser (it's large).
  integrations: [
    Sentry.replayIntegration({
      // Mask all text and inputs by default to protect user privacy.
      maskAllText: true,
      blockAllMedia: true,
    }),
  ],

  // Don't send events in development unless explicitly enabled.
  enabled: process.env.NODE_ENV === "production",

  // Tag every event with the environment so you can filter in the dashboard.
  environment: process.env.NODE_ENV,
});
