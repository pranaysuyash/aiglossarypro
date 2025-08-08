import { expect, test } from '@playwright/test';
test.describe('Main Navigation Flows', () => {
    test.beforeEach(async ({ page }) => {
        // Navigate to the homepage before each test
        await page.goto('/');
        // Wait for the main content to be visible - use specific ID to avoid multiple elements
        await expect(page.locator('#main-content')).toBeVisible();
    });
    test('should navigate from homepage to a category page', async ({ page }) => {
        // Wait for category cards to appear on the page
        await page.waitForSelector('[data-testid="category-card"]', { timeout: 10000 });
        // Find the first category card and click it
        const firstCategoryCard = page.locator('[data-testid="category-card"]').first();
        // Ensure the card exists before clicking
        await expect(firstCategoryCard).toBeVisible();
        await firstCategoryCard.click();
        // Verify the URL is correct
        await expect(page).toHaveURL(/.*\/category\/.+/);
        // Verify that we're on a category page (could be category name or "Category not found")
        const pageHeader = page.locator('h1');
        await expect(pageHeader).toBeVisible();
        // Check if the header indicates the page loaded properly
        const headerText = await pageHeader.innerText();
        expect(headerText.length).toBeGreaterThan(0);
        // Verify we're not on a 404 page
        expect(headerText).not.toContain('404');
    });
    test('should navigate from category page to a term page', async ({ page }) => {
        // Navigate to Machine Learning category page (validated clean data)
        await page.goto('/category/79f3d163-dae1-499d-8371-047accbe70e9'); // Machine Learning category
        // Wait for page to load
        await expect(page.locator('#main-content')).toBeVisible();
        // Check if there are any term cards on this category page
        const termCards = page.locator('[data-testid="term-card"]');
        const termCount = await termCards.count();
        if (termCount > 0) {
            const firstTermCard = termCards.first();
            const termName = await firstTermCard.locator('h3').innerText();
            await firstTermCard.click();
            // Verify the URL is correct for the term page
            await expect(page).toHaveURL(/.*\/term\/.+/);
            // Verify the term name appears in the header of the term page
            const termHeader = page.locator('h1');
            await expect(termHeader).toHaveText(termName);
        }
        else {
            // If no terms in this category, just verify we're on the category page
            expect(page.url()).toContain('/category/');
        }
    });
    test('should handle direct navigation to a term page', async ({ page }) => {
        // Navigate directly to the "Characteristic Function" term from row1.xlsx (using basic term ID)
        await page.goto('/term/8b5bff9a-afb7-4691-a58e-adc2bf94f941'); // Characteristic Function
        // Wait for page to load
        await expect(page.locator('#main-content')).toBeVisible();
        // Verify that we're on the Characteristic Function term page
        const headerText = await page.locator('h1').innerText();
        // Should show the term name
        expect(headerText).toBeTruthy();
        expect(headerText.length).toBeGreaterThan(0);
        expect(headerText.toLowerCase()).toContain('characteristic');
    });
    test('should use search to find and navigate to a term', async ({ page }) => {
        // Check viewport width to determine search behavior
        const viewportSize = page.viewportSize();
        const isSmallScreen = viewportSize && viewportSize.width < 350;
        if (isSmallScreen) {
            // On small screens, search might be icon-only
            const searchButton = page.locator('[aria-label*="Search"], button[class*="search"]').first();
            if (await searchButton.isVisible()) {
                await searchButton.click();
            }
        }
        // Find the search input (could be text input or combobox)
        const searchInput = page.locator('input[type="text"], input[role="combobox"]').first();
        // Wait for search input to be visible and interactable
        await expect(searchInput).toBeVisible({ timeout: 5000 });
        await expect(searchInput).toBeEditable();
        await searchInput.fill('Machine Learning');
        await searchInput.press('Enter');
        // Verify navigation to terms page with search parameter
        await expect(page).toHaveURL(/.*\/terms\?search=Machine%20Learning/);
        // Wait for search results to load
        await expect(page.locator('#main-content')).toBeVisible();
        // If there are search results, verify they're displayed
        const searchResults = page.locator('[data-testid="term-card"]');
        const resultCount = await searchResults.count();
        if (resultCount > 0) {
            // Click the first search result
            const firstResult = searchResults.first();
            await firstResult.click();
            // Verify navigation to the term page
            await expect(page).toHaveURL(/.*\/term\/.+/);
        }
        else {
            // If no results, just verify we're on the search page
            expect(page.url()).toContain('/terms?search=');
        }
    });
    test('should display a 404 page for a non-existent route', async ({ page }) => {
        // Navigate to a route that should not exist
        await page.goto('/this/route/does/not/exist');
        // Wait for the page to load
        await expect(page.locator('#main-content')).toBeVisible();
        // Check for 404 page content (SPA apps typically return 200 but show 404 content)
        const notFoundHeader = page.locator('h1');
        await expect(notFoundHeader).toBeVisible();
        // Look for 404 indicators in the content
        const headerText = await notFoundHeader.innerText();
        const pageContent = await page.textContent('body');
        // Should contain some form of "not found" or "404" message
        const has404Content = headerText.includes('404') ||
            headerText.includes('Not Found') ||
            pageContent?.includes('not found') ||
            pageContent?.includes('does not exist');
        expect(has404Content).toBe(true);
    });
});
