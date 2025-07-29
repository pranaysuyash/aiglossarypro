#!/usr/bin/env tsx

/**
 * Simplified Authentication Test
 * Tests the actual login flow with proper selectors
 */

import chalk from 'chalk';
import fs from 'fs';
import path from 'path';
import { chromium } from 'playwright';

interface AuthTestResult {
  testName: string;
  userType: string;
  status: 'PASS' | 'FAIL' | 'WARNING';
  message: string;
  screenshot?: string;
}

class SimplifiedAuthTester {
  private browser: any;
  private results: AuthTestResult[] = [];
  private screenshotDir: string;

  constructor() {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    this.screenshotDir = path.join(process.cwd(), 'auth-test-results', timestamp);
    fs.mkdirSync(this.screenshotDir, { recursive: true });
  }

  async init() {
    this.browser = await chromium.launch({
      headless: false,
      devtools: true,
      slowMo: 1000,
    });
  }

  async takeScreenshot(page: any, name: string, userType: string = 'guest'): Promise<string> {
    const filename = `${userType}-${name}-${Date.now()}.png`;
    const filepath = path.join(this.screenshotDir, filename);
    await page.screenshot({ path: filepath, fullPage: true });
    return filename;
  }

  addResult(result: AuthTestResult) {
    this.results.push(result);
    const color = result.status === 'PASS' ? 'green' : result.status === 'FAIL' ? 'red' : 'yellow';
    console.log(
      chalk[color](`${result.status}: ${result.testName} (${result.userType}) - ${result.message}`)
    );
  }

  async testCookieConsent() {
    const page = await this.browser.newPage();
    console.log(chalk.blue('🍪 Testing Cookie Consent...'));

    try {
      await page.goto('http://localhost:5173');
      await page.waitForLoadState('domcontentloaded');
      await page.waitForTimeout(2000);

      const screenshot = await this.takeScreenshot(page, 'homepage');

      // Check for cookie consent elements
      const cookieElements = await page
        .locator('[class*="cookie"], [id*="cookie"], [data-testid*="cookie"]')
        .count();

      this.addResult({
        testName: 'Cookie Consent Check',
        userType: 'guest',
        status: cookieElements > 0 ? 'PASS' : 'WARNING',
        message:
          cookieElements > 0
            ? `Found ${cookieElements} cookie-related elements`
            : 'No cookie consent found - may be disabled',
        screenshot,
      });
    } catch (error) {
      this.addResult({
        testName: 'Cookie Consent Test',
        userType: 'guest',
        status: 'FAIL',
        message: `Error: ${error}`,
      });
    } finally {
      await page.close();
    }
  }

  async testAuthentication() {
    const page = await this.browser.newPage();
    console.log(chalk.blue('🔐 Testing Authentication...'));

    try {
      // Navigate to login
      await page.goto('http://localhost:5173/login');
      await page.waitForLoadState('domcontentloaded');
      await page.waitForTimeout(3000);

      let screenshot = await this.takeScreenshot(page, 'login-page-initial');

      // Check login page elements
      const tabs = await page.locator('[role="tab"]').count();
      const testUsersTab = await page.locator('[role="tab"]:has-text("Test Users")').isVisible();
      const signInTab = await page.locator('[role="tab"]:has-text("Sign In")').isVisible();

      this.addResult({
        testName: 'Login Page Structure',
        userType: 'guest',
        status: tabs >= 2 ? 'PASS' : 'WARNING',
        message: `Found ${tabs} tabs, Test Users: ${testUsersTab ? '✓' : '✗'}, Sign In: ${signInTab ? '✓' : '✗'}`,
        screenshot,
      });

      // Test using Test Users tab
      if (testUsersTab) {
        await page.click('[role="tab"]:has-text("Test Users")');
        await page.waitForTimeout(2000);

        screenshot = await this.takeScreenshot(page, 'test-users-tab');

        // Check for Use This Account buttons
        const useAccountButtons = await page.locator('button:has-text("Use This Account")').count();

        this.addResult({
          testName: 'Test Users Tab',
          userType: 'guest',
          status: useAccountButtons > 0 ? 'PASS' : 'FAIL',
          message: `Found ${useAccountButtons} "Use This Account" buttons`,
          screenshot,
        });

        if (useAccountButtons > 0) {
          // Click first button (regular user)
          await page.click('button:has-text("Use This Account")');
          await page.waitForTimeout(2000);

          screenshot = await this.takeScreenshot(page, 'after-use-account-click');

          // Check if we need to switch to Sign In tab
          if (signInTab) {
            await page.click('[role="tab"]:has-text("Sign In")');
            await page.waitForTimeout(2000);
          }

          screenshot = await this.takeScreenshot(page, 'sign-in-tab');

          // Check if form is populated
          const emailValue = await page.inputValue('input[type="email"]').catch(() => '');
          const passwordValue = await page.inputValue('input[type="password"]').catch(() => '');

          this.addResult({
            testName: 'Form Auto-Population',
            userType: 'free',
            status: emailValue.includes('test@') && passwordValue.length > 0 ? 'PASS' : 'WARNING',
            message: `Email: ${emailValue || 'empty'}, Password: ${passwordValue ? 'filled' : 'empty'}`,
            screenshot,
          });

          // Test actual login
          if (emailValue && passwordValue) {
            const submitButton = await page.locator('button[type="submit"]').first();
            if (await submitButton.isVisible()) {
              console.log(chalk.cyan('📍 Attempting login...'));
              await submitButton.click();
              await page.waitForTimeout(5000);

              screenshot = await this.takeScreenshot(page, 'after-login-attempt');

              const currentUrl = page.url();
              const loginSuccess =
                currentUrl.includes('/dashboard') || currentUrl.includes('/admin');

              this.addResult({
                testName: 'Login Flow',
                userType: 'free',
                status: loginSuccess ? 'PASS' : 'FAIL',
                message: `URL after login: ${currentUrl}`,
                screenshot,
              });

              if (loginSuccess) {
                // Test dashboard elements
                await page.waitForTimeout(3000);
                screenshot = await this.takeScreenshot(page, 'dashboard-view');

                const dashboardElements = await page
                  .locator('h1, h2, .dashboard, [data-testid*="dashboard"]')
                  .count();

                this.addResult({
                  testName: 'Dashboard Access',
                  userType: 'free',
                  status: dashboardElements > 0 ? 'PASS' : 'WARNING',
                  message: `Found ${dashboardElements} dashboard elements`,
                  screenshot,
                });
              }
            }
          }
        }
      }
    } catch (error) {
      this.addResult({
        testName: 'Authentication Test',
        userType: 'guest',
        status: 'FAIL',
        message: `Error: ${error}`,
      });
    } finally {
      await page.close();
    }
  }

  async testResponsiveDesign() {
    console.log(chalk.blue('📱 Testing Responsive Design...'));

    const viewports = [
      { name: 'mobile', width: 375, height: 812 },
      { name: 'tablet', width: 768, height: 1024 },
      { name: 'desktop', width: 1920, height: 1080 },
    ];

    for (const viewport of viewports) {
      const page = await this.browser.newPage();
      await page.setViewportSize(viewport);

      try {
        await page.goto('http://localhost:5173');
        await page.waitForLoadState('domcontentloaded');
        await page.waitForTimeout(2000);

        const screenshot = await this.takeScreenshot(page, `responsive-${viewport.name}`);

        // Check for navigation elements
        const nav = await page.locator('nav, .navigation, header').isVisible();
        const menu = await page
          .locator('button[aria-label*="menu"], .hamburger, .menu-toggle')
          .isVisible();

        this.addResult({
          testName: `Responsive ${viewport.name}`,
          userType: 'guest',
          status: nav || menu ? 'PASS' : 'WARNING',
          message: `Navigation: ${nav ? '✓' : '✗'}, Menu: ${menu ? '✓' : '✗'}`,
          screenshot,
        });
      } catch (error) {
        this.addResult({
          testName: `Responsive ${viewport.name}`,
          userType: 'guest',
          status: 'FAIL',
          message: `Error: ${error}`,
        });
      } finally {
        await page.close();
      }
    }
  }

  async generateReport() {
    console.log(chalk.yellow('📝 Generating report...'));

    const summary = {
      totalTests: this.results.length,
      passed: this.results.filter(r => r.status === 'PASS').length,
      failed: this.results.filter(r => r.status === 'FAIL').length,
      warnings: this.results.filter(r => r.status === 'WARNING').length,
    };

    const report = {
      timestamp: new Date().toISOString(),
      summary,
      passRate: Math.round((summary.passed / summary.totalTests) * 100),
      results: this.results,
    };

    const reportPath = path.join(this.screenshotDir, 'auth-test-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

    console.log(chalk.green('✅ Report generated!'));
    console.log(chalk.blue(`📁 Results: ${this.screenshotDir}`));
    console.log(
      chalk.blue(
        `📊 Summary: ${summary.passed} passed, ${summary.failed} failed, ${summary.warnings} warnings`
      )
    );

    return report;
  }

  async run() {
    try {
      await this.init();
      await this.testCookieConsent();
      await this.testAuthentication();
      await this.testResponsiveDesign();
      await this.generateReport();
    } catch (error) {
      console.error(chalk.red('❌ Test failed:'), error);
    } finally {
      if (this.browser) {
        await this.browser.close();
      }
    }
  }
}

const tester = new SimplifiedAuthTester();
tester.run().catch(console.error);
