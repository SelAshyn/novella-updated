"use client"

import { ThemeProvider } from "next-themes"
import CookieConsent from "@/components/landing/cookie-consent"
import BackToTop from "@/components/landing/back-to-top"
import { AuthProvider } from "@/components/landing/auth-provider"

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
      <AuthProvider>
        <a
          href="#content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[100] focus:border focus:border-foreground focus:bg-background focus:px-4 focus:py-2"
        >
          Skip to content
        </a>
        <CookieConsent />
        <BackToTop />
        <main id="content" tabIndex={-1} className="page-enter flex-1 outline-none">
          {children}
        </main>
      </AuthProvider>
    </ThemeProvider>
  )
}
