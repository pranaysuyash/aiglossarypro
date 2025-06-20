import { test, expect } from '@playwright/test';

test.describe('Term Detail Page Visual Tests', () => {
  const testTermId = '35d2a9b8-83d7-4f5f-85e0-c77e107f24fb'; // Machine Learning term

  test('Term detail page loads correctly', async ({ page }) => {
    await page.goto(`/terms/${testTermId}`);
    
    // Wait for page to load completely
    await page.waitForLoadState('networkidle');
    await page.waitForSelector('body', { timeout: 10000 });
    
    // Take full page screenshot
    await expect(page).toHaveScreenshot('term-detail-full.png', { fullPage: true });
  });

  test('Term page shows content', async ({ page }) => {
    await page.goto(`/terms/${testTermId}`);
    
    // Wait for page load
    await page.waitForLoadState('networkidle');
    
    // Check if page has loaded with content
    const hasContent = await page.locator('h1, h2, .title, [class*="title"]').count() > 0;
    
    if (hasContent) {
      // Screenshot the main content
      await expect(page.locator('main, .main, #root').first()).toHaveScreenshot('term-content.png');
    } else {
      // Fallback: screenshot the whole page
      await expect(page).toHaveScreenshot('term-content.png');
    }
  });

  test('Term page responsive mobile view', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 }); // iPhone size
    await page.goto(`/terms/${testTermId}`);
    
    // Wait for content
    await page.waitForLoadState('networkidle');
    
    // Screenshot mobile view
    await expect(page).toHaveScreenshot('term-detail-mobile.png', { fullPage: true });
  });

  test('Term page tablet view', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 }); // iPad size
    await page.goto(`/terms/${testTermId}`);
    
    // Wait for content
    await page.waitForLoadState('networkidle');
    
    // Screenshot tablet view
    await expect(page).toHaveScreenshot('term-detail-tablet.png', { fullPage: true });
  });
}); 