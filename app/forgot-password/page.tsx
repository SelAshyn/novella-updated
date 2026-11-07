"use client"

import { useRef, useState } from "react"
import Link from "next/link"
import { Plus_Jakarta_Sans, Newsreader } from "next/font/google"
import { ArrowLeft, BookOpen, Eye, EyeOff, RefreshCw, CheckCircle2, Sparkles } from "lucide-react"
import { Turnstile, type TurnstileInstance } from "@marsidev/react-turnstile"
import { useTheme } from "next-themes"
import ThemeToggle from "@/components/landing/theme-toggle"

const reading = Newsreader({ subsets: ["latin"], style: ["normal", "italic"], weight: ["400", "500", "600"], display: "swap" })
const body = Plus_Jakarta_Sans({ subsets: ["latin"], weight: ["400", "500", "600"], display: "swap" })

const inputClass =
  "h-11 w-full rounded-xl border border-border/80 bg-card/60 px-3.5 text-sm text-foreground shadow-2xs transition-all duration-200 placeholder:text-muted-foreground/50 hover:border-border focus-visible:border-amber-500 focus-visible:ring-2 focus-visible:ring-amber-500/20 focus-visible:outline-none disabled:opacity-60 aria-[invalid=true]:border-destructive"

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const OTP_LENGTH = 6
const MIN_PASSWORD_LENGTH = 8

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

type Step = "email" | "otp" | "success"

export default function ForgotPasswordPage() {
  const { resolvedTheme } = useTheme()
  const [step, setStep] = useState<Step>("email")

  // Step 1
  const [email, setEmail] = useState("")
  const [emailError, setEmailError] = useState("")
  const [sendPending, setSendPending] = useState(false)
  const [sendError, setSendError] = useState("")
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null)
  const turnstileRef = useRef<TurnstileInstance>(null)

  // Step 2
  const [digits, setDigits] = useState<string[]>(Array(OTP_LENGTH).fill(""))
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [otpError, setOtpError] = useState("")
  const [passwordError, setPasswordError] = useState("")
  const [confirmError, setConfirmError] = useState("")
  const [formError, setFormError] = useState("")
  const [verifyPending, setVerifyPending] = useState(false)
  const [resending, setResending] = useState(false)
  const [resent, setResent] = useState(false)
  const [otpStatus, setOtpStatus] = useState<"idle" | "validating" | "success" | "error">("idle")
  const [shake, setShake] = useState(false)
  const [pop, setPop] = useState(false)

  const inputRefs = useRef<(HTMLInputElement | null)[]>([])

  // ── Step 1: send OTP ────────────────────────────────────────────────────
  async function handleSendOTP(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (sendPending) return

    setEmailError("")
    setSendError("")

    if (!EMAIL_PATTERN.test(email.trim())) {
      setEmailError("Enter a valid email address, like name@example.com.")
      document.getElementById("email")?.focus()
      return
    }

    setSendPending(true)
    try {
      // Turnstile check
      const tsRes = await fetch("/api/auth/verify-turnstile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: turnstileToken, action: "forgot-password" }),
      })
      if (!tsRes.ok) {
        const tsData = await tsRes.json().catch(() => ({}))
        setSendError(tsData.error || "Security check failed. Please try again.")
        turnstileRef.current?.reset()
        setTurnstileToken(null)
        return
      }

      const res = await fetch("/api/auth/send-password-reset-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        if (res.status === 429) {
          setSendError(data.error || "Too many requests. Please wait before trying again.")
          return
        }
      }

      setStep("otp")
      setTimeout(() => inputRefs.current[0]?.focus(), 50)
    } catch {
      setSendError("Something went wrong. Please try again.")
    } finally {
      setSendPending(false)
    }
  }

  // ── Step 2: OTP input handlers & validation ─────────────────────────────
  async function validateEnteredOtp(code: string) {
    if (code.length !== OTP_LENGTH) return
    setOtpStatus("validating")
    setOtpError("")

    try {
      const res = await fetch("/api/auth/verify-password-reset-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), otp: code, validateOnly: true }),
      })

      const data = await res.json().catch(() => ({}))

      if (!res.ok || !data.valid) {
        setOtpStatus("error")
        setOtpError(data.error || "Incorrect code. Please try again.")
        setShake(true)
        setTimeout(() => setShake(false), 500)
        return
      }

      // Code matched! Show green borders + pop animation
      setOtpStatus("success")
      setPop(true)
      setTimeout(() => setPop(false), 400)

      // Automatically focus on the new password input
      setTimeout(() => {
        document.getElementById("password")?.focus()
      }, 350)
    } catch {
      setOtpStatus("error")
      setOtpError("Could not verify code. Please try again.")
      setShake(true)
      setTimeout(() => setShake(false), 500)
    }
  }

  function handleDigitChange(index: number, value: string) {
    const raw = value.replace(/\D/g, "")
    setOtpStatus("idle")
    setOtpError("")

    if (raw.length > 1) {
      const pasted = raw.slice(0, OTP_LENGTH).split("")
      const next = [...digits]
      pasted.forEach((char, i) => {
        if (index + i < OTP_LENGTH) next[index + i] = char
      })
      setDigits(next)
      const nextFocus = Math.min(index + pasted.length, OTP_LENGTH - 1)
      inputRefs.current[nextFocus]?.focus()

      const fullCode = next.join("")
      if (fullCode.length === OTP_LENGTH && !next.includes("")) {
        validateEnteredOtp(fullCode)
      }
      return
    }

    const next = [...digits]
    next[index] = raw
    setDigits(next)

    if (raw && index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus()
    }

    const fullCode = next.join("")
    if (fullCode.length === OTP_LENGTH && !next.includes("")) {
      validateEnteredOtp(fullCode)
    }
  }

  function handleKeyDown(index: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Backspace" && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus()
    }
  }

  async function handleResend() {
    if (resending || resent) return
    setResending(true)
    setFormError("")
    setOtpStatus("idle")
    setOtpError("")
    try {
      const res = await fetch("/api/auth/send-password-reset-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        setFormError(data.error || "Could not resend code. Please wait a moment.")
        return
      }
      setResent(true)
      setDigits(Array(OTP_LENGTH).fill(""))
      inputRefs.current[0]?.focus()
      setTimeout(() => setResent(false), 30_000)
    } catch {
      setFormError("Could not resend code. Please try again.")
    } finally {
      setResending(false)
    }
  }

  // ── Step 2: verify OTP + reset password ──────────────────────────────────
  async function handleVerify(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (verifyPending) return

    setOtpError("")
    setPasswordError("")
    setConfirmError("")
    setFormError("")

    const code = digits.join("")
    let hasError = false

    if (code.length < OTP_LENGTH) {
      setOtpStatus("error")
      setOtpError("Enter the full 6-digit code.")
      setShake(true)
      setTimeout(() => setShake(false), 500)
      hasError = true
    }

    if (!password) {
      setPasswordError("Enter a new password.")
      hasError = true
    } else if (password.length < MIN_PASSWORD_LENGTH) {
      setPasswordError(`Password must be at least ${MIN_PASSWORD_LENGTH} characters.`)
      hasError = true
    }

    if (!confirmPassword) {
      setConfirmError("Confirm your new password.")
      hasError = true
    } else if (password !== confirmPassword) {
      setConfirmError("Passwords don't match.")
      hasError = true
    }

    if (hasError) return

    setVerifyPending(true)
    try {
      const res = await fetch("/api/auth/verify-password-reset-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), otp: code, newPassword: password }),
      })

      const data = await res.json().catch(() => ({}))

      if (!res.ok) {
        if (data.field === "otp" || data.error?.toLowerCase().includes("code")) {
          setOtpStatus("error")
          setOtpError(data.error || "Incorrect code. Please try again.")
          setShake(true)
          setTimeout(() => setShake(false), 500)
          inputRefs.current[0]?.focus()
        } else if (data.error?.toLowerCase().includes("different from your current")) {
          setPasswordError(data.error)
          document.getElementById("password")?.focus()
        } else {
          setFormError(data.error || "Something went wrong. Please try again.")
        }
        return
      }

      setOtpStatus("success")
      setStep("success")
    } catch {
      setFormError("Something went wrong. Please try again.")
    } finally {
      setVerifyPending(false)
    }
  }

  return (
    <div className="grid min-h-screen bg-background text-foreground lg:grid-cols-[5fr_6fr]">
      {/* ── Left panel: decorative literary quote (theme-consistent) ──────── */}
      <aside
        className="hidden flex-col justify-between border-r border-border/70 bg-secondary/35 dark:bg-card/30 p-12 xl:p-16 lg:flex relative overflow-hidden"
        aria-hidden="true"
      >
        <Brand />

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
            <mark className="rounded-md bg-amber-500/20 dark:bg-amber-400/25 px-2 py-0.5 text-foreground font-medium underline decoration-amber-500/40 decoration-wavy decoration-1 underline-offset-4">
              A reader lives a thousand lives
            </mark>{" "}
            before he dies. The man who never reads lives only one.
          </blockquote>

          <figcaption className="mt-6 font-sans text-sm font-medium text-muted-foreground">
            — George R.R. Martin, A Dance with Dragons (2011)
          </figcaption>

          <div className="mt-8 rounded-xl border border-border/80 bg-card/70 p-4 border-l-4 border-l-amber-500 text-xs sm:text-sm leading-relaxed text-muted-foreground shadow-xs">
            <p className="font-mono text-[11px] font-semibold uppercase tracking-wider text-foreground/80 mb-1">
              Reading note
            </p>
            Every story read adds an echo to your memory. Reset your access to keep collecting.
          </div>
        </figure>

        <div className="text-xs text-muted-foreground/60 font-mono">
          Novella — Read deeply. Remember what you read.
        </div>
      </aside>

      {/* ── Right panel: reset password flow ──────────────────────────────── */}
      <section className="flex flex-col px-6 py-8 sm:px-12 lg:px-16 justify-between min-h-screen">
        {/* Top header navigation */}
        <div className="flex items-center justify-between">
          <Brand className="lg:hidden" />
          <div className="ml-auto flex items-center gap-3">
            <ThemeToggle />
            <Link
              href="/auth"
              className="site-button site-button-outline px-4 py-2 text-xs font-medium rounded-xl gap-2 h-10"
            >
              <ArrowLeft aria-hidden="true" className="size-3.5" />
              <span>Back to sign in</span>
            </Link>
          </div>
        </div>

        {/* Center form container */}
        <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center py-10">

          {/* ── Step 1: enter email ──────────────────────────────────── */}
          {step === "email" && (
            <>
              <h1 className="font-serif text-3xl sm:text-4xl font-medium tracking-tight text-foreground">
                Forgot password?
              </h1>
              <p className="mt-2 text-sm text-muted-foreground">
                Enter your email address and we&apos;ll send you a 6-digit verification code.
              </p>

              <form onSubmit={handleSendOTP} noValidate className={`${body.className} mt-8 space-y-4`}>
                <div className="space-y-1.5">
                  <label htmlFor="email" className="text-sm font-medium text-foreground">
                    Email address
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="name@example.com"
                    inputMode="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    autoComplete="email"
                    autoFocus
                    aria-invalid={Boolean(emailError)}
                    aria-describedby={emailError ? "email-error" : undefined}
                    disabled={sendPending}
                    className={inputClass}
                  />
                  {emailError && (
                    <p id="email-error" className="text-xs text-destructive">{emailError}</p>
                  )}
                </div>

                {sendError && (
                  <p role="alert" className="rounded-xl border border-destructive/40 bg-destructive/10 px-3.5 py-2.5 text-xs text-destructive">
                    {sendError}
                  </p>
                )}

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

                <button
                  type="submit"
                  disabled={sendPending || !turnstileToken}
                  aria-busy={sendPending}
                  className="site-button site-button-primary w-full rounded-xl py-2.5 text-sm font-medium disabled:opacity-60 transition-all cursor-pointer"
                >
                  {sendPending ? "Sending code…" : "Send reset code"}
                </button>
              </form>

              <p className={`${body.className} mt-6 text-center text-xs sm:text-sm text-muted-foreground`}>
                Remembered your password?{" "}
                <Link
                  href="/auth"
                  className="font-medium text-foreground underline underline-offset-4 decoration-amber-500/60 hover:decoration-amber-500 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-xs"
                >
                  Sign in
                </Link>
              </p>
            </>
          )}

          {/* ── Step 2: enter OTP + new password ────────────────────── */}
          {step === "otp" && (
            <>
              <h1 className="font-serif text-3xl sm:text-4xl font-medium tracking-tight text-foreground">
                Reset your password
              </h1>
              <p className="mt-2 text-sm text-muted-foreground">
                Enter the 6-digit code sent to{" "}
                <span className="font-medium text-foreground">{email}</span>{" "}
                and choose a new password.
              </p>

              <form onSubmit={handleVerify} noValidate className={`${body.className} mt-8 space-y-4`}>

                {/* OTP digits */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-foreground">Reset code</p>
                    {otpStatus === "success" && (
                      <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                        <CheckCircle2 className="size-3.5" />
                        Code verified
                      </span>
                    )}
                    {otpStatus === "validating" && (
                      <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground animate-pulse">
                        <RefreshCw className="size-3 animate-spin" />
                        Verifying code…
                      </span>
                    )}
                  </div>

                  <div
                    className={`flex justify-between gap-2 transition-transform ${shake ? "animate-otp-shake" : ""}`}
                    role="group"
                    aria-label="6-digit reset code"
                  >
                    {digits.map((digit, i) => (
                      <input
                        key={i}
                        ref={(el) => { inputRefs.current[i] = el }}
                        id={`otp-${i}`}
                        type="text"
                        inputMode="numeric"
                        pattern="\d"
                        maxLength={OTP_LENGTH}
                        value={digit}
                        autoComplete={i === 0 ? "one-time-code" : "off"}
                        aria-label={`Digit ${i + 1} of ${OTP_LENGTH}`}
                        className={[
                          "h-14 w-full rounded-xl border text-center text-2xl font-mono font-semibold transition-all duration-200 shadow-2xs",
                          "focus:outline-none focus:ring-2",
                          otpStatus === "success"
                            ? "border-emerald-500 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 ring-2 ring-emerald-500/25 focus:border-emerald-500 focus:ring-emerald-500/40"
                            : otpStatus === "error" || otpError
                            ? "border-destructive bg-destructive/10 text-destructive ring-2 ring-destructive/25 focus:border-destructive focus:ring-destructive/40"
                            : "border-border/80 bg-card/70 text-foreground hover:border-border focus:border-amber-500 focus:ring-amber-500/30",
                          pop && otpStatus === "success" ? "animate-otp-pop" : "",
                        ].filter(Boolean).join(" ")}
                        onChange={(e) => handleDigitChange(i, e.target.value)}
                        onKeyDown={(e) => handleKeyDown(i, e)}
                        onFocus={(e) => e.target.select()}
                        disabled={verifyPending || otpStatus === "validating"}
                      />
                    ))}
                  </div>
                  {otpError && (
                    <p className="text-xs text-destructive flex items-center gap-1">
                      {otpError}
                    </p>
                  )}
                </div>

                {/* New password */}
                <div className="space-y-1.5 pt-1">
                  <label htmlFor="password" className="text-sm font-medium text-foreground">
                    New password
                  </label>
                  <div className="relative">
                    <input
                      id="password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      autoComplete="new-password"
                      aria-invalid={Boolean(passwordError)}
                      aria-describedby={passwordError ? "password-error" : "password-hint"}
                      disabled={verifyPending}
                      className={`${inputClass} pr-11`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      aria-label={showPassword ? "Hide password" : "Show password"}
                      aria-pressed={showPassword}
                      className="absolute right-0 top-0 flex size-11 items-center justify-center rounded-xl text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      {showPassword
                        ? <EyeOff className="size-4" strokeWidth={1.5} aria-hidden="true" />
                        : <Eye className="size-4" strokeWidth={1.5} aria-hidden="true" />}
                    </button>
                  </div>
                  <p id="password-hint" className="text-xs text-muted-foreground">
                    Use at least {MIN_PASSWORD_LENGTH} characters.
                  </p>
                  {passwordError && (
                    <p id="password-error" className="text-xs text-destructive">{passwordError}</p>
                  )}
                </div>

                {/* Confirm password */}
                <div className="space-y-1.5">
                  <label htmlFor="confirmPassword" className="text-sm font-medium text-foreground">
                    Confirm new password
                  </label>
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    autoComplete="new-password"
                    aria-invalid={Boolean(confirmError)}
                    aria-describedby={confirmError ? "confirm-error" : undefined}
                    disabled={verifyPending}
                    className={inputClass}
                  />
                  {confirmError && (
                    <p id="confirm-error" className="text-xs text-destructive">{confirmError}</p>
                  )}
                </div>

                {formError && (
                  <p role="alert" className="rounded-xl border border-destructive/40 bg-destructive/10 px-3.5 py-2.5 text-xs text-destructive">
                    {formError}
                  </p>
                )}

                {resent && (
                  <p className="rounded-xl border border-green-500/40 bg-green-500/10 px-3.5 py-2 text-xs text-green-700 dark:text-green-400">
                    New code sent — check your inbox.
                  </p>
                )}

                <button
                  type="submit"
                  disabled={verifyPending || digits.join("").length < OTP_LENGTH}
                  aria-busy={verifyPending}
                  className="site-button site-button-primary w-full rounded-xl py-2.5 text-sm font-medium disabled:opacity-60 transition-all cursor-pointer"
                >
                  {verifyPending ? "Saving new password…" : "Reset password"}
                </button>

                <button
                  type="button"
                  onClick={handleResend}
                  disabled={resending || resent}
                  className="site-button site-button-outline w-full rounded-xl py-2.5 text-xs font-medium disabled:opacity-60 gap-2 cursor-pointer"
                >
                  <RefreshCw className={`size-3.5 ${resending ? "animate-spin" : ""}`} />
                  {resending ? "Sending code…" : resent ? "Code sent!" : "Resend code"}
                </button>
              </form>

              <p className={`${body.className} mt-6 text-center text-xs sm:text-sm text-muted-foreground`}>
                Entered the wrong email?{" "}
                <button
                  type="button"
                  onClick={() => {
                    setStep("email")
                    setDigits(Array(OTP_LENGTH).fill(""))
                    setOtpError("")
                    setPassword("")
                    setConfirmPassword("")
                    setFormError("")
                  }}
                  className="font-medium text-foreground underline underline-offset-4 decoration-amber-500/60 hover:decoration-amber-500 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-xs"
                >
                  Go back
                </button>
              </p>
            </>
          )}

          {/* ── Step 3: success ──────────────────────────────────────── */}
          {step === "success" && (
            <div className="text-center py-6">
              <div className="mx-auto mb-6 flex size-16 items-center justify-center rounded-2xl border border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400 shadow-sm">
                <CheckCircle2 className="size-8 stroke-[1.8]" />
              </div>
              <h1 className="font-serif text-3xl sm:text-4xl font-medium tracking-tight text-foreground">
                Password updated
              </h1>
              <p className="mt-3 text-sm text-muted-foreground max-w-sm mx-auto">
                Your password has been successfully reset. You can now sign in with your new credentials.
              </p>
              <Link
                href="/auth"
                className={`${body.className} mt-8 inline-flex site-button site-button-primary w-full rounded-xl py-2.5 text-sm font-medium justify-center`}
              >
                Sign in to your account
              </Link>
            </div>
          )}

        </div>

        <div className="text-center text-xs text-muted-foreground/40 font-mono py-2">
          Protected by Cloudflare Turnstile
        </div>
      </section>
    </div>
  )
}
