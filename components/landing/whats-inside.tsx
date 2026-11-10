import {
  Sparkles,
  Quote,
  RefreshCw,
  Flame,
  Target,
  BookOpenText,
} from "lucide-react"

const features = [
  {
    icon: Sparkles,
    badge: "Instant Capture",
    title: "One-tap AI word auto-fill",
    description:
      "Type any word you encounter. Novella automatically looks up the definition, phonetics, part of speech, and contextual examples.",
  },
  {
    icon: Quote,
    badge: "Passage OCR",
    title: "Quote & highlight capture",
    description:
      "Save quotes by typing or snapping a photo of the physical page. OCR extracts text, book metadata, and page numbers.",
  },
  {
    icon: RefreshCw,
    badge: "Active Recall",
    title: "Adaptive daily reviews",
    description:
      "Spend just 3 minutes a day reviewing intelligent prompt cards tailored to your personal forgetting curve.",
  },
  {
    icon: Flame,
    badge: "Habit Engine",
    title: "Streak counter with freeze shield",
    description:
      "Maintain reading momentum with streak counters. Automatic streak freezes protect you so busy days don't reset progress.",
  },
  {
    icon: Target,
    badge: "Pacing",
    title: "Dynamic reading goals",
    description:
      "Set target completion dates. Novella calculates your daily page quota and recalculates when you fall behind.",
  },
  {
    icon: BookOpenText,
    badge: "Synthesis",
    title: "Private marginalia notebooks",
    description:
      "A dedicated Markdown notebook per title for your summaries, reflections, and arguments in your own words.",
  },
]

export default function WhatsInside() {
  return (
    <section
      id="features"
      className="whats-inside flex min-h-dvh h-auto w-full items-center justify-center bg-background px-4 py-12 sm:px-12"
    >
      <div className="section-content w-full max-w-5xl">
        {/* Intro */}
        <div className="max-w-2xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-border bg-secondary/80 px-3 py-1 mb-2.5">
            <span className="font-mono text-xs font-semibold tracking-wider uppercase text-amber-600 dark:text-amber-400">
              Features
            </span>
          </div>
          <h2 className="font-serif text-3xl sm:text-4xl font-medium tracking-tight text-foreground leading-[1.12]">
            A complete reading notebook,{" "}
            <span className="italic">not another disconnected tracker.</span>
          </h2>
          <p className="mt-2.5 max-w-xl mx-auto font-sans text-sm sm:text-base text-muted-foreground leading-relaxed">
            The word you save while reading today is the exact card you review tomorrow. Zero friction.
          </p>
        </div>

        {/* Features Bento Grid */}
        <div className="mt-7 grid gap-3.5 sm:grid-cols-2 lg:grid-cols-3">
          {features.map(({ icon: Icon, badge, title, description }) => (
            <article
              className="group relative flex flex-col justify-between rounded-2xl border border-border/80 bg-card p-5 sm:p-5.5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-amber-500/40 hover:shadow-md"
              key={title}
            >
              <div>
                <div className="flex items-center justify-between mb-3.5">
                  <div className="flex size-9 items-center justify-center rounded-xl bg-secondary text-foreground transition-colors group-hover:bg-amber-500/10 group-hover:text-amber-600 dark:group-hover:text-amber-400">
                    <Icon aria-hidden="true" className="size-4.5 stroke-[1.8]" />
                  </div>
                  <span className="rounded-full bg-secondary/80 px-2.5 py-0.5 font-mono text-[10px] font-semibold tracking-wider uppercase text-muted-foreground">
                    {badge}
                  </span>
                </div>
                <h3 className="font-serif text-lg font-medium text-foreground">{title}</h3>
                <p className="mt-1.5 font-sans text-xs sm:text-sm text-muted-foreground leading-relaxed">
                  {description}
                </p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
