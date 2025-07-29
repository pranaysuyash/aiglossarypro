/**
 * Quick test script to check current category data in the database
 */

import { createClient } from '@libsql/client';
import 'dotenv/config';

const client = createClient({
  url: process.env.DATABASE_URL,
});

async function checkCategories() {
  console.log('🔍 Checking current categories in database...');

  try {
    // Get all categories
    const categories = await client.execute(
      'SELECT id, name FROM categories ORDER BY name LIMIT 20'
    );

    console.log('\n📊 Current categories (first 20):');
    categories.rows.forEach((row, index) => {
      console.log(`${index + 1}. "${row.name}" (${row.id})`);
    });

    // Count total categories
    const totalResult = await client.execute('SELECT COUNT(*) as total FROM categories');
    console.log(`\n📈 Total categories: ${totalResult.rows[0].total}`);

    // Check for obvious invalid patterns
    const invalidPatterns = [
      'tags:',
      'introduction',
      'definition',
      'overview',
      'collaborative reasoning',
      'batch normalization',
    ];

    let invalidCount = 0;
    for (const pattern of invalidPatterns) {
      const result = await client.execute({
        sql: 'SELECT COUNT(*) as count FROM categories WHERE LOWER(name) LIKE ?',
        args: [`%${pattern}%`],
      });
      const count = result.rows[0].count;
      if (count > 0) {
        console.log(`❌ Found ${count} categories matching "${pattern}"`);
        invalidCount += count;
      }
    }

    console.log(`\n📊 Total potentially invalid categories: ${invalidCount}`);

    if (invalidCount > 0) {
      console.log('\n🚨 Categories need cleanup before sidebar will show proper hierarchy');
    } else {
      console.log('\n✅ Categories look clean!');
    }
  } catch (error) {
    console.error('❌ Error checking categories:', error);
  } finally {
    await client.close();
  }
}

checkCategories().catch(console.error);
