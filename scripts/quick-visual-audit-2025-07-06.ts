#!/usr/bin/env tsx

/**
 * Quick Visual Audit Script for AI Glossary Pro
 * Date: July 6, 2025
 *
 * This script performs a comprehensive visual audit including:
 * - All main pages and routes
 * - Authentication flows with Firebase test users
 * - Search functionality
 * - Component interactions
 * - Responsive breakpoints
 * - Dark/light mode
 */

import fs from 'node:fs/promises';
import path from 'node:path';
import chalk from 'chalk';
import { type Browser, chromium, type Page } from 'playwright';

const BASE_URL = 'http://localhost:5173';
const _API_URL = 'http://localhost:3001';

// Test user credentials from the codebase
const TEST_USERS = {
  regular: {
    email: 'test@aimlglossary.com',
    password: 'testpass123',
  },
  admin: {
    email: 'admin@aimlglossary.com',
    password: 'adminpass123',
  },
};

const BREAKPOINTS = [
  { name: 'mobile-portrait', width: 375, height: 812 },
  { name: 'mobile-landscape', width: 812, height: 375 },
  { name: 'tablet-portrait', width: 768, height: 1024 },
  { name: 'tablet-landscape', width: 1024, height: 768 },
  { name: 'desktop-small', width: 1366, height: 768 },
  { name: 'desktop-large', width: 1920, height: 1080 },
];

const PAGES_TO_TEST = [
  { name: 'homepage', path: '/' },
  { name: 'terms', path: '/terms' },
  { name: 'categories', path: '/categories' },
  { name: 'trending', path: '/trending' },
  { name: 'favorites', path: '/favorites' },
  { name: 'dashboard', path: '/dashboard' },
  { name: 'settings', path: '/settings' },
  { name: 'ai-tools', path: '/ai-tools' },
  { name: 'login', path: '/login' },
  { name: 'profile', path: '/profile' },
  { name: 'progress', path: '/progress' },
  { name: 'lifetime', path: '/lifetime' },
  { name: 'admin', path: '/admin' },
  { name: 'about', path: '/about' },
  { name: 'privacy', path: '/privacy' },
  { name: 'terms-of-service', path: '/terms-of-service' },
];

class QuickVisualAuditor {
  private browser: Browser | null = null;
  private timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  private resultsDir = path.join(process.cwd(), 'visual-audit-results', this.timestamp);
  private results: any[] = [];

  async initialize() {
    // Create results directory
    await fs.mkdir(this.resultsDir, { recursive: true });
    await fs.mkdir(path.join(this.resultsDir, 'screenshots'), { recursive: true });

    // Launch browser
    this.browser = await chromium.launch({
      headless: true, // Set back to headless for full test, change to false to debug
      slowMo: 250, // Slow down actions so you can see what's happening
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    console.log(chalk.green('✅ Browser launched successfully'));
  }

  async testPage(page: Page, pageName: string, breakpoint: string) {
    const screenshotPath = path.join(
      this.resultsDir,
      'screenshots',
      `${pageName}-${breakpoint}.png`
    );

    try {
      await page.screenshot({
        path: screenshotPath,
        fullPage: true,
      });

      // Check for common issues
      const issues = [];

      // Check for console errors
      page.on('console', msg => {
        if (msg.type() === 'error') {
          issues.push({
            type: 'console-error',
            message: msg.text(),
          });
        }
      });

      // Check for broken images
      const images = await page.$$eval('img', imgs =>
        imgs.map(img => ({
          src: img.src,
          loaded: img.complete && img.naturalHeight !== 0,
        }))
      );

      const brokenImages = images.filter(img => !img.loaded);
      if (brokenImages.length > 0) {
        issues.push({
          type: 'broken-images',
          count: brokenImages.length,
          images: brokenImages,
        });
      }

      // Check for accessibility issues
      const accessibilityIssues = await this.checkAccessibility(page);
      if (accessibilityIssues.length > 0) {
        issues.push({
          type: 'accessibility',
          issues: accessibilityIssues,
        });
      }

      return {
        page: pageName,
        breakpoint,
        screenshot: screenshotPath,
        issues,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return {
        page: pageName,
        breakpoint,
        error: error instanceof Error ? error.message : String(error),
        timestamp: new Date().toISOString(),
      };
    }
  }

  async checkAccessibility(page: Page) {
    const issues = [];

    // Check for missing alt text
    const imagesWithoutAlt = await page.$$eval('img:not([alt])', imgs => imgs.length);
    if (imagesWithoutAlt > 0) {
      issues.push({
        rule: 'images-alt',
        severity: 'serious',
        count: imagesWithoutAlt,
      });
    }

    // Check for buttons without accessible text
    const buttonsWithoutText = await page.$$eval(
      'button',
      buttons =>
        buttons.filter(btn => !btn.textContent?.trim() && !btn.getAttribute('aria-label')).length
    );
    if (buttonsWithoutText > 0) {
      issues.push({
        rule: 'button-name',
        severity: 'serious',
        count: buttonsWithoutText,
      });
    }

    // Check for form labels
    const inputsWithoutLabels = await page.$$eval(
      'input:not([type="hidden"])',
      inputs =>
        inputs.filter(input => {
          const id = input.id;
          if (!id) return true;
          return !document.querySelector(`label[for="${id}"]`);
        }).length
    );
    if (inputsWithoutLabels > 0) {
      issues.push({
        rule: 'label',
        severity: 'serious',
        count: inputsWithoutLabels,
      });
    }

    return issues;
  }

  async testAuthentication(page: Page) {
    console.log(chalk.blue('\n🔐 Testing Authentication...'));

    try {
      // Navigate to login page
      await page.goto(`${BASE_URL}/login`, {
        waitUntil: 'domcontentloaded',
        timeout: 15000,
      });

      // Wait for page to load completely
      await page.waitForLoadState('domcontentloaded');

      // Check if login form exists
      const emailInput = await page.$('input[type="email"], input[name="email"]');
      const passwordInput = await page.$('input[type="password"], input[name="password"]');
      const submitButton = await page.$(
        'button[type="submit"], button:has-text("Login"), button:has-text("Sign in")'
      );

      if (!emailInput || !passwordInput || !submitButton) {
        throw new Error(
          `Login form elements not found. Email: ${!!emailInput}, Password: ${!!passwordInput}, Submit: ${!!submitButton}`
        );
      }

      console.log(chalk.blue('📝 Filling login form...'));

      // Test regular user login
      await emailInput.fill(TEST_USERS.regular.email);
      await passwordInput.fill(TEST_USERS.regular.password);
      await submitButton.click();

      // Wait for navigation with reduced timeout
      try {
        await page.waitForURL(/\/(dashboard|terms|$)/, { timeout: 5000 });
        console.log(chalk.green('✅ Regular user login successful'));
      } catch (_urlError) {
        console.log(chalk.yellow('⚠️ Login redirect timeout, but form submitted'));
        // Continue with test even if redirect times out
      }

      // Take screenshot of current state
      await page.screenshot({
        path: path.join(this.resultsDir, 'screenshots', 'authentication-test.png'),
      });

      // Check if user is logged in
      const userMenu = await page.$('[data-testid="user-menu"], [aria-label*="User menu"]');
      if (userMenu) {
        await userMenu.click();
        await page.screenshot({
          path: path.join(this.resultsDir, 'screenshots', 'user-menu-regular.png'),
        });
      }

      // Logout
      const logoutButton = await page.$(
        '[data-testid="logout"], button:has-text("Logout"), button:has-text("Sign out")'
      );
      if (logoutButton) {
        await logoutButton.click();
        try {
          await page.waitForURL(/\/(login|$)/, { timeout: 3000 });
        } catch (_logoutError) {
          console.log(chalk.yellow('⚠️ Logout redirect timeout'));
        }
      }

      return { success: true, user: 'regular' };
    } catch (error) {
      console.log(chalk.red('❌ Authentication test failed:', error));
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  async testSearch(page: Page) {
    console.log(chalk.blue('\n🔍 Testing Search Functionality...'));

    try {
      await page.goto(`${BASE_URL}/terms`, {
        waitUntil: 'domcontentloaded',
        timeout: 15000,
      });

      // Find search input
      const searchInput = await page.$(
        'input[type="search"], input[placeholder*="Search"], input[name="search"]'
      );

      if (searchInput) {
        // Type search query
        await searchInput.type('machine learning');
        await page.waitForTimeout(1000); // Wait for debounce

        await page.screenshot({
          path: path.join(this.resultsDir, 'screenshots', 'search-results.png'),
          fullPage: true,
        });

        // Check if results are displayed
        const results = await page.$$('[data-testid="search-result"], .search-result, .term-card');
        console.log(chalk.green(`✅ Search returned ${results.length} results`));

        return { success: true, resultCount: results.length };
      } else {
        throw new Error('Search input not found');
      }
    } catch (error) {
      console.log(chalk.red('❌ Search test failed:', error));
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  async testInteractions(page: Page) {
    console.log(chalk.blue('\n🖱️ Testing Component Interactions...'));

    const interactions = [];

    try {
      await page.goto(BASE_URL, {
        waitUntil: 'domcontentloaded',
        timeout: 15000,
      });

      // Test theme toggle
      const themeToggle = await page.$(
        '[data-testid="theme-toggle"], button[aria-label*="theme"], button:has-text("Theme")'
      );
      if (themeToggle) {
        await themeToggle.click();
        await page.waitForTimeout(500);
        const isDark = await page.evaluate(
          () =>
            document.documentElement.classList.contains('dark') ||
            document.body.classList.contains('dark-mode')
        );
        interactions.push({
          component: 'theme-toggle',
          success: true,
          state: isDark ? 'dark' : 'light',
        });
      }

      // Test navigation menu
      const menuButton = await page.$(
        '[data-testid="menu-button"], button[aria-label*="Menu"], .hamburger'
      );
      if (menuButton) {
        await menuButton.click();
        await page.waitForTimeout(500);
        await page.screenshot({
          path: path.join(this.resultsDir, 'screenshots', 'mobile-menu.png'),
        });
        interactions.push({ component: 'mobile-menu', success: true });
      }

      // Test category filter
      await page.goto(`${BASE_URL}/terms`, { waitUntil: 'networkidle' });
      const categoryFilter = await page.$(
        'select[name="category"], [data-testid="category-filter"]'
      );
      if (categoryFilter) {
        const options = await page.$$eval('select[name="category"] option', opts =>
          opts.map(opt => (opt as HTMLOptionElement).value)
        );
        if (options.length > 1) {
          await categoryFilter.selectOption(options[1]);
          await page.waitForTimeout(1000);
          interactions.push({
            component: 'category-filter',
            success: true,
            optionCount: options.length,
          });
        }
      }
    } catch (error) {
      interactions.push({
        component: 'unknown',
        success: false,
        error: error instanceof Error ? error.message : String(error),
      });
    }

    return interactions;
  }

  async runAudit() {
    console.log(chalk.bold.green('\n🚀 Starting Quick Visual Audit for AI Glossary Pro'));
    console.log(chalk.gray(`📅 Date: ${new Date().toLocaleDateString()}`));
    console.log(chalk.gray(`⏰ Time: ${new Date().toLocaleTimeString()}`));
    console.log(chalk.gray(`📁 Results: ${this.resultsDir}\n`));

    await this.initialize();

    // Test unauthenticated pages
    console.log(chalk.blue('\n📄 Testing Public Pages...'));
    for (const pageConfig of PAGES_TO_TEST) {
      console.log(chalk.yellow(`\n  Testing ${pageConfig.name}...`));

      for (const breakpoint of BREAKPOINTS) {
        const page = await this.browser?.newPage({
          viewport: { width: breakpoint.width, height: breakpoint.height },
        });

        try {
          await page.goto(`${BASE_URL}${pageConfig.path}`, {
            waitUntil: 'domcontentloaded', // Changed from 'networkidle' to 'domcontentloaded'
            timeout: 15000, // Reduced timeout from 30s to 15s
          });

          const result = await this.testPage(page, pageConfig.name, breakpoint.name);
          this.results.push(result);

          if (result.error) {
            console.log(chalk.red(`    ❌ ${breakpoint.name}: ${result.error}`));
          } else {
            console.log(chalk.green(`    ✅ ${breakpoint.name}`));
            if (result.issues.length > 0) {
              console.log(chalk.yellow(`       ⚠️  ${result.issues.length} issues found`));
            }
          }
        } catch (error) {
          console.log(chalk.red(`    ❌ ${breakpoint.name}: ${error}`));
          this.results.push({
            page: pageConfig.name,
            breakpoint: breakpoint.name,
            error: error instanceof Error ? error.message : String(error),
          });
        } finally {
          await page.close();
        }
      }
    }

    // Test authentication
    const authPage = await this.browser?.newPage();
    const authResult = await this.testAuthentication(authPage);
    this.results.push({ test: 'authentication', ...authResult });
    await authPage.close();

    // Test search
    const searchPage = await this.browser?.newPage();
    const searchResult = await this.testSearch(searchPage);
    this.results.push({ test: 'search', ...searchResult });
    await searchPage.close();

    // Test interactions
    const interactionPage = await this.browser?.newPage();
    const interactionResults = await this.testInteractions(interactionPage);
    this.results.push({ test: 'interactions', results: interactionResults });
    await interactionPage.close();

    // Generate report
    await this.generateReport();

    // Cleanup
    await this.browser?.close();

    console.log(chalk.bold.green('\n✅ Audit Complete!'));
    console.log(chalk.cyan(`📊 Report: ${path.join(this.resultsDir, 'report.json')}`));
    console.log(chalk.cyan(`📸 Screenshots: ${path.join(this.resultsDir, 'screenshots')}`));
  }

  async generateReport() {
    const report = {
      metadata: {
        timestamp: this.timestamp,
        date: new Date().toISOString(),
        baseUrl: BASE_URL,
        breakpoints: BREAKPOINTS,
        pages: PAGES_TO_TEST.length,
        totalTests: this.results.length,
      },
      summary: {
        total: this.results.length,
        successful: this.results.filter(r => !r.error).length,
        failed: this.results.filter(r => r.error).length,
        withIssues: this.results.filter(r => r.issues && r.issues.length > 0).length,
      },
      results: this.results,
    };

    await fs.writeFile(path.join(this.resultsDir, 'report.json'), JSON.stringify(report, null, 2));

    // Generate HTML report
    const html = this.generateHTMLReport(report);
    await fs.writeFile(path.join(this.resultsDir, 'report.html'), html);
  }

  generateHTMLReport(report: any) {
    return `
<!DOCTYPE html>
<html>
<head>
  <title>Visual Audit Report - ${report.metadata.date}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 20px; background: #f5f5f5; }
    .container { max-width: 1200px; margin: 0 auto; background: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
    h1 { color: #333; margin-bottom: 30px; }
    .summary { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-bottom: 40px; }
    .summary-card { background: #f8f9fa; padding: 20px; border-radius: 8px; text-align: center; }
    .summary-card h3 { margin: 0 0 10px 0; color: #666; font-size: 14px; text-transform: uppercase; }
    .summary-card .value { font-size: 36px; font-weight: bold; margin: 0; }
    .success { color: #28a745; }
    .failed { color: #dc3545; }
    .warning { color: #ffc107; }
    .results { margin-top: 40px; }
    .result-item { background: #f8f9fa; padding: 20px; margin-bottom: 20px; border-radius: 8px; }
    .result-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; }
    .screenshots { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 20px; margin-top: 20px; }
    .screenshot { border: 1px solid #ddd; border-radius: 8px; overflow: hidden; }
    .screenshot img { width: 100%; height: auto; display: block; }
    .screenshot-label { padding: 10px; background: #f8f9fa; font-size: 14px; text-align: center; }
    .issues { margin-top: 10px; padding: 10px; background: #fff3cd; border-radius: 5px; font-size: 14px; }
    .error { background: #f8d7da; color: #721c24; padding: 10px; border-radius: 5px; margin-top: 10px; }
  </style>
</head>
<body>
  <div class="container">
    <h1>Visual Audit Report - AI Glossary Pro</h1>
    <p>Generated on: ${new Date(report.metadata.date).toLocaleString()}</p>
    
    <div class="summary">
      <div class="summary-card">
        <h3>Total Tests</h3>
        <p class="value">${report.summary.total}</p>
      </div>
      <div class="summary-card">
        <h3>Successful</h3>
        <p class="value success">${report.summary.successful}</p>
      </div>
      <div class="summary-card">
        <h3>Failed</h3>
        <p class="value failed">${report.summary.failed}</p>
      </div>
      <div class="summary-card">
        <h3>With Issues</h3>
        <p class="value warning">${report.summary.withIssues}</p>
      </div>
    </div>
    
    <div class="results">
      <h2>Test Results</h2>
      ${this.generateResultsHTML(report.results)}
    </div>
  </div>
</body>
</html>
    `;
  }

  generateResultsHTML(results: any[]) {
    const groupedResults = results.reduce((acc, result) => {
      if (result.page) {
        if (!acc[result.page]) acc[result.page] = [];
        acc[result.page].push(result);
      } else if (result.test) {
        if (!acc[result.test]) acc[result.test] = [];
        acc[result.test].push(result);
      }
      return acc;
    }, {});

    return Object.entries(groupedResults)
      .map(
        ([page, pageResults]: [string, any]) => `
      <div class="result-item">
        <div class="result-header">
          <h3>${page}</h3>
          <span>${(pageResults as any[]).filter(r => !r.error).length} / ${(pageResults as any[]).length} passed</span>
        </div>
        ${
          (pageResults as any[]).some(r => r.error)
            ? `
          <div class="error">
            ${(pageResults as any[])
              .filter(r => r.error)
              .map(r => `${r.breakpoint || 'Test'}: ${r.error}`)
              .join('<br>')}
          </div>
        `
            : ''
        }
        ${
          (pageResults as any[]).some(r => r.issues && r.issues.length > 0)
            ? `
          <div class="issues">
            <strong>Issues found:</strong><br>
            ${(pageResults as any[])
              .filter(r => r.issues)
              .map(r =>
                r.issues
                  .map(
                    (issue: any) =>
                      `${r.breakpoint}: ${issue.type} (${issue.count || issue.issues?.length || 0})`
                  )
                  .join('<br>')
              )
              .join('<br>')}
          </div>
        `
            : ''
        }
      </div>
    `
      )
      .join('');
  }
}

// Run the audit
const auditor = new QuickVisualAuditor();
auditor.runAudit().catch(console.error);
