"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/components/landing/auth-provider"

/**
 * Redirects logged-in users away from the landing page to /dashboard
 * This wrapper component handles auth state checking before rendering
 */
export default function AuthRedirect({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const { user, loading } = useAuth()

  useEffect(() => {
    if (!loading && user) {
      router.replace("/dashboard")
    }
  }, [loading, user, router])

  // Don't render anything while checking auth state or if user is authenticated
  if (loading || user) {
    return null
  }

  return <>{children}</>
}
