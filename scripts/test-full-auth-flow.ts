#!/usr/bin/env tsx

/**
 * Comprehensive Authentication Flow Test
 * Tests cookie acceptance, test user buttons, and login functionality
 */

import chalk from 'chalk';
import { type Browser, chromium } from 'playwright';

class AuthFlowTester {
  private browser: Browser | null = null;
  private baseUrl = 'http://localhost:5173';

  async startBrowser() {
    this.browser = await chromium.launch({
      headless: false,
      devtools: true,
      slowMo: 500,
    });
  }

  async testFullAuthFlow() {
    if (!this.browser) throw new Error('Browser not initialized');

    const page = await this.browser.newPage();

    try {
      console.log(chalk.blue('🔍 Testing complete authentication flow...'));

      // Step 1: Navigate to login page
      console.log(chalk.cyan('📍 Step 1: Navigating to login page...'));
      await page.goto(`${this.baseUrl}/login`);
      await page.waitForTimeout(2000);

      // Step 2: Handle cookie consent if present
      console.log(chalk.cyan('📍 Step 2: Checking for cookie consent banner...'));
      const cookieConsent = page.locator(
        '[role="dialog"]:has-text("Cookie"), .cookie-consent, .cookie-banner'
      );

      if ((await cookieConsent.count()) > 0) {
        console.log(chalk.yellow('🍪 Cookie consent banner detected'));

        // Try different common cookie acceptance patterns
        const acceptButtons = [
          'button:has-text("Accept")',
          'button:has-text("Accept all")',
          'button:has-text("OK")',
          'button:has-text("I accept")',
          'button:has-text("Allow")',
          '[data-testid="cookie-accept"]',
          '.cookie-accept',
        ];

        let cookieAccepted = false;
        for (const selector of acceptButtons) {
          const button = page.locator(selector);
          if ((await button.count()) > 0) {
            console.log(chalk.green(`✅ Found cookie accept button: ${selector}`));
            await button.click();
            await page.waitForTimeout(1000);
            cookieAccepted = true;
            break;
          }
        }

        if (!cookieAccepted) {
          console.log(chalk.red('❌ Could not find cookie accept button'));
          // Try clicking outside the modal to close it
          await page.mouse.click(100, 100);
          await page.waitForTimeout(1000);
        }
      } else {
        console.log(chalk.green('✅ No cookie consent banner found'));
      }

      // Step 3: Navigate to Test Users tab
      console.log(chalk.cyan('📍 Step 3: Switching to Test Users tab...'));
      const testTab = page.locator('button[role="tab"]:has-text("Test Users")');

      if ((await testTab.count()) > 0) {
        console.log(chalk.green('✅ Test Users tab found'));
        await testTab.click();
        await page.waitForTimeout(1000);

        // Step 4: Click "Use This Account" for regular user
        console.log(chalk.cyan('📍 Step 4: Clicking "Use This Account" for regular user...'));
        const useAccountButton = page.locator('button:has-text("Use This Account")').first();

        if ((await useAccountButton.count()) > 0) {
          console.log(chalk.green('✅ "Use This Account" button found'));
          await useAccountButton.click();

          // Wait for tab switch and form population
          await page.waitForTimeout(500);

          // Step 5: Verify we're on login tab with populated fields
          console.log(chalk.cyan('📍 Step 5: Verifying tab switch and form population...'));

          // Wait for the login tab to become active
          await page.waitForFunction(
            () => {
              const activeTab = document.querySelector('[role="tab"][data-state="active"]');
              return activeTab?.textContent?.includes('Sign In');
            },
            { timeout: 5000 }
          );

          const activeTab = await page.locator('[role="tab"][data-state="active"]').textContent();
          console.log(chalk.gray(`Active tab: ${activeTab}`));

          // Wait for form fields to be populated
          await page.waitForFunction(
            () => {
              const emailField = document.querySelector('input[type="email"]') as HTMLInputElement;
              const passwordField = document.querySelector(
                'input[type="password"]'
              ) as HTMLInputElement;
              return (
                emailField &&
                passwordField &&
                emailField.value === 'test@aimlglossary.com' &&
                passwordField.value === 'testpass123'
              );
            },
            { timeout: 5000 }
          );

          const emailValue = await page.locator('input[type="email"]').inputValue();
          const passwordValue = await page.locator('input[type="password"]').inputValue();

          console.log(chalk.cyan('📝 Form values:'));
          console.log(chalk.gray(`  Email: ${emailValue}`));
          console.log(chalk.gray(`  Password: ${passwordValue ? '***filled***' : 'empty'}`));

          if (emailValue === 'test@aimlglossary.com' && passwordValue === 'testpass123') {
            console.log(chalk.green('✅ Form fields populated correctly'));

            // Step 6: Click Sign In button
            console.log(chalk.cyan('📍 Step 6: Clicking Sign In button...'));
            const signInButton = page.locator('button[type="submit"]:has-text("Sign In")');

            if ((await signInButton.count()) > 0) {
              console.log(chalk.green('✅ Sign In button found'));

              // Listen for network requests to debug API calls
              page.on('response', response => {
                if (response.url().includes('/auth/firebase/login')) {
                  console.log(
                    chalk.blue(`📡 API Response: ${response.status()} - ${response.url()}`)
                  );
                }
              });

              await signInButton.click();

              // Wait for navigation or error
              await page.waitForTimeout(5000);

              // Step 7: Check authentication result
              console.log(chalk.cyan('📍 Step 7: Checking authentication result...'));
              const currentUrl = page.url();
              console.log(chalk.gray(`Current URL: ${currentUrl}`));

              if (currentUrl.includes('/dashboard')) {
                console.log(
                  chalk.green('✅ Successfully authenticated and redirected to dashboard')
                );
                return true;
              } else if (currentUrl.includes('/login')) {
                // Check for error messages
                const errorMessage = await page
                  .locator('[role="alert"]')
                  .textContent()
                  .catch(() => null);
                if (errorMessage) {
                  console.log(chalk.red(`❌ Authentication failed with error: ${errorMessage}`));
                } else {
                  console.log(
                    chalk.yellow('⚠️ Still on login page, checking console for errors...')
                  );

                  // Get console logs
                  const logs = await page.evaluate(() => {
                    return window.console.logs || [];
                  });

                  console.log(chalk.gray('Console logs:'), logs);
                }
              }
            } else {
              console.log(chalk.red('❌ Sign In button not found'));
            }
          } else {
            console.log(chalk.red('❌ Form fields not populated correctly'));
          }
        } else {
          console.log(chalk.red('❌ "Use This Account" button not found'));
        }
      } else {
        console.log(chalk.red('❌ Test Users tab not found - ensure development mode is enabled'));
      }

      return false;
    } catch (error) {
      console.error(chalk.red('❌ Test failed with error:'), error);
      return false;
    } finally {
      // Take final screenshot
      await page.screenshot({ path: 'auth-flow-final.png' });
      console.log(chalk.gray('Final screenshot saved: auth-flow-final.png'));
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
      const success = await this.testFullAuthFlow();

      if (success) {
        console.log(chalk.green('🎉 All authentication tests passed!'));
      } else {
        console.log(chalk.red('❌ Authentication test failed'));
      }

      return success;
    } catch (error) {
      console.error(chalk.red('❌ Test suite failed:'), error);
      return false;
    } finally {
      await this.cleanup();
    }
  }
}

// Run the test
const tester = new AuthFlowTester();
tester.run().catch(console.error);
