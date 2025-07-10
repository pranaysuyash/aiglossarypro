#!/usr/bin/env node

/**
 * Check the database structure to understand the table setup
 */

import { Pool } from '@neondatabase/serverless';
import dotenv from 'dotenv';

dotenv.config();

async function checkDatabaseStructure() {
  if (!process.env.DATABASE_URL) {
    console.error('DATABASE_URL not set');
    return;
  }

  const pool = new Pool({ connectionString: process.env.DATABASE_URL });

  try {
    console.log('Checking database structure...\n');

    // Check if categories table exists
    const categoriesExists = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'categories'
      );
    `);

    console.log('Categories table exists:', categoriesExists.rows[0].exists);

    if (categoriesExists.rows[0].exists) {
      // Check categories table structure
      const categoriesStructure = await pool.query(`
        SELECT column_name, data_type, is_nullable 
        FROM information_schema.columns 
        WHERE table_name = 'categories' 
        ORDER BY ordinal_position;
      `);

      console.log('Categories table structure:');
      console.table(categoriesStructure.rows);

      // Check if there are any categories
      const categoriesCount = await pool.query('SELECT COUNT(*) FROM categories');
      console.log('Categories count:', categoriesCount.rows[0].count);

      if (Number(categoriesCount.rows[0].count) > 0) {
        const sampleCategories = await pool.query('SELECT * FROM categories LIMIT 3');
        console.log('Sample categories:');
        console.table(sampleCategories.rows);
      }
    }

    // Check if terms table exists
    const termsExists = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'terms'
      );
    `);

    console.log('\nTerms table exists:', termsExists.rows[0].exists);

    if (termsExists.rows[0].exists) {
      // Check terms count
      const termsCount = await pool.query('SELECT COUNT(*) FROM terms');
      console.log('Terms count:', termsCount.rows[0].count);
    }

    // List all tables
    const allTables = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name;
    `);

    console.log('\nAll tables in database:');
    allTables.rows.forEach((row) => console.log('-', row.table_name));
  } catch (error) {
    console.error('Database check failed:', error);
  } finally {
    await pool.end();
  }
}

checkDatabaseStructure().catch(console.error);
