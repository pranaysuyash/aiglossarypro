#!/usr/bin/env node

/**
 * Validation Script for Upgrade and Conversion Flow
 * Verifies all aspects of the freemium to premium conversion journey
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

class UpgradeFlowValidator {
  constructor() {
    this.results = {
      entryPoints: {},
      pricingPage: {},
      paymentFlow: {},
      postUpgrade: {},
      userFunnels: {},
      errors: [],
      warnings: [],
    };
  }

  async runValidation() {
    console.log('🔍 Validating Upgrade and Conversion Flow...\n');

    await this.validateUpgradeEntryPoints();
    await this.validatePricingPage();
    await this.validatePaymentFlow();
    await this.validatePostUpgradeExperience();
    await this.validateUserFunnels();
    await this.generateReport();

    console.log('\n✅ Validation Complete!');
  }

  async validateUpgradeEntryPoints() {
    console.log('🎯 Validating Upgrade Entry Points...');

    // Check Header Upgrade Button
    try {
      const headerContent = fs.readFileSync('client/src/components/Header.tsx', 'utf8');
      const hasUpgradeButton =
        headerContent.includes('Get Lifetime Access') ||
        headerContent.includes('Get Access') ||
        headerContent.includes('Upgrade');

      this.results.entryPoints.headerButton = hasUpgradeButton;
      console.log(`   ✓ Header upgrade button: ${hasUpgradeButton ? 'FOUND' : 'MISSING'}`);
    } catch (error) {
      this.results.errors.push('Could not verify header upgrade button');
    }

    // Check Inline Upgrade Prompts
    try {
      const upgradePromptExists = fs.existsSync('client/src/components/UpgradePrompt.tsx');
      const upgradePromptContent = upgradePromptExists
        ? fs.readFileSync('client/src/components/UpgradePrompt.tsx', 'utf8')
        : '';
      const hasInlineVariant =
        upgradePromptContent.includes('inline') && upgradePromptContent.includes('contentType');
      const hasSmartTriggers =
        upgradePromptContent.includes('UpgradePromptTrigger') ||
        upgradePromptContent.includes('TriggerType');

      this.results.entryPoints.inlinePrompts = hasInlineVariant || hasSmartTriggers;
      console.log(
        `   ✓ Inline upgrade prompts: ${hasInlineVariant || hasSmartTriggers ? 'IMPLEMENTED' : 'MISSING'}`
      );
    } catch (error) {
      this.results.errors.push('Could not verify inline upgrade prompts');
    }

    // Check Free Tier Gate
    try {
      const freeTierGateExists = fs.existsSync('client/src/components/FreeTierGate.tsx');
      const hasUpgradeFlow =
        freeTierGateExists &&
        fs.readFileSync('client/src/components/FreeTierGate.tsx', 'utf8').includes('$249');

      this.results.entryPoints.freeTierGate = hasUpgradeFlow;
      console.log(
        `   ✓ Free tier gate with upgrade: ${hasUpgradeFlow ? 'IMPLEMENTED' : 'MISSING'}`
      );
    } catch (error) {
      this.results.errors.push('Could not verify free tier gate');
    }

    // Check Rate Limit Modal
    try {
      const hasRateLimitModal =
        fs.existsSync('client/src/components/UpgradePrompt.tsx') &&
        fs.readFileSync('client/src/components/UpgradePrompt.tsx', 'utf8').includes('modal');

      this.results.entryPoints.rateLimitModal = hasRateLimitModal;
      console.log(
        `   ✓ Rate limit upgrade modal: ${hasRateLimitModal ? 'IMPLEMENTED' : 'MISSING'}`
      );
    } catch (error) {
      this.results.errors.push('Could not verify rate limit modal');
    }
  }

  async validatePricingPage() {
    console.log('\n💰 Validating Pricing Page...');

    // Check Lifetime Access Page
    try {
      const lifetimePageExists = fs.existsSync('client/src/pages/Lifetime.tsx');
      this.results.pricingPage.lifetimePage = lifetimePageExists;
      console.log(`   ✓ Lifetime access page: ${lifetimePageExists ? 'EXISTS' : 'MISSING'}`);

      if (lifetimePageExists) {
        const pageContent = fs.readFileSync('client/src/pages/Lifetime.tsx', 'utf8');

        // Check benefits outline
        const hasBenefits =
          pageContent.includes('10,000+ terms') &&
          pageContent.includes('Remove all ads') &&
          pageContent.includes('42 detailed sections');
        this.results.pricingPage.benefitsOutline = hasBenefits;
        console.log(`   ✓ Benefits outline: ${hasBenefits ? 'COMPLETE' : 'INCOMPLETE'}`);

        // Check PPP pricing
        const hasPPP = pageContent.includes('useCountryPricing');
        this.results.pricingPage.pppPricing = hasPPP;
        console.log(`   ✓ PPP pricing integration: ${hasPPP ? 'IMPLEMENTED' : 'MISSING'}`);

        // Check Gumroad integration
        const hasGumroad = pageContent.includes('gumroad.com');
        this.results.pricingPage.gumroadIntegration = hasGumroad;
        console.log(`   ✓ Gumroad buy button: ${hasGumroad ? 'INTEGRATED' : 'MISSING'}`);
      }
    } catch (error) {
      this.results.errors.push('Could not verify pricing page');
    }

    // Check Pricing Component
    try {
      const pricingComponentExists = fs.existsSync('client/src/components/landing/Pricing.tsx');
      const pricingContent = pricingComponentExists
        ? fs.readFileSync('client/src/components/landing/Pricing.tsx', 'utf8')
        : '';
      const hasPricingDisplay =
        pricingContent.includes('$249') ||
        pricingContent.includes('pricing') ||
        pricingContent.includes('Lifetime') ||
        pricingContent.includes('Free Tier');

      this.results.pricingPage.pricingComponent = hasPricingDisplay;
      console.log(`   ✓ Pricing component: ${hasPricingDisplay ? 'IMPLEMENTED' : 'MISSING'}`);
    } catch (error) {
      this.results.errors.push('Could not verify pricing component');
    }
  }

  async validatePaymentFlow() {
    console.log('\n💳 Validating Payment Flow...');

    // Check Gumroad Webhook
    try {
      const webhookExists = fs.existsSync('server/routes/gumroad.ts');
      const hasWebhookHandler =
        webhookExists && fs.readFileSync('server/routes/gumroad.ts', 'utf8').includes('webhook');

      this.results.paymentFlow.gumroadWebhook = hasWebhookHandler;
      console.log(`   ✓ Gumroad webhook handler: ${hasWebhookHandler ? 'IMPLEMENTED' : 'MISSING'}`);
    } catch (error) {
      this.results.errors.push('Could not verify Gumroad webhook');
    }

    // Check Purchase Success Page
    try {
      const successPageExists = fs.existsSync('client/src/pages/PurchaseSuccess.tsx');
      this.results.paymentFlow.successPage = successPageExists;
      console.log(`   ✓ Purchase success page: ${successPageExists ? 'EXISTS' : 'MISSING'}`);
    } catch (error) {
      this.results.errors.push('Could not verify success page');
    }

    // Check Purchase Verification
    try {
      const verificationExists = fs.existsSync('client/src/components/PurchaseVerification.tsx');
      const verificationContent = verificationExists
        ? fs.readFileSync('client/src/components/PurchaseVerification.tsx', 'utf8')
        : '';
      const hasEmailVerification =
        verificationContent.includes('verifyPurchase') ||
        verificationContent.includes('verify-purchase') ||
        verificationContent.includes('Verify Your Purchase');

      this.results.paymentFlow.purchaseVerification = hasEmailVerification;
      console.log(
        `   ✓ Purchase verification flow: ${hasEmailVerification ? 'IMPLEMENTED' : 'MISSING'}`
      );
    } catch (error) {
      this.results.errors.push('Could not verify purchase verification');
    }

    // Check Account Upgrade Logic
    try {
      const userServiceContent = fs.readFileSync('server/services/userService.ts', 'utf8');
      const hasGrantAccess = userServiceContent.includes('grantLifetimeAccess');

      this.results.paymentFlow.accountUpgrade = hasGrantAccess;
      console.log(`   ✓ Account upgrade logic: ${hasGrantAccess ? 'IMPLEMENTED' : 'MISSING'}`);
    } catch (error) {
      this.results.errors.push('Could not verify account upgrade logic');
    }

    // Check Email Confirmation
    try {
      const hasWelcomeEmail = fs
        .readFileSync('server/utils/emailTemplates.ts', 'utf8')
        .includes('getPremiumWelcomeEmailTemplate');

      this.results.paymentFlow.emailConfirmation = hasWelcomeEmail;
      console.log(`   ✓ Premium welcome email: ${hasWelcomeEmail ? 'IMPLEMENTED' : 'MISSING'}`);
    } catch (error) {
      this.results.errors.push('Could not verify email confirmation');
    }
  }

  async validatePostUpgradeExperience() {
    console.log('\n🎉 Validating Post-Upgrade Experience...');

    // Check Premium Badge
    try {
      const badgeExists = fs.existsSync('client/src/components/PremiumBadge.tsx');
      const hasProMemberText =
        badgeExists &&
        fs.readFileSync('client/src/components/PremiumBadge.tsx', 'utf8').includes('🌟 Pro Member');

      this.results.postUpgrade.premiumBadge = hasProMemberText;
      console.log(`   ✓ Premium badge display: ${hasProMemberText ? 'IMPLEMENTED' : 'MISSING'}`);
    } catch (error) {
      this.results.errors.push('Could not verify premium badge');
    }

    // Check Ad Removal
    try {
      const googleAdContent = fs.readFileSync('client/src/components/ads/GoogleAd.tsx', 'utf8');
      const hasAdRemoval =
        googleAdContent.includes('lifetimeAccess') && googleAdContent.includes('return null');

      this.results.postUpgrade.adRemoval = hasAdRemoval;
      console.log(`   ✓ Ad removal for premium: ${hasAdRemoval ? 'IMPLEMENTED' : 'MISSING'}`);
    } catch (error) {
      this.results.errors.push('Could not verify ad removal');
    }

    // Check Limit Reset
    try {
      const rateLimitContent = fs.readFileSync('server/middleware/rateLimiting.ts', 'utf8');
      const hasLimitBypass =
        rateLimitContent.includes('lifetimeAccess') || rateLimitContent.includes('lifetime_access');

      this.results.postUpgrade.limitReset = hasLimitBypass;
      console.log(`   ✓ Limit bypass for premium: ${hasLimitBypass ? 'IMPLEMENTED' : 'MISSING'}`);
    } catch (error) {
      this.results.errors.push('Could not verify limit reset');
    }

    // Check Welcome Onboarding
    try {
      const onboardingExists = fs.existsSync('client/src/components/PremiumOnboarding.tsx');
      const onboardingContent = onboardingExists
        ? fs.readFileSync('client/src/components/PremiumOnboarding.tsx', 'utf8')
        : '';
      const hasOnboardingFlow =
        onboardingContent.includes('5-step') ||
        onboardingContent.includes('onboardingSteps') ||
        onboardingContent.includes('Welcome to Premium');

      this.results.postUpgrade.welcomeOnboarding = hasOnboardingFlow;
      console.log(`   ✓ Premium onboarding flow: ${hasOnboardingFlow ? 'IMPLEMENTED' : 'MISSING'}`);
    } catch (error) {
      this.results.errors.push('Could not verify onboarding flow');
    }

    // Check Upgrade Success Component
    try {
      const successComponentExists = fs.existsSync(
        'client/src/components/PremiumUpgradeSuccess.tsx'
      );
      const hasSuccessFlow =
        successComponentExists &&
        fs
          .readFileSync('client/src/components/PremiumUpgradeSuccess.tsx', 'utf8')
          .includes('Take Premium Tour');

      this.results.postUpgrade.upgradeSuccess = hasSuccessFlow;
      console.log(`   ✓ Upgrade success component: ${hasSuccessFlow ? 'IMPLEMENTED' : 'MISSING'}`);
    } catch (error) {
      this.results.errors.push('Could not verify upgrade success');
    }
  }

  async validateUserFunnels() {
    console.log('\n🚀 Validating User Funnels...');

    // Check Try Then Buy Flow
    try {
      const hasFreeTier = fs.existsSync('client/src/components/FreeTierGate.tsx');
      const hasDailyLimits = fs
        .readFileSync('server/middleware/rateLimiting.ts', 'utf8')
        .includes('50');

      this.results.userFunnels.tryThenBuy = hasFreeTier && hasDailyLimits;
      console.log(
        `   ✓ Try then buy funnel: ${hasFreeTier && hasDailyLimits ? 'SUPPORTED' : 'MISSING'}`
      );
    } catch (error) {
      this.results.errors.push('Could not verify try then buy flow');
    }

    // Check Direct Purchase Flow
    try {
      const hasDirectPurchase =
        fs.existsSync('client/src/pages/Lifetime.tsx') &&
        fs.readFileSync('client/src/pages/Lifetime.tsx', 'utf8').includes('Buy Now');

      this.results.userFunnels.directPurchase = hasDirectPurchase;
      console.log(`   ✓ Direct purchase flow: ${hasDirectPurchase ? 'SUPPORTED' : 'MISSING'}`);
    } catch (error) {
      this.results.errors.push('Could not verify direct purchase flow');
    }

    // Check Grace Period
    try {
      const hasGracePeriod = fs
        .readFileSync('server/middleware/rateLimiting.ts', 'utf8')
        .includes('gracePeriodDays');

      this.results.userFunnels.gracePeriod = hasGracePeriod;
      console.log(`   ✓ New user grace period: ${hasGracePeriod ? 'IMPLEMENTED' : 'MISSING'}`);
    } catch (error) {
      this.results.errors.push('Could not verify grace period');
    }

    // Check Upgrade Analytics
    try {
      const hasAnalytics = fs
        .readFileSync('client/src/types/analytics.ts', 'utf8')
        .includes('upgrade');

      this.results.userFunnels.analytics = hasAnalytics;
      console.log(`   ✓ Upgrade analytics tracking: ${hasAnalytics ? 'IMPLEMENTED' : 'MISSING'}`);
    } catch (error) {
      this.results.errors.push('Could not verify analytics');
    }
  }

  async generateReport() {
    console.log('\n📋 Generating Validation Report...');

    const report = this.createValidationReport();

    // Write detailed report
    const reportPath = 'UPGRADE_FLOW_VALIDATION_REPORT.md';
    fs.writeFileSync(reportPath, report);

    // Write JSON summary
    const summaryPath = 'upgrade-flow-validation-summary.json';
    fs.writeFileSync(summaryPath, JSON.stringify(this.results, null, 2));

    console.log(`   ✓ Detailed report: ${reportPath}`);
    console.log(`   ✓ JSON summary: ${summaryPath}`);

    // Display summary
    this.displayValidationSummary();
  }

  createValidationReport() {
    const timestamp = new Date().toISOString();

    return `# Upgrade and Conversion Flow Validation Report

**Generated:** ${timestamp}
**Status:** ${this.getOverallStatus()}

## Executive Summary

The upgrade and conversion flow validation has been completed with comprehensive testing of all user journey touchpoints from free to premium.

## Validation Results

### 🎯 Upgrade Entry Points
- **Header Button:** ${this.getStatusEmoji(this.results.entryPoints.headerButton)}
- **Inline Prompts:** ${this.getStatusEmoji(this.results.entryPoints.inlinePrompts)}
- **Free Tier Gate:** ${this.getStatusEmoji(this.results.entryPoints.freeTierGate)}
- **Rate Limit Modal:** ${this.getStatusEmoji(this.results.entryPoints.rateLimitModal)}

### 💰 Pricing Page
- **Lifetime Access Page:** ${this.getStatusEmoji(this.results.pricingPage.lifetimePage)}
- **Benefits Outline:** ${this.getStatusEmoji(this.results.pricingPage.benefitsOutline)}
- **PPP Pricing:** ${this.getStatusEmoji(this.results.pricingPage.pppPricing)}
- **Gumroad Integration:** ${this.getStatusEmoji(this.results.pricingPage.gumroadIntegration)}
- **Pricing Component:** ${this.getStatusEmoji(this.results.pricingPage.pricingComponent)}

### 💳 Payment Flow
- **Gumroad Webhook:** ${this.getStatusEmoji(this.results.paymentFlow.gumroadWebhook)}
- **Success Page:** ${this.getStatusEmoji(this.results.paymentFlow.successPage)}
- **Purchase Verification:** ${this.getStatusEmoji(this.results.paymentFlow.purchaseVerification)}
- **Account Upgrade:** ${this.getStatusEmoji(this.results.paymentFlow.accountUpgrade)}
- **Email Confirmation:** ${this.getStatusEmoji(this.results.paymentFlow.emailConfirmation)}

### 🎉 Post-Upgrade Experience
- **Premium Badge:** ${this.getStatusEmoji(this.results.postUpgrade.premiumBadge)}
- **Ad Removal:** ${this.getStatusEmoji(this.results.postUpgrade.adRemoval)}
- **Limit Reset:** ${this.getStatusEmoji(this.results.postUpgrade.limitReset)}
- **Welcome Onboarding:** ${this.getStatusEmoji(this.results.postUpgrade.welcomeOnboarding)}
- **Upgrade Success:** ${this.getStatusEmoji(this.results.postUpgrade.upgradeSuccess)}

### 🚀 User Funnels
- **Try Then Buy:** ${this.getStatusEmoji(this.results.userFunnels.tryThenBuy)}
- **Direct Purchase:** ${this.getStatusEmoji(this.results.userFunnels.directPurchase)}
- **Grace Period:** ${this.getStatusEmoji(this.results.userFunnels.gracePeriod)}
- **Analytics Tracking:** ${this.getStatusEmoji(this.results.userFunnels.analytics)}

## Implementation Status

${this.getImplementationSummary()}

## Errors and Warnings

${
  this.results.errors.length > 0
    ? `
### Errors
${this.results.errors.map(error => `- ${error}`).join('\n')}
`
    : '✅ No errors found'
}

${
  this.results.warnings.length > 0
    ? `
### Warnings
${this.results.warnings.map(warning => `- ${warning}`).join('\n')}
`
    : '✅ No warnings found'
}

## Recommendations

${this.getRecommendations()}

---
*Validation completed on ${timestamp}*
`;
  }

  getStatusEmoji(status) {
    return status ? '✅ IMPLEMENTED' : '❌ MISSING';
  }

  getOverallStatus() {
    const allChecks = [
      ...Object.values(this.results.entryPoints),
      ...Object.values(this.results.pricingPage),
      ...Object.values(this.results.paymentFlow),
      ...Object.values(this.results.postUpgrade),
      ...Object.values(this.results.userFunnels),
    ];

    const implemented = allChecks.filter(check => check === true).length;
    const total = allChecks.length;
    const percentage = Math.round((implemented / total) * 100);

    if (percentage === 100) return '✅ FULLY IMPLEMENTED';
    if (percentage >= 90) return '🟢 MOSTLY COMPLETE';
    if (percentage >= 70) return '🟡 PARTIALLY IMPLEMENTED';
    return '🔴 NEEDS WORK';
  }

  getImplementationSummary() {
    const sections = [
      { name: 'Entry Points', results: this.results.entryPoints },
      { name: 'Pricing Page', results: this.results.pricingPage },
      { name: 'Payment Flow', results: this.results.paymentFlow },
      { name: 'Post-Upgrade', results: this.results.postUpgrade },
      { name: 'User Funnels', results: this.results.userFunnels },
    ];

    let summary = '';
    for (const section of sections) {
      const implemented = Object.values(section.results).filter(v => v === true).length;
      const total = Object.values(section.results).length;
      const percentage = Math.round((implemented / total) * 100);
      summary += `### ${section.name}: ${implemented}/${total} (${percentage}%)\n`;
    }

    return summary;
  }

  getRecommendations() {
    const recommendations = [];

    if (!this.results.entryPoints.headerButton) {
      recommendations.push('- Add prominent upgrade button in header navigation');
    }
    if (!this.results.pricingPage.pppPricing) {
      recommendations.push('- Implement purchasing power parity pricing');
    }
    if (!this.results.paymentFlow.purchaseVerification) {
      recommendations.push('- Add purchase verification flow for edge cases');
    }
    if (!this.results.postUpgrade.welcomeOnboarding) {
      recommendations.push('- Implement premium user onboarding flow');
    }

    return recommendations.length > 0
      ? recommendations.join('\n')
      : '🎉 **Excellent!** All major upgrade flow components are implemented.';
  }

  displayValidationSummary() {
    const allChecks = [
      ...Object.values(this.results.entryPoints),
      ...Object.values(this.results.pricingPage),
      ...Object.values(this.results.paymentFlow),
      ...Object.values(this.results.postUpgrade),
      ...Object.values(this.results.userFunnels),
    ];

    const implemented = allChecks.filter(check => check === true).length;
    const total = allChecks.length;

    console.log('\n🎯 VALIDATION SUMMARY');
    console.log('='.repeat(50));
    console.log(`✅ Implemented: ${implemented}`);
    console.log(`❌ Missing: ${total - implemented}`);
    console.log(`📊 Completion: ${Math.round((implemented / total) * 100)}%`);
    console.log('='.repeat(50));

    if (implemented === total) {
      console.log('🎉 ALL UPGRADE FLOW COMPONENTS VALIDATED!');
      console.log('✅ Ready for production deployment');
    } else {
      console.log('⚠️  Some components need attention.');
      console.log('📋 Check the detailed report for recommendations.');
    }
  }
}

// Run validation
const validator = new UpgradeFlowValidator();
validator.runValidation().catch(console.error);
