#!/usr/bin/env node

// scripts/test296WithGemini.ts
// Test the complete 296-column implementation with Gemini API

import { ALL_296_COLUMNS } from '../shared/all296ColumnDefinitions';
import { ALL_296_PROMPT_TRIPLETS, getPromptTripletByColumnId } from '../server/prompts/all296PromptTriplets';
import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

async function testSingleColumn(termName: string, columnId: string) {
  console.log(`\n🧪 Testing Column: ${columnId}`);
  
  const column = ALL_296_COLUMNS.find(c => c.id === columnId);
  if (!column) {
    throw new Error(`Column ${columnId} not found`);
  }
  
  const promptTriplet = getPromptTripletByColumnId(columnId);
  if (!promptTriplet) {
    throw new Error(`Prompt triplet for ${columnId} not found`);
  }
  
  console.log(`📝 Column ${column.order}: ${column.displayName}`);
  console.log(`📄 Description: ${column.description}`);
  console.log(`🎯 Category: ${column.category}`);
  console.log(`📊 Estimated Tokens: ${column.estimatedTokens}`);
  
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });
    
    // Replace [TERM] placeholder with actual term name
    const prompt = promptTriplet.generativePrompt.replace(/\[TERM\]/g, termName);
    
    console.log(`\n⏳ Generating content for term: ${termName}...`);
    
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    console.log(`\n✅ Generated Content:`);
    console.log('=====================================');
    console.log(text);
    console.log('=====================================\n');
    
    return {
      success: true,
      columnId,
      termName,
      content: text,
      tokenCount: text.split(/\s+/).length // rough word count
    };
    
  } catch (error) {
    console.error(`❌ Error generating content for ${columnId}:`, error);
    return {
      success: false,
      columnId,
      termName,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

async function testMultipleColumns(termName: string, columnIds: string[]) {
  console.log(`\n🚀 Testing Multiple Columns for term: ${termName}`);
  console.log(`📊 Testing ${columnIds.length} columns\n`);
  
  const results = [];
  
  for (const columnId of columnIds) {
    const result = await testSingleColumn(termName, columnId);
    results.push(result);
    
    // Add small delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  return results;
}

async function validateFullStructure() {
  console.log('\n🔍 Validating 296-Column Structure...');
  
  // Check if all columns have prompt triplets
  const missingPrompts = ALL_296_COLUMNS.filter(col => !getPromptTripletByColumnId(col.id));
  
  if (missingPrompts.length > 0) {
    console.log(`❌ Missing prompt triplets for ${missingPrompts.length} columns:`);
    missingPrompts.forEach(col => {
      console.log(`  - ${col.id}: ${col.displayName}`);
    });
    return false;
  }
  
  console.log('✅ All 296 columns have prompt triplets');
  
  // Check structure consistency
  const duplicateIds = new Set();
  const ids = ALL_296_COLUMNS.map(col => col.id);
  const uniqueIds = [...new Set(ids)];
  
  if (ids.length !== uniqueIds.length) {
    console.log('❌ Duplicate column IDs found');
    return false;
  }
  
  console.log('✅ No duplicate column IDs');
  
  // Check order sequence
  const sortedColumns = [...ALL_296_COLUMNS].sort((a, b) => a.order - b.order);
  let orderValid = true;
  
  for (let i = 0; i < sortedColumns.length; i++) {
    if (sortedColumns[i].order !== i + 1) {
      console.log(`❌ Order sequence invalid at position ${i}: expected ${i + 1}, got ${sortedColumns[i].order}`);
      orderValid = false;
      break;
    }
  }
  
  if (orderValid) {
    console.log('✅ Order sequence is valid (1-296)');
  }
  
  return missingPrompts.length === 0 && ids.length === uniqueIds.length && orderValid;
}

async function runFullTest() {
  console.log('🧪 296-Column Implementation Test with Gemini API');
  console.log('==================================================\n');
  
  if (!process.env.GEMINI_API_KEY) {
    console.log('⚠️  GEMINI_API_KEY not found - running structure validation only');
  }
  
  // Step 1: Validate structure
  const structureValid = await validateFullStructure();
  if (!structureValid) {
    console.error('❌ Structure validation failed');
    process.exit(1);
  }
  
  // Step 2: Test sample columns (only if API key is available)
  let results: Response[] = [];
  
  if (process.env.GEMINI_API_KEY) {
    const testTerm = 'transformer';
    const sampleColumnIds = [
      'term',
      'short_definition',
      'introduction_definition_overview',
      'introduction_key_concepts',
      'theoretical_mathematical_foundations',
      'how_it_works_step_by_step',
      'implementation_code_examples',
      'evaluation_performance_metrics',
      'final_completion_marker'
    ];
    
    console.log(`\n🎯 Testing sample columns with term: "${testTerm}"`);
    
    results = await testMultipleColumns(testTerm, sampleColumnIds);
  } else {
    console.log('\n⚠️  Skipping API tests - no API key available');
    
    // Just validate that the prompt triplets exist for sample columns
    const sampleColumnIds = [
      'term',
      'short_definition',
      'introduction_definition_overview',
      'introduction_key_concepts',
      'final_completion_marker'
    ];
    
    console.log('\n🔍 Validating sample prompt triplets...');
    
    for (const columnId of sampleColumnIds) {
      const column = ALL_296_COLUMNS.find(c => c.id === columnId);
      const promptTriplet = getPromptTripletByColumnId(columnId);
      
      if (column && promptTriplet) {
        console.log(`✅ ${columnId}: Column ${column.order} and prompt triplet found`);
        console.log(`   Display: ${column.displayName}`);
        console.log(`   Prompt length: ${promptTriplet.generativePrompt.length} chars`);
      } else {
        console.log(`❌ ${columnId}: Missing column or prompt triplet`);
      }
    }
  }
  
  // Summary
  console.log('\n📊 Test Summary:');
  console.log('=====================================');
  
  if (results.length > 0) {
    const successful = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;
    
    console.log(`✅ Successful API calls: ${successful}`);
    console.log(`❌ Failed API calls: ${failed}`);
    console.log(`📊 Success Rate: ${((successful / results.length) * 100).toFixed(1)}%`);
    
    if (failed > 0) {
      console.log('\n❌ Failed Tests:');
      results.filter(r => !r.success).forEach(r => {
        console.log(`  - ${r.columnId}: ${r.error}`);
      });
    }
    
    // Token analysis
    const successfulResults = results.filter(r => r.success);
    if (successfulResults.length > 0) {
      const totalTokens = successfulResults.reduce((sum, r) => sum + (r.tokenCount || 0), 0);
      const avgTokens = totalTokens / successfulResults.length;
      
      console.log('\n📊 Token Analysis:');
      console.log(`   Total tokens generated: ${totalTokens}`);
      console.log(`   Average tokens per column: ${avgTokens.toFixed(1)}`);
    }
  } else {
    console.log('📊 Implementation Status:');
    console.log(`   ✅ All 296 columns defined: ${ALL_296_COLUMNS.length === 296}`);
    console.log(`   ✅ All 296 prompt triplets created: ${ALL_296_PROMPT_TRIPLETS.length === 296}`);
    console.log(`   ✅ Structure validation: ${structureValid ? 'PASSED' : 'FAILED'}`);
    console.log(`   ⚠️  API testing: Skipped (no API key)`);
  }
  
  console.log('\n🎉 296-Column Implementation Test Complete!');
  console.log('Ready for full AI/ML glossary content generation!');
}

// Run the test
if (import.meta.url === `file://${process.argv[1]}`) {
  runFullTest().catch(console.error);
}

export { testSingleColumn, testMultipleColumns, validateFullStructure };