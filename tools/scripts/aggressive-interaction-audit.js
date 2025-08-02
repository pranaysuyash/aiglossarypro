import { chromium } from 'playwright';
import * as fs from 'fs';
import * as path from 'path';
// Parse command line arguments
const args = process.argv.slice(2);
const testMode = args[0] || 'all'; // all, public, auth, storybook, functional
const specificUser = args[1]; // free, premium, admin (optional)
console.log(`🎯 Test Mode: ${testMode}`);
if (specificUser)
    console.log(`👤 Specific User: ${specificUser}`);
const TEST_USERS = [
    { email: 'test@aimlglossary.com', password: 'testpassword123', type: 'free' },
    { email: 'premium@aimlglossary.com', password: 'premiumpass123', type: 'premium' },
    { email: 'admin@aimlglossary.com', password: 'adminpass123', type: 'admin' }
];
class AggressiveInteractionAudit {
    browser;
    screenshotCount = 0;
    reportDir;
    baseUrl;
    constructor(baseUrl = 'http://localhost:5173') {
        this.baseUrl = baseUrl;
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        this.reportDir = path.join(process.cwd(), 'reports', 'aggressive-audit', timestamp);
    }
    async initialize() {
        // Create report directory
        fs.mkdirSync(this.reportDir, { recursive: true });
        fs.mkdirSync(path.join(this.reportDir, 'screenshots'), { recursive: true });
        // Launch browser
        this.browser = await chromium.launch({
            headless: false,
            args: ['--start-maximized']
        });
        console.log(`📁 Report directory: ${this.reportDir}`);
        console.log(`🌐 Base URL: ${this.baseUrl}`);
    }
    async captureScreenshot(page, name, fullPage = false) {
        this.screenshotCount++;
        const filename = `${String(this.screenshotCount).padStart(3, '0')}-${name}-${Date.now()}.png`;
        const filepath = path.join(this.reportDir, 'screenshots', filename);
        await page.screenshot({
            path: filepath,
            fullPage: fullPage
        });
        console.log(`📸 Screenshot ${this.screenshotCount}: ${name}`);
        return filename;
    }
    async handleCookieConsent(page) {
        try {
            const cookieButton = await page.waitForSelector('button:has-text("Accept")', { timeout: 3000 });
            if (cookieButton) {
                await cookieButton.click();
                await page.waitForTimeout(500);
            }
        }
        catch {
            // Cookie banner might not be present
        }
    }
    async testAllInteractions(page, pageName) {
        console.log(`\n🔍 Testing interactions on ${pageName}...`);
        // Capture initial state
        await this.captureScreenshot(page, `${pageName}-initial`);
        // Test clickable elements more selectively
        const buttonSelectors = [
            'button',
            'a[href]',
            '[role="button"]'
        ];
        for (const selector of buttonSelectors) {
            try {
                const elements = await page.$$(selector);
                console.log(`Found ${elements.length} ${selector} elements`);
                // Test only first few of each type
                for (let i = 0; i < Math.min(elements.length, 3); i++) {
                    try {
                        const element = elements[i];
                        const isVisible = await element.isVisible();
                        if (!isVisible)
                            continue;
                        const elementInfo = await element.evaluate(el => ({
                            tag: el.tagName,
                            text: el.textContent?.trim().substring(0, 50),
                            href: el.href,
                            id: el.id,
                            className: el.className
                        }));
                        // Skip external links, cookie banner, and certain buttons
                        if (elementInfo.href?.includes('http') && !elementInfo.href.includes(this.baseUrl)) {
                            continue;
                        }
                        if (elementInfo.text?.toLowerCase().includes('accept') ||
                            elementInfo.text?.toLowerCase().includes('cookie')) {
                            continue;
                        }
                        // Hover effect with timeout
                        await Promise.race([
                            element.hover(),
                            page.waitForTimeout(1000)
                        ]);
                        await page.waitForTimeout(100);
                        await this.captureScreenshot(page, `${pageName}-hover-${selector.replace(/[:\[\]]/g, '')}-${i}`);
                        // Click only non-navigation elements
                        if (elementInfo.tag === 'BUTTON' || !elementInfo.href || elementInfo.href === '#') {
                            await Promise.race([
                                element.click(),
                                page.waitForTimeout(2000)
                            ]);
                            await page.waitForTimeout(300);
                            await this.captureScreenshot(page, `${pageName}-click-${selector.replace(/[:\[\]]/g, '')}-${i}`);
                            // Try to close any modals
                            const closeButton = await page.$('button:has-text("Close"), button:has-text("Cancel"), button[aria-label*="close"]');
                            if (closeButton && await closeButton.isVisible()) {
                                await closeButton.click();
                                await page.waitForTimeout(200);
                            }
                        }
                    }
                    catch (error) {
                        console.log(`⚠️  Error interacting with element: ${error.message}`);
                    }
                }
            }
            catch (error) {
                console.log(`⚠️  Error with selector ${selector}: ${error.message}`);
            }
        }
        // Test form inputs
        const inputs = await page.$$('input[type="text"], input[type="search"], textarea, select');
        for (let i = 0; i < Math.min(inputs.length, 5); i++) {
            try {
                const input = inputs[i];
                await input.click();
                await input.fill('Test input ' + i);
                await this.captureScreenshot(page, `${pageName}-input-${i}`);
            }
            catch {
                // Input might not be fillable
            }
        }
        // Test scroll positions
        await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight / 2));
        await page.waitForTimeout(300);
        await this.captureScreenshot(page, `${pageName}-scroll-middle`);
        await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
        await page.waitForTimeout(300);
        await this.captureScreenshot(page, `${pageName}-scroll-bottom`);
        await page.evaluate(() => window.scrollTo(0, 0));
    }
    async testResponsiveDesign(page, pageName) {
        const viewports = [
            { width: 320, height: 568, name: 'iphone-5' },
            { width: 375, height: 667, name: 'iphone-8' },
            { width: 414, height: 896, name: 'iphone-11' },
            { width: 768, height: 1024, name: 'ipad' },
            { width: 1024, height: 768, name: 'ipad-landscape' },
            { width: 1366, height: 768, name: 'laptop' },
            { width: 1920, height: 1080, name: 'desktop' },
            { width: 2560, height: 1440, name: '4k' }
        ];
        for (const viewport of viewports) {
            await page.setViewportSize(viewport);
            await page.waitForTimeout(500);
            await this.captureScreenshot(page, `${pageName}-${viewport.name}`);
        }
    }
    async testDarkMode(page, pageName) {
        // Test dark mode toggle
        try {
            const darkModeButton = await page.$('button[aria-label*="dark mode"], button[aria-label*="theme"]');
            if (darkModeButton) {
                await darkModeButton.click();
                await page.waitForTimeout(500);
                await this.captureScreenshot(page, `${pageName}-dark-mode`);
                // Toggle back
                await darkModeButton.click();
                await page.waitForTimeout(500);
            }
        }
        catch (error) {
            // Dark mode toggle might not be available
        }
    }
    async testTermInteractions(page) {
        console.log('\n📚 Testing term interactions...');
        // Navigate to terms page
        await page.goto(`${this.baseUrl}/terms`);
        await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => { });
        // Click on several term cards
        const termCards = await page.$$('.cursor-pointer');
        for (let i = 0; i < Math.min(termCards.length, 5); i++) {
            try {
                await termCards[i].click();
                await page.waitForTimeout(1000);
                await this.captureScreenshot(page, `term-detail-${i}`);
                // Test term page interactions
                const favoriteButton = await page.$('button:has-text("Favorite"), button:has-text("Save")');
                if (favoriteButton) {
                    await favoriteButton.click();
                    await page.waitForTimeout(500);
                    await this.captureScreenshot(page, `term-favorite-${i}`);
                }
                // Go back to terms list
                await page.goBack();
                await page.waitForTimeout(500);
            }
            catch (error) {
                console.log(`⚠️  Error testing term ${i}: ${error.message}`);
            }
        }
    }
    async testUserJourney(context, user) {
        console.log(`\n👤 Testing ${user.type} user journey...`);
        const page = await context.newPage();
        try {
            // Login flow
            await page.goto(`${this.baseUrl}/login`);
            await this.handleCookieConsent(page);
            await this.captureScreenshot(page, `${user.type}-login-initial`);
            // Wait for login form to be ready
            await page.waitForSelector('input[type="email"]', { state: 'visible' });
            // Fill login form
            await page.fill('input[type="email"]', user.email);
            await this.captureScreenshot(page, `${user.type}-login-email-filled`);
            await page.fill('input[type="password"]', user.password);
            await this.captureScreenshot(page, `${user.type}-login-password-filled`);
            // Submit and wait for navigation
            await Promise.all([
                page.waitForNavigation({ waitUntil: 'networkidle' }),
                page.click('button[type="submit"]')
            ]);
            await page.waitForTimeout(2000); // Give time for auth to complete
            await this.captureScreenshot(page, `${user.type}-login-success`);
            // Verify login success
            const isLoggedIn = await page.$('button:has-text("Sign out"), button:has-text("Log out")');
            if (!isLoggedIn) {
                console.log(`⚠️  Login may have failed for ${user.type} user`);
            }
        }
        catch (error) {
            console.log(`❌ Login error for ${user.type}: ${error.message}`);
            await this.captureScreenshot(page, `${user.type}-login-error`);
        }
        // Test authenticated pages
        const authenticatedPages = [
            '/app',
            '/dashboard',
            '/categories',
            '/favorites',
            '/settings',
            '/profile',
            '/learning-paths',
            '/code-examples',
            '/trending',
            '/discovery'
        ];
        if (user.type === 'admin') {
            authenticatedPages.push('/admin', '/analytics');
        }
        for (const pagePath of authenticatedPages) {
            try {
                await page.goto(`${this.baseUrl}${pagePath}`);
                await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => { });
                await this.testAllInteractions(page, `${user.type}${pagePath.replace(/\//g, '-')}`);
            }
            catch (error) {
                console.log(`⚠️  Error testing ${pagePath}: ${error.message}`);
            }
        }
        await page.close();
    }
    async testPublicPages(context) {
        console.log('\n🌐 Testing public pages...');
        const page = await context.newPage();
        const publicPages = [
            { path: '/', name: 'landing' },
            { path: '/app', name: 'home' },
            { path: '/categories', name: 'categories' },
            { path: '/terms', name: 'terms' },
            { path: '/about', name: 'about' },
            { path: '/privacy', name: 'privacy' },
            { path: '/terms-of-service', name: 'tos' },
            { path: '/lifetime', name: 'pricing' },
            { path: '/surprise-me', name: 'surprise' },
            { path: '/ai-tools', name: 'ai-tools' },
            { path: '/learning-paths', name: 'learning-paths' },
            { path: '/code-examples', name: 'code-examples' },
            { path: '/trending', name: 'trending' },
            { path: '/discovery', name: 'discovery' },
            { path: '/3d-visualization', name: '3d-viz' },
            { path: '/support', name: 'support' }
        ];
        for (const { path, name } of publicPages) {
            try {
                await page.goto(`${this.baseUrl}${path}`);
                await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => { });
                await this.handleCookieConsent(page);
                await this.testAllInteractions(page, name);
                await this.testDarkMode(page, name);
                await this.testResponsiveDesign(page, name);
            }
            catch (error) {
                console.log(`⚠️  Error testing ${path}: ${error.message}`);
            }
        }
        await page.close();
    }
    async testSearchFunctionality(context) {
        console.log('\n🔍 Testing search functionality...');
        const page = await context.newPage();
        await page.goto(`${this.baseUrl}/app`);
        await this.handleCookieConsent(page);
        const searchTerms = [
            'neural network',
            'machine learning',
            'deep learning',
            'AI',
            'transformer',
            'LSTM',
            'CNN',
            'GAN',
            'reinforcement learning',
            'NLP'
        ];
        for (const term of searchTerms) {
            try {
                // Find search input
                const searchInput = await page.$('input[placeholder*="Search"]');
                if (searchInput) {
                    await searchInput.click();
                    await searchInput.fill(term);
                    await this.captureScreenshot(page, `search-${term.replace(/\s+/g, '-')}`);
                    // Wait for suggestions
                    await page.waitForTimeout(1000);
                    await this.captureScreenshot(page, `search-suggestions-${term.replace(/\s+/g, '-')}`);
                    // Submit search
                    await page.keyboard.press('Enter');
                    await page.waitForTimeout(1000);
                    await this.captureScreenshot(page, `search-results-${term.replace(/\s+/g, '-')}`);
                }
            }
            catch (error) {
                console.log(`⚠️  Error searching for ${term}: ${error.message}`);
            }
        }
        await page.close();
    }
    async generateReport() {
        const report = {
            timestamp: new Date().toISOString(),
            baseUrl: this.baseUrl,
            totalScreenshots: this.screenshotCount,
            reportDirectory: this.reportDir
        };
        fs.writeFileSync(path.join(this.reportDir, 'audit-summary.json'), JSON.stringify(report, null, 2));
        console.log('\n📊 Audit Summary:');
        console.log(`Total Screenshots: ${this.screenshotCount}`);
        console.log(`Report Location: ${this.reportDir}`);
    }
    async run() {
        try {
            await this.initialize();
            // Create main context
            const context = await this.browser.newContext({
                viewport: { width: 1920, height: 1080 },
                ignoreHTTPSErrors: true
            });
            // No timeout - let it run until completion
            context.setDefaultTimeout(0);
            context.setDefaultNavigationTimeout(30000);
            // Execute based on test mode
            switch (testMode) {
                case 'public':
                    console.log('🌐 Running public pages test only...');
                    await this.testPublicPages(context);
                    break;
                case 'auth':
                    console.log('🔐 Running authenticated user tests only...');
                    const users = specificUser
                        ? TEST_USERS.filter(u => u.type === specificUser)
                        : TEST_USERS;
                    for (const user of users) {
                        await this.testUserJourney(context, user);
                    }
                    break;
                case 'search':
                    console.log('🔍 Running search functionality test only...');
                    await this.testSearchFunctionality(context);
                    break;
                case 'terms':
                    console.log('📚 Running term interactions test only...');
                    const termPage = await context.newPage();
                    await this.testTermInteractions(termPage);
                    await termPage.close();
                    break;
                case 'all':
                default:
                    console.log('🎯 Running comprehensive test suite...');
                    // Test public pages first
                    await this.testPublicPages(context);
                    // Test search functionality
                    await this.testSearchFunctionality(context);
                    // Test term interactions
                    const termTestPage = await context.newPage();
                    await this.testTermInteractions(termTestPage);
                    await termTestPage.close();
                    // Test all user journeys for comprehensive coverage
                    for (const user of TEST_USERS) {
                        console.log(`\n👤 Starting ${user.type} user journey...`);
                        await this.testUserJourney(context, user);
                    }
                    break;
            }
            // Generate report
            await this.generateReport();
            console.log('\n✅ Audit completed successfully!');
            console.log(`📸 Total screenshots captured: ${this.screenshotCount}`);
        }
        catch (error) {
            console.error('❌ Audit failed:', error);
        }
        finally {
            await this.browser.close();
        }
    }
}
// Run the audit
const audit = new AggressiveInteractionAudit();
audit.run().catch(console.error);
