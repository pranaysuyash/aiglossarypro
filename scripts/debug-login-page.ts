#!/usr/bin/env tsx

/**
 * Debug Login Page - Simple test to understand the login page structure
 */

import chalk from 'chalk';
import { chromium } from 'playwright';

async function debugLoginPage() {
  console.log(chalk.blue('🔍 Debugging Login Page Structure...'));
  
  const browser = await chromium.launch({
    headless: false,
    devtools: true,
    slowMo: 1000,
  });
  
  const page = await browser.newPage();
  
  try {
    // Navigate to login
    console.log(chalk.cyan('📍 Navigating to login page...'));
    await page.goto('http://localhost:5173/login');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(3000);
    
    // Take screenshot
    await page.screenshot({ path: 'debug-login-page.png', fullPage: true });
    console.log(chalk.green('📸 Screenshot saved: debug-login-page.png'));
    
    // Debug: Check what elements are actually on the page
    console.log(chalk.cyan('📍 Checking page elements...'));
    
    // Check if we can find tabs
    const tabs = await page.locator('[role="tab"]').count();
    console.log(chalk.gray(`Found ${tabs} tabs`));
    
    // Check for Test Users tab specifically
    const testUsersTab = await page.locator('text="Test Users"').isVisible();
    console.log(chalk.gray(`Test Users tab visible: ${testUsersTab}`));
    
    // Check for Sign In tab
    const signInTab = await page.locator('text="Sign In"').isVisible();
    console.log(chalk.gray(`Sign In tab visible: ${signInTab}`));
    
    // Check for email input
    const emailInputs = await page.locator('input[type="email"]').count();
    console.log(chalk.gray(`Email inputs found: ${emailInputs}`));
    
    // Check for password input
    const passwordInputs = await page.locator('input[type="password"]').count();
    console.log(chalk.gray(`Password inputs found: ${passwordInputs}`));
    
    // Check for submit button
    const submitButtons = await page.locator('button[type="submit"]').count();
    console.log(chalk.gray(`Submit buttons found: ${submitButtons}`));
    
    // Check for OAuth buttons
    const googleButton = await page.locator('text="Continue with Google"').isVisible();
    const githubButton = await page.locator('text="Continue with GitHub"').isVisible();
    console.log(chalk.gray(`Google OAuth button visible: ${googleButton}`));
    console.log(chalk.gray(`GitHub OAuth button visible: ${githubButton}`));
    
    // Get page title
    const title = await page.title();
    console.log(chalk.gray(`Page title: ${title}`));
    
    // Get current URL
    const url = page.url();
    console.log(chalk.gray(`Current URL: ${url}`));
    
    // Check for any error messages
    const errorElements = await page.locator('[role="alert"]').count();
    console.log(chalk.gray(`Error elements found: ${errorElements}`));
    
    // If in development mode, try to click Test Users tab
    if (testUsersTab) {
      console.log(chalk.cyan('📍 Clicking Test Users tab...'));
      await page.click('text="Test Users"');
      await page.waitForTimeout(2000);
      
      // Check for "Use This Account" buttons
      const useAccountButtons = await page.locator('text="Use This Account"').count();
      console.log(chalk.gray(`"Use This Account" buttons found: ${useAccountButtons}`));
      
      if (useAccountButtons > 0) {
        console.log(chalk.cyan('📍 Clicking first "Use This Account" button...'));
        await page.click('text="Use This Account"');
        await page.waitForTimeout(2000);
        
        // Check if fields got populated
        const emailValue = await page.inputValue('input[type="email"]').catch(() => '');
        const passwordValue = await page.inputValue('input[type="password"]').catch(() => '');
        
        console.log(chalk.gray(`Email field value: ${emailValue}`));
        console.log(chalk.gray(`Password field filled: ${passwordValue ? 'Yes' : 'No'}`));
      }
    }
    
    // Keep browser open for manual inspection
    console.log(chalk.blue('🔍 Browser will remain open for manual inspection...'));
    console.log(chalk.gray('Press Ctrl+C to close'));
    
    // Wait indefinitely
    await new Promise(() => {});
    
  } catch (error) {
    console.error(chalk.red('❌ Error:'), error);
  } finally {
    await browser.close();
  }
}

debugLoginPage().catch(console.error);