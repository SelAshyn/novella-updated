import type { Metadata } from "next"
import { Plus_Jakarta_Sans, Newsreader, JetBrains_Mono } from "next/font/google"
import { Analytics } from "@vercel/analytics/react"
import { SpeedInsights } from "@vercel/speed-insights/next"
import "./globals.css"
import { cn } from "@/lib/utils"
import Providers from "@/components/landing/providers"

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
  weight: ["400", "500", "600", "700"],
  display: "swap",
})

const newsreader = Newsreader({
  subsets: ["latin"],
  variable: "--font-serif",
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
  display: "swap",
})

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  weight: ["400", "500", "600"],
  display: "swap",
})

export const metadata: Metadata = {
  title: "Novella — A reading notebook that remembers for you",
  description:
    "Mark a word or save a passage while you read. Novella automatically surfaces what you read at the exact moment your memory begins to fade.",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={cn(
        "antialiased scroll-smooth",
        plusJakartaSans.variable,
        newsreader.variable,
        jetbrainsMono.variable,
        "font-sans"
      )}
    >
      <body className="min-h-screen bg-background text-foreground selection:bg-highlight/30 selection:text-foreground">
        <Providers>
          {children}
        </Providers>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  )
}
