#!/usr/bin/env tsx

/**
 * Landing Page Visual Audit Script
 *
 * Takes screenshots specifically of the landing page to check:
 * - Header/footer duplication fix
 * - Button spacing and visibility
 * - Mobile responsiveness
 * - Background animations
 * - Overall UX improvements
 */

import fs from 'node:fs/promises';
import path from 'node:path';
import chalk from 'chalk';
import { chromium } from 'playwright';

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

class LandingPageAuditor {
  private baseUrl = 'http://localhost:5173';
  private outputDir: string;

  constructor() {
    const timestamp = new Date()
      .toISOString()
      .replace(/[:.]/g, '-')
      .split('T')
      .join('_')
      .slice(0, -5);
    this.outputDir = path.join(process.cwd(), 'landing-audit-results', timestamp);
  }

  async initialize() {
    await fs.mkdir(this.outputDir, { recursive: true });
    console.log(chalk.blue('📸 Landing Page Visual Audit Started'));
    console.log(chalk.gray(`Output directory: ${this.outputDir}`));
  }

  async captureScreenshots() {
    const browser = await chromium.launch({ headless: false }); // Show browser for debugging

    const configs: ScreenshotConfig[] = [
      // Landing page - desktop
      {
        name: '01-landing-desktop-full',
        url: '/',
        viewport: { width: 1920, height: 1080 },
      },

      // Landing page - mobile
      {
        name: '02-landing-mobile-full',
        url: '/',
        viewport: { width: 375, height: 812 },
      },

      // Landing page - tablet
      {
        name: '03-landing-tablet-full',
        url: '/',
        viewport: { width: 768, height: 1024 },
      },

      // Test header buttons on desktop
      {
        name: '04-header-buttons-desktop',
        url: '/',
        viewport: { width: 1920, height: 1080 },
        actions: [{ type: 'wait', value: 2000 }],
      },

      // Test mobile header and CTA
      {
        name: '05-mobile-header-cta',
        url: '/',
        viewport: { width: 375, height: 812 },
        actions: [{ type: 'wait', value: 2000 }],
      },

      // Test newsletter signup area
      {
        name: '06-newsletter-footer',
        url: '/',
        viewport: { width: 1920, height: 1080 },
        actions: [
          { type: 'scroll', value: 10000 }, // Scroll to bottom
          { type: 'wait', value: 1000 },
        ],
      },

      // Test "See What's Inside" button visibility
      {
        name: '07-see-whats-inside-button',
        url: '/',
        viewport: { width: 1920, height: 1080 },
        actions: [{ type: 'wait', value: 2000 }],
      },

      // Test pricing section scroll navigation
      {
        name: '08-pricing-section',
        url: '/',
        viewport: { width: 1920, height: 1080 },
        actions: [
          { type: 'scroll', value: 3000 }, // Scroll to pricing
          { type: 'wait', value: 1000 },
        ],
      },

      // Test FAQ section scroll navigation
      {
        name: '09-faq-section',
        url: '/',
        viewport: { width: 1920, height: 1080 },
        actions: [
          { type: 'scroll', value: 5000 }, // Scroll to FAQ
          { type: 'wait', value: 1000 },
        ],
      },
    ];

    console.log(chalk.yellow(`Taking ${configs.length} landing page screenshots...`));

    for (const config of configs) {
      console.log(chalk.gray(`  📸 ${config.name}...`));

      const page = await browser.newPage();

      if (config.viewport) {
        await page.setViewportSize(config.viewport);
      }

      try {
        await page.goto(`${this.baseUrl}${config.url}`, {
          waitUntil: 'domcontentloaded',
          timeout: 30000,
        });

        // Wait for content to load
        await page.waitForSelector('body', { timeout: 10000 });
        await page.waitForTimeout(2000); // Extra wait for animations

        // Perform actions if specified
        if (config.actions) {
          for (const action of config.actions) {
            switch (action.type) {
              case 'click':
                if (action.selector) {
                  await page.click(action.selector);
                }
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
                if (action.selector) {
                  await page.hover(action.selector);
                }
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
          fullPage: true,
        });
      } catch (error) {
        console.error(chalk.red(`Failed to capture ${config.name}:`), error);
      }

      await page.close();
    }

    await browser.close();
    console.log(chalk.green('✅ Landing page screenshots captured'));
  }

  async generateAnalysisPrompt() {
    const promptPath = path.join(this.outputDir, 'landing-analysis-prompt.md');

    const prompt = `# Landing Page Visual Audit Analysis

Please analyze the landing page screenshots and check for the specific issues we've been working on.

## Key Areas to Check

### 1. Footer Duplication (FIXED)
- **Check**: Look at the bottom of the full-page screenshots
- **Expected**: Only ONE footer should be visible (the landing page footer with newsletter signup)
- **Issue**: Previously had both main app footer AND landing page footer

### 2. Header Button Spacing & Positioning  
- **Check**: Header area in desktop and mobile views
- **Expected**: Proper spacing between "Sign In" and "Get Lifetime Access" buttons
- **Issue**: Buttons were cramped/overlapping

### 3. "See What's Inside" Button Visibility
- **Check**: Hero section for the main CTA button
- **Expected**: Button should be clearly visible with proper contrast
- **Issue**: Was white text on transparent background (invisible)

### 4. Mobile Header CTA
- **Check**: Mobile view header
- **Expected**: Should have mobile-specific CTA button
- **Issue**: Mobile users couldn't easily access primary action

### 5. Scroll Navigation (Pricing/FAQ)
- **Check**: Can you navigate to pricing and FAQ sections?
- **Expected**: Smooth scroll behavior when clicking navigation links
- **Issue**: Clicking Pricing/FAQ didn't scroll to sections

### 6. Newsletter Footer Integration
- **Check**: Bottom footer area
- **Expected**: Clean newsletter signup form with proper styling
- **Issue**: Should be the only footer visible

## Screenshots to Analyze

1. **01-landing-desktop-full.png** - Full desktop landing page
2. **02-landing-mobile-full.png** - Full mobile landing page  
3. **03-landing-tablet-full.png** - Full tablet landing page
4. **04-header-buttons-desktop.png** - Desktop header button spacing
5. **05-mobile-header-cta.png** - Mobile header and CTA
6. **06-newsletter-footer.png** - Newsletter signup footer area
7. **07-see-whats-inside-button.png** - Main CTA button visibility
8. **08-pricing-section.png** - Pricing section layout
9. **09-faq-section.png** - FAQ section layout

## Analysis Format

For each screenshot, please note:

### ✅ Fixed Issues
- List issues that appear to be resolved

### ⚠️ Remaining Issues  
- Any problems still visible
- Severity: Critical/High/Medium/Low
- Specific description and fix recommendation

### 💡 New Observations
- Any new issues discovered
- UX improvements that could be made

## Priority Focus

1. **Footer duplication** - Should be completely fixed
2. **Button visibility/spacing** - Should be clearly readable and properly spaced
3. **Mobile responsiveness** - Should work well on all device sizes
4. **Navigation functionality** - Scroll behavior should work
5. **Overall visual hierarchy** - Landing page should look professional

Generate a concise report focusing on these specific areas.
`;

    await fs.writeFile(promptPath, prompt);
    console.log(chalk.green(`✅ Landing page analysis prompt generated: ${promptPath}`));
  }

  async run() {
    try {
      await this.initialize();
      await this.captureScreenshots();
      await this.generateAnalysisPrompt();

      console.log(chalk.green('\n✨ Landing page visual audit complete!\n'));
      console.log(chalk.blue('Next steps:'));
      console.log(chalk.gray('1. Review screenshots in:'), this.outputDir);
      console.log(
        chalk.gray('2. Check the analysis prompt:'),
        path.join(this.outputDir, 'landing-analysis-prompt.md')
      );
    } catch (error) {
      console.error(chalk.red('❌ Error:'), error);
      throw error;
    }
  }
}

// Run the audit
const auditor = new LandingPageAuditor();
auditor.run().catch(console.error);
