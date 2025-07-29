#!/usr/bin/env node

// Test actual Excel processing with the advanced endpoint
const fs = require('fs');
const path = require('path');
const FormData = require('form-data');

async function getFetch() {
  const { default: fetch } = await import('node-fetch');
  return fetch;
}

async function testRealProcessing() {
  console.log('🧪 Testing Real Excel Processing');
  console.log('===============================');
  
  const testFile = path.join(__dirname, 'data', 'row1.xlsx');
  
  if (!fs.existsSync(testFile)) {
    console.error('❌ Test file not found:', testFile);
    return false;
  }
  
  console.log('📁 Test file:', testFile);
  console.log('📊 File size:', fs.statSync(testFile).size, 'bytes');
  
  // Test without AI first to ensure basic processing works
  const aiOptions = {
    enableAI: false,
    mode: 'none',
    sections: [],
    costOptimization: true,
    processor: 'typescript',
    importStrategy: 'incremental'
  };
  
  console.log('🤖 Testing without AI first...');
  console.log('AI Options:', JSON.stringify(aiOptions, null, 2));
  
  try {
    const fetch = await getFetch();
    const form = new FormData();
    form.append('file', fs.createReadStream(testFile));
    form.append('aiOptions', JSON.stringify(aiOptions));
    
    console.log('🚀 Sending request to /api/admin/import-advanced...');
    
    const response = await fetch('http://localhost:3001/api/admin/import-advanced', {
      method: 'POST',
      body: form,
      headers: {
        ...form.getHeaders()
      }
    });
    
    console.log('📋 Response Status:', response.status);
    console.log('📋 Response Content-Type:', response.headers.get('content-type'));
    
    const responseText = await response.text();
    
    if (response.headers.get('content-type')?.includes('application/json')) {
      try {
        const result = JSON.parse(responseText);
        console.log('✅ JSON Response received');
        console.log('📋 Result:', JSON.stringify(result, null, 2));
        
        if (result.success) {
          console.log('\n✅ Basic processing test PASSED!');
          console.log(`📊 Terms processed: ${result.data.termsImported}`);
          console.log(`🗂️  Categories: ${result.data.categoriesImported}`);
          console.log(`🤖 Processing mode: ${result.data.metadata?.processingMode}`);
          console.log(`📋 Sections: ${result.data.metadata?.sectionsProcessed}`);
          return true;
        } else {
          console.log('❌ Processing failed:', result.message || result.error);
          return false;
        }
      } catch (parseError) {
        console.log('❌ Failed to parse JSON response:', parseError.message);
        console.log('Raw response:', responseText.substring(0, 500));
        return false;
      }
    } else {
      console.log('❌ Non-JSON response received');
      console.log('Raw response:', responseText.substring(0, 500));
      return false;
    }
    
  } catch (error) {
    console.error('❌ Request failed:', error.message);
    return false;
  }
}

async function testWithAI() {
  console.log('\n🤖 Testing WITH AI Processing');
  console.log('=============================');
  
  const testFile = path.join(__dirname, 'data', 'row1.xlsx');
  
  // Test with basic AI
  const aiOptions = {
    enableAI: true,
    mode: 'basic',
    sections: [],
    costOptimization: true,
    processor: 'typescript',
    importStrategy: 'incremental'
  };
  
  console.log('🧠 Testing with basic AI...');
  console.log('AI Options:', JSON.stringify(aiOptions, null, 2));
  
  try {
    const fetch = await getFetch();
    const form = new FormData();
    form.append('file', fs.createReadStream(testFile));
    form.append('aiOptions', JSON.stringify(aiOptions));
    
    console.log('🚀 Sending AI-enabled request...');
    
    const response = await fetch('http://localhost:3001/api/admin/import-advanced', {
      method: 'POST',
      body: form,
      headers: {
        ...form.getHeaders()
      }
    });
    
    console.log('📋 Response Status:', response.status);
    
    const responseText = await response.text();
    
    if (response.headers.get('content-type')?.includes('application/json')) {
      try {
        const result = JSON.parse(responseText);
        console.log('✅ AI Processing JSON Response received');
        
        if (result.success) {
          console.log('✅ AI processing test PASSED!');
          console.log(`📊 Terms processed: ${result.data.termsImported}`);
          console.log(`🤖 AI mode: ${result.data.metadata?.processingMode}`);
          console.log(`🧠 AI generated: ${result.data.metadata?.aiGenerated}`);
          return true;
        } else {
          console.log('❌ AI processing failed:', result.message || result.error);
          return false;
        }
      } catch (parseError) {
        console.log('❌ Failed to parse AI response:', parseError.message);
        return false;
      }
    } else {
      console.log('❌ Non-JSON response from AI processing');
      console.log('Response:', responseText.substring(0, 500));
      return false;
    }
    
  } catch (error) {
    console.error('❌ AI processing request failed:', error.message);
    return false;
  }
}

// Main test function
async function runFullTest() {
  console.log('🎯 Full End-to-End Processing Test');
  console.log('=================================\n');
  
  const basicTest = await testRealProcessing();
  const aiTest = await testWithAI();
  
  console.log('\n📊 Final Test Results:');
  console.log('======================');
  console.log(`Basic Processing: ${basicTest ? '✅ PASSED' : '❌ FAILED'}`);
  console.log(`AI Processing: ${aiTest ? '✅ PASSED' : '❌ FAILED'}`);
  
  const allPassed = basicTest && aiTest;
  console.log(`\n🎯 Overall: ${allPassed ? '✅ ALL TESTS PASSED' : '❌ TESTS FAILED'}`);
  
  if (allPassed) {
    console.log('\n🚀 System is ready for production!');
    console.log('✅ Both basic and AI processing are working');
    console.log('📋 Ready to proceed with Phase 2 integration');
  } else {
    console.log('\n⚠️ Issues detected - need fixing before Phase 2');
  }
  
  return allPassed;
}

runFullTest().catch(console.error);