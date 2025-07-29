import fs from 'node:fs';
import { categories, subcategories, termSubcategories, terms } from '@aiglossarypro/shared';
import { db } from '@aiglossarypro/database';

import logger from './utils/logger';
async function importCleanData() {
  try {
    logger.info('🧹 Starting clean data import...');

    // Read the processed data
    const cleanData = JSON.parse(fs.readFileSync('temp/final_output.json', 'utf8'));

    logger.info(
      `📊 Data to import: ${cleanData.categories.length} categories, ${cleanData.subcategories.length} subcategories, ${cleanData.terms.length} terms`
    );

    // Clear existing data
    logger.info('🗑️  Clearing existing data...');
    await db.delete(termSubcategories);
    await db.delete(terms);
    await db.delete(subcategories);
    await db.delete(categories);

    // Import categories
    logger.info('📁 Importing categories...');
    const imported = { categories: 0, subcategories: 0, terms: 0 };

    for (const category of cleanData.categories) {
      try {
        await db.insert(categories).values({
          id: category.id,
          name: category.name,
        });
        imported.categories++;
      } catch (e) {
        logger.warn(`⚠️  Error importing category ${category.name}: ${e}`);
      }
    }

    // Import subcategories
    logger.info('📂 Importing subcategories...');
    for (const subcategory of cleanData.subcategories) {
      try {
        await db.insert(subcategories).values({
          id: subcategory.id,
          name: subcategory.name,
          categoryId: subcategory.categoryId,
        });
        imported.subcategories++;
      } catch (e) {
        logger.warn(`⚠️  Error importing subcategory ${subcategory.name}: ${e}`);
      }
    }

    // Import terms
    logger.info('📝 Importing terms...');
    for (const term of cleanData.terms) {
      try {
        await db.insert(terms).values({
          id: term.id,
          name: term.name,
          definition: term.definition || '',
          shortDefinition: term.shortDefinition || '',
          categoryId: term.categoryId,
          viewCount: 0,
        });
        imported.terms++;

        // Import term-subcategory relationships
        if (term.subcategoryIds && term.subcategoryIds.length > 0) {
          for (const subcategoryId of term.subcategoryIds) {
            try {
              await db.insert(termSubcategories).values({
                termId: term.id,
                subcategoryId: subcategoryId,
              });
            } catch (_e) {
              // Ignore duplicate relationship errors
            }
          }
        }
      } catch (e) {
        logger.warn(`⚠️  Error importing term ${term.name}: ${e}`);
      }
    }

    logger.info(
      `✅ Import completed: ${imported.categories} categories, ${imported.subcategories} subcategories, ${imported.terms} terms`
    );
  } catch (error) {
    logger.error('❌ Error importing clean data:', error);
    throw error;
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  importCleanData()
    .then(() => {
      logger.info('🎉 Clean data import successful!');
      process.exit(0);
    })
    .catch(error => {
      logger.error('💥 Clean data import failed:', error);
      process.exit(1);
    });
}

export { importCleanData };
