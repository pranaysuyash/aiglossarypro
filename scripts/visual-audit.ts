#!/usr/bin/env tsx

/**
 * Automated Visual Audit Script
 * 
 * This script:
 * 1. Starts the Vite React app
 * 2. Opens pages in a browser using Playwright
 * 3. Takes screenshots of different pages/states
 * 4. Passes screenshots to Claude for visual analysis
 * 5. Generates a comprehensive report with issues and action items
 */

import { chromium, Browser, Page } from 'playwright';
import { exec, spawn } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import path from 'path';
import chalk from 'chalk';

const execAsync = promisify(exec);

interface PageConfig {
  name: string;
  url: string;
  viewport?: { width: number; height: number };
  actions?: Array<{
    type: 'click' | 'hover' | 'type' | 'scroll' | 'wait';
    selector?: string;
    value?: string | number;
  }>;
  states?: Array<{
    name: string;
    setup: Array<{ type: string; selector?: string; value?: string | number }>;
  }>;
}

interface VisualIssue {
  page: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  category: string;
  description: string;
  recommendation: string;
  screenshot?: string;
}

class VisualAuditor {
  private browser: Browser | null = null;
  private viteProcess: any = null;
  private baseUrl = process.env.BASE_URL || 'http://localhost:3001';
  private screenshotDir: string;
  private reportDir: string;
  private issues: VisualIssue[] = [];

  constructor() {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    this.screenshotDir = path.join(process.cwd(), 'visual-audit', timestamp, 'screenshots');
    this.reportDir = path.join(process.cwd(), 'visual-audit', timestamp);
  }

  async initialize() {
    // Create directories
    await fs.mkdir(this.screenshotDir, { recursive: true });
    await fs.mkdir(this.reportDir, { recursive: true });

    console.log(chalk.blue('🚀 Starting Visual Audit...'));
    console.log(chalk.gray(`Screenshots: ${this.screenshotDir}`));
    console.log(chalk.gray(`Report: ${this.reportDir}`));
  }

  async startViteServer(): Promise<void> {
    console.log(chalk.yellow('⚡ Starting Vite development server...'));
    
    return new Promise((resolve, reject) => {
      this.viteProcess = spawn('npm', ['run', 'dev'], {
        stdio: 'pipe',
        shell: true
      });

      this.viteProcess.stdout.on('data', (data: Buffer) => {
        const output = data.toString();
        if (output.includes('ready in') || output.includes('Local:')) {
          console.log(chalk.green('✅ Vite server ready'));
          setTimeout(resolve, 2000); // Give it 2 more seconds to fully stabilize
        }
      });

      this.viteProcess.stderr.on('data', (data: Buffer) => {
        console.error(chalk.red('Vite Error:'), data.toString());
      });

      this.viteProcess.on('error', reject);

      // Timeout after 30 seconds
      setTimeout(() => reject(new Error('Vite server timeout')), 30000);
    });
  }

  async launchBrowser() {
    console.log(chalk.yellow('🌐 Launching browser...'));
    this.browser = await chromium.launch({
      headless: true, // Set to false to see the browser
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
        name: 'terms-listing',
        url: '/terms',
        viewport: { width: 1920, height: 1080 }
      },
      {
        name: 'categories',
        url: '/categories',
        viewport: { width: 1920, height: 1080 }
      },
      {
        name: 'search-active',
        url: '/',
        viewport: { width: 1920, height: 1080 },
        actions: [
          { type: 'click', selector: '#search input' },
          { type: 'type', selector: '#search input', value: 'machine learning' },
          { type: 'wait', value: 1000 }
        ]
      },
      {
        name: 'mobile-menu',
        url: '/',
        viewport: { width: 375, height: 812 },
        actions: [
          { type: 'click', selector: 'button[aria-label*="menu"]' },
          { type: 'wait', value: 500 }
        ]
      },
      {
        name: 'dark-mode',
        url: '/',
        viewport: { width: 1920, height: 1080 },
        actions: [
          { type: 'click', selector: 'button[aria-label*="theme"]' },
          { type: 'wait', value: 500 }
        ]
      }
    ];

    console.log(chalk.yellow(`📸 Capturing ${pages.length} page configurations...`));

    for (const pageConfig of pages) {
      console.log(chalk.gray(`  Capturing ${pageConfig.name}...`));
      
      const page = await this.browser.newPage();
      
      // Set viewport
      if (pageConfig.viewport) {
        await page.setViewportSize(pageConfig.viewport);
      }

      // Navigate to page
      await page.goto(`${this.baseUrl}${pageConfig.url}`, {
        waitUntil: 'domcontentloaded'
      });

      // Perform any actions
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

      // Capture different states if defined
      if (pageConfig.states) {
        for (const state of pageConfig.states) {
          console.log(chalk.gray(`    State: ${state.name}...`));
          
          // Setup state
          for (const setup of state.setup) {
            await this.performAction(page, setup);
          }

          // Take state screenshot
          const stateScreenshotPath = path.join(
            this.screenshotDir,
            `${pageConfig.name}-${state.name}.png`
          );
          await page.screenshot({
            path: stateScreenshotPath,
            fullPage: false
          });
        }
      }

      await page.close();
    }

    console.log(chalk.green('✅ Screenshots captured'));
  }

  private async performAction(page: Page, action: any) {
    switch (action.type) {
      case 'click':
        if (action.selector) {
          await page.click(action.selector);
        }
        break;
      case 'hover':
        if (action.selector) {
          await page.hover(action.selector);
        }
        break;
      case 'type':
        if (action.selector && action.value) {
          await page.fill(action.selector, String(action.value));
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
    }
  }

  async analyzeWithClaude() {
    console.log(chalk.yellow('🤖 Analyzing screenshots with Claude...'));
    
    const screenshots = await fs.readdir(this.screenshotDir);
    
    for (const screenshot of screenshots) {
      const screenshotPath = path.join(this.screenshotDir, screenshot);
      console.log(chalk.gray(`  Analyzing ${screenshot}...`));
      
      try {
        // Create a prompt for Claude
        const prompt = `Analyze this screenshot of a web application and identify any visual, UX, or accessibility issues. 
        Focus on:
        1. Visual hierarchy and layout issues
        2. Color contrast and readability
        3. Responsive design problems
        4. Accessibility concerns
        5. Inconsistent styling or spacing
        6. Missing or unclear UI elements
        7. Mobile usability issues
        
        For each issue found, provide:
        - Severity (critical/high/medium/low)
        - Category (layout/color/typography/accessibility/responsiveness/consistency)
        - Clear description
        - Specific recommendation to fix it
        
        Screenshot name: ${screenshot}`;

        // Execute claude command with the screenshot
        const claudeCommand = `claude -p "@${screenshotPath} ${prompt}"`;
        
        const { stdout } = await execAsync(claudeCommand, {
          maxBuffer: 10 * 1024 * 1024 // 10MB buffer
        });

        // Parse Claude's response and add to issues
        this.parseClaudeResponse(stdout, screenshot);
        
      } catch (error) {
        console.error(chalk.red(`Error analyzing ${screenshot}:`), error);
      }
    }
  }

  private parseClaudeResponse(response: string, screenshotName: string) {
    // This is a simplified parser - you might want to make it more sophisticated
    // Claude's response should be structured, so we can parse it
    
    const lines = response.split('\n');
    let currentIssue: Partial<VisualIssue> | null = null;
    
    for (const line of lines) {
      if (line.toLowerCase().includes('severity:')) {
        if (currentIssue && currentIssue.description) {
          this.issues.push(currentIssue as VisualIssue);
        }
        currentIssue = {
          page: screenshotName.replace('.png', ''),
          severity: line.toLowerCase().includes('critical') ? 'critical' :
                   line.toLowerCase().includes('high') ? 'high' :
                   line.toLowerCase().includes('medium') ? 'medium' : 'low',
          screenshot: screenshotName
        };
      } else if (line.toLowerCase().includes('category:') && currentIssue) {
        currentIssue.category = line.split(':')[1].trim();
      } else if (line.toLowerCase().includes('description:') && currentIssue) {
        currentIssue.description = line.split(':')[1].trim();
      } else if (line.toLowerCase().includes('recommendation:') && currentIssue) {
        currentIssue.recommendation = line.split(':')[1].trim();
      }
    }
    
    // Don't forget the last issue
    if (currentIssue && currentIssue.description) {
      this.issues.push(currentIssue as VisualIssue);
    }
  }

  async generateReport() {
    console.log(chalk.yellow('📝 Generating report...'));
    
    const reportPath = path.join(this.reportDir, 'visual-audit-report.md');
    
    const report = `# Visual Audit Report
Generated: ${new Date().toISOString()}

## Summary
- Total Pages Audited: ${new Set(this.issues.map(i => i.page)).size}
- Total Issues Found: ${this.issues.length}
- Critical Issues: ${this.issues.filter(i => i.severity === 'critical').length}
- High Priority Issues: ${this.issues.filter(i => i.severity === 'high').length}

## Issues by Page

${this.generateIssuesByPage()}

## Issues by Category

${this.generateIssuesByCategory()}

## Action Items

${this.generateActionItems()}

## Screenshots
All screenshots are available in: ${path.relative(process.cwd(), this.screenshotDir)}
`;

    await fs.writeFile(reportPath, report);
    console.log(chalk.green(`✅ Report generated: ${reportPath}`));
    
    // Also generate a JSON version for programmatic use
    const jsonReportPath = path.join(this.reportDir, 'visual-audit-report.json');
    await fs.writeFile(jsonReportPath, JSON.stringify({
      timestamp: new Date().toISOString(),
      summary: {
        pagesAudited: new Set(this.issues.map(i => i.page)).size,
        totalIssues: this.issues.length,
        criticalIssues: this.issues.filter(i => i.severity === 'critical').length,
        highPriorityIssues: this.issues.filter(i => i.severity === 'high').length
      },
      issues: this.issues,
      screenshotDirectory: this.screenshotDir
    }, null, 2));
  }

  private generateIssuesByPage(): string {
    const pageGroups = this.groupBy(this.issues, 'page');
    
    return Object.entries(pageGroups)
      .map(([page, issues]) => `### ${page}
${issues.map(issue => `- **[${issue.severity.toUpperCase()}]** ${issue.description}
  - Category: ${issue.category}
  - Fix: ${issue.recommendation}`).join('\n')}`)
      .join('\n\n');
  }

  private generateIssuesByCategory(): string {
    const categoryGroups = this.groupBy(this.issues, 'category');
    
    return Object.entries(categoryGroups)
      .map(([category, issues]) => `### ${category}
${issues.map(issue => `- **[${issue.severity.toUpperCase()}]** ${issue.description} (${issue.page})`).join('\n')}`)
      .join('\n\n');
  }

  private generateActionItems(): string {
    const prioritizedIssues = [...this.issues].sort((a, b) => {
      const severityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
      return severityOrder[a.severity] - severityOrder[b.severity];
    });

    return prioritizedIssues
      .slice(0, 10) // Top 10 action items
      .map((issue, index) => `${index + 1}. **[${issue.severity.toUpperCase()}]** ${issue.recommendation}
   - Page: ${issue.page}
   - Issue: ${issue.description}`)
      .join('\n\n');
  }

  private groupBy<T>(array: T[], key: keyof T): Record<string, T[]> {
    return array.reduce((result, item) => {
      const group = String(item[key]);
      if (!result[group]) result[group] = [];
      result[group].push(item);
      return result;
    }, {} as Record<string, T[]>);
  }

  async cleanup() {
    console.log(chalk.yellow('🧹 Cleaning up...'));
    
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
      await this.captureScreenshots();
      await this.analyzeWithClaude();
      await this.generateReport();
      
      console.log(chalk.green('✨ Visual audit complete!'));
    } catch (error) {
      console.error(chalk.red('❌ Error during visual audit:'), error);
      throw error;
    } finally {
      await this.cleanup();
    }
  }
}

// Run the visual auditor
const isMainModule = import.meta.url === `file://${process.argv[1]}`;
if (isMainModule) {
  const auditor = new VisualAuditor();
  auditor.run().catch(console.error);
}

export { VisualAuditor, VisualIssue };