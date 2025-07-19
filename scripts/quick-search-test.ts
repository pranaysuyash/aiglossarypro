import { chromium } from 'playwright';

async function quickSearchTest() {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  console.log('🔍 Quick search test...');
  
  // Navigate to app page
  await page.goto('http://localhost:5173/app');
  await page.waitForTimeout(2000);
  
  // Mobile viewport
  await page.setViewportSize({ width: 375, height: 667 });
  
  console.log('📱 Mobile view loaded');
  
  // Look for any search-related elements
  const searchElements = await page.$$eval('*', elements => {
    return elements
      .filter(el => {
        const text = el.textContent || '';
        const ariaLabel = el.getAttribute('aria-label') || '';
        const placeholder = el.getAttribute('placeholder') || '';
        return text.includes('Search') || ariaLabel.includes('search') || placeholder.includes('Search');
      })
      .map(el => ({
        tag: el.tagName,
        text: el.textContent?.trim(),
        ariaLabel: el.getAttribute('aria-label'),
        placeholder: el.getAttribute('placeholder'),
        className: el.className,
        visible: !!(el.offsetWidth || el.offsetHeight || el.getClientRects().length)
      }));
  });
  
  console.log('\nSearch-related elements found:');
  searchElements.forEach(el => {
    console.log(`- ${el.tag}: "${el.text || el.ariaLabel || el.placeholder}" (visible: ${el.visible})`);
  });
  
  // Desktop viewport
  await page.setViewportSize({ width: 1920, height: 1080 });
  await page.waitForTimeout(1000);
  
  console.log('\n💻 Desktop view loaded');
  
  const desktopSearch = await page.$('input[placeholder*="Search"]');
  if (desktopSearch) {
    const isVisible = await desktopSearch.isVisible();
    console.log(`Desktop search input is ${isVisible ? 'visible' : 'hidden'}`);
  }
  
  console.log('\n👀 Browser will stay open. Press Ctrl+C to close.');
  
  // Keep browser open
  await new Promise(() => {});
}

quickSearchTest().catch(console.error);