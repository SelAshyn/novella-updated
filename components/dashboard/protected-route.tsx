"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { useAuth } from "@/components/landing/auth-provider";
import { useApi } from "@/hooks/useApi";

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const api = useApi();

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/auth");
      return;
    }

    // Check if email is verified
    if (!loading && user && !user.emailVerified) {
      router.replace("/auth/verify-email?email=" + encodeURIComponent(user.email || ""));
    }
  }, [user, loading, router]);

  const { setTheme: setNextTheme } = useTheme();

  // Restore saved theme from DB once on login
  useEffect(() => {
    if (!user || !user.emailVerified) return;
    api.get("/api/settings/theme")
      .then(({ theme }: { theme: string }) => {
        const local = localStorage.getItem("novella-theme") || localStorage.getItem("theme");
        const resolved = local ?? theme;
        if (resolved === "light" || resolved === "dark") {
          localStorage.setItem("novella-theme", resolved);
          setNextTheme(resolved);
        }
      })
      .catch(() => {});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.uid, user?.emailVerified, setNextTheme]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="mb-4 inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent motion-reduce:animate-[spin_1.5s_linear_infinite]"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user || !user.emailVerified) return null;

  return <>{children}</>;
}
