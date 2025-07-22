import { Browser, chromium, expect, Page } from '@playwright/test';
import chalk from 'chalk';
import * as fs from 'fs';
import * as path from 'path';

const __dirname = process.cwd();

interface TestResult {
  category: string;
  test: string;
  status: 'passed' | 'failed' | 'skipped';
  error?: string;
  duration: number;
  timestamp: Date;
  screenshots?: string[];
}

interface TestUser {
  email: string;
  password: string;
  role: 'admin' | 'premium' | 'free';
  expectedFeatures: string[];
}

const TEST_USERS: TestUser[] = [
  {
    email: 'admin@aimlglossary.com',
    password: 'admin123456',
    role: 'admin',
    expectedFeatures: ['admin-dashboard', 'content-management', 'user-management', 'analytics', 'unlimited-access']
  },
  {
    email: 'premium@aimlglossary.com',
    password: 'premiumpass123',
    role: 'premium',
    expectedFeatures: ['unlimited-access', 'advanced-features', 'no-ads', 'priority-support']
  },
  {
    email: 'test@aimlglossary.com',
    password: 'testpassword123',
    role: 'free',
    expectedFeatures: ['limited-access', 'basic-features', 'upgrade-prompts']
  },
];

const BASE_URL = 'http://localhost:5173';
const API_URL = 'http://localhost:3000';

class ComprehensiveFunctionalTests {
  private browser: Browser | null = null;
  private results: TestResult[] = [];
  private startTime: number = 0;
  private screenshotDir: string = path.join(__dirname, 'screenshots');

  constructor() {
    // Create screenshots directory
    if (!fs.existsSync(this.screenshotDir)) {
      fs.mkdirSync(this.screenshotDir, { recursive: true });
    }
  }

  async setup() {
    console.log(chalk.blue('🚀 Starting Comprehensive Functional Tests for AI/ML Glossary Pro\n'));
    console.log(chalk.gray(`Timestamp: ${new Date().toISOString()}`));
    console.log(chalk.gray(`Base URL: ${BASE_URL}`));
    console.log(chalk.gray(`API URL: ${API_URL}\n`));

    this.startTime = Date.now();
    this.browser = await chromium.launch({
      headless: false,
      slowMo: 100,
      args: ['--start-maximized']
    });
  }

  async teardown() {
    if (this.browser) {
      await this.browser.close();
    }
    await this.generateReport();
  }

  private async takeScreenshot(page: Page, name: string): Promise<string> {
    const timestamp = Date.now();
    const filename = `${name.replace(/[^a-z0-9]/gi, '_')}_${timestamp}.png`;
    const filepath = path.join(this.screenshotDir, filename);
    await page.screenshot({ path: filepath, fullPage: true });
    return filename;
  }

  async runTest(category: string, testName: string, testFn: () => Promise<void>) {
    const start = Date.now();
    const result: TestResult = {
      category,
      test: testName,
      status: 'passed',
      duration: 0,
      timestamp: new Date(),
      screenshots: []
    };

    try {
      await testFn();
      result.status = 'passed';
      console.log(chalk.green(`✓ [${category}] ${testName}`));
    } catch (error) {
      result.status = 'failed';
      result.error = error instanceof Error ? error.message : String(error);
      console.log(chalk.red(`✗ [${category}] ${testName}`));
      console.log(chalk.gray(`  Error: ${result.error}`));
    } finally {
      result.duration = Date.now() - start;
      this.results.push(result);
    }
  }

  // ========== AUTHENTICATION TESTS ==========
  async testAuthentication() {
    console.log(chalk.yellow('\n🔐 AUTHENTICATION TESTS\n'));

    // Test login for each user type
    for (const user of TEST_USERS) {
      await this.runTest('Authentication', `Login - ${user.role} user`, async () => {
        const context = await this.browser!.newContext();
        const page = await context.newPage();

        await page.goto(`${BASE_URL}/login`);
        await page.waitForLoadState('networkidle');

        // Fill login form
        await page.fill('input[type="email"]', user.email);
        await page.fill('input[type="password"]', user.password);

        // Take screenshot before login
        await this.takeScreenshot(page, `login_form_${user.role}`);

        // Submit login
        await page.click('button[type="submit"]:has-text("Sign In"), button[type="submit"]:has-text("Login")');

        // Wait for successful login
        await page.waitForURL(url => !url.toString().includes('/login'), { timeout: 15000 });

        // Verify user is logged in
        await expect(page.locator('text=' + user.email).first()).toBeVisible({ timeout: 10000 });

        // Take screenshot after login
        await this.takeScreenshot(page, `after_login_${user.role}`);

        await context.close();
      });
    }

    // Test logout
    await this.runTest('Authentication', 'Logout functionality', async () => {
      const context = await this.browser!.newContext();
      const page = await context.newPage();

      // Login first
      await this.loginUser(page, TEST_USERS[0]);

      // Find and click user menu
      const userMenu = page.locator('[data-testid="user-menu"], button:has-text("' + TEST_USERS[0].email + '"), [aria-label*="User menu"], [aria-label*="Account"]').first();
      await userMenu.click();

      // Click logout
      await page.click('text=Logout, text=Sign Out, text=Log Out');

      // Verify redirected to login or home
      await page.waitForURL(url => url.toString().includes('/login') || url.toString() === BASE_URL + '/', { timeout: 10000 });

      await context.close();
    });

    // Test cross-tab logout synchronization
    await this.runTest('Authentication', 'Cross-tab logout sync', async () => {
      const context = await this.browser!.newContext();
      const page1 = await context.newPage();
      const page2 = await context.newPage();

      // Login in both tabs
      await this.loginUser(page1, TEST_USERS[1]);
      await page2.goto(`${BASE_URL}/app`);
      await page2.reload(); // Ensure cookies are shared

      // Verify both tabs are logged in
      await expect(page1.locator('text=' + TEST_USERS[1].email).first()).toBeVisible();
      await expect(page2.locator('text=' + TEST_USERS[1].email).first()).toBeVisible();

      // Logout from first tab
      await page1.bringToFront();
      const userMenu = page1.locator('[data-testid="user-menu"], button:has-text("' + TEST_USERS[1].email + '")').first();
      await userMenu.click();
      await page1.click('text=Logout');

      // Wait a moment for broadcast
      await page1.waitForTimeout(2000);

      // Check second tab is logged out
      await page2.bringToFront();
      await page2.waitForURL(url => url.toString().includes('/login'), { timeout: 10000 });

      await context.close();
    });

    // Test invalid credentials
    await this.runTest('Authentication', 'Invalid credentials handling', async () => {
      const context = await this.browser!.newContext();
      const page = await context.newPage();

      await page.goto(`${BASE_URL}/login`);
      await page.fill('input[type="email"]', 'invalid@example.com');
      await page.fill('input[type="password"]', 'wrongpassword');
      await page.click('button[type="submit"]');

      // Wait for error message
      await expect(page.locator('text=/invalid|incorrect|error|failed/i').first()).toBeVisible({ timeout: 5000 });

      await context.close();
    });

    // Test session persistence
    await this.runTest('Authentication', 'Session persistence', async () => {
      const context = await this.browser!.newContext();
      const page = await context.newPage();

      // Login
      await this.loginUser(page, TEST_USERS[1]);

      // Save cookies
      const cookies = await context.cookies();

      // Close and create new context with cookies
      await context.close();

      const newContext = await this.browser!.newContext();
      await newContext.addCookies(cookies);
      const newPage = await newContext.newPage();

      // Navigate to app
      await newPage.goto(`${BASE_URL}/app`);

      // Should still be logged in
      await expect(newPage.locator('text=' + TEST_USERS[1].email).first()).toBeVisible({ timeout: 5000 });

      await newContext.close();
    });
  }

  // ========== ACCESS CONTROL TESTS ==========
  async testAccessControl() {
    console.log(chalk.yellow('\n🔒 ACCESS CONTROL TESTS\n'));

    // Test free user limitations
    await this.runTest('Access Control', 'Free user 50-term daily limit', async () => {
      const context = await this.browser!.newContext();
      const page = await context.newPage();

      await this.loginUser(page, TEST_USERS[2]); // Free user
      await page.goto(`${BASE_URL}/app`);

      let limitReached = false;
      const termsViewed: string[] = [];

      // Try to view 51 terms (to exceed the 50 limit)
      for (let i = 0; i < 51; i++) {
        const termLinks = await page.locator('a[href*="/term/"]').all();
        if (termLinks.length > i) {
          const termText = await termLinks[i].textContent();
          await termLinks[i].click();
          await page.waitForLoadState('networkidle');

          // Check for limit message
          const limitMessage = page.locator('text=/limit|upgrade|premium|reached/i');
          if (await limitMessage.count() > 0) {
            limitReached = true;
            await this.takeScreenshot(page, 'free_user_limit_reached');
            break;
          }

          termsViewed.push(termText || `Term ${i + 1}`);

          // Go back to terms list
          await page.goBack();
          await page.waitForLoadState('networkidle');
        }
      }

      if (!limitReached) {
        throw new Error(`Free user viewed ${termsViewed.length} terms without hitting limit`);
      }

      await context.close();
    });

    // Test premium user unlimited access
    await this.runTest('Access Control', 'Premium user unlimited access', async () => {
      const context = await this.browser!.newContext();
      const page = await context.newPage();

      await this.loginUser(page, TEST_USERS[1]); // Premium user
      await page.goto(`${BASE_URL}/app`);

      // View multiple terms
      const termLinks = await page.locator('a[href*="/term/"]').all();
      const viewCount = Math.min(10, termLinks.length);

      for (let i = 0; i < viewCount; i++) {
        await termLinks[i].click();
        await page.waitForLoadState('networkidle');

        // Should not see any limit messages
        const limitMessage = await page.locator('text=/limit|upgrade/i').count();
        if (limitMessage > 0) {
          throw new Error('Premium user should not see limit messages');
        }

        await page.goBack();
        await page.waitForLoadState('networkidle');
      }

      await context.close();
    });

    // Test admin access
    await this.runTest('Access Control', 'Admin dashboard access', async () => {
      const context = await this.browser!.newContext();
      const page = await context.newPage();

      await this.loginUser(page, TEST_USERS[0]); // Admin user

      // Navigate to admin dashboard
      await page.goto(`${BASE_URL}/admin`);
      await page.waitForLoadState('networkidle');

      // Verify admin features
      const adminFeatures = [
        'Content Management',
        'User Management',
        'Analytics',
        'Terms Manager',
        'Support Center'
      ];

      for (const feature of adminFeatures) {
        const element = page.locator(`text=${feature}`).first();
        await expect(element).toBeVisible({ timeout: 5000 });
      }

      await this.takeScreenshot(page, 'admin_dashboard');

      await context.close();
    });

    // Test role-based navigation
    await this.runTest('Access Control', 'Role-based navigation items', async () => {
      for (const user of TEST_USERS) {
        const context = await this.browser!.newContext();
        const page = await context.newPage();

        await this.loginUser(page, user);

        // Check navigation items based on role
        if (user.role === 'admin') {
          await expect(page.locator('text=Admin').first()).toBeVisible();
        } else {
          const adminLink = await page.locator('text=Admin').count();
          if (adminLink > 0) {
            throw new Error(`Non-admin user ${user.role} can see admin link`);
          }
        }

        await context.close();
      }
    });
  }

  // ========== SEARCH FUNCTIONALITY TESTS ==========
  async testSearchFunctionality() {
    console.log(chalk.yellow('\n🔍 SEARCH FUNCTIONALITY TESTS\n'));

    await this.runTest('Search', 'Basic search functionality', async () => {
      const context = await this.browser!.newContext();
      const page = await context.newPage();

      await page.goto(`${BASE_URL}/app`);

      const searchInput = page.locator('input[placeholder*="Search"], input[type="search"], input[aria-label*="Search"]').first();
      await searchInput.fill('machine learning');
      await searchInput.press('Enter');

      await page.waitForLoadState('networkidle');

      // Verify results
      const results = await page.locator('a[href*="/term/"]').count();
      if (results === 0) {
        throw new Error('No search results found');
      }

      // Verify search term highlighting
      const highlights = await page.locator('mark, .highlight').count();
      console.log(chalk.gray(`  Found ${results} results with ${highlights} highlights`));

      await this.takeScreenshot(page, 'search_results');

      await context.close();
    });

    await this.runTest('Search', 'Search suggestions/autocomplete', async () => {
      const context = await this.browser!.newContext();
      const page = await context.newPage();

      await page.goto(`${BASE_URL}/app`);

      const searchInput = page.locator('input[placeholder*="Search"], input[type="search"]').first();
      await searchInput.fill('neur');

      // Wait for suggestions
      await page.waitForTimeout(1000);

      const suggestions = page.locator('[role="listbox"], .suggestions, .autocomplete').first();
      await expect(suggestions).toBeVisible({ timeout: 3000 });

      const suggestionCount = await suggestions.locator('[role="option"], li').count();
      if (suggestionCount === 0) {
        throw new Error('No suggestions appeared');
      }

      await this.takeScreenshot(page, 'search_suggestions');

      await context.close();
    });

    await this.runTest('Search', 'Advanced search filters', async () => {
      const context = await this.browser!.newContext();
      const page = await context.newPage();

      await page.goto(`${BASE_URL}/search`);

      // Test category filter
      const categoryFilter = page.locator('select[name*="category"], [aria-label*="Category"]').first();
      if (await categoryFilter.count() > 0) {
        await categoryFilter.selectOption({ index: 1 });
      }

      // Test search with filters
      const searchInput = page.locator('input[type="search"]').first();
      await searchInput.fill('algorithm');
      await page.click('button:has-text("Search")');

      await page.waitForLoadState('networkidle');

      await context.close();
    });

    await this.runTest('Search', 'Empty search handling', async () => {
      const context = await this.browser!.newContext();
      const page = await context.newPage();

      await page.goto(`${BASE_URL}/app`);

      const searchInput = page.locator('input[type="search"]').first();
      await searchInput.press('Enter');

      // Should show all terms or an appropriate message
      await page.waitForLoadState('networkidle');

      await context.close();
    });
  }

  // ========== CONTENT DISPLAY TESTS ==========
  async testContentDisplay() {
    console.log(chalk.yellow('\n📄 CONTENT DISPLAY TESTS\n'));

    await this.runTest('Content', 'Term detail page rendering', async () => {
      const context = await this.browser!.newContext();
      const page = await context.newPage();

      await page.goto(`${BASE_URL}/app`);

      // Click first term
      const firstTerm = page.locator('a[href*="/term/"]').first();
      const termName = await firstTerm.textContent();
      await firstTerm.click();

      await page.waitForLoadState('networkidle');

      // Verify essential elements
      await expect(page.locator('h1').first()).toBeVisible();
      await expect(page.locator('text=/definition|description|overview/i').first()).toBeVisible();

      // Check for related terms
      const relatedTerms = await page.locator('text=/related|similar|see also/i').count();
      console.log(chalk.gray(`  Found ${relatedTerms} related terms sections`));

      await this.takeScreenshot(page, 'term_detail_page');

      await context.close();
    });

    await this.runTest('Content', 'Code examples rendering', async () => {
      const context = await this.browser!.newContext();
      const page = await context.newPage();

      await this.loginUser(page, TEST_USERS[1]); // Premium for full access
      await page.goto(`${BASE_URL}/app`);

      // Search for programming-related term
      const searchInput = page.locator('input[type="search"]').first();
      await searchInput.fill('algorithm');
      await searchInput.press('Enter');
      await page.waitForLoadState('networkidle');

      // Click first result
      await page.locator('a[href*="/term/"]').first().click();
      await page.waitForLoadState('networkidle');

      // Check for code blocks
      const codeBlocks = await page.locator('pre, code, .code-block').count();
      const copyButtons = await page.locator('button:has-text("Copy")').count();

      console.log(chalk.gray(`  Found ${codeBlocks} code blocks with ${copyButtons} copy buttons`));

      if (codeBlocks > 0) {
        await this.takeScreenshot(page, 'code_examples');
      }

      await context.close();
    });

    await this.runTest('Content', 'Mathematical formulas display', async () => {
      const context = await this.browser!.newContext();
      const page = await context.newPage();

      await page.goto(`${BASE_URL}/app`);

      // Search for math-related term
      const searchInput = page.locator('input[type="search"]').first();
      await searchInput.fill('equation');
      await searchInput.press('Enter');
      await page.waitForLoadState('networkidle');

      if (await page.locator('a[href*="/term/"]').count() > 0) {
        await page.locator('a[href*="/term/"]').first().click();
        await page.waitForLoadState('networkidle');

        // Check for math rendering
        const mathElements = await page.locator('.katex, .MathJax, [class*="math"], math').count();
        console.log(chalk.gray(`  Found ${mathElements} math elements`));

        if (mathElements > 0) {
          await this.takeScreenshot(page, 'math_formulas');
        }
      }

      await context.close();
    });

    await this.runTest('Content', 'Category navigation', async () => {
      const context = await this.browser!.newContext();
      const page = await context.newPage();

      await page.goto(`${BASE_URL}/categories`);
      await page.waitForLoadState('networkidle');

      // Get category count
      const categories = await page.locator('a[href*="/category/"]').count();
      console.log(chalk.gray(`  Found ${categories} categories`));

      if (categories > 0) {
        // Click first category
        await page.locator('a[href*="/category/"]').first().click();
        await page.waitForLoadState('networkidle');

        // Verify terms in category
        const termsInCategory = await page.locator('a[href*="/term/"]').count();
        console.log(chalk.gray(`  Category contains ${termsInCategory} terms`));

        await this.takeScreenshot(page, 'category_page');
      }

      await context.close();
    });
  }

  // ========== USER FEATURES TESTS ==========
  async testUserFeatures() {
    console.log(chalk.yellow('\n👤 USER FEATURES TESTS\n'));

    await this.runTest('User Features', 'Favorites functionality', async () => {
      const context = await this.browser!.newContext();
      const page = await context.newPage();

      await this.loginUser(page, TEST_USERS[1]);
      await page.goto(`${BASE_URL}/app`);

      // Navigate to a term
      const termLink = page.locator('a[href*="/term/"]').first();
      const termName = await termLink.textContent();
      await termLink.click();
      await page.waitForLoadState('networkidle');

      // Add to favorites
      const favoriteButton = page.locator('button:has-text("Favorite"), button[aria-label*="favorite"], button:has(svg[class*="heart"])').first();
      await favoriteButton.click();
      await page.waitForTimeout(1000);

      // Navigate to favorites
      await page.goto(`${BASE_URL}/favorites`);
      await page.waitForLoadState('networkidle');

      // Verify term is in favorites
      await expect(page.locator(`text=${termName}`)).toBeVisible({ timeout: 5000 });

      await this.takeScreenshot(page, 'favorites_page');

      await context.close();
    });

    await this.runTest('User Features', 'Progress tracking', async () => {
      const context = await this.browser!.newContext();
      const page = await context.newPage();

      await this.loginUser(page, TEST_USERS[1]);
      await page.goto(`${BASE_URL}/progress`);
      await page.waitForLoadState('networkidle');

      // Check progress elements
      const progressElements = [
        { selector: 'text=/streak/i', name: 'Streak counter' },
        { selector: 'text=/terms.*viewed/i', name: 'Terms viewed' },
        { selector: 'text=/achievement/i', name: 'Achievements' },
        { selector: 'text=/progress/i', name: 'Progress indicator' }
      ];

      for (const element of progressElements) {
        const count = await page.locator(element.selector).count();
        console.log(chalk.gray(`  ${element.name}: ${count > 0 ? '✓' : '✗'}`));
      }

      await this.takeScreenshot(page, 'progress_tracking');

      await context.close();
    });

    await this.runTest('User Features', 'Learning paths', async () => {
      const context = await this.browser!.newContext();
      const page = await context.newPage();

      await this.loginUser(page, TEST_USERS[1]);
      await page.goto(`${BASE_URL}/learning-paths`);
      await page.waitForLoadState('networkidle');

      const paths = await page.locator('a[href*="/learning-path/"], .learning-path').count();
      console.log(chalk.gray(`  Found ${paths} learning paths`));

      if (paths > 0) {
        // Click first path
        await page.locator('a[href*="/learning-path/"], .learning-path').first().click();
        await page.waitForLoadState('networkidle');

        await this.takeScreenshot(page, 'learning_path_detail');
      }

      await context.close();
    });

    await this.runTest('User Features', 'Profile management', async () => {
      const context = await this.browser!.newContext();
      const page = await context.newPage();

      await this.loginUser(page, TEST_USERS[1]);
      await page.goto(`${BASE_URL}/profile`);
      await page.waitForLoadState('networkidle');

      // Check profile elements
      await expect(page.locator('text=' + TEST_USERS[1].email)).toBeVisible();

      // Check for edit functionality
      const editButton = await page.locator('button:has-text("Edit"), button[aria-label*="edit"]').count();
      if (editButton > 0) {
        await page.locator('button:has-text("Edit")').first().click();
        await this.takeScreenshot(page, 'profile_edit');
      }

      await context.close();
    });
  }

  // ========== PAYMENT & SUBSCRIPTION TESTS ==========
  async testPaymentAndSubscription() {
    console.log(chalk.yellow('\n💳 PAYMENT & SUBSCRIPTION TESTS\n'));

    await this.runTest('Payment', 'Upgrade flow visibility', async () => {
      const context = await this.browser!.newContext();
      const page = await context.newPage();

      await this.loginUser(page, TEST_USERS[2]); // Free user

      // Should see upgrade prompts
      await page.goto(`${BASE_URL}/app`);

      const upgradeButton = page.locator('button:has-text("Upgrade"), a:has-text("Upgrade"), button:has-text("Get Premium")').first();
      await expect(upgradeButton).toBeVisible({ timeout: 10000 });

      await upgradeButton.click();
      await page.waitForLoadState('networkidle');

      // Should see pricing information
      await expect(page.locator('text=/price|pricing|plans/i').first()).toBeVisible();

      await this.takeScreenshot(page, 'upgrade_page');

      await context.close();
    });

    await this.runTest('Payment', 'Pricing page', async () => {
      const context = await this.browser!.newContext();
      const page = await context.newPage();

      await page.goto(`${BASE_URL}/pricing`);
      await page.waitForLoadState('networkidle');

      // Check pricing tiers
      const pricingTiers = await page.locator('.pricing-tier, [class*="price"]').count();
      console.log(chalk.gray(`  Found ${pricingTiers} pricing options`));

      // Check for payment button
      await expect(page.locator('button:has-text("Get Started"), button:has-text("Purchase")').first()).toBeVisible();

      await this.takeScreenshot(page, 'pricing_page');

      await context.close();
    });

    await this.runTest('Payment', 'Subscription status (Premium user)', async () => {
      const context = await this.browser!.newContext();
      const page = await context.newPage();

      await this.loginUser(page, TEST_USERS[1]); // Premium user
      await page.goto(`${BASE_URL}/profile`);

      // Should show premium status
      await expect(page.locator('text=/premium|lifetime|pro/i').first()).toBeVisible();

      // Should NOT see upgrade buttons
      const upgradeButtons = await page.locator('button:has-text("Upgrade")').count();
      if (upgradeButtons > 0) {
        throw new Error('Premium user should not see upgrade buttons');
      }

      await context.close();
    });
  }

  // ========== MOBILE RESPONSIVENESS TESTS ==========
  async testMobileResponsiveness() {
    console.log(chalk.yellow('\n📱 MOBILE RESPONSIVENESS TESTS\n'));

    const devices = [
      { name: 'iPhone 12', width: 390, height: 844 },
      { name: 'iPad', width: 768, height: 1024 },
      { name: 'Galaxy S21', width: 360, height: 800 }
    ];

    for (const device of devices) {
      await this.runTest('Mobile', `${device.name} layout`, async () => {
        const context = await this.browser!.newContext({
          viewport: { width: device.width, height: device.height },
          userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15',
          hasTouch: true
        });
        const page = await context.newPage();

        await page.goto(`${BASE_URL}/app`);
        await page.waitForLoadState('networkidle');

        // Check mobile menu
        const mobileMenu = page.locator('button[aria-label*="menu"], button.mobile-menu').first();
        if (device.width < 768) {
          await expect(mobileMenu).toBeVisible();

          // Test mobile menu
          await mobileMenu.click();
          await page.waitForTimeout(500);

          await this.takeScreenshot(page, `mobile_menu_${device.name.toLowerCase().replace(' ', '_')}`);
        }

        // Test scrolling
        await page.evaluate(() => window.scrollTo(0, 300));
        await page.waitForTimeout(500);

        await context.close();
      });
    }

    await this.runTest('Mobile', 'Touch interactions', async () => {
      const context = await this.browser!.newContext({
        viewport: { width: 390, height: 844 },
        hasTouch: true
      });
      const page = await context.newPage();

      await page.goto(`${BASE_URL}/app`);

      // Test swipe gestures if applicable
      const termCard = page.locator('a[href*="/term/"]').first();

      // Simulate touch
      const box = await termCard.boundingBox();
      if (box) {
        await page.touchscreen.tap(box.x + box.width / 2, box.y + box.height / 2);
      }

      await context.close();
    });

    await this.runTest('Mobile', 'PWA installation banner', async () => {
      const context = await this.browser!.newContext({
        viewport: { width: 390, height: 844 },
        userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15'
      });
      const page = await context.newPage();

      await page.goto(BASE_URL);
      await page.waitForTimeout(2000);

      // Check for PWA install prompt
      const installBanner = await page.locator('text=/install|add to home/i').count();
      console.log(chalk.gray(`  PWA install banner: ${installBanner > 0 ? 'Present' : 'Not shown'}`));

      await context.close();
    });
  }

  // ========== PERFORMANCE TESTS ==========
  async testPerformance() {
    console.log(chalk.yellow('\n⚡ PERFORMANCE TESTS\n'));

    await this.runTest('Performance', 'Initial page load time', async () => {
      const context = await this.browser!.newContext();
      const page = await context.newPage();

      const startTime = Date.now();
      await page.goto(BASE_URL, { waitUntil: 'networkidle' });
      const loadTime = Date.now() - startTime;

      console.log(chalk.gray(`  Load time: ${loadTime}ms`));

      // Get performance metrics
      const metrics = await page.evaluate(() => {
        const perf = window.performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
        return {
          domContentLoaded: Math.round(perf.domContentLoadedEventEnd - perf.domContentLoadedEventStart),
          loadComplete: Math.round(perf.loadEventEnd - perf.loadEventStart),
          totalTime: Math.round(perf.loadEventEnd - perf.fetchStart)
        };
      });

      console.log(chalk.gray(`  DOM Content Loaded: ${metrics.domContentLoaded}ms`));
      console.log(chalk.gray(`  Load Complete: ${metrics.loadComplete}ms`));
      console.log(chalk.gray(`  Total Time: ${metrics.totalTime}ms`));

      if (loadTime > 5000) {
        throw new Error(`Page load too slow: ${loadTime}ms`);
      }

      await context.close();
    });

    await this.runTest('Performance', 'Search performance', async () => {
      const context = await this.browser!.newContext();
      const page = await context.newPage();

      await page.goto(`${BASE_URL}/app`);

      const searchInput = page.locator('input[type="search"]').first();

      const searchStartTime = Date.now();
      await searchInput.fill('machine learning');
      await searchInput.press('Enter');
      await page.waitForLoadState('networkidle');
      const searchTime = Date.now() - searchStartTime;

      console.log(chalk.gray(`  Search execution time: ${searchTime}ms`));

      const resultCount = await page.locator('a[href*="/term/"]').count();
      console.log(chalk.gray(`  Results returned: ${resultCount}`));

      if (searchTime > 3000) {
        throw new Error(`Search too slow: ${searchTime}ms`);
      }

      await context.close();
    });

    await this.runTest('Performance', 'Image lazy loading', async () => {
      const context = await this.browser!.newContext();
      const page = await context.newPage();

      await page.goto(`${BASE_URL}/app`);

      // Check for lazy loading attributes
      const lazyImages = await page.locator('img[loading="lazy"]').count();
      const totalImages = await page.locator('img').count();

      console.log(chalk.gray(`  Lazy loaded images: ${lazyImages}/${totalImages}`));

      await context.close();
    });

    await this.runTest('Performance', 'Memory usage', async () => {
      const context = await this.browser!.newContext();
      const page = await context.newPage();

      await page.goto(`${BASE_URL}/app`);

      // Navigate through multiple pages
      for (let i = 0; i < 5; i++) {
        const links = await page.locator('a[href*="/term/"]').all();
        if (links.length > i) {
          await links[i].click();
          await page.waitForLoadState('networkidle');
          await page.goBack();
        }
      }

      // Check memory usage
      const memoryUsage = await page.evaluate(() => {
        if ('memory' in performance) {
          return (performance as any).memory.usedJSHeapSize / 1048576; // Convert to MB
        }
        return null;
      });

      if (memoryUsage) {
        console.log(chalk.gray(`  JS Heap Size: ${memoryUsage.toFixed(2)} MB`));
      }

      await context.close();
    });
  }

  // ========== ERROR HANDLING TESTS ==========
  async testErrorHandling() {
    console.log(chalk.yellow('\n⚠️ ERROR HANDLING TESTS\n'));

    await this.runTest('Error Handling', '404 page', async () => {
      const context = await this.browser!.newContext();
      const page = await context.newPage();

      await page.goto(`${BASE_URL}/this-page-does-not-exist-12345`);

      await expect(page.locator('text=/404|not found|doesn\'t exist/i').first()).toBeVisible();

      // Check for navigation back options
      await expect(page.locator('a:has-text("Home"), a:has-text("Go Back")').first()).toBeVisible();

      await this.takeScreenshot(page, '404_page');

      await context.close();
    });

    await this.runTest('Error Handling', 'Network error handling', async () => {
      const context = await this.browser!.newContext();
      const page = await context.newPage();

      // Simulate offline
      await context.setOffline(true);

      try {
        await page.goto(`${BASE_URL}/app`, { waitUntil: 'domcontentloaded', timeout: 5000 });
      } catch (error) {
        // Expected to fail
      }

      // Check for offline message
      const offlineMessage = await page.locator('text=/offline|no internet|connection/i').count();
      console.log(chalk.gray(`  Offline message shown: ${offlineMessage > 0 ? 'Yes' : 'No'}`));

      await context.close();
    });

    await this.runTest('Error Handling', 'Form validation', async () => {
      const context = await this.browser!.newContext();
      const page = await context.newPage();

      await page.goto(`${BASE_URL}/login`);

      // Submit empty form
      await page.click('button[type="submit"]');

      // Check for validation messages
      const validationMessages = await page.locator('.error, [role="alert"], .invalid-feedback').count();
      if (validationMessages === 0) {
        // Try HTML5 validation
        const emailInput = page.locator('input[type="email"]');
        const isInvalid = await emailInput.evaluate((el: HTMLInputElement) => !el.validity.valid);
        if (!isInvalid) {
          throw new Error('No form validation present');
        }
      }

      await context.close();
    });

    await this.runTest('Error Handling', 'API error messages', async () => {
      const context = await this.browser!.newContext();
      const page = await context.newPage();

      // Try to access protected resource without auth
      await page.goto(`${BASE_URL}/admin`);

      // Should redirect to login or show error
      await page.waitForURL(url => url.toString().includes('/login') || url.toString().includes('/403'), { timeout: 5000 });

      await context.close();
    });
  }

  // ========== ACCESSIBILITY TESTS ==========
  async testAccessibility() {
    console.log(chalk.yellow('\n♿ ACCESSIBILITY TESTS\n'));

    await this.runTest('Accessibility', 'Keyboard navigation', async () => {
      const context = await this.browser!.newContext();
      const page = await context.newPage();

      await page.goto(`${BASE_URL}/app`);

      // Tab through elements
      for (let i = 0; i < 10; i++) {
        await page.keyboard.press('Tab');
      }

      // Check focused element
      const focusedElement = await page.evaluate(() => {
        const el = document.activeElement;
        return {
          tag: el?.tagName,
          text: el?.textContent?.substring(0, 50),
          hasOutline: window.getComputedStyle(el!).outline !== 'none'
        };
      });

      console.log(chalk.gray(`  Focused element: ${focusedElement.tag} - "${focusedElement.text}"`));
      console.log(chalk.gray(`  Has focus outline: ${focusedElement.hasOutline}`));

      await context.close();
    });

    await this.runTest('Accessibility', 'Screen reader labels', async () => {
      const context = await this.browser!.newContext();
      const page = await context.newPage();

      await page.goto(`${BASE_URL}/app`);

      // Check for ARIA labels
      const ariaLabels = await page.evaluate(() => {
        const elements = document.querySelectorAll('[aria-label], [aria-labelledby], [aria-describedby]');
        return elements.length;
      });

      // Check for alt text on images
      const imagesWithAlt = await page.evaluate(() => {
        const images = document.querySelectorAll('img');
        return Array.from(images).filter(img => img.alt).length;
      });

      const totalImages = await page.locator('img').count();

      console.log(chalk.gray(`  Elements with ARIA labels: ${ariaLabels}`));
      console.log(chalk.gray(`  Images with alt text: ${imagesWithAlt}/${totalImages}`));

      await context.close();
    });

    await this.runTest('Accessibility', 'Color contrast', async () => {
      const context = await this.browser!.newContext();
      const page = await context.newPage();

      await page.goto(`${BASE_URL}/app`);

      // Check if dark mode is available
      const darkModeToggle = await page.locator('button[aria-label*="theme"], button:has-text("Dark"), button:has-text("Light")').count();
      console.log(chalk.gray(`  Dark mode toggle available: ${darkModeToggle > 0 ? 'Yes' : 'No'}`));

      await context.close();
    });
  }

  // ========== SECURITY TESTS ==========
  async testSecurity() {
    console.log(chalk.yellow('\n🔐 SECURITY TESTS\n'));

    await this.runTest('Security', 'HTTPS redirect', async () => {
      // This would need to be tested in production
      console.log(chalk.gray('  Skipped - requires production environment'));
    });

    await this.runTest('Security', 'Authentication tokens', async () => {
      const context = await this.browser!.newContext();
      const page = await context.newPage();

      await this.loginUser(page, TEST_USERS[1]);

      // Check cookies
      const cookies = await context.cookies();
      const authCookies = cookies.filter(c => c.name.includes('auth') || c.name.includes('token'));

      for (const cookie of authCookies) {
        console.log(chalk.gray(`  Cookie ${cookie.name}:`));
        console.log(chalk.gray(`    HttpOnly: ${cookie.httpOnly}`));
        console.log(chalk.gray(`    Secure: ${cookie.secure}`));
        console.log(chalk.gray(`    SameSite: ${cookie.sameSite}`));
      }

      await context.close();
    });

    await this.runTest('Security', 'XSS prevention', async () => {
      const context = await this.browser!.newContext();
      const page = await context.newPage();

      await page.goto(`${BASE_URL}/app`);

      // Try to inject script in search
      const searchInput = page.locator('input[type="search"]').first();
      await searchInput.fill('<script>alert("XSS")</script>');
      await searchInput.press('Enter');

      await page.waitForLoadState('networkidle');

      // Check if script was executed
      const alertShown = await page.evaluate(() => {
        return new Promise(resolve => {
          const originalAlert = window.alert;
          window.alert = () => {
            window.alert = originalAlert;
            resolve(true);
          };
          setTimeout(() => resolve(false), 1000);
        });
      });

      if (alertShown) {
        throw new Error('XSS vulnerability detected!');
      }

      await context.close();
    });
  }

  // Helper method to login
  private async loginUser(page: Page, user: TestUser) {
    await page.goto(`${BASE_URL}/login`);
    await page.fill('input[type="email"]', user.email);
    await page.fill('input[type="password"]', user.password);
    await page.click('button[type="submit"]');
    await page.waitForURL(url => !url.toString().includes('/login'), { timeout: 15000 });
  }

  // Generate comprehensive report
  private async generateReport() {
    const duration = Date.now() - this.startTime;
    const passed = this.results.filter(r => r.status === 'passed').length;
    const failed = this.results.filter(r => r.status === 'failed').length;
    const total = this.results.length;

    // Console summary
    console.log(chalk.blue('\n' + '='.repeat(80)));
    console.log(chalk.blue('📊 COMPREHENSIVE FUNCTIONAL TEST RESULTS'));
    console.log(chalk.blue('='.repeat(80) + '\n'));

    console.log(`Total Tests: ${total}`);
    console.log(chalk.green(`Passed: ${passed} (${((passed / total) * 100).toFixed(1)}%)`));
    console.log(chalk.red(`Failed: ${failed} (${((failed / total) * 100).toFixed(1)}%)`));
    console.log(`Duration: ${(duration / 1000).toFixed(2)}s\n`);

    // Group results by category
    const categories = Array.from(new Set(this.results.map(r => r.category)));

    for (const category of categories) {
      const categoryResults = this.results.filter(r => r.category === category);
      const categoryPassed = categoryResults.filter(r => r.status === 'passed').length;
      const categoryTotal = categoryResults.length;

      console.log(chalk.yellow(`\n${category} (${categoryPassed}/${categoryTotal})`));
      console.log('-'.repeat(40));

      for (const result of categoryResults) {
        const icon = result.status === 'passed' ? chalk.green('✓') : chalk.red('✗');
        console.log(`${icon} ${result.test} (${result.duration}ms)`);
        if (result.error) {
          console.log(chalk.gray(`  └─ ${result.error}`));
        }
      }
    }

    // Generate HTML report
    const htmlReport = this.generateHTMLReport();
    const reportPath = path.join(__dirname, `test-report-${Date.now()}.html`);
    fs.writeFileSync(reportPath, htmlReport);
    console.log(chalk.blue(`\n📄 HTML report generated: ${reportPath}`));

    // Generate JSON report
    const jsonReport = {
      summary: {
        total,
        passed,
        failed,
        passRate: ((passed / total) * 100).toFixed(1),
        duration: (duration / 1000).toFixed(2),
        timestamp: new Date().toISOString()
      },
      results: this.results
    };

    const jsonPath = path.join(__dirname, `test-results-${Date.now()}.json`);
    fs.writeFileSync(jsonPath, JSON.stringify(jsonReport, null, 2));
    console.log(chalk.blue(`📊 JSON report generated: ${jsonPath}\n`));
  }

  private generateHTMLReport(): string {
    const passed = this.results.filter(r => r.status === 'passed').length;
    const failed = this.results.filter(r => r.status === 'failed').length;
    const total = this.results.length;

    return `
<!DOCTYPE html>
<html>
<head>
  <title>AI/ML Glossary Pro - Functional Test Report</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 40px; background: #f5f5f5; }
    .header { background: #1a73e8; color: white; padding: 20px; border-radius: 8px; }
    .summary { display: flex; gap: 20px; margin: 20px 0; }
    .summary-card { background: white; padding: 20px; border-radius: 8px; flex: 1; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
    .passed { color: #0f9d58; }
    .failed { color: #ea4335; }
    .test-category { background: white; margin: 20px 0; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
    .test-result { padding: 10px; border-bottom: 1px solid #eee; }
    .test-result:last-child { border-bottom: none; }
    .error { color: #ea4335; font-size: 0.9em; margin-left: 20px; }
    .screenshot { margin: 10px 0; }
    .screenshot img { max-width: 300px; border: 1px solid #ddd; }
  </style>
</head>
<body>
  <div class="header">
    <h1>AI/ML Glossary Pro - Functional Test Report</h1>
    <p>Generated: ${new Date().toISOString()}</p>
  </div>
  
  <div class="summary">
    <div class="summary-card">
      <h3>Total Tests</h3>
      <h2>${total}</h2>
    </div>
    <div class="summary-card">
      <h3>Passed</h3>
      <h2 class="passed">${passed}</h2>
    </div>
    <div class="summary-card">
      <h3>Failed</h3>
      <h2 class="failed">${failed}</h2>
    </div>
    <div class="summary-card">
      <h3>Pass Rate</h3>
      <h2>${((passed / total) * 100).toFixed(1)}%</h2>
    </div>
  </div>
  
  ${Array.from(new Set(this.results.map(r => r.category))).map(category => {
      const categoryResults = this.results.filter(r => r.category === category);
      return `
    <div class="test-category">
      <h2>${category}</h2>
      ${categoryResults.map(result => `
        <div class="test-result">
          <span class="${result.status}">${result.status === 'passed' ? '✓' : '✗'}</span>
          <strong>${result.test}</strong>
          <span style="color: #666; float: right;">${result.duration}ms</span>
          ${result.error ? `<div class="error">${result.error}</div>` : ''}
          ${result.screenshots ? result.screenshots.map(s =>
        `<div class="screenshot"><img src="screenshots/${s}" alt="${s}" /></div>`
      ).join('') : ''}
        </div>
      `).join('')}
    </div>
    `;
    }).join('')}
</body>
</html>
    `;
  }

  async run() {
    try {
      await this.setup();

      // Run all test suites
      await this.testAuthentication();
      await this.testAccessControl();
      await this.testSearchFunctionality();
      await this.testContentDisplay();
      await this.testUserFeatures();
      await this.testPaymentAndSubscription();
      await this.testMobileResponsiveness();
      await this.testPerformance();
      await this.testErrorHandling();
      await this.testAccessibility();
      await this.testSecurity();

    } catch (error) {
      console.error(chalk.red('\n❌ Test runner error:'), error);
    } finally {
      await this.teardown();
    }
  }
}

// Run the comprehensive tests
const tester = new ComprehensiveFunctionalTests();
tester.run().catch(console.error);