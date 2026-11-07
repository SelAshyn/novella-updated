import posthog from "posthog-js"

/**
 * Analytics event tracking utilities for Novella
 * 
 * Use these functions to track key user actions throughout the app.
 * PostHog will automatically capture pageviews, but these help you understand
 * specific user behaviors and conversion funnels.
 */

export const analytics = {
  // ━━━ Authentication Events ━━━
  signUp: (method: "email" | "google") => {
    posthog.capture("user_signed_up", { method })
  },

  signIn: (method: "email" | "google") => {
    posthog.capture("user_signed_in", { method })
  },

  signOut: () => {
    posthog.capture("user_signed_out")
    posthog.reset() // Clear user identity
  },

  // Identify a user (call this after successful login)
  identify: (userId: string, properties?: Record<string, any>) => {
    posthog.identify(userId, properties)
  },

  // ━━━ Reading & Library Events ━━━
  bookAdded: (bookId: string, title: string) => {
    posthog.capture("book_added", { book_id: bookId, book_title: title })
  },

  bookRemoved: (bookId: string) => {
    posthog.capture("book_removed", { book_id: bookId })
  },

  // ━━━ Vocabulary Events ━━━
  wordHighlighted: (word: string, bookId: string) => {
    posthog.capture("word_highlighted", { word, book_id: bookId })
  },

  wordLookedUp: (word: string, bookId: string) => {
    posthog.capture("word_looked_up", { word, book_id: bookId })
  },

  // ━━━ Quote Events ━━━
  quoteSaved: (quoteLength: number, bookId: string) => {
    posthog.capture("quote_saved", {
      quote_length: quoteLength,
      book_id: bookId,
    })
  },

  quoteDeleted: (quoteId: string) => {
    posthog.capture("quote_deleted", { quote_id: quoteId })
  },

  // ━━━ Review & Learning Events ━━━
  reviewStarted: (type: "vocabulary" | "quotes") => {
    posthog.capture("review_started", { review_type: type })
  },

  reviewCompleted: (type: "vocabulary" | "quotes", itemsReviewed: number) => {
    posthog.capture("review_completed", {
      review_type: type,
      items_reviewed: itemsReviewed,
    })
  },

  // ━━━ Classroom Events ━━━
  classCreated: (classId: string, className: string) => {
    posthog.capture("class_created", { class_id: classId, class_name: className })
  },

  classJoined: (classId: string) => {
    posthog.capture("class_joined", { class_id: classId })
  },

  assignmentCreated: (assignmentId: string, classId: string) => {
    posthog.capture("assignment_created", {
      assignment_id: assignmentId,
      class_id: classId,
    })
  },

  assignmentCompleted: (assignmentId: string) => {
    posthog.capture("assignment_completed", { assignment_id: assignmentId })
  },

  // ━━━ Engagement Events ━━━
  feedbackSubmitted: (type: "bug" | "feature" | "general") => {
    posthog.capture("feedback_submitted", { feedback_type: type })
  },

  settingsUpdated: (setting: string) => {
    posthog.capture("settings_updated", { setting })
  },

  themeChanged: (theme: "light" | "dark" | "system") => {
    posthog.capture("theme_changed", { theme })
  },

  // ━━━ Feature Discovery Events ━━━
  featureDiscovered: (feature: string) => {
    posthog.capture("feature_discovered", { feature })
  },

  tooltipViewed: (tooltip: string) => {
    posthog.capture("tooltip_viewed", { tooltip })
  },

  // ━━━ Error Events ━━━
  errorEncountered: (error: string, context?: Record<string, any>) => {
    posthog.capture("error_encountered", { error, ...context })
  },
}

/**
 * Helper to check if PostHog is enabled
 * (useful for conditional tracking in dev vs prod)
 */
export const isAnalyticsEnabled = () => {
  return typeof window !== "undefined" && !!process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN
}
