#!/usr/bin/env npx tsx
/**
 * Comprehensive Authenticated Visual Audit
 * Tests with Firebase authentication and interactive content verification
 */

import puppeteer, { Browser, Page } from 'puppeteer';
import { writeFileSync } from 'fs';

// Test user credentials from createTestUser.ts
const TEST_USER = {
  email: 'test@aimlglossary.com',
  password: 'testpass123'
};

const ADMIN_USER = {
  email: 'admin@aimlglossary.com', 
  password: 'adminpass123'
};

interface AuditSection {
  name: string;
  status: 'pass' | 'fail' | 'warning';
  details: string[];
  screenshots?: string[];
  errors?: string[];
}

interface AuthenticatedAuditReport {
  timestamp: string;
  duration: number;
  sections: AuditSection[];
  summary: {
    totalTests: number;
    passed: number;
    failed: number;
    warnings: number;
  };
  interactiveContent: {
    found: boolean;
    components: string[];
  };
  hierarchicalNavigation: {
    authenticated: boolean;
    visible: boolean;
    sections: number;
  };
}

class AuthenticatedAuditor {
  private browser!: Browser;
  private report: AuthenticatedAuditReport;
  private startTime: number;

  constructor() {
    this.startTime = Date.now();
    this.report = {
      timestamp: new Date().toISOString(),
      duration: 0,
      sections: [],
      summary: {
        totalTests: 0,
        passed: 0,
        failed: 0,
        warnings: 0
      },
      interactiveContent: {
        found: false,
        components: []
      },
      hierarchicalNavigation: {
        authenticated: false,
        visible: false,
        sections: 0
      }
    };
  }

  async init() {
    console.log('🚀 Launching Puppeteer for authenticated audit...');
    this.browser = await puppeteer.launch({
      headless: false,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
      defaultViewport: { width: 1920, height: 1080 }
    });
  }

  async cleanup() {
    await this.browser.close();
    this.report.duration = Date.now() - this.startTime;
  }

  private addSection(section: AuditSection) {
    this.report.sections.push(section);
    this.report.summary.totalTests++;
    if (section.status === 'pass') this.report.summary.passed++;
    else if (section.status === 'fail') this.report.summary.failed++;
    else if (section.status === 'warning') this.report.summary.warnings++;
  }

  async dismissCookieBanner(page: Page) {
    try {
      await page.waitForSelector('button', { timeout: 3000 });
      const acceptButton = await page.evaluateHandle(() => {
        const buttons = Array.from(document.querySelectorAll('button'));
        return buttons.find(btn => btn.textContent?.includes('Accept All'));
      });
      if (acceptButton) {
        await acceptButton.asElement()?.click();
        await page.waitForFunction(() => !document.querySelector('button')?.textContent?.includes('Accept All'), { timeout: 5000 });
      }
    } catch {
      // Cookie banner might not be present or already dismissed
    }
  }

  async auditInteractiveContent() {
    console.log('\n🎮 Auditing Interactive Content...');
    const page = await this.browser.newPage();
    const errors: string[] = [];
    const details: string[] = [];

    try {
      await page.goto('http://localhost:5173/', { waitUntil: 'networkidle2' });
      await this.dismissCookieBanner(page);

      // Check for InteractiveDemo component
      const interactiveDemo = await page.$('.interactive-demo, [data-testid="interactive-demo"]');
      if (interactiveDemo) {
        details.push('Interactive Demo: ✅ Found');
        this.report.interactiveContent.found = true;
        this.report.interactiveContent.components.push('InteractiveDemo');
      }

      // Check for interactive terms/cards
      const interactiveTerms = await page.evaluate(() => {
        const terms = [];
        // Look for elements with interactive classes or data attributes
        const interactiveElements = document.querySelectorAll('[data-interactive="true"], .interactive-term, .interactive-card');
        interactiveElements.forEach(el => {
          const text = el.textContent || '';
          if (text) terms.push(text.substring(0, 50));
        });
        return terms;
      });

      if (interactiveTerms.length > 0) {
        details.push(`Interactive Terms: ✅ Found ${interactiveTerms.length}`);
        this.report.interactiveContent.components.push(...interactiveTerms);
      } else {
        details.push('Interactive Terms: ❌ Not found');
      }

      // Check for code examples or interactive elements
      const codeBlocks = await page.$$('pre code, .code-block');
      const hasInteractiveCode = codeBlocks.length > 0;
      details.push(`Interactive Code Examples: ${hasInteractiveCode ? '✅' : '❌'}`);

      // Check for clickable demo elements
      const demoElements = await page.evaluate(() => {
        const clickables = document.querySelectorAll('[onclick], [data-demo], .demo-item');
        return clickables.length;
      });
      details.push(`Demo Elements: ${demoElements}`);

      await page.screenshot({ path: 'auth-audit-interactive-content.png', fullPage: true });

      this.addSection({
        name: 'Interactive Content',
        status: this.report.interactiveContent.found ? 'pass' : 'warning',
        details,
        errors,
        screenshots: ['auth-audit-interactive-content.png']
      });

    } catch (error) {
      this.addSection({
        name: 'Interactive Content',
        status: 'fail',
        details: ['Interactive content audit failed'],
        errors: [error instanceof Error ? error.message : String(error)]
      });
    } finally {
      await page.close();
    }
  }

  async loginWithFirebase(page: Page, credentials: typeof TEST_USER) {
    console.log(`\n🔐 Logging in as ${credentials.email}...`);
    
    try {
      // Click sign in button
      const signInButton = await page.evaluateHandle(() => {
        const buttons = Array.from(document.querySelectorAll('button, a'));
        return buttons.find(btn => 
          btn.textContent?.toLowerCase().includes('sign in') || 
          btn.textContent?.toLowerCase().includes('login')
        );
      });

      if (signInButton) {
        await signInButton.asElement()?.click();
        await page.waitForTimeout(2000);
      }

      // Wait for login form
      await page.waitForSelector('input[type="email"]', { timeout: 10000 });
      
      // Fill credentials
      await page.type('input[type="email"]', credentials.email);
      await page.type('input[type="password"]', credentials.password);
      
      // Submit form
      const submitButton = await page.$('button[type="submit"]');
      if (submitButton) {
        await submitButton.click();
        
        // Wait for navigation or auth state change
        await page.waitForFunction(
          () => !document.querySelector('input[type=\"email\"]') || window.location.pathname !== '/login',
          { timeout: 15000 }
        );
        
        console.log('✅ Login successful');
        return true;
      }
    } catch (error) {
      console.error('❌ Login failed:', error);
      return false;
    }
    
    return false;
  }

  async auditAuthenticatedFeatures() {
    console.log('\n🔒 Auditing Authenticated Features...');
    const page = await this.browser.newPage();
    const errors: string[] = [];
    const details: string[] = [];

    try {
      // Navigate to homepage
      await page.goto('http://localhost:5173/', { waitUntil: 'networkidle2' });
      await this.dismissCookieBanner(page);

      // Login with test user
      const loginSuccess = await this.loginWithFirebase(page, TEST_USER);
      if (loginSuccess) {
        details.push('Authentication: ✅ Logged in successfully');
        this.report.hierarchicalNavigation.authenticated = true;

        // Navigate to a term page to check hierarchical navigation
        await page.goto('http://localhost:5173/term/8b5bff9a-afb7-4691-a58e-adc2bf94f941', { 
          waitUntil: 'networkidle2' 
        });

        // Check for hierarchical navigation
        const contentNavHeading = await page.evaluate(() => {
          const headings = Array.from(document.querySelectorAll('h2'));
          return headings.some(h => h.textContent?.includes('Content Navigation'));
        });

        if (contentNavHeading) {
          details.push('Hierarchical Navigation: ✅ Visible when authenticated');
          this.report.hierarchicalNavigation.visible = true;
          
          // Count sections
          const sections = await page.$$('[data-testid="card"] .section-item, .navigation-section');
          this.report.hierarchicalNavigation.sections = sections.length;
          details.push(`Navigation Sections: ${sections.length}`);
          
          await page.screenshot({ path: 'auth-audit-hierarchical-nav-authenticated.png', fullPage: true });
        } else {
          details.push('Hierarchical Navigation: ❌ Not visible even when authenticated');
        }

        // Check for premium features
        const premiumFeatures = await page.evaluate(() => {
          const features = [];
          // Look for elements that should be visible only to authenticated users
          if (document.querySelector('.ai-definition-improver')) features.push('AI Definition Improver');
          if (document.querySelector('.export-button')) features.push('Export Feature');
          if (document.querySelector('.full-definition')) features.push('Full Definitions');
          if (!document.querySelector('.preview-banner')) features.push('No Preview Banner');
          return features;
        });

        if (premiumFeatures.length > 0) {
          details.push(`Premium Features: ✅ ${premiumFeatures.join(', ')}`);
        }

      } else {
        details.push('Authentication: ❌ Login failed');
      }

      this.addSection({
        name: 'Authenticated Features',
        status: loginSuccess && this.report.hierarchicalNavigation.visible ? 'pass' : 'fail',
        details,
        errors,
        screenshots: ['auth-audit-hierarchical-nav-authenticated.png']
      });

    } catch (error) {
      this.addSection({
        name: 'Authenticated Features',
        status: 'fail',
        details: ['Authenticated features audit failed'],
        errors: [error instanceof Error ? error.message : String(error)]
      });
    } finally {
      await page.close();
    }
  }

  async auditAdminFeatures() {
    console.log('\n👮 Auditing Admin Features...');
    const page = await this.browser.newPage();
    const errors: string[] = [];
    const details: string[] = [];

    try {
      await page.goto('http://localhost:5173/', { waitUntil: 'networkidle2' });
      await this.dismissCookieBanner(page);

      // Login as admin
      const loginSuccess = await this.loginWithFirebase(page, ADMIN_USER);
      if (loginSuccess) {
        details.push('Admin Authentication: ✅ Logged in as admin');

        // Check for admin menu/dashboard link
        const adminLink = await page.evaluate(() => {
          const links = Array.from(document.querySelectorAll('a, button'));
          return links.some(link => 
            link.textContent?.toLowerCase().includes('admin') || 
            link.getAttribute('href')?.includes('/admin')
          );
        });

        if (adminLink) {
          details.push('Admin Dashboard Link: ✅ Found');
          
          // Navigate to admin dashboard
          await page.goto('http://localhost:5173/admin', { waitUntil: 'networkidle2' });
          
          // Check admin features
          const adminFeatures = await page.evaluate(() => {
            const features = [];
            if (document.querySelector('[data-testid="user-management"]')) features.push('User Management');
            if (document.querySelector('[data-testid="content-management"]')) features.push('Content Management');
            if (document.querySelector('[data-testid="analytics"]')) features.push('Analytics');
            if (document.querySelector('.admin-panel')) features.push('Admin Panel');
            return features;
          });

          if (adminFeatures.length > 0) {
            details.push(`Admin Features: ✅ ${adminFeatures.join(', ')}`);
          } else {
            details.push('Admin Features: ⚠️ No specific admin features found');
          }
          
          await page.screenshot({ path: 'auth-audit-admin-dashboard.png', fullPage: true });
        } else {
          details.push('Admin Dashboard Link: ❌ Not found');
        }
      } else {
        details.push('Admin Authentication: ❌ Login failed');
      }

      this.addSection({
        name: 'Admin Features',
        status: loginSuccess ? 'pass' : 'fail',
        details,
        errors,
        screenshots: ['auth-audit-admin-dashboard.png']
      });

    } catch (error) {
      this.addSection({
        name: 'Admin Features',
        status: 'fail',
        details: ['Admin features audit failed'],
        errors: [error instanceof Error ? error.message : String(error)]
      });
    } finally {
      await page.close();
    }
  }

  async auditUserFlows() {
    console.log('\n🚶 Auditing Complete User Flows...');
    const page = await this.browser.newPage();
    const errors: string[] = [];
    const details: string[] = [];

    try {
      // Test complete user journey
      await page.goto('http://localhost:5173/', { waitUntil: 'networkidle2' });
      await this.dismissCookieBanner(page);

      // 1. Browse as guest
      details.push('1. Guest Browsing:');
      const categoryCards = await page.$$('[data-testid="category-card"]');
      details.push(`   - Category cards: ${categoryCards.length}`);
      
      if (categoryCards.length > 0) {
        await categoryCards[0].click();
        await page.waitForNavigation();
        details.push('   - Category navigation: ✅');
      }

      // 2. Search functionality
      await page.goto('http://localhost:5173/', { waitUntil: 'networkidle2' });
      const searchInput = await page.$('input[placeholder*="Search"]');
      if (searchInput) {
        await searchInput.type('neural network');
        await page.keyboard.press('Enter');
        await page.waitForTimeout(2000);
        const results = await page.$$('[data-testid="term-card"]');
        details.push(`2. Search Flow: ✅ Found ${results.length} results`);
      }

      // 3. Login and view premium content
      await page.goto('http://localhost:5173/', { waitUntil: 'networkidle2' });
      const loginSuccess = await this.loginWithFirebase(page, TEST_USER);
      if (loginSuccess) {
        details.push('3. Login Flow: ✅');
        
        // Navigate to a term
        await page.goto('http://localhost:5173/term/8b5bff9a-afb7-4691-a58e-adc2bf94f941');
        await page.waitForTimeout(2000);
        
        // Check for full content
        const hasFullContent = await page.evaluate(() => {
          const content = document.body.textContent || '';
          return !content.includes('Sign in to view full definition');
        });
        details.push(`4. Premium Content Access: ${hasFullContent ? '✅' : '❌'}`);
      }

      // 4. Test logout
      const logoutButton = await page.evaluateHandle(() => {
        const buttons = Array.from(document.querySelectorAll('button, a'));
        return buttons.find(btn => btn.textContent?.toLowerCase().includes('logout'));
      });
      
      if (logoutButton) {
        await logoutButton.asElement()?.click();
        await page.waitForTimeout(2000);
        details.push('5. Logout Flow: ✅');
      }

      await page.screenshot({ path: 'auth-audit-user-flows.png', fullPage: true });

      this.addSection({
        name: 'Complete User Flows',
        status: details.filter(d => d.includes('✅')).length > 3 ? 'pass' : 'warning',
        details,
        errors,
        screenshots: ['auth-audit-user-flows.png']
      });

    } catch (error) {
      this.addSection({
        name: 'Complete User Flows',
        status: 'fail',
        details: ['User flow audit failed'],
        errors: [error instanceof Error ? error.message : String(error)]
      });
    } finally {
      await page.close();
    }
  }

  async generateMarkdownReport() {
    const reportPath = 'AUTHENTICATED_AUDIT_REPORT.md';
    
    const markdown = `# 🔐 Authenticated Comprehensive Audit Report

Generated: ${new Date(this.report.timestamp).toLocaleString()}
Duration: ${(this.report.duration / 1000).toFixed(2)}s

## 📊 Executive Summary

| Metric | Result |
|--------|--------|
| Total Tests | ${this.report.summary.totalTests} |
| Passed | ${this.report.summary.passed} |
| Failed | ${this.report.summary.failed} |
| Warnings | ${this.report.summary.warnings} |

## 🎮 Interactive Content

**Status**: ${this.report.interactiveContent.found ? '✅ Found' : '❌ Not Found'}
**Components**: ${this.report.interactiveContent.components.length}
${this.report.interactiveContent.components.map(c => `- ${c}`).join('\n')}

## 🗂️ Hierarchical Navigation

| Aspect | Status |
|--------|--------|
| Authenticated | ${this.report.hierarchicalNavigation.authenticated ? '✅' : '❌'} |
| Visible | ${this.report.hierarchicalNavigation.visible ? '✅' : '❌'} |
| Sections | ${this.report.hierarchicalNavigation.sections} |

## 📋 Detailed Test Results

${this.report.sections.map(section => {
  const icon = section.status === 'pass' ? '✅' : section.status === 'fail' ? '❌' : '⚠️';
  return `### ${icon} ${section.name}

**Status**: ${section.status.toUpperCase()}

**Details**:
${section.details.map(d => `- ${d}`).join('\n')}

${section.errors && section.errors.length > 0 ? `**Errors**:\n${section.errors.map(e => `- ${e}`).join('\n')}` : ''}

${section.screenshots && section.screenshots.length > 0 ? `**Screenshots**: ${section.screenshots.join(', ')}` : ''}
`;
}).join('\n---\n\n')}

## 🔍 Key Findings

1. **Authentication**: Firebase authentication is ${this.report.hierarchicalNavigation.authenticated ? 'working correctly' : 'not functioning properly'}
2. **Hierarchical Navigation**: ${this.report.hierarchicalNavigation.visible ? 'Displays correctly when authenticated' : 'Not visible even when authenticated'}
3. **Interactive Content**: ${this.report.interactiveContent.found ? 'Found on landing page' : 'Not found on landing page'}
4. **User Flows**: Complete user journey from guest to authenticated user ${this.report.summary.passed > this.report.summary.failed ? 'works well' : 'has issues'}

## 📸 Generated Screenshots

- \`auth-audit-interactive-content.png\` - Landing page interactive elements
- \`auth-audit-hierarchical-nav-authenticated.png\` - Authenticated term page with navigation
- \`auth-audit-admin-dashboard.png\` - Admin dashboard access
- \`auth-audit-user-flows.png\` - Complete user journey

## 🚀 Recommendations

1. ${this.report.hierarchicalNavigation.visible ? 'Hierarchical navigation is working correctly' : 'Fix hierarchical navigation visibility for authenticated users'}
2. ${this.report.interactiveContent.found ? 'Continue enhancing interactive content' : 'Add interactive demo content to landing page'}
3. Ensure all premium features are properly gated behind authentication
4. Test with more diverse user scenarios and edge cases

## 🔐 Test Credentials Used

- **Regular User**: test@aimlglossary.com / testpass123
- **Admin User**: admin@aimlglossary.com / adminpass123

---
*Report generated by authenticated-comprehensive-audit.ts*`;

    writeFileSync(reportPath, markdown);
    console.log(`\n💾 Markdown report saved to: ${reportPath}`);
    
    // Also save JSON version
    writeFileSync('authenticated-audit-report.json', JSON.stringify(this.report, null, 2));
    
    return markdown;
  }

  async runAuthenticatedAudit() {
    await this.init();
    
    try {
      await this.auditInteractiveContent();
      await this.auditAuthenticatedFeatures();
      await this.auditAdminFeatures();
      await this.auditUserFlows();
    } finally {
      await this.cleanup();
    }
    
    const report = await this.generateMarkdownReport();
    console.log('\n' + '='.repeat(60));
    console.log('🔐 AUTHENTICATED AUDIT COMPLETE');
    console.log('='.repeat(60));
    console.log(report.split('\n').slice(0, 30).join('\n'));
    console.log('\n... (see full report in AUTHENTICATED_AUDIT_REPORT.md)');
  }
}

// Run the audit
const auditor = new AuthenticatedAuditor();
auditor.runAuthenticatedAudit().catch(console.error);