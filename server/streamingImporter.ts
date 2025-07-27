/**
 * Streaming Importer for Very Large JSON Files
 * Handles importing massive JSON files by streaming and parsing them incrementally
 */

import fs from 'node:fs';
import path from 'node:path';
import { Transform } from 'node:stream';
import { and, eq } from 'drizzle-orm';
import { categories, subcategories, termSubcategories, terms } from '../shared/schema';
import { db } from './db';

import logger from './utils/logger';
interface StreamingImportOptions {
  batchSize?: number;
  skipExisting?: boolean;
  enableProgress?: boolean;
}

interface StreamingImportResult {
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
 * Simple streaming JSON parser for large files
 * This will parse the file in chunks and extract data without loading everything into memory
 */
class StreamingJSONParser extends Transform {
  private buffer: string = '';
  private depth: number = 0;
  private inArray: boolean = false;
  private currentObject: string = '';
  private objectDepth: number = 0;
  private arrayName: string = '';
  private objectCount: number = 0;

  constructor(private onData: (type: string, data: any) => void) {
    super({ objectMode: true });
  }

  _transform(chunk: Buffer, _encoding: string, callback: Function) {
    this.buffer += chunk.toString();
    this.parseBuffer();
    callback();
  }

  private parseBuffer() {
    let i = 0;
    while (i < this.buffer.length) {
      const char = this.buffer[i];

      if (char === '"' && this.buffer[i - 1] !== '\\') {
        // Look for array names
        const match = this.buffer
          .substring(i)
          .match(/^"(categories|subcategories|terms)"\s*:\s*\[/);
        if (match) {
          this.arrayName = match[1];
          this.inArray = true;
          this.objectCount = 0;
          i += match[0].length;
          continue;
        }
      }

      if (this.inArray) {
        if (char === '{') {
          this.objectDepth++;
          if (this.objectDepth === 1) {
            this.currentObject = '';
          }
        }

        if (this.objectDepth > 0) {
          this.currentObject += char;
        }

        if (char === '}') {
          this.objectDepth--;
          if (this.objectDepth === 0) {
            // Complete object found
            try {
              const obj = JSON.parse(this.currentObject);
              this.onData(this.arrayName, obj);
              this.objectCount++;

              if (this.objectCount % 100 === 0) {
                logger.info(`   📈 Parsed ${this.objectCount} ${this.arrayName}`);
              }
            } catch (e) {
              logger.warn(`Warning: Could not parse object in ${this.arrayName}:`, e);
            }
            this.currentObject = '';
          }
        }

        if (char === ']' && this.objectDepth === 0) {
          this.inArray = false;
          this.arrayName = '';
          logger.info(`✅ Completed parsing ${this.objectCount} ${this.arrayName}`);
        }
      }

      i++;
    }

    // Keep only the last part of the buffer that might contain incomplete data
    if (this.inArray && this.objectDepth === 0) {
      const lastBrace = this.buffer.lastIndexOf('}');
      if (lastBrace > -1) {
        this.buffer = this.buffer.substring(lastBrace + 1);
      }
    } else if (!this.inArray) {
      this.buffer = this.buffer.substring(Math.max(0, this.buffer.length - 1000));
    }
  }
}

/**
 * Import data using streaming to handle very large files
 */
export async function streamingImportProcessedData(
  filePath: string,
  options: StreamingImportOptions = {}
): Promise<StreamingImportResult> {
  const startTime = Date.now();
  const { batchSize = 500, skipExisting = true, enableProgress = true } = options;

  logger.info(`🌊 Starting streaming import from: ${filePath}`);
  logger.info(`   📦 Batch size: ${batchSize}`);

  const result: StreamingImportResult = {
    success: false,
    imported: { categories: 0, subcategories: 0, terms: 0 },
    errors: [],
    duration: 0,
  };

  try {
    // Check file exists
    if (!fs.existsSync(filePath)) {
      throw new Error(`File not found: ${filePath}`);
    }

    const stats = fs.statSync(filePath);
    logger.info(`📊 File size: ${(stats.size / (1024 * 1024)).toFixed(2)} MB`);

    // Create category ID mapping for reference integrity
    const categoryIdMap = new Map<string, string>();

    // Batch storage
    let categoriesBatch: unknown[] = [];
    let subcategoriesBatch: unknown[] = [];
    let termsBatch: unknown[] = [];

    // Data handler for streaming parser
    const handleData = async (type: string, data: any) => {
      if (type === 'categories') {
        categoriesBatch.push(data);
        if (categoriesBatch.length >= batchSize) {
          const imported = await processCategoriesBatch(
            categoriesBatch,
            skipExisting,
            categoryIdMap
          );
          result.imported.categories += imported.count;
          result.errors.push(...imported.errors);
          categoriesBatch = [];
        }
      } else if (type === 'subcategories') {
        subcategoriesBatch.push(data);
        if (subcategoriesBatch.length >= batchSize) {
          const imported = await processSubcategoriesBatch(
            subcategoriesBatch,
            skipExisting,
            categoryIdMap
          );
          result.imported.subcategories += imported.count;
          result.errors.push(...imported.errors);
          subcategoriesBatch = [];
        }
      } else if (type === 'terms') {
        termsBatch.push(data);
        if (termsBatch.length >= batchSize) {
          const imported = await processTermsBatch(termsBatch, skipExisting);
          result.imported.terms += imported.count;
          result.errors.push(...imported.errors);
          termsBatch = [];
        }
      }
    };

    // Create streaming parser
    const parser = new StreamingJSONParser(handleData);

    // Process the file in streaming mode
    await new Promise<void>((resolve, reject) => {
      const readStream = fs.createReadStream(filePath, { encoding: 'utf8' });

      readStream.on('error', reject);
      parser.on('error', reject);
      parser.on('finish', resolve);

      readStream.pipe(parser);
    });

    // Process remaining batches
    if (categoriesBatch.length > 0) {
      const imported = await processCategoriesBatch(categoriesBatch, skipExisting, categoryIdMap);
      result.imported.categories += imported.count;
      result.errors.push(...imported.errors);
    }

    if (subcategoriesBatch.length > 0) {
      const imported = await processSubcategoriesBatch(
        subcategoriesBatch,
        skipExisting,
        categoryIdMap
      );
      result.imported.subcategories += imported.count;
      result.errors.push(...imported.errors);
    }

    if (termsBatch.length > 0) {
      const imported = await processTermsBatch(termsBatch, skipExisting);
      result.imported.terms += imported.count;
      result.errors.push(...imported.errors);
    }

    result.success = true;
    result.duration = Date.now() - startTime;

    logger.info(`\n✅ Streaming import completed in ${(result.duration / 1000).toFixed(2)}s:`);
    logger.info(`   📂 ${result.imported.categories} categories imported`);
    logger.info(`   📋 ${result.imported.subcategories} subcategories imported`);
    logger.info(`   📄 ${result.imported.terms} terms imported`);
    logger.info(`   ❌ ${result.errors.length} errors`);

    return result;
  } catch (error) {
    result.success = false;
    result.duration = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : String(error);
    result.errors.push(errorMessage);

    logger.error(`❌ Streaming import failed: ${errorMessage}`);
    return result;
  }
}

/**
 * Process a batch of categories
 */
async function processCategoriesBatch(
  batch: unknown[],
  skipExisting: boolean,
  categoryIdMap: Map<string, string>
): Promise<{ count: number; errors: string[] }> {
  let count = 0;
  const errors: string[] = [];

  logger.info(`   🔄 Processing ${batch.length} categories...`);

  for (const category of batch) {
    try {
      if (skipExisting) {
        const existing = await db
          .select()
          .from(categories)
          .where(eq(categories.name, category.name))
          .limit(1);

        if (existing.length > 0) {
          categoryIdMap.set(category.id, existing[0].id);
          continue;
        }
      }

      const [inserted] = await db
        .insert(categories)
        .values({
          id: category.id,
          name: category.name,
          description: category.description || null,
        })
        .returning({ id: categories.id });

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
 * Process a batch of subcategories
 */
async function processSubcategoriesBatch(
  batch: unknown[],
  skipExisting: boolean,
  categoryIdMap: Map<string, string>
): Promise<{ count: number; errors: string[] }> {
  let count = 0;
  const errors: string[] = [];

  logger.info(`   🔄 Processing ${batch.length} subcategories...`);

  for (const subcategory of batch) {
    try {
      const mappedCategoryId = categoryIdMap.get(subcategory.categoryId);
      if (!mappedCategoryId) {
        errors.push(
          `Subcategory ${subcategory.name}: category ID ${subcategory.categoryId} not found`
        );
        continue;
      }

      if (skipExisting) {
        const existing = await db
          .select()
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
        categoryId: mappedCategoryId,
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
 * Process a batch of terms
 */
async function processTermsBatch(
  batch: unknown[],
  skipExisting: boolean
): Promise<{ count: number; errors: string[] }> {
  let count = 0;
  const errors: string[] = [];

  logger.info(`   🔄 Processing ${batch.length} terms...`);

  for (const term of batch) {
    try {
      if (skipExisting) {
        const existing = await db.select().from(terms).where(eq(terms.name, term.name)).limit(1);

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
        mathFormulation: term.mathFormulation || null,
      };

      // Insert the term
      await db.insert(terms).values(termData);

      // Handle subcategory relationships
      if (term.subcategoryIds && Array.isArray(term.subcategoryIds)) {
        for (const subcategoryId of term.subcategoryIds) {
          try {
            await db.insert(termSubcategories).values({
              termId: term.id,
              subcategoryId: subcategoryId,
            });
          } catch (_subError) {
            // Log but don't fail the entire term import
            logger.warn(
              `Warning: Could not link term ${term.name} to subcategory ${subcategoryId}`
            );
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
 * Import the latest processed file using streaming
 */
export async function streamingImportLatestProcessedFile(
  options: StreamingImportOptions = {}
): Promise<StreamingImportResult> {
  const tempDir = path.join(process.cwd(), 'temp');

  if (!fs.existsSync(tempDir)) {
    throw new Error('No temp directory found');
  }

  // Find the latest processed file
  const processedFiles = fs
    .readdirSync(tempDir)
    .filter(f => f.includes('processed_chunked_') && f.endsWith('.json'))
    .map(f => ({
      name: f,
      path: path.join(tempDir, f),
      stats: fs.statSync(path.join(tempDir, f)),
    }))
    .sort((a, b) => b.stats.mtime.getTime() - a.stats.mtime.getTime());

  if (processedFiles.length === 0) {
    throw new Error('No processed files found');
  }

  const latestFile = processedFiles[0];
  logger.info(`📁 Using latest processed file: ${latestFile.name}`);
  logger.info(`📊 File size: ${(latestFile.stats.size / (1024 * 1024)).toFixed(2)} MB`);

  return await streamingImportProcessedData(latestFile.path, options);
}
