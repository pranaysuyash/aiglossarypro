import * as crypto from 'node:crypto';
import { createReadStream } from 'node:fs';
import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import { log as logger } from './utils/logger';

/**
 * Cross-Processor Checkpoint Manager
 * Provides unified checkpoint functionality across TypeScript, Node.js, and Python processors
 */

interface ProcessingCheckpoint {
  version: string;
  processorType: 'typescript' | 'nodejs' | 'python';
  startTime: string;
  lastUpdate: string;
  totalCells: number;
  processedCells: number;
  completedCells: { [key: string]: boolean }; // "row-col" format
  processingMetadata: {
    fileName: string;
    fileHash: string;
    termCount: number;
    sectionCount: number;
    aiEnabled: boolean;
    mode: string;
  };
  errorLog: Array<{
    timestamp: string;
    row: number;
    col: number;
    term: string;
    section: string;
    error: string;
    retryCount: number;
  }>;
  performance: {
    averageProcessingTime: number;
    totalApiCalls: number;
    cacheHits: number;
    cacheMisses: number;
    costEstimate: number;
  };
}

interface CheckpointManagerOptions {
  baseDir?: string;
  maxRetries?: number;
  autoSave?: boolean;
  autoSaveInterval?: number;
}

export class CheckpointManager {
  private checkpointFile: string;
  private tempDir: string;
  private options: Required<CheckpointManagerOptions>;
  private currentCheckpoint: ProcessingCheckpoint | null = null;
  private autoSaveTimer: NodeJS.Timeout | null = null;

  constructor(
    fileName = 'processing_checkpoint.json',
    options: CheckpointManagerOptions = {}
  ) {
    this.options = {
      baseDir: options.baseDir || process.cwd(),
      maxRetries: options.maxRetries || 3,
      autoSave: options.autoSave ?? true,
      autoSaveInterval: options.autoSaveInterval || 30000, // 30 seconds
    };

    this.tempDir = path.join(this.options.baseDir, 'temp', 'checkpoints');
    this.checkpointFile = path.join(this.tempDir, fileName);

    if (this.options.autoSave) {
      this.setupAutoSave();
    }
  }

  private setupAutoSave(): void {
    this.autoSaveTimer = setInterval(async () => {
      if (this.currentCheckpoint) {
        await this.saveCheckpoint();
      }
    }, this.options.autoSaveInterval);
  }

  private async generateFileHash(filePath: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const hash = crypto.createHash('md5');
      const stream = createReadStream(filePath);

      stream.on('data', (data: Buffer) => hash.update(data));
      stream.on('end', () => resolve(hash.digest('hex')));
      stream.on('error', reject);
    });
  }

  /**
   * Initialize a new processing checkpoint
   */
  async initializeCheckpoint(
    processorType: 'typescript' | 'nodejs' | 'python',
    fileName: string,
    termCount: number,
    sectionCount: number,
    aiOptions: { enableAI: boolean; mode: string }
  ): Promise<void> {
    try {
      logger.info(`🔧 Initializing checkpoint system for ${fileName}`);
      await fs.mkdir(this.tempDir, { recursive: true });
      logger.info(`📁 Created checkpoint directory: ${this.tempDir}`);

      // Generate a simple hash from filename for now to avoid file path issues
      const fileHash = crypto.createHash('md5').update(fileName).digest('hex');

      this.currentCheckpoint = {
        version: '1.0',
        processorType,
        startTime: new Date().toISOString(),
        lastUpdate: new Date().toISOString(),
        totalCells: termCount * sectionCount,
        processedCells: 0,
        completedCells: {},
        processingMetadata: {
          fileName,
          fileHash,
          termCount,
          sectionCount,
          aiEnabled: aiOptions.enableAI,
          mode: aiOptions.mode,
        },
        errorLog: [],
        performance: {
          averageProcessingTime: 0,
          totalApiCalls: 0,
          cacheHits: 0,
          cacheMisses: 0,
          costEstimate: 0,
        },
      };

      await this.saveCheckpoint();
      logger.info(`✅ Checkpoint initialized and saved: ${this.checkpointFile}`);
    } catch (error) {
      logger.error('❌ Failed to initialize checkpoint:', {
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * Load existing checkpoint from file
   */
  async loadCheckpoint(): Promise<ProcessingCheckpoint | null> {
    try {
      const content = await fs.readFile(this.checkpointFile, 'utf-8');
      this.currentCheckpoint = JSON.parse(content);

      if (this.currentCheckpoint) {
        logger.info(
          `📋 Loaded checkpoint: ${this.currentCheckpoint.processedCells}/${this.currentCheckpoint.totalCells} cells processed`
        );
        logger.info(`📅 Last update: ${this.currentCheckpoint.lastUpdate}`);
        logger.info(`🔧 Processor: ${this.currentCheckpoint.processorType}`);
      }

      return this.currentCheckpoint;
    } catch (_error) {
      logger.info('📝 No existing checkpoint found, starting fresh');
      return null;
    }
  }

  /**
   * Save current checkpoint to file
   */
  async saveCheckpoint(): Promise<void> {
    if (!this.currentCheckpoint) {
      logger.info('⚠️  No checkpoint to save');
      return;
    }

    try {
      this.currentCheckpoint.lastUpdate = new Date().toISOString();

      logger.info(`💾 Saving checkpoint to: ${this.checkpointFile}`);
      const tmpFile = `${this.checkpointFile}.tmp`;
      await fs.writeFile(tmpFile, JSON.stringify(this.currentCheckpoint, null, 2), 'utf-8');
      await fs.rename(tmpFile, this.checkpointFile);
      logger.info(`✅ Checkpoint saved successfully`);

      // Keep only last 5 checkpoint backups
      await this.rotateBackups();
    } catch (error) {
      logger.error('❌ Failed to save checkpoint:', {
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  /**
   * Mark a cell as completed
   */
  markCellCompleted(row: number, col: number, processingTime?: number): void {
    if (!this.currentCheckpoint) {return;}

    const key = `${row}-${col}`;
    if (!this.currentCheckpoint.completedCells[key]) {
      this.currentCheckpoint.completedCells[key] = true;
      this.currentCheckpoint.processedCells++;

      if (processingTime) {
        const currentAvg = this.currentCheckpoint.performance.averageProcessingTime;
        const processed = this.currentCheckpoint.processedCells;
        this.currentCheckpoint.performance.averageProcessingTime =
          (currentAvg * (processed - 1) + processingTime) / processed;
      }
    }
  }

  /**
   * Check if a cell is already completed
   */
  isCellCompleted(row: number, col: number): boolean {
    if (!this.currentCheckpoint) {return false;}
    const key = `${row}-${col}`;
    return !!this.currentCheckpoint.completedCells[key];
  }

  /**
   * Log an error for a cell
   */
  logError(
    row: number,
    col: number,
    term: string,
    section: string,
    error: string,
    retryCount = 0
  ): void {
    if (!this.currentCheckpoint) {return;}

    this.currentCheckpoint.errorLog.push({
      timestamp: new Date().toISOString(),
      row,
      col,
      term,
      section,
      error,
      retryCount,
    });

    // Keep only last 100 errors to prevent memory bloat
    if (this.currentCheckpoint.errorLog.length > 100) {
      this.currentCheckpoint.errorLog = this.currentCheckpoint.errorLog.slice(-100);
    }
  }

  /**
   * Update performance metrics
   */
  updatePerformanceMetrics(metrics: {
    apiCalls?: number;
    cacheHits?: number;
    cacheMisses?: number;
    costEstimate?: number;
  }): void {
    if (!this.currentCheckpoint) {return;}

    const perf = this.currentCheckpoint.performance;
    if (metrics.apiCalls) {perf.totalApiCalls += metrics.apiCalls;}
    if (metrics.cacheHits) {perf.cacheHits += metrics.cacheHits;}
    if (metrics.cacheMisses) {perf.cacheMisses += metrics.cacheMisses;}
    if (metrics.costEstimate) {perf.costEstimate += metrics.costEstimate;}
  }

  /**
   * Get processing progress
   */
  getProgress(): { percentage: number; processed: number; total: number; errors: number } {
    if (!this.currentCheckpoint) {
      return { percentage: 0, processed: 0, total: 0, errors: 0 };
    }

    return {
      percentage: (this.currentCheckpoint.processedCells / this.currentCheckpoint.totalCells) * 100,
      processed: this.currentCheckpoint.processedCells,
      total: this.currentCheckpoint.totalCells,
      errors: this.currentCheckpoint.errorLog.length,
    };
  }

  /**
   * Get tasks that still need processing
   */
  getPendingTasks(
    headers: string[],
    rows: any[][]
  ): Array<{
    rowIdx: number;
    colIdx: number;
    excelRow: number;
    term: string;
    section: string;
  }> {
    const tasks = [];

    for (let rowIdx = 0; rowIdx < rows.length; rowIdx++) {
      const row = rows[rowIdx];
      const term = row[0] || '';
      if (!term) {continue;}

      for (let colIdx = 1; colIdx < headers.length; colIdx++) {
        const excelRow = rowIdx + 2; // Excel is 1-indexed, plus header row

        // Skip if already completed or has content
        if (this.isCellCompleted(excelRow, colIdx) || row[colIdx]) {continue;}

        tasks.push({
          rowIdx,
          colIdx,
          excelRow,
          term,
          section: headers[colIdx],
        });
      }
    }

    return tasks;
  }

  /**
   * Check if processing is compatible with different processor
   */
  isCompatibleWith(_otherProcessorType: 'typescript' | 'nodejs' | 'python'): boolean {
    if (!this.currentCheckpoint) {return true;}

    // All processors are compatible with the unified checkpoint format
    return true;
  }

  /**
   * Convert to smart_processor.cjs format for backward compatibility
   */
  exportToLegacyFormat(): { [key: string]: boolean } {
    if (!this.currentCheckpoint) {return {};}

    return this.currentCheckpoint.completedCells;
  }

  /**
   * Import from smart_processor.cjs format
   */
  importFromLegacyFormat(legacyCheckpoint: { [key: string]: boolean }): void {
    if (!this.currentCheckpoint) {return;}

    this.currentCheckpoint.completedCells = { ...legacyCheckpoint };
    this.currentCheckpoint.processedCells = Object.keys(legacyCheckpoint).length;
  }

  /**
   * Generate processing report
   */
  generateReport(): string {
    if (!this.currentCheckpoint) {return 'No checkpoint data available';}

    const progress = this.getProgress();
    const perf = this.currentCheckpoint.performance;
    const runtime = Date.now() - new Date(this.currentCheckpoint.startTime).getTime();

    return `
📊 Cross-Processor Checkpoint Report
=====================================
🔧 Processor Type: ${this.currentCheckpoint.processorType}
📁 File: ${this.currentCheckpoint.processingMetadata.fileName}
🗂️  Terms: ${this.currentCheckpoint.processingMetadata.termCount}
📋 Sections: ${this.currentCheckpoint.processingMetadata.sectionCount}

📈 Progress
-----------
✅ Completed: ${progress.processed}/${progress.total} cells (${progress.percentage.toFixed(1)}%)
❌ Errors: ${progress.errors}
⏱️  Runtime: ${Math.round(runtime / 1000)}s
⚡ Avg Time/Cell: ${perf.averageProcessingTime.toFixed(0)}ms

🤖 AI Performance
-----------------
🔄 API Calls: ${perf.totalApiCalls}
💾 Cache Hits: ${perf.cacheHits}
❓ Cache Misses: ${perf.cacheMisses}
💰 Est. Cost: $${perf.costEstimate.toFixed(4)}

🔧 Configuration
----------------
🤖 AI Enabled: ${this.currentCheckpoint.processingMetadata.aiEnabled}
🎯 Mode: ${this.currentCheckpoint.processingMetadata.mode}
🕐 Last Update: ${this.currentCheckpoint.lastUpdate}
    `.trim();
  }

  /**
   * Rotate checkpoint backups
   */
  private async rotateBackups(): Promise<void> {
    try {
      const backupDir = path.join(this.tempDir, 'backups');
      await fs.mkdir(backupDir, { recursive: true });

      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const backupFile = path.join(backupDir, `checkpoint_${timestamp}.json`);

      if (this.currentCheckpoint) {
        await fs.writeFile(backupFile, JSON.stringify(this.currentCheckpoint, null, 2));
      }

      // Keep only last 5 backups
      const backups = await fs.readdir(backupDir);
      const checkpointBackups = backups.filter(f => f.startsWith('checkpoint_')).sort();

      if (checkpointBackups.length > 5) {
        const toDelete = checkpointBackups.slice(0, -5);
        for (const file of toDelete) {
          await fs.unlink(path.join(backupDir, file));
        }
      }
    } catch (error) {
      logger.warn('⚠️  Failed to rotate checkpoint backups:', {
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  /**
   * Clean up resources
   */
  destroy(): void {
    if (this.autoSaveTimer) {
      clearInterval(this.autoSaveTimer);
      this.autoSaveTimer = null;
    }
  }
}

// Export convenience functions for backward compatibility
export async function loadLegacyCheckpoint(
  filePath = 'checkpoint.json'
): Promise<{ [key: string]: boolean }> {
  try {
    const content = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(content);
  } catch (_error) {
    return {};
  }
}

export async function saveLegacyCheckpoint(
  checkpoint: { [key: string]: boolean },
  filePath = 'checkpoint.json'
): Promise<void> {
  const tmpFile = `${filePath}.tmp`;
  await fs.writeFile(tmpFile, JSON.stringify(checkpoint, null, 2), 'utf-8');
  await fs.rename(tmpFile, filePath);
}
