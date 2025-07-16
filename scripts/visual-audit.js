/**
 * Comprehensive Visual Audit Script for AI Glossary Pro
 *
 * This script uses Playwright to:
 * 1. Test authentication flow with Firebase test users
 * 2. Navigate through all major components
 * 3. Take screenshots at different breakpoints
 * 4. Test button interactions, scrolling, and responsive design
 * 5. Generate a comprehensive audit report
 */

const { chromium, firefox, webkit } = require('playwright');
const fs = require('fs');
const path = require('path');

// Configuration
const BASE_URL = 'http://localhost:5173';
const AUDIT_DIR = path.join(__dirname, '../audit-results');
const SCREENSHOTS_DIR = path.join(AUDIT_DIR, 'screenshots');

// Test users from Firebase
const TEST_USERS = [
  {
    email: 'test@aimlglossary.com',
    password: 'testpass123',
    type: 'regular',
    name: 'Regular User',
  },
  {
    email: 'premium@aimlglossary.com',
    password: 'premiumpass123',
    type: 'premium',
    name: 'Premium User',
  },
  {
    email: 'admin@aimlglossary.com',
    password: 'adminpass123',
    type: 'admin',
    name: 'Admin User',
  },
];

// Viewport sizes to test
const VIEWPORTS = [
  { name: 'mobile', width: 375, height: 667 },
  { name: 'tablet', width: 768, height: 1024 },
  { name: 'laptop', width: 1366, height: 768 },
  { name: 'desktop', width: 1920, height: 1080 },
];

// Routes to test
const ROUTES = [
  { path: '/', name: 'landing-page', auth: false },
  { path: '/login', name: 'login-page', auth: false },
  { path: '/app', name: 'app-home', auth: true },
  { path: '/dashboard', name: 'dashboard', auth: true },
  { path: '/categories', name: 'categories', auth: true },
  { path: '/settings', name: 'settings', auth: true },
  { path: '/profile', name: 'profile', auth: true },
  { path: '/admin', name: 'admin', auth: 'admin' },
];

class VisualAuditor {
  constructor() {
    this.results = [];
    this.errors = [];
    this.screenshots = [];
    this.currentUser = null;
  }

  async init() {
    // Create audit directories
    if (!fs.existsSync(AUDIT_DIR)) {
      fs.mkdirSync(AUDIT_DIR, { recursive: true });
    }
    if (!fs.existsSync(SCREENSHOTS_DIR)) {
      fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
    }

    console.log('🚀 Starting comprehensive visual audit...');
    console.log(`📁 Results will be saved to: ${AUDIT_DIR}`);
  }

  async runFullAudit() {
    await this.init();

    // Test with Chromium (most common browser)
    const browser = await chromium.launch({ headless: false });

    try {
      // Test each viewport size
      for (const viewport of VIEWPORTS) {
        console.log(`\\n📱 Testing ${viewport.name} (${viewport.width}x${viewport.height})`);

        const context = await browser.newContext({
          viewport: { width: viewport.width, height: viewport.height },
          userAgent: this.getUserAgent(viewport.name),
        });

        const page = await context.newPage();

        // Enable console logging
        page.on('console', msg => {
          if (msg.type() === 'error') {
            this.errors.push({
              viewport: viewport.name,
              type: 'console-error',
              message: msg.text(),
              url: page.url(),
            });
          }
        });

        // Test unauthenticated flows
        await this.testUnauthenticatedFlow(page, viewport);

        // Test authenticated flows with each user type
        for (const user of TEST_USERS) {
          await this.testAuthenticatedFlow(page, viewport, user);
        }

        await context.close();
      }
    } catch (error) {
      console.error('❌ Audit failed:', error);
      this.errors.push({
        type: 'critical-error',
        message: error.message,
        stack: error.stack,
      });
    } finally {
      await browser.close();
    }

    await this.generateReport();
  }

  async testUnauthenticatedFlow(page, viewport) {
    console.log(`  🔓 Testing unauthenticated flow...`);

    try {
      // Test landing page
      await page.goto(BASE_URL);
      await page.waitForLoadState('networkidle');
      await this.takeScreenshot(page, 'landing-page', viewport);

      // Test responsive header on landing page
      await this.testHeaderResponsiveness(page, viewport, false);

      // Test hero section interactions
      await this.testHeroSection(page, viewport);

      // Test scroll behavior
      await this.testScrollBehavior(page, viewport);

      // Test login page
      await page.goto(`${BASE_URL}/login`);
      await page.waitForLoadState('networkidle');
      await this.takeScreenshot(page, 'login-page', viewport);

      // Test login form interactions
      await this.testLoginForm(page, viewport);
    } catch (error) {
      this.errors.push({
        viewport: viewport.name,
        flow: 'unauthenticated',
        error: error.message,
      });
    }
  }

  async testAuthenticatedFlow(page, viewport, user) {
    console.log(`  👤 Testing ${user.name} flow...`);

    try {
      // Login with test user
      await this.loginUser(page, user);

      // Test all authenticated routes
      for (const route of ROUTES) {
        if (
          !route.auth ||
          route.auth === true ||
          (route.auth === 'admin' && user.type === 'admin')
        ) {
          await page.goto(`${BASE_URL}${route.path}`);
          await page.waitForLoadState('networkidle');
          await this.takeScreenshot(page, `${route.name}-${user.type}`, viewport);

          // Test header responsiveness on authenticated pages
          if (route.path !== '/') {
            await this.testHeaderResponsiveness(page, viewport, true);
          }

          // Test specific page interactions
          await this.testPageInteractions(page, route, viewport, user);
        }
      }

      // Test logout flow
      await this.testLogout(page, viewport);
    } catch (error) {
      this.errors.push({
        viewport: viewport.name,
        user: user.name,
        flow: 'authenticated',
        error: error.message,
      });
    }
  }

  async loginUser(page, user) {
    await page.goto(`${BASE_URL}/login`);
    await page.waitForLoadState('networkidle');

    // Use test user tab if available
    if (await page.locator('[value="test"]').isVisible()) {
      await page.click('[value="test"]');

      // Find the correct test user button
      const userButtons = await page.locator('button:has-text("Use This Account")').all();
      for (const button of userButtons) {
        const text = await button.textContent();
        if (text && text.includes('Use This Account')) {
          const container = await button.locator('..').locator('..');
          const emailText = await container.textContent();
          if (emailText && emailText.includes(user.email)) {
            await button.click();
            break;
          }
        }
      }
    } else {
      // Manual login
      await page.fill('#email', user.email);
      await page.fill('#password', user.password);
    }

    // Switch to login tab and submit
    await page.click('[value="login"]');
    await page.click('button[type="submit"]:has-text("Sign In")');

    // Wait for redirect
    await page.waitForLoadState('networkidle');
    this.currentUser = user;
  }

  async testLogout(page, viewport) {
    try {
      // Test logout functionality
      if (viewport.width >= 1024) {
        // Desktop: use dropdown
        await page.click('[aria-label*="User menu"]');
        await page.click('text=Sign out');
      } else {
        // Mobile: use hamburger menu
        await page.click('[aria-label*="navigation menu"]');
        await page.click('text=Sign Out');
      }

      await page.waitForLoadState('networkidle');
      await this.takeScreenshot(page, 'after-logout', viewport);
    } catch (error) {
      this.errors.push({
        viewport: viewport.name,
        test: 'logout',
        error: error.message,
      });
    }
  }

  async testHeaderResponsiveness(page, viewport, authenticated) {
    try {
      const header = page.locator('header');
      await header.scrollIntoViewIfNeeded();

      // Test theme toggle visibility
      const themeToggle = page.locator('button[aria-label*="Switch to"]');
      const isThemeToggleVisible = await themeToggle.isVisible();

      this.results.push({
        viewport: viewport.name,
        test: 'header-theme-toggle',
        expected: viewport.width >= 768, // md breakpoint
        actual: isThemeToggleVisible,
        passed: viewport.width >= 768 === isThemeToggleVisible,
      });

      // Test surprise me button visibility
      const surpriseButton = page.locator('text=Surprise');
      const isSurpriseVisible = await surpriseButton.isVisible();

      this.results.push({
        viewport: viewport.name,
        test: 'header-surprise-button',
        expected: viewport.width >= 768, // md breakpoint
        actual: isSurpriseVisible,
        passed: viewport.width >= 768 === isSurpriseVisible,
      });

      // Test mobile menu
      if (viewport.width < 1024) {
        // lg breakpoint
        const mobileMenuButton = page.locator('[aria-label*="navigation menu"]');
        await mobileMenuButton.click();
        await page.waitForTimeout(500);
        await this.takeScreenshot(
          page,
          `mobile-menu-${authenticated ? 'auth' : 'unauth'}`,
          viewport
        );

        // Close mobile menu
        await page.press('body', 'Escape');
      }
    } catch (error) {
      this.errors.push({
        viewport: viewport.name,
        test: 'header-responsiveness',
        error: error.message,
      });
    }
  }

  async testHeroSection(page, viewport) {
    try {
      const heroSection = page.locator('section:has(h1:has-text("Master AI"))');
      if (await heroSection.isVisible()) {
        // Test CTA button
        const ctaButton = page.locator('text=Start for Free');
        await ctaButton.scrollIntoViewIfNeeded();
        await this.takeScreenshot(page, 'hero-section', viewport);

        // Test button interaction
        await ctaButton.hover();
        await page.waitForTimeout(300);
        await this.takeScreenshot(page, 'hero-cta-hover', viewport);
      }
    } catch (error) {
      this.errors.push({
        viewport: viewport.name,
        test: 'hero-section',
        error: error.message,
      });
    }
  }

  async testScrollBehavior(page, viewport) {
    try {
      // Test scroll through different sections
      const sections = [
        'section:has(h1:has-text("Master AI"))',
        'section:has(h2:has-text("Why Choose"))',
        'section:has(h2:has-text("Pricing"))',
      ];

      for (let i = 0; i < sections.length; i++) {
        const section = page.locator(sections[i]);
        if (await section.isVisible()) {
          await section.scrollIntoViewIfNeeded();
          await page.waitForTimeout(500);
          await this.takeScreenshot(page, `scroll-section-${i}`, viewport);
        }
      }
    } catch (error) {
      this.errors.push({
        viewport: viewport.name,
        test: 'scroll-behavior',
        error: error.message,
      });
    }
  }

  async testLoginForm(page, viewport) {
    try {
      // Test form tabs
      await page.click('[value="register"]');
      await page.waitForTimeout(300);
      await this.takeScreenshot(page, 'register-tab', viewport);

      await page.click('[value="login"]');
      await page.waitForTimeout(300);

      // Test password visibility toggle
      await page.fill('#password', 'testpassword');
      const passwordToggle = page.locator('[aria-label*="password"]');
      await passwordToggle.click();
      await page.waitForTimeout(300);
      await this.takeScreenshot(page, 'password-visible', viewport);
    } catch (error) {
      this.errors.push({
        viewport: viewport.name,
        test: 'login-form',
        error: error.message,
      });
    }
  }

  async testPageInteractions(page, route, viewport, user) {
    try {
      // Test search functionality if present
      const searchInput = page.locator('input[placeholder*="Search"]');
      if (await searchInput.isVisible()) {
        await searchInput.fill('neural network');
        await page.waitForTimeout(1000);
        await this.takeScreenshot(page, `${route.name}-search`, viewport);
        await searchInput.clear();
      }

      // Test navigation elements
      const navLinks = page.locator('nav a');
      const linkCount = await navLinks.count();

      this.results.push({
        viewport: viewport.name,
        route: route.name,
        user: user.type,
        test: 'navigation-links',
        count: linkCount,
      });
    } catch (error) {
      this.errors.push({
        viewport: viewport.name,
        route: route.name,
        test: 'page-interactions',
        error: error.message,
      });
    }
  }

  async takeScreenshot(page, name, viewport) {
    const filename = `${viewport.name}-${name}-${Date.now()}.png`;
    const filepath = path.join(SCREENSHOTS_DIR, filename);

    await page.screenshot({
      path: filepath,
      fullPage: true,
      quality: 80,
    });

    this.screenshots.push({
      name,
      viewport: viewport.name,
      filename,
      filepath,
      timestamp: new Date().toISOString(),
    });
  }

  getUserAgent(viewportName) {
    const userAgents = {
      mobile:
        'Mozilla/5.0 (iPhone; CPU iPhone OS 14_7_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.2 Mobile/15E148 Safari/604.1',
      tablet:
        'Mozilla/5.0 (iPad; CPU OS 14_7_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.2 Mobile/15E148 Safari/604.1',
      laptop:
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      desktop:
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
    };
    return userAgents[viewportName] || userAgents.desktop;
  }

  async generateReport() {
    const timestamp = new Date().toISOString();

    const report = {
      audit: {
        timestamp,
        version: '1.0.0',
        baseUrl: BASE_URL,
      },
      summary: {
        totalTests: this.results.length,
        passed: this.results.filter(r => r.passed !== false).length,
        failed: this.results.filter(r => r.passed === false).length,
        errors: this.errors.length,
        screenshots: this.screenshots.length,
      },
      results: this.results,
      errors: this.errors,
      screenshots: this.screenshots,
      recommendations: this.generateRecommendations(),
    };

    // Save JSON report
    const reportPath = path.join(AUDIT_DIR, `audit-report-${Date.now()}.json`);
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

    // Generate HTML report
    await this.generateHTMLReport(report);

    console.log('\\n✅ Audit completed!');
    console.log(
      `📊 Results: ${report.summary.passed} passed, ${report.summary.failed} failed, ${report.summary.errors} errors`
    );
    console.log(`📷 Screenshots: ${report.summary.screenshots} taken`);
    console.log(`📄 Report saved to: ${reportPath}`);
  }

  generateRecommendations() {
    const recommendations = [];

    // Analyze responsive design issues
    const responsiveIssues = this.results.filter(r => r.test.includes('header') && !r.passed);
    if (responsiveIssues.length > 0) {
      recommendations.push({
        category: 'Responsive Design',
        priority: 'high',
        issue: 'Header elements not responding correctly to viewport changes',
        solution: 'Review Tailwind breakpoints and ensure proper responsive utilities',
      });
    }

    // Analyze error patterns
    const authErrors = this.errors.filter(e => e.flow === 'authenticated');
    if (authErrors.length > 0) {
      recommendations.push({
        category: 'Authentication',
        priority: 'critical',
        issue: 'Authentication flow errors detected',
        solution: 'Review Firebase authentication implementation and error handling',
      });
    }

    // Performance recommendations
    if (this.errors.some(e => e.type === 'console-error')) {
      recommendations.push({
        category: 'Performance',
        priority: 'medium',
        issue: 'Console errors detected during testing',
        solution: 'Review and fix JavaScript errors in browser console',
      });
    }

    return recommendations;
  }

  async generateHTMLReport(report) {
    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>AI Glossary Pro - Visual Audit Report</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 20px; background: #f5f5f5; }
        .container { max-width: 1200px; margin: 0 auto; background: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .header { border-bottom: 2px solid #e2e8f0; padding-bottom: 20px; margin-bottom: 30px; }
        .summary { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-bottom: 30px; }
        .metric { background: #f8fafc; padding: 20px; border-radius: 6px; text-align: center; }
        .metric h3 { margin: 0 0 10px 0; color: #334155; }
        .metric .value { font-size: 2em; font-weight: bold; color: #0f172a; }
        .passed { color: #16a34a; }
        .failed { color: #dc2626; }
        .section { margin: 30px 0; }
        .section h2 { color: #1e293b; border-bottom: 1px solid #e2e8f0; padding-bottom: 10px; }
        .error { background: #fef2f2; border: 1px solid #fecaca; padding: 15px; border-radius: 6px; margin: 10px 0; }
        .recommendation { background: #eff6ff; border: 1px solid #bfdbfe; padding: 15px; border-radius: 6px; margin: 10px 0; }
        .screenshots { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 20px; }
        .screenshot { border: 1px solid #e2e8f0; border-radius: 6px; overflow: hidden; }
        .screenshot img { width: 100%; height: auto; display: block; }
        .screenshot-info { padding: 10px; background: #f8fafc; font-size: 0.9em; color: #64748b; }
        .priority-critical { border-left: 4px solid #dc2626; }
        .priority-high { border-left: 4px solid #ea580c; }
        .priority-medium { border-left: 4px solid #ca8a04; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🚀 AI Glossary Pro - Visual Audit Report</h1>
            <p><strong>Generated:</strong> ${report.audit.timestamp}</p>
            <p><strong>Base URL:</strong> ${report.audit.baseUrl}</p>
        </div>

        <div class="summary">
            <div class="metric">
                <h3>Total Tests</h3>
                <div class="value">${report.summary.totalTests}</div>
            </div>
            <div class="metric">
                <h3>Passed</h3>
                <div class="value passed">${report.summary.passed}</div>
            </div>
            <div class="metric">
                <h3>Failed</h3>
                <div class="value failed">${report.summary.failed}</div>
            </div>
            <div class="metric">
                <h3>Errors</h3>
                <div class="value">${report.summary.errors}</div>
            </div>
            <div class="metric">
                <h3>Screenshots</h3>
                <div class="value">${report.summary.screenshots}</div>
            </div>
        </div>

        <div class="section">
            <h2>🎯 Recommendations</h2>
            ${report.recommendations
              .map(
                rec => `
                <div class="recommendation priority-${rec.priority}">
                    <h4>${rec.category} (${rec.priority.toUpperCase()})</h4>
                    <p><strong>Issue:</strong> ${rec.issue}</p>
                    <p><strong>Solution:</strong> ${rec.solution}</p>
                </div>
            `
              )
              .join('')}
        </div>

        ${
          report.errors.length > 0
            ? `
        <div class="section">
            <h2>❌ Errors</h2>
            ${report.errors
              .map(
                error => `
                <div class="error">
                    <strong>${error.type || 'Error'}:</strong> ${error.message}
                    ${error.viewport ? `<br><small>Viewport: ${error.viewport}</small>` : ''}
                </div>
            `
              )
              .join('')}
        </div>
        `
            : ''
        }

        <div class="section">
            <h2>📷 Screenshots</h2>
            <div class="screenshots">
                ${report.screenshots
                  .map(
                    screenshot => `
                    <div class="screenshot">
                        <img src="screenshots/${screenshot.filename}" alt="${screenshot.name}">
                        <div class="screenshot-info">
                            <strong>${screenshot.name}</strong><br>
                            ${screenshot.viewport} • ${new Date(screenshot.timestamp).toLocaleTimeString()}
                        </div>
                    </div>
                `
                  )
                  .join('')}
            </div>
        </div>
    </div>
</body>
</html>`;

    const htmlPath = path.join(AUDIT_DIR, 'audit-report.html');
    fs.writeFileSync(htmlPath, html);
    console.log(`📄 HTML report saved to: ${htmlPath}`);
  }
}

// Run the audit
async function main() {
  console.log('🔍 AI Glossary Pro - Comprehensive Visual Audit');
  console.log('===============================================\\n');

  const auditor = new VisualAuditor();
  await auditor.runFullAudit();
}

// Handle script execution
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { VisualAuditor };
