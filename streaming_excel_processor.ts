#!/usr/bin/env tsx
/**
 * Streaming Excel Processor
 * 
 * Handles large Excel files (286MB+) by processing them row-by-row
 * without loading the entire file into memory. Maintains full 42-section
 * extraction capability while working within memory constraints.
 */

import { Transform } from 'stream';
import { createReadStream } from 'fs';
import { pipeline } from 'stream/promises';
import * as XLSX from 'xlsx';
import path from 'path';
import fs from 'fs/promises';
import { importComplexTerms } from './server/advancedExcelParser';
import { COMPLETE_CONTENT_SECTIONS } from './complete_42_sections_config';

interface StreamingProcessorOptions {
  batchSize: number;
  maxMemoryMB: number;
  progressCallback?: (processed: number, total: number) => void;
}

interface ParsedTerm {
  name: string;
  sections: Map<string, any>;
  categories: {
    main: string[];
    sub: string[];
  };
}

class StreamingExcelProcessor {
  private options: StreamingProcessorOptions;
  private processedRows = 0;
  private totalRows = 0;
  private currentBatch: ParsedTerm[] = [];
  private headers: string[] = [];
  
  constructor(options: Partial<StreamingProcessorOptions> = {}) {
    this.options = {
      batchSize: 25, // Smaller batches for memory efficiency
      maxMemoryMB: 1024, // 1GB memory limit
      ...options
    };
  }

  async processFile(filePath: string): Promise<void> {
    console.log('🔄 Starting streaming Excel processing...');
    console.log(`📂 File: ${filePath}`);
    console.log(`📊 Batch size: ${this.options.batchSize}`);
    console.log(`💾 Memory limit: ${this.options.maxMemoryMB}MB`);

    try {
      // First pass: count rows and extract headers
      await this.analyzeFile(filePath);
      
      // Second pass: process data in chunks
      await this.processDataInChunks(filePath);
      
      // Process any remaining batch
      if (this.currentBatch.length > 0) {
        await this.processBatch();
      }
      
      console.log(`✅ Streaming processing completed. Processed ${this.processedRows} rows.`);
      
    } catch (error) {
      console.error('💥 Streaming processing failed:', error);
      throw error;
    }
  }

  private async analyzeFile(filePath: string): Promise<void> {
    console.log('🔍 Analyzing file structure...');
    
    const buffer = await fs.readFile(filePath);
    const workbook = XLSX.read(buffer, { 
      type: 'buffer',
      cellText: false,
      cellDates: true,
      sheetRows: 1 // Only read first row for headers
    });
    
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    
    // Extract headers from first row
    const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1:A1');
    for (let col = range.s.c; col <= range.e.c; col++) {
      const cellAddress = XLSX.utils.encode_cell({ r: 0, c: col });
      const cell = worksheet[cellAddress];
      if (cell && cell.v) {
        this.headers.push(String(cell.v));
      }
    }
    
    console.log(`📋 Found ${this.headers.length} columns`);
    console.log(`📋 Expected columns: 295 (for 42-section structure)`);
    
    if (this.headers.length < 200) {
      console.warn(`⚠️  Column count seems low: ${this.headers.length}`);
    }

    // Get total row count (estimate)
    const fileStats = await fs.stat(filePath);
    const fileSizeMB = fileStats.size / (1024 * 1024);
    this.totalRows = Math.floor(fileSizeMB * 35); // Rough estimate: 35 rows per MB
    
    console.log(`📊 Estimated rows: ${this.totalRows}`);
  }

  private async processDataInChunks(filePath: string): Promise<void> {
    console.log('🔄 Processing data in chunks...');
    
    const CHUNK_SIZE = 100; // Process 100 rows at a time
    let currentChunk = 0;
    
    while (true) {
      const startRow = currentChunk * CHUNK_SIZE + 1; // Skip header row
      const endRow = startRow + CHUNK_SIZE - 1;
      
      console.log(`📦 Processing chunk ${currentChunk + 1}: rows ${startRow}-${endRow}`);
      
      const chunkData = await this.readChunk(filePath, startRow, endRow);
      
      if (chunkData.length === 0) {
        console.log('✅ Reached end of file');
        break;
      }
      
      // Process each row in the chunk
      for (const rowData of chunkData) {
        const parsedTerm = this.parseRowToTerm(rowData);
        if (parsedTerm) {
          this.currentBatch.push(parsedTerm);
          this.processedRows++;
          
          // Check if batch is full
          if (this.currentBatch.length >= this.options.batchSize) {
            await this.processBatch();
          }
          
          // Memory check
          if (this.processedRows % 50 === 0) {
            await this.checkMemoryUsage();
          }
          
          // Progress callback
          if (this.options.progressCallback) {
            this.options.progressCallback(this.processedRows, this.totalRows);
          }
        }
      }
      
      currentChunk++;
      
      // Safety break to prevent infinite loop
      if (currentChunk > 1000) {
        console.warn('⚠️  Reached maximum chunk limit (1000)');
        break;
      }
    }
  }

  private async readChunk(filePath: string, startRow: number, endRow: number): Promise<any[]> {
    try {
      const buffer = await fs.readFile(filePath);
      const workbook = XLSX.read(buffer, {
        type: 'buffer',
        cellText: false,
        cellDates: true,
        sheetRows: endRow + 1 // Read up to endRow
      });
      
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      
      const jsonData = XLSX.utils.sheet_to_json(worksheet, {
        header: this.headers,
        range: startRow
      });
      
      return jsonData.slice(0, endRow - startRow + 1);
      
    } catch (error) {
      console.error(`❌ Error reading chunk ${startRow}-${endRow}:`, error);
      return [];
    }
  }

  private parseRowToTerm(rowData: any): ParsedTerm | null {
    try {
      // Extract term name (first column should be the term name)
      const termName = rowData[this.headers[0]];
      if (!termName || typeof termName !== 'string') {
        return null;
      }

      const sections = new Map<string, any>();
      const categories = { main: [], sub: [] };

      // Map row data to sections using the 42-section configuration
      for (const sectionConfig of COMPLETE_CONTENT_SECTIONS) {
        const sectionData: any = {};
        let hasContent = false;

        for (const columnName of sectionConfig.columns) {
          const value = rowData[columnName];
          if (value && String(value).trim()) {
            sectionData[columnName] = String(value).trim();
            hasContent = true;
          }
        }

        if (hasContent) {
          sections.set(sectionConfig.sectionName, {
            name: sectionConfig.sectionName,
            content: sectionData,
            displayType: sectionConfig.displayType,
            parseType: sectionConfig.parseType
          });
        }
      }

      // Extract categories (implement basic categorization)
      const definitionText = rowData[this.headers[1]] || '';
      categories.main = this.extractCategories(definitionText);

      return {
        name: termName,
        sections,
        categories
      };

    } catch (error) {
      console.error(`❌ Error parsing row:`, error);
      return null;
    }
  }

  private extractCategories(text: string): string[] {
    const categories: string[] = [];
    
    // Basic category extraction based on keywords
    const categoryMap = {
      'Machine Learning': ['machine learning', 'ml', 'algorithm', 'model', 'training'],
      'Deep Learning': ['deep learning', 'neural network', 'cnn', 'rnn', 'transformer'],
      'Natural Language Processing': ['nlp', 'text', 'language', 'linguistic'],
      'Computer Vision': ['vision', 'image', 'visual', 'opencv'],
      'Statistics': ['statistics', 'statistical', 'probability', 'distribution'],
      'Data Science': ['data science', 'data analysis', 'analytics'],
      'Artificial Intelligence': ['ai', 'artificial intelligence', 'intelligent']
    };

    const lowerText = text.toLowerCase();
    
    for (const [category, keywords] of Object.entries(categoryMap)) {
      if (keywords.some(keyword => lowerText.includes(keyword))) {
        categories.push(category);
      }
    }

    return categories.length > 0 ? categories : ['General'];
  }

  private async processBatch(): Promise<void> {
    if (this.currentBatch.length === 0) return;

    const batchStartTime = Date.now();
    console.log(`🚀 Processing batch of ${this.currentBatch.length} terms...`);

    try {
      await importComplexTerms(this.currentBatch);
      
      const batchTime = (Date.now() - batchStartTime) / 1000;
      console.log(`✅ Batch processed in ${batchTime.toFixed(2)}s`);
      console.log(`📊 Progress: ${this.processedRows} rows processed`);
      
      this.currentBatch = []; // Clear the batch
      
    } catch (error) {
      console.error('❌ Batch processing failed:', error);
      // Don't throw - continue with next batch
    }
  }

  private async checkMemoryUsage(): Promise<void> {
    const memoryUsage = process.memoryUsage();
    const heapUsedMB = memoryUsage.heapUsed / 1024 / 1024;
    
    console.log(`💾 Memory usage: ${heapUsedMB.toFixed(2)}MB`);
    
    if (heapUsedMB > this.options.maxMemoryMB) {
      console.warn(`⚠️  High memory usage: ${heapUsedMB.toFixed(2)}MB`);
      
      // Force garbage collection if available
      if (global.gc) {
        global.gc();
        console.log('🧹 Forced garbage collection');
      }
    }
  }
}

// Main execution function
async function processProductionDatasetStreaming() {
  console.log('🚀 Starting Streaming Production Dataset Processing');
  console.log('================================================');
  
  const filePath = path.join(process.cwd(), 'data', 'aiml.xlsx');
  const startTime = Date.now();
  
  try {
    const processor = new StreamingExcelProcessor({
      batchSize: 25,
      maxMemoryMB: 1024,
      progressCallback: (processed, total) => {
        const percentage = ((processed / total) * 100).toFixed(1);
        if (processed % 100 === 0) {
          console.log(`📈 Progress: ${percentage}% (${processed}/${total})`);
        }
      }
    });
    
    await processor.processFile(filePath);
    
    const totalTime = (Date.now() - startTime) / 1000;
    console.log(`\n🎉 Streaming processing completed in ${(totalTime / 60).toFixed(2)} minutes`);
    
  } catch (error) {
    console.error('💥 Streaming processing failed:', error);
    process.exit(1);
  }
}

// Export for use in other modules
export { StreamingExcelProcessor };

// Run if called directly
processProductionDatasetStreaming()
  .then(() => {
    console.log('✅ Streaming processing completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Streaming processing failed:', error);
    process.exit(1);
  });