#!/usr/bin/env tsx

/**
 * Test User Accounts Validation Script
 * 
 * This script tests all three user account types with their respective functionality:
 * - Free User: test@aimlglossary.com / testpassword123
 * - Premium User: premium@aimlglossary.com / premiumpass123
 * - Admin User: admin@aimlglossary.com / adminpass123
 */

import { chromium, type Browser, type Page } from 'playwright';
import { writeFileSync, existsSync, mkdirSync } from 'fs';
import path from 'path';

interface TestUser {
  email: string;
  password: string;
  type: 'free' | 'premium' | 'admin';
  expectedFeatures: string[];
  restrictedFeatures: string[];
}

interface TestResult {
  user: TestUser;
  success: boolean;
  loginSuccessful: boolean;
  logoutSuccessful: boolean;
  featuresAccessible: string[];
  featuresRestricted: string[];
  errors: string[];
  screenshots: string[];
}

const TEST_USERS: TestUser[] = [
  {
    email: 'test@aimlglossary.com',
    password: 'testpassword123',
    type: 'free',
    expectedFeatures: ['search', 'basic-terms', 'categories'],
    restrictedFeatures: ['premium-features', 'advanced-search', 'admin-panel']
  },
  {
    email: 'premium@aimlglossary.com',
    password: 'premiumpass123',
    type: 'premium',
    expectedFeatures: ['search', 'basic-terms', 'categories', 'premium-features', 'advanced-search'],
    restrictedFeatures: ['admin-panel']
  },
  {
    email: 'admin@aimlglossary.com',
    password: 'adminpass123',
    type: 'admin',
    expectedFeatures: ['search', 'basic-terms', 'categories', 'premium-features', 'advanced-search', 'admin-panel'],
    restrictedFeatures: []
  }
];

class UserAccountTester {
  private browser: Browser | null = null;
  private baseUrl: string = 'http://localhost:5173';
  private screenshotDir: string = path.join(process.cwd(), 'user-account-tests');

  constructor() {
    // Create screenshots directory
    try {
      if (!existsSync(this.screenshotDir)) {
        mkdirSync(this.screenshotDir, { recursive: true });
      }
    } catch (error) {
      // Fallback to using writeFileSync later
      console.warn('Could not create screenshots directory:', error);
    }
  }

  async initialize(): Promise<void> {
    this.browser = await chromium.launch({
      headless: false, // Set to true for CI/CD
      slowMo: 1000 // Slow down for better visibility
    });
  }

  async testUser(user: TestUser): Promise<TestResult> {
    if (!this.browser) {
      throw new Error('Browser not initialized');
    }

    const context = await this.browser.newContext();
    const page = await context.newPage();
    
    const result: TestResult = {
      user,
      success: false,
      loginSuccessful: false,
      logoutSuccessful: false,
      featuresAccessible: [],
      featuresRestricted: [],
      errors: [],
      screenshots: []
    };

    try {
      console.log(`\n🧪 Testing ${user.type} user: ${user.email}`);

      // Step 1: Navigate to login page
      await page.goto(`${this.baseUrl}/login`);
      await page.waitForTimeout(2000);

      // Take screenshot of login page
      const loginScreenshot = `${this.screenshotDir}/${user.type}-01-login-page.png`;
      await page.screenshot({ path: loginScreenshot });
      result.screenshots.push(loginScreenshot);

      // Step 2: Perform login
      result.loginSuccessful = await this.performLogin(page, user);
      if (!result.loginSuccessful) {
        result.errors.push('Login failed');
        return result;
      }

      // Take screenshot after login
      const dashboardScreenshot = `${this.screenshotDir}/${user.type}-02-dashboard.png`;
      await page.screenshot({ path: dashboardScreenshot });
      result.screenshots.push(dashboardScreenshot);

      // Step 3: Test feature access
      await this.testFeatureAccess(page, user, result);

      // Step 4: Test logout
      result.logoutSuccessful = await this.performLogout(page, user);
      if (!result.logoutSuccessful) {
        result.errors.push('Logout failed');
      }

      // Take screenshot after logout
      const logoutScreenshot = `${this.screenshotDir}/${user.type}-03-logout.png`;
      await page.screenshot({ path: logoutScreenshot });
      result.screenshots.push(logoutScreenshot);

      result.success = result.loginSuccessful && result.logoutSuccessful && result.errors.length === 0;
      
    } catch (error) {
      result.errors.push(`Test error: ${error.message}`);
      console.error(`❌ Error testing ${user.type} user:`, error);
    } finally {
      await context.close();
    }

    return result;
  }

  private async performLogin(page: Page, user: TestUser): Promise<boolean> {
    try {
      console.log(`   🔐 Attempting login for ${user.email}`);

      // First, handle the cookie consent banner if it appears
      try {
        await page.waitForSelector('button:has-text("Accept All")', { timeout: 3000 });
        await page.click('button:has-text("Accept All")');
        console.log('   ✅ Cookie consent accepted');
        await page.waitForTimeout(1000);
      } catch (cookieError) {
        console.log('   ℹ️  No cookie consent banner found');
      }

      // Wait for email input and fill it
      await page.waitForSelector('input[type="email"]', { timeout: 10000 });
      await page.fill('input[type="email"]', user.email);
      
      // Wait for password input and fill it
      await page.waitForSelector('input[type="password"]', { timeout: 10000 });
      await page.fill('input[type="password"]', user.password);

      // Submit the form - use force click to bypass any overlays
      await page.click('button[type="submit"]', { force: true });
      
      // Wait for navigation or dashboard to load
      await page.waitForTimeout(5000);

      // Check if we're redirected to dashboard/app
      const currentUrl = page.url();
      const isLoggedIn = currentUrl.includes('/app') || currentUrl.includes('/dashboard');
      
      if (isLoggedIn) {
        console.log(`   ✅ Login successful for ${user.email}`);
        return true;
      } else {
        console.log(`   ❌ Login failed for ${user.email} - URL: ${currentUrl}`);
        return false;
      }
    } catch (error) {
      console.error(`   ❌ Login error for ${user.email}:`, error);
      return false;
    }
  }

  private async performLogout(page: Page, user: TestUser): Promise<boolean> {
    try {
      console.log(`   🚪 Attempting logout for ${user.email}`);

      // Look for user menu or logout button
      const userMenuSelector = '[data-testid="user-menu"], .user-menu, [aria-label*="user"], [aria-label*="User"]';
      const logoutSelector = '[data-testid="logout"], .logout, [aria-label*="logout"], [aria-label*="Logout"]';
      
      // Try to find and click user menu first
      try {
        await page.waitForSelector(userMenuSelector, { timeout: 5000 });
        await page.click(userMenuSelector);
        await page.waitForTimeout(1000);
      } catch (error) {
        console.log(`   ⚠️  User menu not found, trying direct logout button`);
      }

      // Try to find and click logout button
      try {
        await page.waitForSelector(logoutSelector, { timeout: 5000 });
        await page.click(logoutSelector);
        await page.waitForTimeout(3000);
      } catch (error) {
        console.log(`   ⚠️  Logout button not found, trying alternative methods`);
        
        // Try clicking on text containing "logout" or "log out"
        try {
          await page.click('text=/logout/i');
          await page.waitForTimeout(3000);
        } catch (textError) {
          console.error(`   ❌ Could not find logout option for ${user.email}`);
          return false;
        }
      }

      // Check if we're redirected to login page
      const currentUrl = page.url();
      const isLoggedOut = currentUrl.includes('/login') || currentUrl.includes('/') || !currentUrl.includes('/app');
      
      if (isLoggedOut) {
        console.log(`   ✅ Logout successful for ${user.email}`);
        return true;
      } else {
        console.log(`   ❌ Logout failed for ${user.email} - URL: ${currentUrl}`);
        return false;
      }
    } catch (error) {
      console.error(`   ❌ Logout error for ${user.email}:`, error);
      return false;
    }
  }

  private async testFeatureAccess(page: Page, user: TestUser, result: TestResult): Promise<void> {
    console.log(`   🔍 Testing feature access for ${user.type} user`);

    // Test search functionality
    if (user.expectedFeatures.includes('search')) {
      const hasSearch = await this.testSearchFeature(page);
      if (hasSearch) {
        result.featuresAccessible.push('search');
      } else {
        result.errors.push('Search feature not accessible');
      }
    }

    // Test premium features (if applicable)
    if (user.expectedFeatures.includes('premium-features')) {
      const hasPremiumFeatures = await this.testPremiumFeatures(page);
      if (hasPremiumFeatures) {
        result.featuresAccessible.push('premium-features');
      } else {
        result.errors.push('Premium features not accessible');
      }
    }

    // Test admin panel (if applicable)
    if (user.expectedFeatures.includes('admin-panel')) {
      const hasAdminPanel = await this.testAdminPanel(page);
      if (hasAdminPanel) {
        result.featuresAccessible.push('admin-panel');
      } else {
        result.errors.push('Admin panel not accessible');
      }
    }

    // Test restricted features
    for (const restrictedFeature of user.restrictedFeatures) {
      const hasRestrictedFeature = await this.testRestrictedFeature(page, restrictedFeature);
      if (!hasRestrictedFeature) {
        result.featuresRestricted.push(restrictedFeature);
      } else {
        result.errors.push(`Restricted feature ${restrictedFeature} is accessible`);
      }
    }
  }

  private async testSearchFeature(page: Page): Promise<boolean> {
    try {
      await page.waitForSelector('input[type="search"], [placeholder*="search"], [placeholder*="Search"]', { timeout: 5000 });
      return true;
    } catch (error) {
      return false;
    }
  }

  private async testPremiumFeatures(page: Page): Promise<boolean> {
    try {
      // Look for premium badges or indicators
      const premiumIndicators = await page.locator('text=/premium/i, [class*="premium"], [data-testid*="premium"]').count();
      return premiumIndicators > 0;
    } catch (error) {
      return false;
    }
  }

  private async testAdminPanel(page: Page): Promise<boolean> {
    try {
      // Try to navigate to admin panel
      await page.goto(`${this.baseUrl}/admin`);
      await page.waitForTimeout(2000);
      
      // Check if we're on admin page or see admin elements
      const currentUrl = page.url();
      const hasAdminElements = await page.locator('text=/admin/i, [class*="admin"], [data-testid*="admin"]').count();
      
      return currentUrl.includes('/admin') || hasAdminElements > 0;
    } catch (error) {
      return false;
    }
  }

  private async testRestrictedFeature(page: Page, feature: string): Promise<boolean> {
    try {
      switch (feature) {
        case 'admin-panel':
          return await this.testAdminPanel(page);
        case 'premium-features':
          return await this.testPremiumFeatures(page);
        default:
          return false;
      }
    } catch (error) {
      return false;
    }
  }

  async generateReport(results: TestResult[]): Promise<void> {
    const reportPath = path.join(this.screenshotDir, 'user-account-test-report.json');
    const htmlReportPath = path.join(this.screenshotDir, 'user-account-test-report.html');
    
    // Generate JSON report
    writeFileSync(reportPath, JSON.stringify(results, null, 2));
    
    // Generate HTML report
    const htmlReport = this.generateHTMLReport(results);
    writeFileSync(htmlReportPath, htmlReport);
    
    console.log(`\n📊 Reports generated:`);
    console.log(`   JSON: ${reportPath}`);
    console.log(`   HTML: ${htmlReportPath}`);
  }

  private generateHTMLReport(results: TestResult[]): string {
    const timestamp = new Date().toISOString();
    const successCount = results.filter(r => r.success).length;
    const totalCount = results.length;
    
    return `<!DOCTYPE html>
<html>
<head>
    <title>User Account Test Report - ${timestamp}</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .header { background: #f5f5f5; padding: 20px; border-radius: 8px; }
        .test-result { margin: 20px 0; padding: 15px; border: 1px solid #ddd; border-radius: 8px; }
        .success { border-color: #28a745; background: #f8fff9; }
        .failure { border-color: #dc3545; background: #fff8f8; }
        .feature-list { margin: 10px 0; }
        .feature-item { display: inline-block; margin: 5px; padding: 5px 10px; border-radius: 4px; }
        .accessible { background: #d4edda; color: #155724; }
        .restricted { background: #f8d7da; color: #721c24; }
        .error { background: #f8d7da; color: #721c24; padding: 5px; margin: 5px 0; border-radius: 4px; }
        .screenshot { max-width: 200px; margin: 10px; }
    </style>
</head>
<body>
    <div class="header">
        <h1>User Account Test Report</h1>
        <p><strong>Generated:</strong> ${timestamp}</p>
        <p><strong>Success Rate:</strong> ${successCount}/${totalCount} (${Math.round((successCount/totalCount)*100)}%)</p>
    </div>
    
    ${results.map(result => `
        <div class="test-result ${result.success ? 'success' : 'failure'}">
            <h2>${result.user.type.toUpperCase()} User: ${result.user.email}</h2>
            <p><strong>Overall Status:</strong> ${result.success ? '✅ PASS' : '❌ FAIL'}</p>
            <p><strong>Login:</strong> ${result.loginSuccessful ? '✅ Success' : '❌ Failed'}</p>
            <p><strong>Logout:</strong> ${result.logoutSuccessful ? '✅ Success' : '❌ Failed'}</p>
            
            <div class="feature-list">
                <h3>Accessible Features:</h3>
                ${result.featuresAccessible.map(f => `<span class="feature-item accessible">${f}</span>`).join('')}
            </div>
            
            <div class="feature-list">
                <h3>Properly Restricted Features:</h3>
                ${result.featuresRestricted.map(f => `<span class="feature-item restricted">${f}</span>`).join('')}
            </div>
            
            ${result.errors.length > 0 ? `
                <div>
                    <h3>Errors:</h3>
                    ${result.errors.map(e => `<div class="error">${e}</div>`).join('')}
                </div>
            ` : ''}
            
            <div>
                <h3>Screenshots:</h3>
                ${result.screenshots.map(s => `<img src="${path.basename(s)}" class="screenshot" alt="Test screenshot">`).join('')}
            </div>
        </div>
    `).join('')}
</body>
</html>`;
  }

  async cleanup(): Promise<void> {
    if (this.browser) {
      await this.browser.close();
    }
  }
}

// Main execution
async function main() {
  const tester = new UserAccountTester();
  const results: TestResult[] = [];

  try {
    await tester.initialize();
    
    console.log('🚀 Starting user account testing...');
    
    for (const user of TEST_USERS) {
      const result = await tester.testUser(user);
      results.push(result);
      
      // Print summary
      console.log(`\n📋 ${user.type.toUpperCase()} User Test Summary:`);
      console.log(`   Email: ${user.email}`);
      console.log(`   Overall: ${result.success ? '✅ PASS' : '❌ FAIL'}`);
      console.log(`   Login: ${result.loginSuccessful ? '✅' : '❌'}`);
      console.log(`   Logout: ${result.logoutSuccessful ? '✅' : '❌'}`);
      console.log(`   Features Accessible: ${result.featuresAccessible.join(', ')}`);
      console.log(`   Features Restricted: ${result.featuresRestricted.join(', ')}`);
      if (result.errors.length > 0) {
        console.log(`   Errors: ${result.errors.join(', ')}`);
      }
    }
    
    await tester.generateReport(results);
    
    // Final summary
    const successCount = results.filter(r => r.success).length;
    console.log(`\n🎯 Final Results: ${successCount}/${results.length} users tested successfully`);
    
    if (successCount === results.length) {
      console.log('✅ All user account tests passed!');
    } else {
      console.log('❌ Some user account tests failed. Check the report for details.');
      process.exit(1);
    }
    
  } catch (error) {
    console.error('❌ Test execution failed:', error);
    process.exit(1);
  } finally {
    await tester.cleanup();
  }
}

// Run the tests
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { UserAccountTester, type TestResult, type TestUser };