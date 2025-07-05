/**
 * Excel Import Job Processor
 * Handles long-running Excel file imports with progress tracking
 */

import { Job } from 'bullmq';
import { 
  ExcelImportJobData, 
  ExcelImportJobResult,
  JobProgressUpdate 
} from '../types';
import { AdvancedExcelParser, importComplexTerms } from '../../advancedExcelParser';
import { parseExcelFile, importToDatabase } from '../../excelParser';
import { CheckpointManager } from '../../checkpointManager';
import { log as logger } from '../../utils/logger';

export async function excelImportProcessor(
  job: Job<ExcelImportJobData>
): Promise<ExcelImportJobResult> {
  const startTime = Date.now();
  const { fileBuffer, fileName, fileSize, importOptions, userId, requestId } = job.data;

  logger.info(`Starting Excel import job ${job.id} for file: ${fileName} (${(fileSize / 1024 / 1024).toFixed(2)} MB)`);

  let checkpointManager: CheckpointManager | null = null;
  const result: ExcelImportJobResult = {
    termsImported: 0,
    categoriesImported: 0,
    sectionsProcessed: 0,
    errors: [],
    warnings: [],
    duration: 0,
  };

  try {
    // Update job progress
    await job.updateProgress({
      progress: 5,
      message: 'Initializing import process',
      stage: 'initialization',
    } as JobProgressUpdate);

    // Initialize checkpoint manager if enabled
    if (importOptions.checkpointEnabled) {
      checkpointManager = new CheckpointManager(`excel-import-${job.id}`);
      await checkpointManager.initialize();
      result.checkpointId = checkpointManager.checkpointId;
    }

    // Choose parser based on mode
    if (importOptions.mode === 'advanced' || fileSize > 1024 * 1024) { // > 1MB
      // Use advanced parser for complex Excel files
      await job.updateProgress({
        progress: 10,
        message: 'Using advanced parser for 42-section structure',
        stage: 'parsing',
      } as JobProgressUpdate);

      const advancedParser = new AdvancedExcelParser();
      
      // Set up progress tracking for parser
      const updateInterval = setInterval(async () => {
        const parserProgress = advancedParser.getProgress?.() || 0;
        await job.updateProgress({
          progress: 10 + (parserProgress * 0.5), // 10-60% for parsing
          message: `Parsing Excel file: ${Math.round(parserProgress * 100)}%`,
          stage: 'parsing',
        } as JobProgressUpdate);
      }, 1000);

      try {
        // Parse Excel file
        const parsedTerms = await advancedParser.parseComplexExcel(
          fileBuffer,
          {
            enableAI: importOptions.enableAI,
            aiMode: importOptions.aiMode,
            userId,
            checkpointManager,
          }
        );

        clearInterval(updateInterval);

        if (!parsedTerms || parsedTerms.length === 0) {
          throw new Error('No valid terms found in the Excel file');
        }

        result.termsImported = parsedTerms.length;
        result.sectionsProcessed = parsedTerms.length * 42; // 42 sections per term

        await job.updateProgress({
          progress: 60,
          message: `Parsed ${parsedTerms.length} terms, starting database import`,
          stage: 'importing',
          details: {
            termsFound: parsedTerms.length,
            sectionsPerTerm: 42,
          },
        } as JobProgressUpdate);

        // Import to database in batches
        const batchSize = importOptions.batchSize || 50;
        let imported = 0;

        for (let i = 0; i < parsedTerms.length; i += batchSize) {
          const batch = parsedTerms.slice(i, i + batchSize);
          
          try {
            await importComplexTerms(batch, { checkpointManager });
            imported += batch.length;

            // Update progress
            const importProgress = imported / parsedTerms.length;
            await job.updateProgress({
              progress: 60 + (importProgress * 35), // 60-95% for importing
              message: `Imported ${imported}/${parsedTerms.length} terms`,
              stage: 'importing',
              details: {
                imported,
                total: parsedTerms.length,
                currentBatch: Math.floor(i / batchSize) + 1,
                totalBatches: Math.ceil(parsedTerms.length / batchSize),
              },
            } as JobProgressUpdate);

            // Save checkpoint
            if (checkpointManager) {
              await checkpointManager.saveCheckpoint({
                imported,
                lastProcessedIndex: i + batch.length - 1,
                errors: result.errors,
                warnings: result.warnings,
              });
            }
          } catch (error) {
            logger.error(`Error importing batch ${i / batchSize + 1}:`, error);
            result.errors.push({
              row: i + 1,
              error: error instanceof Error ? error.message : 'Unknown error',
            });
          }
        }

        result.termsImported = imported;

      } finally {
        clearInterval(updateInterval);
      }

    } else {
      // Use basic parser for simple Excel files
      await job.updateProgress({
        progress: 10,
        message: 'Using basic parser for simple structure',
        stage: 'parsing',
      } as JobProgressUpdate);

      const parsedData = await parseExcelFile(fileBuffer);
      
      if (!parsedData || parsedData.terms.length === 0) {
        throw new Error('No valid data found in the Excel file');
      }

      await job.updateProgress({
        progress: 50,
        message: `Parsed ${parsedData.terms.length} terms, starting import`,
        stage: 'importing',
      } as JobProgressUpdate);

      // Import to database
      const dbResult = await importToDatabase(parsedData);
      
      result.termsImported = dbResult.termsImported;
      result.categoriesImported = dbResult.categoriesImported;
    }

    // Finalize
    await job.updateProgress({
      progress: 95,
      message: 'Finalizing import',
      stage: 'finalizing',
    } as JobProgressUpdate);

    // Clean up checkpoint if successful
    if (checkpointManager) {
      await checkpointManager.completeCheckpoint();
    }

    result.duration = Date.now() - startTime;

    await job.updateProgress({
      progress: 100,
      message: 'Import completed successfully',
      stage: 'completed',
      details: {
        termsImported: result.termsImported,
        categoriesImported: result.categoriesImported,
        sectionsProcessed: result.sectionsProcessed,
        duration: result.duration,
      },
    } as JobProgressUpdate);

    logger.info(`Excel import job ${job.id} completed successfully`, result);
    return result;

  } catch (error) {
    logger.error(`Excel import job ${job.id} failed:`, error);
    
    // Save error state to checkpoint
    if (checkpointManager) {
      await checkpointManager.saveCheckpoint({
        error: error instanceof Error ? error.message : 'Unknown error',
        lastState: result,
      });
    }

    throw error;
  }
}