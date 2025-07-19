/**
 * Optimized Batched Importer for Large Datasets
 * Enhanced version with bulk inserts, transactions, and better memory management
 */

import fs from 'node:fs';
import { eq } from 'drizzle-orm';
import { categories, subcategories, termSubcategories, terms } from '../shared/schema';
import { db } from './db';

import logger from './utils/logger';
interface OptimizedImportOptions {
  batchSize?: number;
  bulkInsertSize?: number; // Number of records to insert in a single SQL operation
  skipExisting?: boolean;
  enableProgress?: boolean;
  useTransactions?: boolean;
  maxConcurrentOperations?: number;
}

interface ImportResult {
  success: boolean;
  imported: {
    categories: number;
    subcategories: number;
    terms: number;
  };
  errors: string[];
  duration: number;
  performance: {
    categoriesPerSecond: number;
    termsPerSecond: number;
    memoryUsage: NodeJS.MemoryUsage;
  };
}

export class OptimizedBatchImporter {
  private options: Required<OptimizedImportOptions>;

  constructor(options: OptimizedImportOptions = {}) {
    this.options = {
      batchSize: options.batchSize ?? 1000,
      bulkInsertSize: options.bulkInsertSize ?? 100, // Insert 100 records at once
      skipExisting: options.skipExisting ?? true,
      enableProgress: options.enableProgress ?? true,
      useTransactions: options.useTransactions ?? true,
      maxConcurrentOperations: options.maxConcurrentOperations ?? 3,
    };
  }

  /**
   * Main import function with performance optimizations
   */
  async importFromFile(filePath: string): Promise<ImportResult> {
    const startTime = Date.now();
    logger.info(`🚀 Starting optimized import from: ${filePath}`);
    logger.info(`⚙️  Configuration:`);
    logger.info(`   📦 Batch size: ${this.options.batchSize}`);
    logger.info(`   💾 Bulk insert size: ${this.options.bulkInsertSize}`);
    logger.info(`   🔄 Use transactions: ${this.options.useTransactions}`);

    const result: ImportResult = {
      success: false,
      imported: { categories: 0, subcategories: 0, terms: 0 },
      errors: [],
      duration: 0,
      performance: {
        categoriesPerSecond: 0,
        termsPerSecond: 0,
        memoryUsage: process.memoryUsage(),
      },
    };

    try {
      // Check file exists
      if (!fs.existsSync(filePath)) {
        throw new Error(`File not found: ${filePath}`);
      }

      // Stream-based JSON parsing for large files
      const data = await this.loadDataStreaming(filePath);

      logger.info(`📊 Dataset overview:`);
      logger.info(`   📂 ${data.categories?.length || 0} categories`);
      logger.info(`   📋 ${data.subcategories?.length || 0} subcategories`);
      logger.info(`   📄 ${data.terms?.length || 0} terms`);

      // Memory usage check
      const initialMemory = process.memoryUsage();
      logger.info(`💾 Initial memory usage: ${Math.round(initialMemory.heapUsed / 1024 / 1024)}MB`);

      // Create category ID mapping for reference integrity
      const categoryIdMap = new Map<string, string>();

      // Import categories with bulk operations
      if (data.categories && data.categories.length > 0) {
        logger.info(`\n📂 Importing categories with bulk inserts...`);
        const categoryStart = Date.now();
        result.imported.categories = await this.bulkImportCategories(
          data.categories,
          categoryIdMap
        );
        const categoryDuration = Date.now() - categoryStart;
        result.performance.categoriesPerSecond =
          result.imported.categories / (categoryDuration / 1000);
        logger.info(
          `✅ Categories imported: ${result.imported.categories} (${result.performance.categoriesPerSecond.toFixed(1)}/sec)`
        );
      }

      // Import subcategories with optimizations
      const subcategoryIdMap = new Map<string, string>();
      if (data.subcategories && data.subcategories.length > 0) {
        logger.info(`\n📋 Importing subcategories...`);
        result.imported.subcategories = await this.bulkImportSubcategories(
          data.subcategories,
          categoryIdMap,
          subcategoryIdMap
        );
        logger.info(`✅ Subcategories imported: ${result.imported.subcategories}`);
      }

      // Import terms with optimized batch processing
      if (data.terms && data.terms.length > 0) {
        logger.info(`\n📄 Importing terms with optimized batching...`);
        const termsStart = Date.now();
        result.imported.terms = await this.bulkImportTerms(
          data.terms,
          categoryIdMap,
          subcategoryIdMap
        );
        const termsDuration = Date.now() - termsStart;
        result.performance.termsPerSecond = result.imported.terms / (termsDuration / 1000);
        logger.info(
          `✅ Terms imported: ${result.imported.terms} (${result.performance.termsPerSecond.toFixed(1)}/sec)`
        );
      }

      result.success = true;
      result.duration = Date.now() - startTime;
      result.performance.memoryUsage = process.memoryUsage();

      logger.info(`\n🎉 Import completed successfully!`);
      logger.info(`⏱️  Total duration: ${(result.duration / 1000).toFixed(2)}s`);
      logger.info(`📈 Performance summary:`);
      logger.info(`   📂 Categories: ${result.performance.categoriesPerSecond.toFixed(1)}/sec`);
      logger.info(`   📄 Terms: ${result.performance.termsPerSecond.toFixed(1)}/sec`);
      logger.info(
        `💾 Memory usage: ${Math.round(result.performance.memoryUsage.heapUsed / 1024 / 1024)}MB`
      );
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error('❌ Import failed:', errorMessage);
      result.errors.push(errorMessage);
      result.duration = Date.now() - startTime;
    }

    return result;
  }

  /**
   * Stream-based JSON loading for large files
   */
  private async loadDataStreaming(filePath: string): Promise<any> {
    // For very large files, consider using a streaming JSON parser
    // For now, use optimized synchronous loading with memory monitoring
    const stats = fs.statSync(filePath);
    const fileSizeMB = stats.size / 1024 / 1024;

    logger.info(`📁 File size: ${fileSizeMB.toFixed(1)}MB`);

    if (fileSizeMB > 100) {
      logger.info(`⚠️  Large file detected. Consider using streaming parser for files > 100MB`);
    }

    const fileContent = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(fileContent);
  }

  /**
   * Bulk import categories with optimized insertions
   */
  private async bulkImportCategories(
    categoriesData: any[],
    categoryIdMap: Map<string, string>
  ): Promise<number> {
    let imported = 0;
    const { batchSize, bulkInsertSize } = this.options;

    for (let i = 0; i < categoriesData.length; i += batchSize) {
      const batch = categoriesData.slice(i, i + batchSize);
      const validCategories: any[] = [];

      // Prepare valid categories for bulk insert
      for (const category of batch) {
        if (!category.name || !category.slug) {
          logger.warn(`⚠️  Skipping invalid category:`, category);
          continue;
        }

        // Check if exists (if skipExisting is enabled)
        if (this.options.skipExisting) {
          const existing = await db
            .select()
            .from(categories)
            .where(eq(categories.name, category.name))
            .limit(1);
          if (existing.length > 0) {
            categoryIdMap.set(category.name, existing[0].id);
            continue;
          }
        }

        validCategories.push({
          id: category.id || crypto.randomUUID(),
          name: category.name,
          slug: category.slug,
          description: category.description || null,
          icon: category.icon || null,
          color: category.color || null,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      }

      // Bulk insert in smaller chunks
      if (validCategories.length > 0) {
        if (this.options.useTransactions) {
          await db.transaction(async tx => {
            for (let j = 0; j < validCategories.length; j += bulkInsertSize) {
              const chunk = validCategories.slice(j, j + bulkInsertSize);
              const inserted = await tx
                .insert(categories)
                .values(chunk)
                .returning({ id: categories.id, name: categories.name });

              // Update ID mapping
              for (const cat of inserted) {
                const original = chunk.find(c => c.name === cat.name);
                if (original) {
                  categoryIdMap.set(cat.name, cat.id);
                }
              }

              imported += chunk.length;
            }
          });
        } else {
          // Non-transactional bulk insert
          for (let j = 0; j < validCategories.length; j += bulkInsertSize) {
            const chunk = validCategories.slice(j, j + bulkInsertSize);
            const inserted = await db
              .insert(categories)
              .values(chunk)
              .returning({ id: categories.id, name: categories.name });

            for (const cat of inserted) {
              const original = chunk.find(c => c.name === cat.name);
              if (original) {
                categoryIdMap.set(cat.name, cat.id);
              }
            }

            imported += chunk.length;
          }
        }
      }

      if (this.options.enableProgress && i % (batchSize * 10) === 0) {
        logger.info(
          `📂 Categories progress: ${i}/${categoriesData.length} (${((i / categoriesData.length) * 100).toFixed(1)}%)`
        );
      }
    }

    return imported;
  }

  /**
   * Bulk import subcategories with optimized insertions
   */
  private async bulkImportSubcategories(
    subcategoriesData: any[],
    categoryIdMap: Map<string, string>,
    subcategoryIdMap: Map<string, string>
  ): Promise<number> {
    let imported = 0;
    const { batchSize, bulkInsertSize } = this.options;

    for (let i = 0; i < subcategoriesData.length; i += batchSize) {
      const batch = subcategoriesData.slice(i, i + batchSize);
      const validSubcategories: any[] = [];

      for (const subcategory of batch) {
        if (!subcategory.name || !subcategory.slug || !subcategory.categorySlug) {
          logger.warn(`⚠️  Skipping invalid subcategory:`, subcategory);
          continue;
        }

        const categoryId = categoryIdMap.get(subcategory.categorySlug);
        if (!categoryId) {
          logger.warn(
            `⚠️  Category not found for subcategory: ${subcategory.name} (${subcategory.categorySlug})`
          );
          continue;
        }

        if (this.options.skipExisting) {
          const existing = await db
            .select()
            .from(subcategories)
            .where(eq(subcategories.name, subcategory.name))
            .limit(1);
          if (existing.length > 0) {
            subcategoryIdMap.set(subcategory.name, existing[0].id);
            continue;
          }
        }

        validSubcategories.push({
          id: subcategory.id || crypto.randomUUID(),
          categoryId,
          name: subcategory.name,
          slug: subcategory.slug,
          description: subcategory.description || null,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      }

      // Bulk insert subcategories
      if (validSubcategories.length > 0) {
        if (this.options.useTransactions) {
          await db.transaction(async tx => {
            for (let j = 0; j < validSubcategories.length; j += bulkInsertSize) {
              const chunk = validSubcategories.slice(j, j + bulkInsertSize);
              const inserted = await tx
                .insert(subcategories)
                .values(chunk)
                .returning({ id: subcategories.id, name: subcategories.name });

              for (const sub of inserted) {
                const original = chunk.find(s => s.name === sub.name);
                if (original) {
                  subcategoryIdMap.set(sub.name, sub.id);
                }
              }

              imported += chunk.length;
            }
          });
        } else {
          for (let j = 0; j < validSubcategories.length; j += bulkInsertSize) {
            const chunk = validSubcategories.slice(j, j + bulkInsertSize);
            const inserted = await db
              .insert(subcategories)
              .values(chunk)
              .returning({ id: subcategories.id, name: subcategories.name });

            for (const sub of inserted) {
              const original = chunk.find(s => s.name === sub.name);
              if (original) {
                subcategoryIdMap.set(sub.name, sub.id);
              }
            }

            imported += chunk.length;
          }
        }
      }

      if (this.options.enableProgress && i % (batchSize * 10) === 0) {
        logger.info(
          `📋 Subcategories progress: ${i}/${subcategoriesData.length} (${((i / subcategoriesData.length) * 100).toFixed(1)}%)`
        );
      }
    }

    return imported;
  }

  /**
   * Bulk import terms with optimized insertions and relationship handling
   */
  private async bulkImportTerms(
    termsData: any[],
    _categoryIdMap: Map<string, string>,
    subcategoryIdMap: Map<string, string>
  ): Promise<number> {
    let imported = 0;
    const { batchSize, bulkInsertSize } = this.options;

    for (let i = 0; i < termsData.length; i += batchSize) {
      const batch = termsData.slice(i, i + batchSize);
      const validTerms: any[] = [];
      const termSubcategoryRelations: any[] = [];

      for (const term of batch) {
        if (!term.name) {
          logger.warn(`⚠️  Skipping invalid term:`, term);
          continue;
        }

        if (this.options.skipExisting) {
          const existing = await db.select().from(terms).where(eq(terms.name, term.name)).limit(1);
          if (existing.length > 0) {
            continue;
          }
        }

        const termId = term.id || crypto.randomUUID();

        validTerms.push({
          id: termId,
          name: term.name,
          slug: term.slug,
          definition: term.definition || '',
          explanation: term.explanation || null,
          examples: term.examples || null,
          relatedTerms: term.relatedTerms || null,
          difficulty: term.difficulty || 'beginner',
          tags: term.tags || null,
          createdAt: new Date(),
          updatedAt: new Date(),
        });

        // Prepare subcategory relationships
        if (term.subcategorySlugs && Array.isArray(term.subcategorySlugs)) {
          for (const subcategorySlug of term.subcategorySlugs) {
            const subcategoryId = subcategoryIdMap.get(subcategorySlug);
            if (subcategoryId) {
              termSubcategoryRelations.push({
                termId,
                subcategoryId,
              });
            }
          }
        }
      }

      // Bulk insert terms and relationships in transaction
      if (validTerms.length > 0) {
        if (this.options.useTransactions) {
          await db.transaction(async tx => {
            // Insert terms in chunks
            for (let j = 0; j < validTerms.length; j += bulkInsertSize) {
              const chunk = validTerms.slice(j, j + bulkInsertSize);
              await tx.insert(terms).values(chunk);
              imported += chunk.length;
            }

            // Insert term-subcategory relationships in chunks
            if (termSubcategoryRelations.length > 0) {
              for (let j = 0; j < termSubcategoryRelations.length; j += bulkInsertSize) {
                const chunk = termSubcategoryRelations.slice(j, j + bulkInsertSize);
                await tx.insert(termSubcategories).values(chunk);
              }
            }
          });
        } else {
          // Non-transactional inserts
          for (let j = 0; j < validTerms.length; j += bulkInsertSize) {
            const chunk = validTerms.slice(j, j + bulkInsertSize);
            await db.insert(terms).values(chunk);
            imported += chunk.length;
          }

          if (termSubcategoryRelations.length > 0) {
            for (let j = 0; j < termSubcategoryRelations.length; j += bulkInsertSize) {
              const chunk = termSubcategoryRelations.slice(j, j + bulkInsertSize);
              await db.insert(termSubcategories).values(chunk);
            }
          }
        }
      }

      if (this.options.enableProgress && i % (batchSize * 5) === 0) {
        logger.info(
          `📄 Terms progress: ${i}/${termsData.length} (${((i / termsData.length) * 100).toFixed(1)}%)`
        );

        // Memory monitoring during large imports
        const currentMemory = process.memoryUsage();
        logger.info(`💾 Current memory: ${Math.round(currentMemory.heapUsed / 1024 / 1024)}MB`);

        // Force garbage collection if memory usage is high
        if (currentMemory.heapUsed > 500 * 1024 * 1024) {
          // 500MB
          if (global.gc) {
            global.gc();
            logger.info(`🗑️  Garbage collection triggered`);
          }
        }
      }
    }

    return imported;
  }
}

// Export for use in other modules
export async function optimizedImportFromFile(
  filePath: string,
  options: OptimizedImportOptions = {}
): Promise<ImportResult> {
  const importer = new OptimizedBatchImporter(options);
  return importer.importFromFile(filePath);
}
