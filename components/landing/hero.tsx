"use client"

import Link from "next/link"
import { ArrowRight, ChevronDown, Sparkles, BookMarked } from "lucide-react"

export default function Hero() {
  function handleExploreClick(e: React.MouseEvent<HTMLAnchorElement>) {
    e.preventDefault()
    const target = document.getElementById("how-it-works")
    if (target) {
      target.scrollIntoView({ behavior: "smooth", block: "start" })
      history.replaceState(null, "", "#how-it-works")
    }
  }

  return (
    <section id="hero" className="hero-section relative flex min-h-dvh w-full flex-col items-center justify-center bg-background px-6 py-12 text-center sm:px-12">
      <div className="relative z-10 flex w-full max-w-4xl flex-col items-center section-content">


        {/* Headline */}
        <h1 className="font-serif text-3xl font-medium tracking-tight text-foreground sm:text-5xl lg:text-6xl leading-[1.08] max-w-3xl">
          Read deeply.{" "}
          <span className="relative inline-block">
            <span className="marker text-foreground">Remember</span>
          </span>{" "}
          what you read.
        </h1>

        {/* Subtitle */}
        <p className="mt-5 max-w-xl font-sans text-base sm:text-lg text-muted-foreground font-normal leading-relaxed">
          Mark a word or save a passage while you read. Novella automatically crafts review cards
          and resurfaces them right before your memory fades.
        </p>

        {/* CTA Buttons */}
        <div className="mt-7 flex flex-wrap justify-center gap-3.5">
          <Link href="/auth#create" className="site-button site-button-primary group px-6 py-3 text-sm">
            <span>Start reading for free</span>
            <ArrowRight className="size-4 transition-transform duration-200 group-hover:translate-x-1" />
          </Link>
          <a
            href="#how-it-works"
            className="site-button site-button-outline px-6 py-3 text-sm"
            onClick={handleExploreClick}
          >
            <span>See how it works</span>
            <ChevronDown className="size-4" />
          </a>
        </div>

        {/* Trust bar */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-5 border-t border-border/60 pt-5 text-xs text-muted-foreground font-mono">
          <span className="flex items-center gap-1.5">
            <BookMarked className="size-3.5 text-amber-500" />
            Physical books, Kindle &amp; PDFs
          </span>
          <span className="hidden sm:inline">•</span>
          <span className="flex items-center gap-1.5">
            <Sparkles className="size-3.5 text-amber-500" />
            Zero manual flashcard creation
          </span>
          <span className="hidden sm:inline">•</span>
          <span>3 minutes daily review</span>
        </div>

        {/* Scroll hint */}
        <p className="mt-6 font-mono text-[11px] tracking-[0.2em] uppercase text-muted-foreground/60 animate-bounce">
          Scroll to explore ↓
        </p>
      </div>
    </section>
  )
}
