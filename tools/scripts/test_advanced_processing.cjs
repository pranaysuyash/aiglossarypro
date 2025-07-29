#!/usr/bin/env node

// Test script for advanced AI processing system
const fs = require('fs');
const path = require('path');
const FormData = require('form-data');

// Dynamic import for ES module
async function getFetch() {
  const { default: fetch } = await import('node-fetch');
  return fetch;
}

async function testAdvancedProcessing() {
  console.log('🧪 Testing Advanced AI Processing System');
  console.log('=======================================');
  
  const testFile = path.join(__dirname, 'data', 'row1.xlsx'); // Smaller test file
  
  if (!fs.existsSync(testFile)) {
    console.error('❌ Test file not found:', testFile);
    return;
  }
  
  console.log('📁 Test file:', testFile);
  console.log('📊 File size:', fs.statSync(testFile).size, 'bytes');
  
  // Test configuration - start with basic processing
  const aiOptions = {
    enableAI: true,
    mode: 'basic',
    sections: [],
    costOptimization: true,
    processor: 'typescript',
    importStrategy: 'incremental'
  };
  
  console.log('🤖 AI Options:', JSON.stringify(aiOptions, null, 2));
  
  try {
    const form = new FormData();
    form.append('file', fs.createReadStream(testFile));
    form.append('aiOptions', JSON.stringify(aiOptions));
    
    console.log('🚀 Sending request to advanced processing endpoint...');
    const fetch = await getFetch();
    const response = await fetch('http://localhost:3001/api/admin/import-advanced', {
      method: 'POST',
      body: form,
      headers: {
        ...form.getHeaders(),
        // Mock authentication for testing
        'Authorization': 'Bearer mock-token'
      }
    });
    
    console.log('\n📋 Response Status:', response.status);
    console.log('📋 Response Headers:', response.headers.raw());
    
    const responseText = await response.text();
    console.log('📋 Raw Response:', responseText.substring(0, 500));
    
    let result;
    try {
      result = JSON.parse(responseText);
      console.log('📋 Parsed Response:', JSON.stringify(result, null, 2));
    } catch (parseError) {
      console.log('❌ Failed to parse JSON response');
      return;
    }
    
    if (result.success) {
      console.log('\n✅ Advanced processing test PASSED!');
      console.log(`📊 Terms processed: ${result.data.termsImported}`);
      console.log(`🤖 Processing mode: ${result.data.metadata?.processingMode}`);
      console.log(`📋 Sections processed: ${result.data.metadata?.sectionsProcessed}`);
      console.log(`🧠 AI generated: ${result.data.metadata?.aiGenerated}`);
    } else {
      console.log('\n❌ Advanced processing test FAILED!');
      console.log('Error:', result.message || result.error);
    }
    
  } catch (error) {
    console.error('\n💥 Test failed with error:', error.message);
  }
}

// Run the test
testAdvancedProcessing().catch(console.error);