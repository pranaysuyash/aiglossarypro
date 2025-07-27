#!/usr/bin/env node

/**
 * AdSense Integration Validation Script
 *
 * This script validates the AdSense integration by:
 * 1. Checking component implementations
 * 2. Validating environment configuration
 * 3. Testing ad placement logic
 * 4. Verifying premium user exclusion
 * 5. Checking performance impact
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class AdSenseValidator {
  constructor() {
    this.results = {
      passed: 0,
      failed: 0,
      warnings: 0,
      tests: [],
    };
  }

  log(message, type = 'info') {
    const timestamp = new Date().toISOString();
    const prefix = {
      pass: '✅ PASS',
      fail: '❌ FAIL',
      warn: '⚠️  WARN',
      info: 'ℹ️  INFO',
    }[type];

    console.log(`[${timestamp}] ${prefix} ${message}`);

    if (type === 'pass') {this.results.passed++;}
    if (type === 'fail') {this.results.failed++;}
    if (type === 'warn') {this.results.warnings++;}

    this.results.tests.push({ message, type, timestamp });
  }

  async validateGoogleAdComponent() {
    this.log('Validating GoogleAd component implementation...', 'info');

    const componentPath = path.join(__dirname, '../client/src/components/ads/GoogleAd.tsx');

    if (!fs.existsSync(componentPath)) {
      this.log('GoogleAd component not found', 'fail');
      return;
    }

    const content = fs.readFileSync(componentPath, 'utf8');

    // Check for essential features
    const checks = [
      { name: 'Premium user exclusion', pattern: /user\?\.lifetimeAccess/ },
      { name: 'Lazy loading implementation', pattern: /IntersectionObserver/ },
      { name: 'Environment variable checks', pattern: /import\.meta\.env\.VITE_ADSENSE/ },
      { name: 'Error handling', pattern: /try\s*\{[\s\S]*catch/ },
      { name: 'Ad formats support', pattern: /'auto'\s*\|\s*'fluid'\s*\|\s*'rectangle'/ },
      { name: 'Responsive design', pattern: /responsive.*boolean/ },
      { name: 'Development mode check', pattern: /import\.meta\.env\.DEV/ },
      { name: 'AdSense script loading', pattern: /googlesyndication\.com/ },
    ];

    checks.forEach(check => {
      if (check.pattern.test(content)) {
        this.log(`GoogleAd component has ${check.name}`, 'pass');
      } else {
        this.log(`GoogleAd component missing ${check.name}`, 'fail');
      }
    });

    // Check component size (should be substantial but not bloated)
    const lines = content.split('\n').length;
    if (lines >= 200 && lines <= 300) {
      this.log(`GoogleAd component size is optimal (${lines} lines)`, 'pass');
    } else if (lines < 200) {
      this.log(`GoogleAd component may be incomplete (${lines} lines)`, 'warn');
    } else {
      this.log(`GoogleAd component may be too large (${lines} lines)`, 'warn');
    }
  }

  async validateEnvironmentConfig() {
    this.log('Validating environment configuration...', 'info');

    const envExamplePath = path.join(__dirname, '../.env.example');

    if (!fs.existsSync(envExamplePath)) {
      this.log('.env.example file not found', 'fail');
      return;
    }

    const content = fs.readFileSync(envExamplePath, 'utf8');

    const requiredVars = [
      'VITE_ADSENSE_ENABLED',
      'VITE_ADSENSE_CLIENT_ID',
      'VITE_AD_SLOT_HOMEPAGE',
      'VITE_AD_SLOT_SEARCH_RESULTS',
      'VITE_AD_SLOT_TERM_DETAIL',
      'VITE_AD_SLOT_SIDEBAR',
    ];

    requiredVars.forEach(varName => {
      if (content.includes(varName)) {
        this.log(`Environment variable ${varName} is configured`, 'pass');
      } else {
        this.log(`Environment variable ${varName} is missing`, 'fail');
      }
    });

    // Check for proper format
    if (content.includes('ca-pub-XXXXXXXXXXXXXXXXX')) {
      this.log('AdSense client ID placeholder is properly formatted', 'pass');
    } else {
      this.log('AdSense client ID placeholder format issue', 'warn');
    }
  }

  async validateAdPlacement() {
    this.log('Validating ad placement implementation...', 'info');

    const pagesToCheck = [
      { name: 'Home', path: '../client/src/pages/Home.tsx' },
      { name: 'TermDetail', path: '../client/src/pages/TermDetail.tsx' },
      { name: 'Terms', path: '../client/src/pages/Terms.tsx' },
    ];

    for (const page of pagesToCheck) {
      const pagePath = path.join(__dirname, page.path);

      if (!fs.existsSync(pagePath)) {
        this.log(`${page.name} page not found`, 'fail');
        continue;
      }

      const content = fs.readFileSync(pagePath, 'utf8');

      // Check for GoogleAd import
      if (content.includes('GoogleAd')) {
        this.log(`${page.name} page imports GoogleAd component`, 'pass');
      } else {
        this.log(`${page.name} page missing GoogleAd import`, 'fail');
        continue;
      }

      // Check for premium user check
      if (content.includes('lifetimeAccess') || content.includes('canShowAd')) {
        this.log(`${page.name} page has premium user exclusion`, 'pass');
      } else {
        this.log(`${page.name} page missing premium user exclusion`, 'warn');
      }

      // Check for ad slot usage
      if (content.includes('adSlot') || content.includes('slot=')) {
        this.log(`${page.name} page uses ad slots correctly`, 'pass');
      } else {
        this.log(`${page.name} page missing ad slot configuration`, 'fail');
      }
    }
  }

  async validateUseAdSenseHook() {
    this.log('Validating useAdSense hook implementation...', 'info');

    const hookPath = path.join(__dirname, '../client/src/hooks/useAdSense.ts');

    if (!fs.existsSync(hookPath)) {
      this.log('useAdSense hook not found', 'fail');
      return;
    }

    const content = fs.readFileSync(hookPath, 'utf8');

    const checks = [
      { name: 'Auth integration', pattern: /useAuth/ },
      { name: 'Environment check', pattern: /VITE_ADSENSE_ENABLED/ },
      { name: 'Script loading', pattern: /adsbygoogle/ },
      { name: 'Analytics tracking', pattern: /trackAdEvent/ },
      { name: 'Ad placement helper', pattern: /useAdPlacement/ },
      { name: 'Configuration interface', pattern: /AdSenseConfig/ },
    ];

    checks.forEach(check => {
      if (check.pattern.test(content)) {
        this.log(`useAdSense hook has ${check.name}`, 'pass');
      } else {
        this.log(`useAdSense hook missing ${check.name}`, 'fail');
      }
    });
  }

  async validateStorybookStories() {
    this.log('Validating Storybook stories...', 'info');

    const storyPath = path.join(__dirname, '../client/src/components/ads/GoogleAd.stories.tsx');

    if (!fs.existsSync(storyPath)) {
      this.log('GoogleAd Storybook stories not found', 'fail');
      return;
    }

    const content = fs.readFileSync(storyPath, 'utf8');

    const expectedStories = [
      'Rectangle',
      'Responsive',
      'Horizontal',
      'Vertical',
      'LazyLoading',
      'Disabled',
      'DevelopmentMode',
    ];

    expectedStories.forEach(story => {
      if (content.includes(`export const ${story}:`)) {
        this.log(`Storybook has ${story} story`, 'pass');
      } else {
        this.log(`Storybook missing ${story} story`, 'warn');
      }
    });
  }

  async validatePerformanceImpact() {
    this.log('Validating performance considerations...', 'info');

    // Check for lazy loading implementation
    const componentPath = path.join(__dirname, '../client/src/components/ads/GoogleAd.tsx');
    const content = fs.readFileSync(componentPath, 'utf8');

    if (content.includes('lazy') && content.includes('IntersectionObserver')) {
      this.log('Component implements lazy loading for performance', 'pass');
    } else {
      this.log('Component missing lazy loading implementation', 'fail');
    }

    if (content.includes('async') && content.includes('script.onload')) {
      this.log('Component loads AdSense script asynchronously', 'pass');
    } else {
      this.log('Component may not load AdSense script optimally', 'warn');
    }

    if (content.includes('crossOrigin')) {
      this.log('Component sets proper CORS attributes', 'pass');
    } else {
      this.log('Component missing CORS configuration', 'warn');
    }
  }

  async validateSecurityAndCompliance() {
    this.log('Validating security and compliance...', 'info');

    const componentPath = path.join(__dirname, '../client/src/components/ads/GoogleAd.tsx');
    const content = fs.readFileSync(componentPath, 'utf8');

    // Check for data-adtest attribute for development
    if (content.includes('data-adtest')) {
      this.log('Component includes test mode for development', 'pass');
    } else {
      this.log('Component missing development test mode', 'warn');
    }

    // Check for proper error handling
    if (content.includes('catch') && content.includes('console.warn')) {
      this.log('Component has proper error handling', 'pass');
    } else {
      this.log('Component may lack proper error handling', 'warn');
    }

    // Check for accessibility labels
    if (content.includes('Advertisement')) {
      this.log('Component includes accessibility labels', 'pass');
    } else {
      this.log('Component missing accessibility labels', 'fail');
    }
  }

  async generateReport() {
    this.log('Generating validation report...', 'info');

    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        totalTests: this.results.tests.length,
        passed: this.results.passed,
        failed: this.results.failed,
        warnings: this.results.warnings,
        score: Math.round(
          (this.results.passed / (this.results.passed + this.results.failed)) * 100
        ),
      },
      details: this.results.tests,
      recommendations: [],
    };

    // Generate recommendations based on failures
    if (this.results.failed > 0) {
      report.recommendations.push('Fix all failing tests before deploying to production');
    }

    if (this.results.warnings > 0) {
      report.recommendations.push('Review warnings to ensure optimal implementation');
    }

    if (report.summary.score < 90) {
      report.recommendations.push('Achieve at least 90% test pass rate before deployment');
    } else {
      report.recommendations.push('AdSense integration is ready for deployment');
    }

    // Save report to file
    const reportPath = path.join(__dirname, '../reports/adsense-validation-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

    console.log('\n=== ADSENSE VALIDATION REPORT ===');
    console.log(`Total Tests: ${report.summary.totalTests}`);
    console.log(`Passed: ${report.summary.passed}`);
    console.log(`Failed: ${report.summary.failed}`);
    console.log(`Warnings: ${report.summary.warnings}`);
    console.log(`Score: ${report.summary.score}%`);
    console.log('\nRecommendations:');
    report.recommendations.forEach(rec => console.log(`  • ${rec}`));
    console.log(`\nDetailed report saved to: ${reportPath}`);

    return report;
  }

  async run() {
    console.log('🚀 Starting AdSense Integration Validation\n');

    try {
      await this.validateGoogleAdComponent();
      await this.validateEnvironmentConfig();
      await this.validateAdPlacement();
      await this.validateUseAdSenseHook();
      await this.validateStorybookStories();
      await this.validatePerformanceImpact();
      await this.validateSecurityAndCompliance();

      const report = await this.generateReport();

      // Exit with appropriate code
      process.exit(report.summary.failed > 0 ? 1 : 0);
    } catch (error) {
      this.log(`Validation failed with error: ${error.message}`, 'fail');
      process.exit(1);
    }
  }
}

// Run validation if this script is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const validator = new AdSenseValidator();
  validator.run();
}

export default AdSenseValidator;
