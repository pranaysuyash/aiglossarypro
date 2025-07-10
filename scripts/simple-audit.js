/**
 * Simple Visual Audit - Tests Basic Functionality
 */

import { chromium } from 'playwright';

async function simpleAudit() {
  console.log('🚀 Starting Simple Visual Audit...');
  
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage({
    viewport: { width: 1280, height: 720 }
  });

  const results = [];
  const errors = [];

  // Track console errors
  page.on('console', msg => {
    if (msg.type() === 'error' && !msg.text().includes('401') && !msg.text().includes('Failed to load resource')) {
      errors.push({ type: 'console', message: msg.text() });
    }
  });

  try {
    // 1. Test Landing Page
    console.log('\\n📱 Testing Landing Page...');
    await page.goto('http://localhost:5173');
    await page.waitForTimeout(3000); // Give it time to load
    
    const heroVisible = await page.locator('h1:has-text("Master AI")').isVisible();
    results.push({ test: 'Landing Page - Hero Section', passed: heroVisible });
    console.log(`   ✅ Hero section: ${heroVisible ? 'PASS' : 'FAIL'}`);

    const ctaButton = await page.locator('text=Start for Free').isVisible();
    results.push({ test: 'Landing Page - CTA Button', passed: ctaButton });
    console.log(`   ✅ CTA button: ${ctaButton ? 'PASS' : 'FAIL'}`);

    // 2. Test Login Page Access
    console.log('\\n🔐 Testing Login Page...');
    if (ctaButton) {
      await page.click('text=Start for Free');
      await page.waitForTimeout(2000);
    } else {
      await page.goto('http://localhost:5173/login');
      await page.waitForTimeout(2000);
    }
    
    const loginFormVisible = await page.locator('text=Welcome to AI/ML Glossary').isVisible();
    results.push({ test: 'Login Page - Form Visible', passed: loginFormVisible });
    console.log(`   ✅ Login form: ${loginFormVisible ? 'PASS' : 'FAIL'}`);

    const testUsersTab = await page.locator('[value="test"]').isVisible();
    results.push({ test: 'Login Page - Test Users Tab', passed: testUsersTab });
    console.log(`   ✅ Test users tab: ${testUsersTab ? 'PASS' : 'FAIL'}`);

    // 3. Test Responsive Design
    console.log('\\n📱 Testing Responsive Design...');
    
    // Test mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForTimeout(1000);
    
    await page.goto('http://localhost:5173');
    await page.waitForTimeout(2000);
    
    const mobileMenuButton = await page.locator('[aria-label*="navigation menu"]').isVisible();
    results.push({ test: 'Mobile - Menu Button Visible', passed: mobileMenuButton });
    console.log(`   ✅ Mobile menu button: ${mobileMenuButton ? 'PASS' : 'FAIL'}`);

    // Test tablet viewport
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.waitForTimeout(1000);
    await page.reload();
    await page.waitForTimeout(2000);
    
    const tabletLayout = await page.locator('h1:has-text("Master AI")').isVisible();
    results.push({ test: 'Tablet - Layout Visible', passed: tabletLayout });
    console.log(`   ✅ Tablet layout: ${tabletLayout ? 'PASS' : 'FAIL'}`);

    // 4. Test SearchBar Component (if present)
    console.log('\\n🔍 Testing Search Functionality...');
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto('http://localhost:5173/login');
    await page.waitForTimeout(2000);
    
    // Check if search is available anywhere
    const searchInput = await page.locator('input[placeholder*="Search"]').isVisible();
    results.push({ test: 'Search - Input Visible', passed: searchInput });
    console.log(`   ✅ Search input: ${searchInput ? 'PASS' : 'FAIL'}`);

    // 5. Test Theme Toggle
    console.log('\\n🎨 Testing Theme Toggle...');
    const themeToggle = await page.locator('button[aria-label*="Switch to"]').isVisible();
    results.push({ test: 'Theme - Toggle Button Visible', passed: themeToggle });
    console.log(`   ✅ Theme toggle: ${themeToggle ? 'PASS' : 'FAIL'}`);

    if (themeToggle) {
      await page.click('button[aria-label*="Switch to"]');
      await page.waitForTimeout(500);
      const darkModeActive = await page.locator('html[class*="dark"]').count() > 0;
      results.push({ test: 'Theme - Dark Mode Toggle', passed: darkModeActive });
      console.log(`   ✅ Dark mode toggle: ${darkModeActive ? 'PASS' : 'FAIL'}`);
    }

    // 6. Test Firebase Login (if working)
    console.log('\\n👤 Testing Firebase Authentication...');
    await page.goto('http://localhost:5173/login');
    await page.waitForTimeout(2000);
    
    if (await page.locator('[value="test"]').isVisible()) {
      try {
        await page.click('[value="test"]');
        await page.waitForTimeout(500);
        
        const testUserButtons = await page.locator('button:has-text("Use This Account")').count();
        results.push({ test: 'Auth - Test Users Available', passed: testUserButtons > 0 });
        console.log(`   ✅ Test users available: ${testUserButtons > 0 ? 'PASS' : 'FAIL'} (${testUserButtons} users)`);
        
        if (testUserButtons > 0) {
          // Try to login with first test user
          await page.click('button:has-text("Use This Account")');
          await page.waitForTimeout(500);
          
          await page.click('[value="login"]');
          await page.waitForTimeout(500);
          
          // Check if login button is enabled
          const loginButton = page.locator('button[type="submit"]:has-text("Sign In")');
          const isEnabled = await loginButton.isEnabled();
          results.push({ test: 'Auth - Login Button Ready', passed: isEnabled });
          console.log(`   ✅ Login button ready: ${isEnabled ? 'PASS' : 'FAIL'}`);
        }
      } catch (authError) {
        errors.push({ type: 'auth', message: authError.message });
        console.log(`   ❌ Auth test failed: ${authError.message}`);
      }
    }

  } catch (error) {
    errors.push({ type: 'critical', message: error.message });
    console.error('❌ Critical error:', error.message);
  } finally {
    await browser.close();
  }

  // Print Summary
  console.log('\\n' + '='.repeat(50));
  console.log('📊 AUDIT SUMMARY');
  console.log('='.repeat(50));
  
  const passed = results.filter(r => r.passed).length;
  const failed = results.filter(r => !r.passed).length;
  
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`🚨 Errors: ${errors.length}`);
  console.log(`📊 Success Rate: ${Math.round((passed / results.length) * 100)}%`);
  
  console.log('\\n📋 DETAILED RESULTS:');
  results.forEach(result => {
    const status = result.passed ? '✅' : '❌';
    console.log(`   ${status} ${result.test}`);
  });
  
  if (errors.length > 0) {
    console.log('\\n🚨 ERRORS:');
    errors.forEach(error => {
      console.log(`   ❌ ${error.type}: ${error.message}`);
    });
  }

  console.log('\\n🎉 Audit completed!');
  
  // Recommendations
  console.log('\\n💡 RECOMMENDATIONS:');
  if (failed > 0) {
    console.log('   - Fix failed test items above');
  }
  if (errors.length > 0) {
    console.log('   - Address console errors and critical issues');
  }
  if (passed === results.length && errors.length === 0) {
    console.log('   - 🎉 Everything looks great! Ready for full testing.');
  }
}

// Run the audit
simpleAudit().catch(console.error);