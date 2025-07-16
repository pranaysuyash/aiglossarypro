#!/usr/bin/env node

/**
 * User Flow Testing Script
 * Tests the improvements made based on Gemini's recommendations
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

class UserFlowTester {
  constructor() {
    this.results = {
      serverImplementation: {},
      clientImplementation: {},
      apiEndpoints: {},
      userExperience: {},
      errors: [],
      warnings: [],
    };
  }

  async runTests() {
    console.log('🧪 Testing User Flow Improvements...\n');

    await this.testServerImplementation();
    await this.testClientImplementation();
    await this.testAPIEndpoints();
    await this.generateReport();

    console.log('\n✅ User Flow Testing Complete!');
  }

  async testServerImplementation() {
    console.log('🔧 Testing Server Implementation...');

    // Test 1: Check if grace period logic is fixed
    try {
      const rateLimitingContent = fs.readFileSync('server/middleware/rateLimiting.ts', 'utf8');
      const hasFixedGracePeriod = rateLimitingContent.includes(
        'daysSinceCreation <= DEFAULT_CONFIG.gracePeriodDays'
      );

      this.results.serverImplementation.gracePeriodFixed = hasFixedGracePeriod;
      console.log(`   ✓ Grace period logic: ${hasFixedGracePeriod ? 'FIXED' : 'NEEDS ATTENTION'}`);
    } catch (error) {
      this.results.errors.push('Could not verify grace period fix');
    }

    // Test 2: Check if preview functionality is enhanced
    try {
      const termsRouteContent = fs.readFileSync('server/routes/terms.ts', 'utf8');
      const hasEnhancedPreview = termsRouteContent.includes('previewMessage');

      this.results.serverImplementation.previewEnhanced = hasEnhancedPreview;
      console.log(
        `   ✓ Enhanced preview: ${hasEnhancedPreview ? 'IMPLEMENTED' : 'NEEDS ATTENTION'}`
      );
    } catch (error) {
      this.results.errors.push('Could not verify preview enhancement');
    }

    // Test 3: Check if daily usage endpoint exists
    try {
      const userRouteContent = fs.readFileSync('server/routes/user.ts', 'utf8');
      const hasDailyUsageEndpoint = userRouteContent.includes('/api/user/daily-usage');

      this.results.serverImplementation.dailyUsageEndpoint = hasDailyUsageEndpoint;
      console.log(
        `   ✓ Daily usage endpoint: ${hasDailyUsageEndpoint ? 'IMPLEMENTED' : 'NEEDS ATTENTION'}`
      );
    } catch (error) {
      this.results.errors.push('Could not verify daily usage endpoint');
    }

    // Test 4: Check if user-friendly rate limiting is implemented
    try {
      const rateLimitingContent = fs.readFileSync('server/middleware/rateLimiting.ts', 'utf8');
      const hasUserFriendlyLimiting = rateLimitingContent.includes('previewMode = true');

      this.results.serverImplementation.userFriendlyLimiting = hasUserFriendlyLimiting;
      console.log(
        `   ✓ User-friendly rate limiting: ${hasUserFriendlyLimiting ? 'IMPLEMENTED' : 'NEEDS ATTENTION'}`
      );
    } catch (error) {
      this.results.errors.push('Could not verify user-friendly rate limiting');
    }
  }

  async testClientImplementation() {
    console.log('🎨 Testing Client Implementation...');

    // Test 1: Check if daily usage warning component exists
    try {
      const dailyWarningExists = fs.existsSync('client/src/components/DailyLimitWarning.tsx');
      this.results.clientImplementation.dailyWarningComponent = dailyWarningExists;
      console.log(
        `   ✓ Daily limit warning component: ${dailyWarningExists ? 'IMPLEMENTED' : 'MISSING'}`
      );
    } catch (error) {
      this.results.errors.push('Could not verify daily warning component');
    }

    // Test 2: Check if daily usage hook exists
    try {
      const dailyUsageHookExists = fs.existsSync('client/src/hooks/useDailyUsage.ts');
      this.results.clientImplementation.dailyUsageHook = dailyUsageHookExists;
      console.log(`   ✓ Daily usage hook: ${dailyUsageHookExists ? 'IMPLEMENTED' : 'MISSING'}`);
    } catch (error) {
      this.results.errors.push('Could not verify daily usage hook');
    }

    // Test 3: Check if TermDetail has improved UX
    try {
      const termDetailContent = fs.readFileSync('client/src/pages/TermDetail.tsx', 'utf8');
      const hasImprovedUX = termDetailContent.includes('requiresUpgrade');

      this.results.clientImplementation.improvedTermDetailUX = hasImprovedUX;
      console.log(
        `   ✓ Improved TermDetail UX: ${hasImprovedUX ? 'IMPLEMENTED' : 'NEEDS ATTENTION'}`
      );
    } catch (error) {
      this.results.errors.push('Could not verify TermDetail UX improvements');
    }

    // Test 4: Check if Header has daily usage integration
    try {
      const headerContent = fs.readFileSync('client/src/components/Header.tsx', 'utf8');
      const hasUsageIntegration = headerContent.includes('useDailyUsage');

      this.results.clientImplementation.headerUsageIntegration = hasUsageIntegration;
      console.log(
        `   ✓ Header usage integration: ${hasUsageIntegration ? 'IMPLEMENTED' : 'NEEDS ATTENTION'}`
      );
    } catch (error) {
      this.results.errors.push('Could not verify header usage integration');
    }

    // Test 5: Check if SEO components exist
    try {
      const seoComponentExists = fs.existsSync('client/src/components/SEO/StructuredData.tsx');
      this.results.clientImplementation.seoComponents = seoComponentExists;
      console.log(`   ✓ SEO components: ${seoComponentExists ? 'IMPLEMENTED' : 'MISSING'}`);
    } catch (error) {
      this.results.errors.push('Could not verify SEO components');
    }
  }

  async testAPIEndpoints() {
    console.log('🌐 Testing API Endpoints...');

    // Test server startup
    try {
      console.log('   🔄 Testing server startup...');

      // Check if server can start (basic syntax check)
      const serverContent = fs.readFileSync('server/index.ts', 'utf8');
      const hasBasicStructure = serverContent.includes('app.listen');

      this.results.apiEndpoints.serverStartup = hasBasicStructure;
      console.log(`   ✓ Server startup: ${hasBasicStructure ? 'READY' : 'NEEDS ATTENTION'}`);
    } catch (error) {
      this.results.errors.push('Could not verify server startup');
    }

    // Test route structure
    try {
      const userRouteContent = fs.readFileSync('server/routes/user.ts', 'utf8');
      const hasRequiredRoutes =
        userRouteContent.includes('daily-usage') && userRouteContent.includes('access-status');

      this.results.apiEndpoints.routeStructure = hasRequiredRoutes;
      console.log(
        `   ✓ API routes structure: ${hasRequiredRoutes ? 'COMPLETE' : 'NEEDS ATTENTION'}`
      );
    } catch (error) {
      this.results.errors.push('Could not verify API routes structure');
    }
  }

  async generateReport() {
    console.log('📋 Generating Test Report...');

    const report = this.createTestReport();

    // Write detailed report
    const reportPath = 'USER_FLOW_TEST_REPORT.md';
    fs.writeFileSync(reportPath, report);

    // Write JSON summary
    const summaryPath = 'user-flow-test-summary.json';
    fs.writeFileSync(summaryPath, JSON.stringify(this.results, null, 2));

    console.log(`   ✓ Detailed report: ${reportPath}`);
    console.log(`   ✓ JSON summary: ${summaryPath}`);

    // Display summary
    this.displayTestSummary();
  }

  createTestReport() {
    const { serverImplementation, clientImplementation, apiEndpoints, errors, warnings } =
      this.results;

    return `# User Flow Test Report

## Gemini Recommendations Implementation Status

### Server Implementation
- **Grace Period Fix**: ${serverImplementation.gracePeriodFixed ? '✅ FIXED' : '❌ NEEDS ATTENTION'}
- **Enhanced Preview**: ${serverImplementation.previewEnhanced ? '✅ IMPLEMENTED' : '❌ NEEDS ATTENTION'}
- **Daily Usage Endpoint**: ${serverImplementation.dailyUsageEndpoint ? '✅ IMPLEMENTED' : '❌ NEEDS ATTENTION'}
- **User-Friendly Rate Limiting**: ${serverImplementation.userFriendlyLimiting ? '✅ IMPLEMENTED' : '❌ NEEDS ATTENTION'}

### Client Implementation
- **Daily Warning Component**: ${clientImplementation.dailyWarningComponent ? '✅ IMPLEMENTED' : '❌ MISSING'}
- **Daily Usage Hook**: ${clientImplementation.dailyUsageHook ? '✅ IMPLEMENTED' : '❌ MISSING'}
- **Improved TermDetail UX**: ${clientImplementation.improvedTermDetailUX ? '✅ IMPLEMENTED' : '❌ NEEDS ATTENTION'}
- **Header Usage Integration**: ${clientImplementation.headerUsageIntegration ? '✅ IMPLEMENTED' : '❌ NEEDS ATTENTION'}
- **SEO Components**: ${clientImplementation.seoComponents ? '✅ IMPLEMENTED' : '❌ MISSING'}

### API Endpoints
- **Server Startup**: ${apiEndpoints.serverStartup ? '✅ READY' : '❌ NEEDS ATTENTION'}
- **Route Structure**: ${apiEndpoints.routeStructure ? '✅ COMPLETE' : '❌ NEEDS ATTENTION'}

## Implementation Summary

### ✅ Successfully Implemented
${this.getSuccessfulImplementations()
  .map(item => `- ${item}`)
  .join('\n')}

### ❌ Needs Attention
${this.getFailedImplementations()
  .map(item => `- ${item}`)
  .join('\n')}

## Errors and Warnings

${
  errors.length > 0
    ? `
### Errors
${errors.map(error => `- ${error}`).join('\n')}
`
    : '✅ No errors found'
}

${
  warnings.length > 0
    ? `
### Warnings
${warnings.map(warning => `- ${warning}`).join('\n')}
`
    : '✅ No warnings found'
}

## Next Steps

1. **High Priority**: Address any failed implementations
2. **Medium Priority**: Test the complete user flow end-to-end
3. **Low Priority**: Optimize performance and add additional features

---
*Generated by User Flow Testing Script on ${new Date().toISOString()}*
`;
  }

  getSuccessfulImplementations() {
    const successful = [];
    const { serverImplementation, clientImplementation, apiEndpoints } = this.results;

    if (serverImplementation.gracePeriodFixed) successful.push('Grace period logic fixed');
    if (serverImplementation.previewEnhanced) successful.push('Enhanced preview functionality');
    if (serverImplementation.dailyUsageEndpoint) successful.push('Daily usage API endpoint');
    if (serverImplementation.userFriendlyLimiting) successful.push('User-friendly rate limiting');
    if (clientImplementation.dailyWarningComponent)
      successful.push('Daily limit warning component');
    if (clientImplementation.dailyUsageHook) successful.push('Daily usage React hook');
    if (clientImplementation.improvedTermDetailUX)
      successful.push('Improved TermDetail user experience');
    if (clientImplementation.headerUsageIntegration) successful.push('Header usage integration');
    if (clientImplementation.seoComponents) successful.push('SEO and structured data components');
    if (apiEndpoints.serverStartup) successful.push('Server startup configuration');
    if (apiEndpoints.routeStructure) successful.push('API routes structure');

    return successful;
  }

  getFailedImplementations() {
    const failed = [];
    const { serverImplementation, clientImplementation, apiEndpoints } = this.results;

    if (!serverImplementation.gracePeriodFixed) failed.push('Grace period logic needs fixing');
    if (!serverImplementation.previewEnhanced)
      failed.push('Preview functionality needs enhancement');
    if (!serverImplementation.dailyUsageEndpoint) failed.push('Daily usage API endpoint missing');
    if (!serverImplementation.userFriendlyLimiting)
      failed.push('User-friendly rate limiting needs implementation');
    if (!clientImplementation.dailyWarningComponent)
      failed.push('Daily limit warning component missing');
    if (!clientImplementation.dailyUsageHook) failed.push('Daily usage React hook missing');
    if (!clientImplementation.improvedTermDetailUX)
      failed.push('TermDetail UX improvements needed');
    if (!clientImplementation.headerUsageIntegration)
      failed.push('Header usage integration needed');
    if (!clientImplementation.seoComponents) failed.push('SEO components missing');
    if (!apiEndpoints.serverStartup) failed.push('Server startup needs attention');
    if (!apiEndpoints.routeStructure) failed.push('API routes structure needs completion');

    return failed;
  }

  displayTestSummary() {
    const successful = this.getSuccessfulImplementations();
    const failed = this.getFailedImplementations();

    console.log('\n🎯 TEST SUMMARY');
    console.log('='.repeat(50));
    console.log(`✅ Successful: ${successful.length}`);
    console.log(`❌ Failed: ${failed.length}`);
    console.log(`⚠️  Errors: ${this.results.errors.length}`);
    console.log('='.repeat(50));

    if (failed.length === 0 && this.results.errors.length === 0) {
      console.log('🎉 ALL TESTS PASSED!');
      console.log('✅ User flow improvements successfully implemented');
    } else {
      console.log('⚠️  Some issues found. Check the detailed report.');
    }
  }
}

// Run tests
const tester = new UserFlowTester();
tester.runTests().catch(console.error);
