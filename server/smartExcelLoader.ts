import fs from 'fs';
import path from 'path';
import { cacheManager } from './cacheManager';
import { aiChangeDetector } from './aiChangeDetector';

/**
 * Smart Excel loader that chooses the appropriate processing method based on file size
 * - Uses Node.js CSV streaming processor for large files (>50MB) with memory optimization
 * - Uses JavaScript parser for smaller files
 * - Provides progress tracking and resumable processing
 */

const MAX_JS_FILE_SIZE = 50 * 1024 * 1024; // 50MB threshold
const DEFAULT_CHUNK_SIZE = 500; // Process 500 rows per chunk

interface ProcessingOptions {
  chunkSize?: number;
  enableProgress?: boolean;
  resumeProcessing?: boolean;
}

/**
 * Enhanced smart Excel loader with chunking and caching support
 */
export async function smartLoadExcelData(filePath: string, options: ProcessingOptions = {}, forceReprocess: boolean = false): Promise<void> {
  try {
    console.log(`🎯 Smart Excel loading: ${filePath}`);
    
    // Check if file exists
    if (!fs.existsSync(filePath)) {
      console.error(`❌ File not found: ${filePath}`);
      return;
    }
    
    // Get file size
    const stats = fs.statSync(filePath);
    const fileSizeBytes = stats.size;
    const fileSizeMB = fileSizeBytes / (1024 * 1024);
    
    console.log(`📊 File size: ${fileSizeMB.toFixed(2)} MB`);
    
    // Check cache validity first (unless force reprocess)
    if (!forceReprocess) {
      const isCacheValid = await cacheManager.isCacheValid(filePath);
      
      if (isCacheValid) {
        const cachedData = await cacheManager.loadFromCache(filePath);
        if (cachedData) {
          console.log('⚡ Loading from cache - skipping processing');
          // Use batched import for cached data too
          const { batchedImportProcessedData } = await import('./batchedImporter');
          
          // Save cached data to temp file for batched import
          const tempDir = path.join(process.cwd(), 'temp');
          if (!fs.existsSync(tempDir)) {
            fs.mkdirSync(tempDir, { recursive: true });
          }
          const tempCacheFile = path.join(tempDir, `cached_${Date.now()}.json`);
          fs.writeFileSync(tempCacheFile, JSON.stringify(cachedData));
          
          const importResult = await batchedImportProcessedData(tempCacheFile, {
            batchSize: 500,
            skipExisting: true
          });
          
          // Clean up temp file
          fs.unlinkSync(tempCacheFile);
          
          if (importResult.success) {
            console.log(`✅ Cache data loaded successfully:`);
            console.log(`   📂 ${importResult.imported.categories} categories`);
            console.log(`   📋 ${importResult.imported.subcategories} subcategories`);
            console.log(`   📊 ${importResult.imported.terms} terms`);
            return;
          } else {
            console.warn('⚠️  Cache data import failed, proceeding with fresh processing');
          }
        }
      }
      
      // Perform AI-powered change detection for smarter processing decisions
      try {
        // Get a quick sample of the current data for comparison
        let dataSample = null;
        if (fileSizeBytes > MAX_JS_FILE_SIZE) {
          // For large files, get a small sample using Node.js
          dataSample = await getDataSample(filePath);
        } else {
          // For small files, parse a portion with JavaScript
          const { parseExcelFile } = await import('./excelParser');
          const buffer = fs.readFileSync(filePath);
          const fullData = await parseExcelFile(buffer);
          dataSample = {
            terms: fullData.terms?.slice(0, 100) || [],
            categories: fullData.categories || [],
            subcategories: [] // JavaScript parser doesn't extract subcategories separately
          };
        }
        
        const changeAnalysis = await aiChangeDetector.analyzeContentChanges(filePath, dataSample, forceReprocess);
        const strategy = aiChangeDetector.getProcessingStrategy(changeAnalysis);
        
        console.log(`🤖 AI Analysis: ${changeAnalysis.changeDescription}`);
        console.log(`📋 Strategy: ${strategy.strategy} - ${strategy.reason}`);
        
        if (!strategy.shouldProcess) {
          console.log('✅ No processing needed - using cached data');
          const cachedData = await cacheManager.loadFromCache(filePath);
          if (cachedData) {
            // Use batched import for cached data
            const { batchedImportProcessedData } = await import('./batchedImporter');
            
            const tempDir = path.join(process.cwd(), 'temp');
            if (!fs.existsSync(tempDir)) {
              fs.mkdirSync(tempDir, { recursive: true });
            }
            const tempCacheFile = path.join(tempDir, `cached_${Date.now()}.json`);
            fs.writeFileSync(tempCacheFile, JSON.stringify(cachedData));
            
            await batchedImportProcessedData(tempCacheFile, {
              batchSize: 500,
              skipExisting: true
            });
            
            fs.unlinkSync(tempCacheFile);
          }
          return;
        }
      } catch (error) {
        console.warn('⚠️  AI analysis failed, proceeding with normal processing:', error);
      }
    }
    
    // Process the file
    const startTime = Date.now();
    let processedData;
    
    if (fileSizeBytes > MAX_JS_FILE_SIZE) {
      console.log(`🚀 Using Node.js streaming processor for large file (${fileSizeMB.toFixed(2)} MB)`);
      processedData = await processWithNodeStreaming(filePath, options);
    } else {
      console.log(`📄 Using JavaScript parser for small file (${fileSizeMB.toFixed(2)} MB)`);
      const { parseExcelFile, importToDatabase } = await import('./excelParser');
      const buffer = fs.readFileSync(filePath);
      processedData = await parseExcelFile(buffer);
      await importToDatabase(processedData);
    }
    
    // Save to cache if processing was successful
    if (processedData) {
      const processingTime = Date.now() - startTime;
      await cacheManager.saveToCache(filePath, processedData, processingTime);
      console.log(`💾 Results cached for future use`);
    }
    
  } catch (error) {
    console.error('❌ Error in smart Excel loading:', error);
  }
}

/**
 * Get a small sample of data from large Excel files for change detection (Node.js version)
 */
async function getDataSample(filePath: string): Promise<any> {
  try {
    console.log('📊 Getting data sample with Node.js...');
    
    // Convert Excel to CSV if needed
    const fileExt = path.extname(filePath).toLowerCase();
    let csvFilePath = filePath;
    
    if (fileExt === '.xlsx' || fileExt === '.xls') {
      csvFilePath = await convertExcelToCSV(filePath);
    }
    
    // Read a small sample using Node.js streaming
    const { createReadStream } = await import('fs');
    const { parse } = await import('csv-parse');
    
    const sample = {
      terms: [],
      categories: new Set(),
      subcategories: []
    };
    
    let rowCount = 0;
    const maxSampleRows = 50;
    
    return new Promise((resolve, reject) => {
      const parser = parse({
        delimiter: ',',
        columns: true,
        skip_empty_lines: true
      });
      
      parser.on('readable', () => {
        let record;
        while ((record = parser.read()) !== null && rowCount < maxSampleRows) {
          rowCount++;
          
          // Extract sample term data
          const termName = record['Term'] || record['Name'] || record[Object.keys(record)[0]];
          const definition = record['Definition'] || record['Description'] || '';
          const category = record['Category'] || record['Main Category'] || '';
          
          if (termName) {
            (sample.terms as any[]).push({
              name: termName,
              definition: definition.substring(0, 200), // Truncate for sample
              category
            });
            
            if (category) {
              sample.categories.add(category);
            }
          }
        }
        
        if (rowCount >= maxSampleRows) {
          parser.destroy(); // Stop reading after sample
        }
      });
      
      parser.on('end', () => {
        // Clean up temporary CSV file if created
        if (csvFilePath !== filePath) {
          try {
            fs.unlinkSync(csvFilePath);
          } catch (cleanupError) {
            console.warn('⚠️  Could not clean up sample CSV file:', cleanupError);
          }
        }
        
        const result = {
          terms: sample.terms,
          categories: Array.from(sample.categories),
          subcategories: sample.subcategories
        };
        
        console.log(`✅ Sample extracted: ${sample.terms.length} terms, ${sample.categories.size} categories`);
        resolve(result);
      });
      
      parser.on('error', (error) => {
        console.warn('Sample extraction failed, using basic analysis:', error);
        
        // Clean up on error
        if (csvFilePath !== filePath) {
          try {
            fs.unlinkSync(csvFilePath);
          } catch (cleanupError) {
            // Ignore cleanup errors
          }
        }
        
        resolve(null);
      });
      
      // Create read stream and pipe to parser
      createReadStream(csvFilePath).pipe(parser);
    });
    
  } catch (error) {
    console.warn('Error getting data sample:', error);
    return null;
  }
}

async function processWithNodeStreaming(filePath: string, options: ProcessingOptions): Promise<any> {
  try {
    console.log('🚀 Starting Node.js streaming processing...');
    
    // Check if the file is Excel and needs conversion to CSV
    const fileExt = path.extname(filePath).toLowerCase();
    let csvFilePath = filePath;
    
    if (fileExt === '.xlsx' || fileExt === '.xls') {
      console.log('📊 Converting Excel to CSV for streaming...');
      csvFilePath = await convertExcelToCSV(filePath);
    }
    
    // Import the CSV streaming processor class
    const CSVStreamingProcessor = (await import('../csv_streaming_processor') as any).default;
    
    const processor = new (CSVStreamingProcessor as any)({
      batchSize: options.chunkSize || DEFAULT_CHUNK_SIZE,
      skipRows: 0,
      maxRows: undefined
    });
    
    console.log(`🔄 Running Node.js streaming processor:`);
    console.log(`   📁 Input: ${csvFilePath}`);
    console.log(`   ⚙️  Batch size: ${options.chunkSize || DEFAULT_CHUNK_SIZE} rows`);
    console.log(`   🚀 Method: Node.js streaming (memory efficient)`);
    
    const startTime = Date.now();
    
    // Process the CSV file with streaming
    await processor.processCSVFile(csvFilePath);
    
    const duration = (Date.now() - startTime) / 1000;
    console.log(`✅ Node.js streaming processing completed in ${duration.toFixed(2)}s`);
    
    // Clean up temporary CSV file if it was converted from Excel
    if (csvFilePath !== filePath) {
      try {
        fs.unlinkSync(csvFilePath);
        console.log('🧹 Cleaned up temporary CSV file');
      } catch (cleanupError) {
        console.warn('⚠️  Could not clean up temporary CSV file:', cleanupError);
      }
    }
    
    // Return success status for caching
    return {
      success: true,
      processingTime: duration,
      method: 'node-streaming',
      memoryEfficient: true,
      terms: 'processed', // Placeholder - streaming doesn't return counts
      categories: 'processed',
      subcategories: 'processed'
    };
    
  } catch (error) {
    console.error('❌ Error in Node.js streaming processing:', error);
    throw error;
  }
}

/**
 * Convert Excel file to CSV for streaming processing
 */
async function convertExcelToCSV(excelPath: string): Promise<string> {
  try {
    const xlsx = await import('xlsx');
    
    // Read the Excel file
    const workbook = xlsx.readFile(excelPath);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    
    // Convert to CSV
    const csvData = xlsx.utils.sheet_to_csv(worksheet);
    
    // Save to temporary CSV file
    const tempDir = path.join(process.cwd(), 'temp');
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }
    
    const csvPath = path.join(tempDir, `converted_${Date.now()}.csv`);
    fs.writeFileSync(csvPath, csvData);
    
    console.log(`✅ Excel converted to CSV: ${csvPath}`);
    return csvPath;
    
  } catch (error) {
    console.error('❌ Excel to CSV conversion error:', error);
    throw error;
  }
}

/**
 * Check for Excel files and process them intelligently with chunking support
 */
export async function checkAndSmartLoadExcelData(options: ProcessingOptions = {}): Promise<void> {
  const dataDir = path.join(process.cwd(), 'data');
  
  // Check if data directory exists
  if (!fs.existsSync(dataDir)) {
    console.log(`📁 Data directory not found at: ${dataDir}`);
    return;
  }
  
  // Look for .xlsx files
  const files = fs.readdirSync(dataDir);
  const excelFiles = files.filter(file => 
    (file.endsWith('.xlsx') || file.endsWith('.xls')) && 
    !file.startsWith('~$') // Exclude temp files
  );
  
  if (excelFiles.length === 0) {
    console.log('📄 No Excel files found in data directory');
    return;
  }
  
  console.log(`📊 Found ${excelFiles.length} Excel file(s): ${excelFiles.join(', ')}`);
  
  // Process the main file (aiml.xlsx) if it exists, otherwise use the first file
  const mainFile = excelFiles.find(f => f.includes('aiml')) || excelFiles[0];
  const excelFilePath = path.join(dataDir, mainFile);
  
  console.log(`🎯 Processing main Excel file: ${mainFile}`);
  
  // Check if we should resume processing
  if (options.resumeProcessing) {
    const tempDir = path.join(process.cwd(), 'temp');
    const existingFiles = fs.existsSync(tempDir) ? 
      fs.readdirSync(tempDir).filter(f => f.includes('processed_chunked_')) : [];
    
    if (existingFiles.length > 0) {
      console.log(`🔄 Found ${existingFiles.length} existing processed files, resuming...`);
    }
  }
  
  await smartLoadExcelData(excelFilePath, {
    chunkSize: options.chunkSize || DEFAULT_CHUNK_SIZE,
    enableProgress: options.enableProgress !== false, // Default to true
    ...options
  });
}

/**
 * Get processing status for large Excel files
 */
export async function getProcessingStatus(): Promise<{
  hasProcessedFiles: boolean;
  processedFileCount: number;
  lastProcessedAt?: Date;
}> {
  try {
    const tempDir = path.join(process.cwd(), 'temp');
    
    if (!fs.existsSync(tempDir)) {
      return { hasProcessedFiles: false, processedFileCount: 0 };
    }
    
    const processedFiles = fs.readdirSync(tempDir)
      .filter(f => f.includes('processed_chunked_'))
      .map(f => ({
        name: f,
        path: path.join(tempDir, f),
        stats: fs.statSync(path.join(tempDir, f))
      }))
      .sort((a, b) => b.stats.mtime.getTime() - a.stats.mtime.getTime());
    
    return {
      hasProcessedFiles: processedFiles.length > 0,
      processedFileCount: processedFiles.length,
      lastProcessedAt: processedFiles.length > 0 ? processedFiles[0].stats.mtime : undefined
    };
  } catch (error) {
    console.error('Error checking processing status:', error);
    return { hasProcessedFiles: false, processedFileCount: 0 };
  }
}