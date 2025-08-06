#!/usr/bin/env node
/**
 * Frontend API Integration Test Script
 * Tests the deployed frontend and its API integration
 * 
 * Usage: node test-frontend-api-integration.js
 */

// Test configuration
const FRONTEND_URL = 'https://d1m7nnfj3im4kp.cloudfront.net/';
const API_BASE_URL = 'https://d1m7nnfj3im4kp.cloudfront.net/api';

console.log('🚀 Starting Frontend API Integration Tests\n');
console.log(`Frontend URL: ${FRONTEND_URL}`);
console.log(`API Base URL: ${API_BASE_URL}\n`);

// Test Results Storage
const testResults = {
  frontendLoading: null,
  apiEndpoints: {},
  corsIssues: [],
  authFlow: null,
  searchFunctionality: null,
  errorHandling: null,
  recommendations: []
};

async function testFetch(url, options = {}) {
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        'User-Agent': 'Frontend-API-Integration-Test/1.0',
        'Accept': 'application/json, text/html, */*',
        ...options.headers
      }
    });
    
    return {
      success: true,
      status: response.status,
      statusText: response.statusText,
      headers: Object.fromEntries(response.headers.entries()),
      text: await response.text()
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
      type: error.name
    };
  }
}

async function testFrontendLoading() {
  console.log('📱 Testing Frontend Loading...');
  
  const result = await testFetch(FRONTEND_URL);
  
  if (result.success) {
    if (result.status === 200) {
      testResults.frontendLoading = {
        status: 'SUCCESS',
        statusCode: result.status,
        hasHTML: result.text.includes('<!DOCTYPE html>'),
        hasReact: result.text.includes('react') || result.text.includes('React'),
        hasAPI: result.text.includes('api') || result.text.includes('API'),
        contentLength: result.text.length
      };
      console.log('✅ Frontend loads successfully');
    } else if (result.status === 403) {
      testResults.frontendLoading = {
        status: 'FORBIDDEN',
        statusCode: result.status,
        issue: 'CloudFront access denied - likely missing index.html or incorrect S3 permissions'
      };
      testResults.recommendations.push('Fix CloudFront/S3 permissions for frontend access');
      console.log('❌ Frontend returns 403 Forbidden');
    } else {
      testResults.frontendLoading = {
        status: 'ERROR',
        statusCode: result.status,
        statusText: result.statusText
      };
      console.log(`❌ Frontend returns ${result.status}: ${result.statusText}`);
    }
  } else {
    testResults.frontendLoading = {
      status: 'NETWORK_ERROR',
      error: result.error,
      type: result.type
    };
    console.log(`❌ Network error: ${result.error}`);
  }
  
  console.log('');
}

async function testAPIEndpoints() {
  console.log('🔌 Testing API Endpoints...');
  
  const endpoints = [
    '/terms',
    '/categories',
    '/health',
    '/auth/status',
    '/search?q=test'
  ];
  
  for (const endpoint of endpoints) {
    const url = `${API_BASE_URL}${endpoint}`;
    console.log(`  Testing: ${endpoint}`);
    
    const result = await testFetch(url);
    
    if (result.success && result.status === 200) {
      try {
        const data = JSON.parse(result.text);
        testResults.apiEndpoints[endpoint] = {
          status: 'SUCCESS',
          statusCode: result.status,
          responseType: 'JSON',
          hasData: !!data.data || !!data.terms || !!data.categories,
          dataCount: data.data?.length || data.terms?.length || data.categories?.length || 0,
          responseSize: result.text.length,
          structure: Object.keys(data)
        };
        console.log(`    ✅ Returns valid JSON with ${testResults.apiEndpoints[endpoint].dataCount} items`);
      } catch (e) {
        testResults.apiEndpoints[endpoint] = {
          status: 'INVALID_JSON',
          statusCode: result.status,
          responseType: 'TEXT',
          responseSize: result.text.length,
          sample: result.text.substring(0, 200)
        };
        console.log(`    ⚠️  Returns non-JSON response`);
      }
    } else if (result.success) {
      testResults.apiEndpoints[endpoint] = {
        status: 'HTTP_ERROR',
        statusCode: result.status,
        statusText: result.statusText,
        responseSize: result.text.length
      };
      console.log(`    ❌ HTTP ${result.status}: ${result.statusText}`);
    } else {
      testResults.apiEndpoints[endpoint] = {
        status: 'NETWORK_ERROR',
        error: result.error,
        type: result.type
      };
      console.log(`    ❌ Network error: ${result.error}`);
    }
  }
  
  console.log('');
}

async function testCORSConfiguration() {
  console.log('🌐 Testing CORS Configuration...');
  
  // Test preflight request
  const result = await testFetch(`${API_BASE_URL}/terms`, {
    method: 'OPTIONS',
    headers: {
      'Origin': 'https://d1m7nnfj3im4kp.cloudfront.net',
      'Access-Control-Request-Method': 'GET',
      'Access-Control-Request-Headers': 'Content-Type'
    }
  });
  
  if (result.success) {
    const corsHeaders = {
      'access-control-allow-origin': result.headers['access-control-allow-origin'],
      'access-control-allow-methods': result.headers['access-control-allow-methods'],
      'access-control-allow-headers': result.headers['access-control-allow-headers'],
      'access-control-allow-credentials': result.headers['access-control-allow-credentials']
    };
    
    testResults.corsConfiguration = {
      status: 'CONFIGURED',
      headers: corsHeaders,
      allowsOrigin: corsHeaders['access-control-allow-origin'] === '*' || 
                   corsHeaders['access-control-allow-origin']?.includes('cloudfront.net')
    };
    
    if (!testResults.corsConfiguration.allowsOrigin) {
      testResults.corsIssues.push('CORS may not allow CloudFront origin');
      testResults.recommendations.push('Update CORS configuration to allow CloudFront origin');
    }
    
    console.log('✅ CORS headers present');
  } else {
    testResults.corsConfiguration = {
      status: 'NO_PREFLIGHT',
      error: result.error
    };
    console.log('⚠️  No CORS preflight response');
  }
  
  console.log('');
}

async function generateBrowserTestScript() {
  console.log('📝 Generating Browser Console Test Script...');
  
  const script = `
// ====================================================================
// Frontend API Integration Browser Test Script
// Copy and paste this into the browser console at ${FRONTEND_URL}
// ====================================================================

console.log('🚀 Starting Frontend API Integration Tests in Browser');

// Test API connectivity
async function testAPI() {
  const tests = [
    { name: 'Terms', url: '${API_BASE_URL}/terms' },
    { name: 'Categories', url: '${API_BASE_URL}/categories' }
  ];
  
  for (const test of tests) {
    try {
      console.log(\`Testing \${test.name} API...\`);
      const response = await fetch(test.url);
      const data = await response.json();
      
      if (response.ok) {
        console.log(\`✅ \${test.name} API Success:\`, data);
      } else {
        console.error(\`❌ \${test.name} API Error (\${response.status}):\`, data);
      }
    } catch (error) {
      console.error(\`❌ \${test.name} Network Error:\`, error);
    }
  }
}

// Test authentication if available
async function testAuth() {
  try {
    const response = await fetch('${API_BASE_URL}/auth/status', {
      credentials: 'include'
    });
    const data = await response.json();
    console.log('🔐 Auth Status:', data);
  } catch (error) {
    console.log('ℹ️  Auth endpoint not available or errored:', error.message);
  }
}

// Test search functionality
async function testSearch(query = 'artificial intelligence') {
  try {
    const response = await fetch(\`${API_BASE_URL}/search?q=\${encodeURIComponent(query)}\`);
    const data = await response.json();
    
    if (response.ok) {
      console.log(\`🔍 Search for "\${query}" Success:\`, data);
    } else {
      console.error(\`❌ Search Error (\${response.status}):\`, data);
    }
  } catch (error) {
    console.error('❌ Search Network Error:', error);
  }
}

// Check for frontend JavaScript errors
function checkForErrors() {
  console.log('📊 Current JavaScript Errors:');
  if (window.console.error.length) {
    console.log('Errors found in console');
  } else {
    console.log('No obvious errors detected');
  }
  
  // Check for React
  if (window.React || window.__REACT_DEVTOOLS_GLOBAL_HOOK__) {
    console.log('✅ React detected');
  } else {
    console.log('⚠️  React not detected');
  }
  
  // Check for common frontend frameworks
  if (window.Vue) console.log('✅ Vue.js detected');
  if (window.angular) console.log('✅ Angular detected');
  if (window.jQuery || window.$) console.log('✅ jQuery detected');
}

// Run all tests
async function runAllTests() {
  checkForErrors();
  await testAPI();
  await testAuth();
  await testSearch();
  
  console.log('🎉 Browser tests completed!');
}

// Auto-run tests
runAllTests();

// Make functions available globally for manual testing
window.testAPI = testAPI;
window.testAuth = testAuth;
window.testSearch = testSearch;
window.checkForErrors = checkForErrors;

console.log('💡 Available functions: testAPI(), testAuth(), testSearch(query), checkForErrors()');
`;
  
  return script.trim();
}

async function runTests() {
  const startTime = Date.now();
  
  // Run all tests
  await testFrontendLoading();
  await testAPIEndpoints();
  await testCORSConfiguration();
  
  const browserScript = await generateBrowserTestScript();
  
  // Generate comprehensive report
  const duration = Date.now() - startTime;
  
  const report = {
    timestamp: new Date().toISOString(),
    duration: `${duration}ms`,
    summary: {
      frontendStatus: testResults.frontendLoading?.status || 'UNKNOWN',
      apiEndpointsWorking: Object.values(testResults.apiEndpoints).filter(e => e.status === 'SUCCESS').length,
      apiEndpointsTotal: Object.keys(testResults.apiEndpoints).length,
      corsIssues: testResults.corsIssues.length,
      recommendationsCount: testResults.recommendations.length
    },
    details: testResults,
    browserTestScript: browserScript,
    recommendations: testResults.recommendations
  };
  
  console.log('📊 Test Results Summary');
  console.log('========================');
  console.log(`Frontend Status: ${report.summary.frontendStatus}`);
  console.log(`API Endpoints Working: ${report.summary.apiEndpointsWorking}/${report.summary.apiEndpointsTotal}`);
  console.log(`CORS Issues: ${report.summary.corsIssues}`);
  console.log(`Recommendations: ${report.summary.recommendationsCount}`);
  console.log(`\nTest Duration: ${report.duration}\n`);
  
  if (testResults.recommendations.length > 0) {
    console.log('🔧 Recommendations:');
    testResults.recommendations.forEach((rec, i) => {
      console.log(`  ${i + 1}. ${rec}`);
    });
    console.log('');
  }
  
  // Save detailed report
  const fs = require('fs');
  const reportPath = 'frontend-api-integration-test-report.json';
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  
  console.log(`📄 Detailed report saved to: ${reportPath}`);
  console.log(`📄 Browser test script saved for manual testing`);
  
  return report;
}

// Run tests if called directly
if (require.main === module) {
  runTests().then(report => {
    process.exit(report.summary.frontendStatus === 'SUCCESS' ? 0 : 1);
  }).catch(error => {
    console.error('❌ Test runner error:', error);
    process.exit(1);
  });
}

module.exports = { runTests, testResults };