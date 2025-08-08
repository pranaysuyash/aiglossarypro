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
import { exec, spawn } from 'node:child_process';
import fs from 'node:fs/promises';
import path from 'node:path';
import { promisify } from 'node:util';
import chalk from 'chalk';
import { chromium } from 'playwright';
const execAsync = promisify(exec);
class VisualAuditor {
    browser = null;
    viteProcess = null;
    baseUrl = process.env.BASE_URL || 'http://localhost:5173';
    screenshotDir;
    reportDir;
    issues = [];
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
    async startViteServer() {
        console.log(chalk.yellow('⚡ Checking Vite development server...'));
        try {
            // Check if the port is already in use
            await execAsync(`lsof -i :${this.baseUrl.split(':')[2]}`);
            console.log(chalk.green('✅ Vite server is already running'));
            return;
        }
        catch (_error) {
            // Port is not in use, so start the server
            console.log(chalk.yellow('⚡ Starting Vite development server...'));
        }
        return new Promise((resolve, reject) => {
            this.viteProcess = spawn('npm', ['run', 'dev'], {
                stdio: 'pipe',
                shell: true,
            });
            this.viteProcess.stdout.on('data', (data) => {
                const output = data.toString();
                if (output.includes('ready in') || output.includes('Local:')) {
                    console.log(chalk.green('✅ Vite server ready'));
                    setTimeout(resolve, 2000); // Give it 2 more seconds to fully stabilize
                }
            });
            this.viteProcess.stderr.on('data', (data) => {
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
        if (!this.browser)
            throw new Error('Browser not initialized');
        const pages = [
            // Homepage variants
            {
                name: 'homepage-desktop',
                url: '/',
                viewport: { width: 1920, height: 1080 },
            },
            {
                name: 'homepage-mobile',
                url: '/',
                viewport: { width: 375, height: 812 },
            },
            {
                name: 'homepage-tablet',
                url: '/',
                viewport: { width: 768, height: 1024 },
            },
            // Main pages
            {
                name: 'terms-listing',
                url: '/terms',
                viewport: { width: 1920, height: 1080 },
            },
            {
                name: 'categories',
                url: '/categories',
                viewport: { width: 1920, height: 1080 },
            },
            {
                name: 'trending',
                url: '/trending',
                viewport: { width: 1920, height: 1080 },
            },
            {
                name: 'login-page',
                url: '/login',
                viewport: { width: 1920, height: 1080 },
            },
            {
                name: 'dashboard',
                url: '/dashboard',
                viewport: { width: 1920, height: 1080 },
            },
            {
                name: 'favorites',
                url: '/favorites',
                viewport: { width: 1920, height: 1080 },
            },
            {
                name: 'settings',
                url: '/settings',
                viewport: { width: 1920, height: 1080 },
            },
            {
                name: 'ai-tools',
                url: '/ai-tools',
                viewport: { width: 1920, height: 1080 },
            },
            // Interactive states
            {
                name: 'search-active',
                url: '/',
                viewport: { width: 1920, height: 1080 },
                actions: [
                    { type: 'wait', value: 2000 },
                    { type: 'click', selector: 'input[type="text"]' },
                    { type: 'type', selector: 'input[type="text"]', value: 'machine learning' },
                    { type: 'wait', value: 2000 },
                ],
            },
            {
                name: 'mobile-menu',
                url: '/',
                viewport: { width: 375, height: 812 },
                actions: [
                    { type: 'wait', value: 2000 },
                    { type: 'click', selector: 'button[aria-label*="menu"]' },
                    { type: 'wait', value: 1000 },
                ],
            },
            {
                name: 'dark-mode',
                url: '/',
                viewport: { width: 1920, height: 1080 },
                actions: [
                    { type: 'wait', value: 2000 },
                    { type: 'click', selector: 'button[aria-label*="mode"]' },
                    { type: 'wait', value: 1000 },
                ],
            },
            // Forms and interactions
            {
                name: 'term-filters',
                url: '/terms',
                viewport: { width: 1920, height: 1080 },
                actions: [
                    { type: 'wait', value: 2000 },
                    {
                        type: 'click',
                        selector: 'button:has-text("Filters"), button[aria-label*="filter"], .filter-button',
                    },
                    { type: 'wait', value: 1000 },
                ],
            },
            {
                name: 'category-dropdown',
                url: '/categories',
                viewport: { width: 1920, height: 1080 },
                actions: [
                    { type: 'wait', value: 2000 },
                    { type: 'click', selector: '[role="combobox"], select, .category-select' },
                    { type: 'wait', value: 1000 },
                ],
            },
            // Responsive breakpoints
            {
                name: 'mobile-portrait',
                url: '/terms',
                viewport: { width: 360, height: 640 },
            },
            {
                name: 'mobile-landscape',
                url: '/terms',
                viewport: { width: 640, height: 360 },
            },
            {
                name: 'small-desktop',
                url: '/',
                viewport: { width: 1366, height: 768 },
            },
            {
                name: 'large-desktop',
                url: '/',
                viewport: { width: 2560, height: 1440 },
            },
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
                waitUntil: 'domcontentloaded',
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
                fullPage: !pageConfig.name.includes('mobile'),
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
                    const stateScreenshotPath = path.join(this.screenshotDir, `${pageConfig.name}-${state.name}.png`);
                    await page.screenshot({
                        path: stateScreenshotPath,
                        fullPage: false,
                    });
                }
            }
            await page.close();
        }
        console.log(chalk.green('✅ Screenshots captured'));
    }
    async performAction(page, action) {
        switch (action.type) {
            case 'click':
                if (action.selector) {
                    await page.waitForSelector(action.selector, { state: 'visible', timeout: 15000 });
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
                await page.evaluate(pixels => {
                    window.scrollBy(0, pixels);
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
                // Create a comprehensive prompt for Claude
                const prompt = `You are an expert UX/UI designer and accessibility specialist. Analyze this screenshot of an AI/ML Glossary web application and provide a comprehensive visual audit.

        FOCUS AREAS:
        1. **Visual Hierarchy & Layout**
           - Information architecture and content organization
           - Proper use of white space and visual grouping
           - Clear navigation and breadcrumbs
           - Logical flow and user journey
        
        2. **Accessibility & WCAG Compliance**
           - Color contrast ratios (WCAG AA standards)
           - Text readability and font sizes
           - Button and link accessibility
           - Focus indicators and keyboard navigation
           - ARIA labels and semantic markup
        
        3. **Responsive Design**
           - Mobile-first design principles
           - Touch target sizes (minimum 44px)
           - Content adaptation across breakpoints
           - Horizontal scrolling issues
        
        4. **Visual Design & Consistency**
           - Brand consistency and design system adherence
           - Color palette usage and meaning
           - Typography hierarchy and readability
           - Icon consistency and clarity
           - Button states and interactive elements
        
        5. **User Experience**
           - Clear call-to-actions
           - Loading states and feedback
           - Error handling and messaging
           - Search and filtering functionality
           - Information scent and discoverability
        
        6. **Performance & Technical**
           - Image optimization and loading
           - Content loading patterns
           - Progressive enhancement
        
        RESPONSE FORMAT:
        For each issue found, provide exactly this format:
        
        **Issue #N**
        - **Severity**: [critical/high/medium/low]
        - **Category**: [layout/accessibility/responsive/visual-design/ux/performance]
        - **Description**: [Clear, specific description of the issue]
        - **Recommendation**: [Actionable solution with specific steps]
        - **WCAG Impact**: [If applicable, mention WCAG guidelines affected]
        
        Also provide:
        - **Overall Score**: /10 for the page
        - **Top 3 Priority Fixes**: Most critical issues to address first
        
        Screenshot: ${screenshot}
        Page Context: This is from an AI/ML Glossary application that helps users learn AI concepts and terminology.`;
                // Execute claude command with the screenshot
                const claudeCommand = `claude -p "@${screenshotPath} ${prompt}"`;
                const { stdout } = await execAsync(claudeCommand, {
                    maxBuffer: 10 * 1024 * 1024, // 10MB buffer
                });
                // Parse Claude's response and add to issues
                this.parseClaudeResponse(stdout, screenshot);
            }
            catch (error) {
                console.error(chalk.red(`Error analyzing ${screenshot}:`), error);
            }
        }
    }
    parseClaudeResponse(response, screenshotName) {
        // This is a simplified parser - you might want to make it more sophisticated
        // Claude's response should be structured, so we can parse it
        const lines = response.split('\n');
        let currentIssue = null;
        for (const line of lines) {
            if (line.toLowerCase().includes('severity:')) {
                if (currentIssue?.description) {
                    this.issues.push(currentIssue);
                }
                currentIssue = {
                    page: screenshotName.replace('.png', ''),
                    severity: line.toLowerCase().includes('critical')
                        ? 'critical'
                        : line.toLowerCase().includes('high')
                            ? 'high'
                            : line.toLowerCase().includes('medium')
                                ? 'medium'
                                : 'low',
                    screenshot: screenshotName,
                };
            }
            else if (line.toLowerCase().includes('category:') && currentIssue) {
                currentIssue.category = line.split(':')[1].trim();
            }
            else if (line.toLowerCase().includes('description:') && currentIssue) {
                currentIssue.description = line.split(':')[1].trim();
            }
            else if (line.toLowerCase().includes('recommendation:') && currentIssue) {
                currentIssue.recommendation = line.split(':')[1].trim();
            }
        }
        // Don't forget the last issue
        if (currentIssue?.description) {
            this.issues.push(currentIssue);
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
                highPriorityIssues: this.issues.filter(i => i.severity === 'high').length,
            },
            issues: this.issues,
            screenshotDirectory: this.screenshotDir,
        }, null, 2));
    }
    generateIssuesByPage() {
        const pageGroups = this.groupBy(this.issues, 'page');
        return Object.entries(pageGroups)
            .map(([page, issues]) => `### ${page}
${issues
            .map(issue => `- **[${issue.severity.toUpperCase()}]** ${issue.description}
  - Category: ${issue.category}
  - Fix: ${issue.recommendation}`)
            .join('\n')}`)
            .join('\n\n');
    }
    generateIssuesByCategory() {
        const categoryGroups = this.groupBy(this.issues, 'category');
        return Object.entries(categoryGroups)
            .map(([category, issues]) => `### ${category}
${issues.map(issue => `- **[${issue.severity.toUpperCase()}]** ${issue.description} (${issue.page})`).join('\n')}`)
            .join('\n\n');
    }
    generateActionItems() {
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
    groupBy(array, key) {
        return array.reduce((result, item) => {
            const group = String(item[key]);
            if (!result[group])
                result[group] = [];
            result[group].push(item);
            return result;
        }, {});
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
        }
        catch (error) {
            console.error(chalk.red('❌ Error during visual audit:'), error);
            throw error;
        }
        finally {
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
export { VisualAuditor };
