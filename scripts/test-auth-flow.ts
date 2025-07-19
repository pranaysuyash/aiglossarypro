import { chromium } from 'playwright';

async function testAuthFlow() {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  try {
    console.log('🔍 Testing authentication flow...\n');
    
    // 1. Navigate to login
    console.log('1️⃣ Navigating to login page...');
    await page.goto('http://localhost:5173/login');
    await page.waitForTimeout(2000);
    
    // Take screenshot
    await page.screenshot({ path: 'auth-test-1-login-page.png' });
    
    // 2. Check if login form is present
    const emailInput = await page.$('input[type="email"]');
    const passwordInput = await page.$('input[type="password"]');
    
    if (!emailInput || !passwordInput) {
      console.log('❌ Login form not found!');
      return;
    }
    
    console.log('✅ Login form found');
    
    // 3. Fill in credentials
    console.log('\n2️⃣ Filling in credentials for free user...');
    await emailInput.fill('test@aimlglossary.com');
    await passwordInput.fill('testpassword123');
    await page.screenshot({ path: 'auth-test-2-credentials-filled.png' });
    
    // 4. Submit login
    console.log('\n3️⃣ Submitting login form...');
    const submitButton = await page.$('button[type="submit"]');
    if (submitButton) {
      // Click and wait for navigation
      await Promise.all([
        page.waitForNavigation({ timeout: 10000 }).catch(e => console.log('Navigation timeout:', e.message)),
        submitButton.click()
      ]);
    }
    
    await page.waitForTimeout(3000);
    await page.screenshot({ path: 'auth-test-3-after-login.png' });
    
    // 5. Check current URL and auth state
    const currentUrl = page.url();
    console.log(`\n📍 Current URL: ${currentUrl}`);
    
    // 6. Look for logout button
    console.log('\n4️⃣ Looking for logout/sign out button...');
    const logoutButton = await page.$('button:has-text("Sign out"), button:has-text("Log out"), button:has-text("Logout")');
    
    if (logoutButton) {
      console.log('✅ Logout button found - user is authenticated!');
      await page.screenshot({ path: 'auth-test-4-authenticated.png' });
      
      // 7. Test logout
      console.log('\n5️⃣ Testing logout functionality...');
      await logoutButton.click();
      await page.waitForTimeout(2000);
      
      const urlAfterLogout = page.url();
      console.log(`📍 URL after logout: ${urlAfterLogout}`);
      await page.screenshot({ path: 'auth-test-5-after-logout.png' });
      
      // Check if redirected to login or landing
      if (urlAfterLogout.includes('/login') || urlAfterLogout === 'http://localhost:5173/') {
        console.log('✅ Logout successful - redirected appropriately');
      } else {
        console.log('⚠️  Logout may not have worked properly');
      }
      
    } else {
      console.log('❌ No logout button found - authentication may have failed');
      
      // Check for error messages
      const errorMessage = await page.$('[role="alert"], .error, .text-red-500');
      if (errorMessage) {
        const errorText = await errorMessage.textContent();
        console.log(`⚠️  Error message: ${errorText}`);
      }
    }
    
    // 8. Check for any modals blocking interaction
    const modal = await page.$('.fixed.inset-0.bg-black');
    if (modal) {
      console.log('\n⚠️  Modal overlay detected - this might be blocking interactions');
    }
    
    console.log('\n📊 Test Summary:');
    console.log('- Login page: ✅ Accessible');
    console.log('- Login form: ✅ Present');
    console.log(`- Authentication: ${logoutButton ? '✅ Working' : '❌ Failed'}`);
    console.log(`- Logout: ${logoutButton ? '✅ Button present' : '❌ Not tested'}`);
    
    console.log('\n👀 Browser will stay open. Check the screenshots and browser.');
    console.log('Press Ctrl+C to close.');
    
    // Keep browser open
    await new Promise(() => {});
    
  } catch (error) {
    console.error('❌ Test error:', error);
    await page.screenshot({ path: 'auth-test-error.png' });
  }
}

testAuthFlow().catch(console.error);