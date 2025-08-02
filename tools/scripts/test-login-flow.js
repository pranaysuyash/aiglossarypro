#!/usr/bin/env tsx
/**
 * Test Login Flow - Verify test user login functionality
 */
import chalk from 'chalk';
import { chromium } from 'playwright';
class LoginFlowTester {
    browser = null;
    baseUrl = 'http://localhost:5173';
    async startBrowser() {
        this.browser = await chromium.launch({
            headless: false,
            devtools: true,
            slowMo: 500, // Slow down actions to see what's happening
        });
    }
    async testLoginFlow() {
        if (!this.browser)
            throw new Error('Browser not initialized');
        const page = await this.browser.newPage();
        console.log(chalk.blue('🔍 Testing login flow...'));
        // Navigate to login page
        await page.goto(`${this.baseUrl}/login`);
        await page.waitForTimeout(2000);
        // Click on Test Users tab (only visible in dev mode)
        const testTab = page.locator('button[role="tab"]:has-text("Test Users")');
        if ((await testTab.count()) > 0) {
            console.log(chalk.green('✅ Test Users tab found (dev mode)'));
            await testTab.click();
            await page.waitForTimeout(1000);
            // Click "Use This Account" for regular user
            const useAccountButton = page.locator('button:has-text("Use This Account")').first();
            console.log(chalk.cyan('📍 Clicking "Use This Account" for regular user...'));
            await useAccountButton.click();
            await page.waitForTimeout(1000);
            // Check if we're on the login tab now
            const activeTab = await page.locator('[role="tab"][data-state="active"]').textContent();
            console.log(chalk.gray(`Active tab: ${activeTab}`));
            // Check if email and password fields are populated
            const emailValue = await page.locator('input[type="email"]').inputValue();
            const passwordValue = await page.locator('input[type="password"]').inputValue();
            console.log(chalk.cyan('📝 Form values:'));
            console.log(chalk.gray(`  Email: ${emailValue}`));
            console.log(chalk.gray(`  Password: ${passwordValue ? '***filled***' : 'empty'}`));
            if (emailValue === 'test@aimlglossary.com' && passwordValue === 'testpass123') {
                console.log(chalk.green('✅ Form fields populated correctly'));
                // Now click the Sign In button
                console.log(chalk.cyan('📍 Clicking Sign In button...'));
                const signInButton = page.locator('button[type="submit"]:has-text("Sign In")');
                await signInButton.click();
                // Wait for navigation or error
                await page.waitForTimeout(3000);
                // Check current URL
                const currentUrl = page.url();
                console.log(chalk.gray(`Current URL: ${currentUrl}`));
                if (currentUrl.includes('/dashboard')) {
                    console.log(chalk.green('✅ Successfully logged in and redirected to dashboard'));
                }
                else if (currentUrl.includes('/login')) {
                    // Check for error messages
                    const errorMessage = await page
                        .locator('[role="alert"]')
                        .textContent()
                        .catch(() => null);
                    if (errorMessage) {
                        console.log(chalk.red(`❌ Login failed with error: ${errorMessage}`));
                    }
                    else {
                        console.log(chalk.yellow('⚠️ Still on login page, no error shown'));
                    }
                }
            }
            else {
                console.log(chalk.red('❌ Form fields not populated correctly'));
            }
        }
        else {
            console.log(chalk.red('❌ Test Users tab not found - are you in development mode?'));
        }
        // Take screenshot
        await page.screenshot({ path: 'test-login-flow.png' });
        console.log(chalk.gray('Screenshot saved: test-login-flow.png'));
    }
    async cleanup() {
        if (this.browser) {
            await this.browser.close();
        }
    }
    async run() {
        try {
            await this.startBrowser();
            await this.testLoginFlow();
        }
        catch (error) {
            console.error(chalk.red('❌ Test failed:'), error);
        }
        finally {
            await this.cleanup();
        }
    }
}
const tester = new LoginFlowTester();
tester.run().catch(console.error);
