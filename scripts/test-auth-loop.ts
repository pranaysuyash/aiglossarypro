#!/usr/bin/env tsx

import { chromium } from 'playwright';
import chalk from 'chalk';

async function testAuthLoop() {
  const browser = await chromium.launch({ 
    headless: false,
    devtools: true
  });
  
  const page = await browser.newPage();
  
  // Track API calls
  let authCallCount = 0;
  const authCalls: {time: number, status: number}[] = [];
  
  page.on('response', response => {
    const url = response.url();
    if (url.includes('/api/auth/user')) {
      authCallCount++;
      authCalls.push({
        time: Date.now(),
        status: response.status()
      });
      console.log(chalk.yellow(`[AUTH CALL #${authCallCount}] ${response.status()} - ${url}`));
      
      // Detect rapid loops
      const recentCalls = authCalls.filter(call => Date.now() - call.time < 5000);
      if (recentCalls.length > 10) {
        console.log(chalk.red(`\n🚨 AUTHENTICATION LOOP DETECTED! ${recentCalls.length} calls in last 5 seconds`));
      }
    }
  });
  
  // Monitor console errors
  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.log(chalk.red(`[CONSOLE ERROR] ${msg.text()}`));
    }
  });
  
  try {
    console.log(chalk.blue('Testing authentication loop on login page...'));
    console.log(chalk.cyan('Frontend URL: http://localhost:5173'));
    
    // Navigate to login
    await page.goto('http://localhost:5173/login', {
      waitUntil: 'networkidle'
    });
    
    console.log(chalk.green('✅ Login page loaded'));
    
    // Wait to observe any loops
    console.log(chalk.blue('\nMonitoring for authentication loops for 10 seconds...'));
    await page.waitForTimeout(10000);
    
    // Report findings
    console.log(chalk.blue('\n📊 Authentication Call Summary:'));
    console.log(`Total /api/auth/user calls: ${authCallCount}`);
    
    if (authCallCount === 0) {
      console.log(chalk.green('✅ No authentication calls detected (expected for unauthenticated login page)'));
    } else if (authCallCount <= 3) {
      console.log(chalk.green(`✅ Normal authentication check count: ${authCallCount}`));
    } else {
      console.log(chalk.red(`❌ Excessive authentication calls: ${authCallCount}`));
    }
    
    // Test login to see if loop occurs after authentication
    console.log(chalk.blue('\nTesting login flow...'));
    
    // Reset counters
    authCallCount = 0;
    authCalls.length = 0;
    
    // Fill login form
    await page.fill('#email', 'admin@aiglossarypro.com');
    await page.fill('input[type="password"]', 'adminpass123');
    
    // Click login
    await page.click('button[type="submit"]');
    
    // Wait for navigation or error
    await Promise.race([
      page.waitForURL('**/admin', { timeout: 10000 }),
      page.waitForURL('**/dashboard', { timeout: 10000 }),
      page.waitForTimeout(10000)
    ]).catch(() => {});
    
    console.log(chalk.blue('\n📊 Post-Login Authentication Summary:'));
    console.log(`Total /api/auth/user calls after login: ${authCallCount}`);
    
    const currentUrl = page.url();
    console.log(`Current URL: ${currentUrl}`);
    
    if (currentUrl.includes('/admin') || currentUrl.includes('/dashboard')) {
      console.log(chalk.green('✅ Successfully logged in and redirected'));
    } else {
      console.log(chalk.yellow('⚠️ Still on login page after 10 seconds'));
    }
    
  } catch (error) {
    console.error(chalk.red('Test error:'), error);
  } finally {
    console.log(chalk.yellow('\nClosing browser in 5 seconds...'));
    await page.waitForTimeout(5000);
    await browser.close();
  }
}

testAuthLoop().catch(console.error);