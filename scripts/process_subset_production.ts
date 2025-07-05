#!/usr/bin/env tsx
/**
 * Process Subset of Production Dataset
 * 
 * Processes a limited number of terms from aiml.xlsx to validate the
 * complete 42-section pipeline before attempting the full dataset.
 */

import { AdvancedExcelParser, importComplexTerms } from './server/advancedExcelParser';
import path from 'path';
import fs from 'fs/promises';

async function processSubsetProduction() {
  console.log('🚀 Processing Production Dataset Subset (First 50 Terms)');
  console.log('========================================================');
  
  try {
    // Initialize the parser
    const parser = new AdvancedExcelParser();
    
    // Use the main dataset
    const filePath = path.join(process.cwd(), 'data', 'aiml.xlsx');
    console.log(`📂 Processing file: ${filePath}`);
    
    // Track memory usage
    const initialMemory = process.memoryUsage();
    console.log(`💾 Initial memory: ${(initialMemory.heapUsed / 1024 / 1024).toFixed(2)} MB`);
    
    console.log('🔄 Loading and parsing Excel file...');
    const startTime = Date.now();
    
    // Read and parse the file
    const buffer = await fs.readFile(filePath);
    const parsedTerms = await parser.parseComplexExcel(buffer);
    
    const parseTime = (Date.now() - startTime) / 1000;
    const postParseMemory = process.memoryUsage();
    
    console.log(`✅ Parsing completed in ${parseTime.toFixed(2)}s`);
    console.log(`📊 Total terms parsed: ${parsedTerms.length}`);
    console.log(`💾 Memory after parsing: ${(postParseMemory.heapUsed / 1024 / 1024).toFixed(2)} MB`);
    
    // Take subset for processing
    const SUBSET_SIZE = 50;
    const subset = parsedTerms.slice(0, SUBSET_SIZE);
    
    console.log(`\n🧪 Processing subset of ${subset.length} terms for validation`);
    
    // Show what we're processing
    console.log('\n📋 Sample terms in subset:');
    subset.slice(0, 5).forEach((term, index) => {
      console.log(`   ${index + 1}. ${term.name} (${term.sections.size} sections)`);
    });
    if (subset.length > 5) {
      console.log(`   ... and ${subset.length - 5} more terms`);
    }
    
    // Process subset in smaller batches
    const BATCH_SIZE = 10;
    const batches = [];
    for (let i = 0; i < subset.length; i += BATCH_SIZE) {
      batches.push(subset.slice(i, i + BATCH_SIZE));
    }
    
    console.log(`\n🔄 Processing ${batches.length} batches of ${BATCH_SIZE} terms each`);
    
    let successfulImports = 0;
    const batchTimes = [];
    
    for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
      const batch = batches[batchIndex];
      const batchStartTime = Date.now();
      
      console.log(`\n📦 Processing batch ${batchIndex + 1}/${batches.length} (${batch.length} terms)`);
      
      try {
        await importComplexTerms(batch);
        
        const batchTime = (Date.now() - batchStartTime) / 1000;
        batchTimes.push(batchTime);
        successfulImports += batch.length;
        
        console.log(`✅ Batch ${batchIndex + 1} completed in ${batchTime.toFixed(2)}s`);
        console.log(`📈 Progress: ${successfulImports}/${subset.length} terms processed`);
        
        // Memory check
        const currentMemory = process.memoryUsage();
        console.log(`💾 Current memory: ${(currentMemory.heapUsed / 1024 / 1024).toFixed(2)} MB`);
        
      } catch (error) {
        console.error(`❌ Batch ${batchIndex + 1} failed:`, error);
        continue;
      }
    }
    
    // Final statistics
    const totalTime = (Date.now() - startTime) / 1000;
    const avgBatchTime = batchTimes.reduce((a, b) => a + b, 0) / batchTimes.length;
    const avgTimePerTerm = avgBatchTime / BATCH_SIZE;
    
    console.log('\n🎉 Subset Processing Complete!');
    console.log('================================');
    console.log(`✅ Successfully processed: ${successfulImports}/${subset.length} terms`);
    console.log(`⏱️  Total time: ${totalTime.toFixed(2)}s`);
    console.log(`📈 Average time per term: ${avgTimePerTerm.toFixed(2)}s`);
    console.log(`📈 Average batch time: ${avgBatchTime.toFixed(2)}s`);
    
    // Extrapolate to full dataset
    const totalTerms = parsedTerms.length;
    const estimatedFullTime = (totalTerms * avgTimePerTerm) / 60; // minutes
    const estimatedFullTimeHours = estimatedFullTime / 60;
    
    console.log('\n📊 Full Dataset Projections:');
    console.log(`   Total terms available: ${totalTerms}`);
    console.log(`   Estimated processing time: ${estimatedFullTime.toFixed(1)} minutes (${estimatedFullTimeHours.toFixed(1)} hours)`);
    console.log(`   Estimated database sections: ${(totalTerms * 42).toLocaleString()}`);
    
    // Verify the import
    console.log('\n🔍 Verifying database import...');
    await verifySubsetImport(subset);
    
    // Memory summary
    const finalMemory = process.memoryUsage();
    console.log(`\n💾 Memory Summary:`);
    console.log(`   Initial: ${(initialMemory.heapUsed / 1024 / 1024).toFixed(2)} MB`);
    console.log(`   After parsing: ${(postParseMemory.heapUsed / 1024 / 1024).toFixed(2)} MB`);
    console.log(`   Final: ${(finalMemory.heapUsed / 1024 / 1024).toFixed(2)} MB`);
    
    console.log('\n✅ Subset processing validation successful!');
    console.log('Ready to proceed with full dataset if needed.');
    
  } catch (error) {
    console.error('💥 Subset processing failed:', error);
    throw error;
  }
}

async function verifySubsetImport(subset: any[]) {
  try {
    const { db } = await import('./server/db');
    const { enhancedTerms, termSections } = await import('./shared/enhancedSchema');
    const { sql, inArray } = await import('drizzle-orm');
    
    // Check if terms were imported
    const termNames = subset.map(t => t.name);
    const importedTerms = await db
      .select()
      .from(enhancedTerms)
      .where(inArray(enhancedTerms.name, termNames));
    
    console.log(`✅ Found ${importedTerms.length}/${subset.length} terms in database`);
    
    if (importedTerms.length > 0) {
      // Check total sections
      const termIds = importedTerms.map(t => t.id);
      const [sectionCountResult] = await db
        .select({ count: sql<number>`count(*)` })
        .from(termSections)
        .where(inArray(termSections.termId, termIds));
      
      const totalSections = sectionCountResult.count;
      const avgSectionsPerTerm = totalSections / importedTerms.length;
      
      console.log(`✅ Total sections imported: ${totalSections}`);
      console.log(`✅ Average sections per term: ${avgSectionsPerTerm.toFixed(1)}`);
      
      if (avgSectionsPerTerm >= 35) {
        console.log('✅ Section count looks excellent (35+ sections per term)');
      } else if (avgSectionsPerTerm >= 20) {
        console.log('⚠️  Section count is moderate (20+ sections per term)');
      } else {
        console.warn(`⚠️  Low section count: ${avgSectionsPerTerm.toFixed(1)} sections per term`);
      }
      
      // Sample section content
      const sampleSections = await db
        .select()
        .from(termSections)
        .where(sql`term_id = ${importedTerms[0].id}`)
        .limit(3);
      
      console.log(`\n📄 Sample sections for "${importedTerms[0].name}":`);
      sampleSections.forEach(section => {
        const contentSize = JSON.stringify(section.sectionData).length;
        console.log(`   - ${section.sectionName}: ${contentSize} chars`);
      });
    }
    
  } catch (error) {
    console.error('❌ Verification failed:', error);
    throw error;
  }
}

// Run the subset processing
processSubsetProduction()
  .then(() => {
    console.log('\n🎉 Subset production processing completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Subset production processing failed:', error);
    process.exit(1);
  });