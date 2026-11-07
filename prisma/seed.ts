import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Create a test user (replace with your Firebase UID)
  const testFirebaseUid = 'test-user-123';
  const testEmail = 'test@example.com';

  // Check if user exists
  let user = await prisma.user.findUnique({
    where: { firebaseUid: testFirebaseUid },
  });

  if (!user) {
    // Create user with stats
    user = await prisma.user.create({
      data: {
        firebaseUid: testFirebaseUid,
        email: testEmail,
        displayName: 'Test User',
        stats: {
          create: {
            currentStreak: 12,
            longestStreak: 15,
            totalBooksRead: 3,
            totalPagesRead: 1420,
            totalWordsLearned: 89,
            totalQuotesCollected: 24,
            lastReadDate: new Date(),
            streakFreezes: 1,
          },
        },
      },
    });
    console.log('✅ Created test user:', user.email);
  } else {
    console.log('✅ User already exists:', user.email);
  }

  // Create some books
  const book1 = await prisma.book.upsert({
    where: { id: 'book-1' },
    update: {},
    create: {
      id: 'book-1',
      userId: user.id,
      title: 'Pride and Prejudice',
      author: 'Jane Austen',
      currentPage: 142,
      totalPages: 432,
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
      status: 'READING',
    },
  });

  const book2 = await prisma.book.upsert({
    where: { id: 'book-2' },
    update: {},
    create: {
      id: 'book-2',
      userId: user.id,
      title: 'Thinking, Fast and Slow',
      author: 'Daniel Kahneman',
      currentPage: 211,
      totalPages: 499,
      status: 'READING',
    },
  });

  console.log('✅ Created books');

  // Create vocabulary cards
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const vocabCards = [
    {
      userId: user.id,
      bookId: book1.id,
      word: 'Obstinate',
      ipa: '/ˈɒbstɪnət/',
      meaning: 'Stubbornly refusing to change one\'s opinion.',
      example: 'She was obstinate in her refusal to dance with him.',
      pageNumber: 118,
      nextReviewDate: today,
      reviewCount: 3,
      easeFactor: 2.5,
      interval: 1,
    },
    {
      userId: user.id,
      bookId: book2.id,
      word: 'Heuristic',
      ipa: '/hjʊəˈrɪstɪk/',
      meaning: 'A mental shortcut that allows quick judgement.',
      example: 'The availability heuristic distorts our sense of risk.',
      pageNumber: 129,
      nextReviewDate: today,
      reviewCount: 2,
      easeFactor: 2.5,
      interval: 1,
    },
    {
      userId: user.id,
      bookId: book1.id,
      word: 'Impertinent',
      ipa: '/ɪmˈpɜːtɪnənt/',
      meaning: 'Not showing proper respect; rude.',
      example: 'Such an impertinent question deserved no answer.',
      pageNumber: 140,
      nextReviewDate: today,
      reviewCount: 1,
      easeFactor: 2.5,
      interval: 1,
    },
  ];

  for (const card of vocabCards) {
    await prisma.vocabularyCard.upsert({
      where: {
        id: `vocab-${card.word.toLowerCase()}`,
      },
      update: {},
      create: {
        id: `vocab-${card.word.toLowerCase()}`,
        ...card,
      },
    });
  }

  console.log('✅ Created vocabulary cards');

  // Create quotes
  const quotes = [
    {
      id: 'quote-1',
      userId: user.id,
      bookId: book2.id,
      text: 'Nothing is so alarming as the familiar made strange.',
      pageNumber: 203,
    },
    {
      id: 'quote-2',
      userId: user.id,
      bookId: book1.id,
      text: 'I could easily forgive his pride, if he had not mortified mine.',
      pageNumber: 21,
    },
  ];

  for (const quote of quotes) {
    await prisma.quote.upsert({
      where: { id: quote.id },
      update: {},
      create: quote,
    });
  }

  console.log('✅ Created quotes');

  // Create reading sessions for the past week
  for (let i = 0; i < 7; i++) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    date.setHours(20, 0, 0, 0);

    await prisma.readingSession.create({
      data: {
        userId: user.id,
        bookId: i % 2 === 0 ? book1.id : book2.id,
        pagesRead: Math.floor(Math.random() * 30) + 10,
        wordsAdded: Math.floor(Math.random() * 5),
        quotesAdded: Math.floor(Math.random() * 2),
        date,
      },
    });
  }

  console.log('✅ Created reading sessions');
  console.log('\n🎉 Database seeded successfully!');
  console.log(`\n📝 Test Firebase UID: ${testFirebaseUid}`);
  console.log('   Use this UID to test the dashboard API\n');
}

main()
  .catch((e) => {
    console.error('Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
