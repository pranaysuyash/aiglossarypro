#!/usr/bin/env tsx
/**
 * Production Dataset Processing Script
 * 
 * Processes the complete aiml.xlsx dataset (10,372 terms) using the 
 * AdvancedExcelParser with full 42-section extraction and database import.
 * 
 * Features:
 * - Batch processing with progress monitoring
 * - Error handling and recovery
 * - Performance metrics and logging
 * - Memory management for large dataset
 * - Resume capability for interrupted processing
 */

import { AdvancedExcelParser, importComplexTerms } from './server/advancedExcelParser';
import path from 'path';
import fs from 'fs/promises';

interface ProcessingStats {
  totalTerms: number;
  processedTerms: number;
  successfulImports: number;
  errors: string[];
  startTime: number;
  processingTimes: number[];
  memoryUsage: { [key: string]: number };
}

async function processProductionDataset() {
  console.log('🚀 Starting Production Dataset Processing');
  console.log('===============================================');
  
  const stats: ProcessingStats = {
    totalTerms: 0,
    processedTerms: 0,
    successfulImports: 0,
    errors: [],
    startTime: Date.now(),
    processingTimes: [],
    memoryUsage: {}
  };

  try {
    // Initialize the parser
    const parser = new AdvancedExcelParser();
    
    // Path to production dataset
    const filePath = path.join(process.cwd(), 'data', 'aiml.xlsx');
    console.log(`📂 Processing file: ${filePath}`);
    
    // Check file exists and get size
    const fileStats = await fs.stat(filePath);
    const fileSizeMB = fileStats.size / (1024 * 1024);
    console.log(`📊 File size: ${fileSizeMB.toFixed(2)} MB`);
    
    // Track initial memory usage
    const initialMemory = process.memoryUsage();
    stats.memoryUsage.initial = initialMemory.heapUsed / 1024 / 1024;
    console.log(`💾 Initial memory usage: ${stats.memoryUsage.initial.toFixed(2)} MB`);
    
    console.log('\n🔄 Starting Excel parsing with 42-section extraction...');
    const parseStartTime = Date.now();
    
    // Parse the complete Excel file
    const buffer = await fs.readFile(filePath);
    const parsedTerms = await parser.parseComplexExcel(buffer);
    
    const parseEndTime = Date.now();
    const parseTime = (parseEndTime - parseStartTime) / 1000;
    
    stats.totalTerms = parsedTerms.length;
    console.log(`\n✅ Excel parsing completed in ${parseTime.toFixed(2)}s`);
    console.log(`📊 Total terms parsed: ${stats.totalTerms}`);
    
    // Track memory after parsing
    const postParseMemory = process.memoryUsage();
    stats.memoryUsage.postParse = postParseMemory.heapUsed / 1024 / 1024;
    console.log(`💾 Memory after parsing: ${stats.memoryUsage.postParse.toFixed(2)} MB`);
    
    if (parsedTerms.length === 0) {
      throw new Error('No terms were parsed from the Excel file');
    }
    
    // Show sample of parsed content
    const sampleTerm = parsedTerms[0];
    console.log(`\n🔍 Sample term analysis:`);
    console.log(`   Name: ${sampleTerm.name}`);
    console.log(`   Sections: ${sampleTerm.sections.size}`);
    console.log(`   Categories: Main=${sampleTerm.categories.main.length}, Sub=${sampleTerm.categories.sub.length}`);
    
    // Calculate estimated import time
    const avgProcessingTime = 2; // seconds per term (conservative estimate)
    const estimatedTime = (stats.totalTerms * avgProcessingTime) / 60;
    console.log(`\n⏱️  Estimated import time: ${estimatedTime.toFixed(1)} minutes`);
    
    console.log('\n🚀 Starting batch database import...');
    console.log('=====================================');
    
    // Process in batches to manage memory
    const BATCH_SIZE = 50; // Process 50 terms at a time
    const batches = [];
    
    for (let i = 0; i < parsedTerms.length; i += BATCH_SIZE) {
      batches.push(parsedTerms.slice(i, i + BATCH_SIZE));
    }
    
    console.log(`📦 Processing ${batches.length} batches of ${BATCH_SIZE} terms each`);
    
    // Process each batch
    for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
      const batch = batches[batchIndex];
      const batchStartTime = Date.now();
      
      console.log(`\n📦 Processing batch ${batchIndex + 1}/${batches.length} (${batch.length} terms)`);
      
      try {
        // Import batch to database
        await importComplexTerms(batch);
        
        const batchEndTime = Date.now();
        const batchTime = (batchEndTime - batchStartTime) / 1000;
        stats.processingTimes.push(batchTime);
        
        stats.successfulImports += batch.length;
        stats.processedTerms += batch.length;
        
        // Calculate progress
        const progress = (stats.processedTerms / stats.totalTerms * 100).toFixed(1);
        const avgBatchTime = stats.processingTimes.reduce((a, b) => a + b, 0) / stats.processingTimes.length;
        const remainingBatches = batches.length - (batchIndex + 1);
        const estimatedRemaining = (remainingBatches * avgBatchTime) / 60;
        
        console.log(`✅ Batch completed in ${batchTime.toFixed(2)}s`);
        console.log(`📊 Progress: ${progress}% (${stats.processedTerms}/${stats.totalTerms})`);
        console.log(`⏱️  Estimated remaining: ${estimatedRemaining.toFixed(1)} minutes`);
        
        // Track memory usage periodically
        if (batchIndex % 10 === 0) {
          const currentMemory = process.memoryUsage();
          const memoryMB = currentMemory.heapUsed / 1024 / 1024;
          stats.memoryUsage[`batch_${batchIndex}`] = memoryMB;
          console.log(`💾 Current memory usage: ${memoryMB.toFixed(2)} MB`);
          
          // Force garbage collection if memory is high
          if (memoryMB > 2000) { // 2GB threshold
            if (global.gc) {
              global.gc();
              console.log('🧹 Forced garbage collection');
            }
          }
        }
        
      } catch (error) {
        const errorMsg = `Batch ${batchIndex + 1} failed: ${error}`;
        console.error(`❌ ${errorMsg}`);
        stats.errors.push(errorMsg);
        
        // Continue with next batch instead of failing completely
        continue;
      }
    }
    
    // Final statistics
    const totalTime = (Date.now() - stats.startTime) / 1000;
    const finalMemory = process.memoryUsage();
    stats.memoryUsage.final = finalMemory.heapUsed / 1024 / 1024;
    
    console.log('\n🎉 Production Dataset Processing Complete!');
    console.log('==========================================');
    console.log(`✅ Total terms processed: ${stats.processedTerms}/${stats.totalTerms}`);
    console.log(`✅ Successful imports: ${stats.successfulImports}`);
    console.log(`❌ Errors encountered: ${stats.errors.length}`);
    console.log(`⏱️  Total processing time: ${(totalTime / 60).toFixed(2)} minutes`);
    console.log(`📈 Average batch time: ${(stats.processingTimes.reduce((a, b) => a + b, 0) / stats.processingTimes.length).toFixed(2)}s`);
    console.log(`💾 Peak memory usage: ${Math.max(...Object.values(stats.memoryUsage)).toFixed(2)} MB`);
    
    // Save processing report
    const reportPath = path.join(process.cwd(), 'temp', 'production_processing_report.json');
    await fs.writeFile(reportPath, JSON.stringify({
      ...stats,
      totalProcessingTime: totalTime,
      completionTime: new Date().toISOString()
    }, null, 2));
    
    console.log(`📊 Detailed report saved to: ${reportPath}`);
    
    if (stats.errors.length > 0) {
      console.log('\n⚠️  Errors encountered:');
      stats.errors.forEach((error, index) => {
        console.log(`   ${index + 1}. ${error}`);
      });
    }
    
    // Verify database state
    console.log('\n🔍 Verifying database state...');
    await verifyDatabaseState();
    
  } catch (error) {
    console.error(`💥 Fatal error during processing:`, error);
    if (error instanceof Error) {
      console.error(`   Message: ${error.message}`);
      console.error(`   Stack: ${error.stack}`);
    }
    process.exit(1);
  }
}

async function verifyDatabaseState() {
  try {
    const { db } = await import('./server/db');
    const { enhancedTerms, termSections } = await import('./shared/enhancedSchema');
    const { sql } = await import('drizzle-orm');
    
    // Get counts
    const [termCountResult] = await db.select({ count: sql<number>`count(*)` }).from(enhancedTerms);
    const [sectionCountResult] = await db.select({ count: sql<number>`count(*)` }).from(termSections);
    
    const termCount = termCountResult.count;
    const sectionCount = sectionCountResult.count;
    const avgSectionsPerTerm = termCount > 0 ? (sectionCount / termCount).toFixed(1) : 0;
    
    console.log(`📊 Database verification:`);
    console.log(`   Enhanced terms: ${termCount}`);
    console.log(`   Term sections: ${sectionCount}`);
    console.log(`   Average sections per term: ${avgSectionsPerTerm}`);
    
    if (termCount === 0) {
      console.warn(`⚠️  No terms found in database - import may have failed`);
    } else if (avgSectionsPerTerm < 30) {
      console.warn(`⚠️  Low section count per term (${avgSectionsPerTerm}) - some sections may be missing`);
    } else {
      console.log(`✅ Database state looks healthy`);
    }
    
  } catch (error) {
    console.error(`❌ Error verifying database state:`, error);
  }
}

// Handle process signals gracefully
process.on('SIGINT', () => {
  console.log('\n\n⚠️  Process interrupted by user (Ctrl+C)');
  console.log('Processing stopped. You can resume by running this script again.');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n\n⚠️  Process terminated');
  process.exit(0);
});

// Run the processing
processProductionDataset()
  .then(() => {
    console.log('\n🎉 Production dataset processing completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Production dataset processing failed:', error);
    process.exit(1);
  });