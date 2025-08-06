import { test, expect } from '@playwright/test';
test('basic connectivity test', async ({ page }) => {
    console.log('🔄 Testing basic connectivity to production URL...');
    const response = await page.goto('https://d1bnbqox1m8zqp.cloudfront.net', {
        waitUntil: 'domcontentloaded',
        timeout: 30000
    });
    expect(response?.status()).toBe(200);
    await page.waitForSelector('#root', { timeout: 10000 });
    console.log('✅ Basic connectivity test passed');
});
