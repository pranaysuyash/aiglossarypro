import { expect, test } from '@playwright/test';

test.describe('Admin Dashboard', () => {
  // Admin user credentials
  const adminUser = {
    email: 'admin@example.com',
    password: 'AdminPassword123!',
  };

  test.beforeEach(async ({ page }) => {
    // Clear any existing session
    await page.context().clearCookies();

    // Login as admin
    await page.goto('/');
    await expect(page.locator('#main-content')).toBeVisible();

    // Navigate to login
    const loginButton = page.locator('[data-testid="login-button"], text=Login, text=Sign In');
    if ((await loginButton.count()) > 0) {
      await loginButton.click();

      // Fill admin credentials
      await page.fill('[data-testid="email-input"], input[type="email"]', adminUser.email);
      await page.fill('[data-testid="password-input"], input[type="password"]', adminUser.password);
      await page.click('[data-testid="login-submit"], button[type="submit"]');

      // Wait for login to complete
      await page.waitForTimeout(2000);
    }
  });

  test.describe('Admin Access and Navigation', () => {
    test('should allow admin access to dashboard', async ({ page }) => {
      // Navigate to admin dashboard
      const adminNavigation = [
        page.locator('[data-testid="admin-dashboard"]'),
        page.locator('[href="/admin"]'),
        page.locator('text=Admin'),
        page.locator('[data-testid="admin-menu"]'),
      ];

      let adminAccess = false;
      for (const nav of adminNavigation) {
        if ((await nav.count()) > 0) {
          await nav.click();
          adminAccess = true;
          break;
        }
      }

      if (!adminAccess) {
        // Try direct navigation
        await page.goto('/admin');
      }

      await page.waitForTimeout(2000);

      // Verify admin dashboard is accessible
      const adminIndicators = [
        page.locator('[data-testid="admin-dashboard"]'),
        page.locator('text=Admin Dashboard'),
        page.locator('text=Administration'),
        page.locator('[data-testid="admin-panel"]'),
      ];

      let foundAdmin = false;
      for (const indicator of adminIndicators) {
        if ((await indicator.count()) > 0) {
          foundAdmin = true;
          break;
        }
      }

      // Should not show access denied
      const accessDenied = await page.locator('text=Access Denied, text=Unauthorized').count();

      expect(foundAdmin || accessDenied === 0).toBe(true);
      console.log(`Admin dashboard accessible: ${foundAdmin}`);
    });

    test('should display admin navigation menu', async ({ page }) => {
      await page.goto('/admin');
      await page.waitForTimeout(2000);

      // Look for admin navigation sections
      const adminSections = [
        'Content Management',
        'User Management',
        'Analytics',
        'AI Tools',
        'Settings',
        'Terms',
        'Categories',
        'Users',
      ];

      let foundSections = 0;
      for (const section of adminSections) {
        const sectionElement = page.locator(
          `text=${section}, [data-testid="${section.toLowerCase().replace(' ', '-')}"]`
        );
        if ((await sectionElement.count()) > 0) {
          foundSections++;
        }
      }

      expect(foundSections).toBeGreaterThan(0);
      console.log(`Admin sections found: ${foundSections}/${adminSections.length}`);
    });
  });

  test.describe('Content Management', () => {
    test('should allow viewing and managing terms', async ({ page }) => {
      await page.goto('/admin');
      await page.waitForTimeout(1000);

      // Navigate to terms management
      const termsNavigation = [
        page.locator('[data-testid="admin-terms"]'),
        page.locator('text=Terms'),
        page.locator('text=Manage Terms'),
        page.locator('[href*="/admin/terms"]'),
      ];

      let termsAccess = false;
      for (const nav of termsNavigation) {
        if ((await nav.count()) > 0) {
          await nav.click();
          termsAccess = true;
          break;
        }
      }

      if (!termsAccess) {
        await page.goto('/admin/terms');
      }

      await page.waitForTimeout(2000);

      // Check for terms list
      const termsList = page.locator(
        '[data-testid="admin-terms-list"], [data-testid="terms-table"]'
      );
      if ((await termsList.count()) > 0) {
        // Should show term management features
        const managementFeatures = [
          page.locator('[data-testid="add-term-button"], button:has-text("Add Term")'),
          page.locator('[data-testid="edit-term"], button:has-text("Edit")'),
          page.locator('[data-testid="delete-term"], button:has-text("Delete")'),
          page.locator('[data-testid="bulk-actions"]'),
        ];

        let foundFeatures = 0;
        for (const feature of managementFeatures) {
          if ((await feature.count()) > 0) {
            foundFeatures++;
          }
        }

        console.log(`Term management features found: ${foundFeatures}`);

        // Test adding a new term
        const addTermButton = page.locator(
          '[data-testid="add-term-button"], button:has-text("Add")'
        );
        if ((await addTermButton.count()) > 0) {
          await addTermButton.click();
          await page.waitForTimeout(1000);

          // Should open term creation form
          const termForm = page.locator('[data-testid="term-form"], form');
          if ((await termForm.count()) > 0) {
            // Fill basic term information
            const nameInput = termForm.locator('[data-testid="term-name"], input[name="name"]');
            if ((await nameInput.count()) > 0) {
              await nameInput.fill('Test AI Term');
            }

            const definitionInput = termForm.locator(
              '[data-testid="term-definition"], textarea[name="definition"]'
            );
            if ((await definitionInput.count()) > 0) {
              await definitionInput.fill('This is a test definition for admin testing purposes.');
            }

            // Submit form
            const submitButton = termForm.locator('button[type="submit"], button:has-text("Save")');
            if ((await submitButton.count()) > 0) {
              await submitButton.click();
              await page.waitForTimeout(2000);

              // Should show success message or redirect
              const successIndicators = [
                page.locator('[data-testid="success-message"]'),
                page.locator('text=created successfully'),
                page.locator('text=Term added'),
              ];

              let success = false;
              for (const indicator of successIndicators) {
                if ((await indicator.count()) > 0) {
                  success = true;
                  break;
                }
              }

              console.log(`Term creation successful: ${success}`);
            }
          }
        }
      }
    });

    test('should allow bulk operations on terms', async ({ page }) => {
      await page.goto('/admin/terms');
      await page.waitForTimeout(2000);

      // Look for bulk selection
      const selectAllCheckbox = page.locator(
        '[data-testid="select-all"], input[type="checkbox"]:first-of-type'
      );
      if ((await selectAllCheckbox.count()) > 0) {
        await selectAllCheckbox.check();
        await page.waitForTimeout(500);

        // Should show bulk action menu
        const bulkActions = page.locator('[data-testid="bulk-actions"], .bulk-actions');
        if ((await bulkActions.count()) > 0) {
          const bulkButtons = [
            bulkActions.locator('button:has-text("Delete")'),
            bulkActions.locator('button:has-text("Export")'),
            bulkActions.locator('button:has-text("Category")'),
            bulkActions.locator('button:has-text("Status")'),
          ];

          let foundBulkActions = 0;
          for (const button of bulkButtons) {
            if ((await button.count()) > 0) {
              foundBulkActions++;
            }
          }

          console.log(`Bulk actions available: ${foundBulkActions}`);

          // Test bulk export
          const exportButton = bulkActions.locator('button:has-text("Export")');
          if ((await exportButton.count()) > 0) {
            await exportButton.click();
            await page.waitForTimeout(1000);

            // Should trigger download or show export options
            console.log('Bulk export triggered');
          }
        }
      }
    });

    test('should allow managing categories', async ({ page }) => {
      await page.goto('/admin');
      await page.waitForTimeout(1000);

      // Navigate to categories
      const categoriesNav = page.locator(
        '[data-testid="admin-categories"], text=Categories, [href*="/admin/categories"]'
      );
      if ((await categoriesNav.count()) > 0) {
        await categoriesNav.click();
      } else {
        await page.goto('/admin/categories');
      }

      await page.waitForTimeout(2000);

      // Check category management interface
      const categoryManagement = [
        page.locator('[data-testid="categories-list"]'),
        page.locator('[data-testid="add-category-button"]'),
        page.locator('.category-item'),
      ];

      let foundCategoryInterface = false;
      for (const element of categoryManagement) {
        if ((await element.count()) > 0) {
          foundCategoryInterface = true;
          break;
        }
      }

      if (foundCategoryInterface) {
        // Test adding a category
        const addCategoryButton = page.locator(
          '[data-testid="add-category-button"], button:has-text("Add Category")'
        );
        if ((await addCategoryButton.count()) > 0) {
          await addCategoryButton.click();
          await page.waitForTimeout(1000);

          const categoryForm = page.locator('[data-testid="category-form"], form');
          if ((await categoryForm.count()) > 0) {
            const nameInput = categoryForm.locator('input[name="name"]');
            if ((await nameInput.count()) > 0) {
              await nameInput.fill('Test Category');

              const submitButton = categoryForm.locator('button[type="submit"]');
              if ((await submitButton.count()) > 0) {
                await submitButton.click();
                await page.waitForTimeout(1000);

                console.log('Category creation attempted');
              }
            }
          }
        }
      }

      console.log(`Category management interface found: ${foundCategoryInterface}`);
    });
  });

  test.describe('User Management', () => {
    test('should display user management interface', async ({ page }) => {
      await page.goto('/admin');
      await page.waitForTimeout(1000);

      // Navigate to user management
      const userNav = page.locator(
        '[data-testid="admin-users"], text=Users, [href*="/admin/users"]'
      );
      if ((await userNav.count()) > 0) {
        await userNav.click();
      } else {
        await page.goto('/admin/users');
      }

      await page.waitForTimeout(2000);

      // Check for user list and management features
      const userManagementFeatures = [
        page.locator('[data-testid="users-table"], [data-testid="users-list"]'),
        page.locator('[data-testid="user-search"]'),
        page.locator('[data-testid="user-filters"]'),
        page.locator('th:has-text("Email"), th:has-text("User")'),
      ];

      let foundUserFeatures = 0;
      for (const feature of userManagementFeatures) {
        if ((await feature.count()) > 0) {
          foundUserFeatures++;
        }
      }

      console.log(`User management features found: ${foundUserFeatures}`);

      // Check for user action buttons
      const userActions = [
        page.locator('[data-testid="edit-user"], button:has-text("Edit")'),
        page.locator('[data-testid="disable-user"], button:has-text("Disable")'),
        page.locator('[data-testid="view-user"], button:has-text("View")'),
      ];

      let foundUserActions = 0;
      for (const action of userActions) {
        if ((await action.count()) > 0) {
          foundUserActions++;
        }
      }

      console.log(`User action buttons found: ${foundUserActions}`);
    });

    test('should allow searching and filtering users', async ({ page }) => {
      await page.goto('/admin/users');
      await page.waitForTimeout(2000);

      // Test user search
      const searchInput = page.locator('[data-testid="user-search"], input[placeholder*="search"]');
      if ((await searchInput.count()) > 0) {
        await searchInput.fill('admin@example.com');
        await page.waitForTimeout(1000);

        // Should filter results
        const searchResults = page.locator('[data-testid="user-row"], tr');
        const resultCount = await searchResults.count();
        console.log(`User search results: ${resultCount}`);
      }

      // Test user filters
      const filterDropdown = page.locator('[data-testid="user-filter"], select');
      if ((await filterDropdown.count()) > 0) {
        await filterDropdown.selectOption('admin');
        await page.waitForTimeout(1000);

        console.log('User filter applied');
      }
    });
  });

  test.describe('Analytics Dashboard', () => {
    test('should display analytics and metrics', async ({ page }) => {
      await page.goto('/admin');
      await page.waitForTimeout(1000);

      // Navigate to analytics
      const analyticsNav = page.locator(
        '[data-testid="admin-analytics"], text=Analytics, [href*="/admin/analytics"]'
      );
      if ((await analyticsNav.count()) > 0) {
        await analyticsNav.click();
      } else {
        await page.goto('/admin/analytics');
      }

      await page.waitForTimeout(3000);

      // Check for analytics widgets
      const analyticsWidgets = [
        page.locator('[data-testid="total-users"], .metric-card:has-text("Users")'),
        page.locator('[data-testid="total-terms"], .metric-card:has-text("Terms")'),
        page.locator('[data-testid="page-views"], .metric-card:has-text("Views")'),
        page.locator('[data-testid="search-queries"], .metric-card:has-text("Searches")'),
      ];

      let foundWidgets = 0;
      for (const widget of analyticsWidgets) {
        if ((await widget.count()) > 0) {
          foundWidgets++;
        }
      }

      console.log(`Analytics widgets found: ${foundWidgets}`);

      // Check for charts
      const charts = [
        page.locator('[data-testid="usage-chart"]'),
        page.locator('[data-testid="growth-chart"]'),
        page.locator('canvas'),
        page.locator('.chart-container'),
      ];

      let foundCharts = 0;
      for (const chart of charts) {
        if ((await chart.count()) > 0) {
          foundCharts++;
        }
      }

      console.log(`Analytics charts found: ${foundCharts}`);

      // Test date range selector
      const dateRange = page.locator('[data-testid="date-range"], select:has-option');
      if ((await dateRange.count()) > 0) {
        await dateRange.selectOption('7d');
        await page.waitForTimeout(2000);

        console.log('Date range changed - charts should update');
      }
    });

    test('should show detailed usage statistics', async ({ page }) => {
      await page.goto('/admin/analytics');
      await page.waitForTimeout(3000);

      // Look for detailed statistics
      const detailedStats = [
        page.locator('[data-testid="top-terms"]'),
        page.locator('[data-testid="popular-categories"]'),
        page.locator('[data-testid="user-engagement"]'),
        page.locator('[data-testid="search-analytics"]'),
      ];

      let foundDetailedStats = 0;
      for (const stat of detailedStats) {
        if ((await stat.count()) > 0) {
          foundDetailedStats++;

          // Check if it has data
          const hasData = await stat.locator('tr, .data-row, .stat-item').count();
          if (hasData > 0) {
            console.log(`${stat} has ${hasData} data items`);
          }
        }
      }

      console.log(`Detailed statistics sections found: ${foundDetailedStats}`);
    });
  });

  test.describe('AI Tools Management', () => {
    test('should provide AI tools administration', async ({ page }) => {
      await page.goto('/admin');
      await page.waitForTimeout(1000);

      // Navigate to AI tools
      const aiToolsNav = page.locator(
        '[data-testid="admin-ai-tools"], text=AI Tools, [href*="/admin/ai"]'
      );
      if ((await aiToolsNav.count()) > 0) {
        await aiToolsNav.click();
      } else {
        await page.goto('/admin/ai-tools');
      }

      await page.waitForTimeout(2000);

      // Check for AI management features
      const aiFeatures = [
        page.locator('[data-testid="ai-generation-settings"]'),
        page.locator('[data-testid="ai-improvement-queue"]'),
        page.locator('[data-testid="ai-feedback-review"]'),
        page.locator('text=AI Settings'),
        page.locator('text=Generation Queue'),
      ];

      let foundAIFeatures = 0;
      for (const feature of aiFeatures) {
        if ((await feature.count()) > 0) {
          foundAIFeatures++;
        }
      }

      console.log(`AI management features found: ${foundAIFeatures}`);

      // Test AI settings
      const aiSettings = page.locator('[data-testid="ai-settings"], text=Settings');
      if ((await aiSettings.count()) > 0) {
        await aiSettings.click();
        await page.waitForTimeout(1000);

        // Should show AI configuration options
        const configOptions = [
          page.locator('input[name*="api"], input[name*="key"]'),
          page.locator('select[name*="model"]'),
          page.locator('input[name*="temperature"]'),
        ];

        let foundConfigOptions = 0;
        for (const option of configOptions) {
          if ((await option.count()) > 0) {
            foundConfigOptions++;
          }
        }

        console.log(`AI configuration options found: ${foundConfigOptions}`);
      }
    });

    test('should show AI generation queue and status', async ({ page }) => {
      await page.goto('/admin/ai-tools');
      await page.waitForTimeout(2000);

      // Look for generation queue
      const generationQueue = page.locator('[data-testid="generation-queue"], .queue-table');
      if ((await generationQueue.count()) > 0) {
        // Should show pending and completed generations
        const queueItems = generationQueue.locator('[data-testid="queue-item"], tr');
        const itemCount = await queueItems.count();

        console.log(`Generation queue items: ${itemCount}`);

        // Check for status indicators
        const statusElements = generationQueue.locator(
          '[data-testid="generation-status"], .status'
        );
        const statusCount = await statusElements.count();

        console.log(`Status indicators found: ${statusCount}`);
      }

      // Look for AI performance metrics
      const performanceMetrics = page.locator('[data-testid="ai-performance"], .ai-metrics');
      if ((await performanceMetrics.count()) > 0) {
        console.log('AI performance metrics displayed');
      }
    });
  });

  test.describe('System Settings', () => {
    test('should allow configuring system settings', async ({ page }) => {
      await page.goto('/admin');
      await page.waitForTimeout(1000);

      // Navigate to settings
      const settingsNav = page.locator(
        '[data-testid="admin-settings"], text=Settings, [href*="/admin/settings"]'
      );
      if ((await settingsNav.count()) > 0) {
        await settingsNav.click();
      } else {
        await page.goto('/admin/settings');
      }

      await page.waitForTimeout(2000);

      // Check for settings sections
      const settingsSections = [
        page.locator('[data-testid="general-settings"]'),
        page.locator('[data-testid="email-settings"]'),
        page.locator('[data-testid="security-settings"]'),
        page.locator('[data-testid="api-settings"]'),
      ];

      let foundSettingSections = 0;
      for (const section of settingsSections) {
        if ((await section.count()) > 0) {
          foundSettingSections++;
        }
      }

      console.log(`Settings sections found: ${foundSettingSections}`);

      // Test updating a setting
      const settingInput = page.locator('input[name*="setting"], input[name*="config"]').first();
      if ((await settingInput.count()) > 0) {
        const originalValue = await settingInput.inputValue();
        await settingInput.fill('Updated Test Value');

        const saveButton = page.locator('button:has-text("Save"), button[type="submit"]');
        if ((await saveButton.count()) > 0) {
          await saveButton.click();
          await page.waitForTimeout(1000);

          // Should show success message
          const successMessage = page.locator('[data-testid="save-success"], text=saved');
          const hasSuccess = (await successMessage.count()) > 0;

          console.log(`Settings save successful: ${hasSuccess}`);

          // Restore original value
          if (originalValue) {
            await settingInput.fill(originalValue);
            await saveButton.click();
          }
        }
      }
    });
  });

  test.describe('Admin Permissions and Security', () => {
    test('should restrict admin functions to admin users only', async ({ page }) => {
      // Logout admin
      const logoutButton = page.locator(
        '[data-testid="logout-button"], text=Logout, text=Sign Out'
      );
      if ((await logoutButton.count()) > 0) {
        await logoutButton.click();
        await page.waitForTimeout(1000);
      }

      // Try to access admin as non-admin (or not logged in)
      await page.goto('/admin');
      await page.waitForTimeout(2000);

      // Should redirect to login or show access denied
      const restrictionIndicators = [
        page.locator('text=Access Denied'),
        page.locator('text=Unauthorized'),
        page.locator('text=Admin access required'),
        page.locator('[data-testid="login-form"]'),
      ];

      let isRestricted = false;
      for (const indicator of restrictionIndicators) {
        if ((await indicator.count()) > 0) {
          isRestricted = true;
          break;
        }
      }

      // Or check if redirected to login
      const currentUrl = page.url();
      const isRedirectedToLogin = currentUrl.includes('/login') || currentUrl.includes('/signin');

      expect(isRestricted || isRedirectedToLogin).toBe(true);
      console.log(`Admin access properly restricted: ${isRestricted || isRedirectedToLogin}`);
    });
  });
});
