"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import {
  updateProfile,
  updatePassword,
  EmailAuthProvider,
  reauthenticateWithCredential,
} from "firebase/auth";
import { LogOut, Moon, Save, Sun, User, Lock, Palette } from "lucide-react";

import { PageTitle } from "@/components/dashboard/app-shell";
import { useAuth, signOutUser } from "@/components/landing/auth-provider";
import { useApi } from "@/hooks/useApi";

export default function SettingsPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const api = useApi();

  // Profile form
  const [displayName, setDisplayName] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileMsg, setProfileMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  // Password form
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [savingPassword, setSavingPassword] = useState(false);
  const [passwordMsg, setPasswordMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  // Theme from next-themes for synchronized dashboard toggle and appearance settings
  const { resolvedTheme, setTheme: setNextTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const currentTheme = mounted ? (resolvedTheme === "dark" ? "dark" : "light") : "light";

  useEffect(() => {
    if (!user) return;
    // Use Firebase displayName if already set, otherwise fetch from DB
    if (user.displayName) {
      setDisplayName(user.displayName);
      return;
    }
    api.get("/api/user/stats")
      .then((data: { displayName?: string | null }) => {
        if (data.displayName) setDisplayName(data.displayName);
      })
      .catch(() => {});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.uid]);

  useEffect(() => {
    if (!user) return;
    api.get("/api/settings/theme")
      .then(({ theme: t }: { theme: string }) => {
        if (t === "light" || t === "dark") {
          const local = localStorage.getItem("theme");
          if (!local) {
            setNextTheme(t);
          }
          localStorage.setItem("novella-theme", t);
        }
      })
      .catch(() => {});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.uid]);

  async function applyTheme(next: "light" | "dark", event?: React.MouseEvent) {
    if (currentTheme === next) return;

    localStorage.setItem("novella-theme", next);

    const isAppearanceTransition =
      typeof document !== "undefined" &&
      "startViewTransition" in document &&
      !window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (!isAppearanceTransition || !event) {
      setNextTheme(next);
    } else {
      const rect = event.currentTarget.getBoundingClientRect();
      const x = rect.left + rect.width / 2;
      const y = rect.top + rect.height / 2;
      const endRadius = Math.hypot(
        Math.max(x, window.innerWidth - x),
        Math.max(y, window.innerHeight - y)
      );

      const doc = document as unknown as {
        startViewTransition: (callback: () => void) => {
          ready: Promise<void>;
        };
      };

      const transition = doc.startViewTransition(() => {
        setNextTheme(next);
      });

      transition.ready.then(() => {
        const clipPath = [
          `circle(0px at ${x}px ${y}px)`,
          `circle(${endRadius}px at ${x}px ${y}px)`,
        ];
        document.documentElement.animate(
          {
            clipPath,
          },
          {
            duration: 1800,
            easing: "cubic-bezier(0.16, 1, 0.3, 1)",
            pseudoElement: "::view-transition-new(root)",
          }
        );
      });
    }

    try {
      await api.patch("/api/settings/theme", { theme: next });
    } catch {}
  }

  async function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    setProfileMsg(null);
    try {
      setSavingProfile(true);
      // Update Firebase Auth profile
      await updateProfile(user, { displayName: displayName.trim() || null });
      // Sync to the Prisma DB so server-side queries reflect the new name
      await api.patch("/api/user/profile", { displayName: displayName.trim() || null });
      setProfileMsg({ type: "ok", text: "Profile updated successfully." });
    } catch (err: any) {
      setProfileMsg({ type: "err", text: err?.message ?? "Failed to update profile." });
    } finally {
      setSavingProfile(false);
    }
  }

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();
    if (!user || !user.email) return;
    setPasswordMsg(null);

    if (newPassword !== confirmPassword) {
      setPasswordMsg({ type: "err", text: "New passwords don't match." });
      return;
    }
    if (newPassword.length < 8) {
      setPasswordMsg({ type: "err", text: "Password must be at least 8 characters." });
      return;
    }
    if (currentPassword === newPassword) {
      setPasswordMsg({ type: "err", text: "New password must be different from your current password." });
      return;
    }

    try {
      setSavingPassword(true);
      const credential = EmailAuthProvider.credential(user.email, currentPassword);
      await reauthenticateWithCredential(user, credential);
      await updatePassword(user, newPassword);
      setPasswordMsg({ type: "ok", text: "Password changed successfully." });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      const code = err?.code ?? "";
      if (code === "auth/wrong-password" || code === "auth/invalid-credential") {
        setPasswordMsg({ type: "err", text: "Current password is incorrect." });
      } else {
        setPasswordMsg({ type: "err", text: err?.message ?? "Failed to change password." });
      }
    } finally {
      setSavingPassword(false);
    }
  }

  async function handleSignOut() {
    await signOutUser();
    router.replace("/");
  }

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <p className="font-mono text-xs uppercase tracking-wider text-muted-foreground">Loading settings…</p>
      </div>
    );
  }

  const joinedDate = user?.metadata.creationTime
    ? new Date(user.metadata.creationTime).toLocaleDateString("en-US", {
        year: "numeric", month: "long", day: "numeric",
      })
    : null;

  const isEmailProvider = user?.providerData.some((p) => p.providerId === "password");

  return (
    <>
      <PageTitle kicker="Account Preferences">Settings</PageTitle>

      <div className="grid max-w-4xl gap-6 lg:grid-cols-2">

        {/* Profile Card */}
        <section className="rounded-3xl border border-border/80 bg-card p-6 sm:p-8 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 text-muted-foreground border-b border-border/60 pb-3">
              <User className="size-4 text-amber-500" />
              <h2 className="font-serif text-2xl font-medium text-foreground">Profile</h2>
            </div>

            <form onSubmit={handleSaveProfile} className="mt-5 space-y-4">
              <div>
                <label htmlFor="display-name" className="font-mono text-xs uppercase tracking-wider text-muted-foreground block mb-1 font-semibold">
                  Display name
                </label>
                <input
                  id="display-name"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Your full name"
                  className="h-11 w-full rounded-xl border border-border bg-secondary/30 px-3.5 font-sans text-sm text-foreground outline-none focus:border-ring transition-colors"
                />
              </div>

              <div>
                <label htmlFor="email" className="font-mono text-xs uppercase tracking-wider text-muted-foreground block mb-1 font-semibold">
                  Email
                </label>
                <input
                  id="email"
                  value={user?.email ?? ""}
                  readOnly
                  disabled
                  className="h-11 w-full rounded-xl border border-border/60 bg-muted/40 px-3.5 font-sans text-sm text-muted-foreground outline-none cursor-not-allowed"
                />
                <p className="mt-1 text-xs text-muted-foreground">Registered via Google or email provider.</p>
              </div>

              {joinedDate && (
                <p className="font-mono text-xs text-muted-foreground pt-1">
                  Reader since {joinedDate}
                </p>
              )}

              {profileMsg && (
                <p className={`text-xs font-mono ${profileMsg.type === "ok" ? "text-emerald-600 dark:text-emerald-400" : "text-destructive"}`}>
                  {profileMsg.text}
                </p>
              )}

              <button
                type="submit"
                disabled={savingProfile}
                className="site-button site-button-primary inline-flex items-center gap-2 disabled:opacity-50 mt-2"
              >
                <Save className="size-4" />
                <span>{savingProfile ? "Saving…" : "Save profile"}</span>
              </button>
            </form>
          </div>
        </section>

        {/* Password Card */}
        <section className="rounded-3xl border border-border/80 bg-card p-6 sm:p-8 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 text-muted-foreground border-b border-border/60 pb-3">
              <Lock className="size-4 text-amber-500" />
              <h2 className="font-serif text-2xl font-medium text-foreground">Password</h2>
            </div>

            {isEmailProvider ? (
              <form onSubmit={handleChangePassword} className="mt-5 space-y-4">
                <div>
                  <label htmlFor="current-pw" className="font-mono text-xs uppercase tracking-wider text-muted-foreground block mb-1 font-semibold">
                    Current password
                  </label>
                  <input
                    id="current-pw"
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="h-11 w-full rounded-xl border border-border bg-secondary/30 px-3.5 font-sans text-sm text-foreground outline-none focus:border-ring transition-colors"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="new-pw" className="font-mono text-xs uppercase tracking-wider text-muted-foreground block mb-1 font-semibold">
                    New password
                  </label>
                  <input
                    id="new-pw"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="h-11 w-full rounded-xl border border-border bg-secondary/30 px-3.5 font-sans text-sm text-foreground outline-none focus:border-ring transition-colors"
                    required
                    minLength={8}
                  />
                </div>
                <div>
                  <label htmlFor="confirm-pw" className="font-mono text-xs uppercase tracking-wider text-muted-foreground block mb-1 font-semibold">
                    Confirm new password
                  </label>
                  <input
                    id="confirm-pw"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="h-11 w-full rounded-xl border border-border bg-secondary/30 px-3.5 font-sans text-sm text-foreground outline-none focus:border-ring transition-colors"
                    required
                  />
                </div>

                {passwordMsg && (
                  <p className={`text-xs font-mono ${passwordMsg.type === "ok" ? "text-emerald-600 dark:text-emerald-400" : "text-destructive"}`}>
                    {passwordMsg.text}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={savingPassword}
                  className="site-button site-button-primary inline-flex items-center gap-2 disabled:opacity-50 mt-2"
                >
                  <Save className="size-4" />
                  <span>{savingPassword ? "Updating…" : "Update password"}</span>
                </button>
              </form>
            ) : (
              <p className="mt-5 text-sm text-muted-foreground leading-relaxed">
                You signed in via an external OAuth provider. Password reset is managed by your provider.
              </p>
            )}
          </div>
        </section>

        {/* Appearance Card */}
        <section className="rounded-3xl border border-border/80 bg-card p-6 sm:p-8 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 text-muted-foreground border-b border-border/60 pb-3">
              <Palette className="size-4 text-amber-500" />
              <h2 className="font-serif text-2xl font-medium text-foreground">Appearance</h2>
            </div>
            <p className="mt-3 text-sm text-muted-foreground">
              Select your reading atmosphere. Saved to your profile and synchronized across all your devices.
            </p>
            <div className="mt-6 grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={(e) => applyTheme("light", e)}
                className={`flex items-center justify-center gap-2.5 rounded-2xl border p-4 font-sans text-sm font-medium transition-all ${
                  currentTheme === "light"
                    ? "border-amber-500 bg-amber-500/10 text-foreground shadow-xs font-semibold"
                    : "border-border bg-secondary/40 text-muted-foreground hover:bg-secondary hover:text-foreground"
                }`}
              >
                <Sun className="size-4.5 text-amber-500 shrink-0" />
                <span><span className="hidden sm:inline">Light </span>Linen</span>
              </button>
              <button
                type="button"
                onClick={(e) => applyTheme("dark", e)}
                className={`flex items-center justify-center gap-2.5 rounded-2xl border p-4 font-sans text-sm font-medium transition-all ${
                  currentTheme === "dark"
                    ? "border-amber-500 bg-amber-500/10 text-foreground shadow-xs font-semibold"
                    : "border-border bg-secondary/40 text-muted-foreground hover:bg-secondary hover:text-foreground"
                }`}
              >
                <Moon className="size-4.5 text-amber-400 shrink-0" />
                <span><span className="hidden sm:inline">Midnight </span>Dark</span>
              </button>
            </div>
          </div>
        </section>

        {/* Sign Out Card */}
        <section className="rounded-3xl border border-border/80 bg-card p-6 sm:p-8 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 text-muted-foreground border-b border-border/60 pb-3">
              <LogOut className="size-4 text-destructive" />
              <h2 className="font-serif text-2xl font-medium text-foreground">Sign out</h2>
            </div>
            <p className="mt-3 text-sm text-muted-foreground">
              Safely end your current session on this device. Your books, cards, and streaks remain preserved.
            </p>
            <button
              type="button"
              onClick={handleSignOut}
              className="site-button site-button-outline w-full sm:w-auto inline-flex items-center gap-2 mt-6 text-destructive hover:border-destructive/40 hover:bg-destructive/10"
            >
              <LogOut className="size-4" />
              <span>Sign out of Novella</span>
            </button>
          </div>
        </section>

      </div>
    </>
  );
}
