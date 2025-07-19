import { chromium } from 'playwright';

async function quickSkeletonTest() {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  console.log('🧪 Testing loading skeleton...');
  
  // Navigate and capture skeleton
  await page.goto('http://localhost:5173');
  
  // Wait a moment to see the skeleton
  await page.waitForTimeout(3000);
  
  console.log('✅ Loading skeleton should be visible in the browser');
  console.log('🔍 Check if you see:');
  console.log('- Header with logo placeholder');
  console.log('- Title and search bar placeholders');
  console.log('- Grid of card placeholders');
  console.log('- Loading spinner at bottom');
  
  console.log('\n👀 Browser will stay open. Press Ctrl+C to close.');
  
  // Keep browser open
  await new Promise(() => {});
}

quickSkeletonTest().catch(console.error);