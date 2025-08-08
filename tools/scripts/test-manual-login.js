#!/usr/bin/env tsx
/**
 * Manual login test to debug Firebase authentication
 */
import { chromium } from 'playwright';
const testUser = {
    email: 'free@aiglossarypro.com',
    password: 'freepass123',
};
async function testManualLogin() {
    const browser = await chromium.launch({
        headless: false,
        devtools: true // Open dev tools to see console errors
    });
    try {
        console.log('🔍 Testing manual login with debug enabled...\n');
        const page = await browser.newPage();
        // Listen to console messages
        page.on('console', msg => {
            if (msg.type() === 'error') {
                console.error('❌ Console Error:', msg.text());
            }
            else if (msg.text().includes('Firebase') || msg.text().includes('🔐')) {
                console.log('📝 Console:', msg.text());
            }
        });
        // Listen to network requests
        page.on('request', request => {
            if (request.url().includes('identitytoolkit') || request.url().includes('firebase')) {
                console.log('🌐 Request:', request.method(), request.url());
            }
        });
        page.on('response', response => {
            if (response.url().includes('identitytoolkit') || response.url().includes('firebase')) {
                console.log(`🌐 Response: ${response.status()} ${response.url()}`);
            }
        });
        // Navigate to login page
        console.log('1️⃣ Navigating to login page...');
        await page.goto('http://localhost:5173/login', { waitUntil: 'networkidle' });
        await page.waitForTimeout(3000);
        // Handle cookie consent if present
        try {
            const cookieAcceptButton = await page.$('button:has-text("Accept"), button:has-text("I Accept"), button:has-text("Accept All")');
            if (cookieAcceptButton) {
                console.log('🍪 Accepting cookie consent...');
                await cookieAcceptButton.click();
                await page.waitForTimeout(1000);
            }
        }
        catch (e) {
            console.log('ℹ️  No cookie consent banner found');
        }
        // Check if login form is present
        const emailInput = await page.$('input[type="email"]');
        const passwordInput = await page.$('input[type="password"]');
        if (!emailInput || !passwordInput) {
            console.log('❌ Login form not found!');
            return;
        }
        console.log('✅ Login form found');
        // Fill in credentials
        console.log(`\n2️⃣ Filling in credentials...`);
        await emailInput.fill(testUser.email);
        await passwordInput.fill(testUser.password);
        // Wait for user to see the filled form
        console.log('\n3️⃣ Form filled. Submitting in 3 seconds...');
        await page.waitForTimeout(3000);
        // Submit login
        console.log('\n4️⃣ Submitting login form...');
        const submitButton = await page.$('button[type="submit"]');
        if (submitButton) {
            await submitButton.click();
        }
        // Wait for response
        console.log('\n5️⃣ Waiting for authentication response...');
        await page.waitForTimeout(10000);
        // Check current state
        const currentUrl = page.url();
        console.log(`\n📍 Current URL: ${currentUrl}`);
        // Check for any error messages
        const errorElement = await page.$('[role="alert"], .error, .text-red-500, .text-destructive');
        if (errorElement) {
            const errorText = await errorElement.textContent();
            console.log(`\n⚠️  Error message found: ${errorText}`);
        }
        // Check for success indicators
        const logoutButton = await page.$('button:has-text("Sign out"), button:has-text("Log out"), button:has-text("Logout"), button:has-text("Sign Out")');
        if (logoutButton) {
            console.log('\n✅ Login successful! User is authenticated.');
        }
        else {
            console.log('\n❌ Login appears to have failed - no logout button found');
        }
        console.log('\n⏸️  Keeping browser open for manual inspection...');
        console.log('Press Ctrl+C to close the browser and exit.');
        // Keep browser open
        await new Promise(() => { });
    }
    catch (error) {
        console.error('❌ Test error:', error);
    }
}
testManualLogin().catch(console.error);
