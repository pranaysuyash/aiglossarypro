#!/usr/bin/env tsx

import { execSync } from 'node:child_process';
import fs from 'node:fs/promises';
import path from 'node:path';
import { performance } from 'node:perf_hooks';
import fetch from 'node-fetch';

interface TestConfig {
  cdnProvider: 'cloudflare' | 'cloudfront' | 'local';
  environment: 'development' | 'staging' | 'production';
  verbose: boolean;
  iterations: number;
  timeout: number;
  skipBuild: boolean;
}

interface PerformanceTest {
  name: string;
  url: string;
  expectedSize?: number;
  expectedContentType?: string;
  critical: boolean;
}

interface TestResult {
  test: string;
  url: string;
  success: boolean;
  responseTime: number;
  statusCode: number;
  contentType?: string;
  contentLength?: number;
  cacheStatus?: string;
  edgeLocation?: string;
  error?: string;
}

interface TestSummary {
  provider: string;
  environment: string;
  timestamp: string;
  totalTests: number;
  passedTests: number;
  failedTests: number;
  averageResponseTime: number;
  cacheHitRatio: number;
  totalSize: number;
  results: TestResult[];
  recommendations: string[];
}

class CDNTester {
  private config: TestConfig;
  private baseUrl: string;
  private results: TestResult[] = [];

  constructor(config: TestConfig) {
    this.config = config;
    this.baseUrl = this.getCDNBaseUrl();
  }

  private getCDNBaseUrl(): string {
    switch (this.config.cdnProvider) {
      case 'cloudflare':
        return process.env.CLOUDFLARE_CDN_URL || 'https://cdn.aiglossarypro.com';
      case 'cloudfront':
        return process.env.CLOUDFRONT_CDN_URL || 'https://d1234567890.cloudfront.net';
      default:
        return 'http://localhost:5173';
    }
  }

  private log(message: string, level: 'info' | 'warn' | 'error' = 'info'): void {
    if (!this.config.verbose && level === 'info') return;

    const timestamp = new Date().toISOString();
    const prefix = `[${timestamp}] [${level.toUpperCase()}]`;

    switch (level) {
      case 'error':
        console.error(`${prefix} ${message}`);
        break;
      case 'warn':
        console.warn(`${prefix} ${message}`);
        break;
      default:
        console.log(`${prefix} ${message}`);
    }
  }

  private async buildProject(): Promise<void> {
    if (this.config.skipBuild) {
      this.log('Skipping build step');
      return;
    }

    this.log('Building project for CDN testing...');

    try {
      const buildEnv = {
        ...process.env,
        NODE_ENV: 'production',
        [`USE_${this.config.cdnProvider.toUpperCase()}_CDN`]: 'true',
      };

      execSync('npm run build', {
        stdio: this.config.verbose ? 'inherit' : 'ignore',
        env: buildEnv,
      });

      this.log('Build completed successfully');
    } catch (error) {
      throw new Error(`Build failed: ${error}`);
    }
  }

  private async getTestUrls(): Promise<PerformanceTest[]> {
    const distPath = path.join(process.cwd(), 'dist', 'public');

    const tests: PerformanceTest[] = [
      {
        name: 'Main HTML',
        url: `${this.baseUrl}/`,
        expectedContentType: 'text/html',
        critical: true,
      },
      {
        name: 'Main CSS',
        url: `${this.baseUrl}/assets/css/index-*.css`,
        expectedContentType: 'text/css',
        critical: true,
      },
      {
        name: 'React Bundle',
        url: `${this.baseUrl}/assets/js/react-*.js`,
        expectedContentType: 'application/javascript',
        critical: true,
      },
      {
        name: 'Main App Bundle',
        url: `${this.baseUrl}/assets/js/index-*.js`,
        expectedContentType: 'application/javascript',
        critical: true,
      },
      {
        name: 'CodeBlock Bundle',
        url: `${this.baseUrl}/assets/js/CodeBlock-*.js`,
        expectedContentType: 'application/javascript',
        expectedSize: 700000,
        critical: false,
      },
      {
        name: 'Charts Bundle',
        url: `${this.baseUrl}/assets/js/charts-*.js`,
        expectedContentType: 'application/javascript',
        expectedSize: 500000,
        critical: false,
      },
      {
        name: 'Mermaid Bundle',
        url: `${this.baseUrl}/assets/js/mermaid-*.js`,
        expectedContentType: 'application/javascript',
        expectedSize: 400000,
        critical: false,
      },
      {
        name: 'API Health Check',
        url: `${this.baseUrl}/api/health`,
        expectedContentType: 'application/json',
        critical: false,
      },
      {
        name: 'Favicon',
        url: `${this.baseUrl}/favicon.ico`,
        expectedContentType: 'image/x-icon',
        critical: false,
      },
    ];

    // Try to find actual built files and update URLs
    try {
      const assetsPath = path.join(distPath, 'assets');

      // Find CSS files
      const cssFiles = await this.findFiles(path.join(assetsPath, 'css'), '.css');
      if (cssFiles.length > 0) {
        const mainCss = tests.find(t => t.name === 'Main CSS');
        if (mainCss) {
          mainCss.url = `${this.baseUrl}/assets/css/${cssFiles[0]}`;
        }
      }

      // Find JS files
      const jsFiles = await this.findFiles(path.join(assetsPath, 'js'), '.js');

      // Update URLs with actual file names
      for (const test of tests) {
        if (test.url.includes('react-*.js')) {
          const reactFile = jsFiles.find(f => f.includes('react-'));
          if (reactFile) test.url = `${this.baseUrl}/assets/js/${reactFile}`;
        }

        if (test.url.includes('index-*.js')) {
          const indexFile = jsFiles.find(f => f.includes('index-'));
          if (indexFile) test.url = `${this.baseUrl}/assets/js/${indexFile}`;
        }

        if (test.url.includes('CodeBlock-*.js')) {
          const codeBlockFile = jsFiles.find(f => f.includes('CodeBlock-'));
          if (codeBlockFile) test.url = `${this.baseUrl}/assets/js/${codeBlockFile}`;
        }

        if (test.url.includes('charts-*.js')) {
          const chartsFile = jsFiles.find(f => f.includes('charts-'));
          if (chartsFile) test.url = `${this.baseUrl}/assets/js/${chartsFile}`;
        }

        if (test.url.includes('mermaid-*.js')) {
          const mermaidFile = jsFiles.find(f => f.includes('mermaid-'));
          if (mermaidFile) test.url = `${this.baseUrl}/assets/js/${mermaidFile}`;
        }
      }
    } catch (error) {
      this.log(`Could not read built assets: ${error}`, 'warn');
    }

    return tests.filter(test => !test.url.includes('*'));
  }

  private async findFiles(dir: string, extension: string): Promise<string[]> {
    try {
      const files = await fs.readdir(dir);
      return files.filter(file => file.endsWith(extension));
    } catch (_error) {
      return [];
    }
  }

  private async performTest(test: PerformanceTest): Promise<TestResult> {
    const startTime = performance.now();

    try {
      const response = await fetch(test.url, {
        method: 'GET',
        timeout: this.config.timeout,
        headers: {
          'User-Agent': 'AIGlossaryPro-CDN-Test/1.0',
          Accept: '*/*',
          'Cache-Control': 'no-cache',
        },
      });

      const responseTime = performance.now() - startTime;
      const contentType = response.headers.get('content-type') || undefined;
      const contentLength = parseInt(response.headers.get('content-length') || '0');
      const cacheStatus = this.getCacheStatus(response.headers);
      const edgeLocation = this.getEdgeLocation(response.headers);

      return {
        test: test.name,
        url: test.url,
        success: response.ok,
        responseTime,
        statusCode: response.status,
        contentType,
        contentLength,
        cacheStatus,
        edgeLocation,
      };
    } catch (error) {
      const responseTime = performance.now() - startTime;

      return {
        test: test.name,
        url: test.url,
        success: false,
        responseTime,
        statusCode: 0,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  private getCacheStatus(headers: any): string {
    const cfCacheStatus = headers.get('cf-cache-status');
    const xCache = headers.get('x-cache');

    if (cfCacheStatus) return cfCacheStatus;
    if (xCache) return xCache.includes('Hit') ? 'HIT' : 'MISS';

    return 'UNKNOWN';
  }

  private getEdgeLocation(headers: any): string {
    const cfRay = headers.get('cf-ray');
    const xAmzCfId = headers.get('x-amz-cf-id');

    if (cfRay) return `Cloudflare-${cfRay.split('-')[1] || 'unknown'}`;
    if (xAmzCfId) return 'CloudFront';

    return 'Origin';
  }

  private async runPerformanceTests(): Promise<void> {
    this.log('Starting CDN performance tests...');

    const tests = await this.getTestUrls();
    this.log(`Running ${tests.length} performance tests`);

    const criticalTests = tests.filter(t => t.critical);
    const nonCriticalTests = tests.filter(t => !t.critical);

    // Test critical assets
    for (const test of criticalTests) {
      this.log(`Testing critical asset: ${test.name}`);

      for (let i = 0; i < this.config.iterations; i++) {
        const result = await this.performTest(test);
        this.results.push(result);

        if (!result.success) {
          this.log(`Critical test failed: ${test.name} - ${result.error}`, 'error');
        } else {
          this.log(`✓ ${test.name}: ${result.responseTime.toFixed(0)}ms, ${result.cacheStatus}`);
        }

        if (i < this.config.iterations - 1) {
          await this.delay(100);
        }
      }
    }

    // Test non-critical assets
    for (const test of nonCriticalTests) {
      this.log(`Testing non-critical asset: ${test.name}`);

      const result = await this.performTest(test);
      this.results.push(result);

      if (!result.success) {
        this.log(`Test failed: ${test.name} - ${result.error}`, 'warn');
      } else {
        this.log(`✓ ${test.name}: ${result.responseTime.toFixed(0)}ms, ${result.cacheStatus}`);
      }
    }
  }

  private generateSummary(): TestSummary {
    const passedTests = this.results.filter(r => r.success);
    const failedTests = this.results.filter(r => !r.success);
    const cacheHits = this.results.filter(r => r.cacheStatus?.includes('HIT'));

    const averageResponseTime =
      this.results.reduce((sum, r) => sum + r.responseTime, 0) / this.results.length;
    const cacheHitRatio = cacheHits.length / this.results.length;
    const totalSize = this.results.reduce((sum, r) => sum + (r.contentLength || 0), 0);

    const recommendations: string[] = [];

    if (cacheHitRatio < 0.8) {
      recommendations.push(
        `Low cache hit ratio (${(cacheHitRatio * 100).toFixed(1)}%). Consider warming the cache or adjusting cache headers.`
      );
    }

    if (averageResponseTime > 1000) {
      recommendations.push(
        `High average response time (${averageResponseTime.toFixed(0)}ms). Consider optimizing asset sizes or CDN configuration.`
      );
    }

    if (failedTests.length > 0) {
      recommendations.push(
        `${failedTests.length} tests failed. Check CDN configuration and asset availability.`
      );
    }

    if (totalSize > 5 * 1024 * 1024) {
      recommendations.push(
        `Total asset size is large (${this.formatBytes(totalSize)}). Consider code splitting or asset optimization.`
      );
    }

    const largeAssets = this.results.filter(r => (r.contentLength || 0) > 1024 * 1024);
    if (largeAssets.length > 0) {
      recommendations.push(
        `Found ${largeAssets.length} assets larger than 1MB. Consider optimization.`
      );
    }

    return {
      provider: this.config.cdnProvider,
      environment: this.config.environment,
      timestamp: new Date().toISOString(),
      totalTests: this.results.length,
      passedTests: passedTests.length,
      failedTests: failedTests.length,
      averageResponseTime,
      cacheHitRatio,
      totalSize,
      results: this.results,
      recommendations,
    };
  }

  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 B';

    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return `${parseFloat((bytes / k ** i).toFixed(2))} ${sizes[i]}`;
  }

  private async saveResults(summary: TestSummary): Promise<void> {
    const reportPath = path.join(process.cwd(), 'cdn-test-results.json');
    await fs.writeFile(reportPath, JSON.stringify(summary, null, 2));
    this.log(`Test results saved to: ${reportPath}`);
  }

  private printSummary(summary: TestSummary): void {
    console.log(`\n${'='.repeat(60)}`);
    console.log('CDN PERFORMANCE TEST RESULTS');
    console.log('='.repeat(60));
    console.log(`Provider: ${summary.provider}`);
    console.log(`Environment: ${summary.environment}`);
    console.log(`Test Date: ${summary.timestamp}`);
    console.log(`Total Tests: ${summary.totalTests}`);
    console.log(
      `Passed: ${summary.passedTests} (${((summary.passedTests / summary.totalTests) * 100).toFixed(1)}%)`
    );
    console.log(
      `Failed: ${summary.failedTests} (${((summary.failedTests / summary.totalTests) * 100).toFixed(1)}%)`
    );
    console.log(`Average Response Time: ${summary.averageResponseTime.toFixed(0)}ms`);
    console.log(`Cache Hit Ratio: ${(summary.cacheHitRatio * 100).toFixed(1)}%`);
    console.log(`Total Asset Size: ${this.formatBytes(summary.totalSize)}`);

    if (summary.recommendations.length > 0) {
      console.log('\nRECOMMENDATIONS:');
      summary.recommendations.forEach((rec, i) => {
        console.log(`${i + 1}. ${rec}`);
      });
    }

    console.log('\nDETAILED RESULTS:');
    summary.results.forEach(result => {
      const status = result.success ? '✓' : '✗';
      const size = result.contentLength ? this.formatBytes(result.contentLength) : 'N/A';
      console.log(
        `${status} ${result.test}: ${result.responseTime.toFixed(0)}ms, ${result.statusCode}, ${size}, ${result.cacheStatus || 'N/A'}`
      );

      if (!result.success && result.error) {
        console.log(`  Error: ${result.error}`);
      }
    });

    console.log(`\n${'='.repeat(60)}`);
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  public async runTests(): Promise<void> {
    try {
      this.log(`Starting CDN tests for ${this.config.cdnProvider} provider`);

      await this.buildProject();
      await this.runPerformanceTests();

      const summary = this.generateSummary();
      await this.saveResults(summary);
      this.printSummary(summary);

      if (summary.failedTests > 0) {
        process.exit(1);
      }
    } catch (error) {
      this.log(`CDN testing failed: ${error}`, 'error');
      process.exit(1);
    }
  }
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);

  const config: TestConfig = {
    cdnProvider: 'local',
    environment: 'development',
    verbose: args.includes('--verbose') || args.includes('-v'),
    iterations: 3,
    timeout: 30000,
    skipBuild: args.includes('--skip-build'),
  };

  if (args.includes('--cloudflare')) {
    config.cdnProvider = 'cloudflare';
  } else if (args.includes('--cloudfront')) {
    config.cdnProvider = 'cloudfront';
  } else if (args.includes('--local')) {
    config.cdnProvider = 'local';
  }

  const envIndex = args.findIndex(arg => arg === '--env');
  if (envIndex !== -1 && args[envIndex + 1]) {
    config.environment = args[envIndex + 1] as any;
  }

  const iterIndex = args.findIndex(arg => arg === '--iterations');
  if (iterIndex !== -1 && args[iterIndex + 1]) {
    config.iterations = parseInt(args[iterIndex + 1]) || 3;
  }

  const timeoutIndex = args.findIndex(arg => arg === '--timeout');
  if (timeoutIndex !== -1 && args[timeoutIndex + 1]) {
    config.timeout = parseInt(args[timeoutIndex + 1]) || 30000;
  }

  if (args.includes('--help') || args.includes('-h')) {
    console.log(`
CDN Performance Testing Script

Usage: tsx scripts/test-cdn.ts [options]

Options:
  --cloudflare        Test Cloudflare CDN
  --cloudfront        Test AWS CloudFront
  --local             Test local server
  --env <env>         Set environment (development|staging|production)
  --iterations <n>    Number of test iterations (default: 3)
  --timeout <ms>      Request timeout in milliseconds (default: 30000)
  --skip-build        Skip the build step
  --verbose, -v       Enable verbose logging
  --help, -h          Show this help message

Examples:
  tsx scripts/test-cdn.ts --cloudflare --env production --verbose
  tsx scripts/test-cdn.ts --local --iterations 5
  tsx scripts/test-cdn.ts --cloudfront --timeout 10000
    `);
    return;
  }

  const tester = new CDNTester(config);
  await tester.runTests();
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}
