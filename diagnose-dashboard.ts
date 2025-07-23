#!/usr/bin/env npx tsx

import { chromium } from 'playwright';
import chalk from 'chalk';

async function diagnoseDashboard() {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  // Enable console logging
  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.log(chalk.red(`Browser Console Error: ${msg.text()}`));
    }
  });
  
  // Monitor network
  page.on('response', response => {
    if (response.url().includes('/api/')) {
      console.log(chalk.gray(`API: ${response.status()} ${response.url()}`));
    }
  });
  
  try {
    console.log(chalk.blue('Diagnosing Dashboard Issue\n'));
    
    // Go to login
    await page.goto('http://localhost:5173/login');
    
    // Handle cookie consent
    try {
      await page.click('button:has-text("Accept")', { timeout: 2000 });
    } catch (e) {}
    
    // Login
    await page.fill('input[type="email"]', 'free@aiglossarypro.com');
    await page.fill('input[type="password"]', 'freepass123');
    await page.click('button[type="submit"]');
    
    // Wait a bit
    await page.waitForTimeout(3000);
    
    // Check current URL
    console.log('Current URL:', page.url());
    
    // Try to go to dashboard
    await page.goto('http://localhost:5173/dashboard');
    await page.waitForTimeout(3000);
    
    // Check what's on the page
    const pageTitle = await page.title();
    console.log('Page title:', pageTitle);
    
    // Check for any text content
    const bodyText = await page.textContent('body');
    console.log('Body text length:', bodyText?.length);
    
    // Look for specific elements
    const hasSpinner = await page.locator('.animate-spin').count();
    console.log('Spinner elements:', hasSpinner);
    
    const hasError = await page.locator('text=/error|failed/i').count();
    console.log('Error elements:', hasError);
    
    const hasProgress = await page.locator('[class*="progress"]').count();
    console.log('Progress elements:', hasProgress);
    
    const hasDashboard = await page.locator('text=/dashboard/i').count();
    console.log('Dashboard text:', hasDashboard);
    
    // Take screenshot
    await page.screenshot({ path: 'dashboard-diagnostic.png', fullPage: true });
    console.log('\nScreenshot saved: dashboard-diagnostic.png');
    
  } catch (error) {
    console.error(chalk.red('Error:'), error);
  } finally {
    await browser.close();
  }
}

diagnoseDashboard();