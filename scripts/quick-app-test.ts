#!/usr/bin/env tsx

/**
 * Quick App Test - Simple verification that the app is working
 */

import fs from 'node:fs/promises';
import path from 'node:path';
import chalk from 'chalk';
import { type Browser, chromium } from 'playwright';

class QuickAppTest {
  private browser: Browser | null = null;
  private baseUrl = 'http://localhost:5173';
  private screenshotDir: string;

  constructor() {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    this.screenshotDir = path.join(process.cwd(), 'quick-test', timestamp);
  }

  async initialize() {
    await fs.mkdir(this.screenshotDir, { recursive: true });
    console.log(chalk.blue('🧪 Starting Quick App Test...'));
  }

  async startBrowser() {
    this.browser = await chromium.launch({
      headless: false,
      devtools: true,
    });
  }

  async testHomepage() {
    if (!this.browser) throw new Error('Browser not initialized');

    const page = await this.browser.newPage();

    console.log(chalk.cyan('🏠 Testing homepage...'));

    // Navigate with longer timeout and less strict wait condition
    await page.goto(this.baseUrl, {
      waitUntil: 'domcontentloaded',
      timeout: 60000,
    });

    // Wait for any React content to load
    await page.waitForTimeout(3000);

    // Take screenshot
    await page.screenshot({
      path: path.join(this.screenshotDir, 'homepage.png'),
      fullPage: true,
    });

    // Check for basic elements
    const title = await page.title();
    console.log(chalk.green(`✅ Page title: ${title}`));

    // Check if page contains React content (not just loading)
    const bodyText = await page.textContent('body');
    const hasContent = bodyText && bodyText.length > 100 && !bodyText.includes('Loading...');

    if (hasContent) {
      console.log(chalk.green('✅ Page has content (not stuck loading)'));
    } else {
      console.log(chalk.yellow('⚠️ Page appears to be loading or has minimal content'));
    }

    // Check for console errors
    const logs: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        logs.push(msg.text());
      }
    });

    await page.waitForTimeout(2000);

    if (logs.length > 0) {
      console.log(chalk.yellow(`⚠️ Console errors: ${logs.length}`));
      logs.forEach(log => console.log(chalk.gray(`  - ${log}`)));
    } else {
      console.log(chalk.green('✅ No console errors'));
    }

    await page.close();
    return { title, hasContent, errors: logs };
  }

  async testNavigation() {
    if (!this.browser) throw new Error('Browser not initialized');

    const page = await this.browser.newPage();

    console.log(chalk.cyan('🧭 Testing navigation...'));

    const testPages = ['/terms', '/categories'];

    for (const testPage of testPages) {
      try {
        console.log(chalk.gray(`  📍 Testing ${testPage}...`));
        await page.goto(`${this.baseUrl}${testPage}`, {
          waitUntil: 'domcontentloaded',
          timeout: 30000,
        });

        await page.waitForTimeout(2000);

        const title = await page.title();
        console.log(chalk.green(`  ✅ ${testPage}: ${title}`));

        await page.screenshot({
          path: path.join(this.screenshotDir, `page-${testPage.replace('/', '')}.png`),
        });
      } catch (error) {
        console.log(chalk.red(`  ❌ ${testPage}: ${error}`));
      }
    }

    await page.close();
  }

  async cleanup() {
    if (this.browser) {
      await this.browser.close();
    }
  }

  async run() {
    try {
      await this.initialize();
      await this.startBrowser();

      const homepageResult = await this.testHomepage();
      await this.testNavigation();

      console.log(chalk.blue('\n📊 Test Summary:'));
      console.log(chalk.gray(`Screenshots saved to: ${this.screenshotDir}`));

      if (homepageResult.hasContent && homepageResult.errors.length === 0) {
        console.log(chalk.green('🎉 App appears to be working correctly!'));
      } else {
        console.log(chalk.yellow('⚠️ App has some issues that need attention'));
      }
    } catch (error) {
      console.error(chalk.red('❌ Test failed:'), error);
    } finally {
      await this.cleanup();
    }
  }
}

const test = new QuickAppTest();
test.run().catch(console.error);
