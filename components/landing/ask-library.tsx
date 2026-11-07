import StorySection from "./story-section"
import { ArrowRight, CheckCircle2, Search, Sparkles } from "lucide-react"

const prompts = [
  "Select a complex passage and receive an intuitive explanation",
  "Quiz yourself on a book using the personal notes you wrote",
  "Search across your entire reading history at once, connecting related ideas",
]

export default function AskLibrary() {
  return (
    <StorySection
      as="section"
      id="ask-library"
      className="ask-library bg-background text-foreground"
      stageClassName="flex items-center justify-center px-6 py-24 sm:px-12 lg:px-20"
      length={280}
    >
      <div className="grid w-full max-w-6xl items-center gap-16 lg:grid-cols-2 lg:gap-20">
        <div className="ask-library-copy scroll-reveal max-w-xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-border bg-secondary/80 px-3.5 py-1 mb-4 shadow-xs">
            <span className="font-mono text-xs font-semibold tracking-wider uppercase text-amber-600 dark:text-amber-400">
              AI Library Assistant
            </span>
          </div>
          <h2 className="font-serif text-4xl sm:text-6xl font-medium tracking-tight text-foreground leading-[1.08]">
            Conversations with your own{" "}
            <span className="italic">personal reading archive.</span>
          </h2>
          <p className="mt-6 font-sans text-lg text-muted-foreground leading-relaxed">
            Ask questions like: <i>&ldquo;What are the recurring themes on human willpower across all my books this year?&rdquo;</i> The answer draws strictly from the notes, highlights, and margin reflections you saved.
          </p>

          <ul className="mt-8 space-y-3 font-sans text-sm text-foreground/90">
            {prompts.map((prompt) => (
              <li className="flex items-start gap-3" key={prompt}>
                <CheckCircle2 className="mt-0.5 size-4.5 text-amber-500 shrink-0" />
                <span>{prompt}</span>
              </li>
            ))}
          </ul>

          <div className="mt-10">
            <a
              className="site-button site-button-primary group inline-flex items-center gap-2"
              href="#features"
            >
              <span>Explore all features</span>
              <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
            </a>
          </div>
        </div>

        <div className="ask-library-visual scroll-reveal relative flex items-center justify-center rounded-3xl border border-border/80 bg-secondary/40 p-8 shadow-sm">
          <div className="w-full max-w-md rounded-2xl border border-border/80 bg-card p-6 shadow-xl backdrop-blur-md">
            <div className="flex items-center justify-between border-b border-border/60 pb-3">
              <span className="font-mono text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <Sparkles className="size-3.5 text-amber-500" />
                Library Search
              </span>
              <span className="font-mono text-[11px] text-muted-foreground">12 books indexed</span>
            </div>
            <div className="mt-4 flex items-center gap-2.5 rounded-xl border border-border bg-secondary/50 px-3.5 py-2.5">
              <Search className="size-4 text-muted-foreground shrink-0" />
              <span className="font-sans text-sm text-foreground font-medium">What have I learned about habit formation?</span>
            </div>
            <div className="mt-5 rounded-xl border border-amber-500/30 bg-amber-500/5 p-4 border-l-4 border-l-amber-500">
              <p className="font-serif text-lg leading-snug text-foreground">
                &ldquo;Your notes consistently highlight that identity-based changes and microscopic daily repetitions outlast sudden bursts of motivation.&rdquo;
              </p>
              <p className="mt-3 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                Synthesized from 4 notes · Atomic Habits & The Power of Habit
              </p>
            </div>
          </div>
        </div>
      </div>
    </StorySection>
  )
}
