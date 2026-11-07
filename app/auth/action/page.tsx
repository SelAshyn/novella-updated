"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { applyActionCode, checkActionCode } from "firebase/auth"
import { auth } from "@/lib/firebase"
import { BookOpen, CheckCircle2, XCircle, Loader2 } from "lucide-react"
import Link from "next/link"

type ActionStatus = "loading" | "success" | "error"

export default function AuthActionPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [status, setStatus] = useState<ActionStatus>("loading")
  const [message, setMessage] = useState("")

  useEffect(() => {
    const mode = searchParams.get("mode")
    const oobCode = searchParams.get("oobCode")

    if (!mode || !oobCode) {
      setStatus("error")
      setMessage("Invalid verification link. Please request a new one.")
      return
    }

    async function handleAction() {
      try {
        // Check the code first
        const info = await checkActionCode(auth, oobCode!)

        if (mode === "verifyEmail") {
          // Apply the email verification code
          await applyActionCode(auth, oobCode!)

          setStatus("success")
          setMessage("Email verified successfully! You can now sign in.")

          // Redirect to dashboard after 2 seconds
          setTimeout(() => {
            router.push("/dashboard")
          }, 2000)
        } else if (mode === "resetPassword") {
          // Redirect to our custom reset page with the oobCode intact
          router.replace(`/auth/reset-password?oobCode=${encodeURIComponent(oobCode!)}`)
        } else {
          setStatus("error")
          setMessage("Unsupported action type.")
        }
      } catch (error: any) {
        setStatus("error")

        if (error.code === "auth/invalid-action-code") {
          setMessage("This verification link has expired or has already been used. Please request a new one.")
        } else if (error.code === "auth/expired-action-code") {
          setMessage("This verification link has expired. Please request a new one.")
        } else {
          setMessage("Failed to verify email. Please try again or request a new verification link.")
        }
      }
    }

    handleAction()
  }, [searchParams, router])

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-6 py-8">
      <Link href="/" className="mb-8 inline-flex items-center gap-2">
        <BookOpen className="size-5" strokeWidth={1.5} />
        <span className="font-serif text-2xl">Novella</span>
      </Link>

      <div className="w-full max-w-md text-center">
        {status === "loading" && (
          <>
            <Loader2 className="mx-auto size-16 animate-spin text-muted-foreground" />
            <h1 className="mt-6 text-2xl font-bold">Verifying your email...</h1>
            <p className="mt-2 text-muted-foreground">Please wait a moment</p>
          </>
        )}

        {status === "success" && (
          <>
            <div className="mx-auto flex size-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/20">
              <CheckCircle2 className="size-8 text-green-600 dark:text-green-400" />
            </div>
            <h1 className="mt-6 text-2xl font-bold">Email verified!</h1>
            <p className="mt-2 text-muted-foreground">{message}</p>
            <p className="mt-4 text-sm text-muted-foreground">Redirecting to dashboard...</p>
          </>
        )}

        {status === "error" && (
          <>
            <div className="mx-auto flex size-16 items-center justify-center rounded-full bg-destructive/10">
              <XCircle className="size-8 text-destructive" />
            </div>
            <h1 className="mt-6 text-2xl font-bold">Verification failed</h1>
            <p className="mt-2 text-muted-foreground">{message}</p>
            <div className="mt-8 space-y-3">
              <Link
                href="/auth/verify-email"
                className="site-button site-button-primary block w-full"
              >
                Request new verification email
              </Link>
              <Link
                href="/auth"
                className="site-button site-button-outline block w-full"
              >
                Back to sign in
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
