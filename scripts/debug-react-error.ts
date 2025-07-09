#!/usr/bin/env tsx

/**
 * Debug React Error - Capture console errors and network issues
 */

import chalk from 'chalk';
import { type Browser, chromium } from 'playwright';

class ReactErrorDebugger {
  private browser: Browser | null = null;
  private baseUrl = 'http://localhost:5173';

  async startBrowser() {
    this.browser = await chromium.launch({
      headless: false,
      devtools: true,
    });
  }

  async debugErrors() {
    if (!this.browser) throw new Error('Browser not initialized');

    const page = await this.browser.newPage();

    console.log(chalk.blue('🐛 Debugging React errors...'));

    // Capture all console messages
    const logs: Array<{ type: string; message: string }> = [];
    page.on('console', (msg) => {
      logs.push({
        type: msg.type(),
        message: msg.text(),
      });

      if (msg.type() === 'error') {
        console.log(chalk.red(`❌ Console Error: ${msg.text()}`));
      } else if (msg.type() === 'warn') {
        console.log(chalk.yellow(`⚠️ Warning: ${msg.text()}`));
      }
    });

    // Capture page errors
    page.on('pageerror', (error) => {
      console.log(chalk.red(`❌ Page Error: ${error.message}`));
      console.log(chalk.gray(`Stack: ${error.stack}`));
    });

    // Capture network failures
    page.on('requestfailed', (request) => {
      console.log(chalk.red(`❌ Network Failed: ${request.method()} ${request.url()}`));
      console.log(chalk.gray(`Failure: ${request.failure()?.errorText}`));
    });

    // Navigate to homepage
    console.log(chalk.cyan('📍 Navigating to homepage...'));
    await page.goto(this.baseUrl, {
      waitUntil: 'domcontentloaded',
      timeout: 60000,
    });

    // Wait for React to fully load or error
    await page.waitForTimeout(5000);

    // Check for error boundary
    const errorBoundary = await page.locator('text=Something went wrong').count();
    if (errorBoundary > 0) {
      console.log(chalk.red('❌ Error boundary detected!'));

      // Try to get development error details
      const errorDetails = await page.locator('details').count();
      if (errorDetails > 0) {
        console.log(chalk.cyan('🔍 Checking error details...'));
        await page.click('details summary');
        await page.waitForTimeout(1000);

        const errorText = await page.locator('details pre').textContent();
        if (errorText) {
          console.log(chalk.red(`💥 React Error: ${errorText}`));
        }
      }
    }

    // Try clicking "Try Again" if available
    const tryAgainButton = await page.locator('text=Try Again').count();
    if (tryAgainButton > 0) {
      console.log(chalk.cyan('🔄 Attempting retry...'));
      await page.click('text=Try Again');
      await page.waitForTimeout(3000);

      const stillHasError = await page.locator('text=Something went wrong').count();
      if (stillHasError === 0) {
        console.log(chalk.green('✅ Retry successful!'));
      } else {
        console.log(chalk.red('❌ Retry failed, error persists'));
      }
    }

    // Summary
    console.log(chalk.blue('\n📊 Debug Summary:'));
    console.log(chalk.gray(`Total console messages: ${logs.length}`));
    console.log(chalk.gray(`Errors: ${logs.filter((l) => l.type === 'error').length}`));
    console.log(chalk.gray(`Warnings: ${logs.filter((l) => l.type === 'warn').length}`));

    await page.close();
  }

  async cleanup() {
    if (this.browser) {
      await this.browser.close();
    }
  }

  async run() {
    try {
      await this.startBrowser();
      await this.debugErrors();
    } catch (error) {
      console.error(chalk.red('❌ Debug failed:'), error);
    } finally {
      await this.cleanup();
    }
  }
}

const reactDebugger = new ReactErrorDebugger();
reactDebugger.run().catch(console.error);
