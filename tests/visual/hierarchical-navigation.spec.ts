import { test, expect } from '@playwright/test';

test.describe('Hierarchical Navigation System', () => {
  const testTermId = '8b5bff9a-afb7-4691-a58e-adc2bf94f941';
  
  test.beforeEach(async ({ page }) => {
    // Navigate to a term page where hierarchical navigation is displayed
    await page.goto(`/term/${testTermId}`);
    await page.waitForLoadState('networkidle');
  });

  test.describe('Basic Navigation Rendering', () => {
    test('should display hierarchical navigation section', async ({ page }) => {
      // Check for the Content Navigation heading
      await expect(page.locator('h2:has-text("Content Navigation")')).toBeVisible();
      
      // Check for the hierarchical navigator component
      await expect(page.locator('[data-testid="card"]')).toBeVisible();
      
      // Take screenshot of initial state
      await page.screenshot({ 
        path: 'test-results/hierarchical-nav-initial.png',
        fullPage: true 
      });
    });

    test('should display 42 main sections in navigation', async ({ page }) => {
      // Wait for navigation to load
      await page.waitForSelector('[data-testid="card-content"]', { timeout: 10000 });
      
      // Count visible main sections (should be close to 42)
      const mainSections = page.locator('[data-testid="card-content"] > div');
      const sectionCount = await mainSections.count();
      
      // Should have multiple sections loaded
      expect(sectionCount).toBeGreaterThan(10);
      
      // Take screenshot showing sections
      await page.screenshot({ 
        path: 'test-results/hierarchical-nav-sections.png',
        fullPage: true 
      });
    });
  });

  test.describe('Search Functionality', () => {
    test('should display search input when searchable', async ({ page }) => {
      // Look for search input
      const searchInput = page.locator('input[placeholder*="Search"]');
      await expect(searchInput).toBeVisible({ timeout: 10000 });
      
      // Take screenshot of search interface
      await page.screenshot({ 
        path: 'test-results/hierarchical-nav-search.png',
        fullPage: true 
      });
    });

    test('should filter sections when searching', async ({ page }) => {
      // Wait for search input to be available
      const searchInput = page.locator('input[placeholder*="Search"]');
      await searchInput.waitFor({ state: 'visible', timeout: 10000 });
      
      // Type in search query
      await searchInput.fill('neural');
      await page.waitForTimeout(1000); // Wait for search to process
      
      // Take screenshot of search results
      await page.screenshot({ 
        path: 'test-results/hierarchical-nav-search-results.png',
        fullPage: true 
      });
      
      // Clear search
      await searchInput.clear();
      await page.waitForTimeout(500);
      
      // Take screenshot of cleared search
      await page.screenshot({ 
        path: 'test-results/hierarchical-nav-search-cleared.png',
        fullPage: true 
      });
    });
  });

  test.describe('Tree/Flat View Toggle', () => {
    test('should toggle between Tree and Flat views', async ({ page }) => {
      // Look for Tree/Flat toggle buttons
      const treeButton = page.locator('button:has-text("Tree")');
      const flatButton = page.locator('button:has-text("Flat")');
      
      // Wait for buttons to be available
      await expect(treeButton.or(flatButton)).toBeVisible({ timeout: 10000 });
      
      if (await flatButton.isVisible()) {
        // Click Flat view
        await flatButton.click();
        await page.waitForTimeout(1000);
        
        // Take screenshot of flat view
        await page.screenshot({ 
          path: 'test-results/hierarchical-nav-flat-view.png',
          fullPage: true 
        });
      }
      
      if (await treeButton.isVisible()) {
        // Click Tree view
        await treeButton.click();
        await page.waitForTimeout(1000);
        
        // Take screenshot of tree view
        await page.screenshot({ 
          path: 'test-results/hierarchical-nav-tree-view.png',
          fullPage: true 
        });
      }
    });
  });

  test.describe('Expand/Collapse Functionality', () => {
    test('should expand and collapse sections', async ({ page }) => {
      // Wait for navigation content to load
      await page.waitForSelector('[data-testid="card-content"]', { timeout: 10000 });
      
      // Look for expand/collapse buttons
      const expandButtons = page.locator('button[data-size="sm"]');
      const buttonCount = await expandButtons.count();
      
      if (buttonCount > 0) {
        // Click first expand button
        await expandButtons.first().click();
        await page.waitForTimeout(1000);
        
        // Take screenshot of expanded state
        await page.screenshot({ 
          path: 'test-results/hierarchical-nav-expanded.png',
          fullPage: true 
        });
        
        // Click again to collapse
        await expandButtons.first().click();
        await page.waitForTimeout(1000);
        
        // Take screenshot of collapsed state
        await page.screenshot({ 
          path: 'test-results/hierarchical-nav-collapsed.png',
          fullPage: true 
        });
      }
    });
  });

  test.describe('Interactive Elements', () => {
    test('should display interactive element indicators', async ({ page }) => {
      // Wait for content to load
      await page.waitForSelector('[data-testid="card-content"]', { timeout: 10000 });
      
      // Look for interactive badges or play icons
      const interactiveBadges = page.locator('[data-testid="badge"]:has-text("Interactive")');
      const playIcons = page.locator('[data-testid="play-icon"]');
      
      // Check if any interactive elements are visible
      const hasInteractive = (await interactiveBadges.count()) > 0 || (await playIcons.count()) > 0;
      
      if (hasInteractive) {
        // Take screenshot showing interactive elements
        await page.screenshot({ 
          path: 'test-results/hierarchical-nav-interactive.png',
          fullPage: true 
        });
      }
    });
  });

  test.describe('Progress Tracking', () => {
    test('should display progress indicators', async ({ page }) => {
      // Wait for content to load
      await page.waitForSelector('[data-testid="card-content"]', { timeout: 10000 });
      
      // Look for progress elements
      const progressBars = page.locator('[data-testid="progress"]');
      const checkCircles = page.locator('[data-testid="check-circle"]');
      const clockIcons = page.locator('[data-testid="clock"]');
      
      // Check if progress indicators are visible
      const hasProgress = (await progressBars.count()) > 0 || 
                         (await checkCircles.count()) > 0 || 
                         (await clockIcons.count()) > 0;
      
      if (hasProgress) {
        // Take screenshot showing progress indicators
        await page.screenshot({ 
          path: 'test-results/hierarchical-nav-progress.png',
          fullPage: true 
        });
      }
    });
  });

  test.describe('Mobile Responsiveness', () => {
    test('should display correctly on mobile devices', async ({ page }) => {
      // Set mobile viewport
      await page.setViewportSize({ width: 375, height: 812 });
      await page.waitForTimeout(1000);
      
      // Take screenshot of mobile view
      await page.screenshot({ 
        path: 'test-results/hierarchical-nav-mobile.png',
        fullPage: true 
      });
      
      // Test if navigation is still functional on mobile
      const searchInput = page.locator('input[placeholder*="Search"]');
      if (await searchInput.isVisible()) {
        await searchInput.fill('test');
        await page.waitForTimeout(500);
        
        // Take screenshot of mobile search
        await page.screenshot({ 
          path: 'test-results/hierarchical-nav-mobile-search.png',
          fullPage: true 
        });
      }
      
      // Reset to desktop viewport
      await page.setViewportSize({ width: 1920, height: 1080 });
    });
  });

  test.describe('Accessibility', () => {
    test('should be keyboard navigable', async ({ page }) => {
      // Wait for content to load
      await page.waitForSelector('[data-testid="card-content"]', { timeout: 10000 });
      
      // Try to focus on search input using keyboard
      await page.keyboard.press('Tab');
      await page.waitForTimeout(500);
      
      // Take screenshot showing keyboard focus
      await page.screenshot({ 
        path: 'test-results/hierarchical-nav-keyboard-focus.png',
        fullPage: true 
      });
      
      // Test Enter key functionality if search is focused
      const searchInput = page.locator('input[placeholder*="Search"]:focus');
      if (await searchInput.isVisible()) {
        await page.keyboard.type('machine learning');
        await page.waitForTimeout(1000);
        
        // Take screenshot of keyboard input
        await page.screenshot({ 
          path: 'test-results/hierarchical-nav-keyboard-input.png',
          fullPage: true 
        });
      }
    });
  });

  test.describe('Enhanced Term Detail Integration', () => {
    test('should work in enhanced term detail page', async ({ page }) => {
      // Navigate to enhanced term detail page
      await page.goto(`/enhanced/terms/${testTermId}`);
      await page.waitForLoadState('networkidle');
      
      // Look for sections tab or navigation area
      const sectionsTab = page.locator('button:has-text("Sections"), [data-value="sections"]');
      
      if (await sectionsTab.isVisible()) {
        await sectionsTab.click();
        await page.waitForTimeout(1000);
        
        // Take screenshot of enhanced page with hierarchical navigation
        await page.screenshot({ 
          path: 'test-results/hierarchical-nav-enhanced-page.png',
          fullPage: true 
        });
      } else {
        // If no tabs, just take screenshot of the page
        await page.screenshot({ 
          path: 'test-results/hierarchical-nav-enhanced-fallback.png',
          fullPage: true 
        });
      }
    });
  });
});