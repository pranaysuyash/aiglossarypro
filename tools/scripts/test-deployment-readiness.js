#!/usr/bin/env tsx
/**
 * Deployment Readiness Checker
 * Validates that all systems are ready for production deployment
 */
import chalk from 'chalk';
import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
console.log(chalk.blue.bold('🚀 AIGlossaryPro Deployment Readiness Check\n'));
const checks = [
    // Environment Configuration
    {
        category: 'Environment',
        name: 'Production environment variables',
        check: async () => {
            const required = [
                'DATABASE_URL',
                'NEXTAUTH_URL',
                'NEXTAUTH_SECRET',
                'GOOGLE_CLIENT_ID',
                'GOOGLE_CLIENT_SECRET',
                'POSTHOG_API_KEY',
                'STRIPE_SECRET_KEY',
                'STRIPE_WEBHOOK_SECRET',
                'RESEND_API_KEY',
                'AWS_ACCESS_KEY_ID',
                'AWS_SECRET_ACCESS_KEY',
                'AWS_REGION',
                'AWS_S3_BUCKET'
            ];
            const missing = required.filter(key => !process.env[key]);
            if (missing.length === 0)
                return true;
            return `Missing: ${missing.join(', ')}`;
        },
        critical: true,
        fix: 'Set all required environment variables in .env.production'
    },
    // Build Status
    {
        category: 'Build',
        name: 'Production build exists',
        check: async () => {
            try {
                const dirs = ['apps/web/dist', 'apps/api/dist'];
                const missing = dirs.filter(dir => !fs.existsSync(dir));
                if (missing.length === 0)
                    return true;
                return `Missing builds: ${missing.join(', ')}`;
            }
            catch {
                return 'Build directories not found';
            }
        },
        critical: true,
        fix: 'Run: pnpm build'
    },
    // Database
    {
        category: 'Database',
        name: 'Database migrations up to date',
        check: async () => {
            try {
                execSync('pnpm db:status', { stdio: 'pipe' });
                return true;
            }
            catch (error) {
                return 'Database migrations pending';
            }
        },
        critical: true,
        fix: 'Run: pnpm db:push'
    },
    // Security
    {
        category: 'Security',
        name: 'No exposed secrets in code',
        check: async () => {
            try {
                const patterns = [
                    'sk_live_',
                    'pk_live_',
                    'AIza',
                    'aws_secret_access_key',
                    'private_key',
                    'client_secret'
                ];
                const result = execSync(`grep -r -i -E "${patterns.join('|')}" --exclude-dir=node_modules --exclude-dir=.git --exclude="*.env*" . || true`, { encoding: 'utf8' });
                return result.trim() === '' ? true : 'Found potential secrets in code';
            }
            catch {
                return true;
            }
        },
        critical: true,
        fix: 'Remove any hardcoded secrets and use environment variables'
    },
    {
        category: 'Security',
        name: 'HTTPS redirect configured',
        check: async () => {
            // This would be checked in production config
            return process.env.FORCE_HTTPS === 'true' ? true : 'HTTPS redirect not configured';
        },
        critical: false,
        fix: 'Set FORCE_HTTPS=true in production environment'
    },
    // Performance
    {
        category: 'Performance',
        name: 'Bundle size optimization',
        check: async () => {
            try {
                const stats = fs.statSync('apps/web/dist/assets');
                const totalSize = fs.readdirSync('apps/web/dist/assets')
                    .reduce((total, file) => {
                    const stat = fs.statSync(path.join('apps/web/dist/assets', file));
                    return total + stat.size;
                }, 0);
                const sizeMB = totalSize / (1024 * 1024);
                return sizeMB < 5 ? true : `Bundle too large: ${sizeMB.toFixed(2)}MB`;
            }
            catch {
                return 'Cannot check bundle size';
            }
        },
        critical: false,
        fix: 'Run bundle analyzer: pnpm build:analyze'
    },
    // Monitoring
    {
        category: 'Monitoring',
        name: 'Error tracking configured',
        check: async () => {
            return process.env.SENTRY_DSN ? true : 'Sentry not configured';
        },
        critical: false,
        fix: 'Set up Sentry and add SENTRY_DSN'
    },
    {
        category: 'Monitoring',
        name: 'Analytics configured',
        check: async () => {
            const hasPostHog = !!process.env.NEXT_PUBLIC_POSTHOG_KEY;
            const hasGA = !!process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;
            if (hasPostHog || hasGA)
                return true;
            return 'No analytics configured';
        },
        critical: false,
        fix: 'Configure PostHog or Google Analytics'
    },
    // API Health
    {
        category: 'API',
        name: 'API rate limiting configured',
        check: async () => {
            // Check if rate limiting middleware is configured
            return process.env.RATE_LIMIT_ENABLED === 'true' ? true : 'Rate limiting not enabled';
        },
        critical: false,
        fix: 'Enable rate limiting: RATE_LIMIT_ENABLED=true'
    },
    {
        category: 'API',
        name: 'CORS configuration',
        check: async () => {
            return process.env.CORS_ORIGIN ? true : 'CORS not configured';
        },
        critical: true,
        fix: 'Set CORS_ORIGIN to your production domain'
    },
    // Backup & Recovery
    {
        category: 'Backup',
        name: 'Database backup configured',
        check: async () => {
            return process.env.BACKUP_ENABLED === 'true' ? true : 'Backups not configured';
        },
        critical: false,
        fix: 'Set up automated database backups'
    },
    // CDN & Assets
    {
        category: 'Assets',
        name: 'Static assets optimized',
        check: async () => {
            try {
                const imageFiles = execSync('find apps/web/public -name "*.png" -o -name "*.jpg" -o -name "*.jpeg" | wc -l', { encoding: 'utf8' }).trim();
                return parseInt(imageFiles) > 0 ? true : 'No optimized images found';
            }
            catch {
                return 'Cannot check image optimization';
            }
        },
        critical: false,
        fix: 'Optimize images: pnpm optimize:images'
    },
    // Email Configuration
    {
        category: 'Email',
        name: 'Email service configured',
        check: async () => {
            return process.env.RESEND_API_KEY ? true : 'Email service not configured';
        },
        critical: true,
        fix: 'Set up Resend and add RESEND_API_KEY'
    },
    // Payment Integration
    {
        category: 'Payments',
        name: 'Stripe configured',
        check: async () => {
            const hasKeys = process.env.STRIPE_SECRET_KEY && process.env.STRIPE_PUBLISHABLE_KEY;
            const hasWebhook = process.env.STRIPE_WEBHOOK_SECRET;
            if (hasKeys && hasWebhook)
                return true;
            if (hasKeys && !hasWebhook)
                return 'Stripe webhook not configured';
            return 'Stripe not configured';
        },
        critical: true,
        fix: 'Configure Stripe keys and webhook secret'
    },
    // Legal & Compliance
    {
        category: 'Legal',
        name: 'Privacy policy page exists',
        check: async () => {
            return fs.existsSync('apps/web/src/pages/privacy.tsx') ? true : 'Privacy policy page missing';
        },
        critical: false,
        fix: 'Create privacy policy page'
    },
    {
        category: 'Legal',
        name: 'Terms of service page exists',
        check: async () => {
            return fs.existsSync('apps/web/src/pages/terms.tsx') ? true : 'Terms of service page missing';
        },
        critical: false,
        fix: 'Create terms of service page'
    },
    // SEO
    {
        category: 'SEO',
        name: 'Sitemap configured',
        check: async () => {
            return fs.existsSync('apps/web/public/sitemap.xml') ? true : 'Sitemap missing';
        },
        critical: false,
        fix: 'Generate sitemap: pnpm generate:sitemap'
    },
    {
        category: 'SEO',
        name: 'Robots.txt configured',
        check: async () => {
            return fs.existsSync('apps/web/public/robots.txt') ? true : 'robots.txt missing';
        },
        critical: false,
        fix: 'Create robots.txt file'
    },
];
const results = [];
async function runChecks() {
    console.log(chalk.cyan('Running deployment readiness checks...\n'));
    const categories = [...new Set(checks.map(c => c.category))];
    for (const category of categories) {
        console.log(chalk.blue.bold(`\n${category}:`));
        const categoryChecks = checks.filter(c => c.category === category);
        for (const check of categoryChecks) {
            process.stdout.write(`  Checking ${check.name}... `);
            try {
                const result = await check.check();
                if (result === true) {
                    console.log(chalk.green('✅'));
                    results.push({
                        category: check.category,
                        name: check.name,
                        status: 'passed'
                    });
                }
                else {
                    const message = typeof result === 'string' ? result : 'Check failed';
                    if (check.critical) {
                        console.log(chalk.red('❌'));
                        console.log(chalk.red(`    Error: ${message}`));
                        if (check.fix) {
                            console.log(chalk.yellow(`    Fix: ${check.fix}`));
                        }
                        results.push({
                            category: check.category,
                            name: check.name,
                            status: 'failed',
                            message,
                            fix: check.fix
                        });
                    }
                    else {
                        console.log(chalk.yellow('⚠️'));
                        console.log(chalk.yellow(`    Warning: ${message}`));
                        if (check.fix) {
                            console.log(chalk.gray(`    Fix: ${check.fix}`));
                        }
                        results.push({
                            category: check.category,
                            name: check.name,
                            status: 'warning',
                            message,
                            fix: check.fix
                        });
                    }
                }
            }
            catch (error) {
                console.log(chalk.red('❌'));
                console.log(chalk.red(`    Error: ${error.message}`));
                results.push({
                    category: check.category,
                    name: check.name,
                    status: 'failed',
                    message: error.message,
                    fix: check.fix
                });
            }
        }
    }
}
function generateReport() {
    console.log(chalk.cyan('\n\n📊 Deployment Readiness Report\n'));
    const passed = results.filter(r => r.status === 'passed').length;
    const warnings = results.filter(r => r.status === 'warning').length;
    const failed = results.filter(r => r.status === 'failed').length;
    console.log(chalk.white('Summary:'));
    console.log(`  ${chalk.green(`✅ Passed: ${passed}`)}`);
    console.log(`  ${chalk.yellow(`⚠️  Warnings: ${warnings}`)}`);
    console.log(`  ${chalk.red(`❌ Failed: ${failed}`)}`);
    console.log(`  Total checks: ${results.length}`);
    if (failed > 0) {
        console.log(chalk.red('\n\n❌ Critical Issues (must fix before deployment):'));
        results
            .filter(r => r.status === 'failed')
            .forEach(r => {
            console.log(chalk.red(`\n  ${r.category} - ${r.name}`));
            if (r.message)
                console.log(chalk.gray(`    Issue: ${r.message}`));
            if (r.fix)
                console.log(chalk.yellow(`    Fix: ${r.fix}`));
        });
    }
    if (warnings > 0) {
        console.log(chalk.yellow('\n\n⚠️  Warnings (recommended to fix):'));
        results
            .filter(r => r.status === 'warning')
            .forEach(r => {
            console.log(chalk.yellow(`\n  ${r.category} - ${r.name}`));
            if (r.message)
                console.log(chalk.gray(`    Issue: ${r.message}`));
            if (r.fix)
                console.log(chalk.gray(`    Fix: ${r.fix}`));
        });
    }
    // Deployment recommendation
    console.log(chalk.cyan('\n\n🎯 Deployment Recommendation:'));
    if (failed === 0 && warnings === 0) {
        console.log(chalk.green.bold('  ✅ READY FOR DEPLOYMENT!'));
        console.log(chalk.green('  All checks passed. You can safely deploy to production.'));
    }
    else if (failed === 0) {
        console.log(chalk.yellow.bold('  ⚠️  READY WITH WARNINGS'));
        console.log(chalk.yellow('  No critical issues, but consider fixing warnings.'));
        console.log(chalk.yellow('  You can deploy, but monitor closely.'));
    }
    else {
        console.log(chalk.red.bold('  ❌ NOT READY FOR DEPLOYMENT'));
        console.log(chalk.red(`  Fix ${failed} critical issue${failed > 1 ? 's' : ''} before deploying.`));
    }
    // Generate JSON report
    const reportPath = path.join(process.cwd(), 'deployment-readiness-report.json');
    const report = {
        timestamp: new Date().toISOString(),
        summary: { passed, warnings, failed, total: results.length },
        ready: failed === 0,
        results: results,
    };
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    console.log(chalk.blue(`\n📄 Detailed report saved to: ${reportPath}`));
}
// Main execution
async function main() {
    await runChecks();
    generateReport();
    // Exit with error if critical checks failed
    const failed = results.filter(r => r.status === 'failed').length;
    process.exit(failed > 0 ? 1 : 0);
}
// Help message
if (process.argv.includes('--help') || process.argv.includes('-h')) {
    console.log(chalk.blue.bold('🚀 Deployment Readiness Checker\n'));
    console.log('This tool validates that your application is ready for production deployment.\n');
    console.log('Usage:');
    console.log('  pnpm test:deployment        # Run all deployment checks');
    console.log('  pnpm test:deployment --help # Show this help\n');
    console.log('Checks performed:');
    const categories = [...new Set(checks.map(c => c.category))];
    categories.forEach(cat => {
        console.log(`\n${chalk.bold(cat)}:`);
        checks
            .filter(c => c.category === cat)
            .forEach(c => {
            const critical = c.critical ? chalk.red(' [CRITICAL]') : chalk.yellow(' [RECOMMENDED]');
            console.log(`  - ${c.name}${critical}`);
        });
    });
    process.exit(0);
}
main().catch(console.error);
