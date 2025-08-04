#!/usr/bin/env node

const https = require('https');

const PRODUCTION_URL = 'https://d1bnbqox1m8zqp.cloudfront.net';

console.log('🔍 Testing production with fresh request (no cache)...\n');

// Test with cache-busting headers
const options = {
  headers: {
    'Cache-Control': 'no-cache, no-store, must-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0'
  }
};

console.log('1. Fetching main page HTML...');
https.get(PRODUCTION_URL, options, (res) => {
  let data = '';
  
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    if (res.statusCode === 200) {
      console.log('✅ Main page loads (200 OK)');
      
      // Check for .tsx references
      const tsxMatches = data.match(/\.tsx/g);
      
      if (tsxMatches) {
        console.log(`❌ Found ${tsxMatches.length} .tsx references in HTML`);
      } else {
        console.log('✅ No .tsx references found in HTML');
      }
      
      // Check for App.js
      const appJsMatch = data.match(/\/assets\/App-[^"]*\.js/);
      if (appJsMatch) {
        console.log(`✅ Found App.js reference: ${appJsMatch[0]}`);
        
        // Test if it loads
        const appUrl = PRODUCTION_URL + appJsMatch[0];
        https.get(appUrl, options, (appRes) => {
          console.log(`\n2. Testing JavaScript file...`);
          console.log(`   URL: ${appUrl}`);
          console.log(`   Status: ${appRes.statusCode}`);
          console.log(`   Content-Type: ${appRes.headers['content-type']}`);
          
          if (appRes.statusCode === 200 && appRes.headers['content-type'].includes('javascript')) {
            console.log('✅ JavaScript file loads with correct MIME type');
          }
        });
      }
      
      // Test icon
      console.log('\n3. Testing icon file...');
      const iconUrl = PRODUCTION_URL + '/icons/icon-192x192.png';
      https.get(iconUrl, options, (iconRes) => {
        console.log(`   URL: ${iconUrl}`);
        console.log(`   Status: ${iconRes.statusCode}`);
        console.log(`   Content-Type: ${iconRes.headers['content-type'] || 'N/A'}`);
        
        if (iconRes.statusCode === 403) {
          console.log('❌ Icon returns 403 - S3 permissions issue');
        }
      });
      
      // Test API
      console.log('\n4. Testing API endpoints...');
      const apiUrl = PRODUCTION_URL + '/api/health';
      https.get(apiUrl, options, (apiRes) => {
        console.log(`   Health URL: ${apiUrl}`);
        console.log(`   Status: ${apiRes.statusCode}`);
        console.log(`   Content-Type: ${apiRes.headers['content-type']}`);
      });
      
    } else {
      console.log(`❌ Main page failed to load (${res.statusCode})`);
    }
  });
  
}).on('error', (err) => {
  console.log(`❌ Error: ${err.message}`);
});