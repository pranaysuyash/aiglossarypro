import { chromium } from 'playwright';

async function testLogoutDropdown() {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  try {
    console.log('🔍 Testing logout in user dropdown...\n');
    
    // 1. Login
    console.log('1️⃣ Logging in...');
    await page.goto('http://localhost:5173/login');
    await page.waitForTimeout(1000);
    
    // Handle cookie consent
    try {
      const acceptButton = await page.waitForSelector('button:has-text("Accept")', { timeout: 2000 });
      if (acceptButton) {await acceptButton.click();}
    } catch {}
    
    // Login
    await page.fill('input[type="email"]', 'test@aimlglossary.com');
    await page.fill('input[type="password"]', 'testpassword123');
    await page.click('button[type="submit"]');
    
    // Wait for dashboard
    await page.waitForTimeout(3000);
    
    if (!page.url().includes('dashboard')) {
      console.log('❌ Login failed');
      return;
    }
    
    console.log('✅ Logged in successfully');
    
    // 2. Look for user avatar/button
    console.log('\n2️⃣ Looking for user dropdown button...');
    
    // Possible selectors for user avatar/dropdown
    const avatarSelectors = [
      'button[aria-label*="Account"]',
      'button:has(> span.sr-only:has-text("Open user menu"))',
      'button.rounded-full',
      'button:has(svg.h-6.w-6)', // Avatar icon
      '[data-testid="user-menu-button"]',
      'button:has-text("T")', // First letter of test user
      'button.bg-primary', // Avatar background
    ];
    
    let avatarButton = null;
    for (const selector of avatarSelectors) {
      try {
        avatarButton = await page.waitForSelector(selector, { timeout: 2000 });
        if (avatarButton) {
          const isVisible = await avatarButton.isVisible();
          if (isVisible) {
            console.log(`✅ Found user dropdown button: ${selector}`);
            break;
          }
        }
      } catch {}
    }
    
    if (!avatarButton) {
      console.log('❌ No user dropdown button found');
      await page.screenshot({ path: 'no-user-dropdown.png' });
      console.log('Check screenshot: no-user-dropdown.png');
      return;
    }
    
    // 3. Click to open dropdown
    console.log('\n3️⃣ Opening user dropdown...');
    await avatarButton.click();
    await page.waitForTimeout(500);
    
    // 4. Look for Sign out in dropdown
    console.log('4️⃣ Looking for Sign out option...');
    const signOutButton = await page.waitForSelector('text="Sign out"', { timeout: 2000 });
    
    if (signOutButton) {
      console.log('✅ Found Sign out button');
      
      // 5. Click sign out
      console.log('\n5️⃣ Clicking Sign out...');
      await signOutButton.click();
      await page.waitForTimeout(2000);
      
      const currentUrl = page.url();
      console.log(`📍 URL after logout: ${currentUrl}`);
      
      if (currentUrl.includes('login') || currentUrl.includes('/app')) {
        console.log('✅ Logout successful!');
        console.log('   Redirected to:', currentUrl);
      } else {
        console.log('⚠️  Unexpected URL after logout');
      }
    } else {
      console.log('❌ Sign out button not found in dropdown');
      await page.screenshot({ path: 'dropdown-no-signout.png' });
    }
    
    await browser.close();
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    await page.screenshot({ path: 'error-dropdown.png' });
    await browser.close();
  }
}

testLogoutDropdown().catch(console.error);