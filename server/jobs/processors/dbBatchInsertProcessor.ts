/**
 * Database Batch Insert Job Processor
 * Handles batch database operations with conflict resolution
 */

import type { Job } from 'bullmq';
import { db } from '../../db';
import { log as logger } from '../../utils/logger';
import type { DBBatchInsertJobData, DBBatchInsertJobResult } from '../types';

export async function dbBatchInsertProcessor(
  job: Job<DBBatchInsertJobData>
): Promise<DBBatchInsertJobResult> {
  const startTime = Date.now();
  const { table, records, conflictResolution = 'ignore', batchSize = 1000, userId } = job.data;

  logger.info(
    `Starting DB batch insert job ${job.id} for table: ${table} with ${records.length} records`
  );

  const result: DBBatchInsertJobResult = {
    inserted: 0,
    updated: 0,
    failed: 0,
    errors: [],
    duration: 0,
  };

  try {
    // Validate table name (security check)
    const allowedTables = [
      'terms',
      'categories',
      'term_sections',
      'enhanced_terms',
      'enhanced_term_sections',
      'user_progress',
      'analytics_events',
      'search_queries',
    ];

    if (!allowedTables.includes(table)) {
      throw new Error(`Table '${table}' is not allowed for batch operations`);
    }

    // Process records in batches
    const totalBatches = Math.ceil(records.length / batchSize);
    let processedRecords = 0;

    for (let batchIndex = 0; batchIndex < totalBatches; batchIndex++) {
      const batchStart = batchIndex * batchSize;
      const batchEnd = Math.min(batchStart + batchSize, records.length);
      const batch = records.slice(batchStart, batchEnd);

      await job.updateProgress({
        progress: (batchIndex / totalBatches) * 90,
        message: `Processing batch ${batchIndex + 1}/${totalBatches}`,
        stage: 'processing',
        details: {
          currentBatch: batchIndex + 1,
          totalBatches,
          processedRecords,
          totalRecords: records.length,
        },
      });

      try {
        // Execute batch operation based on conflict resolution strategy
        const batchResult = await executeBatchOperation(table, batch, conflictResolution);

        result.inserted += batchResult.inserted;
        result.updated += batchResult.updated;
        processedRecords += batch.length;

        logger.info(`Batch ${batchIndex + 1} completed:`, {
          inserted: batchResult.inserted,
          updated: batchResult.updated,
          processed: processedRecords,
          total: records.length,
        });
      } catch (batchError) {
        logger.error(`Batch ${batchIndex + 1} failed:`, {
          error: batchError instanceof Error ? batchError.message : String(batchError),
        });

        // Try to process records individually to identify specific failures
        for (const record of batch) {
          try {
            await executeBatchOperation(table, [record], conflictResolution);
            result.inserted++;
            processedRecords++;
          } catch (recordError) {
            result.failed++;
            result.errors.push({
              record,
              error: recordError instanceof Error ? recordError.message : 'Unknown error',
            });
          }
        }
      }
    }

    // Final validation and cleanup
    await job.updateProgress({
      progress: 95,
      message: 'Finalizing batch operation',
      stage: 'finalization',
    });

    result.duration = Date.now() - startTime;

    await job.updateProgress({
      progress: 100,
      message: 'Batch insert completed',
      stage: 'completed',
      details: {
        inserted: result.inserted,
        updated: result.updated,
        failed: result.failed,
        duration: result.duration,
      },
    });

    logger.info(`DB batch insert job ${job.id} completed`, result);
    return result;
  } catch (error) {
    logger.error(`DB batch insert job ${job.id} failed:`, {
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
}

/**
 * Execute batch operation with appropriate conflict resolution
 */
async function executeBatchOperation(
  table: string,
  records: unknown[],
  conflictResolution: 'ignore' | 'update' | 'error'
): Promise<{ inserted: number; updated: number }> {
  switch (table) {
    case 'terms':
      return await handleTermsBatch(records, conflictResolution);

    case 'categories':
      return await handleCategoriesBatch(records, conflictResolution);

    case 'term_sections':
      return await handleTermSectionsBatch(records, conflictResolution);

    case 'enhanced_terms':
      return await handleEnhancedTermsBatch(records, conflictResolution);

    case 'enhanced_term_sections':
      return await handleEnhancedTermSectionsBatch(records, conflictResolution);

    case 'user_progress':
      return await handleUserProgressBatch(records, conflictResolution);

    case 'analytics_events':
      return await handleAnalyticsEventsBatch(records, conflictResolution);

    case 'search_queries':
      return await handleSearchQueriesBatch(records, conflictResolution);

    default:
      throw new Error(`Unsupported table: ${table}`);
  }
}

/**
 * Handle terms table batch operations
 */
async function handleTermsBatch(
  records: unknown[],
  conflictResolution: 'ignore' | 'update' | 'error'
): Promise<{ inserted: number; updated: number }> {
  const { terms } = await import('../../../shared/enhancedSchema');

  if (conflictResolution === 'ignore') {
    // Insert only new records, ignore conflicts
    const insertedRecords = await db
      .insert(terms)
      .values(records)
      .onConflictDoNothing()
      .returning();

    return { inserted: insertedRecords.length, updated: 0 };
  }

  if (conflictResolution === 'update') {
    // Upsert: insert new, update existing
    let inserted = 0;
    let updated = 0;

    for (const record of records) {
      const result = await db
        .insert(terms)
        .values(record)
        .onConflictDoUpdate({
          target: [terms.id],
          set: {
            name: record.name,
            definition: record.definition,
            categoryId: record.categoryId,
            updatedAt: new Date(),
          },
        })
        .returning();

      if (result.length > 0) {
        // Check if this was an insert or update by checking created_at vs updated_at
        const createdAt = new Date((result[0] as any).createdAt);
        const updatedAt = new Date((result[0] as any).updatedAt);

        if (Math.abs(createdAt.getTime() - updatedAt.getTime()) < 1000) {
          inserted++;
        } else {
          updated++;
        }
      }
    }

    return { inserted, updated };
  }

  if (conflictResolution === 'error') {
    // Strict insert, fail on conflicts
    const insertedRecords = await db.insert(terms).values(records).returning();

    return { inserted: insertedRecords.length, updated: 0 };
  }

  throw new Error(`Unsupported conflict resolution: ${conflictResolution}`);
}

/**
 * Handle categories table batch operations
 */
async function handleCategoriesBatch(
  records: unknown[],
  conflictResolution: 'ignore' | 'update' | 'error'
): Promise<{ inserted: number; updated: number }> {
  const { categories } = await import('../../../shared/enhancedSchema');

  if (conflictResolution === 'ignore') {
    const insertedRecords = await db
      .insert(categories)
      .values(records)
      .onConflictDoNothing()
      .returning();

    return { inserted: insertedRecords.length, updated: 0 };
  }

  // Add similar logic for other conflict resolution strategies
  // ... (implement as needed)

  return { inserted: 0, updated: 0 };
}

/**
 * Handle term_sections table batch operations
 */
async function handleTermSectionsBatch(
  records: unknown[],
  conflictResolution: 'ignore' | 'update' | 'error'
): Promise<{ inserted: number; updated: number }> {
  const { termSections } = await import('../../../shared/enhancedSchema');

  if (conflictResolution === 'ignore') {
    const insertedRecords = await db
      .insert(termSections)
      .values(records)
      .onConflictDoNothing()
      .returning();

    return { inserted: insertedRecords.length, updated: 0 };
  }

  // Add similar logic for other conflict resolution strategies
  // ... (implement as needed)

  return { inserted: 0, updated: 0 };
}

/**
 * Handle enhanced_terms table batch operations
 */
async function handleEnhancedTermsBatch(
  _records: unknown[],
  _conflictResolution: 'ignore' | 'update' | 'error'
): Promise<{ inserted: number; updated: number }> {
  // Implementation for enhanced terms
  return { inserted: 0, updated: 0 };
}

/**
 * Handle enhanced_term_sections table batch operations
 */
async function handleEnhancedTermSectionsBatch(
  _records: unknown[],
  _conflictResolution: 'ignore' | 'update' | 'error'
): Promise<{ inserted: number; updated: number }> {
  // Implementation for enhanced term sections
  return { inserted: 0, updated: 0 };
}

/**
 * Handle user_progress table batch operations
 */
async function handleUserProgressBatch(
  _records: unknown[],
  _conflictResolution: 'ignore' | 'update' | 'error'
): Promise<{ inserted: number; updated: number }> {
  // Implementation for user progress
  return { inserted: 0, updated: 0 };
}

/**
 * Handle analytics_events table batch operations
 */
async function handleAnalyticsEventsBatch(
  _records: unknown[],
  _conflictResolution: 'ignore' | 'update' | 'error'
): Promise<{ inserted: number; updated: number }> {
  // Implementation for analytics events
  return { inserted: 0, updated: 0 };
}

/**
 * Handle search_queries table batch operations
 */
async function handleSearchQueriesBatch(
  _records: unknown[],
  _conflictResolution: 'ignore' | 'update' | 'error'
): Promise<{ inserted: number; updated: number }> {
  // Implementation for search queries
  return { inserted: 0, updated: 0 };
}
