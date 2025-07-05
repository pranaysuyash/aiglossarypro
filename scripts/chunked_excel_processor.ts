#!/usr/bin/env tsx
/**
 * Chunked Excel Processor
 * 
 * Alternative approach: Process the Excel file in smaller chunks by reading
 * specific row ranges to avoid loading the entire file into memory.
 */

import * as XLSX from 'xlsx';
import path from 'path';
import fs from 'fs/promises';
import { importComplexTerms } from './server/advancedExcelParser';
import { COMPLETE_CONTENT_SECTIONS } from './complete_42_sections_config';

interface ChunkedProcessorOptions {
  chunkSize: number;
  batchSize: number;
  startRow?: number;
  endRow?: number;
}

class ChunkedExcelProcessor {
  private options: ChunkedProcessorOptions;
  private headers: string[] = [];
  private processedCount = 0;
  private successCount = 0;
  private errorCount = 0;
  
  constructor(options: Partial<ChunkedProcessorOptions> = {}) {
    this.options = {
      chunkSize: 50,    // Read 50 rows at a time
      batchSize: 10,    // Process 10 terms at a time
      startRow: 1,      // Start from row 1 (0 is headers)
      ...options
    };
  }

  async processFile(filePath: string): Promise<void> {
    console.log('🚀 Starting Chunked Excel Processing');
    console.log('=====================================');
    console.log(`📂 File: ${filePath}`);
    console.log(`📊 Chunk size: ${this.options.chunkSize} rows per read`);
    console.log(`📦 Batch size: ${this.options.batchSize} terms per import`);
    
    const startTime = Date.now();
    
    try {
      // First, get headers and basic file info
      await this.analyzeFileStructure(filePath);
      
      // Process file in chunks
      await this.processInChunks(filePath);
      
      const totalTime = (Date.now() - startTime) / 1000;
      
      console.log('\n🎉 Chunked Processing Complete!');
      console.log('=================================');
      console.log(`✅ Successfully processed: ${this.successCount} terms`);
      console.log(`📊 Total processed: ${this.processedCount} terms`);
      console.log(`❌ Errors: ${this.errorCount}`);
      console.log(`⏱️  Total time: ${(totalTime / 60).toFixed(2)} minutes`);
      
    } catch (error) {
      console.error('💥 Chunked processing failed:', error);
      throw error;
    }
  }

  private async analyzeFileStructure(filePath: string): Promise<void> {
    console.log('\n🔍 Analyzing file structure...');
    
    try {
      // Read only headers (first row)
      const buffer = await fs.readFile(filePath);
      const workbook = XLSX.read(buffer, {
        type: 'buffer',
        sheetRows: 2, // Only read first 2 rows
        cellText: false,
        cellDates: true
      });
      
      const sheetName = workbook.SheetNames[0];
      if (!sheetName) {
        throw new Error('No sheets found in workbook');
      }
      
      const worksheet = workbook.Sheets[sheetName];
      
      // Extract headers
      const jsonData = XLSX.utils.sheet_to_json(worksheet, {
        header: 1,
        raw: false
      });
      
      if (jsonData.length > 0) {
        this.headers = jsonData[0] as string[];
        console.log(`✅ Found ${this.headers.length} columns`);
        
        // Verify expected structure
        if (this.headers.length < 200) {
          console.warn(`⚠️  Column count seems low: ${this.headers.length} (expected ~295)`);
        }
      }
      
    } catch (error) {
      console.error('❌ Failed to analyze file structure:', error);
      throw error;
    }
  }

  private async processInChunks(filePath: string): Promise<void> {
    console.log('\n🔄 Processing file in chunks...');
    
    let currentRow = this.options.startRow || 1;
    let chunkNumber = 0;
    let hasMoreData = true;
    
    const batch: any[] = [];
    
    while (hasMoreData) {
      chunkNumber++;
      const endRow = currentRow + this.options.chunkSize - 1;
      
      console.log(`\n📦 Processing chunk ${chunkNumber}: rows ${currentRow}-${endRow}`);
      
      try {
        // Read specific row range
        const chunkData = await this.readChunk(filePath, currentRow, endRow);
        
        if (!chunkData || chunkData.length === 0) {
          console.log('✅ No more data to process');
          hasMoreData = false;
          break;
        }
        
        console.log(`📊 Found ${chunkData.length} rows in chunk`);
        
        // Process each row
        for (const rowData of chunkData) {
          const parsedTerm = this.parseRowToTerm(rowData);
          
          if (parsedTerm) {
            batch.push(parsedTerm);
            this.processedCount++;
            
            // Process batch when full
            if (batch.length >= this.options.batchSize) {
              await this.processBatch(batch);
              batch.length = 0; // Clear batch
            }
          }
        }
        
        // Check memory usage periodically
        if (chunkNumber % 5 === 0) {
          this.checkMemoryUsage();
        }
        
        currentRow = endRow + 1;
        
        // Safety limit
        if (this.options.endRow && currentRow > this.options.endRow) {
          console.log(`\n✅ Reached end row limit: ${this.options.endRow}`);
          break;
        }
        
      } catch (error) {
        console.error(`❌ Error processing chunk ${chunkNumber}:`, error);
        this.errorCount++;
        // Continue with next chunk
        currentRow = endRow + 1;
      }
    }
    
    // Process any remaining terms in batch
    if (batch.length > 0) {
      await this.processBatch(batch);
    }
  }

  private async readChunk(filePath: string, startRow: number, endRow: number): Promise<any[]> {
    try {
      const buffer = await fs.readFile(filePath);
      const workbook = XLSX.read(buffer, {
        type: 'buffer',
        sheetRows: endRow + 1, // Read up to endRow + 1 (including headers)
        cellText: false,
        cellDates: true
      });
      
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      
      // Convert to JSON with headers
      const jsonData = XLSX.utils.sheet_to_json(worksheet, {
        header: this.headers,
        range: startRow,
        raw: false,
        defval: ''
      });
      
      return jsonData;
      
    } catch (error) {
      console.error(`❌ Failed to read chunk ${startRow}-${endRow}:`, error);
      return [];
    }
  }

  private parseRowToTerm(rowData: any): any | null {
    try {
      // Get term name from first column
      const termName = rowData[this.headers[0]];
      if (!termName || typeof termName !== 'string' || termName.trim() === '') {
        return null;
      }

      const sections = new Map<string, any>();
      const categories = { main: [], sub: [] };

      // Map columns to 42 sections
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

      // Basic category extraction
      const definitionCol = this.headers[1];
      const definitionText = rowData[definitionCol] || '';
      categories.main = this.extractBasicCategories(definitionText);

      return {
        name: termName.trim(),
        sections,
        categories
      };

    } catch (error) {
      console.error('❌ Error parsing row:', error);
      return null;
    }
  }

  private extractBasicCategories(text: string): string[] {
    const categories: string[] = [];
    const lowerText = text.toLowerCase();
    
    // Simple keyword-based categorization
    if (lowerText.includes('machine learning') || lowerText.includes(' ml ')) {
      categories.push('Machine Learning');
    }
    if (lowerText.includes('deep learning') || lowerText.includes('neural')) {
      categories.push('Deep Learning');
    }
    if (lowerText.includes('nlp') || lowerText.includes('language')) {
      categories.push('Natural Language Processing');
    }
    if (lowerText.includes('computer vision') || lowerText.includes('image')) {
      categories.push('Computer Vision');
    }
    if (lowerText.includes('statistic')) {
      categories.push('Statistics');
    }
    
    return categories.length > 0 ? categories : ['General'];
  }

  private async processBatch(batch: any[]): Promise<void> {
    if (batch.length === 0) return;
    
    const batchStartTime = Date.now();
    console.log(`\n🚀 Processing batch of ${batch.length} terms...`);
    
    try {
      await importComplexTerms(batch);
      
      this.successCount += batch.length;
      const batchTime = (Date.now() - batchStartTime) / 1000;
      
      console.log(`✅ Batch imported successfully in ${batchTime.toFixed(2)}s`);
      console.log(`📊 Progress: ${this.successCount} terms imported`);
      
    } catch (error) {
      console.error('❌ Batch import failed:', error);
      this.errorCount += batch.length;
    }
  }

  private checkMemoryUsage(): void {
    const memoryUsage = process.memoryUsage();
    const heapUsedMB = memoryUsage.heapUsed / (1024 * 1024);
    const heapTotalMB = memoryUsage.heapTotal / (1024 * 1024);
    
    console.log(`💾 Memory: ${heapUsedMB.toFixed(0)}MB / ${heapTotalMB.toFixed(0)}MB`);
    
    // Force garbage collection if available and memory is high
    if (heapUsedMB > 1000 && global.gc) {
      global.gc();
      console.log('🧹 Forced garbage collection');
    }
  }
}

// Main execution
async function runChunkedProcessing() {
  const filePath = path.join(process.cwd(), 'data', 'aiml.xlsx');
  
  // Start with a small test run
  console.log('🧪 Starting with test run (first 100 rows)...\n');
  
  const testProcessor = new ChunkedExcelProcessor({
    chunkSize: 50,
    batchSize: 10,
    startRow: 1,
    endRow: 100 // Test with first 100 rows
  });
  
  try {
    await testProcessor.processFile(filePath);
    
    console.log('\n✅ Test run successful!');
    console.log('Ready to process full dataset.');
    
    // Uncomment to process full dataset
    /*
    console.log('\n🚀 Processing full dataset...\n');
    
    const fullProcessor = new ChunkedExcelProcessor({
      chunkSize: 50,
      batchSize: 10,
      startRow: 101 // Continue from where test left off
    });
    
    await fullProcessor.processFile(filePath);
    */
    
  } catch (error) {
    console.error('💥 Processing failed:', error);
    process.exit(1);
  }
}

// Export for use in other modules
export { ChunkedExcelProcessor };

// Run if called directly
runChunkedProcessing()
  .then(() => {
    console.log('\n✅ Chunked processing completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Chunked processing failed:', error);
    process.exit(1);
  });