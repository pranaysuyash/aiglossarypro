#!/usr/bin/env tsx

/**
 * Quick Visual Audit Script (assumes server is already running)
 */

import { chromium, Browser, Page } from 'playwright';
import fs from 'fs/promises';
import path from 'path';
import chalk from 'chalk';

interface PageConfig {
  name: string;
  url: string;
  viewport?: { width: number; height: number };
  actions?: Array<{
    type: 'click' | 'hover' | 'type' | 'scroll' | 'wait';
    selector?: string;
    value?: string | number;
  }>;
}

class QuickVisualAuditor {
  private browser: Browser | null = null;
  private baseUrl = 'http://localhost:3001';
  private screenshotDir: string;

  constructor() {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    this.screenshotDir = path.join(process.cwd(), 'visual-audit-quick', timestamp);
  }

  async initialize() {
    await fs.mkdir(this.screenshotDir, { recursive: true });
    console.log(chalk.blue('🚀 Starting Quick Visual Audit...'));
    console.log(chalk.gray(`Screenshots: ${this.screenshotDir}`));
  }

  async launchBrowser() {
    console.log(chalk.yellow('🌐 Launching browser...'));
    this.browser = await chromium.launch({
      headless: false, // Show browser for debugging
    });
  }

  async captureScreenshots() {
    if (!this.browser) throw new Error('Browser not initialized');

    const pages: PageConfig[] = [
      {
        name: 'homepage',
        url: '/',
        viewport: { width: 1920, height: 1080 }
      },
      {
        name: 'homepage-mobile',
        url: '/',
        viewport: { width: 375, height: 812 }
      },
      {
        name: 'homepage-tablet',
        url: '/',
        viewport: { width: 768, height: 1024 }
      },
      {
        name: 'favorites',
        url: '/favorites',
        viewport: { width: 1920, height: 1080 }
      },
      {
        name: 'profile',
        url: '/profile',
        viewport: { width: 1920, height: 1080 }
      }
    ];

    console.log(chalk.yellow(`📸 Capturing ${pages.length} page configurations...`));

    for (const pageConfig of pages) {
      console.log(chalk.gray(`  Capturing ${pageConfig.name}...`));
      
      const page = await this.browser.newPage();
      
      if (pageConfig.viewport) {
        await page.setViewportSize(pageConfig.viewport);
      }

      try {
        await page.goto(`${this.baseUrl}${pageConfig.url}`, {
          waitUntil: 'networkidle',
          timeout: 30000
        });

        // Wait for content to load
        await page.waitForTimeout(2000);

        // Perform actions if any
        if (pageConfig.actions) {
          for (const action of pageConfig.actions) {
            await this.performAction(page, action);
          }
        }

        // Take screenshot
        const screenshotPath = path.join(this.screenshotDir, `${pageConfig.name}.png`);
        await page.screenshot({
          path: screenshotPath,
          fullPage: pageConfig.name.includes('mobile') ? false : true
        });

        console.log(chalk.green(`    ✓ ${pageConfig.name} captured`));

      } catch (error) {
        console.error(chalk.red(`    ✗ Error capturing ${pageConfig.name}:`), error);
      }

      await page.close();
    }

    console.log(chalk.green('✅ Screenshots captured'));
  }

  private async performAction(page: Page, action: any) {
    switch (action.type) {
      case 'click':
        if (action.selector) await page.click(action.selector);
        break;
      case 'type':
        if (action.selector && action.value) {
          await page.fill(action.selector, String(action.value));
        }
        break;
      case 'wait':
        await page.waitForTimeout(Number(action.value) || 1000);
        break;
    }
  }

  async cleanup() {
    if (this.browser) {
      await this.browser.close();
    }
  }

  async run() {
    try {
      await this.initialize();
      await this.launchBrowser();
      await this.captureScreenshots();
      
      console.log(chalk.green('✨ Quick visual audit complete!'));
      console.log(chalk.blue(`\nScreenshots saved to: ${this.screenshotDir}`));
      
    } catch (error) {
      console.error(chalk.red('❌ Error during visual audit:'), error);
      throw error;
    } finally {
      await this.cleanup();
    }
  }
}

// Run the auditor
const auditor = new QuickVisualAuditor();
auditor.run().catch(console.error);