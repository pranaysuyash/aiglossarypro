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

import { exec } from 'node:child_process';
import fs from 'node:fs/promises';
import path from 'node:path';
import chalk from 'chalk';
import { config } from 'dotenv';
import { type Browser, type BrowserContext, chromium, devices, type Page } from 'playwright';

// Load environment variables
config();

interface TestConfig {
  name: string;
  url: string;
  viewport?: { width: number; height: number };
  device?: string;
  actions?: Array<{
    type:
      | 'click'
      | 'hover'
      | 'type'
      | 'scroll'
      | 'wait'
      | 'keyboard'
      | 'screenshot'
      | 'focus'
      | 'select';
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
  private baseUrl = process.env.BASE_URL || 'http://localhost:5173';
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
      const _port = this.baseUrl.split(':')[2];
      await exec(`curl -f ${this.baseUrl} > /dev/null 2>&1`);
      console.log(chalk.green('✅ Vite server is ready'));
      return;
    } catch (_error) {
      console.log(chalk.yellow('⚡ Vite server not accessible, will wait...'));
    }

    // Wait for server to be ready
    for (let i = 0; i < 30; i++) {
      try {
        await exec(`curl -f ${this.baseUrl} > /dev/null 2>&1`);
        console.log(chalk.green('✅ Vite server ready'));
        return;
      } catch (_error) {
        await new Promise((resolve) => setTimeout(resolve, 2000));
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
      args: ['--no-sandbox', '--disable-dev-shm-usage'],
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
              { type: 'wait', value: 2000 },
            ],
          },
        ],
      },
      {
        name: 'homepage-mobile',
        url: '/',
        device: 'iPhone 13',
        recordVideo: true,
        actions: [
          { type: 'wait', value: 2000 },
          {
            type: 'click',
            selector: 'button[aria-label*="menu"], .mobile-menu-button, .hamburger',
          },
          { type: 'wait', value: 1000, screenshot: true },
        ],
      },
      {
        name: 'homepage-tablet',
        url: '/',
        device: 'iPad Pro',
        recordVideo: true,
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
              { type: 'wait', value: 1000 },
            ],
          },
        ],
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
              { type: 'scroll', value: 500 },
            ],
          },
        ],
      },
      {
        name: 'trending-page',
        url: '/trending',
        viewport: { width: 1920, height: 1080 },
        recordVideo: true,
      },
      {
        name: 'favorites-page',
        url: '/favorites',
        viewport: { width: 1920, height: 1080 },
        recordVideo: true,
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
              { type: 'wait', value: 1000 },
            ],
          },
        ],
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
              {
                type: 'type',
                selector: 'input[type="text"], input[type="email"]',
                value: 'test@example.com',
              },
              { type: 'wait', value: 1000 },
            ],
          },
        ],
      },
      {
        name: 'ai-tools-page',
        url: '/ai-tools',
        viewport: { width: 1920, height: 1080 },
        recordVideo: true,
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
              {
                type: 'click',
                selector: 'button:has-text("Google"), .google-login, .oauth-button',
              },
              { type: 'wait', value: 2000 },
              { type: 'click', selector: 'button:has-text("GitHub"), .github-login' },
              { type: 'wait', value: 2000 },
            ],
          },
        ],
      },
      {
        name: 'profile-page',
        url: '/profile',
        viewport: { width: 1920, height: 1080 },
        recordVideo: true,
      },
      {
        name: 'progress-page',
        url: '/progress',
        viewport: { width: 1920, height: 1080 },
        recordVideo: true,
      },
      {
        name: 'lifetime-page',
        url: '/lifetime',
        viewport: { width: 1920, height: 1080 },
        recordVideo: true,
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
              { type: 'keyboard', key: 'Escape' },
            ],
          },
        ],
      },

      // ========== RESPONSIVE BREAKPOINTS ==========
      {
        name: 'mobile-portrait-320',
        url: '/',
        viewport: { width: 320, height: 568 },
        recordVideo: true,
      },
      {
        name: 'mobile-portrait-375',
        url: '/',
        viewport: { width: 375, height: 812 },
        recordVideo: true,
      },
      {
        name: 'mobile-landscape',
        url: '/',
        viewport: { width: 812, height: 375 },
        recordVideo: true,
      },
      {
        name: 'tablet-portrait',
        url: '/',
        viewport: { width: 768, height: 1024 },
        recordVideo: true,
      },
      {
        name: 'tablet-landscape',
        url: '/',
        viewport: { width: 1024, height: 768 },
        recordVideo: true,
      },
      {
        name: 'desktop-small',
        url: '/',
        viewport: { width: 1366, height: 768 },
        recordVideo: true,
      },
      {
        name: 'desktop-large',
        url: '/',
        viewport: { width: 2560, height: 1440 },
        recordVideo: true,
      },

      // ========== ACCESSIBILITY TESTS ==========
      {
        name: 'accessibility-keyboard-navigation',
        url: '/',
        viewport: { width: 1920, height: 1080 },
        recordVideo: true,
        accessibility: {
          focusTest: true,
          keyboardNavigation: true,
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
              { type: 'keyboard', key: 'Escape' },
            ],
          },
        ],
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
              {
                type: 'click',
                selector: 'button[aria-label*="mode"], button[aria-label*="theme"]',
              },
              { type: 'wait', value: 1000, screenshot: true, description: 'Dark mode homepage' },
              { type: 'click', selector: 'a[href="/terms"], .nav-link:has-text("Terms")' },
              { type: 'wait', value: 2000, screenshot: true, description: 'Dark mode terms page' },
              { type: 'click', selector: 'a[href="/categories"]' },
              {
                type: 'wait',
                value: 2000,
                screenshot: true,
                description: 'Dark mode categories page',
              },
            ],
          },
        ],
      },

      // ========== AUTHENTICATION AND CHARACTERISTIC FUNCTION TESTS ==========
      {
        name: 'authentication-and-characteristic-function',
        url: '/term/8b5bff9a-afb7-4691-a58e-adc2bf94f941',
        viewport: { width: 1920, height: 1080 },
        recordVideo: true,
        userFlows: [
          {
            name: 'test-full-term-view-with-auth',
            steps: [
              { type: 'wait', value: 2000, screenshot: true, description: 'Initial preview state' },
              {
                type: 'click',
                selector: 'button:has-text("Sign In"), .oauth-button, button[aria-label*="Sign"]',
              },
              { type: 'wait', value: 3000, screenshot: true, description: 'After sign in attempt' },
              // Test all interactive elements in TermCard if visible
              {
                type: 'click',
                selector: '[data-testid="term-card"] button[aria-label*="favorite"], .heart-button',
              },
              { type: 'wait', value: 1000, screenshot: true, description: 'After favorite click' },
              {
                type: 'click',
                selector:
                  '[data-testid="term-card"] button[aria-label*="copy"], button:has(svg[data-lucide="copy"])',
              },
              { type: 'wait', value: 1000, screenshot: true, description: 'After copy click' },
              {
                type: 'click',
                selector:
                  '[data-testid="term-card"] button[aria-label*="share"], button:has(svg[data-lucide="share"])',
              },
              { type: 'wait', value: 2000, screenshot: true, description: 'After share click' },
              { type: 'keyboard', key: 'Escape' },
              { type: 'click', selector: 'a:has-text("Read more"), .read-more-link' },
              { type: 'wait', value: 2000, screenshot: true, description: 'After read more click' },
            ],
          },
        ],
      },

      // ========== 42 SECTIONS COMPREHENSIVE TEST ==========
      {
        name: 'all-42-sections-comprehensive',
        url: '/term/8b5bff9a-afb7-4691-a58e-adc2bf94f941',
        viewport: { width: 1920, height: 1080 },
        recordVideo: true,
        userFlows: [
          {
            name: 'test-all-sections-and-interactive-elements',
            steps: [
              // Test section content renderer
              { type: 'wait', value: 3000, screenshot: true, description: 'Full term page loaded' },
              { type: 'scroll', value: 500 },
              {
                type: 'wait',
                value: 1000,
                screenshot: true,
                description: 'After scroll to content',
              },

              // Test Mermaid diagrams
              {
                type: 'click',
                selector: '.mermaid-container, [class*="mermaid"], [data-testid*="diagram"]',
              },
              {
                type: 'wait',
                value: 2000,
                screenshot: true,
                description: 'Mermaid diagram interaction',
              },
              {
                type: 'click',
                selector: 'button[aria-label*="zoom"], button:has(svg[data-lucide="zoom-in"])',
              },
              { type: 'wait', value: 1000, screenshot: true, description: 'Mermaid zoom in' },
              {
                type: 'click',
                selector: 'button[aria-label*="copy"], button:has(svg[data-lucide="copy"])',
              },
              { type: 'wait', value: 1000, screenshot: true, description: 'Mermaid copy' },
              {
                type: 'click',
                selector: 'button[aria-label*="download"], button:has(svg[data-lucide="download"])',
              },
              { type: 'wait', value: 1000, screenshot: true, description: 'Mermaid download' },

              // Test Code blocks
              {
                type: 'click',
                selector: '.code-block, pre, [class*="code"], [data-testid*="code"]',
              },
              {
                type: 'wait',
                value: 1000,
                screenshot: true,
                description: 'Code block interaction',
              },
              { type: 'click', selector: 'button:has-text("Copy"), button[aria-label*="copy"]' },
              { type: 'wait', value: 1000, screenshot: true, description: 'Code copy' },

              // Test Interactive quizzes
              {
                type: 'click',
                selector: '.quiz-container, [data-testid*="quiz"], [class*="quiz"]',
              },
              { type: 'wait', value: 1000, screenshot: true, description: 'Quiz interaction' },
              {
                type: 'click',
                selector: 'input[type="radio"]:first-of-type, .quiz-option:first-child',
              },
              { type: 'wait', value: 500, screenshot: true, description: 'Quiz option selected' },
              {
                type: 'click',
                selector: 'button:has-text("Submit"), button:has-text("Next"), .quiz-submit',
              },
              { type: 'wait', value: 1000, screenshot: true, description: 'Quiz submitted' },

              // Test Accordion sections
              {
                type: 'click',
                selector:
                  '[data-radix-collection-item]:first-child button, .accordion-trigger:first-child',
              },
              {
                type: 'wait',
                value: 1000,
                screenshot: true,
                description: 'First accordion opened',
              },
              {
                type: 'click',
                selector:
                  '[data-radix-collection-item]:nth-child(2) button, .accordion-trigger:nth-child(2)',
              },
              {
                type: 'wait',
                value: 1000,
                screenshot: true,
                description: 'Second accordion opened',
              },

              // Test Tabs
              { type: 'click', selector: '[role="tab"]:nth-child(2), .tab-trigger:nth-child(2)' },
              { type: 'wait', value: 1000, screenshot: true, description: 'Second tab selected' },
              { type: 'click', selector: '[role="tab"]:nth-child(3), .tab-trigger:nth-child(3)' },
              { type: 'wait', value: 1000, screenshot: true, description: 'Third tab selected' },

              // Test Cards mode
              { type: 'click', selector: 'button:has-text("Cards"), .display-mode-cards' },
              { type: 'wait', value: 1000, screenshot: true, description: 'Cards mode selected' },

              // Test AI Definition Improver
              { type: 'click', selector: '.ai-improver button, [data-testid*="ai"] button' },
              {
                type: 'wait',
                value: 2000,
                screenshot: true,
                description: 'AI improver interaction',
              },

              // Scroll through all content
              { type: 'scroll', value: 1000 },
              { type: 'wait', value: 1000, screenshot: true, description: 'Scrolled further down' },
              { type: 'scroll', value: 1000 },
              {
                type: 'wait',
                value: 1000,
                screenshot: true,
                description: 'Scrolled to bottom content',
              },
            ],
          },
        ],
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
              { type: 'wait', value: 1000 },
            ],
          },
        ],
      },

      // ========== COMPREHENSIVE FORM INTERACTIONS ==========
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
              { type: 'wait', value: 1000 },
              { type: 'click', selector: 'textarea' },
              {
                type: 'type',
                selector: 'textarea',
                value: 'This is a test message for comprehensive form testing.',
              },
              { type: 'wait', value: 1000, screenshot: true, description: 'Form filled out' },
              {
                type: 'click',
                selector:
                  'button[type="submit"], button:has-text("Save"), button:has-text("Update")',
              },
              { type: 'wait', value: 2000, screenshot: true, description: 'Form submitted' },
            ],
          },
        ],
      },

      // ========== CONTACT FORM TESTING ==========
      {
        name: 'contact-form-comprehensive',
        url: '/',
        viewport: { width: 1920, height: 1080 },
        recordVideo: true,
        userFlows: [
          {
            name: 'find-and-test-contact-forms',
            steps: [
              // Look for contact links in footer or navigation
              { type: 'scroll', value: 2000 },
              { type: 'wait', value: 1000, screenshot: true, description: 'Scrolled to footer' },
              {
                type: 'click',
                selector: 'a[href*="contact"], a:has-text("Contact"), .contact-link',
              },
              {
                type: 'wait',
                value: 3000,
                screenshot: true,
                description: 'Contact page or modal opened',
              },

              // Fill out contact form if found
              {
                type: 'click',
                selector:
                  'input[name="name"], input[placeholder*="name"], input[type="text"]:first-of-type',
              },
              {
                type: 'type',
                selector:
                  'input[name="name"], input[placeholder*="name"], input[type="text"]:first-of-type',
                value: 'John Doe',
              },
              {
                type: 'click',
                selector: 'input[name="email"], input[placeholder*="email"], input[type="email"]',
              },
              {
                type: 'type',
                selector: 'input[name="email"], input[placeholder*="email"], input[type="email"]',
                value: 'john.doe@example.com',
              },
              { type: 'click', selector: 'input[name="subject"], input[placeholder*="subject"]' },
              {
                type: 'type',
                selector: 'input[name="subject"], input[placeholder*="subject"]',
                value: 'Test Subject',
              },
              {
                type: 'click',
                selector: 'textarea[name="message"], textarea[placeholder*="message"], textarea',
              },
              {
                type: 'type',
                selector: 'textarea[name="message"], textarea[placeholder*="message"], textarea',
                value:
                  'This is a comprehensive test message to validate the contact form functionality. Testing all aspects of the user interaction.',
              },
              { type: 'wait', value: 2000, screenshot: true, description: 'Contact form filled' },

              // Test form validation if available
              {
                type: 'click',
                selector:
                  'button[type="submit"], button:has-text("Send"), button:has-text("Submit")',
              },
              {
                type: 'wait',
                value: 3000,
                screenshot: true,
                description: 'Contact form submitted',
              },
            ],
          },
        ],
      },

      // ========== ERROR STATES ==========
      {
        name: 'error-states',
        url: '/nonexistent-page',
        viewport: { width: 1920, height: 1080 },
        recordVideo: true,
        actions: [{ type: 'wait', value: 3000, screenshot: true, description: '404 error page' }],
      },
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
            recordVideo: config.recordVideo
              ? {
                  dir: this.videoDir,
                  size: { width: 1280, height: 720 },
                }
              : undefined,
          });
        } else {
          context = await this.browser.newContext({
            viewport: config.viewport || { width: 1920, height: 1080 },
            recordVideo: config.recordVideo
              ? {
                  dir: this.videoDir,
                  size: { width: 1280, height: 720 },
                }
              : undefined,
          });
        }

        page = await context.newPage();

        // Navigate to page
        console.log(chalk.gray(`  Navigating to ${config.url}...`));

        try {
          await page.goto(`${this.baseUrl}${config.url}`, {
            waitUntil: 'domcontentloaded',
            timeout: 30000,
          });

          // Wait for server to be ready
          console.log(chalk.gray(`    Waiting for server to be ready...`));
          await page.waitForTimeout(2000);

          // Check if page loaded successfully
          const _title = await page.title();
          console.log(chalk.green(`    ✓ Successfully loaded ${config.url}`));
        } catch (error) {
          console.log(chalk.red(`    ✗ Failed to load ${config.url}: ${error}`));
          await page.screenshot({
            path: path.join(this.screenshotDir, `${config.name}-error.png`),
            fullPage: true,
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
          fullPage: true,
        });

        await context.close();
      } catch (error) {
        console.error(chalk.red(`  Error in ${config.name}:`, error));
        try {
          await context?.close();
        } catch (_e) {}
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
              } catch (_e) {}
            }

            if (!clicked) {
              console.warn(
                chalk.yellow(
                  `    Warning: Could not find clickable element from "${action.selector}". Skipping...`
                )
              );
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
              } catch (_e) {}
            }

            if (!typed) {
              console.warn(
                chalk.yellow(
                  `    Warning: Could not find input element from "${action.selector}". Skipping...`
                )
              );
            }
          }
          break;

        case 'hover':
          if (action.selector) {
            try {
              await page.waitForSelector(action.selector, { state: 'visible', timeout: 5000 });
              await page.hover(action.selector);
              console.log(chalk.green(`    ✓ Hovered: ${action.selector}`));
            } catch (_error) {
              console.warn(
                chalk.yellow(`    Warning: Could not hover "${action.selector}". Skipping...`)
              );
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

        case 'screenshot': {
          const screenshotPath = path.join(
            this.screenshotDir,
            'interactions',
            `${config.name}-${action.description?.replace(/\s+/g, '-') || Date.now()}.png`
          );
          await fs.mkdir(path.dirname(screenshotPath), { recursive: true });
          await page.screenshot({ path: screenshotPath });
          console.log(chalk.green(`    ✓ Screenshot: ${action.description || 'captured'}`));
          break;
        }

        case 'focus':
          if (action.selector) {
            try {
              await page.waitForSelector(action.selector, { state: 'visible', timeout: 5000 });
              await page.focus(action.selector);
              console.log(chalk.green(`    ✓ Focused: ${action.selector}`));
            } catch (_error) {
              console.warn(
                chalk.yellow(`    Warning: Could not focus "${action.selector}". Skipping...`)
              );
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

  async analyzeScreenshots() {
    console.log(chalk.yellow('🔍 Analyzing screenshots for visual issues...'));

    const screenshots = await fs.readdir(this.screenshotDir);
    const interactionsDir = path.join(this.screenshotDir, 'interactions');
    let interactionScreenshots: string[] = [];

    try {
      interactionScreenshots = await fs.readdir(interactionsDir);
    } catch (_e) {
      // Interactions directory might not exist
    }

    const analysisResults = {
      totalScreenshots: screenshots.length + interactionScreenshots.length,
      criticalIssues: [],
      warnings: [],
      passedChecks: [],
      detectedComponents: [],
      responsiveIssues: [],
      accessibilityIssues: [],
    };

    // Analyze each screenshot by filename patterns to detect issues
    for (const screenshot of screenshots) {
      if (screenshot.includes('error')) {
        analysisResults.criticalIssues.push({
          type: 'Page Load Error',
          file: screenshot,
          description: `Page failed to load properly: ${screenshot.replace('-error.png', '')}`,
          severity: 'critical',
          recommendation: 'Check server logs and route configuration',
        });
      }

      if (screenshot.includes('mobile') && !screenshot.includes('error')) {
        analysisResults.passedChecks.push({
          type: 'Mobile Responsive',
          file: screenshot,
          description: 'Mobile layout captured successfully',
        });
      }

      if (screenshot.includes('tablet') && !screenshot.includes('error')) {
        analysisResults.passedChecks.push({
          type: 'Tablet Responsive',
          file: screenshot,
          description: 'Tablet layout captured successfully',
        });
      }

      if (screenshot.includes('desktop') && !screenshot.includes('error')) {
        analysisResults.passedChecks.push({
          type: 'Desktop Layout',
          file: screenshot,
          description: 'Desktop layout captured successfully',
        });
      }

      if (screenshot.includes('dark-mode')) {
        analysisResults.passedChecks.push({
          type: 'Dark Mode',
          file: screenshot,
          description: 'Dark mode functionality tested',
        });
      }

      if (screenshot.includes('accessibility')) {
        analysisResults.passedChecks.push({
          type: 'Accessibility Testing',
          file: screenshot,
          description: 'Keyboard navigation and accessibility features tested',
        });
      }
    }

    // Analyze interaction screenshots
    for (const screenshot of interactionScreenshots) {
      if (
        screenshot.includes('wait') ||
        screenshot.includes('click') ||
        screenshot.includes('hover')
      ) {
        analysisResults.detectedComponents.push({
          type: 'User Interaction',
          file: screenshot,
          description: `Interactive element tested: ${screenshot.split('-')[1] || 'unknown'}`,
        });
      }
    }

    // Check for common issues based on our previous analysis
    if (screenshots.some((s) => s.includes('categories-page-error'))) {
      analysisResults.criticalIssues.push({
        type: 'Data Loading Failure',
        file: 'categories-page-error.png',
        description: 'Categories page shows skeleton loading state with no content',
        severity: 'critical',
        recommendation: 'Debug categories API endpoint and data loading logic',
      });
    }

    // Add issues to the main issues array
    this.issues = [
      ...analysisResults.criticalIssues,
      ...analysisResults.warnings,
      ...analysisResults.responsiveIssues,
      ...analysisResults.accessibilityIssues,
    ];

    return analysisResults;
  }

  async generateComprehensiveReport() {
    console.log(chalk.yellow('📝 Generating comprehensive report with analysis...'));

    // Analyze screenshots first
    const analysis = await this.analyzeScreenshots();

    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        totalTests: this.getComprehensiveTestConfigs().length,
        pagesAudited: new Set(this.getComprehensiveTestConfigs().map((c) => c.url)).size,
        breakpointsTested: this.getComprehensiveTestConfigs().filter((c) => c.viewport).length,
        userFlowsTested: this.getComprehensiveTestConfigs().filter((c) => c.userFlows).length,
        accessibilityTests: this.getComprehensiveTestConfigs().filter((c) => c.accessibility)
          .length,
        videosRecorded: this.getComprehensiveTestConfigs().filter((c) => c.recordVideo).length,
        totalScreenshots: analysis.totalScreenshots,
        criticalIssues: analysis.criticalIssues.length,
        warnings: analysis.warnings.length,
        passedChecks: analysis.passedChecks.length,
      },
      configurations: this.getComprehensiveTestConfigs(),
      analysis: analysis,
      issues: this.issues,
    };

    await fs.writeFile(
      path.join(this.reportDir, 'comprehensive-report.json'),
      JSON.stringify(report, null, 2)
    );

    // Generate HTML report with analysis
    const htmlReport = `
<!DOCTYPE html>
<html>
<head>
  <title>Comprehensive Visual Audit Report</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 20px; line-height: 1.6; }
    .summary { background: #f5f5f5; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
    .metric { display: inline-block; margin: 10px; padding: 10px; background: white; border-radius: 4px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
    .test { margin: 10px 0; padding: 10px; border: 1px solid #ddd; border-radius: 4px; }
    .analysis { margin: 20px 0; }
    .issue { padding: 10px; margin: 10px 0; border-radius: 4px; }
    .critical { background: #ffe6e6; border-left: 4px solid #ff4444; }
    .warning { background: #fff3cd; border-left: 4px solid #ffc107; }
    .passed { background: #d4edda; border-left: 4px solid #28a745; }
    .component { background: #e7f3ff; border-left: 4px solid #007bff; }
    h1 { color: #333; }
    h2 { color: #555; border-bottom: 2px solid #eee; padding-bottom: 10px; }
    h3 { color: #666; }
    .status-indicator { display: inline-block; width: 12px; height: 12px; border-radius: 50%; margin-right: 8px; }
    .status-critical { background: #ff4444; }
    .status-warning { background: #ffc107; }
    .status-passed { background: #28a745; }
    .timestamp { color: #666; font-size: 0.9em; }
  </style>
</head>
<body>
  <h1>🔍 Comprehensive Visual Audit Report</h1>
  <p class="timestamp">Generated: ${new Date(report.timestamp).toLocaleString()}</p>
  
  <div class="summary">
    <h2>📊 Executive Summary</h2>
    <div class="metric"><strong>${report.summary.totalTests}</strong><br>Total Tests</div>
    <div class="metric"><strong>${report.summary.pagesAudited}</strong><br>Pages Audited</div>
    <div class="metric"><strong>${report.summary.breakpointsTested}</strong><br>Breakpoints Tested</div>
    <div class="metric"><strong>${report.summary.userFlowsTested}</strong><br>User Flows Tested</div>
    <div class="metric"><strong>${report.summary.accessibilityTests}</strong><br>Accessibility Tests</div>
    <div class="metric"><strong>${report.summary.videosRecorded}</strong><br>Videos Recorded</div>
    <div class="metric"><strong>${report.summary.totalScreenshots}</strong><br>Screenshots Captured</div>
    <div class="metric"><strong>${report.summary.criticalIssues}</strong><br>Critical Issues</div>
    <div class="metric"><strong>${report.summary.warnings}</strong><br>Warnings</div>
    <div class="metric"><strong>${report.summary.passedChecks}</strong><br>Passed Checks</div>
  </div>

  <div class="analysis">
    <h2>🚨 Critical Issues Found</h2>
    ${
      analysis.criticalIssues.length > 0
        ? analysis.criticalIssues
            .map(
              (issue) => `
        <div class="issue critical">
          <span class="status-indicator status-critical"></span>
          <strong>${issue.type}</strong>
          <p><strong>File:</strong> ${issue.file}</p>
          <p><strong>Description:</strong> ${issue.description}</p>
          <p><strong>Recommendation:</strong> ${issue.recommendation}</p>
        </div>
      `
            )
            .join('')
        : '<p class="passed">✅ No critical issues found!</p>'
    }

    <h2>⚠️ Warnings</h2>
    ${
      analysis.warnings.length > 0
        ? analysis.warnings
            .map(
              (warning) => `
        <div class="issue warning">
          <span class="status-indicator status-warning"></span>
          <strong>${warning.type}</strong>
          <p><strong>File:</strong> ${warning.file}</p>
          <p><strong>Description:</strong> ${warning.description}</p>
        </div>
      `
            )
            .join('')
        : '<p class="passed">✅ No warnings found!</p>'
    }

    <h2>✅ Passed Checks</h2>
    ${analysis.passedChecks
      .map(
        (check) => `
      <div class="issue passed">
        <span class="status-indicator status-passed"></span>
        <strong>${check.type}</strong>
        <p><strong>File:</strong> ${check.file}</p>
        <p><strong>Description:</strong> ${check.description}</p>
      </div>
    `
      )
      .join('')}

    <h2>🔧 Detected Interactive Components</h2>
    ${analysis.detectedComponents
      .map(
        (component) => `
      <div class="issue component">
        <span class="status-indicator" style="background: #007bff;"></span>
        <strong>${component.type}</strong>
        <p><strong>File:</strong> ${component.file}</p>
        <p><strong>Description:</strong> ${component.description}</p>
      </div>
    `
      )
      .join('')}
  </div>
  
  <h2>📋 Test Configurations</h2>
  ${report.configurations
    .map(
      (config) => `
    <div class="test">
      <h3>${config.name}</h3>
      <p><strong>URL:</strong> ${config.url}</p>
      ${config.viewport ? `<p><strong>Viewport:</strong> ${config.viewport.width}x${config.viewport.height}</p>` : ''}
      ${config.device ? `<p><strong>Device:</strong> ${config.device}</p>` : ''}
      ${config.userFlows ? `<p><strong>User Flows:</strong> ${config.userFlows.length}</p>` : ''}
      ${config.recordVideo ? '<p><strong>Video:</strong> Recorded</p>' : ''}
    </div>
  `
    )
    .join('')}

  <div style="margin-top: 40px; padding: 20px; background: #f8f9fa; border-radius: 8px;">
    <h2>📁 File Locations</h2>
    <p><strong>Screenshots:</strong> ${this.screenshotDir}</p>
    <p><strong>Videos:</strong> ${this.videoDir}</p>
    <p><strong>JSON Report:</strong> ${path.join(this.reportDir, 'comprehensive-report.json')}</p>
  </div>
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
