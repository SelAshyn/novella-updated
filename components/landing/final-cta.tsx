import { ArrowRight, BookOpen } from "lucide-react"
import Link from "next/link"

const footerLinks = [
  ["#top", "Home"],
  ["#how-it-works", "How it works"],
  ["#features", "Features"],
  ["#built-for", "Who it's for"],
  ["#for-schools", "For schools"],
  ["#pricing", "Pricing"],
  ["#questions", "FAQ"],
  ["/auth", "Sign in"],
] as const

const legalLinks = [
  ["/privacy", "Privacy"],
  ["/terms", "Terms"],
  ["/cookies", "Cookies"],
] as const

export default function FinalCta() {
  return (
    <footer
      id="final-cta"
      className="final-cta flex min-h-dvh w-full items-center justify-center bg-card text-foreground px-6 py-12 sm:px-12 border-t border-border"
    >
      <div className="section-content mx-auto w-full max-w-4xl">
        {/* Highlight CTA Box */}
        <div className="relative overflow-hidden rounded-3xl border border-border/80 bg-secondary/60 p-7 sm:p-10 text-center shadow-lg backdrop-blur-md">
          {/* Subtle Ambient Radial Glow */}
          <div className="pointer-events-none absolute -top-20 left-1/2 -translate-x-1/2 size-80 rounded-full bg-amber-500/10 blur-3xl" />

          <div className="relative z-10 max-w-xl mx-auto">
            <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 mb-3.5 shadow-xs">
              <span className="font-mono text-xs font-semibold tracking-wider uppercase text-amber-600 dark:text-amber-400">
                Begin Your Reading Notebook
              </span>
            </div>

            <h2 className="font-serif text-3xl sm:text-4xl font-medium tracking-tight text-foreground leading-[1.12]">
              The hours you spend reading shouldn&apos;t just fade away.
            </h2>

            <p className="mt-3.5 font-sans text-sm sm:text-base text-muted-foreground leading-relaxed">
              Create a free account in 30 seconds. Add your current book, save a word, and turn reading into an enduring library in your mind.
            </p>

            <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
              <Link
                href="/auth#create"
                className="site-button site-button-primary group px-6 py-2.5 text-sm shadow-md"
              >
                <span>Get started free</span>
                <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
              <Link
                href="/auth"
                className="site-button site-button-outline px-5 py-2.5 text-sm"
              >
                <span>Sign in to library</span>
              </Link>
            </div>
          </div>
        </div>

        {/* Footer Navigation */}
        <div className="mt-8 flex flex-col gap-4 border-t border-border/80 pt-5 md:flex-row md:items-center md:justify-between">
          {/* Logo & Tagline */}
          <div className="flex items-center gap-2.5">
            <div className="flex size-8 items-center justify-center rounded-xl bg-primary text-primary-foreground">
              <BookOpen className="size-4 stroke-[2.2]" />
            </div>
            <div>
              <span className="font-serif text-xl font-bold tracking-tight text-foreground leading-none">
                Novella
              </span>
              <p className="font-sans text-xs text-muted-foreground mt-0.5">
                The reading notebook that remembers for you.
              </p>
            </div>
          </div>

          {/* Quick Links */}
          <nav aria-label="Footer navigation" className="flex flex-wrap gap-x-5 gap-y-1.5 font-sans text-xs sm:text-sm text-muted-foreground">
            {footerLinks.map(([href, label]) => (
              <a
                className="transition-colors hover:text-foreground hover:underline underline-offset-4"
                href={href}
                key={href}
              >
                {label}
              </a>
            ))}
          </nav>
        </div>

        {/* Copyright & Legal */}
        <div className="mt-4 flex flex-col gap-2 border-t border-border/40 pt-3 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between font-mono">
          <p>&copy; {new Date().getFullYear()} Novella. All rights reserved.</p>
          <nav aria-label="Legal navigation" className="flex flex-wrap gap-x-5">
            {legalLinks.map(([href, label]) => (
              <Link className="transition-colors hover:text-foreground" href={href} key={href}>
                {label}
              </Link>
            ))}
          </nav>
        </div>
      </div>
    </footer>
  )
}
