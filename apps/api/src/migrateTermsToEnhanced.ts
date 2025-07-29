import { sql } from 'drizzle-orm';
import { db } from '@aiglossarypro/database';

import logger from './utils/logger';
export async function migrateTermsToEnhanced() {
  try {
    logger.info('Starting migration from terms to enhanced_terms...');

    // Check if enhanced_terms table is empty
    const enhancedCount = await db.execute(sql`SELECT COUNT(*) as count FROM enhanced_terms`);
    if (parseInt(enhancedCount.rows[0].count as string) > 0) {
      logger.info('Enhanced_terms table already has data. Skipping migration.');
      return { success: true, migrated: 0 };
    }

    // Get all terms from the original terms table
    const terms = await db.execute(sql`
      SELECT id, name, short_definition, definition, category_id, 
             characteristics, applications, "references", math_formulation,
             view_count, created_at, updated_at
      FROM terms
    `);

    logger.info(`Found ${terms.rows.length} terms to migrate`);

    let migratedCount = 0;

    for (const term of terms.rows) {
      try {
        // Create a slug from the name
        const slug = (term.name as string)
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-+|-+$/g, '');

        // Parse related terms if it's a string
        let relatedConcepts: string[] = [];
        if (term.characteristics) {
          try {
            if (typeof term.characteristics === 'string') {
              relatedConcepts = JSON.parse(term.characteristics);
            } else if (Array.isArray(term.characteristics)) {
              relatedConcepts = term.characteristics;
            }
          } catch (_e) {
            // If parsing fails, split by comma
            relatedConcepts = (term.characteristics as string)
              .split(',')
              .map(s => s.trim())
              .filter(s => s);
          }
        }

        // Get category name if category_id exists
        let mainCategories: string[] = [];
        if (term.category_id) {
          const categoryResult = await db.execute(sql`
            SELECT name FROM categories WHERE id = ${term.category_id}
          `);
          if (categoryResult.rows.length > 0) {
            mainCategories = [categoryResult.rows[0].name as string];
          }
        }

        // No subcategories in current schema
        const subCategories: string[] = [];

        // Parse applications
        let applicationDomains: string[] = [];
        if (term.applications) {
          try {
            if (typeof term.applications === 'object' && term.applications !== null) {
              // If it's already a JSON object, extract values
              applicationDomains = Object.values(term.applications).filter(Boolean) as string[];
            } else if (typeof term.applications === 'string') {
              applicationDomains = JSON.parse(term.applications);
            } else if (Array.isArray(term.applications)) {
              applicationDomains = term.applications;
            }
          } catch (_e) {
            // If parsing fails, convert to string and split
            applicationDomains = String(term.applications)
              .split(',')
              .map(s => s.trim())
              .filter(s => s);
          }
        }

        // Parse references for keywords
        let keywords: string[] = [];
        if (term.references) {
          try {
            if (Array.isArray(term.references)) {
              keywords = term.references;
            } else if (typeof term.references === 'string') {
              keywords = JSON.parse(term.references);
            }
          } catch (_e) {
            // If parsing fails, split by comma
            keywords = String(term.references)
              .split(',')
              .map(s => s.trim())
              .filter(s => s);
          }
        }

        // Create search text
        const searchText = [
          term.name,
          term.definition,
          ...mainCategories,
          ...relatedConcepts,
          ...applicationDomains,
          ...keywords,
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();

        // Insert into enhanced_terms
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
            ${term.short_definition || (term.definition ? (term.definition as string).substring(0, 500) : '')},
            ${term.definition || ''},
            ${mainCategories},
            ${subCategories},
            ${relatedConcepts},
            ${applicationDomains},
            ${keywords},
            ${searchText},
            ${term.view_count || 0},
            ${term.created_at || new Date()},
            ${term.updated_at || new Date()},
            'intermediate',
            ${!!term.math_formulation},
            ${!!term.applications}
          )
        `);

        migratedCount++;

        if (migratedCount % 50 === 0) {
          logger.info(`Migrated ${migratedCount} terms...`);
        }
      } catch (error) {
        logger.error(`Error migrating term ${term.name}:`, error);
      }
    }

    logger.info(`Migration completed! Migrated ${migratedCount} terms to enhanced_terms.`);
    return { success: true, migrated: migratedCount };
  } catch (error) {
    logger.error('Terms to enhanced migration failed:', error);
    throw error;
  }
}

// Run migration if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  migrateTermsToEnhanced()
    .then(result => {
      logger.info('Migration completed successfully:', result);
      process.exit(0);
    })
    .catch(error => {
      logger.error('Migration failed:', error);
      process.exit(1);
    });
}
