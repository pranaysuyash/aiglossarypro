#!/usr/bin/env node

/**
 * Test script to diagnose the 500 error on /api/user/progress/stats
 */

const fetch = require('node-fetch');

async function testProgressAPI() {
  console.log('Testing /api/user/progress/stats endpoint...\n');
  
  // Get auth token from localStorage (you may need to update this)
  const authToken = process.env.AUTH_TOKEN || 'your-auth-token-here';
  
  try {
    console.log('Making request to: http://localhost:5178/api/user/progress/stats');
    console.log('With Authorization header: Bearer', authToken.substring(0, 20) + '...');
    
    const response = await fetch('http://localhost:5178/api/user/progress/stats', {
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('\nResponse status:', response.status);
    console.log('Response headers:', response.headers.raw());
    
    const data = await response.json();
    console.log('\nResponse body:', JSON.stringify(data, null, 2));
    
    if (response.status === 500) {
      console.log('\n❌ ERROR 500 - Server Error');
      console.log('Error message:', data.message || data.error || 'No error message provided');
      console.log('Error details:', data.details || 'No details provided');
    } else if (response.status === 401) {
      console.log('\n⚠️  ERROR 401 - Authentication Required');
      console.log('Make sure to set AUTH_TOKEN environment variable with a valid token');
    } else if (response.status === 200) {
      console.log('\n✅ SUCCESS - API is working correctly');
    }
    
  } catch (error) {
    console.error('\n❌ Network/Fetch error:', error.message);
    console.error('Stack:', error.stack);
  }
}

// Instructions
console.log('='.repeat(80));
console.log('PROGRESS API TEST SCRIPT');
console.log('='.repeat(80));
console.log('\nTo use this script:');
console.log('1. Make sure your server is running on port 5178');
console.log('2. Get your auth token from the browser:');
console.log('   - Open DevTools Console');
console.log('   - Run: localStorage.getItem("authToken")');
console.log('   - Copy the token value');
console.log('3. Run this script with the token:');
console.log('   AUTH_TOKEN="your-token-here" node test-progress-api.js');
console.log('\n' + '='.repeat(80) + '\n');

// Run the test
testProgressAPI();