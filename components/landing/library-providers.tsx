"use client"

import { ThemeProvider } from "@/components/landing/theme-provider"
import { AuthProvider } from "@/components/landing/auth-provider"

export default function LibraryProviders({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <AuthProvider>
        {children}
      </AuthProvider>
    </ThemeProvider>
  )
}
