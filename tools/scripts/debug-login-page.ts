#!/usr/bin/env tsx

import { chromium } from 'playwright';
import chalk from 'chalk';

async function debugLoginPage() {
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 500
  });
  
  const page = await browser.newPage();
  
  // Listen for console messages
  page.on('console', msg => {
    const type = msg.type();
    const text = msg.text();
    if (type === 'error') {
      console.log(chalk.red(`[CONSOLE ERROR] ${text}`));
    } else if (type === 'warning') {
      console.log(chalk.yellow(`[CONSOLE WARN] ${text}`));
    }
  });
  
  // Listen for page errors
  page.on('pageerror', error => {
    console.log(chalk.red(`[PAGE ERROR] ${error.message}`));
  });
  
  try {
    console.log(chalk.blue('1. Navigating to login page...'));
    await page.goto('http://localhost:5173/login', { waitUntil: 'networkidle' });
    
    console.log(chalk.blue('\n2. Waiting for React to mount...'));
    await page.waitForTimeout(5000);
    
    // Check React DevTools
    const hasReact = await page.evaluate(() => {
      return !!(window as any).React || !!(window as any).__REACT_DEVTOOLS_GLOBAL_HOOK__;
    });
    console.log('React detected:', hasReact);
    
    // Check for #root element
    const rootElement = await page.$('#root');
    console.log('Root element found:', !!rootElement);
    
    if (rootElement) {
      const rootContent = await rootElement.evaluate(el => el.innerHTML.substring(0, 200));
      console.log('Root content preview:', rootContent);
    }
    
    console.log(chalk.blue('\n3. Looking for login form elements...'));
    
    // Check for tabs (sign in / register)
    const tabs = await page.$$('[role="tablist"] button');
    console.log('Tabs found:', tabs.length);
    
    // Check all inputs
    const allInputs = await page.$$('input');
    console.log('Total inputs found:', allInputs.length);
    
    for (let i = 0; i < allInputs.length; i++) {
      const input = allInputs[i];
      const type = await input.getAttribute('type');
      const id = await input.getAttribute('id');
      const name = await input.getAttribute('name');
      const placeholder = await input.getAttribute('placeholder');
      console.log(`\nInput ${i + 1}:`);
      console.log('  - Type:', type);
      console.log('  - ID:', id);
      console.log('  - Name:', name);
      console.log('  - Placeholder:', placeholder);
    }
    
    // Try to find email input with JavaScript
    const emailInputExists = await page.evaluate(() => {
      const selectors = ['#email', 'input[type="email"]', 'input[id="email"]'];
      for (const selector of selectors) {
        const el = document.querySelector(selector);
        if (el) return { found: true, selector };
      }
      return { found: false };
    });
    console.log('\nEmail input search result:', emailInputExists);
    
    // Check for any error messages
    const errorElements = await page.$$('.error, .alert, [role="alert"]');
    console.log('\nError elements found:', errorElements.length);
    
    // Take screenshot
    await page.screenshot({ path: 'debug-login-page.png', fullPage: true });
    console.log(chalk.green('\n✓ Screenshot saved: debug-login-page.png'));
    
  } catch (error) {
    console.error(chalk.red('Error:'), error);
  } finally {
    console.log(chalk.yellow('\nKeeping browser open for inspection...'));
    await page.waitForTimeout(30000);
    await browser.close();
  }
}

debugLoginPage().catch(console.error);