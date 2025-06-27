import fs from 'fs';
import path from 'path';
import { runPythonExcelProcessor, importProcessedData } from './pythonProcessor';
import { cacheManager } from './cacheManager';
import { aiChangeDetector } from './aiChangeDetector';
import * as XLSX from 'xlsx';

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

interface FileAnalysis {
  fileSizeMB: number;
  columnCount: number;
  estimatedRowCount: number;
  isComplexStructure: boolean;
  recommendedProcessor: 'simple' | 'advanced' | 'chunked' | 'streaming';
  processingStrategy: string;
}

/**
 * Analyze Excel file structure to determine optimal processing strategy
 */
async function analyzeExcelFile(filePath: string): Promise<FileAnalysis> {
  console.log('\n🔍 ANALYZING EXCEL FILE STRUCTURE');
  console.log('=====================================');
  
  try {
    const stats = fs.statSync(filePath);
    const fileSizeMB = stats.size / (1024 * 1024);
    
    console.log(`📊 File size: ${fileSizeMB.toFixed(2)} MB`);
    
    // For very large files (>200MB), skip detailed analysis and route to streaming
    if (fileSizeMB > 200) {
      console.log('🌊 Large file detected (>200MB) - routing to streaming processor');
      return {
        fileSizeMB,
        columnCount: 295, // Known from 42-section structure
        estimatedRowCount: Math.floor(fileSizeMB * 35),
        isComplexStructure: true, // Assume complex for large files
        recommendedProcessor: 'streaming',
        processingStrategy: 'Very large file → Streaming processor with memory optimization'
      };
    }
    
    // For smaller files, try to analyze structure
    console.log('📂 Reading Excel file for analysis...');
    const buffer = fs.readFileSync(filePath);
    console.log(`📊 Buffer size: ${buffer.length} bytes`);
    
    let workbook;
    let columnCount = 1;
    let headers: string[] = [];
    
    try {
      // Try to read just the header row for analysis
      workbook = XLSX.read(buffer, {
        type: 'buffer',
        sheetRows: 1,
        cellText: false
      });
      
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      
      if (worksheet && worksheet['!ref']) {
        const range = XLSX.utils.decode_range(worksheet['!ref']);
        columnCount = range.e.c + 1;
        
        // Extract headers
        for (let col = 0; col < columnCount; col++) {
          const cellAddress = XLSX.utils.encode_cell({ r: 0, c: col });
          const cell = worksheet[cellAddress];
          if (cell && cell.v) {
            headers.push(String(cell.v));
          }
        }
      }
    } catch (error) {
      console.warn('⚠️  Header analysis failed, using file size heuristics');
      // Fallback to size-based detection
      columnCount = fileSizeMB > 50 ? 295 : 10; // Estimate based on size
    }
    
    console.log(`📋 Column count: ${columnCount}`);
    console.log(`📊 Estimated row count: ${Math.floor(fileSizeMB * 35)}`);
    
    // Detect complex structure
    const complexStructureKeywords = [
      'Introduction –',
      'Prerequisites –',
      'Theoretical Concepts –',
      'Implementation –',
      'Tags and Keywords –'
    ];
    
    const hasComplexStructure = columnCount > 100 || 
      complexStructureKeywords.some(keyword => 
        headers.some(header => header.includes(keyword))
      );
    
    console.log(`🏗️  Complex 42-section structure detected: ${hasComplexStructure ? 'YES' : 'NO'}`);
    
    // Determine processing strategy
    let recommendedProcessor: FileAnalysis['recommendedProcessor'];
    let processingStrategy: string;
    
    if (hasComplexStructure) {
      if (fileSizeMB > 100) {
        recommendedProcessor = 'streaming';
        processingStrategy = 'Large complex file → Streaming processor with 42-section parsing';
      } else {
        recommendedProcessor = 'advanced';
        processingStrategy = 'Complex structure → Advanced AI-powered parser';
      }
    } else {
      if (fileSizeMB > 50) {
        recommendedProcessor = 'chunked';
        processingStrategy = 'Large simple file → Chunked processor';
      } else {
        recommendedProcessor = 'simple';
        processingStrategy = 'Small simple file → JavaScript parser';
      }
    }
    
    console.log(`🎯 Recommended processor: ${recommendedProcessor.toUpperCase()}`);
    console.log(`📋 Strategy: ${processingStrategy}`);
    
    return {
      fileSizeMB,
      columnCount,
      estimatedRowCount: Math.floor(fileSizeMB * 35),
      isComplexStructure: hasComplexStructure,
      recommendedProcessor,
      processingStrategy
    };
    
  } catch (error) {
    console.error('❌ Error analyzing Excel file:', error);
    // Fallback analysis based on file size
    const stats = fs.statSync(filePath);
    const fileSizeMB = stats.size / (1024 * 1024);
    
    return {
      fileSizeMB,
      columnCount: fileSizeMB > 100 ? 295 : 10,
      estimatedRowCount: Math.floor(fileSizeMB * 35),
      isComplexStructure: fileSizeMB > 100,
      recommendedProcessor: fileSizeMB > 200 ? 'streaming' : 'advanced',
      processingStrategy: 'Fallback analysis → Size-based routing'
    };
  }
}

/**
 * Enhanced smart Excel loader with comprehensive logging and proper routing
 */
export async function smartLoadExcelData(filePath: string, options: ProcessingOptions = {}, forceReprocess: boolean = false): Promise<void> {
  const startTime = Date.now();
  console.log('\n🚀 STARTING SMART EXCEL PROCESSING');
  console.log('===================================');
  console.log(`📂 File: ${path.basename(filePath)}`);
  console.log(`⚡ Force reprocess: ${forceReprocess ? 'YES' : 'NO'}`);
  console.log(`🔧 Options:`, options);
  
  try {
    // Step 1: File Validation
    console.log('\n📋 STEP 1: FILE VALIDATION');
    console.log('---------------------------');
    
    if (!fs.existsSync(filePath)) {
      console.error(`❌ CRITICAL ERROR: File not found at ${filePath}`);
      throw new Error(`File not found: ${filePath}`);
    }
    console.log('✅ File exists');
    
    // Step 2: File Analysis
    console.log('\n📊 STEP 2: FILE ANALYSIS');
    console.log('-------------------------');
    
    const analysis = await analyzeExcelFile(filePath);
    console.log('✅ File analysis completed');
    
    // Step 3: Cache Check (unless forced)
    if (!forceReprocess) {
      console.log('\n💾 STEP 3: CACHE VALIDATION');
      console.log('----------------------------');
      
      const isCacheValid = await cacheManager.isCacheValid(filePath);
      console.log(`🔍 Cache valid: ${isCacheValid ? 'YES' : 'NO'}`);
      
      if (isCacheValid) {
        console.log('⚡ Loading from cache...');
        const cachedData = await cacheManager.loadFromCache(filePath);
        if (cachedData) {
          console.log('✅ Cache data loaded, importing to database...');
          
          const success = await importCachedData(cachedData);
          if (success) {
            const totalTime = (Date.now() - startTime) / 1000;
            console.log('\n🎉 PROCESSING COMPLETED SUCCESSFULLY (CACHED)');
            console.log('==============================================');
            console.log(`⏱️  Total time: ${totalTime.toFixed(2)} seconds`);
            return;
          } else {
            console.warn('⚠️  Cache import failed, proceeding with fresh processing');
          }
        }
      }
    } else {
      console.log('\n💾 STEP 3: CACHE BYPASS (FORCED REPROCESS)');
      console.log('-------------------------------------------');
      console.log('🔄 Skipping cache check due to force reprocess flag');
    }
    
    // Step 4: Processing Route Selection
    console.log('\n🎯 STEP 4: PROCESSING ROUTE SELECTION');
    console.log('--------------------------------------');
    console.log(`📋 Selected processor: ${analysis.recommendedProcessor.toUpperCase()}`);
    console.log(`🛠️  Strategy: ${analysis.processingStrategy}`);
    
    // Step 5: Execute Processing
    console.log('\n⚙️  STEP 5: PROCESSING EXECUTION');
    console.log('--------------------------------');
    
    let success = false;
    switch (analysis.recommendedProcessor) {
      case 'advanced':
        success = await processWithAdvancedParser(filePath, analysis, options);
        break;
        
      case 'streaming': 
        success = await processWithStreamingParser(filePath, analysis, options);
        break;
        
      case 'chunked':
        success = await processWithChunkedParser(filePath, analysis, options);
        break;
        
      case 'simple':
        success = await processWithSimpleParser(filePath, analysis, options);
        break;
        
      default:
        throw new Error(`Unknown processor type: ${analysis.recommendedProcessor}`);
    }
    
    // Step 6: Final Validation
    console.log('\n✅ STEP 6: FINAL VALIDATION');
    console.log('----------------------------');
    
    if (success) {
      const totalTime = (Date.now() - startTime) / 1000;
      console.log('\n🎉 PROCESSING COMPLETED SUCCESSFULLY');
      console.log('====================================');
      console.log(`📊 File: ${path.basename(filePath)}`);
      console.log(`📋 Processor: ${analysis.recommendedProcessor.toUpperCase()}`);
      console.log(`⏱️  Total time: ${totalTime.toFixed(2)} seconds`);
      console.log(`📈 Strategy: ${analysis.processingStrategy}`);
      
      // Validate database state
      await validateDatabaseState();
    } else {
      throw new Error('Processing completed but failed validation checks');
    }
    
  } catch (error) {
    const totalTime = (Date.now() - startTime) / 1000;
    console.error('\n💥 PROCESSING FAILED');
    console.error('====================');
    console.error(`❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    console.error(`⏱️  Failed after: ${totalTime.toFixed(2)} seconds`);
    console.error(`📂 File: ${path.basename(filePath)}`);
    
    if (error instanceof Error && error.stack) {
      console.error('📋 Stack trace:');
      console.error(error.stack);
    }
    
    throw error;
  }
}

/**
 * Import cached data with proper error handling and logging
 */
async function importCachedData(cachedData: any): Promise<boolean> {
  try {
    console.log('🔄 Importing cached data to database...');
    
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
      console.log(`✅ Cache data imported successfully:`);
      console.log(`   📂 ${importResult.imported.categories} categories`);
      console.log(`   📋 ${importResult.imported.subcategories} subcategories`);
      console.log(`   📊 ${importResult.imported.terms} terms`);
      return true;
    } else {
      console.error('❌ Cache import failed:', importResult.errors);
      return false;
    }
    
  } catch (error) {
    console.error('❌ Error importing cached data:', error);
    return false;
  }
}

/**
 * Process with Advanced Parser (for 42-section complex files)
 */
async function processWithAdvancedParser(filePath: string, analysis: FileAnalysis, options: ProcessingOptions): Promise<boolean> {
  console.log('🧠 Starting ADVANCED PARSER processing...');
  console.log('📋 Using AI-powered 42-section extraction');
  
  try {
    const { AdvancedExcelParser, importComplexTerms } = await import('./advancedExcelParser');
    
    const parser = new AdvancedExcelParser();
    const buffer = fs.readFileSync(filePath);
    
    console.log('🔄 Parsing complex Excel structure...');
    const parsedTerms = await parser.parseComplexExcel(buffer);
    
    console.log(`✅ Parsed ${parsedTerms.length} complex terms`);
    console.log('🔄 Importing to enhanced database schema...');
    
    await importComplexTerms(parsedTerms);
    
    console.log('✅ Advanced parser processing completed successfully');
    return true;
    
  } catch (error) {
    console.error('❌ Advanced parser failed:', error);
    return false;
  }
}

/**
 * Process with Streaming Parser (for very large complex files)
 */
async function processWithStreamingParser(filePath: string, analysis: FileAnalysis, options: ProcessingOptions): Promise<boolean> {
  console.log('🌊 Starting STREAMING PARSER processing...');
  console.log('📋 Using memory-efficient streaming with 42-section support');
  
  try {
    const { StreamingExcelProcessor } = await import('../streaming_excel_processor');
    
    const processor = new StreamingExcelProcessor({
      batchSize: options.chunkSize || 25,
      maxMemoryMB: 1024,
      progressCallback: options.enableProgress ? (processed, total) => {
        if (processed % 100 === 0) {
          const percentage = ((processed / total) * 100).toFixed(1);
          console.log(`📈 Streaming progress: ${percentage}% (${processed}/${total})`);
        }
      } : undefined
    });
    
    await processor.processFile(filePath);
    
    console.log('✅ Streaming parser processing completed successfully');
    return true;
    
  } catch (error) {
    console.error('❌ Streaming parser failed:', error);
    return false;
  }
}

/**
 * Process with Chunked Parser (for large simple files)
 */
async function processWithChunkedParser(filePath: string, analysis: FileAnalysis, options: ProcessingOptions): Promise<boolean> {
  console.log('📦 Starting CHUNKED PARSER processing...');
  console.log('📋 Using chunk-based processing for large files');
  
  try {
    const { ChunkedExcelProcessor } = await import('../chunked_excel_processor');
    
    const processor = new ChunkedExcelProcessor({
      chunkSize: options.chunkSize || 50,
      batchSize: 10
    });
    
    await processor.processFile(filePath);
    
    console.log('✅ Chunked parser processing completed successfully');
    return true;
    
  } catch (error) {
    console.error('❌ Chunked parser failed:', error);
    return false;
  }
}

/**
 * Process with Simple Parser (for small simple files)
 */
async function processWithSimpleParser(filePath: string, analysis: FileAnalysis, options: ProcessingOptions): Promise<boolean> {
  console.log('📄 Starting SIMPLE PARSER processing...');
  console.log('📋 Using JavaScript-based parser for small files');
  
  try {
    const { parseExcelFile, importToDatabase } = await import('./excelParser');
    
    const buffer = fs.readFileSync(filePath);
    console.log('🔄 Parsing Excel file...');
    const parsedData = await parseExcelFile(buffer);
    
    console.log(`✅ Parsed ${parsedData.terms.length} terms`);
    console.log('🔄 Importing to database...');
    
    const result = await importToDatabase(parsedData);
    
    console.log(`✅ Imported ${result.termsImported} terms and ${result.categoriesImported} categories`);
    return true;
    
  } catch (error) {
    console.error('❌ Simple parser failed:', error);
    return false;
  }
}

/**
 * Validate database state after processing
 */
async function validateDatabaseState(): Promise<void> {
  console.log('🔍 Validating database state...');
  
  try {
    // TODO: Add actual database validation queries
    // For now, just log that validation is needed
    console.log('⚠️  Database validation not yet implemented');
    console.log('✅ Skipping validation for now');
    
  } catch (error) {
    console.error('❌ Database validation failed:', error);
    throw error;
  }
}
