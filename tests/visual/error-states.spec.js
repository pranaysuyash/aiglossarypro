import { expect, test } from '@playwright/test';
test.describe('Error States Visual Tests', () => {
    test('404 Page visual', async ({ page }) => {
        // Go to a non-existent page
        await page.goto('/non-existent-page');
        await page.waitForLoadState('networkidle');
        await expect(page).toHaveScreenshot('404-page.png', { fullPage: true });
    });
    test('Error boundary visual', async ({ page }) => {
        await page.goto('/');
        await page.waitForLoadState('networkidle');
        // Look for error boundary components
        const errorBoundary = page
            .locator('[class*="error-boundary"], [data-testid*="error"], .error')
            .first();
        if ((await errorBoundary.count()) > 0) {
            await expect(errorBoundary).toHaveScreenshot('error-boundary.png');
        }
        else {
            // If no error boundary visible, screenshot the page normally
            await expect(page).toHaveScreenshot('error-boundary.png');
        }
    });
    test('Loading states visual', async ({ page }) => {
        await page.goto('/');
        // Try to capture loading state by going to page quickly
        // Look for loading indicators
        const loadingIndicator = page
            .locator('[class*="loading"], [class*="spinner"], [data-testid*="loading"]')
            .first();
        if ((await loadingIndicator.count()) > 0) {
            await expect(loadingIndicator).toHaveScreenshot('loading-state.png');
        }
        else {
            await page.waitForLoadState('networkidle');
            await expect(page).toHaveScreenshot('loading-state.png');
        }
    });
    test('Empty states visual', async ({ page }) => {
        await page.goto('/');
        await page.waitForLoadState('networkidle');
        // Look for empty state components
        const emptyState = page
            .locator('[class*="empty"], [class*="no-results"], [data-testid*="empty"]')
            .first();
        if ((await emptyState.count()) > 0) {
            await expect(emptyState).toHaveScreenshot('empty-state.png');
        }
        else {
            await expect(page).toHaveScreenshot('empty-state.png');
        }
    });
    test('Network error simulation', async ({ page }) => {
        // Simulate offline/network error
        await page.context().setOffline(true);
        await page.goto('/');
        // Wait for any error states to appear
        await page.waitForTimeout(2000);
        await expect(page).toHaveScreenshot('network-error.png', { fullPage: true });
        // Reset network state
        await page.context().setOffline(false);
    });
});
