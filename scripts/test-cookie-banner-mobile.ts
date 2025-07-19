import { chromium } from 'playwright';

async function testMobileCookieBanner() {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({
    viewport: { width: 375, height: 667 }, // iPhone SE size
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1'
  });
  
  const page = await context.newPage();
  
  console.log('🔍 Testing mobile cookie banner...');
  
  // Navigate to the app
  await page.goto('http://localhost:5173');
  
  // Wait for cookie banner to appear
  await page.waitForSelector('.fixed.bottom-0', { timeout: 5000 });
  
  // Take screenshot of mobile view with cookie banner
  await page.screenshot({ 
    path: 'cookie-banner-mobile-test.png',
    fullPage: false 
  });
  
  console.log('📸 Screenshot saved as cookie-banner-mobile-test.png');
  
  // Check if the compact mobile view is shown
  const bannerHeight = await page.evaluate(() => {
    const banner = document.querySelector('.fixed.bottom-0');
    return banner ? banner.getBoundingClientRect().height : 0;
  });
  
  console.log(`📏 Cookie banner height: ${bannerHeight}px`);
  
  if (bannerHeight < 100) {
    console.log('✅ Cookie banner is compact on mobile!');
  } else {
    console.log('❌ Cookie banner is still too tall on mobile');
  }
  
  // Test desktop view for comparison
  await context.setViewportSize({ width: 1920, height: 1080 });
  await page.reload();
  await page.waitForSelector('.fixed.bottom-0', { timeout: 5000 });
  
  const desktopBannerHeight = await page.evaluate(() => {
    const banner = document.querySelector('.fixed.bottom-0');
    return banner ? banner.getBoundingClientRect().height : 0;
  });
  
  console.log(`📏 Desktop cookie banner height: ${desktopBannerHeight}px`);
  
  await page.screenshot({ 
    path: 'cookie-banner-desktop-test.png',
    fullPage: false 
  });
  
  console.log('📸 Desktop screenshot saved as cookie-banner-desktop-test.png');
  
  // Keep browser open for manual inspection
  console.log('\n👀 Browser will stay open for manual inspection. Press Ctrl+C to close.');
  
  // Keep the script running
  await new Promise(() => {});
}

testMobileCookieBanner().catch(console.error);