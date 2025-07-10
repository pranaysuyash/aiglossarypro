
import { test, expect } from '@playwright/test';
import { execSync } from 'child_process';
import path from 'path';
import fs from 'fs';

// Define the Storybook URL
const STORYBOOK_URL = 'http://localhost:6006';

// Define the directory for storing screenshots
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const screenshotsDir = path.resolve(__dirname, '../visual-audits-storybook');

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
    } catch (error) {
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

    // Wait for Storybook to load and the sidebar to be visible
    await page.waitForSelector('#storybook-explorer-tree', { state: 'visible' });

    // Get all story links from the sidebar
    const storyLinks = await page.$$eval('#storybook-explorer-tree a[id^="components-"]', (links) => {
      return links.map(link => ({
        id: link.id,
        name: link.textContent?.trim() || '',
        href: link.getAttribute('href') || '',
      }));
    });

    console.log(`Found ${storyLinks.length} Storybook stories.`);

    for (const story of storyLinks) {
      if (!story.href) continue;

      const storyUrl = `${STORYBOOK_URL}/iframe.html?id=${story.id}&viewMode=story`;
      const screenshotPath = path.join(screenshotsDir, `${story.id}.png`);

      await test.step(`Testing story: ${story.name} (${story.id})`, async () => {
        try {
          await page.goto(storyUrl, { waitUntil: 'networkidle' });
          await page.waitForTimeout(500); // Give some time for rendering

          // Use Playwright's built-in visual comparison
          // This will create a baseline image if it doesn't exist,
          // or compare against it and create a diff image if there are changes.
          await expect(page).toHaveScreenshot(`${story.id}.png`, {
            fullPage: true,
            maxDiffPixelRatio: 0.01, // Allow for minor pixel differences
            threshold: 0.1, // Allow for minor color differences
          });
          console.log(`  ✅ Passed: ${story.name}`);
        } catch (error) {
          console.error(`  ❌ Failed: ${story.name} - ${error.message}`);
          // Optionally, take a screenshot on failure for debugging
          await page.screenshot({ path: path.join(screenshotsDir, `${story.id}-FAIL.png`) });
          throw error; // Re-throw to mark the test as failed
        }
      });
    }
  });
});
