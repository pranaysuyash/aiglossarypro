import { chromium } from 'playwright';
import chalk from 'chalk';

async function debugLogin() {
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 500 
  });
  
  const context = await browser.newContext();
  const page = await context.newPage();
  
  console.log(chalk.blue('🔍 Debugging login process...'));
  
  try {
    // Navigate to login
    await page.goto('http://localhost:5173/login');
    console.log(chalk.gray('✓ Navigated to login page'));
    
    // Take screenshot
    await page.screenshot({ path: 'debug-login-page.png' });
    
    // Check for cookie consent
    const cookieConsent = await page.locator('[data-testid="cookie-consent"], .cookie-consent, button:has-text("Accept")').first();
    if (await cookieConsent.isVisible()) {
      console.log(chalk.gray('✓ Cookie consent visible'));
      await cookieConsent.click();
      await page.waitForTimeout(1000);
    }
    
    // Check for any modals
    const modals = await page.locator('.fixed.inset-0, [role="dialog"]').all();
    console.log(chalk.gray(`Found ${modals.length} potential modals`));
    
    // Look for login form elements
    const emailInput = await page.locator('input[type="email"]').first();
    const passwordInput = await page.locator('input[type="password"]').first();
    const submitButton = await page.locator('button[type="submit"]').first();
    
    console.log(chalk.gray('Form elements found:'));
    console.log(`  Email input visible: ${await emailInput.isVisible()}`);
    console.log(`  Password input visible: ${await passwordInput.isVisible()}`);
    console.log(`  Submit button visible: ${await submitButton.isVisible()}`);
    
    // Try to fill form
    if (await emailInput.isVisible()) {
      await emailInput.fill('free@aiglossarypro.com');
      console.log(chalk.gray('✓ Filled email'));
    }
    
    if (await passwordInput.isVisible()) {
      await passwordInput.fill('freepass123');
      console.log(chalk.gray('✓ Filled password'));
    }
    
    // Take screenshot before submit
    await page.screenshot({ path: 'debug-login-filled.png' });
    
    // Try to submit
    if (await submitButton.isVisible()) {
      console.log(chalk.gray('Clicking submit button...'));
      
      // Listen for navigation
      const navigationPromise = page.waitForNavigation({ timeout: 10000 }).catch(e => {
        console.log(chalk.red('Navigation timeout:', e.message));
        return null;
      });
      
      await submitButton.click();
      console.log(chalk.gray('✓ Clicked submit'));
      
      const nav = await navigationPromise;
      if (nav) {
        console.log(chalk.green(`✓ Navigated to: ${page.url()}`));
      }
    }
    
    // Wait a bit and check final state
    await page.waitForTimeout(3000);
    console.log(chalk.blue(`Final URL: ${page.url()}`));
    
    // Check for user menu
    const userMenu = await page.locator('[data-testid="user-menu"], .user-menu, .user-avatar, .user-dropdown').first();
    console.log(`User menu visible: ${await userMenu.isVisible()}`);
    
    // Check for any error messages
    const errors = await page.locator('.error, [role="alert"], .text-red-500').all();
    for (const error of errors) {
      const text = await error.textContent();
      if (text) console.log(chalk.red(`Error found: ${text}`));
    }
    
    // Final screenshot
    await page.screenshot({ path: 'debug-login-final.png' });
    
  } catch (error) {
    console.error(chalk.red('Debug error:'), error);
  } finally {
    await browser.close();
  }
}

debugLogin();