import { expect, test } from '@playwright/test';

test.describe('AI Glossary Homepage Visual Tests', () => {
  test('Homepage loads and displays correctly', async ({ page }) => {
    await page.goto('/');

    // Wait for the page to fully load by waiting for the main content
    await page.waitForLoadState('networkidle');
    await page.waitForSelector('body', { timeout: 10000 });

    // Take full page screenshot
    await expect(page).toHaveScreenshot('homepage-full.png', { fullPage: true });
  });

  test('Header component displays correctly', async ({ page }) => {
    await page.goto('/');

    // Wait for page to load
    await page.waitForLoadState('networkidle');

    // Find the header area (could be header tag or top section)
    const headerSelector = await page.locator('header, .header, [class*="header"]').first();
    if ((await headerSelector.count()) > 0) {
      await expect(headerSelector).toHaveScreenshot('header-component.png');
    } else {
      // Fallback: screenshot top portion of page
      await expect(page.locator('body').first()).toHaveScreenshot('header-component.png');
    }
  });

  test('Main content section displays correctly', async ({ page }) => {
    await page.goto('/');

    // Wait for main content to load
    await page.waitForLoadState('networkidle');
    await page.waitForSelector('main, .main, #root', { timeout: 10000 });

    // Screenshot the main content area
    await expect(page.locator('main, .main, #root').first()).toHaveScreenshot('main-content.png');
  });

  test('Page title and basic structure', async ({ page }) => {
    await page.goto('/');

    // Wait for page load
    await page.waitForLoadState('networkidle');

    // Check that the page has loaded with expected title
    await expect(page).toHaveTitle(/AI.*ML.*Glossary/i);

    // Screenshot the viewport
    await expect(page).toHaveScreenshot('page-structure.png');
  });

  test('Mobile responsive view', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');

    // Wait for page load
    await page.waitForLoadState('networkidle');

    // Screenshot mobile view
    await expect(page).toHaveScreenshot('mobile-view.png', { fullPage: true });
  });

  test('Tablet responsive view', async ({ page }) => {
    // Set tablet viewport
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto('/');

    // Wait for page load
    await page.waitForLoadState('networkidle');

    // Screenshot tablet view
    await expect(page).toHaveScreenshot('tablet-view.png', { fullPage: true });
  });
});
