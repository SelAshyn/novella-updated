import { ChevronDown } from "lucide-react"

const questions = [
  {
    question: "Do I have to build flashcards manually?",
    answer:
      "Never. The word or sentence you save while reading is the exact card you review tomorrow. Novella automatically enriches it with definitions, phonetics, and context.",
  },
  {
    question: "What happens if I miss a daily review?",
    answer:
      "An automatic Streak Freeze shields your streak when you miss a day, and your review queue picks right back up without overwhelming backlogs.",
  },
  {
    question: "How long does a daily review actually take?",
    answer:
      "About 3 minutes. Each day you receive a focused, algorithmically balanced deck sized specifically to your recent reading cadence.",
  },
  {
    question: "Can I use Novella with physical books and Kindle?",
    answer:
      "Yes. Type any word or passage, or take a quick photo of any physical page using our optical scanner to automatically extract text and metadata.",
  },
  {
    question: "Does it support local and international literature?",
    answer:
      "Absolutely. Works from Nepali, South Asian, and global authors are supported with multilingual character sets and custom dictionaries.",
  },
]

export default function Questions() {
  return (
    <section
      id="questions"
      className="questions flex min-h-dvh h-auto w-full items-center justify-center bg-secondary/40 px-4 py-12 text-foreground sm:px-12"
    >
      <div className="section-content w-full max-w-3xl">
        {/* Intro */}
        <div className="text-center max-w-xl mx-auto">
          <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 mb-2.5 shadow-xs">
            <span className="font-mono text-xs font-semibold tracking-wider uppercase text-amber-600 dark:text-amber-400">
              FAQ
            </span>
          </div>
          <h2 className="font-serif text-3xl sm:text-4xl font-medium tracking-tight text-foreground leading-[1.12]">
            Everything you need to know.
          </h2>
          <p className="mt-2.5 font-sans text-sm sm:text-base text-muted-foreground leading-relaxed">
            Quick answers about flashcard automation, habit streaks, book formats, and daily review pacing.
          </p>
        </div>

        {/* Questions Accordion List */}
        <div className="mt-6 space-y-2.5">
          {questions.map(({ question, answer }, index) => (
            <details
              className="group rounded-2xl border border-border/80 bg-card p-4 sm:p-4.5 shadow-xs transition-all duration-200 hover:border-amber-500/40"
              key={question}
              open={index === 0}
            >
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-serif text-base sm:text-lg font-medium text-foreground [&::-webkit-details-marker]:hidden focus-visible:outline-none">
                <span>{question}</span>
                <span className="flex size-7 shrink-0 items-center justify-center rounded-xl bg-secondary text-muted-foreground transition-all duration-200 group-hover:text-foreground group-open:bg-amber-500/10 group-open:text-amber-600 dark:group-open:text-amber-400">
                  <ChevronDown
                    aria-hidden="true"
                    className="size-4 transition-transform duration-300 group-open:rotate-180"
                  />
                </span>
              </summary>
              <p className="mt-2.5 font-sans text-sm text-muted-foreground leading-relaxed border-t border-border/40 pt-2.5">
                {answer}
              </p>
            </details>
          ))}
        </div>
      </div>
    </section>
  )
}
