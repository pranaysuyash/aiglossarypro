#!/usr/bin/env tsx
/**
 * Split and Process Excel
 * 
 * Strategy: Use the existing Python Excel processing capabilities to split
 * the large file into smaller chunks, then process each chunk with our
 * proven AdvancedExcelParser.
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import fs from 'fs/promises';
import { AdvancedExcelParser, importComplexTerms } from './server/advancedExcelParser';

const execAsync = promisify(exec);

class SplitAndProcessExcel {
  private parser: AdvancedExcelParser;
  private processedChunks = 0;
  private totalTermsProcessed = 0;
  private successfulImports = 0;
  
  constructor() {
    this.parser = new AdvancedExcelParser();
  }

  async process(): Promise<void> {
    console.log('🚀 Starting Split and Process Strategy');
    console.log('======================================');
    
    const startTime = Date.now();
    
    try {
      // Step 1: Use Python script to extract data
      await this.extractWithPython();
      
      // Step 2: Process extracted chunks
      await this.processExtractedChunks();
      
      const totalTime = (Date.now() - startTime) / 1000;
      
      console.log('\n🎉 Split and Process Complete!');
      console.log('================================');
      console.log(`✅ Total terms processed: ${this.totalTermsProcessed}`);
      console.log(`✅ Successful imports: ${this.successfulImports}`);
      console.log(`⏱️  Total time: ${(totalTime / 60).toFixed(2)} minutes`);
      
    } catch (error) {
      console.error('💥 Split and process failed:', error);
      throw error;
    }
  }

  private async extractWithPython(): Promise<void> {
    console.log('\n🐍 Step 1: Extracting data with Python');
    console.log('=====================================');
    
    // Create a simpler Python script that just extracts rows
    const pythonScript = `
import sys
import json
import os

print("🔄 Loading Excel file...")

try:
    # Try importing required libraries
    try:
        import pandas as pd
        import openpyxl
        print("✅ Python libraries available")
    except ImportError:
        print("⚠️  pandas/openpyxl not available, trying alternative approach...")
        # Fall back to using the xlrd library which might be available
        import xlrd
        
        workbook = xlrd.open_workbook('data/aiml.xlsx')
        sheet = workbook.sheet_by_index(0)
        
        # Extract headers
        headers = [sheet.cell_value(0, col) for col in range(sheet.ncols)]
        
        # Process in chunks
        chunk_size = 50
        chunk_num = 0
        os.makedirs('temp/excel_chunks', exist_ok=True)
        
        for row_start in range(1, sheet.nrows, chunk_size):
            chunk_data = []
            row_end = min(row_start + chunk_size, sheet.nrows)
            
            for row in range(row_start, row_end):
                row_data = {}
                for col in range(sheet.ncols):
                    value = sheet.cell_value(row, col)
                    if value:
                        row_data[headers[col]] = str(value)
                if row_data.get(headers[0]):  # If first column has data
                    chunk_data.append(row_data)
            
            if chunk_data:
                chunk_num += 1
                with open(f'temp/excel_chunks/chunk_{chunk_num:04d}.json', 'w') as f:
                    json.dump(chunk_data, f)
                print(f"✅ Saved chunk {chunk_num} with {len(chunk_data)} rows")
        
        print(f"✅ Total chunks: {chunk_num}")
        sys.exit(0)
    
    # Use pandas if available
    print("📂 Reading data/aiml.xlsx...")
    
    # Create output directory
    os.makedirs('temp/excel_chunks', exist_ok=True)
    
    # Read in chunks
    chunk_size = 50
    chunk_num = 0
    total_rows = 0
    
    for chunk_df in pd.read_excel('data/aiml.xlsx', chunksize=chunk_size, engine='openpyxl'):
        chunk_num += 1
        
        # Convert to JSON-serializable format
        chunk_data = []
        for _, row in chunk_df.iterrows():
            if pd.notna(row.iloc[0]):  # Check first column
                row_dict = {}
                for col, value in row.items():
                    if pd.notna(value):
                        row_dict[str(col)] = str(value).strip()
                chunk_data.append(row_dict)
        
        if chunk_data:
            # Save chunk
            with open(f'temp/excel_chunks/chunk_{chunk_num:04d}.json', 'w') as f:
                json.dump(chunk_data, f)
            
            total_rows += len(chunk_data)
            print(f"✅ Saved chunk {chunk_num} with {len(chunk_data)} rows")
    
    print(f"✅ Total rows extracted: {total_rows}")
    print(f"✅ Total chunks created: {chunk_num}")

except Exception as e:
    print(f"❌ Error: {e}")
    sys.exit(1)
`;

    // Write Python script
    await fs.writeFile('temp/extract_excel.py', pythonScript);
    
    try {
      // Try running the Python script
      console.log('🐍 Running Python extraction script...');
      const { stdout, stderr } = await execAsync('python3 temp/extract_excel.py', {
        maxBuffer: 10 * 1024 * 1024 // 10MB buffer
      });
      
      console.log(stdout);
      if (stderr) console.error('Python stderr:', stderr);
      
    } catch (pythonError) {
      console.log('⚠️  Python extraction failed, trying alternative approach...');
      
      // Alternative: Use Node.js with smaller reads
      await this.extractWithNodeAlternative();
    }
  }

  private async extractWithNodeAlternative(): Promise<void> {
    console.log('\n📦 Using Node.js alternative extraction');
    
    const XLSX = await import('xlsx');
    const filePath = path.join(process.cwd(), 'data', 'aiml.xlsx');
    
    // Create output directory
    await fs.mkdir('temp/excel_chunks', { recursive: true });
    
    try {
      // Try to read just the headers first
      console.log('🔄 Reading headers...');
      const headerWorkbook = XLSX.readFile(filePath, {
        sheetRows: 2,
        type: 'buffer'
      });
      
      const sheetName = headerWorkbook.SheetNames[0];
      const headerSheet = headerWorkbook.Sheets[sheetName];
      const headers = XLSX.utils.sheet_to_json(headerSheet, { header: 1 })[0] as string[];
      
      console.log(`✅ Found ${headers.length} columns`);
      
      // Process in small chunks
      const ROWS_PER_CHUNK = 50;
      let chunkNum = 0;
      let currentRow = 1; // Skip header
      
      console.log('🔄 Processing in chunks...');
      
      while (chunkNum < 20) { // Limit to first 1000 rows for testing
        chunkNum++;
        const startRow = currentRow;
        const endRow = currentRow + ROWS_PER_CHUNK - 1;
        
        console.log(`📦 Reading chunk ${chunkNum}: rows ${startRow}-${endRow}`);
        
        try {
          // Read specific range
          const chunkWorkbook = XLSX.readFile(filePath, {
            sheetRows: endRow + 1,
            type: 'buffer'
          });
          
          const chunkSheet = chunkWorkbook.Sheets[sheetName];
          const chunkData = XLSX.utils.sheet_to_json(chunkSheet, {
            header: headers,
            range: startRow,
            defval: ''
          });
          
          if (chunkData.length > 0) {
            // Save chunk
            const chunkPath = path.join('temp', 'excel_chunks', `chunk_${String(chunkNum).padStart(4, '0')}.json`);
            await fs.writeFile(chunkPath, JSON.stringify(chunkData, null, 2));
            console.log(`✅ Saved ${chunkData.length} rows to chunk ${chunkNum}`);
          } else {
            console.log('✅ No more data found');
            break;
          }
          
          currentRow = endRow + 1;
          
        } catch (chunkError) {
          console.error(`❌ Error reading chunk ${chunkNum}:`, chunkError);
          break;
        }
      }
      
      console.log(`✅ Extracted ${chunkNum} chunks`);
      
    } catch (error) {
      console.error('❌ Alternative extraction failed:', error);
      throw error;
    }
  }

  private async processExtractedChunks(): Promise<void> {
    console.log('\n📦 Step 2: Processing extracted chunks');
    console.log('=====================================');
    
    const chunksDir = path.join(process.cwd(), 'temp', 'excel_chunks');
    
    try {
      // Get all chunk files
      const files = await fs.readdir(chunksDir);
      const chunkFiles = files.filter(f => f.startsWith('chunk_') && f.endsWith('.json')).sort();
      
      console.log(`📊 Found ${chunkFiles.length} chunks to process`);
      
      // Process each chunk
      for (let i = 0; i < chunkFiles.length; i++) {
        const chunkFile = chunkFiles[i];
        const chunkPath = path.join(chunksDir, chunkFile);
        
        console.log(`\n📦 Processing ${chunkFile} (${i + 1}/${chunkFiles.length})`);
        
        try {
          // Read chunk data
          const chunkContent = await fs.readFile(chunkPath, 'utf-8');
          const chunkData = JSON.parse(chunkContent);
          
          console.log(`📊 Chunk contains ${chunkData.length} rows`);
          
          // Convert to Excel buffer for parser
          const XLSX = await import('xlsx');
          const worksheet = XLSX.utils.json_to_sheet(chunkData);
          const workbook = XLSX.utils.book_new();
          XLSX.utils.book_append_sheet(workbook, worksheet, 'Sheet1');
          const buffer = XLSX.write(workbook, { type: 'buffer' });
          
          // Parse with AdvancedExcelParser
          const parsedTerms = await this.parser.parseComplexExcel(buffer);
          
          if (parsedTerms.length > 0) {
            console.log(`✅ Parsed ${parsedTerms.length} terms from chunk`);
            this.totalTermsProcessed += parsedTerms.length;
            
            // Import to database in smaller batches
            const BATCH_SIZE = 10;
            for (let j = 0; j < parsedTerms.length; j += BATCH_SIZE) {
              const batch = parsedTerms.slice(j, j + BATCH_SIZE);
              
              try {
                await importComplexTerms(batch);
                this.successfulImports += batch.length;
                console.log(`✅ Imported batch of ${batch.length} terms`);
              } catch (importError) {
                console.error(`❌ Import error:`, importError);
              }
            }
          }
          
          this.processedChunks++;
          
        } catch (chunkError) {
          console.error(`❌ Error processing ${chunkFile}:`, chunkError);
        }
      }
      
    } catch (error) {
      console.error('❌ Error processing chunks:', error);
      throw error;
    }
  }
}

// Main execution
async function main() {
  const processor = new SplitAndProcessExcel();
  
  try {
    await processor.process();
    
    console.log('\n✅ Production dataset processing completed!');
    process.exit(0);
    
  } catch (error) {
    console.error('\n💥 Processing failed:', error);
    process.exit(1);
  }
}

// Run the processor
main();