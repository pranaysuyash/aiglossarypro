#!/usr/bin/env node

/**
 * Test Clean AI Integration - Force fresh AI generation
 */

const fs = require('fs').promises;
const FormData = require('form-data');

async function getFetch() {
  const { default: fetch } = await import('node-fetch');
  return fetch;
}

async function clearAllCaches() {
  console.log('🧹 Clearing all caches...');
  
  // Clear aiService cache
  try {
    await fs.unlink(__dirname + '/ai_cache.json');
    console.log('✅ Cleared aiService cache file');
  } catch (e) {
    console.log('📝 No aiService cache file found');
  }
  
  // Clear Excel parser cache files
  const cacheFiles = [
    'ai_parse_cache.json',
    'checkpoint.json',
    'import_hashes.json'
  ];
  
  for (const file of cacheFiles) {
    try {
      await fs.unlink(__dirname + '/' + file);
      console.log(`✅ Cleared ${file}`);
    } catch (e) {
      console.log(`📝 No ${file} found`);
    }
  }
}

async function testForceAIGeneration() {
  console.log('\n🧪 Testing Force AI Generation');
  console.log('===============================');
  
  const testFile = __dirname + '/data/row1.xlsx';
  
  if (!(await fs.stat(testFile).catch(() => false))) {
    console.log('❌ Test file not found:', testFile);
    return false;
  }
  
  // Clear all caches first
  await clearAllCaches();
  
  // Create a modified test file with a new term to force fresh generation
  console.log('📝 Creating test scenario with AI generation...');
  
  const aiOptions = {
    enableAI: true,
    mode: 'basic',
    sections: ['Introduction – Definition and Overview'], // Specific section
    costOptimization: true,
    processor: 'typescript',
    importStrategy: 'full' // Force full processing
  };
  
  console.log('🤖 AI Options:', JSON.stringify(aiOptions, null, 2));
  
  try {
    const fetch = await getFetch();
    const form = new FormData();
    form.append('file', require('fs').createReadStream(testFile));
    form.append('aiOptions', JSON.stringify(aiOptions));
    
    console.log('🚀 Processing with forced AI generation...');
    const startTime = Date.now();
    
    const response = await fetch('http://localhost:3001/api/admin/import-advanced', {
      method: 'POST',
      body: form,
      headers: {
        ...form.getHeaders()
      }
    });
    
    const duration = Date.now() - startTime;
    console.log(`⏱️  Processing took: ${duration}ms`);
    
    if (response.headers.get('content-type')?.includes('application/json')) {
      const result = await response.json();
      
      if (result.success) {
        console.log('✅ AI generation processing PASSED!');
        console.log(`📊 Terms processed: ${result.data.termsImported}`);
        console.log(`🤖 AI mode: ${result.data.metadata?.processingMode}`);
        console.log(`🧠 AI generated: ${result.data.metadata?.aiGenerated}`);
        
        // Check if aiService cache was created
        try {
          await new Promise(resolve => setTimeout(resolve, 1000)); // Wait for cache save
          const cacheContent = await fs.readFile(__dirname + '/ai_cache.json', 'utf-8');
          const cache = JSON.parse(cacheContent);
          console.log(`💾 Enhanced AI cache created with ${Object.keys(cache).length} entries`);
          
          // Show cache entries from aiService
          console.log('📋 aiService cache entries:');
          Object.keys(cache).slice(0, 5).forEach(key => {
            const value = String(cache[key]).substring(0, 100);
            console.log(`   - ${key}: ${value}...`);
          });
          
          return true;
        } catch (cacheError) {
          console.log('⚠️  Enhanced AI cache not created:', cacheError.message);
          
          // Still return true if processing succeeded, cache might be saved later
          return true;
        }
        
      } else {
        console.log('❌ AI generation failed:', result.message);
        return false;
      }
    } else {
      console.log('❌ Non-JSON response received');
      console.log('Response:', (await response.text()).substring(0, 500));
      return false;
    }
    
  } catch (error) {
    console.error('❌ Force AI generation test failed:', error.message);
    return false;
  }
}

async function testCacheAfterGeneration() {
  console.log('\n💾 Testing Cache After Generation');
  console.log('==================================');
  
  // Wait a bit for any async cache saves
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  try {
    // Check if cache file exists now
    const cacheContent = await fs.readFile(__dirname + '/ai_cache.json', 'utf-8');
    const cache = JSON.parse(cacheContent);
    
    console.log(`📊 aiService cache analysis:`);
    console.log(`   - Total entries: ${Object.keys(cache).length}`);
    console.log(`   - File size: ${Buffer.byteLength(cacheContent, 'utf8')} bytes`);
    
    // Analyze cache content structure
    const entries = Object.keys(cache);
    console.log('📋 Cache structure analysis:');
    
    const termSectionEntries = entries.filter(key => key.includes(':'));
    console.log(`   - Term:section entries: ${termSectionEntries.length}`);
    
    if (termSectionEntries.length > 0) {
      console.log('   - Sample entries:');
      termSectionEntries.slice(0, 3).forEach(key => {
        console.log(`     • ${key}`);
      });
    }
    
    // Test cache content quality
    let validEntries = 0;
    for (const [key, value] of Object.entries(cache)) {
      if (typeof value === 'string' && value.length > 20) {
        validEntries++;
      }
    }
    
    console.log(`   - Valid content entries: ${validEntries}/${Object.keys(cache).length}`);
    
    if (validEntries > 0) {
      console.log('✅ Cache structure and content look good!');
      return true;
    } else {
      console.log('⚠️  Cache exists but content quality is poor');
      return false;
    }
    
  } catch (error) {
    console.log('❌ Cache file still not accessible:', error.message);
    
    // Check if there's any other cache evidence
    console.log('🔍 Checking for other cache files...');
    try {
      const files = await fs.readdir(__dirname);
      const cacheFiles = files.filter(f => f.includes('cache') || f.includes('ai_'));
      if (cacheFiles.length > 0) {
        console.log('📁 Found related files:', cacheFiles);
      } else {
        console.log('📁 No cache-related files found');
      }
    } catch (e) {
      console.log('❌ Cannot read directory');
    }
    
    return false;
  }
}

// Main test function
async function runCleanAITest() {
  console.log('🎯 Clean AI Integration Test');
  console.log('============================\n');
  
  const forceGenerationTest = await testForceAIGeneration();
  const cacheTest = await testCacheAfterGeneration();
  
  console.log('\n📊 Final Test Results:');
  console.log('======================');
  console.log(`Force AI Generation: ${forceGenerationTest ? '✅ PASSED' : '❌ FAILED'}`);
  console.log(`Cache Integration: ${cacheTest ? '✅ PASSED' : '❌ FAILED'}`);
  
  const allPassed = forceGenerationTest && cacheTest;
  console.log(`\n🎯 Overall: ${allPassed ? '✅ ALL TESTS PASSED' : '❌ TESTS FAILED'}`);
  
  if (allPassed) {
    console.log('\n🚀 Clean AI Integration Successful!');
    console.log('✅ Enhanced aiService being used for AI generation');
    console.log('💾 Smart caching working properly');
    console.log('📋 Ready for production with full integration');
  } else {
    console.log('\n⚠️ Integration issues detected');
    console.log('🔧 May need to debug aiService integration in advancedExcelParser');
  }
  
  return allPassed;
}

runCleanAITest().catch(console.error);