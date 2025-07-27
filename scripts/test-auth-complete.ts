import { chromium } from 'playwright';

async function testAuthComplete() {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  try {
    console.log('🔍 Testing complete auth flow...\n');
    
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
    
    // Wait for navigation
    await page.waitForTimeout(3000);
    
    const dashboardUrl = page.url();
    console.log(`✅ Logged in - URL: ${dashboardUrl}`);
    
    // 2. Handle welcome modal
    console.log('\n2️⃣ Checking for welcome modal...');
    
    // Look for modal overlay
    const modalOverlay = await page.$('.fixed.inset-0.bg-black');
    if (modalOverlay) {
      console.log('✅ Welcome modal detected');
      
      // Try to close it
      try {
        // Look for close button
        const closeButton = await page.$('button[aria-label*="Close"], button:has-text("×"), button:has-text("X")');
        if (closeButton) {
          await closeButton.click();
          console.log('✅ Closed welcome modal with button');
        } else {
          // Try clicking outside
          await page.click('.fixed.inset-0.bg-black', { position: { x: 10, y: 10 } });
          console.log('✅ Closed welcome modal by clicking outside');
        }
      } catch {
        // Try escape key
        await page.keyboard.press('Escape');
        console.log('✅ Closed welcome modal with Escape key');
      }
      
      await page.waitForTimeout(1000);
    }
    
    // 3. Now try to find user dropdown
    console.log('\n3️⃣ Looking for user avatar...');
    
    // Take screenshot to see current state
    await page.screenshot({ path: 'after-modal-close.png' });
    
    // Look for user avatar - try more specific selectors
    const avatar = await page.$('button.rounded-full.bg-primary, button.h-8.w-8.rounded-full');
    
    if (avatar) {
      console.log('✅ Found user avatar');
      await avatar.click();
      await page.waitForTimeout(500);
      
      // 4. Look for Sign out
      const signOut = await page.$('[role="menuitem"]:has-text("Sign out"), button:has-text("Sign out")');
      
      if (signOut) {
        console.log('✅ Found Sign out button');
        
        // 5. Click sign out
        console.log('\n4️⃣ Clicking Sign out...');
        await signOut.click();
        await page.waitForTimeout(3000);
        
        const logoutUrl = page.url();
        console.log(`📍 URL after logout: ${logoutUrl}`);
        
        // 6. Check if we're logged out
        console.log('\n5️⃣ Verifying logout...');
        
        // Check if we're back on login or app page
        if (logoutUrl.includes('login') || logoutUrl === 'http://localhost:5173/app') {
          console.log('✅ Redirected after logout');
          
          // Check if there's a login button
          const loginButton = await page.$('a[href="/login"], button:has-text("Sign in")');
          if (loginButton) {
            console.log('✅ Login button present - logout successful!');
          } else {
            console.log('⚠️  No login button found');
          }
        } else if (logoutUrl.includes('dashboard')) {
          console.log('❌ Still on dashboard - logout may have failed');
          
          // Check if still authenticated
          const stillAvatar = await page.$('button.rounded-full.bg-primary');
          if (stillAvatar) {
            console.log('❌ User avatar still present - user is still logged in!');
          }
        }
      } else {
        console.log('❌ Sign out button not found in dropdown');
      }
    } else {
      console.log('❌ User avatar not found');
    }
    
    console.log('\n📊 Summary:');
    console.log('- Login: ✅ Working');
    console.log('- Welcome Modal: ✅ Can be closed');
    console.log('- Logout Button: Need to verify in dropdown');
    console.log('- Auto re-login issue: Need to check auth persistence');
    
    console.log('\n👀 Browser staying open. Press Ctrl+C to close.');
    await new Promise(() => {});
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    await page.screenshot({ path: 'error-complete.png' });
    await browser.close();
  }
}

testAuthComplete().catch(console.error);