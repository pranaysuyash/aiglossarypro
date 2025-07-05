/**
 * Excel Parse Job Processor
 * Handles parsing of Excel files without importing to database
 */

import { Job } from 'bullmq';
import { AdvancedExcelParser } from '../../advancedExcelParser';
import { parseExcelFile } from '../../excelParser';
import { log as logger } from '../../utils/logger';

interface ExcelParseJobData {
  fileBuffer: Buffer;
  fileName: string;
  parseMode: 'basic' | 'advanced';
  validateOnly?: boolean;
  userId?: string;
}

interface ExcelParseJobResult {
  termsFound: number;
  categoriesFound: number;
  sectionsFound?: number;
  validationErrors?: Array<{ row: number; column: string; error: string }>;
  preview?: any[];
  duration: number;
}

export async function excelParseProcessor(
  job: Job<ExcelParseJobData>
): Promise<ExcelParseJobResult> {
  const startTime = Date.now();
  const { fileBuffer, fileName, parseMode, validateOnly } = job.data;

  logger.info(`Starting Excel parse job ${job.id} for file: ${fileName}`);

  try {
    await job.updateProgress({ progress: 10, message: 'Starting parse operation' });

    if (parseMode === 'advanced') {
      const parser = new AdvancedExcelParser();
      const parsedTerms = await parser.parseComplexExcel(fileBuffer, {
        validateOnly,
        enableAI: false, // Disable AI for parse-only operations
      });

      await job.updateProgress({ progress: 80, message: 'Parse complete, preparing results' });

      const result: ExcelParseJobResult = {
        termsFound: parsedTerms.length,
        categoriesFound: new Set(parsedTerms.flatMap(t => t.categories.main)).size,
        sectionsFound: parsedTerms.length * 42,
        preview: validateOnly ? [] : parsedTerms.slice(0, 5).map(t => ({
          name: t.name,
          categories: t.categories,
          sectionCount: t.sections.size,
        })),
        duration: Date.now() - startTime,
      };

      if (validateOnly) {
        // Perform validation
        const errors: Array<{ row: number; column: string; error: string }> = [];
        parsedTerms.forEach((term, index) => {
          if (!term.name) {
            errors.push({ row: index + 2, column: 'Name', error: 'Term name is required' });
          }
          if (term.categories.main.length === 0) {
            errors.push({ row: index + 2, column: 'Categories', error: 'At least one category is required' });
          }
        });
        result.validationErrors = errors;
      }

      await job.updateProgress({ progress: 100, message: 'Parse completed' });
      return result;

    } else {
      // Basic parse mode
      const parsedData = await parseExcelFile(fileBuffer);
      
      await job.updateProgress({ progress: 80, message: 'Parse complete, preparing results' });

      const result: ExcelParseJobResult = {
        termsFound: parsedData.terms.length,
        categoriesFound: parsedData.categories.length,
        preview: validateOnly ? [] : parsedData.terms.slice(0, 5),
        duration: Date.now() - startTime,
      };

      if (validateOnly) {
        const errors: Array<{ row: number; column: string; error: string }> = [];
        parsedData.terms.forEach((term, index) => {
          if (!term.name) {
            errors.push({ row: index + 2, column: 'name', error: 'Term name is required' });
          }
          if (!term.definition) {
            errors.push({ row: index + 2, column: 'definition', error: 'Definition is required' });
          }
        });
        result.validationErrors = errors;
      }

      await job.updateProgress({ progress: 100, message: 'Parse completed' });
      return result;
    }

  } catch (error) {
    logger.error(`Excel parse job ${job.id} failed:`, { error: error instanceof Error ? error.message : String(error) });
    throw error;
  }
}