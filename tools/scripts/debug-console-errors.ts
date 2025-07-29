#!/usr/bin/env npx tsx
/**
 * Debug browser console errors for hierarchical navigation
 */

import { chromium } from 'playwright';

async function debugConsoleErrors() {
  console.log('🔍 Debugging Console Errors...\n');

  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  // Listen for console messages
  page.on('console', msg => {
    console.log(`[CONSOLE ${msg.type()}]:`, msg.text());
  });

  // Listen for page errors
  page.on('pageerror', error => {
    console.log(`[PAGE ERROR]:`, error.message);
  });

  try {
    // Navigate to term page
    console.log('📄 Navigating to term page...');
    await page.goto('http://localhost:5173/term/8b5bff9a-afb7-4691-a58e-adc2bf94f941', {
      waitUntil: 'domcontentloaded',
      timeout: 15000,
    });

    // Wait for page to fully load
    await page.waitForSelector('h1', { timeout: 10000 });
    console.log('✅ Page loaded');

    // Dismiss cookies
    const cookieAccept = page.locator('button:has-text("Accept All")');
    if (await cookieAccept.isVisible()) {
      await cookieAccept.click();
      await page.waitForTimeout(1000);
    }

    // Wait a bit more to see if hierarchical navigation appears
    await page.waitForTimeout(3000);

    // Check DOM manually
    const contentNavigation = await page.evaluate(() => {
      const headings = Array.from(document.querySelectorAll('h2'));
      return headings.map(h => h.textContent).filter(text => text?.includes('Content Navigation'));
    });

    console.log('📋 Content Navigation headings found:', contentNavigation);

    // Check if HierarchicalNavigator component is in DOM
    const hierarchicalNav = await page.evaluate(() => {
      // Look for various elements that might indicate the hierarchical navigator
      const cards = document.querySelectorAll('[data-testid="card"]');
      const searchInputs = document.querySelectorAll('input[placeholder*="Search"]');
      const navSections = document.querySelectorAll('h2');

      return {
        cards: cards.length,
        searchInputs: searchInputs.length,
        allH2s: Array.from(navSections).map(h => h.textContent),
      };
    });

    console.log('🗂️ DOM elements found:', hierarchicalNav);

    // Take screenshot showing current state
    await page.screenshot({
      path: 'debug-console-errors.png',
      fullPage: true,
    });
    console.log('📸 Screenshot: debug-console-errors.png');

    console.log('\n🎉 Debug complete');
  } catch (error) {
    console.error('❌ Debug failed:', error);
  } finally {
    await browser.close();
  }
}

debugConsoleErrors().catch(console.error);
