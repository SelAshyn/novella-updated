"use client";

import * as Sentry from "@sentry/nextjs";
import posthog from "posthog-js";
import { useEffect } from "react";

/**
 * global-error.tsx catches unhandled errors in the root layout and reports
 * them to Sentry and PostHog. It replaces the entire page, so it must include <html> and
 * <body> tags.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
    posthog.captureException(error);
  }, [error]);

  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
          background: "#f5f3ef",
          display: "flex",
          minHeight: "100vh",
          alignItems: "center",
          justifyContent: "center",
          padding: "2rem",
        }}
      >
        <div
          style={{
            maxWidth: 480,
            width: "100%",
            background: "#fff",
            borderRadius: 20,
            padding: "2.5rem",
            textAlign: "center",
            boxShadow: "0 4px 24px rgba(0,0,0,0.07)",
          }}
        >
          <div style={{ fontSize: 40, marginBottom: "1rem" }}>📚</div>
          <h1
            style={{
              fontFamily: "Georgia, serif",
              fontSize: 24,
              fontWeight: 600,
              color: "#1c1917",
              margin: "0 0 0.75rem",
            }}
          >
            Something went wrong
          </h1>
          <p style={{ fontSize: 14, color: "#57534e", lineHeight: 1.7, margin: "0 0 1.5rem" }}>
            An unexpected error occurred. The team has been notified automatically.
          </p>
          <button
            onClick={reset}
            style={{
              background: "#1c1917",
              color: "#fff",
              border: "none",
              borderRadius: 12,
              padding: "0.75rem 2rem",
              fontSize: 14,
              fontWeight: 600,
              cursor: "pointer",
              marginBottom: "0.75rem",
              width: "100%",
            }}
          >
            Try again
          </button>
          <a
            href="/"
            style={{
              display: "block",
              fontSize: 13,
              color: "#78716c",
              textDecoration: "none",
            }}
          >
            ← Back to home
          </a>
        </div>
      </body>
    </html>
  );
}
