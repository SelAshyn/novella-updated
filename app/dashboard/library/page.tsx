"use client";

import { useState } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { Plus, Trash2, X, Upload, BookOpen, Target, Sparkles } from "lucide-react";
import Image from "next/image";

import { PageTitle } from "@/components/dashboard/app-shell";
import { useBooks } from "@/hooks/useBooks";
import { BookStatus } from "@/lib/types";
import { getPlanLimits } from "@/lib/plans";
import { CoverUpload } from "@/components/book/cover-upload";

export default function Library() {
  const { books, loading, addBook, updateBook, deleteBook } = useBooks();
  const [showAdd, setShowAdd] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [editingCover, setEditingCover] = useState<string | null>(null);

  // Add book form state
  const [form, setForm] = useState({
    title: "",
    author: "",
    totalPages: "",
    dueDate: "",
    status: "READING" as BookStatus,
    coverUrl: "",
  });
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setFormError("");
    if (!form.title.trim() || !form.author.trim() || !form.totalPages) {
      setFormError("Title, author and total pages are required.");
      return;
    }
    try {
      setSaving(true);
      await addBook({
        title: form.title,
        author: form.author,
        totalPages: parseInt(form.totalPages),
        dueDate: form.dueDate || undefined,
        status: form.status,
        coverImageUrl: form.coverUrl || undefined,
      });
      setForm({ title: "", author: "", totalPages: "", dueDate: "", status: "READING", coverUrl: "" });
      setShowAdd(false);
    } catch {
      setFormError("Failed to add book. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this book? All its words and quotes will be lost.")) return;
    try {
      setDeleting(id);
      await deleteBook(id);
    } finally {
      setDeleting(null);
    }
  }

  async function handleStatusChange(id: string, status: BookStatus) {
    await updateBook(id, { status });
  }

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

  const limits = getPlanLimits("free");
  const booksCount = books.length;
  const canAddMore = booksCount < limits.maxBooks;
  const usageText = `${booksCount} of ${limits.maxBooks} books`;

  return (
    <>
      <div className="mb-10 flex items-end justify-between gap-4">
        <PageTitle kicker={usageText}>
          Your <span className="marker">library</span>
        </PageTitle>

        <button
          onClick={() => setShowAdd(true)}
          disabled={!canAddMore}
          className="site-button site-button-primary inline-flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
          title={!canAddMore ? "Book limit reached. Upgrade to Plus for unlimited books." : undefined}
        >
          <Plus className="size-4" />
          <span>Add new book</span>
        </button>
      </div>

      {!canAddMore && (
        <div className="mb-8 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-5 flex items-center justify-between">
          <p className="font-sans text-sm text-foreground">
            You&apos;ve reached your {limits?.maxBooks} book limit.
          </p>
        </div>
      )}

      {books.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-border/80 bg-card/60 p-8 sm:p-16 text-center">
          <div className="flex size-14 mx-auto items-center justify-center rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 mb-4">
            <BookOpen className="size-7" />
          </div>
          <h3 className="font-serif text-3xl font-medium text-foreground">Your library is empty</h3>
          <p className="mt-2 text-sm text-muted-foreground max-w-sm mx-auto">
            Add a book to start tracking reading pace, saving unfamiliar vocabulary, and collecting memorable passages.
          </p>
          <button
            onClick={() => setShowAdd(true)}
            className="site-button site-button-primary mt-6 inline-flex items-center gap-2"
          >
            <Plus className="size-4" />
            <span>Add your first book</span>
          </button>
        </div>
      ) : (
        <div className="rounded-3xl border border-border/80 bg-card overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-left border-collapse">
              <thead>
                <tr className="border-b border-border bg-secondary/50 font-mono text-xs uppercase tracking-wider text-muted-foreground">
                  <th className="p-4 sm:p-5">Book</th>
                  <th className="p-4 sm:p-5">Progress</th>
                  <th className="p-4 sm:p-5">Words</th>
                  <th className="p-4 sm:p-5">Quotes</th>
                  <th className="p-4 sm:p-5">Target</th>
                  <th className="p-4 sm:p-5">Status</th>
                  <th className="p-4 sm:p-5 sr-only">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {books.map((b) => {
                  const pct = b.totalPages > 0
                    ? Math.round((b.currentPage / b.totalPages) * 100)
                    : 0;

                  return (
                    <tr key={b.id} className="transition-colors hover:bg-secondary/30">
                      <td className="p-4 sm:p-5">
                        <div className="flex items-center gap-3.5">
                          {/* Book Cover Thumbnail */}
                          <div className="relative size-12 shrink-0 rounded-xl overflow-hidden border border-border bg-secondary shadow-xs group/cover">
                            {b.coverImageUrl ? (
                              <Image
                                src={b.coverImageUrl}
                                alt={b.title}
                                fill
                                className="object-cover"
                                sizes="48px"
                              />
                            ) : (
                              <div className="flex h-full items-center justify-center font-mono text-[9px] text-muted-foreground text-center p-1">
                                No cover
                              </div>
                            )}
                            <button
                              onClick={() => setEditingCover(b.id)}
                              className="absolute inset-0 flex items-center justify-center bg-black/60 opacity-0 group-hover/cover:opacity-100 transition-opacity"
                              title="Change cover"
                            >
                              <Upload className="size-3.5 text-white" />
                            </button>
                          </div>

                          <div className="min-w-0">
                            <Link
                              href={`/dashboard/library/${b.id}`}
                              className="font-serif text-lg font-medium text-foreground hover:text-amber-600 dark:hover:text-amber-400 truncate block"
                            >
                              {b.title}
                            </Link>
                            <p className="font-sans text-xs text-muted-foreground">{b.author}</p>
                          </div>
                        </div>
                      </td>

                      <td className="p-4 sm:p-5 font-sans text-sm">
                        <div className="flex flex-col gap-1.5 min-w-[120px]">
                          <div className="flex justify-between text-xs font-mono text-muted-foreground">
                            <span>{pct}%</span>
                            <span>{b.currentPage}/{b.totalPages}</span>
                          </div>
                          <div className="h-1.5 rounded-full bg-secondary overflow-hidden">
                            <div
                              className="h-full rounded-full bg-amber-500"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>
                      </td>

                      <td className="p-4 sm:p-5 font-mono text-sm text-foreground">
                        <span className="rounded-md bg-secondary px-2 py-1 text-xs">
                          {b._count?.vocabularyCards ?? 0}
                        </span>
                      </td>

                      <td className="p-4 sm:p-5 font-mono text-sm text-foreground">
                        <span className="rounded-md bg-secondary px-2 py-1 text-xs">
                          {b._count?.quotes ?? 0}
                        </span>
                      </td>

                      <td className="p-4 sm:p-5 font-mono text-xs text-muted-foreground">
                        {b.dueDate ? (
                          <span className="flex items-center gap-1 text-foreground/80">
                            <Target className="size-3 text-amber-500" />
                            {format(new Date(b.dueDate), "d MMM")}
                          </span>
                        ) : (
                          "—"
                        )}
                      </td>

                      <td className="p-4 sm:p-5">
                        <select
                          value={b.status}
                          onChange={(e) => handleStatusChange(b.id, e.target.value as BookStatus)}
                          className="rounded-lg border border-border bg-secondary/40 px-2.5 py-1 text-xs font-sans text-foreground outline-none focus:border-ring"
                        >
                          <option value="READING">Reading</option>
                          <option value="FINISHED">Finished</option>
                          <option value="WANT_TO_READ">Want to read</option>
                        </select>
                      </td>

                      <td className="p-4 sm:p-5 text-right">
                        <button
                          onClick={() => handleDelete(b.id)}
                          disabled={deleting === b.id}
                          aria-label={`Delete ${b.title}`}
                          className="flex size-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors disabled:opacity-50"
                        >
                          <Trash2 className="size-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add Book Modal */}
      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="rounded-3xl border border-border/80 bg-card p-5 sm:p-8 shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="mb-6 flex items-center justify-between border-b border-border/60 pb-4">
              <div>
                <h3 className="font-serif text-3xl font-medium text-foreground">Add a book</h3>
                <p className="font-sans text-xs text-muted-foreground mt-0.5">Enter details to begin tracking your reading</p>
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
              {/* Book Cover Upload */}
              <CoverUpload
                onUploadComplete={(url) => {
                  setForm((f) => ({ ...f, coverUrl: url }));
                }}
              />

              <div>
                <label className="font-mono text-xs uppercase tracking-wider text-muted-foreground block mb-1 font-semibold" htmlFor="title">
                  Title *
                </label>
                <input
                  id="title"
                  value={form.title}
                  onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                  placeholder="e.g. The Remains of the Day"
                  className="h-11 w-full rounded-xl border border-border bg-secondary/30 px-3.5 font-sans text-sm text-foreground outline-none focus:border-ring transition-colors"
                  required
                />
              </div>

              <div>
                <label className="font-mono text-xs uppercase tracking-wider text-muted-foreground block mb-1 font-semibold" htmlFor="author">
                  Author *
                </label>
                <input
                  id="author"
                  value={form.author}
                  onChange={(e) => setForm((f) => ({ ...f, author: e.target.value }))}
                  placeholder="e.g. Kazuo Ishiguro"
                  className="h-11 w-full rounded-xl border border-border bg-secondary/30 px-3.5 font-sans text-sm text-foreground outline-none focus:border-ring transition-colors"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="font-mono text-xs uppercase tracking-wider text-muted-foreground block mb-1 font-semibold" htmlFor="pages">
                    Total pages *
                  </label>
                  <input
                    id="pages"
                    type="number"
                    min={1}
                    value={form.totalPages}
                    onChange={(e) => setForm((f) => ({ ...f, totalPages: e.target.value }))}
                    placeholder="256"
                    className="h-11 w-full rounded-xl border border-border bg-secondary/30 px-3.5 font-sans text-sm text-foreground outline-none focus:border-ring transition-colors"
                    required
                  />
                </div>

                <div>
                  <label className="font-mono text-xs uppercase tracking-wider text-muted-foreground block mb-1 font-semibold" htmlFor="due">
                    Finish target
                  </label>
                  <input
                    id="due"
                    type="date"
                    value={form.dueDate}
                    onChange={(e) => setForm((f) => ({ ...f, dueDate: e.target.value }))}
                    className="h-11 w-full rounded-xl border border-border bg-secondary/30 px-3.5 font-sans text-sm text-foreground outline-none focus:border-ring transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="font-mono text-xs uppercase tracking-wider text-muted-foreground block mb-1 font-semibold" htmlFor="status">
                  Reading status
                </label>
                <select
                  id="status"
                  value={form.status}
                  onChange={(e) => setForm((f) => ({ ...f, status: e.target.value as BookStatus }))}
                  className="h-11 w-full rounded-xl border border-border bg-secondary/30 px-3.5 font-sans text-sm text-foreground outline-none focus:border-ring transition-colors"
                >
                  <option value="READING">Currently reading</option>
                  <option value="WANT_TO_READ">Want to read</option>
                  <option value="FINISHED">Already finished</option>
                </select>
              </div>

              {formError && (
                <p className="text-sm text-destructive">{formError}</p>
              )}

              <div className="flex gap-3 pt-4 border-t border-border/60">
                <button
                  type="submit"
                  disabled={saving}
                  className="site-button site-button-primary flex-1 justify-center disabled:opacity-50"
                >
                  {saving ? "Adding…" : "Add to library"}
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

      {/* Edit Cover Modal */}
      {editingCover && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="rounded-3xl border border-border/80 bg-card p-8 shadow-2xl w-full max-w-md">
            <div className="mb-6 flex items-center justify-between border-b border-border/60 pb-4">
              <h3 className="font-serif text-3xl font-medium text-foreground">Change Cover</h3>
              <button
                onClick={() => setEditingCover(null)}
                className="flex size-9 items-center justify-center rounded-xl hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
                aria-label="Close"
              >
                <X className="size-4.5" />
              </button>
            </div>

            <CoverUpload
              bookId={editingCover}
              currentCover={books.find((b) => b.id === editingCover)?.coverImageUrl}
              onUploadComplete={() => {
                setEditingCover(null);
                window.location.reload();
              }}
            />

            <button
              type="button"
              onClick={() => setEditingCover(null)}
              className="site-button site-button-outline mt-6 w-full justify-center"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </>
  );
}
