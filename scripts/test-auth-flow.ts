import { chromium } from 'playwright';

const testUsers = [
  {
    email: 'free@aiglossarypro.com',
    password: 'freepass123',
    expectedViews: '50 daily views',
    userType: 'Free User'
  },
  {
    email: 'premium@aiglossarypro.com',
    password: 'premiumpass123',
    expectedViews: 'Unlimited',
    userType: 'Premium User'
  },
  {
    email: 'admin@aiglossarypro.com',
    password: 'adminpass123',
    expectedViews: 'Unlimited',
    userType: 'Admin User',
    hasAdminAccess: true
  }
];

async function testAuthFlow() {
  const browser = await chromium.launch({ headless: false });
  
  try {
    console.log('🔍 Testing authentication flow with provided credentials...\n');
    
    for (const user of testUsers) {
      console.log(`\n${'='.repeat(50)}`);
      console.log(`Testing ${user.userType}: ${user.email}`);
      console.log('='.repeat(50));
      
      const page = await browser.newPage();
      
      // 1. Navigate to login
      console.log('1️⃣ Navigating to login page...');
      await page.goto('http://localhost:5173/login');
      await page.waitForTimeout(2000);
      
      // Handle cookie consent if present
      try {
        const cookieAcceptButton = await page.waitForSelector('button:has-text("Accept"), button:has-text("I Accept"), button:has-text("Accept All")', { timeout: 3000 });
        if (cookieAcceptButton) {
          console.log('🍪 Accepting cookie consent...');
          await cookieAcceptButton.click();
          await page.waitForTimeout(1000);
        }
      } catch (e) {
        console.log('ℹ️  No cookie consent banner found (or already accepted)');
      }
      
      // Take screenshot
      await page.screenshot({ path: `auth-test-${user.userType.replace(' ', '-')}-1-login-page.png` });
      
      // 2. Check if login form is present
      const emailInput = await page.$('input[type="email"]');
      const passwordInput = await page.$('input[type="password"]');
      
      if (!emailInput || !passwordInput) {
        console.log('❌ Login form not found!');
        await page.close();
        continue;
      }
      
      console.log('✅ Login form found');
      
      // 3. Fill in credentials
      console.log(`\n2️⃣ Filling in credentials for ${user.userType}...`);
      await emailInput.fill(user.email);
      await passwordInput.fill(user.password);
      await page.screenshot({ path: `auth-test-${user.userType.replace(' ', '-')}-2-credentials-filled.png` });
      
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
      await page.screenshot({ path: `auth-test-${user.userType.replace(' ', '-')}-3-after-login.png` });
      
      // 5. Check current URL and auth state
      const currentUrl = page.url();
      console.log(`\n📍 Current URL: ${currentUrl}`);
      
      // 6. Check for daily views display
      console.log(`\n4️⃣ Looking for daily views display (expecting: ${user.expectedViews})...`);
      const viewsText = await page.textContent('body');
      if (viewsText?.includes(user.expectedViews) || (user.expectedViews === '50 daily views' && viewsText?.includes('50'))) {
        console.log(`✅ Correct views displayed: ${user.expectedViews}`);
      } else {
        console.log(`⚠️  Expected views not found: ${user.expectedViews}`);
      }
      
      // 7. Look for logout button
      console.log('\n5️⃣ Looking for logout/sign out button...');
      const logoutButton = await page.$('button:has-text("Sign out"), button:has-text("Log out"), button:has-text("Logout"), button:has-text("Sign Out")');
      
      if (logoutButton) {
        console.log('✅ Logout button found - user is authenticated!');
        await page.screenshot({ path: `auth-test-${user.userType.replace(' ', '-')}-4-authenticated.png` });
        
        // Check for admin access if applicable
        if (user.hasAdminAccess) {
          const adminLink = await page.$('a[href="/admin"]');
          if (adminLink) {
            console.log('✅ Admin access verified');
          } else {
            console.log('⚠️  Admin access link not found');
          }
        }
        
        // 8. Test logout
        console.log('\n6️⃣ Testing logout functionality...');
        await logoutButton.click();
        await page.waitForTimeout(2000);
        
        const urlAfterLogout = page.url();
        console.log(`📍 URL after logout: ${urlAfterLogout}`);
        await page.screenshot({ path: `auth-test-${user.userType.replace(' ', '-')}-5-after-logout.png` });
        
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
      
      console.log(`\n📊 ${user.userType} Test Summary:`);
      console.log('- Login page: ✅ Accessible');
      console.log('- Login form: ✅ Present');
      console.log(`- Authentication: ${logoutButton ? '✅ Working' : '❌ Failed'}`);
      console.log(`- Daily views: ${user.expectedViews}`);
      if (user.hasAdminAccess) {
        console.log(`- Admin access: ${await page.$('a[href="/admin"]') ? '✅ Present' : '❌ Not found'}`);
      }
      
      await page.close();
      await new Promise(resolve => setTimeout(resolve, 2000)); // Pause between users
    }
    
    console.log('\n✅ All authentication tests completed!');
    console.log('\n📸 Screenshots saved for each user test');
    console.log('\n🔍 Summary:');
    console.log('- Free User: Should show 50 daily views');
    console.log('- Premium User: Should show Unlimited views');
    console.log('- Admin User: Should show Unlimited views + admin access');
    
  } catch (error) {
    console.error('❌ Test error:', error);
  } finally {
    await browser.close();
  }
}

testAuthFlow().catch(console.error);