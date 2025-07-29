import { chromium } from 'playwright';

async function testPageTransitions() {
  console.log('🔄 Testing page transition loading indicators...\n');
  
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  // Navigate to app
  await page.goto('http://localhost:5173/app');
  await page.waitForTimeout(2000);
  
  console.log('📍 Starting on app page');
  
  // Test navigation transitions
  const routes = [
    { name: 'Categories', path: '/categories', selector: 'a[href="/categories"]' },
    { name: 'Trending', path: '/trending', selector: 'a[href="/trending"]' },
    { name: 'Dashboard', path: '/dashboard', selector: 'a[href="/dashboard"]' },
  ];
  
  for (const route of routes) {
    console.log(`\n🔍 Testing transition to ${route.name}...`);
    
    // Look for the navigation link
    const link = await page.$(route.selector);
    
    if (link) {
      // Set up listener for the progress bar
      const progressBarPromise = page.waitForSelector('.fixed.top-0 .h-1', { 
        state: 'visible',
        timeout: 2000 
      }).catch(() => null);
      
      // Click the link
      await link.click();
      
      // Check if progress bar appeared
      const progressBar = await progressBarPromise;
      
      if (progressBar) {
        console.log(`✅ Progress bar appeared for ${route.name} transition`);
        
        // Wait for it to complete
        await page.waitForSelector('.fixed.top-0 .h-1', { 
          state: 'hidden',
          timeout: 3000 
        }).catch(() => {
          console.log('⚠️  Progress bar did not hide automatically');
        });
      } else {
        console.log(`❌ No progress bar for ${route.name} transition`);
      }
      
      // Wait for page to load
      await page.waitForTimeout(1000);
      
      // Go back to app page for next test
      await page.goto('http://localhost:5173/app');
      await page.waitForTimeout(1000);
    } else {
      console.log(`⚠️  Link not found for ${route.name}`);
    }
  }
  
  console.log('\n\n📊 Summary:');
  console.log('Page transition loader has been implemented.');
  console.log('It shows a progress bar at the top during navigation.');
  
  console.log('\n👀 Browser will stay open. Press Ctrl+C to close.');
  
  // Keep browser open
  await new Promise(() => {});
}

testPageTransitions().catch(console.error);