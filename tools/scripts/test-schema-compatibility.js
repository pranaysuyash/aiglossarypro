#!/usr/bin/env node

/**
 * Test schema compatibility with the actual database
 */

import { Pool } from '@neondatabase/serverless';
import dotenv from 'dotenv';

dotenv.config();

async function testSchemaCompatibility() {
  if (!process.env.DATABASE_URL) {
    console.error('DATABASE_URL not set');
    return;
  }

  const pool = new Pool({ connectionString: process.env.DATABASE_URL });

  try {
    console.log('Testing schema compatibility...\n');

    // Test 1: Simple select from categories without joins
    console.log('1. Testing simple categories select');
    try {
      const simpleSelect = await pool.query('SELECT id, name, description FROM categories LIMIT 1');
      console.log('✅ Simple select works');
      console.log('Sample:', simpleSelect.rows[0] || 'No data');
    } catch (error) {
      console.log('❌ Simple select failed:', error.message);
    }

    // Test 2: Test with count
    console.log('\n2. Testing count query');
    try {
      const countQuery = await pool.query('SELECT COUNT(*) as count FROM categories');
      console.log('✅ Count query works');
      console.log('Count:', countQuery.rows[0].count);
    } catch (error) {
      console.log('❌ Count query failed:', error.message);
    }

    // Test 3: Test the actual problematic query
    console.log('\n3. Testing the problematic join query');
    try {
      const joinQuery = await pool.query(`
        SELECT 
          categories.id, 
          categories.name, 
          categories.description, 
          count(terms.id)::int as termCount
        FROM categories 
        LEFT JOIN terms ON terms.category_id = categories.id 
        GROUP BY categories.id, categories.name, categories.description 
        ORDER BY categories.name 
        LIMIT 5
      `);
      console.log('✅ Join query works');
      console.log('Results:', joinQuery.rows);
    } catch (error) {
      console.log('❌ Join query failed:', error.message);
    }

    // Test 4: Check schema details
    console.log('\n4. Checking column types');
    const columnTypes = await pool.query(`
      SELECT column_name, data_type, column_default, is_nullable
      FROM information_schema.columns 
      WHERE table_name IN ('categories', 'terms')
      ORDER BY table_name, ordinal_position
    `);

    console.log('Column types:');
    console.table(columnTypes.rows);
  } catch (error) {
    console.error('Schema compatibility test failed:', error);
  } finally {
    await pool.end();
  }
}

testSchemaCompatibility().catch(console.error);
