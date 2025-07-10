#!/usr/bin/env node

/**
 * Debug script to test authentication routes
 */

const http = require('http');
const https = require('https');

const SERVER_URL = 'http://localhost:3001';

// Test different authentication routes
const routes = [
  '/api/auth/providers',
  '/api/auth/check',
  '/api/auth/me',
  '/api/auth/firebase/login',
  '/api/auth/firebase/register',
  '/api/auth/login',
  '/api/auth/register',
  '/api/auth/user',
  '/api/health'
];

async function testRoute(route) {
  return new Promise((resolve) => {
    const url = `${SERVER_URL}${route}`;
    const client = url.startsWith('https') ? https : http;
    
    console.log(`Testing: ${route}`);
    
    const req = client.request(url, { method: 'GET' }, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        console.log(`  Status: ${res.statusCode}`);
        console.log(`  Headers: ${JSON.stringify(res.headers, null, 2)}`);
        
        if (res.statusCode === 200) {
          try {
            const parsed = JSON.parse(data);
            console.log(`  Response: ${JSON.stringify(parsed, null, 2)}`);
          } catch (e) {
            console.log(`  Response: ${data.substring(0, 200)}...`);
          }
        } else {
          console.log(`  Error Response: ${data}`);
        }
        console.log('---');
        resolve({ route, status: res.statusCode, response: data });
      });
    });
    
    req.on('error', (err) => {
      console.log(`  Error: ${err.message}`);
      console.log('---');
      resolve({ route, error: err.message });
    });
    
    req.end();
  });
}

async function main() {
  console.log('🔍 Testing authentication routes...\n');
  
  for (const route of routes) {
    await testRoute(route);
    await new Promise(resolve => setTimeout(resolve, 500)); // Small delay
  }
  
  console.log('\n✅ Route testing complete');
}

main().catch(console.error);
