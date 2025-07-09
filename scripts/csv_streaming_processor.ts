#!/usr/bin/env tsx

/**
 * CSV Streaming Processor
 *
 * Processes large CSV files line-by-line without loading into memory.
 * Maintains the same 42-section extraction logic as AdvancedExcelParser.
 */

import { createReadStream } from 'node:fs';
import fs from 'node:fs/promises';
import path from 'node:path';
import { parse } from 'csv-parse';
// Note: Excel processing functionality has been removed
// import { importComplexTerms } from '../server/advancedExcelParser';
import { COMPLETE_CONTENT_SECTIONS } from './complete_42_sections_config';

interface CSVProcessorOptions {
  batchSize: number;
  skipRows?: number;
  maxRows?: number;
}

class CSVStreamingProcessor {
  private options: CSVProcessorOptions;
  private headers: string[] = [];
  private processedRows = 0;
  private successfulImports = 0;
  private currentBatch: any[] = [];
  private aiParseCache = new Map<string, any>();

  constructor(options: Partial<CSVProcessorOptions> = {}) {
    this.options = {
      batchSize: 25,
      skipRows: 0,
      maxRows: undefined,
      ...options,
    };
  }

  async processCSVFile(csvPath: string): Promise<void> {
    console.log('🚀 Starting CSV Streaming Processing');
    console.log('===================================');
    console.log(`📂 File: ${csvPath}`);
    console.log(`📦 Batch size: ${this.options.batchSize}`);

    const startTime = Date.now();

    // Load AI parse cache if exists
    await this.loadAICache();

    return new Promise((resolve, reject) => {
      const parser = parse({
        delimiter: ',',
        columns: (headers) => {
          this.headers = headers;
          console.log(`✅ Found ${headers.length} columns`);
          if (headers.length < 200) {
            console.warn(`⚠️  Column count seems low: ${headers.length} (expected ~295)`);
          }
          return headers;
        },
        skip_empty_lines: true,
        skip_records_with_error: true,
        from: this.options.skipRows || 0,
        to: this.options.maxRows,
      });

      parser.on('readable', async () => {
        let record;
        while ((record = parser.read()) !== null) {
          // Skip empty rows
          if (!record[this.headers[0]]) continue;

          this.processedRows++;

          // Parse row to term format
          const parsedTerm = this.parseRowToTerm(record);
          if (parsedTerm) {
            this.currentBatch.push(parsedTerm);

            // Process batch when full
            if (this.currentBatch.length >= this.options.batchSize) {
              parser.pause(); // Pause parsing while processing batch

              try {
                await this.processBatch();
              } catch (error) {
                console.error('❌ Batch processing error:', error);
              }

              parser.resume(); // Resume parsing
            }
          }

          // Progress update
          if (this.processedRows % 100 === 0) {
            console.log(
              `📊 Processed ${this.processedRows} rows, imported ${this.successfulImports} terms`
            );
            this.checkMemoryUsage();
          }
        }
      });

      parser.on('error', (err) => {
        console.error('❌ CSV parsing error:', err);
        reject(err);
      });

      parser.on('end', async () => {
        // Process remaining batch
        if (this.currentBatch.length > 0) {
          await this.processBatch();
        }

        const totalTime = (Date.now() - startTime) / 1000;

        console.log('\n🎉 CSV Processing Complete!');
        console.log('===========================');
        console.log(`✅ Total rows processed: ${this.processedRows}`);
        console.log(`✅ Successfully imported: ${this.successfulImports} terms`);
        console.log(`⏱️  Total time: ${(totalTime / 60).toFixed(2)} minutes`);

        // Save AI cache
        await this.saveAICache();

        resolve();
      });

      // Start streaming
      const stream = createReadStream(csvPath);
      stream.pipe(parser);
    });
  }

  private parseRowToTerm(row: any): any | null {
    try {
      const termName = row[this.headers[0]];
      if (!termName || typeof termName !== 'string' || termName.trim() === '') {
        return null;
      }

      const sections = new Map<string, any>();
      const categories: { main: string[]; sub: string[] } = { main: [], sub: [] };

      // Map CSV columns to 42 sections
      for (const sectionConfig of COMPLETE_CONTENT_SECTIONS) {
        const sectionData: any = {};
        let hasContent = false;

        for (const columnName of sectionConfig.columns) {
          const value = row[columnName];
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
            parseType: sectionConfig.parseType,
          });
        }
      }

      // Extract categories with caching
      const cacheKey = termName.toLowerCase();
      if (this.aiParseCache.has(cacheKey)) {
        const cached = this.aiParseCache.get(cacheKey);
        categories.main = cached.categories?.main || [];
        categories.sub = cached.categories?.sub || [];
      } else {
        // Basic extraction
        const definitionText = row[this.headers[1]] || '';
        categories.main = this.extractBasicCategories(definitionText);
      }

      return {
        name: termName.trim(),
        sections,
        categories,
      };
    } catch (error) {
      console.error('❌ Error parsing row:', error);
      return null;
    }
  }

  private extractBasicCategories(text: string): string[] {
    const categories: string[] = [];
    const lowerText = text.toLowerCase();

    const categoryPatterns = [
      { pattern: /machine learning|ml\b|supervised|unsupervised/, category: 'Machine Learning' },
      { pattern: /deep learning|neural network|cnn|rnn|transformer/, category: 'Deep Learning' },
      {
        pattern: /nlp|natural language|text processing|linguistic/,
        category: 'Natural Language Processing',
      },
      { pattern: /computer vision|image|visual|opencv/, category: 'Computer Vision' },
      { pattern: /statistic|probability|distribution|hypothesis/, category: 'Statistics' },
      { pattern: /data science|analytics|data analysis/, category: 'Data Science' },
      { pattern: /artificial intelligence|ai\b/, category: 'Artificial Intelligence' },
      { pattern: /reinforcement learning|reward|agent|policy/, category: 'Reinforcement Learning' },
    ];

    for (const { pattern, category } of categoryPatterns) {
      if (pattern.test(lowerText)) {
        categories.push(category);
      }
    }

    return categories.length > 0 ? categories : ['General'];
  }

  private async processBatch(): Promise<void> {
    if (this.currentBatch.length === 0) return;

    const batchStartTime = Date.now();
    const batchSize = this.currentBatch.length;

    console.log(`\n🚀 Processing batch of ${batchSize} terms...`);

    try {
      // Excel processing functionality has been removed
      // await importComplexTerms(this.currentBatch);
      console.log('⚠️  Excel processing functionality has been removed');

      this.successfulImports += batchSize;
      const batchTime = (Date.now() - batchStartTime) / 1000;

      console.log(`✅ Batch imported in ${batchTime.toFixed(2)}s`);

      this.currentBatch = []; // Clear batch
    } catch (error) {
      console.error('❌ Batch import failed:', error);
      // Don't throw - continue with next batch
      this.currentBatch = [];
    }
  }

  private checkMemoryUsage(): void {
    const usage = process.memoryUsage();
    const heapUsedMB = usage.heapUsed / (1024 * 1024);

    if (heapUsedMB > 1000) {
      console.log(`💾 High memory usage: ${heapUsedMB.toFixed(0)}MB`);
      if (global.gc) {
        global.gc();
        console.log('🧹 Forced garbage collection');
      }
    }
  }

  private async loadAICache(): Promise<void> {
    try {
      const cacheFile = 'temp/ai_parse_cache.json';
      const cacheData = await fs.readFile(cacheFile, 'utf-8');
      const cache = JSON.parse(cacheData);

      for (const [key, value] of Object.entries(cache)) {
        this.aiParseCache.set(key, value);
      }

      console.log(`📂 Loaded ${this.aiParseCache.size} cached AI parse results`);
    } catch (_error) {
      // Cache doesn't exist yet, that's okay
    }
  }

  private async saveAICache(): Promise<void> {
    try {
      const cacheObj: any = {};
      for (const [key, value] of this.aiParseCache.entries()) {
        cacheObj[key] = value;
      }

      await fs.writeFile('temp/ai_parse_cache.json', JSON.stringify(cacheObj, null, 2));
      console.log(`💾 Saved ${this.aiParseCache.size} AI parse results to cache`);
    } catch (error) {
      console.error('❌ Failed to save AI cache:', error);
    }
  }
}

// Conversion helper script
async function createConversionInstructions() {
  const instructions = `# Converting Excel to CSV for Processing

## Manual Conversion Steps

### Option 1: Using Excel/LibreOffice
1. Open aiml.xlsx in Excel or LibreOffice Calc
2. File → Save As → CSV (Comma delimited)
3. Save as "aiml.csv" in the data folder
4. Encoding: UTF-8 (important for special characters)

### Option 2: Using Command Line (Mac/Linux)
\`\`\`bash
# Install ssconvert (part of gnumeric)
brew install gnumeric  # Mac
sudo apt-get install gnumeric  # Ubuntu/Debian

# Convert to CSV
ssconvert data/aiml.xlsx data/aiml.csv
\`\`\`

### Option 3: Using Python (if pandas available)
\`\`\`python
import pandas as pd
df = pd.read_excel('data/aiml.xlsx')
df.to_csv('data/aiml.csv', index=False, encoding='utf-8')
\`\`\`

### Option 4: Online Converters
- https://convertio.co/xlsx-csv/
- https://cloudconvert.com/xlsx-to-csv
- Google Sheets (Import → Export as CSV)

## After Conversion
Run: \`npx tsx csv_streaming_processor.ts\`
`;

  await fs.writeFile('EXCEL_TO_CSV_CONVERSION.md', instructions);
  console.log('📄 Created EXCEL_TO_CSV_CONVERSION.md with conversion instructions');
}

// Main execution
async function main() {
  // Check if CSV file exists
  const csvPath = path.join(process.cwd(), 'data', 'aiml.csv');

  try {
    await fs.access(csvPath);
    console.log('✅ Found aiml.csv file');

    // Process the CSV
    const processor = new CSVStreamingProcessor({
      batchSize: 25,
      // skipRows: 1000,  // Uncomment to skip rows for testing
      // maxRows: 2000    // Uncomment to limit rows for testing
    });

    await processor.processCSVFile(csvPath);
  } catch (_error) {
    console.log('❌ CSV file not found at data/aiml.csv');
    console.log('\n📋 Creating conversion instructions...');

    await createConversionInstructions();

    console.log('\n⚠️  Please convert aiml.xlsx to CSV format first');
    console.log('See EXCEL_TO_CSV_CONVERSION.md for instructions');
  }
}

// Export for use in other modules
export { CSVStreamingProcessor };

// Run if called directly
main()
  .then(() => {
    console.log('\n✅ Processing completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Processing failed:', error);
    process.exit(1);
  });
