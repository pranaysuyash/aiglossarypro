#!/usr/bin/env node

/**
 * Test cache path resolution
 */

const path = require('path');

console.log('🔍 Testing cache path resolution');
console.log('================================');

console.log('Current working directory:', process.cwd());
console.log('__dirname:', __dirname);

const expectedCachePath = path.join(process.cwd(), 'ai_cache.json');
console.log('Expected cache path:', expectedCachePath);

// Check if file exists
const fs = require('fs');
try {
  const stats = fs.statSync(expectedCachePath);
  console.log('✅ Cache file exists!');
  console.log('File size:', stats.size, 'bytes');
  console.log('Last modified:', stats.mtime);
} catch (error) {
  console.log('❌ Cache file does not exist:', error.message);
}

// Check temp directory cache
const tempCachePath = path.join(process.cwd(), 'temp', 'parsed_cache', 'ai_parse_cache.json');
console.log('\nTemp cache path:', tempCachePath);
try {
  const stats = fs.statSync(tempCachePath);
  console.log('✅ Temp cache file exists!');
  console.log('File size:', stats.size, 'bytes');
  console.log('Last modified:', stats.mtime);
  
  // Read content sample
  const content = fs.readFileSync(tempCachePath, 'utf-8');
  const parsed = JSON.parse(content);
  console.log('Cache entries:', Object.keys(parsed).length);
  console.log('Sample keys:', Object.keys(parsed).slice(0, 3));
} catch (error) {
  console.log('❌ Temp cache file does not exist:', error.message);
}