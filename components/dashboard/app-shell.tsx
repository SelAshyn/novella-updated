"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import type { ReactNode } from "react";

import { ThemeToggle } from "./theme-toggle";
import { useAuth } from "@/components/landing/auth-provider";

import {
  BookOpen,
  Flame,
  LayoutGrid,
  MessageSquarePlus,
  Repeat,
  Search,
  Settings,
  Snowflake,
  Trophy,
  Type,
  Users,
} from "lucide-react";

const nav = [
  { to: "/dashboard",            label: "Today",      icon: LayoutGrid, exact: true  },
  { to: "/dashboard/library",    label: "Library",    icon: BookOpen,   exact: false },
  { to: "/dashboard/review",     label: "Review",     icon: Repeat,     exact: true  },
  { to: "/dashboard/vocabulary", label: "Vocab",      icon: Type,       exact: true  },
  { to: "/dashboard/class",      label: "Class",      icon: Users,      exact: true  },
  { to: "/dashboard/settings",   label: "Settings",   icon: Settings,   exact: true  },
] as const;

interface UserStats {
  displayName: string | null;
  currentStreak: number;
  longestStreak: number;
  streakFreezes: number;
  lastReadDate: string | null;
  plan: string;
}

function dayGap(lastReadDate: string): number {
  const last = new Date(lastReadDate);
  const now  = new Date();
  const msPerDay = 86_400_000;
  const lastDay  = Date.UTC(last.getUTCFullYear(), last.getUTCMonth(), last.getUTCDate());
  const todayDay = Date.UTC(now.getUTCFullYear(),  now.getUTCMonth(),  now.getUTCDate());
  return Math.round((todayDay - lastDay) / msPerDay);
}

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { user } = useAuth();
  const [stats, setStats] = useState<UserStats | null>(null);

  const displayName = user?.displayName || user?.email?.split("@")[0] || "User";
  const initial = displayName[0].toUpperCase();

  useEffect(() => {
    let ignore = false;
    if (!user) return;
    user.getIdToken()
      .then((token) => fetch("/api/user/stats", { headers: { Authorization: `Bearer ${token}` } }))
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => { if (!ignore && data) setStats(data); })
      .catch((err) => console.error("Failed to fetch user stats:", err));
    return () => { ignore = true; };
  }, [user?.uid]);

  const gap       = stats?.lastReadDate ? dayGap(stats.lastReadDate) : null;
  const readToday = gap === 0;
  const isAlive   = gap !== null && gap <= 1 && stats!.currentStreak > 0;

  return (
    <div className="min-h-screen md:grid md:grid-cols-[16rem_1fr] bg-background text-foreground">
      <a
        href="#main"
        className="kicker sr-only focus:not-sr-only focus:absolute focus:left-2 focus:top-2 focus:bg-primary focus:p-2 focus:text-primary-foreground focus:rounded-md z-50"
      >
        Skip to content
      </a>

      {/* ── Desktop Sidebar ──────────────────────────────────────────────── */}
      <aside className="hidden md:sticky md:top-0 md:flex md:h-screen md:flex-col md:border-r md:border-border md:bg-sidebar/60 md:backdrop-blur-md">

        {/* Logo */}
        <div className="flex items-center justify-between px-6 py-5">
          <Link href="/" className="group flex items-center gap-2.5">
            <div className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-xs">
              <BookOpen className="size-4 stroke-[2.2]" />
            </div>
            <div>
              <span className="font-serif text-2xl font-bold tracking-tight text-foreground leading-none">
                Novella
              </span>
              <p className="font-mono text-[9px] tracking-wider uppercase text-muted-foreground mt-0.5">
                Reading notebook
              </p>
            </div>
          </Link>
        </div>

        {/* Nav */}
        <nav className="flex flex-col gap-1 px-3">
          {nav.map(({ to, label, icon: Icon, exact }) => {
            const isActive = exact ? pathname === to : pathname === to || pathname.startsWith(`${to}/`);
            return (
              <Link
                key={to}
                href={to}
                aria-current={isActive ? "page" : undefined}
                className={`flex min-h-10 items-center gap-3 rounded-xl px-3.5 py-2 font-sans text-sm font-medium transition-all duration-150 ${
                  isActive
                    ? "bg-card text-foreground font-semibold shadow-xs border border-border/80"
                    : "text-muted-foreground hover:bg-card/50 hover:text-foreground"
                }`}
              >
                <Icon className={`size-4 shrink-0 ${isActive ? "text-amber-600 dark:text-amber-400" : "text-muted-foreground"}`} />
                {label}
              </Link>
            );
          })}
        </nav>

        {/* Streak Card */}
        <div className="mx-3 mt-6">
          <div className="rounded-2xl border border-border/80 bg-card p-4 space-y-3 shadow-xs">
            {!stats ? (
              <div className="flex items-center gap-2">
                <Flame className="size-4 animate-pulse text-muted-foreground" />
                <span className="font-mono text-xs text-muted-foreground">Loading streak…</span>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="flex size-8 items-center justify-center rounded-lg bg-amber-500/10">
                      <Flame className={`size-4 ${isAlive ? "text-amber-600 dark:text-amber-400" : "text-muted-foreground"}`} strokeWidth={isAlive ? 2.5 : 1.5} />
                    </div>
                    <div>
                      <div className="flex items-baseline gap-1">
                        <span className="font-serif text-2xl font-bold leading-none text-foreground">{stats.currentStreak}</span>
                        <span className="font-mono text-[10px] uppercase text-muted-foreground">day{stats.currentStreak !== 1 ? "s" : ""}</span>
                      </div>
                    </div>
                  </div>
                  {stats.longestStreak > 0 && (
                    <div className="flex items-center gap-1 text-muted-foreground rounded-full bg-secondary/80 px-2 py-0.5" title={`Personal best: ${stats.longestStreak} days`}>
                      <Trophy className="size-3 text-amber-500" />
                      <span className="font-mono text-[10px] font-semibold">{stats.longestStreak}</span>
                    </div>
                  )}
                </div>
                <p className={`font-sans text-xs leading-snug ${readToday ? "text-emerald-600 dark:text-emerald-400 font-medium" : isAlive ? "text-amber-600 dark:text-amber-400 font-medium" : "text-muted-foreground"}`}>
                  {readToday ? "✓ You've read today" : isAlive ? "Read today to keep the flame alive" : stats.currentStreak === 0 ? "Read something to ignite your streak" : "Streak reset — start a new record today"}
                </p>
                {stats.streakFreezes > 0 ? (
                  <div className="flex items-center gap-1.5 flex-wrap pt-1 border-t border-border/40">
                    {Array.from({ length: Math.min(stats.streakFreezes, 5) }).map((_, i) => (
                      <div key={i} className="flex size-5 items-center justify-center rounded-md bg-sky-500/10 text-sky-500" title="Streak freeze">
                        <Snowflake className="size-3" />
                      </div>
                    ))}
                    {stats.streakFreezes > 5 && <span className="font-mono text-[10px] text-muted-foreground">+{stats.streakFreezes - 5}</span>}
                    <span className="font-mono text-[10px] text-muted-foreground ml-auto">{stats.streakFreezes} freeze{stats.streakFreezes !== 1 ? "s" : ""}</span>
                  </div>
                ) : (
                  <p className="font-mono text-[10px] text-muted-foreground pt-1 border-t border-border/40">No active streak freezes</p>
                )}
              </>
            )}
          </div>
        </div>

        <div className="flex-1" />

        {/* Report link */}
        <div className="px-3">
          <Link
            href="/dashboard/report"
            aria-current={pathname === "/dashboard/report" ? "page" : undefined}
            className={`flex min-h-10 items-center gap-3 bg-background shadow-lg rounded-xl px-3.5 py-2 font-sans text-sm font-medium transition-all duration-150 ${
              pathname === "/dashboard/report" ? "bg-card text-foreground font-semibold shadow-xs border border-border/80" : "text-muted-foreground hover:bg-card/50 hover:text-foreground"
            }`}
          >
            <MessageSquarePlus className={`size-4 ${pathname === "/dashboard/report" ? "text-amber-600 dark:text-amber-400" : "text-muted-foreground"}`} />
            <span>Report & Feedback</span>
          </Link>
        </div>

        {/* User profile */}
        <div className="py-2 px-1">
          <div className="flex shadow-lg bg-background m-2 rounded-xl p-2 items-center gap-3">
            <div className="grid size-9 shrink-0 place-items-center rounded-full bg-amber-500/10 border border-amber-500/20 font-mono text-sm font-bold text-amber-700 dark:text-amber-300">
              {initial}
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-foreground">{displayName}</p>
              <p className="font-sans text-[9px] text-muted-foreground truncate">{user?.email ?? ""}</p>
            </div>
          </div>
        </div>
      </aside>

      {/* ── Main content area ────────────────────────────────────────────── */}
      <div className="min-w-0 flex flex-col pb-16 md:pb-0">

        {/* Mobile top bar */}
        <div className="flex items-center justify-between border-b border-border bg-background/90 backdrop-blur-md px-4 py-3 md:hidden">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex size-7 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <BookOpen className="size-3.5 stroke-[2.2]" />
            </div>
            <span className="font-serif text-xl font-bold tracking-tight text-foreground">Novella</span>
          </Link>
          <div className="flex items-center gap-2">
            {/* Compact streak badge on mobile */}
            {stats && stats.currentStreak > 0 && (
              <div className="flex items-center gap-1 rounded-full bg-amber-500/10 px-2.5 py-1">
                <Flame className={`size-3.5 ${isAlive ? "text-amber-500" : "text-muted-foreground"}`} />
                <span className="font-mono text-xs font-bold text-amber-700 dark:text-amber-300">{stats.currentStreak}</span>
              </div>
            )}
            <ThemeToggle />
          </div>
        </div>

        {/* Desktop top header */}
        <header className="hidden md:flex sticky top-0 z-40 items-center gap-3 border-b border-border bg-background/80 backdrop-blur-xl px-10 py-3">
          <Search className="size-4 text-muted-foreground shrink-0" />
          <input
            aria-label="Search your library"
            placeholder="Search words, passages, notes, titles…"
            className="h-10 w-full bg-transparent font-sans text-sm text-foreground outline-none placeholder:text-muted-foreground"
          />
          <div className="shrink-0">
            <ThemeToggle />
          </div>
        </header>

        <main id="main" className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:px-6 md:px-10 md:py-10">
          {children}
        </main>
      </div>

      {/* ── Mobile bottom navigation bar ─────────────────────────────────── */}
      <nav
        aria-label="Mobile navigation"
        className="fixed bottom-0 left-0 right-0 z-40 flex border-t border-border bg-background/95 backdrop-blur-xl md:hidden"
      >
        {nav.map(({ to, label, icon: Icon, exact }) => {
          const isActive = exact ? pathname === to : pathname === to || pathname.startsWith(`${to}/`);
          return (
            <Link
              key={to}
              href={to}
              aria-current={isActive ? "page" : undefined}
              className={`flex flex-1 flex-col items-center justify-center gap-0.5 py-2.5 text-[10px] font-mono font-semibold uppercase tracking-wide transition-colors ${
                isActive ? "text-amber-600 dark:text-amber-400" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Icon className="size-5 shrink-0" strokeWidth={isActive ? 2.2 : 1.8} />
              <span>{label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}

// ── PageTitle ──────────────────────────────────────────────────────────────

export function PageTitle({ kicker, children }: { kicker?: string; children: ReactNode }) {
  return (
    <div className="mb-8 sm:mb-10">
      {kicker && (
        <div className="inline-flex items-center gap-1.5 rounded-full border border-border bg-secondary/80 px-3 py-0.5 mb-2">
          <span className="font-mono text-[11px] font-semibold tracking-wider uppercase text-amber-600 dark:text-amber-400">
            {kicker}
          </span>
        </div>
      )}
      <h1 className="mt-1 font-serif text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-medium tracking-tight text-foreground leading-[1.08]">
        {children}
      </h1>
    </div>
  );
}
