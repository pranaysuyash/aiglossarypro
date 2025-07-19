import { chromium } from 'playwright';

async function testLoadingSkeleton() {
  console.log('🧪 Testing loading skeleton...');
  
  const browser = await chromium.launch();
  
  // Test on different viewports
  const viewports = [
    { name: 'mobile', width: 375, height: 667 },
    { name: 'tablet', width: 768, height: 1024 },
    { name: 'desktop', width: 1920, height: 1080 }
  ];
  
  for (const viewport of viewports) {
    console.log(`\n📱 Testing ${viewport.name} view...`);
    
    const context = await browser.newContext({
      viewport: { width: viewport.width, height: viewport.height }
    });
    
    const page = await context.newPage();
    
    // Capture the loading skeleton before navigation
    page.on('domcontentloaded', async () => {
      // Take screenshot immediately when DOM is loaded (skeleton should be visible)
      await page.screenshot({ 
        path: `loading-skeleton-${viewport.name}.png`,
        fullPage: false 
      });
      console.log(`📸 Captured loading skeleton for ${viewport.name}`);
    });
    
    // Navigate to the app
    await page.goto('http://localhost:5173', { waitUntil: 'networkidle' });
    
    // Also capture after load for comparison
    await page.screenshot({ 
      path: `loaded-${viewport.name}.png`,
      fullPage: false 
    });
    console.log(`📸 Captured loaded state for ${viewport.name}`);
    
    await context.close();
  }
  
  await browser.close();
  
  console.log('\n✅ Loading skeleton test complete!');
  console.log('Check the following screenshots:');
  console.log('- loading-skeleton-mobile.png');
  console.log('- loading-skeleton-tablet.png');
  console.log('- loading-skeleton-desktop.png');
}

testLoadingSkeleton().catch(console.error);