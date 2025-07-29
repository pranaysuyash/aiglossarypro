import { chromium } from 'playwright';

async function testLoginConsolidation() {
  console.log('🧪 Testing login flow consolidation...\n');
  
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();
  
  const testCases = [
    {
      name: 'Header Sign In Button',
      url: 'http://localhost:5173',
      selector: 'button:has-text("Sign In")',
      description: 'Main header sign in button'
    },
    {
      name: 'Landing Page Hero CTA',
      url: 'http://localhost:5173',
      selector: 'button:has-text("Start")',
      description: 'Hero section CTA button'
    },
    {
      name: 'Settings Page',
      url: 'http://localhost:5173/settings',
      selector: 'button:has-text("Sign In")',
      description: 'Settings page sign in'
    },
    {
      name: 'Favorites Page',
      url: 'http://localhost:5173/favorites',
      selector: 'button:has-text("Sign In")',
      description: 'Favorites page sign in'
    }
  ];
  
  let passedTests = 0;
  const results = [];
  
  for (const test of testCases) {
    console.log(`📍 Testing: ${test.name}`);
    
    try {
      await page.goto(test.url);
      await page.waitForTimeout(2000);
      
      // Find the button
      const button = await page.$(test.selector);
      
      if (button) {
        // Check what happens when clicked
        const [response] = await Promise.all([
          page.waitForNavigation({ waitUntil: 'domcontentloaded' }).catch(() => null),
          button.click()
        ]);
        
        const currentUrl = page.url();
        const isLoginPage = currentUrl.includes('/login');
        
        results.push({
          test: test.name,
          passed: isLoginPage,
          url: currentUrl,
          expectedPath: '/login'
        });
        
        if (isLoginPage) {
          console.log(`✅ PASS - Redirects to /login`);
          passedTests++;
        } else {
          console.log(`❌ FAIL - Redirects to ${currentUrl}`);
        }
      } else {
        console.log(`⚠️  Button not found with selector: ${test.selector}`);
        results.push({
          test: test.name,
          passed: false,
          error: 'Button not found'
        });
      }
      
      // Go back for next test
      await page.goto('http://localhost:5173');
      
    } catch (error) {
      console.log(`❌ ERROR - ${error.message}`);
      results.push({
        test: test.name,
        passed: false,
        error: error.message
      });
    }
    
    console.log('');
  }
  
  // Summary
  console.log('📊 Test Summary:');
  console.log(`Total Tests: ${testCases.length}`);
  console.log(`Passed: ${passedTests}`);
  console.log(`Failed: ${testCases.length - passedTests}`);
  
  console.log('\n📋 Detailed Results:');
  results.forEach(result => {
    const status = result.passed ? '✅' : '❌';
    console.log(`${status} ${result.test}: ${result.url || result.error}`);
  });
  
  await browser.close();
  
  console.log('\n✅ Login consolidation test complete!');
}

testLoginConsolidation().catch(console.error);