#!/usr/bin/env tsx

import { chromium } from 'playwright';

async function simpleAdminTest() {
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 500
  });
  
  const page = await browser.newPage();
  
  try {
    console.log('1. Navigating to frontend...');
    await page.goto('http://localhost:5173');
    await page.waitForTimeout(3000);
    
    // Accept cookies
    const cookieButton = await page.$('button:has-text("Accept")');
    if (cookieButton) {
      await cookieButton.click();
      console.log('✓ Accepted cookies');
    }
    
    console.log('\n2. Going directly to login page...');
    await page.goto('http://localhost:5173/login');
    await page.waitForTimeout(5000);
    
    console.log('\n3. Checking page content...');
    const title = await page.title();
    console.log('Page title:', title);
    
    const url = await page.url();
    console.log('Current URL:', url);
    
    // Check if there's any content
    const bodyText = await page.textContent('body');
    console.log('Body text preview:', bodyText?.substring(0, 200));
    
    // Look for any form elements
    const forms = await page.$$('form');
    console.log('Number of forms found:', forms.length);
    
    const inputs = await page.$$('input');
    console.log('Number of inputs found:', inputs.length);
    
    // Check for React root
    const reactRoot = await page.$('#root, #app, .app, [data-reactroot]');
    console.log('React root found:', !!reactRoot);
    
    // Take screenshot
    await page.screenshot({ path: 'simple-test-login-page.png' });
    console.log('\n✓ Screenshot saved: simple-test-login-page.png');
    
    // Try to find email input with very broad selector
    const anyInput = await page.$('input');
    if (anyInput) {
      const inputType = await anyInput.getAttribute('type');
      const inputName = await anyInput.getAttribute('name');
      const inputPlaceholder = await anyInput.getAttribute('placeholder');
      console.log('\nFirst input found:');
      console.log('- Type:', inputType);
      console.log('- Name:', inputName);
      console.log('- Placeholder:', inputPlaceholder);
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    console.log('\nClosing in 5 seconds...');
    await page.waitForTimeout(5000);
    await browser.close();
  }
}

simpleAdminTest().catch(console.error);