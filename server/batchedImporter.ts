/**
 * Batched Importer for Large Datasets
 * Handles importing large JSON files by processing them in chunks to avoid memory issues
 */

import fs from 'fs';
import path from 'path';
import { db } from './db';
import {  categories, subcategories, terms, termSubcategories  } from "../shared/schema";
import { eq, and } from 'drizzle-orm';

interface ImportOptions {
  batchSize?: number;
  skipExisting?: boolean;
  enableProgress?: boolean;
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
}

/**
 * Import data in smaller, manageable batches
 */
export async function batchedImportProcessedData(
  filePath: string, 
  options: ImportOptions = {}
): Promise<ImportResult> {
  const startTime = Date.now();
  const { batchSize = 500, skipExisting = true, enableProgress = true } = options;

  console.log(`🚀 Starting batched import from: ${filePath}`);
  console.log(`   📦 Batch size: ${batchSize}`);

  const result: ImportResult = {
    success: false,
    imported: { categories: 0, subcategories: 0, terms: 0 },
    errors: [],
    duration: 0
  };

  try {
    // Check file exists
    if (!fs.existsSync(filePath)) {
      throw new Error(`File not found: ${filePath}`);
    }

    // Load and parse the data
    const fileContent = fs.readFileSync(filePath, 'utf8');
    const data = JSON.parse(fileContent);

    console.log(`📊 Dataset overview:`);
    console.log(`   📂 ${data.categories?.length || 0} categories`);
    console.log(`   📋 ${data.subcategories?.length || 0} subcategories`);
    console.log(`   📄 ${data.terms?.length || 0} terms`);

    // Create category ID mapping for reference integrity
    const categoryIdMap = new Map<string, string>();

    // Import categories first
    if (data.categories && data.categories.length > 0) {
      console.log(`\n📂 Importing categories...`);
      const categoryResult = await importCategoriesInBatches(
        data.categories, 
        batchSize, 
        skipExisting, 
        categoryIdMap
      );
      result.imported.categories = categoryResult.imported;
      result.errors.push(...categoryResult.errors);
    }

    // Import subcategories with proper category references
    if (data.subcategories && data.subcategories.length > 0) {
      console.log(`\n📋 Importing subcategories...`);
      const subcategoryResult = await importSubcategoriesInBatches(
        data.subcategories,
        batchSize,
        skipExisting,
        categoryIdMap
      );
      result.imported.subcategories = subcategoryResult.imported;
      result.errors.push(...subcategoryResult.errors);
    }

    // Import terms
    if (data.terms && data.terms.length > 0) {
      console.log(`\n📄 Importing terms...`);
      const termsResult = await importTermsInBatches(
        data.terms,
        batchSize,
        skipExisting
      );
      result.imported.terms = termsResult.imported;
      result.errors.push(...termsResult.errors);
    }

    result.success = true;
    result.duration = Date.now() - startTime;

    console.log(`\n✅ Batched import completed in ${(result.duration / 1000).toFixed(2)}s:`);
    console.log(`   📂 ${result.imported.categories} categories imported`);
    console.log(`   📋 ${result.imported.subcategories} subcategories imported`);
    console.log(`   📄 ${result.imported.terms} terms imported`);
    console.log(`   ❌ ${result.errors.length} errors`);

    return result;

  } catch (error) {
    result.success = false;
    result.duration = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : String(error);
    result.errors.push(errorMessage);
    
    console.error(`❌ Batched import failed: ${errorMessage}`);
    return result;
  }
}

/**
 * Import categories in batches
 */
async function importCategoriesInBatches(
  categoriesData: any[],
  batchSize: number,
  skipExisting: boolean,
  categoryIdMap: Map<string, string>
): Promise<{ imported: number; errors: string[] }> {
  let imported = 0;
  const errors: string[] = [];

  for (let i = 0; i < categoriesData.length; i += batchSize) {
    const batch = categoriesData.slice(i, i + batchSize);
    const batchNumber = Math.floor(i / batchSize) + 1;
    const totalBatches = Math.ceil(categoriesData.length / batchSize);

    console.log(`   🔄 Processing categories batch ${batchNumber}/${totalBatches} (${batch.length} items)`);

    for (const category of batch) {
      try {
        let categoryId = category.id;

        if (skipExisting) {
          const existing = await db.select()
            .from(categories)
            .where(eq(categories.name, category.name))
            .limit(1);

          if (existing.length > 0) {
            categoryIdMap.set(category.id, existing[0].id);
            continue;
          }
        }

        const [inserted] = await db.insert(categories).values({
          id: categoryId,
          name: category.name,
          description: category.description || null
        }).returning({ id: categories.id });

        categoryIdMap.set(category.id, inserted.id);
        imported++;

      } catch (error) {
        const errorMsg = `Category ${category.name}: ${error instanceof Error ? error.message : String(error)}`;
        errors.push(errorMsg);
      }
    }
  }

  return { imported, errors };
}

/**
 * Import subcategories in batches
 */
async function importSubcategoriesInBatches(
  subcategoriesData: any[],
  batchSize: number,
  skipExisting: boolean,
  categoryIdMap: Map<string, string>
): Promise<{ imported: number; errors: string[] }> {
  let imported = 0;
  const errors: string[] = [];

  for (let i = 0; i < subcategoriesData.length; i += batchSize) {
    const batch = subcategoriesData.slice(i, i + batchSize);
    const batchNumber = Math.floor(i / batchSize) + 1;
    const totalBatches = Math.ceil(subcategoriesData.length / batchSize);

    console.log(`   🔄 Processing subcategories batch ${batchNumber}/${totalBatches} (${batch.length} items)`);

    for (const subcategory of batch) {
      try {
        const mappedCategoryId = categoryIdMap.get(subcategory.categoryId);
        if (!mappedCategoryId) {
          errors.push(`Subcategory ${subcategory.name}: category ID ${subcategory.categoryId} not found`);
          continue;
        }

        if (skipExisting) {
          const existing = await db.select()
            .from(subcategories)
            .where(
              and(
                eq(subcategories.name, subcategory.name),
                eq(subcategories.categoryId, mappedCategoryId)
              )
            )
            .limit(1);

          if (existing.length > 0) {
            continue;
          }
        }

        await db.insert(subcategories).values({
          id: subcategory.id,
          name: subcategory.name,
          categoryId: mappedCategoryId
        });

        imported++;

      } catch (error) {
        const errorMsg = `Subcategory ${subcategory.name}: ${error instanceof Error ? error.message : String(error)}`;
        errors.push(errorMsg);
      }
    }
  }

  return { imported, errors };
}

/**
 * Import terms in batches
 */
async function importTermsInBatches(
  termsData: any[],
  batchSize: number,
  skipExisting: boolean
): Promise<{ imported: number; errors: string[] }> {
  let imported = 0;
  const errors: string[] = [];

  for (let i = 0; i < termsData.length; i += batchSize) {
    const batch = termsData.slice(i, i + batchSize);
    const batchNumber = Math.floor(i / batchSize) + 1;
    const totalBatches = Math.ceil(termsData.length / batchSize);

    console.log(`   🔄 Processing terms batch ${batchNumber}/${totalBatches} (${batch.length} items)`);

    for (const term of batch) {
      try {
        if (skipExisting) {
          const existing = await db.select()
            .from(terms)
            .where(eq(terms.name, term.name))
            .limit(1);

          if (existing.length > 0) {
            continue;
          }
        }

        // Prepare term data according to schema
        const termData = {
          id: term.id,
          name: term.name,
          definition: term.definition,
          shortDefinition: term.shortDefinition || null,
          categoryId: term.categoryId,
          characteristics: term.characteristics ? [term.characteristics] : null,
          visualUrl: term.visualUrl || null,
          visualCaption: term.visualCaption || null,
          mathFormulation: term.mathFormulation || null
        };

        // Insert the term
        await db.insert(terms).values(termData);

        // Handle subcategory relationships
        if (term.subcategoryIds && Array.isArray(term.subcategoryIds)) {
          for (const subcategoryId of term.subcategoryIds) {
            try {
              await db.insert(termSubcategories).values({
                termId: term.id,
                subcategoryId: subcategoryId
              });
            } catch (subError) {
              // Log but don't fail the entire term import
              console.warn(`Warning: Could not link term ${term.name} to subcategory ${subcategoryId}`);
            }
          }
        }

        imported++;

      } catch (error) {
        const errorMsg = `Term ${term.name}: ${error instanceof Error ? error.message : String(error)}`;
        errors.push(errorMsg);
      }
    }
  }

  return { imported, errors };
}

/**
 * Import the latest processed file using batching
 */
export async function importLatestProcessedFile(options: ImportOptions = {}): Promise<ImportResult> {
  const tempDir = path.join(process.cwd(), 'temp');
  
  if (!fs.existsSync(tempDir)) {
    throw new Error('No temp directory found');
  }
  
  // Find the latest processed file
  const processedFiles = fs.readdirSync(tempDir)
    .filter(f => f.includes('processed_chunked_') && f.endsWith('.json'))
    .map(f => ({
      name: f,
      path: path.join(tempDir, f),
      stats: fs.statSync(path.join(tempDir, f))
    }))
    .sort((a, b) => b.stats.mtime.getTime() - a.stats.mtime.getTime());
  
  if (processedFiles.length === 0) {
    throw new Error('No processed files found');
  }
  
  const latestFile = processedFiles[0];
  console.log(`📁 Using latest processed file: ${latestFile.name}`);
  console.log(`📊 File size: ${(latestFile.stats.size / (1024 * 1024)).toFixed(2)} MB`);
  
  return await batchedImportProcessedData(latestFile.path, options);
} 