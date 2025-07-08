#!/usr/bin/env node

/**
 * Test script for Enhanced Content Generation System
 * 
 * This script tests the basic functionality of the Enhanced Content Generation UI
 * by simulating API calls and validating responses.
 */

const fs = require('fs');
const path = require('path');

// Configuration
const BASE_URL = 'http://localhost:3000';
const API_BASE = `${BASE_URL}/api/admin`;

// Test data
const TEST_TERM = {
  id: 'test-term-1',
  name: 'Neural Network',
  shortDescription: 'A computational model inspired by biological neural networks'
};

const TEST_SECTION = 'definition_overview';

// Utility functions
function log(message, type = 'info') {
  const timestamp = new Date().toISOString();
  const prefix = type === 'error' ? '❌' : type === 'success' ? '✅' : 'ℹ️';
  console.log(`[${timestamp}] ${prefix} ${message}`);
}

function validateResponse(response, expectedStructure) {
  if (!response || typeof response !== 'object') {
    throw new Error('Invalid response format');
  }
  
  if (!response.success) {
    throw new Error(`API Error: ${response.error || 'Unknown error'}`);
  }
  
  return true;
}

// Test functions
async function testEnhancedTripletStatus() {
  log('Testing Enhanced Triplet Status endpoint...');
  
  try {
    const response = await fetch(`${API_BASE}/enhanced-triplet/status`);
    const data = await response.json();
    
    validateResponse(data);
    log('Enhanced Triplet Status test passed', 'success');
    return true;
  } catch (error) {
    log(`Enhanced Triplet Status test failed: ${error.message}`, 'error');
    return false;
  }
}

async function testTemplatesList() {
  log('Testing Templates List endpoint...');
  
  try {
    const response = await fetch(`${API_BASE}/templates`);
    const data = await response.json();
    
    validateResponse(data);
    
    if (!Array.isArray(data.data)) {
      throw new Error('Templates data should be an array');
    }
    
    log(`Templates List test passed - Found ${data.data.length} templates`, 'success');
    return true;
  } catch (error) {
    log(`Templates List test failed: ${error.message}`, 'error');
    return false;
  }
}

async function testGenerationStats() {
  log('Testing Generation Stats endpoint...');
  
  try {
    const response = await fetch(`${API_BASE}/generation/stats`);
    const data = await response.json();
    
    validateResponse(data);
    
    const requiredFields = ['summary', 'byModel', 'qualityMetrics'];
    for (const field of requiredFields) {
      if (!data.data[field]) {
        throw new Error(`Missing required field: ${field}`);
      }
    }
    
    log('Generation Stats test passed', 'success');
    return true;
  } catch (error) {
    log(`Generation Stats test failed: ${error.message}`, 'error');
    return false;
  }
}

async function testAvailableColumns() {
  log('Testing Available Columns endpoint...');
  
  try {
    const response = await fetch(`${API_BASE}/enhanced-triplet/columns`);
    const data = await response.json();
    
    validateResponse(data);
    
    if (!Array.isArray(data.data)) {
      throw new Error('Columns data should be an array');
    }
    
    const expectedColumns = ['term', 'definition_overview', 'key_concepts', 'basic_examples', 'advantages'];
    const foundColumns = data.data.map(col => col.id);
    
    for (const expectedColumn of expectedColumns) {
      if (!foundColumns.includes(expectedColumn)) {
        throw new Error(`Missing expected column: ${expectedColumn}`);
      }
    }
    
    log(`Available Columns test passed - Found ${data.data.length} columns`, 'success');
    return true;
  } catch (error) {
    log(`Available Columns test failed: ${error.message}`, 'error');
    return false;
  }
}

// Component validation functions
function validateComponentFiles() {
  log('Validating component files...');
  
  const requiredFiles = [
    'client/src/components/admin/EnhancedContentGeneration.tsx',
    'client/src/components/admin/TemplateManagement.tsx',
    'client/src/components/admin/GenerationStatsDashboard.tsx'
  ];
  
  let allValid = true;
  
  for (const file of requiredFiles) {
    const filePath = path.join(__dirname, file);
    if (!fs.existsSync(filePath)) {
      log(`Missing component file: ${file}`, 'error');
      allValid = false;
    } else {
      log(`Found component file: ${file}`, 'success');
    }
  }
  
  return allValid;
}

function validateServiceFiles() {
  log('Validating service files...');
  
  const requiredFiles = [
    'server/services/enhancedTripletProcessor.ts',
    'server/routes/admin/enhancedContentGeneration.ts',
    'server/routes/admin/templateManagement.ts'
  ];
  
  let allValid = true;
  
  for (const file of requiredFiles) {
    const filePath = path.join(__dirname, file);
    if (!fs.existsSync(filePath)) {
      log(`Missing service file: ${file}`, 'error');
      allValid = false;
    } else {
      log(`Found service file: ${file}`, 'success');
    }
  }
  
  return allValid;
}

// Main test runner
async function runTests() {
  log('Starting Enhanced Content Generation System Tests...');
  
  const results = {
    fileValidation: true,
    apiTests: 0,
    totalTests: 0
  };
  
  // File validation tests
  log('\n=== File Validation Tests ===');
  results.fileValidation = validateComponentFiles() && validateServiceFiles();
  
  // API tests (these will fail if server is not running)
  log('\n=== API Tests ===');
  log('Note: API tests require the server to be running on localhost:3000');
  
  const apiTests = [
    testEnhancedTripletStatus,
    testTemplatesList,
    testGenerationStats,
    testAvailableColumns
  ];
  
  results.totalTests = apiTests.length;
  
  for (const test of apiTests) {
    try {
      const passed = await test();
      if (passed) results.apiTests++;
    } catch (error) {
      log(`Test failed with error: ${error.message}`, 'error');
    }
  }
  
  // Summary
  log('\n=== Test Summary ===');
  log(`File Validation: ${results.fileValidation ? 'PASSED' : 'FAILED'}`);
  log(`API Tests: ${results.apiTests}/${results.totalTests} passed`);
  
  if (results.fileValidation && results.apiTests === results.totalTests) {
    log('All tests passed! 🎉', 'success');
    process.exit(0);
  } else {
    log('Some tests failed. Please check the logs above.', 'error');
    process.exit(1);
  }
}

// Run tests if script is executed directly
if (require.main === module) {
  runTests().catch(error => {
    log(`Test runner failed: ${error.message}`, 'error');
    process.exit(1);
  });
}

module.exports = {
  runTests,
  testEnhancedTripletStatus,
  testTemplatesList,
  testGenerationStats,
  testAvailableColumns
};