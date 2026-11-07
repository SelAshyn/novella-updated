"use client";

import { useCallback, useEffect, useState } from "react";
import { BookWithStats, BookStatus } from "@/lib/types";
import { useApi } from "@/hooks/useApi";
import { useAuth } from "@/components/landing/auth-provider";

export function useBooks() {
  const [books, setBooks] = useState<BookWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const { user } = useAuth();
  const api = useApi();

  const fetchBooks = useCallback(async () => {
    if (!user) return;
    try {
      setLoading(true);
      const data = await api.get("/api/books");
      setBooks(data.books);
      setError(null);
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchBooks();
  }, [fetchBooks]);

  async function addBook(payload: {
    title: string;
    author: string;
    totalPages: number;
    dueDate?: string;
    status?: BookStatus;
    coverImageUrl?: string;
  }) {
    const data = await api.post("/api/books", payload);
    setBooks((prev) => [data.book, ...prev]);
    return data.book;
  }

  async function updateBook(id: string, payload: Partial<BookWithStats>) {
    const data = await api.patch(`/api/books/${id}`, payload);
    setBooks((prev) => prev.map((b) => (b.id === id ? { ...b, ...data.book } : b)));
    return data.book;
  }

  async function deleteBook(id: string) {
    await api.del(`/api/books/${id}`);
    setBooks((prev) => prev.filter((b) => b.id !== id));
  }

  return { books, loading, error, addBook, updateBook, deleteBook, refetch: fetchBooks };
}
