#!/usr/bin/env node

import { chromium } from 'playwright';

async function debugCSS() {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  console.log('🔍 Debugging CSS and rendering...');

  // Listen for all requests
  page.on('request', (request) => {
    console.log(`→ ${request.method()} ${request.url()}`);
  });

  // Listen for failed requests
  page.on('requestfailed', (request) => {
    console.error(
      `❌ Failed: ${request.method()} ${request.url()} - ${request.failure()?.errorText}`
    );
  });

  // Listen for console errors
  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      console.error(`🚨 Console Error: ${msg.text()}`);
    }
  });

  try {
    await page.goto('http://localhost:5173/', {
      waitUntil: 'networkidle',
      timeout: 15000,
    });

    console.log('✅ Page loaded');

    // Wait for React to fully render
    await page.waitForTimeout(3000);

    // Check if CSS is loaded
    const styles = await page.$$eval('link[rel="stylesheet"], style', (elements) =>
      elements.map((el) => ({
        type: el.tagName,
        href: el.href || 'inline',
        loaded: el.sheet !== null,
      }))
    );

    console.log('📝 CSS Status:', styles);

    // Check computed styles
    const bodyStyles = await page.evaluate(() => {
      const body = document.body;
      const computed = window.getComputedStyle(body);
      return {
        display: computed.display,
        backgroundColor: computed.backgroundColor,
        color: computed.color,
        fontFamily: computed.fontFamily,
      };
    });

    console.log('🎨 Body styles:', bodyStyles);

    // Check for clipboard icons specifically
    const clipboardElements = await page.$$eval(
      '*',
      (elements) =>
        elements.filter(
          (el) =>
            el.textContent?.includes('📋') ||
            el.innerHTML?.includes('clipboard') ||
            el.className?.includes('clipboard')
        ).length
    );

    console.log(`📋 Clipboard elements found: ${clipboardElements}`);

    // Take screenshot
    await page.screenshot({ path: './debug-css-render.png', fullPage: true });
    console.log('📸 Screenshot saved as debug-css-render.png');

    // Get page text content
    const textContent = await page.textContent('body');
    console.log('📄 First 200 chars of content:', textContent?.substring(0, 200));
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await browser.close();
  }
}

debugCSS().catch(console.error);
