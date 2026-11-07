import { Check, Sparkles } from "lucide-react"

const rows = [
  {
    feature: "Core philosophy",
    flashcards: "Decontextualized drill memorization",
    highlights: "Passive highlight collecting",
    novella: "Connected literary reading & retention",
  },
  {
    feature: "Tied to the book you are reading",
    flashcards: "No (isolated cards)",
    highlights: "Yes (passive sync)",
    novella: "Yes (rich context & page metadata)",
  },
  {
    feature: "Spaced repetition review",
    flashcards: "Yes (complex algorithm)",
    highlights: "Basic resurfacing only",
    novella: "Yes (seamless 3-minute daily loop)",
  },
  {
    feature: "Setup friction",
    flashcards: "Heavy manual data entry",
    highlights: "Highlighting only",
    novella: "One tap with automatic AI enrichment",
  },
  {
    feature: "Designed for language & exam students",
    flashcards: "Requires community decks",
    highlights: "No",
    novella: "Yes (built for vocabulary expansion)",
  },
  {
    feature: "Habit protection",
    flashcards: "No (punishing backlog)",
    highlights: "No",
    novella: "Yes (streak freeze shield)",
  },
]

export default function Comparison() {
  return (
    <section
      id="comparison"
      className="comparison flex min-h-dvh w-full items-center justify-center bg-background px-6 py-12 sm:px-12"
    >
      <div className="section-content w-full max-w-5xl">
        {/* Intro */}
        <div className="max-w-2xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-border bg-secondary/80 px-3 py-1 mb-2.5">
            <span className="font-mono text-xs font-semibold tracking-wider uppercase text-amber-600 dark:text-amber-400">
              The Difference
            </span>
          </div>
          <h2 className="font-serif text-3xl sm:text-4xl font-medium tracking-tight text-foreground leading-[1.12]">
            Why not just use what you have?
          </h2>
          <p className="mt-2.5 font-sans text-sm sm:text-base text-muted-foreground leading-relaxed max-w-xl mx-auto">
            Flashcards drill cards out of context. Highlight scrapers collect lines that gather dust. Novella joins the exact page to memory.
          </p>
        </div>

        {/* Matrix Table */}
        <div className="mt-7 overflow-x-auto rounded-2xl border border-border/80 bg-card shadow-sm">
          <table className="w-full min-w-[36rem] border-collapse text-left">
            <thead>
              <tr className="border-b border-border/80 bg-secondary/40">
                <th scope="col" className="sticky left-0 z-10 bg-secondary/40 p-4 font-mono text-[11px] font-semibold uppercase tracking-wider text-muted-foreground w-[35%]">
                  Feature
                </th>
                <th scope="col" className="p-4 text-center font-serif text-base font-semibold text-foreground w-[25%] bg-amber-500/10 border-x-2 border-t-2 border-amber-500/30 rounded-t-xl">
                  <div className="flex items-center justify-center gap-1.5 text-amber-600 dark:text-amber-400">
                    <Sparkles className="size-3.5" />
                    <span>Novella</span>
                  </div>
                  <span className="block font-mono text-[10px] text-muted-foreground font-normal mt-0.5">Reading Notebook</span>
                </th>
                <th scope="col" className="p-4 text-center font-serif text-base font-medium text-foreground w-[20%]">
                  Flashcard Apps
                  <span className="block font-mono text-[10px] text-muted-foreground font-normal mt-0.5">e.g. Anki</span>
                </th>
                <th scope="col" className="p-4 text-center font-serif text-base font-medium text-foreground w-[20%]">
                  Highlight Tools
                  <span className="block font-mono text-[10px] text-muted-foreground font-normal mt-0.5">e.g. Readwise</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {rows.map((row, index) => (
                <tr key={row.feature} className={index % 2 === 0 ? "bg-card" : "bg-secondary/20"}>
                  <th scope="row" className="sticky left-0 z-10 p-3.5 font-sans text-xs sm:text-sm font-medium text-foreground bg-inherit">
                    {row.feature}
                  </th>
                  <td className="p-3.5 text-center font-sans text-xs sm:text-sm font-semibold text-foreground bg-amber-500/5 border-x-2 border-amber-500/30">
                    <div className="flex items-center justify-center gap-1.5">
                      <Check className="size-4 text-amber-500 shrink-0" />
                      <span className="hidden sm:inline">{row.novella}</span>
                    </div>
                  </td>
                  <td className="p-3.5 text-center font-sans text-xs sm:text-sm text-muted-foreground">
                    {row.flashcards}
                  </td>
                  <td className="p-3.5 text-center font-sans text-xs sm:text-sm text-muted-foreground">
                    {row.highlights}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  )
}
