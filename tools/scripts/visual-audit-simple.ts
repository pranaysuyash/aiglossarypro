#!/usr/bin/env tsx

/**
 * Simple Visual Audit Script
 *
 * This version:
 * 1. Takes screenshots of your app
 * 2. Saves them to a directory
 * 3. Generates a prompt file for Claude analysis
 * 4. Creates a template for the audit report
 */

import { exec, spawn } from 'node:child_process';
import fs from 'node:fs/promises';
import path from 'node:path';
import { promisify } from 'node:util';
import chalk from 'chalk';
import { config } from 'dotenv';
import { chromium } from 'playwright';

// Load environment variables from .env file
config();

const execAsync = promisify(exec);

interface ScreenshotConfig {
  name: string;
  url: string;
  viewport?: { width: number; height: number };
  actions?: Array<{
    type: 'click' | 'hover' | 'type' | 'scroll' | 'wait';
    selector?: string;
    value?: string | number;
  }>;
}

class SimpleVisualAuditor {
  // Base URL for the site under test – can be overridden via BASE_URL env var
  private baseUrl = process.env.BASE_URL || 'http://localhost:5173';
  private outputDir: string;
  private viteProcess: any = null;

  constructor() {
    const timestamp = new Date().toISOString().split('T')[0];
    this.outputDir = path.join(process.cwd(), 'visual-audits', timestamp);
  }

  async initialize() {
    await fs.mkdir(this.outputDir, { recursive: true });
    console.log(chalk.blue('📸 Visual Audit Started'));
    console.log(chalk.gray(`Output directory: ${this.outputDir}`));
  }

  async startServer(): Promise<void> {
    // Check if server is already running on the target URL
    try {
      await execAsync(`curl -s ${this.baseUrl}/ > /dev/null 2>&1`);
      console.log(chalk.green('✅ Using existing server'));
      return;
    } catch (_error) {
      // Server not running, start it
    }

    console.log(chalk.yellow('Starting development server...'));

    return new Promise((resolve, reject) => {
      this.viteProcess = spawn('npm', ['run', 'dev'], {
        stdio: 'pipe',
        shell: true,
      });

      let viteUrl = '';

      this.viteProcess.stdout.on('data', (data: Buffer) => {
        const output = data.toString();
        console.log(chalk.gray(output.trim()));

        // Parse Vite's Local URL if we don't have BASE_URL set
        if (!process.env.BASE_URL && output.includes('Local:')) {
          const localMatch = output.match(/Local:\s+(http:\/\/localhost:\d+)/);
          if (localMatch) {
            viteUrl = localMatch[1];
            this.baseUrl = viteUrl;
            console.log(chalk.cyan(`🔗 Detected Vite URL: ${this.baseUrl}`));
          }
        }

        if (output.includes('ready in') || output.includes('Local:')) {
          console.log(chalk.green('✅ Server ready'));
          // Wait longer for Vite proxy to be fully ready
          setTimeout(resolve, 5000);
        }
      });

      this.viteProcess.stderr.on('data', (data: Buffer) => {
        console.error(chalk.red(data.toString()));
      });

      this.viteProcess.on('error', reject);
      setTimeout(() => reject(new Error('Server startup timeout')), 45000);
    });
  }

  async captureScreenshots() {
    const browser = await chromium.launch({ headless: true });

    const configs: ScreenshotConfig[] = [
      // Desktop views
      { name: '01-homepage-desktop', url: '/', viewport: { width: 1920, height: 1080 } },
      { name: '02-terms-desktop', url: '/terms', viewport: { width: 1920, height: 1080 } },
      {
        name: '03-categories-desktop',
        url: '/categories',
        viewport: { width: 1920, height: 1080 },
      },
      { name: '04-dashboard-desktop', url: '/dashboard', viewport: { width: 1920, height: 1080 } },

      // Mobile views
      { name: '05-homepage-mobile', url: '/', viewport: { width: 375, height: 812 } },
      { name: '06-terms-mobile', url: '/terms', viewport: { width: 375, height: 812 } },

      // Tablet views
      { name: '07-homepage-tablet', url: '/', viewport: { width: 768, height: 1024 } },

      // Interactive states
      {
        name: '08-search-active',
        url: '/',
        viewport: { width: 1920, height: 1080 },
        actions: [
          { type: 'click', selector: '#search input' },
          { type: 'type', selector: '#search input', value: 'neural' },
          { type: 'wait', value: 1500 },
        ],
      },
      {
        name: '09-mobile-menu-open',
        url: '/',
        viewport: { width: 375, height: 812 },
        actions: [
          { type: 'wait', value: 1000 },
          { type: 'click', selector: 'button[aria-label*="menu"]' },
          { type: 'wait', value: 500 },
        ],
      },
    ];

    console.log(chalk.yellow(`Taking ${configs.length} screenshots...`));

    for (const config of configs) {
      console.log(chalk.gray(`  📸 ${config.name}...`));

      const page = await browser.newPage();

      if (config.viewport) {
        await page.setViewportSize(config.viewport);
      }

      await page.goto(`${this.baseUrl}${config.url}`, {
        waitUntil: 'domcontentloaded',
        timeout: 30000,
      });

      // Wait for body to ensure page is rendered
      await page.waitForSelector('body', { timeout: 10000 });

      // Perform actions if specified
      if (config.actions) {
        for (const action of config.actions) {
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
            case 'hover':
              if (action.selector) await page.hover(action.selector);
              break;
            case 'scroll':
              await page.evaluate(pixels => {
                window.scrollBy(0, pixels as number);
              }, action.value || 100);
              break;
          }
        }
      }

      // Take screenshot
      await page.screenshot({
        path: path.join(this.outputDir, `${config.name}.png`),
        fullPage: !config.name.includes('mobile'),
      });

      await page.close();
    }

    await browser.close();
    console.log(chalk.green('✅ Screenshots captured'));
  }

  async generateAnalysisPrompt() {
    const promptPath = path.join(this.outputDir, 'claude-analysis-prompt.md');

    const prompt = `# Visual Audit Analysis Request

Please analyze the screenshots in this directory and identify UI/UX issues.

## Screenshots Overview

1. **01-homepage-desktop.png** - Desktop homepage (1920x1080)
2. **02-terms-desktop.png** - Terms listing page desktop
3. **03-categories-desktop.png** - Categories page desktop
4. **04-dashboard-desktop.png** - User dashboard desktop
5. **05-homepage-mobile.png** - Mobile homepage (375x812)
6. **06-terms-mobile.png** - Terms listing mobile
7. **07-homepage-tablet.png** - Tablet homepage (768x1024)
8. **08-search-active.png** - Search functionality with results
9. **09-mobile-menu-open.png** - Mobile navigation menu

## Analysis Guidelines

For each screenshot, please identify:

### 1. Visual Hierarchy Issues
- Is the most important content prominently displayed?
- Are CTAs (Call-to-Actions) clearly visible?
- Is there proper visual flow?

### 2. Color & Contrast
- Are there any contrast issues (WCAG AA compliance)?
- Is the color scheme consistent?
- Are interactive elements clearly distinguishable?

### 3. Typography
- Is text readable at all sizes?
- Are font sizes appropriate for the device?
- Is there consistent typography hierarchy?

### 4. Layout & Spacing
- Are elements properly aligned?
- Is spacing consistent throughout?
- Are there any overlapping elements?

### 5. Responsive Design
- Do mobile/tablet views work properly?
- Is content appropriately reorganized for smaller screens?
- Are touch targets large enough (44x44px minimum)?

### 6. Accessibility Concerns
- Are interactive elements clearly labeled?
- Is there sufficient color contrast?
- Are focus states visible?

### 7. Consistency Issues
- Are UI patterns consistent across pages?
- Is the design language cohesive?
- Are interactions predictable?

## Output Format

Please provide your analysis in this format:

### [Screenshot Name]

**Issues Found:**
1. **[SEVERITY: Critical/High/Medium/Low]** - Issue description
   - **Impact**: How this affects users
   - **Fix**: Specific recommendation

**Positive Observations:**
- What's working well

---

After analyzing all screenshots, please provide:

## Summary & Prioritized Action Items

1. **Critical Issues** (Must fix immediately)
2. **High Priority** (Should fix soon)
3. **Medium Priority** (Plan to fix)
4. **Low Priority** (Nice to have)

## How to Use This Prompt

1. Navigate to the screenshot directory:
   \`\`\`bash
   cd ${this.outputDir}
   \`\`\`

2. Use the Claude CLI to analyze all screenshots:
   \`\`\`bash
   claude -p "@./ Analyze these UI screenshots following the guidelines in claude-analysis-prompt.md"
   \`\`\`

3. Or manually review each screenshot and document findings in visual-audit-report.md
`;

    await fs.writeFile(promptPath, prompt);
    console.log(chalk.green(`✅ Analysis prompt generated: ${promptPath}`));
  }

  async generateReportTemplate() {
    const reportPath = path.join(this.outputDir, 'visual-audit-report.md');

    const template = `# Visual Audit Report
Date: ${new Date().toLocaleDateString()}
Auditor: [Your Name]

## Executive Summary

[Brief overview of findings]

- Total Issues Found: XX
- Critical Issues: XX
- High Priority: XX
- Medium Priority: XX
- Low Priority: XX

## Detailed Findings

### Homepage Desktop (01-homepage-desktop.png)

**Issues:**
1. **[SEVERITY]** - Issue description
   - Impact: 
   - Fix: 

**Working Well:**
- 

---

### Terms Desktop (02-terms-desktop.png)

**Issues:**
1. **[SEVERITY]** - Issue description
   - Impact: 
   - Fix: 

**Working Well:**
- 

---

### Categories Desktop (03-categories-desktop.png)

**Issues:**
1. **[SEVERITY]** - Issue description
   - Impact: 
   - Fix: 

**Working Well:**
- 

---

### Dashboard Desktop (04-dashboard-desktop.png)

**Issues:**
1. **[SEVERITY]** - Issue description
   - Impact: 
   - Fix: 

**Working Well:**
- 

---

### Homepage Mobile (05-homepage-mobile.png)

**Issues:**
1. **[SEVERITY]** - Issue description
   - Impact: 
   - Fix: 

**Working Well:**
- 

---

### Terms Mobile (06-terms-mobile.png)

**Issues:**
1. **[SEVERITY]** - Issue description
   - Impact: 
   - Fix: 

**Working Well:**
- 

---

### Homepage Tablet (07-homepage-tablet.png)

**Issues:**
1. **[SEVERITY]** - Issue description
   - Impact: 
   - Fix: 

**Working Well:**
- 

---

### Search Active (08-search-active.png)

**Issues:**
1. **[SEVERITY]** - Issue description
   - Impact: 
   - Fix: 

**Working Well:**
- 

---

### Mobile Menu Open (09-mobile-menu-open.png)

**Issues:**
1. **[SEVERITY]** - Issue description
   - Impact: 
   - Fix: 

**Working Well:**
- 

---

## Action Items

### Critical (Fix Immediately)
1. 
2. 

### High Priority (Fix This Week)
1. 
2. 

### Medium Priority (Fix This Sprint)
1. 
2. 

### Low Priority (Backlog)
1. 
2. 

## Recommendations

### Design System Improvements
- 

### Accessibility Enhancements
- 

### Performance Optimizations
- 

### User Experience Enhancements
- 

---

*Generated by Visual Audit Script*
`;

    await fs.writeFile(reportPath, template);
    console.log(chalk.green(`✅ Report template generated: ${reportPath}`));
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
      await this.startServer();
      await this.captureScreenshots();
      await this.generateAnalysisPrompt();
      await this.generateReportTemplate();

      console.log(chalk.green('\n✨ Visual audit complete!\n'));
      console.log(chalk.blue('Next steps:'));
      console.log(chalk.gray('1. Review screenshots in:'), this.outputDir);
      console.log(
        chalk.gray('2. Use Claude to analyze:'),
        `claude -p "@${this.outputDir}/ Analyze these UI screenshots"`
      );
      console.log(
        chalk.gray('3. Or manually fill out:'),
        path.join(this.outputDir, 'visual-audit-report.md')
      );
    } catch (error) {
      console.error(chalk.red('❌ Error:'), error);
      throw error;
    } finally {
      await this.cleanup();
    }
  }
}

// Run if called directly
const isMainModule = import.meta.url === `file://${process.argv[1]}`;
if (isMainModule) {
  const auditor = new SimpleVisualAuditor();
  auditor.run().catch(console.error);
}

export { SimpleVisualAuditor };
