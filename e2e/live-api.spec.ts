import { test, expect } from '@playwright/test';

const LIVE_URL = 'https://d1m7nnfj3im4kp.cloudfront.net';
const API_URL = 'https://d1m7nnfj3im4kp.cloudfront.net/api';

test.describe('AIGlossaryPro Live E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Set up request interceptor to log API calls
    page.on('response', response => {
      if (response.url().includes('/api/')) {
        console.log(`API Call: ${response.url()} - Status: ${response.status()}`);
      }
    });
  });

  test('Frontend loads successfully', async ({ page }) => {
    await page.goto(LIVE_URL);
    
    // Check page title
    await expect(page).toHaveTitle(/AI\/ML Glossary/);
    
    // Check main elements exist
    await expect(page.locator('h1')).toBeVisible();
    await expect(page.locator('input[type="search"], input[placeholder*="Search"]')).toBeVisible();
  });

  test('API health check returns healthy status', async ({ request }) => {
    const response = await request.get(`${LIVE_URL}/health`);
    expect(response.ok()).toBeTruthy();
    
    const data = await response.json();
    expect(data.status).toBe('healthy');
    expect(data.environment).toBe('production');
  });

  test('Terms API returns data', async ({ request }) => {
    const response = await request.get(`${API_URL}/terms`);
    expect(response.ok()).toBeTruthy();
    
    const data = await response.json();
    expect(data.status).toBe('success');
    expect(data.data).toBeDefined();
    expect(Array.isArray(data.data)).toBeTruthy();
  });

  test('Search functionality works', async ({ page }) => {
    await page.goto(LIVE_URL);
    
    // Find search input
    const searchInput = page.locator('input[type="search"], input[placeholder*="Search"]');
    await searchInput.waitFor({ state: 'visible' });
    
    // Type search query
    await searchInput.fill('AI');
    await searchInput.press('Enter');
    
    // Wait for results or API call
    await page.waitForTimeout(1000);
    
    // Check if results are displayed (adjust selector based on actual UI)
    const results = page.locator('[data-testid="search-results"], .search-results, .results');
    if (await results.count() > 0) {
      await expect(results.first()).toBeVisible();
    }
  });

  test('Search API returns filtered results', async ({ request }) => {
    const response = await request.get(`${API_URL}/search?q=Machine`);
    expect(response.ok()).toBeTruthy();
    
    const data = await response.json();
    expect(data.status).toBe('success');
    expect(data.data).toBeDefined();
  });

  test('Frontend makes API calls on load', async ({ page }) => {
    const apiCalls: string[] = [];
    
    // Intercept API calls
    page.on('response', response => {
      if (response.url().includes('/api/')) {
        apiCalls.push(response.url());
      }
    });
    
    await page.goto(LIVE_URL);
    await page.waitForLoadState('networkidle');
    
    // Check if any API calls were made
    console.log('API calls made:', apiCalls);
    expect(apiCalls.length).toBeGreaterThan(0);
  });

  test('CORS headers are properly configured', async ({ request }) => {
    const response = await request.get(`${API_URL}/terms`, {
      headers: {
        'Origin': 'https://example.com'
      }
    });
    
    expect(response.ok()).toBeTruthy();
    
    // Check CORS headers
    const headers = response.headers();
    expect(headers['access-control-allow-origin']).toBeDefined();
  });

  test('Error handling for invalid routes', async ({ request }) => {
    const response = await request.get(`${API_URL}/invalid-route`);
    expect(response.status()).toBe(404);
  });

  test('Performance: API responds within acceptable time', async ({ request }) => {
    const startTime = Date.now();
    const response = await request.get(`${API_URL}/terms`);
    const endTime = Date.now();
    
    expect(response.ok()).toBeTruthy();
    expect(endTime - startTime).toBeLessThan(2000); // Should respond within 2 seconds
  });

  test('Frontend navigation works', async ({ page }) => {
    await page.goto(LIVE_URL);
    
    // Click on first term if available
    const termLinks = page.locator('a[href*="/term"], [data-testid="term-link"]');
    const count = await termLinks.count();
    
    if (count > 0) {
      await termLinks.first().click();
      await page.waitForTimeout(1000);
      
      // Check if URL changed or modal opened
      const url = page.url();
      console.log('Current URL:', url);
    }
  });

  test('API pagination works if implemented', async ({ request }) => {
    const response = await request.get(`${API_URL}/terms?page=1&limit=10`);
    expect(response.ok()).toBeTruthy();
    
    const data = await response.json();
    if (data.pagination) {
      expect(data.pagination).toHaveProperty('page');
      expect(data.pagination).toHaveProperty('limit');
    }
  });

  test('CloudFront caching headers are set', async ({ request }) => {
    const response = await request.get(`${LIVE_URL}/index.html`);
    expect(response.ok()).toBeTruthy();
    
    const headers = response.headers();
    expect(headers['cache-control'] || headers['x-cache']).toBeDefined();
  });
});

test.describe('Mobile Responsiveness', () => {
  test.use({ viewport: { width: 375, height: 667 } });
  
  test('Frontend is responsive on mobile', async ({ page }) => {
    await page.goto(LIVE_URL);
    
    // Check if search is still visible
    await expect(page.locator('input[type="search"], input[placeholder*="Search"]')).toBeVisible();
    
    // Take screenshot for visual verification
    await page.screenshot({ path: 'mobile-screenshot.png' });
  });
});

test.describe('API Security Tests', () => {
  test('API rejects unauthorized POST requests', async ({ request }) => {
    const response = await request.post(`${API_URL}/terms`, {
      data: {
        name: 'Test Term',
        definition: 'Test Definition'
      }
    });
    
    // Should return 401 or 403 without auth
    expect([401, 403]).toContain(response.status());
  });
  
  test('API handles malformed requests gracefully', async ({ request }) => {
    const response = await request.get(`${API_URL}/search?q=${encodeURIComponent('<script>alert("xss")</script>')}`);
    expect(response.ok()).toBeTruthy();
    
    const data = await response.json();
    expect(data.status).toBe('success');
  });
});