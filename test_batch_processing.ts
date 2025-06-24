#!/usr/bin/env tsx
/**
 * Test Batch Processing Script
 * 
 * Tests the production processing pipeline with a limited number of terms
 * to verify functionality before running the complete dataset.
 */

import { AdvancedExcelParser, importComplexTerms } from './server/advancedExcelParser';
import path from 'path';
import fs from 'fs/promises';

async function testBatchProcessing() {
  console.log('🧪 Testing Batch Processing Pipeline');
  console.log('====================================');
  
  try {
    // Initialize the parser
    const parser = new AdvancedExcelParser();
    
    // Use the main dataset but limit processing
    const filePath = path.join(process.cwd(), 'data', 'aiml.xlsx');
    console.log(`📂 Processing file: ${filePath}`);
    
    console.log('🔄 Reading Excel file...');
    const buffer = await fs.readFile(filePath);
    
    console.log('🔄 Parsing Excel with 42-section extraction...');
    const startParseTime = Date.now();
    const parsedTerms = await parser.parseComplexExcel(buffer);
    const parseTime = (Date.now() - startParseTime) / 1000;
    
    console.log(`✅ Parsing completed in ${parseTime.toFixed(2)}s`);
    console.log(`📊 Total terms available: ${parsedTerms.length}`);
    
    // Test with first 5 terms only
    const testTerms = parsedTerms.slice(0, 5);
    console.log(`🧪 Testing with ${testTerms.length} terms`);
    
    // Show what we're testing
    console.log('\n📋 Test terms:');
    testTerms.forEach((term, index) => {
      console.log(`   ${index + 1}. ${term.name} (${term.sections.size} sections)`);
    });
    
    console.log('\n🚀 Starting database import test...');
    const importStartTime = Date.now();
    
    try {
      await importComplexTerms(testTerms);
      const importTime = (Date.now() - importStartTime) / 1000;
      
      console.log(`✅ Import completed in ${importTime.toFixed(2)}s`);
      console.log(`📈 Average time per term: ${(importTime / testTerms.length).toFixed(2)}s`);
      
      // Verify the import
      console.log('\n🔍 Verifying import...');
      await verifyTestImport(testTerms);
      
      // Calculate full dataset estimates
      const totalTerms = parsedTerms.length;
      const estimatedTimeMinutes = (totalTerms * (importTime / testTerms.length)) / 60;
      
      console.log('\n📊 Full Dataset Estimates:');
      console.log(`   Total terms to process: ${totalTerms}`);
      console.log(`   Estimated processing time: ${estimatedTimeMinutes.toFixed(1)} minutes`);
      console.log(`   Estimated database size increase: ~${(totalTerms * 42).toLocaleString()} sections`);
      
    } catch (error) {
      console.error('❌ Import failed:', error);
      throw error;
    }
    
  } catch (error) {
    console.error('💥 Test failed:', error);
    throw error;
  }
}

async function verifyTestImport(testTerms: any[]) {
  try {
    const { db } = await import('./server/db');
    const { enhancedTerms, termSections } = await import('./shared/enhancedSchema');
    const { sql, inArray } = await import('drizzle-orm');
    
    // Check if terms were imported
    const termNames = testTerms.map(t => t.name);
    const importedTerms = await db
      .select()
      .from(enhancedTerms)
      .where(inArray(enhancedTerms.name, termNames));
    
    console.log(`✅ Found ${importedTerms.length}/${testTerms.length} terms in database`);
    
    if (importedTerms.length > 0) {
      // Check sections for first term
      const firstTerm = importedTerms[0];
      const sections = await db
        .select()
        .from(termSections)
        .where(sql`term_id = ${firstTerm.id}`);
      
      console.log(`✅ First term "${firstTerm.name}" has ${sections.length} sections`);
      
      if (sections.length >= 30) {
        console.log('✅ Section count looks good (30+ sections)');
      } else {
        console.warn(`⚠️  Low section count: ${sections.length} sections`);
      }
    }
    
  } catch (error) {
    console.error('❌ Verification failed:', error);
    throw error;
  }
}

// Run the test
testBatchProcessing()
  .then(() => {
    console.log('\n🎉 Batch processing test completed successfully!');
    console.log('Ready to proceed with full dataset processing.');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Batch processing test failed:', error);
    process.exit(1);
  });