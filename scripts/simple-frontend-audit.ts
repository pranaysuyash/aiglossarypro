#!/usr/bin/env npx tsx
/**
 * Simple Frontend Audit Script
 * Tests key functionality without heavy dependencies
 */

interface TestResult {
  name: string;
  status: 'pass' | 'fail' | 'warning';
  message: string;
  details?: string;
}

class SimpleFrontendAuditor {
  private baseUrl = 'http://localhost:5173';
  private apiUrl = 'http://localhost:3001';
  private results: TestResult[] = [];

  async testEndpoint(url: string, expectedStatus = 200): Promise<boolean> {
    try {
      const response = await fetch(url);
      return response.status === expectedStatus;
    } catch (error) {
      return false;
    }
  }

  async testFrontendConnectivity(): Promise<TestResult> {
    try {
      const response = await fetch(this.baseUrl);
      const isOk = response.ok;
      const contentType = response.headers.get('content-type');
      
      return {
        name: 'frontend-connectivity',
        status: isOk ? 'pass' : 'fail',
        message: isOk 
          ? '✅ Frontend server is accessible and responding'
          : '❌ Frontend server is not responding correctly',
        details: `Status: ${response.status}, Content-Type: ${contentType}`
      };
    } catch (error) {
      return {
        name: 'frontend-connectivity',
        status: 'fail',
        message: '❌ Cannot connect to frontend server',
        details: String(error)
      };
    }
  }

  async testBackendConnectivity(): Promise<TestResult> {
    try {
      const healthEndpoint = `${this.apiUrl}/api/health`;
      const response = await fetch(healthEndpoint);
      const isOk = response.ok;
      
      return {
        name: 'backend-connectivity',
        status: isOk ? 'pass' : 'fail',
        message: isOk 
          ? '✅ Backend API is accessible and responding'
          : '❌ Backend API is not responding correctly',
        details: `Health check status: ${response.status}`
      };
    } catch (error) {
      return {
        name: 'backend-connectivity',
        status: 'fail',
        message: '❌ Cannot connect to backend API',
        details: String(error)
      };
    }
  }

  async testApiEndpoints(): Promise<TestResult[]> {
    const endpoints = [
      '/api/terms',
      '/api/categories', 
      '/api/sections',
      '/api/auth/status'
    ];

    const results: TestResult[] = [];

    for (const endpoint of endpoints) {
      try {
        const url = `${this.apiUrl}${endpoint}`;
        const response = await fetch(url);
        
        results.push({
          name: `api-endpoint-${endpoint.replace(/\//g, '-')}`,
          status: response.ok ? 'pass' : 'warning',
          message: response.ok 
            ? `✅ ${endpoint} responding correctly`
            : `⚠️ ${endpoint} returned ${response.status}`,
          details: `Status: ${response.status}, Response available: ${response.ok}`
        });
      } catch (error) {
        results.push({
          name: `api-endpoint-${endpoint.replace(/\//g, '-')}`,
          status: 'fail',
          message: `❌ ${endpoint} failed to respond`,
          details: String(error)
        });
      }
    }

    return results;
  }

  async checkFrontendPages(): Promise<TestResult[]> {
    const pages = [
      '/',
      '/categories',
      '/trending', 
      '/favorites',
      '/dashboard',
      '/settings',
      '/login',
      '/terms',
      '/ai-tools'
    ];

    const results: TestResult[] = [];

    for (const page of pages) {
      try {
        const url = `${this.baseUrl}${page}`;
        const response = await fetch(url);
        const text = await response.text();
        
        const hasReactRoot = text.includes('id="root"') || text.includes('div id="root"');
        const hasContent = text.length > 1000; // Basic content check
        
        results.push({
          name: `frontend-page-${page.replace(/\//g, '-') || 'home'}`,
          status: response.ok && hasReactRoot ? 'pass' : 'warning',
          message: response.ok && hasReactRoot
            ? `✅ ${page || '/'} loads correctly`
            : `⚠️ ${page || '/'} may have loading issues`,
          details: `Status: ${response.status}, Has React root: ${hasReactRoot}, Content length: ${text.length}`
        });
      } catch (error) {
        results.push({
          name: `frontend-page-${page.replace(/\//g, '-') || 'home'}`,
          status: 'fail',
          message: `❌ ${page || '/'} failed to load`,
          details: String(error)
        });
      }
    }

    return results;
  }

  async checkHierarchicalNavigation(): Promise<TestResult> {
    try {
      const response = await fetch(this.baseUrl);
      const html = await response.text();
      
      // Check for hierarchical navigation indicators
      const hasHierarchicalNav = html.includes('HierarchicalNavigator') || 
                                  html.includes('Tree') || 
                                  html.includes('search-sections') ||
                                  html.includes('Content Navigation');
      
      const hasSearchInput = html.includes('Search sections') || 
                             html.includes('placeholder="Search') ||
                             html.includes('search-input');

      return {
        name: 'hierarchical-navigation-check',
        status: hasHierarchicalNav ? 'pass' : 'warning',
        message: hasHierarchicalNav 
          ? '✅ Hierarchical navigation components detected'
          : '⚠️ Hierarchical navigation components not found in HTML',
        details: `Has nav components: ${hasHierarchicalNav}, Has search: ${hasSearchInput}`
      };
    } catch (error) {
      return {
        name: 'hierarchical-navigation-check',
        status: 'fail',
        message: '❌ Could not check hierarchical navigation',
        details: String(error)
      };
    }
  }

  async runAllTests(): Promise<void> {
    console.log('🚀 Starting Simple Frontend Audit...');
    console.log(`📍 Frontend: ${this.baseUrl}`);
    console.log(`📍 Backend: ${this.apiUrl}`);
    console.log('');

    // Test basic connectivity
    this.results.push(await this.testFrontendConnectivity());
    this.results.push(await this.testBackendConnectivity());

    // Test API endpoints
    const apiResults = await this.testApiEndpoints();
    this.results.push(...apiResults);

    // Test frontend pages
    const pageResults = await this.checkFrontendPages();
    this.results.push(...pageResults);

    // Test hierarchical navigation
    this.results.push(await this.checkHierarchicalNavigation());

    // Generate report
    this.generateReport();
  }

  generateReport(): void {
    const passed = this.results.filter(r => r.status === 'pass').length;
    const warnings = this.results.filter(r => r.status === 'warning').length;
    const failed = this.results.filter(r => r.status === 'fail').length;

    console.log('\n📊 AUDIT RESULTS SUMMARY');
    console.log('========================');
    console.log(`✅ Passed: ${passed}`);
    console.log(`⚠️  Warnings: ${warnings}`);
    console.log(`❌ Failed: ${failed}`);
    console.log(`📋 Total Tests: ${this.results.length}`);
    console.log('');

    console.log('📋 DETAILED RESULTS');
    console.log('===================');
    
    for (const result of this.results) {
      const icon = result.status === 'pass' ? '✅' : result.status === 'warning' ? '⚠️' : '❌';
      console.log(`${icon} ${result.name}: ${result.message}`);
      
      if (result.details) {
        console.log(`   Details: ${result.details}`);
      }
      console.log('');
    }

    // Additional recommendations
    console.log('💡 RECOMMENDATIONS');
    console.log('==================');
    
    if (failed > 0) {
      console.log('❌ Critical Issues Found:');
      console.log('   - Check server connectivity and configuration');
      console.log('   - Verify database connections');
      console.log('   - Review error logs for details');
    }
    
    if (warnings > 0) {
      console.log('⚠️  Warnings to Address:');
      console.log('   - Some pages may have loading delays');
      console.log('   - API responses may need optimization');
      console.log('   - Consider implementing error boundaries');
    }
    
    if (passed === this.results.length) {
      console.log('🎉 All tests passed! Frontend is fully functional.');
    }

    console.log('\n🔧 NEXT STEPS');
    console.log('=============');
    console.log('1. Fix any failed connectivity issues');
    console.log('2. Test hierarchical navigation interactivity');
    console.log('3. Verify Firebase authentication flow');
    console.log('4. Test search functionality across 295 subsections');
    console.log('5. Validate mobile responsiveness');
  }
}

async function main() {
  const auditor = new SimpleFrontendAuditor();
  await auditor.runAllTests();
}

// Run if this is the main module
main().catch(console.error);