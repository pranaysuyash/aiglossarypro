import { chromium } from 'playwright';

async function debugLogin() {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  try {
    console.log('🔍 Navigating to login page...');
    await page.goto('http://localhost:5173/login', { waitUntil: 'networkidle' });
    
    console.log('📸 Taking screenshot of login page...');
    await page.screenshot({ path: 'login-page-debug.png' });
    
    console.log('🔍 Looking for email input...');
    const emailInput = await page.$('input[type="email"]');
    if (emailInput) {
      console.log('✅ Found email input');
      await emailInput.fill('test@aimlglossary.com');
    } else {
      console.log('❌ Email input not found');
      
      // Try alternative selectors
      const inputs = await page.$$('input');
      console.log(`Found ${inputs.length} input elements`);
      
      // Check for any form elements
      const forms = await page.$$('form');
      console.log(`Found ${forms.length} form elements`);
    }
    
    console.log('\n🔍 Page content preview:');
    const title = await page.title();
    console.log(`Title: ${title}`);
    
    const h1 = await page.$('h1');
    if (h1) {
      const h1Text = await h1.textContent();
      console.log(`H1: ${h1Text}`);
    }
    
    // Check if there's a redirect
    const currentUrl = page.url();
    console.log(`Current URL: ${currentUrl}`);
    
    // Check for any error messages
    const errorMessages = await page.$$('[role="alert"], .error, .alert');
    console.log(`Found ${errorMessages.length} potential error messages`);
    
    console.log('\n👀 Browser will stay open. Press Ctrl+C to close.');
    await new Promise(() => {}); // Keep browser open
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

debugLogin().catch(console.error);