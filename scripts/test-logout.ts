import { chromium } from 'playwright';

async function testLogout() {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  try {
    console.log('🔍 Testing logout functionality...\n');
    
    // 1. Login first
    console.log('1️⃣ Logging in...');
    await page.goto('http://localhost:5173/login');
    await page.waitForTimeout(1000);
    
    // Handle cookie consent
    try {
      const acceptButton = await page.waitForSelector('button:has-text("Accept")', { timeout: 2000 });
      if (acceptButton) await acceptButton.click();
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
    
    // 2. Find logout button
    console.log('\n2️⃣ Looking for logout button...');
    
    // Check different possible locations
    const selectors = [
      'button:has-text("Sign out")',
      'button:has-text("Log out")',
      'button:has-text("Logout")',
      'a:has-text("Sign out")',
      'a:has-text("Log out")',
      '[aria-label*="logout"]',
      '[aria-label*="sign out"]'
    ];
    
    let logoutElement = null;
    for (const selector of selectors) {
      logoutElement = await page.$(selector);
      if (logoutElement) {
        console.log(`✅ Found logout element with selector: ${selector}`);
        break;
      }
    }
    
    if (!logoutElement) {
      console.log('❌ No logout button found on main page');
      
      // Check in sidebar or menu
      console.log('\n3️⃣ Checking sidebar/menu...');
      
      // Try to open menu/sidebar
      const menuButton = await page.$('button[aria-label*="menu"], button:has-text("Menu"), [data-testid="menu-button"]');
      if (menuButton) {
        await menuButton.click();
        await page.waitForTimeout(500);
        console.log('✅ Opened menu/sidebar');
        
        // Look for logout again
        for (const selector of selectors) {
          logoutElement = await page.$(selector);
          if (logoutElement) {
            console.log(`✅ Found logout in menu: ${selector}`);
            break;
          }
        }
      }
    }
    
    if (logoutElement) {
      console.log('\n4️⃣ Clicking logout...');
      await logoutElement.click();
      await page.waitForTimeout(2000);
      
      const currentUrl = page.url();
      console.log(`📍 URL after logout: ${currentUrl}`);
      
      if (currentUrl.includes('login') || currentUrl === 'http://localhost:5173/') {
        console.log('✅ Logout successful! Redirected to:', currentUrl);
      } else {
        console.log('⚠️  Unexpected URL after logout');
      }
    } else {
      console.log('\n❌ Could not find logout button anywhere');
      console.log('Taking screenshot of current state...');
      await page.screenshot({ path: 'no-logout-button.png' });
    }
    
    await browser.close();
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    await browser.close();
  }
}

testLogout().catch(console.error);