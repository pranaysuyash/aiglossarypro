import { chromium } from 'playwright';
import chalk from 'chalk';
const TEST_USERS = [
    { email: 'admin@aimlglossary.com', password: 'admin123456', role: 'admin' },
    { email: 'premium@aimlglossary.com', password: 'premiumpass123', role: 'premium' },
    { email: 'test@aimlglossary.com', password: 'testpassword123', role: 'free' },
];
const BASE_URL = 'http://localhost:5173';
const API_URL = 'http://localhost:3000';
class FunctionalTestRunner {
    browser = null;
    results = [];
    startTime = 0;
    async setup() {
        console.log(chalk.blue('🚀 Starting Functional Tests for AI/ML Glossary Pro\n'));
        this.startTime = Date.now();
        this.browser = await chromium.launch({
            headless: false,
            slowMo: 50
        });
    }
    async teardown() {
        if (this.browser) {
            await this.browser.close();
        }
        this.printResults();
    }
    async runTest(name, testFn) {
        const start = Date.now();
        try {
            await testFn();
            this.results.push({
                name,
                status: 'passed',
                duration: Date.now() - start
            });
            console.log(chalk.green(`✓ ${name}`));
        }
        catch (error) {
            this.results.push({
                name,
                status: 'failed',
                error: error instanceof Error ? error.message : String(error),
                duration: Date.now() - start
            });
            console.log(chalk.red(`✗ ${name}`));
            console.log(chalk.gray(`  Error: ${error}`));
        }
    }
    printResults() {
        console.log(chalk.blue('\n📊 Test Results Summary\n'));
        const passed = this.results.filter(r => r.status === 'passed').length;
        const failed = this.results.filter(r => r.status === 'failed').length;
        const total = this.results.length;
        const duration = Date.now() - this.startTime;
        console.log(`Total Tests: ${total}`);
        console.log(chalk.green(`Passed: ${passed}`));
        console.log(chalk.red(`Failed: ${failed}`));
        console.log(`Duration: ${(duration / 1000).toFixed(2)}s`);
        console.log(`Pass Rate: ${((passed / total) * 100).toFixed(1)}%\n`);
        if (failed > 0) {
            console.log(chalk.red('\n❌ Failed Tests:\n'));
            this.results
                .filter(r => r.status === 'failed')
                .forEach(r => {
                console.log(chalk.red(`- ${r.name}`));
                if (r.error) {
                    console.log(chalk.gray(`  ${r.error}`));
                }
            });
        }
    }
    // Test Methods
    async testAuthenticationFlows() {
        console.log(chalk.yellow('\n🔐 Testing Authentication Flows\n'));
        for (const user of TEST_USERS) {
            await this.runTest(`Login with ${user.role} user (${user.email})`, async () => {
                const context = await this.browser.newContext();
                const page = await context.newPage();
                await page.goto(`${BASE_URL}/login`);
                await page.fill('input[type="email"]', user.email);
                await page.fill('input[type="password"]', user.password);
                await page.click('button[type="submit"]');
                // Wait for navigation after login
                await page.waitForURL(/dashboard|admin|app/, { timeout: 10000 });
                // Verify user is logged in
                const userMenu = await page.locator('[data-testid="user-menu"], [aria-label*="User menu"]').first();
                await expect(userMenu).toBeVisible({ timeout: 5000 });
                await context.close();
            });
        }
        // Test logout
        await this.runTest('Logout functionality', async () => {
            const context = await this.browser.newContext();
            const page = await context.newPage();
            // Login first
            await page.goto(`${BASE_URL}/login`);
            await page.fill('input[type="email"]', TEST_USERS[0].email);
            await page.fill('input[type="password"]', TEST_USERS[0].password);
            await page.click('button[type="submit"]');
            await page.waitForURL(/dashboard|admin|app/, { timeout: 10000 });
            // Logout
            const userMenu = await page.locator('[data-testid="user-menu"], [aria-label*="User menu"]').first();
            await userMenu.click();
            await page.click('text=Logout');
            // Verify redirected to login
            await page.waitForURL(/login/, { timeout: 5000 });
            await context.close();
        });
        // Test cross-tab logout
        await this.runTest('Cross-tab logout synchronization', async () => {
            const context = await this.browser.newContext();
            const page1 = await context.newPage();
            const page2 = await context.newPage();
            // Login in both tabs
            for (const page of [page1, page2]) {
                await page.goto(`${BASE_URL}/login`);
                await page.fill('input[type="email"]', TEST_USERS[0].email);
                await page.fill('input[type="password"]', TEST_USERS[0].password);
                await page.click('button[type="submit"]');
                await page.waitForURL(/dashboard|admin|app/, { timeout: 10000 });
            }
            // Logout from first tab
            await page1.bringToFront();
            const userMenu = await page1.locator('[data-testid="user-menu"], [aria-label*="User menu"]').first();
            await userMenu.click();
            await page1.click('text=Logout');
            // Check second tab is also logged out
            await page2.bringToFront();
            await page2.waitForURL(/login/, { timeout: 5000 });
            await context.close();
        });
    }
    async testAccessControl() {
        console.log(chalk.yellow('\n🔒 Testing Access Control\n'));
        // Test free user limitations
        await this.runTest('Free user term access limit', async () => {
            const context = await this.browser.newContext();
            const page = await context.newPage();
            // Login as free user
            await page.goto(`${BASE_URL}/login`);
            await page.fill('input[type="email"]', TEST_USERS[2].email);
            await page.fill('input[type="password"]', TEST_USERS[2].password);
            await page.click('button[type="submit"]');
            await page.waitForURL(/dashboard|app/, { timeout: 10000 });
            // Navigate to terms
            await page.goto(`${BASE_URL}/app`);
            // Try to access multiple terms
            let upgradePromptShown = false;
            for (let i = 0; i < 6; i++) {
                const termLinks = await page.locator('a[href*="/term/"]').all();
                if (termLinks.length > i) {
                    await termLinks[i].click();
                    await page.waitForLoadState('networkidle');
                    // Check if upgrade prompt appears after 5 terms
                    const upgradePrompt = page.locator('text=/upgrade|premium|limit/i');
                    if (await upgradePrompt.isVisible()) {
                        upgradePromptShown = true;
                        break;
                    }
                    await page.goBack();
                }
            }
            if (!upgradePromptShown) {
                throw new Error('Free user was not limited after 5 terms');
            }
            await context.close();
        });
        // Test premium user unlimited access
        await this.runTest('Premium user unlimited access', async () => {
            const context = await this.browser.newContext();
            const page = await context.newPage();
            // Login as premium user
            await page.goto(`${BASE_URL}/login`);
            await page.fill('input[type="email"]', TEST_USERS[1].email);
            await page.fill('input[type="password"]', TEST_USERS[1].password);
            await page.click('button[type="submit"]');
            await page.waitForURL(/dashboard|app/, { timeout: 10000 });
            // Navigate to terms
            await page.goto(`${BASE_URL}/app`);
            // Access multiple terms without limitation
            const termLinks = await page.locator('a[href*="/term/"]').all();
            for (let i = 0; i < Math.min(10, termLinks.length); i++) {
                await termLinks[i].click();
                await page.waitForLoadState('networkidle');
                // Verify no upgrade prompt
                const upgradePrompt = page.locator('text=/upgrade|premium|limit/i');
                if (await upgradePrompt.isVisible()) {
                    throw new Error('Premium user should not see upgrade prompts');
                }
                await page.goBack();
            }
            await context.close();
        });
        // Test admin dashboard access
        await this.runTest('Admin dashboard access', async () => {
            const context = await this.browser.newContext();
            const page = await context.newPage();
            // Login as admin
            await page.goto(`${BASE_URL}/login`);
            await page.fill('input[type="email"]', TEST_USERS[0].email);
            await page.fill('input[type="password"]', TEST_USERS[0].password);
            await page.click('button[type="submit"]');
            await page.waitForURL(/admin|dashboard/, { timeout: 10000 });
            // Navigate to admin dashboard
            await page.goto(`${BASE_URL}/admin`);
            await page.waitForLoadState('networkidle');
            // Verify admin features are visible
            const adminFeatures = [
                'text=/content management/i',
                'text=/user management/i',
                'text=/analytics/i'
            ];
            for (const feature of adminFeatures) {
                const element = page.locator(feature).first();
                if (!(await element.isVisible())) {
                    throw new Error(`Admin feature not found: ${feature}`);
                }
            }
            await context.close();
        });
    }
    async testSearchFunctionality() {
        console.log(chalk.yellow('\n🔍 Testing Search Functionality\n'));
        await this.runTest('Search bar functionality', async () => {
            const context = await this.browser.newContext();
            const page = await context.newPage();
            await page.goto(`${BASE_URL}/app`);
            // Find search input
            const searchInput = await page.locator('input[placeholder*="Search"], input[type="search"]').first();
            await searchInput.fill('machine learning');
            await searchInput.press('Enter');
            // Wait for results
            await page.waitForLoadState('networkidle');
            // Verify results contain search term
            const results = await page.locator('text=/machine learning/i').count();
            if (results === 0) {
                throw new Error('No search results found for "machine learning"');
            }
            await context.close();
        });
        await this.runTest('Search suggestions', async () => {
            const context = await this.browser.newContext();
            const page = await context.newPage();
            await page.goto(`${BASE_URL}/app`);
            const searchInput = await page.locator('input[placeholder*="Search"], input[type="search"]').first();
            await searchInput.fill('neur');
            // Wait for suggestions
            await page.waitForTimeout(500);
            // Check if suggestions appear
            const suggestions = await page.locator('[role="listbox"], .search-suggestions').first();
            if (!(await suggestions.isVisible())) {
                throw new Error('Search suggestions not appearing');
            }
            await context.close();
        });
    }
    async testContentDisplay() {
        console.log(chalk.yellow('\n📄 Testing Content Display\n'));
        await this.runTest('Term detail page rendering', async () => {
            const context = await this.browser.newContext();
            const page = await context.newPage();
            await page.goto(`${BASE_URL}/app`);
            // Click on first term
            const firstTerm = await page.locator('a[href*="/term/"]').first();
            await firstTerm.click();
            // Wait for term page to load
            await page.waitForLoadState('networkidle');
            // Verify essential elements
            const elements = [
                'h1', // Term title
                'text=/definition|description/i', // Definition section
                '[data-testid="related-terms"], text=/related/i' // Related terms
            ];
            for (const selector of elements) {
                const element = page.locator(selector).first();
                if (!(await element.isVisible())) {
                    throw new Error(`Term page element not found: ${selector}`);
                }
            }
            await context.close();
        });
        await this.runTest('Code examples rendering', async () => {
            const context = await this.browser.newContext();
            const page = await context.newPage();
            // Login as premium user for full access
            await page.goto(`${BASE_URL}/login`);
            await page.fill('input[type="email"]', TEST_USERS[1].email);
            await page.fill('input[type="password"]', TEST_USERS[1].password);
            await page.click('button[type="submit"]');
            await page.waitForURL(/dashboard|app/, { timeout: 10000 });
            // Find a term with code examples
            await page.goto(`${BASE_URL}/app`);
            // Search for a programming-related term
            const searchInput = await page.locator('input[placeholder*="Search"], input[type="search"]').first();
            await searchInput.fill('algorithm');
            await searchInput.press('Enter');
            await page.waitForLoadState('networkidle');
            // Click first result
            const firstResult = await page.locator('a[href*="/term/"]').first();
            await firstResult.click();
            await page.waitForLoadState('networkidle');
            // Check for code blocks
            const codeBlocks = await page.locator('pre, code').count();
            if (codeBlocks === 0) {
                console.log(chalk.yellow('  Note: No code examples found on this term'));
            }
            await context.close();
        });
    }
    async testUserFeatures() {
        console.log(chalk.yellow('\n👤 Testing User Features\n'));
        await this.runTest('Favorites functionality', async () => {
            const context = await this.browser.newContext();
            const page = await context.newPage();
            // Login
            await page.goto(`${BASE_URL}/login`);
            await page.fill('input[type="email"]', TEST_USERS[1].email);
            await page.fill('input[type="password"]', TEST_USERS[1].password);
            await page.click('button[type="submit"]');
            await page.waitForURL(/dashboard|app/, { timeout: 10000 });
            // Navigate to a term
            await page.goto(`${BASE_URL}/app`);
            const firstTerm = await page.locator('a[href*="/term/"]').first();
            await firstTerm.click();
            await page.waitForLoadState('networkidle');
            // Add to favorites
            const favoriteButton = await page.locator('button[aria-label*="favorite"], button:has-text("Favorite"), button:has(svg[data-icon="heart"])').first();
            await favoriteButton.click();
            // Navigate to favorites page
            await page.goto(`${BASE_URL}/favorites`);
            await page.waitForLoadState('networkidle');
            // Verify term is in favorites
            const favoriteItems = await page.locator('a[href*="/term/"]').count();
            if (favoriteItems === 0) {
                throw new Error('No items found in favorites after adding');
            }
            await context.close();
        });
        await this.runTest('Progress tracking', async () => {
            const context = await this.browser.newContext();
            const page = await context.newPage();
            // Login
            await page.goto(`${BASE_URL}/login`);
            await page.fill('input[type="email"]', TEST_USERS[1].email);
            await page.fill('input[type="password"]', TEST_USERS[1].password);
            await page.click('button[type="submit"]');
            await page.waitForURL(/dashboard|app/, { timeout: 10000 });
            // Navigate to progress page
            await page.goto(`${BASE_URL}/progress`);
            await page.waitForLoadState('networkidle');
            // Verify progress elements
            const progressElements = [
                'text=/streak/i',
                'text=/terms.*viewed/i',
                'text=/progress/i'
            ];
            for (const selector of progressElements) {
                const element = page.locator(selector).first();
                if (!(await element.isVisible())) {
                    console.log(chalk.yellow(`  Progress element not found: ${selector}`));
                }
            }
            await context.close();
        });
    }
    async testMobileResponsiveness() {
        console.log(chalk.yellow('\n📱 Testing Mobile Responsiveness\n'));
        await this.runTest('Mobile navigation', async () => {
            const context = await this.browser.newContext({
                viewport: { width: 375, height: 667 }, // iPhone SE
                userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15'
            });
            const page = await context.newPage();
            await page.goto(`${BASE_URL}/app`);
            // Check for mobile menu
            const mobileMenu = await page.locator('button[aria-label*="menu"], button:has(svg[data-icon="menu"])').first();
            if (!(await mobileMenu.isVisible())) {
                throw new Error('Mobile menu button not found');
            }
            // Open mobile menu
            await mobileMenu.click();
            await page.waitForTimeout(300);
            // Verify navigation items
            const navItems = await page.locator('nav a, [role="navigation"] a').count();
            if (navItems === 0) {
                throw new Error('No navigation items found in mobile menu');
            }
            await context.close();
        });
        await this.runTest('Touch interactions', async () => {
            const context = await this.browser.newContext({
                viewport: { width: 375, height: 667 },
                hasTouch: true
            });
            const page = await context.newPage();
            await page.goto(`${BASE_URL}/app`);
            // Test swipe/scroll
            await page.locator('body').first().evaluate(() => {
                window.scrollTo(0, 500);
            });
            // Verify scroll worked
            const scrollY = await page.evaluate(() => window.scrollY);
            if (scrollY === 0) {
                throw new Error('Page did not scroll on mobile');
            }
            await context.close();
        });
    }
    async testPerformance() {
        console.log(chalk.yellow('\n⚡ Testing Performance\n'));
        await this.runTest('Initial page load time', async () => {
            const context = await this.browser.newContext();
            const page = await context.newPage();
            const startTime = Date.now();
            await page.goto(BASE_URL, { waitUntil: 'networkidle' });
            const loadTime = Date.now() - startTime;
            console.log(chalk.gray(`  Load time: ${loadTime}ms`));
            if (loadTime > 5000) {
                throw new Error(`Page load too slow: ${loadTime}ms (expected < 5000ms)`);
            }
            await context.close();
        });
        await this.runTest('Search response time', async () => {
            const context = await this.browser.newContext();
            const page = await context.newPage();
            await page.goto(`${BASE_URL}/app`);
            const searchInput = await page.locator('input[placeholder*="Search"], input[type="search"]').first();
            await searchInput.fill('test');
            const startTime = Date.now();
            await searchInput.press('Enter');
            await page.waitForLoadState('networkidle');
            const searchTime = Date.now() - startTime;
            console.log(chalk.gray(`  Search time: ${searchTime}ms`));
            if (searchTime > 2000) {
                throw new Error(`Search too slow: ${searchTime}ms (expected < 2000ms)`);
            }
            await context.close();
        });
    }
    async testErrorHandling() {
        console.log(chalk.yellow('\n⚠️ Testing Error Handling\n'));
        await this.runTest('404 page handling', async () => {
            const context = await this.browser.newContext();
            const page = await context.newPage();
            await page.goto(`${BASE_URL}/nonexistent-page-12345`);
            // Check for 404 content
            const notFoundText = await page.locator('text=/404|not found/i').first();
            if (!(await notFoundText.isVisible())) {
                throw new Error('404 page not displayed for nonexistent route');
            }
            await context.close();
        });
        await this.runTest('Invalid login handling', async () => {
            const context = await this.browser.newContext();
            const page = await context.newPage();
            await page.goto(`${BASE_URL}/login`);
            await page.fill('input[type="email"]', 'invalid@example.com');
            await page.fill('input[type="password"]', 'wrongpassword');
            await page.click('button[type="submit"]');
            // Wait for error message
            await page.waitForTimeout(1000);
            const errorMessage = await page.locator('text=/invalid|incorrect|error/i').first();
            if (!(await errorMessage.isVisible())) {
                throw new Error('No error message shown for invalid credentials');
            }
            await context.close();
        });
    }
    async run() {
        try {
            await this.setup();
            // Run all test suites
            await this.testAuthenticationFlows();
            await this.testAccessControl();
            await this.testSearchFunctionality();
            await this.testContentDisplay();
            await this.testUserFeatures();
            await this.testMobileResponsiveness();
            await this.testPerformance();
            await this.testErrorHandling();
        }
        catch (error) {
            console.error(chalk.red('\n❌ Test runner error:'), error);
        }
        finally {
            await this.teardown();
        }
    }
}
// Helper function for assertions
async function expect(locator) {
    return {
        async toBeVisible(options) {
            const timeout = options?.timeout || 5000;
            const visible = await locator.isVisible({ timeout });
            if (!visible) {
                throw new Error(`Element not visible: ${locator}`);
            }
        }
    };
}
// Run tests
const runner = new FunctionalTestRunner();
runner.run().catch(console.error);
