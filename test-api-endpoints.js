#!/usr/bin/env node

const https = require('https');

const CLOUDFRONT_URL = 'https://d1bnbqox1m8zqp.cloudfront.net';
const endpoints = [
  { method: 'GET', path: '/api/health', description: 'Health check' },
  { method: 'POST', path: '/api/auth/login', description: 'Standard login' },
  { method: 'POST', path: '/api/auth/firebase/login', description: 'Firebase login' },
  { method: 'GET', path: '/api/terms', description: 'Terms list' },
  { method: 'GET', path: '/api/categories', description: 'Categories list' }
];

console.log('🔍 Testing API endpoints through CloudFront...\n');

async function testEndpoint(endpoint) {
  return new Promise((resolve) => {
    const options = {
      method: endpoint.method,
      headers: {
        'Content-Type': 'application/json',
      }
    };

    const req = https.request(CLOUDFRONT_URL + endpoint.path, options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        const isJson = res.headers['content-type']?.includes('application/json');
        const isHtml = res.headers['content-type']?.includes('text/html');
        const status = res.statusCode;
        
        console.log(`${endpoint.method} ${endpoint.path} - ${endpoint.description}`);
        console.log(`  Status: ${status}`);
        console.log(`  Content-Type: ${res.headers['content-type'] || 'none'}`);
        console.log(`  Server: ${res.headers['server'] || 'none'}`);
        console.log(`  X-Cache: ${res.headers['x-cache'] || 'none'}`);
        
        if (isHtml && data.includes('<!DOCTYPE html>')) {
          console.log('  ❌ Returning HTML (S3 fallback)');
        } else if (isJson) {
          console.log('  ✅ Returning JSON (API response)');
        }
        
        console.log();
        resolve();
      });
    });
    
    req.on('error', (err) => {
      console.log(`${endpoint.method} ${endpoint.path} - ERROR: ${err.message}\n`);
      resolve();
    });
    
    if (endpoint.method === 'POST') {
      req.write(JSON.stringify({ test: 'data' }));
    }
    
    req.end();
  });
}

async function runTests() {
  for (const endpoint of endpoints) {
    await testEndpoint(endpoint);
  }
  
  console.log('✅ Test complete');
}

runTests();