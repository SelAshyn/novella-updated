import { ArrowUpRight, CheckCircle2, Users, AlertCircle } from "lucide-react"

const SCHOOLS_CONTACT = "mailto:schools@novella.app"

const benefits = [
  "Assign common books, chapters, or curated vocabulary lists to the cohort",
  "Real-time telemetry on reading pace, completed reviews, and retention",
  "Automated tracking of words the class struggles with most each week",
  "Zero grading overhead — algorithmic spaced repetition handles it",
]

export default function ForSchools() {
  return (
    <section
      id="for-schools"
      className="for-schools flex h-dvh w-full items-center justify-center bg-secondary/50 text-foreground px-6 py-6 sm:px-12"
    >
      <div className="section-content grid w-full max-w-5xl items-center gap-10 lg:grid-cols-2">
        {/* Interactive Classroom Mockup */}
        <div className="schools-visual order-2 flex items-center justify-center lg:order-1">
          <div className="w-full max-w-md rounded-2xl border border-border/80 bg-card p-5 sm:p-6 shadow-lg backdrop-blur-md">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-border/60 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="flex size-8 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
                  <Users className="size-4" />
                </div>
                <div>
                  <h4 className="font-serif text-base font-medium text-foreground leading-none">Literature Cohort B</h4>
                  <p className="font-mono text-[10px] text-muted-foreground mt-0.5">AP English · 28 Students</p>
                </div>
              </div>
              <span className="rounded-full bg-emerald-500/10 px-2.5 py-0.5 font-mono text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                Active Week
              </span>
            </div>

            {/* Metric Cards */}
            <div className="mt-4 grid grid-cols-3 gap-2.5">
              <div className="rounded-xl border border-border/60 bg-secondary/50 p-2.5 text-center">
                <p className="font-serif text-xl font-semibold text-foreground">28</p>
                <p className="font-mono text-[10px] uppercase text-muted-foreground mt-0.5">Enrolled</p>
              </div>
              <div className="rounded-xl border border-border/60 bg-secondary/50 p-2.5 text-center">
                <p className="font-serif text-xl font-semibold text-emerald-600 dark:text-emerald-400">92%</p>
                <p className="font-mono text-[10px] uppercase text-muted-foreground mt-0.5">Review</p>
              </div>
              <div className="rounded-xl border border-border/60 bg-secondary/50 p-2.5 text-center">
                <p className="font-serif text-xl font-semibold text-amber-600 dark:text-amber-400">412</p>
                <p className="font-mono text-[10px] uppercase text-muted-foreground mt-0.5">Saved</p>
              </div>
            </div>

            {/* Hardest Words List */}
            <div className="mt-4">
              <div className="flex items-center justify-between text-xs font-mono text-muted-foreground mb-2">
                <span className="flex items-center gap-1.5 font-semibold uppercase tracking-wider">
                  <AlertCircle className="size-3.5 text-amber-500" />
                  Hardest Words
                </span>
                <span>Miss Rate</span>
              </div>
              <div className="space-y-1.5">
                {[
                  { word: "anachronism", missed: "42%" },
                  { word: "surreptitious", missed: "36%" },
                  { word: "ephemeral", missed: "18%" },
                ].map((item) => (
                  <div
                    key={item.word}
                    className="flex items-center justify-between rounded-lg border border-border/60 bg-secondary/30 px-3 py-1.5 text-xs"
                  >
                    <span className="font-serif text-sm font-medium text-foreground">{item.word}</span>
                    <span className="font-mono text-xs text-amber-600 dark:text-amber-400 font-medium">
                      {item.missed}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Copy Side */}
        <div className="schools-copy order-1 max-w-lg lg:order-2">
          <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 mb-2.5 shadow-xs">
            <span className="font-mono text-xs font-semibold tracking-wider uppercase text-amber-600 dark:text-amber-400">
              For Schools
            </span>
          </div>
          <h2 className="font-serif text-3xl sm:text-4xl font-medium tracking-tight text-foreground leading-[1.12]">
            See what students read —{" "}
            <span className="italic">and what they keep.</span>
          </h2>
          <p className="mt-2.5 font-sans text-sm sm:text-base text-muted-foreground leading-relaxed">
            Create structured classes, assign required readings or tailored vocabulary sets, and pinpoint struggling concepts early.
          </p>

          <ul className="mt-5 space-y-2.5 font-sans text-sm text-foreground/90">
            {benefits.map((benefit) => (
              <li className="flex items-start gap-2.5" key={benefit}>
                <CheckCircle2 className="mt-0.5 size-4 text-amber-500 shrink-0" />
                <span>{benefit}</span>
              </li>
            ))}
          </ul>

          <div className="mt-6 flex items-center gap-3">
            <a
              className="site-button site-button-primary group inline-flex items-center gap-2 text-sm py-2.5 px-5"
              href={SCHOOLS_CONTACT}
            >
              <span>Partner with us</span>
              <ArrowUpRight className="size-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </a>
          </div>
        </div>
      </div>
    </section>
  )
}
