#!/usr/bin/env tsx

import { chromium } from 'playwright';
import chalk from 'chalk';

async function visualAuthTest() {
  const browser = await chromium.launch({ 
    headless: false,
  });
  
  const page = await browser.newPage();
  
  // Track auth requests
  let authRequestCount = 0;
  const requestTimestamps: number[] = [];
  
  page.on('request', request => {
    if (request.url().includes('/api/auth/user')) {
      authRequestCount++;
      requestTimestamps.push(Date.now());
      console.log(chalk.yellow(`[REQUEST #${authRequestCount}] ${request.method()} ${request.url()}`));
    }
  });
  
  page.on('response', response => {
    if (response.url().includes('/api/auth/user')) {
      console.log(chalk.cyan(`[RESPONSE] Status: ${response.status()}`));
    }
  });
  
  // Capture console logs
  page.on('console', msg => {
    const text = msg.text();
    if (text.includes('🚫') || text.includes('Circuit breaker') || text.includes('Auth query')) {
      console.log(chalk.green(`[CONSOLE] ${text}`));
    }
  });
  
  page.on('pageerror', error => {
    console.log(chalk.red(`[PAGE ERROR] ${error.message}`));
  });
  
  try {
    console.log(chalk.blue('\n🌐 Opening http://localhost:5173/login'));
    
    await page.goto('http://localhost:5173/login', {
      waitUntil: 'networkidle'
    });
    
    console.log(chalk.green('✅ Page loaded\n'));
    
    // Wait 10 seconds to observe behavior
    await page.waitForTimeout(10000);
    
    // Analysis
    console.log(chalk.blue('\n📊 Analysis:'));
    console.log(`Total auth requests: ${authRequestCount}`);
    
    if (authRequestCount > 0) {
      const timeSpan = requestTimestamps[requestTimestamps.length - 1] - requestTimestamps[0];
      console.log(`Time span: ${timeSpan}ms`);
      console.log(`Average interval: ${timeSpan / (authRequestCount - 1)}ms`);
    }
    
    if (authRequestCount > 3) {
      console.log(chalk.red('\n❌ Excessive auth requests detected!'));
    } else if (authRequestCount === 0) {
      console.log(chalk.green('\n✅ No auth requests made (good for login page)'));
    } else {
      console.log(chalk.green('\n✅ Normal auth request count'));
    }
    
    // Take screenshot
    await page.screenshot({ path: '/tmp/auth-test-screenshot.png' });
    console.log(chalk.gray('\nScreenshot saved to /tmp/auth-test-screenshot.png'));
    
    console.log(chalk.yellow('\nClosing in 5 seconds...'));
    await page.waitForTimeout(5000);
    
  } catch (error) {
    console.error(chalk.red('Error:'), error);
  } finally {
    await browser.close();
  }
}

visualAuthTest().catch(console.error);