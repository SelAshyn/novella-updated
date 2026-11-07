"use client";

import { useEffect, useState, useCallback, useId } from "react";
import {
  Bug,
  MessageSquarePlus,
  Sparkles,
  Send,
  AlertCircle,
  CheckCircle2,
  Clock,
  Laptop,
  HelpCircle,
  Flame,
  RotateCcw,
} from "lucide-react";

import { PageTitle } from "@/components/dashboard/app-shell";
import { useAuth } from "@/components/landing/auth-provider";

type ReportType = "glitch" | "feedback" | "feature" | "other";
type SeverityLevel = "low" | "medium" | "high" | "critical";

interface SubmittedReport {
  id: string;
  type: string;
  title: string;
  description: string;
  area: string | null;
  severity: string | null;
  status: string;
  createdAt: string;
}

const TYPE_CONFIG = {
  glitch: {
    label: "Glitch / Bug",
    shortLabel: "Glitch",
    kicker: "Issue Report",
    badge: "Bug",
    color: "text-rose-600 dark:text-rose-400",
    bg: "bg-rose-500/10 border-rose-500/30",
    activeBorder: "border-rose-500/50 bg-rose-500/5",
    icon: Bug,
    titlePlaceholder: "e.g. Vocabulary card flip hangs on page 42",
    descPlaceholder:
      "Please describe what happened:\n1. Steps to reproduce the glitch\n2. What you expected to happen\n3. What actually happened",
    descHint: "Be as detailed as possible to help us reproduce and fix it quickly.",
  },
  feedback: {
    label: "Feedback",
    shortLabel: "Feedback",
    kicker: "General Thoughts",
    badge: "UX & Thoughts",
    color: "text-amber-600 dark:text-amber-400",
    bg: "bg-amber-500/10 border-amber-500/30",
    activeBorder: "border-amber-500/50 bg-amber-500/5",
    icon: MessageSquarePlus,
    titlePlaceholder: "e.g. Reader font sizing feels slightly too small on tablet",
    descPlaceholder:
      "Share your honest experience:\n• What are you enjoying in Novella?\n• What feels slow, confusing, or clunky?\n• How can we make your reading journey smoother?",
    descHint: "Every suggestion is read directly by the team.",
  },
  feature: {
    label: "Feature Appeal",
    shortLabel: "Feature",
    kicker: "Idea & Proposal",
    badge: "Feature Request",
    color: "text-sky-600 dark:text-sky-400",
    bg: "bg-sky-500/10 border-sky-500/30",
    activeBorder: "border-sky-500/50 bg-sky-500/5",
    icon: Sparkles,
    titlePlaceholder: "e.g. Audio pronunciation for vocabulary words using AI",
    descPlaceholder:
      "Pitch your idea:\n• What capability or tool would you like added?\n• Why would this be valuable for your study / reading habits?\n• How do you envision it working?",
    descHint: "Great ideas frequently get prioritized on our public roadmap.",
  },
  other: {
    label: "Other",
    shortLabel: "Other",
    kicker: "Inquiry & Other",
    badge: "General",
    color: "text-violet-600 dark:text-violet-400",
    bg: "bg-violet-500/10 border-violet-500/30",
    activeBorder: "border-violet-500/50 bg-violet-500/5",
    icon: HelpCircle,
    titlePlaceholder: "e.g. Question regarding reading data export or account migration",
    descPlaceholder:
      "How can we help?\n• Let us know what's on your mind\n• Any questions, account inquiries, or suggestions not covered above",
    descHint: "We review and respond to all general inquiries and queries.",
  },
} as const;

const AREAS = [
  { id: "general", label: "General / Dashboard" },
  { id: "reader", label: "Book Reader & Text View" },
  { id: "vocabulary", label: "Vocabulary & Flashcards" },
  { id: "review", label: "Daily SRS Review" },
  { id: "library", label: "Library & Quotes" },
  { id: "class", label: "Class & Assignments" },
  { id: "settings", label: "Account & Settings" },
  { id: "billing", label: "Plans & Payments" },
];

const SEVERITIES: { id: SeverityLevel; label: string; desc: string }[] = [
  { id: "low", label: "Low", desc: "Minor visual glitch or typo" },
  { id: "medium", label: "Medium", desc: "Annoying but manageable workaround" },
  { id: "high", label: "High", desc: "Blocks reading session or key tool" },
  { id: "critical", label: "Critical", desc: "App crash or data loss" },
];

function getDiagnosticInfo(): string {
  if (typeof window === "undefined") return "";
  const ua = navigator.userAgent;
  const screenRes = `${window.screen.width}x${window.screen.height}`;
  const viewport = `${window.innerWidth}x${window.innerHeight}`;
  const lang = navigator.language;
  return `Viewport: ${viewport} | Screen: ${screenRes} | Lang: ${lang} | UA: ${ua}`;
}

export default function ReportPage() {
  const { user } = useAuth();
  const formId = useId();

  // Form state
  const [type, setType] = useState<ReportType>("glitch");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [area, setArea] = useState("general");
  const [severity, setSeverity] = useState<SeverityLevel>("medium");
  const [includeDevice, setIncludeDevice] = useState(true);

  // Submission state
  const [submitting, setSubmitting] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);
  const [submittedSuccess, setSubmittedSuccess] = useState(false);

  // Past reports history
  const [reports, setReports] = useState<SubmittedReport[]>([]);
  const [loadingReports, setLoadingReports] = useState(true);

  const fetchReports = useCallback(async () => {
    if (!user) return;
    try {
      const token = await user.getIdToken();
      const res = await fetch("/api/reports", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (res.ok) {
        const data = await res.json();
        setReports(data.reports || []);
      }
    } catch (err) {
      console.error("Failed to fetch reports:", err);
    } finally {
      setLoadingReports(false);
    }
  }, [user]);

  useEffect(() => {
    let ignore = false;
    if (!user) return;

    user
      .getIdToken()
      .then((token) =>
        fetch("/api/reports", {
          headers: { Authorization: `Bearer ${token}` },
        })
      )
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!ignore && data?.reports) {
          setReports(data.reports);
        }
      })
      .catch((err) => console.error("Failed to load reports:", err))
      .finally(() => {
        if (!ignore) setLoadingReports(false);
      });

    return () => {
      ignore = true;
    };
  }, [user]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user) {
      setStatusMsg({ type: "err", text: "You must be signed in to submit a report." });
      return;
    }

    if (title.trim().length < 3) {
      setStatusMsg({ type: "err", text: "Please provide a title with at least 3 characters." });
      return;
    }

    if (description.trim().length < 5) {
      setStatusMsg({ type: "err", text: "Please enter detailed feedback (minimum 5 characters)." });
      return;
    }

    try {
      setSubmitting(true);
      setStatusMsg(null);
      const token = await user.getIdToken();

      const payload = {
        type,
        title: title.trim(),
        description: description.trim(),
        area,
        severity: type === "glitch" ? severity : null,
        deviceInfo: includeDevice ? getDiagnosticInfo() : null,
      };

      const res = await fetch("/api/reports", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        throw new Error(data?.error || `Submission failed with status ${res.status}`);
      }

      setSubmittedSuccess(true);
      setStatusMsg({
        type: "ok",
        text: "Thank you! Your submission has been recorded. Our team reviews all reports carefully.",
      });

      // Reset fields
      setTitle("");
      setDescription("");

      // Refresh reports list
      fetchReports();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to submit report. Please try again.";
      setStatusMsg({ type: "err", text: msg });
    } finally {
      setSubmitting(false);
    }
  }

  const currentConfig = TYPE_CONFIG[type];

  return (
    <div className="space-y-12">
      {/* ── Top Header ──────────────────────────────────────────────────── */}
      <div>
        <PageTitle>Report & Feedback</PageTitle>
        <p className="mt-2 max-w-2xl font-sans text-base text-muted-foreground leading-relaxed">
          Help us craft the cleanest reading experience. Report any glitch or bug you encounter,
          give us feedback on current features, appeal for brand new tools, or reach out with any general inquiry.
        </p>
      </div>

      <div className="grid gap-10 lg:grid-cols-[1.5fr_1fr] items-start">
        {/* ── Submission Form ────────────────────────────────────────────── */}
        <section className="rounded-3xl border border-border/80 bg-card p-6 sm:p-8 shadow-xs">
          {/* Type Selector Pills */}
          <div className="mb-8">
            <label className="font-mono text-xs uppercase tracking-wider text-muted-foreground font-semibold block mb-3">
              1. Choose Report Type
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {(["glitch", "feedback", "feature", "other"] as const).map((t) => {
                const conf = TYPE_CONFIG[t];
                const Icon = conf.icon;
                const isSelected = type === t;
                return (
                  <button
                    key={t}
                    type="button"
                    onClick={() => {
                      setType(t);
                      setStatusMsg(null);
                      setSubmittedSuccess(false);
                    }}
                    className={`flex flex-col items-start p-4 rounded-2xl border text-left transition-all duration-150 cursor-pointer ${
                      isSelected
                        ? `${conf.activeBorder} shadow-xs ring-1 ring-amber-500/20`
                        : "border-border/60 bg-secondary/20 hover:bg-secondary/40 hover:border-border"
                    }`}
                  >
                    <div
                      className={`flex size-8 items-center justify-center rounded-lg mb-2.5 ${conf.bg}`}
                    >
                      <Icon className={`size-4 ${conf.color}`} />
                    </div>
                    <span className="font-serif text-lg font-medium text-foreground leading-tight">
                      {conf.label}
                    </span>
                    <span className="font-mono text-[10px] uppercase text-muted-foreground mt-1">
                      {conf.badge}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Title / Summary */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label
                  htmlFor={`${formId}-title`}
                  className="font-mono text-xs uppercase tracking-wider text-muted-foreground font-semibold"
                >
                  2. Title / Summary
                </label>
                <span className="font-mono text-[10px] text-muted-foreground">
                  {title.length}/200
                </span>
              </div>
              <input
                id={`${formId}-title`}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={currentConfig.titlePlaceholder}
                maxLength={200}
                required
                className="h-11 w-full rounded-xl border border-border bg-secondary/30 px-3.5 font-sans text-sm text-foreground outline-none focus:border-ring transition-colors placeholder:text-muted-foreground/60"
              />
            </div>

            {/* Affected Area & Severity (if glitch) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor={`${formId}-area`}
                  className="font-mono text-xs uppercase tracking-wider text-muted-foreground font-semibold block mb-1.5"
                >
                  3. Affected Area
                </label>
                <select
                  id={`${formId}-area`}
                  value={area}
                  onChange={(e) => setArea(e.target.value)}
                  className="h-11 w-full rounded-xl border border-border bg-card px-3 font-sans text-sm text-foreground outline-none focus:border-ring transition-colors"
                >
                  {AREAS.map((a) => (
                    <option key={a.id} value={a.id} className="bg-card text-foreground">
                      {a.label}
                    </option>
                  ))}
                </select>
              </div>

              {type === "glitch" ? (
                <div>
                  <label
                    htmlFor={`${formId}-severity`}
                    className="font-mono text-xs uppercase tracking-wider text-muted-foreground font-semibold block mb-1.5"
                  >
                    Severity
                  </label>
                  <select
                    id={`${formId}-severity`}
                    value={severity}
                    onChange={(e) => setSeverity(e.target.value as SeverityLevel)}
                    className="h-11 w-full rounded-xl border border-border bg-card px-3 font-sans text-sm text-foreground outline-none focus:border-ring transition-colors"
                  >
                    {SEVERITIES.map((s) => (
                      <option key={s.id} value={s.id} className="bg-card text-foreground">
                        {s.label} — {s.desc}
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <div className="flex flex-col justify-end">
                  <div className="rounded-xl border border-border/50 bg-secondary/20 p-2.5 text-xs text-muted-foreground flex items-center gap-2">
                    <Sparkles className="size-4 shrink-0 text-amber-500" />
                    <span>Your proposal directly shapes upcoming releases.</span>
                  </div>
                </div>
              )}
            </div>

            {/* Description */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label
                  htmlFor={`${formId}-description`}
                  className="font-mono text-xs uppercase tracking-wider text-muted-foreground font-semibold"
                >
                  4. Details & Explanation
                </label>
                <span className="font-mono text-[10px] text-muted-foreground">
                  {description.length}/5000
                </span>
              </div>
              <textarea
                id={`${formId}-description`}
                rows={6}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={currentConfig.descPlaceholder}
                maxLength={5000}
                required
                className="w-full rounded-xl border border-border bg-secondary/30 p-3.5 font-sans text-sm text-foreground outline-none focus:border-ring transition-colors placeholder:text-muted-foreground/60 resize-y leading-relaxed"
              />
              <p className="mt-1 text-xs text-muted-foreground font-sans">{currentConfig.descHint}</p>
            </div>

            {/* Device Diagnostic Info Toggle */}
            <div className="rounded-2xl border border-border/60 bg-secondary/20 p-4 space-y-2">
              <label className="flex items-start gap-3 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={includeDevice}
                  onChange={(e) => setIncludeDevice(e.target.checked)}
                  className="mt-0.5 size-4 rounded accent-amber-600 dark:accent-amber-500"
                />
                <div className="text-xs">
                  <span className="font-medium text-foreground block">
                    Include browser & screen diagnostics
                  </span>
                  <span className="text-muted-foreground">
                    Helps us reproduce resolution and browser-specific glitches faster.
                  </span>
                </div>
              </label>

              {includeDevice && (
                <div className="flex items-center gap-2 pt-2 border-t border-border/40 font-mono text-[10px] text-muted-foreground/80 break-all">
                  <Laptop className="size-3 shrink-0 text-muted-foreground" />
                  <span>Diagnostics will be attached automatically upon submission.</span>
                </div>
              )}
            </div>

            {/* Status alerts */}
            {statusMsg && (
              <div
                className={`flex items-start gap-3 rounded-2xl border p-4 text-sm ${
                  statusMsg.type === "ok"
                    ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
                    : "border-destructive/30 bg-destructive/10 text-destructive"
                }`}
              >
                {statusMsg.type === "ok" ? (
                  <CheckCircle2 className="size-5 shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="size-5 shrink-0 mt-0.5" />
                )}
                <div className="space-y-1">
                  <p className="font-medium">{statusMsg.text}</p>
                  {submittedSuccess && (
                    <button
                      type="button"
                      onClick={() => setSubmittedSuccess(false)}
                      className="inline-flex items-center gap-1 font-mono text-xs underline underline-offset-2 hover:opacity-80 pt-1"
                    >
                      <RotateCcw className="size-3" /> Submit another response
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Action buttons */}
            <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
              <p className="font-mono text-xs text-muted-foreground">
                Logged in as <span className="font-medium text-foreground">{user?.email}</span>
              </p>

              <button
                type="submit"
                disabled={submitting}
                className="site-button site-button-primary inline-flex items-center gap-2 px-6 py-2.5 rounded-xl disabled:opacity-50 cursor-pointer"
              >
                <Send className="size-4" />
                <span>
                  {submitting
                    ? "Submitting…"
                    : type === "glitch"
                    ? "Submit Bug Report"
                    : type === "feature"
                    ? "Submit Feature Appeal"
                    : type === "other"
                    ? "Submit Inquiry"
                    : "Send Feedback"}
                </span>
              </button>
            </div>
          </form>
        </section>

        {/* ── Submissions History & Guidelines ───────────────────────────── */}
        <div className="space-y-6">
          {/* Quick Info Box */}
          <section className="rounded-3xl border border-border/80 bg-card p-6 shadow-xs space-y-4">
            <div className="flex items-center gap-2 border-b border-border/60 pb-3">
              <HelpCircle className="size-4 text-amber-500" />
              <h2 className="font-serif text-xl font-medium text-foreground">What happens next?</h2>
            </div>
            <div className="space-y-3 font-sans text-xs text-muted-foreground leading-relaxed">
              <div className="flex gap-2.5 items-start">
                <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-amber-500/10 font-mono text-[10px] font-bold text-amber-600">
                  1
                </span>
                <p>
                  <strong className="text-foreground">Triage & Verification:</strong> Reports are
                  reviewed within 24–48 hours to replicate glitches and catalog feedback.
                </p>
              </div>
              <div className="flex gap-2.5 items-start">
                <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-amber-500/10 font-mono text-[10px] font-bold text-amber-600">
                  2
                </span>
                <p>
                  <strong className="text-foreground">Roadmap Inclusion:</strong> Popular feature
                  appeals are added to our development cycles and public changelogs.
                </p>
              </div>
              <div className="flex gap-2.5 items-start">
                <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-amber-500/10 font-mono text-[10px] font-bold text-amber-600">
                  3
                </span>
                <p>
                  <strong className="text-foreground">Status Tracking:</strong> You can see your
                  submission history and status updates right in the list below.
                </p>
              </div>
            </div>
          </section>

          {/* Submissions List */}
          <section className="rounded-3xl border border-border/80 bg-card p-6 shadow-xs">
            <div className="flex items-center justify-between border-b border-border/60 pb-3">
              <div className="flex items-center gap-2">
                <Clock className="size-4 text-amber-500" />
                <h2 className="font-serif text-xl font-medium text-foreground">Your Submissions</h2>
              </div>
              <span className="font-mono text-xs text-muted-foreground">
                {reports.length} item{reports.length !== 1 ? "s" : ""}
              </span>
            </div>

            <div className="mt-4 space-y-3">
              {loadingReports ? (
                <div className="py-8 text-center">
                  <p className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
                    Loading your reports…
                  </p>
                </div>
              ) : reports.length === 0 ? (
                <div className="py-8 text-center text-muted-foreground space-y-2">
                  <Flame className="mx-auto size-6 text-muted-foreground/40" />
                  <p className="font-sans text-xs">No previous submissions yet.</p>
                  <p className="font-mono text-[11px] text-muted-foreground/80">
                    When you submit feedback or bug reports, they will be listed here.
                  </p>
                </div>
              ) : (
                reports.map((item) => {
                  const conf =
                    TYPE_CONFIG[item.type as ReportType] || TYPE_CONFIG.feedback;
                  const Icon = conf.icon;
                  const formattedDate = new Date(item.createdAt).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  });

                  return (
                    <div
                      key={item.id}
                      className="rounded-2xl border border-border/60 bg-secondary/10 p-3.5 space-y-2 hover:border-border transition-colors"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`flex size-6 items-center justify-center rounded-md ${conf.bg}`}
                            title={conf.label}
                          >
                            <Icon className={`size-3.5 ${conf.color}`} />
                          </span>
                          <span className="font-mono text-[10px] uppercase font-semibold text-muted-foreground">
                            {conf.shortLabel}
                          </span>
                          {item.area && (
                            <>
                              <span className="text-muted-foreground/40">•</span>
                              <span className="font-mono text-[10px] text-muted-foreground capitalize">
                                {item.area}
                              </span>
                            </>
                          )}
                        </div>

                        {/* Status Badge */}
                        <span
                          className={`font-mono text-[9px] uppercase px-2 py-0.5 rounded-full font-semibold border ${
                            item.status === "RESOLVED"
                              ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/30"
                              : item.status === "IN_REVIEW"
                              ? "bg-amber-500/10 text-amber-600 border-amber-500/30"
                              : "bg-sky-500/10 text-sky-600 border-sky-500/30"
                          }`}
                        >
                          {item.status.replace("_", " ")}
                        </span>
                      </div>

                      <h3 className="font-serif text-base font-medium text-foreground leading-snug line-clamp-1">
                        {item.title}
                      </h3>

                      <p className="font-sans text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                        {item.description}
                      </p>

                      <div className="flex items-center justify-between pt-1 border-t border-border/30 font-mono text-[10px] text-muted-foreground">
                        <span>{formattedDate}</span>
                        {item.severity && (
                          <span className="uppercase text-amber-600 dark:text-amber-400 font-semibold">
                            {item.severity} severity
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
