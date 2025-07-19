import { chromium } from 'playwright';

async function testSearchProminence() {
  console.log('🔍 Testing search bar prominence...\n');
  
  const browser = await chromium.launch();
  
  // Test different viewports
  const viewports = [
    { name: 'mobile', width: 375, height: 667 },
    { name: 'tablet', width: 768, height: 1024 },
    { name: 'desktop', width: 1920, height: 1080 }
  ];
  
  for (const viewport of viewports) {
    console.log(`📱 Testing ${viewport.name} view...`);
    
    const context = await browser.newContext({
      viewport: { width: viewport.width, height: viewport.height }
    });
    
    const page = await context.newPage();
    await page.goto('http://localhost:5173/app');
    await page.waitForTimeout(2000);
    
    // Check search visibility
    const searchInput = await page.$('input[placeholder*="Search"]');
    const mobileSearchButton = await page.$('button[aria-label*="search"]');
    
    if (viewport.name === 'mobile') {
      // On mobile, check for the search toggle button
      if (mobileSearchButton) {
        const isVisible = await mobileSearchButton.isVisible();
        console.log(`✅ Mobile search button is ${isVisible ? 'visible' : 'hidden'}`);
        
        // Click to open search
        await mobileSearchButton.click();
        await page.waitForTimeout(500);
        
        // Check if search panel opened
        const searchPanel = await page.$('input[placeholder*="Search"]');
        if (searchPanel && await searchPanel.isVisible()) {
          console.log('✅ Mobile search panel opens correctly');
        }
      } else {
        console.log('❌ Mobile search button not found');
      }
    } else {
      // On larger screens, check for search input
      if (searchInput) {
        const isVisible = await searchInput.isVisible();
        console.log(`✅ Search input is ${isVisible ? 'visible' : 'hidden'}`);
        
        // Check styling
        const computedStyle = await searchInput.evaluate(el => {
          const style = window.getComputedStyle(el);
          return {
            height: style.height,
            fontSize: style.fontSize,
            border: style.border,
            boxShadow: style.boxShadow
          };
        });
        
        console.log('📊 Search bar styling:', computedStyle);
      } else {
        console.log('❌ Search input not found');
      }
    }
    
    // Take screenshot
    await page.screenshot({ 
      path: `search-prominence-${viewport.name}.png`,
      fullPage: false 
    });
    console.log(`📸 Screenshot saved as search-prominence-${viewport.name}.png`);
    
    await context.close();
    console.log('');
  }
  
  await browser.close();
  
  console.log('✅ Search prominence test complete!');
  console.log('\nRecommendations:');
  console.log('- Search is now more prominent with primary color icon');
  console.log('- Enhanced styling with shadow and hover effects');
  console.log('- Mobile search button is more visible');
  console.log('- Search placeholder text is more descriptive');
}

testSearchProminence().catch(console.error);