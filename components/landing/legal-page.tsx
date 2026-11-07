import Link from "next/link"
import { ArrowLeft } from "lucide-react"

type LegalPageProps = {
  title: string
  updated: string
  children: React.ReactNode
}

export default function LegalPage({ title, updated, children }: LegalPageProps) {
  return (
    <main className="min-h-screen bg-background px-6 py-24 text-foreground sm:px-12 lg:px-20">
      <article className="mx-auto max-w-3xl">
        <Link
          className="inline-flex items-center gap-2 rounded-lg border border-border/80 bg-card px-3.5 py-1.5 font-sans text-xs font-medium text-muted-foreground transition-colors hover:text-foreground hover:border-foreground/40 shadow-xs"
          href="/"
        >
          <ArrowLeft className="size-3.5" />
          <span>Back to Novella</span>
        </Link>
        <div className="mt-12 inline-flex items-center gap-2 rounded-full border border-border bg-secondary/80 px-3.5 py-1">
          <span className="font-mono text-xs font-semibold tracking-wider uppercase text-amber-600 dark:text-amber-400">
            Legal & Policy
          </span>
        </div>
        <h1 className="mt-4 font-serif text-5xl sm:text-6xl font-medium tracking-tight text-foreground leading-[1.08]">
          {title}
        </h1>
        <p className="mt-3 font-mono text-xs text-muted-foreground">
          Last updated: {updated}
        </p>
        <div className="mt-12 space-y-8 font-sans text-base leading-relaxed text-foreground/90 border-t border-border/80 pt-10">
          {children}
        </div>
      </article>
    </main>
  )
}
