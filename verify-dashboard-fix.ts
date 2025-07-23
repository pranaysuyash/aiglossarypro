#!/usr/bin/env npx tsx

import { chromium, Browser, Page } from 'playwright';
import chalk from 'chalk';

const TEST_USERS = [
  { email: 'free@aiglossarypro.com', password: 'freepass123', type: 'free' },
  { email: 'premium@aiglossarypro.com', password: 'premiumpass123', type: 'premium' }
];

async function verifyDashboardFix() {
  let browser: Browser | null = null;
  
  try {
    console.log(chalk.blue('\n🔍 Verifying Dashboard Progress Stats Fix\n'));
    
    browser = await chromium.launch({ 
      headless: false,
      slowMo: 50
    });
    
    for (const user of TEST_USERS) {
      console.log(chalk.yellow(`\n📋 Testing ${user.type} user: ${user.email}`));
      
      const context = await browser.newContext();
      const page = await context.newPage();
      
      // Monitor API calls
      let progressStatsStatus = 0;
      page.on('response', response => {
        if (response.url().includes('/api/user/progress/stats')) {
          progressStatsStatus = response.status();
          console.log(chalk.gray(`   Progress API status: ${progressStatsStatus}`));
        }
      });
      
      // Navigate to login
      await page.goto('http://localhost:5173/login');
      
      // Handle cookie consent if present
      try {
        const cookieButton = await page.locator('button:has-text("Accept"), button:has-text("I understand")').first();
        if (await cookieButton.isVisible({ timeout: 2000 })) {
          await cookieButton.click();
        }
      } catch (e) {
        // No cookie modal
      }
      
      // Login
      console.log(chalk.gray('   Logging in...'));
      await page.fill('input[type="email"]', user.email);
      await page.fill('input[type="password"]', user.password);
      await page.click('button[type="submit"]');
      
      // Wait for navigation
      await page.waitForTimeout(3000);
      
      // Navigate to dashboard
      console.log(chalk.gray('   Navigating to dashboard...'));
      await page.goto('http://localhost:5173/dashboard');
      
      // Wait for progress visualization to load
      console.log(chalk.gray('   Waiting for progress stats...'));
      
      try {
        // Wait for progress elements
        await page.waitForSelector('text=/Terms Explored|Bookmarks|Streak|Progress/', { timeout: 10000 });
        
        // Check if we got 500 error
        if (progressStatsStatus === 500) {
          console.log(chalk.red(`   ❌ FAIL: Progress stats API returned 500`));
          
          // Check console for errors
          const errors = await page.locator('text=/error|failed|500/i').count();
          if (errors > 0) {
            console.log(chalk.red(`   ❌ Error messages visible in UI`));
          }
          
          await page.screenshot({ path: `dashboard-error-${user.type}.png` });
        } else if (progressStatsStatus === 200) {
          console.log(chalk.green(`   ✅ PASS: Progress stats loaded successfully (${progressStatsStatus})`));
          
          // Verify progress elements are visible
          const progressCards = await page.locator('.card:has-text("Terms Explored"), .card:has-text("Bookmarks"), .card:has-text("Streak")').count();
          console.log(chalk.gray(`   Found ${progressCards} progress cards`));
          
          // Check for achievements
          const achievements = await page.locator('text=/Achievement|Milestone/').count();
          if (achievements > 0) {
            console.log(chalk.green(`   ✅ Achievements section loaded`));
          }
          
          await page.screenshot({ path: `dashboard-success-${user.type}.png` });
        } else {
          console.log(chalk.yellow(`   ⚠️  Progress stats API status: ${progressStatsStatus}`));
        }
        
      } catch (error) {
        console.log(chalk.red(`   ❌ FAIL: ${error.message}`));
        await page.screenshot({ path: `dashboard-timeout-${user.type}.png` });
      }
      
      await page.close();
      await context.close();
    }
    
    console.log(chalk.blue('\n✨ Dashboard verification complete!\n'));
    
  } catch (error) {
    console.error(chalk.red('Test failed:'), error);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

// Run the test
verifyDashboardFix().catch(console.error);