import { chromium } from 'playwright';
async function testLogoutFix() {
    const browser = await chromium.launch({ headless: false });
    const context = await browser.newContext();
    const page = await context.newPage();
    try {
        console.log('🔍 Testing logout fix...\n');
        // 1. Login
        console.log('1️⃣ Logging in...');
        await page.goto('http://localhost:5173/login');
        await page.waitForTimeout(1000);
        // Handle cookie consent
        try {
            const acceptButton = await page.waitForSelector('button:has-text("Accept")', { timeout: 2000 });
            if (acceptButton) {
                await acceptButton.click();
            }
        }
        catch { }
        await page.fill('input[type="email"]', 'test@aimlglossary.com');
        await page.fill('input[type="password"]', 'testpassword123');
        await page.click('button[type="submit"]');
        await page.waitForTimeout(3000);
        console.log('✅ Logged in successfully');
        // 2. Check cookies before logout
        console.log('\n2️⃣ Checking cookies before logout...');
        const cookiesBefore = await context.cookies();
        const authCookiesBefore = cookiesBefore.filter(c => c.name.includes('auth') || c.name.includes('token'));
        console.log(`Found ${authCookiesBefore.length} auth cookies:`);
        authCookiesBefore.forEach(c => console.log(`  - ${c.name}`));
        // 3. Perform logout
        console.log('\n3️⃣ Logging out...');
        const avatar = await page.$('button.rounded-full');
        if (avatar) {
            await avatar.click();
            await page.waitForTimeout(500);
            const signOut = await page.$('text="Sign out"');
            if (signOut) {
                await signOut.click();
                console.log('✅ Clicked Sign out');
                await page.waitForTimeout(3000);
            }
        }
        // 4. Check cookies after logout
        console.log('\n4️⃣ Checking cookies after logout...');
        const cookiesAfter = await context.cookies();
        const authCookiesAfter = cookiesAfter.filter(c => c.name.includes('auth') || c.name.includes('token'));
        console.log(`Found ${authCookiesAfter.length} auth cookies after logout`);
        // 5. Test access to protected page
        console.log('\n5️⃣ Testing access to dashboard...');
        await page.goto('http://localhost:5173/dashboard');
        await page.waitForTimeout(2000);
        const currentUrl = page.url();
        console.log(`Current URL: ${currentUrl}`);
        if (currentUrl.includes('login')) {
            console.log('✅ Redirected to login - logout successful!');
        }
        else if (currentUrl.includes('dashboard')) {
            console.log('❌ Still on dashboard - logout failed');
        }
        // 6. Navigate to app page
        console.log('\n6️⃣ Testing app page...');
        await page.goto('http://localhost:5173/app');
        await page.waitForTimeout(2000);
        // Check for login button
        const loginButton = await page.$('a[href="/login"], button:has-text("Sign in")');
        const userAvatar = await page.$('button.rounded-full');
        console.log('\n📊 Final Results:');
        console.log(`- Auth cookies before: ${authCookiesBefore.length}`);
        console.log(`- Auth cookies after: ${authCookiesAfter.length}`);
        console.log(`- Dashboard access: ${currentUrl.includes('login') ? '✅ Blocked' : '❌ Allowed'}`);
        console.log(`- App page state: ${loginButton ? '✅ Shows login' : userAvatar ? '❌ Still logged in' : '⚠️ Unknown'}`);
        await browser.close();
    }
    catch (error) {
        console.error('❌ Error:', error.message);
        await browser.close();
    }
}
testLogoutFix().catch(console.error);
