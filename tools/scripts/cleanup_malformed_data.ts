#!/usr/bin/env tsx

import { pool } from '../server/db';

async function cleanupMalformedData() {
  console.log('🧹 Starting Database Cleanup...\n');

  const client = await pool.connect();

  try {
    // 1. Identify malformed categories
    console.log('📂 Identifying malformed categories...');

    const malformedCategories = await client.query(`
      SELECT id, name, length(name) as name_length
      FROM categories 
      WHERE length(name) > 50 
         OR name LIKE '%"%' 
         OR name LIKE '%...%'
         OR name LIKE 'Main Category%'
         OR name LIKE 'Vector Db%'
         OR name LIKE 'Token-Level%'
         OR name LIKE 'Energy-Based%'
         OR name LIKE 'Task-Specific%'
         OR name LIKE 'Preprocessing%'
         OR name LIKE 'Similarity Measures%'
      ORDER BY length(name) DESC;
    `);

    console.log(`Found ${malformedCategories.rows.length} malformed categories`);

    // 2. Find terms that need category reassignment
    const termsMissingCategories = await client.query(`
      SELECT t.id, t.name 
      FROM terms t
      LEFT JOIN categories c ON t.category_id = c.id
      WHERE c.id IS NULL OR length(c.name) > 50
      LIMIT 10;
    `);

    console.log(`Found ${termsMissingCategories.rows.length} terms needing category reassignment`);

    // 3. Create standard categories if they don't exist
    console.log('\n🏗️  Creating standard categories...');

    const standardCategories = [
      { name: 'Machine Learning', description: 'Core machine learning concepts and algorithms' },
      { name: 'Deep Learning', description: 'Neural networks and deep learning architectures' },
      {
        name: 'Natural Language Processing',
        description: 'Text processing and language understanding',
      },
      { name: 'Computer Vision', description: 'Image and video processing techniques' },
      { name: 'Artificial Intelligence', description: 'General AI concepts and methodologies' },
      { name: 'Data Science', description: 'Data analysis and statistical methods' },
      { name: 'Reinforcement Learning', description: 'Learning through interaction and feedback' },
      { name: 'Statistics', description: 'Statistical methods and probability theory' },
    ];

    for (const category of standardCategories) {
      await client.query(
        `
        INSERT INTO categories (id, name, description, created_at, updated_at)
        VALUES (gen_random_uuid(), $1, $2, NOW(), NOW())
        ON CONFLICT (name) DO NOTHING;
      `,
        [category.name, category.description]
      );
    }

    // 4. Get the standard category IDs
    const standardCatIds = await client.query(
      `
      SELECT id, name FROM categories 
      WHERE name IN (${standardCategories.map((_, i) => `$${i + 1}`).join(', ')})
    `,
      standardCategories.map(c => c.name)
    );

    console.log(`Created/verified ${standardCatIds.rows.length} standard categories`);

    // 5. Reassign terms with malformed categories to "Machine Learning" default
    const mlCategoryId = standardCatIds.rows.find(row => row.name === 'Machine Learning')?.id;

    if (mlCategoryId) {
      const reassignResult = await client.query(
        `
        UPDATE terms 
        SET category_id = $1, updated_at = NOW()
        FROM categories c 
        WHERE terms.category_id = c.id 
          AND (length(c.name) > 50 OR c.name LIKE '%"%' OR c.name LIKE '%...%')
      `,
        [mlCategoryId]
      );

      console.log(`Reassigned ${reassignResult.rowCount} terms to Machine Learning category`);
    }

    // 6. Delete malformed categories (after reassigning terms)
    const deleteResult = await client.query(`
      DELETE FROM categories 
      WHERE length(name) > 50 
         OR name LIKE '%"%' 
         OR name LIKE '%...%'
         OR name LIKE 'Main Category%'
         OR name LIKE 'Vector Db%'
         OR name LIKE 'Token-Level%'
         OR name LIKE 'Energy-Based%'
         OR name LIKE 'Task-Specific%'
         OR name LIKE 'Preprocessing%'
         OR name LIKE 'Similarity Measures%'
    `);

    console.log(`Deleted ${deleteResult.rowCount} malformed categories`);

    // 7. Final verification
    console.log('\n✅ Cleanup completed! Final verification:');

    const finalStats = await client.query(`
      SELECT 
        (SELECT COUNT(*) FROM categories) as total_categories,
        (SELECT COUNT(*) FROM categories WHERE length(name) > 50) as long_categories,
        (SELECT COUNT(*) FROM terms WHERE category_id IS NOT NULL) as categorized_terms,
        (SELECT COUNT(*) FROM terms) as total_terms
    `);

    const stats = finalStats.rows[0];
    console.log(`Total categories: ${stats.total_categories}`);
    console.log(`Long category names: ${stats.long_categories}`);
    console.log(`Categorized terms: ${stats.categorized_terms}`);
    console.log(`Total terms: ${stats.total_terms}`);
    console.log(
      `Categorization rate: ${((stats.categorized_terms / stats.total_terms) * 100).toFixed(1)}%`
    );
  } catch (error) {
    console.error('❌ Error during cleanup:', error);
  } finally {
    client.release();
  }
}

// Run cleanup
cleanupMalformedData().catch(console.error);
