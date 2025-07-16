#!/usr/bin/env tsx

// Simple API test to check if endpoints are working
async function testAPIEndpoints() {
  console.log('🧪 Testing API Endpoints\n');

  const baseUrl = 'http://localhost:3001/api';

  const endpoints = [
    '/terms?limit=5',
    '/categories?limit=5',
    '/enhanced-terms?limit=5',
    '/search?query=machine learning&limit=3',
  ];

  for (const endpoint of endpoints) {
    try {
      console.log(`Testing: ${endpoint}`);

      const response = await fetch(`${baseUrl}${endpoint}`, {
        headers: {
          Accept: 'application/json',
          'User-Agent': 'Test Script',
        },
      });

      if (response.ok) {
        const data = await response.json();
        console.log(`✅ Status: ${response.status}`);

        if (Array.isArray(data)) {
          console.log(`   Result: Array with ${data.length} items`);
          if (data.length > 0) {
            console.log(`   Sample: ${JSON.stringify(data[0]).substring(0, 100)}...`);
          }
        } else if (data.data && Array.isArray(data.data)) {
          console.log(`   Result: Response object with ${data.data.length} items`);
          if (data.data.length > 0) {
            console.log(`   Sample: ${JSON.stringify(data.data[0]).substring(0, 100)}...`);
          }
        } else {
          console.log(`   Result: ${JSON.stringify(data).substring(0, 100)}...`);
        }
      } else {
        console.log(`❌ Status: ${response.status} - ${response.statusText}`);
        const errorText = await response.text();
        console.log(`   Error: ${errorText.substring(0, 100)}...`);
      }

      console.log('');

      // Wait between requests to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 2000));
    } catch (error) {
      console.log(`❌ Failed to test ${endpoint}:`);
      console.log(`   Error: ${error}`);
      console.log('');
    }
  }
}

testAPIEndpoints().catch(console.error);
