#!/usr/bin/env tsx
/**
 * Test Email Configuration
 * This script tests the email sending functionality to verify configuration
 */
import chalk from 'chalk';
import 'dotenv/config';
import { productionEmailService } from '../server/services/productionEmailService';
console.log(chalk.blue.bold('🧪 Testing AI Glossary Pro Email Configuration\n'));
const TEST_EMAIL = process.env.TEST_EMAIL || process.argv[2] || 'test@example.com';
async function testEmailConfiguration() {
    try {
        // Check service status first
        const status = productionEmailService.getServiceStatus();
        console.log(chalk.cyan('📊 Email Service Status:'));
        console.log(`   Available: ${status.available ? chalk.green('✓') : chalk.red('✗')}`);
        console.log(`   Service: ${status.service}`);
        console.log(`   Enabled: ${status.configured ? chalk.green('✓') : chalk.yellow('⚠️')}`);
        if (!status.available) {
            console.log(chalk.red('\n❌ No email service configured!'));
            console.log(chalk.yellow('💡 Configure either:'));
            console.log(chalk.yellow('   • RESEND_API_KEY for Resend service (recommended)'));
            console.log(chalk.yellow('   • SMTP settings for traditional email'));
            process.exit(1);
        }
        if (!status.configured) {
            console.log(chalk.yellow('\n⚠️  Email service available but not enabled'));
            console.log(chalk.yellow('   Set EMAIL_ENABLED=true to enable email functionality'));
            process.exit(0);
        }
        // Test email sending
        console.log(chalk.cyan(`\n📧 Sending test email to: ${TEST_EMAIL}`));
        const success = await productionEmailService.testConfiguration(TEST_EMAIL);
        if (success) {
            console.log(chalk.green.bold('\n✅ Email test successful!'));
            console.log(chalk.green('📬 Check your inbox for the test email'));
            console.log(chalk.blue('\n🎉 Your email configuration is working correctly!'));
        }
        else {
            console.log(chalk.red.bold('\n❌ Email test failed'));
            console.log(chalk.yellow('🔧 Check your email configuration and try again'));
            process.exit(1);
        }
    }
    catch (error) {
        console.error(chalk.red.bold('\n❌ Email test error:'), error);
        console.log(chalk.yellow('\n🔧 Troubleshooting tips:'));
        console.log(chalk.yellow('   • Verify your API keys are correct'));
        console.log(chalk.yellow('   • Check your internet connection'));
        console.log(chalk.yellow('   • Ensure email service is properly configured'));
        process.exit(1);
    }
}
async function testAllEmailTypes() {
    console.log(chalk.cyan('\n📧 Testing different email types...\n'));
    try {
        // Test welcome email
        console.log(chalk.blue('Testing welcome email...'));
        const welcomeSuccess = await productionEmailService.sendWelcomeEmail(TEST_EMAIL, 'Test User');
        console.log(welcomeSuccess ? chalk.green('✓ Welcome email sent') : chalk.red('✗ Welcome email failed'));
        // Test premium welcome email
        console.log(chalk.blue('Testing premium welcome email...'));
        const premiumSuccess = await productionEmailService.sendPremiumWelcomeEmail(TEST_EMAIL, {
            userName: 'Test User',
            orderNumber: 'TEST-12345',
        });
        console.log(premiumSuccess
            ? chalk.green('✓ Premium welcome email sent')
            : chalk.red('✗ Premium welcome email failed'));
        // Test password reset email
        console.log(chalk.blue('Testing password reset email...'));
        const resetSuccess = await productionEmailService.sendPasswordResetEmail(TEST_EMAIL, 'test-token-123');
        console.log(resetSuccess
            ? chalk.green('✓ Password reset email sent')
            : chalk.red('✗ Password reset email failed'));
        const allSuccess = welcomeSuccess && premiumSuccess && resetSuccess;
        if (allSuccess) {
            console.log(chalk.green.bold('\n🎉 All email types working correctly!'));
        }
        else {
            console.log(chalk.yellow.bold('\n⚠️  Some email types failed - check logs above'));
        }
        return allSuccess;
    }
    catch (error) {
        console.error(chalk.red('\n❌ Email type testing failed:'), error);
        return false;
    }
}
// Main execution
async function main() {
    const args = process.argv.slice(2);
    const testAllTypes = args.includes('--all') || args.includes('-a');
    if (testAllTypes) {
        console.log(chalk.blue('🔄 Running comprehensive email tests...\n'));
        // Test configuration first
        await testEmailConfiguration();
        // Then test all email types
        const allTypesSuccess = await testAllEmailTypes();
        if (allTypesSuccess) {
            console.log(chalk.green.bold('\n🚀 All email tests passed! Production ready.'));
        }
        else {
            console.log(chalk.yellow.bold('\n⚠️  Some tests failed. Review configuration.'));
            process.exit(1);
        }
    }
    else {
        // Just test basic configuration
        await testEmailConfiguration();
    }
}
// Check minimum requirements
if (!process.env.EMAIL_FROM && !process.argv.includes('--help')) {
    console.log(chalk.red('❌ EMAIL_FROM environment variable is required'));
    console.log(chalk.yellow('💡 Set EMAIL_FROM to your sending email address'));
    process.exit(1);
}
// Help message
if (process.argv.includes('--help') || process.argv.includes('-h')) {
    console.log(chalk.blue.bold('📧 Email Testing Script\n'));
    console.log('Usage:');
    console.log('  npm run test:email [email]            # Test basic configuration');
    console.log('  npm run test:email -- --all           # Test all email types');
    console.log('  npm run test:email -- --help          # Show this help\n');
    console.log('Environment Variables:');
    console.log('  TEST_EMAIL                            # Default email address to send test to');
    console.log('  EMAIL_FROM                            # Required: Sending email address');
    console.log('  RESEND_API_KEY                        # Resend service API key');
    console.log('  SMTP_HOST, SMTP_USER, SMTP_PASS       # SMTP configuration\n');
    process.exit(0);
}
// Validate email address format
if (!process.argv.includes('--help') && TEST_EMAIL && !TEST_EMAIL.includes('@')) {
    console.log(chalk.red('❌ Invalid email address format'));
    console.log(chalk.yellow('💡 Usage: npm run test:email your@email.com'));
    process.exit(1);
}
main().catch(console.error);
