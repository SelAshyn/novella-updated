"use client";

import Link from "next/link";
import { useEffect, useState, useCallback } from "react";
import { AlertCircle, CheckCircle2, ArrowRight, BookOpen, Sparkles, Volume2 } from "lucide-react";

import { PageTitle } from "@/components/dashboard/app-shell";
import { useAuth } from "@/components/landing/auth-provider";
import posthog from "posthog-js";

interface ReviewCard {
  id: string;
  word: string;
  ipa?: string | null;
  meaning: string;
  example: string;
  pageNumber: number;
  book: { title: string };
}

async function authHeaders(user: NonNullable<ReturnType<typeof import("@/components/landing/auth-provider").useAuth>["user"]>): Promise<HeadersInit> {
  const token = await user.getIdToken();
  return {
    "Content-Type": "application/json",
    "x-firebase-uid": user.uid,
    "x-firebase-email": user.email ?? "",
    "x-firebase-name": user.displayName ?? "",
    Authorization: `Bearer ${token}`,
  };
}

export default function Review() {
  const { user, loading: authLoading } = useAuth();

  const [cards, setCards] = useState<ReviewCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [i, setI] = useState(0);
  const [shown, setShown] = useState(false);

  const fetchDue = useCallback(async () => {
    if (!user) return;
    try {
      setLoading(true);
      setError(null);
      const headers = await authHeaders(user);
      const res = await fetch("/api/vocabulary/due", { headers });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || `Failed to load review cards (${res.status})`);
      }
      const data = await res.json();
      setCards(data.cards ?? []);
    } catch (err: any) {
      console.error("[review] fetch error:", err);
      setError(err?.message ?? "Failed to load review cards.");
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (!authLoading && user) fetchDue();
    else if (!authLoading && !user) setLoading(false);
  }, [authLoading, user, fetchDue]);

  async function grade(interval: number) {
    const card = cards[i];
    if (!user) return;
    try {
      const headers = await authHeaders(user);
      const res = await fetch(`/api/vocabulary/${card.id}/review`, {
        method: "PATCH",
        headers,
        body: JSON.stringify({ interval }),
      });
      if (!res.ok) throw new Error("Failed to save review grade");
      posthog.capture("review_card_graded", {
        review_interval_days: interval,
        cards_remaining: cards.length - i - 1,
      });
      if (i + 1 === cards.length) {
        posthog.capture("review_completed", { items_reviewed: cards.length });
      }
    } catch (err) {
      console.error("[review] grade error:", err);
      return;
    }
    setShown(false);
    setI((prev) => prev + 1);
  }

  // ── Loading ───────────────────────────────────────────────────────────────
  if (authLoading || loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-muted-foreground">
          <Sparkles className="size-8 animate-pulse text-amber-500" />
          <p className="font-mono text-xs uppercase tracking-wider">Preparing your review deck…</p>
        </div>
      </div>
    );
  }

  // ── Error ─────────────────────────────────────────────────────────────────
  if (error) {
    return (
      <>
        <PageTitle>Daily Review</PageTitle>
        <div className="rounded-2xl border border-destructive/40 bg-card p-6 shadow-sm max-w-2xl">
          <div className="flex items-start gap-3">
            <AlertCircle className="mt-0.5 size-5 shrink-0 text-destructive" />
            <div>
              <p className="font-serif text-lg font-medium text-destructive">Could not load review cards</p>
              <p className="mt-1 text-sm text-muted-foreground">{error}</p>
            </div>
          </div>
          <button
            onClick={fetchDue}
            className="site-button site-button-primary mt-6 inline-flex"
          >
            Try again
          </button>
        </div>
      </>
    );
  }

  const c = cards[i];
  const done = i >= cards.length;

  function parseExample(raw: string) {
    const parts = raw.split("|||");
    return { simple: parts[0] ?? raw, complex: parts[1] ?? "" };
  }

  return (
    <>
      <PageTitle
        kicker={
          done
            ? "Review complete"
            : cards.length === 0
            ? "Queue clear"
            : `Card ${i + 1} of ${cards.length}`
        }
      >
        {done || cards.length === 0 ? (
          <>That&apos;s today&apos;s deck. <span className="marker">See you tomorrow.</span></>
        ) : (
          "Do you remember this word?"
        )}
      </PageTitle>

      {/* No cards due */}
      {cards.length === 0 && (
        <div className="rounded-3xl border border-border/80 bg-card p-10 text-center max-w-2xl shadow-sm">
          <div className="flex size-14 mx-auto items-center justify-center rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 mb-4">
            <CheckCircle2 className="size-7" />
          </div>
          <h3 className="font-serif text-3xl font-medium text-foreground">You are all caught up!</h3>
          <p className="mt-2 text-sm text-muted-foreground max-w-md mx-auto">
            No words are due for review right now. Add new vocabulary while reading, or explore your library.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <Link
              href="/dashboard/vocabulary"
              className="site-button site-button-primary"
            >
              <span>Explore vocabulary</span>
            </Link>
            <Link
              href="/dashboard"
              className="site-button site-button-outline"
            >
              <span>Back to overview</span>
            </Link>
          </div>
        </div>
      )}

      {/* Review complete */}
      {done && cards.length > 0 && (
        <div className="rounded-3xl border border-border/80 bg-card p-10 text-center max-w-2xl shadow-sm">
          <div className="flex size-14 mx-auto items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 mb-4">
            <CheckCircle2 className="size-7" />
          </div>
          <h3 className="font-serif text-3xl font-medium text-foreground">Deck complete!</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            You reviewed {cards.length} word{cards.length !== 1 ? 's' : ''} today. Your streak is protected.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <Link
              href="/dashboard"
              className="site-button site-button-primary"
            >
              <span>Return to today</span>
              <ArrowRight className="size-4" />
            </Link>
          </div>
        </div>
      )}

      {/* Active card */}
      {!done && cards.length > 0 && c && (
        <div className="max-w-lg ">
          <div className="rounded-3xl border border-border/80 bg-card p-8 sm:p-12 shadow-md transition-all">
            <div className="flex items-center justify-between border-b border-border/60 pb-4">
              <span className="font-mono text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <BookOpen className="size-3.2 text-amber-500" />
                {c.book.title} · p. {c.pageNumber}
              </span>
              <span className="rounded-full bg-secondary px-2.5 py-0.5 font-mono text-[10px] text-muted-foreground font-semibold">
                Card {i + 1}/{cards.length}
              </span>
            </div>

            <h2 className="mt-6 font-serif text-3xl sm:text-4xl lg:text-5xl font-semibold tracking-tight text-foreground">
              {c.word}
            </h2>

            {c.ipa && (
              <p className="mt-2 font-mono text-sm text-muted-foreground flex items-center gap-1.5">
                <Volume2 className="size-3.2 text-amber-500" />
                {c.ipa}
              </p>
            )}

            {shown && (() => {
              const { simple, complex } = parseExample(c.example);
              return (
                <div className="mt-8 border-t border-border/80 pt-6 animate-in fade-in duration-300">
                  <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-5">
                    <p className="font-mono text-[11px] uppercase tracking-wider text-amber-600 dark:text-amber-400 font-semibold mb-1">
                      Definition
                    </p>
                    <p className="font-serif text-xl font-medium text-foreground leading-snug">
                      {c.meaning}
                    </p>
                  </div>

                  <div className="mt-5 space-y-2.5">
                    <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
                      Context & Examples
                    </p>
                    <p className="font-sans text-base text-foreground/90 italic leading-relaxed pl-3 border-l-2 border-amber-500/60">
                      &ldquo;{simple}&rdquo;
                    </p>
                    {complex && (
                      <p className="font-sans text-sm text-muted-foreground italic leading-relaxed pl-3 border-l-2 border-border/60">
                        &ldquo;{complex}&rdquo;
                      </p>
                    )}
                  </div>
                </div>
              );
            })()}
          </div>

          {/* Action rating buttons */}
          <div className="mt-8 flex flex-wrap gap-3">
            {!shown ? (
              <button
                onClick={() => setShown(true)}
                className="site-button site-button-primary w-full sm:w-auto px-8 py-3.5 text-base shadow-md"
              >
                <span>Reveal definition & example</span>
              </button>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full">
                <button
                  onClick={() => grade(1)}
                  className="rounded-2xl border border-border/80 bg-card p-4 text-center transition-all hover:border-rose-500/50 hover:bg-rose-500/5 shadow-xs group"
                >
                  <p className="font-serif text-lg font-medium text-foreground group-hover:text-rose-600 dark:group-hover:text-rose-400">
                    Forgot
                  </p>
                  <p className="font-mono text-[10px] text-muted-foreground uppercase mt-0.5">
                    Tomorrow (1d)
                  </p>
                </button>
                <button
                  onClick={() => grade(3)}
                  className="rounded-2xl border border-border/80 bg-card p-4 text-center transition-all hover:border-amber-500/50 hover:bg-amber-500/5 shadow-xs group"
                >
                  <p className="font-serif text-lg font-medium text-foreground group-hover:text-amber-600 dark:group-hover:text-amber-400">
                    Hard
                  </p>
                  <p className="font-mono text-[10px] text-muted-foreground uppercase mt-0.5">
                    In 3 days
                  </p>
                </button>
                <button
                  onClick={() => grade(14)}
                  className="rounded-2xl border border-amber-500/40 bg-amber-500/10 p-4 text-center transition-all hover:bg-amber-500/20 shadow-xs group"
                >
                  <p className="font-serif text-lg font-semibold text-amber-700 dark:text-amber-300">
                    Mastered
                  </p>
                  <p className="font-mono text-[10px] text-amber-600 dark:text-amber-400 uppercase mt-0.5">
                    In 2 weeks (14d)
                  </p>
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
