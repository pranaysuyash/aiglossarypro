#!/usr/bin/env tsx

import { chromium } from 'playwright';
import chalk from 'chalk';
import fs from 'fs/promises';
import path from 'path';

// Create screenshots directory
const screenshotsDir = path.join(process.cwd(), 'admin-flow-screenshots');
await fs.mkdir(screenshotsDir, { recursive: true });

async function simpleAdminFlow() {
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 1000
  });
  
  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 }
  });
  
  const page = await context.newPage();
  
  // Ignore 401 errors from API calls
  page.on('response', response => {
    if (response.status() === 401 && response.url().includes('/api/')) {
      console.log(chalk.gray(`  [401] ${response.url().replace('http://localhost:3001', '')}`));
    }
  });
  
  try {
    console.log(chalk.bold.cyan('🎬 Starting Simple Admin Flow Test\n'));
    
    // 1. Go directly to login page
    console.log(chalk.blue('1️⃣ Navigating directly to login page...'));
    await page.goto('http://localhost:5173/login', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(3000);
    
    // Handle cookie consent if present
    const cookieButton = await page.$('button:has-text("Accept")');
    if (cookieButton) {
      await cookieButton.click();
      console.log(chalk.green('  ✓ Accepted cookie consent'));
      await page.waitForTimeout(1000);
    }
    
    await page.screenshot({ path: path.join(screenshotsDir, '01-login-page.png') });
    console.log(chalk.gray('  📸 Screenshot: 01-login-page.png'));
    
    // 2. Wait for and fill login form
    console.log(chalk.blue('\n2️⃣ Filling admin credentials...'));
    
    // Wait for the email input to be visible
    try {
      await page.waitForSelector('#email', { state: 'visible', timeout: 10000 });
      console.log(chalk.green('  ✓ Email input found'));
      
      await page.fill('#email', 'admin@aiglossarypro.com');
      console.log(chalk.green('  ✓ Email filled'));
      
      // Fill password
      await page.fill('input[type="password"]', 'adminpass123');
      console.log(chalk.green('  ✓ Password filled'));
      
      await page.screenshot({ path: path.join(screenshotsDir, '02-credentials-filled.png') });
      console.log(chalk.gray('  📸 Screenshot: 02-credentials-filled.png'));
      
      // Submit form
      console.log(chalk.blue('\n3️⃣ Submitting login form...'));
      await page.click('button[type="submit"]');
      
      // Wait for navigation
      await page.waitForTimeout(5000);
      
      const currentUrl = page.url();
      console.log(chalk.cyan(`  📍 Current URL: ${currentUrl}`));
      
      await page.screenshot({ path: path.join(screenshotsDir, '03-after-login.png') });
      console.log(chalk.gray('  📸 Screenshot: 03-after-login.png'));
      
      // Check if logged in
      if (currentUrl.includes('/admin')) {
        console.log(chalk.green('  ✅ Successfully redirected to admin panel!'));
      } else if (currentUrl.includes('/dashboard')) {
        console.log(chalk.green('  ✅ Logged in, redirected to dashboard'));
        
        // Try to navigate to admin
        console.log(chalk.blue('\n4️⃣ Navigating to admin panel...'));
        await page.goto('http://localhost:5173/admin');
        await page.waitForTimeout(3000);
        await page.screenshot({ path: path.join(screenshotsDir, '04-admin-panel.png') });
        console.log(chalk.gray('  📸 Screenshot: 04-admin-panel.png'));
      }
      
      // 5. Test logout
      console.log(chalk.blue('\n5️⃣ Testing logout...'));
      
      // Look for user menu
      const userMenu = await page.$('button:has-text("admin@"), [aria-label*="user"]');
      if (userMenu) {
        await userMenu.click();
        console.log(chalk.green('  ✓ Opened user menu'));
        await page.waitForTimeout(1000);
      }
      
      // Click logout
      const logoutButton = await page.$('button:has-text("Sign Out"), button:has-text("Logout")');
      if (logoutButton) {
        await logoutButton.click();
        console.log(chalk.green('  ✓ Clicked logout'));
        await page.waitForTimeout(3000);
        
        const urlAfterLogout = page.url();
        console.log(chalk.cyan(`  📍 URL after logout: ${urlAfterLogout}`));
        await page.screenshot({ path: path.join(screenshotsDir, '05-after-logout.png') });
        console.log(chalk.gray('  📸 Screenshot: 05-after-logout.png'));
      }
      
      // 6. Login as free user
      console.log(chalk.blue('\n6️⃣ Testing free user login...'));
      
      // Navigate to login if not already there
      if (!page.url().includes('/login')) {
        await page.goto('http://localhost:5173/login');
        await page.waitForTimeout(3000);
      }
      
      // Fill free user credentials
      await page.fill('#email', 'free@aiglossarypro.com');
      await page.fill('input[type="password"]', 'freepass123');
      console.log(chalk.green('  ✓ Free user credentials filled'));
      
      await page.click('button[type="submit"]');
      await page.waitForTimeout(5000);
      
      await page.screenshot({ path: path.join(screenshotsDir, '06-free-user-logged-in.png') });
      console.log(chalk.gray('  📸 Screenshot: 06-free-user-logged-in.png'));
      
      // Check for daily views
      const pageText = await page.textContent('body');
      if (pageText?.includes('50') && pageText?.includes('daily')) {
        console.log(chalk.green('  ✅ Free user daily limit (50 views) displayed'));
      }
      
      console.log(chalk.bold.green('\n✅ Admin Flow Test Complete!'));
      console.log(chalk.cyan(`📸 Screenshots saved to: ${screenshotsDir}`));
      
    } catch (error: Error | unknown) {
      console.error(chalk.red('\n❌ Test error:'), error.message);
      await page.screenshot({ path: path.join(screenshotsDir, 'error-state.png') });
    }
    
  } finally {
    console.log(chalk.yellow('\n🎭 Keeping browser open for 10 seconds...'));
    await page.waitForTimeout(10000);
    await browser.close();
  }
}

simpleAdminFlow().catch(console.error);