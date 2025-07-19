import { chromium } from 'playwright';

async function quickCookieTest() {
  const browser = await chromium.launch();
  
  // Test mobile view
  console.log('📱 Testing mobile view...');
  const mobileContext = await browser.newContext({
    viewport: { width: 375, height: 667 },
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1'
  });
  
  const mobilePage = await mobileContext.newPage();
  await mobilePage.goto('http://localhost:5173');
  await mobilePage.waitForTimeout(2000);
  
  // Check if compact mobile view is rendered
  const mobileCompact = await mobilePage.evaluate(() => {
    const banner = document.querySelector('.fixed.bottom-0');
    if (!banner) return { found: false };
    
    const text = banner.textContent || '';
    const height = banner.getBoundingClientRect().height;
    const hasCompactText = text.includes('We use cookies to enhance your experience');
    const hasOptionsButton = text.includes('Options');
    
    return {
      found: true,
      height,
      hasCompactText,
      hasOptionsButton,
      isCompact: height < 100
    };
  });
  
  console.log('Mobile banner:', mobileCompact);
  
  await mobilePage.screenshot({ path: 'mobile-cookie-banner.png' });
  await mobileContext.close();
  
  // Test desktop view
  console.log('\n💻 Testing desktop view...');
  const desktopContext = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });
  
  const desktopPage = await desktopContext.newPage();
  await desktopPage.goto('http://localhost:5173');
  await desktopPage.waitForTimeout(2000);
  
  const desktopView = await desktopPage.evaluate(() => {
    const banner = document.querySelector('.fixed.bottom-0');
    if (!banner) return { found: false };
    
    const height = banner.getBoundingClientRect().height;
    const hasFullText = banner.textContent?.includes('Cookie Settings');
    
    return {
      found: true,
      height,
      hasFullText
    };
  });
  
  console.log('Desktop banner:', desktopView);
  
  await desktopPage.screenshot({ path: 'desktop-cookie-banner.png' });
  await desktopContext.close();
  
  await browser.close();
  
  // Summary
  console.log('\n📊 Summary:');
  if (mobileCompact.found && mobileCompact.isCompact) {
    console.log('✅ Mobile cookie banner is properly compact');
  } else {
    console.log('❌ Mobile cookie banner needs adjustment');
  }
  
  if (desktopView.found && desktopView.hasFullText) {
    console.log('✅ Desktop cookie banner shows full view');
  }
}

quickCookieTest().catch(console.error);