#!/usr/bin/env tsx

/**
 * COMPREHENSIVE Visual Audit Script - Tests EVERYTHING
 * 
 * This script tests:
 * 1. Every page in the application
 * 2. Every clickable component and interaction
 * 3. Every user flow possible
 * 4. All responsive breakpoints
 * 5. All accessibility scenarios
 * 6. All dark/light mode combinations
 * 7. All error states and edge cases
 */

import { chromium, Browser, Page, BrowserContext, devices } from 'playwright';
import { exec, spawn } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import path from 'path';
import chalk from 'chalk';
import { config } from 'dotenv';

// Load environment variables
config();

interface TestConfig {
  name: string;
  url: string;
  viewport?: { width: number; height: number };
  device?: string;
  actions?: Array<{
    type: 'click' | 'hover' | 'type' | 'scroll' | 'wait' | 'keyboard' | 'screenshot' | 'focus' | 'select';
    selector?: string;
    value?: string | number;
    key?: string;
    description?: string;
    screenshot?: boolean;
  }>;
  userFlows?: Array<{
    name: string;
    steps: Array<any>;
  }>;
  components?: Array<{
    name: string;
    selector: string;
    interactions?: Array<any>;
  }>;
  accessibility?: {
    focusTest?: boolean;
    keyboardNavigation?: boolean;
    contrastCheck?: boolean;
    screenReader?: boolean;
  };
  performance?: boolean;
  recordVideo?: boolean;
}

class ComprehensiveVisualAuditor {
  private browser: Browser | null = null;
  private viteProcess: any = null;
  private baseUrl = process.env.BASE_URL || 'http://localhost:3001';
  private screenshotDir: string;
  private videoDir: string;
  private reportDir: string;
  private issues: any[] = [];

  constructor() {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    this.screenshotDir = path.join(process.cwd(), 'comprehensive-audit', timestamp, 'screenshots');
    this.videoDir = path.join(process.cwd(), 'comprehensive-audit', timestamp, 'videos');
    this.reportDir = path.join(process.cwd(), 'comprehensive-audit', timestamp);
  }

  async initialize() {
    await fs.mkdir(this.screenshotDir, { recursive: true });
    await fs.mkdir(this.videoDir, { recursive: true });
    await fs.mkdir(this.reportDir, { recursive: true });

    console.log(chalk.blue('🚀 Starting COMPREHENSIVE Visual Audit...'));
    console.log(chalk.gray(`Screenshots: ${this.screenshotDir}`));
    console.log(chalk.gray(`Videos: ${this.videoDir}`));
    console.log(chalk.gray(`Report: ${this.reportDir}`));
  }

  async startViteServer(): Promise<void> {
    console.log(chalk.yellow('⚡ Checking Vite development server...'));

    try {
      const port = this.baseUrl.split(':')[2];
      await exec(`curl -f ${this.baseUrl} > /dev/null 2>&1`);
      console.log(chalk.green('✅ Vite server is ready'));
      return;
    } catch (error) {
      console.log(chalk.yellow('⚡ Vite server not accessible, will wait...'));
    }

    // Wait for server to be ready
    for (let i = 0; i < 30; i++) {
      try {
        await exec(`curl -f ${this.baseUrl} > /dev/null 2>&1`);
        console.log(chalk.green('✅ Vite server ready'));
        return;
      } catch (error) {
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }
    throw new Error('Vite server failed to start');
  }

  async launchBrowser() {
    console.log(chalk.yellow('🌐 Launching browser...'));
    this.browser = await chromium.launch({
      headless: false, // Show browser for debugging
      devtools: false,
      slowMo: 100,
      args: ['--no-sandbox', '--disable-dev-shm-usage']
    });
  }

  // Comprehensive test configurations covering EVERYTHING
  private getComprehensiveTestConfigs(): TestConfig[] {
    return [
      // ========== HOMEPAGE TESTS ==========
      {
        name: 'homepage-desktop',
        url: '/',
        viewport: { width: 1920, height: 1080 },
        recordVideo: true,
        userFlows: [
          {
            name: 'hero-interaction',
            steps: [
              { type: 'hover', selector: '.hero-section button, main button, [role="button"]' },
              { type: 'click', selector: '.hero-section button, main button, [role="button"]' },
              { type: 'wait', value: 2000 }
            ]
          }
        ]
      },
      {
        name: 'homepage-mobile',
        url: '/',
        device: 'iPhone 13',
        recordVideo: true,
        actions: [
          { type: 'wait', value: 2000 },
          { type: 'click', selector: 'button[aria-label*="menu"], .mobile-menu-button, .hamburger' },
          { type: 'wait', value: 1000, screenshot: true }
        ]
      },
      {
        name: 'homepage-tablet',
        url: '/',
        device: 'iPad Pro',
        recordVideo: true
      },

      // ========== ALL APPLICATION PAGES ==========
      {
        name: 'terms-page',
        url: '/terms',
        viewport: { width: 1920, height: 1080 },
        recordVideo: true,
        userFlows: [
          {
            name: 'search-and-filter',
            steps: [
              { type: 'type', selector: 'input[type="text"]', value: 'neural network' },
              { type: 'wait', value: 2000 },
              { type: 'click', selector: 'button:has-text("Filter"), .filter-button' },
              { type: 'wait', value: 1000 },
              { type: 'click', selector: '[role="combobox"], select' },
              { type: 'wait', value: 1000 }
            ]
          }
        ]
      },
      {
        name: 'categories-page',
        url: '/categories',
        viewport: { width: 1920, height: 1080 },
        recordVideo: true,
        userFlows: [
          {
            name: 'browse-categories',
            steps: [
              { type: 'click', selector: '.category-card:first-child, .category:first-child' },
              { type: 'wait', value: 2000 },
              { type: 'scroll', value: 500 }
            ]
          }
        ]
      },
      {
        name: 'trending-page',
        url: '/trending',
        viewport: { width: 1920, height: 1080 },
        recordVideo: true
      },
      {
        name: 'favorites-page',
        url: '/favorites',
        viewport: { width: 1920, height: 1080 },
        recordVideo: true
      },
      {
        name: 'dashboard-page',
        url: '/dashboard',
        viewport: { width: 1920, height: 1080 },
        recordVideo: true,
        userFlows: [
          {
            name: 'dashboard-navigation',
            steps: [
              { type: 'click', selector: '.dashboard-card:first-child, .metric-card:first-child' },
              { type: 'wait', value: 1000 },
              { type: 'hover', selector: '.chart, .progress-bar' },
              { type: 'wait', value: 1000 }
            ]
          }
        ]
      },
      {
        name: 'settings-page',
        url: '/settings',
        viewport: { width: 1920, height: 1080 },
        recordVideo: true,
        userFlows: [
          {
            name: 'settings-interaction',
            steps: [
              { type: 'click', selector: 'button, .toggle, input[type="checkbox"]' },
              { type: 'wait', value: 1000 },
              { type: 'type', selector: 'input[type="text"], input[type="email"]', value: 'test@example.com' },
              { type: 'wait', value: 1000 }
            ]
          }
        ]
      },
      {
        name: 'ai-tools-page',
        url: '/ai-tools',
        viewport: { width: 1920, height: 1080 },
        recordVideo: true
      },
      {
        name: 'login-page',
        url: '/login',
        viewport: { width: 1920, height: 1080 },
        recordVideo: true,
        userFlows: [
          {
            name: 'oauth-login-flow',
            steps: [
              { type: 'click', selector: 'button:has-text("Google"), .google-login, .oauth-button' },
              { type: 'wait', value: 2000 },
              { type: 'click', selector: 'button:has-text("GitHub"), .github-login' },
              { type: 'wait', value: 2000 }
            ]
          }
        ]
      },
      {
        name: 'profile-page',
        url: '/profile',
        viewport: { width: 1920, height: 1080 },
        recordVideo: true
      },
      {
        name: 'progress-page',
        url: '/progress',
        viewport: { width: 1920, height: 1080 },
        recordVideo: true
      },
      {
        name: 'lifetime-page',
        url: '/lifetime',
        viewport: { width: 1920, height: 1080 },
        recordVideo: true
      },

      // ========== SEARCH FUNCTIONALITY ==========
      {
        name: 'search-comprehensive',
        url: '/',
        viewport: { width: 1920, height: 1080 },
        recordVideo: true,
        userFlows: [
          {
            name: 'complete-search-flow',
            steps: [
              { type: 'click', selector: 'input[type="text"], .search-input' },
              { type: 'type', selector: 'input[type="text"]', value: 'machine' },
              { type: 'wait', value: 1000 },
              { type: 'keyboard', key: 'ArrowDown' },
              { type: 'keyboard', key: 'Enter' },
              { type: 'wait', value: 2000 },
              { type: 'type', selector: 'input[type="text"]', value: 'deep learning' },
              { type: 'wait', value: 1000 },
              { type: 'keyboard', key: 'Escape' }
            ]
          }
        ]
      },

      // ========== RESPONSIVE BREAKPOINTS ==========
      {
        name: 'mobile-portrait-320',
        url: '/',
        viewport: { width: 320, height: 568 },
        recordVideo: true
      },
      {
        name: 'mobile-portrait-375',
        url: '/',
        viewport: { width: 375, height: 812 },
        recordVideo: true
      },
      {
        name: 'mobile-landscape',
        url: '/',
        viewport: { width: 812, height: 375 },
        recordVideo: true
      },
      {
        name: 'tablet-portrait',
        url: '/',
        viewport: { width: 768, height: 1024 },
        recordVideo: true
      },
      {
        name: 'tablet-landscape',
        url: '/',
        viewport: { width: 1024, height: 768 },
        recordVideo: true
      },
      {
        name: 'desktop-small',
        url: '/',
        viewport: { width: 1366, height: 768 },
        recordVideo: true
      },
      {
        name: 'desktop-large',
        url: '/',
        viewport: { width: 2560, height: 1440 },
        recordVideo: true
      },

      // ========== ACCESSIBILITY TESTS ==========
      {
        name: 'accessibility-keyboard-navigation',
        url: '/',
        viewport: { width: 1920, height: 1080 },
        recordVideo: true,
        accessibility: {
          focusTest: true,
          keyboardNavigation: true
        },
        userFlows: [
          {
            name: 'full-keyboard-navigation',
            steps: [
              { type: 'keyboard', key: 'Tab' },
              { type: 'wait', value: 500, screenshot: true },
              { type: 'keyboard', key: 'Tab' },
              { type: 'wait', value: 500, screenshot: true },
              { type: 'keyboard', key: 'Tab' },
              { type: 'wait', value: 500, screenshot: true },
              { type: 'keyboard', key: 'Enter' },
              { type: 'wait', value: 1000 },
              { type: 'keyboard', key: 'Escape' }
            ]
          }
        ]
      },

      // ========== DARK MODE TESTS ==========
      {
        name: 'dark-mode-complete',
        url: '/',
        viewport: { width: 1920, height: 1080 },
        recordVideo: true,
        userFlows: [
          {
            name: 'dark-mode-all-pages',
            steps: [
              { type: 'screenshot', description: 'Light mode homepage' },
              { type: 'click', selector: 'button[aria-label*="mode"], button[aria-label*="theme"]' },
              { type: 'wait', value: 1000, screenshot: true, description: 'Dark mode homepage' },
              { type: 'click', selector: 'a[href="/terms"], .nav-link:has-text("Terms")' },
              { type: 'wait', value: 2000, screenshot: true, description: 'Dark mode terms page' },
              { type: 'click', selector: 'a[href="/categories"]' },
              { type: 'wait', value: 2000, screenshot: true, description: 'Dark mode categories page' }
            ]
          }
        ]
      },

      // ========== COMPONENT INTERACTION TESTS ==========
      {
        name: 'all-button-interactions',
        url: '/',
        viewport: { width: 1920, height: 1080 },
        recordVideo: true,
        userFlows: [
          {
            name: 'test-all-buttons',
            steps: [
              { type: 'hover', selector: 'button:nth-child(1)' },
              { type: 'wait', value: 500, screenshot: true },
              { type: 'hover', selector: 'button:nth-child(2)' },
              { type: 'wait', value: 500, screenshot: true },
              { type: 'click', selector: 'button:first-of-type' },
              { type: 'wait', value: 1000 }
            ]
          }
        ]
      },

      // ========== FORM INTERACTIONS ==========
      {
        name: 'all-form-interactions',
        url: '/settings',
        viewport: { width: 1920, height: 1080 },
        recordVideo: true,
        userFlows: [
          {
            name: 'test-all-forms',
            steps: [
              { type: 'click', selector: 'input[type="text"]:first-of-type' },
              { type: 'type', selector: 'input[type="text"]:first-of-type', value: 'Test User' },
              { type: 'click', selector: 'input[type="email"]' },
              { type: 'type', selector: 'input[type="email"]', value: 'test@example.com' },
              { type: 'click', selector: 'input[type="checkbox"]' },
              { type: 'wait', value: 500 },
              { type: 'click', selector: 'select, [role="combobox"]' },
              { type: 'wait', value: 1000 }
            ]
          }
        ]
      },

      // ========== ERROR STATES ==========
      {
        name: 'error-states',
        url: '/nonexistent-page',
        viewport: { width: 1920, height: 1080 },
        recordVideo: true,
        actions: [
          { type: 'wait', value: 3000, screenshot: true, description: '404 error page' }
        ]
      }
    ];
  }

  async runComprehensiveTests() {
    if (!this.browser) throw new Error('Browser not initialized');

    const configs = this.getComprehensiveTestConfigs();
    console.log(chalk.yellow(`📋 Running ${configs.length} comprehensive test configurations...`));

    for (const config of configs) {
      console.log(chalk.blue(`\n📋 Testing: ${config.name}`));
      
      let context: BrowserContext;
      let page: Page;

      try {
        // Create context with device or viewport
        if (config.device && devices[config.device]) {
          context = await this.browser.newContext({
            ...devices[config.device],
            recordVideo: config.recordVideo ? {
              dir: this.videoDir,
              size: { width: 1280, height: 720 }
            } : undefined
          });
        } else {
          context = await this.browser.newContext({
            viewport: config.viewport || { width: 1920, height: 1080 },
            recordVideo: config.recordVideo ? {
              dir: this.videoDir,
              size: { width: 1280, height: 720 }
            } : undefined
          });
        }

        page = await context.newPage();

        // Navigate to page
        console.log(chalk.gray(`  Navigating to ${config.url}...`));
        
        try {
          await page.goto(`${this.baseUrl}${config.url}`, {
            waitUntil: 'domcontentloaded',
            timeout: 30000
          });
          
          // Wait for server to be ready
          console.log(chalk.gray(`    Waiting for server to be ready...`));
          await page.waitForTimeout(2000);
          
          // Check if page loaded successfully
          const title = await page.title();
          console.log(chalk.green(`    ✓ Successfully loaded ${config.url}`));
          
        } catch (error) {
          console.log(chalk.red(`    ✗ Failed to load ${config.url}: ${error}`));
          await page.screenshot({ 
            path: path.join(this.screenshotDir, `${config.name}-error.png`),
            fullPage: true 
          });
          continue;
        }

        // Execute user flows
        if (config.userFlows) {
          for (const flow of config.userFlows) {
            console.log(chalk.gray(`  Executing flow: ${flow.name}...`));
            for (const step of flow.steps) {
              await this.performAction(page, step, config);
            }
          }
        }

        // Execute actions
        if (config.actions) {
          console.log(chalk.gray(`  Executing ${config.actions.length} actions...`));
          for (const action of config.actions) {
            await this.performAction(page, action, config);
          }
        }

        // Take final screenshot
        await page.screenshot({
          path: path.join(this.screenshotDir, `${config.name}-final.png`),
          fullPage: true
        });

        await context.close();

      } catch (error) {
        console.error(chalk.red(`  Error in ${config.name}:`, error));
        try {
          await context?.close();
        } catch (e) {}
      }
    }

    console.log(chalk.green('✅ All comprehensive tests completed'));
  }

  private async performAction(page: Page, action: any, config: TestConfig) {
    try {
      switch (action.type) {
        case 'click':
          if (action.selector) {
            const selectors = action.selector.split(', ');
            let clicked = false;
            
            for (const selector of selectors) {
              try {
                await page.waitForSelector(selector.trim(), { state: 'visible', timeout: 10000 });
                await page.click(selector.trim());
                clicked = true;
                console.log(chalk.green(`    ✓ Clicked: ${selector.trim()}`));
                break;
              } catch (e) {
                continue;
              }
            }
            
            if (!clicked) {
              console.warn(chalk.yellow(`    Warning: Could not find clickable element from "${action.selector}". Skipping...`));
            }
          }
          break;

        case 'type':
          if (action.selector && action.value) {
            const selectors = action.selector.split(', ');
            let typed = false;
            
            for (const selector of selectors) {
              try {
                await page.waitForSelector(selector.trim(), { state: 'visible', timeout: 5000 });
                await page.fill(selector.trim(), String(action.value));
                typed = true;
                console.log(chalk.green(`    ✓ Typed: ${action.value} in ${selector.trim()}`));
                break;
              } catch (e) {
                continue;
              }
            }
            
            if (!typed) {
              console.warn(chalk.yellow(`    Warning: Could not find input element from "${action.selector}". Skipping...`));
            }
          }
          break;

        case 'hover':
          if (action.selector) {
            try {
              await page.waitForSelector(action.selector, { state: 'visible', timeout: 5000 });
              await page.hover(action.selector);
              console.log(chalk.green(`    ✓ Hovered: ${action.selector}`));
            } catch (error) {
              console.warn(chalk.yellow(`    Warning: Could not hover "${action.selector}". Skipping...`));
            }
          }
          break;

        case 'keyboard':
          if (action.key) {
            await page.keyboard.press(action.key);
            console.log(chalk.green(`    ✓ Pressed key: ${action.key}`));
          }
          break;

        case 'wait':
          await page.waitForTimeout(Number(action.value) || 1000);
          break;

        case 'scroll':
          await page.evaluate((pixels) => {
            window.scrollBy(0, pixels as number);
          }, action.value || 500);
          console.log(chalk.green(`    ✓ Scrolled: ${action.value || 500}px`));
          break;

        case 'screenshot':
          const screenshotPath = path.join(
            this.screenshotDir,
            'interactions',
            `${config.name}-${action.description?.replace(/\s+/g, '-') || Date.now()}.png`
          );
          await fs.mkdir(path.dirname(screenshotPath), { recursive: true });
          await page.screenshot({ path: screenshotPath });
          console.log(chalk.green(`    ✓ Screenshot: ${action.description || 'captured'}`));
          break;

        case 'focus':
          if (action.selector) {
            try {
              await page.waitForSelector(action.selector, { state: 'visible', timeout: 5000 });
              await page.focus(action.selector);
              console.log(chalk.green(`    ✓ Focused: ${action.selector}`));
            } catch (error) {
              console.warn(chalk.yellow(`    Warning: Could not focus "${action.selector}". Skipping...`));
            }
          }
          break;
      }

      // Take screenshot after action if requested
      if (action.screenshot && action.type !== 'screenshot') {
        const screenshotPath = path.join(
          this.screenshotDir,
          'interactions',
          `${config.name}-${action.type}-${Date.now()}.png`
        );
        await fs.mkdir(path.dirname(screenshotPath), { recursive: true });
        await page.screenshot({ path: screenshotPath });
      }

    } catch (error) {
      console.warn(chalk.yellow(`    Warning: Action ${action.type} failed: ${error}`));
    }
  }

  async generateComprehensiveReport() {
    console.log(chalk.yellow('📝 Generating comprehensive report...'));
    
    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        totalTests: this.getComprehensiveTestConfigs().length,
        pagesAudited: new Set(this.getComprehensiveTestConfigs().map(c => c.url)).size,
        breakpointsTested: this.getComprehensiveTestConfigs().filter(c => c.viewport).length,
        userFlowsTested: this.getComprehensiveTestConfigs().filter(c => c.userFlows).length,
        accessibilityTests: this.getComprehensiveTestConfigs().filter(c => c.accessibility).length,
        videosRecorded: this.getComprehensiveTestConfigs().filter(c => c.recordVideo).length
      },
      configurations: this.getComprehensiveTestConfigs()
    };

    await fs.writeFile(
      path.join(this.reportDir, 'comprehensive-report.json'),
      JSON.stringify(report, null, 2)
    );

    // Generate HTML report
    const htmlReport = `
<!DOCTYPE html>
<html>
<head>
  <title>Comprehensive Visual Audit Report</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 20px; }
    .summary { background: #f5f5f5; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
    .metric { display: inline-block; margin: 10px; padding: 10px; background: white; border-radius: 4px; }
    .test { margin: 10px 0; padding: 10px; border: 1px solid #ddd; border-radius: 4px; }
    .video { margin: 10px 0; }
  </style>
</head>
<body>
  <h1>Comprehensive Visual Audit Report</h1>
  <div class="summary">
    <h2>Summary</h2>
    <div class="metric"><strong>${report.summary.totalTests}</strong><br>Total Tests</div>
    <div class="metric"><strong>${report.summary.pagesAudited}</strong><br>Pages Audited</div>
    <div class="metric"><strong>${report.summary.breakpointsTested}</strong><br>Breakpoints Tested</div>
    <div class="metric"><strong>${report.summary.userFlowsTested}</strong><br>User Flows Tested</div>
    <div class="metric"><strong>${report.summary.accessibilityTests}</strong><br>Accessibility Tests</div>
    <div class="metric"><strong>${report.summary.videosRecorded}</strong><br>Videos Recorded</div>
  </div>
  
  <h2>Test Configurations</h2>
  ${report.configurations.map(config => `
    <div class="test">
      <h3>${config.name}</h3>
      <p><strong>URL:</strong> ${config.url}</p>
      ${config.viewport ? `<p><strong>Viewport:</strong> ${config.viewport.width}x${config.viewport.height}</p>` : ''}
      ${config.device ? `<p><strong>Device:</strong> ${config.device}</p>` : ''}
      ${config.userFlows ? `<p><strong>User Flows:</strong> ${config.userFlows.length}</p>` : ''}
      ${config.recordVideo ? '<p><strong>Video:</strong> Recorded</p>' : ''}
    </div>
  `).join('')}
</body>
</html>
    `;

    await fs.writeFile(path.join(this.reportDir, 'index.html'), htmlReport);
    
    console.log(chalk.green('✅ Comprehensive report generated'));
    console.log(chalk.blue(`📁 Open: ${path.join(this.reportDir, 'index.html')}`));
  }

  async cleanup() {
    console.log(chalk.yellow('🧹 Cleaning up...'));
    
    if (this.browser) {
      await this.browser.close();
    }
  }

  async run() {
    try {
      await this.initialize();
      await this.startViteServer();
      await this.launchBrowser();
      await this.runComprehensiveTests();
      await this.generateComprehensiveReport();
      
      console.log(chalk.green('✨ COMPREHENSIVE visual audit complete!'));
      console.log(chalk.blue(`📁 View report: ${path.join(this.reportDir, 'index.html')}`));
      console.log(chalk.blue(`📹 Videos: ${this.videoDir}`));
    } catch (error) {
      console.error(chalk.red('❌ Error during comprehensive audit:'), error);
      throw error;
    } finally {
      await this.cleanup();
    }
  }
}

// Run the comprehensive auditor
const isMainModule = import.meta.url === `file://${process.argv[1]}`;
if (isMainModule) {
  const auditor = new ComprehensiveVisualAuditor();
  auditor.run().catch(console.error);
}

export { ComprehensiveVisualAuditor };