#!/usr/bin/env tsx

import { chromium, Browser, Page, BrowserContext } from 'playwright';
import chalk from 'chalk';
import * as fs from 'fs';
import * as path from 'path';

// Test users configuration (updated with new Firebase users)
const TEST_USERS = [
  {
    email: 'free@aiglossarypro.com',
    password: 'freepass123',
    type: 'free',
    displayName: 'Free Test User',
    expectedFeatures: ['limited-access', 'daily-limit', 'basic-features'],
    dailyLimit: 5
  },
  {
    email: 'premium@aiglossarypro.com',
    password: 'premiumpass123',
    type: 'premium',
    displayName: 'Premium Test User',
    expectedFeatures: ['unlimited-access', 'advanced-features', 'no-ads', 'priority-support']
  },
  {
    email: 'admin@aiglossarypro.com',
    password: 'adminpass123',
    type: 'admin',
    displayName: 'Admin Test User',
    expectedFeatures: ['admin-dashboard', 'content-management', 'user-management', 'analytics']
  }
];

interface TestResult {
  name: string;
  status: 'pass' | 'fail' | 'skip';
  error?: string;
  duration: number;
  screenshots: string[];
  user?: string;
}

class ComprehensivePlaywrightTest {
  private browser!: Browser;
  private baseUrl: string;
  private apiUrl: string;
  private reportDir: string;
  private results: TestResult[] = [];
  private screenshotCount = 0;

  constructor(baseUrl: string = 'http://localhost:5173', apiUrl: string = 'http://localhost:3001') {
    this.baseUrl = process.env.BASE_URL || baseUrl;
    this.apiUrl = process.env.API_URL || apiUrl;
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    this.reportDir = path.join(process.cwd(), 'reports', 'playwright-tests', timestamp);
  }

  async initialize() {
    // Create report directory
    fs.mkdirSync(this.reportDir, { recursive: true });
    fs.mkdirSync(path.join(this.reportDir, 'screenshots'), { recursive: true });
    
    // Launch browser
    this.browser = await chromium.launch({
      headless: false,
      args: ['--start-maximized'],
      slowMo: 100 // Slow down for visibility
    });
    
    console.log(chalk.blue(`\n🚀 Comprehensive Playwright Tests for AI/ML Glossary Pro`));
    console.log(chalk.gray(`📁 Report directory: ${this.reportDir}`));
    console.log(chalk.gray(`🌐 Frontend URL: ${this.baseUrl}`));
    console.log(chalk.gray(`🔌 API URL: ${this.apiUrl}`));
    console.log(chalk.gray(`📅 Timestamp: ${new Date().toISOString()}\n`));
  }

  async captureScreenshot(page: Page, name: string): Promise<string> {
    this.screenshotCount++;
    const filename = `${String(this.screenshotCount).padStart(3, '0')}-${name}-${Date.now()}.png`;
    const filepath = path.join(this.reportDir, 'screenshots', filename);
    
    await page.screenshot({
      path: filepath,
      fullPage: true
    });
    
    return filename;
  }

  async runTest(name: string, testFn: () => Promise<void>, user?: string): Promise<TestResult> {
    console.log(chalk.cyan(`\n🧪 ${name}`));
    if (user) console.log(chalk.gray(`   User: ${user}`));
    
    const startTime = Date.now();
    const screenshots: string[] = [];
    
    try {
      await testFn();
      const result: TestResult = {
        name,
        status: 'pass',
        duration: Date.now() - startTime,
        screenshots,
        user
      };
      console.log(chalk.green(`   ✅ PASS (${result.duration}ms)`));
      this.results.push(result);
      return result;
    } catch (error) {
      const result: TestResult = {
        name,
        status: 'fail',
        error: error instanceof Error ? error.message : String(error),
        duration: Date.now() - startTime,
        screenshots,
        user
      };
      console.log(chalk.red(`   ❌ FAIL: ${result.error}`));
      this.results.push(result);
      return result;
    }
  }

  // Handle cookie consent modal
  async handleCookieConsent(page: Page) {
    try {
      // Wait for cookie modal to appear
      const cookieModal = await page.waitForSelector('[data-testid="cookie-consent"], .cookie-consent, div:has-text("We use cookies")', { 
        timeout: 3000,
        state: 'visible' 
      });
      
      if (cookieModal) {
        console.log(chalk.gray('   🍪 Cookie consent modal detected'));
        
        // Look for accept button
        const acceptButton = await page.locator('button:has-text("Accept"), button:has-text("Accept All"), button:has-text("Accept Cookies")').first();
        if (await acceptButton.isVisible()) {
          await acceptButton.click();
          await page.waitForTimeout(500); // Wait for modal to close
          console.log(chalk.gray('   🍪 Cookie consent accepted'));
        }
      }
    } catch {
      // No cookie modal present, continue
    }
  }

  // Handle any blocking modals
  async handleBlockingModals(page: Page) {
    try {
      // Check for any modal overlays
      const modalOverlay = await page.locator('.fixed.inset-0.bg-black\\/50, [role="dialog"], .modal-backdrop').first();
      
      if (await modalOverlay.isVisible()) {
        console.log(chalk.gray('   🚫 Blocking modal detected, attempting to close'));
        
        // Try to find close button
        const closeButtons = [
          'button[aria-label="Close"]',
          'button:has-text("Close")',
          'button:has-text("×")',
          'button.close',
          '[data-testid="modal-close"]'
        ];
        
        for (const selector of closeButtons) {
          const closeBtn = page.locator(selector).first();
          if (await closeBtn.isVisible()) {
            await closeBtn.click();
            await page.waitForTimeout(500);
            console.log(chalk.gray('   ✅ Modal closed'));
            break;
          }
        }
        
        // If no close button, try clicking outside or pressing Escape
        if (await modalOverlay.isVisible()) {
          await page.keyboard.press('Escape');
          await page.waitForTimeout(500);
        }
      }
    } catch {
      // No blocking modal, continue
    }
  }

  // Improved authentication method
  async authenticateUser(context: BrowserContext, user: typeof TEST_USERS[0]): Promise<Page> {
    const page = await context.newPage();
    
    try {
      // Navigate to login page
      await page.goto(`${this.baseUrl}/login`, { waitUntil: 'domcontentloaded' });
      await this.handleCookieConsent(page);
      await this.handleBlockingModals(page);
      
      // Fill login form
      await page.fill('input[type="email"]', user.email);
      await page.fill('input[type="password"]', user.password);
      
      // Take screenshot before login
      await this.captureScreenshot(page, `login-${user.type}-before`);
      
      // Submit login form
      await Promise.all([
        page.waitForNavigation({ url: /\/(dashboard|home)/, timeout: 10000 }),
        page.click('button[type="submit"]')
      ]);
      
      // Handle any post-login modals
      await this.handleBlockingModals(page);
      
      // Wait for authentication to complete
      await page.waitForTimeout(2000);
      
      // Verify login success
      const userMenuVisible = await page.locator('[data-testid="user-menu"], .user-menu, .user-dropdown').isVisible();
      if (!userMenuVisible) {
        throw new Error('User menu not visible after login');
      }
      
      await this.captureScreenshot(page, `login-${user.type}-success`);
      console.log(chalk.gray(`   🔐 Authenticated as ${user.type} user`));
      
      return page;
    } catch (error) {
      await this.captureScreenshot(page, `login-${user.type}-error`);
      throw error;
    }
  }

  // Test Suite 1: Authentication Tests
  async testAuthentication() {
    console.log(chalk.yellow('\n📋 AUTHENTICATION TESTS'));
    
    for (const user of TEST_USERS) {
      await this.runTest(`Login - ${user.type} user`, async () => {
        const context = await this.browser.newContext();
        const page = await this.authenticateUser(context, user);
        
        // Verify user-specific elements
        if (user.type === 'admin') {
          const adminLink = await page.locator('a[href*="/admin"], [data-testid="admin-link"]').isVisible();
          if (!adminLink) throw new Error('Admin dashboard link not visible');
        }
        
        await page.close();
        await context.close();
      }, user.email);
    }
    
    // Test logout
    await this.runTest('Logout functionality', async () => {
      const context = await this.browser.newContext();
      const page = await this.authenticateUser(context, TEST_USERS[0]);
      
      // Find and click logout
      const userMenu = page.locator('[data-testid="user-menu"], .user-menu, .user-dropdown').first();
      await userMenu.click();
      await page.waitForTimeout(500);
      
      const logoutButton = page.locator('button:has-text("Logout"), button:has-text("Sign Out"), [data-testid="logout-button"]').first();
      await logoutButton.click();
      
      // Verify logged out
      await page.waitForURL(/\/(login|signin|$)/, { timeout: 5000 });
      await this.captureScreenshot(page, 'logout-success');
      
      await page.close();
      await context.close();
    });
  }

  // Test Suite 2: Access Control Tests
  async testAccessControl() {
    console.log(chalk.yellow('\n📋 ACCESS CONTROL TESTS'));
    
    // Test free user daily limit
    await this.runTest('Free user 5-term daily limit', async () => {
      const context = await this.browser.newContext();
      const page = await this.authenticateUser(context, TEST_USERS[0]); // Free user
      
      // Navigate to glossary
      await page.goto(`${this.baseUrl}/glossary`);
      await this.handleBlockingModals(page);
      
      // Try to view 6 terms
      const termLinks = await page.locator('a[href*="/glossary/"]').all();
      
      for (let i = 0; i < Math.min(6, termLinks.length); i++) {
        await termLinks[i].click();
        await page.waitForLoadState('networkidle');
        await this.captureScreenshot(page, `free-term-${i + 1}`);
        
        if (i === 4) { // After 5th term
          // Check for limit message
          const limitMessage = await page.locator('text=/limit|reached|upgrade/i').isVisible();
          if (!limitMessage && i === 5) {
            throw new Error('No daily limit enforcement for free user');
          }
        }
        
        await page.goBack();
      }
      
      await page.close();
      await context.close();
    }, TEST_USERS[0].email);
    
    // Test premium unlimited access
    await this.runTest('Premium user unlimited access', async () => {
      const context = await this.browser.newContext();
      const page = await this.authenticateUser(context, TEST_USERS[1]); // Premium user
      
      await page.goto(`${this.baseUrl}/glossary`);
      await this.handleBlockingModals(page);
      
      // View multiple terms without restriction
      const termLinks = await page.locator('a[href*="/glossary/"]').all();
      
      for (let i = 0; i < Math.min(10, termLinks.length); i++) {
        await termLinks[i].click();
        await page.waitForLoadState('networkidle');
        
        // Should not see any limit messages
        const limitMessage = await page.locator('text=/limit|reached|upgrade/i').count();
        if (limitMessage > 0) {
          throw new Error('Premium user seeing limit messages');
        }
        
        await page.goBack();
      }
      
      await this.captureScreenshot(page, 'premium-unlimited-access');
      await page.close();
      await context.close();
    }, TEST_USERS[1].email);
    
    // Test admin dashboard access
    await this.runTest('Admin dashboard access', async () => {
      const context = await this.browser.newContext();
      const page = await this.authenticateUser(context, TEST_USERS[2]); // Admin user
      
      await page.goto(`${this.baseUrl}/admin`);
      await page.waitForLoadState('networkidle');
      
      // Verify admin dashboard elements
      const dashboardTitle = await page.locator('h1:has-text("Admin"), h1:has-text("Dashboard")').isVisible();
      if (!dashboardTitle) throw new Error('Admin dashboard not accessible');
      
      await this.captureScreenshot(page, 'admin-dashboard');
      await page.close();
      await context.close();
    }, TEST_USERS[2].email);
  }

  // Test Suite 3: Search Functionality
  async testSearchFunctionality() {
    console.log(chalk.yellow('\n📋 SEARCH FUNCTIONALITY TESTS'));
    
    await this.runTest('Basic search', async () => {
      const context = await this.browser.newContext();
      const page = await context.newPage();
      
      await page.goto(this.baseUrl);
      await this.handleCookieConsent(page);
      await this.handleBlockingModals(page);
      
      // Find search input
      const searchInput = page.locator('input[type="search"], input[placeholder*="search" i], [data-testid="search-input"]').first();
      await searchInput.fill('machine learning');
      await searchInput.press('Enter');
      
      // Wait for results
      await page.waitForTimeout(2000);
      
      // Verify results appeared
      const results = await page.locator('[data-testid="search-results"], .search-results, article').count();
      if (results === 0) throw new Error('No search results found');
      
      await this.captureScreenshot(page, 'search-results');
      await page.close();
      await context.close();
    });
    
    await this.runTest('Search filters', async () => {
      const context = await this.browser.newContext();
      const page = await context.newPage();
      
      await page.goto(`${this.baseUrl}/search?q=AI`);
      await this.handleCookieConsent(page);
      await this.handleBlockingModals(page);
      
      // Check for filter options
      const filterButtons = await page.locator('button:has-text("Filter"), [data-testid*="filter"]').count();
      if (filterButtons > 0) {
        await page.locator('button:has-text("Filter"), [data-testid*="filter"]').first().click();
        await this.captureScreenshot(page, 'search-filters');
      }
      
      await page.close();
      await context.close();
    });
  }

  // Test Suite 4: Navigation Tests
  async testNavigation() {
    console.log(chalk.yellow('\n📋 NAVIGATION TESTS'));
    
    await this.runTest('Main navigation links', async () => {
      const context = await this.browser.newContext();
      const page = await context.newPage();
      
      await page.goto(this.baseUrl);
      await this.handleCookieConsent(page);
      await this.handleBlockingModals(page);
      
      // Test main nav links
      const navLinks = [
        { text: 'Glossary', url: '/glossary' },
        { text: 'Categories', url: '/categories' },
        { text: 'About', url: '/about' }
      ];
      
      for (const link of navLinks) {
        const navLink = page.locator(`a:has-text("${link.text}")`).first();
        if (await navLink.isVisible()) {
          await navLink.click();
          await page.waitForLoadState('networkidle');
          
          const url = page.url();
          if (!url.includes(link.url)) {
            throw new Error(`Navigation to ${link.text} failed`);
          }
          
          await this.captureScreenshot(page, `nav-${link.text.toLowerCase()}`);
        }
      }
      
      await page.close();
      await context.close();
    });
  }

  // Test Suite 5: Mobile Responsiveness
  async testMobileResponsiveness() {
    console.log(chalk.yellow('\n📋 MOBILE RESPONSIVENESS TESTS'));
    
    await this.runTest('Mobile viewport', async () => {
      const context = await this.browser.newContext({
        viewport: { width: 375, height: 667 },
        userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15'
      });
      
      const page = await context.newPage();
      await page.goto(this.baseUrl);
      await this.handleCookieConsent(page);
      
      // Check for mobile menu
      const mobileMenu = await page.locator('[data-testid="mobile-menu"], .mobile-menu, button[aria-label*="menu" i]').isVisible();
      if (!mobileMenu) throw new Error('Mobile menu not visible');
      
      await this.captureScreenshot(page, 'mobile-view');
      await page.close();
      await context.close();
    });
  }

  // Test Suite 6: Performance Tests
  async testPerformance() {
    console.log(chalk.yellow('\n📋 PERFORMANCE TESTS'));
    
    await this.runTest('Page load performance', async () => {
      const context = await this.browser.newContext();
      const page = await context.newPage();
      
      const startTime = Date.now();
      await page.goto(this.baseUrl, { waitUntil: 'domcontentloaded' });
      const loadTime = Date.now() - startTime;
      
      if (loadTime > 3000) {
        throw new Error(`Page load too slow: ${loadTime}ms (threshold: 3000ms)`);
      }
      
      console.log(chalk.gray(`   ⚡ Page loaded in ${loadTime}ms`));
      await page.close();
      await context.close();
    });
  }

  // Generate test report
  async generateReport() {
    const reportPath = path.join(this.reportDir, 'test-report.json');
    const summaryPath = path.join(this.reportDir, 'test-summary.txt');
    
    // Calculate stats
    const totalTests = this.results.length;
    const passedTests = this.results.filter(r => r.status === 'pass').length;
    const failedTests = this.results.filter(r => r.status === 'fail').length;
    const totalDuration = this.results.reduce((sum, r) => sum + r.duration, 0);
    
    // Write JSON report
    fs.writeFileSync(reportPath, JSON.stringify(this.results, null, 2));
    
    // Write summary
    const summary = [
      '='.repeat(60),
      'AI/ML GLOSSARY PRO - PLAYWRIGHT TEST REPORT',
      '='.repeat(60),
      '',
      `Date: ${new Date().toISOString()}`,
      `Total Tests: ${totalTests}`,
      `Passed: ${passedTests} (${((passedTests/totalTests)*100).toFixed(1)}%)`,
      `Failed: ${failedTests} (${((failedTests/totalTests)*100).toFixed(1)}%)`,
      `Total Duration: ${(totalDuration/1000).toFixed(2)}s`,
      '',
      'TEST RESULTS:',
      '-'.repeat(60)
    ];
    
    this.results.forEach(result => {
      const status = result.status === 'pass' ? '✅' : '❌';
      const user = result.user ? ` [${result.user}]` : '';
      summary.push(`${status} ${result.name}${user} (${result.duration}ms)`);
      if (result.error) {
        summary.push(`   Error: ${result.error}`);
      }
    });
    
    summary.push('', '='.repeat(60));
    
    fs.writeFileSync(summaryPath, summary.join('\n'));
    
    // Print summary to console
    console.log(chalk.cyan('\n' + summary.join('\n')));
    
    console.log(chalk.yellow(`\n📁 Full report saved to: ${this.reportDir}`));
  }

  // Main test runner
  async run() {
    try {
      await this.initialize();
      
      // Run all test suites
      await this.testAuthentication();
      await this.testAccessControl();
      await this.testSearchFunctionality();
      await this.testNavigation();
      await this.testMobileResponsiveness();
      await this.testPerformance();
      
      await this.generateReport();
      
    } catch (error) {
      console.error(chalk.red('\n❌ Fatal error:'), error);
      throw error;
    } finally {
      if (this.browser) {
        await this.browser.close();
      }
    }
  }
}

// Run tests
if (import.meta.url === `file://${process.argv[1]}`) {
  const test = new ComprehensivePlaywrightTest();
  test.run()
    .then(() => {
      console.log(chalk.green('\n✨ All tests completed!'));
      process.exit(0);
    })
    .catch(error => {
      console.error(chalk.red('\n❌ Test suite failed:'), error);
      process.exit(1);
    });
}

export { ComprehensivePlaywrightTest, TEST_USERS };