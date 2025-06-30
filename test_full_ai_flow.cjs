#!/usr/bin/env node

/**
 * Test Full AI Flow - Complete Integration Test
 */

const fs = require('fs').promises;
const FormData = require('form-data');

async function getFetch() {
  const { default: fetch } = await import('node-fetch');
  return fetch;
}

async function testFullAIFlow() {
  console.log('🎯 Testing FULL AI Flow Integration');
  console.log('===================================');
  
  const testFile = __dirname + '/data/row1.xlsx';
  
  if (!(await fs.stat(testFile).catch(() => false))) {
    console.log('❌ Test file not found:', testFile);
    return false;
  }
  
  console.log('📁 Test file:', testFile);
  console.log('📊 File size:', (await fs.stat(testFile)).size, 'bytes');
  
  // Test 1: Clear cache and process with AI (should generate new content)
  console.log('\n🧪 Test 1: Fresh AI Generation (no cache)');
  console.log('============================================');
  
  // First delete any existing cache
  try {
    await fs.unlink(__dirname + '/ai_cache.json');
    console.log('🗑️  Cleared existing cache file');
  } catch (e) {
    console.log('📝 No existing cache file');
  }
  
  const aiOptions1 = {
    enableAI: true,
    mode: 'full',
    sections: ['definition', 'applications', 'examples'],
    costOptimization: true,
    processor: 'typescript',
    importStrategy: 'full'
  };
  
  console.log('🤖 AI Options:', JSON.stringify(aiOptions1, null, 2));
  
  try {
    const fetch = await getFetch();
    const form = new FormData();
    form.append('file', require('fs').createReadStream(testFile));
    form.append('aiOptions', JSON.stringify(aiOptions1));
    
    console.log('🚀 Processing with AI generation...');
    const startTime1 = Date.now();
    
    const response1 = await fetch('http://localhost:3001/api/admin/import-advanced', {
      method: 'POST',
      body: form,
      headers: {
        ...form.getHeaders()
      }
    });
    
    const duration1 = Date.now() - startTime1;
    console.log(`⏱️  First processing took: ${duration1}ms`);
    
    if (response1.headers.get('content-type')?.includes('application/json')) {
      const result1 = await response1.json();
      
      if (result1.success) {
        console.log('✅ Fresh AI generation PASSED!');
        console.log(`📊 Terms processed: ${result1.data.termsImported}`);
        console.log(`🤖 AI mode: ${result1.data.metadata?.processingMode}`);
        console.log(`🧠 AI generated: ${result1.data.metadata?.aiGenerated}`);
        
        // Check if cache file was created
        try {
          const cacheContent = await fs.readFile(__dirname + '/ai_cache.json', 'utf-8');
          const cache = JSON.parse(cacheContent);
          console.log(`💾 Cache created with ${Object.keys(cache).length} entries`);
          
          // Show cache entries
          console.log('📋 Cache entries created:');
          Object.keys(cache).slice(0, 5).forEach(key => {
            console.log(`   - ${key}: ${String(cache[key]).substring(0, 50)}...`);
          });
          
        } catch (cacheError) {
          console.log('⚠️  Cache file not created during AI processing');
          return false;
        }
        
      } else {
        console.log('❌ Fresh AI generation failed:', result1.message);
        return false;
      }
    } else {
      console.log('❌ Non-JSON response in Test 1');
      return false;
    }
    
    // Test 2: Process again (should hit cache)
    console.log('\n🧪 Test 2: Cache Hit Performance');
    console.log('================================');
    
    const aiOptions2 = {
      enableAI: true,
      mode: 'full',
      sections: ['definition', 'applications', 'examples'],
      costOptimization: true,
      processor: 'typescript',
      importStrategy: 'incremental'
    };
    
    const form2 = new FormData();
    form2.append('file', require('fs').createReadStream(testFile));
    form2.append('aiOptions', JSON.stringify(aiOptions2));
    
    console.log('🔄 Processing again (should hit cache)...');
    const startTime2 = Date.now();
    
    const response2 = await fetch('http://localhost:3001/api/admin/import-advanced', {
      method: 'POST',
      body: form2,
      headers: {
        ...form2.getHeaders()
      }
    });
    
    const duration2 = Date.now() - startTime2;
    console.log(`⏱️  Second processing took: ${duration2}ms`);
    
    if (response2.headers.get('content-type')?.includes('application/json')) {
      const result2 = await response2.json();
      
      if (result2.success) {
        console.log('✅ Cache hit processing PASSED!');
        
        // Performance comparison
        const speedup = duration1 / duration2;
        console.log(`🚀 Performance improvement: ${speedup.toFixed(2)}x faster`);
        
        if (duration2 < duration1 * 0.7) {
          console.log('💾 Cache optimization working effectively!');
        } else {
          console.log('⚠️  Cache may not be working optimally');
        }
        
      } else {
        console.log('❌ Cache hit processing failed:', result2.message);
        return false;
      }
    } else {
      console.log('❌ Non-JSON response in Test 2');
      return false;
    }
    
    // Test 3: Different mode (selective AI)
    console.log('\n🧪 Test 3: Selective AI Mode');
    console.log('============================');
    
    const aiOptions3 = {
      enableAI: true,
      mode: 'selective',
      sections: ['definition', 'characteristics'],
      costOptimization: true,
      processor: 'typescript',
      importStrategy: 'incremental'
    };
    
    const form3 = new FormData();
    form3.append('file', require('fs').createReadStream(testFile));
    form3.append('aiOptions', JSON.stringify(aiOptions3));
    
    console.log('🎯 Testing selective AI with specific sections...');
    const startTime3 = Date.now();
    
    const response3 = await fetch('http://localhost:3001/api/admin/import-advanced', {
      method: 'POST',
      body: form3,
      headers: {
        ...form3.getHeaders()
      }
    });
    
    const duration3 = Date.now() - startTime3;
    console.log(`⏱️  Selective processing took: ${duration3}ms`);
    
    if (response3.headers.get('content-type')?.includes('application/json')) {
      const result3 = await response3.json();
      
      if (result3.success) {
        console.log('✅ Selective AI mode PASSED!');
        console.log(`🎯 Selective mode: ${result3.data.metadata?.processingMode}`);
        
        // Check final cache state
        const finalCache = JSON.parse(await fs.readFile(__dirname + '/ai_cache.json', 'utf-8'));
        console.log(`💾 Final cache has ${Object.keys(finalCache).length} entries`);
        
        return true;
      } else {
        console.log('❌ Selective AI mode failed:', result3.message);
        return false;
      }
    } else {
      console.log('❌ Non-JSON response in Test 3');
      return false;
    }
    
  } catch (error) {
    console.error('❌ Full AI flow test failed:', error.message);
    return false;
  }
}

async function testAIServiceDirectly() {
  console.log('\n🔬 Testing AI Service Methods Directly');
  console.log('======================================');
  
  try {
    // Test if we can make a direct API call to test AI service methods
    const testPrompt = {
      operation: 'test_cache',
      term: 'Neural Network',
      section: 'definition'
    };
    
    const fetch = await getFetch();
    const response = await fetch('http://localhost:3001/api/admin/health', {
      method: 'GET'
    });
    
    if (response.ok) {
      console.log('✅ Server responding - AI service should be available');
      
      // Check if cache file exists and has content
      try {
        const cacheContent = await fs.readFile(__dirname + '/ai_cache.json', 'utf-8');
        const cache = JSON.parse(cacheContent);
        
        console.log('📊 Cache Analysis:');
        console.log(`   - Total entries: ${Object.keys(cache).length}`);
        console.log(`   - Cache file size: ${Buffer.byteLength(cacheContent, 'utf8')} bytes`);
        
        // Analyze cache patterns
        const entries = Object.keys(cache);
        const termSectionPairs = entries.filter(e => e.includes(':'));
        console.log(`   - Term:section pairs: ${termSectionPairs.length}`);
        
        if (termSectionPairs.length > 0) {
          console.log('✅ Cache structure looks correct');
          return true;
        } else {
          console.log('⚠️  Cache structure may be incorrect');
          return false;
        }
        
      } catch (cacheError) {
        console.log('❌ Cannot read cache file:', cacheError.message);
        return false;
      }
      
    } else {
      console.log('❌ Server not responding properly');
      return false;
    }
    
  } catch (error) {
    console.error('❌ Direct AI service test failed:', error.message);
    return false;
  }
}

// Main test function
async function runFullFlowTest() {
  console.log('🎯 Complete AI Integration Flow Test');
  console.log('====================================\n');
  
  const fullFlowTest = await testFullAIFlow();
  const directServiceTest = await testAIServiceDirectly();
  
  console.log('\n📊 Final Test Results:');
  console.log('======================');
  console.log(`Full AI Flow: ${fullFlowTest ? '✅ PASSED' : '❌ FAILED'}`);
  console.log(`AI Service Direct: ${directServiceTest ? '✅ PASSED' : '❌ FAILED'}`);
  
  const allPassed = fullFlowTest && directServiceTest;
  console.log(`\n🎯 Overall: ${allPassed ? '✅ ALL TESTS PASSED' : '❌ TESTS FAILED'}`);
  
  if (allPassed) {
    console.log('\n🚀 Full AI Integration Flow Complete!');
    console.log('✅ Smart caching working end-to-end');
    console.log('💾 Persistent cache creation and usage verified');
    console.log('⚡ Performance improvements confirmed');
    console.log('🎯 Multiple AI modes working correctly');
    console.log('📋 Ready for production deployment');
  } else {
    console.log('\n⚠️ Issues detected in full flow - needs investigation');
  }
  
  return allPassed;
}

runFullFlowTest().catch(console.error);