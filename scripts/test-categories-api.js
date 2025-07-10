#!/usr/bin/env node

/**
 * Test script to debug categories API endpoints
 */

import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:3001';

async function testCategoriesAPI() {
  console.log('Testing Categories API endpoints...\n');
  
  // Test 1: Get all categories
  console.log('1. Testing GET /api/categories');
  try {
    const response = await fetch(`${BASE_URL}/api/categories`);
    const data = await response.json();
    
    if (response.ok) {
      console.log('✅ Success');
      console.log('Response:', JSON.stringify(data, null, 2));
    } else {
      console.log('❌ Error:', response.status, response.statusText);
      console.log('Response:', JSON.stringify(data, null, 2));
    }
  } catch (error) {
    console.log('❌ Network Error:', error.message);
  }
  
  console.log('\n---\n');
  
  // Test 2: Get categories with parameters
  console.log('2. Testing GET /api/categories with parameters');
  try {
    const response = await fetch(`${BASE_URL}/api/categories?limit=5&includeStats=true`);
    const data = await response.json();
    
    if (response.ok) {
      console.log('✅ Success');
      console.log('Response:', JSON.stringify(data, null, 2));
    } else {
      console.log('❌ Error:', response.status, response.statusText);
      console.log('Response:', JSON.stringify(data, null, 2));
    }
  } catch (error) {
    console.log('❌ Network Error:', error.message);
  }
  
  console.log('\n---\n');
  
  // Test 3: Get categories count
  console.log('3. Testing categories count functionality');
  try {
    // This is an internal method test, would need to access it via the actual API
    console.log('This would test the getCategoriesCount method internally');
  } catch (error) {
    console.log('❌ Error:', error.message);
  }
}

testCategoriesAPI().catch(console.error);