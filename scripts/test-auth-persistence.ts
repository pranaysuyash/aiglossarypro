import { chromium } from 'playwright';

async function testAuthPersistence() {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  try {
    console.log('🔍 Testing auth persistence and logout behavior...\n');
    
    // 1. Check initial state
    console.log('1️⃣ Checking initial state...');
    await page.goto('http://localhost:5173/app');
    await page.waitForTimeout(2000);
    
    // Check if already logged in
    const initialUrl = page.url();
    console.log(`Initial URL: ${initialUrl}`);
    
    if (!initialUrl.includes('login')) {
      console.log('⚠️  Already authenticated from previous session!');
      
      // Look for user avatar
      const avatar = await page.$('button.rounded-full');
      if (avatar) {
        console.log('✅ User avatar found - clearing existing session...');
        
        // Try to logout first
        await avatar.click();
        await page.waitForTimeout(500);
        const signOut = await page.$('text="Sign out"');
        if (signOut) {
          await signOut.click();
          await page.waitForTimeout(2000);
        }
      }
    }
    
    // 2. Fresh login
    console.log('\n2️⃣ Performing fresh login...');
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
    await page.waitForTimeout(3000);
    
    console.log('✅ Logged in');
    
    // 3. Check cookies before logout
    console.log('\n3️⃣ Checking cookies before logout...');
    const cookiesBefore = await context.cookies();
    const authCookies = cookiesBefore.filter(c => 
      c.name.includes('auth') || 
      c.name.includes('token') || 
      c.name.includes('firebase') ||
      c.name.includes('session')
    );
    console.log(`Found ${authCookies.length} auth-related cookies:`);
    authCookies.forEach(c => console.log(`  - ${c.name}: ${c.value.substring(0, 20)}...`));
    
    // 4. Logout
    console.log('\n4️⃣ Performing logout...');
    const avatar = await page.$('button.rounded-full');
    if (avatar) {
      await avatar.click();
      await page.waitForTimeout(500);
      const signOut = await page.$('text="Sign out"');
      if (signOut) {
        await signOut.click();
        await page.waitForTimeout(3000);
        console.log('✅ Clicked Sign out');
      }
    }
    
    // 5. Check cookies after logout
    console.log('\n5️⃣ Checking cookies after logout...');
    const cookiesAfter = await context.cookies();
    const authCookiesAfter = cookiesAfter.filter(c => 
      c.name.includes('auth') || 
      c.name.includes('token') || 
      c.name.includes('firebase') ||
      c.name.includes('session')
    );
    console.log(`Found ${authCookiesAfter.length} auth-related cookies after logout:`);
    authCookiesAfter.forEach(c => console.log(`  - ${c.name}: ${c.value.substring(0, 20)}...`));
    
    // 6. Navigate to protected page
    console.log('\n6️⃣ Testing access to protected pages after logout...');
    await page.goto('http://localhost:5173/dashboard');
    await page.waitForTimeout(2000);
    
    const afterLogoutUrl = page.url();
    console.log(`URL after trying to access dashboard: ${afterLogoutUrl}`);
    
    if (afterLogoutUrl.includes('dashboard')) {
      console.log('❌ Still able to access dashboard - logout failed!');
    } else if (afterLogoutUrl.includes('login')) {
      console.log('✅ Redirected to login - logout worked!');
    }
    
    // 7. Try to navigate to app page
    console.log('\n7️⃣ Navigating to app page...');
    await page.goto('http://localhost:5173/app');
    await page.waitForTimeout(2000);
    
    const appPageUrl = page.url();
    console.log(`App page URL: ${appPageUrl}`);
    
    // Check if there's a login button
    const loginButton = await page.$('a[href="/login"], button:has-text("Sign in")');
    if (loginButton) {
      console.log('✅ Login button present - user is logged out');
    } else {
      const userAvatar = await page.$('button.rounded-full');
      if (userAvatar) {
        console.log('❌ User avatar present - user is still logged in!');
      }
    }
    
    console.log('\n📊 Summary:');
    console.log(`- Auth cookies before logout: ${authCookies.length}`);
    console.log(`- Auth cookies after logout: ${authCookiesAfter.length}`);
    console.log(`- Protected page access: ${afterLogoutUrl.includes('dashboard') ? '❌ Allowed' : '✅ Blocked'}`);
    console.log(`- Logout status: ${loginButton ? '✅ Successful' : '❌ Failed'}`);
    
    await browser.close();
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    await browser.close();
  }
}

testAuthPersistence().catch(console.error);