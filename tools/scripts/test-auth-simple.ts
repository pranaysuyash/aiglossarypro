import { chromium } from 'playwright';

async function testAuthSimple() {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  try {
    console.log('🔍 Testing authentication flow with cookie handling...\n');
    
    // 1. Navigate to login
    console.log('1️⃣ Navigating to login page...');
    await page.goto('http://localhost:5173/login');
    await page.waitForTimeout(2000);
    
    // 2. Handle cookie consent if present
    console.log('2️⃣ Checking for cookie consent...');
    try {
      const acceptButton = await page.waitForSelector('button:has-text("Accept")', { timeout: 3000 });
      if (acceptButton) {
        console.log('✅ Cookie banner found, accepting...');
        await acceptButton.click();
        await page.waitForTimeout(1000);
      }
    } catch {
      console.log('ℹ️  No cookie banner found');
    }
    
    // 3. Fill login form
    console.log('\n3️⃣ Filling login credentials...');
    await page.fill('input[type="email"]', 'test@aimlglossary.com');
    await page.fill('input[type="password"]', 'testpassword123');
    await page.screenshot({ path: 'login-filled.png' });
    
    // 4. Submit form
    console.log('4️⃣ Submitting login...');
    await page.click('button[type="submit"]');
    
    // Wait for navigation or error
    await page.waitForTimeout(5000);
    
    // 5. Check current state
    const currentUrl = page.url();
    console.log(`\n📍 Current URL: ${currentUrl}`);
    await page.screenshot({ path: 'after-login.png' });
    
    // Check if we're on dashboard
    if (currentUrl.includes('dashboard')) {
      console.log('✅ Successfully navigated to dashboard!');
      
      // Check for welcome modal
      const welcomeModal = await page.$('div[role="alert"]:has-text("Welcome")');
      if (welcomeModal) {
        console.log('✅ Welcome modal displayed');
        const welcomeText = await welcomeModal.textContent();
        console.log(`   Message: ${welcomeText?.substring(0, 50)}...`);
      }
      
      // Look for logout button
      const logoutButton = await page.$('button:has-text("Sign out"), button:has-text("Log out")');
      if (logoutButton) {
        console.log('✅ Logout button found - user is authenticated!');
        
        // Test logout
        console.log('\n5️⃣ Testing logout...');
        await logoutButton.click();
        await page.waitForTimeout(2000);
        
        const urlAfterLogout = page.url();
        console.log(`📍 URL after logout: ${urlAfterLogout}`);
        await page.screenshot({ path: 'after-logout.png' });
        
        if (urlAfterLogout.includes('login')) {
          console.log('✅ Logout successful!');
        }
      }
    } else {
      console.log('❌ Login did not redirect to dashboard');
      
      // Check for errors
      const errors = await page.$$('text=error, text=invalid, [role="alert"]');
      for (const error of errors) {
        const text = await error.textContent();
        console.log(`⚠️  Error found: ${text}`);
      }
    }
    
    console.log('\n✅ Test completed. Check screenshots.');
    await browser.close();
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    await page.screenshot({ path: 'error-state.png' });
    await browser.close();
  }
}

testAuthSimple().catch(console.error);