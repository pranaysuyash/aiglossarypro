#!/usr/bin/env tsx

/**
 * Fixed Visual Audit Script
 *
 * This version addresses the blank screenshot issue by:
 * 1. Waiting for content to load properly
 * 2. Handling loading states
 * 3. Taking debug screenshots during the process
 * 4. Adding proper error handling
 */

import { exec } from 'node:child_process';
import fs from 'node:fs/promises';
import path from 'node:path';
import { promisify } from 'node:util';
import chalk from 'chalk';
import { chromium, type Page } from 'playwright';

const execAsync = promisify(exec);

interface ScreenshotConfig {
  name: string;
  url: string;
  viewport?: { width: number; height: number };
  waitForSelector?: string;
  description: string;
}

class FixedVisualAuditor {
  private baseUrl = process.env.BASE_URL || 'http://localhost:3001';
  private outputDir: string;
  private viteProcess: any = null;

  constructor() {
    const timestamp = new Date().toISOString().split('T')[0];
    this.outputDir = path.join(process.cwd(), 'visual-audits-fixed', timestamp);
  }

  async initialize() {
    await fs.mkdir(this.outputDir, { recursive: true });
    console.log(chalk.blue('📸 Fixed Visual Audit Started'));
    console.log(chalk.gray(`Output directory: ${this.outputDir}`));
  }

  async checkServer(): Promise<boolean> {
    try {
      await execAsync(`curl -s ${this.baseUrl}/ > /dev/null`);
      console.log(chalk.green('✅ Server is responding'));
      return true;
    } catch (_error) {
      console.log(chalk.red('❌ Server not responding'));
      return false;
    }
  }

  async waitForPageContent(page: Page, timeout = 10000): Promise<boolean> {
    try {
      // Wait for the React app to mount
      await page.waitForFunction(() => document.querySelector('#root')?.children.length > 0, {
        timeout,
      });

      // Wait for main content to load
      await page.waitForFunction(
        () => {
          const root = document.querySelector('#root');
          return root?.textContent && root.textContent.trim().length > 100;
        },
        { timeout }
      );

      return true;
    } catch (error) {
      console.log(chalk.yellow(`⚠️ Content loading timeout: ${error.message}`));
      return false;
    }
  }

  async captureScreenshots() {
    const browser = await chromium.launch({
      headless: false, // Use headed mode to see what's happening
      slowMo: 1000, // Slow down for debugging
    });

    const configs: ScreenshotConfig[] = [
      {
        name: '01-homepage-desktop',
        url: '/',
        viewport: { width: 1920, height: 1080 },
        waitForSelector: 'header, main, [role="main"]',
        description: 'Homepage desktop view',
      },
      {
        name: '02-terms-desktop',
        url: '/terms',
        viewport: { width: 1920, height: 1080 },
        waitForSelector: '[data-testid="terms-list"], .terms-container, main',
        description: 'Terms listing page',
      },
      {
        name: '03-categories-desktop',
        url: '/categories',
        viewport: { width: 1920, height: 1080 },
        waitForSelector: '[data-testid="categories-list"], .categories-container, main',
        description: 'Categories page',
      },
      {
        name: '04-homepage-mobile',
        url: '/',
        viewport: { width: 375, height: 812 },
        waitForSelector: 'header, main',
        description: 'Homepage mobile view',
      },
    ];

    console.log(chalk.yellow(`Taking ${configs.length} screenshots...`));

    for (const config of configs) {
      console.log(chalk.gray(`  📸 ${config.description}...`));

      const page = await browser.newPage();

      // Set viewport
      if (config.viewport) {
        await page.setViewportSize(config.viewport);
      }

      try {
        // Enable request/response logging
        page.on('request', (request) => {
          if (request.url().includes('api')) {
            console.log(chalk.blue(`    🔗 API Request: ${request.url()}`));
          }
        });

        page.on('response', (response) => {
          if (response.url().includes('api')) {
            console.log(
              chalk.blue(`    📡 API Response: ${response.url()} - ${response.status()}`)
            );
          }
        });

        // Navigate to page
        console.log(chalk.gray(`    Navigating to ${config.url}...`));
        await page.goto(`${this.baseUrl}${config.url}`, {
          waitUntil: 'domcontentloaded',
          timeout: 30000,
        });

        // Wait for content to load
        console.log(chalk.gray(`    Waiting for content...`));
        const contentLoaded = await this.waitForPageContent(page);

        if (!contentLoaded) {
          console.log(chalk.yellow(`    ⚠️ Taking screenshot anyway...`));
        }

        // Wait a bit more for any animations
        await page.waitForTimeout(2000);

        // Take debug screenshot first
        const debugPath = path.join(this.outputDir, `debug-${config.name}.png`);
        await page.screenshot({
          path: debugPath,
          fullPage: false,
        });

        // Check if page has content
        const hasContent = await page.evaluate(() => {
          const body = document.body;
          const textContent = body.textContent || '';
          const hasElements = body.children.length > 0;

          return {
            textLength: textContent.trim().length,
            hasElements,
            title: document.title,
            url: window.location.href,
          };
        });

        console.log(chalk.gray(`    Page info: ${JSON.stringify(hasContent)}`));

        // Take final screenshot
        const screenshotPath = path.join(this.outputDir, `${config.name}.png`);
        await page.screenshot({
          path: screenshotPath,
          fullPage: !config.name.includes('mobile'),
        });

        console.log(chalk.green(`    ✅ Screenshot saved: ${config.name}`));
      } catch (error) {
        console.error(chalk.red(`    ❌ Error capturing ${config.name}:`), error.message);

        // Take error screenshot
        try {
          const errorPath = path.join(this.outputDir, `error-${config.name}.png`);
          await page.screenshot({
            path: errorPath,
            fullPage: false,
          });
        } catch (_screenshotError) {
          console.error(chalk.red('    Failed to take error screenshot'));
        }
      }

      await page.close();
    }

    await browser.close();
    console.log(chalk.green('✅ Screenshots completed'));
  }

  async generateDiagnosticReport() {
    const reportPath = path.join(this.outputDir, 'diagnostic-report.md');

    const report = `# Visual Audit Diagnostic Report
Generated: ${new Date().toISOString()}

## Issue Investigation

The visual audit captured blank screenshots. This suggests one of these issues:

### Possible Causes:
1. **Authentication Required**: Pages redirect to login
2. **API Failures**: Critical API calls are failing
3. **JavaScript Errors**: React app not mounting properly
4. **CSS/Asset Loading**: Stylesheets or fonts not loading
5. **Database Issues**: Backend returning empty data

### Screenshots Captured:
${await this.listScreenshots()}

## Debugging Steps:

1. **Check Server Logs**: Look for API errors during screenshot capture
2. **Test Manual Navigation**: Visit each URL manually in browser
3. **Check Network Tab**: Look for failed API requests
4. **Verify Database**: Ensure data exists and queries work
5. **Check Console**: Look for JavaScript errors

## Next Steps:

1. Fix identified issues
2. Re-run visual audit
3. Compare before/after screenshots
4. Document improvements

---

*This report was generated because screenshots were blank/incomplete*
`;

    await fs.writeFile(reportPath, report);
    console.log(chalk.green(`✅ Diagnostic report generated: ${reportPath}`));
  }

  async listScreenshots(): Promise<string> {
    try {
      const files = await fs.readdir(this.outputDir);
      const screenshots = files.filter((f) => f.endsWith('.png'));

      return screenshots.map((f) => `- ${f}`).join('\n');
    } catch (_error) {
      return 'Error listing screenshots';
    }
  }

  async cleanup() {
    if (this.viteProcess) {
      console.log(chalk.yellow('Stopping server...'));
      this.viteProcess.kill();
    } else {
      console.log(chalk.gray('Server was already running, left it running'));
    }
  }

  async run() {
    try {
      await this.initialize();

      const serverOk = await this.checkServer();
      if (!serverOk) {
        throw new Error('Server not responding. Please start the development server first.');
      }

      await this.captureScreenshots();
      await this.generateDiagnosticReport();

      console.log(chalk.green('\n✨ Fixed visual audit complete!\n'));
      console.log(chalk.blue('Next steps:'));
      console.log(chalk.gray('1. Review debug screenshots in:'), this.outputDir);
      console.log(chalk.gray('2. Check diagnostic report for issues'));
      console.log(chalk.gray('3. Fix any identified problems'));
      console.log(chalk.gray('4. Re-run the audit'));
    } catch (error) {
      console.error(chalk.red('❌ Error:'), error.message);
      throw error;
    } finally {
      await this.cleanup();
    }
  }
}

// Run if called directly
const isMainModule = import.meta.url === `file://${process.argv[1]}`;
if (isMainModule) {
  const auditor = new FixedVisualAuditor();
  auditor.run().catch(console.error);
}

export { FixedVisualAuditor };
