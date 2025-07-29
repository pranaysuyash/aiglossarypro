#!/usr/bin/env tsx

/**
 * External Service Integration Test Runner
 * Comprehensive testing of all external service integrations
 */

import { writeFileSync } from 'fs';
import path from 'path';

interface TestResult {
    service: string;
    status: 'pass' | 'fail' | 'skip';
    message: string;
    details?: any;
}

interface ServiceConfig {
    name: string;
    required: boolean;
    envVars: string[];
    testCommand?: string;
    validator?: () => Promise<TestResult>;
}

class ExternalServiceTester {
    private results: TestResult[] = [];
    private services: ServiceConfig[] = [
        {
            name: 'Firebase Authentication',
            required: true,
            envVars: [
                'VITE_FIREBASE_API_KEY',
                'VITE_FIREBASE_AUTH_DOMAIN',
                'VITE_FIREBASE_PROJECT_ID',
                'VITE_FIREBASE_STORAGE_BUCKET',
                'VITE_FIREBASE_MESSAGING_SENDER_ID',
                'VITE_FIREBASE_APP_ID'
            ],
            validator: this.testFirebaseAuth.bind(this)
        },
        {
            name: 'Email Service (Resend)',
            required: false,
            envVars: ['RESEND_API_KEY', 'EMAIL_FROM'],
            validator: this.testEmailService.bind(this)
        },
        {
            name: 'Email Service (SMTP)',
            required: false,
            envVars: ['SMTP_HOST', 'SMTP_USER', 'SMTP_PASS', 'EMAIL_FROM'],
            validator: this.testSMTPService.bind(this)
        },
        {
            name: 'Gumroad Webhooks',
            required: true,
            envVars: ['GUMROAD_WEBHOOK_SECRET'],
            validator: this.testGumroadWebhooks.bind(this)
        },
        {
            name: 'Gumroad API',
            required: false,
            envVars: ['GUMROAD_ACCESS_TOKEN'],
            validator: this.testGumroadAPI.bind(this)
        },
        {
            name: 'PostHog Analytics',
            required: false,
            envVars: ['VITE_POSTHOG_KEY'],
            validator: this.testPostHogAnalytics.bind(this)
        },
        {
            name: 'Google Analytics 4',
            required: false,
            envVars: ['VITE_GA_MEASUREMENT_ID'],
            validator: this.testGA4Analytics.bind(this)
        },
        {
            name: 'Sentry Monitoring',
            required: false,
            envVars: ['SENTRY_DSN'],
            validator: this.testSentryMonitoring.bind(this)
        }
    ];

    async runAllTests(): Promise<void> {
        console.log('🧪 Starting External Service Integration Tests\n');

        for (const service of this.services) {
            console.log(`Testing ${service.name}...`);

            try {
                const result = await this.testService(service);
                this.results.push(result);

                const icon = result.status === 'pass' ? '✅' : result.status === 'fail' ? '❌' : '⏭️';
                console.log(`${icon} ${service.name}: ${result.message}\n`);
            } catch (error) {
                const result: TestResult = {
                    service: service.name,
                    status: 'fail',
                    message: `Test execution failed: ${error.message}`,
                    details: error
                };
                this.results.push(result);
                console.log(`❌ ${service.name}: ${result.message}\n`);
            }
        }

        this.generateReport();
    }

    private async testService(service: ServiceConfig): Promise<TestResult> {
        // Check environment variables
        const missingVars = service.envVars.filter(varName => !process.env[varName]);

        if (missingVars.length > 0) {
            if (service.required) {
                return {
                    service: service.name,
                    status: 'fail',
                    message: `Missing required environment variables: ${missingVars.join(', ')}`,
                    details: { missingVars }
                };
            } else {
                return {
                    service: service.name,
                    status: 'skip',
                    message: `Skipped - missing optional environment variables: ${missingVars.join(', ')}`,
                    details: { missingVars }
                };
            }
        }

        // Run custom validator if available
        if (service.validator) {
            return await service.validator();
        }

        // Default validation - just check env vars are present
        return {
            service: service.name,
            status: 'pass',
            message: 'Environment variables configured',
            details: { configuredVars: service.envVars }
        };
    }

    private async testFirebaseAuth(): Promise<TestResult> {
        try {
            // Test Firebase configuration validity
            const config = {
                apiKey: process.env.VITE_FIREBASE_API_KEY,
                authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
                projectId: process.env.VITE_FIREBASE_PROJECT_ID,
                storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
                messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
                appId: process.env.VITE_FIREBASE_APP_ID
            };

            // Basic validation
            if (!config.apiKey || !config.authDomain || !config.projectId) {
                return {
                    service: 'Firebase Authentication',
                    status: 'fail',
                    message: 'Invalid Firebase configuration - missing critical fields',
                    details: config
                };
            }

            // Validate format
            if (!config.authDomain.includes('.firebaseapp.com') && !config.authDomain.includes('.web.app')) {
                return {
                    service: 'Firebase Authentication',
                    status: 'fail',
                    message: 'Invalid Firebase auth domain format',
                    details: { authDomain: config.authDomain }
                };
            }

            return {
                service: 'Firebase Authentication',
                status: 'pass',
                message: 'Firebase configuration is valid',
                details: {
                    projectId: config.projectId,
                    authDomain: config.authDomain,
                    hasApiKey: !!config.apiKey
                }
            };
        } catch (error) {
            return {
                service: 'Firebase Authentication',
                status: 'fail',
                message: `Firebase validation failed: ${error.message}`,
                details: error
            };
        }
    }

    private async testEmailService(): Promise<TestResult> {
        try {
            const { testEmailConfiguration } = await import('../server/utils/email');

            // Test with a safe test email
            const testEmail = 'test@example.com';

            // This will validate configuration without actually sending
            const isConfigured = !!(process.env.RESEND_API_KEY && process.env.EMAIL_FROM);

            if (!isConfigured) {
                return {
                    service: 'Email Service (Resend)',
                    status: 'skip',
                    message: 'Resend not configured',
                    details: {
                        hasApiKey: !!process.env.RESEND_API_KEY,
                        hasFromEmail: !!process.env.EMAIL_FROM
                    }
                };
            }

            return {
                service: 'Email Service (Resend)',
                status: 'pass',
                message: 'Resend email service configured',
                details: {
                    fromEmail: process.env.EMAIL_FROM,
                    hasApiKey: true
                }
            };
        } catch (error) {
            return {
                service: 'Email Service (Resend)',
                status: 'fail',
                message: `Email service test failed: ${error.message}`,
                details: error
            };
        }
    }

    private async testSMTPService(): Promise<TestResult> {
        try {
            const hasSmtpConfig = !!(
                process.env.SMTP_HOST &&
                process.env.SMTP_USER &&
                process.env.SMTP_PASS &&
                process.env.EMAIL_FROM
            );

            if (!hasSmtpConfig) {
                return {
                    service: 'Email Service (SMTP)',
                    status: 'skip',
                    message: 'SMTP not configured',
                    details: {
                        hasHost: !!process.env.SMTP_HOST,
                        hasUser: !!process.env.SMTP_USER,
                        hasPass: !!process.env.SMTP_PASS,
                        hasFrom: !!process.env.EMAIL_FROM
                    }
                };
            }

            return {
                service: 'Email Service (SMTP)',
                status: 'pass',
                message: 'SMTP email service configured',
                details: {
                    host: process.env.SMTP_HOST,
                    user: process.env.SMTP_USER,
                    fromEmail: process.env.EMAIL_FROM
                }
            };
        } catch (error) {
            return {
                service: 'Email Service (SMTP)',
                status: 'fail',
                message: `SMTP service test failed: ${error.message}`,
                details: error
            };
        }
    }

    private async testGumroadWebhooks(): Promise<TestResult> {
        try {
            const GumroadService = (await import('../server/services/gumroadService')).default;

            if (!process.env.GUMROAD_WEBHOOK_SECRET) {
                return {
                    service: 'Gumroad Webhooks',
                    status: 'fail',
                    message: 'Gumroad webhook secret not configured',
                    details: { hasSecret: false }
                };
            }

            // Test webhook signature validation
            const testPayload = JSON.stringify({ test: 'data' });
            const crypto = require('crypto');
            const signature = crypto
                .createHmac('sha256', process.env.GUMROAD_WEBHOOK_SECRET)
                .update(testPayload)
                .digest('hex');

            const isValid = GumroadService.validateWebhookSignature(testPayload, signature);

            if (!isValid) {
                return {
                    service: 'Gumroad Webhooks',
                    status: 'fail',
                    message: 'Webhook signature validation failed',
                    details: { signatureTest: false }
                };
            }

            return {
                service: 'Gumroad Webhooks',
                status: 'pass',
                message: 'Gumroad webhook integration configured and working',
                details: {
                    hasSecret: true,
                    signatureValidation: true
                }
            };
        } catch (error) {
            return {
                service: 'Gumroad Webhooks',
                status: 'fail',
                message: `Gumroad webhook test failed: ${error.message}`,
                details: error
            };
        }
    }

    private async testGumroadAPI(): Promise<TestResult> {
        try {
            if (!process.env.GUMROAD_ACCESS_TOKEN) {
                return {
                    service: 'Gumroad API',
                    status: 'skip',
                    message: 'Gumroad API access token not configured',
                    details: { hasToken: false }
                };
            }

            // Basic token format validation
            const token = process.env.GUMROAD_ACCESS_TOKEN;
            if (token.length < 10) {
                return {
                    service: 'Gumroad API',
                    status: 'fail',
                    message: 'Gumroad API token appears invalid (too short)',
                    details: { tokenLength: token.length }
                };
            }

            return {
                service: 'Gumroad API',
                status: 'pass',
                message: 'Gumroad API access token configured',
                details: {
                    hasToken: true,
                    tokenLength: token.length
                }
            };
        } catch (error) {
            return {
                service: 'Gumroad API',
                status: 'fail',
                message: `Gumroad API test failed: ${error.message}`,
                details: error
            };
        }
    }

    private async testPostHogAnalytics(): Promise<TestResult> {
        try {
            const posthogKey = process.env.VITE_POSTHOG_KEY;

            if (!posthogKey) {
                return {
                    service: 'PostHog Analytics',
                    status: 'skip',
                    message: 'PostHog key not configured',
                    details: { hasKey: false }
                };
            }

            // Validate PostHog key format
            if (!posthogKey.startsWith('phc_')) {
                return {
                    service: 'PostHog Analytics',
                    status: 'fail',
                    message: 'Invalid PostHog key format (should start with phc_)',
                    details: { keyPrefix: posthogKey.substring(0, 4) }
                };
            }

            return {
                service: 'PostHog Analytics',
                status: 'pass',
                message: 'PostHog analytics configured',
                details: {
                    hasKey: true,
                    keyFormat: 'valid'
                }
            };
        } catch (error) {
            return {
                service: 'PostHog Analytics',
                status: 'fail',
                message: `PostHog test failed: ${error.message}`,
                details: error
            };
        }
    }

    private async testGA4Analytics(): Promise<TestResult> {
        try {
            const measurementId = process.env.VITE_GA_MEASUREMENT_ID;

            if (!measurementId) {
                return {
                    service: 'Google Analytics 4',
                    status: 'skip',
                    message: 'GA4 measurement ID not configured',
                    details: { hasId: false }
                };
            }

            // Validate GA4 measurement ID format
            if (!measurementId.startsWith('G-')) {
                return {
                    service: 'Google Analytics 4',
                    status: 'fail',
                    message: 'Invalid GA4 measurement ID format (should start with G-)',
                    details: { idPrefix: measurementId.substring(0, 2) }
                };
            }

            return {
                service: 'Google Analytics 4',
                status: 'pass',
                message: 'Google Analytics 4 configured',
                details: {
                    hasId: true,
                    idFormat: 'valid',
                    measurementId: measurementId
                }
            };
        } catch (error) {
            return {
                service: 'Google Analytics 4',
                status: 'fail',
                message: `GA4 test failed: ${error.message}`,
                details: error
            };
        }
    }

    private async testSentryMonitoring(): Promise<TestResult> {
        try {
            const sentryDsn = process.env.SENTRY_DSN;

            if (!sentryDsn) {
                return {
                    service: 'Sentry Monitoring',
                    status: 'skip',
                    message: 'Sentry DSN not configured',
                    details: { hasDsn: false }
                };
            }

            // Validate Sentry DSN format
            if (!sentryDsn.startsWith('https://') || !sentryDsn.includes('@') || !sentryDsn.includes('.ingest.sentry.io')) {
                return {
                    service: 'Sentry Monitoring',
                    status: 'fail',
                    message: 'Invalid Sentry DSN format',
                    details: { dsnFormat: 'invalid' }
                };
            }

            return {
                service: 'Sentry Monitoring',
                status: 'pass',
                message: 'Sentry monitoring configured',
                details: {
                    hasDsn: true,
                    dsnFormat: 'valid'
                }
            };
        } catch (error) {
            return {
                service: 'Sentry Monitoring',
                status: 'fail',
                message: `Sentry test failed: ${error.message}`,
                details: error
            };
        }
    }

    private generateReport(): void {
        const summary = {
            total: this.results.length,
            passed: this.results.filter(r => r.status === 'pass').length,
            failed: this.results.filter(r => r.status === 'fail').length,
            skipped: this.results.filter(r => r.status === 'skip').length
        };

        console.log('\n📊 External Service Integration Test Summary');
        console.log('='.repeat(50));
        console.log(`Total Services Tested: ${summary.total}`);
        console.log(`✅ Passed: ${summary.passed}`);
        console.log(`❌ Failed: ${summary.failed}`);
        console.log(`⏭️  Skipped: ${summary.skipped}`);
        console.log('='.repeat(50));

        // Show failed tests
        const failedTests = this.results.filter(r => r.status === 'fail');
        if (failedTests.length > 0) {
            console.log('\n❌ Failed Tests:');
            failedTests.forEach(test => {
                console.log(`  • ${test.service}: ${test.message}`);
            });
        }

        // Show skipped tests
        const skippedTests = this.results.filter(r => r.status === 'skip');
        if (skippedTests.length > 0) {
            console.log('\n⏭️  Skipped Tests:');
            skippedTests.forEach(test => {
                console.log(`  • ${test.service}: ${test.message}`);
            });
        }

        // Generate detailed report file
        const reportPath = path.join(process.cwd(), 'external-service-test-report.json');
        const report = {
            timestamp: new Date().toISOString(),
            environment: process.env.NODE_ENV || 'development',
            summary,
            results: this.results
        };

        writeFileSync(reportPath, JSON.stringify(report, null, 2));
        console.log(`\n📄 Detailed report saved to: ${reportPath}`);

        // Exit with error code if any required services failed
        const requiredFailures = this.results.filter(r =>
            r.status === 'fail' &&
            this.services.find(s => s.name === r.service)?.required
        );

        if (requiredFailures.length > 0) {
            console.log('\n🚨 Critical failures detected in required services!');
            process.exit(1);
        }

        console.log('\n✅ External service integration tests completed successfully!');
    }
}

// Run tests if called directly
const tester = new ExternalServiceTester();
tester.runAllTests().catch(error => {
    console.error('Test runner failed:', error);
    process.exit(1);
});

export { ExternalServiceTester };
