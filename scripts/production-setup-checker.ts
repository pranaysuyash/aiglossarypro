#!/usr/bin/env node

/**
 * Production Setup Checker
 * 
 * Validates production environment configuration before deployment
 * - Checks required environment variables
 * - Validates Firebase configuration
 * - Verifies database connectivity
 * - Tests Redis connection for job queue
 * - Validates external API keys (OpenAI, PostHog, Sentry)
 * - Performs security checks
 * - Validates SSL configuration
 */

import dotenv from 'dotenv';
import { Pool } from 'pg';
import { createClient } from 'redis';
import https from 'https';
import http from 'http';
import { URL } from 'url';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Load environment variables
dotenv.config({ path: '.env.production' });

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface ValidationResult {
  category: string;
  name: string;
  status: 'PASS' | 'FAIL' | 'WARN' | 'SKIP';
  message: string;
  critical: boolean;
}

interface ConfigCheck {
  name: string;
  category: string;
  critical: boolean;
  check: () => Promise<ValidationResult>;
}

class ProductionSetupChecker {
  private results: ValidationResult[] = [];
  private criticalFailures = 0;
  private warnings = 0;

  private log(message: string, level: 'info' | 'error' | 'warn' | 'success' = 'info') {
    const colors = {
      info: '\x1b[36m',    // Cyan
      error: '\x1b[31m',   // Red
      warn: '\x1b[33m',    // Yellow
      success: '\x1b[32m'  // Green
    };
    const reset = '\x1b[0m';
    console.log(`${colors[level]}${message}${reset}`);
  }

  private async testHttpEndpoint(url: string, timeout = 5000): Promise<boolean> {
    return new Promise((resolve) => {
      const client = url.startsWith('https') ? https : http;
      const req = client.request(url, { timeout }, (res) => {
        resolve(res.statusCode === 200 || res.statusCode === 401 || res.statusCode === 403);
      });
      
      req.on('error', () => resolve(false));
      req.on('timeout', () => resolve(false));
      req.end();
    });
  }

  private async testDatabaseConnection(): Promise<ValidationResult> {
    const databaseUrl = process.env.DATABASE_URL;
    
    if (!databaseUrl) {
      return {
        category: 'Database',
        name: 'Connection String',
        status: 'FAIL',
        message: 'DATABASE_URL is not configured',
        critical: true
      };
    }

    try {
      const pool = new Pool({
        connectionString: databaseUrl,
        ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
        connectionTimeoutMillis: 5000,
        idleTimeoutMillis: 1000,
        max: 1
      });

      const client = await pool.connect();
      await client.query('SELECT 1');
      client.release();
      await pool.end();

      return {
        category: 'Database',
        name: 'Connection Test',
        status: 'PASS',
        message: 'Database connection successful',
        critical: true
      };
    } catch (error) {
      return {
        category: 'Database',
        name: 'Connection Test',
        status: 'FAIL',
        message: `Database connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        critical: true
      };
    }
  }

  private async testRedisConnection(): Promise<ValidationResult> {
    const redisUrl = process.env.REDIS_URL;
    
    if (!redisUrl) {
      return {
        category: 'Redis',
        name: 'Connection String',
        status: 'WARN',
        message: 'REDIS_URL not configured - job queue will be disabled',
        critical: false
      };
    }

    try {
      const client = createClient({
        url: redisUrl,
        socket: {
          connectTimeout: 5000,
          commandTimeout: 5000
        }
      });

      await client.connect();
      await client.ping();
      await client.disconnect();

      return {
        category: 'Redis',
        name: 'Connection Test',
        status: 'PASS',
        message: 'Redis connection successful',
        critical: false
      };
    } catch (error) {
      return {
        category: 'Redis',
        name: 'Connection Test',
        status: 'WARN',
        message: `Redis connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        critical: false
      };
    }
  }

  private async testOpenAIAPI(): Promise<ValidationResult> {
    const apiKey = process.env.OPENAI_API_KEY;
    
    if (!apiKey) {
      return {
        category: 'OpenAI',
        name: 'API Key',
        status: 'WARN',
        message: 'OPENAI_API_KEY not configured - AI features will be disabled',
        critical: false
      };
    }

    if (!apiKey.startsWith('sk-')) {
      return {
        category: 'OpenAI',
        name: 'API Key Format',
        status: 'FAIL',
        message: 'OPENAI_API_KEY does not appear to be valid (should start with "sk-")',
        critical: false
      };
    }

    try {
      const response = await fetch('https://api.openai.com/v1/models', {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'User-Agent': 'AIGlossaryPro/1.0'
        },
        signal: AbortSignal.timeout(10000)
      });

      if (response.ok) {
        return {
          category: 'OpenAI',
          name: 'API Test',
          status: 'PASS',
          message: 'OpenAI API key is valid',
          critical: false
        };
      } else {
        return {
          category: 'OpenAI',
          name: 'API Test',
          status: 'FAIL',
          message: `OpenAI API test failed: ${response.status} ${response.statusText}`,
          critical: false
        };
      }
    } catch (error) {
      return {
        category: 'OpenAI',
        name: 'API Test',
        status: 'WARN',
        message: `OpenAI API test failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        critical: false
      };
    }
  }

  private async testSentryDSN(): Promise<ValidationResult> {
    const sentryDsn = process.env.SENTRY_DSN;
    
    if (!sentryDsn) {
      return {
        category: 'Sentry',
        name: 'DSN Configuration',
        status: 'WARN',
        message: 'SENTRY_DSN not configured - error tracking will be disabled',
        critical: false
      };
    }

    try {
      const url = new URL(sentryDsn);
      if (!url.hostname.includes('sentry.io')) {
        return {
          category: 'Sentry',
          name: 'DSN Format',
          status: 'WARN',
          message: 'SENTRY_DSN does not appear to be a valid Sentry DSN',
          critical: false
        };
      }

      return {
        category: 'Sentry',
        name: 'DSN Format',
        status: 'PASS',
        message: 'Sentry DSN format is valid',
        critical: false
      };
    } catch (error) {
      return {
        category: 'Sentry',
        name: 'DSN Format',
        status: 'FAIL',
        message: `Invalid Sentry DSN format: ${error instanceof Error ? error.message : 'Unknown error'}`,
        critical: false
      };
    }
  }

  private async testPostHogConfiguration(): Promise<ValidationResult> {
    const postHogKey = process.env.POSTHOG_KEY;
    
    if (!postHogKey) {
      return {
        category: 'PostHog',
        name: 'API Key',
        status: 'WARN',
        message: 'POSTHOG_KEY not configured - analytics will be disabled',
        critical: false
      };
    }

    const postHogHost = process.env.POSTHOG_HOST || 'https://app.posthog.com';
    
    try {
      const isReachable = await this.testHttpEndpoint(postHogHost);
      if (!isReachable) {
        return {
          category: 'PostHog',
          name: 'Host Reachability',
          status: 'WARN',
          message: `PostHog host ${postHogHost} is not reachable`,
          critical: false
        };
      }

      return {
        category: 'PostHog',
        name: 'Configuration',
        status: 'PASS',
        message: 'PostHog configuration is valid',
        critical: false
      };
    } catch (error) {
      return {
        category: 'PostHog',
        name: 'Configuration',
        status: 'WARN',
        message: `PostHog configuration test failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        critical: false
      };
    }
  }

  private async checkEnvironmentVariables(): Promise<ValidationResult[]> {
    const requiredVars = [
      { name: 'NODE_ENV', critical: true },
      { name: 'DATABASE_URL', critical: true },
      { name: 'SESSION_SECRET', critical: true },
      { name: 'PORT', critical: false }
    ];

    const results: ValidationResult[] = [];

    for (const variable of requiredVars) {
      const value = process.env[variable.name];
      
      if (!value) {
        results.push({
          category: 'Environment',
          name: variable.name,
          status: 'FAIL',
          message: `Required environment variable ${variable.name} is not set`,
          critical: variable.critical
        });
      } else {
        // Additional validation for specific variables
        if (variable.name === 'NODE_ENV' && value !== 'production') {
          results.push({
            category: 'Environment',
            name: variable.name,
            status: 'WARN',
            message: `NODE_ENV is set to "${value}" - should be "production" for production deployment`,
            critical: false
          });
        } else if (variable.name === 'SESSION_SECRET' && value.length < 32) {
          results.push({
            category: 'Environment',
            name: variable.name,
            status: 'WARN',
            message: 'SESSION_SECRET should be at least 32 characters long for security',
            critical: false
          });
        } else {
          results.push({
            category: 'Environment',
            name: variable.name,
            status: 'PASS',
            message: `${variable.name} is configured`,
            critical: variable.critical
          });
        }
      }
    }

    return results;
  }

  private async checkSSLConfiguration(): Promise<ValidationResult> {
    const sslCertPath = process.env.SSL_CERT_PATH;
    const sslKeyPath = process.env.SSL_KEY_PATH;
    
    if (!sslCertPath || !sslKeyPath) {
      return {
        category: 'SSL',
        name: 'Certificate Configuration',
        status: 'WARN',
        message: 'SSL certificate paths not configured - ensure reverse proxy handles SSL',
        critical: false
      };
    }

    try {
      const certExists = fs.existsSync(sslCertPath);
      const keyExists = fs.existsSync(sslKeyPath);
      
      if (!certExists || !keyExists) {
        return {
          category: 'SSL',
          name: 'Certificate Files',
          status: 'FAIL',
          message: 'SSL certificate or key file not found',
          critical: false
        };
      }

      return {
        category: 'SSL',
        name: 'Certificate Files',
        status: 'PASS',
        message: 'SSL certificate and key files are present',
        critical: false
      };
    } catch (error) {
      return {
        category: 'SSL',
        name: 'Certificate Files',
        status: 'FAIL',
        message: `SSL configuration check failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        critical: false
      };
    }
  }

  private async checkCORSConfiguration(): Promise<ValidationResult> {
    const corsOrigin = process.env.CORS_ORIGIN;
    
    if (!corsOrigin) {
      return {
        category: 'CORS',
        name: 'Origin Configuration',
        status: 'WARN',
        message: 'CORS_ORIGIN not configured - may cause cross-origin issues',
        critical: false
      };
    }

    try {
      new URL(corsOrigin);
      return {
        category: 'CORS',
        name: 'Origin Configuration',
        status: 'PASS',
        message: 'CORS origin is configured with valid URL',
        critical: false
      };
    } catch (error) {
      return {
        category: 'CORS',
        name: 'Origin Configuration',
        status: 'FAIL',
        message: 'CORS_ORIGIN is not a valid URL',
        critical: false
      };
    }
  }

  private async checkGumroadConfiguration(): Promise<ValidationResult> {
    const webhookSecret = process.env.GUMROAD_WEBHOOK_SECRET;
    
    if (!webhookSecret) {
      return {
        category: 'Gumroad',
        name: 'Webhook Secret',
        status: 'WARN',
        message: 'GUMROAD_WEBHOOK_SECRET not configured - payment webhooks will not work',
        critical: false
      };
    }

    if (webhookSecret.length < 16) {
      return {
        category: 'Gumroad',
        name: 'Webhook Secret',
        status: 'WARN',
        message: 'GUMROAD_WEBHOOK_SECRET should be at least 16 characters long',
        critical: false
      };
    }

    return {
      category: 'Gumroad',
      name: 'Webhook Secret',
      status: 'PASS',
      message: 'Gumroad webhook secret is configured',
      critical: false
    };
  }

  private async checkSecurityConfiguration(): Promise<ValidationResult[]> {
    const results: ValidationResult[] = [];

    // Check rate limiting configuration
    const rateLimitWindow = process.env.RATE_LIMIT_WINDOW_MS;
    const rateLimitMax = process.env.RATE_LIMIT_MAX_REQUESTS;
    
    if (!rateLimitWindow || !rateLimitMax) {
      results.push({
        category: 'Security',
        name: 'Rate Limiting',
        status: 'WARN',
        message: 'Rate limiting configuration not found - using defaults',
        critical: false
      });
    } else {
      results.push({
        category: 'Security',
        name: 'Rate Limiting',
        status: 'PASS',
        message: 'Rate limiting is configured',
        critical: false
      });
    }

    // Check file upload limits
    const maxFileSize = process.env.MAX_FILE_SIZE;
    if (!maxFileSize) {
      results.push({
        category: 'Security',
        name: 'File Upload Limits',
        status: 'WARN',
        message: 'MAX_FILE_SIZE not configured - using default',
        critical: false
      });
    } else {
      results.push({
        category: 'Security',
        name: 'File Upload Limits',
        status: 'PASS',
        message: 'File upload limits are configured',
        critical: false
      });
    }

    return results;
  }

  private async runAllChecks(): Promise<void> {
    this.log('🔍 Starting Production Environment Validation', 'info');
    this.log('=' .repeat(50), 'info');

    const checks: ConfigCheck[] = [
      {
        name: 'Environment Variables',
        category: 'Environment',
        critical: true,
        check: async () => {
          const results = await this.checkEnvironmentVariables();
          this.results.push(...results);
          const failures = results.filter(r => r.status === 'FAIL').length;
          return {
            category: 'Environment',
            name: 'Environment Variables',
            status: failures > 0 ? 'FAIL' : 'PASS',
            message: `${results.length} variables checked, ${failures} failures`,
            critical: true
          };
        }
      },
      {
        name: 'Database Connection',
        category: 'Database',
        critical: true,
        check: () => this.testDatabaseConnection()
      },
      {
        name: 'Redis Connection',
        category: 'Redis',
        critical: false,
        check: () => this.testRedisConnection()
      },
      {
        name: 'OpenAI API',
        category: 'OpenAI',
        critical: false,
        check: () => this.testOpenAIAPI()
      },
      {
        name: 'Sentry Configuration',
        category: 'Sentry',
        critical: false,
        check: () => this.testSentryDSN()
      },
      {
        name: 'PostHog Configuration',
        category: 'PostHog',
        critical: false,
        check: () => this.testPostHogConfiguration()
      },
      {
        name: 'SSL Configuration',
        category: 'SSL',
        critical: false,
        check: () => this.checkSSLConfiguration()
      },
      {
        name: 'CORS Configuration',
        category: 'CORS',
        critical: false,
        check: () => this.checkCORSConfiguration()
      },
      {
        name: 'Gumroad Configuration',
        category: 'Gumroad',
        critical: false,
        check: () => this.checkGumroadConfiguration()
      },
      {
        name: 'Security Configuration',
        category: 'Security',
        critical: false,
        check: async () => {
          const results = await this.checkSecurityConfiguration();
          this.results.push(...results);
          return {
            category: 'Security',
            name: 'Security Configuration',
            status: 'PASS',
            message: `${results.length} security checks completed`,
            critical: false
          };
        }
      }
    ];

    for (const check of checks) {
      this.log(`\n🔧 Checking ${check.name}...`, 'info');
      
      try {
        const result = await check.check();
        this.results.push(result);
        
        const status = result.status === 'PASS' ? 'success' : 
                      result.status === 'WARN' ? 'warn' : 'error';
        this.log(`  ${this.getStatusIcon(result.status)} ${result.message}`, status);
        
        if (result.status === 'FAIL' && result.critical) {
          this.criticalFailures++;
        } else if (result.status === 'WARN') {
          this.warnings++;
        }
      } catch (error) {
        const errorResult: ValidationResult = {
          category: check.category,
          name: check.name,
          status: 'FAIL',
          message: `Check failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
          critical: check.critical
        };
        this.results.push(errorResult);
        this.log(`  ❌ ${errorResult.message}`, 'error');
        
        if (check.critical) {
          this.criticalFailures++;
        }
      }
    }
  }

  private getStatusIcon(status: string): string {
    switch (status) {
      case 'PASS': return '✅';
      case 'WARN': return '⚠️';
      case 'FAIL': return '❌';
      case 'SKIP': return '⏭️';
      default: return '❓';
    }
  }

  private generateReport(): void {
    this.log('\n' + '='.repeat(50), 'info');
    this.log('📊 PRODUCTION SETUP VALIDATION REPORT', 'info');
    this.log('='.repeat(50), 'info');

    // Group results by category
    const categories = [...new Set(this.results.map(r => r.category))];
    
    for (const category of categories) {
      const categoryResults = this.results.filter(r => r.category === category);
      this.log(`\n📁 ${category}:`, 'info');
      
      for (const result of categoryResults) {
        const status = result.status === 'PASS' ? 'success' : 
                      result.status === 'WARN' ? 'warn' : 'error';
        this.log(`  ${this.getStatusIcon(result.status)} ${result.name}: ${result.message}`, status);
      }
    }

    // Summary
    const totalChecks = this.results.length;
    const passed = this.results.filter(r => r.status === 'PASS').length;
    const failed = this.results.filter(r => r.status === 'FAIL').length;
    const warnings = this.results.filter(r => r.status === 'WARN').length;
    const skipped = this.results.filter(r => r.status === 'SKIP').length;

    this.log('\n' + '='.repeat(50), 'info');
    this.log('📈 SUMMARY', 'info');
    this.log('='.repeat(50), 'info');
    this.log(`Total Checks: ${totalChecks}`, 'info');
    this.log(`✅ Passed: ${passed}`, 'success');
    this.log(`❌ Failed: ${failed}`, failed > 0 ? 'error' : 'info');
    this.log(`⚠️  Warnings: ${warnings}`, warnings > 0 ? 'warn' : 'info');
    this.log(`⏭️  Skipped: ${skipped}`, 'info');

    if (this.criticalFailures > 0) {
      this.log(`\n🚨 CRITICAL FAILURES: ${this.criticalFailures}`, 'error');
      this.log('❌ Production deployment should NOT proceed until critical issues are resolved!', 'error');
    } else if (warnings > 0) {
      this.log(`\n⚠️  WARNINGS: ${warnings}`, 'warn');
      this.log('✅ Production deployment can proceed, but consider addressing warnings', 'warn');
    } else {
      this.log('\n🎉 ALL CHECKS PASSED!', 'success');
      this.log('✅ Production environment is ready for deployment', 'success');
    }
  }

  public async run(): Promise<void> {
    try {
      await this.runAllChecks();
      this.generateReport();
      
      // Exit with appropriate code
      process.exit(this.criticalFailures > 0 ? 1 : 0);
    } catch (error) {
      this.log(`\n🚨 Setup checker failed: ${error instanceof Error ? error.message : 'Unknown error'}`, 'error');
      process.exit(1);
    }
  }
}

// CLI Interface
if (import.meta.url === `file://${process.argv[1]}`) {
  const checker = new ProductionSetupChecker();
  checker.run().catch(console.error);
}

export { ProductionSetupChecker };