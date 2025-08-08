import { expect, test } from '@playwright/test';
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
// Define the Storybook URL
const STORYBOOK_URL = 'http://localhost:6007';
// Define the directory for storing screenshots
const screenshotsDir = path.resolve(process.cwd(), 'tests/visual-audits-storybook');
// Ensure the screenshots directory exists
if (!fs.existsSync(screenshotsDir)) {
    fs.mkdirSync(screenshotsDir, { recursive: true });
}
test.describe('Storybook Visual Regression', () => {
    test.beforeAll(async () => {
        // Check if Storybook is running, if not, log a warning.
        try {
            execSync(`curl --head --silent --fail ${STORYBOOK_URL}`, { stdio: 'ignore' });
            console.log(`Storybook is running at ${STORYBOOK_URL}`);
        }
        catch (error) {
            console.warn(`
        WARNING: Storybook is not running at ${STORYBOOK_URL}.
        Please start Storybook with 'npm run storybook' in the AIGlossaryPro directory.
        Skipping Storybook visual tests.
      `);
            test.skip(); // Skip all tests in this describe block
        }
    });
    test('should visually test all Storybook stories', async ({ page }) => {
        await page.goto(STORYBOOK_URL);
        // Wait for Storybook to fully load
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(3000);
        let storyLinks = [];
        // Method 1: Try to find sidebar with multiple possible selectors
        const sidebarSelectors = [
            '[data-testid="sidebar-panel"]',
            '.sidebar-container',
            '#storybook-explorer-tree',
            '.sb-bar',
            '.sidebar',
        ];
        let sidebarFound = false;
        for (const selector of sidebarSelectors) {
            try {
                await page.waitForSelector(selector, { state: 'visible', timeout: 5000 });
                console.log(`Found sidebar with selector: ${selector}`);
                sidebarFound = true;
                break;
            }
            catch (error) {
                console.log(`Selector ${selector} failed`);
            }
        }
        if (!sidebarFound) {
            console.log('No sidebar found, trying to extract stories directly from page');
        }
        // Method 2: Try different ways to get story links
        const extractMethods = [
            () => page.$$eval('a[data-item-id]', links => links
                .map(link => ({
                id: link.getAttribute('data-item-id') || '',
                name: link.textContent?.trim() || '',
                href: link.getAttribute('href') || '',
            }))
                .filter(story => story.id && story.id.includes('--'))),
            () => page.$$eval('[data-nodetype="story"] a, .sidebar-item a', links => links
                .map(link => ({
                id: link.getAttribute('data-item-id') || link.id || '',
                name: link.textContent?.trim() || '',
                href: link.getAttribute('href') || '',
            }))
                .filter(story => story.id || story.href)),
            () => page.$$eval('a[href*="path="]', links => links
                .map(link => ({
                id: link.getAttribute('href')?.split('path=')[1]?.split('&')[0] || '',
                name: link.textContent?.trim() || '',
                href: link.getAttribute('href') || '',
            }))
                .filter(story => story.id)),
        ];
        for (const method of extractMethods) {
            try {
                storyLinks = await method();
                if (storyLinks.length > 0) {
                    console.log(`Found ${storyLinks.length} stories using method ${extractMethods.indexOf(method) + 1}`);
                    break;
                }
            }
            catch (error) {
                console.log(`Method ${extractMethods.indexOf(method) + 1} failed:`, error.message);
            }
        }
        // Method 3: If no stories found, create a basic test using your existing story files
        if (storyLinks.length === 0) {
            console.log('No stories found via selectors, using file-based approach');
            const storyFiles = [
                'button--primary',
                'header--logged-in',
                'header--logged-out',
                'page--logged-in',
            ];
            storyLinks = storyFiles.map(id => ({
                id,
                name: id.replace('--', ' - '),
                href: `/?path=/story/${id}`,
            }));
        }
        console.log(`Found ${storyLinks.length} Storybook stories.`);
        for (const story of storyLinks) {
            if (!story.id && !story.href) {
                continue;
            }
            // Generate story URL based on available data
            let storyUrl;
            if (story.id && story.id.includes('--')) {
                storyUrl = `${STORYBOOK_URL}/iframe.html?id=${story.id}&viewMode=story`;
            }
            else if (story.href) {
                storyUrl = story.href.startsWith('http') ? story.href : `${STORYBOOK_URL}${story.href}`;
            }
            else {
                continue;
            }
            const storyId = story.id || story.href.replace(/[^a-zA-Z0-9]/g, '-');
            const screenshotPath = path.join(screenshotsDir, `${storyId}.png`);
            await test.step(`Testing story: ${story.name} (${storyId})`, async () => {
                try {
                    await page.goto(storyUrl, { waitUntil: 'networkidle' });
                    await page.waitForTimeout(500); // Give some time for rendering
                    // Use Playwright's built-in visual comparison
                    // This will create a baseline image if it doesn't exist,
                    // or compare against it and create a diff image if there are changes.
                    await expect(page).toHaveScreenshot(`${storyId}.png`, {
                        fullPage: true,
                        maxDiffPixelRatio: 0.01, // Allow for minor pixel differences
                        threshold: 0.1, // Allow for minor color differences
                    });
                    console.log(`  ✅ Passed: ${story.name}`);
                }
                catch (error) {
                    console.error(`  ❌ Failed: ${story.name} - ${error.message}`);
                    // Optionally, take a screenshot on failure for debugging
                    await page.screenshot({ path: path.join(screenshotsDir, `${storyId}-FAIL.png`) });
                    throw error; // Re-throw to mark the test as failed
                }
            });
        }
    });
});
