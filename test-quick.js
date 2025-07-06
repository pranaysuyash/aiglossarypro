#!/usr/bin/env node

import { chromium } from 'playwright';

async function quickTest() {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  console.log('🔍 Quick test of landing page...');
  
  try {
    await page.goto('http://localhost:5173/', { 
      waitUntil: 'domcontentloaded',
      timeout: 15000 
    });
    
    // Wait for React to render
    await page.waitForTimeout(3000);
    
    // Check if we have the landing page content
    const isLandingPage = await page.locator('h1').count() > 0;
    console.log(`Landing page loaded: ${isLandingPage}`);
    
    if (isLandingPage) {
      const headingText = await page.locator('h1').first().textContent();
      console.log(`Heading: ${headingText}`);
    }
    
    // Test login page
    console.log('\n🔍 Testing login page...');
    await page.goto('http://localhost:5173/login', { 
      waitUntil: 'domcontentloaded',
      timeout: 10000 
    });
    
    await page.waitForTimeout(2000);
    
    const hasLoginForm = await page.locator('form').count() > 0;
    console.log(`Login form found: ${hasLoginForm}`);
    
    // Test terms page
    console.log('\n🔍 Testing terms page...');
    await page.goto('http://localhost:5173/terms', { 
      waitUntil: 'domcontentloaded',
      timeout: 10000 
    });
    
    await page.waitForTimeout(2000);
    
    const hasContent = await page.locator('main').count() > 0;
    console.log(`Terms page content found: ${hasContent}`);
    
    console.log('\n✅ Quick test completed successfully!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    await browser.close();
  }
}

quickTest().catch(console.error);