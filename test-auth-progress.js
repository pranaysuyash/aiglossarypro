#!/usr/bin/env node

/**
 * Test script to diagnose the 500 error on /api/user/progress/stats
 * This version includes authentication
 */

import fetch from 'node-fetch';

async function testWithAuth() {
  console.log('Testing /api/user/progress/stats with authentication...\n');
  
  try {
    // First, try to log in with test credentials
    console.log('1. Attempting test login...');
    const loginResponse = await fetch('http://localhost:3001/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: 'free@aiglossarypro.com',
        password: 'freepass123'
      })
    });
    
    const loginData = await loginResponse.json();
    console.log('Login response:', loginResponse.status);
    console.log('Login data:', JSON.stringify(loginData, null, 2));
    
    if (!loginResponse.ok) {
      console.log('\n⚠️  Login failed. Trying Firebase test token...');
      
      // Try with a mock Firebase token
      const testToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1aWQiOiJ0ZXN0LXVzZXItMTIzIiwiZW1haWwiOiJ0ZXN0QGV4YW1wbGUuY29tIiwiaWF0IjoxNjA5NDU5MjAwfQ.test';
      return await testProgressAPI(testToken);
    }
    
    const token = loginData.token || loginData.jwt || loginData.accessToken;
    if (token) {
      console.log('\n✅ Got auth token:', token.substring(0, 20) + '...');
      return await testProgressAPI(token);
    } else {
      console.log('\n❌ No token in login response');
    }
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error('Stack:', error.stack);
  }
}

async function testProgressAPI(token) {
  console.log('\n2. Testing /api/user/progress/stats...');
  console.log('Making request to: http://localhost:3001/api/user/progress/stats');
  console.log('With Authorization header: Bearer', token.substring(0, 20) + '...');
  
  const response = await fetch('http://localhost:3001/api/user/progress/stats', {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });
  
  console.log('\nResponse status:', response.status);
  console.log('Response headers:', Object.fromEntries(response.headers.entries()));
  
  const data = await response.json();
  console.log('\nResponse body:', JSON.stringify(data, null, 2));
  
  if (response.status === 500) {
    console.log('\n❌ ERROR 500 - Server Error');
    console.log('Error message:', data.message || data.error || 'No error message provided');
    console.log('Error details:', data.details || 'No details provided');
    
    // Check server logs
    console.log('\n📋 Check server logs for more details:');
    console.log('tail -100 server.log | grep -E "api/user/progress/stats|ERROR"');
  } else if (response.status === 401) {
    console.log('\n⚠️  ERROR 401 - Authentication Required');
    console.log('The token was not accepted. Check authentication middleware.');
  } else if (response.status === 200) {
    console.log('\n✅ SUCCESS - API is working correctly');
  }
}

// Test without any auth to see the error
async function testNoAuth() {
  console.log('Testing /api/user/progress/stats without authentication...\n');
  
  const response = await fetch('http://localhost:3001/api/user/progress/stats');
  const data = await response.json();
  
  console.log('Response status:', response.status);
  console.log('Response:', JSON.stringify(data, null, 2));
}

// Run tests
async function runTests() {
  console.log('='.repeat(80));
  console.log('PROGRESS API AUTHENTICATION TEST');
  console.log('='.repeat(80));
  
  // Test without auth first
  await testNoAuth();
  
  console.log('\n' + '='.repeat(80) + '\n');
  
  // Test with auth
  await testWithAuth();
  
  console.log('\n' + '='.repeat(80));
  console.log('To get a real auth token from the browser:');
  console.log('1. Open your app in the browser');
  console.log('2. Log in with your account');
  console.log('3. Open DevTools Console');
  console.log('4. Run: localStorage.getItem("authToken") || localStorage.getItem("firebase-auth-token")');
  console.log('5. Use that token to test the API directly');
}

runTests().catch(console.error);