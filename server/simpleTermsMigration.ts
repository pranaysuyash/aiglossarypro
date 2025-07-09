import { sql } from 'drizzle-orm';
import { db } from './db';

export async function simpleTermsMigration() {
  try {
    console.log('Starting simple migration from terms to enhanced_terms...');

    // Check if enhanced_terms table is empty
    const enhancedCount = await db.execute(sql`SELECT COUNT(*) as count FROM enhanced_terms`);
    if (parseInt(enhancedCount.rows[0].count as string) > 0) {
      console.log('Enhanced_terms table already has data. Skipping migration.');
      return { success: true, migrated: 0 };
    }

    // Get all terms from the original terms table
    const terms = await db.execute(sql`
      SELECT id, name, short_definition, definition, category_id, view_count, created_at, updated_at
      FROM terms
    `);

    console.log(`Found ${terms.rows.length} terms to migrate`);

    let migratedCount = 0;

    for (const term of terms.rows) {
      try {
        // Create a slug from the name
        const slug = (term.name as string)
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-+|-+$/g, '');

        // Get category name if category_id exists
        let categoryName = '';
        if (term.category_id) {
          const categoryResult = await db.execute(sql`
            SELECT name FROM categories WHERE id = ${term.category_id}
          `);
          if (categoryResult.rows.length > 0) {
            categoryName = categoryResult.rows[0].name as string;
          }
        }

        // Create search text
        const searchText = [term.name, term.definition, categoryName]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();

        // Insert into enhanced_terms with simple data
        await db.execute(sql`
          INSERT INTO enhanced_terms (
            id, name, slug, short_definition, full_definition,
            main_categories, sub_categories, related_concepts, application_domains,
            keywords, search_text, view_count, created_at, updated_at,
            difficulty_level, has_implementation, has_code_examples
          ) VALUES (
            ${term.id},
            ${term.name},
            ${slug},
            ${term.short_definition || ''},
            ${term.definition || ''},
            ARRAY[${categoryName || 'General'}],
            ARRAY[]::text[],
            ARRAY[]::text[],
            ARRAY[]::text[],
            ARRAY[]::text[],
            ${searchText},
            ${term.view_count || 0},
            ${term.created_at || 'now()'},
            ${term.updated_at || 'now()'},
            'intermediate',
            false,
            false
          )
        `);

        migratedCount++;

        if (migratedCount % 50 === 0) {
          console.log(`Migrated ${migratedCount} terms...`);
        }
      } catch (error) {
        console.error(`Error migrating term ${term.name}:`, error);
      }
    }

    console.log(`Migration completed! Migrated ${migratedCount} terms to enhanced_terms.`);
    return { success: true, migrated: migratedCount };
  } catch (error) {
    console.error('Simple terms migration failed:', error);
    throw error;
  }
}

// Run migration if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  simpleTermsMigration()
    .then((result) => {
      console.log('Migration completed successfully:', result);
      process.exit(0);
    })
    .catch((error) => {
      console.error('Migration failed:', error);
      process.exit(1);
    });
}
