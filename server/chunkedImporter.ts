/**
 * Chunked Importer for Large Datasets
 * Handles importing by first splitting large JSON files into chunks, then processing them
 */

import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';
import { db } from './db';
import { categories, subcategories, terms, termSubcategories } from '../shared/schema';
import { eq, and } from 'drizzle-orm';

interface ChunkedImportOptions {
  chunkSize?: number;
  skipExisting?: boolean;
  enableProgress?: boolean;
}

interface ChunkedImportResult {
  success: boolean;
  imported: {
    categories: number;
    subcategories: number;
    terms: number;
  };
  errors: string[];
  duration: number;
  chunksProcessed: number;
}

/**
 * Split large JSON file into manageable chunks using Python
 */
async function splitLargeJsonFile(
  filePath: string,
  chunkSize: number = 1000
): Promise<{ success: boolean; outputDir: string; error?: string }> {
  const tempDir = path.join(process.cwd(), 'temp');
  const chunksDir = path.join(tempDir, `chunks_${Date.now()}`);
  
  console.log(`🔪 Splitting large JSON file into chunks...`);
  console.log(`   📁 Input: ${filePath}`);
  console.log(`   📁 Output: ${chunksDir}`);
  console.log(`   📦 Chunk size: ${chunkSize}`);
  
  const venvPath = path.join(process.cwd(), 'venv', 'bin', 'python');
  const scriptPath = 'server/python/json_splitter.py';
  
  const command = [
    venvPath,
    scriptPath,
    `--input "${filePath}"`,
    `--output "${chunksDir}"`,
    `--chunk-size ${chunkSize}`
  ].join(' ');
  
  return new Promise((resolve) => {
    exec(command, { maxBuffer: 1024 * 1024 * 10 }, (error, stdout, stderr) => {
      if (error) {
        console.error(`❌ JSON splitting error: ${error.message}`);
        resolve({ success: false, outputDir: '', error: error.message });
        return;
      }
      
      if (stderr) {
        console.warn(`⚠️  JSON splitter warnings: ${stderr}`);
      }
      
      try {
        const result = JSON.parse(stdout);
        if (result.success) {
          console.log(`✅ JSON splitting complete: ${result.chunks_created} chunks created`);
          resolve({ success: true, outputDir: result.output_dir });
        } else {
          resolve({ success: false, outputDir: '', error: result.error });
        }
      } catch (parseError) {
        console.error(`❌ Error parsing splitter output: ${parseError}`);
        resolve({ success: false, outputDir: '', error: 'Failed to parse splitter output' });
      }
    });
  });
}

/**
 * Import data using chunked approach
 */
export async function chunkedImportProcessedData(
  filePath: string,
  options: ChunkedImportOptions = {}
): Promise<ChunkedImportResult> {
  const startTime = Date.now();
  const { chunkSize = 1000, skipExisting = true, enableProgress = true } = options;

  console.log(`🧩 Starting chunked import from: ${filePath}`);

  const result: ChunkedImportResult = {
    success: false,
    imported: { categories: 0, subcategories: 0, terms: 0 },
    errors: [],
    duration: 0,
    chunksProcessed: 0
  };

  try {
    // Check file exists
    if (!fs.existsSync(filePath)) {
      throw new Error(`File not found: ${filePath}`);
    }

    const stats = fs.statSync(filePath);
    console.log(`📊 File size: ${(stats.size / (1024 * 1024)).toFixed(2)} MB`);

    // Split the large file into chunks
    const splitResult = await splitLargeJsonFile(filePath, chunkSize);
    if (!splitResult.success) {
      throw new Error(`Failed to split file: ${splitResult.error}`);
    }

    const chunksDir = splitResult.outputDir;
    
    // Get all chunk files
    const chunkFiles = fs.readdirSync(chunksDir)
      .filter(f => f.endsWith('.json'))
      .sort((a, b) => {
        // Sort to process categories first, then subcategories, then terms
        if (a.startsWith('categories') && !b.startsWith('categories')) return -1;
        if (!a.startsWith('categories') && b.startsWith('categories')) return 1;
        if (a.startsWith('subcategories') && b.startsWith('terms')) return -1;
        if (a.startsWith('terms') && b.startsWith('subcategories')) return 1;
        return a.localeCompare(b);
      });

    console.log(`📦 Found ${chunkFiles.length} chunks to process`);

    // Create category ID mapping for reference integrity
    const categoryIdMap = new Map<string, string>();

    // Process each chunk
    for (let i = 0; i < chunkFiles.length; i++) {
      const chunkFile = chunkFiles[i];
      const chunkPath = path.join(chunksDir, chunkFile);
      
      console.log(`\n🔄 Processing chunk ${i + 1}/${chunkFiles.length}: ${chunkFile}`);
      
      try {
        const chunkData = JSON.parse(fs.readFileSync(chunkPath, 'utf8'));
        
        // Process based on chunk type
        if (chunkData.categories) {
          const imported = await processCategoriesChunk(chunkData.categories, skipExisting, categoryIdMap);
          result.imported.categories += imported.count;
          result.errors.push(...imported.errors);
        }
        
        if (chunkData.subcategories) {
          const imported = await processSubcategoriesChunk(chunkData.subcategories, skipExisting, categoryIdMap);
          result.imported.subcategories += imported.count;
          result.errors.push(...imported.errors);
        }
        
        if (chunkData.terms) {
          const imported = await processTermsChunk(chunkData.terms, skipExisting);
          result.imported.terms += imported.count;
          result.errors.push(...imported.errors);
        }
        
        result.chunksProcessed++;
        
      } catch (chunkError) {
        const errorMsg = `Error processing chunk ${chunkFile}: ${chunkError instanceof Error ? chunkError.message : String(chunkError)}`;
        result.errors.push(errorMsg);
        console.error(`❌ ${errorMsg}`);
      }
    }

    // Clean up chunks directory
    try {
      fs.rmSync(chunksDir, { recursive: true, force: true });
      console.log('🧹 Cleaned up temporary chunks');
    } catch (cleanupError) {
      console.warn(`⚠️  Could not clean up chunks directory: ${cleanupError}`);
    }

    result.success = true;
    result.duration = Date.now() - startTime;

    console.log(`\n✅ Chunked import completed in ${(result.duration / 1000).toFixed(2)}s:`);
    console.log(`   📂 ${result.imported.categories} categories imported`);
    console.log(`   📋 ${result.imported.subcategories} subcategories imported`);
    console.log(`   📄 ${result.imported.terms} terms imported`);
    console.log(`   🔄 ${result.chunksProcessed} chunks processed`);
    console.log(`   ❌ ${result.errors.length} errors`);

    return result;

  } catch (error) {
    result.success = false;
    result.duration = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : String(error);
    result.errors.push(errorMessage);
    
    console.error(`❌ Chunked import failed: ${errorMessage}`);
    return result;
  }
}

/**
 * Process a categories chunk
 */
async function processCategoriesChunk(
  categoriesData: any[],
  skipExisting: boolean,
  categoryIdMap: Map<string, string>
): Promise<{ count: number; errors: string[] }> {
  let count = 0;
  const errors: string[] = [];

  console.log(`   📂 Processing ${categoriesData.length} categories...`);

  for (const category of categoriesData) {
    try {
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
        id: category.id,
        name: category.name,
        description: category.description || null
      }).returning({ id: categories.id });

      categoryIdMap.set(category.id, inserted.id);
      count++;

    } catch (error) {
      const errorMsg = `Category ${category.name}: ${error instanceof Error ? error.message : String(error)}`;
      errors.push(errorMsg);
    }
  }

  return { count, errors };
}

/**
 * Process a subcategories chunk
 */
async function processSubcategoriesChunk(
  subcategoriesData: any[],
  skipExisting: boolean,
  categoryIdMap: Map<string, string>
): Promise<{ count: number; errors: string[] }> {
  let count = 0;
  const errors: string[] = [];

  console.log(`   📋 Processing ${subcategoriesData.length} subcategories...`);

  for (const subcategory of subcategoriesData) {
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

      count++;

    } catch (error) {
      const errorMsg = `Subcategory ${subcategory.name}: ${error instanceof Error ? error.message : String(error)}`;
      errors.push(errorMsg);
    }
  }

  return { count, errors };
}

/**
 * Process a terms chunk
 */
async function processTermsChunk(
  termsData: any[],
  skipExisting: boolean
): Promise<{ count: number; errors: string[] }> {
  let count = 0;
  const errors: string[] = [];

  console.log(`   📄 Processing ${termsData.length} terms...`);

  for (const term of termsData) {
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

      count++;

    } catch (error) {
      const errorMsg = `Term ${term.name}: ${error instanceof Error ? error.message : String(error)}`;
      errors.push(errorMsg);
    }
  }

  return { count, errors };
}

/**
 * Import the latest processed file using chunked approach
 */
export async function chunkedImportLatestProcessedFile(options: ChunkedImportOptions = {}): Promise<ChunkedImportResult> {
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
  
  return await chunkedImportProcessedData(latestFile.path, options);
} 