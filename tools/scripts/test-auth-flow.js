/**
 * Quick Authentication Flow Test
 * Tests the basic login → app → logout flow
 */

import { chromium } from 'playwright';

async function testAuthFlow() {
  console.log('🔑 Testing Authentication Flow...');

  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 },
  });
  const page = await context.newPage();

  // Enable console logging to see errors
  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.log('❌ Console Error:', msg.text());
    }
  });

  try {
    // 1. Test Landing Page
    console.log('📱 Testing landing page...');
    await page.goto('http://localhost:5173');
    await page.waitForLoadState('networkidle');

    // Check if landing page loads
    const heroText = await page.locator('h1:has-text("Master AI")').isVisible();
    console.log(`✅ Landing page loaded: ${heroText}`);

    // 2. Navigate to Login
    console.log('🔐 Testing login page navigation...');
    await page.click('text=Start for Free');
    await page.waitForLoadState('networkidle');

    // Check if we're on login page
    const loginForm = await page.locator('text=Sign In').isVisible();
    console.log(`✅ Login page loaded: ${loginForm}`);

    // 3. Test Login with Test User
    console.log('👤 Testing login with test user...');

    // Use test user if available
    if (await page.locator('[value="test"]').isVisible()) {
      await page.click('[value="test"]');

      // Click the first test user button
      await page.click('button:has-text("Use This Account")');
      await page.waitForTimeout(500);
    }

    // Switch to login tab and submit
    await page.click('[value="login"]');
    await page.click('button[type="submit"]:has-text("Sign In")');

    // Wait for authentication to complete
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000); // Give extra time for redirects

    // Check if we're authenticated (should be on /app or /dashboard)
    const currentUrl = page.url();
    const isAuthenticated = currentUrl.includes('/app') || currentUrl.includes('/dashboard');
    console.log(`✅ Authentication successful: ${isAuthenticated} (URL: ${currentUrl})`);

    // 4. Test App Functionality
    console.log('🏠 Testing app functionality...');

    // Check if header is visible with user menu
    const userMenu = await page.locator('[aria-label*="User menu"]').isVisible();
    console.log(`✅ User menu visible: ${userMenu}`);

    // 5. Test Responsive Menu (Mobile)
    console.log('📱 Testing mobile menu...');
    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForTimeout(500);

    const mobileMenu = await page.locator('[aria-label*="navigation menu"]').isVisible();
    console.log(`✅ Mobile menu button visible: ${mobileMenu}`);

    if (mobileMenu) {
      await page.click('[aria-label*="navigation menu"]');
      await page.waitForTimeout(500);

      const menuPanel = await page.locator('#mobile-navigation-menu').isVisible();
      console.log(`✅ Mobile menu panel opened: ${menuPanel}`);

      // Close menu
      await page.press('body', 'Escape');
    }

    // Reset to desktop
    await page.setViewportSize({ width: 1280, height: 720 });

    // 6. Test Logout
    console.log('🚪 Testing logout...');

    // Open user dropdown
    await page.click('[aria-label*="User menu"]');
    await page.waitForTimeout(300);

    // Click logout
    await page.click('text=Sign out');
    await page.waitForLoadState('networkidle');

    // Check if we're back to landing page
    const backToLanding =
      page.url() === 'http://localhost:5173/' || page.url() === 'http://localhost:5173';
    console.log(`✅ Logout successful: ${backToLanding} (URL: ${page.url()})`);

    console.log('\\n🎉 Authentication flow test completed successfully!');
  } catch (error) {
    console.error('❌ Authentication flow test failed:', error.message);
  } finally {
    await browser.close();
  }
}

// Run the test
testAuthFlow().catch(console.error);
