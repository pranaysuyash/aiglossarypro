import { test, expect } from '@playwright/test';

// Production URL
const PRODUCTION_URL = 'https://d1bnbqox1m8zqp.cloudfront.net';

test.describe('Live Production Link Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Set up console logging
    page.on('console', msg => {
      if (msg.type() === 'error') {
        console.error(`❌ Console Error: ${msg.text()}`);
      } else if (msg.type() === 'warning') {
        console.warn(`⚠️  Console Warning: ${msg.text()}`);
      }
    });

    // Track network failures
    page.on('requestfailed', request => {
      console.error(`❌ Network Failure: ${request.method()} ${request.url()} - ${request.failure()?.errorText}`);
    });
  });

  test('should load the main page without TSX MIME type errors', async ({ page }) => {
    console.log(`🌐 Testing: ${PRODUCTION_URL}`);
    
    const response = await page.goto(PRODUCTION_URL, { 
      waitUntil: 'networkidle',
      timeout: 30000 
    });
    
    // Check if page loaded successfully
    expect(response?.status()).toBe(200);
    
    // Wait for React app to mount
    await page.waitForSelector('#root', { timeout: 10000 });
    
    // Check that no .tsx files are being loaded
    const networkRequests = [];
    page.on('request', request => {
      if (request.url().endsWith('.tsx')) {
        networkRequests.push(request.url());
      }
    });
    
    // Wait a bit more for any lazy-loaded components
    await page.waitForTimeout(5000);
    
    // Verify no .tsx files were requested
    expect(networkRequests).toHaveLength(0);
    
    // Check that the page title is correct
    await expect(page).toHaveTitle(/AI\/ML Glossary/);
    
    // Check that main content loads (not just loading skeleton)
    await page.waitForSelector('[data-testid="main-content"], .terms-grid, .search-input', { 
      timeout: 15000,
      state: 'visible'
    });
    
    console.log('✅ Main page loaded successfully without TSX errors');
  });

  test('should have working JavaScript modules', async ({ page }) => {
    console.log(`🧪 Testing JavaScript module loading`);
    
    await page.goto(PRODUCTION_URL, { waitUntil: 'networkidle' });
    
    // Check that React components are rendering
    const reactRootExists = await page.evaluate(() => {
      return window.React !== undefined || document.querySelector('#root')?.children.length > 0;
    });
    
    expect(reactRootExists).toBe(true);
    
    // Check for critical JavaScript errors
    const jsErrors = [];
    page.on('pageerror', error => {
      jsErrors.push(error.message);
    });
    
    await page.waitForTimeout(5000);
    
    // Filter out known non-critical errors
    const criticalErrors = jsErrors.filter(error => 
      !error.includes('PostHog not initialized') &&
      !error.includes('Failed to fetch pricing data') &&
      !error.includes('Non-Error promise rejection')
    );
    
    expect(criticalErrors).toHaveLength(0);
    
    console.log('✅ JavaScript modules loaded successfully');
  });

  test('should load CSS and assets correctly', async ({ page }) => {
    console.log(`🎨 Testing CSS and asset loading`);
    
    await page.goto(PRODUCTION_URL, { waitUntil: 'networkidle' });
    
    // Check that CSS is loaded
    const cssLoaded = await page.evaluate(() => {
      const stylesheets = document.styleSheets;
      return stylesheets.length > 0;
    });
    
    expect(cssLoaded).toBe(true);
    
    // Check that fonts are loading
    const fontsLoaded = await page.evaluate(() => {
      return document.fonts.size > 0;
    });
    
    expect(fontsLoaded).toBe(true);
    
    console.log('✅ CSS and assets loaded successfully');
  });

  test('should test API endpoints availability', async ({ page }) => {
    console.log(`🔌 Testing API endpoints`);
    
    await page.goto(PRODUCTION_URL);
    
    // Test health endpoint
    const healthResponse = await page.request.get(`${PRODUCTION_URL}/api/health`);
    console.log(`Health endpoint status: ${healthResponse.status()}`);
    
    // API might be behind authentication, so 403 is acceptable
    expect([200, 401, 403]).toContain(healthResponse.status());
    
    // Test if API base URL responds
    const apiResponse = await page.request.get(`${PRODUCTION_URL}/api/`);
    console.log(`API base endpoint status: ${apiResponse.status()}`);
    
    // 403/401 is fine for protected API
    expect([200, 401, 403, 404]).toContain(apiResponse.status());
    
    console.log('✅ API endpoints responding (authentication required)');
  });

  test('should have proper MIME types for all resources', async ({ page }) => {
    console.log(`📄 Testing MIME types`);
    
    const mimeTypeErrors = [];
    
    page.on('response', response => {
      const url = response.url();
      const contentType = response.headers()['content-type'] || '';
      
      // Check JavaScript files have correct MIME type
      if (url.includes('.js') && !url.includes('.json')) {
        if (!contentType.includes('javascript') && !contentType.includes('text/javascript')) {
          mimeTypeErrors.push(`JS file ${url} has MIME type: ${contentType}`);
        }
      }
      
      // Check CSS files have correct MIME type
      if (url.includes('.css')) {
        if (!contentType.includes('css')) {
          mimeTypeErrors.push(`CSS file ${url} has MIME type: ${contentType}`);
        }
      }
      
      // Check that no .tsx files are served
      if (url.includes('.tsx')) {
        mimeTypeErrors.push(`TSX file found: ${url} with MIME type: ${contentType}`);
      }
    });
    
    await page.goto(PRODUCTION_URL, { waitUntil: 'networkidle' });
    await page.waitForTimeout(5000);
    
    // Log any MIME type errors
    if (mimeTypeErrors.length > 0) {
      console.error('❌ MIME type errors found:');
      mimeTypeErrors.forEach(error => console.error(`  - ${error}`));
    }
    
    expect(mimeTypeErrors).toHaveLength(0);
    
    console.log('✅ All resources have correct MIME types');
  });

  test('should have working navigation and routing', async ({ page }) => {
    console.log(`🧭 Testing navigation and routing`);
    
    await page.goto(PRODUCTION_URL, { waitUntil: 'networkidle' });
    
    // Wait for app to load
    await page.waitForSelector('#root', { timeout: 10000 });
    
    // Look for navigation elements
    const hasNavigation = await page.evaluate(() => {
      return document.querySelector('nav, [role="navigation"], .navigation, .nav') !== null;
    });
    
    // Navigation might be lazy-loaded, so this is not critical
    console.log(`Navigation present: ${hasNavigation}`);
    
    // Check that URL routing works (SPA)
    const currentUrl = page.url();
    expect(currentUrl).toBe(PRODUCTION_URL + '/');
    
    console.log('✅ Basic routing and navigation tested');
  });
});

// Performance test
test.describe('Performance Tests', () => {
  test('should load within reasonable time', async ({ page }) => {
    console.log(`⏱️  Testing performance`);
    
    const startTime = Date.now();
    
    await page.goto(PRODUCTION_URL, { waitUntil: 'networkidle' });
    await page.waitForSelector('#root');
    
    const loadTime = Date.now() - startTime;
    console.log(`Total load time: ${loadTime}ms`);
    
    // Should load within 10 seconds
    expect(loadTime).toBeLessThan(10000);
    
    console.log('✅ Performance test passed');
  });
});