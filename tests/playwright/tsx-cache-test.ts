import { test, expect } from '@playwright/test';

const PRODUCTION_URL = 'https://d1bnbqox1m8zqp.cloudfront.net';

test('TSX fix verification - fresh context', async ({ browser }) => {
  // Create a fresh browser context with no cache
  const context = await browser.newContext({
    storageState: undefined, // No stored state
    ignoreHTTPSErrors: false,
    bypassCSP: false,
  });
  
  const page = await context.newPage();
  
  // Clear any existing cache
  await context.clearCookies();
  
  const tsxRequests = [];
  const consoleErrors = [];
  
  // Track TSX requests
  page.on('request', request => {
    if (request.url().includes('.tsx')) {
      tsxRequests.push(request.url());
    }
  });
  
  // Track console errors related to TSX/MIME
  page.on('console', msg => {
    if (msg.type() === 'error' && msg.text().includes('tsx')) {
      consoleErrors.push(msg.text());
    }
  });
  
  console.log('🧪 Testing TSX fix with fresh browser context...');
  
  // Navigate with cache disabled
  const response = await page.goto(PRODUCTION_URL, { 
    waitUntil: 'networkidle',
    timeout: 30000
  });
  
  expect(response?.status()).toBe(200);
  
  // Wait for app to fully load
  await page.waitForTimeout(8000);
  
  console.log(`📊 TSX requests found: ${tsxRequests.length}`);
  console.log(`📊 TSX console errors: ${consoleErrors.length}`);
  
  if (tsxRequests.length > 0) {
    console.log('❌ TSX requests:', tsxRequests);
  }
  
  if (consoleErrors.length > 0) {
    console.log('❌ Console errors:', consoleErrors);
  }
  
  // Verify no TSX files are being requested
  expect(tsxRequests).toHaveLength(0);
  expect(consoleErrors).toHaveLength(0);
  
  console.log('✅ TSX fix verified successfully!');
  
  await context.close();
});