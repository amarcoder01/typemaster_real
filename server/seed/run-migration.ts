#!/usr/bin/env tsx
/**
 * Run SQL migration to add is_test_data column
 */

import 'dotenv/config';
import { db } from '../storage.js';
import { sql } from 'drizzle-orm';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function runMigration() {
  try {
    console.log('🔧 Running migration: add is_test_data column\n');
    
    // Read the SQL file
    const sqlFile = join(__dirname, '../migrations/add-is-test-data.sql');
    const migrationSQL = readFileSync(sqlFile, 'utf-8');
    
    // Execute the migration
    await db.execute(sql.raw(migrationSQL));
    
    console.log('✅ Migration completed successfully!');
    console.log('   - Added is_test_data column to users table');
    console.log('   - Created index for test data queries');
    console.log('   - Added column comment\n');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

runMigration();

