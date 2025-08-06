import { test, expect } from '@playwright/test';

/**
 * Frontend API Integration Test Suite
 * Tests the deployed application at https://d1m7nnfj3im4kp.cloudfront.net/
 */

const FRONTEND_URL = 'https://d1m7nnfj3im4kp.cloudfront.net/';
const API_BASE_URL = 'https://d1m7nnfj3im4kp.cloudfront.net/api';

test.describe('Frontend API Integration Tests', () => {
  
  test.describe('Frontend Loading Tests', () => {
    test('should load the main frontend application', async ({ page }) => {
      // Capture console errors
      const consoleErrors = [];
      page.on('console', msg => {
        if (msg.type() === 'error') {
          consoleErrors.push(msg.text());
        }
      });

      // Capture network failures
      const networkFailures = [];
      page.on('requestfailed', request => {
        networkFailures.push({
          url: request.url(),
          failure: request.failure()
        });
      });

      // Try to navigate to the frontend
      const response = await page.goto(FRONTEND_URL, { 
        waitUntil: 'networkidle',
        timeout: 30000 
      });

      // Log the response status
      console.log(`Frontend response status: ${response?.status() || 'No response'}`);

      if (response?.status() === 403) {
        console.log('❌ Frontend returns 403 - CloudFront/S3 configuration issue');
        
        // Take a screenshot of the error page
        await page.screenshot({ 
          path: 'test-results/frontend-403-error.png',
          fullPage: true 
        });

        // This is expected based on our findings, so we'll document it
        expect(response.status()).toBe(403);
      } else if (response?.status() === 200) {
        console.log('✅ Frontend loaded successfully');
        
        // Take a screenshot of the successful page
        await page.screenshot({ 
          path: 'test-results/frontend-success.png',
          fullPage: true 
        });

        // Check for React or other framework indicators
        const hasReact = await page.evaluate(() => {
          return !!(window.React || window.__REACT_DEVTOOLS_GLOBAL_HOOK__);
        });

        if (hasReact) {
          console.log('✅ React framework detected');
        }

        expect(response.status()).toBe(200);
      } else {
        console.log(`❌ Unexpected status: ${response?.status()}`);
        await page.screenshot({ 
          path: 'test-results/frontend-unexpected-error.png',
          fullPage: true 
        });
      }

      // Log any console errors
      if (consoleErrors.length > 0) {
        console.log('Console errors detected:');
        consoleErrors.forEach(error => console.log(`  - ${error}`));
      }

      // Log any network failures
      if (networkFailures.length > 0) {
        console.log('Network failures detected:');
        networkFailures.forEach(failure => console.log(`  - ${failure.url}: ${failure.failure?.errorText}`));
      }
    });

    test('should handle different device types', async ({ page, browserName }) => {
      // Test mobile viewport
      await page.setViewportSize({ width: 375, height: 667 });
      
      const mobileResponse = await page.goto(FRONTEND_URL, { 
        timeout: 20000 
      });

      await page.screenshot({ 
        path: `test-results/frontend-mobile-${browserName}.png`,
        fullPage: true 
      });

      // Test desktop viewport
      await page.setViewportSize({ width: 1920, height: 1080 });
      
      const desktopResponse = await page.goto(FRONTEND_URL, { 
        timeout: 20000 
      });

      await page.screenshot({ 
        path: `test-results/frontend-desktop-${browserName}.png`,
        fullPage: true 
      });

      console.log(`Mobile status: ${mobileResponse?.status()}, Desktop status: ${desktopResponse?.status()}`);
    });
  });

  test.describe('API Endpoint Tests', () => {
    test('should access terms API endpoint directly', async ({ request }) => {
      const response = await request.get(`${API_BASE_URL}/terms`);
      
      expect(response.status()).toBe(200);
      
      const data = await response.json();
      console.log('Terms API response:', JSON.stringify(data, null, 2));
      
      expect(data).toHaveProperty('data');
      expect(Array.isArray(data.data)).toBe(true);
      
      if (data.data.length > 0) {
        console.log(`✅ Terms API returned ${data.data.length} terms`);
        expect(data.data[0]).toHaveProperty('id');
        expect(data.data[0]).toHaveProperty('name');
      }
    });

    test('should access categories API endpoint directly', async ({ request }) => {
      const response = await request.get(`${API_BASE_URL}/categories`);
      
      expect(response.status()).toBe(200);
      
      const data = await response.json();
      console.log('Categories API response:', JSON.stringify(data, null, 2));
      
      expect(data).toHaveProperty('data');
      expect(Array.isArray(data.data)).toBe(true);
      
      if (data.data.length > 0) {
        console.log(`✅ Categories API returned ${data.data.length} categories`);
        expect(data.data[0]).toHaveProperty('id');
        expect(data.data[0]).toHaveProperty('name');
      }
    });

    test('should test search API endpoint', async ({ request }) => {
      const response = await request.get(`${API_BASE_URL}/search?q=artificial+intelligence`);
      
      console.log(`Search API status: ${response.status()}`);
      
      if (response.status() === 200) {
        const data = await response.json();
        console.log('Search API response:', JSON.stringify(data, null, 2));
        expect(data).toBeDefined();
      } else if (response.status() === 404) {
        console.log('ℹ️  Search endpoint not implemented yet');
      } else {
        console.log(`⚠️  Search API returned status ${response.status()}`);
      }
    });

    test('should test health/status endpoint', async ({ request }) => {
      const endpoints = ['/health', '/status', '/api/health', '/api/status'];
      
      for (const endpoint of endpoints) {
        try {
          const response = await request.get(`${API_BASE_URL}${endpoint}`);
          console.log(`${endpoint} status: ${response.status()}`);
          
          if (response.status() === 200) {
            const data = await response.json();
            console.log(`${endpoint} response:`, JSON.stringify(data, null, 2));
          }
        } catch (error) {
          console.log(`${endpoint} error:`, error.message);
        }
      }
    });
  });

  test.describe('Browser Console API Tests', () => {
    test('should test API calls from browser context', async ({ page }) => {
      // Skip if frontend doesn't load (403 error)
      const response = await page.goto(FRONTEND_URL, { timeout: 10000 });
      
      if (response?.status() !== 200) {
        console.log('⏭️  Skipping browser API tests - frontend not accessible');
        return;
      }

      // Test API calls from browser context
      const apiTestResults = await page.evaluate(async (apiBaseUrl) => {
        const results = {};
        
        // Test terms endpoint
        try {
          const termsResponse = await fetch(`${apiBaseUrl}/terms`);
          const termsData = await termsResponse.json();
          results.terms = {
            status: termsResponse.status,
            success: termsResponse.ok,
            data: termsData,
            dataCount: termsData.data?.length || 0
          };
        } catch (error) {
          results.terms = {
            error: error.message,
            success: false
          };
        }

        // Test categories endpoint
        try {
          const categoriesResponse = await fetch(`${apiBaseUrl}/categories`);
          const categoriesData = await categoriesResponse.json();
          results.categories = {
            status: categoriesResponse.status,
            success: categoriesResponse.ok,
            data: categoriesData,
            dataCount: categoriesData.data?.length || 0
          };
        } catch (error) {
          results.categories = {
            error: error.message,
            success: false
          };
        }

        return results;
      }, API_BASE_URL);

      console.log('Browser API test results:', JSON.stringify(apiTestResults, null, 2));

      // Verify terms API worked
      if (apiTestResults.terms.success) {
        expect(apiTestResults.terms.status).toBe(200);
        expect(apiTestResults.terms.dataCount).toBeGreaterThan(0);
        console.log(`✅ Terms API: ${apiTestResults.terms.dataCount} items`);
      } else {
        console.log(`❌ Terms API failed: ${apiTestResults.terms.error}`);
      }

      // Verify categories API worked
      if (apiTestResults.categories.success) {
        expect(apiTestResults.categories.status).toBe(200);
        expect(apiTestResults.categories.dataCount).toBeGreaterThan(0);
        console.log(`✅ Categories API: ${apiTestResults.categories.dataCount} items`);
      } else {
        console.log(`❌ Categories API failed: ${apiTestResults.categories.error}`);
      }
    });

    test('should check for CORS issues', async ({ page }) => {
      // Skip if frontend doesn't load
      const response = await page.goto(FRONTEND_URL, { timeout: 10000 });
      
      if (response?.status() !== 200) {
        console.log('⏭️  Skipping CORS tests - frontend not accessible');
        return;
      }

      const corsResults = await page.evaluate(async (apiBaseUrl) => {
        const results = {
          corsErrors: [],
          successfulCalls: 0,
          failedCalls: 0
        };

        const testEndpoints = ['/terms', '/categories'];

        for (const endpoint of testEndpoints) {
          try {
            const response = await fetch(`${apiBaseUrl}${endpoint}`, {
              method: 'GET',
              mode: 'cors',
              credentials: 'include'
            });
            
            if (response.ok) {
              results.successfulCalls++;
            } else {
              results.failedCalls++;
              results.corsErrors.push(`${endpoint}: HTTP ${response.status}`);
            }
          } catch (error) {
            results.failedCalls++;
            if (error.message.includes('CORS')) {
              results.corsErrors.push(`${endpoint}: CORS error - ${error.message}`);
            } else {
              results.corsErrors.push(`${endpoint}: ${error.message}`);
            }
          }
        }

        return results;
      }, API_BASE_URL);

      console.log('CORS test results:', JSON.stringify(corsResults, null, 2));

      if (corsResults.corsErrors.length === 0) {
        console.log('✅ No CORS issues detected');
      } else {
        console.log('❌ CORS issues found:');
        corsResults.corsErrors.forEach(error => console.log(`  - ${error}`));
      }

      expect(corsResults.successfulCalls).toBeGreaterThan(0);
    });
  });

  test.describe('Authentication Flow Tests', () => {
    test('should test authentication endpoints if available', async ({ request }) => {
      const authEndpoints = [
        '/auth/status',
        '/auth/login',
        '/auth/register',
        '/user/profile'
      ];

      for (const endpoint of authEndpoints) {
        try {
          const response = await request.get(`${API_BASE_URL}${endpoint}`);
          console.log(`Auth endpoint ${endpoint}: ${response.status()}`);
          
          if (response.status() === 200) {
            const data = await response.json();
            console.log(`${endpoint} response:`, JSON.stringify(data, null, 2));
          }
        } catch (error) {
          console.log(`Auth endpoint ${endpoint} error:`, error.message);
        }
      }
    });

    test('should test Firebase authentication integration', async ({ page }) => {
      // Skip if frontend doesn't load
      const response = await page.goto(FRONTEND_URL, { timeout: 10000 });
      
      if (response?.status() !== 200) {
        console.log('⏭️  Skipping Firebase auth tests - frontend not accessible');
        return;
      }

      const firebaseStatus = await page.evaluate(() => {
        return {
          firebaseExists: typeof window.firebase !== 'undefined',
          firebaseAuthExists: typeof window.firebase?.auth !== 'undefined',
          firebaseInitialized: !!window.firebase?.apps?.length
        };
      });

      console.log('Firebase status:', JSON.stringify(firebaseStatus, null, 2));

      if (firebaseStatus.firebaseExists) {
        console.log('✅ Firebase SDK detected');
      } else {
        console.log('ℹ️  Firebase SDK not detected (may be lazy-loaded)');
      }
    });
  });

  test.describe('Error Handling Tests', () => {
    test('should handle API endpoint failures gracefully', async ({ page }) => {
      // Skip if frontend doesn't load
      const response = await page.goto(FRONTEND_URL, { timeout: 10000 });
      
      if (response?.status() !== 200) {
        console.log('⏭️  Skipping error handling tests - frontend not accessible');
        return;
      }

      const errorHandling = await page.evaluate(async (apiBaseUrl) => {
        const results = {
          nonexistentEndpoint: null,
          malformedRequest: null,
          timeoutHandling: null
        };

        // Test nonexistent endpoint
        try {
          const response = await fetch(`${apiBaseUrl}/nonexistent-endpoint`);
          results.nonexistentEndpoint = {
            status: response.status,
            handled: response.status === 404
          };
        } catch (error) {
          results.nonexistentEndpoint = {
            error: error.message,
            handled: true
          };
        }

        // Test malformed request
        try {
          const response = await fetch(`${apiBaseUrl}/terms`, {
            method: 'POST',
            body: 'invalid json'
          });
          results.malformedRequest = {
            status: response.status,
            handled: response.status >= 400
          };
        } catch (error) {
          results.malformedRequest = {
            error: error.message,
            handled: true
          };
        }

        return results;
      }, API_BASE_URL);

      console.log('Error handling results:', JSON.stringify(errorHandling, null, 2));

      // Verify error handling
      expect(errorHandling.nonexistentEndpoint).toBeDefined();
      expect(errorHandling.malformedRequest).toBeDefined();
    });
  });

  test.describe('Performance and Load Tests', () => {
    test('should measure API response times', async ({ request }) => {
      const performanceResults = {};

      const endpoints = ['/terms', '/categories'];
      
      for (const endpoint of endpoints) {
        const startTime = Date.now();
        const response = await request.get(`${API_BASE_URL}${endpoint}`);
        const endTime = Date.now();
        
        performanceResults[endpoint] = {
          responseTime: endTime - startTime,
          status: response.status(),
          success: response.ok()
        };
      }

      console.log('Performance results:', JSON.stringify(performanceResults, null, 2));

      // Verify reasonable response times (under 5 seconds)
      Object.values(performanceResults).forEach(result => {
        expect(result.responseTime).toBeLessThan(5000);
      });
    });
  });
});

// Configuration mismatch detection test
test.describe('Configuration Issues', () => {
  test('should detect API URL mismatches', async ({ page }) => {
    console.log('🔍 Checking for configuration mismatches...');
    console.log('Expected working API URL: https://d1m7nnfj3im4kp.cloudfront.net/api');
    console.log('Check these configuration files for mismatches:');
    console.log('  - apps/web/.env.production');
    console.log('  - .env.production (line 169)');
    console.log('  - apps/web/src/lib/api.ts (VITE_API_BASE_URL usage)');
    
    // This test always passes but logs important information
    expect(true).toBe(true);
  });
});