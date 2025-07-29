#!/usr/bin/env npx tsx
/**
 * Quick test to verify hierarchical navigation integration
 */

import { chromium } from 'playwright';

async function quickTest() {
  console.log('🔍 Quick Hierarchical Navigation Test...\n');

  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  try {
    // Navigate to term page
    console.log('📄 Navigating to term page...');
    await page.goto('http://localhost:5173/term/8b5bff9a-afb7-4691-a58e-adc2bf94f941', {
      waitUntil: 'domcontentloaded',
      timeout: 15000,
    });

    // Wait for basic content
    await page.waitForSelector('h1', { timeout: 10000 });
    console.log('✅ Page loaded with heading');

    // Take screenshot
    await page.screenshot({
      path: 'hierarchical-nav-test.png',
      fullPage: true,
    });
    console.log('📸 Screenshot taken: hierarchical-nav-test.png');

    // Check for hierarchical navigation
    const hasContentNavigation =
      (await page.locator('h2:has-text("Content Navigation")').count()) > 0;
    console.log(
      `📋 Content Navigation section: ${hasContentNavigation ? '✅ Found' : '❌ Not found'}`
    );

    // Check for hierarchical navigator component
    const hasNavigatorCard = (await page.locator('[data-testid="card"]').count()) > 0;
    console.log(
      `🗂️ Hierarchical Navigator component: ${hasNavigatorCard ? '✅ Found' : '❌ Not found'}`
    );

    // Check for search input
    const hasSearchInput = (await page.locator('input[placeholder*="Search"]').count()) > 0;
    console.log(`🔍 Search input: ${hasSearchInput ? '✅ Found' : '❌ Not found'}`);

    // Check for Tree/Flat buttons
    const hasTreeButton = (await page.locator('button:has-text("Tree")').count()) > 0;
    const hasFlatButton = (await page.locator('button:has-text("Flat")').count()) > 0;
    console.log(
      `🌳 Tree/Flat toggle: ${hasTreeButton || hasFlatButton ? '✅ Found' : '❌ Not found'}`
    );

    // Try to interact with search if available
    if (hasSearchInput) {
      console.log('🔍 Testing search functionality...');
      const searchInput = page.locator('input[placeholder*="Search"]').first();
      await searchInput.fill('neural');
      await page.waitForTimeout(2000);

      await page.screenshot({
        path: 'hierarchical-nav-search-test.png',
        fullPage: true,
      });
      console.log('📸 Search test screenshot: hierarchical-nav-search-test.png');
    }

    // Check for sections tab and click it
    const sectionsTab = page.locator('tab:has-text("Sections"), button:has-text("Sections")');
    const hasSectionsTab = (await sectionsTab.count()) > 0;
    console.log(`📑 Sections tab: ${hasSectionsTab ? '✅ Found' : '❌ Not found'}`);

    if (hasSectionsTab) {
      console.log('📑 Clicking sections tab...');
      await sectionsTab.first().click();
      await page.waitForTimeout(2000);

      await page.screenshot({
        path: 'hierarchical-nav-sections-tab.png',
        fullPage: true,
      });
      console.log('📸 Sections tab screenshot: hierarchical-nav-sections-tab.png');

      // Check if hierarchical navigation appears in sections tab
      const hasNavInSections = (await page.locator('[data-testid="card"]').count()) > 0;
      console.log(
        `🗂️ Navigation in sections tab: ${hasNavInSections ? '✅ Found' : '❌ Not found'}`
      );
    }

    console.log('\n🎉 Quick test completed!');
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await browser.close();
  }
}

quickTest().catch(console.error);
