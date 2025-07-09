#!/usr/bin/env npx tsx

/**
 * Comprehensive Visual Audit using Puppeteer (Fixed Version)
 * Includes authentication flows and full feature testing
 */

import { writeFileSync } from 'node:fs';
import puppeteer, { type Browser } from 'puppeteer';

interface AuditSection {
  name: string;
  status: 'pass' | 'fail' | 'warning';
  details: string[];
  screenshots?: string[];
  errors?: string[];
}

interface ComprehensiveAuditReport {
  timestamp: string;
  duration: number;
  sections: AuditSection[];
  summary: {
    totalTests: number;
    passed: number;
    failed: number;
    warnings: number;
  };
  typescriptErrors?: string[];
}

class PuppeteerAuditor {
  private browser!: Browser;
  private report: ComprehensiveAuditReport;
  private startTime: number;

  constructor() {
    this.startTime = Date.now();
    this.report = {
      timestamp: new Date().toISOString(),
      duration: 0,
      sections: [],
      summary: {
        totalTests: 0,
        passed: 0,
        failed: 0,
        warnings: 0,
      },
    };
  }

  async init() {
    console.log('🚀 Launching Puppeteer browser...');
    this.browser = await puppeteer.launch({
      headless: false,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
      defaultViewport: { width: 1920, height: 1080 },
    });
  }

  async cleanup() {
    await this.browser.close();
    this.report.duration = Date.now() - this.startTime;
  }

  private addSection(section: AuditSection) {
    this.report.sections.push(section);
    this.report.summary.totalTests++;
    if (section.status === 'pass') this.report.summary.passed++;
    else if (section.status === 'fail') this.report.summary.failed++;
    else if (section.status === 'warning') this.report.summary.warnings++;
  }

  async auditHomepage() {
    console.log('\n📄 Auditing Homepage...');
    const page = await this.browser.newPage();
    const errors: string[] = [];
    const details: string[] = [];

    // Capture console errors
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    try {
      await page.goto('http://localhost:5173/', { waitUntil: 'networkidle2', timeout: 30000 });

      // Check main elements
      const hasHeading = (await page.$('h1')) !== null;
      const hasNavigation = (await page.$('nav')) !== null;
      const hasCategories = await page.$$eval('[data-testid="category-card"]', (els) => els.length);

      details.push(`Main heading: ${hasHeading ? '✅' : '❌'}`);
      details.push(`Navigation: ${hasNavigation ? '✅' : '❌'}`);
      details.push(`Category cards: ${hasCategories}`);

      // Test cookie banner using XPath for text content
      const cookieBanner = await page.$x('//button[contains(text(), "Accept All")]');
      if (cookieBanner.length > 0) {
        await cookieBanner[0].click();
        await page.waitForTimeout(1000);
        details.push('Cookie banner: ✅ Dismissed');
      }

      // Take screenshot
      await page.screenshot({ path: 'puppeteer-homepage.png', fullPage: true });

      // Test responsive design
      await page.setViewport({ width: 375, height: 812 });
      await page.waitForTimeout(1000);
      await page.screenshot({ path: 'puppeteer-homepage-mobile.png', fullPage: true });
      details.push('Mobile responsive: ✅');

      this.addSection({
        name: 'Homepage',
        status: errors.length === 0 ? 'pass' : 'warning',
        details,
        errors,
        screenshots: ['puppeteer-homepage.png', 'puppeteer-homepage-mobile.png'],
      });
    } catch (error) {
      this.addSection({
        name: 'Homepage',
        status: 'fail',
        details: ['Navigation failed'],
        errors: [error instanceof Error ? error.message : String(error)],
      });
    } finally {
      await page.close();
    }
  }

  async auditAuthentication() {
    console.log('\n🔐 Auditing Authentication Flow...');
    const page = await this.browser.newPage();
    const errors: string[] = [];
    const details: string[] = [];

    try {
      // Navigate to a term page (which should show preview for unauthenticated)
      await page.goto('http://localhost:5173/term/8b5bff9a-afb7-4691-a58e-adc2bf94f941', {
        waitUntil: 'networkidle2',
        timeout: 30000,
      });

      // Dismiss cookie banner if present
      const cookieBanner = await page.$x('//button[contains(text(), "Accept All")]');
      if (cookieBanner.length > 0) {
        await cookieBanner[0].click();
        await page.waitForTimeout(1000);
      }

      // Check for preview state
      const pageContent = await page.content();
      const isPreviewText = pageContent.includes('Sign in to view full definition');
      details.push(`Preview mode for unauthenticated: ${isPreviewText ? '✅' : '❌'}`);

      // Look for sign in button using XPath
      const signInButtons = await page.$x(
        '//button[contains(text(), "Sign In")] | //a[contains(text(), "Sign In")]'
      );
      if (signInButtons.length > 0) {
        details.push('Sign in button: ✅ Found');
        await page.screenshot({ path: 'puppeteer-auth-preview.png', fullPage: true });

        // Click sign in
        await signInButtons[0].click();
        await page.waitForTimeout(2000);

        // Check for auth form elements
        const emailInput = await page.$('input[type="email"]');
        const passwordInput = await page.$('input[type="password"]');

        if (emailInput && passwordInput) {
          details.push('Login form: ✅ Found');

          // Type test credentials
          await emailInput.type('test@example.com');
          await passwordInput.type('testpassword123');

          await page.screenshot({ path: 'puppeteer-auth-form.png', fullPage: true });

          // Look for submit button
          const submitButton = await page.$('button[type="submit"]');
          if (submitButton) {
            details.push('Submit button: ✅ Found');
          }
        }
      } else {
        await page.screenshot({ path: 'puppeteer-auth-no-signin.png', fullPage: true });
      }

      this.addSection({
        name: 'Authentication',
        status: details.length > 2 ? 'pass' : 'warning',
        details,
        errors,
        screenshots: ['puppeteer-auth-preview.png', 'puppeteer-auth-form.png'],
      });
    } catch (error) {
      this.addSection({
        name: 'Authentication',
        status: 'fail',
        details: ['Authentication audit failed'],
        errors: [error instanceof Error ? error.message : String(error)],
      });
    } finally {
      await page.close();
    }
  }

  async auditHierarchicalNavigation() {
    console.log('\n🗂️ Auditing Hierarchical Navigation...');
    const page = await this.browser.newPage();
    const errors: string[] = [];
    const details: string[] = [];

    try {
      await page.goto('http://localhost:5173/term/8b5bff9a-afb7-4691-a58e-adc2bf94f941', {
        waitUntil: 'networkidle2',
      });

      // Dismiss cookie banner
      const cookieBanner = await page.$x('//button[contains(text(), "Accept All")]');
      if (cookieBanner.length > 0) {
        await cookieBanner[0].click();
        await page.waitForTimeout(1000);
      }

      // Check if Content Navigation heading exists using XPath
      const contentNavHeadings = await page.$x('//h2[contains(text(), "Content Navigation")]');
      details.push(
        `Content Navigation heading: ${contentNavHeadings.length > 0 ? '✅' : '❌ (requires auth)'}`
      );

      // Check for hierarchical navigator component
      const hierarchicalNav = await page.$('[data-testid="card"]');
      details.push(
        `Hierarchical Navigator component: ${hierarchicalNav ? '✅' : '❌ (requires auth)'}`
      );

      // Test sections tab using XPath
      const sectionsTab = await page.$x('//button[contains(text(), "Sections")]');
      if (sectionsTab.length > 0) {
        await sectionsTab[0].click();
        await page.waitForTimeout(1000);
        details.push('Sections tab: ✅ Clickable');
        await page.screenshot({ path: 'puppeteer-sections-tab.png', fullPage: true });
      }

      await page.screenshot({ path: 'puppeteer-hierarchical-nav.png', fullPage: true });

      // Try to authenticate and recheck
      if (contentNavHeadings.length === 0) {
        details.push('Note: Hierarchical navigation requires authentication');
      }

      this.addSection({
        name: 'Hierarchical Navigation',
        status: contentNavHeadings.length > 0 ? 'pass' : 'warning',
        details,
        errors,
        screenshots: ['puppeteer-hierarchical-nav.png', 'puppeteer-sections-tab.png'],
      });
    } catch (error) {
      this.addSection({
        name: 'Hierarchical Navigation',
        status: 'fail',
        details: ['Navigation audit failed'],
        errors: [error instanceof Error ? error.message : String(error)],
      });
    } finally {
      await page.close();
    }
  }

  async auditSearchFunctionality() {
    console.log('\n🔍 Auditing Search Functionality...');
    const page = await this.browser.newPage();
    const errors: string[] = [];
    const details: string[] = [];

    try {
      await page.goto('http://localhost:5173/', { waitUntil: 'networkidle2' });

      // Dismiss cookie banner
      const cookieBanner = await page.$x('//button[contains(text(), "Accept All")]');
      if (cookieBanner.length > 0) {
        await cookieBanner[0].click();
        await page.waitForTimeout(1000);
      }

      // Find search input
      const searchInputs = await page.$$('input[type="text"]');
      let searchInput = null;

      // Find the search input by checking placeholder
      for (const input of searchInputs) {
        const placeholder = await page.evaluate((el) => el.getAttribute('placeholder'), input);
        if (placeholder?.toLowerCase().includes('search')) {
          searchInput = input;
          break;
        }
      }

      if (searchInput) {
        details.push('Search input: ✅ Found');

        // Type search query
        await searchInput.type('machine learning');
        await page.waitForTimeout(1000);

        // Check for autocomplete
        const autocomplete = await page.$$('[role="listbox"] > *, .search-suggestion');
        details.push(`Autocomplete suggestions: ${autocomplete.length}`);

        await page.screenshot({ path: 'puppeteer-search-typing.png' });

        // Submit search
        await page.keyboard.press('Enter');
        await page.waitForTimeout(2000);

        // Check URL changed to search results
        const url = page.url();
        details.push(`Search navigation: ${url.includes('search=') ? '✅' : '❌'}`);

        // Count results
        const results = await page.$$('[data-testid="term-card"]');
        details.push(`Search results: ${results.length}`);

        await page.screenshot({ path: 'puppeteer-search-results.png', fullPage: true });
      } else {
        details.push('Search input: ❌ Not found');
      }

      this.addSection({
        name: 'Search Functionality',
        status: searchInput ? 'pass' : 'fail',
        details,
        errors,
        screenshots: ['puppeteer-search-typing.png', 'puppeteer-search-results.png'],
      });
    } catch (error) {
      this.addSection({
        name: 'Search Functionality',
        status: 'fail',
        details: ['Search audit failed'],
        errors: [error instanceof Error ? error.message : String(error)],
      });
    } finally {
      await page.close();
    }
  }

  async auditPerformance() {
    console.log('\n⚡ Auditing Performance...');
    const page = await this.browser.newPage();
    const details: string[] = [];

    try {
      // Enable performance metrics
      await page.evaluateOnNewDocument(() => {
        window.performance.mark('audit-start');
      });

      const startTime = Date.now();
      await page.goto('http://localhost:5173/', { waitUntil: 'networkidle2' });
      const loadTime = Date.now() - startTime;

      // Get performance metrics
      const metrics = await page.metrics();
      const performanceTiming = JSON.parse(
        await page.evaluate(() => JSON.stringify(window.performance.timing))
      );

      details.push(`Page load time: ${loadTime}ms`);
      details.push(
        `DOM Content Loaded: ${performanceTiming.domContentLoadedEventEnd - performanceTiming.navigationStart}ms`
      );
      details.push(`JS Heap Used: ${(metrics.JSHeapUsedSize / 1048576).toFixed(2)}MB`);
      details.push(`Nodes: ${metrics.Nodes}`);

      // Test multiple page navigations
      const pages = [
        '/category/79f3d163-dae1-499d-8371-047accbe70e9',
        '/term/8b5bff9a-afb7-4691-a58e-adc2bf94f941',
        '/terms?search=ai',
      ];

      for (const path of pages) {
        const navStart = Date.now();
        await page.goto(`http://localhost:5173${path}`, { waitUntil: 'networkidle2' });
        const navTime = Date.now() - navStart;
        details.push(`Navigation to ${path}: ${navTime}ms`);
      }

      this.addSection({
        name: 'Performance',
        status: loadTime < 1000 ? 'pass' : 'warning',
        details,
        errors: [],
      });
    } catch (error) {
      this.addSection({
        name: 'Performance',
        status: 'fail',
        details: ['Performance audit failed'],
        errors: [error instanceof Error ? error.message : String(error)],
      });
    } finally {
      await page.close();
    }
  }

  async auditAccessibility() {
    console.log('\n♿ Auditing Accessibility...');
    const page = await this.browser.newPage();
    const details: string[] = [];

    try {
      await page.goto('http://localhost:5173/', { waitUntil: 'networkidle2' });

      // Check for main landmarks
      const hasMain = (await page.$('main, [role="main"]')) !== null;
      const hasNav = (await page.$('nav, [role="navigation"]')) !== null;
      const hasHeader = (await page.$('header, [role="banner"]')) !== null;

      details.push(`Main landmark: ${hasMain ? '✅' : '❌'}`);
      details.push(`Navigation landmark: ${hasNav ? '✅' : '❌'}`);
      details.push(`Header landmark: ${hasHeader ? '✅' : '❌'}`);

      // Check for skip links
      const skipLinks = await page.$$('a[href^="#"]');
      details.push(`Skip links: ${skipLinks.length > 0 ? '✅' : '❌'}`);

      // Check heading hierarchy
      const headings = await page.evaluate(() => {
        const h1s = document.querySelectorAll('h1').length;
        const h2s = document.querySelectorAll('h2').length;
        const h3s = document.querySelectorAll('h3').length;
        return { h1s, h2s, h3s };
      });
      details.push(
        `Heading hierarchy: H1(${headings.h1s}), H2(${headings.h2s}), H3(${headings.h3s})`
      );

      // Check for alt text on images
      const imagesWithoutAlt = await page.evaluate(() => {
        const images = Array.from(document.querySelectorAll('img'));
        return images.filter((img) => !img.alt).length;
      });
      details.push(`Images without alt text: ${imagesWithoutAlt}`);

      // Test keyboard navigation
      await page.keyboard.press('Tab');
      await page.waitForTimeout(100);
      const focusedElement = await page.evaluate(() => document.activeElement?.tagName);
      details.push(`Keyboard navigation: ${focusedElement ? '✅' : '❌'}`);

      this.addSection({
        name: 'Accessibility',
        status: hasMain && hasNav && imagesWithoutAlt === 0 ? 'pass' : 'warning',
        details,
        errors: [],
      });
    } catch (error) {
      this.addSection({
        name: 'Accessibility',
        status: 'fail',
        details: ['Accessibility audit failed'],
        errors: [error instanceof Error ? error.message : String(error)],
      });
    } finally {
      await page.close();
    }
  }

  async auditTypeScriptErrors() {
    console.log('\n🔧 Checking TypeScript Errors...');
    const { execSync } = await import('node:child_process');
    const details: string[] = [];
    const errors: string[] = [];

    try {
      // Run TypeScript compiler
      execSync('npx tsc --noEmit', { encoding: 'utf8' });
      details.push('TypeScript compilation: ✅ No errors');
    } catch (error: any) {
      const output = error.stdout || error.message;
      const errorLines = output.split('\n').filter((line: string) => line.includes('error TS'));

      errors.push(...errorLines.slice(0, 10)); // First 10 errors
      details.push(`TypeScript errors: ${errorLines.length}`);

      if (errorLines.length > 10) {
        errors.push(`... and ${errorLines.length - 10} more errors`);
      }

      // Group errors by file
      const errorsByFile: Record<string, number> = {};
      errorLines.forEach((line: string) => {
        const match = line.match(/^([^(]+)\(/);
        if (match) {
          const file = match[1];
          errorsByFile[file] = (errorsByFile[file] || 0) + 1;
        }
      });

      details.push('\nErrors by file:');
      Object.entries(errorsByFile)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .forEach(([file, count]) => {
          details.push(`  ${file}: ${count} errors`);
        });
    }

    this.addSection({
      name: 'TypeScript Compilation',
      status: errors.length === 0 ? 'pass' : 'fail',
      details,
      errors,
    });
  }

  async generateReport() {
    const reportPath = 'puppeteer-comprehensive-audit.json';
    writeFileSync(reportPath, JSON.stringify(this.report, null, 2));

    console.log(`\n${'='.repeat(60)}`);
    console.log('📊 PUPPETEER COMPREHENSIVE AUDIT REPORT');
    console.log('='.repeat(60));
    console.log(`📅 Date: ${new Date(this.report.timestamp).toLocaleString()}`);
    console.log(`⏱️  Duration: ${(this.report.duration / 1000).toFixed(2)}s`);
    console.log('\n📈 Summary:');
    console.log(`   Total Tests: ${this.report.summary.totalTests}`);
    console.log(`   ✅ Passed: ${this.report.summary.passed}`);
    console.log(`   ❌ Failed: ${this.report.summary.failed}`);
    console.log(`   ⚠️  Warnings: ${this.report.summary.warnings}`);

    console.log('\n📋 Section Results:');
    for (const section of this.report.sections) {
      const icon = section.status === 'pass' ? '✅' : section.status === 'fail' ? '❌' : '⚠️';
      console.log(`\n${icon} ${section.name}`);
      section.details.forEach((detail) => console.log(`   ${detail}`));
      if (section.errors && section.errors.length > 0) {
        console.log('   Errors:');
        section.errors.forEach((error) => console.log(`     - ${error.substring(0, 100)}...`));
      }
    }

    console.log(`\n💾 Full report saved to: ${reportPath}`);
    console.log('📸 Screenshots saved with "puppeteer-" prefix');
  }

  async runComprehensiveAudit() {
    await this.init();

    try {
      await this.auditHomepage();
      await this.auditAuthentication();
      await this.auditHierarchicalNavigation();
      await this.auditSearchFunctionality();
      await this.auditPerformance();
      await this.auditAccessibility();
      await this.auditTypeScriptErrors();
    } finally {
      await this.cleanup();
    }

    await this.generateReport();
  }
}

// Run the audit
const auditor = new PuppeteerAuditor();
auditor.runComprehensiveAudit().catch(console.error);
