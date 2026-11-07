# Novella Setup Guide

## Prerequisites

- Node.js 20+ installed
- PostgreSQL database (local or hosted)
- Firebase project for authentication

## Database Setup

### 1. Install Prisma (if not already installed)

```bash
npm install
```

### 2. Configure Database Connection

Create a `.env.local` file in the root directory:

```env
DATABASE_URL="postgresql://username:password@localhost:5432/novella?schema=public"

NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_auth_domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
```

Replace the DATABASE_URL with your actual PostgreSQL connection string.

### 3. Generate Prisma Client

```bash
npm run db:generate
```

### 4. Push Schema to Database

For development (creates tables without migrations):

```bash
npm run db:push
```

For production (creates migration files):

```bash
npm run db:migrate
```

### 5. (Optional) Open Prisma Studio

To view and edit your database visually:

```bash
npm run db:studio
```

## Database Schema

The app uses the following models:

- **User**: Stores user profile linked to Firebase UID
- **Book**: Books in the user's library
- **VocabularyCard**: Words saved with spaced repetition data
- **Quote**: Highlighted quotes from books
- **ReadingSession**: Track daily reading activity
- **UserStats**: Aggregated user statistics (streak, totals, etc.)

## Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Authentication & Security

All protected API routes require a valid Firebase ID Token passed in the standard `Authorization` header:

```http
Authorization: Bearer <firebase_id_token>
```

Never pass unverified client headers like `x-firebase-uid`. Tokens are verified server-side with the Firebase Admin SDK.

## Next Steps

1. Create additional API routes for:
   - Updating book progress
   - Adding/reviewing vocabulary cards
   - Adding quotes
   - Managing reading sessions

2. Build UI components for:
   - Adding new books
   - Vocabulary card review system
   - Quote collection interface
   - Reading session tracker

3. Implement spaced repetition algorithm for vocabulary reviews

4. Add search functionality

5. Create library page with book management

## Testing with Sample Data

To test the UI without a database, you can temporarily use the sample data from `lib/sample-data.ts`. The dashboard will show an error until you:

1. Set up the database
2. Create a user account via Firebase auth
3. Add some books and vocabulary

## Troubleshooting

### "Prisma Client not found"
Run `npm run db:generate`

### Database connection errors
- Check your DATABASE_URL in `.env.local`
- Ensure PostgreSQL is running
- Verify database credentials

### Firebase auth not working
- Check Firebase environment variables
- Ensure Firebase project is properly configured
- Verify auth domain matches your deployment URL
