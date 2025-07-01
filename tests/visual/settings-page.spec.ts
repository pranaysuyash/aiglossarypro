import { test, expect } from '@playwright/test';

test.describe('Settings Page Visual Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Go to settings page (may need authentication context)
    await page.goto('/settings');
    await page.waitForLoadState('networkidle');
  });

  test('Settings page layout', async ({ page }) => {
    // Take full page screenshot of settings
    await expect(page).toHaveScreenshot('settings-full.png', { fullPage: true });
  });

  test('User personalization settings', async ({ page }) => {
    // Look for personalization section
    const personalizationSection = page.locator('[class*="personalization"], [data-testid*="personalization"]').first();
    
    if (await personalizationSection.count() > 0) {
      await expect(personalizationSection).toHaveScreenshot('personalization-settings.png');
    } else {
      // Fallback to main content
      await expect(page.locator('main, #root').first()).toHaveScreenshot('personalization-settings.png');
    }
  });

  test('Settings mobile view', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    
    await expect(page).toHaveScreenshot('settings-mobile.png', { fullPage: true });
  });

  test('Settings form elements', async ({ page }) => {
    // Focus on form elements in settings
    const formElements = page.locator('form, .form, [class*="form"]').first();
    
    if (await formElements.count() > 0) {
      await expect(formElements).toHaveScreenshot('settings-form-elements.png');
    } else {
      await expect(page).toHaveScreenshot('settings-form-elements.png');
    }
  });
});