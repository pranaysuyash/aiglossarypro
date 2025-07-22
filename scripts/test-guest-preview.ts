#!/usr/bin/env ts-node

/**
 * Test script for guest preview functionality
 *
 * This script tests the complete guest-to-premium conversion funnel:
 * 1. Guest visits site
 * 2. Views 1-50 terms in preview mode
 * 3. Hits preview limit
 * 4. Sees conversion prompts
 * 5. Signs up for free account
 * 6. (Optional) Upgrades to premium
 */

import fetch from 'node-fetch';

interface TestResult {
  step: string;
  success: boolean;
  message: string;
  data?: any;
}

class GuestPreviewTester {
  private baseUrl: string;
  private sessionId: string;
  private results: TestResult[] = [];

  constructor(baseUrl = 'http://localhost:5000') {
    this.baseUrl = baseUrl;
    this.sessionId = `test_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private async makeRequest(endpoint: string, options: RequestInit = {}): Promise<any> {
    const url = `${this.baseUrl}${endpoint}`;
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'X-Guest-Session-ID': this.sessionId,
        ...options.headers,
      },
    });

    const data = await response.json();
    return { status: response.status, data };
  }

  private addResult(step: string, success: boolean, message: string, data?: any) {
    this.results.push({ step, success, message, data });
    const status = success ? '✅' : '❌';
    console.log(`${status} ${step}: ${message}`);
    if (data && !success) {
      console.log('   Data:', JSON.stringify(data, null, 2));
    }
  }

  async testServerHealth(): Promise<boolean> {
    try {
      const result = await this.makeRequest('/api/health');

      if (result.status === 200 && result.data.success) {
        this.addResult('Server Health', true, 'Server is running and healthy');
        return true;
      } else {
        this.addResult('Server Health', false, 'Server health check failed', result.data);
        return false;
      }
    } catch (error) {
      this.addResult('Server Health', false, `Server unreachable: ${error.message}`);
      return false;
    }
  }

  async testGuestSessionCreation(): Promise<boolean> {
    try {
      const result = await this.makeRequest('/api/guest/session-status');

      if (result.status === 200 && result.data.success) {
        this.addResult('Guest Session', true, 'Guest session created successfully');
        return true;
      } else {
        this.addResult('Guest Session', false, 'Failed to create guest session', result.data);
        return false;
      }
    } catch (error) {
      this.addResult('Guest Session', false, `Session creation failed: ${error.message}`);
      return false;
    }
  }

  async testFirstTermPreview(): Promise<boolean> {
    try {
      // Try to get a list of terms first
      const termsResult = await this.makeRequest('/api/terms?limit=1');

      if (termsResult.status !== 200 || !termsResult.data.data?.length) {
        this.addResult('First Preview', false, 'No terms available for testing');
        return false;
      }

      const termId = termsResult.data.data[0].id;
      const result = await this.makeRequest(`/api/terms/${termId}/preview`);

      if (result.status === 200 && result.data.success) {
        this.addResult('First Preview', true, `Successfully previewed term: ${termId}`);
        return true;
      } else {
        this.addResult('First Preview', false, 'Failed to preview first term', result.data);
        return false;
      }
    } catch (error) {
      this.addResult('First Preview', false, `First preview failed: ${error.message}`);
      return false;
    }
  }

  async testSecondTermPreview(): Promise<boolean> {
    try {
      // Get a different term for the second preview
      const termsResult = await this.makeRequest('/api/terms?limit=2&offset=1');

      if (termsResult.status !== 200 || !termsResult.data.data?.length) {
        this.addResult('Second Preview', false, 'No second term available for testing');
        return false;
      }

      const termId = termsResult.data.data[0].id;
      const result = await this.makeRequest(`/api/terms/${termId}/preview`);

      if (result.status === 200 && result.data.success) {
        this.addResult('Second Preview', true, `Successfully previewed second term: ${termId}`);
        return true;
      } else {
        this.addResult('Second Preview', false, 'Failed to preview second term', result.data);
        return false;
      }
    } catch (error) {
      this.addResult('Second Preview', false, `Second preview failed: ${error.message}`);
      return false;
    }
  }

  async testPreviewLimitReached(): Promise<boolean> {
    try {
      // Try to preview a third term - should be blocked
      const termsResult = await this.makeRequest('/api/terms?limit=1&offset=2');

      if (termsResult.status !== 200 || !termsResult.data.data?.length) {
        this.addResult('Limit Test', false, 'No third term available for testing');
        return false;
      }

      const termId = termsResult.data.data[0].id;
      const result = await this.makeRequest(`/api/terms/${termId}/preview`);

      if (result.status === 403 && result.data.previewLimitReached) {
        this.addResult('Limit Test', true, 'Preview limit correctly enforced');
        return true;
      } else {
        this.addResult('Limit Test', false, 'Preview limit not enforced properly', result.data);
        return false;
      }
    } catch (error) {
      this.addResult('Limit Test', false, `Limit test failed: ${error.message}`);
      return false;
    }
  }

  async testGuestSessionStats(): Promise<boolean> {
    try {
      const result = await this.makeRequest('/api/guest/session-status');

      if (result.status === 200 && result.data.success) {
        const stats = result.data.data;

        if (stats.previewsUsed === 50 && stats.previewsRemaining === 0) {
          this.addResult('Session Stats', true, 'Guest session stats are correct');
          return true;
        } else {
          this.addResult('Session Stats', false, 'Session stats are incorrect', stats);
          return false;
        }
      } else {
        this.addResult('Session Stats', false, 'Failed to get session stats', result.data);
        return false;
      }
    } catch (error) {
      this.addResult('Session Stats', false, `Session stats test failed: ${error.message}`);
      return false;
    }
  }

  async testGuestSearchPreview(): Promise<boolean> {
    try {
      const result = await this.makeRequest('/api/search/preview?q=machine+learning');

      if (result.status === 200 && result.data.success) {
        this.addResult('Search Preview', true, 'Guest search preview works');
        return true;
      } else {
        this.addResult('Search Preview', false, 'Guest search preview failed', result.data);
        return false;
      }
    } catch (error) {
      this.addResult('Search Preview', false, `Search preview failed: ${error.message}`);
      return false;
    }
  }

  async testCategoriesPreview(): Promise<boolean> {
    try {
      const result = await this.makeRequest('/api/categories/preview');

      if (result.status === 200 && result.data.success) {
        this.addResult('Categories Preview', true, 'Guest categories preview works');
        return true;
      } else {
        this.addResult('Categories Preview', false, 'Guest categories preview failed', result.data);
        return false;
      }
    } catch (error) {
      this.addResult('Categories Preview', false, `Categories preview failed: ${error.message}`);
      return false;
    }
  }

  async runAllTests(): Promise<void> {
    console.log('🧪 Starting Guest Preview Functionality Tests');
    console.log('='.repeat(50));
    console.log(`Session ID: ${this.sessionId}`);
    console.log(`Base URL: ${this.baseUrl}`);
    console.log('');

    // Run tests in sequence
    const tests = [
      () => this.testServerHealth(),
      () => this.testGuestSessionCreation(),
      () => this.testFirstTermPreview(),
      () => this.testSecondTermPreview(),
      () => this.testPreviewLimitReached(),
      () => this.testGuestSessionStats(),
      () => this.testGuestSearchPreview(),
      () => this.testCategoriesPreview(),
    ];

    for (const test of tests) {
      const success = await test();
      if (!success) {
        console.log('\n❌ Test failed, stopping execution');
        break;
      }
      await new Promise(resolve => setTimeout(resolve, 100)); // Small delay between tests
    }

    this.printSummary();
  }

  private printSummary(): void {
    console.log('\n' + '='.repeat(50));
    console.log('📊 Test Summary');
    console.log('='.repeat(50));

    const passed = this.results.filter(r => r.success).length;
    const total = this.results.length;
    const passRate = ((passed / total) * 100).toFixed(1);

    console.log(`Passed: ${passed}/${total} (${passRate}%)`);

    if (passed === total) {
      console.log('\n🎉 All tests passed! Guest preview functionality is working correctly.');
      console.log('\nNext steps to test manually:');
      console.log('1. Visit a term page while unauthenticated');
      console.log('2. Verify preview content is shown');
      console.log('3. Check preview limit enforcement');
      console.log('4. Test conversion CTAs and tracking');
      console.log('5. Verify signup flow integration');
    } else {
      console.log('\n⚠️  Some tests failed. Please check the implementation.');

      const failed = this.results.filter(r => !r.success);
      console.log('\nFailed tests:');
      failed.forEach(result => {
        console.log(`- ${result.step}: ${result.message}`);
      });
    }
  }
}

// Run tests if this script is executed directly
if (require.main === module) {
  const tester = new GuestPreviewTester();

  tester.runAllTests().catch(error => {
    console.error('Test execution failed:', error);
    process.exit(1);
  });
}

export { GuestPreviewTester };
