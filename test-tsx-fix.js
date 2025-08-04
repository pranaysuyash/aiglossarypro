#!/usr/bin/env node

const https = require('https');
const fs = require('fs');

const PRODUCTION_URL = 'https://d1bnbqox1m8zqp.cloudfront.net';

console.log('🔍 Testing TSX fix on production...\n');

// Test 1: Check if main page loads
console.log('1. Testing main page load...');
https.get(PRODUCTION_URL, (res) => {
  let data = '';
  
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    if (res.statusCode === 200) {
      console.log('✅ Main page loads (200 OK)');
      
      // Test 2: Check for .tsx references in HTML
      console.log('\n2. Checking for .tsx references in HTML...');
      const tsxMatches = data.match(/\.tsx/g);
      
      if (tsxMatches) {
        console.log(`❌ Found ${tsxMatches.length} .tsx references in HTML:`);
        const lines = data.split('\n');
        lines.forEach((line, index) => {
          if (line.includes('.tsx')) {
            console.log(`   Line ${index + 1}: ${line.trim()}`);
          }
        });
      } else {
        console.log('✅ No .tsx references found in HTML');
      }
      
      // Test 3: Check for correct .js references
      console.log('\n3. Checking for .js module references...');
      const jsMatches = data.match(/\/assets\/[^"]*\.js/g);
      
      if (jsMatches) {
        console.log(`✅ Found ${jsMatches.length} .js references:`);
        jsMatches.forEach(match => {
          console.log(`   ${match}`);
        });
      } else {
        console.log('⚠️  No .js asset references found');
      }
      
      // Test 4: Check if App.js exists by trying to load it
      console.log('\n4. Testing if App.js file loads...');
      const appJsMatch = data.match(/\/assets\/App-[^"]*\.js/);
      
      if (appJsMatch) {
        const appJsUrl = PRODUCTION_URL + appJsMatch[0];
        console.log(`   Checking: ${appJsUrl}`);
        
        https.get(appJsUrl, (appRes) => {
          if (appRes.statusCode === 200) {
            console.log('✅ App.js file loads successfully');
            console.log(`   Content-Type: ${appRes.headers['content-type']}`);
            console.log('\n🎉 TSX fix appears to be working!');
          } else {
            console.log(`❌ App.js file failed to load (${appRes.statusCode})`);
          }
        }).on('error', (err) => {
          console.log(`❌ Error loading App.js: ${err.message}`);
        });
      } else {
        console.log('❌ No App.js reference found in HTML');
      }
      
    } else {
      console.log(`❌ Main page failed to load (${res.statusCode})`);
    }
  });
  
}).on('error', (err) => {
  console.log(`❌ Error: ${err.message}`);
});

console.log('⏳ Running tests...\n');