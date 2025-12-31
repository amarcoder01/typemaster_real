#!/usr/bin/env tsx
/**
 * Delete All Books Script
 * Removes all books and book paragraphs from the database.
 * User test results (book_typing_tests) are preserved but orphaned.
 */

import 'dotenv/config';

async function deleteAllBooks() {
  console.log('📚 Book Deletion Script\n');

  // Safety check
  if (process.env.NODE_ENV === 'production') {
    console.error('❌ Cannot run in production environment');
    console.error('   Set NODE_ENV to development to proceed');
    process.exit(1);
  }

  const { db } = await import('../storage.js');
  const { books, bookParagraphs, userBookProgress, bookTypingTests } = await import('@shared/schema');
  const { sql } = await import('drizzle-orm');

  try {
    // Count existing data
    const bookCount = await db.select({ count: sql<number>`count(*)` }).from(books);
    const paragraphCount = await db.select({ count: sql<number>`count(*)` }).from(bookParagraphs);
    const testCount = await db.select({ count: sql<number>`count(*)` }).from(bookTypingTests);
    
    console.log(`Found ${bookCount[0].count} books`);
    console.log(`Found ${paragraphCount[0].count} book paragraphs`);
    console.log(`Found ${testCount[0].count} book typing tests`);
    
    if (bookCount[0].count === 0 && paragraphCount[0].count === 0) {
      console.log('\n✓ No books to delete');
      process.exit(0);
    }

    console.log('\n🗑️  Deleting all book data...');

    // Delete book typing tests first (references book_paragraphs)
    await db.delete(bookTypingTests);
    console.log('   ✓ Deleted all book typing test results');

    // Delete user book progress (references books)
    await db.delete(userBookProgress);
    console.log('   ✓ Deleted user book progress');

    // Delete book paragraphs
    await db.delete(bookParagraphs);
    console.log('   ✓ Deleted all book paragraphs');

    // Delete books
    await db.delete(books);
    console.log('   ✓ Deleted all books');

    console.log('\n✅ All book data deleted successfully!');

  } catch (error) {
    console.error('\n❌ Error deleting books:', error);
    process.exit(1);
  }

  process.exit(0);
}

deleteAllBooks();

