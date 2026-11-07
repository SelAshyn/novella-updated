"use client";

import { use, useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AlertCircle, ArrowLeft, Loader2, Plus, Quote, Sparkles, Trash2, Volume2, X, BookOpen, Bookmark } from "lucide-react";
import { format } from "date-fns";
import posthog from "posthog-js";

import { PageTitle } from "@/components/dashboard/app-shell";
import { useApi } from "@/hooks/useApi";
import { useAuth } from "@/components/landing/auth-provider";
import { BookWithStats } from "@/lib/types";

interface VocabCard {
  id: string;
  word: string;
  ipa?: string | null;
  meaning: string;
  example: string;
  pageNumber: number;
}

interface QuoteItem {
  id: string;
  text: string;
  pageNumber: number;
}

interface AIResult {
  valid: boolean;
  ipa?: string;
  meaning?: string;
  simpleExample?: string;
  complexExample?: string;
}

type WordStatus = "idle" | "typing" | "loading" | "filled" | "invalid" | "error";

export default function BookPage({ params }: { params: Promise<{ bookId: string }> }) {
  const { bookId } = use(params);
  const { user } = useAuth();
  const api = useApi();

  const [book, setBook] = useState<BookWithStats | null>(null);
  const [words, setWords] = useState<VocabCard[]>([]);
  const [quotes, setQuotes] = useState<QuoteItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound404, setNotFound404] = useState(false);

  // Update progress form
  const [currentPage, setCurrentPage] = useState("");
  const [savingProgress, setSavingProgress] = useState(false);

  // Add word modal
  const [showAddWord, setShowAddWord] = useState(false);
  const [wordForm, setWordForm] = useState({ word: "", ipa: "", meaning: "", simpleExample: "", complexExample: "", pageNumber: "" });
  const [savingWord, setSavingWord] = useState(false);
  const [wordStatus, setWordStatus] = useState<WordStatus>("idle");
  const [aiErrorMsg, setAiErrorMsg] = useState("");
  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  const lastFetchedWord = useRef("");

  const lookupWord = useCallback(async (word: string) => {
    const trimmed = word.trim();
    if (!trimmed || trimmed.length < 2 || !user || !book) return;
    if (trimmed.toLowerCase() === lastFetchedWord.current) return;
    setWordStatus("loading");
    setAiErrorMsg("");
    try {
      const token = await user.getIdToken();
      const res = await fetch("/api/ai/lookup-word", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ word: trimmed, bookTitle: book.title, bookAuthor: book.author }),
      });
      if (!res.ok) throw new Error("Lookup failed");
      const data: AIResult = await res.json();
      if (!data.valid) { setWordStatus("invalid"); return; }
      lastFetchedWord.current = trimmed.toLowerCase();
      setWordForm(f => ({
        ...f,
        ipa: data.ipa || f.ipa,
        meaning: data.meaning || f.meaning,
        simpleExample: data.simpleExample || f.simpleExample,
        complexExample: data.complexExample || f.complexExample,
      }));
      setWordStatus("filled");
    } catch (err: any) {
      setWordStatus("error");
      setAiErrorMsg(err?.message || "Lookup failed.");
    }
  }, [user, book]);

  function handleWordChange(val: string) {
    setWordForm(f => ({ ...f, word: val }));
    setWordStatus("typing");
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      if (val.trim().length >= 2) lookupWord(val);
      else setWordStatus("idle");
    }, 600);
  }

  function retryLookup() {
    lastFetchedWord.current = "";
    setWordStatus("idle");
    setAiErrorMsg("");
    setWordForm(f => ({ ...f, ipa: "", meaning: "", simpleExample: "", complexExample: "" }));
    if (wordForm.word.trim().length >= 2) setTimeout(() => lookupWord(wordForm.word), 100);
  }

  function openAddWord() {
    setWordForm({ word: "", ipa: "", meaning: "", simpleExample: "", complexExample: "", pageNumber: "" });
    setWordStatus("idle");
    setAiErrorMsg("");
    lastFetchedWord.current = "";
    setShowAddWord(true);
  }

  // Add quote modal
  const [showAddQuote, setShowAddQuote] = useState(false);
  const [quoteForm, setQuoteForm] = useState({ text: "", pageNumber: "" });
  const [savingQuote, setSavingQuote] = useState(false);

  useEffect(() => {
    if (!user) return;
    async function load() {
      try {
        setLoading(true);
        const [bookData, wordsData, quotesData] = await Promise.all([
          api.get(`/api/books/${bookId}`),
          api.get(`/api/books/${bookId}/vocabulary`),
          api.get(`/api/books/${bookId}/quotes`),
        ]);
        setBook(bookData.book);
        setCurrentPage(String(bookData.book.currentPage));
        setWords(wordsData.cards);
        setQuotes(quotesData.quotes);
      } catch (err: any) {
        if (err?.message?.includes("404")) setNotFound404(true);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [user, bookId]);

  async function saveProgress() {
    if (!book) return;
    try {
      setSavingProgress(true);
      const updated = await api.patch(`/api/books/${book.id}`, {
        currentPage: parseInt(currentPage),
      });
      setBook((b) => b ? { ...b, currentPage: updated.book.currentPage } : b);
      posthog.capture("reading_progress_updated", {
        book_id: book.id,
        current_page: updated.book.currentPage,
        total_pages: book.totalPages,
      });
    } finally {
      setSavingProgress(false);
    }
  }

  async function handleAddWord(e: React.FormEvent) {
    e.preventDefault();
    try {
      setSavingWord(true);
      const example = [wordForm.simpleExample, wordForm.complexExample].filter(Boolean).join("|||");
      const data = await api.post("/api/vocabulary", {
        bookId,
        word: wordForm.word,
        ipa: wordForm.ipa || undefined,
        meaning: wordForm.meaning,
        example,
        pageNumber: parseInt(wordForm.pageNumber),
      });
      setWords((prev) => [...prev, data.card]);
      posthog.capture("vocabulary_added", {
        book_id: bookId,
        vocabulary_id: data.card.id,
        lookup_source: wordStatus === "filled" ? "ai" : "manual",
      });
      setWordForm({ word: "", ipa: "", meaning: "", simpleExample: "", complexExample: "", pageNumber: "" });
      setWordStatus("idle");
      lastFetchedWord.current = "";
      setShowAddWord(false);
    } finally {
      setSavingWord(false);
    }
  }

  async function handleDeleteWord(id: string) {
    if (!confirm("Delete this word?")) return;
    await api.del("/api/vocabulary", { id });
    setWords((prev) => prev.filter((w) => w.id !== id));
  }

  async function handleAddQuote(e: React.FormEvent) {
    e.preventDefault();
    try {
      setSavingQuote(true);
      const data = await api.post("/api/quotes", {
        bookId,
        text: quoteForm.text,
        pageNumber: parseInt(quoteForm.pageNumber),
      });
      setQuotes((prev) => [...prev, data.quote]);
      posthog.capture("quote_saved", {
        book_id: bookId,
        quote_id: data.quote.id,
        page_number: data.quote.pageNumber,
      });
      setQuoteForm({ text: "", pageNumber: "" });
      setShowAddQuote(false);
    } finally {
      setSavingQuote(false);
    }
  }

  async function handleDeleteQuote(id: string) {
    if (!confirm("Delete this quote?")) return;
    await api.del("/api/quotes", { id });
    setQuotes((prev) => prev.filter((q) => q.id !== id));
  }

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-muted-foreground">
          <BookOpen className="size-8 animate-pulse text-amber-500" />
          <p className="font-mono text-xs uppercase tracking-wider">Loading book details…</p>
        </div>
      </div>
    );
  }

  if (notFound404 || !book) {
    notFound();
  }

  const pct = book.totalPages > 0 ? Math.round((book.currentPage / book.totalPages) * 100) : 0;

  return (
    <>
      <Link
        href="/dashboard/library"
        className="inline-flex items-center gap-2 rounded-lg border border-border/80 bg-card px-3.5 py-1.5 font-sans text-xs font-medium text-muted-foreground transition-colors hover:text-foreground mb-8 shadow-xs"
      >
        <ArrowLeft className="size-3.5" />
        <span>Back to library</span>
      </Link>

      <PageTitle kicker={book.author}>{book.title}</PageTitle>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          ["Reading Progress", `${pct}%`],
          ["Page", `${book.currentPage} / ${book.totalPages}`],
          ["Saved Words", words.length],
          ["Collected Quotes", quotes.length],
        ].map(([key, value]) => (
          <div key={key} className="rounded-2xl border border-border/80 bg-card p-5 shadow-xs">
            <p className="font-mono text-xs uppercase tracking-wider text-muted-foreground font-semibold">{key}</p>
            <p className="mt-2 font-serif text-3xl sm:text-4xl font-bold tracking-tight text-foreground">{value}</p>
          </div>
        ))}
      </div>

      {/* Update Progress Card */}
      <div className="mt-8 rounded-2xl border border-border/80 bg-card p-6 sm:p-7 shadow-xs">
        <p className="font-mono text-xs uppercase tracking-wider text-muted-foreground font-semibold">
          Update reading bookmark
        </p>
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="font-sans text-sm text-muted-foreground">Page</span>
            <input
              type="number"
              min={0}
              max={book.totalPages}
              value={currentPage}
              onChange={(e) => setCurrentPage(e.target.value)}
              className="h-11 w-28 rounded-xl border border-border bg-secondary/30 px-3 font-mono text-sm text-foreground outline-none focus:border-ring"
            />
            <span className="font-sans text-sm text-muted-foreground">of {book.totalPages} pages</span>
          </div>

          <button
            onClick={saveProgress}
            disabled={savingProgress}
            className="site-button site-button-primary disabled:opacity-50"
          >
            {savingProgress ? "Updating…" : "Update progress"}
          </button>
        </div>
      </div>

      <div className="mt-12 grid gap-8 lg:grid-cols-2">
        {/* Words Column */}
        <section className="rounded-3xl border border-border/80 bg-card p-6 sm:p-8 shadow-xs flex flex-col justify-between">
          <div>
            <div className="mb-6 flex items-center justify-between border-b border-border/60 pb-4">
              <div>
                <h2 className="font-serif text-xl sm:text-2xl font-medium text-foreground">Saved Words</h2>
                <p className="font-sans text-xs text-muted-foreground mt-0.5">{words.length} words saved from this book</p>
              </div>
              <button
                onClick={openAddWord}
                className="site-button site-button-primary text-xs py-2 px-3.5 min-h-9 inline-flex items-center gap-1.5"
              >
                <Plus className="size-3.5" /> <span>Add word</span>
              </button>
            </div>

            {words.length === 0 ? (
              <div className="py-12 text-center">
                <Bookmark className="mx-auto size-8 text-muted-foreground/50 mb-2" />
                <p className="font-serif text-xl font-medium text-foreground">No words saved yet</p>
                <p className="font-sans text-xs text-muted-foreground mt-1">Capture words you encounter while reading.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {words.map((word) => (
                  <div key={word.id} className="flex items-start justify-between gap-3 rounded-2xl border border-border/60 bg-secondary/20 p-4 transition-colors hover:bg-secondary/40">
                    <div>
                      <div className="flex items-baseline gap-2">
                        <span className="font-serif text-xl font-semibold text-foreground">{word.word}</span>
                        {word.ipa && (
                          <span className="font-mono text-xs text-muted-foreground">{word.ipa}</span>
                        )}
                      </div>
                      <p className="mt-1 font-sans text-sm text-foreground/90">{word.meaning}</p>
                      <p className="mt-2 font-mono text-[10px] uppercase text-muted-foreground">Page {word.pageNumber}</p>
                    </div>
                    <button
                      onClick={() => handleDeleteWord(word.id)}
                      className="flex size-7 shrink-0 items-center justify-center rounded-lg text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
                      aria-label="Delete word"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* Quotes Column */}
        <section className="rounded-3xl border border-border/80 bg-card p-6 sm:p-8 shadow-xs flex flex-col justify-between">
          <div>
            <div className="mb-6 flex items-center justify-between border-b border-border/60 pb-4">
              <div>
                <h2 className="font-serif text-xl sm:text-2xl font-medium text-foreground">Notable Quotes</h2>
                <p className="font-sans text-xs text-muted-foreground mt-0.5">{quotes.length} passages collected</p>
              </div>
              <button
                onClick={() => setShowAddQuote(true)}
                className="site-button site-button-primary text-xs py-2 px-3.5 min-h-9 inline-flex items-center gap-1.5"
              >
                <Quote className="size-3.5" /> <span>Add quote</span>
              </button>
            </div>

            {quotes.length === 0 ? (
              <div className="py-12 text-center">
                <Quote className="mx-auto size-8 text-muted-foreground/50 mb-2" />
                <p className="font-serif text-xl font-medium text-foreground">No quotes saved yet</p>
                <p className="font-sans text-xs text-muted-foreground mt-1">Collect memorable passages and sentences.</p>
              </div>
            ) : (
              <div className="space-y-3.5">
                {quotes.map((q) => (
                  <div key={q.id} className="relative rounded-2xl border border-border/60 bg-secondary/20 p-5 border-l-4 border-l-amber-500 flex flex-col justify-between group">
                    <blockquote className="font-serif text-lg leading-relaxed text-foreground">
                      &ldquo;{q.text}&rdquo;
                    </blockquote>
                    <div className="mt-3 flex items-center justify-between border-t border-border/40 pt-2 font-mono text-[10px] uppercase text-muted-foreground">
                      <span>Page {q.pageNumber}</span>
                      <button
                        onClick={() => handleDeleteQuote(q.id)}
                        className="flex size-6 items-center justify-center rounded text-muted-foreground hover:text-destructive opacity-60 group-hover:opacity-100 transition-opacity"
                        aria-label="Delete quote"
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      </div>

      {/* Add Word Modal */}
      {showAddWord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="rounded-3xl border border-border/80 bg-card p-5 sm:p-8 shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="mb-6 flex items-start justify-between border-b border-border/60 pb-4">
              <div>
                <h3 className="font-serif text-3xl font-medium text-foreground">Add a word</h3>
                <p className="font-mono text-xs mt-1 flex items-center gap-1.5 text-amber-600 dark:text-amber-400 font-semibold">
                  <Sparkles className="size-3.5" />
                  AI fills definitions &amp; examples in real-time
                </p>
              </div>
              <button
                onClick={() => setShowAddWord(false)}
                className="flex size-9 items-center justify-center rounded-xl hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
                aria-label="Close"
              >
                <X className="size-4.5" />
              </button>
            </div>

            <form onSubmit={handleAddWord} className="space-y-4">
              {/* Word input */}
              <div>
                <label className="font-mono text-xs uppercase tracking-wider text-muted-foreground block mb-1 font-semibold" htmlFor="aw-word">
                  Word *
                </label>
                <div className="relative">
                  <input
                    id="aw-word"
                    value={wordForm.word}
                    onChange={(e) => handleWordChange(e.target.value)}
                    placeholder="e.g. Ephemeral"
                    className="h-11 w-full rounded-xl border border-border bg-secondary/30 px-3.5 pr-10 font-sans text-sm text-foreground outline-none focus:border-ring transition-colors font-medium"
                    required
                    autoComplete="off"
                    autoFocus
                  />
                  {wordStatus === "loading" && (
                    <div className="absolute right-3.5 top-1/2 -translate-y-1/2">
                      <Loader2 className="size-4 animate-spin text-amber-500" />
                    </div>
                  )}
                  {wordStatus === "filled" && (
                    <div className="absolute right-3.5 top-1/2 -translate-y-1/2">
                      <Sparkles className="size-4 text-amber-500" />
                    </div>
                  )}
                </div>

                {/* Status badge */}
                {wordStatus === "typing" && (
                  <p className="font-mono text-xs mt-1.5 flex items-center gap-1.5 text-muted-foreground">
                    <Sparkles className="size-3 text-amber-500" /> Type a word to auto-populate meaning…
                  </p>
                )}
                {wordStatus === "loading" && (
                  <p className="font-mono text-xs mt-1.5 flex items-center gap-1.5 text-amber-600 dark:text-amber-400">
                    <Loader2 className="size-3 animate-spin" /> Fetching AI details for &ldquo;{wordForm.word}&rdquo;…
                  </p>
                )}
                {wordStatus === "invalid" && (
                  <p className="font-mono text-xs mt-1.5 flex items-center gap-1.5 text-rose-500">
                    <AlertCircle className="size-3" /> &ldquo;{wordForm.word}&rdquo; was not found. Check spelling or fill in manually.
                  </p>
                )}
                {wordStatus === "filled" && (
                  <div className="mt-1.5 flex items-center justify-between text-xs font-mono text-emerald-600 dark:text-emerald-400">
                    <span className="flex items-center gap-1.5"><Sparkles className="size-3" /> AI auto-fill complete</span>
                    <button type="button" onClick={retryLookup} className="text-muted-foreground hover:text-foreground underline">Refresh</button>
                  </div>
                )}
                {wordStatus === "error" && (
                  <div className="mt-1.5 flex items-center justify-between text-xs font-mono text-rose-500">
                    <span>{aiErrorMsg || "Lookup failed. Fill in manually."}</span>
                    <button type="button" onClick={retryLookup} className="underline hover:text-foreground">Retry</button>
                  </div>
                )}
              </div>

              {/* IPA */}
              <div>
                <label className="font-mono text-xs uppercase tracking-wider text-muted-foreground block mb-1 font-semibold" htmlFor="aw-ipa">
                  Phonetics (IPA) <span className="opacity-60 font-normal">optional</span>
                </label>
                <input
                  id="aw-ipa"
                  value={wordForm.ipa}
                  onChange={(e) => setWordForm(f => ({ ...f, ipa: e.target.value }))}
                  placeholder="/ɪˈfem(ə)rəl/"
                  className="h-11 w-full rounded-xl border border-border bg-secondary/30 px-3.5 font-mono text-xs text-foreground outline-none focus:border-ring transition-colors"
                />
              </div>

              {/* Meaning */}
              <div>
                <label className="font-mono text-xs uppercase tracking-wider text-muted-foreground block mb-1 font-semibold" htmlFor="aw-meaning">
                  Definition *
                </label>
                <textarea
                  id="aw-meaning"
                  value={wordForm.meaning}
                  onChange={(e) => setWordForm(f => ({ ...f, meaning: e.target.value }))}
                  placeholder="Lasting for a very short time; fleeting."
                  className="w-full rounded-xl border border-border bg-secondary/30 p-3 font-sans text-sm text-foreground outline-none focus:border-ring transition-colors min-h-[4rem]"
                  required
                />
              </div>

              {/* Simple example */}
              <div>
                <label className="font-mono text-xs uppercase tracking-wider text-muted-foreground block mb-1 font-semibold" htmlFor="aw-simple">
                  Example sentence *
                </label>
                <input
                  id="aw-simple"
                  value={wordForm.simpleExample}
                  onChange={(e) => setWordForm(f => ({ ...f, simpleExample: e.target.value }))}
                  placeholder="The evening light was ephemeral and soon turned to dusk."
                  className="h-11 w-full rounded-xl border border-border bg-secondary/30 px-3.5 font-sans text-sm text-foreground outline-none focus:border-ring transition-colors"
                  required
                />
              </div>

              {/* Complex example */}
              <div>
                <label className="font-mono text-xs uppercase tracking-wider text-muted-foreground block mb-1 font-semibold" htmlFor="aw-complex">
                  Advanced context <span className="opacity-60 font-normal">optional</span>
                </label>
                <input
                  id="aw-complex"
                  value={wordForm.complexExample}
                  onChange={(e) => setWordForm(f => ({ ...f, complexExample: e.target.value }))}
                  placeholder="Nothing is quite so ephemeral as evening light across a lawn."
                  className="h-11 w-full rounded-xl border border-border bg-secondary/30 px-3.5 font-sans text-sm text-foreground outline-none focus:border-ring transition-colors"
                />
              </div>

              {/* Page number */}
              <div>
                <label className="font-mono text-xs uppercase tracking-wider text-muted-foreground block mb-1 font-semibold" htmlFor="aw-page">
                  Page number *
                </label>
                <input
                  id="aw-page"
                  type="number"
                  min={1}
                  value={wordForm.pageNumber}
                  onChange={(e) => setWordForm(f => ({ ...f, pageNumber: e.target.value }))}
                  placeholder="112"
                  className="h-11 w-full rounded-xl border border-border bg-secondary/30 px-3.5 font-sans text-sm text-foreground outline-none focus:border-ring transition-colors"
                  required
                />
              </div>

              <div className="flex gap-3 pt-4 border-t border-border/60">
                <button
                  type="submit"
                  disabled={savingWord || wordStatus === "loading"}
                  className="site-button site-button-primary flex-1 justify-center disabled:opacity-50"
                >
                  {savingWord ? "Saving…" : "Save word"}
                </button>
                <button type="button" onClick={() => setShowAddWord(false)} className="site-button site-button-outline px-5">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Quote Modal */}
      {showAddQuote && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="rounded-3xl border border-border/80 bg-card p-8 shadow-2xl w-full max-w-md">
            <div className="mb-6 flex items-center justify-between border-b border-border/60 pb-4">
              <h3 className="font-serif text-2xl font-medium text-foreground">Add a quote</h3>
              <button onClick={() => setShowAddQuote(false)} className="flex size-9 items-center justify-center rounded-xl hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"><X className="size-4" /></button>
            </div>
            <form onSubmit={handleAddQuote} className="space-y-4">
              <div>
                <label className="font-mono text-xs uppercase tracking-wider text-muted-foreground block mb-1 font-semibold" htmlFor="aq-text">Quote *</label>
                <textarea id="aq-text" rows={4} value={quoteForm.text} onChange={(e) => setQuoteForm(f => ({ ...f, text: e.target.value }))} className="w-full rounded-xl border border-border bg-secondary/30 p-3 font-serif text-base text-foreground outline-none focus:border-ring leading-relaxed" required />
              </div>
              <div>
                <label className="font-mono text-xs uppercase tracking-wider text-muted-foreground block mb-1 font-semibold" htmlFor="aq-page">Page number *</label>
                <input id="aq-page" type="number" min={1} value={quoteForm.pageNumber} onChange={(e) => setQuoteForm(f => ({ ...f, pageNumber: e.target.value }))} className="h-10 w-full rounded-xl border border-border bg-secondary/30 px-3 font-sans text-sm text-foreground outline-none focus:border-ring" required />
              </div>
              <div className="flex gap-3 pt-3 border-t border-border/60">
                <button type="submit" disabled={savingQuote} className="site-button site-button-primary flex-1 justify-center disabled:opacity-50">{savingQuote ? "Saving…" : "Save quote"}</button>
                <button type="button" onClick={() => setShowAddQuote(false)} className="site-button site-button-outline px-5">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
