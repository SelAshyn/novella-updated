"use client";

import { useEffect, useState } from "react";
import { DashboardData } from "@/lib/types";
import { useAuth } from "@/components/landing/auth-provider";

export function useDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    if (!user) {
      setData(null);
      setLoading(false);
      return;
    }

    async function fetchDashboard() {
      try {
        setLoading(true);
        if (!user) return;
        const token = await user.getIdToken();

        const response = await fetch('/api/dashboard', {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          const body = await response.json().catch(() => ({}));
          throw new Error(`Dashboard API ${response.status}: ${body.detail || body.error || 'unknown'}`);
        }

        const dashboardData = await response.json();
        setData(dashboardData);
        setError(null);
      } catch (err) {
        console.error('Error fetching dashboard:', err);
        setError(err as Error);
      } finally {
        setLoading(false);
      }
    }

    fetchDashboard();
  }, [user]);

  return { data, loading, error };
}

