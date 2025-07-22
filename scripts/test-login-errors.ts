#!/usr/bin/env tsx

import { chromium } from 'playwright';
import chalk from 'chalk';

async function testLoginErrors() {
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 500
  });
  
  const page = await browser.newPage();
  
  // Capture console errors
  const errors: string[] = [];
  page.on('console', msg => {
    if (msg.type() === 'error') {
      const text = msg.text();
      errors.push(text);
      console.log(chalk.red(`[ERROR] ${text}`));
    }
  });
  
  page.on('pageerror', error => {
    errors.push(error.message);
    console.log(chalk.red(`[PAGE ERROR] ${error.message}`));
  });
  
  // Monitor network errors
  page.on('response', response => {
    const url = response.url();
    const status = response.status();
    if (status >= 400) {
      console.log(chalk.yellow(`[${status}] ${url}`));
    }
  });
  
  try {
    console.log(chalk.blue('1. Navigating to login page...'));
    await page.goto('http://localhost:5173/login');
    await page.waitForTimeout(5000);
    
    console.log(chalk.blue('\n2. Checking for critical errors...'));
    
    // Check for specific errors
    const criticalErrors = errors.filter(err => 
      err.includes('handleAuthChange is not defined') ||
      err.includes('Cannot read properties of undefined') ||
      err.includes('404') && err.includes('early-bird') ||
      err.includes('500') && err.includes('location')
    );
    
    if (criticalErrors.length > 0) {
      console.log(chalk.red('\n❌ Critical errors found:'));
      criticalErrors.forEach(err => console.log(chalk.red(`  - ${err}`)));
    } else {
      console.log(chalk.green('\n✅ No critical errors found!'));
    }
    
    console.log(chalk.blue('\n3. Testing login form...'));
    
    // Check if login form is present
    const emailInput = await page.$('#email');
    const passwordInput = await page.$('input[type="password"]');
    const submitButton = await page.$('button[type="submit"]');
    
    if (emailInput && passwordInput && submitButton) {
      console.log(chalk.green('✅ Login form elements found'));
      
      // Try to fill the form
      await emailInput.fill('admin@aiglossarypro.com');
      await passwordInput.fill('adminpass123');
      console.log(chalk.green('✅ Form filled successfully'));
      
      // Click submit
      await submitButton.click();
      await page.waitForTimeout(5000);
      
      const currentUrl = page.url();
      console.log(chalk.cyan(`\n📍 Current URL after login: ${currentUrl}`));
      
      if (currentUrl.includes('/admin')) {
        console.log(chalk.green('✅ Successfully redirected to admin panel!'));
      }
    } else {
      console.log(chalk.red('❌ Login form elements not found'));
    }
    
    console.log(chalk.blue('\n4. Summary:'));
    console.log(`Total console errors: ${errors.length}`);
    console.log(`Critical errors: ${criticalErrors.length}`);
    
  } catch (error) {
    console.error(chalk.red('Test error:'), error);
  } finally {
    console.log(chalk.yellow('\nClosing in 5 seconds...'));
    await page.waitForTimeout(5000);
    await browser.close();
  }
}

testLoginErrors().catch(console.error);