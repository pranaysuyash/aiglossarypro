import { chromium, Browser, Page, BrowserContext } from 'playwright';
import * as fs from 'fs';
import * as path from 'path';

interface TestUser {
  email: string;
  password: string;
  type: 'free' | 'premium' | 'admin';
}

interface TestResult {
  name: string;
  status: 'pass' | 'fail' | 'skip';
  error?: string;
  duration: number;
  screenshots: string[];
}

const TEST_USERS: TestUser[] = [
  { email: 'test@aimlglossary.com', password: 'testpassword123', type: 'free' },
  { email: 'premium@aimlglossary.com', password: 'premiumpass123', type: 'premium' },
  { email: 'admin@aimlglossary.com', password: 'adminpass123', type: 'admin' }
];

class ComprehensiveFunctionalTest {
  private browser!: Browser;
  private baseUrl: string;
  private reportDir: string;
  private results: TestResult[] = [];
  private screenshotCount = 0;

  constructor(baseUrl: string = 'http://localhost:5173') {
    this.baseUrl = baseUrl;
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    this.reportDir = path.join(process.cwd(), 'reports', 'functional-tests', timestamp);
  }

  async initialize() {
    fs.mkdirSync(this.reportDir, { recursive: true });
    fs.mkdirSync(path.join(this.reportDir, 'screenshots'), { recursive: true });
    
    this.browser = await chromium.launch({
      headless: false,
      args: ['--start-maximized']
    });
    
    console.log(`📁 Report directory: ${this.reportDir}`);
    console.log(`🌐 Base URL: ${this.baseUrl}`);
  }

  async captureScreenshot(page: Page, name: string): Promise<string> {
    this.screenshotCount++;
    const filename = `${String(this.screenshotCount).padStart(3, '0')}-${name}-${Date.now()}.png`;
    const filepath = path.join(this.reportDir, 'screenshots', filename);
    
    await page.screenshot({
      path: filepath,
      fullPage: false
    });
    
    console.log(`📸 Screenshot ${this.screenshotCount}: ${name}`);
    return filename;
  }

  async runTest(name: string, testFn: () => Promise<void>): Promise<TestResult> {
    console.log(`\n🧪 Running test: ${name}`);
    const startTime = Date.now();
    const screenshots: string[] = [];
    
    try {
      await testFn();
      const result: TestResult = {
        name,
        status: 'pass',
        duration: Date.now() - startTime,
        screenshots
      };
      console.log(`✅ PASS: ${name} (${result.duration}ms)`);
      this.results.push(result);
      return result;
    } catch (error) {
      const result: TestResult = {
        name,
        status: 'fail',
        error: error instanceof Error ? error.message : String(error),
        duration: Date.now() - startTime,
        screenshots
      };
      console.log(`❌ FAIL: ${name} - ${result.error}`);
      this.results.push(result);
      return result;
    }
  }

  async handleCookieConsent(page: Page) {
    try {
      const cookieButton = await page.waitForSelector('button:has-text("Accept")', { timeout: 3000 });
      if (cookieButton) {
        await cookieButton.click();
        await page.waitForTimeout(500);
      }
    } catch {
      // Cookie banner might not be present
    }
  }

  // Test 1: Welcome Modal Display
  async testWelcomeModal(context: BrowserContext) {
    await this.runTest('Welcome Modal - Free User', async () => {
      const page = await context.newPage();
      
      // Login as free user
      await page.goto(`${this.baseUrl}/login`);
      await this.handleCookieConsent(page);
      
      await page.fill('input[type="email"]', TEST_USERS[0].email);
      await page.fill('input[type="password"]', TEST_USERS[0].password);
      
      // Submit and wait for navigation with welcome parameter
      await Promise.all([
        page.waitForNavigation({ url: '**/dashboard?welcome=true' }),
        page.click('button[type="submit"]')
      ]);
      
      // Wait for welcome message to appear
      const welcomeAlert = await page.waitForSelector('div[role="alert"]:has-text("Welcome")', { timeout: 5000 });
      await this.captureScreenshot(page, 'welcome-modal-free-user');
      
      // Verify welcome message content
      const welcomeText = await welcomeAlert.textContent();
      if (!welcomeText?.includes('Welcome')) {
        throw new Error('Welcome message not displayed properly');
      }
      
      // Test auto-dismiss (should disappear after 10 seconds)
      console.log('Waiting for auto-dismiss...');
      await page.waitForSelector('div[role="alert"]:has-text("Welcome")', { 
        state: 'hidden', 
        timeout: 12000 
      });
      await this.captureScreenshot(page, 'welcome-modal-dismissed');
      
      await page.close();
    });

    await this.runTest('Welcome Modal - Premium User', async () => {
      const page = await context.newPage();
      
      // Login as premium user
      await page.goto(`${this.baseUrl}/login`);
      await this.handleCookieConsent(page);
      
      await page.fill('input[type="email"]', TEST_USERS[1].email);
      await page.fill('input[type="password"]', TEST_USERS[1].password);
      
      // Submit and wait for navigation with premium welcome parameter
      await Promise.all([
        page.waitForNavigation({ url: '**/dashboard?welcome=premium' }),
        page.click('button[type="submit"]')
      ]);
      
      // Wait for premium welcome message
      const welcomeAlert = await page.waitForSelector('div[role="alert"]', { timeout: 5000 });
      await this.captureScreenshot(page, 'welcome-modal-premium-user');
      
      await page.close();
    });
  }

  // Test 2: User Registration Flow
  async testRegistrationFlow(context: BrowserContext) {
    await this.runTest('User Registration Flow', async () => {
      const page = await context.newPage();
      const timestamp = Date.now();
      const testEmail = `test-${timestamp}@example.com`;
      
      await page.goto(`${this.baseUrl}/login`);
      await this.handleCookieConsent(page);
      
      // Switch to register tab
      const registerTab = await page.waitForSelector('button:has-text("Create Account")', { timeout: 5000 });
      await registerTab.click();
      await this.captureScreenshot(page, 'registration-form');
      
      // Fill registration form
      await page.fill('input[name="name"]', `Test User ${timestamp}`);
      await page.fill('input[type="email"]', testEmail);
      await page.fill('input[type="password"]', 'TestPassword123!');
      
      await this.captureScreenshot(page, 'registration-form-filled');
      
      // Note: Not submitting to avoid creating test accounts
      await page.close();
    });
  }

  // Test 3: Search Functionality
  async testSearchFunctionality(context: BrowserContext) {
    await this.runTest('Search - Basic Functionality', async () => {
      const page = await context.newPage();
      await page.goto(`${this.baseUrl}/app`);
      await this.handleCookieConsent(page);
      
      // Find search input
      const searchInput = await page.waitForSelector('input[placeholder*="Search"]', { timeout: 5000 });
      
      // Test search with results
      await searchInput.click();
      await searchInput.fill('neural network');
      await this.captureScreenshot(page, 'search-input-filled');
      
      // Wait for suggestions
      await page.waitForTimeout(1000);
      const suggestions = await page.$$('[role="option"], .search-suggestion');
      if (suggestions.length > 0) {
        await this.captureScreenshot(page, 'search-suggestions');
      }
      
      // Submit search
      await page.keyboard.press('Enter');
      await page.waitForTimeout(1500);
      await this.captureScreenshot(page, 'search-results');
      
      // Test empty search
      await searchInput.clear();
      await searchInput.fill('xyzabc123notfound');
      await page.keyboard.press('Enter');
      await page.waitForTimeout(1000);
      await this.captureScreenshot(page, 'search-no-results');
      
      await page.close();
    });
  }

  // Test 4: Term Navigation and Interactions
  async testTermInteractions(context: BrowserContext) {
    await this.runTest('Term Detail Page', async () => {
      const page = await context.newPage();
      await page.goto(`${this.baseUrl}/terms`);
      await this.handleCookieConsent(page);
      
      // Click on first term card
      const termCard = await page.waitForSelector('.cursor-pointer', { timeout: 5000 });
      await termCard.click();
      
      await page.waitForLoadState('networkidle');
      await this.captureScreenshot(page, 'term-detail-page');
      
      // Test tabs if present
      const tabs = await page.$$('[role="tab"]');
      for (let i = 0; i < Math.min(tabs.length, 3); i++) {
        await tabs[i].click();
        await page.waitForTimeout(500);
        await this.captureScreenshot(page, `term-tab-${i}`);
      }
      
      await page.close();
    });
  }

  // Test 5: Category Navigation
  async testCategoryNavigation(context: BrowserContext) {
    await this.runTest('Category Navigation', async () => {
      const page = await context.newPage();
      await page.goto(`${this.baseUrl}/categories`);
      await this.handleCookieConsent(page);
      
      await page.waitForLoadState('networkidle');
      await this.captureScreenshot(page, 'categories-page');
      
      // Click on a category
      const categoryCard = await page.$('.group.cursor-pointer');
      if (categoryCard) {
        await categoryCard.click();
        await page.waitForTimeout(1000);
        await this.captureScreenshot(page, 'category-terms-list');
      }
      
      await page.close();
    });
  }

  // Test 6: Authenticated User Features
  async testAuthenticatedFeatures(context: BrowserContext, user: TestUser) {
    await this.runTest(`Authenticated Features - ${user.type}`, async () => {
      const page = await context.newPage();
      
      // Login
      await page.goto(`${this.baseUrl}/login`);
      await this.handleCookieConsent(page);
      
      await page.fill('input[type="email"]', user.email);
      await page.fill('input[type="password"]', user.password);
      
      await Promise.all([
        page.waitForNavigation(),
        page.click('button[type="submit"]')
      ]);
      
      // Test favorites (if available)
      await page.goto(`${this.baseUrl}/favorites`);
      await page.waitForLoadState('networkidle');
      await this.captureScreenshot(page, `${user.type}-favorites`);
      
      // Test settings
      await page.goto(`${this.baseUrl}/settings`);
      await page.waitForLoadState('networkidle');
      await this.captureScreenshot(page, `${user.type}-settings`);
      
      // Test progress tracker
      await page.goto(`${this.baseUrl}/progress`);
      await page.waitForLoadState('networkidle');
      await this.captureScreenshot(page, `${user.type}-progress`);
      
      // Test admin features if admin
      if (user.type === 'admin') {
        await page.goto(`${this.baseUrl}/admin`);
        await page.waitForLoadState('networkidle');
        await this.captureScreenshot(page, 'admin-dashboard');
        
        await page.goto(`${this.baseUrl}/analytics`);
        await page.waitForLoadState('networkidle');
        await this.captureScreenshot(page, 'admin-analytics');
      }
      
      // Test logout
      const logoutButton = await page.$('button:has-text("Sign out"), button:has-text("Log out")');
      if (logoutButton) {
        await logoutButton.click();
        await page.waitForTimeout(1000);
        await this.captureScreenshot(page, `${user.type}-logout`);
      }
      
      await page.close();
    });
  }

  // Test 7: Mobile Responsiveness
  async testMobileResponsiveness(context: BrowserContext) {
    await this.runTest('Mobile Cookie Banner', async () => {
      const page = await context.newPage();
      await page.setViewportSize({ width: 375, height: 667 });
      
      await page.goto(`${this.baseUrl}`);
      await page.waitForTimeout(1000);
      
      // Check cookie banner height
      const cookieBanner = await page.$('.fixed.bottom-0.left-0.right-0');
      if (cookieBanner) {
        const boundingBox = await cookieBanner.boundingBox();
        await this.captureScreenshot(page, 'mobile-cookie-banner');
        
        if (boundingBox && boundingBox.height > 80) {
          throw new Error(`Cookie banner too tall on mobile: ${boundingBox.height}px`);
        }
      }
      
      await page.close();
    });

    await this.runTest('Mobile Navigation', async () => {
      const page = await context.newPage();
      await page.setViewportSize({ width: 375, height: 667 });
      
      await page.goto(`${this.baseUrl}/app`);
      await this.handleCookieConsent(page);
      
      // Test mobile menu
      const menuButton = await page.$('[aria-label*="menu"], button:has-text("Menu")');
      if (menuButton) {
        await menuButton.click();
        await page.waitForTimeout(500);
        await this.captureScreenshot(page, 'mobile-menu-open');
      }
      
      await page.close();
    });
  }

  // Test 8: Performance and Loading States
  async testPerformance(context: BrowserContext) {
    await this.runTest('Page Load Performance', async () => {
      const page = await context.newPage();
      
      // Measure landing page load time
      const startTime = Date.now();
      await page.goto(`${this.baseUrl}`);
      await page.waitForLoadState('networkidle');
      const loadTime = Date.now() - startTime;
      
      console.log(`Landing page load time: ${loadTime}ms`);
      if (loadTime > 3000) {
        console.warn('⚠️  Landing page load time exceeds 3 seconds');
      }
      
      await page.close();
    });

    await this.runTest('Loading Skeleton', async () => {
      const page = await context.newPage();
      
      // Navigate and check for loading skeleton
      await page.goto(`${this.baseUrl}`, { waitUntil: 'domcontentloaded' });
      
      // Check if loading skeleton exists
      const skeleton = await page.$('.loading-skeleton');
      if (skeleton) {
        await this.captureScreenshot(page, 'loading-skeleton-visible');
      }
      
      await page.close();
    });
  }

  // Generate comprehensive report
  async generateReport() {
    const summary = {
      timestamp: new Date().toISOString(),
      baseUrl: this.baseUrl,
      totalTests: this.results.length,
      passed: this.results.filter(r => r.status === 'pass').length,
      failed: this.results.filter(r => r.status === 'fail').length,
      skipped: this.results.filter(r => r.status === 'skip').length,
      totalScreenshots: this.screenshotCount,
      results: this.results
    };

    // Write JSON summary
    fs.writeFileSync(
      path.join(this.reportDir, 'test-summary.json'),
      JSON.stringify(summary, null, 2)
    );

    // Write markdown report
    const reportMd = `# Functional Test Report
Generated: ${summary.timestamp}

## Summary
- **Total Tests**: ${summary.totalTests}
- **Passed**: ${summary.passed} ✅
- **Failed**: ${summary.failed} ❌
- **Skipped**: ${summary.skipped} ⏭️
- **Screenshots**: ${summary.totalScreenshots}

## Test Results

${this.results.map(r => {
  const status = r.status === 'pass' ? '✅' : r.status === 'fail' ? '❌' : '⏭️';
  const error = r.error ? `\n  Error: ${r.error}` : '';
  return `### ${status} ${r.name}
- Duration: ${r.duration}ms
- Screenshots: ${r.screenshots.length}${error}`;
}).join('\n\n')}

## Failed Tests Details
${this.results.filter(r => r.status === 'fail').map(r => 
  `- **${r.name}**: ${r.error}`
).join('\n')}
`;

    fs.writeFileSync(
      path.join(this.reportDir, 'test-report.md'),
      reportMd
    );

    console.log('\n📊 Test Summary:');
    console.log(`Total: ${summary.totalTests} | Passed: ${summary.passed} | Failed: ${summary.failed}`);
    console.log(`Report: ${this.reportDir}`);
  }

  async run() {
    try {
      await this.initialize();
      
      const context = await this.browser.newContext({
        viewport: { width: 1920, height: 1080 },
        ignoreHTTPSErrors: true
      });

      console.log('\n🚀 Starting Comprehensive Functional Tests...\n');

      // Run all test suites
      await this.testWelcomeModal(context);
      await this.testRegistrationFlow(context);
      await this.testSearchFunctionality(context);
      await this.testTermInteractions(context);
      await this.testCategoryNavigation(context);
      
      // Test authenticated features for each user type
      for (const user of TEST_USERS) {
        await this.testAuthenticatedFeatures(context, user);
      }
      
      await this.testMobileResponsiveness(context);
      await this.testPerformance(context);

      await this.generateReport();
      
    } catch (error) {
      console.error('❌ Test suite failed:', error);
    } finally {
      await this.browser.close();
    }
  }
}

// Run the tests
const test = new ComprehensiveFunctionalTest();
test.run().catch(console.error);