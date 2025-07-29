#!/usr/bin/env npx tsx
/**
 * Quick comprehensive visual audit for the application
 */

import { chromium } from 'playwright';

async function quickVisualAudit() {
  console.log('🔍 Starting Quick Visual Audit...\n');

  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  try {
    // Test homepage
    console.log('🏠 Testing Homepage...');
    await page.goto('http://localhost:5173/', { timeout: 10000 });
    await page.waitForSelector('h1', { timeout: 5000 });
    await page.screenshot({ path: 'audit-homepage.png', fullPage: true });
    console.log('✅ Homepage test complete');

    // Dismiss cookie banner if present
    const cookieAccept = page.locator('button:has-text("Accept All")');
    if (await cookieAccept.isVisible()) {
      await cookieAccept.click();
      await page.waitForTimeout(500);
    }

    // Test term page with hierarchical navigation
    console.log('📄 Testing Term Page...');
    await page.goto('http://localhost:5173/term/8b5bff9a-afb7-4691-a58e-adc2bf94f941', {
      timeout: 10000,
    });
    await page.waitForSelector('h1', { timeout: 5000 });

    // Check for hierarchical navigation
    const contentNav = await page.locator('h2:has-text("Content Navigation")').count();
    console.log(`📋 Content Navigation: ${contentNav > 0 ? '✅ Found' : '❌ Not found'}`);

    await page.screenshot({ path: 'audit-term-page.png', fullPage: true });
    console.log('✅ Term page test complete');

    // Test search functionality
    console.log('🔍 Testing Search...');
    const searchInput = page.locator('input[type="text"]').first();
    if (await searchInput.isVisible()) {
      await searchInput.fill('machine learning');
      await page.keyboard.press('Enter');
      await page.waitForTimeout(2000);
      await page.screenshot({ path: 'audit-search.png', fullPage: true });
      console.log('✅ Search test complete');
    }

    // Test category page
    console.log('📂 Testing Category Page...');
    await page.goto('http://localhost:5173/category/79f3d163-dae1-499d-8371-047accbe70e9', {
      timeout: 10000,
    });
    await page.waitForSelector('h1', { timeout: 5000 });
    await page.screenshot({ path: 'audit-category.png', fullPage: true });
    console.log('✅ Category page test complete');

    console.log('\n🎉 Quick Visual Audit Complete!');
    console.log('📸 Screenshots generated:');
    console.log('  - audit-homepage.png');
    console.log('  - audit-term-page.png');
    console.log('  - audit-search.png');
    console.log('  - audit-category.png');
  } catch (error) {
    console.error('❌ Audit failed:', error);
  } finally {
    await browser.close();
  }
}

quickVisualAudit().catch(console.error);
