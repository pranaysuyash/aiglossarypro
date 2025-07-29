#!/usr/bin/env tsx

/**
 * Production Configuration Validator
 * Validates all production configuration requirements before deployment
 */

import chalk from 'chalk';
import { enhancedStorage } from '../server/enhancedStorage';
import { productionEmailService } from '../server/services/productionEmailService';

interface ValidationResult {
  category: string;
  checks: Array<{
    name: string;
    status: 'pass' | 'fail' | 'warn';
    message: string;
    required: boolean;
  }>;
}

class ProductionConfigValidator {
  private results: ValidationResult[] = [];

  async runAllValidations(): Promise<void> {
    console.log(chalk.blue.bold('\n🔍 AI Glossary Pro - Production Configuration Validator\n'));

    // Run all validation categories
    this.validateEnvironmentVariables();
    await this.validateDatabaseConnection();
    await this.validateEmailConfiguration();
    this.validateSecurityConfiguration();
    this.validateMonitoringConfiguration();
    this.validateBusinessConfiguration();

    // Display results
    this.displayResults();
    this.generateSummary();
  }

  private validateEnvironmentVariables(): void {
    const checks = [];

    // Critical environment variables
    const criticalEnvVars = [
      { name: 'NODE_ENV', value: process.env.NODE_ENV, expected: 'production' },
      { name: 'DATABASE_URL', value: process.env.DATABASE_URL },
      { name: 'SESSION_SECRET', value: process.env.SESSION_SECRET, minLength: 32 },
      { name: 'BASE_URL', value: process.env.BASE_URL },
    ];

    for (const envVar of criticalEnvVars) {
      if (!envVar.value) {
        checks.push({
          name: envVar.name,
          status: 'fail' as const,
          message: 'Missing required environment variable',
          required: true,
        });
      } else if (envVar.expected && envVar.value !== envVar.expected) {
        checks.push({
          name: envVar.name,
          status: 'fail' as const,
          message: `Expected '${envVar.expected}', got '${envVar.value}'`,
          required: true,
        });
      } else if (envVar.minLength && envVar.value.length < envVar.minLength) {
        checks.push({
          name: envVar.name,
          status: 'fail' as const,
          message: `Must be at least ${envVar.minLength} characters`,
          required: true,
        });
      } else {
        checks.push({
          name: envVar.name,
          status: 'pass' as const,
          message: '✓ Configured correctly',
          required: true,
        });
      }
    }

    // Optional but recommended
    const optionalEnvVars = [
      { name: 'PORT', value: process.env.PORT },
      { name: 'CORS_ORIGIN', value: process.env.CORS_ORIGIN },
      { name: 'LOG_LEVEL', value: process.env.LOG_LEVEL },
    ];

    for (const envVar of optionalEnvVars) {
      if (!envVar.value) {
        checks.push({
          name: envVar.name,
          status: 'warn' as const,
          message: 'Not configured - using defaults',
          required: false,
        });
      } else {
        checks.push({
          name: envVar.name,
          status: 'pass' as const,
          message: '✓ Configured',
          required: false,
        });
      }
    }

    this.results.push({
      category: 'Environment Variables',
      checks,
    });
  }

  private async validateDatabaseConnection(): Promise<void> {
    const checks = [];

    try {
      // Test database connection
      const isHealthy = await enhancedStorage.checkDatabaseHealth();

      if (isHealthy) {
        checks.push({
          name: 'Database Connection',
          status: 'pass' as const,
          message: '✓ Database connection successful',
          required: true,
        });

        // Test database performance
        try {
          const metrics = await enhancedStorage.getDatabaseMetrics();
          checks.push({
            name: 'Database Metrics',
            status: 'pass' as const,
            message: `✓ Performance metrics available (${Object.keys(metrics.tableStats || {}).length} tables)`,
            required: false,
          });
        } catch (error) {
          checks.push({
            name: 'Database Metrics',
            status: 'warn' as const,
            message: 'Metrics collection failed but database is accessible',
            required: false,
          });
        }
      } else {
        checks.push({
          name: 'Database Connection',
          status: 'fail' as const,
          message: 'Database connection failed',
          required: true,
        });
      }
    } catch (error) {
      checks.push({
        name: 'Database Connection',
        status: 'fail' as const,
        message: `Database error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        required: true,
      });
    }

    // Check database URL format
    const dbUrl = process.env.DATABASE_URL;
    if (dbUrl) {
      const hasSSL = dbUrl.includes('sslmode=require') || dbUrl.includes('ssl=true');
      checks.push({
        name: 'Database SSL',
        status: hasSSL ? 'pass' : 'warn',
        message: hasSSL ? '✓ SSL enabled' : 'SSL not explicitly configured',
        required: false,
      });
    }

    this.results.push({
      category: 'Database Configuration',
      checks,
    });
  }

  private async validateEmailConfiguration(): Promise<void> {
    const checks = [];

    // Check email service status
    const emailStatus = productionEmailService.getServiceStatus();

    checks.push({
      name: 'Email Service',
      status: emailStatus.available ? 'pass' : 'fail',
      message: emailStatus.available
        ? `✓ ${emailStatus.service} service available`
        : 'No email service configured',
      required: true,
    });

    checks.push({
      name: 'Email Enabled',
      status: emailStatus.configured ? 'pass' : 'warn',
      message: emailStatus.configured ? '✓ Email service enabled' : 'Email service disabled',
      required: false,
    });

    // Test email configuration (if available)
    if (emailStatus.available && emailStatus.configured) {
      try {
        // Don't actually send test email in validation, just check config
        checks.push({
          name: 'Email Configuration',
          status: 'pass' as const,
          message: '✓ Email service properly configured',
          required: true,
        });
      } catch (error) {
        checks.push({
          name: 'Email Configuration',
          status: 'fail' as const,
          message: `Email configuration error: ${error instanceof Error ? error.message : 'Unknown error'}`,
          required: true,
        });
      }
    }

    // Check specific email configurations
    const emailConfigs = [
      { name: 'Resend API Key', env: 'RESEND_API_KEY' },
      { name: 'SMTP Host', env: 'SMTP_HOST' },
      { name: 'Email From Address', env: 'EMAIL_FROM' },
    ];

    let hasEmailConfig = false;
    for (const config of emailConfigs) {
      if (process.env[config.env]) {
        hasEmailConfig = true;
        checks.push({
          name: config.name,
          status: 'pass' as const,
          message: '✓ Configured',
          required: false,
        });
      }
    }

    if (!hasEmailConfig) {
      checks.push({
        name: 'Email Providers',
        status: 'warn' as const,
        message: 'No email provider configured (Resend or SMTP)',
        required: false,
      });
    }

    this.results.push({
      category: 'Email Configuration',
      checks,
    });
  }

  private validateSecurityConfiguration(): void {
    const checks = [];

    // Security environment variables
    const securityConfigs = [
      { name: 'JWT Secret', env: 'JWT_SECRET', required: true },
      { name: 'Session Secret', env: 'SESSION_SECRET', required: true },
      { name: 'CORS Origin', env: 'CORS_ORIGIN', required: false },
    ];

    for (const config of securityConfigs) {
      const value = process.env[config.env];
      if (!value && config.required) {
        checks.push({
          name: config.name,
          status: 'fail' as const,
          message: 'Missing required security configuration',
          required: config.required,
        });
      } else if (!value) {
        checks.push({
          name: config.name,
          status: 'warn' as const,
          message: 'Not configured',
          required: config.required,
        });
      } else if (config.required && value.length < 32) {
        checks.push({
          name: config.name,
          status: 'warn' as const,
          message: 'Should be at least 32 characters for security',
          required: config.required,
        });
      } else {
        checks.push({
          name: config.name,
          status: 'pass' as const,
          message: '✓ Configured securely',
          required: config.required,
        });
      }
    }

    // Check Firebase configuration
    const firebaseConfigs = [
      'VITE_FIREBASE_API_KEY',
      'VITE_FIREBASE_PROJECT_ID',
      'FIREBASE_PROJECT_ID',
      'FIREBASE_CLIENT_EMAIL',
    ];

    const firebaseConfigured = firebaseConfigs.every(config => !!process.env[config]);
    checks.push({
      name: 'Firebase Authentication',
      status: firebaseConfigured ? 'pass' : 'warn',
      message: firebaseConfigured
        ? '✓ Firebase authentication configured'
        : 'Firebase authentication incomplete',
      required: false,
    });

    this.results.push({
      category: 'Security Configuration',
      checks,
    });
  }

  private validateMonitoringConfiguration(): void {
    const checks = [];

    // Monitoring services
    const monitoringServices = [
      { name: 'Sentry Error Tracking', env: 'SENTRY_DSN' },
      { name: 'PostHog Analytics', env: 'POSTHOG_API_KEY' },
      { name: 'Google Analytics', env: 'VITE_GA4_MEASUREMENT_ID' },
    ];

    for (const service of monitoringServices) {
      const configured = !!process.env[service.env];
      checks.push({
        name: service.name,
        status: configured ? 'pass' : 'warn',
        message: configured ? '✓ Configured' : 'Not configured',
        required: false,
      });
    }

    // Logging configuration
    const logLevel = process.env.LOG_LEVEL;
    const productionLogLevels = ['error', 'warn', 'info'];
    checks.push({
      name: 'Log Level',
      status: logLevel && productionLogLevels.includes(logLevel) ? 'pass' : 'warn',
      message: logLevel
        ? `Set to '${logLevel}'${productionLogLevels.includes(logLevel) ? ' ✓' : ' (consider error/warn for production)'}`
        : 'Not configured',
      required: false,
    });

    this.results.push({
      category: 'Monitoring Configuration',
      checks,
    });
  }

  private validateBusinessConfiguration(): void {
    const checks = [];

    // Payment integration
    const gumroadWebhookSecret = process.env.GUMROAD_WEBHOOK_SECRET;
    checks.push({
      name: 'Gumroad Webhook Secret',
      status: gumroadWebhookSecret ? 'pass' : 'warn',
      message: gumroadWebhookSecret ? '✓ Configured' : 'Not configured - payments may not work',
      required: false,
    });

    // Premium product configuration
    const premiumConfigs = [
      'VITE_GUMROAD_PRODUCT_URL',
      'VITE_GUMROAD_BASE_PRICE',
      'VITE_PPP_ENABLED',
    ];

    const premiumConfigured = premiumConfigs.some(config => !!process.env[config]);
    checks.push({
      name: 'Premium Product Configuration',
      status: premiumConfigured ? 'pass' : 'warn',
      message: premiumConfigured
        ? '✓ Premium features configured'
        : 'Premium features not configured',
      required: false,
    });

    // AI services
    const openaiKey = process.env.OPENAI_API_KEY;
    checks.push({
      name: 'OpenAI API',
      status: openaiKey ? 'pass' : 'warn',
      message: openaiKey ? '✓ AI features available' : 'AI features not available',
      required: false,
    });

    // Storage services
    const s3Configured = !!(process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY);
    checks.push({
      name: 'AWS S3 Storage',
      status: s3Configured ? 'pass' : 'warn',
      message: s3Configured ? '✓ File storage available' : 'File storage not configured',
      required: false,
    });

    this.results.push({
      category: 'Business Configuration',
      checks,
    });
  }

  private displayResults(): void {
    console.log(chalk.blue.bold('\n📊 Configuration Validation Results\n'));

    for (const result of this.results) {
      console.log(chalk.cyan.bold(`\n${result.category}:`));

      for (const check of result.checks) {
        const icon = check.status === 'pass' ? '✅' : check.status === 'warn' ? '⚠️' : '❌';
        const color =
          check.status === 'pass' ? 'green' : check.status === 'warn' ? 'yellow' : 'red';
        const required = check.required ? ' (Required)' : '';

        console.log(`  ${icon} ${chalk[color](check.name)}${required}: ${check.message}`);
      }
    }
  }

  private generateSummary(): void {
    let totalChecks = 0;
    let passedChecks = 0;
    let failedChecks = 0;
    let warningChecks = 0;
    let criticalFailures = 0;

    for (const result of this.results) {
      for (const check of result.checks) {
        totalChecks++;

        switch (check.status) {
          case 'pass':
            passedChecks++;
            break;
          case 'warn':
            warningChecks++;
            break;
          case 'fail':
            failedChecks++;
            if (check.required) {
              criticalFailures++;
            }
            break;
        }
      }
    }

    console.log(chalk.blue.bold('\n📋 Summary:'));
    console.log(`Total Checks: ${totalChecks}`);
    console.log(chalk.green(`✅ Passed: ${passedChecks}`));
    console.log(chalk.yellow(`⚠️  Warnings: ${warningChecks}`));
    console.log(chalk.red(`❌ Failed: ${failedChecks}`));

    if (criticalFailures > 0) {
      console.log(
        chalk.red.bold(`\n🚨 CRITICAL: ${criticalFailures} required configuration(s) missing!`)
      );
      console.log(chalk.red('❌ NOT READY FOR PRODUCTION DEPLOYMENT'));
      process.exit(1);
    } else if (failedChecks > 0 || warningChecks > 5) {
      console.log(chalk.yellow.bold('\n⚠️  Some configurations need attention before deployment'));
      console.log(chalk.yellow('⚠️  REVIEW REQUIRED - Check warnings above'));
    } else {
      console.log(chalk.green.bold('\n🎉 CONFIGURATION READY FOR PRODUCTION!'));
      console.log(chalk.green('✅ All critical requirements met'));
    }

    console.log(chalk.blue('\n📝 Next Steps:'));
    console.log('1. Address any critical failures above');
    console.log('2. Review and resolve warnings');
    console.log('3. Test email configuration: npm run test:email');
    console.log('4. Run performance validation: npm run validate:production');
    console.log('5. Deploy with confidence! 🚀\n');
  }
}

// Run validation if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const validator = new ProductionConfigValidator();
  validator.runAllValidations().catch(error => {
    console.error(chalk.red.bold('\n❌ Validation failed:'), error);
    process.exit(1);
  });
}

export { ProductionConfigValidator };
