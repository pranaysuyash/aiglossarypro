#!/usr/bin/env tsx

import chalk from 'chalk';
import { execSync } from 'child_process';
import fs from 'fs-extra';
import path from 'path';

interface TestSuite {
  name: string;
  description: string;
  testFile: string;
  category: 'security' | 'functionality' | 'performance' | 'integration';
  priority: 'critical' | 'high' | 'medium' | 'low';
  estimatedDuration: number; // in seconds
}

interface TestResult {
  suite: string;
  passed: boolean;
  duration: number;
  details?: string;
  coverage?: number;
}

class GumroadTestRunner {
  private testSuites: TestSuite[] = [
    {
      name: 'Webhook Security & Integration',
      description:
        'Tests HMAC signature verification, webhook payload processing, and security measures',
      testFile: 'tests/gumroad/webhook.test.ts',
      category: 'security',
      priority: 'critical',
      estimatedDuration: 30,
    },
    {
      name: 'Purchase Flow Testing',
      description:
        'Tests complete purchase flows including mobile, error handling, and accessibility',
      testFile: 'tests/gumroad/purchase-flow.test.ts',
      category: 'functionality',
      priority: 'critical',
      estimatedDuration: 45,
    },
    {
      name: 'Bundle Optimization Validation',
      description:
        'Validates bundle size optimizations, Million.js integration, and performance improvements',
      testFile: 'tests/gumroad/bundle-optimization.test.ts',
      category: 'performance',
      priority: 'high',
      estimatedDuration: 60,
    },
    {
      name: 'Country-Based Pricing (PPP)',
      description:
        'Tests dynamic pricing, country detection, VPN handling, and mobile PPP experience',
      testFile: 'tests/gumroad/country-pricing.test.ts',
      category: 'functionality',
      priority: 'high',
      estimatedDuration: 25,
    },
    {
      name: 'Email System Testing',
      description:
        'Tests premium welcome emails, templates, sending, and integration with webhooks',
      testFile: 'tests/gumroad/email-testing.test.ts',
      category: 'functionality',
      priority: 'medium',
      estimatedDuration: 20,
    },
    {
      name: 'Production Readiness',
      description: 'Tests production deployment, security, monitoring, and compliance requirements',
      testFile: 'tests/gumroad/production-readiness.test.ts',
      category: 'integration',
      priority: 'critical',
      estimatedDuration: 40,
    },
  ];

  private results: TestResult[] = [];

  async runAllTests(
    options: {
      category?: string;
      priority?: string;
      parallel?: boolean;
      generateReport?: boolean;
      coverage?: boolean;
    } = {}
  ): Promise<void> {
    console.log(chalk.blue.bold('\n🧪 Gumroad Testing & Validation Suite\n'));
    console.log(chalk.gray('Testing the core Gumroad systems for production readiness\n'));

    // Filter test suites based on options
    let suitesToRun = this.testSuites;

    if (options.category) {
      suitesToRun = suitesToRun.filter(suite => suite.category === options.category);
    }

    if (options.priority) {
      suitesToRun = suitesToRun.filter(suite => suite.priority === options.priority);
    }

    // Display test plan
    this.displayTestPlan(suitesToRun);

    // Run tests
    if (options.parallel && suitesToRun.length > 1) {
      await this.runTestsInParallel(suitesToRun, options);
    } else {
      await this.runTestsSequentially(suitesToRun, options);
    }

    // Generate reports
    if (options.generateReport) {
      await this.generateTestReport();
    }

    // Display summary
    this.displaySummary();
  }

  private displayTestPlan(suites: TestSuite[]): void {
    console.log(chalk.yellow.bold('📋 Test Plan:\n'));

    const totalDuration = suites.reduce((sum, suite) => sum + suite.estimatedDuration, 0);

    console.log(chalk.cyan(`Tests to run: ${suites.length}`));
    console.log(chalk.cyan(`Estimated duration: ${Math.ceil(totalDuration / 60)} minutes\n`));

    suites.forEach((suite, index) => {
      const priorityIcon = {
        critical: '🔴',
        high: '🟠',
        medium: '🟡',
        low: '🟢',
      }[suite.priority];

      const categoryIcon = {
        security: '🔒',
        functionality: '⚙️',
        performance: '⚡',
        integration: '🔗',
      }[suite.category];

      console.log(`${index + 1}. ${priorityIcon} ${categoryIcon} ${chalk.bold(suite.name)}`);
      console.log(`   ${chalk.gray(suite.description)}`);
      console.log(
        `   ${chalk.dim(`~${suite.estimatedDuration}s | ${suite.category} | ${suite.priority}`)}\n`
      );
    });
  }

  private async runTestsSequentially(suites: TestSuite[], options: Record<string, unknown>): Promise<void> {
    console.log(chalk.green.bold('🏃 Running tests sequentially...\n'));

    for (const [index, suite] of suites.entries()) {
      console.log(chalk.blue(`[${index + 1}/${suites.length}] Running ${suite.name}...`));

      const result = await this.runSingleTest(suite, options);
      this.results.push(result);

      if (result.passed) {
        console.log(chalk.green(`✅ ${suite.name} passed in ${result.duration}s`));
      } else {
        console.log(chalk.red(`❌ ${suite.name} failed in ${result.duration}s`));
        if (result.details) {
          console.log(chalk.red(`   ${result.details}`));
        }
      }
      console.log('');
    }
  }

  private async runTestsInParallel(suites: TestSuite[], options: Record<string, unknown>): Promise<void> {
    console.log(chalk.green.bold('🚀 Running tests in parallel...\n'));

    const promises = suites.map(suite => this.runSingleTest(suite, options));
    this.results = await Promise.all(promises);

    // Display results
    suites.forEach((suite, index) => {
      const result = this.results[index];
      if (result.passed) {
        console.log(chalk.green(`✅ ${suite.name} passed in ${result.duration}s`));
      } else {
        console.log(chalk.red(`❌ ${suite.name} failed in ${result.duration}s`));
      }
    });
  }

  private async runSingleTest(suite: TestSuite, options: Record<string, unknown>): Promise<TestResult> {
    const start = Date.now();

    try {
      // Check if test file exists
      if (!fs.existsSync(suite.testFile)) {
        throw new Error(`Test file not found: ${suite.testFile}`);
      }

      // Build test command
      let command = `npx vitest run ${suite.testFile}`;

      if (options.coverage) {
        command += ' --coverage';
      }

      // Run the test
      const output = execSync(command, {
        encoding: 'utf-8',
        cwd: process.cwd(),
        stdio: 'pipe',
      });

      const duration = Math.round((Date.now() - start) / 1000);

      // Parse coverage if available
      let coverage;
      if (options.coverage && output.includes('Coverage')) {
        const coverageMatch = output.match(/(\d+\.?\d*)%/);
        if (coverageMatch) {
          coverage = parseFloat(coverageMatch[1]);
        }
      }

      return {
        suite: suite.name,
        passed: true,
        duration,
        coverage,
        details: 'All tests passed',
      };
    } catch (error) {
      const duration = Math.round((Date.now() - start) / 1000);

      return {
        suite: suite.name,
        passed: false,
        duration,
        details: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  private async generateTestReport(): Promise<void> {
    const reportDir = path.join(process.cwd(), 'reports/gumroad-testing');
    await fs.ensureDir(reportDir);

    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        totalTests: this.results.length,
        passed: this.results.filter(r => r.passed).length,
        failed: this.results.filter(r => !r.passed).length,
        totalDuration: this.results.reduce((sum, r) => sum + r.duration, 0),
        averageCoverage: this.calculateAverageCoverage(),
      },
      results: this.results,
      testSuites: this.testSuites,
      environment: {
        nodeVersion: process.version,
        platform: process.platform,
        timestamp: new Date().toISOString(),
      },
    };

    // Write JSON report
    const jsonPath = path.join(reportDir, 'test-report.json');
    await fs.writeJSON(jsonPath, report, { spaces: 2 });

    // Write HTML report
    const htmlPath = path.join(reportDir, 'test-report.html');
    await this.generateHTMLReport(report, htmlPath);

    console.log(chalk.blue(`📊 Reports generated:`));
    console.log(chalk.gray(`   JSON: ${jsonPath}`));
    console.log(chalk.gray(`   HTML: ${htmlPath}\n`));
  }

  private async generateHTMLReport(report: any, htmlPath: string): Promise<void> {
    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Gumroad Testing Report</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; margin: 40px; background: #f5f5f5; }
        .container { max-width: 1200px; margin: 0 auto; background: white; border-radius: 8px; padding: 30px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .header { text-align: center; margin-bottom: 40px; }
        .summary { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-bottom: 40px; }
        .metric { background: #f8f9fa; padding: 20px; border-radius: 6px; text-align: center; }
        .metric-value { font-size: 2em; font-weight: bold; color: #007bff; }
        .metric-label { color: #666; font-size: 0.9em; margin-top: 5px; }
        .results { margin-top: 30px; }
        .test-result { padding: 15px; border-radius: 6px; margin-bottom: 10px; }
        .passed { background: #d4edda; border-left: 4px solid #28a745; }
        .failed { background: #f8d7da; border-left: 4px solid #dc3545; }
        .test-name { font-weight: bold; margin-bottom: 5px; }
        .test-details { color: #666; font-size: 0.9em; }
        .footer { margin-top: 40px; text-align: center; color: #666; font-size: 0.9em; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🧪 Gumroad Testing Report</h1>
            <p>Generated on ${new Date(report.timestamp).toLocaleString()}</p>
        </div>
        
        <div class="summary">
            <div class="metric">
                <div class="metric-value">${report.summary.totalTests}</div>
                <div class="metric-label">Total Tests</div>
            </div>
            <div class="metric">
                <div class="metric-value" style="color: #28a745">${report.summary.passed}</div>
                <div class="metric-label">Passed</div>
            </div>
            <div class="metric">
                <div class="metric-value" style="color: #dc3545">${report.summary.failed}</div>
                <div class="metric-label">Failed</div>
            </div>
            <div class="metric">
                <div class="metric-value">${report.summary.totalDuration}s</div>
                <div class="metric-label">Total Duration</div>
            </div>
            ${
              report.summary.averageCoverage
                ? `
            <div class="metric">
                <div class="metric-value">${report.summary.averageCoverage.toFixed(1)}%</div>
                <div class="metric-label">Avg Coverage</div>
            </div>
            `
                : ''
            }
        </div>
        
        <div class="results">
            <h2>Test Results</h2>
            ${report.results
              .map(
                (result: Response) => `
                <div class="test-result ${result.passed ? 'passed' : 'failed'}">
                    <div class="test-name">${result.passed ? '✅' : '❌'} ${result.suite}</div>
                    <div class="test-details">
                        Duration: ${result.duration}s
                        ${result.coverage ? ` | Coverage: ${result.coverage}%` : ''}
                        ${result.details ? ` | ${result.details}` : ''}
                    </div>
                </div>
            `
              )
              .join('')}
        </div>
        
        <div class="footer">
            <p>Gumroad Testing & Validation Suite - AI Glossary Pro</p>
        </div>
    </div>
</body>
</html>`;

    await fs.writeFile(htmlPath, html);
  }

  private calculateAverageCoverage(): number | null {
    const coverageResults = this.results.filter(r => r.coverage !== undefined);
    if (coverageResults.length === 0) return null;

    const total = coverageResults.reduce((sum, r) => sum + (r.coverage || 0), 0);
    return total / coverageResults.length;
  }

  private displaySummary(): void {
    console.log(chalk.blue.bold('\n📊 Test Summary\n'));

    const passed = this.results.filter(r => r.passed).length;
    const failed = this.results.filter(r => !r.passed).length;
    const totalDuration = this.results.reduce((sum, r) => sum + r.duration, 0);

    console.log(`Total tests: ${this.results.length}`);
    console.log(chalk.green(`Passed: ${passed}`));
    console.log(chalk.red(`Failed: ${failed}`));
    console.log(`Total duration: ${totalDuration}s`);

    const coverage = this.calculateAverageCoverage();
    if (coverage) {
      console.log(`Average coverage: ${coverage.toFixed(1)}%`);
    }

    console.log('');

    if (failed > 0) {
      console.log(chalk.red.bold('❌ Some tests failed. Please review the results above.'));
      process.exit(1);
    } else {
      console.log(
        chalk.green.bold('✅ All tests passed! Gumroad integration is ready for production.')
      );
    }
  }
}

// CLI Interface
async function main() {
  const args = process.argv.slice(2);
  const runner = new GumroadTestRunner();

  const options = {
    category: args.includes('--security')
      ? 'security'
      : args.includes('--functionality')
        ? 'functionality'
        : args.includes('--performance')
          ? 'performance'
          : args.includes('--integration')
            ? 'integration'
            : undefined,

    priority: args.includes('--critical')
      ? 'critical'
      : args.includes('--high')
        ? 'high'
        : args.includes('--medium')
          ? 'medium'
          : args.includes('--low')
            ? 'low'
            : undefined,

    parallel: args.includes('--parallel'),
    generateReport: args.includes('--report'),
    coverage: args.includes('--coverage'),
  };

  if (args.includes('--help')) {
    console.log(`
🧪 Gumroad Testing & Validation Suite

Usage: npx tsx scripts/gumroad-test-runner.ts [options]

Options:
  --security        Run only security tests
  --functionality   Run only functionality tests  
  --performance     Run only performance tests
  --integration     Run only integration tests
  
  --critical        Run only critical priority tests
  --high           Run only high priority tests
  --medium         Run only medium priority tests
  --low            Run only low priority tests
  
  --parallel       Run tests in parallel
  --report         Generate HTML and JSON reports
  --coverage       Include code coverage analysis
  --help           Show this help message

Examples:
  npx tsx scripts/gumroad-test-runner.ts
  npx tsx scripts/gumroad-test-runner.ts --security --critical
  npx tsx scripts/gumroad-test-runner.ts --parallel --report --coverage
`);
    return;
  }

  try {
    await runner.runAllTests(options);
  } catch (error) {
    console.error(chalk.red('Error running tests:'), error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main().catch(console.error);
}

export { GumroadTestRunner };
