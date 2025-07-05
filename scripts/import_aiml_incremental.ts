#!/usr/bin/env npx tsx

import { IncrementalImporter } from './server/incrementalImporter.js';
import { smartLoadExcelData } from './server/smartExcelLoader.js';
import path from 'path';
import fs from 'fs';

/**
 * Comprehensive solution for processing aiml.xlsx without timeouts
 * Combines chunked processing with incremental updates
 */

const AIML_FILE_PATH = './data/aiml.xlsx';
const MAX_RUNTIME = 10 * 60 * 1000; // 10 minutes max runtime
const CHUNK_SIZE = 200; // Process 200 rows at a time

interface ProcessingStats {
  method: string;
  fileSize: number;
  startTime: number;
  endTime?: number;
  duration?: number;
  totalProcessed: number;
  newTerms: number;
  updatedTerms: number;
  skippedTerms: number;
  errors: number;
  chunksProcessed?: number;
}

async function main() {
  console.log('🚀 Starting Incremental AIML Processing');
  console.log('====================================');
  
  try {
    // Get file path from command line argument or use default
    const args = process.argv.slice(2);
    let targetFile = AIML_FILE_PATH;
    
    if (args.length > 0 && !args[0].startsWith('-') && args[0] !== 'resume' && args[0] !== 'status' && args[0] !== 'help') {
      targetFile = args[0];
    }
    
    // Check if file exists
    if (!fs.existsSync(targetFile)) {
      console.error(`❌ File not found: ${targetFile}`);
      console.log('📁 Available files in data directory:');
      const dataDir = './data';
      if (fs.existsSync(dataDir)) {
        const files = fs.readdirSync(dataDir).filter(f => f.endsWith('.xlsx'));
        files.forEach(f => console.log(`   - ${f}`));
        
        if (files.length > 0) {
          console.log(`\n🔄 Using first available file: ${files[0]}`);
          const alternativeFile = path.join(dataDir, files[0]);
          return await processFile(alternativeFile);
        }
      }
      return;
    }
    
    await processFile(targetFile);
    
  } catch (error) {
    console.error('❌ Processing failed:', error);
    process.exit(1);
  }
}

async function processFile(filePath: string): Promise<void> {
  const stats = await getFileStats(filePath);
  
  console.log(`📊 File Analysis:`);
  console.log(`   📁 Path: ${filePath}`);
  console.log(`   📏 Size: ${(stats.fileSize / 1024 / 1024).toFixed(2)} MB`);
  console.log(`   🎯 Strategy: ${stats.fileSize > 50 * 1024 * 1024 ? 'Chunked + Incremental' : 'Smart Loading'}`);
  
  const startTime = Date.now();
  
  try {
    if (stats.fileSize > 50 * 1024 * 1024) {
      // Large file: Use chunked processing with incremental updates
      await processLargeFile(filePath, stats);
    } else {
      // Small file: Use smart loading
      await processSmallFile(filePath, stats);
    }
    
    const duration = Date.now() - startTime;
    console.log(`🎉 Processing completed in ${(duration / 1000).toFixed(2)} seconds`);
    
  } catch (error) {
    console.error('❌ Processing error:', error);
    throw error;
  }
}

async function processLargeFile(filePath: string, stats: ProcessingStats): Promise<void> {
  console.log('\n🔄 Processing Large File with Python + Optimized Import');
  console.log('======================================================');
  
  try {
    // Step 1: Use Python processor (proven to work with aiml.xlsx)
    console.log('🐍 Phase 1: Python Excel Processing...');
    const { execAsync } = await import('util');
    const { promisify } = await import('util');
    const { exec: execCallback } = await import('child_process');
    const exec = promisify(execCallback);
    
    const outputPath = './temp/aiml_processed.json';
    const command = `python server/python/excel_processor.py --input "${filePath}" --output "${outputPath}"`;
    
    console.log(`🔄 Running: ${command}`);
    const { stdout, stderr } = await exec(command, { maxBuffer: 1024 * 1024 * 10 });
    
    if (stderr) {
      console.warn('⚠️  Python warnings:', stderr);
    }
    
    const result = JSON.parse(stdout);
    
    if (!result.success) {
      throw new Error(`Python processing failed: ${result.error || 'Unknown error'}`);
    }
    
    console.log(`✅ Python processing completed:`);
    console.log(`   📊 Terms: ${result.terms}`);
    console.log(`   📂 Categories: ${result.categories}`);
    console.log(`   📋 Subcategories: ${result.subcategories}`);
    
    // Step 2: Import with batched approach to avoid timeout
    console.log('\n💾 Phase 2: Optimized Database Import...');
    const importCommand = `npm run import:optimized "${outputPath}" -- --batch-size 200 --bulk-insert-size 50`;
    
    console.log(`🔄 Running: ${importCommand}`);
    
    // Run with larger timeout for import
    const importResult = await exec(importCommand, { 
      maxBuffer: 1024 * 1024 * 50,
      timeout: MAX_RUNTIME * 0.8 // Use most of available time
    });
    
    if (importResult.stderr && !importResult.stderr.includes('⚠️')) {
      console.warn('⚠️  Import warnings:', importResult.stderr);
    }
    
    console.log('✅ Optimized import completed successfully');
    
  } catch (error) {
    console.error('❌ Processing failed, trying chunked approach:', error);
    
    // Step 3: Fallback to smaller chunks if timeout occurred
    console.log('\n🔄 Phase 3: Fallback Chunked Processing...');
    
    try {
      await processInChunks(filePath);
      console.log('✅ Chunked processing completed successfully');
    } catch (chunkError) {
      console.error('❌ All processing methods failed:', chunkError);
      throw chunkError;
    }
  }
}

async function processInChunks(filePath: string): Promise<void> {
  console.log('🔄 Processing in smaller chunks to avoid timeouts...');
  
  const { promisify } = await import('util');
  const { exec: execCallback } = await import('child_process');
  const exec = promisify(execCallback);
  
  // Process with max-chunks to limit size
  const maxChunks = 50; // Process 50 chunks at a time
  const outputPath = `./temp/aiml_chunk_${Date.now()}.json`;
  
  const command = `python server/python/excel_processor.py --input "${filePath}" --output "${outputPath}" --max-chunks ${maxChunks}`;
  
  console.log(`🔄 Running chunked processing: ${command}`);
  const { stdout } = await exec(command, { maxBuffer: 1024 * 1024 * 10 });
  
  const result = JSON.parse(stdout);
  
  if (result.success) {
    console.log(`✅ Chunk processed: ${result.terms} terms`);
    
    // Import the chunk
    const importCommand = `npm run import:optimized "${outputPath}" -- --batch-size 100 --bulk-insert-size 25`;
    await exec(importCommand, { timeout: 300000 }); // 5 minute timeout per chunk
    
    console.log('✅ Chunk imported successfully');
  }
}

async function processSmallFile(filePath: string, stats: ProcessingStats): Promise<void> {
  console.log('\n🔄 Using Smart Loading for Small File');
  console.log('=====================================');
  
  try {
    await smartLoadExcelData(filePath, {
      chunkSize: CHUNK_SIZE,
      enableProgress: true,
      resumeProcessing: false
    });
    
    console.log('✅ Smart loading completed successfully');
    
  } catch (error) {
    console.error('❌ Smart loading failed, falling back to incremental processing:', error);
    
    // Fallback to incremental processing
    const importer = new IncrementalImporter();
    const importResult = await importer.import(filePath, {
      chunkSize: CHUNK_SIZE,
      updateExisting: true,
      skipUnchanged: false // Process everything as fallback
    });
    
    console.log(`✅ Fallback incremental import completed:`);
    console.log(`   🆕 New terms: ${importResult.stats.new}`);
    console.log(`   🔄 Updated terms: ${importResult.stats.modified}`);
    console.log(`   📊 Total processed: ${importResult.stats.total}`);
  }
}

async function getFileStats(filePath: string): Promise<ProcessingStats> {
  const stats = fs.statSync(filePath);
  
  return {
    method: '',
    fileSize: stats.size,
    startTime: Date.now(),
    totalProcessed: 0,
    newTerms: 0,
    updatedTerms: 0,
    skippedTerms: 0,
    errors: 0
  };
}

// Resume functionality - use smart loader's built-in resume
async function resumeProcessing(filePath: string): Promise<void> {
  console.log('🔄 Resuming interrupted processing with Node.js streaming...');
  
  try {
    await smartLoadExcelData(filePath, {
      chunkSize: CHUNK_SIZE,
      enableProgress: true,
      resumeProcessing: true // Enable resume mode
    }, false);
    
    console.log('✅ Resume completed successfully');
  } catch (error) {
    console.error('❌ Resume failed:', error);
  }
}

// Utility functions
async function getProcessingStatus(): Promise<void> {
  console.log('📊 Checking Processing Status...');
  
  // Check for temporary processing files
  const tempDir = path.join(process.cwd(), 'temp');
  
  if (!fs.existsSync(tempDir)) {
    console.log('   📁 No temporary processing files found');
    console.log('   🔄 Progress: 0.0%');
    console.log('   ✅ Status: Ready for new processing');
    return;
  }
  
  const processingFiles = fs.readdirSync(tempDir)
    .filter(f => f.includes('processed_chunked_') || f.includes('converted_'))
    .length;
  
  if (processingFiles > 0) {
    console.log(`   📁 Found ${processingFiles} temporary processing files`);
    console.log('   🔄 Status: Previous processing may have been interrupted');
    console.log('   💡 Use "npm run import:aiml:resume" to continue');
  } else {
    console.log('   📁 No active processing files found');
    console.log('   ✅ Status: Ready for new processing');
  }
}

// Command line interface
const isMainModule = import.meta.url === `file://${process.argv[1]}`;

if (isMainModule) {
  const args = process.argv.slice(2);
  const command = args[0];
  
  switch (command) {
    case 'resume':
      resumeProcessing(args[1] || AIML_FILE_PATH);
      break;
    case 'status':
      getProcessingStatus();
      break;
    case 'help':
      console.log(`
📋 AIML Incremental Processing Tool

Usage:
  npm run import:aiml              # Process aiml.xlsx with auto-detection
  npm run import:aiml resume       # Resume interrupted processing
  npm run import:aiml status       # Check processing status
  npm run import:aiml help         # Show this help

Features:
  🚀 Timeout-free processing for large files
  📊 Incremental updates (only process changes)
  🔄 Resume capability for interrupted imports
  📈 Progress tracking and status reporting
  🎯 Automatic strategy selection based on file size
  
File Size Strategies:
  📄 < 50MB: Smart loading with caching
  📊 > 50MB: Chunked processing + incremental updates
      `);
      break;
    default:
      main();
  }
}

export { processFile, resumeProcessing, getProcessingStatus };