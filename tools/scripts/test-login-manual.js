#!/usr/bin/env tsx
/**
 * Manual Login Test Script
 * Tests the complete login flow with test user credentials
 */
import chalk from 'chalk';
import { chromium } from 'playwright';
async function testManualLogin() {
    console.log(chalk.blue('🔍 Testing Manual Login Flow...'));
    const browser = await chromium.launch({
        headless: false,
        slowMo: 1000,
    });
    try {
        const page = await browser.newPage();
        // Enable console logging to see what happens
        page.on('console', msg => {
            const type = msg.type();
            const text = msg.text();
            if (type === 'error') {
                console.log(chalk.red(`Console Error: ${text}`));
            }
            else if (type === 'warn') {
                console.log(chalk.yellow(`Console Warning: ${text}`));
            }
            else if (text.includes('auth') || text.includes('login') || text.includes('token')) {
                console.log(chalk.blue(`Console Log: ${text}`));
            }
        });
        // Navigate to login page
        console.log(chalk.blue('Navigating to login page...'));
        await page.goto('http://localhost:5173/login');
        await page.waitForLoadState('domcontentloaded');
        await page.waitForTimeout(3000);
        // Click on Test Users tab
        console.log(chalk.blue('Clicking Test Users tab...'));
        await page.click('[role="tab"]:has-text("Test Users")');
        await page.waitForTimeout(2000);
        // Click "Use This Account" for first test user
        console.log(chalk.blue('Using test account...'));
        await page.click('button:has-text("Use This Account")');
        await page.waitForTimeout(3000);
        // Should auto-switch to Sign In tab, verify form is populated
        const emailValue = await page.inputValue('input[type="email"]');
        const passwordValue = await page.inputValue('input[type="password"]');
        console.log(chalk.green(`Form populated - Email: ${emailValue}, Password: ${passwordValue ? 'filled' : 'empty'}`));
        // Submit the form
        console.log(chalk.blue('Submitting login form...'));
        await page.click('button[type="submit"]');
        // Wait and monitor for navigation/errors
        console.log(chalk.blue('Waiting for authentication...'));
        // Monitor for URL changes more frequently
        for (let i = 0; i < 20; i++) {
            await page.waitForTimeout(1000);
            const currentUrl = page.url();
            console.log(chalk.gray(`[${i + 1}s] Current URL: ${currentUrl}`));
            // Check for success redirect
            if (currentUrl.includes('/dashboard') ||
                currentUrl.includes('/admin') ||
                currentUrl.includes('/app')) {
                console.log(chalk.green('✅ Authentication successful! Redirected.'));
                break;
            }
            // Check for errors
            const errors = await page.locator('[role="alert"]').allTextContents();
            if (errors.length > 0 && i > 5) {
                console.log(chalk.red(`❌ Errors detected: ${errors.join(', ')}`));
                break;
            }
        }
        // Check final state
        const currentUrl = page.url();
        const authToken = await page.evaluate(() => localStorage.getItem('authToken'));
        console.log(chalk.green(`Final URL: ${currentUrl}`));
        console.log(chalk.green(`Auth Token: ${authToken ? 'Present' : 'Missing'}`));
        // Check for any error alerts on page
        const errorAlerts = await page.locator('[role="alert"]').allTextContents();
        if (errorAlerts.length > 0) {
            console.log(chalk.red(`Errors on page: ${errorAlerts.join(', ')}`));
        }
        // Test API call with token
        if (authToken) {
            console.log(chalk.blue('Testing API call with token...'));
            const apiResponse = await page.evaluate(async (token) => {
                const response = await fetch('/api/auth/user', {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        'Content-Type': 'application/json',
                    },
                    credentials: 'include',
                });
                return {
                    status: response.status,
                    data: await response.json(),
                };
            }, authToken);
            console.log(chalk.green(`API Response: ${JSON.stringify(apiResponse, null, 2)}`));
        }
        // Keep browser open for manual inspection
        console.log(chalk.blue('Test complete. Browser will stay open for 30 seconds for manual inspection...'));
        await page.waitForTimeout(30000);
    }
    catch (error) {
        console.error(chalk.red('Test failed:'), error);
    }
    finally {
        await browser.close();
    }
}
// Run if this is the main module
if (import.meta.url === `file://${process.argv[1]}`) {
    testManualLogin().catch(console.error);
}
export { testManualLogin };
