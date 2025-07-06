#!/usr/bin/env node

import { chromium } from 'playwright';

async function testApp() {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  console.log('🔍 Testing app loading...');
  
  // Listen for console logs
  page.on('console', msg => {
    console.log(`Browser ${msg.type()}: ${msg.text()}`);
  });
  
  // Listen for errors
  page.on('pageerror', error => {
    console.error('❌ Page error:', error.message);
  });
  
  try {
    await page.goto('http://localhost:5173/', { 
      waitUntil: 'networkidle',
      timeout: 30000 
    });
    
    console.log('✅ Page loaded, waiting for content...');
    
    // Wait for the spinner to disappear or content to load
    await page.waitForTimeout(10000);
    
    // Check if we're still on a spinner
    const hasSpinner = await page.locator('.animate-spin').count();
    console.log(`Spinner count: ${hasSpinner}`);
    
    // Check page title
    const title = await page.title();
    console.log(`Page title: ${title}`);
    
    // Check if there's any text content
    const bodyText = await page.textContent('body');
    console.log(`Body text length: ${bodyText?.length || 0}`);
    
    // Take a screenshot
    await page.screenshot({ path: 'app-test.png' });
    console.log('📸 Screenshot saved');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    await browser.close();
  }
}

testApp().catch(console.error);