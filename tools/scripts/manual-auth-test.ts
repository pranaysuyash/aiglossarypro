#!/usr/bin/env tsx

/**
 * Manual Authentication Test - Step by step verification
 */

import chalk from 'chalk';
import { type Browser, chromium } from 'playwright';

class ManualAuthTester {
  private browser: Browser | null = null;
  private baseUrl = 'http://localhost:5173';

  async startBrowser() {
    this.browser = await chromium.launch({
      headless: false,
      devtools: true,
      slowMo: 1000, // Slower for manual observation
    });
  }

  async manualTest() {
    if (!this.browser) throw new Error('Browser not initialized');

    const page = await this.browser.newPage();

    try {
      console.log(chalk.blue('🔍 Starting manual authentication test...'));

      // Step 1: Navigate to login page
      console.log(chalk.cyan('📍 Step 1: Navigating to login page...'));
      await page.goto(`${this.baseUrl}/login`);
      await page.waitForTimeout(2000);

      // Step 2: Click Test Users tab
      console.log(chalk.cyan('📍 Step 2: Clicking Test Users tab...'));
      await page.click('button[role="tab"]:has-text("Test Users")');
      await page.waitForTimeout(1000);

      // Step 3: Click "Use This Account" button
      console.log(chalk.cyan('📍 Step 3: Clicking "Use This Account" button...'));
      await page.click('button:has-text("Use This Account")');
      await page.waitForTimeout(2000);

      // Step 4: Manually click Sign In tab
      console.log(chalk.cyan('📍 Step 4: Manually clicking Sign In tab...'));
      await page.click('button[role="tab"]:has-text("Sign In")');
      await page.waitForTimeout(1000);

      // Step 5: Check form values
      console.log(chalk.cyan('📍 Step 5: Checking form values...'));
      const emailValue = await page.inputValue('input[type="email"]');
      const passwordValue = await page.inputValue('input[type="password"]');

      console.log(chalk.cyan('📝 Form values:'));
      console.log(chalk.gray(`  Email: ${emailValue}`));
      console.log(chalk.gray(`  Password: ${passwordValue ? '***filled***' : 'empty'}`));

      if (emailValue === 'test@aimlglossary.com' && passwordValue === 'testpass123') {
        console.log(chalk.green('✅ Form populated correctly'));

        // Step 6: Click Sign In button
        console.log(chalk.cyan('📍 Step 6: Clicking Sign In button...'));

        // Listen for network requests
        page.on('response', response => {
          if (response.url().includes('/auth/firebase/login')) {
            console.log(chalk.blue(`📡 API Response: ${response.status()} - ${response.url()}`));
          }
        });

        await page.click('button[type="submit"]:has-text("Sign In")');

        // Wait for response
        await page.waitForTimeout(5000);

        // Check result
        const currentUrl = page.url();
        console.log(chalk.gray(`Current URL: ${currentUrl}`));

        if (currentUrl.includes('/dashboard')) {
          console.log(chalk.green('✅ Successfully authenticated and redirected!'));
          return true;
        } else {
          // Check for errors
          const errorElement = await page
            .locator('[role="alert"]')
            .textContent()
            .catch(() => null);
          if (errorElement) {
            console.log(chalk.red(`❌ Authentication failed: ${errorElement}`));
          } else {
            console.log(chalk.yellow('⚠️ Still on login page, no visible error'));
          }
        }
      } else {
        console.log(chalk.red('❌ Form not populated correctly'));
      }

      // Keep browser open for manual inspection
      console.log(chalk.blue('🔍 Browser will remain open for manual inspection...'));
      console.log(chalk.gray('Press Ctrl+C to close'));

      // Wait indefinitely
      await new Promise(() => {});
    } catch (error) {
      console.error(chalk.red('❌ Test error:'), error);
      return false;
    }
  }

  async cleanup() {
    if (this.browser) {
      await this.browser.close();
    }
  }

  async run() {
    try {
      await this.startBrowser();
      await this.manualTest();
    } catch (error) {
      console.error(chalk.red('❌ Test failed:'), error);
    }
  }
}

const tester = new ManualAuthTester();
tester.run().catch(console.error);
