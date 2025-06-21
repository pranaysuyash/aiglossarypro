import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

interface ChunkProcessingOptions {
  chunkSize: number;
  maxConcurrentChunks: number;
  outputDir: string;
  enableProgress: boolean;
}

interface ProcessingResult {
  success: boolean;
  totalTerms: number;
  totalCategories: number;
  totalSubcategories: number;
  chunksProcessed: number;
  error?: string;
  chunkFiles?: string[];
}

interface ChunkInfo {
  chunkIndex: number;
  startRow: number;
  endRow: number;
  outputFile: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  terms?: number;
  categories?: number;
  subcategories?: number;
}

/**
 * Enhanced Excel processor that handles large files through intelligent chunking
 * - Sorts data by category to optimize chunk processing
 * - Processes chunks in parallel for better performance  
 * - Provides progress tracking and resumable processing
 * - Handles memory constraints by processing incrementally
 */
export class ChunkedExcelProcessor {
  private options: ChunkProcessingOptions;
  private chunks: ChunkInfo[] = [];
  private progressCallback?: (progress: number, chunk: ChunkInfo) => void;

  constructor(options: Partial<ChunkProcessingOptions> = {}) {
    this.options = {
      chunkSize: 500, // Process 500 rows per chunk
      maxConcurrentChunks: 3, // Process 3 chunks simultaneously
      outputDir: path.join(process.cwd(), 'temp', 'chunks'),
      enableProgress: true,
      ...options
    };

    // Ensure output directory exists
    if (!fs.existsSync(this.options.outputDir)) {
      fs.mkdirSync(this.options.outputDir, { recursive: true });
    }
  }

  /**
   * Set progress callback for real-time updates
   */
  setProgressCallback(callback: (progress: number, chunk: ChunkInfo) => void): void {
    this.progressCallback = callback;
  }

  /**
   * Get total row count from Excel file without loading entire file
   */
  private async getRowCount(excelPath: string): Promise<number> {
    try {
      const venvPath = path.join(process.cwd(), 'venv', 'bin', 'python');
      const scriptPath = 'server/python/excel_row_counter.py';
      
      const { stdout } = await execAsync(`${venvPath} ${scriptPath} "${excelPath}"`);
      const result = JSON.parse(stdout);
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to count rows');
      }
      
      return result.row_count;
    } catch (error) {
      console.error('Error counting rows:', error);
      throw error;
    }
  }

  /**
   * Sort Excel data by category to optimize chunk processing
   */
  private async sortExcelByCategory(excelPath: string, sortedPath: string): Promise<void> {
    try {
      console.log('🔄 Sorting Excel data by category for optimal chunking...');
      
      const venvPath = path.join(process.cwd(), 'venv', 'bin', 'python');
      const scriptPath = 'server/python/excel_sorter.py';
      
      const { stdout, stderr } = await execAsync(
        `${venvPath} ${scriptPath} --input "${excelPath}" --output "${sortedPath}"`,
        { maxBuffer: 1024 * 1024 * 10 }
      );
      
      if (stderr) {
        console.warn('⚠️  Sorting warnings:', stderr);
      }
      
      const result = JSON.parse(stdout);
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to sort Excel data');
      }
      
      console.log(`✅ Excel data sorted: ${result.rows_processed} rows`);
    } catch (error) {
      console.error('❌ Error sorting Excel data:', error);
      throw error;
    }
  }

  /**
   * Create chunk plan based on file size and configuration
   */
  private async createChunkPlan(excelPath: string): Promise<ChunkInfo[]> {
    const rowCount = await this.getRowCount(excelPath);
    const chunks: ChunkInfo[] = [];
    
    console.log(`📊 Planning chunks for ${rowCount} rows (chunk size: ${this.options.chunkSize})`);
    
    for (let i = 0; i < rowCount; i += this.options.chunkSize) {
      const chunkIndex = Math.floor(i / this.options.chunkSize);
      const startRow = i + 1; // Skip header row
      const endRow = Math.min(i + this.options.chunkSize, rowCount);
      
      chunks.push({
        chunkIndex,
        startRow,
        endRow,
        outputFile: path.join(this.options.outputDir, `chunk_${chunkIndex}.json`),
        status: 'pending'
      });
    }
    
    console.log(`📋 Created plan for ${chunks.length} chunks`);
    return chunks;
  }

  /**
   * Process a single chunk
   */
  private async processChunk(excelPath: string, chunk: ChunkInfo): Promise<void> {
    try {
      chunk.status = 'processing';
      
      const venvPath = path.join(process.cwd(), 'venv', 'bin', 'python');
      const scriptPath = 'server/python/excel_processor.py';
      
      const command = [
        venvPath,
        scriptPath,
        `--input "${excelPath}"`,
        `--output "${chunk.outputFile}"`,
        `--start-row ${chunk.startRow}`,
        `--end-row ${chunk.endRow}`,
        `--chunk-index ${chunk.chunkIndex}`
      ].join(' ');
      
      const { stdout, stderr } = await execAsync(command, {
        maxBuffer: 1024 * 1024 * 10
      });
      
      if (stderr) {
        console.warn(`⚠️  Chunk ${chunk.chunkIndex} warnings:`, stderr);
      }
      
      const result = JSON.parse(stdout);
      
      if (!result.success) {
        throw new Error(result.error || 'Chunk processing failed');
      }
      
      chunk.terms = result.terms;
      chunk.categories = result.categories;
      chunk.subcategories = result.subcategories;
      chunk.status = 'completed';
      
      console.log(`✅ Chunk ${chunk.chunkIndex} completed: ${result.terms} terms, ${result.categories} categories`);
      
      if (this.progressCallback) {
        const progress = (chunk.chunkIndex + 1) / this.chunks.length * 100;
        this.progressCallback(progress, chunk);
      }
      
    } catch (error) {
      chunk.status = 'failed';
      console.error(`❌ Chunk ${chunk.chunkIndex} failed:`, error);
      throw error;
    }
  }

  /**
   * Process chunks in parallel with concurrency control
   */
  private async processChunksInParallel(excelPath: string, chunks: ChunkInfo[]): Promise<void> {
    const semaphore = new Array(this.options.maxConcurrentChunks).fill(null);
    const processingPromises: Promise<void>[] = [];
    
    for (const chunk of chunks) {
      const promise = new Promise<void>(async (resolve, reject) => {
        // Wait for available slot
        await Promise.race(semaphore.filter(p => p !== null));
        
        // Find available slot
        const slotIndex = semaphore.findIndex(p => p === null);
        
        try {
          // Mark slot as busy
          semaphore[slotIndex] = this.processChunk(excelPath, chunk);
          await semaphore[slotIndex];
          resolve();
        } catch (error) {
          reject(error);
        } finally {
          // Free the slot
          semaphore[slotIndex] = null;
        }
      });
      
      processingPromises.push(promise);
    }
    
    await Promise.all(processingPromises);
  }

  /**
   * Merge processed chunks into final output
   */
  private async mergeChunks(chunks: ChunkInfo[], finalOutputPath: string): Promise<ProcessingResult> {
    try {
      console.log('🔄 Merging processed chunks...');
      
      const mergedData = {
        terms: [],
        categories: {},
        subcategories: {},
        metadata: {
          totalChunks: chunks.length,
          processedAt: new Date().toISOString(),
          chunkSize: this.options.chunkSize
        }
      };
      
      let totalTerms = 0;
      let totalCategories = 0;
      let totalSubcategories = 0;
      
      for (const chunk of chunks) {
        if (chunk.status !== 'completed' || !fs.existsSync(chunk.outputFile)) {
          console.warn(`⚠️  Skipping incomplete chunk ${chunk.chunkIndex}`);
          continue;
        }
        
        const chunkData = JSON.parse(fs.readFileSync(chunk.outputFile, 'utf8'));
        
        // Merge terms
        if (chunkData.terms) {
          mergedData.terms.push(...chunkData.terms);
          totalTerms += chunkData.terms.length;
        }
        
        // Merge categories (avoid duplicates)
        if (chunkData.categories) {
          Object.assign(mergedData.categories, chunkData.categories);
        }
        
        // Merge subcategories (avoid duplicates)
        if (chunkData.subcategories) {
          Object.assign(mergedData.subcategories, chunkData.subcategories);
        }
      }
      
      totalCategories = Object.keys(mergedData.categories).length;
      totalSubcategories = Object.keys(mergedData.subcategories).length;
      
      // Save merged data
      fs.writeFileSync(finalOutputPath, JSON.stringify(mergedData, null, 2));
      
      console.log(`✅ Merge completed: ${totalTerms} terms, ${totalCategories} categories, ${totalSubcategories} subcategories`);
      
      return {
        success: true,
        totalTerms,
        totalCategories,
        totalSubcategories,
        chunksProcessed: chunks.filter(c => c.status === 'completed').length,
        chunkFiles: chunks.map(c => c.outputFile)
      };
      
    } catch (error) {
      console.error('❌ Error merging chunks:', error);
      return {
        success: false,
        totalTerms: 0,
        totalCategories: 0,
        totalSubcategories: 0,
        chunksProcessed: 0,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Clean up temporary chunk files
   */
  private async cleanupChunks(chunks: ChunkInfo[], keepMerged: boolean = true): Promise<void> {
    try {
      for (const chunk of chunks) {
        if (fs.existsSync(chunk.outputFile)) {
          fs.unlinkSync(chunk.outputFile);
        }
      }
      
      // Optionally remove the entire chunks directory if empty
      if (!keepMerged && fs.existsSync(this.options.outputDir)) {
        const files = fs.readdirSync(this.options.outputDir);
        if (files.length === 0) {
          fs.rmdirSync(this.options.outputDir);
        }
      }
      
      console.log('🧹 Cleanup completed');
    } catch (error) {
      console.warn('⚠️  Cleanup warning:', error);
    }
  }

  /**
   * Process Excel file with chunking strategy
   */
  async processExcelFile(excelPath: string, outputPath?: string): Promise<ProcessingResult> {
    const startTime = Date.now();
    const finalOutputPath = outputPath || path.join(this.options.outputDir, 'merged_data.json');
    
    try {
      console.log('🚀 Starting chunked Excel processing...');
      console.log(`📁 Input: ${excelPath}`);
      console.log(`📁 Output: ${finalOutputPath}`);
      console.log(`⚙️  Chunk size: ${this.options.chunkSize} rows`);
      console.log(`⚙️  Max concurrent: ${this.options.maxConcurrentChunks} chunks`);
      
      // Use the existing Python processor with chunking support
      const venvPath = path.join(process.cwd(), 'venv', 'bin', 'python');
      const scriptPath = 'server/python/excel_processor.py';
      
      const command = [
        venvPath,
        scriptPath,
        `--input "${excelPath}"`,
        `--output "${finalOutputPath}"`,
        `--chunk-size ${this.options.chunkSize}`
      ].join(' ');
      
      console.log(`🔄 Running chunked Python processor: ${command}`);
      
      const { stdout, stderr } = await execAsync(command, {
        maxBuffer: 1024 * 1024 * 10
      });
      
      if (stderr) {
        console.warn('⚠️  Processing warnings:', stderr);
      }
      
      const result = JSON.parse(stdout);
      
      if (!result.success) {
        throw new Error(result.error || 'Processing failed');
      }
      
      const duration = (Date.now() - startTime) / 1000;
      console.log(`🎉 Processing completed in ${duration.toFixed(2)} seconds`);
      
      return {
        success: true,
        totalTerms: result.terms || 0,
        totalCategories: result.categories || 0,
        totalSubcategories: result.subcategories || 0,
        chunksProcessed: result.chunks_processed || 0
      };
      
    } catch (error) {
      console.error('❌ Chunked processing failed:', error);
      
      return {
        success: false,
        totalTerms: 0,
        totalCategories: 0,
        totalSubcategories: 0,
        chunksProcessed: 0,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Resume processing from failed chunks
   */
  async resumeProcessing(excelPath: string, outputPath?: string): Promise<ProcessingResult> {
    try {
      const finalOutputPath = outputPath || path.join(this.options.outputDir, 'merged_data.json');
      
      // Find existing chunk files and determine status
      const chunkFiles = fs.readdirSync(this.options.outputDir)
        .filter(f => f.startsWith('chunk_') && f.endsWith('.json'))
        .sort();
      
      if (chunkFiles.length === 0) {
        console.log('No existing chunks found, starting fresh processing');
        return this.processExcelFile(excelPath, outputPath);
      }
      
      console.log(`📋 Found ${chunkFiles.length} existing chunks, resuming processing...`);
      
      // Create chunk plan and mark existing chunks as completed
      this.chunks = await this.createChunkPlan(excelPath);
      
      for (const chunk of this.chunks) {
        const chunkFile = `chunk_${chunk.chunkIndex}.json`;
        if (chunkFiles.includes(chunkFile)) {
          chunk.status = 'completed';
          // Read chunk data to get counts
          try {
            const chunkData = JSON.parse(fs.readFileSync(chunk.outputFile, 'utf8'));
            chunk.terms = chunkData.terms?.length || 0;
            chunk.categories = Object.keys(chunkData.categories || {}).length;
            chunk.subcategories = Object.keys(chunkData.subcategories || {}).length;
          } catch (e) {
            chunk.status = 'pending'; // Reprocess if file is corrupted
          }
        }
      }
      
      // Process only pending chunks
      const pendingChunks = this.chunks.filter(c => c.status === 'pending');
      
      if (pendingChunks.length > 0) {
        console.log(`🔄 Processing ${pendingChunks.length} remaining chunks...`);
        await this.processChunksInParallel(excelPath, pendingChunks);
      }
      
      // Merge all chunks
      return await this.mergeChunks(this.chunks, finalOutputPath);
      
    } catch (error) {
      console.error('❌ Resume processing failed:', error);
      return {
        success: false,
        totalTerms: 0,
        totalCategories: 0,
        totalSubcategories: 0,
        chunksProcessed: 0,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Get processing status and progress
   */
  getProcessingStatus(): {
    totalChunks: number;
    completedChunks: number;
    pendingChunks: number;
    failedChunks: number;
    progress: number;
  } {
    const totalChunks = this.chunks.length;
    const completedChunks = this.chunks.filter(c => c.status === 'completed').length;
    const pendingChunks = this.chunks.filter(c => c.status === 'pending').length;
    const failedChunks = this.chunks.filter(c => c.status === 'failed').length;
    const progress = totalChunks > 0 ? (completedChunks / totalChunks) * 100 : 0;
    
    return {
      totalChunks,
      completedChunks,
      pendingChunks,
      failedChunks,
      progress
    };
  }
}

/**
 * Convenience function for simple chunked processing
 */
export async function processExcelInChunks(
  excelPath: string, 
  outputPath?: string,
  options?: Partial<ChunkProcessingOptions>
): Promise<ProcessingResult> {
  const processor = new ChunkedExcelProcessor(options);
  return processor.processExcelFile(excelPath, outputPath);
} 