import { test, expect } from '@playwright/test';

test.describe('Main Navigation Flows', () => {

  test.beforeEach(async ({ page }) => {
    // Navigate to the homepage before each test
    await page.goto('/');
    // Wait for the main content to be visible
    await expect(page.locator('main')).toBeVisible();
  });

  test('should navigate from homepage to a category page', async ({ page }) => {
    // Find the first category card and click it
    const firstCategoryCard = page.locator('[data-testid="category-card"]').first();
    const categoryName = await firstCategoryCard.locator('h3').innerText();
    
    await firstCategoryCard.click();

    // Verify the URL is correct
    await expect(page).toHaveURL(/.*\/category\/.+/);

    // Verify the category name appears in the header of the new page
    const pageHeader = page.locator('h1');
    await expect(pageHeader).toHaveText(categoryName);
  });

  test('should navigate from category page to a term page', async ({ page }) => {
    // First, navigate to a category page
    await page.goto('/category/machine-learning-basics');
    await expect(page.locator('h1')).toHaveText('Machine Learning Basics');

    // Find the first term card and click it
    const firstTermCard = page.locator('[data-testid="term-card"]').first();
    const termName = await firstTermCard.locator('h3').innerText();
    
    await firstTermCard.click();

    // Verify the URL is correct for the term page
    await expect(page).toHaveURL(/.*\/term\/.+/);
    
    // Verify the term name appears in the header of the term page
    const termHeader = page.locator('h1');
    await expect(termHeader).toHaveText(termName);
  });

  test('should handle direct navigation to a term page', async ({ page }) => {
    // Navigate directly to a known term page
    await page.goto('/term/machine-learning');
    
    // Verify the term name is correct in the header
    const termHeader = page.locator('h1');
    await expect(termHeader).toHaveText('Machine Learning');
    
    // Verify the definition is visible
    await expect(page.locator('text=A subset of artificial intelligence')).toBeVisible();
  });

  test('should use search to find and navigate to a term', async ({ page }) => {
    // Find the search input, fill it, and press Enter
    const searchInput = page.locator('input[type="search"]');
    await searchInput.fill('Neural Network');
    await searchInput.press('Enter');

    // Verify the search results page is loaded
    await expect(page).toHaveURL(/.*\/search\?q=Neural%20Network/);
    await expect(page.locator('h1')).toContainText('Search Results for');

    // Click the first search result link
    const firstResultLink = page.locator('a[href*="/term/"]').first();
    const termName = await firstResultLink.innerText();
    expect(termName).toContain('Neural Network');
    
    await firstResultLink.click();
    
    // Verify navigation to the correct term page
    await expect(page).toHaveURL(/.*\/term\/.+/);
    const termHeader = page.locator('h1');
    await expect(termHeader).toHaveText(termName);
  });

  test('should display a 404 page for a non-existent route', async ({ page }) => {
    // Navigate to a route that should not exist
    const response = await page.goto('/this/route/does/not/exist');
    
    // Check if the server responded with a 404 status
    expect(response?.status()).toBe(404);
    
    // Check for 404 page content
    const notFoundHeader = page.locator('h1');
    await expect(notFoundHeader).toHaveText('404 - Page Not Found');
    await expect(page.locator('text=Sorry, the page you are looking for does not exist.')).toBeVisible();
  });

}); 