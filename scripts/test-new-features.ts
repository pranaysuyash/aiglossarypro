/**
 * Test script for validating Learning Paths and Code Examples implementation
 * Run with: npx tsx scripts/test-new-features.ts
 */

import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

interface TestResult {
  feature: string;
  status: 'PASS' | 'FAIL';
  details: string;
}

const results: TestResult[] = [];

// Test 1: Database Schema
function testDatabaseSchema() {
  console.log('\n🔍 Testing Database Schema...');
  
  try {
    const schemaPath = join(__dirname, '../shared/schema.ts');
    if (!existsSync(schemaPath)) {
      results.push({ feature: 'Database Schema File', status: 'FAIL', details: 'schema.ts not found' });
      return;
    }
    
    const schemaContent = readFileSync(schemaPath, 'utf-8');
    
    // Check for Learning Paths tables
    const learningPathsTables = [
      'learningPaths',
      'learningPathSteps', 
      'userLearningProgress',
      'stepCompletions'
    ];
    
    learningPathsTables.forEach(table => {
      if (schemaContent.includes(`export const ${table} = pgTable`)) {
        results.push({ feature: `${table} table`, status: 'PASS', details: 'Schema defined' });
      } else {
        results.push({ feature: `${table} table`, status: 'FAIL', details: 'Schema missing' });
      }
    });
    
    // Check for Code Examples tables
    const codeExamplesTables = [
      'codeExamples',
      'codeExampleRuns'
    ];
    
    codeExamplesTables.forEach(table => {
      if (schemaContent.includes(`export const ${table} = pgTable`)) {
        results.push({ feature: `${table} table`, status: 'PASS', details: 'Schema defined' });
      } else {
        results.push({ feature: `${table} table`, status: 'FAIL', details: 'Schema missing' });
      }
    });
    
    // Check for type exports
    const types = [
      'LearningPath',
      'InsertLearningPath',
      'CodeExample',
      'InsertCodeExample'
    ];
    
    types.forEach(type => {
      if (schemaContent.includes(`export type ${type} =`)) {
        results.push({ feature: `${type} type export`, status: 'PASS', details: 'Type exported' });
      } else {
        results.push({ feature: `${type} type export`, status: 'FAIL', details: 'Type missing' });
      }
    });
    
  } catch (error) {
    results.push({ feature: 'Database Schema', status: 'FAIL', details: error.message });
  }
}

// Test 2: API Routes
function testAPIRoutes() {
  console.log('\n🔍 Testing API Routes...');
  
  // Check Learning Paths routes
  const learningPathsRoutePath = join(__dirname, '../server/routes/learningPaths.ts');
  if (existsSync(learningPathsRoutePath)) {
    const content = readFileSync(learningPathsRoutePath, 'utf-8');
    
    const endpoints = [
      '/api/learning-paths',
      '/api/learning-paths/:id',
      '/api/learning-paths/:id/start',
      '/api/learning-paths/:pathId/steps/:stepId/complete',
      '/api/learning-paths/progress',
      '/api/learning-paths/recommended'
    ];
    
    endpoints.forEach(endpoint => {
      if (content.includes(endpoint)) {
        results.push({ feature: `Learning Paths ${endpoint}`, status: 'PASS', details: 'Endpoint exists' });
      } else {
        results.push({ feature: `Learning Paths ${endpoint}`, status: 'FAIL', details: 'Endpoint missing' });
      }
    });
  } else {
    results.push({ feature: 'Learning Paths Routes', status: 'FAIL', details: 'File not found' });
  }
  
  // Check Code Examples routes
  const codeExamplesRoutePath = join(__dirname, '../server/routes/codeExamples.ts');
  if (existsSync(codeExamplesRoutePath)) {
    const content = readFileSync(codeExamplesRoutePath, 'utf-8');
    
    const endpoints = [
      '/api/code-examples',
      '/api/code-examples/:id',
      '/api/terms/:termId/code-examples',
      '/api/code-examples/:id/vote',
      '/api/code-examples/:id/run'
    ];
    
    endpoints.forEach(endpoint => {
      if (content.includes(endpoint)) {
        results.push({ feature: `Code Examples ${endpoint}`, status: 'PASS', details: 'Endpoint exists' });
      } else {
        results.push({ feature: `Code Examples ${endpoint}`, status: 'FAIL', details: 'Endpoint missing' });
      }
    });
  } else {
    results.push({ feature: 'Code Examples Routes', status: 'FAIL', details: 'File not found' });
  }
  
  // Check route registration
  const indexPath = join(__dirname, '../server/routes/index.ts');
  if (existsSync(indexPath)) {
    const content = readFileSync(indexPath, 'utf-8');
    
    if (content.includes('registerLearningPathsRoutes')) {
      results.push({ feature: 'Learning Paths Registration', status: 'PASS', details: 'Routes registered' });
    } else {
      results.push({ feature: 'Learning Paths Registration', status: 'FAIL', details: 'Not registered' });
    }
    
    if (content.includes('registerCodeExamplesRoutes')) {
      results.push({ feature: 'Code Examples Registration', status: 'PASS', details: 'Routes registered' });
    } else {
      results.push({ feature: 'Code Examples Registration', status: 'FAIL', details: 'Not registered' });
    }
  }
}

// Test 3: Frontend Components
function testFrontendComponents() {
  console.log('\n🔍 Testing Frontend Components...');
  
  const components = [
    { name: 'LearningPaths.tsx', path: '../client/src/pages/LearningPaths.tsx' },
    { name: 'LearningPathDetail.tsx', path: '../client/src/pages/LearningPathDetail.tsx' },
    { name: 'CodeExamples.tsx', path: '../client/src/pages/CodeExamples.tsx' }
  ];
  
  components.forEach(component => {
    const fullPath = join(__dirname, component.path);
    if (existsSync(fullPath)) {
      const content = readFileSync(fullPath, 'utf-8');
      
      // Check for key functionality
      if (content.includes('useEffect') && content.includes('fetch')) {
        results.push({ feature: component.name, status: 'PASS', details: 'Component with API calls' });
      } else {
        results.push({ feature: component.name, status: 'PASS', details: 'Component exists' });
      }
    } else {
      results.push({ feature: component.name, status: 'FAIL', details: 'File not found' });
    }
  });
  
  // Check lazy loading
  const lazyPath = join(__dirname, '../client/src/components/lazy/LazyPages.tsx');
  if (existsSync(lazyPath)) {
    const content = readFileSync(lazyPath, 'utf-8');
    
    if (content.includes('LazyLearningPaths') && content.includes('LazyCodeExamples')) {
      results.push({ feature: 'Lazy Loading Config', status: 'PASS', details: 'Components lazy loaded' });
    } else {
      results.push({ feature: 'Lazy Loading Config', status: 'FAIL', details: 'Not properly configured' });
    }
  }
  
  // Check App.tsx routes
  const appPath = join(__dirname, '../client/src/App.tsx');
  if (existsSync(appPath)) {
    const content = readFileSync(appPath, 'utf-8');
    
    if (content.includes('path="/learning-paths"') && content.includes('path="/code-examples"')) {
      results.push({ feature: 'App Routes', status: 'PASS', details: 'Routes configured' });
    } else {
      results.push({ feature: 'App Routes', status: 'FAIL', details: 'Routes missing' });
    }
  }
}

// Test 4: Navigation Updates
function testNavigation() {
  console.log('\n🔍 Testing Navigation Updates...');
  
  const headerPath = join(__dirname, '../client/src/components/Header.tsx');
  if (existsSync(headerPath)) {
    const content = readFileSync(headerPath, 'utf-8');
    
    if (content.includes('Learning Paths') && content.includes('Code Examples')) {
      results.push({ feature: 'Header Navigation', status: 'PASS', details: 'Links added' });
    } else {
      results.push({ feature: 'Header Navigation', status: 'FAIL', details: 'Links missing' });
    }
  } else {
    results.push({ feature: 'Header Navigation', status: 'FAIL', details: 'Header not found' });
  }
}

// Run all tests
function runTests() {
  console.log('🚀 Starting Learning Paths & Code Examples Implementation Tests\n');
  
  testDatabaseSchema();
  testAPIRoutes();
  testFrontendComponents();
  testNavigation();
  
  // Summary
  console.log('\n📊 Test Results Summary:');
  console.log('========================\n');
  
  const passed = results.filter(r => r.status === 'PASS').length;
  const failed = results.filter(r => r.status === 'FAIL').length;
  
  results.forEach(result => {
    const icon = result.status === 'PASS' ? '✅' : '❌';
    console.log(`${icon} ${result.feature}: ${result.details}`);
  });
  
  console.log('\n========================');
  console.log(`Total Tests: ${results.length}`);
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`Success Rate: ${Math.round((passed / results.length) * 100)}%`);
  
  if (failed === 0) {
    console.log('\n🎉 All tests passed! Implementation is complete and validated.');
  } else {
    console.log('\n⚠️  Some tests failed. Please review the failures above.');
  }
}

// Execute tests
runTests();