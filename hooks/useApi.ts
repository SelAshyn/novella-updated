"use client";

import { useCallback } from "react";
import { useAuth } from "@/components/landing/auth-provider";

export function useApi() {
  const { user } = useAuth();

  const authHeaders = useCallback(async (): Promise<HeadersInit> => {
    if (!user) throw new Error("Not authenticated");
    const token = await user.getIdToken();
    return {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    };
  }, [user]);

  const get = useCallback(async (path: string) => {
    const headers = await authHeaders();
    const res = await fetch(path, { headers });
    if (!res.ok) throw new Error(`GET ${path} failed: ${res.status}`);
    return res.json();
  }, [authHeaders]);

  const post = useCallback(async (path: string, body: unknown) => {
    const headers = await authHeaders();
    const res = await fetch(path, { method: "POST", headers, body: JSON.stringify(body) });
    if (!res.ok) throw new Error(`POST ${path} failed: ${res.status}`);
    return res.json();
  }, [authHeaders]);

  const patch = useCallback(async (path: string, body: unknown) => {
    const headers = await authHeaders();
    const res = await fetch(path, { method: "PATCH", headers, body: JSON.stringify(body) });
    if (!res.ok) throw new Error(`PATCH ${path} failed: ${res.status}`);
    return res.json();
  }, [authHeaders]);

  const del = useCallback(async (path: string, body?: unknown) => {
    const headers = await authHeaders();
    const res = await fetch(path, {
      method: "DELETE",
      headers,
      ...(body ? { body: JSON.stringify(body) } : {}),
    });
    if (!res.ok) throw new Error(`DELETE ${path} failed: ${res.status}`);
    return res.json();
  }, [authHeaders]);

  return { get, post, patch, del };
}
