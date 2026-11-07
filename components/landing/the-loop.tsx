import { BookmarkCheck, Repeat, Flame } from "lucide-react"

const steps = [
  {
    number: "01",
    icon: BookmarkCheck,
    title: "Mark as you read",
    tagline: "Zero manual flashcard creation",
    description:
      "Type a word or capture a sentence while reading. Novella automatically enriches it with definitions, phonetics, and contextual examples in seconds.",
  },
  {
    number: "02",
    icon: Repeat,
    title: "3-minute daily review",
    tagline: "Scientific spaced repetition",
    description:
      "Review a concise, customized set each day. Challenging items resurface sooner, while words you know well graduate to longer review intervals.",
  },
  {
    number: "03",
    icon: Flame,
    title: "Compound your mastery",
    tagline: "Streaks with freeze protection",
    description:
      "Watch your vocabulary and recall score compound. Daily streaks build momentum, while automatic streak freezes protect you when life gets busy.",
  },
]

export default function TheLoop() {
  return (
    <section
      id="the-loop"
      className="the-loop flex h-dvh w-full items-center justify-center bg-secondary/50 text-foreground px-6 py-6 sm:px-12"
    >
      <div className="section-content w-full max-w-5xl">
        {/* Intro */}
        <div className="mx-auto max-w-2xl text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 mb-2.5 shadow-xs">
            <span className="font-mono text-xs font-semibold tracking-wider uppercase text-amber-600 dark:text-amber-400">
              The Retention Loop
            </span>
          </div>
          <h2 className="font-serif text-3xl sm:text-4xl font-medium tracking-tight text-foreground leading-[1.12]">
            Three effortless steps.{" "}
            <span className="italic">Then it sticks for life.</span>
          </h2>
          <p className="mx-auto mt-2.5 max-w-xl font-sans text-sm sm:text-base text-muted-foreground leading-relaxed">
            Novella is built around one tight, frictionless loop designed for modern busy readers. No complex deck building — just pure reading and retention.
          </p>
        </div>

        {/* Steps Pipeline */}
        <div className="relative mt-8 grid gap-4 lg:grid-cols-3">
          {steps.map((step, idx) => {
            const Icon = step.icon
            return (
              <article
                className="group relative flex flex-col justify-between rounded-2xl border border-border/80 bg-card p-6 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-amber-500/40 hover:shadow-md"
                key={step.number}
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="flex size-9 items-center justify-center rounded-xl bg-amber-500/10 font-mono text-sm font-bold text-amber-600 dark:text-amber-400">
                      {step.number}
                    </span>
                    <Icon className="size-4.5 text-muted-foreground group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors" />
                  </div>

                  <h3 className="font-serif text-xl font-medium text-foreground">
                    {step.title}
                  </h3>
                  <p className="mt-0.5 font-mono text-xs text-amber-600 dark:text-amber-400 font-medium">
                    {step.tagline}
                  </p>
                  <p className="mt-3 font-sans text-sm text-muted-foreground leading-relaxed">
                    {step.description}
                  </p>
                </div>

                <div className="mt-5 border-t border-border/60 pt-3 flex items-center justify-between text-xs font-mono text-muted-foreground">
                  <span>Step {idx + 1} of 3</span>
                  <span className="group-hover:translate-x-1 transition-transform">→</span>
                </div>
              </article>
            )
          })}
        </div>
      </div>
    </section>
  )
}
