"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Plus, Trash2, X, Sparkles, Loader2, AlertCircle, BookOpen, Search, Volume2 } from "lucide-react";

import { PageTitle } from "@/components/dashboard/app-shell";
import { useVocabulary } from "@/hooks/useVocabulary";
import { useBooks } from "@/hooks/useBooks";
import { useAuth } from "@/components/landing/auth-provider";
import { getPlanLimits } from "@/lib/plans";

interface AIResult {
  valid: boolean;
  ipa?: string;
  meaning?: string;
  simpleExample?: string;
  complexExample?: string;
}

type WordStatus =
  | "idle"
  | "typing"
  | "validating"
  | "loading"
  | "filled"
  | "invalid"
  | "error";

export default function Vocabulary() {
  const { cards, loading, error: vocabError, addCard, deleteCard } = useVocabulary();
  const { books } = useBooks();
  const { user } = useAuth();
  const [q, setQ] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  const [form, setForm] = useState({
    bookId: "",
    word: "",
    ipa: "",
    meaning: "",
    simpleExample: "",
    complexExample: "",
    pageNumber: "",
  });
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  const [wordStatus, setWordStatus] = useState<WordStatus>("idle");
  const [aiErrorMsg, setAiErrorMsg] = useState("");
  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  const lastFetchedWord = useRef<string>("");

  const filtered = cards.filter(
    (c) =>
      c.word.toLowerCase().includes(q.toLowerCase()) ||
      c.meaning.toLowerCase().includes(q.toLowerCase()) ||
      c.book.title.toLowerCase().includes(q.toLowerCase())
  );

  const lookupWord = useCallback(
    async (word: string, bookId?: string) => {
      const trimmed = word.trim();
      if (!trimmed || trimmed.length < 2 || !user) return;
      if (trimmed.toLowerCase() === lastFetchedWord.current) return;

      setWordStatus("loading");
      setAiErrorMsg("");

      try {
        const token = await user.getIdToken();
        const selectedBook = books.find((b) => b.id === (bookId ?? form.bookId));

        const res = await fetch("/api/ai/lookup-word", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            word: trimmed,
            bookTitle: selectedBook?.title,
            bookAuthor: selectedBook?.author,
          }),
        });

        if (!res.ok) {
          throw new Error("Failed to look up word.");
        }

        const data: AIResult = await res.json();

        if (!data.valid) {
          setWordStatus("invalid");
          return;
        }

        lastFetchedWord.current = trimmed.toLowerCase();
        setForm((f) => ({
          ...f,
          ipa: data.ipa || f.ipa,
          meaning: data.meaning || f.meaning,
          simpleExample: data.simpleExample || f.simpleExample,
          complexExample: data.complexExample || f.complexExample,
        }));
        setWordStatus("filled");
      } catch (err: any) {
        setWordStatus("error");
        setAiErrorMsg(err?.message || "Could not look up word.");
      }
    },
    [user, books, form.bookId]
  );

  function handleWordChange(val: string) {
    setForm((f) => ({ ...f, word: val }));
    setWordStatus("typing");

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      if (val.trim().length >= 2) {
        lookupWord(val);
      } else {
        setWordStatus("idle");
      }
    }, 600);
  }

  function handleBookChange(bookId: string) {
    setForm((f) => ({ ...f, bookId }));
    if (form.word.trim().length >= 2) {
      lookupWord(form.word, bookId);
    }
  }

  function retryLookup() {
    lastFetchedWord.current = "";
    setWordStatus("idle");
    setAiErrorMsg("");
    setForm((f) => ({ ...f, ipa: "", meaning: "", simpleExample: "", complexExample: "" }));
    if (form.word.trim().length >= 2) {
      setTimeout(() => lookupWord(form.word), 100);
    }
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setFormError("");

    const example = [form.simpleExample, form.complexExample].filter(Boolean).join("|||");

    if (!form.bookId || !form.word.trim() || !form.meaning.trim() || !example || !form.pageNumber) {
      setFormError("All fields except IPA are required.");
      return;
    }
    try {
      setSaving(true);
      await addCard({
        bookId: form.bookId,
        word: form.word.trim(),
        ipa: form.ipa || undefined,
        meaning: form.meaning,
        example,
        pageNumber: parseInt(form.pageNumber),
      });
      setForm((f) => ({
        bookId: f.bookId,
        word: "",
        ipa: "",
        meaning: "",
        simpleExample: "",
        complexExample: "",
        pageNumber: "",
      }));
      setWordStatus("idle");
      lastFetchedWord.current = "";
      setShowAdd(false);
    } catch {
      setFormError("Failed to add word. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this word?")) return;
    try {
      setDeleting(id);
      await deleteCard(id);
    } finally {
      setDeleting(null);
    }
  }

  function openAdd() {
    setForm({ bookId: "", word: "", ipa: "", meaning: "", simpleExample: "", complexExample: "", pageNumber: "" });
    setWordStatus("idle");
    setAiErrorMsg("");
    setFormError("");
    lastFetchedWord.current = "";
    setShowAdd(true);
  }

  function StatusBadge() {
    if (wordStatus === "idle") return null;

    if (wordStatus === "typing") {
      return (
        <p className="font-mono text-xs mt-1.5 flex items-center gap-1.5 text-muted-foreground">
          <Sparkles className="size-3 text-amber-500" />
          Type a word to auto-populate meaning…
        </p>
      );
    }

    if (wordStatus === "validating" || wordStatus === "loading") {
      return (
        <p className="font-mono text-xs mt-1.5 flex items-center gap-1.5 text-amber-600 dark:text-amber-400">
          <Loader2 className="size-3 animate-spin" />
          {wordStatus === "validating" ? "Checking dictionary…" : `Fetching AI details for "${form.word}"…`}
        </p>
      );
    }

    if (wordStatus === "invalid") {
      return (
        <p className="font-mono text-xs mt-1.5 flex items-center gap-1.5 text-rose-500">
          <AlertCircle className="size-3" />
          &ldquo;{form.word}&rdquo; was not found. Check spelling or enter details manually.
        </p>
      );
    }

    if (wordStatus === "filled") {
      return (
        <div className="mt-1.5 flex items-center justify-between text-xs font-mono text-emerald-600 dark:text-emerald-400">
          <span className="flex items-center gap-1.5">
            <Sparkles className="size-3" />
            AI auto-fill complete
          </span>
          <button
            type="button"
            onClick={retryLookup}
            className="text-muted-foreground hover:text-foreground underline"
          >
            Refresh lookup
          </button>
        </div>
      );
    }

    if (wordStatus === "error") {
      return (
        <div className="mt-1.5 flex items-center justify-between text-xs font-mono text-rose-500">
          <span>{aiErrorMsg || "Lookup failed. You can type details manually."}</span>
          <button
            type="button"
            onClick={retryLookup}
            className="underline hover:text-foreground"
          >
            Retry
          </button>
        </div>
      );
    }

    return null;
  }

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-muted-foreground">
          <Sparkles className="size-8 animate-pulse text-amber-500" />
          <p className="font-mono text-xs uppercase tracking-wider">Loading vocabulary…</p>
        </div>
      </div>
    );
  }

  const limits = getPlanLimits("free");
  const wordsCount = cards.length;
  const canAddMore = wordsCount < limits.maxVocabularyWords;
  const usageText = `${wordsCount} of ${limits.maxVocabularyWords} words saved`;

  function parseExample(raw: string) {
    const parts = raw.split("|||");
    return { simple: parts[0] ?? "", complex: parts[1] ?? "" };
  }

  return (
    <>
      <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
        <PageTitle kicker={usageText}>
          Your <span className="marker">vocabulary</span>
        </PageTitle>

        <button
          onClick={openAdd}
          disabled={!canAddMore}
          className="site-button site-button-primary inline-flex items-center gap-2 disabled:cursor-not-allowed disabled:opacity-50 shadow-md"
          title={!canAddMore ? "Vocabulary limit reached. Upgrade to Plus for unlimited words." : undefined}
        >
          <Plus className="size-4" />
          <span>Add new word</span>
        </button>
      </div>

      {!canAddMore && (
        <div className="mb-8 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-5 flex items-center justify-between">
          <p className="font-sans text-sm text-foreground">
            You&apos;ve reached your {limits?.maxVocabularyWords} word limit.
          </p>
        </div>
      )}

      {cards.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-border/80 bg-card/60 p-16 text-center">
          <div className="flex size-14 mx-auto items-center justify-center rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 mb-4">
            <Sparkles className="size-7" />
          </div>
          <h3 className="font-serif text-3xl font-medium text-foreground">No vocabulary cards yet</h3>
          <p className="mt-2 text-sm text-muted-foreground max-w-sm mx-auto">
            Save evocative words as you read. Novella automatically surfaces meanings, phonetics, and context.
          </p>
          <button
            onClick={openAdd}
            className="site-button site-button-primary mt-6 inline-flex items-center gap-2"
          >
            <Plus className="size-4" />
            <span>Add your first word</span>
          </button>
        </div>
      ) : (
        <>
          <div className="mb-8 flex items-center gap-3">
            <div className="relative w-full max-w-md">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <input
                id="vq"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search words, definitions, book titles…"
                className="h-11 w-full rounded-xl border border-border bg-card pl-10 pr-4 font-sans text-sm text-foreground outline-none focus:border-ring shadow-xs transition-colors"
              />
            </div>
          </div>

          {filtered.length === 0 ? (
            <div className="rounded-2xl border border-border/80 bg-card p-12 text-center">
              <p className="font-serif text-2xl font-medium text-foreground">No matching words</p>
              <p className="mt-2 text-sm text-muted-foreground">Try searching with a different term or keyword.</p>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2">
              {filtered.map((card) => {
                const { simple, complex } = parseExample(card.example);
                return (
                  <article
                    key={card.id}
                    className="rounded-3xl border border-border/80 bg-card p-6 sm:p-7 shadow-xs hover:shadow-md transition-all flex flex-col justify-between group"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <h3 className="font-serif text-3xl sm:text-4xl font-semibold tracking-tight text-foreground">
                            {card.word}
                          </h3>
                          {card.ipa && (
                            <p className="font-mono text-xs text-muted-foreground mt-1 flex items-center gap-1.5">
                              <Volume2 className="size-3 text-amber-500" />
                              {card.ipa}
                            </p>
                          )}
                        </div>
                        <button
                          onClick={() => handleDelete(card.id)}
                          disabled={deleting === card.id}
                          aria-label={`Delete ${card.word}`}
                          className="flex size-8 shrink-0 items-center justify-center rounded-lg text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors disabled:opacity-50"
                        >
                          <Trash2 className="size-4" />
                        </button>
                      </div>

                      <div className="mt-4 rounded-xl border border-amber-500/20 bg-amber-500/5 p-4">
                        <p className="font-serif text-lg font-medium text-foreground leading-snug">
                          {card.meaning}
                        </p>
                      </div>

                      {simple && (
                        <p className="mt-3.5 font-sans text-sm italic text-foreground/90 pl-3 border-l-2 border-amber-500/60 leading-relaxed">
                          &ldquo;{simple}&rdquo;
                        </p>
                      )}
                      {complex && (
                        <p className="mt-2 font-sans text-xs italic text-muted-foreground pl-3 border-l-2 border-border/60 leading-relaxed">
                          &ldquo;{complex}&rdquo;
                        </p>
                      )}
                    </div>

                    <div className="mt-5 border-t border-border/60 pt-3 flex items-center justify-between font-mono text-xs text-muted-foreground">
                      <span className="flex items-center gap-1.5">
                        <BookOpen className="size-3.5 text-amber-500" />
                        {card.book.title}
                      </span>
                      <span>p. {card.pageNumber}</span>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* ── Add Word Modal ──────────────────────────────────────────────── */}
      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="rounded-3xl border border-border/80 bg-card p-8 shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="mb-6 flex items-start justify-between border-b border-border/60 pb-4">
              <div>
                <h3 className="font-serif text-3xl font-medium text-foreground">Add vocabulary</h3>
                <p className="font-mono text-xs mt-1 flex items-center gap-1.5 text-amber-600 dark:text-amber-400 font-semibold">
                  <Sparkles className="size-3.5" />
                  AI fills definitions & examples in real-time
                </p>
              </div>
              <button
                onClick={() => setShowAdd(false)}
                className="flex size-9 items-center justify-center rounded-xl hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
                aria-label="Close"
              >
                <X className="size-4.5" />
              </button>
            </div>

            <form onSubmit={handleAdd} className="space-y-4">
              {/* Book Select */}
              <div>
                <label className="font-mono text-xs uppercase tracking-wider text-muted-foreground block mb-1 font-semibold" htmlFor="book">
                  Book *
                </label>
                <select
                  id="book"
                  value={form.bookId}
                  onChange={(e) => handleBookChange(e.target.value)}
                  className="h-11 w-full rounded-xl border border-border bg-secondary/30 px-3.5 font-sans text-sm text-foreground outline-none focus:border-ring transition-colors"
                  required
                >
                  <option value="">Select a book…</option>
                  {books.map((b) => (
                    <option key={b.id} value={b.id}>{b.title}</option>
                  ))}
                </select>
                {books.length === 0 && (
                  <p className="mt-1 text-xs text-muted-foreground">Add a book in your library first.</p>
                )}
              </div>

              {/* Word Input */}
              <div>
                <label className="font-mono text-xs uppercase tracking-wider text-muted-foreground block mb-1 font-semibold" htmlFor="word">
                  Word *
                </label>
                <div className="relative">
                  <input
                    id="word"
                    value={form.word}
                    onChange={(e) => handleWordChange(e.target.value)}
                    placeholder="e.g. Ephemeral"
                    className="h-11 w-full rounded-xl border border-border bg-secondary/30 px-3.5 pr-10 font-sans text-sm text-foreground outline-none focus:border-ring transition-colors font-medium"
                    required
                    autoComplete="off"
                  />
                  {(wordStatus === "loading" || wordStatus === "validating") && (
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
                <StatusBadge />
              </div>

              {/* IPA */}
              <div>
                <label className="font-mono text-xs uppercase tracking-wider text-muted-foreground block mb-1 font-semibold" htmlFor="ipa">
                  Phonetics (IPA) <span className="opacity-60 font-normal">optional</span>
                </label>
                <input
                  id="ipa"
                  value={form.ipa}
                  onChange={(e) => setForm((f) => ({ ...f, ipa: e.target.value }))}
                  placeholder="/ɪˈfem(ə)rəl/"
                  className="h-11 w-full rounded-xl border border-border bg-secondary/30 px-3.5 font-mono text-xs text-foreground outline-none focus:border-ring transition-colors"
                />
              </div>

              {/* Meaning */}
              <div>
                <label className="font-mono text-xs uppercase tracking-wider text-muted-foreground block mb-1 font-semibold" htmlFor="meaning">
                  Definition *
                </label>
                <textarea
                  id="meaning"
                  value={form.meaning}
                  onChange={(e) => setForm((f) => ({ ...f, meaning: e.target.value }))}
                  placeholder="Lasting for a very short time; fleeting."
                  className="w-full rounded-xl border border-border bg-secondary/30 p-3 font-sans text-sm text-foreground outline-none focus:border-ring transition-colors min-h-[4rem]"
                  required
                />
              </div>

              {/* Simple example */}
              <div>
                <label className="font-mono text-xs uppercase tracking-wider text-muted-foreground block mb-1 font-semibold" htmlFor="simpleExample">
                  Direct Example *
                </label>
                <input
                  id="simpleExample"
                  value={form.simpleExample}
                  onChange={(e) => setForm((f) => ({ ...f, simpleExample: e.target.value }))}
                  placeholder="The evening light was ephemeral and soon turned to dusk."
                  className="h-11 w-full rounded-xl border border-border bg-secondary/30 px-3.5 font-sans text-sm text-foreground outline-none focus:border-ring transition-colors"
                  required
                />
              </div>

              {/* Complex example */}
              <div>
                <label className="font-mono text-xs uppercase tracking-wider text-muted-foreground block mb-1 font-semibold" htmlFor="complexExample">
                  Advanced Context Example
                </label>
                <input
                  id="complexExample"
                  value={form.complexExample}
                  onChange={(e) => setForm((f) => ({ ...f, complexExample: e.target.value }))}
                  placeholder="Nothing is quite so ephemeral as evening light across a lawn."
                  className="h-11 w-full rounded-xl border border-border bg-secondary/30 px-3.5 font-sans text-sm text-foreground outline-none focus:border-ring transition-colors"
                />
              </div>

              {/* Page number */}
              <div>
                <label className="font-mono text-xs uppercase tracking-wider text-muted-foreground block mb-1 font-semibold" htmlFor="page">
                  Page number *
                </label>
                <input
                  id="page"
                  type="number"
                  min={1}
                  value={form.pageNumber}
                  onChange={(e) => setForm((f) => ({ ...f, pageNumber: e.target.value }))}
                  placeholder="112"
                  className="h-11 w-full rounded-xl border border-border bg-secondary/30 px-3.5 font-sans text-sm text-foreground outline-none focus:border-ring transition-colors"
                  required
                />
              </div>

              {formError && <p className="text-sm text-destructive">{formError}</p>}

              <div className="flex gap-3 pt-4 border-t border-border/60">
                <button
                  type="submit"
                  disabled={saving || books.length === 0 || wordStatus === "loading" || wordStatus === "validating"}
                  className="site-button site-button-primary flex-1 justify-center disabled:opacity-50"
                >
                  {saving ? "Saving…" : "Save card"}
                </button>
                <button
                  type="button"
                  onClick={() => setShowAdd(false)}
                  className="site-button site-button-outline px-5"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
