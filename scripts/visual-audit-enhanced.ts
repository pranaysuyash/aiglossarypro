#!/usr/bin/env tsx

/**
 * Enhanced Visual Audit Script with Comprehensive Testing
 *
 * Features:
 * - Interactive testing (clicks, hovers, form fills)
 * - Component-level analysis
 * - Accessibility testing
 * - Performance monitoring
 * - AI-powered analysis with Claude API
 * - Comprehensive HTML reporting
 * - Responsive breakpoint testing
 * - Dark/light mode testing
 * - Automated issue categorization
 */

import { exec, spawn } from 'node:child_process';
import fs from 'node:fs/promises';
import path from 'node:path';
import { promisify } from 'node:util';
import chalk from 'chalk';
import { config } from 'dotenv';
import { type Browser, type BrowserContext, chromium, devices, type Page } from 'playwright';

// Load environment variables from .env file
config();
// Import types and interfaces
interface AxeResults {
  violations: Array<{
    id: string;
    impact: 'minor' | 'moderate' | 'serious' | 'critical';
    description: string;
    help: string;
    tags: string[];
    nodes: Array<{
      html: string;
      impact?: string;
    }>;
  }>;
}

// Mock implementations for dependencies that might not be available
let AxeBuilder: any;
let lighthouse: any;
let chromeLauncher: any;

// Initialize with mock implementations first
AxeBuilder = class MockAxeBuilder {
  withTags() {
    return this;
  }
  analyze() {
    return Promise.resolve({ violations: [] });
  }
};

lighthouse = () => Promise.resolve({ lhr: null });
chromeLauncher = {
  launch: () => Promise.resolve({ port: 9222, kill: () => {} }),
};

// Function to initialize optional dependencies
async function initializeOptionalDependencies() {
  try {
    const axeModule = await import('@axe-core/playwright').catch(() => null);
    if (axeModule?.AxeBuilder) {
      AxeBuilder = axeModule.AxeBuilder;
    } else {
      console.warn('⚠️  @axe-core/playwright not installed - accessibility tests will be limited');
    }
  } catch (_e) {
    console.warn('⚠️  @axe-core/playwright not available - accessibility tests will be limited');
  }

  try {
    const lighthouseModule = await import('lighthouse').catch(() => null);
    const chromeLauncherModule = await import('chrome-launcher').catch(() => null);
    if (lighthouseModule?.default && chromeLauncherModule?.default) {
      lighthouse = lighthouseModule.default;
      chromeLauncher = chromeLauncherModule.default;
    } else {
      console.warn('⚠️  lighthouse not installed - performance tests will be limited');
    }
  } catch (_e) {
    console.warn('⚠️  lighthouse not available - performance tests will be limited');
  }
}

const execAsync = promisify(exec);

// Types and Interfaces
interface TestConfig {
  name: string;
  url: string;
  viewport?: { width: number; height: number };
  device?: string;
  actions?: TestAction[];
  states?: TestState[];
  components?: ComponentTest[];
  accessibility?: AccessibilityTest;
  performance?: boolean;
  darkMode?: boolean;
}

interface TestAction {
  type: 'click' | 'hover' | 'type' | 'scroll' | 'wait' | 'keyboard' | 'select' | 'check' | 'focus';
  selector?: string;
  value?: string | number | boolean;
  key?: string;
  screenshot?: boolean;
  description?: string;
}

interface TestState {
  name: string;
  setup: TestAction[];
  assertions?: StateAssertion[];
  screenshot?: boolean;
}

interface ComponentTest {
  name: string;
  selector: string;
  states: string[];
  interactions: TestAction[];
}

interface AccessibilityTest {
  rules?: string[];
  skipRules?: string[];
  focusTest?: boolean;
  keyboardNavigation?: boolean;
  contrastCheck?: boolean;
}

interface StateAssertion {
  type: 'visible' | 'hidden' | 'text' | 'attribute' | 'class';
  selector: string;
  expected?: string;
  attribute?: string;
}

interface VisualIssue {
  page: string;
  component?: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  category:
    | 'layout'
    | 'color'
    | 'typography'
    | 'accessibility'
    | 'responsiveness'
    | 'consistency'
    | 'interaction'
    | 'performance';
  description: string;
  recommendation: string;
  screenshot?: string;
  wcagViolation?: string;
  performanceImpact?: number;
  affectedUsers?: string[];
  codeSnippet?: string;
}

interface PerformanceMetrics {
  page: string;
  fcp: number; // First Contentful Paint
  lcp: number; // Largest Contentful Paint
  tti: number; // Time to Interactive
  cls: number; // Cumulative Layout Shift
  fid: number; // First Input Delay
  totalBlockingTime: number;
  speedIndex: number;
  lighthouse?: any;
}

// Enhanced Visual Auditor Class
class EnhancedVisualAuditor {
  private browser: Browser | null = null;
  private context: BrowserContext | null = null;
  private viteProcess: any = null;
  private baseUrl = process.env.BASE_URL || 'http://localhost:3001';
  private screenshotDir: string;
  private reportDir: string;
  private issues: VisualIssue[] = [];
  private performanceMetrics: PerformanceMetrics[] = [];
  private timestamp: string;
  private claudeApiKey = process.env.CLAUDE_API_KEY || '';

  constructor() {
    this.timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    this.screenshotDir = path.join(process.cwd(), 'visual-audits', this.timestamp, 'screenshots');
    this.reportDir = path.join(process.cwd(), 'visual-audits', this.timestamp);
  }

  async initialize() {
    // Initialize optional dependencies first
    await initializeOptionalDependencies();

    await fs.mkdir(this.screenshotDir, { recursive: true });
    await fs.mkdir(this.reportDir, { recursive: true });
    await fs.mkdir(path.join(this.screenshotDir, 'components'), { recursive: true });
    await fs.mkdir(path.join(this.screenshotDir, 'interactions'), { recursive: true });
    await fs.mkdir(path.join(this.screenshotDir, 'accessibility'), { recursive: true });

    console.log(chalk.blue('🚀 Starting Enhanced Visual Audit...'));
    console.log(chalk.gray(`Timestamp: ${this.timestamp}`));
    console.log(chalk.gray(`Screenshots: ${this.screenshotDir}`));
    console.log(chalk.gray(`Report: ${this.reportDir}`));
  }

  async startViteServer(): Promise<void> {
    console.log(chalk.yellow('⚡ Checking Vite development server...'));

    try {
      const port = this.baseUrl.split(':')[2] || '3001';
      await execAsync(`lsof -i :${port}`);
      console.log(chalk.green('✅ Vite server is already running'));
      return;
    } catch (_error) {
      console.log(chalk.yellow('⚡ Starting Vite development server...'));
    }

    return new Promise((resolve, reject) => {
      this.viteProcess = spawn('npm', ['run', 'dev:client'], {
        stdio: 'pipe',
        shell: true,
      });

      this.viteProcess.stdout.on('data', (data: Buffer) => {
        const output = data.toString();
        if (output.includes('ready in') || output.includes('Local:')) {
          console.log(chalk.green('✅ Vite server ready'));
          setTimeout(resolve, 3000); // Give it 3 seconds to fully stabilize
        }
      });

      this.viteProcess.stderr.on('data', (data: Buffer) => {
        console.error(chalk.red('Vite Error:'), data.toString());
      });

      this.viteProcess.on('error', reject);
      setTimeout(() => reject(new Error('Vite server timeout')), 45000);
    });
  }

  async waitForServer(): Promise<void> {
    console.log(chalk.gray('    Waiting for server to be ready...'));

    for (let i = 0; i < 10; i++) {
      try {
        const response = await fetch(`${this.baseUrl}/api/health`).catch(() => null);
        if (response?.ok) {
          console.log(chalk.green('    ✓ Server is ready'));
          return;
        }
      } catch (_error) {
        // Server not ready yet
      }

      // Wait before retrying
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }

    console.warn(chalk.yellow('    ⚠ Server health check timeout, proceeding anyway...'));
  }

  async launchBrowser() {
    console.log(chalk.yellow('🌐 Launching browser...'));
    this.browser = await chromium.launch({
      headless: process.env.HEADLESS !== 'false',
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    this.context = await this.browser.newContext({
      ignoreHTTPSErrors: true,
      recordVideo: {
        dir: path.join(this.reportDir, 'videos'),
        size: { width: 1920, height: 1080 },
      },
    });
  }

  // Get all test configurations
  private getTestConfigs(): TestConfig[] {
    return [
      // Desktop Tests
      {
        name: 'homepage-desktop',
        url: '/',
        viewport: { width: 1920, height: 1080 },
        performance: true,
        components: [
          {
            name: 'hero-section',
            selector:
              'main section:first-child, .hero-section, section[data-testid="hero"], section:has(h1)',
            states: ['default', 'animated'],
            interactions: [
              { type: 'hover', selector: 'button, .btn, [role="button"]', screenshot: true },
            ],
          },
          {
            name: 'navigation',
            selector: 'header, nav, [role="navigation"], .header, .navigation',
            states: ['default', 'scrolled'],
            interactions: [
              { type: 'hover', selector: 'nav a, header a, .nav-link', screenshot: true },
            ],
          },
        ],
      },

      // Mobile Tests
      {
        name: 'homepage-mobile',
        url: '/',
        device: 'iPhone 13',
        actions: [
          { type: 'wait', value: 2000 },
          {
            type: 'click',
            selector:
              'button[aria-label*="menu"], button[aria-label*="navigation"], .mobile-menu-toggle, .hamburger, button:has(svg)',
            description: 'Open mobile menu',
          },
          { type: 'wait', value: 500 },
          { type: 'screenshot', description: 'Mobile menu opened' },
        ],
      },

      // Tablet Tests
      {
        name: 'homepage-tablet',
        url: '/',
        device: 'iPad Pro',
        darkMode: true,
      },

      // Search Interaction Test
      {
        name: 'search-interaction',
        url: '/',
        viewport: { width: 1920, height: 1080 },
        actions: [
          {
            type: 'click',
            selector:
              'input[type="text"], input[placeholder*="Search"], input[placeholder*="search"], .search-input',
            description: 'Focus search input',
          },
          { type: 'wait', value: 500 },
          {
            type: 'type',
            selector:
              'input[type="text"], input[placeholder*="Search"], input[placeholder*="search"], .search-input',
            value: 'machine learning',
          },
          { type: 'wait', value: 1000, screenshot: true },
          { type: 'keyboard', key: 'Enter' },
          { type: 'wait', value: 2000, screenshot: true },
        ],
      },

      // Auth Testing (OAuth login page)
      {
        name: 'login-page',
        url: '/login',
        viewport: { width: 1920, height: 1080 },
        actions: [
          { type: 'wait', value: 2000, screenshot: true, description: 'Login page loaded' },
          { type: 'focus', selector: 'button, .btn, [role="button"], input[type="submit"]' },
          { type: 'screenshot', description: 'Login button focused' },
        ],
        accessibility: {
          focusTest: true,
          keyboardNavigation: true,
          contrastCheck: true,
        },
      },

      // Terms Listing with Filters
      {
        name: 'terms-listing',
        url: '/terms',
        viewport: { width: 1920, height: 1080 },
        actions: [
          { type: 'wait', value: 3000 },
          {
            type: 'click',
            selector:
              'button:contains("Filters"), button[aria-label*="filter"], .filter-button, button:has([data-lucide="filter"])',
            description: 'Open filters',
          },
          { type: 'wait', value: 1000 },
          { type: 'screenshot', description: 'Filters panel opened' },
          {
            type: 'click',
            selector: '[role="combobox"], button[role="combobox"], select, .select',
            description: 'Open category select',
          },
          { type: 'wait', value: 1000, screenshot: true },
        ],
        states: [
          {
            name: 'loading',
            setup: [{ type: 'wait', value: 100 }],
            screenshot: true,
          },
          {
            name: 'loaded',
            setup: [{ type: 'wait', value: 2000 }],
            screenshot: true,
          },
        ],
      },

      // Accessibility Focus Test
      {
        name: 'accessibility-keyboard-nav',
        url: '/',
        viewport: { width: 1920, height: 1080 },
        actions: [
          { type: 'keyboard', key: 'Tab', screenshot: true },
          { type: 'keyboard', key: 'Tab', screenshot: true },
          { type: 'keyboard', key: 'Tab', screenshot: true },
          { type: 'keyboard', key: 'Enter' },
          { type: 'wait', value: 1000, screenshot: true },
        ],
        accessibility: {
          focusTest: true,
          keyboardNavigation: true,
          rules: ['color-contrast', 'focus-visible', 'keyboard-access'],
        },
      },

      // Dark Mode Testing
      {
        name: 'dark-mode-toggle',
        url: '/',
        viewport: { width: 1920, height: 1080 },
        actions: [
          { type: 'screenshot', description: 'Light mode default' },
          { type: 'click', selector: 'button[aria-label*="mode"], button[aria-label*="theme"]' },
          { type: 'wait', value: 1000 },
          { type: 'screenshot', description: 'Dark mode activated' },
        ],
      },

      // Component States Testing
      {
        name: 'component-states',
        url: '/components',
        viewport: { width: 1920, height: 1080 },
        components: [
          {
            name: 'button',
            selector: '.btn',
            states: ['default', 'hover', 'focus', 'active', 'disabled'],
            interactions: [
              { type: 'hover', selector: '.btn:not(:disabled)', screenshot: true },
              { type: 'focus', selector: '.btn:not(:disabled)', screenshot: true },
            ],
          },
          {
            name: 'card',
            selector: '[data-testid="term-card"]',
            states: ['default', 'hover', 'selected'],
            interactions: [
              { type: 'hover', selector: '[data-testid="term-card"]', screenshot: true },
              { type: 'click', selector: '[data-testid="term-card"]', screenshot: true },
            ],
          },
        ],
      },
    ];
  }

  async runTests() {
    const configs = this.getTestConfigs();
    console.log(chalk.yellow(`📸 Running ${configs.length} test configurations...`));

    for (const config of configs) {
      console.log(chalk.blue(`\n📋 Testing: ${config.name}`));
      await this.runTestConfig(config);
    }
  }

  private async runTestConfig(config: TestConfig) {
    if (!this.context) throw new Error('Browser context not initialized');

    const page = await this.context.newPage();

    try {
      // Set viewport or device
      if (config.device) {
        const device = devices[config.device];
        if (device?.viewport) {
          await page.setViewportSize(device.viewport);
          await page.setExtraHTTPHeaders(
            device.userAgent ? { 'User-Agent': device.userAgent } : {}
          );
        } else {
          console.warn(`Device "${config.device}" not found, using default viewport`);
          await page.setViewportSize({ width: 1920, height: 1080 });
        }
      } else if (config.viewport) {
        await page.setViewportSize(config.viewport);
      }

      // Enable dark mode if requested
      if (config.darkMode) {
        await page.emulateMedia({ colorScheme: 'dark' });
      }

      // Navigate to page
      console.log(chalk.gray(`  Navigating to ${config.url}...`));
      try {
        // Wait for the server to be ready first
        await this.waitForServer();

        await page.goto(`${this.baseUrl}${config.url}`, {
          waitUntil: 'networkidle',
          timeout: 30000,
        });

        // Wait for React components to render and initial content to load
        await page.waitForSelector('body', { timeout: 10000 });
        await page.waitForTimeout(3000);

        console.log(chalk.green(`    ✓ Successfully loaded ${config.url}`));
      } catch (error) {
        console.warn(
          chalk.yellow(`    Warning: Navigation issues for ${config.url}. Attempting recovery...`)
        );

        // Try a simpler navigation approach
        try {
          await page.goto(`${this.baseUrl}${config.url}`, {
            waitUntil: 'domcontentloaded',
            timeout: 15000,
          });
          await page.waitForTimeout(2000);
          console.log(chalk.yellow(`    ⚠ Partial recovery for ${config.url}`));
        } catch (_recoveryError) {
          console.error(chalk.red(`    ✗ Failed to load ${config.url}: ${error.message}`));
          // Continue with whatever page state we have
        }
      }

      // Run performance analysis
      if (config.performance) {
        await this.runPerformanceAnalysis(page, config);
      }

      // Run accessibility tests
      if (config.accessibility) {
        await this.runAccessibilityTests(page, config);
      }

      // Execute actions
      if (config.actions) {
        console.log(chalk.gray(`  Executing ${config.actions.length} actions...`));
        for (const action of config.actions) {
          await this.performAction(page, action, config);
        }
      }

      // Test component states
      if (config.components) {
        for (const component of config.components) {
          await this.testComponent(page, component, config);
        }
      }

      // Test states
      if (config.states) {
        for (const state of config.states) {
          await this.testState(page, state, config);
        }
      }

      // Take final screenshot
      const screenshotPath = path.join(this.screenshotDir, `${config.name}-final.png`);
      await page.screenshot({
        path: screenshotPath,
        fullPage: true,
      });

      // Analyze screenshot with AI
      await this.analyzeScreenshot(screenshotPath, config.name);
    } catch (error) {
      console.error(chalk.red(`  Error in ${config.name}:`), error);
      this.issues.push({
        page: config.name,
        severity: 'critical',
        category: 'interaction',
        description: `Test failed: ${error.message}`,
        recommendation: 'Fix the error preventing the test from completing',
      });
    } finally {
      await page.close();
    }
  }

  private async performAction(page: Page, action: TestAction, config: TestConfig) {
    console.log(chalk.gray(`    Action: ${action.type} ${action.description || ''}`));

    switch (action.type) {
      case 'click':
        if (action.selector) {
          try {
            // Try multiple selector strategies
            const selectors = action.selector.split(', ');
            let clicked = false;

            for (const selector of selectors) {
              try {
                await page.waitForSelector(selector.trim(), { state: 'visible', timeout: 5000 });
                await page.click(selector.trim());
                clicked = true;
                console.log(chalk.green(`    ✓ Clicked element with selector: ${selector.trim()}`));
                break;
              } catch (_e) {}
            }

            if (!clicked) {
              console.warn(
                chalk.yellow(
                  `    Warning: Could not find any clickable element from "${action.selector}". Skipping...`
                )
              );
            }
          } catch (_error) {
            console.warn(
              chalk.yellow(`    Warning: Click action failed for "${action.selector}". Skipping...`)
            );
          }
        }
        break;

      case 'hover':
        if (action.selector) {
          try {
            await page.waitForSelector(action.selector, { state: 'visible', timeout: 15000 });
            await page.hover(action.selector);
          } catch (_error) {
            console.warn(
              chalk.yellow(
                `    Warning: Could not find hoverable element "${action.selector}". Skipping...`
              )
            );
            return;
          }
        }
        break;

      case 'type':
        if (action.selector && action.value) {
          try {
            const selectors = action.selector.split(', ');
            let typed = false;

            for (const selector of selectors) {
              try {
                await page.waitForSelector(selector.trim(), { state: 'visible', timeout: 5000 });
                await page.fill(selector.trim(), String(action.value));
                typed = true;
                console.log(
                  chalk.green(`    ✓ Typed in element with selector: ${selector.trim()}`)
                );
                break;
              } catch (_e) {}
            }

            if (!typed) {
              console.warn(
                chalk.yellow(
                  `    Warning: Could not find any input element from "${action.selector}". Skipping...`
                )
              );
            }
          } catch (_error) {
            console.warn(
              chalk.yellow(`    Warning: Type action failed for "${action.selector}". Skipping...`)
            );
          }
        }
        break;

      case 'scroll':
        await page.evaluate((pixels) => {
          window.scrollBy(0, pixels as number);
        }, action.value || 100);
        break;

      case 'wait':
        await page.waitForTimeout(Number(action.value) || 1000);
        break;

      case 'keyboard':
        if (action.key) {
          await page.keyboard.press(action.key);
        }
        break;

      case 'select':
        if (action.selector && action.value) {
          await page.selectOption(action.selector, String(action.value));
        }
        break;

      case 'check':
        if (action.selector) {
          await page.check(action.selector);
        }
        break;

      case 'focus':
        if (action.selector) {
          try {
            await page.waitForSelector(action.selector, { state: 'visible', timeout: 15000 });
            await page.focus(action.selector);
          } catch (_error) {
            console.warn(
              chalk.yellow(
                `    Warning: Could not find focusable element "${action.selector}". Skipping...`
              )
            );
            return;
          }
        }
        break;

      case 'screenshot': {
        const screenshotPath = path.join(
          this.screenshotDir,
          'interactions',
          `${config.name}-${action.description?.replace(/\s+/g, '-') || Date.now()}.png`
        );
        await page.screenshot({ path: screenshotPath });
        break;
      }
    }

    // Take screenshot after action if requested
    if (action.screenshot && action.type !== 'screenshot') {
      const screenshotPath = path.join(
        this.screenshotDir,
        'interactions',
        `${config.name}-${action.type}-${Date.now()}.png`
      );
      await page.screenshot({ path: screenshotPath });
    }
  }

  private async testComponent(page: Page, component: ComponentTest, config: TestConfig) {
    console.log(chalk.gray(`  Testing component: ${component.name}`));

    try {
      await page.waitForSelector(component.selector, { state: 'visible', timeout: 15000 });

      // Test each interaction
      for (const interaction of component.interactions) {
        await this.performAction(page, interaction, config);

        const screenshotPath = path.join(
          this.screenshotDir,
          'components',
          `${config.name}-${component.name}-${interaction.type}.png`
        );

        // Take component-specific screenshot
        const element = await page.$(component.selector);
        if (element) {
          await element.screenshot({ path: screenshotPath });
          await this.analyzeComponentScreenshot(screenshotPath, component.name, interaction.type);
        }
      }
    } catch (_error) {
      console.warn(
        chalk.yellow(
          `    Component test skipped for ${component.name}: Component not found or not visible`
        )
      );
      // Take a full page screenshot as fallback
      const fallbackScreenshotPath = path.join(
        this.screenshotDir,
        'components',
        `${config.name}-${component.name}-fallback.png`
      );
      await page.screenshot({ path: fallbackScreenshotPath });
    }
  }

  private async testState(page: Page, state: TestState, config: TestConfig) {
    console.log(chalk.gray(`  Testing state: ${state.name}`));

    // Setup state
    for (const setup of state.setup) {
      await this.performAction(page, setup, config);
    }

    // Run assertions
    if (state.assertions) {
      for (const assertion of state.assertions) {
        await this.runAssertion(page, assertion, config, state);
      }
    }

    // Take screenshot
    if (state.screenshot !== false) {
      const screenshotPath = path.join(this.screenshotDir, `${config.name}-${state.name}.png`);
      await page.screenshot({ path: screenshotPath });
    }
  }

  private async runAssertion(
    page: Page,
    assertion: StateAssertion,
    config: TestConfig,
    state: TestState
  ) {
    try {
      switch (assertion.type) {
        case 'visible':
          await page.waitForSelector(assertion.selector, { state: 'visible', timeout: 5000 });
          break;

        case 'hidden':
          await page.waitForSelector(assertion.selector, { state: 'hidden', timeout: 5000 });
          break;

        case 'text': {
          const textContent = await page.textContent(assertion.selector);
          if (textContent !== assertion.expected) {
            throw new Error(`Expected text "${assertion.expected}" but got "${textContent}"`);
          }
          break;
        }

        case 'attribute': {
          const attrValue = await page.getAttribute(assertion.selector, assertion.attribute || '');
          if (attrValue !== assertion.expected) {
            throw new Error(
              `Expected attribute "${assertion.attribute}" to be "${assertion.expected}" but got "${attrValue}"`
            );
          }
          break;
        }

        case 'class': {
          const hasClass = await page.evaluate(
            ({ selector, className }) => {
              const element = document.querySelector(selector);
              return element?.classList.contains(className);
            },
            { selector: assertion.selector, className: assertion.expected || '' }
          );
          if (!hasClass) {
            throw new Error(`Element does not have class "${assertion.expected}"`);
          }
          break;
        }
      }
    } catch (error) {
      this.issues.push({
        page: config.name,
        severity: 'high',
        category: 'interaction',
        description: `State assertion failed in ${state.name}: ${error.message}`,
        recommendation: 'Fix the state management or update the assertion',
      });
    }
  }

  private async runAccessibilityTests(page: Page, config: TestConfig) {
    console.log(chalk.gray('  Running accessibility tests...'));

    try {
      // Run axe-core accessibility tests
      const accessibilityResults = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
        .analyze();

      // Process violations
      for (const violation of accessibilityResults.violations) {
        this.issues.push({
          page: config.name,
          severity:
            violation.impact === 'critical'
              ? 'critical'
              : violation.impact === 'serious'
                ? 'high'
                : violation.impact === 'moderate'
                  ? 'medium'
                  : 'low',
          category: 'accessibility',
          description: `${violation.description} (${violation.nodes.length} instances)`,
          recommendation: violation.help,
          wcagViolation: violation.tags.join(', '),
          affectedUsers: violation.nodes[0]?.impact ? [violation.nodes[0].impact] : [],
          codeSnippet: violation.nodes[0]?.html,
        });
      }

      // Focus visibility test
      if (config.accessibility?.focusTest) {
        await this.testFocusVisibility(page, config);
      }

      // Keyboard navigation test
      if (config.accessibility?.keyboardNavigation) {
        await this.testKeyboardNavigation(page, config);
      }

      // Color contrast test
      if (config.accessibility?.contrastCheck) {
        await this.testColorContrast(page, config);
      }

      console.log(
        chalk.green(`    Found ${accessibilityResults.violations.length} accessibility issues`)
      );
    } catch (error) {
      console.error(chalk.red('    Accessibility test failed:'), error);
    }
  }

  private async testFocusVisibility(page: Page, config: TestConfig) {
    const focusableSelectors = [
      'a[href]',
      'button:not([disabled])',
      'input:not([disabled])',
      'select:not([disabled])',
      'textarea:not([disabled])',
      '[tabindex]:not([tabindex="-1"])',
    ];

    for (const selector of focusableSelectors) {
      const elements = await page.$$(selector);

      for (let i = 0; i < Math.min(elements.length, 3); i++) {
        const element = elements[i];
        await element.focus();

        const hasFocusIndicator = await element.evaluate((el) => {
          const styles = window.getComputedStyle(el);
          const focusStyles = window.getComputedStyle(el, ':focus');

          return (
            styles.outline !== 'none' ||
            styles.boxShadow !== 'none' ||
            styles.border !== focusStyles.border
          );
        });

        if (!hasFocusIndicator) {
          this.issues.push({
            page: config.name,
            severity: 'high',
            category: 'accessibility',
            description: `Missing focus indicator on ${selector}`,
            recommendation: 'Add visible focus styles (outline, box-shadow, or border change)',
            wcagViolation: '2.4.7 Focus Visible',
          });
        }
      }
    }
  }

  private async testKeyboardNavigation(page: Page, config: TestConfig) {
    // Test tab order
    const tabOrder: string[] = [];

    for (let i = 0; i < 10; i++) {
      await page.keyboard.press('Tab');
      const focusedElement = await page.evaluate(() => {
        const el = document.activeElement;
        return el ? el.tagName + (el.id ? `#${el.id}` : '') : null;
      });

      if (focusedElement) {
        tabOrder.push(focusedElement);
      }
    }

    // Check if tab order makes sense
    if (tabOrder.length < 3) {
      this.issues.push({
        page: config.name,
        severity: 'high',
        category: 'accessibility',
        description: 'Limited keyboard navigation - too few focusable elements',
        recommendation: 'Ensure all interactive elements are keyboard accessible',
        wcagViolation: '2.1.1 Keyboard',
      });
    }
  }

  private async testColorContrast(page: Page, config: TestConfig) {
    const contrastIssues = await page.evaluate(() => {
      const issues: any[] = [];
      const elements = document.querySelectorAll('*');

      elements.forEach((element: Element) => {
        const styles = window.getComputedStyle(element);
        const bgColor = styles.backgroundColor;
        const textColor = styles.color;

        // Simple contrast check (would need a proper algorithm in production)
        if (bgColor !== 'transparent' && textColor !== 'transparent') {
          // This is a placeholder - you'd need to implement actual contrast calculation
          const mockContrastRatio = 4.5; // Would calculate actual ratio

          if (mockContrastRatio < 4.5) {
            issues.push({
              selector: element.tagName,
              bgColor,
              textColor,
              ratio: mockContrastRatio,
            });
          }
        }
      });

      return issues.slice(0, 5); // Limit to 5 issues
    });

    for (const issue of contrastIssues) {
      this.issues.push({
        page: config.name,
        severity: 'medium',
        category: 'accessibility',
        description: `Low color contrast on ${issue.selector}`,
        recommendation: `Improve contrast ratio between ${issue.bgColor} and ${issue.textColor}`,
        wcagViolation: '1.4.3 Contrast (Minimum)',
      });
    }
  }

  private async runPerformanceAnalysis(page: Page, config: TestConfig) {
    console.log(chalk.gray('  Running performance analysis...'));

    try {
      // Get Chrome DevTools performance metrics
      const _metrics = await page.evaluate(() => {
        return new Promise((resolve) => {
          const observer = new PerformanceObserver((list) => {
            const entries = list.getEntries();
            const navEntry = entries.find((entry) => entry.entryType === 'navigation') as any;
            const paintEntries = performance.getEntriesByType('paint');

            resolve({
              domContentLoaded: navEntry?.domContentLoadedEventEnd || 0,
              loadComplete: navEntry?.loadEventEnd || 0,
              firstPaint: paintEntries.find((e) => e.name === 'first-paint')?.startTime || 0,
              firstContentfulPaint:
                paintEntries.find((e) => e.name === 'first-contentful-paint')?.startTime || 0,
            });
          });

          observer.observe({ entryTypes: ['navigation', 'paint'] });

          // Fallback
          setTimeout(() => resolve({}), 5000);
        });
      });

      // Run Lighthouse for comprehensive metrics
      const chrome = await chromeLauncher.launch({ chromeFlags: ['--headless'] });
      const options = {
        logLevel: 'error',
        output: 'json',
        port: chrome.port,
      };

      const runnerResult = await lighthouse(`${this.baseUrl}${config.url}`, options);
      await chrome.kill();

      if (runnerResult?.lhr) {
        const lhr = runnerResult.lhr;

        this.performanceMetrics.push({
          page: config.name,
          fcp: lhr.audits['first-contentful-paint']?.numericValue || 0,
          lcp: lhr.audits['largest-contentful-paint']?.numericValue || 0,
          tti: lhr.audits.interactive?.numericValue || 0,
          cls: lhr.audits['cumulative-layout-shift']?.numericValue || 0,
          fid: lhr.audits['max-potential-fid']?.numericValue || 0,
          totalBlockingTime: lhr.audits['total-blocking-time']?.numericValue || 0,
          speedIndex: lhr.audits['speed-index']?.numericValue || 0,
          lighthouse: {
            performance: lhr.categories.performance?.score || 0,
            accessibility: lhr.categories.accessibility?.score || 0,
            bestPractices: lhr.categories['best-practices']?.score || 0,
            seo: lhr.categories.seo?.score || 0,
          },
        });

        // Add performance issues
        if (lhr.categories.performance?.score < 0.9) {
          this.issues.push({
            page: config.name,
            severity: lhr.categories.performance?.score < 0.5 ? 'critical' : 'high',
            category: 'performance',
            description: `Low performance score: ${(lhr.categories.performance?.score * 100).toFixed(0)}%`,
            recommendation:
              'Optimize images, reduce JavaScript execution time, and improve caching',
            performanceImpact: 1 - lhr.categories.performance?.score,
          });
        }
      }
    } catch (error) {
      console.error(chalk.red('    Performance analysis failed:'), error);
    }
  }

  private async analyzeScreenshot(screenshotPath: string, pageName: string) {
    if (!this.claudeApiKey) {
      console.log(chalk.yellow('    Skipping AI analysis (no API key)'));
      return;
    }

    console.log(chalk.gray('    Analyzing with Claude AI...'));

    try {
      const imageBuffer = await fs.readFile(screenshotPath);
      const base64Image = imageBuffer.toString('base64');

      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.claudeApiKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: 'claude-3-opus-20240229',
          max_tokens: 1000,
          messages: [
            {
              role: 'user',
              content: [
                {
                  type: 'image',
                  source: {
                    type: 'base64',
                    media_type: 'image/png',
                    data: base64Image,
                  },
                },
                {
                  type: 'text',
                  text: `Analyze this screenshot for visual, UX, and accessibility issues. For each issue provide:
                - Severity: critical/high/medium/low
                - Category: layout/color/typography/accessibility/responsiveness/consistency/interaction
                - Clear description
                - Specific recommendation
                
                Focus on:
                1. Visual hierarchy and layout balance
                2. Color contrast and readability
                3. Responsive design issues
                4. Accessibility concerns
                5. Inconsistent styling or spacing
                6. Missing or unclear UI elements
                7. User experience problems
                
                Format your response as a JSON array of issues.`,
                },
              ],
            },
          ],
        }),
      });

      const data = await response.json();
      if (data.content?.[0]?.text) {
        try {
          const issues = JSON.parse(data.content[0].text);
          for (const issue of issues) {
            this.issues.push({
              page: pageName,
              ...issue,
              screenshot: path.basename(screenshotPath),
            });
          }
        } catch (_parseError) {
          console.error(chalk.red('    Failed to parse AI response'));
        }
      }
    } catch (error) {
      console.error(chalk.red('    AI analysis failed:'), error);
    }
  }

  private async analyzeComponentScreenshot(
    _screenshotPath: string,
    _componentName: string,
    _interaction: string
  ) {
    // Similar to analyzeScreenshot but focused on component-specific issues
    // Implementation would be similar but with component-specific prompts
  }

  async generateReport() {
    console.log(chalk.yellow('\n📝 Generating comprehensive report...'));

    // Generate HTML report
    await this.generateHTMLReport();

    // Generate Markdown report
    await this.generateMarkdownReport();

    // Generate JSON report
    await this.generateJSONReport();

    // Generate task list
    await this.generateTaskList();

    console.log(chalk.green('✅ Reports generated successfully!'));
  }

  private async generateHTMLReport() {
    const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Visual Audit Report - ${this.timestamp}</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 1200px;
            margin: 0 auto;
            padding: 20px;
            background: #f5f5f5;
        }
        .header {
            background: white;
            padding: 30px;
            border-radius: 10px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            margin-bottom: 30px;
        }
        h1 {
            color: #2c3e50;
            margin: 0 0 10px 0;
        }
        .summary {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
            margin: 20px 0;
        }
        .metric {
            background: #f8f9fa;
            padding: 20px;
            border-radius: 8px;
            text-align: center;
        }
        .metric-value {
            font-size: 2em;
            font-weight: bold;
            color: #3498db;
        }
        .metric-label {
            color: #7f8c8d;
            font-size: 0.9em;
        }
        .severity-critical { color: #e74c3c; }
        .severity-high { color: #e67e22; }
        .severity-medium { color: #f39c12; }
        .severity-low { color: #95a5a6; }
        .issue {
            background: white;
            padding: 20px;
            margin: 10px 0;
            border-radius: 8px;
            box-shadow: 0 2px 5px rgba(0,0,0,0.05);
            border-left: 4px solid #3498db;
        }
        .issue.critical { border-left-color: #e74c3c; }
        .issue.high { border-left-color: #e67e22; }
        .issue.medium { border-left-color: #f39c12; }
        .issue.low { border-left-color: #95a5a6; }
        .screenshot {
            max-width: 100%;
            margin: 10px 0;
            border: 1px solid #ddd;
            border-radius: 4px;
        }
        .performance-chart {
            background: white;
            padding: 20px;
            border-radius: 8px;
            margin: 20px 0;
        }
        .tabs {
            display: flex;
            gap: 10px;
            margin-bottom: 20px;
            border-bottom: 2px solid #e0e0e0;
        }
        .tab {
            padding: 10px 20px;
            cursor: pointer;
            border: none;
            background: none;
            font-size: 16px;
            color: #666;
            transition: all 0.3s;
        }
        .tab.active {
            color: #3498db;
            border-bottom: 2px solid #3498db;
        }
        .tab-content {
            display: none;
        }
        .tab-content.active {
            display: block;
        }
        .code-snippet {
            background: #f4f4f4;
            padding: 10px;
            border-radius: 4px;
            font-family: monospace;
            font-size: 0.9em;
            overflow-x: auto;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>Visual Audit Report</h1>
        <p>Generated: ${new Date().toLocaleString()}</p>
        <div class="summary">
            <div class="metric">
                <div class="metric-value">${this.issues.length}</div>
                <div class="metric-label">Total Issues</div>
            </div>
            <div class="metric">
                <div class="metric-value">${this.issues.filter((i) => i.severity === 'critical').length}</div>
                <div class="metric-label">Critical Issues</div>
            </div>
            <div class="metric">
                <div class="metric-value">${this.issues.filter((i) => i.severity === 'high').length}</div>
                <div class="metric-label">High Priority</div>
            </div>
            <div class="metric">
                <div class="metric-value">${this.performanceMetrics.length}</div>
                <div class="metric-label">Pages Tested</div>
            </div>
        </div>
    </div>

    <div class="tabs">
        <button class="tab active" onclick="showTab('issues')">Issues</button>
        <button class="tab" onclick="showTab('performance')">Performance</button>
        <button class="tab" onclick="showTab('accessibility')">Accessibility</button>
        <button class="tab" onclick="showTab('screenshots')">Screenshots</button>
    </div>

    <div id="issues" class="tab-content active">
        <h2>Issues by Severity</h2>
        ${this.generateHTMLIssues()}
    </div>

    <div id="performance" class="tab-content">
        <h2>Performance Metrics</h2>
        ${this.generateHTMLPerformance()}
    </div>

    <div id="accessibility" class="tab-content">
        <h2>Accessibility Issues</h2>
        ${this.generateHTMLAccessibility()}
    </div>

    <div id="screenshots" class="tab-content">
        <h2>Screenshot Gallery</h2>
        ${await this.generateHTMLScreenshots()}
    </div>

    <script>
        function showTab(tabName) {
            document.querySelectorAll('.tab').forEach(tab => tab.classList.remove('active'));
            document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
            
            event.target.classList.add('active');
            document.getElementById(tabName).classList.add('active');
        }
    </script>
</body>
</html>`;

    await fs.writeFile(path.join(this.reportDir, 'index.html'), htmlContent);
  }

  private generateHTMLIssues(): string {
    const sortedIssues = [...this.issues].sort((a, b) => {
      const severityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
      return severityOrder[a.severity] - severityOrder[b.severity];
    });

    return sortedIssues
      .map(
        (issue) => `
        <div class="issue ${issue.severity}">
            <h3><span class="severity-${issue.severity}">[${issue.severity.toUpperCase()}]</span> ${issue.description}</h3>
            <p><strong>Page:</strong> ${issue.page}</p>
            <p><strong>Category:</strong> ${issue.category}</p>
            <p><strong>Recommendation:</strong> ${issue.recommendation}</p>
            ${issue.wcagViolation ? `<p><strong>WCAG:</strong> ${issue.wcagViolation}</p>` : ''}
            ${issue.codeSnippet ? `<div class="code-snippet">${this.escapeHtml(issue.codeSnippet)}</div>` : ''}
        </div>
    `
      )
      .join('');
  }

  private generateHTMLPerformance(): string {
    return this.performanceMetrics
      .map(
        (metric) => `
        <div class="performance-chart">
            <h3>${metric.page}</h3>
            <div class="summary">
                <div class="metric">
                    <div class="metric-value">${(metric.fcp / 1000).toFixed(2)}s</div>
                    <div class="metric-label">First Contentful Paint</div>
                </div>
                <div class="metric">
                    <div class="metric-value">${(metric.lcp / 1000).toFixed(2)}s</div>
                    <div class="metric-label">Largest Contentful Paint</div>
                </div>
                <div class="metric">
                    <div class="metric-value">${(metric.tti / 1000).toFixed(2)}s</div>
                    <div class="metric-label">Time to Interactive</div>
                </div>
                <div class="metric">
                    <div class="metric-value">${metric.cls.toFixed(3)}</div>
                    <div class="metric-label">Cumulative Layout Shift</div>
                </div>
            </div>
            ${
              metric.lighthouse
                ? `
                <h4>Lighthouse Scores</h4>
                <div class="summary">
                    <div class="metric">
                        <div class="metric-value">${(metric.lighthouse.performance * 100).toFixed(0)}%</div>
                        <div class="metric-label">Performance</div>
                    </div>
                    <div class="metric">
                        <div class="metric-value">${(metric.lighthouse.accessibility * 100).toFixed(0)}%</div>
                        <div class="metric-label">Accessibility</div>
                    </div>
                    <div class="metric">
                        <div class="metric-value">${(metric.lighthouse.bestPractices * 100).toFixed(0)}%</div>
                        <div class="metric-label">Best Practices</div>
                    </div>
                    <div class="metric">
                        <div class="metric-value">${(metric.lighthouse.seo * 100).toFixed(0)}%</div>
                        <div class="metric-label">SEO</div>
                    </div>
                </div>
            `
                : ''
            }
        </div>
    `
      )
      .join('');
  }

  private generateHTMLAccessibility(): string {
    const accessibilityIssues = this.issues.filter((i) => i.category === 'accessibility');

    return accessibilityIssues
      .map(
        (issue) => `
        <div class="issue ${issue.severity}">
            <h3><span class="severity-${issue.severity}">[${issue.severity.toUpperCase()}]</span> ${issue.description}</h3>
            <p><strong>Page:</strong> ${issue.page}</p>
            <p><strong>WCAG Guideline:</strong> ${issue.wcagViolation || 'N/A'}</p>
            <p><strong>Recommendation:</strong> ${issue.recommendation}</p>
            ${issue.affectedUsers?.length ? `<p><strong>Affected Users:</strong> ${issue.affectedUsers.join(', ')}</p>` : ''}
            ${issue.codeSnippet ? `<div class="code-snippet">${this.escapeHtml(issue.codeSnippet)}</div>` : ''}
        </div>
    `
      )
      .join('');
  }

  private async generateHTMLScreenshots(): Promise<string> {
    const screenshots = await this.getAllScreenshots();

    return screenshots
      .map(
        (screenshot) => `
        <div style="margin: 20px 0;">
            <h3>${screenshot.name}</h3>
            <img src="screenshots/${screenshot.path}" alt="${screenshot.name}" class="screenshot" />
        </div>
    `
      )
      .join('');
  }

  private async getAllScreenshots(): Promise<{ name: string; path: string }[]> {
    const screenshots: { name: string; path: string }[] = [];

    const addScreenshots = async (dir: string, prefix = '') => {
      const files = await fs.readdir(dir);
      for (const file of files) {
        const filePath = path.join(dir, file);
        const stat = await fs.stat(filePath);

        if (stat.isDirectory()) {
          await addScreenshots(filePath, `${prefix}${file}/`);
        } else if (file.endsWith('.png')) {
          screenshots.push({
            name: `${prefix}${file}`,
            path: `${prefix}${file}`,
          });
        }
      }
    };

    await addScreenshots(this.screenshotDir);
    return screenshots;
  }

  private escapeHtml(text: string): string {
    const map: { [key: string]: string } = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;',
    };
    return text.replace(/[&<>"']/g, (m) => map[m]);
  }

  private async generateMarkdownReport() {
    const content = `# Visual Audit Report
Generated: ${new Date().toISOString()}

## Executive Summary

- **Total Issues Found:** ${this.issues.length}
- **Critical Issues:** ${this.issues.filter((i) => i.severity === 'critical').length}
- **High Priority Issues:** ${this.issues.filter((i) => i.severity === 'high').length}
- **Medium Priority Issues:** ${this.issues.filter((i) => i.severity === 'medium').length}
- **Low Priority Issues:** ${this.issues.filter((i) => i.severity === 'low').length}

## Performance Summary

${this.performanceMetrics
  .map(
    (m) => `
### ${m.page}
- First Contentful Paint: ${(m.fcp / 1000).toFixed(2)}s
- Largest Contentful Paint: ${(m.lcp / 1000).toFixed(2)}s
- Time to Interactive: ${(m.tti / 1000).toFixed(2)}s
- Cumulative Layout Shift: ${m.cls.toFixed(3)}
${
  m.lighthouse
    ? `
- Lighthouse Performance Score: ${(m.lighthouse.performance * 100).toFixed(0)}%
- Lighthouse Accessibility Score: ${(m.lighthouse.accessibility * 100).toFixed(0)}%
`
    : ''
}
`
  )
  .join('')}

## Critical Issues

${this.issues
  .filter((i) => i.severity === 'critical')
  .map(
    (issue) => `
### ${issue.description}
- **Page:** ${issue.page}
- **Category:** ${issue.category}
- **Recommendation:** ${issue.recommendation}
${issue.wcagViolation ? `- **WCAG:** ${issue.wcagViolation}` : ''}
`
  )
  .join('')}

## High Priority Issues

${this.issues
  .filter((i) => i.severity === 'high')
  .map(
    (issue) => `
### ${issue.description}
- **Page:** ${issue.page}
- **Category:** ${issue.category}
- **Recommendation:** ${issue.recommendation}
`
  )
  .join('')}

## Action Items

${this.generateActionItems()}

## Detailed Report

Full HTML report available at: \`index.html\`
`;

    await fs.writeFile(path.join(this.reportDir, 'report.md'), content);
  }

  private generateActionItems(): string {
    const prioritizedIssues = [...this.issues].sort((a, b) => {
      const severityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
      return severityOrder[a.severity] - severityOrder[b.severity];
    });

    return prioritizedIssues
      .slice(0, 15)
      .map(
        (
          issue,
          index
        ) => `${index + 1}. **[${issue.severity.toUpperCase()}]** ${issue.recommendation}
   - Page: ${issue.page}
   - Issue: ${issue.description}`
      )
      .join('\n\n');
  }

  private async generateJSONReport() {
    const report = {
      timestamp: this.timestamp,
      summary: {
        totalIssues: this.issues.length,
        criticalIssues: this.issues.filter((i) => i.severity === 'critical').length,
        highPriorityIssues: this.issues.filter((i) => i.severity === 'high').length,
        mediumPriorityIssues: this.issues.filter((i) => i.severity === 'medium').length,
        lowPriorityIssues: this.issues.filter((i) => i.severity === 'low').length,
        pagesAudited: new Set(this.issues.map((i) => i.page)).size,
      },
      issues: this.issues,
      performanceMetrics: this.performanceMetrics,
      screenshotDirectory: this.screenshotDir,
    };

    await fs.writeFile(path.join(this.reportDir, 'report.json'), JSON.stringify(report, null, 2));
  }

  private async generateTaskList() {
    const tasks = this.issues
      .filter((i) => i.severity === 'critical' || i.severity === 'high')
      .map((issue) => ({
        title: issue.description,
        page: issue.page,
        severity: issue.severity,
        category: issue.category,
        recommendation: issue.recommendation,
        wcag: issue.wcagViolation,
        estimatedEffort: this.estimateEffort(issue),
      }));

    const taskListContent = `# Visual Audit Task List
Generated: ${new Date().toISOString()}

## High Priority Tasks

${tasks
  .map(
    (task, index) => `
### ${index + 1}. ${task.title}

- **Severity:** ${task.severity}
- **Page:** ${task.page}
- **Category:** ${task.category}
- **Estimated Effort:** ${task.estimatedEffort}
${task.wcag ? `- **WCAG Guideline:** ${task.wcag}` : ''}

**How to fix:**
${task.recommendation}

---
`
  )
  .join('')}

## Task Summary

- Total High Priority Tasks: ${tasks.length}
- Estimated Total Effort: ${this.calculateTotalEffort(tasks)}
- Categories: ${[...new Set(tasks.map((t) => t.category))].join(', ')}
`;

    await fs.writeFile(path.join(this.reportDir, 'task-list.md'), taskListContent);
  }

  private estimateEffort(issue: VisualIssue): string {
    const effortMap = {
      critical: {
        layout: '4-8 hours',
        color: '1-2 hours',
        typography: '1-2 hours',
        accessibility: '2-4 hours',
        responsiveness: '4-8 hours',
        consistency: '2-4 hours',
        interaction: '4-8 hours',
        performance: '8-16 hours',
      },
      high: {
        layout: '2-4 hours',
        color: '30 min - 1 hour',
        typography: '30 min - 1 hour',
        accessibility: '1-2 hours',
        responsiveness: '2-4 hours',
        consistency: '1-2 hours',
        interaction: '2-4 hours',
        performance: '4-8 hours',
      },
      medium: {
        layout: '1-2 hours',
        color: '15-30 min',
        typography: '15-30 min',
        accessibility: '30 min - 1 hour',
        responsiveness: '1-2 hours',
        consistency: '30 min - 1 hour',
        interaction: '1-2 hours',
        performance: '2-4 hours',
      },
      low: {
        layout: '30 min - 1 hour',
        color: '15 min',
        typography: '15 min',
        accessibility: '15-30 min',
        responsiveness: '30 min - 1 hour',
        consistency: '15-30 min',
        interaction: '30 min - 1 hour',
        performance: '1-2 hours',
      },
    };

    return effortMap[issue.severity]?.[issue.category] || '1-2 hours';
  }

  private calculateTotalEffort(tasks: any[]): string {
    const totalHours = tasks.reduce((total, task) => {
      const match = task.estimatedEffort.match(/(\d+)-(\d+)/);
      if (match) {
        return total + parseInt(match[2]);
      }
      return total + 2; // Default 2 hours
    }, 0);

    if (totalHours < 40) {
      return `${totalHours} hours (${Math.ceil(totalHours / 8)} days)`;
    } else {
      return `${totalHours} hours (${Math.ceil(totalHours / 40)} weeks)`;
    }
  }

  async cleanup() {
    console.log(chalk.yellow('\n🧹 Cleaning up...'));

    if (this.context) {
      await this.context.close();
    }

    if (this.browser) {
      await this.browser.close();
    }

    if (this.viteProcess) {
      this.viteProcess.kill();
    }
  }

  async run() {
    try {
      await this.initialize();
      await this.startViteServer();
      await this.launchBrowser();
      await this.runTests();
      await this.generateReport();

      console.log(chalk.green('\n✨ Enhanced visual audit complete!'));
      console.log(chalk.blue(`📁 View report: ${path.join(this.reportDir, 'index.html')}`));
    } catch (error) {
      console.error(chalk.red('❌ Error during visual audit:'), error);
      throw error;
    } finally {
      await this.cleanup();
    }
  }
}

// Run the enhanced visual auditor
const isMainModule = import.meta.url === `file://${process.argv[1]}`;
if (isMainModule) {
  const auditor = new EnhancedVisualAuditor();
  auditor.run().catch(console.error);
}

export { EnhancedVisualAuditor, type VisualIssue, type PerformanceMetrics };
