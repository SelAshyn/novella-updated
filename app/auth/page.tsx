"use client"

import { useEffect, useRef, useState } from "react"
import Link from "next/link"
import { Plus_Jakarta_Sans, Newsreader } from "next/font/google"
import { ArrowLeft, BookOpen, Eye, EyeOff, Sparkles } from "lucide-react"
import { useTheme } from "next-themes"
import ThemeToggle from "@/components/landing/theme-toggle"
import { auth } from "@/lib/firebase"
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, updateProfile, signInWithCustomToken, updatePassword } from "firebase/auth"
import { FirebaseError } from "firebase/app"
import { useRouter } from "next/navigation"
import { useAuth } from "@/components/landing/auth-provider"
import { Turnstile, type TurnstileInstance } from "@marsidev/react-turnstile"
import posthog from "posthog-js"

const reading = Newsreader({ subsets: ["latin"], style: ["normal", "italic"], weight: ["400", "500", "600"], display: "swap" })
const body = Plus_Jakarta_Sans({ subsets: ["latin"], weight: ["400", "500", "600"], display: "swap" })

// ── Quotes ────────────────────────────────────────────────────────────────────

type Quote = { before: string; highlight: string; after: string; source: string; note: string }

const QUOTES: Quote[] = [
  {
    before: "It is ",
    highlight: "a truth universally acknowledged",
    after: ", that a single man in possession of a good fortune, must be in want of a wife.",
    source: "Pride and Prejudice, Jane Austen (1813)",
    note: "She calls it a truth, but it reads as a joke. Compare with how chapter 1 ends.",
  },
  {
    before: "It was ",
    highlight: "the best of times, it was the worst of times",
    after: ", it was the age of wisdom, it was the age of foolishness.",
    source: "A Tale of Two Cities, Charles Dickens (1859)",
    note: "Opposites in every clause. Track how long he keeps it up.",
  },
  {
    before: "Call me Ishmael. Some years ago, never mind how long precisely, having little or no money in my purse, and nothing particular to interest me on shore, ",
    highlight: "I thought I would sail about a little and see the watery part of the world",
    after: ".",
    source: "Moby-Dick, Herman Melville (1851)",
    note: "He says “call me”, not “I am”. Is he hiding something?",
  },
  {
    before: "",
    highlight: "Happy families are all alike",
    after: "; every unhappy family is unhappy in its own way.",
    source: "Anna Karenina, Leo Tolstoy (trans. Constance Garnett)",
    note: "Test this against every family in the book.",
  },
  {
    before: "I am no bird; and no net ensnares me: ",
    highlight: "I am a free human being with an independent will",
    after: ".",
    source: "Jane Eyre, Charlotte Brontë (1847)",
    note: "Her reply to Rochester. She defines herself against a bird first.",
  },
  {
    before: "“And what is the use of a book,” thought Alice, “",
    highlight: "without pictures or conversations",
    after: "?”",
    source: "Alice’s Adventures in Wonderland, Lewis Carroll (1865)",
    note: "The book makes fun of itself on the first page.",
  },
  {
    before: "Nothing is so painful to the human mind as ",
    highlight: "a great and sudden change",
    after: ".",
    source: "Frankenstein, Mary Shelley (1818)",
    note: "Plain and hard to argue with. Mark where the story proves it.",
  },
  {
    before: "There is no such thing as a moral or an immoral book. ",
    highlight: "Books are well written, or badly written.",
    after: " That is all.",
    source: "The Picture of Dorian Gray, Oscar Wilde (1890)",
    note: "From the preface. Is he arguing, or just announcing?",
  },
]

// ── Types & constants ─────────────────────────────────────────────────────────

type Mode = "sign-in" | "sign-up"
type FieldName = "name" | "email" | "password" | "confirmPassword" | "dateOfBirth" | "acceptedTerms"
type Errors = Partial<Record<FieldName, string>>

const MIN_AGE = 13
const MIN_PASSWORD_LENGTH = 8
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const FIELD_ORDER: FieldName[] = ["name", "email", "password", "confirmPassword", "dateOfBirth", "acceptedTerms"]

// ── Helpers ───────────────────────────────────────────────────────────────────

function toDateInputValue(date: Date) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, "0")
  const d = String(date.getDate()).padStart(2, "0")
  return `${y}-${m}-${d}`
}

function getAge(dateOfBirth: string, today = new Date()) {
  const dob = new Date(dateOfBirth + "T00:00:00")
  if (Number.isNaN(dob.getTime())) return null
  let age = today.getFullYear() - dob.getFullYear()
  const m = today.getMonth() - dob.getMonth()
  if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) age--
  return age
}

function messageFor(error: unknown) {
  const code = error instanceof FirebaseError ? error.code : ""
  if (code === "auth/email-already-in-use") return "An account with this email already exists. Sign in instead."
  if (code === "auth/invalid-credential") return "Email or password is incorrect."
  return "Something went wrong. Try again."
}

// ── Sub-components ────────────────────────────────────────────────────────────

const inputClass =
  "h-11 w-full rounded-xl border border-border/80 bg-card/60 px-3.5 text-sm text-foreground shadow-2xs transition-all duration-200 placeholder:text-muted-foreground/50 hover:border-border focus-visible:border-amber-500 focus-visible:ring-2 focus-visible:ring-amber-500/20 focus-visible:outline-none disabled:opacity-60 aria-[invalid=true]:border-destructive"

function Field({
  name,
  label,
  hint,
  error,
  action,
  className = "",
  children,
}: {
  name: FieldName
  label: string
  hint?: string
  error?: string
  action?: React.ReactNode
  className?: string
  children: React.ReactNode
}) {
  return (
    <div className={`space-y-1.5 ${className}`}>
      <div className="flex items-baseline justify-between gap-4">
        <label htmlFor={name} className="text-sm font-medium text-foreground">
          {label}
        </label>
        {action}
      </div>
      {children}
      {hint && (
        <p id={`${name}-hint`} className="text-xs text-muted-foreground">
          {hint}
        </p>
      )}
      {error && (
        <p id={`${name}-error`} className="text-xs text-destructive">
          {error}
        </p>
      )}
    </div>
  )
}

function Brand({ className = "" }: { className?: string }) {
  return (
    <Link
      href="/"
      className={`inline-flex items-center gap-2.5 transition-transform duration-200 hover:scale-[1.02] ${className}`}
    >
      <div className="flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
        <BookOpen className="size-4.5 stroke-[2.2]" aria-hidden="true" />
      </div>
      <div className="flex flex-col">
        <span className="font-serif text-2xl font-bold tracking-tight text-foreground leading-none">
          Novella
        </span>
        <span className="font-mono text-[9px] tracking-wider uppercase text-muted-foreground">
          Reading notebook
        </span>
      </div>
    </Link>
  )
}

function ShowHideButton({ show, onToggle }: { show: boolean; onToggle: () => void }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-label={show ? "Hide password" : "Show password"}
      aria-pressed={show}
      className="absolute right-0 top-0 flex size-11 items-center justify-center rounded-xl text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      {show
        ? <EyeOff className="size-4" strokeWidth={1.5} aria-hidden="true" />
        : <Eye className="size-4" strokeWidth={1.5} aria-hidden="true" />}
    </button>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function AuthPage() {
  const router = useRouter()
  const { user, loading } = useAuth()
  const { resolvedTheme } = useTheme()

  const [mode, setMode] = useState<Mode>("sign-in")
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [dateOfBirth, setDateOfBirth] = useState("")
  const [acceptedTerms, setAcceptedTerms] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [errors, setErrors] = useState<Errors>({})
  const [formError, setFormError] = useState("")
  const [pending, setPending] = useState(false)
  const [quoteIndex, setQuoteIndex] = useState<number | null>(null)
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null)
  const turnstileRef = useRef<TurnstileInstance>(null)

  const isSignUp = mode === "sign-up"

  // Redirect already-signed-in users
  useEffect(() => {
    if (!loading && user) router.replace("/dashboard")
  }, [loading, user, router])

  // Pick a random quote after mount to avoid hydration mismatch
  useEffect(() => {
    let last = -1
    try { last = Number(sessionStorage.getItem("novella:last-quote") ?? -1) } catch {}
    let next = Math.floor(Math.random() * QUOTES.length)
    if (next === last) next = (next + 1) % QUOTES.length
    requestAnimationFrame(() => setQuoteIndex(next))
    try { sessionStorage.setItem("novella:last-quote", String(next)) } catch {}
  }, [])

  // Support direct link to sign-up via #create hash
  useEffect(() => {
    if (window.location.hash === "#create") {
      requestAnimationFrame(() => setMode("sign-up"))
    }
  }, [])

  const quote = quoteIndex === null ? null : QUOTES[quoteIndex]

  const latestBirthDate = (() => {
    const d = new Date()
    d.setFullYear(d.getFullYear() - MIN_AGE)
    return toDateInputValue(d)
  })()

  function switchMode(next: Mode) {
    setMode(next)
    setErrors({})
    setFormError("")
    setPassword("")
    setConfirmPassword("")
    setAcceptedTerms(false)
    setShowPassword(false)
    turnstileRef.current?.reset()
    setTurnstileToken(null)
  }

  function describedBy(field: FieldName, hasHint = false) {
    const ids: string[] = []
    if (hasHint) ids.push(`${field}-hint`)
    if (errors[field]) ids.push(`${field}-error`)
    return ids.length ? ids.join(" ") : undefined
  }

  function validate(): Errors {
    const next: Errors = {}

    if (!EMAIL_PATTERN.test(email.trim())) {
      next.email = "Enter a valid email address, like name@example.com."
    }

    if (!password) {
      next.password = isSignUp
        ? `Enter a password with at least ${MIN_PASSWORD_LENGTH} characters.`
        : "Enter your password."
    } else if (isSignUp && password.length < MIN_PASSWORD_LENGTH) {
      next.password = `Use at least ${MIN_PASSWORD_LENGTH} characters.`
    }

    if (!isSignUp) return next

    if (!name.trim()) next.name = "Enter your name."

    if (!confirmPassword) {
      next.confirmPassword = "Re-enter your password to confirm it."
    } else if (password !== confirmPassword) {
      next.confirmPassword = "Passwords don't match."
    }

    const age = dateOfBirth ? getAge(dateOfBirth) : null
    if (age === null) {
      next.dateOfBirth = "Enter your date of birth."
    } else if (age < MIN_AGE) {
      next.dateOfBirth = `You must be at least ${MIN_AGE} to create an account.`
    }

    if (!acceptedTerms) next.acceptedTerms = "Agree to the Terms and Privacy Policy to continue."

    return next
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (pending) return

    const nextErrors = validate()
    setErrors(nextErrors)
    setFormError("")

    const firstInvalid = FIELD_ORDER.find((f) => nextErrors[f])
    if (firstInvalid) {
      document.getElementById(firstInvalid)?.focus()
      return
    }

    setPending(true)
    try {
      // ── 1. Turnstile check ──────────────────────────────────────────────
      const tsRes = await fetch("/api/auth/verify-turnstile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: turnstileToken, action: isSignUp ? "sign-up" : "sign-in" }),
      })
      if (!tsRes.ok) {
        const d = await tsRes.json().catch(() => ({}))
        setFormError(d.error || "Security check failed. Please try again.")
        turnstileRef.current?.reset()
        setTurnstileToken(null)
        return
      }

      // ── 2. Firebase auth ────────────────────────────────────────────────
      if (isSignUp) {
        // Don't create a Firebase account yet — just send the OTP.
        // The account will be created in verify-otp after the code is confirmed.
        const otpRes = await fetch("/api/auth/send-otp", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: email.trim(), name: name.trim(), password }),
        })
        const otpBody = await otpRes.json().catch(() => ({}))
        if (!otpRes.ok) {
          setFormError(otpBody.error || "Failed to send verification code. Please try again.")
          turnstileRef.current?.reset()
          setTurnstileToken(null)
          return
        }

        // Pass name + password via sessionStorage so verify-email page can finish signup
        sessionStorage.setItem("novella:pending-signup", JSON.stringify({ name: name.trim(), password }))
        router.push("/auth/verify-email?email=" + encodeURIComponent(email.trim()))
      } else {
        const { user: signedInUser } = await signInWithEmailAndPassword(auth, email.trim(), password)

        if (!signedInUser.emailVerified) {
          const token = await signedInUser.getIdToken()
          const otpRes = await fetch("/api/auth/send-otp", {
            method: "POST",
            headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
          })
          if (!otpRes.ok) {
            const body = await otpRes.json().catch(() => ({}))
            console.error("[auth] send-otp failed", otpRes.status, body)
          }
          router.push("/auth/verify-email?email=" + encodeURIComponent(email.trim()))
          return
        }

        posthog.capture("user_signed_in", { method: "email" })
        router.push("/dashboard")
      }
    } catch (error) {
      setFormError(messageFor(error))
      turnstileRef.current?.reset()
      setTurnstileToken(null)
    } finally {
      setPending(false)
    }
  }

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="grid min-h-screen bg-background text-foreground lg:grid-cols-[5fr_6fr]">

      {/* ── Left panel: decorative literary quote (theme-consistent) ──────── */}
      <aside
        className="hidden flex-col justify-between border-r border-border/70 bg-secondary/35 dark:bg-card/30 p-12 xl:p-16 lg:flex relative overflow-hidden"
        aria-hidden="true"
      >
        <Brand />

        {quote && (
          <figure className="my-auto max-w-lg py-12">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-card/80 px-3.5 py-1 shadow-2xs backdrop-blur-xs">
              <Sparkles className="size-3 text-amber-500" />
              <span className="font-mono text-[11px] font-semibold tracking-wider uppercase text-amber-600 dark:text-amber-400">
                From literature
              </span>
            </div>

            <blockquote
              className={`${reading.className} text-2xl font-normal leading-relaxed text-foreground xl:text-3xl xl:leading-snug`}
            >
              {quote.before}
              <mark className="rounded-md bg-amber-500/20 dark:bg-amber-400/25 px-2 py-0.5 text-foreground font-medium underline decoration-amber-500/40 decoration-wavy decoration-1 underline-offset-4">
                {quote.highlight}
              </mark>
              {quote.after}
            </blockquote>

            <figcaption className="mt-6 font-sans text-sm font-medium text-muted-foreground">
              — {quote.source}
            </figcaption>

            <div className="mt-8 rounded-xl border border-border/80 bg-card/70 p-4 border-l-4 border-l-amber-500 text-xs sm:text-sm leading-relaxed text-muted-foreground shadow-xs">
              <p className="font-mono text-[11px] font-semibold uppercase tracking-wider text-foreground/80 mb-1">
                Reading note
              </p>
              {quote.note}
            </div>
          </figure>
        )}

        <div className="text-xs text-muted-foreground/60 font-mono">
          Novella — Read deeply. Remember what you read.
        </div>
      </aside>

      {/* ── Right panel: auth form ────────────────────────────────────────── */}
      <section className="flex flex-col px-6 py-8 sm:px-12 lg:px-16 justify-between min-h-screen">
        {/* Top header navigation */}
        <div className="flex items-center justify-between">
          <Brand className="lg:hidden" />
          <div className="ml-auto flex items-center gap-3">
            <ThemeToggle />
            <Link
              href="/"
              className="site-button site-button-outline px-4 py-2 text-xs font-medium rounded-xl gap-2 h-10"
            >
              <ArrowLeft aria-hidden="true" className="size-3.5" />
              <span>Back to home</span>
            </Link>
          </div>
        </div>

        {/* Center form container */}
        <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center py-10">
          <h1 className="font-serif text-3xl sm:text-4xl font-medium tracking-tight text-foreground">
            {isSignUp ? "Create your account" : "Welcome back"}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {isSignUp
              ? "Save your library, highlights and notes in one place."
              : "Pick up where you left off in your reading notebook."}
          </p>

          <form onSubmit={handleSubmit} noValidate className={`${body.className} mt-8 space-y-4`}>

            {/* Full name — sign-up only */}
            {isSignUp && (
              <Field name="name" label="Full name" error={errors.name}>
                <input
                  id="name"
                  name="name"
                  type="text"
                  placeholder="Leo Tolstoy"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  autoComplete="name"
                  autoFocus
                  aria-invalid={Boolean(errors.name)}
                  aria-describedby={describedBy("name")}
                  disabled={pending}
                  className={inputClass}
                />
              </Field>
            )}

            {/* Email */}
            <Field name="email" label="Email" error={errors.email}>
              <input
                id="email"
                name="email"
                type="email"
                placeholder="name@example.com"
                inputMode="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete={isSignUp ? "email" : "username"}
                aria-invalid={Boolean(errors.email)}
                aria-describedby={describedBy("email")}
                disabled={pending}
                className={inputClass}
              />
            </Field>

            {/* Password — sign-up: side by side with confirm; sign-in: full width */}
            {isSignUp ? (
              <div className="flex flex-col sm:flex-row gap-3">
                <Field
                  name="password"
                  label="Password"
                  hint={`At least ${MIN_PASSWORD_LENGTH} characters.`}
                  error={errors.password}
                  className="flex-1 min-w-0"
                >
                  <div className="relative">
                    <input
                      id="password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      autoComplete="new-password"
                      aria-invalid={Boolean(errors.password)}
                      aria-describedby={describedBy("password", true)}
                      disabled={pending}
                      className={`${inputClass} pr-11`}
                    />
                    <ShowHideButton show={showPassword} onToggle={() => setShowPassword((v) => !v)} />
                  </div>
                </Field>

                <Field
                  name="confirmPassword"
                  label="Confirm password"
                  error={errors.confirmPassword}
                  className="flex-1 min-w-0"
                >
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    autoComplete="new-password"
                    aria-invalid={Boolean(errors.confirmPassword)}
                    aria-describedby={describedBy("confirmPassword")}
                    disabled={pending}
                    className={inputClass}
                  />
                </Field>
              </div>
            ) : (
              <Field
                name="password"
                label="Password"
                error={errors.password}
                action={
                  <Link
                    href="/forgot-password"
                    className="rounded-xs text-xs font-medium text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    Forgot password?
                  </Link>
                }
              >
                <div className="relative">
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="current-password"
                    aria-invalid={Boolean(errors.password)}
                    aria-describedby={describedBy("password")}
                    disabled={pending}
                    className={`${inputClass} pr-11`}
                  />
                  <ShowHideButton show={showPassword} onToggle={() => setShowPassword((v) => !v)} />
                </div>
              </Field>
            )}

            {/* Sign-up only fields */}
            {isSignUp && (
              <>
                {/* Date of birth */}
                <Field
                  name="dateOfBirth"
                  label="Date of birth"
                  hint={`You must be at least ${MIN_AGE} to join.`}
                  error={errors.dateOfBirth}
                >
                  <input
                    id="dateOfBirth"
                    name="dateOfBirth"
                    type="date"
                    value={dateOfBirth}
                    onChange={(e) => setDateOfBirth(e.target.value)}
                    min="1900-01-01"
                    max={latestBirthDate}
                    autoComplete="bday"
                    aria-invalid={Boolean(errors.dateOfBirth)}
                    aria-describedby={describedBy("dateOfBirth", true)}
                    disabled={pending}
                    className={inputClass}
                  />
                </Field>

                {/* Terms */}
                <div className="space-y-1.5 pt-1">
                  <div className="flex items-start gap-3">
                    <input
                      id="acceptedTerms"
                      name="acceptedTerms"
                      type="checkbox"
                      checked={acceptedTerms}
                      onChange={(e) => setAcceptedTerms(e.target.checked)}
                      aria-invalid={Boolean(errors.acceptedTerms)}
                      aria-describedby={describedBy("acceptedTerms")}
                      disabled={pending}
                      className="mt-0.5 size-4 shrink-0 rounded border-border accent-amber-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/30"
                    />
                    <label htmlFor="acceptedTerms" className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                      I agree to the{" "}
                      <Link href="/terms" className="text-foreground underline underline-offset-2 hover:text-amber-600 dark:hover:text-amber-400">
                        Terms
                      </Link>{" "}
                      and have read the{" "}
                      <Link href="/privacy" className="text-foreground underline underline-offset-2 hover:text-amber-600 dark:hover:text-amber-400">
                        Privacy Policy
                      </Link>
                      .
                    </label>
                  </div>
                  {errors.acceptedTerms && (
                    <p id="acceptedTerms-error" className="text-xs text-destructive">
                      {errors.acceptedTerms}
                    </p>
                  )}
                </div>
              </>
            )}

            {/* Form-level error */}
            {formError && (
              <p role="alert" className="rounded-xl border border-destructive/40 bg-destructive/10 px-3.5 py-2.5 text-xs text-destructive">
                {formError}
              </p>
            )}

            {/* Cloudflare Turnstile */}
            <div className="pt-1">
              <Turnstile
                ref={turnstileRef}
                siteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY!}
                onSuccess={(token) => setTurnstileToken(token)}
                onExpire={() => setTurnstileToken(null)}
                onError={() => setTurnstileToken(null)}
                options={{
                  theme: (resolvedTheme === "dark" ? "dark" : "light"),
                  size: "flexible",
                }}
              />
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={pending || !turnstileToken}
              aria-busy={pending}
              className="site-button site-button-primary w-full rounded-xl py-2.5 text-sm font-medium disabled:opacity-60 transition-all cursor-pointer"
            >
              {pending
                ? isSignUp ? "Creating account…" : "Signing in…"
                : isSignUp ? "Create account" : "Sign in"}
            </button>
          </form>

          {/* Mode switch */}
          <p className={`${body.className} mt-6 text-center text-xs sm:text-sm text-muted-foreground`}>
            {isSignUp ? "Already have an account?" : "New to Novella?"}{" "}
            <button
              type="button"
              onClick={() => switchMode(isSignUp ? "sign-in" : "sign-up")}
              className="font-medium text-foreground underline underline-offset-4 decoration-amber-500/60 hover:decoration-amber-500 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-xs"
            >
              {isSignUp ? "Sign in" : "Create an account"}
            </button>
          </p>
        </div>

        <div className="text-center text-xs text-muted-foreground/40 font-mono py-2">
          Protected by Cloudflare Turnstile
        </div>
      </section>
    </div>
  )
}
