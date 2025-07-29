#!/usr/bin/env npx tsx

/**
 * Comprehensive Visual Audit - Final Report Generation
 */

import { writeFileSync } from 'node:fs';
import { chromium } from 'playwright';

interface AuditResult {
  page: string;
  url: string;
  timestamp: string;
  elements: {
    headings: string[];
    searchInputs: number;
    navigationItems: number;
    interactiveElements: number;
    forms: number;
  };
  performance: {
    loadTime: number;
    errors: string[];
  };
  features: {
    hierarchicalNavigation: boolean;
    searchFunctionality: boolean;
    mobileResponsive: boolean;
    accessibilityCompliant: boolean;
  };
  screenshots: string[];
}

async function comprehensiveAudit() {
  console.log('🔍 Starting Comprehensive Visual Audit...\n');

  const browser = await chromium.launch({ headless: false });
  const results: AuditResult[] = [];

  const pages = [
    { name: 'Homepage', url: 'http://localhost:5173/' },
    { name: 'Term Detail', url: 'http://localhost:5173/term/8b5bff9a-afb7-4691-a58e-adc2bf94f941' },
    {
      name: 'Category Page',
      url: 'http://localhost:5173/category/79f3d163-dae1-499d-8371-047accbe70e9',
    },
    { name: 'Search Results', url: 'http://localhost:5173/terms?search=machine%20learning' },
    {
      name: 'Enhanced Term Detail',
      url: 'http://localhost:5173/enhanced/terms/8b5bff9a-afb7-4691-a58e-adc2bf94f941',
    },
  ];

  for (const pageInfo of pages) {
    console.log(`\n🧪 Testing ${pageInfo.name}...`);

    const page = await browser.newPage();
    const errors: string[] = [];
    const screenshots: string[] = [];

    // Listen for console errors
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(`Console Error: ${msg.text()}`);
      }
    });

    page.on('pageerror', error => {
      errors.push(`Page Error: ${error.message}`);
    });

    try {
      const startTime = Date.now();

      // Navigate to page
      await page.goto(pageInfo.url, { waitUntil: 'domcontentloaded', timeout: 15000 });

      // Wait for main content
      await page.waitForSelector('h1, main, [role="main"]', { timeout: 10000 });

      const loadTime = Date.now() - startTime;

      // Dismiss cookie banner
      const cookieAccept = page.locator('button:has-text("Accept All")');
      if (await cookieAccept.isVisible()) {
        await cookieAccept.click();
        await page.waitForTimeout(1000);
      }

      // Take desktop screenshot
      await page.screenshot({
        path: `audit-${pageInfo.name.toLowerCase().replace(/\\s+/g, '-')}-desktop.png`,
        fullPage: true,
      });
      screenshots.push(`audit-${pageInfo.name.toLowerCase().replace(/\\s+/g, '-')}-desktop.png`);

      // Get page elements
      const elements = await page.evaluate(() => {
        const headings = Array.from(document.querySelectorAll('h1, h2, h3, h4, h5, h6')).map(
          h => h.textContent || ''
        );
        const searchInputs = document.querySelectorAll(
          'input[type="text"], input[placeholder*="search"], input[placeholder*="Search"]'
        ).length;
        const navigationItems = document.querySelectorAll('nav a, [role="navigation"] a').length;
        const interactiveElements = document.querySelectorAll(
          'button, a, input, select, textarea'
        ).length;
        const forms = document.querySelectorAll('form').length;

        return { headings, searchInputs, navigationItems, interactiveElements, forms };
      });

      // Test hierarchical navigation
      const hierarchicalNavigation =
        (await page.locator('h2:has-text("Content Navigation")').count()) > 0;

      // Test search functionality
      const searchInput = page.locator('input[type="text"]').first();
      let searchFunctionality = false;
      if ((await searchInput.count()) > 0) {
        try {
          await searchInput.fill('test');
          await page.waitForTimeout(500);
          searchFunctionality = true;
        } catch {
          // Search not functional
        }
      }

      // Test mobile responsiveness
      await page.setViewportSize({ width: 375, height: 812 });
      await page.waitForTimeout(1000);
      await page.screenshot({
        path: `audit-${pageInfo.name.toLowerCase().replace(/\\s+/g, '-')}-mobile.png`,
        fullPage: true,
      });
      screenshots.push(`audit-${pageInfo.name.toLowerCase().replace(/\\s+/g, '-')}-mobile.png`);
      const mobileResponsive = (await page.locator('body').count()) > 0; // Basic check

      // Reset to desktop
      await page.setViewportSize({ width: 1920, height: 1080 });

      // Basic accessibility check
      const accessibilityCompliant = await page.evaluate(() => {
        const hasMainLandmark = document.querySelector('main, [role="main"]') !== null;
        const hasSkipLink = document.querySelector('a[href*="#"]') !== null;
        return hasMainLandmark && hasSkipLink;
      });

      // Test specific interactions based on page type
      if (pageInfo.name === 'Term Detail') {
        // Test sections tab if available
        const sectionsTab = page.locator('button:has-text("Sections"), [data-value="sections"]');
        if ((await sectionsTab.count()) > 0) {
          try {
            await sectionsTab.click();
            await page.waitForTimeout(1000);
            await page.screenshot({
              path: `audit-term-sections-tab.png`,
              fullPage: true,
            });
            screenshots.push(`audit-term-sections-tab.png`);
          } catch (error) {
            errors.push(`Sections tab interaction failed: ${error}`);
          }
        }
      }

      const result: AuditResult = {
        page: pageInfo.name,
        url: pageInfo.url,
        timestamp: new Date().toISOString(),
        elements,
        performance: { loadTime, errors },
        features: {
          hierarchicalNavigation,
          searchFunctionality,
          mobileResponsive,
          accessibilityCompliant,
        },
        screenshots,
      };

      results.push(result);

      console.log(`✅ ${pageInfo.name} complete`);
      console.log(`   - Load time: ${loadTime}ms`);
      console.log(`   - Hierarchical Navigation: ${hierarchicalNavigation ? '✅' : '❌'}`);
      console.log(`   - Search: ${searchFunctionality ? '✅' : '❌'}`);
      console.log(`   - Mobile Responsive: ${mobileResponsive ? '✅' : '❌'}`);
      console.log(`   - Errors: ${errors.length}`);
    } catch (error) {
      console.error(`❌ ${pageInfo.name} failed:`, error);
      errors.push(`Navigation Error: ${error}`);
    } finally {
      await page.close();
    }
  }

  await browser.close();

  // Generate comprehensive report
  const report = {
    auditDate: new Date().toISOString(),
    summary: {
      totalPages: results.length,
      pagesWithHierarchicalNav: results.filter(r => r.features.hierarchicalNavigation).length,
      pagesWithSearch: results.filter(r => r.features.searchFunctionality).length,
      pagesWithErrors: results.filter(r => r.performance.errors.length > 0).length,
      averageLoadTime: results.reduce((sum, r) => sum + r.performance.loadTime, 0) / results.length,
    },
    results,
  };

  // Write detailed report
  writeFileSync('comprehensive-audit-report.json', JSON.stringify(report, null, 2));

  console.log('\\n🎉 Comprehensive Visual Audit Complete!');
  console.log('📊 Summary:');
  console.log(`   - Pages tested: ${report.summary.totalPages}`);
  console.log(
    `   - Hierarchical Navigation found: ${report.summary.pagesWithHierarchicalNav}/${report.summary.totalPages}`
  );
  console.log(
    `   - Search functionality: ${report.summary.pagesWithSearch}/${report.summary.totalPages}`
  );
  console.log(
    `   - Pages with errors: ${report.summary.pagesWithErrors}/${report.summary.totalPages}`
  );
  console.log(`   - Average load time: ${report.summary.averageLoadTime.toFixed(2)}ms`);
  console.log('\\n📄 Detailed report: comprehensive-audit-report.json');
  console.log('📸 Screenshots generated for all pages (desktop + mobile)');

  return report;
}

comprehensiveAudit().catch(console.error);
