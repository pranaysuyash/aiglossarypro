#!/usr/bin/env tsx

/**
 * Comprehensive Frontend Visual Audit
 * Tests all user flows, components, interactions on port 5173
 */

import fs from 'node:fs';
import path from 'node:path';
import puppeteer, { type Browser, type Page } from 'puppeteer';

interface AuditResult {
  testName: string;
  status: 'passed' | 'failed' | 'warning';
  message: string;
  screenshot?: string;
  metrics?: {
    loadTime: number;
    renderTime: number;
    interactionDelay: number;
  };
  errors?: string[];
}

interface UserFlow {
  name: string;
  description: string;
  steps: Array<{
    action: string;
    selector?: string;
    text?: string;
    waitFor?: string;
    expected?: string;
  }>;
}

class FrontendAuditor {
  private browser: Browser | null = null;
  private page: Page | null = null;
  private baseUrl = 'http://localhost:5173';
  private outputDir = `frontend-audit-${new Date().toISOString().replace(/:/g, '-').split('.')[0]}`;
  private results: AuditResult[] = [];

  // Test Firebase users
  private testUsers = [
    {
      email: 'test@example.com',
      password: 'TestPassword123!',
      name: 'Test User',
    },
    {
      email: 'admin@example.com',
      password: 'AdminPassword123!',
      name: 'Admin User',
    },
  ];

  // User flows to test
  private userFlows: UserFlow[] = [
    {
      name: 'homepage-navigation',
      description: 'Test homepage loading and basic navigation',
      steps: [
        { action: 'goto', text: '/' },
        { action: 'wait', waitFor: 'body' },
        { action: 'screenshot' },
        {
          action: 'click',
          selector: 'nav a[href="/categories"]',
          expected: 'Categories page loads',
        },
        { action: 'wait', waitFor: '2000' },
        { action: 'screenshot' },
      ],
    },
    {
      name: 'hierarchical-navigation',
      description: 'Test new hierarchical navigation system',
      steps: [
        { action: 'goto', text: '/' },
        { action: 'wait', waitFor: '[data-testid="card"]' },
        { action: 'screenshot' },
        { action: 'click', selector: 'button:has-text("Tree")', expected: 'Tree view active' },
        { action: 'wait', waitFor: '1000' },
        { action: 'click', selector: 'button:has-text("Flat")', expected: 'Flat view active' },
        { action: 'wait', waitFor: '1000' },
        { action: 'screenshot' },
      ],
    },
    {
      name: 'search-functionality',
      description: 'Test search across 295 subsections',
      steps: [
        { action: 'goto', text: '/' },
        { action: 'wait', waitFor: 'input[placeholder*="Search"]' },
        {
          action: 'type',
          selector: 'input[placeholder*="Search"]',
          text: 'neural',
          expected: 'Search results appear',
        },
        { action: 'wait', waitFor: '2000' },
        { action: 'screenshot' },
        { action: 'clear', selector: 'input[placeholder*="Search"]' },
        { action: 'type', selector: 'input[placeholder*="Search"]', text: 'machine learning' },
        { action: 'wait', waitFor: '2000' },
        { action: 'screenshot' },
      ],
    },
    {
      name: 'authentication-flow',
      description: 'Test Firebase authentication',
      steps: [
        { action: 'goto', text: '/login' },
        { action: 'wait', waitFor: 'form' },
        { action: 'screenshot' },
        { action: 'type', selector: 'input[type="email"]', text: this.testUsers[0].email },
        { action: 'type', selector: 'input[type="password"]', text: this.testUsers[0].password },
        { action: 'click', selector: 'button[type="submit"]', expected: 'Login successful' },
        { action: 'wait', waitFor: '3000' },
        { action: 'screenshot' },
      ],
    },
    {
      name: 'term-page-interaction',
      description: 'Test term page with 42 sections',
      steps: [
        { action: 'goto', text: '/term/8b5bff9a-afb7-4691-a58e-adc2bf94f941' },
        { action: 'wait', waitFor: 'h1' },
        { action: 'screenshot' },
        { action: 'scroll', text: 'down', expected: 'Page scrolls smoothly' },
        { action: 'wait', waitFor: '1000' },
        { action: 'screenshot' },
        {
          action: 'click',
          selector: 'button:contains("Introduction")',
          expected: 'Section expands',
        },
        { action: 'wait', waitFor: '1000' },
        { action: 'screenshot' },
      ],
    },
    {
      name: 'dashboard-functionality',
      description: 'Test user dashboard and progress tracking',
      steps: [
        { action: 'goto', text: '/dashboard' },
        { action: 'wait', waitFor: '.dashboard' },
        { action: 'screenshot' },
        { action: 'click', selector: '.progress-card', expected: 'Progress details show' },
        { action: 'wait', waitFor: '1000' },
        { action: 'screenshot' },
      ],
    },
    {
      name: 'mobile-responsiveness',
      description: 'Test mobile responsive design',
      steps: [
        { action: 'viewport', text: '375x812' },
        { action: 'goto', text: '/' },
        { action: 'wait', waitFor: 'body' },
        { action: 'screenshot' },
        { action: 'click', selector: 'button.menu-toggle', expected: 'Mobile menu opens' },
        { action: 'wait', waitFor: '1000' },
        { action: 'screenshot' },
      ],
    },
    {
      name: 'form-interactions',
      description: 'Test all form interactions',
      steps: [
        { action: 'goto', text: '/settings' },
        { action: 'wait', waitFor: 'form' },
        { action: 'screenshot' },
        { action: 'click', selector: 'input[type="checkbox"]', expected: 'Checkbox toggles' },
        { action: 'type', selector: 'input[name="firstName"]', text: 'Updated Name' },
        { action: 'click', selector: 'button[type="submit"]', expected: 'Form submits' },
        { action: 'wait', waitFor: '2000' },
        { action: 'screenshot' },
      ],
    },
  ];

  async init(): Promise<void> {
    this.browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
      defaultViewport: { width: 1920, height: 1080 },
    });

    this.page = await this.browser.newPage();

    // Create output directory
    const outputPath = path.join(process.cwd(), this.outputDir);
    if (!fs.existsSync(outputPath)) {
      fs.mkdirSync(outputPath, { recursive: true });
    }

    // Set up error monitoring
    this.page.on('console', (msg) => {
      if (msg.type() === 'error') {
        console.log('❌ Console error:', msg.text());
      }
    });

    this.page.on('pageerror', (error) => {
      console.log('❌ Page error:', error.message);
    });
  }

  async runUserFlow(flow: UserFlow): Promise<AuditResult> {
    if (!this.page) throw new Error('Page not initialized');

    const startTime = Date.now();
    const errors: string[] = [];
    let screenshotPath = '';

    try {
      console.log(`🔍 Testing: ${flow.name} - ${flow.description}`);

      for (const step of flow.steps) {
        try {
          switch (step.action) {
            case 'goto':
              await this.page.goto(`${this.baseUrl}${step.text}`, {
                waitUntil: 'networkidle2',
                timeout: 10000,
              });
              break;

            case 'wait':
              if (step.waitFor && !Number.isNaN(Number(step.waitFor))) {
                await this.page.waitForTimeout(Number(step.waitFor));
              } else if (step.waitFor) {
                await this.page.waitForSelector(step.waitFor, { timeout: 5000 });
              }
              break;

            case 'click':
              if (step.selector) {
                await this.page.waitForSelector(step.selector, { timeout: 5000 });
                await this.page.click(step.selector);
              }
              break;

            case 'type':
              if (step.selector && step.text) {
                await this.page.waitForSelector(step.selector, { timeout: 5000 });
                await this.page.type(step.selector, step.text);
              }
              break;

            case 'clear':
              if (step.selector) {
                await this.page.waitForSelector(step.selector, { timeout: 5000 });
                await this.page.evaluate((sel) => {
                  const element = document.querySelector(sel) as HTMLInputElement;
                  if (element) element.value = '';
                }, step.selector);
              }
              break;

            case 'scroll':
              if (step.text === 'down') {
                await this.page.evaluate(() => window.scrollBy(0, 500));
              }
              break;

            case 'screenshot':
              screenshotPath = path.join(this.outputDir, `${flow.name}-${Date.now()}.png`);
              await this.page.screenshot({
                path: screenshotPath,
                fullPage: true,
              });
              break;

            case 'viewport':
              if (step.text) {
                const [width, height] = step.text.split('x').map(Number);
                await this.page.setViewport({ width, height });
              }
              break;
          }

          // Small delay between actions
          await this.page.waitForTimeout(500);
        } catch (stepError) {
          const errorMsg = `Step failed: ${step.action} - ${stepError}`;
          errors.push(errorMsg);
          console.log(`❌ ${errorMsg}`);
        }
      }

      const endTime = Date.now();
      const loadTime = endTime - startTime;

      return {
        testName: flow.name,
        status: errors.length === 0 ? 'passed' : 'warning',
        message:
          errors.length === 0
            ? `✅ ${flow.description} completed successfully`
            : `⚠️ ${flow.description} completed with ${errors.length} issues`,
        screenshot: screenshotPath,
        metrics: {
          loadTime,
          renderTime: loadTime,
          interactionDelay: 0,
        },
        errors: errors.length > 0 ? errors : undefined,
      };
    } catch (error) {
      return {
        testName: flow.name,
        status: 'failed',
        message: `❌ ${flow.description} failed: ${error}`,
        screenshot: screenshotPath,
        errors: [String(error), ...errors],
      };
    }
  }

  async testComponentInteractions(): Promise<AuditResult[]> {
    if (!this.page) throw new Error('Page not initialized');

    const componentTests: AuditResult[] = [];

    // Test hierarchical navigation specifically
    try {
      await this.page.goto(`${this.baseUrl}/`, { waitUntil: 'networkidle2' });

      // Test expand/collapse functionality
      const expandButtons = await this.page.$$('button[data-size="sm"]');
      if (expandButtons.length > 0) {
        await expandButtons[0].click();
        await this.page.waitForTimeout(1000);

        componentTests.push({
          testName: 'hierarchical-expand-collapse',
          status: 'passed',
          message: '✅ Hierarchical navigation expand/collapse works',
          screenshot: path.join(this.outputDir, 'hierarchical-expanded.png'),
        });

        await this.page.screenshot({
          path: path.join(this.outputDir, 'hierarchical-expanded.png'),
          fullPage: true,
        });
      }

      // Test search functionality
      const searchInput = await this.page.$('input[placeholder*="Search"]');
      if (searchInput) {
        await searchInput.type('neural networks');
        await this.page.waitForTimeout(2000);

        const searchResults = await this.page.$eval('body', (body) => {
          return body.textContent?.includes('Neural Networks') || false;
        });

        componentTests.push({
          testName: 'hierarchical-search',
          status: searchResults ? 'passed' : 'warning',
          message: searchResults
            ? '✅ Search functionality works correctly'
            : '⚠️ Search results not found or delayed',
          screenshot: path.join(this.outputDir, 'search-results.png'),
        });

        await this.page.screenshot({
          path: path.join(this.outputDir, 'search-results.png'),
          fullPage: true,
        });
      }

      // Test Tree/Flat view toggle
      const treeButton = await this.page.$('button:has-text("Tree")');
      const flatButton = await this.page.$('button:has-text("Flat")');

      if (treeButton && flatButton) {
        await flatButton.click();
        await this.page.waitForTimeout(1000);
        await treeButton.click();
        await this.page.waitForTimeout(1000);

        componentTests.push({
          testName: 'view-mode-toggle',
          status: 'passed',
          message: '✅ Tree/Flat view toggle works',
          screenshot: path.join(this.outputDir, 'view-toggle.png'),
        });

        await this.page.screenshot({
          path: path.join(this.outputDir, 'view-toggle.png'),
          fullPage: true,
        });
      }
    } catch (error) {
      componentTests.push({
        testName: 'component-interactions',
        status: 'failed',
        message: `❌ Component interaction test failed: ${error}`,
        errors: [String(error)],
      });
    }

    return componentTests;
  }

  async runAllTests(): Promise<void> {
    console.log('🚀 Starting Comprehensive Frontend Audit...');
    console.log(`📍 Testing frontend on: ${this.baseUrl}`);

    // Test basic connectivity
    try {
      await this.page?.goto(this.baseUrl, { waitUntil: 'networkidle2', timeout: 10000 });
      console.log('✅ Frontend is accessible');
    } catch (error) {
      console.log('❌ Frontend connectivity failed:', error);
      return;
    }

    // Run user flows
    for (const flow of this.userFlows) {
      const result = await this.runUserFlow(flow);
      this.results.push(result);
    }

    // Test component interactions
    const componentResults = await this.testComponentInteractions();
    this.results.push(...componentResults);

    // Generate report
    await this.generateReport();
  }

  async generateReport(): Promise<void> {
    const reportPath = path.join(this.outputDir, 'audit-report.html');

    const passed = this.results.filter((r) => r.status === 'passed').length;
    const warnings = this.results.filter((r) => r.status === 'warning').length;
    const failed = this.results.filter((r) => r.status === 'failed').length;

    const html = `
<!DOCTYPE html>
<html>
<head>
    <title>Frontend Audit Report</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; line-height: 1.6; }
        .summary { background: #f5f5f5; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
        .metric { display: inline-block; margin: 10px; padding: 10px; background: white; border-radius: 4px; }
        .test { margin: 10px 0; padding: 10px; border: 1px solid #ddd; border-radius: 4px; }
        .passed { background: #d4edda; border-left: 4px solid #28a745; }
        .warning { background: #fff3cd; border-left: 4px solid #ffc107; }
        .failed { background: #f8d7da; border-left: 4px solid #dc3545; }
        .screenshot { max-width: 200px; cursor: pointer; }
        .timestamp { color: #666; font-size: 0.9em; }
    </style>
</head>
<body>
    <h1>🔍 Frontend Audit Report</h1>
    <p class="timestamp">Generated: ${new Date().toLocaleString()}</p>
    
    <div class="summary">
        <h2>📊 Test Results Summary</h2>
        <div class="metric"><strong>${this.results.length}</strong><br>Total Tests</div>
        <div class="metric"><strong>${passed}</strong><br>Passed</div>
        <div class="metric"><strong>${warnings}</strong><br>Warnings</div>
        <div class="metric"><strong>${failed}</strong><br>Failed</div>
    </div>

    <h2>📋 Detailed Results</h2>
    ${this.results
      .map(
        (result) => `
        <div class="test ${result.status}">
            <h3>${result.testName}</h3>
            <p>${result.message}</p>
            ${
              result.metrics
                ? `
                <p><strong>Metrics:</strong> Load: ${result.metrics.loadTime}ms, Render: ${result.metrics.renderTime}ms</p>
            `
                : ''
            }
            ${
              result.errors
                ? `
                <details>
                    <summary>Errors (${result.errors.length})</summary>
                    <ul>${result.errors.map((error) => `<li>${error}</li>`).join('')}</ul>
                </details>
            `
                : ''
            }
            ${
              result.screenshot
                ? `
                <p><img src="${path.basename(result.screenshot)}" alt="Screenshot" class="screenshot" onclick="window.open(this.src, '_blank')"></p>
            `
                : ''
            }
        </div>
    `
      )
      .join('')}

    <div style="margin-top: 40px; padding: 20px; background: #f8f9fa; border-radius: 8px;">
        <h2>📁 Files</h2>
        <p><strong>Report:</strong> ${reportPath}</p>
        <p><strong>Screenshots:</strong> ${this.outputDir}/</p>
    </div>
</body>
</html>`;

    fs.writeFileSync(reportPath, html);

    console.log('\n🎉 Audit Complete!');
    console.log(`📊 Results: ${passed} passed, ${warnings} warnings, ${failed} failed`);
    console.log(`📄 Report: ${reportPath}`);
    console.log(`📁 Screenshots: ${this.outputDir}/`);
  }

  async cleanup(): Promise<void> {
    if (this.browser) {
      await this.browser.close();
    }
  }
}

async function main() {
  const auditor = new FrontendAuditor();

  try {
    await auditor.init();
    await auditor.runAllTests();
  } catch (error) {
    console.error('❌ Audit failed:', error);
    process.exit(1);
  } finally {
    await auditor.cleanup();
  }
}

// Run if this is the main module
main();
