// Types generated from Prisma schema
// Run `npx prisma generate` to update Prisma Client

export type BookStatus = 'READING' | 'FINISHED' | 'WANT_TO_READ';

export interface Book {
  id: string;
  userId: string;
  title: string;
  author: string;
  currentPage: number;
  totalPages: number;
  dueDate?: Date | null;
  coverImageUrl?: string | null;
  status: BookStatus;
  createdAt: Date;
  updatedAt: Date;
}

export interface VocabularyCard {
  id: string;
  userId: string;
  bookId: string;
  word: string;
  ipa?: string | null;
  meaning: string;
  example: string;
  pageNumber: number;
  nextReviewDate: Date;
  reviewCount: number;
  easeFactor: number;
  interval: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Quote {
  id: string;
  userId: string;
  bookId: string;
  text: string;
  pageNumber: number;
  createdAt: Date;
}

export interface ReadingSession {
  id: string;
  userId: string;
  bookId: string;
  pagesRead: number;
  wordsAdded: number;
  quotesAdded: number;
  date: Date;
}

export interface UserStats {
  id: string;
  userId: string;
  currentStreak: number;
  longestStreak: number;
  totalBooksRead: number;
  totalPagesRead: number;
  totalWordsLearned: number;
  totalQuotesCollected: number;
  lastReadDate?: Date | null;
  streakFreezes: number;
  createdAt: Date;
  updatedAt: Date;
}

// Extended types with relations
export interface BookWithStats extends Book {
  _count?: {
    vocabularyCards: number;
    quotes: number;
  };
}

export interface DashboardData {
  userName: string;
  stats: UserStats;
  todayCards: VocabularyCard[];
  currentlyReading: BookWithStats[];
  recentQuotes: (Quote & { book: Book })[];
  weekActivity: { day: string; count: number }[];
}

