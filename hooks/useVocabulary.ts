"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/components/landing/auth-provider";

export interface VocabCardWithBook {
  id: string;
  word: string;
  ipa?: string | null;
  meaning: string;
  example: string;
  pageNumber: number;
  nextReviewDate: string;
  reviewCount: number;
  createdAt: string;
  book: { id: string; title: string; author: string };
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

export function useVocabulary() {
  const { user } = useAuth();
  const [cards, setCards] = useState<VocabCardWithBook[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCards = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      setError(null);
      const headers = await authHeaders(user);
      const res = await fetch("/api/vocabulary", { headers });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || `Failed to load vocabulary (${res.status})`);
      }
      const data = await res.json();
      setCards(data.cards ?? []);
    } catch (err: any) {
      console.error("[useVocabulary] fetch error:", err);
      setError(err?.message ?? "Failed to load vocabulary.");
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchCards();
  }, [fetchCards]);

  async function addCard(payload: {
    bookId: string;
    word: string;
    ipa?: string;
    meaning: string;
    example: string;
    pageNumber: number;
  }) {
    if (!user) throw new Error("Not authenticated");
    const headers = await authHeaders(user);
    const res = await fetch("/api/vocabulary", {
      method: "POST",
      headers,
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body.error || `Failed to add word (${res.status})`);
    }
    const data = await res.json();
    setCards((prev) => [data.card, ...prev]);
    return data.card;
  }

  async function deleteCard(id: string) {
    if (!user) throw new Error("Not authenticated");
    const headers = await authHeaders(user);
    const res = await fetch("/api/vocabulary", {
      method: "DELETE",
      headers,
      body: JSON.stringify({ id }),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body.error || `Failed to delete word (${res.status})`);
    }
    setCards((prev) => prev.filter((c) => c.id !== id));
  }

  return { cards, loading, error, addCard, deleteCard, refetch: fetchCards };
}
