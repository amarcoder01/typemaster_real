#!/usr/bin/env tsx
/**
 * Download One Book Script
 * Downloads and processes a single book from Project Gutenberg (via Gutendex API)
 * 
 * Target Book: Pride and Prejudice by Jane Austen (ID: 1342)
 * - Well-structured chapters
 * - Clean prose without tables/diagrams
 * - Popular classic for typing practice
 * - Good mix of dialogue and narration
 */

import 'dotenv/config';

const BOOK_ID = 1342; // Pride and Prejudice

async function downloadOneBook() {
  console.log('📚 Single Book Download Script\n');
  console.log(`Target: Pride and Prejudice (Gutenberg ID: ${BOOK_ID})\n`);
  
  // Import modules
  const { fetchBookById, processBook, getBookMetadata } = await import('../book-fetcher.js');
  const { db } = await import('../storage.js');
  const { books, bookParagraphs } = await import('@shared/schema');
  const { eq } = await import('drizzle-orm');
  
  try {
    // Step 1: Check if book already exists
    console.log('1️⃣  Checking if book already exists...');
    const existingBook = await db.select().from(books).where(eq(books.id, BOOK_ID)).limit(1);
    
    if (existingBook.length > 0) {
      console.log(`   ⚠️  Book "${existingBook[0].title}" already exists in database`);
      console.log(`   ℹ️  Run delete-books.ts first if you want to re-download`);
      process.exit(0);
    }
    console.log('   ✓ Book not in database, proceeding...\n');
    
    // Step 2: Fetch book metadata from Gutendex
    console.log('2️⃣  Fetching book from Gutendex API...');
    const gutendexBook = await fetchBookById(BOOK_ID);
    
    if (!gutendexBook) {
      console.error(`   ❌ Could not fetch book ID ${BOOK_ID} from Gutendex`);
      process.exit(1);
    }
    
    console.log(`   ✓ Found: "${gutendexBook.title}"`);
    console.log(`   Author: ${gutendexBook.authors.map(a => a.name).join(', ')}`);
    console.log(`   Subjects: ${gutendexBook.subjects.slice(0, 3).join(', ')}\n`);
    
    // Step 3: Process the book (download text, clean, split paragraphs)
    console.log('3️⃣  Processing book content...');
    console.log('   - Downloading full text...');
    console.log('   - Cleaning Gutenberg headers/footers...');
    console.log('   - Detecting chapters...');
    console.log('   - Splitting into paragraphs (target: 120-280 words)...');
    console.log('   - Calculating difficulty levels...');
    
    const paragraphs = await processBook(gutendexBook);
    
    if (paragraphs.length === 0) {
      console.error('   ❌ No paragraphs extracted from book');
      process.exit(1);
    }
    
    // Calculate stats
    const chapters = new Set(paragraphs.map(p => p.chapter).filter(c => c !== undefined));
    const difficulties = { easy: 0, medium: 0, hard: 0 };
    let totalWords = 0;
    
    paragraphs.forEach(p => {
      difficulties[p.difficulty]++;
      totalWords += p.lengthWords;
    });
    
    console.log(`\n   ✓ Extracted ${paragraphs.length} paragraphs`);
    console.log(`   ✓ Detected ${chapters.size} chapters`);
    console.log(`   ✓ Total words: ${totalWords.toLocaleString()}`);
    console.log(`   ✓ Difficulty distribution:`);
    console.log(`      - Easy: ${difficulties.easy} (${Math.round(difficulties.easy / paragraphs.length * 100)}%)`);
    console.log(`      - Medium: ${difficulties.medium} (${Math.round(difficulties.medium / paragraphs.length * 100)}%)`);
    console.log(`      - Hard: ${difficulties.hard} (${Math.round(difficulties.hard / paragraphs.length * 100)}%)\n`);
    
    // Step 4: Generate book metadata
    console.log('4️⃣  Generating book metadata...');
    const bookMetadata = getBookMetadata(gutendexBook, paragraphs);
    
    console.log(`   ✓ Slug: ${bookMetadata.slug}`);
    console.log(`   ✓ Topic: ${bookMetadata.topic}`);
    console.log(`   ✓ Overall difficulty: ${bookMetadata.difficulty}`);
    console.log(`   ✓ Cover image: ${bookMetadata.coverImageUrl ? 'Available' : 'None'}\n`);
    
    // Step 5: Insert book into database
    console.log('5️⃣  Inserting book into database...');
    await db.insert(books).values(bookMetadata);
    console.log('   ✓ Book record created\n');
    
    // Step 6: Insert paragraphs into database
    console.log('6️⃣  Inserting paragraphs into database...');
    
    // Prepare paragraph data for insertion
    const paragraphsToInsert = paragraphs.map(p => ({
      text: p.text,
      difficulty: p.difficulty,
      topic: p.topic,
      durationMode: p.durationMode,
      lengthWords: p.lengthWords,
      source: p.source,
      bookId: p.bookId,
      paragraphIndex: p.paragraphIndex,
      chapter: p.chapter || null,
      sectionIndex: p.sectionIndex || null,
      chapterTitle: p.chapterTitle || null,
      language: p.language,
    }));
    
    // Insert in batches of 100 for better performance
    const BATCH_SIZE = 100;
    for (let i = 0; i < paragraphsToInsert.length; i += BATCH_SIZE) {
      const batch = paragraphsToInsert.slice(i, i + BATCH_SIZE);
      await db.insert(bookParagraphs).values(batch);
      console.log(`   ✓ Inserted paragraphs ${i + 1}-${Math.min(i + BATCH_SIZE, paragraphsToInsert.length)}`);
    }
    
    console.log('\n✅ Book downloaded and processed successfully!\n');
    console.log('Summary:');
    console.log('─'.repeat(50));
    console.log(`Book:       ${bookMetadata.title}`);
    console.log(`Author:     ${bookMetadata.author}`);
    console.log(`Chapters:   ${bookMetadata.totalChapters}`);
    console.log(`Paragraphs: ${bookMetadata.totalParagraphs}`);
    console.log(`Words:      ${totalWords.toLocaleString()}`);
    console.log(`Topic:      ${bookMetadata.topic}`);
    console.log(`Difficulty: ${bookMetadata.difficulty}`);
    console.log('─'.repeat(50));
    
  } catch (error) {
    console.error('\n❌ Error downloading book:', error);
    process.exit(1);
  }
}

downloadOneBook();

