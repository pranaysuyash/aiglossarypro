#!/usr/bin/env tsx

import { chromium } from 'playwright';

async function debugSelectors() {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  try {
    console.log('🔍 Debugging Login Page Selectors...');

    // Listen for console errors
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        console.log('❌ Console Error:', msg.text());
      }
    });

    await page.goto('http://localhost:5173/login', {
      waitUntil: 'networkidle',
      timeout: 30000,
    });

    console.log('⏳ Waiting for React app to load...');
    await page.waitForTimeout(5000); // Wait longer for React to render

    // Wait for any content to appear
    try {
      await page.waitForSelector('body *', { timeout: 10000 });
      console.log('✅ Content loaded');
    } catch (_e) {
      console.log('⚠️ No content appeared');
    }

    // Get all input elements
    const inputs = await page.$$eval('input', (elements) =>
      elements.map((el) => ({
        type: el.type,
        name: el.name,
        id: el.id,
        placeholder: el.placeholder,
        className: el.className,
      }))
    );

    console.log('📝 Found inputs:', inputs);

    // Get all button elements
    const buttons = await page.$$eval('button', (elements) =>
      elements.map((el) => ({
        type: el.type,
        textContent: el.textContent?.trim(),
        className: el.className,
        id: el.id,
      }))
    );

    console.log('🔘 Found buttons:', buttons);

    // Check for forms
    const forms = await page.$$eval('form', (elements) =>
      elements.map((el) => ({
        action: el.action,
        method: el.method,
        className: el.className,
        id: el.id,
      }))
    );

    console.log('📋 Found forms:', forms);

    // Take a screenshot
    await page.screenshot({ path: './debug-login-page.png', fullPage: true });
    console.log('📸 Screenshot saved as debug-login-page.png');

    console.log('\n🔍 Now checking Terms page for search...');

    await page.goto('http://localhost:5173/terms', {
      waitUntil: 'domcontentloaded',
      timeout: 15000,
    });

    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(2000);

    // Get all search-related elements
    const searchElements = await page.$$eval('input', (elements) =>
      elements
        .filter(
          (el) =>
            el.type === 'search' ||
            el.placeholder?.toLowerCase().includes('search') ||
            el.name?.toLowerCase().includes('search')
        )
        .map((el) => ({
          type: el.type,
          name: el.name,
          id: el.id,
          placeholder: el.placeholder,
          className: el.className,
        }))
    );

    console.log('🔍 Found search elements:', searchElements);

    await page.screenshot({ path: './debug-terms-page.png', fullPage: true });
    console.log('📸 Screenshot saved as debug-terms-page.png');
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await browser.close();
  }
}

debugSelectors().catch(console.error);
