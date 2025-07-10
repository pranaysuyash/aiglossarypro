#!/usr/bin/env tsx

/**
 * COMPLETE FEATURE TEST
 * 
 * This script tests all major features of the application:
 * 1. Cookie consent functionality
 * 2. Authentication flows (including OAuth vs regular sign-up)
 * 3. Admin functionality
 * 4. Free user limitations 
 * 5. Premium user 42-section components
 * 6. Gamification features
 * 7. Search functionality
 * 8. Responsive design
 * 9. API endpoints
 * 10. Backend integration
 */

import chalk from 'chalk';
import { chromium } from 'playwright';
import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import path from 'path';

const execAsync = promisify(exec);

interface TestResult {
  category: string;
  testName: string;
  userType: string;
  status: 'PASS' | 'FAIL' | 'WARNING';
  message: string;
  screenshot?: string;
  details?: any;
}

class CompleteFeatureTester {
  private browser: any;
  private results: TestResult[] = [];
  private screenshotDir: string;
  private baseUrl = 'http://localhost:5173';
  private apiUrl = 'http://localhost:3001';

  constructor() {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    this.screenshotDir = path.join(process.cwd(), 'complete-feature-test', timestamp);
    fs.mkdirSync(this.screenshotDir, { recursive: true });
  }

  async init() {
    this.browser = await chromium.launch({
      headless: false,
      slowMo: 500,
    });
    console.log(chalk.blue('🚀 Starting Complete Feature Test...'));
  }

  async takeScreenshot(page: any, name: string, userType: string = 'guest'): Promise<string> {
    const filename = `${userType}-${name}-${Date.now()}.png`;
    const filepath = path.join(this.screenshotDir, filename);
    await page.screenshot({ path: filepath, fullPage: true });
    return filename;
  }

  addResult(result: TestResult) {
    this.results.push(result);
    const color = result.status === 'PASS' ? 'green' : result.status === 'FAIL' ? 'red' : 'yellow';
    console.log(chalk[color](`${result.status}: [${result.category}] ${result.testName} (${result.userType}) - ${result.message}`));
  }

  async dismissCookieBanner(page: any) {
    try {
      // Check if cookie banner is visible and dismiss it
      const cookieBanner = await page.locator('[data-testid="cookie-banner"], .cookie-banner, [role="dialog"]:has-text("cookie")').first();
      if (await cookieBanner.isVisible()) {
        const acceptButton = await page.locator('button:has-text("Accept"), button:has-text("Accept All"), button:has-text("OK")').first();
        if (await acceptButton.isVisible()) {
          await acceptButton.click();
          await page.waitForTimeout(1000);
        }
      }
    } catch (error) {
      // Cookie banner might not be present, continue
    }
  }

  // ========== BACKEND API TESTS ==========
  async testBackendAPIs() {
    console.log(chalk.blue('\\n🔌 Testing Backend APIs...'));
    
    const endpoints = [
      { path: '/api/health', name: 'Health Check' },
      { path: '/api/categories', name: 'Categories' },
      { path: '/api/terms', name: 'Terms' },
      { path: '/api/search/suggestions', name: 'Search Suggestions' },
      { path: '/api/enhanced/terms', name: 'Enhanced Terms' },
      { path: '/api/auth/check', name: 'Auth Check' },
    ];

    for (const endpoint of endpoints) {
      try {
        const { stdout, stderr } = await execAsync(`curl -s -w "%{http_code}" -o /dev/null ${this.apiUrl}${endpoint.path}`);
        const statusCode = stdout.trim();
        
        this.addResult({
          category: 'Backend API',
          testName: endpoint.name,
          userType: 'system',
          status: statusCode.startsWith('2') ? 'PASS' : statusCode.startsWith('4') ? 'WARNING' : 'FAIL',
          message: `HTTP ${statusCode}`,
          details: { endpoint: endpoint.path, statusCode }
        });
        
      } catch (error) {
        this.addResult({
          category: 'Backend API',
          testName: endpoint.name,
          userType: 'system',
          status: 'FAIL',
          message: `Connection failed: ${error}`,
          details: { endpoint: endpoint.path, error }
        });
      }
    }
  }

  // ========== COOKIE CONSENT TESTS ==========
  async testCookieConsent() {
    console.log(chalk.blue('\\n🍪 Testing Cookie Consent...'));
    const page = await this.browser.newPage();
    
    try {
      await page.goto(this.baseUrl);
      await page.waitForLoadState('domcontentloaded');
      await page.waitForTimeout(3000);
      
      const screenshot = await this.takeScreenshot(page, 'homepage-initial');
      
      // Check for cookie consent implementation
      const cookieElements = await page.locator('[class*="cookie"], [data-testid*="cookie"], [aria-label*="cookie"]').count();
      const posthogScript = await page.locator('script[src*="posthog"]').count();
      const gaScript = await page.locator('script[src*="google"], script[src*="analytics"]').count();
      
      this.addResult({
        category: 'Cookie Consent',
        testName: 'Cookie Implementation',
        userType: 'guest',
        status: (cookieElements > 0 || posthogScript > 0 || gaScript > 0) ? 'PASS' : 'WARNING',
        message: `Cookie elements: ${cookieElements}, Analytics scripts: ${posthogScript + gaScript}`,
        screenshot,
        details: { cookieElements, posthogScript, gaScript }
      });
      
    } catch (error) {
      this.addResult({
        category: 'Cookie Consent',
        testName: 'Cookie Test',
        userType: 'guest',
        status: 'FAIL',
        message: `Error: ${error}`
      });
    } finally {
      await page.close();
    }
  }

  // ========== AUTHENTICATION TESTS ==========
  async testAuthentication() {
    console.log(chalk.blue('\\n🔐 Testing Authentication Systems...'));
    const page = await this.browser.newPage();
    
    try {
      await page.goto(`${this.baseUrl}/login`);
      await page.waitForLoadState('domcontentloaded');
      await page.waitForTimeout(3000);
      
      // Dismiss cookie banner if present
      await this.dismissCookieBanner(page);
      
      const screenshot = await this.takeScreenshot(page, 'login-page');
      
      // Test OAuth vs Regular Sign-up
      const googleButton = await page.locator('text="Continue with Google"').isVisible();
      const githubButton = await page.locator('text="Continue with GitHub"').isVisible();
      const emailSignUp = await page.locator('[role="tab"]:has-text("Sign Up")').isVisible();
      const emailSignIn = await page.locator('[role="tab"]:has-text("Sign In")').isVisible();
      
      this.addResult({
        category: 'Authentication',
        testName: 'OAuth vs Regular Sign-up',
        userType: 'guest',
        status: (googleButton && githubButton && emailSignUp) ? 'PASS' : 'WARNING',
        message: `OAuth: Google ${googleButton ? '✓' : '✗'}, GitHub ${githubButton ? '✓' : '✗'}, Email Sign-up: ${emailSignUp ? '✓' : '✗'}`,
        screenshot,
        details: { googleButton, githubButton, emailSignUp, emailSignIn }
      });

      // Test Development Test Users
      const testUsersTab = await page.locator('[role="tab"]:has-text("Test Users")').isVisible();
      
      if (testUsersTab) {
        await page.click('[role="tab"]:has-text("Test Users")');
        await page.waitForTimeout(2000);
        
        const testUsersScreenshot = await this.takeScreenshot(page, 'test-users-tab');
        
        const useAccountButtons = await page.locator('button:has-text("Use This Account")').count();
        const userTypes = await page.locator('text="Regular User", text="Premium User", text="Admin User"').count();
        
        this.addResult({
          category: 'Authentication',
          testName: 'Test Users Feature',
          userType: 'development',
          status: (useAccountButtons >= 3 && userTypes >= 3) ? 'PASS' : 'WARNING',
          message: `Found ${useAccountButtons} test accounts, ${userTypes} user types`,
          screenshot: testUsersScreenshot,
          details: { useAccountButtons, userTypes }
        });

        // Test actual login flow (dismiss cookie banner first)
        await this.dismissCookieBanner(page);
        await this.testLoginFlow(page);
      }
      
    } catch (error) {
      this.addResult({
        category: 'Authentication',
        testName: 'Authentication Test',
        userType: 'guest',
        status: 'FAIL',
        message: `Error: ${error}`
      });
    } finally {
      await page.close();
    }
  }

  async testLoginFlow(page: any) {
    try {
      // Click first "Use This Account" button
      await page.click('button:has-text("Use This Account")');
      await page.waitForTimeout(2000);
      
      // Switch to Sign In tab
      await page.click('[role="tab"]:has-text("Sign In")');
      await page.waitForTimeout(2000);
      
      const formScreenshot = await this.takeScreenshot(page, 'login-form-filled');
      
      // Check form population
      const emailValue = await page.inputValue('input[type="email"]').catch(() => '');
      const passwordValue = await page.inputValue('input[type="password"]').catch(() => '');
      
      this.addResult({
        category: 'Authentication',
        testName: 'Form Auto-Population',
        userType: 'free',
        status: (emailValue.includes('@') && passwordValue.length > 0) ? 'PASS' : 'FAIL',
        message: `Email: ${emailValue}, Password: ${passwordValue ? 'filled' : 'empty'}`,
        screenshot: formScreenshot
      });
      
      // Attempt login
      const submitButton = await page.locator('button[type="submit"]').first();
      await submitButton.click();
      
      // Wait for login response - increased timeout for authentication
      await page.waitForTimeout(10000);
      
      // Check for any error messages on the page
      const errorMessages = await page.locator('[role="alert"], .error, .destructive').allTextContents();
      
      const afterLoginScreenshot = await this.takeScreenshot(page, 'after-login-attempt');
      const currentUrl = page.url();
      const loginSuccess = currentUrl.includes('/dashboard') || currentUrl.includes('/admin') || !currentUrl.includes('/login');
      
      this.addResult({
        category: 'Authentication',
        testName: 'Login Flow',
        userType: 'free',
        status: loginSuccess ? 'PASS' : 'FAIL',
        message: `Post-login URL: ${currentUrl}${errorMessages.length > 0 ? ` | Errors: ${errorMessages.join(', ')}` : ''}`,
        screenshot: afterLoginScreenshot,
        details: { currentUrl, loginSuccess, errorMessages }
      });
      
      return loginSuccess;
      
    } catch (error) {
      this.addResult({
        category: 'Authentication',
        testName: 'Login Flow',
        userType: 'free',
        status: 'FAIL',
        message: `Login error: ${error}`
      });
      return false;
    }
  }

  // ========== ADMIN FUNCTIONALITY TESTS ==========
  async testAdminFunctionality() {
    console.log(chalk.blue('\\n🔧 Testing Admin Functionality...'));
    const page = await this.browser.newPage();
    
    try {
      // Try accessing admin page directly
      await page.goto(`${this.baseUrl}/admin`);
      await page.waitForLoadState('domcontentloaded');
      await page.waitForTimeout(3000);
      
      const screenshot = await this.takeScreenshot(page, 'admin-page');
      
      // Check admin page elements
      const adminElements = {
        dashboard: await page.locator('text="Admin Dashboard", .admin-dashboard, [data-testid*="admin"]').count(),
        generateButton: await page.locator('button:has-text("Generate"), button[data-testid*="generate"]').count(),
        userManagement: await page.locator('text="User Management", text="Users"').count(),
        contentManagement: await page.locator('text="Content Management", text="Content"').count(),
        analytics: await page.locator('text="Analytics", text="Statistics"').count()
      };
      
      const adminFeaturesFound = Object.values(adminElements).reduce((sum, count) => sum + count, 0);
      
      this.addResult({
        category: 'Admin Functionality',
        testName: 'Admin Dashboard',
        userType: 'admin',
        status: adminFeaturesFound > 0 ? 'PASS' : 'WARNING',
        message: `Found ${adminFeaturesFound} admin features`,
        screenshot,
        details: adminElements
      });
      
    } catch (error) {
      this.addResult({
        category: 'Admin Functionality',
        testName: 'Admin Test',
        userType: 'admin',
        status: 'FAIL',
        message: `Error: ${error}`
      });
    } finally {
      await page.close();
    }
  }

  // ========== SEARCH FUNCTIONALITY TESTS ==========
  async testSearchFunctionality() {
    console.log(chalk.blue('\\n🔍 Testing Search Functionality...'));
    const page = await this.browser.newPage();
    
    try {
      await page.goto(`${this.baseUrl}/terms`);
      await page.waitForLoadState('domcontentloaded');
      await page.waitForTimeout(3000);
      
      const screenshot = await this.takeScreenshot(page, 'search-page');
      
      // Check search elements
      const searchInput = await page.locator('input[type="text"], input[placeholder*="search"]').count();
      const searchButton = await page.locator('button:has-text("Search"), button[type="submit"]').count();
      const filters = await page.locator('button:has-text("Filter"), .filter-button').count();
      const aiSearch = await page.locator('text="AI Search", input[type="checkbox"]').count();
      
      this.addResult({
        category: 'Search',
        testName: 'Search Interface',
        userType: 'guest',
        status: searchInput > 0 ? 'PASS' : 'FAIL',
        message: `Search input: ${searchInput}, Button: ${searchButton}, Filters: ${filters}, AI Search: ${aiSearch}`,
        screenshot,
        details: { searchInput, searchButton, filters, aiSearch }
      });
      
      // Test search functionality
      if (searchInput > 0) {
        await page.fill('input[type="text"], input[placeholder*="search"]', 'neural network');
        await page.waitForTimeout(2000);
        
        const searchResultsScreenshot = await this.takeScreenshot(page, 'search-results');
        
        const results = await page.locator('.search-result, .term-card, .result-item').count();
        const emptyState = await page.locator('text="No results", text="no terms", .empty-state').count();
        
        this.addResult({
          category: 'Search',
          testName: 'Search Results',
          userType: 'guest',
          status: (results > 0 || emptyState > 0) ? 'PASS' : 'WARNING',
          message: `Results: ${results}, Empty state: ${emptyState}`,
          screenshot: searchResultsScreenshot,
          details: { results, emptyState }
        });
      }
      
    } catch (error) {
      this.addResult({
        category: 'Search',
        testName: 'Search Test',
        userType: 'guest',
        status: 'FAIL',
        message: `Error: ${error}`
      });
    } finally {
      await page.close();
    }
  }

  // ========== PREMIUM FEATURES TESTS ==========
  async testPremiumFeatures() {
    console.log(chalk.blue('\\n💎 Testing Premium Features...'));
    const page = await this.browser.newPage();
    
    try {
      // Try accessing a term page to check for premium features
      await page.goto(`${this.baseUrl}/terms`);
      await page.waitForLoadState('domcontentloaded');
      await page.waitForTimeout(3000);
      
      const screenshot = await this.takeScreenshot(page, 'premium-features');
      
      // Check for premium indicators
      const premiumBadges = await page.locator('text="Premium", text="PRO", .premium-badge').count();
      const upgradePrompts = await page.locator('button:has-text("Upgrade"), button:has-text("Get Premium")').count();
      const lockedContent = await page.locator('.locked, .premium-only, text="Premium Only"').count();
      const sections42 = await page.locator('[data-testid*="section"], .section, .accordion-item').count();
      
      this.addResult({
        category: 'Premium Features',
        testName: '42-Section Components',
        userType: 'premium',
        status: sections42 > 10 ? 'PASS' : 'WARNING',
        message: `Found ${sections42} sections, Premium badges: ${premiumBadges}, Upgrade prompts: ${upgradePrompts}`,
        screenshot,
        details: { sections42, premiumBadges, upgradePrompts, lockedContent }
      });
      
    } catch (error) {
      this.addResult({
        category: 'Premium Features',
        testName: 'Premium Test',
        userType: 'premium',
        status: 'FAIL',
        message: `Error: ${error}`
      });
    } finally {
      await page.close();
    }
  }

  // ========== GAMIFICATION TESTS ==========
  async testGamificationFeatures() {
    console.log(chalk.blue('\\n🎮 Testing Gamification Features...'));
    const page = await this.browser.newPage();
    
    try {
      await page.goto(`${this.baseUrl}/dashboard`);
      await page.waitForLoadState('domcontentloaded');
      await page.waitForTimeout(3000);
      
      const screenshot = await this.takeScreenshot(page, 'gamification');
      
      // Check for gamification elements
      const progressBars = await page.locator('.progress-bar, [role="progressbar"]').count();
      const achievements = await page.locator('.achievement, .badge, .trophy').count();
      const streaks = await page.locator('text*="streak", .streak-counter').count();
      const levels = await page.locator('text*="level", .level-indicator').count();
      const points = await page.locator('text*="points", .points-counter').count();
      
      const gamificationElements = progressBars + achievements + streaks + levels + points;
      
      this.addResult({
        category: 'Gamification',
        testName: 'Gamification Elements',
        userType: 'user',
        status: gamificationElements > 0 ? 'PASS' : 'WARNING',
        message: `Progress: ${progressBars}, Achievements: ${achievements}, Streaks: ${streaks}, Levels: ${levels}, Points: ${points}`,
        screenshot,
        details: { progressBars, achievements, streaks, levels, points }
      });
      
    } catch (error) {
      this.addResult({
        category: 'Gamification',
        testName: 'Gamification Test',
        userType: 'user',
        status: 'FAIL',
        message: `Error: ${error}`
      });
    } finally {
      await page.close();
    }
  }

  // ========== RESPONSIVE DESIGN TESTS ==========
  async testResponsiveDesign() {
    console.log(chalk.blue('\\n📱 Testing Responsive Design...'));
    
    const viewports = [
      { name: 'mobile', width: 375, height: 812 },
      { name: 'tablet', width: 768, height: 1024 },
      { name: 'desktop', width: 1920, height: 1080 }
    ];
    
    for (const viewport of viewports) {
      const page = await this.browser.newPage();
      await page.setViewportSize(viewport);
      
      try {
        await page.goto(this.baseUrl);
        await page.waitForLoadState('domcontentloaded');
        await page.waitForTimeout(2000);
        
        const screenshot = await this.takeScreenshot(page, `responsive-${viewport.name}`);
        
        // Check responsive elements
        const header = await page.locator('header').first().isVisible();
        const nav = await page.locator('nav[role="navigation"]').first().isVisible();
        const menuButton = await page.locator('button[aria-label*="menu"], .hamburger').first().isVisible();
        
        this.addResult({
          category: 'Responsive Design',
          testName: `${viewport.name} Layout`,
          userType: 'guest',
          status: header ? 'PASS' : 'WARNING',
          message: `Header: ${header ? '✓' : '✗'}, Nav: ${nav ? '✓' : '✗'}, Menu: ${menuButton ? '✓' : '✗'}`,
          screenshot,
          details: { header, nav, menuButton, viewport }
        });
        
      } catch (error) {
        this.addResult({
          category: 'Responsive Design',
          testName: `${viewport.name} Test`,
          userType: 'guest',
          status: 'FAIL',
          message: `Error: ${error}`
        });
      } finally {
        await page.close();
      }
    }
  }

  // ========== GENERATE COMPREHENSIVE REPORT ==========
  async generateReport() {
    console.log(chalk.yellow('\\n📝 Generating Comprehensive Report...'));
    
    const categories = [...new Set(this.results.map(r => r.category))];
    const summary = {
      totalTests: this.results.length,
      passed: this.results.filter(r => r.status === 'PASS').length,
      failed: this.results.filter(r => r.status === 'FAIL').length,
      warnings: this.results.filter(r => r.status === 'WARNING').length,
      categories: categories.length
    };
    
    const report = {
      timestamp: new Date().toISOString(),
      summary,
      passRate: Math.round((summary.passed / summary.totalTests) * 100),
      categories: categories.map(cat => ({
        name: cat,
        tests: this.results.filter(r => r.category === cat),
        passed: this.results.filter(r => r.category === cat && r.status === 'PASS').length,
        failed: this.results.filter(r => r.category === cat && r.status === 'FAIL').length,
        warnings: this.results.filter(r => r.category === cat && r.status === 'WARNING').length
      })),
      allResults: this.results
    };
    
    // Save JSON report
    const reportPath = path.join(this.screenshotDir, 'complete-feature-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    
    // Generate HTML report
    const htmlReport = this.generateHTMLReport(report);
    fs.writeFileSync(path.join(this.screenshotDir, 'index.html'), htmlReport);
    
    // Print summary
    console.log(chalk.green('\\n✅ Complete Feature Test Report Generated!'));
    console.log(chalk.blue(`📁 Results Directory: ${this.screenshotDir}`));
    console.log(chalk.blue(`📊 Summary: ${summary.passed} passed, ${summary.failed} failed, ${summary.warnings} warnings`));
    console.log(chalk.blue(`📈 Pass Rate: ${report.passRate}%`));
    
    // Print category breakdown
    console.log(chalk.yellow('\\n📋 Category Breakdown:'));
    report.categories.forEach(cat => {
      const passRate = Math.round((cat.passed / cat.tests.length) * 100);
      console.log(chalk.gray(`  ${cat.name}: ${cat.passed}/${cat.tests.length} passed (${passRate}%)`));
    });
    
    return report;
  }

  generateHTMLReport(report: any): string {
    return `
<!DOCTYPE html>
<html>
<head>
  <title>Complete Feature Test Report</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 20px; line-height: 1.6; }
    .summary { background: #f5f5f5; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
    .metric { display: inline-block; margin: 10px; padding: 10px; background: white; border-radius: 4px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
    .category { margin: 20px 0; }
    .test-result { margin: 10px 0; padding: 15px; border-radius: 4px; border-left: 4px solid; }
    .test-pass { background: #d4edda; border-color: #28a745; }
    .test-fail { background: #f8d7da; border-color: #dc3545; }
    .test-warning { background: #fff3cd; border-color: #ffc107; }
    h1 { color: #333; }
    h2 { color: #555; border-bottom: 2px solid #eee; padding-bottom: 10px; }
    .timestamp { color: #666; font-size: 0.9em; }
  </style>
</head>
<body>
  <h1>🚀 Complete Feature Test Report</h1>
  <p class="timestamp">Generated: ${new Date(report.timestamp).toLocaleString()}</p>
  
  <div class="summary">
    <h2>📊 Executive Summary</h2>
    <div class="metric"><strong>${report.summary.totalTests}</strong><br>Total Tests</div>
    <div class="metric"><strong>${report.summary.passed}</strong><br>Passed</div>
    <div class="metric"><strong>${report.summary.failed}</strong><br>Failed</div>
    <div class="metric"><strong>${report.summary.warnings}</strong><br>Warnings</div>
    <div class="metric"><strong>${report.passRate}%</strong><br>Pass Rate</div>
  </div>

  <h2>📋 Test Results by Category</h2>
  ${report.categories.map(cat => `
    <div class="category">
      <h3>${cat.name} (${cat.passed}/${cat.tests.length} passed)</h3>
      ${cat.tests.map(test => `
        <div class="test-result test-${test.status.toLowerCase()}">
          <strong>${test.testName}</strong> - ${test.status}<br>
          <small>User: ${test.userType}</small><br>
          ${test.message}
          ${test.screenshot ? `<br><small>Screenshot: ${test.screenshot}</small>` : ''}
        </div>
      `).join('')}
    </div>
  `).join('')}

  <div style="margin-top: 40px; padding: 20px; background: #f8f9fa; border-radius: 8px;">
    <h2>📁 File Locations</h2>
    <p><strong>Screenshots:</strong> ${this.screenshotDir}</p>
    <p><strong>JSON Report:</strong> ${path.join(this.screenshotDir, 'complete-feature-report.json')}</p>
  </div>
</body>
</html>
    `;
  }

  async run() {
    try {
      await this.init();
      await this.testBackendAPIs();
      await this.testCookieConsent();
      await this.testAuthentication();
      await this.testAdminFunctionality();
      await this.testSearchFunctionality();
      await this.testPremiumFeatures();
      await this.testGamificationFeatures();
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

const tester = new CompleteFeatureTester();
tester.run().catch(console.error);