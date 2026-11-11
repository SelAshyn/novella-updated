# Novella — Reading Notebook That Remembers For You

<p align="center">
  <img src="https://novella-library.vercel.app/logo.png" alt="Novella Logo" width="80" onerror="this.style.display='none'" />
</p>

<p align="center">
  <strong>Mark a word or save a passage while you read. Novella automatically crafts review cards and resurfaces them right before your memory fades.</strong>
</p>

<p align="center">
  <a href="https://novella-library.vercel.app">novella-library.vercel.app</a>
</p>

---

## ✨ Features

- 📚 **Personal Book Library**: Track physical books, Kindle reads, and PDFs with custom covers, progress bars, and due dates.
- 🧠 **Spaced Repetition Review (SM-2 Algorithm)**: Smart review cards resurface vocabulary and insights at mathematically optimal intervals (3 minutes of daily review).
- 📖 **Vocabulary Capture**: Instant dictionary definitions, phonetic transcriptions (IPA), and contextual example sentences.
- 💬 **Quotes & Passage Highlights**: Save meaningful passages tied to exact book page numbers.
- ⏱️ **Reading Sessions & Streaks**: Log reading minutes and pages, maintain reading streaks, and visualize reading habits.
- 🏫 **Novella for Schools & Classes**: Classroom management for educators to assign reading, track student progress, and view reading reports.
- 🤖 **Ask Novella**: AI-assisted companion to discuss passages, unpack complex ideas, and look up concepts.
- 🌓 **Dark & Light Mode**: Seamless theme switching with persistent user preference.
- 🛡️ **Enterprise Security & Anti-Bot**: Protected by Cloudflare Turnstile, Upstash Redis rate limiting, and secure HTTP headers.

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| **Framework** | [Next.js 16](https://nextjs.org/) (App Router) + [React 19](https://react.dev/) |
| **Language** | [TypeScript](https://www.typescriptlang.org/) |
| **Styling** | [Tailwind CSS v4](https://tailwindcss.com/) + [Motion](https://motion.dev/) |
| **UI Components** | [shadcn/ui](https://ui.shadcn.com/) + [React Aria Components](https://react-spectrum.adobe.com/react-aria/) + [Lucide Icons](https://lucide.dev/) |
| **Database** | [PostgreSQL (Neon Serverless)](https://neon.tech/) with [Prisma ORM](https://www.prisma.io/) |
| **Authentication** | [Firebase Authentication](https://firebase.google.com/) (Google OAuth & Email OTP) + [Firebase Admin SDK](https://firebase.google.com/docs/admin/setup) |
| **Rate Limiting & Cache** | [Upstash Redis](https://upstash.com/) (`@upstash/ratelimit`) |
| **Analytics** | [PostHog](https://posthog.com/) + [Vercel Analytics](https://vercel.com/analytics) |
| **Error Monitoring** | [Sentry](https://sentry.io/) (`@sentry/nextjs`) |
| **Media / Storage** | [Cloudinary](https://cloudinary.com/) |
| **Bot Protection** | [Cloudflare Turnstile](https://www.cloudflare.com/products/turnstile/) |
| **Deployment** | [Vercel](https://vercel.com/) |

---

## 🚀 Getting Started

### Prerequisites

Ensure you have the following installed:
- [Node.js](https://nodejs.org/) (v20+ recommended)
- `npm`, `pnpm`, or `yarn`
- PostgreSQL database (e.g. Neon, Supabase, or local Postgres)
- Firebase project for Authentication

### 1. Clone the repository

```bash
git clone https://github.com/SelAshyn/novella-updated.git
cd novella-updated
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

Copy `.env.example` to `.env.local`:

```bash
cp .env.example .env.local
```

Fill in your configuration keys:

```env
# Database (Neon PostgreSQL)
DATABASE_URL="postgresql://user:password@endpoint-pooler.neon.tech/novella?sslmode=require"
DATABASE_URL_UNPOOLED="postgresql://user:password@endpoint.neon.tech/novella?sslmode=require"

# Firebase Client
NEXT_PUBLIC_FIREBASE_API_KEY=""
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=""
NEXT_PUBLIC_FIREBASE_PROJECT_ID=""
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=""
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=""
NEXT_PUBLIC_FIREBASE_APP_ID=""

# Firebase Admin SDK (Server)
FIREBASE_PROJECT_ID=""
FIREBASE_CLIENT_EMAIL=""
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"

# Upstash Redis (Rate limiting)
UPSTASH_REDIS_REST_URL=""
UPSTASH_REDIS_REST_TOKEN=""

# Cloudflare Turnstile
NEXT_PUBLIC_TURNSTILE_SITE_KEY=""
TURNSTILE_SECRET_KEY=""

# PostHog (Product Analytics)
NEXT_PUBLIC_POSTHOG_KEY="phc_..."
NEXT_PUBLIC_POSTHOG_HOST="https://us.i.posthog.com"

# Sentry
NEXT_PUBLIC_SENTRY_DSN=""
SENTRY_AUTH_TOKEN=""
SENTRY_ORG=""
SENTRY_PROJECT=""

# Email (SMTP for OTP delivery)
GMAIL_USER=""
GMAIL_APP_PASSWORD=""
```

### 4. Initialize database

Push the Prisma schema to your database and generate the Prisma Client:

```bash
npm run db:generate
npm run db:push
```

### 5. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 📜 Available Scripts

| Command | Description |
|---|---|
| `npm run dev` | Starts Next.js development server |
| `npm run build` | Generates Prisma client and creates production build |
| `npm run start` | Runs the production build locally |
| `npm run typecheck` | Validates TypeScript types across the project |
| `npm run lint` | Runs ESLint check |
| `npm run format` | Formats code with Prettier and Tailwind plugin |
| `npm run db:push` | Syncs schema with database directly |
| `npm run db:migrate` | Runs database migrations |
| `npm run db:studio` | Opens Prisma Studio GUI to inspect database records |

---

## 📂 Project Structure

```text
├── app/
│   ├── (public)/          # Landing, terms, privacy, cookie policy
│   ├── api/               # API routes (auth, books, review, vocabulary, reports)
│   ├── auth/              # Sign in, register, OTP verification
│   ├── dashboard/         # Authenticated app
│   │   ├── ask/           # Ask Novella reading assistant
│   │   ├── class/         # Classroom & school management
│   │   ├── library/       # Personal book tracking & reader
│   │   ├── report/        # Reading insights & analytics
│   │   ├── review/        # Spaced repetition flashcards
│   │   ├── settings/      # User profile & preferences
│   │   └── vocabulary/    # Saved words, IPA, and definitions
│   ├── globals.css        # Tailwind CSS styles & animations
│   └── layout.tsx         # Root layout with providers & analytics
├── components/
│   ├── landing/           # Landing page sections, hero, navbar, loop
│   └── ui/                # Reusable UI primitives (buttons, modals, dialogs)
├── lib/
│   ├── firebase.ts        # Firebase client initialization
│   ├── firebase-admin.ts  # Firebase Admin SDK server auth
│   ├── prisma.ts          # Prisma client with Neon serverless adapter
│   ├── redis.ts           # Upstash Redis & rate limit helpers
│   └── sm2.ts             # SuperMemo SM-2 spaced repetition implementation
├── prisma/
│   └── schema.prisma      # Database schema (User, Book, Card, Session, Class)
└── instrumentation.ts     # OpenTelemetry & Sentry server hooks
```

---

## 🚢 Deployment

Novella is optimized for deployment on [Vercel](https://vercel.com):

1. Connect your repository to Vercel.
2. Add all environment variables from `.env.local` to **Project Settings → Environment Variables**.
   - *Note*: Ensure `FIREBASE_PRIVATE_KEY` preserves newline formatting (`\n`).
3. Set the build command to `npm run build`.
4. Deploy!

---

## 📄 License

This project is private and proprietary. All rights reserved.
