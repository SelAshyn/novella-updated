"use client";

import Link from "next/link";
import { format } from "date-fns";
import { useAuth } from "@/components/landing/auth-provider";

import {
  ArrowRight,
  Flame,
  Plus,
  Quote,
  Target,
  BookOpen,
} from "lucide-react";

import { PageTitle } from "@/components/dashboard/app-shell";
import { useDashboard } from "@/hooks/useDashboard";

export default function Dashboard() {
  const { data, loading, error } = useDashboard();
  const { user } = useAuth();

  const firstName = (user?.displayName || data?.userName || "").split(" ")[0];

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-muted-foreground">
          <BookOpen className="size-8 animate-pulse text-amber-500" />
          <p className="font-mono text-xs uppercase tracking-wider">Loading your library…</p>
        </div>
      </div>
    );
  }

  const stats = data?.stats || {
    currentStreak: 0,
    longestStreak: 0,
    totalBooksRead: 0,
    totalPagesRead: 0,
    totalWordsLearned: 0,
    totalQuotesCollected: 0,
    streakFreezes: 1,
  };

  const todayCards = data?.todayCards || [];
  const currentlyReading = data?.currentlyReading || [];
  const recentQuotes = data?.recentQuotes || [];
  const weekActivity = data?.weekActivity || [
    { day: 'M', count: 0 },
    { day: 'T', count: 0 },
    { day: 'W', count: 0 },
    { day: 'T', count: 0 },
    { day: 'F', count: 0 },
    { day: 'S', count: 0 },
    { day: 'S', count: 0 },
  ];

  const max = Math.max(...weekActivity.map((w) => w.count), 1);

  const now = new Date();
  const dayName = format(now, 'EEEE');
  const dateStr = format(now, 'd MMMM');
  const greeting = now.getHours() < 12 ? "Good morning" : now.getHours() < 18 ? "Good afternoon" : "Good evening";

  return (
    <>
      <PageTitle kicker={`${dayName}, ${dateStr}`}>
        {greeting}{firstName ? `, ${firstName}` : ""}.{" "}
        {todayCards.length > 0 && (
          <>
            <span className="marker">
              {todayCards.length} word{todayCards.length !== 1 ? 's' : ''}
            </span>{" "}
            {todayCards.length === 1 ? 'is' : 'are'} waiting for review.
          </>
        )}
        {todayCards.length === 0 && "What will you read today?"}
      </PageTitle>

      {error && (
        <div className="mb-6 rounded-xl border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive">
          Something went wrong loading your dashboard. Please refresh the page.
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Daily Review Hero Card */}
        <section
          className="relative overflow-hidden rounded-3xl border border-border/80 bg-primary p-8 sm:p-10 text-primary-foreground shadow-lg lg:col-span-2 flex flex-col justify-between"
          aria-labelledby="review-h"
        >
          {/* Subtle Ambient Glow */}
          <div className="pointer-events-none absolute -top-20 -right-20 size-72 rounded-full bg-amber-500/15 blur-3xl" />

          <div className="relative z-10">
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs font-semibold uppercase tracking-wider opacity-80">
                Daily Review {todayCards.length > 0 && `· ~${Math.ceil(todayCards.length * 0.5)} min`}
              </span>
              <span className="rounded-full bg-primary-foreground/15 px-3 py-0.5 font-mono text-[10px] uppercase font-semibold">
                Spaced Recall
              </span>
            </div>

            <h2
              id="review-h"
              className="mt-4 font-serif text-3xl text-white dark:text-black sm:text-4xl lg:text-5xl font-medium tracking-tight leading-[1.12]"
            >
              {todayCards.length > 0
                ? "Review your cards before the memory fades."
                : "Your memory queue is clear. Read and add new vocabulary."}
            </h2>

            {todayCards.length > 0 && (
              <div className="mt-6 flex flex-wrap gap-2">
                {todayCards.slice(0, 8).map((c) => (
                  <span
                    key={c.id}
                    className="rounded-lg border border-primary-foreground/20 bg-primary-foreground/10 px-3 py-1.5 font-sans text-xs font-medium backdrop-blur-sm"
                  >
                    {c.word}
                  </span>
                ))}
                {todayCards.length > 8 && (
                  <span className="rounded-lg border border-primary-foreground/20 bg-primary-foreground/10 px-3 py-1.5 font-mono text-xs font-medium opacity-80">
                    +{todayCards.length - 8} more
                  </span>
                )}
              </div>
            )}
          </div>

          <div className="relative z-10 mt-8">
            {todayCards.length > 0 ? (
              <Link
                href="/dashboard/review"
                className="site-button inline-flex items-center gap-2 rounded-xl bg-amber-500 text-black font-semibold shadow-md hover:bg-amber-400 hover:scale-[1.02] transition-all px-6 py-3"
              >
                <span>Start Today&apos;s Review</span>
                <ArrowRight className="size-4" />
              </Link>
            ) : (
              <Link
                href="/dashboard/library"
                className="site-button inline-flex items-center gap-2 rounded-xl bg-primary-foreground text-primary font-semibold shadow-md hover:opacity-90 transition-all px-6 py-3"
              >
                <span>Explore Library</span>
                <ArrowRight className="size-4" />
              </Link>
            )}
          </div>
        </section>

        {/* Streak & Activity Card */}
        <section className="rounded-3xl border border-border/80 bg-card p-6 sm:p-8 shadow-xs flex flex-col justify-between" aria-labelledby="streak-h">
          <div>
            <div className="flex items-center justify-between">
              <span id="streak-h" className="flex items-center gap-2 font-mono text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                <Flame className="size-4 text-amber-500" />
                Momentum
              </span>
              <span className="rounded-full bg-secondary px-2.5 py-0.5 font-mono text-[10px] text-muted-foreground">
                Weekly
              </span>
            </div>

            <div className="mt-4 flex items-baseline gap-2">
              <span className="font-serif text-6xl font-bold tracking-tight text-foreground">
                {stats.currentStreak}
              </span>
              <span className="font-sans text-lg text-muted-foreground font-medium">
                day{stats.currentStreak !== 1 ? 's' : ''} in a row
              </span>
            </div>
          </div>

          <div className="mt-8 border-t border-border/60 pt-6">
            <p className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground mb-3 font-semibold">
              Activity this week
            </p>

            <div className="flex h-24 items-end gap-2.5">
              {weekActivity.map((w, i) => (
                <div
                  key={i}
                  className="flex h-full flex-1 flex-col items-center justify-end gap-1.5"
                >
                  <div
                    className={`w-full rounded-md transition-all ${
                      i === weekActivity.length - 1
                        ? "bg-amber-500 shadow-xs"
                        : "bg-secondary hover:bg-muted"
                    }`}
                    style={{
                      height: w.count > 0 ? `${(w.count / max) * 100}%` : '6px',
                    }}
                    title={`${w.count} activities on ${w.day}`}
                  />
                  <span className="font-mono text-[10px] text-muted-foreground">{w.day}</span>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>

      {/* Currently Reading Section */}
      <section className="mt-14" aria-labelledby="reading-h">
        <div className="mb-6 flex items-end justify-between border-b border-border/60 pb-4">
          <div>
            <h2 id="reading-h" className="font-serif text-3xl sm:text-4xl font-medium tracking-tight text-foreground">
              Currently reading
            </h2>
            <p className="font-sans text-xs text-muted-foreground mt-1">
              Track your reading pacing and active vocabulary
            </p>
          </div>

          <Link
            href="/dashboard/library"
            className="font-mono text-xs uppercase tracking-wider text-amber-600 dark:text-amber-400 hover:underline font-semibold"
          >
            View all books →
          </Link>
        </div>

        {currentlyReading.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border/80 bg-card/60 p-12 text-center">
            <BookOpen className="mx-auto size-10 text-muted-foreground/60 mb-3" />
            <h3 className="font-serif text-2xl font-medium text-foreground">Your reading list is empty</h3>
            <p className="font-sans text-sm text-muted-foreground mt-2 max-w-sm mx-auto">
              Add a book to start tracking your reading pace, words, and quotes.
            </p>
            <Link
              href="/dashboard/library"
              className="site-button site-button-primary mt-6 inline-flex items-center gap-2"
            >
              <Plus className="size-4" />
              <span>Add your first book</span>
            </Link>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2">
            {currentlyReading.map((b) => {
              const pct = Math.round(
                (b.currentPage / b.totalPages) * 100
              );

              const perDay = b.dueDate
                ? Math.ceil((b.totalPages - b.currentPage) / Math.max(1, Math.ceil((new Date(b.dueDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))))
                : null;

              return (
                <article
                  key={b.id}
                  className="rounded-2xl border border-border/80 bg-card p-6 shadow-xs hover:shadow-md transition-all group"
                >
                  <div className="flex justify-between items-start gap-4">
                    <div className="min-w-0">
                      <h3 className="font-serif text-2xl font-medium text-foreground leading-snug truncate">
                        {b.title}
                      </h3>
                      <p className="font-sans text-sm text-muted-foreground mt-0.5">
                        by {b.author}
                      </p>
                    </div>

                    <Link
                      href={`/dashboard/library/${b.id}`}
                      aria-label={`Open ${b.title}`}
                      className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-border bg-secondary text-foreground transition-all group-hover:border-amber-500/50 group-hover:text-amber-600 dark:group-hover:text-amber-400 shadow-xs"
                    >
                      <ArrowRight className="size-4" />
                    </Link>
                  </div>

                  {/* Reading Progress Bar */}
                  <div className="mt-5">
                    <div className="flex justify-between text-xs font-mono text-muted-foreground mb-1.5">
                      <span>Progress</span>
                      <span className="font-semibold text-foreground">{pct}%</span>
                    </div>
                    <div className="h-2 rounded-full bg-secondary overflow-hidden">
                      <div
                        className="h-full rounded-full bg-amber-500 transition-all duration-300"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>

                  <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-border/60 pt-3 font-mono text-xs text-muted-foreground">
                    <span>
                      p. {b.currentPage} of {b.totalPages}
                    </span>

                    {perDay && b.dueDate ? (
                      <span className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400 font-medium">
                        <Target className="size-3.5" />
                        {perDay} pages/day · by {format(new Date(b.dueDate), 'd MMM')}
                      </span>
                    ) : (
                      <span>No deadline</span>
                    )}
                  </div>

                  {b._count && (
                    <div className="mt-2 flex gap-4 font-mono text-[11px] text-muted-foreground">
                      <span>{b._count.vocabularyCards} saved words</span>
                      <span>{b._count.quotes} quotes</span>
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        )}
      </section>

      {/* Recently Marked Quotes */}
      {recentQuotes.length > 0 && (
        <section className="mt-14" aria-labelledby="quotes-h">
          <div className="mb-6 border-b border-border/60 pb-4">
            <h2 id="quotes-h" className="font-serif text-3xl sm:text-4xl font-medium tracking-tight text-foreground">
              Recently marked quotes
            </h2>
            <p className="font-sans text-xs text-muted-foreground mt-1">
              Lines that stopped you in your tracks
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            {recentQuotes.map((q) => (
              <figure
                key={q.id}
                className="relative rounded-2xl border border-border/80 bg-card p-6 shadow-xs border-l-4 border-l-amber-500 flex flex-col justify-between"
              >
                <div>
                  <Quote className="size-4 text-amber-500/80 mb-2" />
                  <blockquote className="font-serif text-lg sm:text-xl md:text-2xl leading-relaxed text-foreground">
                    &ldquo;{q.text}&rdquo;
                  </blockquote>
                </div>

                <figcaption className="mt-4 font-mono text-xs text-muted-foreground border-t border-border/40 pt-3">
                  {q.book.title} · p. {q.pageNumber}
                </figcaption>
              </figure>
            ))}
          </div>
        </section>
      )}
    </>
  );
}
