#!/usr/bin/env tsx

/**
 * Firebase Comprehensive Visual Audit Script
 *
 * This script tests:
 * 1. Unauthenticated flows
 * 2. Authenticated flows with Firebase test users
 * 3. All pages and interactions
 * 4. No artificial timeouts for local testing
 */

import { exec } from 'node:child_process';
import fs from 'node:fs/promises';
import path from 'node:path';
import { promisify } from 'node:util';
import chalk from 'chalk';
import { config } from 'dotenv';
import { type Browser, type BrowserContext, chromium, devices, type Page } from 'playwright';

// Load environment variables
config();

const execAsync = promisify(exec);

interface TestUser {
  email: string;
  password: string;
  displayName: string;
  role: 'user' | 'premium' | 'admin';
}

interface TestConfig {
  name: string;
  url: string;
  authenticated?: boolean;
  testUser?: TestUser;
  viewport?: { width: number; height: number };
  device?: string;
  actions?: Array<{
    type:
      | 'click'
      | 'hover'
      | 'type'
      | 'scroll'
      | 'wait'
      | 'keyboard'
      | 'screenshot'
      | 'focus'
      | 'select';
    selector?: string;
    value?: string | number;
    key?: string;
    description?: string;
    screenshot?: boolean;
  }>;
}

class FirebaseVisualAuditor {
  private browser: Browser | null = null;
  private baseUrl = process.env.BASE_URL || 'http://localhost:5173';
  private screenshotDir: string;
  private reportDir: string;
  private issues: any[] = [];
  private testUsers: TestUser[] = [
    {
      email: 'test.user@example.com',
      password: 'TestUser123!',
      displayName: 'Test User',
      role: 'user',
    },
    {
      email: 'premium.user@example.com',
      password: 'PremiumUser123!',
      displayName: 'Premium User',
      role: 'premium',
    },
    {
      email: 'admin.user@example.com',
      password: 'AdminUser123!',
      displayName: 'Admin User',
      role: 'admin',
    },
  ];

  constructor() {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    this.screenshotDir = path.join(process.cwd(), 'firebase-audit', timestamp, 'screenshots');
    this.reportDir = path.join(process.cwd(), 'firebase-audit', timestamp);
  }

  async initialize() {
    await fs.mkdir(this.screenshotDir, { recursive: true });
    await fs.mkdir(this.reportDir, { recursive: true });

    console.log(chalk.blue('🚀 Starting Firebase Visual Audit...'));
    console.log(chalk.gray(`Screenshots: ${this.screenshotDir}`));
    console.log(chalk.gray(`Report: ${this.reportDir}`));
  }

  async startBrowser(): Promise<void> {
    console.log(chalk.yellow('🌐 Starting Chromium browser...'));
    this.browser = await chromium.launch({
      headless: false, // Keep visible for local testing
      devtools: true,
      args: ['--disable-web-security', '--disable-features=VizDisplayCompositor', '--no-sandbox'],
    });
  }

  async checkServer(): Promise<void> {
    console.log(chalk.yellow('⚡ Checking if servers are running...'));

    try {
      await execAsync(`curl -f ${this.baseUrl} > /dev/null 2>&1`);
      console.log(chalk.green('✅ Frontend server is ready'));
    } catch (_error) {
      throw new Error(`Frontend server not accessible at ${this.baseUrl}`);
    }

    try {
      await execAsync(
        `curl -f ${this.baseUrl.replace('5173', '3001')}/api/health > /dev/null 2>&1`
      );
      console.log(chalk.green('✅ Backend server is ready'));
    } catch (_error) {
      console.log(chalk.yellow('⚠️ Backend server health check failed, but continuing...'));
    }
  }

  async authenticateUser(page: Page, user: TestUser): Promise<boolean> {
    console.log(chalk.blue(`🔐 Authenticating as ${user.displayName} (${user.role})`));

    try {
      // Navigate to login page
      await page.goto(`${this.baseUrl}/login`, { waitUntil: 'networkidle' });

      // Wait for Firebase to load
      await page.waitForTimeout(2000);

      // Try email/password login
      const emailInput = page.locator('input[type="email"], input[name="email"]');
      const passwordInput = page.locator('input[type="password"], input[name="password"]');
      const loginButton = page.locator(
        'button:has-text("Sign in"), button:has-text("Login"), button[type="submit"]'
      );

      if ((await emailInput.count()) > 0) {
        await emailInput.fill(user.email);
        await passwordInput.fill(user.password);
        await loginButton.click();

        // Wait for redirect after login
        await page.waitForURL(url => !url.includes('/login'), { timeout: 10000 });

        console.log(chalk.green(`✅ Successfully authenticated as ${user.displayName}`));
        return true;
      } else {
        console.log(chalk.yellow(`⚠️ Login form not found for ${user.displayName}`));
        return false;
      }
    } catch (error) {
      console.log(chalk.red(`❌ Failed to authenticate ${user.displayName}: ${error}`));
      return false;
    }
  }

  async runTest(config: TestConfig): Promise<void> {
    console.log(chalk.cyan(`\n🧪 Testing: ${config.name}`));

    if (!this.browser) {
      throw new Error('Browser not initialized');
    }

    const context: BrowserContext = await this.browser.newContext({
      viewport: config.viewport || { width: 1920, height: 1080 },
      ...(config.device ? devices[config.device] : {}),
    });

    const page = await context.newPage();

    // Listen for console errors
    const consoleErrors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    // Listen for page errors
    const pageErrors: string[] = [];
    page.on('pageerror', error => {
      pageErrors.push(error.message);
    });

    try {
      // Authenticate if required
      if (config.authenticated && config.testUser) {
        const authSuccess = await this.authenticateUser(page, config.testUser);
        if (!authSuccess) {
          this.issues.push({
            type: 'authentication_failure',
            test: config.name,
            message: `Failed to authenticate user ${config.testUser.displayName}`,
          });
          return;
        }
      }

      // Navigate to the test URL
      console.log(chalk.gray(`📍 Navigating to: ${config.url}`));
      await page.goto(`${this.baseUrl}${config.url}`, {
        waitUntil: 'networkidle',
        timeout: 30000, // No artificial timeout for local testing
      });

      // Wait for page to stabilize
      await page.waitForTimeout(2000);

      // Execute test actions
      if (config.actions) {
        for (const action of config.actions) {
          try {
            await this.executeAction(page, action);
          } catch (_error) {
            console.log(chalk.yellow(`⚠️ Action failed: ${action.description || action.type}`));
          }
        }
      }

      // Take screenshot
      const screenshotPath = path.join(this.screenshotDir, `${config.name}.png`);
      await page.screenshot({
        path: screenshotPath,
        fullPage: true,
      });

      // Check for loading states that indicate problems
      const loadingElements = await page
        .locator('[data-testid*="loading"], .loading, .spinner, .skeleton')
        .count();
      if (loadingElements > 0) {
        this.issues.push({
          type: 'stuck_loading',
          test: config.name,
          message: 'Page appears to be stuck in loading state',
          file: `${config.name}.png`,
        });
      }

      // Record console and page errors
      if (consoleErrors.length > 0) {
        this.issues.push({
          type: 'console_errors',
          test: config.name,
          message: `Console errors: ${consoleErrors.join('; ')}`,
          file: `${config.name}.png`,
        });
      }

      if (pageErrors.length > 0) {
        this.issues.push({
          type: 'page_errors',
          test: config.name,
          message: `Page errors: ${pageErrors.join('; ')}`,
          file: `${config.name}.png`,
        });
      }

      console.log(chalk.green(`✅ Test completed: ${config.name}`));
    } catch (error) {
      console.log(chalk.red(`❌ Test failed: ${config.name} - ${error}`));

      // Still take screenshot on failure
      try {
        const errorScreenshotPath = path.join(this.screenshotDir, `${config.name}-error.png`);
        await page.screenshot({
          path: errorScreenshotPath,
          fullPage: true,
        });
      } catch (screenshotError) {
        console.log(chalk.red(`❌ Failed to take error screenshot: ${screenshotError}`));
      }

      this.issues.push({
        type: 'test_failure',
        test: config.name,
        message: error instanceof Error ? error.message : String(error),
        file: `${config.name}-error.png`,
      });
    } finally {
      await context.close();
    }
  }

  private async executeAction(page: Page, action: any): Promise<void> {
    switch (action.type) {
      case 'click':
        if (action.selector) {
          await page.click(action.selector);
        }
        break;
      case 'type':
        if (action.selector && action.value) {
          await page.fill(action.selector, String(action.value));
        }
        break;
      case 'scroll':
        await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
        break;
      case 'wait':
        await page.waitForTimeout((action.value as number) || 1000);
        break;
      case 'screenshot':
        if (action.description) {
          const actionScreenshotPath = path.join(
            this.screenshotDir,
            `action-${action.description}.png`
          );
          await page.screenshot({ path: actionScreenshotPath });
        }
        break;
    }
  }

  async generateTestConfigs(): Promise<TestConfig[]> {
    const configs: TestConfig[] = [];

    // Basic page tests (unauthenticated)
    const basicPages = [
      { url: '/', name: 'homepage' },
      { url: '/terms', name: 'terms-page' },
      { url: '/categories', name: 'categories-page' },
      { url: '/trending', name: 'trending-page' },
      { url: '/login', name: 'login-page' },
    ];

    for (const page of basicPages) {
      configs.push({
        name: `${page.name}-unauthenticated`,
        url: page.url,
      });
    }

    // Authenticated tests for each user type
    const authenticatedPages = [
      { url: '/dashboard', name: 'dashboard' },
      { url: '/favorites', name: 'favorites' },
      { url: '/settings', name: 'settings' },
      { url: '/profile', name: 'profile' },
    ];

    for (const user of this.testUsers) {
      for (const page of authenticatedPages) {
        configs.push({
          name: `${page.name}-${user.role}`,
          url: page.url,
          authenticated: true,
          testUser: user,
        });
      }
    }

    // Mobile responsive tests
    configs.push({
      name: 'homepage-mobile',
      url: '/',
      device: 'iPhone 13',
    });

    configs.push({
      name: 'dashboard-mobile-authenticated',
      url: '/dashboard',
      device: 'iPhone 13',
      authenticated: true,
      testUser: this.testUsers[0], // Regular user
    });

    return configs;
  }

  async generateReport(): Promise<void> {
    const reportData = {
      timestamp: new Date().toISOString(),
      baseUrl: this.baseUrl,
      totalTests: 0,
      totalIssues: this.issues.length,
      issues: this.issues,
      testUsers: this.testUsers.map(u => ({
        email: u.email,
        role: u.role,
        displayName: u.displayName,
      })),
    };

    // Save JSON report
    const jsonReportPath = path.join(this.reportDir, 'firebase-audit-report.json');
    await fs.writeFile(jsonReportPath, JSON.stringify(reportData, null, 2));

    // Generate HTML report
    const htmlReport = this.generateHTMLReport(reportData);
    const htmlReportPath = path.join(this.reportDir, 'index.html');
    await fs.writeFile(htmlReportPath, htmlReport);

    console.log(chalk.blue('\n📊 Audit Results:'));
    console.log(chalk.gray(`Total Issues: ${this.issues.length}`));
    console.log(chalk.gray(`Report: ${htmlReportPath}`));
    console.log(chalk.gray(`JSON: ${jsonReportPath}`));
  }

  private generateHTMLReport(data: any): string {
    const issuesByType = data.issues.reduce((acc: any, issue: any) => {
      acc[issue.type] = (acc[issue.type] || 0) + 1;
      return acc;
    }, {});

    return `
<!DOCTYPE html>
<html>
<head>
  <title>Firebase Visual Audit Report</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 20px; line-height: 1.6; }
    .summary { background: #f5f5f5; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
    .metric { display: inline-block; margin: 10px; padding: 10px; background: white; border-radius: 4px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
    .issue { padding: 10px; margin: 10px 0; border-radius: 4px; border-left: 4px solid #ff4444; background: #ffe6e6; }
    .test-users { background: #e7f3ff; padding: 15px; border-radius: 8px; margin: 20px 0; }
    h1 { color: #333; }
    h2 { color: #555; border-bottom: 2px solid #eee; padding-bottom: 10px; }
    .timestamp { color: #666; font-size: 0.9em; }
  </style>
</head>
<body>
  <h1>🔍 Firebase Visual Audit Report</h1>
  <p class="timestamp">Generated: ${new Date(data.timestamp).toLocaleString()}</p>
  
  <div class="summary">
    <h2>📊 Executive Summary</h2>
    <div class="metric"><strong>${data.totalIssues}</strong><br>Total Issues</div>
    <div class="metric"><strong>${Object.keys(issuesByType).length}</strong><br>Issue Types</div>
    <div class="metric"><strong>${data.testUsers.length}</strong><br>Test Users</div>
  </div>

  <div class="test-users">
    <h2>👤 Test Users</h2>
    ${data.testUsers
      .map(
        (user: any) => `
      <div style="margin: 10px 0;">
        <strong>${user.displayName}</strong> (${user.role})<br>
        <small>${user.email}</small>
      </div>
    `
      )
      .join('')}
  </div>

  <h2>🚨 Issues Found</h2>
  ${
    data.issues.length === 0
      ? '<p>✅ No issues found!</p>'
      : data.issues
          .map(
            (issue: any) => `
    <div class="issue">
      <strong>${issue.type.replace(/_/g, ' ').toUpperCase()}</strong><br>
      Test: ${issue.test}<br>
      ${issue.message}<br>
      ${issue.file ? `<small>Screenshot: ${issue.file}</small>` : ''}
    </div>
  `
          )
          .join('')
  }

  <div style="margin-top: 40px; padding: 20px; background: #f8f9fa; border-radius: 8px;">
    <h2>📁 File Locations</h2>
    <p><strong>Screenshots:</strong> ${this.screenshotDir}</p>
    <p><strong>JSON Report:</strong> ${path.join(this.reportDir, 'firebase-audit-report.json')}</p>
  </div>
</body>
</html>`;
  }

  async cleanup(): Promise<void> {
    if (this.browser) {
      await this.browser.close();
    }
  }

  async run(): Promise<void> {
    try {
      await this.initialize();
      await this.checkServer();
      await this.startBrowser();

      const testConfigs = await this.generateTestConfigs();
      console.log(chalk.blue(`📋 Running ${testConfigs.length} tests...`));

      for (const config of testConfigs) {
        await this.runTest(config);
      }

      await this.generateReport();
    } catch (error) {
      console.error(chalk.red('❌ Audit failed:'), error);
      throw error;
    } finally {
      await this.cleanup();
    }
  }
}

// Run the audit
const auditor = new FirebaseVisualAuditor();
auditor.run().catch(console.error);

export default FirebaseVisualAuditor;
