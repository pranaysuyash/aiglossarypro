#!/usr/bin/env tsx
/**
 * Complete Authentication Flow Test
 * Tests cookie acceptance, test user buttons, and full login functionality
 */
import chalk from 'chalk';
import { chromium } from 'playwright';
class CompleteAuthTester {
    browser = null;
    baseUrl = 'http://localhost:5173';
    async startBrowser() {
        this.browser = await chromium.launch({
            headless: false,
            devtools: true,
            slowMo: 500,
        });
    }
    async testCompleteAuth() {
        if (!this.browser)
            throw new Error('Browser not initialized');
        const page = await this.browser.newPage();
        try {
            console.log(chalk.blue('🔍 Testing complete authentication flow...'));
            // Step 1: Navigate to login page
            console.log(chalk.cyan('📍 Step 1: Navigating to login page...'));
            await page.goto(`${this.baseUrl}/login`);
            await page.waitForTimeout(2000);
            // Step 2: Handle cookie consent banner first
            console.log(chalk.cyan('📍 Step 2: Handling cookie consent banner...'));
            const cookieSelectors = [
                'button:has-text("Accept")',
                'button:has-text("Accept all")',
                'button:has-text("I accept")',
                'button:has-text("OK")',
                'button:has-text("Allow")',
                '[data-testid="cookie-accept"]',
                '.cookie-accept',
                'button[aria-label*="accept" i]',
                'button[aria-label*="cookie" i]',
            ];
            let cookieHandled = false;
            for (const selector of cookieSelectors) {
                try {
                    const button = page.locator(selector);
                    if ((await button.count()) > 0) {
                        console.log(chalk.green(`✅ Found cookie consent button: ${selector}`));
                        await button.click();
                        await page.waitForTimeout(1000);
                        cookieHandled = true;
                        break;
                    }
                }
                catch (_e) {
                    // Continue to next selector
                }
            }
            if (!cookieHandled) {
                console.log(chalk.yellow('⚠️ No cookie consent button found, trying to dismiss banner by clicking outside'));
                // Try clicking outside any modals/banners
                await page.mouse.click(640, 200);
                await page.waitForTimeout(500);
            }
            // Step 3: Navigate to Test Users tab
            console.log(chalk.cyan('📍 Step 3: Switching to Test Users tab...'));
            const testTab = page.locator('button[role="tab"]:has-text("Test Users")');
            if ((await testTab.count()) > 0) {
                console.log(chalk.green('✅ Test Users tab found'));
                await testTab.click();
                await page.waitForTimeout(1000);
                // Step 4: Click "Use This Account" for regular user
                console.log(chalk.cyan('📍 Step 4: Clicking "Use This Account" for regular user...'));
                // Force click the first "Use This Account" button
                await page.evaluate(() => {
                    const buttons = Array.from(document.querySelectorAll('button')).filter(btn => btn.textContent?.includes('Use This Account'));
                    if (buttons.length > 0) {
                        buttons[0].click();
                    }
                });
                await page.waitForTimeout(1000);
                // Step 5: Manually switch to Sign In tab (since auto-switch might not work)
                console.log(chalk.cyan('📍 Step 5: Switching to Sign In tab...'));
                const loginTab = page.locator('button[role="tab"]:has-text("Sign In")');
                await loginTab.click();
                await page.waitForTimeout(1000);
                // Step 6: Check form values
                console.log(chalk.cyan('📍 Step 6: Checking form values...'));
                const emailValue = await page.inputValue('input[type="email"]');
                const passwordValue = await page.inputValue('input[type="password"]');
                console.log(chalk.cyan('📝 Form values:'));
                console.log(chalk.gray(`  Email: ${emailValue}`));
                console.log(chalk.gray(`  Password: ${passwordValue ? '***filled***' : 'empty'}`));
                if ((emailValue === 'test@aimlglossary.com' && passwordValue === 'testpass123') ||
                    (emailValue === 'premium@aimlglossary.com' && passwordValue === 'premiumpass123') ||
                    (emailValue === 'admin@aimlglossary.com' && passwordValue === 'adminpass123')) {
                    console.log(chalk.green('✅ Form populated correctly'));
                    // Step 7: Click Sign In button
                    console.log(chalk.cyan('📍 Step 7: Clicking Sign In button...'));
                    // Listen for network requests
                    page.on('response', response => {
                        if (response.url().includes('/auth/firebase/login')) {
                            console.log(chalk.blue(`📡 API Response: ${response.status()} - ${response.url()}`));
                        }
                    });
                    const signInButton = page.locator('button[type="submit"]:has-text("Sign In")');
                    await signInButton.click();
                    // Wait for response
                    await page.waitForTimeout(5000);
                    // Step 8: Check result
                    console.log(chalk.cyan('📍 Step 8: Checking authentication result...'));
                    const currentUrl = page.url();
                    console.log(chalk.gray(`Current URL: ${currentUrl}`));
                    if (currentUrl.includes('/dashboard')) {
                        console.log(chalk.green('✅ Successfully authenticated and redirected to dashboard!'));
                        console.log(chalk.green('🎉 Complete authentication flow works end-to-end!'));
                        return true;
                    }
                    else {
                        // Check for errors
                        const errorElement = await page
                            .locator('[role="alert"]')
                            .textContent()
                            .catch(() => null);
                        if (errorElement) {
                            console.log(chalk.red(`❌ Authentication failed: ${errorElement}`));
                        }
                        else {
                            console.log(chalk.yellow('⚠️ Still on login page, no visible error'));
                        }
                    }
                }
                else {
                    console.log(chalk.red('❌ Form not populated correctly'));
                    console.log(chalk.yellow('💡 This suggests the "Use This Account" button didn\'t populate the form properly'));
                }
            }
            else {
                console.log(chalk.red('❌ Test Users tab not found - ensure development mode is enabled'));
            }
            // Keep browser open for inspection if test fails
            console.log(chalk.blue('🔍 Browser will remain open for manual inspection...'));
            console.log(chalk.gray('Press Ctrl+C to close'));
            // Wait indefinitely for manual inspection
            await new Promise(() => { });
        }
        catch (error) {
            console.error(chalk.red('❌ Test error:'), error);
            return false;
        }
    }
    async cleanup() {
        if (this.browser) {
            await this.browser.close();
        }
    }
    async run() {
        try {
            await this.startBrowser();
            await this.testCompleteAuth();
        }
        catch (error) {
            console.error(chalk.red('❌ Test failed:'), error);
        }
    }
}
const tester = new CompleteAuthTester();
tester.run().catch(console.error);
