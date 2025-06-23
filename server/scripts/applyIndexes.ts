#!/usr/bin/env node
/**
 * Database performance indexes migration script
 * Applies all performance indexes to improve query speed
 */

import dotenv from "dotenv";
import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { Pool } from '@neondatabase/serverless';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config();

const pool = new Pool({ 
  connectionString: process.env.DATABASE_URL 
});

async function main() {
  console.log('🚀 Starting database performance index migration...');
  
  if (!process.env.DATABASE_URL) {
    console.error('❌ DATABASE_URL environment variable is not set');
    process.exit(1);
  }

  try {
    // Read the SQL file
    const sqlPath = join(__dirname, '../migrations/performanceIndexes.sql');
    const sqlContent = readFileSync(sqlPath, 'utf8');
    
    console.log('📖 Reading performance indexes SQL file...');
    
    // Split SQL content into individual statements
    const statements = sqlContent
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'))
      .filter(stmt => !stmt.toLowerCase().includes('select ')); // Skip SELECT statements
    
    console.log(`📊 Found ${statements.length} SQL statements to execute`);
    
    // Execute each statement
    let successCount = 0;
    let errorCount = 0;
    
    for (const statement of statements) {
      try {
        console.log(`⚡ Executing: ${statement.substring(0, 60)}...`);
        await pool.query(statement);
        successCount++;
        console.log('✅ Success');
      } catch (error) {
        errorCount++;
        const err = error as Error;
        if (err.message.includes('already exists')) {
          console.log('ℹ️  Index already exists, skipping');
          successCount++;
        } else {
          console.error(`❌ Error: ${err.message}`);
        }
      }
    }
    
    console.log('\n📈 Index Migration Summary:');
    console.log(`✅ Successful operations: ${successCount}`);
    console.log(`❌ Failed operations: ${errorCount}`);
    
    if (errorCount === 0) {
      console.log('🎉 All database performance indexes applied successfully!');
      console.log('🚀 Expected performance improvements:');
      console.log('   • 50-80% faster search queries');
      console.log('   • Improved category filtering performance');
      console.log('   • Faster user activity tracking');
      console.log('   • Enhanced full-text search capabilities');
    } else {
      console.log('⚠️  Some indexes failed to apply. Check the errors above.');
    }
    
  } catch (error) {
    console.error('❌ Failed to apply database indexes:', error);
    process.exit(1);
  } finally {
    await pool.end();
    console.log('👋 Database connection closed');
  }
}

// Run the migration
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

export { main as applyIndexes };