import { GraduationCap, Languages, BookMarked, CheckCircle2 } from "lucide-react"

const audiences = [
  {
    icon: GraduationCap,
    badge: "Academic",
    title: "Exam students",
    tagline: "IELTS, SAT, GRE, A-Levels",
    description:
      "Working through dense academic texts, challenging novels, and specialized word lists. Secure every concept in memory.",
    highlights: ["Retain high-frequency vocabulary", "Review set texts on schedule", "Exam-readiness analytics"],
  },
  {
    icon: Languages,
    badge: "Languages",
    title: "Second-language readers",
    tagline: "Bridging the fluency gap",
    description:
      "Encounter unfamiliar words in foreign literature and meet them repeatedly in natural context until second nature.",
    highlights: ["Authentic context preservation", "Automatic pronunciation guides", "Gradual spaced reinforcement"],
  },
  {
    icon: BookMarked,
    badge: "Lifelong",
    title: "Deep nonfiction readers",
    tagline: "Philosophy, history, economics",
    description:
      "Retain mental models, compelling arguments, and terminology — building compounding intellectual capital.",
    highlights: ["Compound mental models", "Quote and excerpt synthesis", "Private per-book notebooks"],
  },
]

export default function BuiltFor() {
  return (
    <section
      id="built-for"
      className="built-for flex min-h-dvh h-auto w-full items-center justify-center bg-secondary/40 text-foreground px-4 py-12 sm:px-12"
    >
      <div className="section-content w-full max-w-5xl">
        {/* Intro */}
        <div className="mx-auto max-w-2xl text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 mb-2.5 shadow-xs">
            <span className="font-mono text-xs font-semibold tracking-wider uppercase text-amber-600 dark:text-amber-400">
              Who It&apos;s For
            </span>
          </div>
          <h2 className="font-serif text-3xl sm:text-4xl font-medium tracking-tight text-foreground leading-[1.12]">
            Built for readers reading toward{" "}
            <span className="italic">a meaningful goal.</span>
          </h2>
          <p className="mx-auto mt-2.5 max-w-xl font-sans text-sm sm:text-base text-muted-foreground leading-relaxed">
            If you read to learn, expand your vocabulary, or pass exams, Novella is your secret weapon. If you only log books to check off numbers, you won&apos;t need it.
          </p>
        </div>

        {/* 3 Audience Cards */}
        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          {audiences.map((audience) => {
            const Icon = audience.icon
            return (
              <article
                className="group relative flex flex-col justify-between rounded-2xl border border-border/80 bg-card p-6 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-amber-500/40 hover:shadow-md"
                key={audience.title}
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex size-10 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 transition-transform duration-200 group-hover:scale-110">
                      <Icon aria-hidden="true" className="size-5 stroke-[1.8]" />
                    </div>
                    <span className="rounded-full bg-secondary/80 px-2.5 py-0.5 font-mono text-[10px] font-semibold uppercase text-muted-foreground">
                      {audience.badge}
                    </span>
                  </div>

                  <h3 className="font-serif text-xl font-medium text-foreground">
                    {audience.title}
                  </h3>
                  <p className="mt-0.5 font-mono text-xs text-amber-600 dark:text-amber-400 font-medium">
                    {audience.tagline}
                  </p>
                  <p className="mt-2.5 font-sans text-sm text-muted-foreground leading-relaxed">
                    {audience.description}
                  </p>
                </div>

                <div className="mt-5 border-t border-border/60 pt-4">
                  <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground mb-2 font-semibold">
                    Key Outcomes
                  </p>
                  <ul className="space-y-1.5 text-xs sm:text-sm font-sans text-foreground/80">
                    {audience.highlights.map((item) => (
                      <li key={item} className="flex items-center gap-2">
                        <CheckCircle2 className="size-3.5 text-amber-500 shrink-0" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </article>
            )
          })}
        </div>
      </div>
    </section>
  )
}
