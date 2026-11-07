"use client"

import { Suspense, useEffect, useRef, useState } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { BookOpen, Mail, RefreshCw } from "lucide-react"
import { useAuth } from "@/components/landing/auth-provider"

function Brand() {
  return (
    <Link
      href="/"
      className="inline-flex items-center gap-2 rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
    >
      <BookOpen className="size-5" strokeWidth={1.5} aria-hidden="true" />
      <span className="font-serif text-2xl leading-none">Novella</span>
    </Link>
  )
}

const OTP_LENGTH = 6

function VerifyEmailContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const email = searchParams.get("email")
  const { user, loading } = useAuth()

  const [digits, setDigits] = useState<string[]>(Array(OTP_LENGTH).fill(""))
  const [verifying, setVerifying] = useState(false)
  const [resending, setResending] = useState(false)
  const [resent, setResent] = useState(false)
  const [error, setError] = useState("")
  const [otpStatus, setOtpStatus] = useState<"idle" | "success" | "error">("idle")
  const [shake, setShake] = useState(false)
  const [pop, setPop] = useState(false)

  const inputRefs = useRef<(HTMLInputElement | null)[]>([])

  // Redirect if already verified
  useEffect(() => {
    if (!loading && user?.emailVerified) {
      router.replace("/dashboard")
    }
  }, [loading, user, router])

  function handleDigitChange(index: number, value: string) {
    setOtpStatus("idle")
    setError("")

    // Allow paste of the full code into the first box
    if (value.length > 1) {
      const pasted = value.replace(/\D/g, "").slice(0, OTP_LENGTH)
      if (pasted.length === 0) return
      const next = Array(OTP_LENGTH).fill("")
      for (let i = 0; i < pasted.length; i++) next[i] = pasted[i]
      setDigits(next)
      const focusIndex = Math.min(pasted.length, OTP_LENGTH - 1)
      inputRefs.current[focusIndex]?.focus()
      return
    }

    const char = value.replace(/\D/g, "")
    const next = [...digits]
    next[index] = char
    setDigits(next)

    if (char && index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus()
    }
  }

  function handleKeyDown(index: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Backspace" && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus()
    }
    if (e.key === "ArrowLeft" && index > 0) {
      inputRefs.current[index - 1]?.focus()
    }
    if (e.key === "ArrowRight" && index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus()
    }
  }

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault()
    const code = digits.join("")
    if (code.length < OTP_LENGTH) {
      setOtpStatus("error")
      setShake(true)
      setTimeout(() => setShake(false), 500)
      setError("Enter the full 6-digit code.")
      return
    }

    if (!user) {
      setError("Session expired. Please sign in again.")
      return
    }

    setVerifying(true)
    setError("")

    try {
      const token = await user.getIdToken()

      const response = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ code }),
      })

      const data = await response.json()

      if (!response.ok) {
        setOtpStatus("error")
        setShake(true)
        setTimeout(() => setShake(false), 500)
        setError(data.error || "Verification failed. Please try again.")
        // Clear the inputs on wrong code so user can re-enter
        if (response.status === 400 && data.error?.includes("Incorrect")) {
          setDigits(Array(OTP_LENGTH).fill(""))
          inputRefs.current[0]?.focus()
        }
        return
      }

      setOtpStatus("success")
      setPop(true)

      // Force a token refresh so emailVerified is up to date
      await user.reload()
      router.push("/dashboard")
    } catch {
      setOtpStatus("error")
      setShake(true)
      setTimeout(() => setShake(false), 500)
      setError("Something went wrong. Please try again.")
    } finally {
      setVerifying(false)
    }
  }

  async function handleResend() {
    if (!user || resending) return

    setResending(true)
    setError("")
    setResent(false)
    setDigits(Array(OTP_LENGTH).fill(""))

    try {
      const token = await user.getIdToken()

      const response = await fetch("/api/auth/send-otp", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Failed to send code")
      }

      setResent(true)
      setTimeout(() => setResent(false), 8000)
      inputRefs.current[0]?.focus()
    } catch (err: any) {
      if (err.message?.includes("Too many requests")) {
        setError("Too many requests. Please wait a moment before trying again.")
      } else {
        setError("Failed to send code. Please try again.")
      }
    } finally {
      setResending(false)
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-background px-6 py-8 sm:px-12">
      <div className="flex items-center justify-between">
        <Brand />
        <Link href="/" className="site-button site-button-outline">
          Back to home
        </Link>
      </div>

      <div className="mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center py-12 text-center">
        <div className="mb-6 flex size-16 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
          <Mail className="size-8" strokeWidth={1.8} />
        </div>

        <h1 className="font-serif text-4xl sm:text-5xl font-medium tracking-tight text-foreground leading-tight">
          Check your email
        </h1>

        <p className="mt-4 font-sans text-sm text-muted-foreground leading-relaxed">
          We sent a 6-digit verification code to{" "}
          <span className="font-medium text-foreground font-mono">{email || "your email"}</span>.
          Enter it below to confirm your account.
        </p>

        <form onSubmit={handleVerify} className="mt-10 w-full" noValidate>
          {/* OTP digit inputs */}
          <div
            className={`flex justify-center gap-2 sm:gap-3 transition-transform ${shake ? "animate-otp-shake" : ""}`}
            role="group"
            aria-label="Verification code"
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
                  "h-14 w-12 rounded-xl border text-center text-2xl font-mono font-bold transition-all sm:h-16 sm:w-14 shadow-2xs",
                  "focus:outline-none focus:ring-2",
                  otpStatus === "success"
                    ? "border-emerald-500 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 ring-2 ring-emerald-500/25 focus:border-emerald-500 focus:ring-emerald-500/40"
                    : otpStatus === "error" || error
                    ? "border-destructive bg-destructive/10 text-destructive ring-2 ring-destructive/25 focus:border-destructive focus:ring-destructive/40"
                    : "border-border bg-card text-foreground focus:border-ring focus:ring-ring/20",
                  pop && otpStatus === "success" ? "animate-otp-pop" : "",
                ].filter(Boolean).join(" ")}
                onChange={(e) => handleDigitChange(i, e.target.value)}
                onKeyDown={(e) => handleKeyDown(i, e)}
                onFocus={(e) => e.target.select()}
                disabled={verifying}
              />
            ))}
          </div>

          {error && (
            <p
              role="alert"
              className="mt-4 rounded-sm border border-destructive/40 px-3 py-2 text-sm text-destructive"
            >
              {error}
            </p>
          )}

          {resent && (
            <p className="mt-4 rounded-sm border border-green-500/40 bg-green-500/10 px-3 py-2 text-sm text-green-700 dark:text-green-400">
              New code sent — check your inbox.
            </p>
          )}

          <div className="mt-6 flex flex-col gap-3">
            <button
              type="submit"
              disabled={verifying || digits.join("").length < OTP_LENGTH}
              className="site-button site-button-primary w-full disabled:opacity-60"
            >
              {verifying ? "Verifying..." : "Verify email"}
            </button>

            <button
              type="button"
              onClick={handleResend}
              disabled={resending || resent}
              className="site-button site-button-outline w-full disabled:opacity-60"
            >
              <RefreshCw className={`size-4 ${resending ? "animate-spin" : ""}`} />
              {resending ? "Sending..." : resent ? "Code sent!" : "Resend code"}
            </button>
          </div>
        </form>

        <p className="mt-8 text-sm text-muted-foreground">
          Wrong email?{" "}
          <Link
            href="/auth"
            className="font-medium text-foreground underline underline-offset-2 hover:text-muted-foreground"
          >
            Go back
          </Link>
        </p>
      </div>
    </div>
  )
}

export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <div className="size-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      }
    >
      <VerifyEmailContent />
    </Suspense>
  )
}
