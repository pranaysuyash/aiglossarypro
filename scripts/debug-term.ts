#!/usr/bin/env npx tsx
/**
 * Debug script to check term data and hierarchical navigation display
 */

import { chromium } from 'playwright';

async function debugTerm() {
  console.log('🔍 Debug Term and Navigation...\n');

  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  try {
    // Navigate to term page
    console.log('📄 Navigating to term page...');
    await page.goto('http://localhost:5173/term/8b5bff9a-afb7-4691-a58e-adc2bf94f941', {
      waitUntil: 'domcontentloaded',
      timeout: 15000,
    });

    // Wait for heading to appear
    await page.waitForSelector('h1', { timeout: 10000 });
    console.log('✅ Page loaded');

    // Dismiss cookie overlay if it exists
    const cookieAccept = page.locator('button:has-text("Accept All")');
    if (await cookieAccept.isVisible()) {
      await cookieAccept.click();
      await page.waitForTimeout(1000);
      console.log('🍪 Dismissed cookie overlay');
    }

    // Check for preview status in page content
    const pageContent = await page.content();
    const hasPreviewMarker = pageContent.includes('isPreview') || pageContent.includes('preview');
    console.log(`🔍 Preview marker in content: ${hasPreviewMarker}`);

    // Check current URL
    const currentUrl = page.url();
    console.log(`🔗 Current URL: ${currentUrl}`);

    // Check for Content Navigation heading
    const contentNavHeading = page.locator('h2:has-text("Content Navigation")');
    const hasContentNav = (await contentNavHeading.count()) > 0;
    console.log(`📋 Content Navigation heading: ${hasContentNav ? '✅ Found' : '❌ Not found'}`);

    // Check for HierarchicalNavigator
    const hierarchicalNav = page.locator('[data-testid="card"]');
    const hasHierarchicalNav = (await hierarchicalNav.count()) > 0;
    console.log(`🗂️ Hierarchical Navigator: ${hasHierarchicalNav ? '✅ Found' : '❌ Not found'}`);

    // Take full page screenshot
    await page.screenshot({
      path: 'debug-term-full.png',
      fullPage: true,
    });
    console.log('📸 Full page screenshot: debug-term-full.png');

    // Try to find any element with "preview" text
    const previewElements = page.locator('*:has-text("preview")');
    const previewCount = await previewElements.count();
    console.log(`🔍 Elements containing "preview": ${previewCount}`);

    // Check page source for term data
    console.log('\n🔍 Checking page source for term data...');
    const scripts = await page.locator('script').allInnerTexts();
    const hasTermData = scripts.some(
      script => script.includes('isPreview') || script.includes('"preview"')
    );
    console.log(`📜 Term data in scripts: ${hasTermData ? '✅ Found' : '❌ Not found'}`);

    // Wait a bit more and check again
    await page.waitForTimeout(3000);
    const contentNavAfterWait =
      (await page.locator('h2:has-text("Content Navigation")').count()) > 0;
    console.log(
      `📋 Content Navigation after wait: ${contentNavAfterWait ? '✅ Found' : '❌ Not found'}`
    );

    // Get all h2 headings to see what's actually there
    const h2Headings = await page.locator('h2').allInnerTexts();
    console.log(`📝 All H2 headings found: ${JSON.stringify(h2Headings)}`);
  } catch (error) {
    console.error('❌ Debug failed:', error);
  } finally {
    await browser.close();
  }
}

debugTerm().catch(console.error);
