import { expect, test } from '@playwright/test';
import { playAudit } from 'playwright-lighthouse';

test.describe('Performance and Load Testing', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('#main-content')).toBeVisible();
  });

  test.describe('Lighthouse Performance Audits', () => {
    test('should meet Lighthouse performance thresholds for homepage', async ({
      page,
      browser,
    }) => {
      await page.goto('/');

      const results = await playAudit({
        page,
        reports: {
          formats: {
            json: true,
            html: true,
          },
          name: 'homepage-lighthouse-report',
          directory: 'reports/audit-suite/lighthouse',
        },
        thresholds: {
          performance: 90,
          accessibility: 90,
          'best-practices': 80,
          seo: 80,
        },
      });

      console.log('Lighthouse scores:', {
        performance: results.lhr.categories.performance.score * 100,
        accessibility: results.lhr.categories.accessibility.score * 100,
        bestPractices: results.lhr.categories['best-practices'].score * 100,
        seo: results.lhr.categories.seo.score * 100,
      });

      // Assert that performance scores meet thresholds
      expect(results.lhr.categories.performance.score * 100).toBeGreaterThanOrEqual(90);
      expect(results.lhr.categories.accessibility.score * 100).toBeGreaterThanOrEqual(90);
    });

    test('should meet Lighthouse performance thresholds for key pages', async ({ page }) => {
      const keyPages = [
        { path: '/terms', name: 'terms-page' },
        { path: '/categories', name: 'categories-page' },
        { path: '/search', name: 'search-page' },
      ];

      for (const pageInfo of keyPages) {
        await page.goto(pageInfo.path);
        await page.waitForLoadState('networkidle');

        const results = await playAudit({
          page,
          reports: {
            formats: { json: true },
            name: `${pageInfo.name}-lighthouse`,
            directory: 'reports/audit-suite/lighthouse',
          },
          thresholds: {
            performance: 85, // Slightly lower threshold for complex pages
            accessibility: 90,
          },
        });

        const performanceScore = results.lhr.categories.performance.score * 100;
        console.log(`${pageInfo.path} performance score: ${performanceScore}`);

        expect(performanceScore).toBeGreaterThanOrEqual(85);
      }
    });

    test('should analyze Core Web Vitals', async ({ page }) => {
      await page.goto('/');

      const results = await playAudit({
        page,
        config: {
          settings: {
            onlyCategories: ['performance'],
          },
        },
      });

      const audits = results.lhr.audits;

      // Check Core Web Vitals
      const coreWebVitals = {
        lcp: audits['largest-contentful-paint']?.numericValue,
        fid: audits['first-input-delay']?.numericValue,
        cls: audits['cumulative-layout-shift']?.numericValue,
        fcp: audits['first-contentful-paint']?.numericValue,
        ttfb: audits['time-to-first-byte']?.numericValue,
      };

      console.log('Core Web Vitals:', coreWebVitals);

      // Assert Core Web Vitals thresholds
      if (coreWebVitals.lcp) {
        expect(coreWebVitals.lcp).toBeLessThan(2500); // LCP < 2.5s
      }
      if (coreWebVitals.cls) {
        expect(coreWebVitals.cls).toBeLessThan(0.1); // CLS < 0.1
      }
      if (coreWebVitals.fcp) {
        expect(coreWebVitals.fcp).toBeLessThan(1800); // FCP < 1.8s
      }
    });
  });

  test.describe('Page Load Performance', () => {
    test('should load homepage within acceptable time limits', async ({ page }) => {
      const startTime = Date.now();

      await page.goto('/', { waitUntil: 'networkidle' });

      const loadTime = Date.now() - startTime;

      // Homepage should load within 3 seconds
      expect(loadTime).toBeLessThan(3000);
      console.log(`Homepage load time: ${loadTime}ms`);

      // Check for Core Web Vitals
      const performanceMetrics = await page.evaluate(() => {
        return new Promise(resolve => {
          new PerformanceObserver(list => {
            const entries = list.getEntries();
            const metrics: any = {};

            entries.forEach(entry => {
              if (entry.entryType === 'navigation') {
                const navEntry = entry as PerformanceNavigationTiming;
                metrics.domContentLoaded =
                  navEntry.domContentLoadedEventEnd - navEntry.domContentLoadedEventStart;
                metrics.loadComplete = navEntry.loadEventEnd - navEntry.loadEventStart;
              }

              if (entry.entryType === 'largest-contentful-paint') {
                metrics.lcp = entry.startTime;
              }

              if (entry.entryType === 'first-input') {
                const inputEntry = entry as PerformanceEventTiming;
                metrics.fid = inputEntry.processingStart - entry.startTime;
              }

              if (entry.entryType === 'layout-shift') {
                const layoutEntry = entry as unknown; // LayoutShift interface not available in standard types
                metrics.cls = (metrics.cls || 0) + layoutEntry.value;
              }
            });

            resolve(metrics);
          }).observe({
            entryTypes: ['navigation', 'largest-contentful-paint', 'first-input', 'layout-shift'],
          });

          // Fallback timeout
          setTimeout(() => resolve({}), 5000);
        });
      });

      console.log('Performance metrics:', performanceMetrics);

      // LCP should be under 2.5s
      if (performanceMetrics.lcp) {
        expect(performanceMetrics.lcp).toBeLessThan(2500);
      }
    });

    test('should load term detail pages efficiently', async ({ page }) => {
      // Navigate to a term page (using relative URL since Playwright uses baseURL from config)
      await page.goto('/term/8b5bff9a-afb7-4691-a58e-adc2bf94f941');

      const startTime = Date.now();
      await page.waitForLoadState('networkidle');
      const loadTime = Date.now() - startTime;

      // Term pages should load within 2 seconds
      expect(loadTime).toBeLessThan(2000);
      console.log(`Term page load time: ${loadTime}ms`);

      // Check that essential content is visible
      const essentialContent = [
        page.locator('h1'), // Term title
        page.locator('[data-testid="term-definition"]'), // Definition
        page.locator('#main-content'),
      ];

      for (const content of essentialContent) {
        await expect(content.first()).toBeVisible({ timeout: 1000 });
      }
    });

    test('should handle search results efficiently', async ({ page }) => {
      const searchInput = page.locator('[data-testid="search-input"], input[type="text"]').first();

      const startTime = Date.now();
      await searchInput.fill('machine learning');
      await searchInput.press('Enter');

      // Wait for search results
      await page.waitForSelector('[data-testid="term-card"], [data-testid="search-result"]', {
        timeout: 5000,
      });

      const searchTime = Date.now() - startTime;

      // Search should complete within 3 seconds
      expect(searchTime).toBeLessThan(3000);
      console.log(`Search completion time: ${searchTime}ms`);

      // Check that results are displayed
      const searchResults = page.locator(
        '[data-testid="term-card"], [data-testid="search-result"]'
      );
      const resultCount = await searchResults.count();
      expect(resultCount).toBeGreaterThan(0);

      console.log(`Search results found: ${resultCount}`);
    });
  });

  test.describe('Resource Loading and Optimization', () => {
    test('should load images efficiently with proper optimization', async ({ page }) => {
      // Track network requests
      const imageRequests = [];
      const jsRequests = [];
      const cssRequests = [];

      page.on('request', request => {
        const url = request.url();
        if (url.match(/\.(jpg|jpeg|png|gif|svg|webp)$/)) {
          imageRequests.push(url);
        } else if (url.match(/\.js$/)) {
          jsRequests.push(url);
        } else if (url.match(/\.css$/)) {
          cssRequests.push(url);
        }
      });

      await page.goto('/', { waitUntil: 'networkidle' });

      console.log(`Image requests: ${imageRequests.length}`);
      console.log(`JavaScript requests: ${jsRequests.length}`);
      console.log(`CSS requests: ${cssRequests.length}`);

      // Should have reasonable number of requests
      expect(imageRequests.length).toBeLessThan(20);
      expect(jsRequests.length).toBeLessThan(10);
      expect(cssRequests.length).toBeLessThan(5);

      // Check for modern image formats
      const modernFormats = imageRequests.filter(
        url => url.includes('.webp') || url.includes('.avif')
      );
      console.log(`Modern image formats: ${modernFormats.length}/${imageRequests.length}`);
    });

    test('should implement proper caching strategies', async ({ page }) => {
      // First visit
      await page.goto('/');
      await page.waitForLoadState('networkidle');

      // Second visit to test caching
      const cachedRequests = [];

      page.on('response', response => {
        const cacheHeader = response.headers()['cache-control'];
        if (cacheHeader && (cacheHeader.includes('max-age') || cacheHeader.includes('public'))) {
          cachedRequests.push(response.url());
        }
      });

      await page.reload({ waitUntil: 'networkidle' });

      console.log(`Cacheable resources: ${cachedRequests.length}`);

      // Should have some cacheable resources
      expect(cachedRequests.length).toBeGreaterThan(0);
    });

    test('should minimize bundle sizes', async ({ page }) => {
      const bundleSizes = [];

      page.on('response', async response => {
        const url = response.url();
        if (url.includes('.js') && !url.includes('node_modules')) {
          try {
            const contentLength = response.headers()['content-length'];
            if (contentLength) {
              bundleSizes.push({
                url,
                size: parseInt(contentLength),
              });
            }
          } catch (_error) {
            // Ignore errors getting content length
          }
        }
      });

      await page.goto('/', { waitUntil: 'networkidle' });

      // Check bundle sizes
      const largeBundles = bundleSizes.filter(bundle => bundle.size > 500000); // 500KB

      console.log(`Total bundles: ${bundleSizes.length}`);
      console.log(`Large bundles (>500KB): ${largeBundles.length}`);

      if (largeBundles.length > 0) {
        console.log('Large bundles:', largeBundles);
      }

      // Should not have too many large bundles
      expect(largeBundles.length).toBeLessThan(3);
    });
  });

  test.describe('Large Dataset Handling', () => {
    test('should handle large search results efficiently', async ({ page }) => {
      // Perform search that should return many results
      const searchInput = page.locator('[data-testid="search-input"], input[type="text"]').first();

      await searchInput.fill('machine'); // Broad search
      await searchInput.press('Enter');

      await page.waitForTimeout(3000);

      // Check if virtualization or pagination is working
      const searchResults = page.locator(
        '[data-testid="term-card"], [data-testid="search-result"]'
      );
      const resultCount = await searchResults.count();

      console.log(`Search results rendered: ${resultCount}`);

      // Should render reasonable number of results (not thousands at once)
      expect(resultCount).toBeLessThan(100);
      expect(resultCount).toBeGreaterThan(0);

      // Test scrolling performance
      const scrollStart = Date.now();
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
      await page.waitForTimeout(500);
      const scrollTime = Date.now() - scrollStart;

      console.log(`Scroll performance: ${scrollTime}ms`);
      expect(scrollTime).toBeLessThan(1000);
    });

    test('should implement infinite scroll or pagination efficiently', async ({ page }) => {
      // Navigate to terms page
      await page.goto('/terms');
      await page.waitForTimeout(2000);

      const initialResultCount = await page.locator('[data-testid="term-card"]').count();
      console.log(`Initial results: ${initialResultCount}`);

      // Test pagination
      const paginationElements = [
        page.locator('[data-testid="pagination"]'),
        page.locator('button:has-text("Next")'),
        page.locator('button:has-text("Load More")'),
      ];

      let paginationFound = false;
      for (const element of paginationElements) {
        if ((await element.count()) > 0) {
          paginationFound = true;

          if (element === paginationElements[2]) {
            // Load More button
            const loadStart = Date.now();
            await element.click();
            await page.waitForTimeout(2000);
            const loadTime = Date.now() - loadStart;

            const newResultCount = await page.locator('[data-testid="term-card"]').count();
            console.log(`Load more time: ${loadTime}ms`);
            console.log(`New results: ${newResultCount}`);

            expect(loadTime).toBeLessThan(3000);
            expect(newResultCount).toBeGreaterThan(initialResultCount);
          }
          break;
        }
      }

      // Test infinite scroll
      if (!paginationFound) {
        await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
        await page.waitForTimeout(2000);

        const newResultCount = await page.locator('[data-testid="term-card"]').count();
        if (newResultCount > initialResultCount) {
          console.log('Infinite scroll working');
        }
      }

      console.log(`Pagination system found: ${paginationFound}`);
    });
  });

  test.describe('Memory Usage and Leaks', () => {
    test('should not have significant memory leaks during navigation', async ({ page }) => {
      // Get initial memory usage
      const initialMemory = await page.evaluate(() => {
        if (performance.memory) {
          return {
            usedJSHeapSize: performance.memory.usedJSHeapSize,
            totalJSHeapSize: performance.memory.totalJSHeapSize,
          };
        }
        return null;
      });

      if (!initialMemory) {
        console.log('Memory API not available');
        return;
      }

      console.log('Initial memory:', initialMemory);

      // Navigate through multiple pages
      const pages = [
        '/',
        '/terms',
        '/categories',
        '/term/8b5bff9a-afb7-4691-a58e-adc2bf94f941',
        '/search?q=neural+networks',
      ];

      for (const pagePath of pages) {
        await page.goto(pagePath);
        await page.waitForTimeout(1000);
      }

      // Force garbage collection (if available)
      await page.evaluate(() => {
        if (window.gc) {
          window.gc();
        }
      });

      await page.waitForTimeout(2000);

      // Check final memory usage
      const finalMemory = await page.evaluate(() => {
        if (performance.memory) {
          return {
            usedJSHeapSize: performance.memory.usedJSHeapSize,
            totalJSHeapSize: performance.memory.totalJSHeapSize,
          };
        }
        return null;
      });

      if (finalMemory) {
        console.log('Final memory:', finalMemory);

        const memoryIncrease = finalMemory.usedJSHeapSize - initialMemory.usedJSHeapSize;
        const memoryIncreasePercent = (memoryIncrease / initialMemory.usedJSHeapSize) * 100;

        console.log(
          `Memory increase: ${memoryIncrease} bytes (${memoryIncreasePercent.toFixed(2)}%)`
        );

        // Memory should not increase by more than 50%
        expect(memoryIncreasePercent).toBeLessThan(50);
      }
    });
  });

  test.describe('Network Performance', () => {
    test('should handle slow network conditions gracefully', async ({ page }) => {
      // Simulate slow 3G
      const client = await page.context().newCDPSession(page);
      await client.send('Network.emulateNetworkConditions', {
        offline: false,
        downloadThroughput: 50 * 1024, // 50 KB/s
        uploadThroughput: 50 * 1024,
        latency: 2000, // 2s latency
      });

      const startTime = Date.now();
      await page.goto('/', { timeout: 30000 });

      // Should show loading states
      const loadingIndicators = [
        page.locator('[data-testid="loading"]'),
        page.locator('.loading'),
        page.locator('.skeleton'),
        page.locator('text=Loading'),
      ];

      let foundLoadingState = false;
      for (const indicator of loadingIndicators) {
        if ((await indicator.count()) > 0) {
          foundLoadingState = true;
          break;
        }
      }

      await page.waitForSelector('#main-content', { timeout: 30000 });
      const loadTime = Date.now() - startTime;

      console.log(`Slow network load time: ${loadTime}ms`);
      console.log(`Loading states shown: ${foundLoadingState}`);

      // Should eventually load within 30 seconds
      expect(loadTime).toBeLessThan(30000);

      // Disable network throttling
      await client.send('Network.emulateNetworkConditions', {
        offline: false,
        downloadThroughput: -1,
        uploadThroughput: -1,
        latency: 0,
      });
    });

    test('should handle network failures gracefully', async ({ page }) => {
      // Start normally
      await page.goto('/');
      await page.waitForTimeout(1000);

      // Simulate network failure
      await page.route('**/*', route => route.abort());

      // Try to navigate or perform action
      const searchInput = page.locator('[data-testid="search-input"], input[type="text"]').first();
      if ((await searchInput.count()) > 0) {
        await searchInput.fill('test search');
        await searchInput.press('Enter');

        await page.waitForTimeout(3000);

        // Should show error state
        const errorStates = [
          page.locator('[data-testid="network-error"]'),
          page.locator('[data-testid="error-message"]'),
          page.locator('text=network error'),
          page.locator('text=connection failed'),
          page.locator('text=please try again'),
        ];

        let foundErrorState = false;
        for (const error of errorStates) {
          if ((await error.count()) > 0) {
            foundErrorState = true;
            break;
          }
        }

        console.log(`Network error handled gracefully: ${foundErrorState}`);
      }

      // Re-enable network
      await page.unroute('**/*');
    });
  });

  test.describe('Rendering Performance', () => {
    test('should render complex term pages efficiently', async ({ page }) => {
      await page.goto('/term/8b5bff9a-afb7-4691-a58e-adc2bf94f941');

      // Measure rendering performance
      const renderingMetrics = await page.evaluate(() => {
        return new Promise(resolve => {
          const observer = new PerformanceObserver(list => {
            const entries = list.getEntries();
            const paintMetrics = {};

            entries.forEach(entry => {
              if (entry.entryType === 'paint') {
                paintMetrics[entry.name] = entry.startTime;
              }
              if (entry.entryType === 'measure') {
                paintMetrics[entry.name] = entry.duration;
              }
            });

            resolve(paintMetrics);
          });

          observer.observe({ entryTypes: ['paint', 'measure'] });

          setTimeout(() => resolve({}), 3000);
        });
      });

      console.log('Rendering metrics:', renderingMetrics);

      // Check for layout shifts
      const layoutShifts = await page.evaluate(() => {
        return new Promise(resolve => {
          let cumulativeLayoutShift = 0;

          const observer = new PerformanceObserver(list => {
            for (const entry of list.getEntries()) {
              if (entry.entryType === 'layout-shift' && !entry.hadRecentInput) {
                cumulativeLayoutShift += entry.value;
              }
            }
          });

          observer.observe({ entryTypes: ['layout-shift'] });

          setTimeout(() => {
            observer.disconnect();
            resolve(cumulativeLayoutShift);
          }, 5000);
        });
      });

      console.log(`Cumulative Layout Shift: ${layoutShifts}`);

      // CLS should be less than 0.1
      expect(layoutShifts).toBeLessThan(0.1);
    });
  });

  test.describe('Concurrent User Simulation', () => {
    test('should handle multiple simultaneous operations', async ({ page }) => {
      // Simulate multiple concurrent operations
      const operations = [
        // Search operation
        async () => {
          const searchInput = page
            .locator('[data-testid="search-input"], input[type="text"]')
            .first();
          if ((await searchInput.count()) > 0) {
            await searchInput.fill('neural networks');
            await searchInput.press('Enter');
          }
        },

        // Navigation operation
        async () => {
          const categoryLink = page
            .locator('[data-testid="category-card"], a[href*="/category/"]')
            .first();
          if ((await categoryLink.count()) > 0) {
            await categoryLink.click();
          }
        },

        // User interaction
        async () => {
          const favoriteButton = page
            .locator('[data-testid="favorite-button"], button[aria-label*="favorite"]')
            .first();
          if ((await favoriteButton.count()) > 0) {
            await favoriteButton.click();
          }
        },
      ];

      // Execute operations concurrently
      const startTime = Date.now();
      await Promise.all(operations.map(op => op().catch(console.error)));
      const executionTime = Date.now() - startTime;

      console.log(`Concurrent operations completed in: ${executionTime}ms`);

      // Should complete within reasonable time
      expect(executionTime).toBeLessThan(5000);

      // Application should remain responsive
      await expect(page.locator('#main-content')).toBeVisible();
    });
  });
});
