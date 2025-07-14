#!/usr/bin/env tsx

/**
 * Add referrer_id column to users table
 * 
 * This script adds the missing referrer_id column that's expected by the database queries
 * but was missing from the schema.
 */

import { sql } from 'drizzle-orm';
import { config } from 'dotenv';
import chalk from 'chalk';
import { db } from '../server/db';

// Load environment variables
config();

async function runReferralMigration() {
  console.log(chalk.blue('🔄 Adding referrer_id column to users table...'));

  try {
    // Check if column already exists
    const checkResult = await db.execute(sql.raw(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'users' 
      AND column_name = 'referrer_id'
      AND table_schema = DATABASE()
    `));

    if (checkResult.length > 0) {
      console.log(chalk.yellow('⚠️  referrer_id column already exists'));
      return;
    }

    // Add the column
    const migrationSql = `
      ALTER TABLE users 
      ADD COLUMN referrer_id VARCHAR(255) NULL 
      COMMENT 'ID of the user who referred this user'
    `;

    await db.execute(sql.raw(migrationSql));
    
    console.log(chalk.green('✅ Successfully added referrer_id column to users table'));
    
    // Verify the column was added
    const verifyResult = await db.execute(sql.raw(`
      SELECT column_name, data_type, is_nullable, column_comment
      FROM information_schema.columns 
      WHERE table_name = 'users' 
      AND column_name = 'referrer_id'
      AND table_schema = DATABASE()
    `));

    if (verifyResult.length > 0) {
      console.log(chalk.green('✅ referrer_id column is now accessible'));
      console.log('Column details:', verifyResult[0]);
    } else {
      console.log(chalk.red('❌ Failed to verify column addition'));
    }

  } catch (error) {
    console.error(chalk.red('❌ Error during migration:'), error);
    throw error;
  }
}

// Run the migration
if (require.main === module) {
  runReferralMigration()
    .then(() => {
      console.log(chalk.green('🎉 Migration completed successfully!'));
      process.exit(0);
    })
    .catch((error) => {
      console.error(chalk.red('💥 Migration failed:'), error);
      process.exit(1);
    });
}

export { runReferralMigration };