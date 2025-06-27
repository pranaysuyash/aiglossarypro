import fs from 'fs';
import path from 'path';
import { runPythonExcelProcessor, importProcessedData } from './pythonProcessor';
import { cacheManager } from './cacheManager';
import { aiChangeDetector } from './aiChangeDetector';

/**
 * Smart Excel loader that chooses the appropriate processing method based on file size
 * - Uses chunked Python processor for large files (>50MB) with memory optimization
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
          // For large files, get a small sample using Python
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
      console.log(`🐍 Using chunked Python processor for large file (${fileSizeMB.toFixed(2)} MB)`);
      processedData = await processWithChunkedPython(filePath, options);
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
 * Get a small sample of data from large Excel files for change detection
 */
async function getDataSample(filePath: string): Promise<any> {
  try {
    const tempDir = path.join(process.cwd(), 'temp');
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }
    
    const outputPath = path.join(tempDir, `sample_${Date.now()}.json`);
    const scriptPath = 'server/python/excel_processor_enhanced.py';
    
    const { exec } = await import('child_process');
    const venvPath = path.join(process.cwd(), 'venv', 'bin', 'python');
    
    // Get just a small sample (50 rows) for change detection
    const command = [
      venvPath,
      scriptPath,
      `--input "${filePath}"`,
      `--output "${outputPath}"`,
      `--chunk-size 50`,
      `--sample-only`
    ].join(' ');
    
    return new Promise((resolve, reject) => {
      exec(command, { maxBuffer: 1024 * 1024 }, (error, stdout, stderr) => {
        if (error) {
          console.warn('Sample extraction failed, using basic analysis');
          resolve(null);
          return;
        }
        
        try {
          if (fs.existsSync(outputPath)) {
            const sampleData = JSON.parse(fs.readFileSync(outputPath, 'utf8'));
            fs.unlinkSync(outputPath); // Clean up
            resolve(sampleData);
          } else {
            resolve(null);
          }
        } catch (e) {
          resolve(null);
        }
      });
    });
  } catch (error) {
    console.warn('Error getting data sample:', error);
    return null;
  }
}

async function processWithChunkedPython(filePath: string, options: ProcessingOptions): Promise<any> {
  try {
    console.log('🚀 Starting chunked Excel processing...');
    
    // Use the enhanced Python processor with chunking
    const tempDir = path.join(process.cwd(), 'temp');
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }
    
    const outputPath = path.join(tempDir, `processed_chunked_${Date.now()}.json`);
    
    // Check if we should use the enhanced processor
    const enhancedScriptPath = 'server/python/excel_processor_enhanced.py';
    const regularScriptPath = 'server/python/excel_processor.py';
    
    const scriptPath = fs.existsSync(enhancedScriptPath) ? enhancedScriptPath : regularScriptPath;
    
    const { exec } = await import('child_process');
    const venvPath = path.join(process.cwd(), 'venv', 'bin', 'python');
    
    const chunkSize = options.chunkSize || DEFAULT_CHUNK_SIZE;
    
    // Build command with chunking parameters
    const command = [
      venvPath,
      scriptPath,
      `--input "${filePath}"`,
      `--output "${outputPath}"`,
      `--chunk-size ${chunkSize}`
    ].join(' ');
    
    console.log(`🔄 Running chunked Python processor:`);
    console.log(`   📁 Input: ${filePath}`);
    console.log(`   📁 Output: ${outputPath}`);
    console.log(`   ⚙️  Chunk size: ${chunkSize} rows`);
    console.log(`   🐍 Script: ${scriptPath}`);
    
    return new Promise((resolve, reject) => {
      const startTime = Date.now();
      
      const childProcess = exec(command, { 
        maxBuffer: 1024 * 1024 * 10 // 10MB buffer
      }, async (error, stdout, stderr) => {
        const duration = (Date.now() - startTime) / 1000;
        
        if (error) {
          console.error(`❌ Python processor error: ${error.message}`);
          console.error(`stderr: ${stderr}`);
          return reject(error);
        }
        
        if (stderr) {
          console.warn(`⚠️  Python processor warnings: ${stderr}`);
        }
        
        try {
          const result = JSON.parse(stdout);
          
          if (!result.success) {
            return reject(new Error(result.error || 'Unknown error processing file'));
          }
          
          console.log(`✅ Chunked processing complete in ${duration.toFixed(2)}s:`);
          console.log(`   📊 ${result.terms} terms processed`);
          console.log(`   📂 ${result.categories} categories created`);
          console.log(`   📋 ${result.subcategories} subcategories created`);
          console.log(`   🔄 ${result.chunks_processed} chunks processed`);
          
          // Use batched import instead of reading the large file directly
          if (fs.existsSync(outputPath)) {
            console.log('🔄 Starting batched database import...');
            
            const { batchedImportProcessedData } = await import('./batchedImporter');
            const importResult = await batchedImportProcessedData(outputPath, {
              batchSize: 100, // Smaller batches for large datasets
              skipExisting: true,
              enableProgress: true
            });
            
            if (importResult.success) {
              console.log(`✅ Batched database import complete:`);
              console.log(`   📂 ${importResult.imported.categories} categories imported`);
              console.log(`   📋 ${importResult.imported.subcategories} subcategories imported`);
              console.log(`   📊 ${importResult.imported.terms} terms imported`);
              console.log(`   ⏱️  Import duration: ${(importResult.duration / 1000).toFixed(2)}s`);
              
              if (importResult.errors.length > 0) {
                console.warn(`⚠️  ${importResult.errors.length} import errors occurred`);
                console.log('Sample errors:', importResult.errors.slice(0, 3));
              }
            } else {
              console.error(`❌ Batched database import failed: ${importResult.errors.join(', ')}`);
            }
            
            // Clean up temp file
            try {
              fs.unlinkSync(outputPath);
              console.log('🧹 Temporary files cleaned up');
            } catch (e) {
              console.warn(`⚠️  Could not remove temp file: ${e}`);
            }
            
            // Return the import result for caching
            resolve({
              terms: result.terms,
              categories: result.categories,
              subcategories: result.subcategories,
              chunks_processed: result.chunks_processed,
              importResult
            });
          } else {
            resolve(null);
          }
        } catch (parseError) {
          console.error(`❌ Error parsing Python output: ${parseError}`);
          console.log('Raw output:', stdout);
          reject(parseError);
        }
      });
      
      // Handle progress output if available
      if (options.enableProgress && childProcess.stdout) {
        childProcess.stdout.on('data', (data) => {
          const output = data.toString();
          // Look for progress indicators in the output
          if (output.includes('Processing chunk') || output.includes('Processed')) {
            process.stdout.write(`📈 ${output.trim()}\n`);
          }
        });
      }
    });
  } catch (error) {
    console.error(`❌ Error in chunked Python processing: ${error}`);
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