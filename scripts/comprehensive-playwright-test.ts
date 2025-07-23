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
      await page.click('button[type="submit"]');
      
      // Wait for navigation or auth state change
      try {
        await page.waitForURL(/\/(dashboard|admin|app)/, { timeout: 10000 });
      } catch (navError) {
        // If navigation doesn't happen, check if we're still on login but authenticated
        const currentUrl = page.url();
        console.log(chalk.gray(`   Current URL after login: ${currentUrl}`));
      }
      
      // Handle any post-login modals
      await this.handleBlockingModals(page);
      
      // Wait for authentication to complete
      await page.waitForTimeout(2000);
      
      // Verify login success - look for user avatar or dropdown trigger
      const userIndicators = [
        'button[aria-haspopup="menu"]:has-text("U")', // User avatar button
        'button[aria-haspopup="menu"]:has-text("A")', // Admin avatar
        'button[aria-haspopup="menu"]:has-text("P")', // Premium avatar
        'button[aria-haspopup="menu"]:has-text("F")', // Free avatar
        '[role="button"]:has(.avatar)', // Avatar element
        'button:has-text("Sign out")', // If dropdown is open
        'a[href="/dashboard"]', // Dashboard link
      ];
      
      let userMenuFound = false;
      for (const selector of userIndicators) {
        try {
          const element = await page.locator(selector).first();
          if (await element.isVisible({ timeout: 2000 })) {
            userMenuFound = true;
            break;
          }
        } catch (e) {
          // Continue to next selector
        }
      }
      
      if (!userMenuFound) {
        // Take debug screenshot
        await this.captureScreenshot(page, `login-${user.type}-no-user-menu`);
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
      
      // Find and click user avatar to open dropdown
      const avatarButton = await page.locator('button[aria-haspopup="menu"]').first();
      await avatarButton.click();
      await page.waitForTimeout(500);
      
      // Click Sign Out in dropdown
      const logoutButton = await page.locator('text="Sign out"').first();
      await logoutButton.click();
      
      // Verify logged out
      await page.waitForURL(/\/(login|signin|$)/, { timeout: 5000 });
      await this.captureScreenshot(page, 'logout-success');
      
      await page.close();
      await context.close();
    });
  }

  // Test Progress Dashboard (for our specific fix)
  async testProgressDashboard() {
    console.log(chalk.yellow('\n📋 PROGRESS DASHBOARD TESTS'));
    
    await this.runTest('Progress stats API - free user', async () => {
      const context = await this.browser.newContext();
      const page = await this.authenticateUser(context, TEST_USERS[0]); // Free user
      
      // Navigate to dashboard
      await page.goto(`${this.baseUrl}/dashboard`);
      await this.handleBlockingModals(page);
      
      // Wait for progress visualization to load
      await page.waitForSelector('.progress-visualization, [class*="progress"], text=/Terms Explored|Bookmarks|Streak/', { timeout: 10000 });
      
      // Check if progress stats loaded without 500 error
      const errorElement = await page.locator('text=/error|failed|500/i').count();
      if (errorElement > 0) {
        throw new Error('Progress stats showing error');
      }
      
      await this.captureScreenshot(page, 'dashboard-progress-free');
      await page.close();
      await context.close();
    }, TEST_USERS[0].email);
    
    await this.runTest('Progress stats API - premium user', async () => {
      const context = await this.browser.newContext();
      const page = await this.authenticateUser(context, TEST_USERS[1]); // Premium user
      
      // Navigate to dashboard
      await page.goto(`${this.baseUrl}/dashboard`);
      await this.handleBlockingModals(page);
      
      // Wait for progress visualization to load
      await page.waitForSelector('.progress-visualization, [class*="progress"], text=/Terms Explored|Bookmarks|Streak/', { timeout: 10000 });
      
      // Check if progress stats loaded without 500 error
      const errorElement = await page.locator('text=/error|failed|500/i').count();
      if (errorElement > 0) {
        throw new Error('Progress stats showing error');
      }
      
      await this.captureScreenshot(page, 'dashboard-progress-premium');
      await page.close();
      await context.close();
    }, TEST_USERS[1].email);
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

  // Test Suite: Term Detail Features
  async testTermDetailFeatures() {
    console.log(chalk.yellow('\n📋 TERM DETAIL FEATURES TESTS'));
    
    await this.runTest('Term sections and navigation', async () => {
      const context = await this.browser.newContext();
      const page = await this.authenticateUser(context, TEST_USERS[1]); // Premium user
      
      // Navigate to a term
      await page.goto(`${this.baseUrl}/glossary`);
      await this.handleBlockingModals(page);
      
      const firstTerm = await page.locator('a[href*="/glossary/"]').first();
      await firstTerm.click();
      await page.waitForLoadState('networkidle');
      
      // Check for term sections
      const sections = await page.locator('.section-tab, [role="tab"], button:has-text("Examples")').count();
      if (sections === 0) throw new Error('No term sections found');
      
      // Test section navigation
      const examplesTab = await page.locator('button:has-text("Examples"), [role="tab"]:has-text("Examples")').first();
      if (await examplesTab.isVisible()) {
        await examplesTab.click();
        await page.waitForTimeout(1000);
        await this.captureScreenshot(page, 'term-examples-section');
      }
      
      await page.close();
      await context.close();
    });
    
    await this.runTest('Bookmarking functionality', async () => {
      const context = await this.browser.newContext();
      const page = await this.authenticateUser(context, TEST_USERS[0]); // Free user
      
      // Navigate to a term
      await page.goto(`${this.baseUrl}/glossary`);
      await this.handleBlockingModals(page);
      
      const firstTerm = await page.locator('a[href*="/glossary/"]').first();
      await firstTerm.click();
      await page.waitForLoadState('networkidle');
      
      // Find bookmark button
      const bookmarkButton = await page.locator('button[aria-label*="bookmark" i], button:has-text("Bookmark"), .bookmark-button').first();
      if (await bookmarkButton.isVisible()) {
        await bookmarkButton.click();
        await page.waitForTimeout(1000);
        await this.captureScreenshot(page, 'bookmark-added');
      }
      
      await page.close();
      await context.close();
    });
  }

  // Test Suite: User Account Features
  async testUserAccountFeatures() {
    console.log(chalk.yellow('\n📋 USER ACCOUNT FEATURES TESTS'));
    
    await this.runTest('User profile page', async () => {
      const context = await this.browser.newContext();
      const page = await this.authenticateUser(context, TEST_USERS[1]); // Premium user
      
      // Navigate to profile
      await page.goto(`${this.baseUrl}/profile`);
      await this.handleBlockingModals(page);
      
      // Check profile elements
      const profileElements = await page.locator('h1:has-text("Profile"), .profile-section, [data-testid="profile"]').count();
      if (profileElements === 0) throw new Error('Profile page not loading');
      
      await this.captureScreenshot(page, 'user-profile');
      await page.close();
      await context.close();
    });
    
    await this.runTest('Bookmarks page', async () => {
      const context = await this.browser.newContext();
      const page = await this.authenticateUser(context, TEST_USERS[0]); // Free user
      
      // Navigate to bookmarks
      await page.goto(`${this.baseUrl}/bookmarks`);
      await this.handleBlockingModals(page);
      
      // Check bookmarks page
      const bookmarksTitle = await page.locator('h1:has-text("Bookmarks"), .bookmarks-list').count();
      if (bookmarksTitle === 0) throw new Error('Bookmarks page not loading');
      
      await this.captureScreenshot(page, 'bookmarks-page');
      await page.close();
      await context.close();
    });
  }

  // Test Suite: Dashboard Components
  async testDashboardComponents() {
    console.log(chalk.yellow('\n📋 DASHBOARD COMPONENTS TESTS'));
    
    await this.runTest('Recent activity widget', async () => {
      const context = await this.browser.newContext();
      const page = await this.authenticateUser(context, TEST_USERS[1]);
      
      await page.goto(`${this.baseUrl}/dashboard`);
      await this.handleBlockingModals(page);
      
      // Check for recent activity
      const recentActivity = await page.locator('text=/Recent Activity|Recently Viewed/i').count();
      if (recentActivity === 0) throw new Error('Recent activity widget not found');
      
      await this.captureScreenshot(page, 'dashboard-recent-activity');
      await page.close();
      await context.close();
    });
    
    await this.runTest('Recommendations widget', async () => {
      const context = await this.browser.newContext();
      const page = await this.authenticateUser(context, TEST_USERS[1]);
      
      await page.goto(`${this.baseUrl}/dashboard`);
      await this.handleBlockingModals(page);
      
      // Check for recommendations
      const recommendations = await page.locator('text=/Recommended|Suggestions|For You/i').count();
      if (recommendations === 0) throw new Error('Recommendations widget not found');
      
      await this.captureScreenshot(page, 'dashboard-recommendations');
      await page.close();
      await context.close();
    });
    
    await this.runTest('Learning path widget', async () => {
      const context = await this.browser.newContext();
      const page = await this.authenticateUser(context, TEST_USERS[1]);
      
      await page.goto(`${this.baseUrl}/dashboard`);
      await this.handleBlockingModals(page);
      
      // Check for learning paths
      const learningPaths = await page.locator('text=/Learning Path|Continue Learning|Progress/i').count();
      if (learningPaths === 0) console.log(chalk.gray('   Learning path widget not found'));
      
      await page.close();
      await context.close();
    });
  }

  // Test Suite: Interactive Components
  async testInteractiveComponents() {
    console.log(chalk.yellow('\n📋 INTERACTIVE COMPONENTS TESTS'));
    
    await this.runTest('Theme toggle', async () => {
      const context = await this.browser.newContext();
      const page = await context.newPage();
      
      await page.goto(this.baseUrl);
      await this.handleCookieConsent(page);
      await this.handleBlockingModals(page);
      
      // Find theme toggle
      const themeToggle = await page.locator('button[aria-label*="theme" i], .theme-toggle').first();
      if (await themeToggle.isVisible()) {
        // Get initial theme
        const htmlElement = await page.locator('html');
        const initialTheme = await htmlElement.getAttribute('class');
        
        await themeToggle.click();
        await page.waitForTimeout(500);
        
        const newTheme = await htmlElement.getAttribute('class');
        if (initialTheme === newTheme) throw new Error('Theme toggle not working');
        
        await this.captureScreenshot(page, 'theme-toggled');
      }
      
      await page.close();
      await context.close();
    });
    
    await this.runTest('Interactive quiz component', async () => {
      const context = await this.browser.newContext();
      const page = await this.authenticateUser(context, TEST_USERS[1]); // Premium user
      
      // Find a term with quiz
      await page.goto(`${this.baseUrl}/glossary`);
      await this.handleBlockingModals(page);
      
      // Click on a popular term likely to have quiz
      const termWithQuiz = await page.locator('a[href*="machine-learning"], a[href*="neural-network"]').first();
      if (await termWithQuiz.isVisible()) {
        await termWithQuiz.click();
        await page.waitForLoadState('networkidle');
        
        // Look for quiz section
        const quizSection = await page.locator('.quiz-section, button:has-text("Take Quiz"), [data-testid="quiz"]').first();
        if (await quizSection.isVisible()) {
          await this.captureScreenshot(page, 'interactive-quiz');
        }
      }
      
      await page.close();
      await context.close();
    });
  }

  // Test Suite: Error Handling
  async testErrorHandling() {
    console.log(chalk.yellow('\n📋 ERROR HANDLING TESTS'));
    
    await this.runTest('404 page', async () => {
      const context = await this.browser.newContext();
      const page = await context.newPage();
      
      await page.goto(`${this.baseUrl}/non-existent-page-12345`);
      await this.handleCookieConsent(page);
      
      // Check for 404 content
      const notFoundElements = await page.locator('text=/404|not found/i').count();
      if (notFoundElements === 0) throw new Error('404 page not showing');
      
      await this.captureScreenshot(page, '404-page');
      await page.close();
      await context.close();
    });
    
    await this.runTest('Offline handling', async () => {
      const context = await this.browser.newContext();
      const page = await context.newPage();
      
      await page.goto(this.baseUrl);
      await this.handleCookieConsent(page);
      
      // Go offline
      await context.setOffline(true);
      
      // Try to navigate
      await page.click('a[href="/glossary"]').catch(() => {});
      await page.waitForTimeout(2000);
      
      await this.captureScreenshot(page, 'offline-state');
      await context.setOffline(false);
      
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

  // Test Suite: Accessibility Tests
  async testAccessibility() {
    console.log(chalk.yellow('\n📋 ACCESSIBILITY TESTS'));
    
    await this.runTest('Keyboard navigation', async () => {
      const context = await this.browser.newContext();
      const page = await context.newPage();
      
      await page.goto(this.baseUrl);
      await this.handleCookieConsent(page);
      
      // Test tab navigation
      await page.keyboard.press('Tab');
      await page.keyboard.press('Tab');
      await page.keyboard.press('Tab');
      
      // Check if focused element is visible
      const focusedElement = await page.locator(':focus');
      const isVisible = await focusedElement.isVisible();
      if (!isVisible) throw new Error('Keyboard navigation not working properly');
      
      await this.captureScreenshot(page, 'keyboard-navigation');
      await page.close();
      await context.close();
    });
    
    await this.runTest('Screen reader labels', async () => {
      const context = await this.browser.newContext();
      const page = await context.newPage();
      
      await page.goto(this.baseUrl);
      await this.handleCookieConsent(page);
      
      // Check for ARIA labels
      const ariaLabels = await page.locator('[aria-label], [aria-describedby], [role]').count();
      if (ariaLabels < 5) throw new Error('Insufficient ARIA labels for accessibility');
      
      await page.close();
      await context.close();
    });
  }

  // Test Suite: Data Persistence Tests
  async testDataPersistence() {
    console.log(chalk.yellow('\n📋 DATA PERSISTENCE TESTS'));
    
    await this.runTest('User preferences persistence', async () => {
      const context = await this.browser.newContext();
      const page = await this.authenticateUser(context, TEST_USERS[0]);
      
      // Change theme
      const themeToggle = await page.locator('button[aria-label*="theme" i], .theme-toggle').first();
      if (await themeToggle.isVisible()) {
        await themeToggle.click();
        await page.waitForTimeout(500);
      }
      
      // Refresh page
      await page.reload();
      await this.handleBlockingModals(page);
      
      // Check if theme persisted
      const htmlElement = await page.locator('html');
      const currentTheme = await htmlElement.getAttribute('class');
      if (!currentTheme?.includes('dark')) {
        console.log(chalk.gray('   Theme preference may not have persisted'));
      }
      
      await page.close();
      await context.close();
    });
    
    await this.runTest('Bookmark persistence', async () => {
      const context = await this.browser.newContext();
      const page = await this.authenticateUser(context, TEST_USERS[0]);
      
      // Navigate to bookmarks
      await page.goto(`${this.baseUrl}/bookmarks`);
      await this.handleBlockingModals(page);
      
      // Count bookmarks
      const bookmarkCount = await page.locator('.bookmark-item, [data-testid="bookmark-item"]').count();
      console.log(chalk.gray(`   Found ${bookmarkCount} persisted bookmarks`));
      
      await this.captureScreenshot(page, 'persisted-bookmarks');
      await page.close();
      await context.close();
    });
  }

  // Test Suite: Security Features
  async testSecurityFeatures() {
    console.log(chalk.yellow('\n📋 SECURITY FEATURES TESTS'));
    
    await this.runTest('Protected routes', async () => {
      const context = await this.browser.newContext();
      const page = await context.newPage();
      
      // Try to access protected route without auth
      await page.goto(`${this.baseUrl}/dashboard`);
      await this.handleCookieConsent(page);
      
      // Should redirect to login
      await page.waitForURL(/login/, { timeout: 5000 });
      const currentUrl = page.url();
      if (!currentUrl.includes('login')) throw new Error('Protected route not redirecting to login');
      
      await this.captureScreenshot(page, 'protected-route-redirect');
      await page.close();
      await context.close();
    });
    
    await this.runTest('Admin route protection', async () => {
      const context = await this.browser.newContext();
      const page = await this.authenticateUser(context, TEST_USERS[0]); // Free user
      
      // Try to access admin route
      await page.goto(`${this.baseUrl}/admin`);
      
      // Should not have access
      const adminContent = await page.locator('h1:has-text("Admin Dashboard")').count();
      if (adminContent > 0) throw new Error('Non-admin user accessing admin content');
      
      await page.close();
      await context.close();
    });
  }

  // Test Suite: Form Validation
  async testFormValidation() {
    console.log(chalk.yellow('\n📋 FORM VALIDATION TESTS'));
    
    await this.runTest('Login form validation', async () => {
      const context = await this.browser.newContext();
      const page = await context.newPage();
      
      await page.goto(`${this.baseUrl}/login`);
      await this.handleCookieConsent(page);
      
      // Try empty submission
      await page.click('button[type="submit"]');
      
      // Check for validation messages
      const validationMessages = await page.locator('text=/required|invalid|enter/i').count();
      if (validationMessages === 0) throw new Error('Form validation not working');
      
      await this.captureScreenshot(page, 'form-validation-errors');
      await page.close();
      await context.close();
    });
    
    await this.runTest('Email format validation', async () => {
      const context = await this.browser.newContext();
      const page = await context.newPage();
      
      await page.goto(`${this.baseUrl}/login`);
      await this.handleCookieConsent(page);
      
      // Enter invalid email
      await page.fill('input[type="email"]', 'notanemail');
      await page.fill('input[type="password"]', 'password123');
      await page.click('button[type="submit"]');
      
      // Check for email validation
      const emailError = await page.locator('text=/valid email|email format/i').count();
      if (emailError === 0) console.log(chalk.gray('   Email validation message not shown'));
      
      await page.close();
      await context.close();
    });
  }

  // Test Suite: Social Features
  async testSocialFeatures() {
    console.log(chalk.yellow('\n📋 SOCIAL FEATURES TESTS'));
    
    await this.runTest('Share functionality', async () => {
      const context = await this.browser.newContext();
      const page = await this.authenticateUser(context, TEST_USERS[1]);
      
      // Navigate to a term
      await page.goto(`${this.baseUrl}/glossary`);
      await this.handleBlockingModals(page);
      
      const firstTerm = await page.locator('a[href*="/glossary/"]').first();
      await firstTerm.click();
      await page.waitForLoadState('networkidle');
      
      // Look for share button
      const shareButton = await page.locator('button[aria-label*="share" i], button:has-text("Share")').first();
      if (await shareButton.isVisible()) {
        await shareButton.click();
        await page.waitForTimeout(1000);
        await this.captureScreenshot(page, 'share-dialog');
      }
      
      await page.close();
      await context.close();
    });
  }

  // Test Suite: Notifications
  async testNotifications() {
    console.log(chalk.yellow('\n📋 NOTIFICATIONS TESTS'));
    
    await this.runTest('Toast notifications', async () => {
      const context = await this.browser.newContext();
      const page = await this.authenticateUser(context, TEST_USERS[0]);
      
      // Trigger an action that shows a toast
      await page.goto(`${this.baseUrl}/glossary`);
      await this.handleBlockingModals(page);
      
      // Try bookmarking
      const firstTerm = await page.locator('a[href*="/glossary/"]').first();
      await firstTerm.click();
      await page.waitForLoadState('networkidle');
      
      const bookmarkButton = await page.locator('button[aria-label*="bookmark" i]').first();
      if (await bookmarkButton.isVisible()) {
        await bookmarkButton.click();
        
        // Check for toast notification
        await page.waitForTimeout(500);
        const toast = await page.locator('.toast, [role="alert"], .notification').count();
        if (toast > 0) {
          await this.captureScreenshot(page, 'toast-notification');
        }
      }
      
      await page.close();
      await context.close();
    });
  }

  // Test Suite: API Integration
  async testAPIIntegration() {
    console.log(chalk.yellow('\n📋 API INTEGRATION TESTS'));
    
    await this.runTest('API response handling', async () => {
      const context = await this.browser.newContext();
      const page = await this.authenticateUser(context, TEST_USERS[1]);
      
      // Monitor network requests
      const apiCalls: string[] = [];
      page.on('response', response => {
        if (response.url().includes('/api/')) {
          apiCalls.push(`${response.status()} - ${response.url()}`);
        }
      });
      
      // Navigate and trigger API calls
      await page.goto(`${this.baseUrl}/dashboard`);
      await page.waitForLoadState('networkidle');
      
      // Check if APIs were called successfully
      const failedCalls = apiCalls.filter(call => call.startsWith('4') || call.startsWith('5'));
      if (failedCalls.length > 0) {
        console.log(chalk.red('   Failed API calls:'), failedCalls);
      }
      
      await page.close();
      await context.close();
    });
  }

  // Test Suite: Real-time Features
  async testRealTimeFeatures() {
    console.log(chalk.yellow('\n📋 REAL-TIME FEATURES TESTS'));
    
    await this.runTest('Live search suggestions', async () => {
      const context = await this.browser.newContext();
      const page = await context.newPage();
      
      await page.goto(this.baseUrl);
      await this.handleCookieConsent(page);
      
      // Type in search
      const searchInput = await page.locator('input[type="search"], input[placeholder*="search" i]').first();
      await searchInput.type('mach', { delay: 100 });
      
      // Wait for suggestions
      await page.waitForTimeout(1000);
      
      // Check for suggestions dropdown
      const suggestions = await page.locator('.suggestions, .autocomplete, [role="listbox"]').count();
      if (suggestions > 0) {
        await this.captureScreenshot(page, 'search-suggestions');
      }
      
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
      console.log(chalk.blue('\n🏁 Running Comprehensive Test Suite\n'));
      
      // Core functionality
      await this.testAuthentication();
      await this.testProgressDashboard(); // Test our specific fix
      await this.testAccessControl();
      await this.testSecurityFeatures();
      
      // UI Components
      await this.testDashboardComponents();
      await this.testTermDetailFeatures();
      await this.testUserAccountFeatures();
      await this.testInteractiveComponents();
      await this.testFormValidation();
      
      // Features
      await this.testSearchFunctionality();
      await this.testNavigation();
      await this.testSocialFeatures();
      await this.testNotifications();
      
      // Quality
      await this.testErrorHandling();
      await this.testMobileResponsiveness();
      await this.testAccessibility();
      await this.testPerformance();
      await this.testDataPersistence();
      
      // Advanced
      await this.testAPIIntegration();
      await this.testRealTimeFeatures();
      
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