#!/usr/bin/env node
/**
 * Quick server test to verify authentication routes are working
 */

console.log('🔍 Testing server authentication routes...\n');

// Test server health and auth routes
const testUrls = [
  'http://localhost:3001/api/health',
  'http://localhost:3001/api/auth/providers',
  'http://localhost:3001/api/auth/check',
];

const testData = {
  firebase_login: {
    url: 'http://localhost:3001/api/auth/firebase/login',
    method: 'POST',
    data: { idToken: 'test-token' }
  },
  firebase_register: {
    url: 'http://localhost:3001/api/auth/firebase/register', 
    method: 'POST',
    data: { email: 'test@example.com', password: 'testpass123' }
  }
};

async function testGet(url) {
  const fetch = (await import('node-fetch')).default;
  try {
    const response = await fetch(url);
    const data = await response.text();
    console.log(`GET ${url}`);
    console.log(`  Status: ${response.status}`);
    console.log(`  Response: ${data.substring(0, 200)}...`);
    console.log('---');
  } catch (error) {
    console.log(`GET ${url}`);
    console.log(`  Error: ${error.message}`);
    console.log('---');
  }
}

async function testPost(name, config) {
  const fetch = (await import('node-fetch')).default;
  try {
    const response = await fetch(config.url, {
      method: config.method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(config.data)
    });
    const data = await response.text();
    console.log(`POST ${config.url} (${name})`);
    console.log(`  Status: ${response.status}`);
    console.log(`  Response: ${data.substring(0, 200)}...`);
    console.log('---');
  } catch (error) {
    console.log(`POST ${config.url} (${name})`);
    console.log(`  Error: ${error.message}`);
    console.log('---');
  }
}

async function main() {
  // Test GET routes
  for (const url of testUrls) {
    await testGet(url);
  }
  
  // Test POST routes
  for (const [name, config] of Object.entries(testData)) {
    await testPost(name, config);
  }
  
  console.log('\n✅ Route testing complete');
}

main().catch(console.error);
