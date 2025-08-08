#!/usr/bin/env tsx
/**
 * COMPREHENSIVE FUNCTIONAL AUDIT SCRIPT
 *
 * This script performs deep functional testing of the AI Glossary Pro application,
 * going beyond basic page loading to test actual user journeys, authentication flows,
 * feature limitations, admin functionality, and all interactive components.
 *
 * Test Coverage:
 * 1. Cookie consent and settings functionality
 * 2. Authentication flows with all user types (free, premium, admin)
 * 3. Admin functionality - content generation, management features
 * 4. Free user limitations and upgrade prompts
 * 5. Premium user access to all 42 section components
 * 6. Gamification features - progress tracking, achievements
 * 7. Search functionality with different user types
 * 8. Responsive design and mobile usability
 * 9. UI/UX issues identification
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import chalk from 'chalk';
import { config } from 'dotenv';
import { chromium } from 'playwright';
// Load environment variables
config();
class ComprehensiveFunctionalAuditor {
    browser = null;
    baseUrl = process.env.BASE_URL || 'http://localhost:5173';
    apiUrl = 'http://localhost:3001/api';
    screenshotDir;
    reportDir;
    testResults = [];
    // Test user configurations
    testUsers = [
        {
            email: 'test@aimlglossary.com',
            password: 'testpassword123',
            type: 'free',
            expectedFeatures: ['basic search', 'limited view count'],
            expectedLimitations: ['daily view limits', 'upgrade prompts', 'restricted 42-section access'],
        },
        {
            email: 'premium@aimlglossary.com',
            password: 'testpassword123',
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
            password: 'testpassword123',
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
    constructor() {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        this.screenshotDir = path.join(process.cwd(), 'functional-audit', timestamp, 'screenshots');
        this.reportDir = path.join(process.cwd(), 'functional-audit', timestamp);
    }
    async initialize() {
        await fs.mkdir(this.screenshotDir, { recursive: true });
        await fs.mkdir(this.reportDir, { recursive: true });
        console.log(chalk.blue('🚀 Starting COMPREHENSIVE Functional Audit...'));
        console.log(chalk.gray(`Screenshots: ${this.screenshotDir}`));
        console.log(chalk.gray(`Report: ${this.reportDir}`));
    }
    async launchBrowser() {
        console.log(chalk.yellow('🌐 Launching browser...'));
        this.browser = await chromium.launch({
            headless: false, // Show browser for debugging
            devtools: false,
            slowMo: 500, // Slower for better visibility
            args: ['--no-sandbox', '--disable-dev-shm-usage'],
        });
    }
    async takeScreenshot(page, name, userType = 'guest') {
        const filename = `${userType}-${name}-${Date.now()}.png`;
        const filepath = path.join(this.screenshotDir, filename);
        await page.screenshot({ path: filepath, fullPage: true });
        return filename;
    }
    addTestResult(result) {
        this.testResults.push(result);
        const statusColor = result.status === 'PASS' ? 'green' : result.status === 'FAIL' ? 'red' : 'yellow';
        console.log(chalk[statusColor](`${result.status}: ${result.testName} (${result.userType}) - ${result.message}`));
    }
    // ========== COOKIE CONSENT TESTING ==========
    async testCookieConsent(page) {
        console.log(chalk.blue('\n📋 Testing Cookie Consent Functionality...'));
        try {
            await page.goto(this.baseUrl);
            await page.waitForLoadState('domcontentloaded');
            await page.waitForTimeout(2000);
            const screenshot = await this.takeScreenshot(page, 'homepage-initial');
            // Look for common cookie consent patterns
            const cookieSelectors = [
                'button:has-text("Accept")',
                'button:has-text("Accept All")',
                'button:has-text("I Accept")',
                'button:has-text("Allow")',
                'button:has-text("OK")',
                '[data-testid="cookie-accept"]',
                '[data-testid="cookie-modal"]',
                '.cookie-modal',
                '.cookie-banner',
                '.cookie-consent',
                '[class*="cookie"]',
            ];
            let cookieElementFound = false;
            for (const selector of cookieSelectors) {
                try {
                    const element = await page.locator(selector).first();
                    if (await element.isVisible()) {
                        cookieElementFound = true;
                        await element.click();
                        await page.waitForTimeout(1000);
                        this.addTestResult({
                            testName: 'Cookie Consent Interaction',
                            userType: 'guest',
                            status: 'PASS',
                            message: `Found and clicked cookie consent element: ${selector}`,
                            screenshot,
                        });
                        break;
                    }
                }
                catch (e) {
                    // Continue to next selector
                }
            }
            if (!cookieElementFound) {
                this.addTestResult({
                    testName: 'Cookie Consent Check',
                    userType: 'guest',
                    status: 'WARNING',
                    message: 'No cookie consent modal found - may be disabled or already handled',
                    screenshot,
                });
            }
        }
        catch (error) {
            this.addTestResult({
                testName: 'Cookie Consent Test',
                userType: 'guest',
                status: 'FAIL',
                message: `Error testing cookie consent: ${error}`,
            });
        }
    }
    // ========== AUTHENTICATION TESTING ==========
    async testAuthenticationFlow(page, user) {
        console.log(chalk.blue(`\n👤 Testing Authentication for ${user.type.toUpperCase()} user...`));
        try {
            // Navigate to login page
            await page.goto(`${this.baseUrl}/login`);
            await page.waitForLoadState('domcontentloaded');
            await page.waitForTimeout(2000); // Wait for React to render
            let loginSuccessful = false;
            // Look for Test Users tab (development mode)
            const testUsersTab = await page.locator('[role="tab"]:has-text("Test Users")').first();
            if (await testUsersTab.isVisible()) {
                await testUsersTab.click();
                await page.waitForTimeout(1000);
                // Click the first "Use This Account" button (regular user)
                const useAccountButton = await page.locator('button:has-text("Use This Account")').first();
                if (await useAccountButton.isVisible()) {
                    await useAccountButton.click();
                    await page.waitForTimeout(1000);
                    // Switch to Sign In tab
                    const signInTab = await page.locator('[role="tab"]:has-text("Sign In")').first();
                    await signInTab.click();
                    await page.waitForTimeout(1000);
                    // Check if credentials were populated
                    const emailValue = await page.inputValue('input[type="email"]');
                    const passwordValue = await page.inputValue('input[type="password"]');
                    this.addTestResult({
                        testName: 'Test User Button Functionality',
                        userType: user.type,
                        status: emailValue === user.email && passwordValue === user.password ? 'PASS' : 'WARNING',
                        message: `Credentials populated: email=${emailValue === user.email ? '✓' : '✗'}, password=${passwordValue === user.password ? '✓' : '✗'}`,
                    });
                }
            }
            else {
                // Manual login - ensure we're on Sign In tab first
                const signInTab = await page.locator('[role="tab"]:has-text("Sign In")').first();
                if (await signInTab.isVisible()) {
                    await signInTab.click();
                    await page.waitForTimeout(1000);
                }
                // Fill in credentials manually
                const emailInput = await page.locator('input[type="email"]').first();
                const passwordInput = await page.locator('input[type="password"]').first();
                if (await emailInput.isVisible()) {
                    await emailInput.fill(user.email);
                }
                if (await passwordInput.isVisible()) {
                    await passwordInput.fill(user.password);
                }
            }
            const screenshotBefore = await this.takeScreenshot(page, 'before-login', user.type);
            // Submit login form using more specific selector
            const submitButton = await page.locator('button[type="submit"]').first();
            if (await submitButton.isVisible()) {
                await submitButton.click();
            }
            else {
                // Fallback to any Sign In button in the form
                await page.locator('#login-panel button:has-text("Sign In")').first().click();
            }
            // Wait for response and potential redirects
            await page.waitForTimeout(3000);
            // Check for success indicators
            const currentUrl = page.url();
            const welcomeToast = await page
                .locator('text*=Welcome, text*=welcome, .toast, .notification')
                .isVisible();
            const dashboardVisible = currentUrl.includes('/dashboard') ||
                (await page.locator('text=Dashboard, [data-testid="dashboard"]').isVisible());
            const screenshotAfter = await this.takeScreenshot(page, 'after-login', user.type);
            // Check for user type specific welcome messages
            let welcomeMessage = '';
            if (await page.locator('text*=Admin').isVisible()) {
                welcomeMessage = 'Admin welcome detected';
            }
            else if (await page.locator('text*=Premium, text*=Lifetime').isVisible()) {
                welcomeMessage = 'Premium welcome detected';
            }
            else if (await page.locator('text*=Free, text*=Basic').isVisible()) {
                welcomeMessage = 'Free user welcome detected';
            }
            loginSuccessful = currentUrl !== `${this.baseUrl}/login` && !currentUrl.includes('error');
            this.addTestResult({
                testName: 'Authentication Flow',
                userType: user.type,
                status: loginSuccessful ? 'PASS' : 'FAIL',
                message: `Login ${loginSuccessful ? 'successful' : 'failed'}. ${welcomeMessage}. URL: ${currentUrl}`,
                screenshot: screenshotAfter,
                details: {
                    welcomeToast,
                    dashboardVisible,
                    welcomeMessage,
                    currentUrl,
                },
            });
            return loginSuccessful;
        }
        catch (error) {
            this.addTestResult({
                testName: 'Authentication Flow',
                userType: user.type,
                status: 'FAIL',
                message: `Authentication failed with error: ${error}`,
            });
            return false;
        }
    }
    // ========== ADMIN FUNCTIONALITY TESTING ==========
    async testAdminFunctionality(page) {
        console.log(chalk.blue('\n🔧 Testing Admin Functionality...'));
        try {
            // Navigate to admin dashboard
            await page.goto(`${this.baseUrl}/admin`);
            await page.waitForLoadState('domcontentloaded');
            await page.waitForTimeout(2000);
            const screenshot = await this.takeScreenshot(page, 'admin-dashboard', 'admin');
            // Test admin dashboard visibility
            const adminElements = {
                dashboard: await page
                    .locator('text=Admin Dashboard, .admin-dashboard, [data-testid="admin-dashboard"]')
                    .isVisible(),
                generateButton: await page
                    .locator('button:has-text("Generate"), button[data-testid="generate-content"]')
                    .isVisible(),
                userManagement: await page
                    .locator('text=User Management, text=Users, [data-testid="user-management"]')
                    .isVisible(),
                contentManagement: await page
                    .locator('text=Content Management, text=Content, [data-testid="content-management"]')
                    .isVisible(),
                analytics: await page.locator('text=Analytics, [data-testid="analytics"]').isVisible(),
            };
            const adminFeaturesFound = Object.values(adminElements).filter(Boolean).length;
            this.addTestResult({
                testName: 'Admin Dashboard Access',
                userType: 'admin',
                status: adminFeaturesFound > 0 ? 'PASS' : 'FAIL',
                message: `Admin dashboard loaded with ${adminFeaturesFound}/5 expected features visible`,
                screenshot,
                details: adminElements,
            });
            // Test content generation if available
            if (adminElements.generateButton) {
                await page.click('button:has-text("Generate"), button[data-testid="generate-content"]');
                await page.waitForTimeout(2000);
                const generationStatus = await page
                    .locator('text=Generating, text=Generated, .generation-status, .progress')
                    .isVisible();
                this.addTestResult({
                    testName: 'Content Generation',
                    userType: 'admin',
                    status: generationStatus ? 'PASS' : 'WARNING',
                    message: generationStatus
                        ? 'Content generation initiated'
                        : 'No generation feedback visible',
                });
            }
        }
        catch (error) {
            this.addTestResult({
                testName: 'Admin Functionality',
                userType: 'admin',
                status: 'FAIL',
                message: `Error testing admin functionality: ${error}`,
            });
        }
    }
    // ========== FREE USER LIMITATIONS TESTING ==========
    async testFreeUserLimitations(page) {
        console.log(chalk.blue('\n🆓 Testing Free User Limitations...'));
        try {
            // Test view limits
            await page.goto(`${this.baseUrl}/terms`);
            await page.waitForLoadState('domcontentloaded');
            // Look for upgrade prompts or limitations
            const upgradePrompts = {
                upgradeButton: await page
                    .locator('button:has-text("Upgrade"), button:has-text("Get Premium"), .upgrade-prompt')
                    .isVisible(),
                limitMessage: await page.locator('text*=limit, text*=upgrade, .limit-message').isVisible(),
                restrictedContent: await page
                    .locator('.locked, .premium-only, text*=Premium Only')
                    .isVisible(),
                viewCounter: await page
                    .locator('text*=views remaining, text*=daily limit, .view-counter')
                    .isVisible(),
            };
            const limitationsFound = Object.values(upgradePrompts).filter(Boolean).length;
            this.addTestResult({
                testName: 'Free User Limitations',
                userType: 'free',
                status: limitationsFound > 0 ? 'PASS' : 'WARNING',
                message: `Found ${limitationsFound}/4 expected limitation indicators`,
                details: upgradePrompts,
            });
            // Test clicking upgrade prompt
            if (upgradePrompts.upgradeButton) {
                await page.click('button:has-text("Upgrade"), button:has-text("Get Premium")');
                await page.waitForTimeout(2000);
                const pricingPage = page.url().includes('/pricing') ||
                    (await page.locator('text=Pricing, text=Plans, .pricing').isVisible());
                this.addTestResult({
                    testName: 'Upgrade Flow',
                    userType: 'free',
                    status: pricingPage ? 'PASS' : 'WARNING',
                    message: pricingPage
                        ? 'Upgrade prompt leads to pricing page'
                        : 'Upgrade prompt did not redirect to pricing',
                });
            }
        }
        catch (error) {
            this.addTestResult({
                testName: 'Free User Limitations',
                userType: 'free',
                status: 'FAIL',
                message: `Error testing free user limitations: ${error}`,
            });
        }
    }
    // ========== PREMIUM USER 42-SECTION TESTING ==========
    async testPremium42SectionComponents(page) {
        console.log(chalk.blue('\n💎 Testing Premium 42-Section Components...'));
        try {
            // Navigate to a term page that should have 42 sections
            await page.goto(`${this.baseUrl}/term/8b5bff9a-afb7-4691-a58e-adc2bf94f941`);
            await page.waitForLoadState('domcontentloaded');
            await page.waitForTimeout(3000);
            const screenshot = await this.takeScreenshot(page, '42-sections-view', 'premium');
            // Test for 42-section components
            const sectionComponents = {
                accordion: await page
                    .locator('[data-radix-collection-item], .accordion, .section-accordion')
                    .count(),
                tabs: await page.locator('[role="tab"], .tab-trigger').count(),
                codeBlocks: await page.locator('.code-block, pre, [class*="code"]').count(),
                diagrams: await page.locator('.mermaid, [data-testid*="diagram"], .diagram').count(),
                quizzes: await page.locator('.quiz, [data-testid*="quiz"], .interactive-quiz').count(),
                aiImprover: await page
                    .locator('.ai-improver, [data-testid*="ai"], .ai-enhancement')
                    .count(),
                cardsMode: await page.locator('button:has-text("Cards"), .display-mode-cards').count(),
                interactiveElements: await page.locator('button, input, select, textarea').count(),
            };
            const totalComponents = Object.values(sectionComponents).reduce((sum, count) => sum + count, 0);
            this.addTestResult({
                testName: '42-Section Components',
                userType: 'premium',
                status: totalComponents > 10 ? 'PASS' : 'WARNING',
                message: `Found ${totalComponents} interactive components across sections`,
                screenshot,
                details: sectionComponents,
            });
            // Test specific interactions
            if (sectionComponents.accordion > 0) {
                await page.click('[data-radix-collection-item]:first-child button, .accordion-trigger:first-child');
                await page.waitForTimeout(1000);
                const accordionOpen = await page
                    .locator('[data-state="open"], .accordion-content:visible')
                    .isVisible();
                this.addTestResult({
                    testName: 'Accordion Interaction',
                    userType: 'premium',
                    status: accordionOpen ? 'PASS' : 'WARNING',
                    message: accordionOpen
                        ? 'Accordion sections expandable'
                        : 'Accordion interaction may not be working',
                });
            }
            // Test code copying if available
            if (sectionComponents.codeBlocks > 0) {
                const copyButton = await page
                    .locator('button:has-text("Copy"), button[aria-label*="copy"]')
                    .first();
                if (await copyButton.isVisible()) {
                    await copyButton.click();
                    await page.waitForTimeout(500);
                    this.addTestResult({
                        testName: 'Code Copy Functionality',
                        userType: 'premium',
                        status: 'PASS',
                        message: 'Code copy button clicked successfully',
                    });
                }
            }
        }
        catch (error) {
            this.addTestResult({
                testName: '42-Section Components',
                userType: 'premium',
                status: 'FAIL',
                message: `Error testing 42-section components: ${error}`,
            });
        }
    }
    // ========== GAMIFICATION TESTING ==========
    async testGamificationFeatures(page) {
        console.log(chalk.blue('\n🎮 Testing Gamification Features...'));
        try {
            // Navigate to progress/dashboard page
            await page.goto(`${this.baseUrl}/progress`);
            await page.waitForLoadState('domcontentloaded');
            const screenshot = await this.takeScreenshot(page, 'gamification-features', 'premium');
            // Look for gamification elements
            const gamificationElements = {
                progressBar: await page.locator('.progress-bar, [role="progressbar"], .progress').count(),
                achievements: await page.locator('.achievement, .badge, .trophy').count(),
                streaks: await page.locator('text*=streak, .streak-counter').count(),
                levels: await page.locator('text*=level, .level-indicator').count(),
                points: await page.locator('text*=points, .points-counter').count(),
                leaderboard: await page.locator('text*=leaderboard, .leaderboard').count(),
            };
            const gamificationFound = Object.values(gamificationElements).reduce((sum, count) => sum + count, 0);
            this.addTestResult({
                testName: 'Gamification Elements',
                userType: 'premium',
                status: gamificationFound > 0 ? 'PASS' : 'WARNING',
                message: `Found ${gamificationFound} gamification elements`,
                screenshot,
                details: gamificationElements,
            });
            // Test daily progress tracking
            await page.goto(`${this.baseUrl}/dashboard`);
            await page.waitForTimeout(2000);
            const dailyProgress = await page
                .locator('text*=today, text*=daily, .daily-progress')
                .isVisible();
            this.addTestResult({
                testName: 'Daily Progress Tracking',
                userType: 'premium',
                status: dailyProgress ? 'PASS' : 'WARNING',
                message: dailyProgress
                    ? 'Daily progress tracking visible'
                    : 'Daily progress tracking not found',
            });
        }
        catch (error) {
            this.addTestResult({
                testName: 'Gamification Features',
                userType: 'premium',
                status: 'FAIL',
                message: `Error testing gamification: ${error}`,
            });
        }
    }
    // ========== SEARCH FUNCTIONALITY TESTING ==========
    async testSearchFunctionality(page, userType) {
        console.log(chalk.blue(`\n🔍 Testing Search Functionality for ${userType}...`));
        try {
            await page.goto(`${this.baseUrl}/terms`);
            await page.waitForLoadState('domcontentloaded');
            // Test basic search
            const searchInput = await page
                .locator('input[type="text"], .search-input, input[placeholder*="search"]')
                .first();
            if (await searchInput.isVisible()) {
                await searchInput.fill('neural network');
                await page.waitForTimeout(1000);
                // Check for search results or empty state
                const hasResults = await page.locator('.search-result, .term-card, .result-item').count();
                const emptyState = await page
                    .locator('text*=No results, text*=no terms, .empty-state')
                    .isVisible();
                this.addTestResult({
                    testName: 'Basic Search',
                    userType,
                    status: hasResults > 0 || emptyState ? 'PASS' : 'WARNING',
                    message: hasResults > 0
                        ? `Found ${hasResults} search results`
                        : emptyState
                            ? 'Empty state displayed for search'
                            : 'Unclear search response',
                });
                // Test AI search if available
                const aiSearchToggle = await page
                    .locator('text*=AI Search, .ai-search-toggle, input[type="checkbox"]')
                    .first();
                if (await aiSearchToggle.isVisible()) {
                    await aiSearchToggle.click();
                    await page.waitForTimeout(1000);
                    this.addTestResult({
                        testName: 'AI Search Toggle',
                        userType,
                        status: 'PASS',
                        message: 'AI search toggle interacted with successfully',
                    });
                }
                // Test filters
                const filterButton = await page
                    .locator('button:has-text("Filter"), .filter-button, .filters-toggle')
                    .first();
                if (await filterButton.isVisible()) {
                    await filterButton.click();
                    await page.waitForTimeout(500);
                    const filterOptions = await page
                        .locator('.filter-option, select, .filter-dropdown')
                        .count();
                    this.addTestResult({
                        testName: 'Search Filters',
                        userType,
                        status: filterOptions > 0 ? 'PASS' : 'WARNING',
                        message: `Filter panel opened with ${filterOptions} filter options`,
                    });
                }
            }
            else {
                this.addTestResult({
                    testName: 'Search Functionality',
                    userType,
                    status: 'FAIL',
                    message: 'Search input not found on terms page',
                });
            }
        }
        catch (error) {
            this.addTestResult({
                testName: 'Search Functionality',
                userType,
                status: 'FAIL',
                message: `Error testing search: ${error}`,
            });
        }
    }
    // ========== RESPONSIVE DESIGN TESTING ==========
    async testResponsiveDesign() {
        console.log(chalk.blue('\n📱 Testing Responsive Design...'));
        const viewports = [
            { name: 'mobile', width: 375, height: 812 },
            { name: 'tablet', width: 768, height: 1024 },
            { name: 'desktop', width: 1920, height: 1080 },
        ];
        for (const viewport of viewports) {
            try {
                const context = await this.browser.newContext({
                    viewport: { width: viewport.width, height: viewport.height },
                });
                const page = await context.newPage();
                await page.goto(this.baseUrl);
                await page.waitForLoadState('domcontentloaded');
                const screenshot = await this.takeScreenshot(page, `responsive-${viewport.name}`, 'guest');
                // Test mobile menu for smaller screens
                if (viewport.width < 768) {
                    const mobileMenu = await page
                        .locator('button[aria-label*="menu"], .mobile-menu-button, .hamburger')
                        .isVisible();
                    this.addTestResult({
                        testName: `Mobile Menu (${viewport.name})`,
                        userType: 'guest',
                        status: mobileMenu ? 'PASS' : 'WARNING',
                        message: mobileMenu ? 'Mobile menu button visible' : 'Mobile menu button not found',
                        screenshot,
                    });
                }
                // Test navigation visibility
                const navVisible = await page.locator('nav, .navigation, .nav-menu').isVisible();
                this.addTestResult({
                    testName: `Navigation (${viewport.name})`,
                    userType: 'guest',
                    status: navVisible ? 'PASS' : 'WARNING',
                    message: `Navigation ${navVisible ? 'visible' : 'hidden'} on ${viewport.name}`,
                    screenshot,
                });
                await context.close();
            }
            catch (error) {
                this.addTestResult({
                    testName: `Responsive Design (${viewport.name})`,
                    userType: 'guest',
                    status: 'FAIL',
                    message: `Error testing ${viewport.name} viewport: ${error}`,
                });
            }
        }
    }
    // ========== MAIN TEST RUNNER ==========
    async runComprehensiveFunctionalAudit() {
        if (!this.browser)
            throw new Error('Browser not initialized');
        const context = await this.browser.newContext({
            viewport: { width: 1920, height: 1080 },
        });
        const page = await context.newPage();
        // Test 1: Cookie Consent
        await this.testCookieConsent(page);
        // Test 2: Authentication flows for each user type
        for (const user of this.testUsers) {
            const loginSuccessful = await this.testAuthenticationFlow(page, user);
            if (loginSuccessful) {
                // User-specific tests
                if (user.type === 'admin') {
                    await this.testAdminFunctionality(page);
                }
                else if (user.type === 'free') {
                    await this.testFreeUserLimitations(page);
                }
                else if (user.type === 'premium') {
                    await this.testPremium42SectionComponents(page);
                    await this.testGamificationFeatures(page);
                }
                // Test search for this user type
                await this.testSearchFunctionality(page, user.type);
                // Logout
                try {
                    await page.goto(`${this.baseUrl}/logout`);
                    await page.waitForTimeout(2000);
                }
                catch (error) {
                    console.log(chalk.yellow(`Warning: Could not logout ${user.type} user`));
                }
            }
        }
        // Test 3: Responsive design
        await this.testResponsiveDesign();
        await context.close();
    }
    // ========== REPORT GENERATION ==========
    async generateFunctionalReport() {
        console.log(chalk.yellow('📝 Generating comprehensive functional report...'));
        const summary = {
            totalTests: this.testResults.length,
            passed: this.testResults.filter(r => r.status === 'PASS').length,
            failed: this.testResults.filter(r => r.status === 'FAIL').length,
            warnings: this.testResults.filter(r => r.status === 'WARNING').length,
            passRate: Math.round((this.testResults.filter(r => r.status === 'PASS').length / this.testResults.length) * 100),
        };
        const report = {
            timestamp: new Date().toISOString(),
            summary,
            testResults: this.testResults,
            testUsers: this.testUsers,
            recommendations: this.generateRecommendations(),
        };
        await fs.writeFile(path.join(this.reportDir, 'functional-audit-report.json'), JSON.stringify(report, null, 2));
        // Generate HTML report
        const htmlReport = `
<!DOCTYPE html>
<html>
<head>
  <title>Comprehensive Functional Audit Report</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 20px; line-height: 1.6; }
    .summary { background: #f5f5f5; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
    .metric { display: inline-block; margin: 10px; padding: 10px; background: white; border-radius: 4px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
    .test-result { margin: 10px 0; padding: 15px; border-radius: 4px; border-left: 4px solid; }
    .test-pass { background: #d4edda; border-color: #28a745; }
    .test-fail { background: #f8d7da; border-color: #dc3545; }
    .test-warning { background: #fff3cd; border-color: #ffc107; }
    .user-section { margin: 20px 0; padding: 15px; background: #f8f9fa; border-radius: 8px; }
    h1 { color: #333; }
    h2 { color: #555; border-bottom: 2px solid #eee; padding-bottom: 10px; }
    .timestamp { color: #666; font-size: 0.9em; }
    .recommendations { background: #e7f3ff; padding: 15px; border-radius: 8px; margin: 20px 0; }
  </style>
</head>
<body>
  <h1>🔍 Comprehensive Functional Audit Report</h1>
  <p class="timestamp">Generated: ${new Date(report.timestamp).toLocaleString()}</p>
  
  <div class="summary">
    <h2>📊 Executive Summary</h2>
    <div class="metric"><strong>${summary.totalTests}</strong><br>Total Tests</div>
    <div class="metric"><strong>${summary.passed}</strong><br>Passed</div>
    <div class="metric"><strong>${summary.failed}</strong><br>Failed</div>
    <div class="metric"><strong>${summary.warnings}</strong><br>Warnings</div>
    <div class="metric"><strong>${summary.passRate}%</strong><br>Pass Rate</div>
  </div>

  <h2>📋 Test Results by User Type</h2>
  ${['guest', 'free', 'premium', 'admin']
            .map(userType => {
            const userTests = this.testResults.filter(r => r.userType === userType);
            if (userTests.length === 0)
                return '';
            return `
      <div class="user-section">
        <h3>${userType.charAt(0).toUpperCase() + userType.slice(1)} User Tests</h3>
        ${userTests
                .map(test => `
          <div class="test-result test-${test.status.toLowerCase()}">
            <strong>${test.testName}</strong> - ${test.status}<br>
            ${test.message}
            ${test.screenshot ? `<br><small>Screenshot: ${test.screenshot}</small>` : ''}
          </div>
        `)
                .join('')}
      </div>
    `;
        })
            .join('')}

  <div class="recommendations">
    <h2>💡 Recommendations</h2>
    ${report.recommendations.map(rec => `<p>• ${rec}</p>`).join('')}
  </div>

  <div style="margin-top: 40px; padding: 20px; background: #f8f9fa; border-radius: 8px;">
    <h2>📁 File Locations</h2>
    <p><strong>Screenshots:</strong> ${this.screenshotDir}</p>
    <p><strong>JSON Report:</strong> ${path.join(this.reportDir, 'functional-audit-report.json')}</p>
  </div>
</body>
</html>
    `;
        await fs.writeFile(path.join(this.reportDir, 'index.html'), htmlReport);
        console.log(chalk.green('✅ Functional audit report generated'));
        console.log(chalk.blue(`📁 Open: ${path.join(this.reportDir, 'index.html')}`));
    }
    generateRecommendations() {
        const recommendations = [];
        const failedTests = this.testResults.filter(r => r.status === 'FAIL');
        const warningTests = this.testResults.filter(r => r.status === 'WARNING');
        if (failedTests.length > 0) {
            recommendations.push(`Address ${failedTests.length} critical test failures to improve application stability`);
        }
        if (warningTests.length > 0) {
            recommendations.push(`Investigate ${warningTests.length} warning conditions for potential improvements`);
        }
        // Specific recommendations based on test patterns
        if (failedTests.some(t => t.testName.includes('Authentication'))) {
            recommendations.push('Fix authentication flow issues - users may not be able to login properly');
        }
        if (warningTests.some(t => t.testName.includes('Cookie'))) {
            recommendations.push('Review cookie consent implementation for GDPR compliance');
        }
        if (failedTests.some(t => t.userType === 'admin')) {
            recommendations.push('Admin functionality needs attention - content management features may not be working');
        }
        if (warningTests.some(t => t.testName.includes('Responsive'))) {
            recommendations.push('Optimize responsive design for better mobile user experience');
        }
        return recommendations;
    }
    async cleanup() {
        console.log(chalk.yellow('🧹 Cleaning up...'));
        if (this.browser) {
            await this.browser.close();
        }
    }
    async run() {
        try {
            await this.initialize();
            await this.launchBrowser();
            await this.runComprehensiveFunctionalAudit();
            await this.generateFunctionalReport();
            console.log(chalk.green('✨ COMPREHENSIVE functional audit complete!'));
            console.log(chalk.blue(`📁 View report: ${path.join(this.reportDir, 'index.html')}`));
            const summary = {
                totalTests: this.testResults.length,
                passed: this.testResults.filter(r => r.status === 'PASS').length,
                failed: this.testResults.filter(r => r.status === 'FAIL').length,
                warnings: this.testResults.filter(r => r.status === 'WARNING').length,
            };
            console.log(chalk.blue(`📊 Results: ${summary.passed} passed, ${summary.failed} failed, ${summary.warnings} warnings`));
        }
        catch (error) {
            console.error(chalk.red('❌ Error during functional audit:'), error);
            throw error;
        }
        finally {
            await this.cleanup();
        }
    }
}
// Run the functional auditor
const isMainModule = import.meta.url === `file://${process.argv[1]}`;
if (isMainModule) {
    const auditor = new ComprehensiveFunctionalAuditor();
    auditor.run().catch(console.error);
}
export { ComprehensiveFunctionalAuditor };
