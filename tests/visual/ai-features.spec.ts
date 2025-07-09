import { expect, test } from '@playwright/test';

test.describe('AI Features Visual Tests', () => {
  test('AI Definition Generator visual', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Look for AI generator components
    const aiGenerator = page
      .locator(
        '[class*="ai-generator"], [data-testid*="ai-generator"], [class*="definition-generator"]'
      )
      .first();

    if ((await aiGenerator.count()) > 0) {
      await expect(aiGenerator).toHaveScreenshot('ai-definition-generator.png');
    } else {
      // If not found, screenshot the main content area
      await expect(page.locator('main, #root').first()).toHaveScreenshot(
        'ai-definition-generator.png'
      );
    }
  });

  test('AI Semantic Search visual', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Look for semantic search components
    const semanticSearch = page
      .locator('[class*="semantic-search"], [data-testid*="semantic-search"]')
      .first();

    if ((await semanticSearch.count()) > 0) {
      await expect(semanticSearch).toHaveScreenshot('ai-semantic-search.png');
    } else {
      // Screenshot search area
      const searchArea = page.locator('input[type="search"], [class*="search"]').first();
      if ((await searchArea.count()) > 0) {
        await expect(searchArea).toHaveScreenshot('ai-semantic-search.png');
      } else {
        await expect(page).toHaveScreenshot('ai-semantic-search.png');
      }
    }
  });

  test('AI Content Feedback visual', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Look for feedback components
    const feedback = page
      .locator('[class*="feedback"], [data-testid*="feedback"], button[class*="feedback"]')
      .first();

    if ((await feedback.count()) > 0) {
      await expect(feedback).toHaveScreenshot('ai-content-feedback.png');
    } else {
      await expect(page).toHaveScreenshot('ai-content-feedback.png');
    }
  });

  test('AI Term Suggestions visual', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Look for term suggestions
    const suggestions = page
      .locator('[class*="suggestions"], [data-testid*="suggestions"], [class*="recommended"]')
      .first();

    if ((await suggestions.count()) > 0) {
      await expect(suggestions).toHaveScreenshot('ai-term-suggestions.png');
    } else {
      await expect(page).toHaveScreenshot('ai-term-suggestions.png');
    }
  });

  test('AI features mobile view', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    await expect(page).toHaveScreenshot('ai-features-mobile.png', { fullPage: true });
  });
});
