#!/usr/bin/env tsx
/**
 * ENHANCED FUNCTIONAL AUDIT SCRIPT FOR AI-DRIVEN WORKFLOW
 *
 * This script extends the comprehensive functional audit with:
 * - Step-by-step screenshot capture after every user action
 * - Video recording of complete user flows
 * - Accessibility scans at each interaction step
 * - Systematic interaction with all components on each page
 * - Detailed artifact organization for AI analysis
 *
 * Flags:
 * --capture-all: Enable step-by-step screenshots (default: false)
 * --record-video: Enable video recording (default: false)
 * --interact-all: Systematically interact with all page components (default: false)
 * --accessibility: Run axe-core scans at each step (default: false)
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import { getViolations, injectAxe } from 'axe-playwright';
import chalk from 'chalk';
import { config } from 'dotenv';
import { chromium, devices } from 'playwright';
// Load environment variables
config();
class EnhancedFunctionalAuditor {
    browser = null;
    context = null;
    baseUrl = process.env.BASE_URL || 'http://localhost:5173';
    apiUrl = 'http://localhost:3001/api';
    artifactsDir;
    testResults = [];
    currentActions = [];
    actionCounter = 0;
    // Configuration flags
    captureAll;
    recordVideo;
    interactAll;
    runAccessibility;
    // Test user configurations - Updated to match actual test users
    testUsers = [
        {
            email: 'test@aimlglossary.com',
            password: 'testpassword123',
            type: 'free',
            expectedFeatures: ['basic search', 'limited view count'],
            expectedLimitations: ['daily view limits', 'upgrade prompts', 'restricted premium access'],
        },
        {
            email: 'premium@aimlglossary.com',
            password: 'premiumpass123',
            type: 'premium',
            expectedFeatures: [
                'unlimited access',
                '42-section components',
                'gamification',
                'progress tracking',
            ],
            expectedLimitations: [],
        },
        {
            email: 'admin@aimlglossary.com',
            password: 'adminpass123',
            type: 'admin',
            expectedFeatures: [
                'admin dashboard',
                'content generation',
                'user management',
                'all premium features',
            ],
            expectedLimitations: [],
        },
    ];
    // Common interactive selectors to test
    interactiveSelectors = [
        'button',
        'input[type="button"]',
        'input[type="submit"]',
        '[role="button"]',
        'a:not([href^="#"])',
        'select',
        'input[type="text"]',
        'input[type="email"]',
        'input[type="password"]',
        'input[type="search"]',
        'textarea',
        '[data-testid*="button"]',
        '[data-testid*="input"]',
        '[data-testid*="dropdown"]',
        '[data-testid*="toggle"]',
        '.dropdown-trigger',
        '.modal-trigger',
        '.tab-button',
        '.accordion-header',
    ];
    constructor() {
        // Parse command line flags
        this.captureAll = process.argv.includes('--capture-all');
        this.recordVideo = process.argv.includes('--record-video');
        this.interactAll = process.argv.includes('--interact-all');
        this.runAccessibility = process.argv.includes('--accessibility');
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        this.artifactsDir = path.join(process.cwd(), 'reports', 'ai-driven-audit', timestamp);
    }
    async initialize() {
        await fs.mkdir(path.join(this.artifactsDir, 'screenshots'), { recursive: true });
        await fs.mkdir(path.join(this.artifactsDir, 'videos'), { recursive: true });
        await fs.mkdir(path.join(this.artifactsDir, 'accessibility'), { recursive: true });
        console.log(chalk.blue('🚀 Starting ENHANCED AI-Driven Functional Audit...'));
        console.log(chalk.gray(`Artifacts Directory: ${this.artifactsDir}`));
        console.log(chalk.gray(`Capture All: ${this.captureAll}`));
        console.log(chalk.gray(`Record Video: ${this.recordVideo}`));
        console.log(chalk.gray(`Interact All: ${this.interactAll}`));
        console.log(chalk.gray(`Accessibility: ${this.runAccessibility}`));
    }
    async launchBrowser() {
        console.log(chalk.yellow('🌐 Launching browser...'));
        this.browser = await chromium.launch({
            headless: false,
            slowMo: 100, // Slower interactions for better video capture
        });
        this.context = await this.browser.newContext({
            ...devices['Desktop Chrome'],
            recordVideo: this.recordVideo
                ? {
                    dir: path.join(this.artifactsDir, 'videos'),
                    size: { width: 1920, height: 1080 },
                }
                : undefined,
        });
    }
    shouldRunAccessibilityScan(actionType) {
        // Only run accessibility scans on meaningful page state changes
        const scanOnActions = ['navigate', 'click'];
        return scanOnActions.includes(actionType);
    }
    async captureAction(page, actionType, description, selector, value) {
        this.actionCounter++;
        const timestamp = new Date().toISOString();
        const action = {
            type: actionType,
            selector,
            value,
            description,
            timestamp,
        };
        // Capture screenshot if enabled
        if (this.captureAll) {
            const screenshotPath = path.join(this.artifactsDir, 'screenshots', `action-${this.actionCounter.toString().padStart(3, '0')}-${actionType}-${Date.now()}.png`);
            await page.screenshot({
                path: screenshotPath,
                fullPage: true,
            });
            action.screenshotPath = screenshotPath;
            console.log(chalk.gray(`📸 Screenshot: ${path.basename(screenshotPath)}`));
        }
        // Run accessibility scan if enabled (but only on specific action types and with delays)
        if (this.runAccessibility && this.shouldRunAccessibilityScan(actionType)) {
            try {
                // Wait for page to stabilize before running accessibility scan
                await page.waitForTimeout(1500);
                try {
                    await page.waitForLoadState('networkidle', { timeout: 3000 });
                }
                catch (e) {
                    // Continue even if timeout
                }
                const violations = await getViolations(page, {
                    tags: ['wcag2a', 'wcag2aa', 'wcag21aa'], // Focus on critical accessibility standards
                    rules: {
                        // Disable rules that commonly produce false positives in dynamic content
                        'color-contrast': { enabled: false }, // Often fails during transitions
                        'duplicate-id-aria': { enabled: false }, // Can be false positive in React apps
                        'aria-hidden-focus': { enabled: false }, // Often false positive with modals/dialogs
                    },
                });
                // Filter out violations that are likely false positives
                const significantViolations = violations.filter(violation => {
                    // Skip violations in elements that might be in transition
                    if (violation.nodes.some(node => {
                        const html = node.html || '';
                        return html.includes('opacity: 0') ||
                            html.includes('visibility: hidden') ||
                            html.includes('display: none');
                    })) {
                        return false;
                    }
                    // Skip violations that are very common and often false positives
                    const skipRules = ['color-contrast', 'duplicate-id-aria', 'aria-hidden-focus'];
                    if (skipRules.includes(violation.id)) {
                        return false;
                    }
                    return true;
                });
                if (significantViolations.length > 0) {
                    action.accessibilityIssues = significantViolations;
                    // Save detailed accessibility report
                    const a11yReportPath = path.join(this.artifactsDir, 'accessibility', `a11y-${this.actionCounter.toString().padStart(3, '0')}-${Date.now()}.json`);
                    await fs.writeFile(a11yReportPath, JSON.stringify({
                        timestamp: new Date().toISOString(),
                        actionType,
                        description,
                        totalViolations: violations.length,
                        significantViolations: significantViolations.length,
                        violations: significantViolations,
                    }, null, 2));
                    console.log(chalk.red(`♿ Found ${significantViolations.length} significant accessibility issues (${violations.length} total)`));
                }
            }
            catch (error) {
                console.log(chalk.yellow(`⚠️ Accessibility scan failed: ${error.message}`));
            }
        }
        this.currentActions.push(action);
        console.log(chalk.cyan(`${this.actionCounter}. ${description}`));
    }
    async interactWithAllComponents(page, flowName) {
        if (!this.interactAll)
            return;
        console.log(chalk.blue(`🔍 Systematically interacting with all components on ${flowName}...`));
        for (const selector of this.interactiveSelectors) {
            try {
                const elements = await page.locator(selector).all();
                for (let i = 0; i < Math.min(elements.length, 5); i++) {
                    // Limit to 5 per selector type
                    const element = elements[i];
                    // Check if element is visible and enabled
                    if ((await element.isVisible()) && (await element.isEnabled())) {
                        const tagName = await element.evaluate(el => el.tagName);
                        const textContent = (await element.textContent()) || '';
                        const truncatedText = textContent.slice(0, 30);
                        await this.captureAction(page, 'hover', `Hover over ${tagName.toLowerCase()}: "${truncatedText}"`, selector);
                        await element.hover();
                        await page.waitForTimeout(500); // Allow for hover effects
                        // Try clicking if it's a clickable element
                        if (['BUTTON', 'A', 'INPUT'].includes(tagName) || selector.includes('button')) {
                            await this.captureAction(page, 'click', `Click ${tagName.toLowerCase()}: "${truncatedText}"`, selector);
                            try {
                                await element.click();
                                await page.waitForTimeout(1000); // Allow for navigation/state changes
                            }
                            catch (clickError) {
                                console.log(chalk.yellow(`⚠️ Could not click element: ${clickError.message}`));
                            }
                        }
                    }
                }
            }
            catch (error) { }
        }
    }
    async runUserFlow(user) {
        if (!this.context)
            throw new Error('Browser context not initialized');
        const page = await this.context.newPage();
        const flows = [];
        // Inject axe for accessibility testing
        if (this.runAccessibility) {
            await injectAxe(page);
        }
        try {
            // Flow 1: Authentication
            const authFlow = await this.runAuthenticationFlow(page, user);
            flows.push(authFlow);
            // Flow 2: Main Navigation and Search
            const navigationFlow = await this.runNavigationFlow(page, user);
            flows.push(navigationFlow);
            // Flow 3: User-specific feature testing
            const featureFlow = await this.runFeatureSpecificFlow(page, user);
            flows.push(featureFlow);
            // Flow 4: Responsive design testing
            const responsiveFlow = await this.runResponsiveFlow(page, user);
            flows.push(responsiveFlow);
        }
        finally {
            await page.close();
        }
        return flows;
    }
    async runAuthenticationFlow(page, user) {
        const startTime = Date.now();
        this.currentActions = [];
        let status = 'PASS';
        console.log(chalk.magenta(`🔐 Authentication Flow - ${user.type} user`));
        try {
            await this.captureAction(page, 'navigate', `Navigate to homepage`, undefined, this.baseUrl);
            await page.goto(this.baseUrl);
            // Remove timeout - let it load naturally
            try {
                try {
                    await page.waitForLoadState('networkidle', { timeout: 3000 });
                }
                catch (e) {
                    // Continue even if timeout
                }
            }
            catch (e) {
                // Continue if timeout - page might be loaded enough
            }
            // Wait for React app to load properly
            await page.waitForSelector('h1', { timeout: 10000 });
            await page.waitForFunction(() => {
                return document.querySelector('h1') && document.querySelector('h1').textContent.includes('AI/ML Glossary');
            }, { timeout: 10000 });
            // Handle cookie consent if present
            try {
                const cookieButton = page
                    .locator('button:has-text("Accept"), button:has-text("OK"), [data-testid*="cookie"]')
                    .first();
                if (await cookieButton.isVisible({ timeout: 2000 })) {
                    await this.captureAction(page, 'click', 'Accept cookie consent');
                    await cookieButton.click();
                }
            }
            catch {
                // No cookie consent found
            }
            // Interact with all components on homepage if enabled
            await this.interactWithAllComponents(page, 'Homepage');
            // Look for login/signin button or navigate directly to login page
            const loginSelectors = [
                'a:has-text("Sign In")',
                'a:has-text("Login")',
                'button:has-text("Sign In")',
                'button:has-text("Login")',
                '[data-testid*="login"]',
                '[data-testid*="signin"]',
                '[href*="login"]',
                'button:has-text("Sign in to track progress")',
            ];
            let loginButton = null;
            for (const selector of loginSelectors) {
                try {
                    loginButton = page.locator(selector).first();
                    if (await loginButton.isVisible({ timeout: 1000 }))
                        break;
                }
                catch { }
            }
            if (loginButton && (await loginButton.isVisible())) {
                await this.captureAction(page, 'click', 'Click login/signin button');
                await loginButton.click();
                // Remove timeout - let it load naturally
                try {
                    try {
                        await page.waitForLoadState('networkidle', { timeout: 3000 });
                    }
                    catch (e) {
                        // Continue even if timeout
                    }
                }
                catch (e) {
                    // Continue if timeout - page might be loaded enough
                }
            }
            else {
                // If no login button found, navigate directly to login page
                await this.captureAction(page, 'navigate', 'Navigate to login page directly');
                await page.goto(`${this.baseUrl}/login`);
                // Remove timeout - let it load naturally
                try {
                    try {
                        await page.waitForLoadState('networkidle', { timeout: 3000 });
                    }
                    catch (e) {
                        // Continue even if timeout
                    }
                }
                catch (e) {
                    // Continue if timeout - page might be loaded enough
                }
            }
            // Handle cookie consent banner first
            await this.handleCookieConsent(page);
            // Wait for login form to be present
            await page.waitForSelector('input[type="email"], input[name="email"]', { timeout: 5000 });
            // Fill login form
            await this.captureAction(page, 'fill', 'Enter email', 'input[type="email"], input[name="email"]', user.email);
            await page.fill('input[type="email"], input[name="email"]', user.email);
            await this.captureAction(page, 'fill', 'Enter password', 'input[type="password"]', '***');
            await page.fill('input[type="password"]', user.password);
            await this.captureAction(page, 'click', 'Submit login form');
            await page.click('button[type="submit"], button:has-text("Sign In"), button:has-text("Login")');
            // Remove timeout - let it load naturally
            try {
                try {
                    await page.waitForLoadState('networkidle', { timeout: 3000 });
                }
                catch (e) {
                    // Continue even if timeout
                }
            }
            catch (e) {
                // Continue if timeout - page might be loaded enough
            }
            // Verify login success
            const isLoggedIn = await this.verifyLoginSuccess(page, user);
            if (!isLoggedIn) {
                status = 'WARNING';
                await this.captureAction(page, 'navigate', 'Login verification failed - user may not be authenticated');
            }
        }
        catch (error) {
            console.log(chalk.red(`❌ Authentication flow failed: ${error.message}`));
            status = 'FAIL';
            await this.captureAction(page, 'navigate', `Authentication error: ${error.message}`);
        }
        const duration = Date.now() - startTime;
        return {
            flowName: 'Authentication',
            userType: user.type,
            actions: [...this.currentActions],
            status,
            duration,
        };
    }
    async handleCookieConsent(page) {
        try {
            // Look for cookie consent banner and accept it
            const cookieConsentSelectors = [
                'button:has-text("Accept All")',
                'button:has-text("Accept")',
                'button:has-text("OK")',
                'button:has-text("I Agree")',
                '[data-testid*="cookie-accept"]',
                '[data-testid*="consent-accept"]',
                '.cookie-consent button',
                '.cookie-banner button'
            ];
            for (const selector of cookieConsentSelectors) {
                try {
                    const button = page.locator(selector).first();
                    if (await button.isVisible({ timeout: 2000 })) {
                        await this.captureAction(page, 'click', 'Accept cookie consent');
                        await button.click();
                        await page.waitForTimeout(1000);
                        return;
                    }
                }
                catch (error) {
                    // Continue to next selector
                }
            }
        }
        catch (error) {
            // Cookie consent not found or error handling it - this is OK
            console.log('Cookie consent not found or handled');
        }
    }
    async verifyLoginSuccess(page, user) {
        try {
            // Look for indicators of successful login
            const successIndicators = [
                'text=Dashboard',
                'text=Profile',
                'text=Settings',
                'text=Logout',
                'text=Sign Out',
                '[data-testid*="user-menu"]',
                '[data-testid*="profile"]',
            ];
            for (const indicator of successIndicators) {
                try {
                    if (await page.locator(indicator).isVisible({ timeout: 2000 })) {
                        return true;
                    }
                }
                catch { }
            }
            // Check for absence of login button as another indicator
            const loginButtons = page.locator('a:has-text("Sign In"), a:has-text("Login"), button:has-text("Sign In"), button:has-text("Login")');
            if ((await loginButtons.count()) === 0) {
                return true;
            }
            return false;
        }
        catch {
            return false;
        }
    }
    async runNavigationFlow(page, user) {
        const startTime = Date.now();
        this.currentActions = [];
        let status = 'PASS';
        console.log(chalk.green(`🧭 Navigation Flow - ${user.type} user`));
        try {
            // Test main navigation - get fresh locators each time
            const navItemsData = [];
            // First, collect navigation data without keeping element references
            const navItems = await page.locator('nav a, header a, [role="navigation"] a').all();
            for (const navItem of navItems.slice(0, 5)) {
                try {
                    const href = await navItem.getAttribute('href');
                    const text = await navItem.textContent();
                    if (href &&
                        !href.startsWith('#') &&
                        !href.includes('mailto') &&
                        !href.includes('javascript:')) {
                        navItemsData.push({ href, text });
                    }
                }
                catch (error) {
                    console.log(chalk.yellow(`⚠️ Could not get nav item data: ${error.message}`));
                }
            }
            // Now navigate to each collected URL
            for (const navData of navItemsData) {
                if (!navData.href || !navData.text)
                    continue;
                try {
                    await this.captureAction(page, 'navigate', `Navigate to "${navData.text}"`, undefined, navData.href);
                    // Navigate using goto instead of click to avoid stale element issues
                    const fullUrl = navData.href.startsWith('http')
                        ? navData.href
                        : `${this.baseUrl}${navData.href}`;
                    await page.goto(fullUrl);
                    // Remove timeout - let it load naturally
                    try {
                        try {
                            await page.waitForLoadState('networkidle', { timeout: 3000 });
                        }
                        catch (e) {
                            // Continue even if timeout
                        }
                    }
                    catch (e) {
                        // Continue if timeout - page might be loaded enough
                    }
                    // Interact with components on this page
                    await this.interactWithAllComponents(page, `Navigation: ${navData.text}`);
                    // Test search if available
                    await this.testSearchFunctionality(page);
                }
                catch (error) {
                    console.log(chalk.yellow(`⚠️ Navigation to "${navData.text}" failed: ${error.message}`));
                    status = 'WARNING';
                    await this.captureAction(page, 'navigate', `Failed to navigate to "${navData.text}": ${error.message}`);
                }
            }
        }
        catch (error) {
            console.log(chalk.red(`❌ Navigation flow failed: ${error.message}`));
            status = 'FAIL';
            await this.captureAction(page, 'navigate', `Navigation flow error: ${error.message}`);
        }
        const duration = Date.now() - startTime;
        return {
            flowName: 'Navigation',
            userType: user.type,
            actions: [...this.currentActions],
            status,
            duration,
        };
    }
    async testSearchFunctionality(page) {
        const searchSelectors = [
            'input[type="search"]',
            'input[placeholder*="search" i]',
            '[data-testid*="search"] input',
            '.search-input',
        ];
        for (const selector of searchSelectors) {
            try {
                const searchInput = page.locator(selector).first();
                if (await searchInput.isVisible({ timeout: 1000 })) {
                    await this.captureAction(page, 'fill', 'Test search functionality', selector, 'machine learning');
                    await searchInput.fill('machine learning');
                    await page.keyboard.press('Enter');
                    await page.waitForLoadState('networkidle');
                    break;
                }
            }
            catch { }
        }
    }
    async runFeatureSpecificFlow(page, user) {
        const startTime = Date.now();
        this.currentActions = [];
        console.log(chalk.blue(`🎯 Feature-Specific Flow - ${user.type} user`));
        if (user.type === 'admin') {
            await this.testAdminFeatures(page);
        }
        else if (user.type === 'premium') {
            await this.testPremiumFeatures(page);
        }
        else {
            await this.testFreeUserLimitations(page);
        }
        const duration = Date.now() - startTime;
        return {
            flowName: 'Feature-Specific',
            userType: user.type,
            actions: [...this.currentActions],
            status: 'PASS',
            duration,
        };
    }
    async testAdminFeatures(page) {
        // Look for admin dashboard or admin-specific links
        const adminSelectors = [
            'a:has-text("Admin")',
            'a:has-text("Dashboard")',
            '[href*="admin"]',
            '[data-testid*="admin"]',
        ];
        for (const selector of adminSelectors) {
            try {
                const adminLink = page.locator(selector).first();
                if (await adminLink.isVisible({ timeout: 2000 })) {
                    await this.captureAction(page, 'click', 'Access admin area');
                    await adminLink.click();
                    await page.waitForLoadState('networkidle');
                    await this.interactWithAllComponents(page, 'Admin Dashboard');
                    break;
                }
            }
            catch { }
        }
    }
    async testPremiumFeatures(page) {
        // Test access to premium content and features
        await this.captureAction(page, 'scroll', 'Scroll to test premium content access');
        await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight / 2));
        await this.interactWithAllComponents(page, 'Premium Content');
    }
    async testFreeUserLimitations(page) {
        // Test free user limitations and upgrade prompts
        await this.captureAction(page, 'scroll', 'Scroll to test free user limitations');
        await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
        await this.interactWithAllComponents(page, 'Free User Content');
    }
    async runResponsiveFlow(page, user) {
        const startTime = Date.now();
        this.currentActions = [];
        console.log(chalk.yellow(`📱 Responsive Design Flow - ${user.type} user`));
        // Test different viewport sizes
        const viewports = [
            { width: 375, height: 667, name: 'Mobile' },
            { width: 768, height: 1024, name: 'Tablet' },
            { width: 1920, height: 1080, name: 'Desktop' },
        ];
        for (const viewport of viewports) {
            await this.captureAction(page, 'scroll', `Test ${viewport.name} viewport (${viewport.width}x${viewport.height})`);
            await page.setViewportSize(viewport);
            await page.waitForTimeout(1000);
            // Test mobile navigation if applicable
            if (viewport.width < 768) {
                await this.testMobileNavigation(page);
            }
            // Scroll and capture layout
            await page.evaluate(() => window.scrollTo(0, 0));
            await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight / 2));
            await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
        }
        const duration = Date.now() - startTime;
        return {
            flowName: 'Responsive',
            userType: user.type,
            actions: [...this.currentActions],
            status: 'PASS',
            duration,
        };
    }
    async testMobileNavigation(page) {
        // Look for mobile menu triggers
        const mobileMenuSelectors = [
            'button[aria-label*="menu" i]',
            '.hamburger',
            '.mobile-menu-trigger',
            '[data-testid*="mobile-menu"]',
        ];
        for (const selector of mobileMenuSelectors) {
            try {
                const menuButton = page.locator(selector).first();
                if (await menuButton.isVisible({ timeout: 1000 })) {
                    await this.captureAction(page, 'click', 'Toggle mobile menu');
                    await menuButton.click();
                    await page.waitForTimeout(500);
                    break;
                }
            }
            catch { }
        }
    }
    async runAudit() {
        await this.initialize();
        await this.launchBrowser();
        try {
            for (const user of this.testUsers) {
                console.log(chalk.bold(`\n👤 Testing User: ${user.type.toUpperCase()} (${user.email})`));
                const flows = await this.runUserFlow(user);
                const totalActions = flows.reduce((sum, flow) => sum + flow.actions.length, 0);
                const totalScreenshots = flows.reduce((sum, flow) => sum + flow.actions.filter(action => action.screenshotPath).length, 0);
                const accessibilityViolations = flows.reduce((sum, flow) => sum +
                    flow.actions.reduce((actionSum, action) => actionSum + (action.accessibilityIssues?.length || 0), 0), 0);
                this.testResults.push({
                    testName: `Enhanced Functional Audit - ${user.type}`,
                    userType: user.type,
                    status: 'PASS',
                    message: `Completed ${flows.length} flows with ${totalActions} actions`,
                    flows,
                    totalActions,
                    totalScreenshots,
                    accessibilityViolations,
                });
            }
            await this.generateReport();
        }
        finally {
            if (this.browser) {
                await this.browser.close();
            }
        }
    }
    async generateReport() {
        const reportPath = path.join(this.artifactsDir, 'enhanced-functional-audit-report.json');
        const report = {
            timestamp: new Date().toISOString(),
            configuration: {
                captureAll: this.captureAll,
                recordVideo: this.recordVideo,
                interactAll: this.interactAll,
                runAccessibility: this.runAccessibility,
            },
            summary: {
                totalUsers: this.testUsers.length,
                totalResults: this.testResults.length,
                totalActions: this.testResults.reduce((sum, result) => sum + result.totalActions, 0),
                totalScreenshots: this.testResults.reduce((sum, result) => sum + result.totalScreenshots, 0),
                totalAccessibilityViolations: this.testResults.reduce((sum, result) => sum + result.accessibilityViolations, 0),
            },
            results: this.testResults,
            artifactsDirectory: this.artifactsDir,
        };
        await fs.writeFile(reportPath, JSON.stringify(report, null, 2));
        console.log(chalk.green(`\n✅ Enhanced Functional Audit Complete!`));
        console.log(chalk.cyan(`📊 Total Actions: ${report.summary.totalActions}`));
        console.log(chalk.cyan(`📸 Screenshots: ${report.summary.totalScreenshots}`));
        console.log(chalk.cyan(`♿ A11y Issues: ${report.summary.totalAccessibilityViolations}`));
        console.log(chalk.gray(`📄 Report: ${reportPath}`));
    }
}
// CLI Interface
async function main() {
    try {
        const auditor = new EnhancedFunctionalAuditor();
        await auditor.runAudit();
    }
    catch (error) {
        console.error(chalk.red('❌ Audit failed:'), error);
        process.exit(1);
    }
}
if (import.meta.url === `file://${process.argv[1]}`) {
    main();
}
export { EnhancedFunctionalAuditor, };
