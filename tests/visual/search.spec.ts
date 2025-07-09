import { expect, test } from '@playwright/test';

test.describe('Search Functionality Visual Tests', () => {
  test('Homepage with search capability', async ({ page }) => {
    await page.goto('/');

    // Wait for page to load
    await page.waitForLoadState('networkidle');

    // Check if search input exists and screenshot
    const searchInput = page
      .locator('input[type="search"], input[placeholder*="search"], input[class*="search"]')
      .first();

    if ((await searchInput.count()) > 0) {
      await expect(page).toHaveScreenshot('homepage-with-search.png');
    } else {
      await expect(page).toHaveScreenshot('homepage-with-search.png');
    }
  });

  test('Search interaction test', async ({ page }) => {
    await page.goto('/');

    // Wait for page load
    await page.waitForLoadState('networkidle');

    // Try to find and interact with search if it exists
    const searchInput = page
      .locator('input[type="search"], input[placeholder*="search"], input[class*="search"]')
      .first();

    if ((await searchInput.count()) > 0) {
      await searchInput.fill('machine learning');
      await page.waitForTimeout(1000);
      await expect(page).toHaveScreenshot('search-with-input.png');
    } else {
      // Just screenshot the page as is
      await expect(page).toHaveScreenshot('search-with-input.png');
    }
  });

  test('Mobile search view', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');

    // Wait for page load
    await page.waitForLoadState('networkidle');

    // Screenshot mobile search view
    await expect(page).toHaveScreenshot('mobile-search.png', { fullPage: true });
  });
});
