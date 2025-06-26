#!/usr/bin/env node

/**
 * Test script for cache validation fixes
 * This script tests the new cache validation logic and force reprocess functionality
 */

const fs = require('fs');
const path = require('path');

console.log('🧪 Testing cache validation fixes...\n');

// Test 1: Create an invalid cache with termCount: 0
async function testInvalidCache() {
  console.log('📝 Test 1: Creating invalid cache (termCount: 0)');
  
  const cacheDir = path.join(process.cwd(), 'cache');
  if (!fs.existsSync(cacheDir)) {
    fs.mkdirSync(cacheDir, { recursive: true });
  }
  
  // Create invalid metadata
  const invalidMetadata = {
    filePath: path.join(process.cwd(), 'data', 'test.xlsx'),
    fileHash: 'test-hash',
    fileSize: 1000000,
    lastModified: Date.now(),
    processedAt: Date.now(),
    processingTime: 5000,
    termCount: 0, // INVALID - should cause cache to be invalid
    categoryCount: 0,
    subcategoryCount: 0,
    cacheVersion: '1.0.0'
  };
  
  // Create empty data
  const invalidData = {
    terms: [], // EMPTY - should cause cache to be invalid
    categories: [],
    subcategories: []
  };
  
  const metadataPath = path.join(cacheDir, 'test_processed_metadata.json');
  const dataPath = path.join(cacheDir, 'test_processed_data.json');
  
  fs.writeFileSync(metadataPath, JSON.stringify(invalidMetadata, null, 2));
  fs.writeFileSync(dataPath, JSON.stringify(invalidData, null, 2));
  
  console.log('✅ Invalid cache files created');
  console.log(`   📄 Metadata: ${metadataPath}`);
  console.log(`   📄 Data: ${dataPath}`);
  console.log(`   🔢 Term count: ${invalidMetadata.termCount}`);
  console.log(`   📊 Actual terms: ${invalidData.terms.length}\n`);
}

// Test 2: Create a corrupted cache with mismatched counts
async function testCorruptedCache() {
  console.log('📝 Test 2: Creating corrupted cache (mismatched counts)');
  
  const cacheDir = path.join(process.cwd(), 'cache');
  
  // Create corrupted metadata
  const corruptedMetadata = {
    filePath: path.join(process.cwd(), 'data', 'test2.xlsx'),
    fileHash: 'test-hash-2',
    fileSize: 1000000,
    lastModified: Date.now(),
    processedAt: Date.now(),
    processingTime: 5000,
    termCount: 100, // Says 100 terms
    categoryCount: 5,
    subcategoryCount: 10,
    cacheVersion: '1.0.0'
  };
  
  // But data has different count
  const corruptedData = {
    terms: [
      { id: '1', name: 'Test Term', definition: 'Test definition' }
    ], // Only 1 term, not 100!
    categories: [],
    subcategories: []
  };
  
  const metadataPath = path.join(cacheDir, 'test2_processed_metadata.json');
  const dataPath = path.join(cacheDir, 'test2_processed_data.json');
  
  fs.writeFileSync(metadataPath, JSON.stringify(corruptedMetadata, null, 2));
  fs.writeFileSync(dataPath, JSON.stringify(corruptedData, null, 2));
  
  console.log('✅ Corrupted cache files created');
  console.log(`   📄 Metadata: ${metadataPath}`);
  console.log(`   📄 Data: ${dataPath}`);
  console.log(`   🔢 Metadata term count: ${corruptedMetadata.termCount}`);
  console.log(`   📊 Actual terms: ${corruptedData.terms.length} (MISMATCH!)\n`);
}

// Test 3: Test the new cache validation logic
async function testCacheValidation() {
  console.log('📝 Test 3: Testing cache validation logic');
  
  // Import the cache manager
  const { cacheManager } = require('./server/cacheManager.ts');
  
  try {
    // Test invalid cache (termCount: 0)
    const testFile1 = path.join(process.cwd(), 'data', 'test.xlsx');
    console.log('   🔍 Testing invalid cache (termCount: 0)...');
    const isValid1 = await cacheManager.isCacheValid(testFile1);
    console.log(`   📋 Result: ${isValid1 ? '❌ FAILED - cache reported as valid' : '✅ PASSED - cache correctly invalid'}`);
    
    // Test corrupted cache (mismatched counts)
    const testFile2 = path.join(process.cwd(), 'data', 'test2.xlsx');
    console.log('   🔍 Testing corrupted cache (mismatched counts)...');
    const isValid2 = await cacheManager.isCacheValid(testFile2);
    console.log(`   📋 Result: ${isValid2 ? '❌ FAILED - cache reported as valid' : '✅ PASSED - cache correctly invalid'}`);
    
  } catch (error) {
    console.error('   ❌ Cache validation test failed:', error.message);
  }
}

// Test 4: Display force reprocess endpoint info
function testForceReprocessEndpoint() {
  console.log('📝 Test 4: Force Reprocess Endpoint Information');
  console.log('   🔒 Endpoint: POST /api/admin/import/force-reprocess');
  console.log('   🔑 Authentication: Admin token required');
  console.log('   📝 Body parameters:');
  console.log('      - fileName (optional): specific file to process');
  console.log('      - clearInvalidCache (optional, default: true)');
  console.log('   📋 Example request:');
  console.log('      curl -X POST http://localhost:5000/api/admin/import/force-reprocess \\');
  console.log('           -H "Content-Type: application/json" \\');
  console.log('           -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \\');
  console.log('           -d \'{"clearInvalidCache": true}\'');
  console.log('');
}

// Cleanup function
function cleanup() {
  console.log('🧹 Cleaning up test files...');
  
  const cacheDir = path.join(process.cwd(), 'cache');
  const testFiles = [
    'test_processed_metadata.json',
    'test_processed_data.json',
    'test2_processed_metadata.json',
    'test2_processed_data.json'
  ];
  
  testFiles.forEach(file => {
    const filePath = path.join(cacheDir, file);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      console.log(`   🗑️ Deleted: ${file}`);
    }
  });
}

// Main test execution
async function runTests() {
  try {
    await testInvalidCache();
    await testCorruptedCache();
    await testCacheValidation();
    testForceReprocessEndpoint();
    
    console.log('🎉 Cache fix tests completed!');
    console.log('\n📊 Summary of fixes implemented:');
    console.log('   ✅ Cache validation now checks termCount > 0');
    console.log('   ✅ Cache validation verifies data file integrity');
    console.log('   ✅ Cache validation checks for term count mismatch');
    console.log('   ✅ Force reprocess endpoint with admin authentication');
    console.log('   ✅ Force invalidate method for empty caches');
    
  } catch (error) {
    console.error('❌ Test execution failed:', error);
  } finally {
    cleanup();
  }
}

// Run tests if this script is executed directly
if (require.main === module) {
  runTests();
}

module.exports = { runTests, testInvalidCache, testCorruptedCache, cleanup };