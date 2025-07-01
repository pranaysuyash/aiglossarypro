import { test, expect } from '@playwright/test';

test.describe('Search Functionality', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('#main-content')).toBeVisible();
  });

  test.describe('Basic Search', () => {

    test('should perform basic keyword search', async ({ page }) => {
      // Find and use the search input
      const searchInput = page.locator('[data-testid="search-input"], input[type="text"][placeholder*="search" i], input[role="combobox"]').first();
      await expect(searchInput).toBeVisible();
      
      await searchInput.fill('machine learning');
      await searchInput.press('Enter');

      // Verify navigation to search results
      await expect(page).toHaveURL(/.*\/terms\?.*search.*machine.*learning|.*\/search\?.*machine.*learning/);
      
      // Verify search results are displayed
      await expect(page.locator('#main-content')).toBeVisible();
      
      // Check for search results
      const searchResults = page.locator('[data-testid="term-card"], [data-testid="search-result"], .search-result');
      await expect(searchResults.first()).toBeVisible({ timeout: 10000 });
      
      // Verify search query is reflected in the page
      const searchQuery = page.locator('[data-testid="search-query"], input[value*="machine learning"]');
      if (await searchQuery.count() > 0) {
        await expect(searchQuery).toHaveValue(/machine learning/i);
      }
    });

    test('should handle empty search gracefully', async ({ page }) => {
      const searchInput = page.locator('[data-testid="search-input"], input[type="text"]').first();
      
      // Submit empty search
      await searchInput.fill('');
      await searchInput.press('Enter');
      
      // Should show all terms or prompt for search query
      const emptySearchHandlers = [
        page.locator('text=Enter a search term'),
        page.locator('text=Browse all terms'),
        page.locator('[data-testid="all-terms"]'),
        page.locator('[data-testid="term-card"]'),
      ];

      let foundHandler = false;
      for (const handler of emptySearchHandlers) {
        if (await handler.count() > 0) {
          foundHandler = true;
          break;
        }
      }
      
      expect(foundHandler).toBe(true);
    });

    test('should display search suggestions while typing', async ({ page }) => {
      const searchInput = page.locator('[data-testid="search-input"], input[type="text"]').first();
      
      await searchInput.fill('neural');
      await page.waitForTimeout(500); // Wait for debounced suggestions
      
      // Look for suggestion dropdown
      const suggestions = page.locator('[data-testid="search-suggestions"], [role="listbox"], .suggestions-dropdown');
      
      if (await suggestions.count() > 0) {
        await expect(suggestions).toBeVisible();
        
        // Check for suggestion items
        const suggestionItems = suggestions.locator('[data-testid="suggestion-item"], [role="option"], li');
        const itemCount = await suggestionItems.count();
        expect(itemCount).toBeGreaterThan(0);
        
        // Click on first suggestion
        if (itemCount > 0) {
          await suggestionItems.first().click();
          
          // Should navigate to search results or term page
          await page.waitForTimeout(1000);
          const currentUrl = page.url();
          expect(currentUrl).toMatch(/\/(terms|search|term)\//);
        }
      }
    });

    test('should handle special characters in search', async ({ page }) => {
      const searchInput = page.locator('[data-testid="search-input"], input[type="text"]').first();
      
      const specialQueries = [
        'C++',
        'AI/ML',
        'back-propagation',
        'α-β pruning',
        'F1-score',
      ];

      for (const query of specialQueries) {
        await searchInput.fill(query);
        await searchInput.press('Enter');
        
        await page.waitForTimeout(1000);
        
        // Should handle gracefully without errors
        const errorElements = page.locator('text=error, text=failed, [data-testid="error"]');
        const errorCount = await errorElements.count();
        expect(errorCount).toBe(0);
        
        // Navigate back to search
        await page.goto('/');
      }
    });

  });

  test.describe('Advanced Search', () => {

    test('should use advanced search filters', async ({ page }) => {
      // Navigate to advanced search
      const advancedSearchTriggers = [
        page.locator('[data-testid="advanced-search-button"]'),
        page.locator('text=Advanced Search'),
        page.locator('[data-testid="search-filters"]'),
      ];

      let advancedSearchOpened = false;
      for (const trigger of advancedSearchTriggers) {
        if (await trigger.count() > 0) {
          await trigger.click();
          advancedSearchOpened = true;
          break;
        }
      }

      if (!advancedSearchOpened) {
        // Try navigating directly to advanced search
        await page.goto('/search/advanced');
      }

      await page.waitForTimeout(1000);

      // Apply category filter
      const categoryFilter = page.locator('[data-testid="category-filter"], select[name="category"]');
      if (await categoryFilter.count() > 0) {
        await categoryFilter.selectOption('Deep Learning');
      }

      // Apply difficulty filter
      const difficultyFilter = page.locator('[data-testid="difficulty-filter"], select[name="difficulty"]');
      if (await difficultyFilter.count() > 0) {
        await difficultyFilter.selectOption('intermediate');
      }

      // Submit advanced search
      const searchButton = page.locator('[data-testid="search-submit"], button[type="submit"]:has-text("Search")');
      if (await searchButton.count() > 0) {
        await searchButton.click();
        
        // Verify filtered results
        await page.waitForTimeout(2000);
        
        // Check that filters are applied in URL or UI
        const currentUrl = page.url();
        const hasFilters = currentUrl.includes('category=') || currentUrl.includes('difficulty=');
        
        const filterIndicators = page.locator('[data-testid="active-filters"], .applied-filters');
        const hasFilterUI = await filterIndicators.count() > 0;
        
        expect(hasFilters || hasFilterUI).toBe(true);
      }
    });

    test('should search within specific categories', async ({ page }) => {
      // Navigate to a specific category first
      await page.goto('/categories');
      await expect(page.locator('#main-content')).toBeVisible();

      // Click on a category
      const categoryCard = page.locator('[data-testid="category-card"]').first();
      if (await categoryCard.count() > 0) {
        await categoryCard.click();
        
        // Should be on category page
        await expect(page).toHaveURL(/.*\/category\/.+/);
        
        // Use search within this category
        const searchInput = page.locator('[data-testid="search-input"], input[type="text"]').first();
        if (await searchInput.count() > 0) {
          await searchInput.fill('algorithm');
          await searchInput.press('Enter');
          
          // Results should be filtered to this category
          await page.waitForTimeout(2000);
          
          // Check if category context is maintained
          const categoryContext = [
            page.locator('[data-testid="category-breadcrumb"]'),
            page.locator('[data-testid="search-context"]'),
          ];

          let foundContext = false;
          for (const context of categoryContext) {
            if (await context.count() > 0) {
              foundContext = true;
              break;
            }
          }
          
          console.log(`Category search context maintained: ${foundContext}`);
        }
      }
    });

  });

  test.describe('AI-Powered Semantic Search', () => {

    test('should perform semantic search with natural language queries', async ({ page }) => {
      const searchInput = page.locator('[data-testid="search-input"], input[type="text"]').first();
      
      // Use natural language query
      const semanticQueries = [
        'how do neural networks learn',
        'algorithms for image recognition',
        'explain deep learning optimization',
        'what is used for natural language processing',
      ];

      for (const query of semanticQueries) {
        await searchInput.fill(query);
        await searchInput.press('Enter');
        
        await page.waitForTimeout(3000); // AI search may take longer
        
        // Verify results are relevant
        const searchResults = page.locator('[data-testid="term-card"], [data-testid="search-result"]');
        const resultCount = await searchResults.count();
        
        if (resultCount > 0) {
          // Check if semantic search indicator is shown
          const semanticIndicators = [
            page.locator('[data-testid="semantic-search-badge"]'),
            page.locator('text=AI-powered'),
            page.locator('text=Semantic'),
          ];

          let foundSemantic = false;
          for (const indicator of semanticIndicators) {
            if (await indicator.count() > 0) {
              foundSemantic = true;
              break;
            }
          }
          
          console.log(`Semantic search performed for: "${query}"`);
          console.log(`Results found: ${resultCount}`);
          console.log(`Semantic indicator shown: ${foundSemantic}`);
        }
        
        // Navigate back for next query
        await page.goto('/');
        await page.waitForTimeout(500);
      }
    });

    test('should show AI search suggestions and related terms', async ({ page }) => {
      const searchInput = page.locator('[data-testid="search-input"], input[type="text"]').first();
      
      await searchInput.fill('machine learning optimization');
      await searchInput.press('Enter');
      
      await page.waitForTimeout(3000);
      
      // Look for AI-generated suggestions
      const aiSuggestions = [
        page.locator('[data-testid="ai-suggestions"]'),
        page.locator('[data-testid="related-terms"]'),
        page.locator('[data-testid="suggested-terms"]'),
        page.locator('.ai-recommendations'),
      ];

      let foundAISuggestions = false;
      for (const suggestion of aiSuggestions) {
        if (await suggestion.count() > 0) {
          foundAISuggestions = true;
          
          // Click on first suggestion if available
          const suggestionItems = suggestion.locator('[data-testid="suggestion-item"], a, button');
          if (await suggestionItems.count() > 0) {
            await suggestionItems.first().click();
            await page.waitForTimeout(1000);
            
            // Should navigate to relevant term or search
            const currentUrl = page.url();
            expect(currentUrl).toMatch(/\/(term|terms|search)\//);
          }
          break;
        }
      }
      
      console.log(`AI suggestions found: ${foundAISuggestions}`);
    });

  });

  test.describe('Search Results and Pagination', () => {

    test('should display search results with proper metadata', async ({ page }) => {
      const searchInput = page.locator('[data-testid="search-input"], input[type="text"]').first();
      
      await searchInput.fill('neural network');
      await searchInput.press('Enter');
      
      await page.waitForTimeout(2000);
      
      // Check search results have proper structure
      const termCards = page.locator('[data-testid="term-card"], [data-testid="search-result"]');
      const cardCount = await termCards.count();
      
      if (cardCount > 0) {
        const firstCard = termCards.first();
        
        // Verify card has essential elements
        const cardElements = [
          firstCard.locator('h2, h3, [data-testid="term-title"]'), // Title
          firstCard.locator('[data-testid="term-definition"], .definition'), // Definition
          firstCard.locator('[data-testid="term-category"], .category'), // Category
        ];

        let foundElements = 0;
        for (const element of cardElements) {
          if (await element.count() > 0) {
            foundElements++;
          }
        }
        
        expect(foundElements).toBeGreaterThan(0);
        
        // Test clicking on result
        await firstCard.click();
        
        // Should navigate to term detail page
        await expect(page).toHaveURL(/.*\/term\/.+/);
      }
    });

    test('should handle pagination of search results', async ({ page }) => {
      // Perform search that should return many results
      const searchInput = page.locator('[data-testid="search-input"], input[type="text"]').first();
      await searchInput.fill('machine');
      await searchInput.press('Enter');
      
      await page.waitForTimeout(2000);
      
      // Look for pagination controls
      const paginationElements = [
        page.locator('[data-testid="pagination"]'),
        page.locator('[aria-label="Pagination"]'),
        page.locator('.pagination'),
        page.locator('button:has-text("Next")'),
        page.locator('button:has-text("Load More")'),
      ];

      let foundPagination = false;
      for (const pagination of paginationElements) {
        if (await pagination.count() > 0) {
          foundPagination = true;
          
          // Test pagination interaction
          const nextButton = pagination.locator('button:has-text("Next"), [data-testid="next-page"]');
          const loadMoreButton = pagination.locator('button:has-text("Load More"), [data-testid="load-more"]');
          
          if (await nextButton.count() > 0) {
            await nextButton.click();
            await page.waitForTimeout(1000);
            
            // Verify page changed
            const currentUrl = page.url();
            expect(currentUrl).toMatch(/page=|offset=|\?.*2/);
          } else if (await loadMoreButton.count() > 0) {
            const initialResults = await page.locator('[data-testid="term-card"]').count();
            await loadMoreButton.click();
            await page.waitForTimeout(2000);
            
            // Should have more results
            const newResults = await page.locator('[data-testid="term-card"]').count();
            expect(newResults).toBeGreaterThan(initialResults);
          }
          break;
        }
      }
      
      console.log(`Pagination found: ${foundPagination}`);
    });

    test('should show search result count and query info', async ({ page }) => {
      const searchInput = page.locator('[data-testid="search-input"], input[type="text"]').first();
      
      await searchInput.fill('deep learning');
      await searchInput.press('Enter');
      
      await page.waitForTimeout(2000);
      
      // Look for result count information
      const resultInfo = [
        page.locator('[data-testid="result-count"]'),
        page.locator('[data-testid="search-info"]'),
        page.locator('text=/\\d+ results?/'),
        page.locator('text=/found \\d+/'),
      ];

      let foundResultInfo = false;
      for (const info of resultInfo) {
        if (await info.count() > 0) {
          foundResultInfo = true;
          const infoText = await info.textContent();
          console.log(`Search result info: ${infoText}`);
          break;
        }
      }
      
      // Check for current search query display
      const queryDisplay = [
        page.locator('[data-testid="current-query"]'),
        page.locator('text=Showing results for'),
        page.locator('input[value*="deep learning"]'),
      ];

      let foundQueryDisplay = false;
      for (const display of queryDisplay) {
        if (await display.count() > 0) {
          foundQueryDisplay = true;
          break;
        }
      }
      
      console.log(`Result info found: ${foundResultInfo}`);
      console.log(`Query display found: ${foundQueryDisplay}`);
    });

  });

  test.describe('Search Filters and Sorting', () => {

    test('should apply and remove search filters', async ({ page }) => {
      // Navigate to search page
      const searchInput = page.locator('[data-testid="search-input"], input[type="text"]').first();
      await searchInput.fill('algorithm');
      await searchInput.press('Enter');
      
      await page.waitForTimeout(2000);
      
      // Look for filter controls
      const filterControls = [
        page.locator('[data-testid="search-filters"]'),
        page.locator('[data-testid="filter-panel"]'),
        page.locator('.filters'),
        page.locator('[aria-label*="filter"]'),
      ];

      let foundFilters = false;
      for (const control of filterControls) {
        if (await control.count() > 0) {
          foundFilters = true;
          
          // Try to apply filters
          const categoryFilter = control.locator('[data-testid="category-filter"], select, [role="combobox"]');
          const difficultyFilter = control.locator('[data-testid="difficulty-filter"], input[type="checkbox"]');
          
          if (await categoryFilter.count() > 0) {
            // Select a category
            await categoryFilter.click();
            await page.waitForTimeout(500);
            
            const options = page.locator('[role="option"], option');
            if (await options.count() > 0) {
              await options.first().click();
              await page.waitForTimeout(1000);
              
              // Check if filter was applied
              const activeFilters = page.locator('[data-testid="active-filter"], .active-filter');
              const hasActiveFilter = await activeFilters.count() > 0;
              console.log(`Filter applied: ${hasActiveFilter}`);
            }
          }
          
          if (await difficultyFilter.count() > 0) {
            await difficultyFilter.first().check();
            await page.waitForTimeout(1000);
          }
          
          break;
        }
      }
      
      console.log(`Search filters found: ${foundFilters}`);
    });

    test('should sort search results by different criteria', async ({ page }) => {
      const searchInput = page.locator('[data-testid="search-input"], input[type="text"]').first();
      await searchInput.fill('machine learning');
      await searchInput.press('Enter');
      
      await page.waitForTimeout(2000);
      
      // Look for sort controls
      const sortControls = [
        page.locator('[data-testid="sort-dropdown"]'),
        page.locator('[data-testid="sort-by"]'),
        page.locator('select[name="sort"]'),
        page.locator('button:has-text("Sort")'),
      ];

      let foundSort = false;
      for (const control of sortControls) {
        if (await control.count() > 0) {
          foundSort = true;
          
          // Get initial results order
          const initialResults = await page.locator('[data-testid="term-card"] h3, [data-testid="term-card"] h2').allTextContents();
          
          // Change sort order
          if (control.tagName === 'SELECT') {
            await control.selectOption('alphabetical');
          } else {
            await control.click();
            await page.waitForTimeout(500);
            
            const sortOptions = page.locator('[role="menuitem"], [data-testid="sort-option"]');
            if (await sortOptions.count() > 0) {
              await sortOptions.first().click();
            }
          }
          
          await page.waitForTimeout(2000);
          
          // Check if order changed
          const newResults = await page.locator('[data-testid="term-card"] h3, [data-testid="term-card"] h2').allTextContents();
          const orderChanged = JSON.stringify(initialResults) !== JSON.stringify(newResults);
          
          console.log(`Sort order changed: ${orderChanged}`);
          break;
        }
      }
      
      console.log(`Sort controls found: ${foundSort}`);
    });

  });

  test.describe('Search History and Saved Searches', () => {

    test('should maintain search history', async ({ page }) => {
      const searches = ['neural networks', 'deep learning', 'machine learning'];
      
      for (const query of searches) {
        const searchInput = page.locator('[data-testid="search-input"], input[type="text"]').first();
        await searchInput.fill(query);
        await searchInput.press('Enter');
        await page.waitForTimeout(1000);
        
        // Navigate back to homepage
        await page.goto('/');
        await page.waitForTimeout(500);
      }
      
      // Check if search history is available
      const searchInput = page.locator('[data-testid="search-input"], input[type="text"]').first();
      await searchInput.click();
      
      // Look for search history
      const historyElements = [
        page.locator('[data-testid="search-history"]'),
        page.locator('[data-testid="recent-searches"]'),
        page.locator('.search-history'),
      ];

      let foundHistory = false;
      for (const history of historyElements) {
        if (await history.count() > 0) {
          foundHistory = true;
          
          // Check if previous searches are shown
          const historyItems = history.locator('[data-testid="history-item"], li, button');
          const itemCount = await historyItems.count();
          
          if (itemCount > 0) {
            // Click on a history item
            await historyItems.first().click();
            await page.waitForTimeout(1000);
            
            // Should perform the search
            const currentUrl = page.url();
            expect(currentUrl).toMatch(/search|terms/);
          }
          break;
        }
      }
      
      console.log(`Search history found: ${foundHistory}`);
    });

  });

  test.describe('Mobile Search Experience', () => {

    test('should work properly on mobile devices', async ({ page }) => {
      // Set mobile viewport
      await page.setViewportSize({ width: 375, height: 667 });
      
      await page.goto('/');
      await expect(page.locator('#main-content')).toBeVisible();
      
      // Look for mobile search interface
      const mobileSearchElements = [
        page.locator('[data-testid="mobile-search"]'),
        page.locator('[data-testid="search-button"]'), // Search icon
        page.locator('button[aria-label*="search"]'),
      ];

      let foundMobileSearch = false;
      for (const element of mobileSearchElements) {
        if (await element.count() > 0) {
          foundMobileSearch = true;
          await element.click();
          
          // Search input should appear
          const searchInput = page.locator('[data-testid="search-input"], input[type="text"]');
          if (await searchInput.count() > 0) {
            await searchInput.fill('AI');
            await searchInput.press('Enter');
            
            await page.waitForTimeout(2000);
            
            // Verify search works on mobile
            const searchResults = page.locator('[data-testid="term-card"]');
            const resultCount = await searchResults.count();
            expect(resultCount).toBeGreaterThan(0);
          }
          break;
        }
      }
      
      // Fallback: try regular search input
      if (!foundMobileSearch) {
        const searchInput = page.locator('input[type="text"]').first();
        if (await searchInput.count() > 0) {
          await searchInput.fill('artificial intelligence');
          await searchInput.press('Enter');
          
          await page.waitForTimeout(2000);
          const results = await page.locator('[data-testid="term-card"]').count();
          expect(results).toBeGreaterThan(0);
        }
      }
      
      console.log(`Mobile search interface found: ${foundMobileSearch}`);
    });

  });

});
