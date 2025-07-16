/**
 * Database Cleanup Script: Remove Invalid Categories
 *
 * This script identifies and removes categories that are actually terms,
 * metadata, or other invalid data that was incorrectly stored as categories.
 */

import { eq, ilike, inArray } from 'drizzle-orm';
import { categories, subcategories, termSubcategories, terms } from '../../shared/schema';
import { db } from '../db';
import { log } from '../utils/logger';

interface CleanupStats {
  invalidCategoriesFound: number;
  invalidCategoriesRemoved: number;
  invalidSubcategoriesRemoved: number;
  termsReassigned: number;
  errors: string[];
}

async function identifyInvalidCategories(): Promise<string[]> {
  const allCategories = await db
    .select({
      id: categories.id,
      name: categories.name,
    })
    .from(categories);

  const invalidCategoryIds: string[] = [];

  // Patterns that indicate invalid categories
  const invalidPatterns = [
    /^tags?:/i,
    /^introduction/i,
    /^definition/i,
    /^overview/i,
    /^description/i,
    /^example/i,
    /^see also/i,
    /^note:/i,
    /^characteristics/i,
    /^advantages/i,
    /^disadvantages/i,
    /^applications/i,
    /^implementation/i,
    /^code/i,
    /^python/i,
    /^javascript/i,
    /^tutorial/i,
    /^guide/i,
    /^how to/i,
    /^step \d+/i,
    /^chapter \d+/i,
    /^section \d+/i,
    /^\d+\./,
    /^[a-z]\.?\s*$/i, // Single letters
    /^[-•*]\s*/, // Bullet points
    /collaborative reasoning/i, // Specific invalid entries we saw
    /combinatorial batch normalization/i,
    /batch normalization/i, // Too specific, should be "Deep Learning" or "Neural Networks"
    /foundation/i, // Too generic/vague
  ];

  // Categories that are too specific/technical (should be terms, not categories)
  const tooSpecificPatterns = [
    /activation function/i,
    /loss function/i,
    /optimizer/i,
    /gradient descent/i,
    /backpropagation/i,
    /dropout/i,
    /batch normalization/i,
    /layer normalization/i,
    /attention mechanism/i,
    /transformer/i,
    /lstm/i,
    /gru/i,
    /cnn/i,
    /rnn/i,
    /gan/i,
    /vae/i,
    /autoencoder/i,
  ];

  // Check each category
  for (const category of allCategories) {
    const categoryName = category.name.toLowerCase();

    // Check against invalid patterns
    const isInvalid = invalidPatterns.some(pattern => pattern.test(categoryName));
    const isTooSpecific = tooSpecificPatterns.some(pattern => pattern.test(categoryName));

    // Additional checks
    const isSingleWord = categoryName.split(' ').length === 1 && categoryName.length < 4;
    const isVeryLong = categoryName.length > 60;
    const hasNumbers = /\d/.test(categoryName);
    const hasSpecialChars = /[^a-z0-9\s-]/.test(categoryName);

    if (
      isInvalid ||
      isTooSpecific ||
      isSingleWord ||
      isVeryLong ||
      (hasNumbers && !categoryName.includes('2d') && !categoryName.includes('3d')) ||
      hasSpecialChars
    ) {
      invalidCategoryIds.push(category.id);
      log.info(`Invalid category identified: "${category.name}" (${category.id})`);
    }
  }

  return invalidCategoryIds;
}

async function getValidReplacementCategory(): Promise<string> {
  // Find or create a general "Artificial Intelligence" category
  let aiCategory = await db
    .select({
      id: categories.id,
      name: categories.name,
    })
    .from(categories)
    .where(ilike(categories.name, '%artificial intelligence%'))
    .limit(1);

  if (aiCategory.length === 0) {
    // Try "Machine Learning"
    aiCategory = await db
      .select({
        id: categories.id,
        name: categories.name,
      })
      .from(categories)
      .where(ilike(categories.name, '%machine learning%'))
      .limit(1);
  }

  if (aiCategory.length === 0) {
    // Create a default category
    const [newCategory] = await db
      .insert(categories)
      .values({
        name: 'Machine Learning',
        description: 'General machine learning and artificial intelligence concepts',
      })
      .returning();

    log.info(`Created default category: ${newCategory.name} (${newCategory.id})`);
    return newCategory.id;
  }

  return aiCategory[0].id;
}

async function cleanupInvalidCategories(): Promise<CleanupStats> {
  const stats: CleanupStats = {
    invalidCategoriesFound: 0,
    invalidCategoriesRemoved: 0,
    invalidSubcategoriesRemoved: 0,
    termsReassigned: 0,
    errors: [],
  };

  try {
    log.info('🧹 Starting database cleanup: Invalid Categories');
    log.info('===============================================');

    // Step 1: Identify invalid categories
    const invalidCategoryIds = await identifyInvalidCategories();
    stats.invalidCategoriesFound = invalidCategoryIds.length;

    if (invalidCategoryIds.length === 0) {
      log.info('✅ No invalid categories found!');
      return stats;
    }

    log.info(`📊 Found ${invalidCategoryIds.length} invalid categories to clean up`);

    // Step 2: Get a valid replacement category
    const replacementCategoryId = await getValidReplacementCategory();
    log.info(`🔄 Will reassign terms to category: ${replacementCategoryId}`);

    // Step 3: Handle terms assigned to invalid categories
    for (const invalidCategoryId of invalidCategoryIds) {
      try {
        // Find terms assigned to this invalid category
        const termsInCategory = await db
          .select({
            id: terms.id,
            name: terms.name,
          })
          .from(terms)
          .where(eq(terms.categoryId, invalidCategoryId));

        if (termsInCategory.length > 0) {
          log.info(
            `📝 Reassigning ${termsInCategory.length} terms from invalid category ${invalidCategoryId}`
          );

          // Reassign terms to the replacement category
          await db
            .update(terms)
            .set({ categoryId: replacementCategoryId })
            .where(eq(terms.categoryId, invalidCategoryId));

          stats.termsReassigned += termsInCategory.length;
        }
      } catch (error) {
        const errorMsg = `Error reassigning terms for category ${invalidCategoryId}: ${error}`;
        stats.errors.push(errorMsg);
        log.error(errorMsg);
      }
    }

    // Step 4: Remove invalid subcategories
    if (invalidCategoryIds.length > 0) {
      try {
        const subcatsToRemove = await db
          .select({
            id: subcategories.id,
            name: subcategories.name,
          })
          .from(subcategories)
          .where(inArray(subcategories.categoryId, invalidCategoryIds));

        if (subcatsToRemove.length > 0) {
          // First remove term-subcategory relationships
          const subcatIds = subcatsToRemove.map(sc => sc.id);
          await db
            .delete(termSubcategories)
            .where(inArray(termSubcategories.subcategoryId, subcatIds));

          // Then remove the subcategories
          await db
            .delete(subcategories)
            .where(inArray(subcategories.categoryId, invalidCategoryIds));

          stats.invalidSubcategoriesRemoved = subcatsToRemove.length;
          log.info(`🗑️  Removed ${subcatsToRemove.length} invalid subcategories`);
        }
      } catch (error) {
        const errorMsg = `Error removing subcategories: ${error}`;
        stats.errors.push(errorMsg);
        log.error(errorMsg);
      }
    }

    // Step 5: Remove the invalid categories
    try {
      await db.delete(categories).where(inArray(categories.id, invalidCategoryIds));

      stats.invalidCategoriesRemoved = invalidCategoryIds.length;
      log.info(`🗑️  Removed ${invalidCategoryIds.length} invalid categories`);
    } catch (error) {
      const errorMsg = `Error removing categories: ${error}`;
      stats.errors.push(errorMsg);
      log.error(errorMsg);
    }

    log.info('\n✅ DATABASE CLEANUP COMPLETED');
    log.info('============================');
    log.info(`📊 Invalid categories found: ${stats.invalidCategoriesFound}`);
    log.info(`🗑️  Categories removed: ${stats.invalidCategoriesRemoved}`);
    log.info(`🗑️  Subcategories removed: ${stats.invalidSubcategoriesRemoved}`);
    log.info(`📝 Terms reassigned: ${stats.termsReassigned}`);
    log.info(`❌ Errors encountered: ${stats.errors.length}`);

    if (stats.errors.length > 0) {
      log.error('Errors during cleanup:');
      stats.errors.forEach(error => log.error(`  - ${error}`));
    }
  } catch (error) {
    const errorMsg = `Fatal error during cleanup: ${error}`;
    stats.errors.push(errorMsg);
    log.error(errorMsg);
    throw error;
  }

  return stats;
}

// Export for use in other scripts
export { cleanupInvalidCategories, identifyInvalidCategories };

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  cleanupInvalidCategories()
    .then(stats => {
      console.log('\n🎉 Cleanup completed successfully!');
      console.log('Stats:', stats);
      process.exit(0);
    })
    .catch(error => {
      console.error('💥 Cleanup failed:', error);
      process.exit(1);
    });
}
