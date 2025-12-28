#!/usr/bin/env tsx
/**
 * Leaderboard Seed CLI
 * Command-line interface for seeding leaderboard data
 */

import 'dotenv/config';
import { Command } from 'commander';
import { SEED_CONFIG } from './config';
import { createSeedUsers, toInsertUser } from './factories/user-factory';
import { generateStandardResults, getResultStats } from './generators/standard-generator';
import { generateCodeResults } from './generators/code-generator';
import { generateStressResults } from './generators/stress-generator';
import { generateDictationResults } from './generators/dictation-generator';
import { generateRatings } from './generators/rating-generator';
import { generateBookResults } from './generators/book-generator';

const program = new Command();

program
  .name('seed-leaderboards')
  .description('Seed leaderboard data with realistic fake users')
  .version('1.0.0');

/**
 * Seed command
 */
program
  .command('seed')
  .description('Seed leaderboard data')
  .option('-m, --mode <mode>', 'Specific mode to seed (standard, code, etc.)', 'standard')
  .option('-c, --count <number>', 'Number of users per mode', '150')
  .option('--all', 'Seed all modes at once', false)
  .option('--clean', 'Clean existing test data before seeding', false)
  .option('--dry-run', 'Show what would be created without actually creating it', false)
  .action(async (options) => {
    try {
      console.log('🌱 Leaderboard Seed Tool\n');
      
      // Safety check
      if (process.env.NODE_ENV === 'production' && !SEED_CONFIG.safety.allowProduction) {
        console.error('❌ Cannot run in production environment');
        console.error('   Set allowProduction: true in config if you really want this');
        process.exit(1);
      }

      const userCount = parseInt(options.count);
      if (isNaN(userCount) || userCount < 1 || userCount > 500) {
        console.error('❌ Invalid user count. Must be between 1 and 500');
        process.exit(1);
      }

      // Clean existing data if requested
      if (options.clean) {
        console.log('🧹 Cleaning existing test data...');
        if (!options.dryRun) {
          await cleanTestData();
        }
        console.log('✓ Cleaned existing test data\n');
      }

      if (options.dryRun) {
        console.log('🔍 DRY RUN MODE - No data will be created\n');
      }

      if (options.all) {
        await seedAllModes(userCount, options.dryRun);
      } else {
        // Seed based on mode
        switch (options.mode) {
          case 'standard':
            await seedStandardMode(userCount, options.dryRun);
            break;
          case 'code':
            await seedCodeMode(userCount, options.dryRun);
            break;
          case 'stress':
            await seedStressMode(userCount, options.dryRun);
            break;
          case 'dictation':
            await seedDictationMode(userCount, options.dryRun);
            break;
          case 'rating':
            await seedRatingMode(userCount, options.dryRun);
            break;
          case 'book':
            await seedBookMode(userCount, options.dryRun);
            break;
          default:
            console.error(`❌ Unknown mode "${options.mode}"`);
            console.error('   Available modes: standard, code, stress, dictation, rating, book, --all');
            process.exit(1);
        }
      }

      console.log('\n✅ Seeding complete!');
      process.exit(0);
      
    } catch (error) {
      console.error('\n❌ Seeding failed:', error);
      process.exit(1);
    }
  });

/**
 * Clean command
 */
program
  .command('clean')
  .description('Remove all test data')
  .option('--force', 'Skip confirmation prompt', false)
  .action(async (options) => {
    try {
      console.log('🧹 Clean Test Data\n');

      if (!options.force) {
        console.log('⚠️  This will delete all users and results marked as test data');
        console.log('   Use --force to skip this confirmation\n');
        console.log('Run: npm run seed:clean -- --force');
        process.exit(0);
      }

      console.log('Removing test data...');
      const stats = await cleanTestData();
      
      console.log(`\n✓ Cleaned ${stats.users} users and ${stats.results} test results`);
      process.exit(0);
      
    } catch (error) {
      console.error('\n❌ Cleanup failed:', error);
      process.exit(1);
    }
  });

/**
 * Stats command
 */
program
  .command('stats')
  .description('Show current seed data statistics')
  .action(async () => {
    try {
      console.log('📊 Seed Data Statistics\n');
      
      const stats = await getTestDataStats();
      
      console.log(`Test Users: ${stats.userCount}`);
      console.log(`Test Results: ${stats.resultCount}`);
      console.log(`Avg Tests per User: ${stats.avgTestsPerUser}`);
      
      if (stats.userCount > 0) {
        console.log('\nSample usernames:');
        stats.sampleUsernames.forEach((name, i) => {
          console.log(`  ${i + 1}. ${name}`);
        });
      }
      
      process.exit(0);
      
    } catch (error) {
      console.error('\n❌ Failed to get stats:', error);
      process.exit(1);
    }
  });

/**
 * Seed standard mode
 */
async function seedStandardMode(userCount: number, dryRun: boolean) {
  console.log(`📝 Seeding Standard Mode (${userCount} users)\n`);
  
  // Generate users
  console.log('1. Generating users...');
  const seedUsers = createSeedUsers(userCount);
  console.log(`   ✓ Generated ${seedUsers.length} users`);
  
  // Show sample usernames
  console.log('\n   Sample usernames:');
  seedUsers.slice(0, 10).forEach((user, i) => {
    console.log(`   ${i + 1}. ${user.username}`);
  });
  
  // Generate test results
  console.log('\n2. Generating test results...');
  const results = generateStandardResults(seedUsers);
  const stats = getResultStats(results);
  
  console.log(`   ✓ Generated ${stats.count} test results`);
  console.log(`   📈 WPM range: ${stats.minWpm} - ${stats.maxWpm} (avg: ${stats.avgWpm})`);
  console.log(`   🎯 Avg accuracy: ${stats.avgAccuracy}%`);
  
  if (dryRun) {
    console.log('\n✓ Dry run complete - no data saved');
    return;
  }
  
  // Import database modules only when needed
  const { db } = await import('../storage.js');
  const { users, testResults } = await import('@shared/schema');
  
  // Insert into database
  console.log('\n3. Inserting into database...');
  
  // Insert users in batches
  console.log('   Inserting users...');
  const insertUsers = seedUsers.map(toInsertUser);
  const batchSize = 50;
  
  for (let i = 0; i < insertUsers.length; i += batchSize) {
    const batch = insertUsers.slice(i, i + batchSize);
    await db.insert(users).values(batch);
    console.log(`   - Inserted users ${i + 1}-${Math.min(i + batchSize, insertUsers.length)}`);
  }
  
  // Insert test results in batches
  console.log('   Inserting test results...');
  for (let i = 0; i < results.length; i += batchSize) {
    const batch = results.slice(i, i + batchSize);
    await db.insert(testResults).values(batch);
    console.log(`   - Inserted results ${i + 1}-${Math.min(i + batchSize, results.length)}`);
  }
  
  console.log('   ✓ All data inserted successfully');
}

/**
 * Seed code practice mode
 */
async function seedCodeMode(userCount: number, dryRun: boolean) {
  console.log(`💻 Seeding Code Practice Mode (${userCount} users)\n`);
  
  const seedUsers = createSeedUsers(userCount);
  console.log(`   ✓ Generated ${seedUsers.length} users`);
  
  const results = generateCodeResults(seedUsers);
  console.log(`   ✓ Generated ${results.length} code practice results\n`);
  
  if (dryRun) {
    console.log('✓ Dry run complete - no data saved');
    return;
  }
  
  const { db } = await import('../storage.js');
  const { users, codeTypingTests } = await import('@shared/schema');
  
  console.log('Inserting into database...');
  const insertUsers = seedUsers.map(toInsertUser);
  const batchSize = 50;
  
  for (let i = 0; i < insertUsers.length; i += batchSize) {
    const batch = insertUsers.slice(i, i + batchSize);
    await db.insert(users).values(batch);
  }
  
  for (let i = 0; i < results.length; i += batchSize) {
    const batch = results.slice(i, i + batchSize);
    await db.insert(codeTypingTests).values(batch);
  }
  
  console.log('   ✓ All data inserted successfully');
}

/**
 * Seed speed challenge mode
 */
async function seedStressMode(userCount: number, dryRun: boolean) {
  console.log(`⚡ Seeding Speed Challenge Mode (${userCount} users)\n`);
  
  const seedUsers = createSeedUsers(userCount);
  console.log(`   ✓ Generated ${seedUsers.length} users`);
  
  const results = generateStressResults(seedUsers);
  console.log(`   ✓ Generated ${results.length} speed challenge results\n`);
  
  if (dryRun) {
    console.log('✓ Dry run complete - no data saved');
    return;
  }
  
  const { db } = await import('../storage.js');
  const { users, stressTests } = await import('@shared/schema');
  
  console.log('Inserting into database...');
  const insertUsers = seedUsers.map(toInsertUser);
  const batchSize = 50;
  
  for (let i = 0; i < insertUsers.length; i += batchSize) {
    const batch = insertUsers.slice(i, i + batchSize);
    await db.insert(users).values(batch);
  }
  
  for (let i = 0; i < results.length; i += batchSize) {
    const batch = results.slice(i, i + batchSize);
    await db.insert(stressTests).values(batch);
  }
  
  console.log('   ✓ All data inserted successfully');
}

/**
 * Seed dictation mode
 */
async function seedDictationMode(userCount: number, dryRun: boolean) {
  console.log(`🎤 Seeding Dictation Mode (${userCount} users)\n`);
  
  const seedUsers = createSeedUsers(userCount);
  console.log(`   ✓ Generated ${seedUsers.length} users`);
  
  const results = generateDictationResults(seedUsers);
  console.log(`   ✓ Generated ${results.length} dictation results\n`);
  
  if (dryRun) {
    console.log('✓ Dry run complete - no data saved');
    return;
  }
  
  const { db } = await import('../storage.js');
  const { users, dictationTests } = await import('@shared/schema');
  
  console.log('Inserting into database...');
  const insertUsers = seedUsers.map(toInsertUser);
  const batchSize = 50;
  
  for (let i = 0; i < insertUsers.length; i += batchSize) {
    const batch = insertUsers.slice(i, i + batchSize);
    await db.insert(users).values(batch);
  }
  
  for (let i = 0; i < results.length; i += batchSize) {
    const batch = results.slice(i, i + batchSize);
    await db.insert(dictationTests).values(batch);
  }
  
  console.log('   ✓ All data inserted successfully');
}

/**
 * Seed competitive racing mode
 */
async function seedRatingMode(userCount: number, dryRun: boolean) {
  console.log(`🏆 Seeding Competitive Racing Mode (${userCount} users)\n`);
  
  const seedUsers = createSeedUsers(userCount);
  console.log(`   ✓ Generated ${seedUsers.length} users`);
  
  const ratings = generateRatings(seedUsers);
  console.log(`   ✓ Generated ${ratings.length} ratings\n`);
  
  if (dryRun) {
    console.log('✓ Dry run complete - no data saved');
    return;
  }
  
  const { db } = await import('../storage.js');
  const { users, userRatings } = await import('@shared/schema');
  
  console.log('Inserting into database...');
  const insertUsers = seedUsers.map(toInsertUser);
  const batchSize = 50;
  
  for (let i = 0; i < insertUsers.length; i += batchSize) {
    const batch = insertUsers.slice(i, i + batchSize);
    await db.insert(users).values(batch);
  }
  
  for (let i = 0; i < ratings.length; i += batchSize) {
    const batch = ratings.slice(i, i + batchSize);
    await db.insert(userRatings).values(batch);
  }
  
  console.log('   ✓ All data inserted successfully');
}

/**
 * Seed book library mode
 */
async function seedBookMode(userCount: number, dryRun: boolean) {
  console.log(`📚 Seeding Book Library Mode (${userCount} users)\n`);
  
  const seedUsers = createSeedUsers(userCount);
  console.log(`   ✓ Generated ${seedUsers.length} users`);
  
  const results = generateBookResults(seedUsers);
  console.log(`   ✓ Generated ${results.length} book typing results\n`);
  
  if (dryRun) {
    console.log('✓ Dry run complete - no data saved');
    return;
  }
  
  const { db } = await import('../storage.js');
  const { users, bookTypingTests, bookParagraphs, books } = await import('@shared/schema');
  const { sql } = await import('drizzle-orm');
  
  console.log('Inserting into database...');
  
  // Check if we have any book paragraphs, if not create some dummy ones
  const existingParagraphs = await db.select({ id: bookParagraphs.id }).from(bookParagraphs).limit(100);
  
  let validParagraphIds: number[] = [];
  
  if (existingParagraphs.length < 100) {
    console.log('   Creating dummy book paragraphs for testing...');
    
    // Create a dummy book first
    const dummyBooks = await db.select().from(books).limit(1);
    let bookId = dummyBooks[0]?.id;
    
    if (!bookId) {
      const [newBook] = await db.insert(books).values({
        id: 99999, // Use a high ID to avoid conflicts
        title: 'Test Book for Seeding',
        author: 'Seed Generator',
        slug: 'test-book-seeding',
        description: 'Dummy book created for test data seeding',
        coverImageUrl: null,
        totalChapters: 1,
        totalParagraphs: 100,
        difficulty: 'medium',
        topic: 'testing',
        language: 'en',
        estimatedDurationMap: null
      }).returning();
      bookId = newBook.id;
    }
    
    // Create 100 dummy paragraphs
    const dummyParagraphs = [];
    for (let i = 0; i < 100; i++) {
      dummyParagraphs.push({
        text: `This is a test paragraph ${i + 1} for seeding purposes. It contains enough text to be used for typing practice and testing the book mode leaderboard functionality. The quick brown fox jumps over the lazy dog.`,
        bookId,
        chapter: 1,
        paragraphIndex: i,
        difficulty: 'medium',
        topic: 'testing',
        durationMode: 60,
        lengthWords: 30,
        source: 'Test Book for Seeding by Seed Generator',
        language: 'en',
        sectionIndex: i,
        chapterTitle: 'Test Chapter',
        metadata: null
      });
    }
    
    const createdParagraphs = await db.insert(bookParagraphs).values(dummyParagraphs).returning({ id: bookParagraphs.id });
    validParagraphIds = createdParagraphs.map(p => p.id);
    console.log('   ✓ Created 100 dummy book paragraphs');
  } else {
    validParagraphIds = existingParagraphs.map(p => p.id);
  }
  
  // Update results to use valid paragraph IDs
  results.forEach(result => {
    result.paragraphId = validParagraphIds[Math.floor(Math.random() * validParagraphIds.length)];
  });
  
  const insertUsers = seedUsers.map(toInsertUser);
  const batchSize = 50;
  
  for (let i = 0; i < insertUsers.length; i += batchSize) {
    const batch = insertUsers.slice(i, i + batchSize);
    await db.insert(users).values(batch);
  }
  
  for (let i = 0; i < results.length; i += batchSize) {
    const batch = results.slice(i, i + batchSize);
    await db.insert(bookTypingTests).values(batch);
  }
  
  console.log('   ✓ All data inserted successfully');
}

/**
 * Seed all modes at once
 */
async function seedAllModes(userCount: number, dryRun: boolean) {
  console.log(`🌟 Seeding ALL Modes (${userCount} users per mode)\n`);
  
  await seedStandardMode(userCount, dryRun);
  console.log('');
  
  await seedCodeMode(userCount, dryRun);
  console.log('');
  
  await seedStressMode(userCount, dryRun);
  console.log('');
  
  await seedDictationMode(userCount, dryRun);
  console.log('');
  
  await seedRatingMode(userCount, dryRun);
  console.log('');
  
  await seedBookMode(userCount, dryRun);
}

/**
 * Clean all test data
 */
async function cleanTestData() {
  const { db } = await import('../storage.js');
  const { users, testResults } = await import('@shared/schema');
  const { eq } = await import('drizzle-orm');
  
  // Get test user IDs
  const testUsers = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.isTestData, true));
  
  const testUserIds = testUsers.map(u => u.id);
  
  // Delete test results
  let resultCount = 0;
  if (testUserIds.length > 0) {
    // Delete all test results for all test users
    for (const userId of testUserIds) {
      await db
        .delete(testResults)
        .where(eq(testResults.userId, userId));
      resultCount++;
    }
  }
  
  // Delete test users
  await db
    .delete(users)
    .where(eq(users.isTestData, true));
  
  return {
    users: testUsers.length,
    results: resultCount
  };
}

/**
 * Get statistics about test data
 */
async function getTestDataStats() {
  const { db } = await import('../storage.js');
  const { users, testResults } = await import('@shared/schema');
  const { eq } = await import('drizzle-orm');
  
  const testUsers = await db
    .select()
    .from(users)
    .where(eq(users.isTestData, true))
    .limit(10);
  
  const allTestUsers = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.isTestData, true));
  
  let resultCount = 0;
  for (const user of allTestUsers) {
    const results = await db
      .select()
      .from(testResults)
      .where(eq(testResults.userId, user.id));
    resultCount += results.length;
  }
  
  return {
    userCount: allTestUsers.length,
    resultCount,
    avgTestsPerUser: allTestUsers.length > 0 
      ? Math.round(resultCount / allTestUsers.length) 
      : 0,
    sampleUsernames: testUsers.map(u => u.username)
  };
}

// Parse command line arguments
program.parse();

