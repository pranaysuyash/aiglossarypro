#!/usr/bin/env tsx

/**
 * Comprehensive Audit Suite for AIGlossaryPro
 *
 * This script implements the 5-pillar audit strategy:
 * 1. Visual & Interaction Correctness (Component & Page Level)
 * 2. Accessibility (WCAG 2.1 Level AA)
 * 3. Performance (Lighthouse & React Scan)
 * 4. Functional Correctness (End-to-End Tests)
 * 5. Code Quality (ESLint, Biome)
 *
 * Usage:
 * - npm run audit:all                 # Run all audits
 * - npm run audit:visual             # Visual regression only
 * - npm run audit:accessibility      # Accessibility only
 * - npm run audit:performance        # Performance only
 * - npm run audit:functional         # Functional testing only
 * - npm run audit:code-quality       # Code quality only
 */

import { type ChildProcessWithoutNullStreams, execSync, spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '..');
const reportsDir = path.join(projectRoot, 'reports', 'audit-suite');

// Ensure reports directory exists
if (!fs.existsSync(reportsDir)) {
  fs.mkdirSync(reportsDir, { recursive: true });
}

interface AuditResult {
  pillar: string;
  status: 'passed' | 'failed' | 'skipped';
  duration: number;
  summary: {
    total: number;
    passed: number;
    failed: number;
    warnings: number;
  };
  details: any[];
  reportPath?: string;
}

interface AuditSuiteResult {
  timestamp: string;
  totalDuration: number;
  results: AuditResult[];
  overallStatus: 'passed' | 'failed' | 'partial';
  reportPath: string;
}

class ComprehensiveAuditSuite {
  private results: AuditResult[] = [];
  private startTime: number = 0;
  private serverProcess: ChildProcessWithoutNullStreams | null = null;

  constructor() {
    this.startTime = Date.now();
  }

  async runAll(): Promise<AuditSuiteResult> {
    console.log('🚀 Starting Comprehensive Audit Suite...\n');

    // Start the development server first
    await this.startDevelopmentServer();

    const pillars = [
      { name: 'visual', description: 'Visual & Interaction Correctness' },
      { name: 'accessibility', description: 'Accessibility (WCAG 2.1 AA)' },
      { name: 'performance', description: 'Performance Analysis' },
      { name: 'functional', description: 'Functional Correctness' },
      { name: 'code-quality', description: 'Code Quality & Best Practices' },
    ];

    try {
      for (const pillar of pillars) {
        console.log(`\n📊 Running ${pillar.description}...`);
        const result = await this.runPillar(pillar.name);
        this.results.push(result);
      }

      const finalResult = this.generateFinalReport();
      console.log('\n✨ Comprehensive Audit Suite Complete!');
      console.log(`📄 Report available at: ${finalResult.reportPath}`);

      return finalResult;
    } finally {
      // Always cleanup the server process
      await this.stopDevelopmentServer();
    }
  }

  async runPillar(pillarName: string): Promise<AuditResult> {
    const startTime = Date.now();

    try {
      switch (pillarName) {
        case 'visual':
          return await this.runVisualAudit();
        case 'accessibility':
          return await this.runAccessibilityAudit();
        case 'performance':
          return await this.runPerformanceAudit();
        case 'functional':
          return await this.runFunctionalAudit();
        case 'code-quality':
          return await this.runCodeQualityAudit();
        default:
          throw new Error(`Unknown pillar: ${pillarName}`);
      }
    } catch (error) {
      return {
        pillar: pillarName,
        status: 'failed',
        duration: Date.now() - startTime,
        summary: { total: 0, passed: 0, failed: 1, warnings: 0 },
        details: [{ error: error.message }],
      };
    }
  }

  private async runVisualAudit(): Promise<AuditResult> {
    const startTime = Date.now();

    try {
      console.log('  🔍 Leveraging existing comprehensive visual audit foundation...');

      // Use the quick visual audit that builds on the established foundation
      // This leverages the sophisticated infrastructure but runs faster for CI/audit purposes
      const comprehensiveResult = await this.executeCommand(
        'tsx scripts/quick-visual-audit.ts',
        { timeout: 180000, allowFailure: true } // 3 minutes timeout for quick comprehensive testing
      );

      // Fallback to component-level Storybook testing if comprehensive audit fails
      console.log('  🔍 Component-level visual regression testing (Storybook)...');
      const storybookResult = await this.executeCommand(
        'npx playwright test --config=playwright.config.js --reporter=json',
        { timeout: 300000, allowFailure: true } // 5 minutes timeout
      );

      // Page-level visual audit using existing foundation
      console.log('  🔍 Page-level visual regression testing...');
      const pageResult = await this.executeCommand(
        'npx playwright test --config=playwright.visual.config.ts --reporter=json',
        { timeout: 300000, allowFailure: true }
      );

      // Parse results from different audit methods
      let comprehensiveResults = this.parseComprehensiveVisualResults(comprehensiveResult);

      // Try to read the JSON report file generated by comprehensive visual audit
      try {
        const reportPath = path.join(
          projectRoot,
          'comprehensive-audit',
          'comprehensive-report.json'
        );
        if (fs.existsSync(reportPath)) {
          const reportContent = fs.readFileSync(reportPath, 'utf8');
          const reportData = JSON.parse(reportContent);
          comprehensiveResults = {
            total: reportData.summary?.totalTests || 0,
            passed: reportData.summary?.passedChecks || 0,
            failed: reportData.summary?.criticalIssues || 0,
            warnings: reportData.summary?.warnings || 0,
            details: reportData.analysis || [],
          };
          console.log(
            `    ✓ Loaded comprehensive audit results: ${comprehensiveResults.total} tests`
          );
        }
      } catch (error) {
        console.log(
          `    Warning: Could not read comprehensive audit JSON report: ${error.message}`
        );
      }

      const componentResults = this.parsePlaywrightResults(storybookResult);
      const pageResults = this.parsePlaywrightResults(pageResult);

      const totalTests = comprehensiveResults.total + componentResults.total + pageResults.total;
      const totalPassed =
        comprehensiveResults.passed + componentResults.passed + pageResults.passed;
      const totalFailed =
        comprehensiveResults.failed + componentResults.failed + pageResults.failed;

      return {
        pillar: 'visual',
        status: totalFailed === 0 ? 'passed' : 'failed',
        duration: Date.now() - startTime,
        summary: {
          total: totalTests,
          passed: totalPassed,
          failed: totalFailed,
          warnings: comprehensiveResults.warnings,
        },
        details: [
          { type: 'comprehensive', ...comprehensiveResults },
          { type: 'component-storybook', ...componentResults },
          { type: 'page-level', ...pageResults },
        ],
        reportPath: path.join(reportsDir, 'visual-audit-report.html'),
      };
    } catch (error) {
      return {
        pillar: 'visual',
        status: 'failed',
        duration: Date.now() - startTime,
        summary: { total: 0, passed: 0, failed: 1, warnings: 0 },
        details: [{ error: error.message }],
      };
    }
  }

  private async runAccessibilityAudit(): Promise<AuditResult> {
    const startTime = Date.now();

    try {
      console.log('  ♿ Running accessibility scan with axe-core...');

      // Run accessibility tests using Playwright with axe-core
      const result = await this.executeCommand(
        'npx playwright test tests/e2e/accessibility.spec.ts --reporter=json',
        { timeout: 180000 }
      );

      const parsedResult = this.parsePlaywrightResults(result);

      return {
        pillar: 'accessibility',
        status: parsedResult.failed === 0 ? 'passed' : 'failed',
        duration: Date.now() - startTime,
        summary: {
          total: parsedResult.total,
          passed: parsedResult.passed,
          failed: parsedResult.failed,
          warnings: 0,
        },
        details: parsedResult.details || [],
        reportPath: path.join(reportsDir, 'accessibility-audit-report.html'),
      };
    } catch (error) {
      return {
        pillar: 'accessibility',
        status: 'failed',
        duration: Date.now() - startTime,
        summary: { total: 0, passed: 0, failed: 1, warnings: 0 },
        details: [{ error: error.message }],
      };
    }
  }

  private async runPerformanceAudit(): Promise<AuditResult> {
    const startTime = Date.now();

    try {
      console.log('  ⚡ Running performance analysis...');

      // Run React Scan for static analysis
      console.log('    🔍 React Scan static analysis...');
      const reactScanResult = await this.executeCommand(
        'npx react-scan@latest --build --report --output-file=reports/audit-suite/react-scan-report.json',
        { timeout: 120000, allowFailure: true }
      );

      // Run Lighthouse performance audit
      console.log('    🔍 Lighthouse performance audit...');
      const lighthouseResult = await this.executeCommand(
        'npx playwright test tests/e2e/performance.spec.ts --reporter=json',
        { timeout: 180000 }
      );

      const parsedResult = this.parsePlaywrightResults(lighthouseResult);

      return {
        pillar: 'performance',
        status: parsedResult.failed === 0 ? 'passed' : 'failed',
        duration: Date.now() - startTime,
        summary: {
          total: parsedResult.total,
          passed: parsedResult.passed,
          failed: parsedResult.failed,
          warnings: 0,
        },
        details: [
          { type: 'lighthouse', ...parsedResult },
          { type: 'react-scan', result: reactScanResult },
        ],
        reportPath: path.join(reportsDir, 'performance-audit-report.html'),
      };
    } catch (error) {
      return {
        pillar: 'performance',
        status: 'failed',
        duration: Date.now() - startTime,
        summary: { total: 0, passed: 0, failed: 1, warnings: 0 },
        details: [{ error: error.message }],
      };
    }
  }

  private async runFunctionalAudit(): Promise<AuditResult> {
    const startTime = Date.now();

    try {
      console.log('  🧪 Running functional correctness tests...');

      // Run comprehensive functional tests
      const e2eTests = [
        'tests/e2e/authentication.spec.ts',
        'tests/e2e/search-functionality.spec.ts',
        'tests/e2e/navigation.spec.ts',
        'tests/e2e/ai-features.spec.ts',
      ];

      const results = [];
      for (const testFile of e2eTests) {
        if (fs.existsSync(path.join(projectRoot, testFile))) {
          const result = await this.executeCommand(
            `npx playwright test ${testFile} --reporter=json`,
            { timeout: 180000 }
          );
          results.push(this.parsePlaywrightResults(result));
        }
      }

      const totalResults = results.reduce(
        (acc, curr) => ({
          total: acc.total + curr.total,
          passed: acc.passed + curr.passed,
          failed: acc.failed + curr.failed,
        }),
        { total: 0, passed: 0, failed: 0 }
      );

      return {
        pillar: 'functional',
        status: totalResults.failed === 0 ? 'passed' : 'failed',
        duration: Date.now() - startTime,
        summary: {
          total: totalResults.total,
          passed: totalResults.passed,
          failed: totalResults.failed,
          warnings: 0,
        },
        details: results,
        reportPath: path.join(reportsDir, 'functional-audit-report.html'),
      };
    } catch (error) {
      return {
        pillar: 'functional',
        status: 'failed',
        duration: Date.now() - startTime,
        summary: { total: 0, passed: 0, failed: 1, warnings: 0 },
        details: [{ error: error.message }],
      };
    }
  }

  private async runCodeQualityAudit(): Promise<AuditResult> {
    const startTime = Date.now();

    try {
      console.log('  📋 Running code quality analysis...');

      // Ensure reports directory exists
      const eslintReportPath = path.join(reportsDir, 'eslint-report.json');
      const biomeReportPath = path.join(reportsDir, 'biome-report.json');

      // Run ESLint
      console.log('    🔍 ESLint analysis...');
      const eslintResult = await this.executeCommand(
        `npx eslint . --ext .js,.jsx,.ts,.tsx --format json --output-file ${eslintReportPath}`,
        { allowFailure: true }
      );

      // Run Biome
      console.log('    🔍 Biome analysis...');
      const biomeResult = await this.executeCommand(
        `npx biome check . --reporter json --diagnostic-level=info`,
        { allowFailure: true }
      );

      // Write Biome results to file
      if (biomeResult) {
        try {
          // Truncate very large outputs to prevent JSON parsing issues
          const maxSize = 1024 * 1024; // 1MB limit
          const truncatedResult =
            biomeResult.length > maxSize
              ? biomeResult.substring(0, maxSize) + '...[truncated]'
              : biomeResult;
          fs.writeFileSync(biomeReportPath, truncatedResult);
        } catch (error) {
          console.log('Failed to write Biome results:', error.message);
        }
      }

      // Run TypeScript type checking
      console.log('    🔍 TypeScript type checking...');
      const tscResult = await this.executeCommand('npx tsc --noEmit --skipLibCheck', {
        allowFailure: true,
      });

      // Parse ESLint results
      let eslintData = { total: 0, errors: 0, warnings: 0, details: [] };

      if (fs.existsSync(eslintReportPath)) {
        try {
          const eslintReport = JSON.parse(fs.readFileSync(eslintReportPath, 'utf8'));
          eslintData = this.parseEslintResults(eslintReport);
        } catch (error) {
          console.log('Failed to parse ESLint results:', error.message);
        }
      }

      // Parse Biome results
      let biomeData = { total: 0, errors: 0, warnings: 0 };
      if (fs.existsSync(biomeReportPath)) {
        try {
          const biomeContent = fs.readFileSync(biomeReportPath, 'utf8');
          // Try to parse as JSON, but handle truncated content
          if (biomeContent.includes('[truncated]')) {
            console.log('Biome output was truncated due to size, using fallback parsing');
            biomeData = this.parseBiomeOutputText(biomeContent);
          } else {
            const biomeReport = JSON.parse(biomeContent);
            biomeData = this.parseBiomeResults(biomeReport);
          }
        } catch (error) {
          console.log('Failed to parse Biome results:', error.message);
          // Try alternative text parsing as fallback
          try {
            const biomeContent = fs.readFileSync(biomeReportPath, 'utf8');
            biomeData = this.parseBiomeOutputText(biomeContent);
          } catch (fallbackError) {
            console.log('Fallback Biome parsing also failed:', fallbackError.message);
          }
        }
      }

      // Parse TypeScript results
      const tscErrors = this.parseTscResults(tscResult);

      const totalErrors = eslintData.errors + biomeData.errors + tscErrors.count;
      const totalWarnings = eslintData.warnings + biomeData.warnings;
      const totalIssues = eslintData.total + biomeData.total + tscErrors.count;

      return {
        pillar: 'code-quality',
        status: totalErrors === 0 ? 'passed' : 'failed',
        duration: Date.now() - startTime,
        summary: {
          total: totalIssues,
          passed: totalIssues - totalErrors - totalWarnings,
          failed: totalErrors,
          warnings: totalWarnings,
        },
        details: [
          { type: 'eslint', ...eslintData },
          { type: 'biome', ...biomeData },
          { type: 'typescript', ...tscErrors },
        ],
        reportPath: path.join(reportsDir, 'code-quality-audit-report.html'),
      };
    } catch (error) {
      return {
        pillar: 'code-quality',
        status: 'failed',
        duration: Date.now() - startTime,
        summary: { total: 0, passed: 0, failed: 1, warnings: 0 },
        details: [{ error: error.message }],
      };
    }
  }

  private async executeCommand(
    command: string,
    options: { timeout?: number; allowFailure?: boolean } = {}
  ): Promise<string> {
    const { timeout = 60000, allowFailure = false } = options;

    try {
      const result = execSync(command, {
        encoding: 'utf8',
        timeout,
        cwd: projectRoot,
        maxBuffer: 1024 * 1024 * 10, // 10MB buffer
      });
      return result;
    } catch (error) {
      if (allowFailure) {
        return error.stdout || error.stderr || '';
      }
      throw error;
    }
  }

  private parsePlaywrightResults(output: string): {
    total: number;
    passed: number;
    failed: number;
    details?: any[];
  } {
    try {
      const result = JSON.parse(output);
      return {
        total: result.stats?.total || 0,
        passed: result.stats?.passed || 0,
        failed: result.stats?.failed || 0,
        details: result.tests || [],
      };
    } catch {
      // Fallback parsing for non-JSON output
      const failedMatch = output.match(/(\d+) failed/);
      const passedMatch = output.match(/(\d+) passed/);

      const failed = failedMatch ? parseInt(failedMatch[1]) : 0;
      const passed = passedMatch ? parseInt(passedMatch[1]) : 0;

      return {
        total: failed + passed,
        passed,
        failed,
      };
    }
  }

  private parseComprehensiveVisualResults(output: string): {
    total: number;
    passed: number;
    failed: number;
    warnings: number;
    details?: any[];
  } {
    if (!output || output.trim().length === 0) {
      return { total: 0, passed: 0, failed: 0, warnings: 0, details: [] };
    }

    try {
      // Try to parse as JSON first - comprehensive audit generates comprehensive-report.json
      const result = JSON.parse(output);

      // Handle comprehensive visual audit JSON format
      if (result.summary) {
        return {
          total: result.summary.totalTests || 0,
          passed: result.summary.passedChecks || 0,
          failed: result.summary.criticalIssues || 0,
          warnings: result.summary.warnings || 0,
          details: [
            ...(result.analysis?.criticalIssues || []),
            ...(result.analysis?.warnings || []),
            ...(result.analysis?.passedChecks || []),
          ],
        };
      }

      // Handle generic JSON format
      return {
        total: result.total || 0,
        passed: result.passed || 0,
        failed: result.failed || 0,
        warnings: result.warnings || 0,
        details: result.details || [],
      };
    } catch {
      // Fallback text parsing for comprehensive visual audit output
      const lines = output.split('\n');
      let total = 0,
        passed = 0,
        failed = 0,
        warnings = 0;

      // Look for summary patterns in comprehensive audit output
      const summaryPatterns = [
        /(\d+)\s+tests?\s+passed/i,
        /(\d+)\s+tests?\s+failed/i,
        /(\d+)\s+warnings?/i,
        /(\d+)\s+total\s+tests?/i,
        /(\d+)\s+screenshots?\s+captured/i,
        /(\d+)\s+pages?\s+tested/i,
      ];

      for (const line of lines) {
        const passedMatch = line.match(/(\d+)\s+(?:tests?|components?|pages?)\s+passed/i);
        const failedMatch = line.match(/(\d+)\s+(?:tests?|components?|pages?)\s+failed/i);
        const warningsMatch = line.match(/(\d+)\s+warnings?/i);
        const totalMatch = line.match(/(\d+)\s+total|(\d+)\s+screenshots?/i);

        if (passedMatch) passed += parseInt(passedMatch[1]);
        if (failedMatch) failed += parseInt(failedMatch[1]);
        if (warningsMatch) warnings += parseInt(warningsMatch[1]);
        if (totalMatch) total = Math.max(total, parseInt(totalMatch[1] || totalMatch[2]));
      }

      // If no explicit total found, calculate from passed + failed
      if (total === 0) {
        total = passed + failed;
      }

      return {
        total,
        passed,
        failed,
        warnings,
        details: [{ rawOutput: output.slice(0, 1000) }], // Include snippet of raw output
      };
    }
  }

  private parseEslintResults(eslintReport: any[]): {
    total: number;
    errors: number;
    warnings: number;
    details: any[];
  } {
    const stats = eslintReport.reduce(
      (acc, file) => {
        acc.total += file.messages.length;
        acc.errors += file.errorCount;
        acc.warnings += file.warningCount;

        // Add file details for serious issues
        if (file.errorCount > 0 || file.warningCount > 5) {
          acc.details.push({
            filePath: file.filePath,
            errors: file.errorCount,
            warnings: file.warningCount,
            messages: file.messages.slice(0, 5), // First 5 messages only
          });
        }

        return acc;
      },
      { total: 0, errors: 0, warnings: 0, details: [] }
    );

    return stats;
  }

  private parseBiomeResults(biomeReport: any): { total: number; errors: number; warnings: number } {
    // Biome report structure may vary, adapt as needed
    let total = 0;
    let errors = 0;
    let warnings = 0;

    if (biomeReport.diagnostics) {
      total = biomeReport.diagnostics.length;
      errors = biomeReport.diagnostics.filter(d => d.severity === 'error').length;
      warnings = biomeReport.diagnostics.filter(d => d.severity === 'warning').length;
    }

    return { total, errors, warnings };
  }

  private parseBiomeOutputText(biomeOutput: string): {
    total: number;
    errors: number;
    warnings: number;
  } {
    // Fallback text parsing for when JSON parsing fails
    let total = 0;
    let errors = 0;
    let warnings = 0;

    const lines = biomeOutput.split('\n');

    // Look for summary patterns in Biome output
    const summaryLine = lines.find(
      line => line.includes('Found') || line.includes('issues') || line.includes('diagnostics')
    );

    if (summaryLine) {
      const numberMatches = summaryLine.match(/\d+/g);
      if (numberMatches && numberMatches.length > 0) {
        total = parseInt(numberMatches[0]);
      }
    }

    // Count error/warning patterns
    errors = (biomeOutput.match(/error/gi) || []).length;
    warnings = (biomeOutput.match(/warning/gi) || []).length;

    return { total: Math.max(total, errors + warnings), errors, warnings };
  }

  private parseTscResults(tscOutput: string): { count: number; errors: string[] } {
    if (!tscOutput) {
      return { count: 0, errors: [] };
    }

    const lines = tscOutput.split('\n').filter(line => line.includes('error TS'));
    return {
      count: lines.length,
      errors: lines.slice(0, 10), // First 10 errors only
    };
  }

  private generateFinalReport(): AuditSuiteResult {
    const totalDuration = Date.now() - this.startTime;
    const timestamp = new Date().toISOString();

    // Calculate overall status
    const failedPillars = this.results.filter(r => r.status === 'failed').length;
    const overallStatus =
      failedPillars === 0 ? 'passed' : failedPillars < this.results.length ? 'partial' : 'failed';

    // Generate HTML report
    const reportPath = this.generateHtmlReport(timestamp, totalDuration, overallStatus);

    return {
      timestamp,
      totalDuration,
      results: this.results,
      overallStatus,
      reportPath,
    };
  }

  private generateHtmlReport(timestamp: string, duration: number, overallStatus: string): string {
    const reportPath = path.join(reportsDir, `comprehensive-audit-${Date.now()}.html`);

    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Comprehensive Audit Report - AIGlossaryPro</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 20px; background: #f5f5f5; }
        .container { max-width: 1200px; margin: 0 auto; background: white; border-radius: 8px; padding: 30px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .header { text-align: center; margin-bottom: 30px; }
        .status { display: inline-block; padding: 8px 16px; border-radius: 4px; font-weight: bold; }
        .status.passed { background: #d4edda; color: #155724; }
        .status.failed { background: #f8d7da; color: #721c24; }
        .status.partial { background: #fff3cd; color: #856404; }
        .pillar { margin: 20px 0; padding: 20px; border-left: 4px solid #007bff; background: #f8f9fa; }
        .pillar.failed { border-left-color: #dc3545; }
        .pillar.passed { border-left-color: #28a745; }
        .summary { display: flex; gap: 20px; margin: 10px 0; }
        .metric { text-align: center; }
        .metric-value { font-size: 24px; font-weight: bold; }
        .metric-label { font-size: 12px; color: #666; }
        .details { margin-top: 15px; }
        .details summary { cursor: pointer; font-weight: bold; }
        .details pre { background: #f1f1f1; padding: 10px; border-radius: 4px; overflow-x: auto; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🔍 Comprehensive Audit Report</h1>
            <p><strong>AIGlossaryPro</strong> - ${timestamp}</p>
            <div class="status ${overallStatus}">${overallStatus.toUpperCase()}</div>
            <p>Total Duration: ${(duration / 1000).toFixed(2)}s</p>
        </div>

        <div class="executive-summary">
            <h2>📊 Executive Summary</h2>
            <div class="summary">
                ${this.results
                  .map(
                    result => `
                    <div class="metric">
                        <div class="metric-value ${result.status === 'passed' ? 'text-success' : 'text-danger'}">${result.summary.total}</div>
                        <div class="metric-label">${result.pillar}</div>
                    </div>
                `
                  )
                  .join('')}
            </div>
        </div>

        ${this.results
          .map(
            result => `
            <div class="pillar ${result.status}">
                <h3>${this.getPillarTitle(result.pillar)} ${result.status === 'passed' ? '✅' : '❌'}</h3>
                <div class="summary">
                    <div class="metric">
                        <div class="metric-value">${result.summary.total}</div>
                        <div class="metric-label">Total</div>
                    </div>
                    <div class="metric">
                        <div class="metric-value">${result.summary.passed}</div>
                        <div class="metric-label">Passed</div>
                    </div>
                    <div class="metric">
                        <div class="metric-value">${result.summary.failed}</div>
                        <div class="metric-label">Failed</div>
                    </div>
                    <div class="metric">
                        <div class="metric-value">${result.summary.warnings}</div>
                        <div class="metric-label">Warnings</div>
                    </div>
                </div>
                <p><strong>Duration:</strong> ${(result.duration / 1000).toFixed(2)}s</p>
                
                <details class="details">
                    <summary>View Details</summary>
                    <pre>${JSON.stringify(result.details, null, 2)}</pre>
                </details>
            </div>
        `
          )
          .join('')}

        <div class="footer">
            <p><em>Generated by AIGlossaryPro Comprehensive Audit Suite</em></p>
        </div>
    </div>
</body>
</html>`;

    fs.writeFileSync(reportPath, html);
    return reportPath;
  }

  private getPillarTitle(pillar: string): string {
    const titles = {
      visual: '🎨 Visual & Interaction Correctness',
      accessibility: '♿ Accessibility (WCAG 2.1 AA)',
      performance: '⚡ Performance Analysis',
      functional: '🧪 Functional Correctness',
      'code-quality': '📋 Code Quality & Best Practices',
    };
    return titles[pillar] || pillar;
  }

  async startDevelopmentServer(): Promise<void> {
    console.log('🚀 Starting development server with npm run dev:smart...');

    try {
      // Check if server is already running (frontend at 5173)
      const isRunning = await this.checkServerRunning('http://localhost:5173', 5000);
      if (isRunning) {
        console.log('✅ Development server is already running at http://localhost:5173');
        return;
      }

      // Start the server
      this.serverProcess = spawn('npm', ['run', 'dev:smart'], {
        cwd: projectRoot,
        stdio: ['pipe', 'pipe', 'pipe'],
        shell: true,
        detached: false,
      });

      if (this.serverProcess.stdout) {
        this.serverProcess.stdout.on('data', data => {
          const output = data.toString();
          if (
            output.includes('Frontend server is ready') ||
            output.includes('Development Environment Ready') ||
            output.includes('localhost:5173')
          ) {
            console.log('✅ Development server started successfully');
          }
        });
      }

      if (this.serverProcess.stderr) {
        this.serverProcess.stderr.on('data', data => {
          const error = data.toString();
          if (!error.includes('ExperimentalWarning')) {
            console.log('Server stderr:', error);
          }
        });
      }

      // Wait for server to start up
      console.log('⏳ Waiting for development server to start...');
      const serverStarted = await this.waitForServer('http://localhost:5173', 90000); // Increased timeout for dev server startup

      if (!serverStarted) {
        throw new Error('Development server failed to start within 90 seconds');
      }

      console.log('✅ Development server is ready for testing at http://localhost:5173');
    } catch (error) {
      console.error('Failed to start development server:', error.message);
      await this.stopDevelopmentServer();
      throw error;
    }
  }

  async stopDevelopmentServer(): Promise<void> {
    if (this.serverProcess) {
      console.log('🛑 Stopping development server...');

      try {
        // Try graceful shutdown first
        this.serverProcess.kill('SIGTERM');

        // Wait a bit for graceful shutdown
        await new Promise(resolve => setTimeout(resolve, 3000));

        // Force kill if still running
        if (!this.serverProcess.killed) {
          this.serverProcess.kill('SIGKILL');
        }

        console.log('✅ Development server stopped');
      } catch (error) {
        console.error('Error stopping development server:', error.message);
      }

      this.serverProcess = null;
    }
  }

  private async checkServerRunning(url: string, timeout: number = 5000): Promise<boolean> {
    try {
      const result = await this.executeCommand(
        `curl --head --silent --fail --connect-timeout ${timeout / 1000} ${url}`,
        { timeout, allowFailure: true }
      );
      return result.includes('200 OK') || result.includes('HTTP/');
    } catch {
      return false;
    }
  }

  private async waitForServer(url: string, timeout: number = 30000): Promise<boolean> {
    const startTime = Date.now();
    const checkInterval = 2000; // Check every 2 seconds

    while (Date.now() - startTime < timeout) {
      const isRunning = await this.checkServerRunning(url, 3000);
      if (isRunning) {
        return true;
      }

      await new Promise(resolve => setTimeout(resolve, checkInterval));
      process.stdout.write('.');
    }

    process.stdout.write('\n');
    return false;
  }
}

// CLI Interface
async function main() {
  const args = process.argv.slice(2);
  const pillar = args[0];

  const suite = new ComprehensiveAuditSuite();

  if (pillar && pillar !== 'all') {
    console.log(`🚀 Running ${pillar} audit...`);

    try {
      // Start development server for individual pillar runs too
      if (['visual', 'accessibility', 'performance', 'functional'].includes(pillar)) {
        await suite.startDevelopmentServer();
      }

      const result = await suite.runPillar(pillar);
      console.log(`✨ ${pillar} audit complete!`);
      console.log(`Status: ${result.status}`);
      console.log(`Duration: ${(result.duration / 1000).toFixed(2)}s`);
      console.log(`Summary: ${result.summary.passed}/${result.summary.total} passed`);
    } finally {
      // Cleanup server for individual runs
      if (['visual', 'accessibility', 'performance', 'functional'].includes(pillar)) {
        await suite.stopDevelopmentServer();
      }
    }
  } else {
    await suite.runAll();
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

export { ComprehensiveAuditSuite };
