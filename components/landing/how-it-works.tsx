import { Hourglass, FileWarning, Compass } from "lucide-react"

export default function HowItWorks() {
  return (
    <section
      id="how-it-works"
      className="how-it-works flex min-h-dvh h-auto w-full items-center justify-center bg-background px-4 py-12 sm:px-12"
    >
      <div className="section-content flex w-full max-w-5xl flex-col">
        {/* Intro */}
        <div className="max-w-2xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-border bg-secondary/80 px-3 py-1 mb-2.5">
            <span className="font-mono text-xs font-semibold tracking-wider uppercase text-amber-600 dark:text-amber-400">
              The Problem
            </span>
          </div>
          <h2 className="font-serif text-3xl sm:text-4xl font-medium tracking-tight text-foreground leading-[1.12]">
            You read hundreds of pages.{" "}
            <span className="italic">How much do you actually keep?</span>
          </h2>
          <p className="mt-2.5 font-sans text-sm sm:text-base text-muted-foreground leading-relaxed max-w-xl mx-auto">
            The human brain is wired to discard passive information. Without structured review, over 80% evaporates in 30 days.
          </p>
        </div>

        {/* 3 Problem Cards */}
        <div className="mt-8 grid w-full grid-cols-1 gap-4 md:grid-cols-3">
          {/* Card 1 */}
          <div className="group relative flex flex-col justify-between rounded-2xl border border-border/80 bg-card p-6 sm:p-7 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-amber-500/40 hover:shadow-md">
            <div>
              <div className="mb-4 flex items-center justify-between">
                <div className="flex size-10 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
                  <Hourglass className="size-5 stroke-[1.8]" />
                </div>
                <span className="font-mono text-xs font-semibold tracking-widest text-muted-foreground">01</span>
              </div>
              <h3 className="font-serif text-xl font-medium text-foreground">
                Forgetting is the default
              </h3>
              <p className="mt-2 font-sans text-sm text-muted-foreground leading-relaxed">
                You finish a great book feeling inspired, but a month later struggle to articulate its central thesis or recall evocative vocabulary.
              </p>
            </div>
            <div className="mt-6 border-t border-border/60 pt-3 font-mono text-xs text-muted-foreground">
              The Ebbinghaus Forgetting Curve
            </div>
          </div>

          {/* Card 2 */}
          <div className="group relative flex flex-col justify-between rounded-2xl border border-border/80 bg-card p-6 sm:p-7 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-amber-500/40 hover:shadow-md">
            <div>
              <div className="mb-4 flex items-center justify-between">
                <div className="flex size-10 items-center justify-center rounded-xl bg-sky-500/10 text-sky-600 dark:text-sky-400">
                  <FileWarning className="size-5 stroke-[1.8]" />
                </div>
                <span className="font-mono text-xs font-semibold tracking-widest text-muted-foreground">02</span>
              </div>
              <h3 className="font-serif text-xl font-medium text-foreground">
                Capture is scattered
              </h3>
              <p className="mt-2 font-sans text-sm text-muted-foreground leading-relaxed">
                Margin scribbles, phone photos, Apple Notes, Kindle highlights. Five separate silos, none of which you ever open again.
              </p>
            </div>
            <div className="mt-6 border-t border-border/60 pt-3 font-mono text-xs text-muted-foreground">
              Siloed knowledge cemetery
            </div>
          </div>

          {/* Card 3 */}
          <div className="group relative flex flex-col justify-between rounded-2xl border border-border/80 bg-card p-6 sm:p-7 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-amber-500/40 hover:shadow-md">
            <div>
              <div className="mb-4 flex items-center justify-between">
                <div className="flex size-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                  <Compass className="size-5 stroke-[1.8]" />
                </div>
                <span className="font-mono text-xs font-semibold tracking-widest text-muted-foreground">03</span>
              </div>
              <h3 className="font-serif text-xl font-medium text-foreground">
                Current tools fall short
              </h3>
              <p className="mt-2 font-sans text-sm text-muted-foreground leading-relaxed">
                Reading trackers only log vanity ratings. Anki decks take hours of setup. Neither connects real reading to long-term memory.
              </p>
            </div>
            <div className="mt-6 border-t border-border/60 pt-3 font-mono text-xs text-muted-foreground">
              Lack of integration
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
