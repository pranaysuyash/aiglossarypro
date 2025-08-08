#!/usr/bin/env tsx
/**
 * Simple User Account Test
 * Quick test to verify login functionality for the test users
 */
import { chromium } from 'playwright';
const TEST_USERS = [
    { email: 'test@aimlglossary.com', password: 'testpassword123', type: 'free' },
    { email: 'premium@aimlglossary.com', password: 'premiumpass123', type: 'premium' },
    { email: 'admin@aimlglossary.com', password: 'adminpass123', type: 'admin' }
];
async function testUserLogin(email, password, type) {
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();
    try {
        console.log(`\n🧪 Testing ${type} user: ${email}`);
        // Navigate to login page
        await page.goto('http://localhost:5173/login');
        await page.waitForTimeout(2000);
        // Handle cookie consent
        try {
            await page.waitForSelector('button:has-text("Accept All")', { timeout: 3000 });
            await page.click('button:has-text("Accept All")');
            console.log('   ✅ Cookie consent accepted');
        }
        catch (e) {
            console.log('   ℹ️  No cookie consent banner');
        }
        // Fill login form
        await page.waitForSelector('input[type="email"]', { timeout: 10000 });
        await page.fill('input[type="email"]', email);
        await page.fill('input[type="password"]', password);
        // Submit form
        await page.click('button[type="submit"]', { force: true });
        await page.waitForTimeout(5000);
        // Check if logged in
        const currentUrl = page.url();
        const isLoggedIn = currentUrl.includes('/app') || currentUrl.includes('/dashboard');
        if (isLoggedIn) {
            console.log(`   ✅ Login successful - redirected to: ${currentUrl}`);
            // Check for user indicators
            const userEmail = await page.locator('text=' + email).first().textContent().catch(() => null);
            if (userEmail) {
                console.log(`   ✅ User email visible: ${userEmail}`);
            }
            // Test logout
            try {
                // Try different logout selectors
                const logoutSelectors = [
                    'button:has-text("Logout")',
                    'button:has-text("Log Out")',
                    'text=/logout/i',
                    '[data-testid="logout"]'
                ];
                let logoutSuccess = false;
                for (const selector of logoutSelectors) {
                    try {
                        await page.click(selector, { timeout: 2000 });
                        await page.waitForTimeout(3000);
                        const afterLogoutUrl = page.url();
                        if (afterLogoutUrl.includes('/login') || !afterLogoutUrl.includes('/app')) {
                            console.log(`   ✅ Logout successful - redirected to: ${afterLogoutUrl}`);
                            logoutSuccess = true;
                            break;
                        }
                    }
                    catch (e) {
                        continue;
                    }
                }
                if (!logoutSuccess) {
                    console.log('   ⚠️  Logout not tested (button not found)');
                }
            }
            catch (e) {
                console.log('   ⚠️  Logout error:', e.message);
            }
            return true;
        }
        else {
            console.log(`   ❌ Login failed - stayed at: ${currentUrl}`);
            return false;
        }
    }
    catch (error) {
        console.error(`   ❌ Test error:`, error.message);
        return false;
    }
    finally {
        await browser.close();
    }
}
async function main() {
    console.log('🚀 Starting simple user account tests...');
    const results = [];
    for (const user of TEST_USERS) {
        const success = await testUserLogin(user.email, user.password, user.type);
        results.push({ ...user, success });
    }
    console.log('\n📊 Results Summary:');
    const successCount = results.filter(r => r.success).length;
    console.log(`   Success Rate: ${successCount}/${results.length}`);
    results.forEach(result => {
        console.log(`   ${result.type.toUpperCase()}: ${result.success ? '✅' : '❌'}`);
    });
    if (successCount === results.length) {
        console.log('\n✅ All user accounts tested successfully!');
    }
    else {
        console.log('\n❌ Some tests failed. Check the output above.');
    }
}
main().catch(console.error);
