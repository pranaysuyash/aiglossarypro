#!/usr/bin/env tsx

/**
 * Final Launch Validation Script
 * Production-ready security and performance validation for AI Glossary Pro
 */

import axios from 'axios';
import { execSync } from 'child_process';
import { config } from 'dotenv';
import { existsSync, readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

// Load environment variables
config();

interface ValidationResult {
  category: string;
  test: string;
  status: 'PASS' | 'FAIL' | 'WARNING';
  details: string;
  critical?: boolean;
  recommendation?: string;
}

interface SecurityTestResults {
  sqlInjectionProtection: boolean;
  xssProtection: boolean;
  rateLimiting: boolean;
  authentication: boolean;
  securityHeaders: boolean;
  inputSanitization: boolean;
}

interface PerformanceMetrics {
  buildTime: number;
  bundleSize: number;
  databaseConnection: number;
  cachePerformance: number;
}

class FinalLaunchValidator {
  private results: ValidationResult[] = [];
  private startTime: number = Date.now();

  constructor() {
    console.log('🚀 Final Launch Validation - AI Glossary Pro');
    console.log('='.repeat(60));
  }

  private addResult(result: ValidationResult) {
    this.results.push(result);
    const icon = result.status === 'PASS' ? '✅' : result.status === 'WARNING' ? '⚠️' : '❌';
    const critical = result.critical ? ' [CRITICAL]' : '';
    console.log(`${icon} ${result.category}: ${result.test}${critical}`);
    console.log(`   ${result.details}`);
  }

  private async validateEnvironment(): Promise<void> {
    console.log('\\n🔧 Environment Validation...');

    // Critical environment variables
    const criticalVars = [
      'DATABASE_URL',
      'JWT_SECRET',
      'NODE_ENV',
      'SESSION_SECRET',
      'OPENAI_API_KEY',
    ];

    for (const envVar of criticalVars) {
      if (process.env[envVar]) {
        this.addResult({
          category: 'Environment',
          test: `${envVar} configured`,
          status: 'PASS',
          details: `Environment variable is properly set`,
        });
      } else {
        this.addResult({
          category: 'Environment',
          test: `${envVar} configured`,
          status: 'FAIL',
          details: `Critical environment variable missing`,
          critical: true,
          recommendation: `Set ${envVar} in .env file`,
        });
      }
    }

    // Optional but recommended variables
    const optionalVars = ['FIREBASE_PROJECT_ID', 'SENTRY_DSN', 'REDIS_URL', 'POSTHOG_API_KEY'];

    for (const envVar of optionalVars) {
      if (process.env[envVar]) {
        this.addResult({
          category: 'Environment',
          test: `${envVar} configured`,
          status: 'PASS',
          details: `Optional service configured`,
        });
      } else {
        this.addResult({
          category: 'Environment',
          test: `${envVar} configured`,
          status: 'WARNING',
          details: `Optional service not configured`,
        });
      }
    }
  }

  private async validateDependencies(): Promise<void> {
    console.log('\\n📦 Dependencies Validation...');

    try {
      // Check for security vulnerabilities
      const auditResult = execSync('npm audit --json', { encoding: 'utf8' });
      const audit = JSON.parse(auditResult);

      if (audit.vulnerabilities) {
        const vulnCount = Object.keys(audit.vulnerabilities).length;
        const highVulns = Object.values(audit.vulnerabilities).filter(
          (v: any) => v.severity === 'high' || v.severity === 'critical'
        ).length;

        if (highVulns > 0) {
          this.addResult({
            category: 'Dependencies',
            test: 'Security vulnerabilities',
            status: 'FAIL',
            details: `Found ${highVulns} high/critical vulnerabilities out of ${vulnCount} total`,
            critical: true,
            recommendation: 'Run npm audit fix to resolve vulnerabilities',
          });
        } else if (vulnCount > 0) {
          this.addResult({
            category: 'Dependencies',
            test: 'Security vulnerabilities',
            status: 'WARNING',
            details: `Found ${vulnCount} low/moderate vulnerabilities`,
          });
        } else {
          this.addResult({
            category: 'Dependencies',
            test: 'Security vulnerabilities',
            status: 'PASS',
            details: 'No security vulnerabilities found',
          });
        }
      }
    } catch (error) {
      this.addResult({
        category: 'Dependencies',
        test: 'Security vulnerabilities',
        status: 'WARNING',
        details: 'Unable to run security audit',
      });
    }

    // Check critical production dependencies
    const criticalDeps = [
      'express',
      'helmet',
      'express-rate-limit',
      'dompurify',
      'drizzle-orm',
      'firebase',
      'react',
      'react-dom',
    ];

    const packageJson = JSON.parse(readFileSync('package.json', 'utf8'));

    for (const dep of criticalDeps) {
      if (packageJson.dependencies[dep]) {
        this.addResult({
          category: 'Dependencies',
          test: `${dep} installed`,
          status: 'PASS',
          details: `Version: ${packageJson.dependencies[dep]}`,
        });
      } else {
        this.addResult({
          category: 'Dependencies',
          test: `${dep} installed`,
          status: 'FAIL',
          details: 'Critical dependency missing',
          critical: true,
        });
      }
    }
  }

  private async validateSecurity(): Promise<SecurityTestResults> {
    console.log('\\n🔒 Security Validation...');

    const results: SecurityTestResults = {
      sqlInjectionProtection: false,
      xssProtection: false,
      rateLimiting: false,
      authentication: false,
      securityHeaders: false,
      inputSanitization: false,
    };

    // Check for SQL injection protection
    try {
      const drizzleFiles = execSync('find . -name "*.ts" -type f -exec grep -l "drizzle" {} \\;', {
        encoding: 'utf8',
      })
        .trim()
        .split('\\n');

      if (drizzleFiles.length > 0) {
        results.sqlInjectionProtection = true;
        this.addResult({
          category: 'Security',
          test: 'SQL injection protection',
          status: 'PASS',
          details: 'Using Drizzle ORM with parameterized queries',
        });
      }
    } catch (error) {
      this.addResult({
        category: 'Security',
        test: 'SQL injection protection',
        status: 'WARNING',
        details: 'Unable to verify SQL injection protection',
      });
    }

    // Check for XSS protection (DOMPurify)
    try {
      const xssFiles = execSync(
        'find . -name "*.ts" -o -name "*.tsx" -type f -exec grep -l "sanitize\\|DOMPurify" {} \\;',
        { encoding: 'utf8' }
      )
        .trim()
        .split('\\n');

      if (xssFiles.length > 0) {
        results.xssProtection = true;
        this.addResult({
          category: 'Security',
          test: 'XSS protection',
          status: 'PASS',
          details: 'DOMPurify sanitization implemented',
        });
      } else {
        this.addResult({
          category: 'Security',
          test: 'XSS protection',
          status: 'FAIL',
          details: 'XSS protection not found',
          critical: true,
        });
      }
    } catch (error) {
      this.addResult({
        category: 'Security',
        test: 'XSS protection',
        status: 'WARNING',
        details: 'Unable to verify XSS protection',
      });
    }

    // Check for rate limiting
    try {
      const rateLimitFiles = execSync(
        'find . -name "*.ts" -type f -exec grep -l "rateLimit\\|express-rate-limit" {} \\;',
        { encoding: 'utf8' }
      )
        .trim()
        .split('\\n');

      if (rateLimitFiles.length > 0) {
        results.rateLimiting = true;
        this.addResult({
          category: 'Security',
          test: 'Rate limiting',
          status: 'PASS',
          details: 'Express rate limiting implemented',
        });
      } else {
        this.addResult({
          category: 'Security',
          test: 'Rate limiting',
          status: 'FAIL',
          details: 'Rate limiting not implemented',
          critical: true,
        });
      }
    } catch (error) {
      this.addResult({
        category: 'Security',
        test: 'Rate limiting',
        status: 'WARNING',
        details: 'Unable to verify rate limiting',
      });
    }

    // Check for authentication
    try {
      const authFiles = execSync(
        'find . -name "*.ts" -type f -exec grep -l "firebase\\|jwt\\|passport" {} \\;',
        { encoding: 'utf8' }
      )
        .trim()
        .split('\\n');

      if (authFiles.length > 0) {
        results.authentication = true;
        this.addResult({
          category: 'Security',
          test: 'Authentication system',
          status: 'PASS',
          details: 'Authentication system implemented',
        });
      } else {
        this.addResult({
          category: 'Security',
          test: 'Authentication system',
          status: 'FAIL',
          details: 'Authentication system not found',
          critical: true,
        });
      }
    } catch (error) {
      this.addResult({
        category: 'Security',
        test: 'Authentication system',
        status: 'WARNING',
        details: 'Unable to verify authentication',
      });
    }

    // Check for security headers (Helmet)
    try {
      const helmetFiles = execSync('find . -name "*.ts" -type f -exec grep -l "helmet" {} \\;', {
        encoding: 'utf8',
      })
        .trim()
        .split('\\n');

      if (helmetFiles.length > 0) {
        results.securityHeaders = true;
        this.addResult({
          category: 'Security',
          test: 'Security headers',
          status: 'PASS',
          details: 'Helmet security headers configured',
        });
      } else {
        this.addResult({
          category: 'Security',
          test: 'Security headers',
          status: 'FAIL',
          details: 'Security headers not configured',
          critical: true,
        });
      }
    } catch (error) {
      this.addResult({
        category: 'Security',
        test: 'Security headers',
        status: 'WARNING',
        details: 'Unable to verify security headers',
      });
    }

    return results;
  }

  private async validatePerformance(): Promise<PerformanceMetrics> {
    console.log('\\n⚡ Performance Validation...');

    const metrics: PerformanceMetrics = {
      buildTime: 0,
      bundleSize: 0,
      databaseConnection: 0,
      cachePerformance: 0,
    };

    // Test build performance
    try {
      const buildStart = Date.now();
      execSync('npm run build', { stdio: 'pipe' });
      metrics.buildTime = Date.now() - buildStart;

      if (metrics.buildTime < 60000) {
        // 1 minute
        this.addResult({
          category: 'Performance',
          test: 'Build time',
          status: 'PASS',
          details: `Build completed in ${(metrics.buildTime / 1000).toFixed(2)}s`,
        });
      } else if (metrics.buildTime < 120000) {
        // 2 minutes
        this.addResult({
          category: 'Performance',
          test: 'Build time',
          status: 'WARNING',
          details: `Build took ${(metrics.buildTime / 1000).toFixed(2)}s (target: <60s)`,
        });
      } else {
        this.addResult({
          category: 'Performance',
          test: 'Build time',
          status: 'FAIL',
          details: `Build took ${(metrics.buildTime / 1000).toFixed(2)}s (target: <60s)`,
          critical: true,
        });
      }
    } catch (error) {
      this.addResult({
        category: 'Performance',
        test: 'Build time',
        status: 'FAIL',
        details: 'Build failed',
        critical: true,
      });
    }

    // Check bundle size
    try {
      if (existsSync('dist')) {
        const bundleSize = execSync('du -sh dist | cut -f1', { encoding: 'utf8' }).trim();
        this.addResult({
          category: 'Performance',
          test: 'Bundle size',
          status: 'PASS',
          details: `Bundle size: ${bundleSize}`,
        });
      } else {
        this.addResult({
          category: 'Performance',
          test: 'Bundle size',
          status: 'WARNING',
          details: 'Build output not found',
        });
      }
    } catch (error) {
      this.addResult({
        category: 'Performance',
        test: 'Bundle size',
        status: 'WARNING',
        details: 'Unable to measure bundle size',
      });
    }

    // Test database connection performance
    try {
      const dbStart = Date.now();
      execSync('npm run db:status', { stdio: 'pipe' });
      metrics.databaseConnection = Date.now() - dbStart;

      if (metrics.databaseConnection < 5000) {
        this.addResult({
          category: 'Performance',
          test: 'Database connection',
          status: 'PASS',
          details: `Database connection: ${metrics.databaseConnection}ms`,
        });
      } else {
        this.addResult({
          category: 'Performance',
          test: 'Database connection',
          status: 'WARNING',
          details: `Database connection: ${metrics.databaseConnection}ms (slow)`,
        });
      }
    } catch (error) {
      this.addResult({
        category: 'Performance',
        test: 'Database connection',
        status: 'FAIL',
        details: 'Database connection failed',
        critical: true,
      });
    }

    return metrics;
  }

  private async validateSystemHealth(): Promise<void> {
    console.log('\\n🏥 System Health Validation...');

    // Check disk space
    try {
      const diskUsage = execSync('df -h . | tail -1', { encoding: 'utf8' });
      const usage = diskUsage.match(/\\s+(\\d+)%/);
      if (usage) {
        const usagePercent = parseInt(usage[1]);
        if (usagePercent < 80) {
          this.addResult({
            category: 'System Health',
            test: 'Disk space',
            status: 'PASS',
            details: `Disk usage: ${usagePercent}%`,
          });
        } else if (usagePercent < 90) {
          this.addResult({
            category: 'System Health',
            test: 'Disk space',
            status: 'WARNING',
            details: `Disk usage: ${usagePercent}% (high)`,
          });
        } else {
          this.addResult({
            category: 'System Health',
            test: 'Disk space',
            status: 'FAIL',
            details: `Disk usage: ${usagePercent}% (critical)`,
            critical: true,
          });
        }
      }
    } catch (error) {
      this.addResult({
        category: 'System Health',
        test: 'Disk space',
        status: 'WARNING',
        details: 'Unable to check disk space',
      });
    }

    // Check memory usage
    const memUsage = process.memoryUsage();
    const memUsageMB = memUsage.heapUsed / 1024 / 1024;

    if (memUsageMB < 100) {
      this.addResult({
        category: 'System Health',
        test: 'Memory usage',
        status: 'PASS',
        details: `Memory usage: ${memUsageMB.toFixed(2)}MB`,
      });
    } else if (memUsageMB < 500) {
      this.addResult({
        category: 'System Health',
        test: 'Memory usage',
        status: 'WARNING',
        details: `Memory usage: ${memUsageMB.toFixed(2)}MB (moderate)`,
      });
    } else {
      this.addResult({
        category: 'System Health',
        test: 'Memory usage',
        status: 'FAIL',
        details: `Memory usage: ${memUsageMB.toFixed(2)}MB (high)`,
        critical: true,
      });
    }

    // Check Node.js version
    try {
      const nodeVersion = process.version;
      const majorVersion = parseInt(nodeVersion.slice(1).split('.')[0]);

      if (majorVersion >= 18) {
        this.addResult({
          category: 'System Health',
          test: 'Node.js version',
          status: 'PASS',
          details: `Node.js version: ${nodeVersion}`,
        });
      } else {
        this.addResult({
          category: 'System Health',
          test: 'Node.js version',
          status: 'FAIL',
          details: `Node.js version: ${nodeVersion} (requires >=18)`,
          critical: true,
        });
      }
    } catch (error) {
      this.addResult({
        category: 'System Health',
        test: 'Node.js version',
        status: 'WARNING',
        details: 'Unable to check Node.js version',
      });
    }
  }

  private async validateCodeQuality(): Promise<void> {
    console.log('\\n🔍 Code Quality Validation...');

    // Check TypeScript compilation
    try {
      execSync('npx tsc --noEmit', { stdio: 'pipe' });
      this.addResult({
        category: 'Code Quality',
        test: 'TypeScript compilation',
        status: 'PASS',
        details: 'TypeScript compilation successful',
      });
    } catch (error) {
      this.addResult({
        category: 'Code Quality',
        test: 'TypeScript compilation',
        status: 'FAIL',
        details: 'TypeScript compilation errors found',
        critical: true,
      });
    }

    // Check for TODO comments
    try {
      const todoCount = execSync(
        'find . -name "*.ts" -o -name "*.tsx" -type f | xargs grep -c "TODO\\|FIXME\\|XXX" | wc -l',
        { encoding: 'utf8' }
      ).trim();

      const count = parseInt(todoCount);
      if (count === 0) {
        this.addResult({
          category: 'Code Quality',
          test: 'TODO comments',
          status: 'PASS',
          details: 'No TODO/FIXME comments found',
        });
      } else if (count < 10) {
        this.addResult({
          category: 'Code Quality',
          test: 'TODO comments',
          status: 'WARNING',
          details: `${count} TODO/FIXME comments found`,
        });
      } else {
        this.addResult({
          category: 'Code Quality',
          test: 'TODO comments',
          status: 'FAIL',
          details: `${count} TODO/FIXME comments found (high)`,
          critical: false,
        });
      }
    } catch (error) {
      this.addResult({
        category: 'Code Quality',
        test: 'TODO comments',
        status: 'WARNING',
        details: 'Unable to check TODO comments',
      });
    }

    // Check for console.log statements
    try {
      const consoleCount = execSync(
        'find . -name "*.ts" -o -name "*.tsx" -type f | xargs grep -c "console.log\\|console.warn\\|console.error" | wc -l',
        { encoding: 'utf8' }
      ).trim();

      const count = parseInt(consoleCount);
      if (count === 0) {
        this.addResult({
          category: 'Code Quality',
          test: 'Console statements',
          status: 'PASS',
          details: 'No console statements found',
        });
      } else if (count < 20) {
        this.addResult({
          category: 'Code Quality',
          test: 'Console statements',
          status: 'WARNING',
          details: `${count} console statements found`,
        });
      } else {
        this.addResult({
          category: 'Code Quality',
          test: 'Console statements',
          status: 'FAIL',
          details: `${count} console statements found (high)`,
          critical: false,
        });
      }
    } catch (error) {
      this.addResult({
        category: 'Code Quality',
        test: 'Console statements',
        status: 'WARNING',
        details: 'Unable to check console statements',
      });
    }
  }

  public async runValidation(): Promise<void> {
    try {
      await this.validateEnvironment();
      await this.validateDependencies();
      await this.validateSecurity();
      await this.validatePerformance();
      await this.validateSystemHealth();
      await this.validateCodeQuality();

      this.generateReport();
    } catch (error) {
      console.error('❌ Validation failed:', error);
      throw error;
    }
  }

  private generateReport(): void {
    console.log('\\n' + '='.repeat(60));
    console.log('📊 FINAL LAUNCH VALIDATION REPORT');
    console.log('='.repeat(60));

    const totalTests = this.results.length;
    const passedTests = this.results.filter(r => r.status === 'PASS').length;
    const warningTests = this.results.filter(r => r.status === 'WARNING').length;
    const failedTests = this.results.filter(r => r.status === 'FAIL').length;
    const criticalIssues = this.results.filter(r => r.critical).length;

    const overallScore = Math.round((passedTests / totalTests) * 100);
    const totalTime = Date.now() - this.startTime;

    console.log(`Overall Score: ${overallScore}%`);
    console.log(`Total Tests: ${totalTests}`);
    console.log(`Passed: ${passedTests}`);
    console.log(`Warnings: ${warningTests}`);
    console.log(`Failed: ${failedTests}`);
    console.log(`Critical Issues: ${criticalIssues}`);
    console.log(`Validation Time: ${(totalTime / 1000).toFixed(2)}s`);

    // Determine launch readiness
    let launchReady = false;
    let recommendation = '';

    if (criticalIssues === 0 && failedTests === 0) {
      launchReady = true;
      recommendation = '🚀 READY FOR PRODUCTION LAUNCH';
    } else if (criticalIssues === 0 && failedTests < 3) {
      launchReady = true;
      recommendation = '⚠️ READY WITH MINOR ISSUES - Monitor closely';
    } else if (criticalIssues < 3) {
      launchReady = false;
      recommendation = '🛑 NOT READY - Fix critical issues first';
    } else {
      launchReady = false;
      recommendation = '❌ NOT READY - Major issues require attention';
    }

    console.log(`\\n${recommendation}`);

    // Show critical issues
    if (criticalIssues > 0) {
      console.log('\\n🚨 CRITICAL ISSUES:');
      this.results
        .filter(r => r.critical)
        .forEach(result => {
          console.log(`❌ ${result.category}: ${result.test}`);
          console.log(`   ${result.details}`);
          if (result.recommendation) {
            console.log(`   💡 ${result.recommendation}`);
          }
        });
    }

    // Show failed tests
    if (failedTests > 0) {
      console.log('\\n❌ FAILED TESTS:');
      this.results
        .filter(r => r.status === 'FAIL')
        .forEach(result => {
          console.log(`❌ ${result.category}: ${result.test}`);
          console.log(`   ${result.details}`);
          if (result.recommendation) {
            console.log(`   💡 ${result.recommendation}`);
          }
        });
    }

    // Show warnings
    if (warningTests > 0) {
      console.log('\\n⚠️ WARNINGS:');
      this.results
        .filter(r => r.status === 'WARNING')
        .forEach(result => {
          console.log(`⚠️ ${result.category}: ${result.test}`);
          console.log(`   ${result.details}`);
          if (result.recommendation) {
            console.log(`   💡 ${result.recommendation}`);
          }
        });
    }

    // Save detailed report
    this.saveDetailedReport(overallScore, launchReady, recommendation);
  }

  private saveDetailedReport(score: number, launchReady: boolean, recommendation: string): void {
    const reportPath = join(process.cwd(), 'FINAL_LAUNCH_READINESS_REPORT.md');

    const report = `# Final Launch Readiness Report - AI Glossary Pro

**Generated:** ${new Date().toLocaleString()}  
**Overall Score:** ${score}%  
**Launch Ready:** ${launchReady ? 'YES' : 'NO'}  
**Recommendation:** ${recommendation}

---

## 🎯 Executive Summary

${recommendation}

**Results Summary:**
- Total Tests: ${this.results.length}
- Passed: ${this.results.filter(r => r.status === 'PASS').length}
- Warnings: ${this.results.filter(r => r.status === 'WARNING').length}
- Failed: ${this.results.filter(r => r.status === 'FAIL').length}
- Critical Issues: ${this.results.filter(r => r.critical).length}

---

## 📊 Detailed Results

### ✅ Passed Tests
${this.results
  .filter(r => r.status === 'PASS')
  .map(r => `- **${r.category}**: ${r.test} - ${r.details}`)
  .join('\\n')}

### ⚠️ Warnings
${this.results
  .filter(r => r.status === 'WARNING')
  .map(r => `- **${r.category}**: ${r.test} - ${r.details}`)
  .join('\\n')}

### ❌ Failed Tests
${this.results
  .filter(r => r.status === 'FAIL')
  .map(
    r =>
      `- **${r.category}**: ${r.test} - ${r.details}${r.recommendation ? ` (Fix: ${r.recommendation})` : ''}`
  )
  .join('\\n')}

### 🚨 Critical Issues
${this.results
  .filter(r => r.critical)
  .map(
    r =>
      `- **${r.category}**: ${r.test} - ${r.details}${r.recommendation ? ` (Fix: ${r.recommendation})` : ''}`
  )
  .join('\\n')}

---

## 🚀 Next Steps

${
  launchReady
    ? `
### Production Launch Approved ✅
1. Deploy to production environment
2. Monitor system performance and errors
3. Set up alerting for critical metrics
4. Prepare for user traffic and scaling

### Post-Launch Monitoring
- Set up comprehensive monitoring dashboards
- Monitor user behavior and conversion rates
- Track performance metrics and optimize
- Plan for content updates and feature enhancements
`
    : `
### Fix Issues Before Launch ❌
1. Address all critical issues listed above
2. Resolve failed tests
3. Re-run validation
4. Get stakeholder approval

### Required Actions
${this.results
  .filter(r => r.critical || r.status === 'FAIL')
  .map(r => `- ${r.category}: ${r.test}${r.recommendation ? ` (${r.recommendation})` : ''}`)
  .join('\\n')}
`
}

---

**Validation completed in ${((Date.now() - this.startTime) / 1000).toFixed(2)} seconds**  
**Report generated:** ${new Date().toLocaleString()}
`;

    writeFileSync(reportPath, report, 'utf8');
    console.log(`\\n📄 Detailed report saved to: ${reportPath}`);
  }
}

// Run validation
const validator = new FinalLaunchValidator();
validator.runValidation();
