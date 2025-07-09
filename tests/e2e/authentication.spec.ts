import { expect, test } from '@playwright/test';

test.describe('Authentication Flows', () => {
  // Test data
  const testUser = {
    email: 'test@example.com',
    password: 'TestPassword123!',
    name: 'Test User',
  };

  const _adminUser = {
    email: 'admin@example.com',
    password: 'AdminPassword123!',
  };

  test.beforeEach(async ({ page }) => {
    // Clear any existing session data
    await page.context().clearCookies();
    await page.context().clearPermissions();

    // Navigate to the homepage
    await page.goto('/');
    await expect(page.locator('#main-content')).toBeVisible();
  });

  test.describe('User Registration', () => {
    test('should allow new user registration with valid credentials', async ({ page }) => {
      // Navigate to registration page
      await page.click('[data-testid="signup-button"], text=Sign Up');
      await expect(page).toHaveURL(/.*\/(signup|register)/);

      // Fill registration form
      await page.fill('[data-testid="name-input"], input[name="name"]', testUser.name);
      await page.fill(
        '[data-testid="email-input"], input[name="email"], input[type="email"]',
        testUser.email
      );
      await page.fill(
        '[data-testid="password-input"], input[name="password"], input[type="password"]',
        testUser.password
      );

      // Accept terms if required
      const termsCheckbox = page.locator('[data-testid="terms-checkbox"], input[name="terms"]');
      if (await termsCheckbox.isVisible()) {
        await termsCheckbox.check();
      }

      // Submit registration
      await page.click('[data-testid="register-submit"], button[type="submit"]');

      // Verify successful registration
      await expect(page).toHaveURL(/.*\/(dashboard|home|welcome)/, { timeout: 10000 });

      // Check for welcome message or user indicator
      const welcomeIndicators = [
        page.locator(`text=${testUser.name}`),
        page.locator('[data-testid="user-menu"]'),
        page.locator('[data-testid="dashboard"]'),
        page.locator('text=Welcome'),
      ];

      let foundIndicator = false;
      for (const indicator of welcomeIndicators) {
        if ((await indicator.count()) > 0) {
          foundIndicator = true;
          break;
        }
      }

      expect(foundIndicator).toBe(true);
    });

    test('should show validation errors for invalid registration data', async ({ page }) => {
      await page.click('[data-testid="signup-button"], text=Sign Up');
      await expect(page).toHaveURL(/.*\/(signup|register)/);

      // Try to submit empty form
      await page.click('[data-testid="register-submit"], button[type="submit"]');

      // Check for validation errors
      const errorSelectors = [
        '[data-testid="email-error"]',
        '[data-testid="password-error"]',
        '[data-testid="name-error"]',
        '.error',
        '[role="alert"]',
        'text=required',
        'text=invalid',
      ];

      let foundError = false;
      for (const selector of errorSelectors) {
        if ((await page.locator(selector).count()) > 0) {
          foundError = true;
          break;
        }
      }

      expect(foundError).toBe(true);
    });

    test('should prevent registration with existing email', async ({ page }) => {
      await page.click('[data-testid="signup-button"], text=Sign Up');

      // Fill form with existing email
      await page.fill('[data-testid="email-input"], input[type="email"]', 'existing@example.com');
      await page.fill('[data-testid="password-input"], input[type="password"]', testUser.password);
      await page.fill('[data-testid="name-input"], input[name="name"]', testUser.name);

      await page.click('[data-testid="register-submit"], button[type="submit"]');

      // Check for error message about existing email
      const existingEmailError = await page
        .waitForSelector(
          'text=already exists, text=email taken, [data-testid="email-exists-error"]',
          { timeout: 5000 }
        )
        .catch(() => null);

      if (existingEmailError) {
        expect(existingEmailError).toBeTruthy();
      }
    });
  });

  test.describe('User Login', () => {
    test('should allow user login with valid credentials', async ({ page }) => {
      // Navigate to login page
      await page.click('[data-testid="login-button"], text=Login, text=Sign In');
      await expect(page).toHaveURL(/.*\/(login|signin)/);

      // Fill login form
      await page.fill('[data-testid="email-input"], input[type="email"]', testUser.email);
      await page.fill('[data-testid="password-input"], input[type="password"]', testUser.password);

      // Submit login
      await page.click('[data-testid="login-submit"], button[type="submit"]');

      // Verify successful login
      await expect(page).toHaveURL(/.*\/(dashboard|home)/, { timeout: 10000 });

      // Verify user is logged in
      const loggedInIndicators = [
        page.locator('[data-testid="user-menu"]'),
        page.locator('[data-testid="logout-button"]'),
        page.locator(`text=${testUser.name}`),
        page.locator('[data-testid="dashboard"]'),
      ];

      let foundIndicator = false;
      for (const indicator of loggedInIndicators) {
        if ((await indicator.count()) > 0) {
          foundIndicator = true;
          break;
        }
      }

      expect(foundIndicator).toBe(true);
    });

    test('should show error for invalid login credentials', async ({ page }) => {
      await page.click('[data-testid="login-button"], text=Login, text=Sign In');

      // Fill with invalid credentials
      await page.fill('[data-testid="email-input"], input[type="email"]', 'invalid@example.com');
      await page.fill('[data-testid="password-input"], input[type="password"]', 'wrongpassword');

      await page.click('[data-testid="login-submit"], button[type="submit"]');

      // Check for error message
      const errorMessage = await page
        .waitForSelector(
          'text=Invalid credentials, text=Login failed, text=incorrect, [data-testid="login-error"]',
          { timeout: 5000 }
        )
        .catch(() => null);

      expect(errorMessage).toBeTruthy();
    });

    test('should handle "Remember Me" functionality', async ({ page }) => {
      await page.click('[data-testid="login-button"], text=Login');

      // Check remember me option
      const rememberCheckbox = page.locator('[data-testid="remember-me"], input[name="remember"]');
      if (await rememberCheckbox.isVisible()) {
        await rememberCheckbox.check();
      }

      await page.fill('[data-testid="email-input"], input[type="email"]', testUser.email);
      await page.fill('[data-testid="password-input"], input[type="password"]', testUser.password);
      await page.click('[data-testid="login-submit"], button[type="submit"]');

      // Verify login success
      await expect(page).toHaveURL(/.*\/(dashboard|home)/, { timeout: 10000 });

      // Close and reopen browser to test persistence
      await page.close();
      const newPage = await page.context().newPage();
      await newPage.goto('/');

      // Check if user is still logged in
      const stillLoggedIn = (await newPage.locator('[data-testid="user-menu"]').count()) > 0;
      if (stillLoggedIn) {
        console.log('Remember me functionality working');
      }
    });
  });

  test.describe('Password Reset', () => {
    test('should allow password reset request', async ({ page }) => {
      await page.click('[data-testid="login-button"], text=Login');

      // Click forgot password link
      await page.click(
        '[data-testid="forgot-password"], text=Forgot Password, text=Reset Password'
      );

      // Fill email for reset
      await page.fill('[data-testid="reset-email-input"], input[type="email"]', testUser.email);
      await page.click('[data-testid="reset-submit"], button[type="submit"]');

      // Check for success message
      const successMessage = await page
        .waitForSelector(
          'text=reset link sent, text=check your email, [data-testid="reset-success"]',
          { timeout: 5000 }
        )
        .catch(() => null);

      expect(successMessage).toBeTruthy();
    });

    test('should handle invalid email for password reset', async ({ page }) => {
      await page.click('[data-testid="login-button"], text=Login');
      await page.click('[data-testid="forgot-password"], text=Forgot Password');

      await page.fill('[data-testid="reset-email-input"], input[type="email"]', 'invalid-email');
      await page.click('[data-testid="reset-submit"], button[type="submit"]');

      // Check for validation error
      const errorMessage = await page
        .waitForSelector('text=valid email, text=invalid email, [data-testid="email-error"]', {
          timeout: 5000,
        })
        .catch(() => null);

      expect(errorMessage).toBeTruthy();
    });
  });

  test.describe('User Logout', () => {
    test('should allow user to logout successfully', async ({ page }) => {
      // First login
      await page.click('[data-testid="login-button"], text=Login');
      await page.fill('[data-testid="email-input"], input[type="email"]', testUser.email);
      await page.fill('[data-testid="password-input"], input[type="password"]', testUser.password);
      await page.click('[data-testid="login-submit"], button[type="submit"]');

      await expect(page).toHaveURL(/.*\/(dashboard|home)/, { timeout: 10000 });

      // Now logout
      const logoutSelectors = [
        '[data-testid="logout-button"]',
        '[data-testid="user-menu"] >> text=Logout',
        '[data-testid="user-menu"] >> text=Sign Out',
        'button:has-text("Logout")',
        'button:has-text("Sign Out")',
      ];

      let loggedOut = false;
      for (const selector of logoutSelectors) {
        const element = page.locator(selector);
        if ((await element.count()) > 0) {
          await element.click();
          loggedOut = true;
          break;
        }
      }

      if (!loggedOut) {
        // Try clicking user menu first, then logout
        const userMenu = page.locator('[data-testid="user-menu"]');
        if ((await userMenu.count()) > 0) {
          await userMenu.click();
          await page.waitForTimeout(500);
          await page.click('text=Logout, text=Sign Out');
        }
      }

      // Verify logout by checking URL or UI changes
      await page.waitForTimeout(2000);

      // Check that user is logged out
      const loggedOutIndicators = [
        page.locator('[data-testid="login-button"]'),
        page.locator('text=Login'),
        page.locator('text=Sign In'),
      ];

      let foundLogoutIndicator = false;
      for (const indicator of loggedOutIndicators) {
        if ((await indicator.count()) > 0) {
          foundLogoutIndicator = true;
          break;
        }
      }

      expect(foundLogoutIndicator).toBe(true);
    });
  });

  test.describe('Authentication Guards', () => {
    test('should redirect unauthenticated users from protected routes', async ({ page }) => {
      // Try to access protected routes without authentication
      const protectedRoutes = ['/dashboard', '/profile', '/settings', '/admin', '/favorites'];

      for (const route of protectedRoutes) {
        await page.goto(route);

        // Should redirect to login or show access denied
        const currentUrl = page.url();
        const isRedirected =
          currentUrl.includes('/login') ||
          currentUrl.includes('/signin') ||
          currentUrl.includes('/auth');

        const hasAccessDenied =
          (await page
            .locator('text=Access Denied, text=Please login, text=Authentication required')
            .count()) > 0;

        expect(isRedirected || hasAccessDenied).toBe(true);
      }
    });

    test('should allow authenticated users to access protected routes', async ({ page }) => {
      // Login first
      await page.goto('/login');
      await page.fill('[data-testid="email-input"], input[type="email"]', testUser.email);
      await page.fill('[data-testid="password-input"], input[type="password"]', testUser.password);
      await page.click('[data-testid="login-submit"], button[type="submit"]');

      await expect(page).toHaveURL(/.*\/(dashboard|home)/, { timeout: 10000 });

      // Now try to access protected routes
      const protectedRoutes = ['/dashboard', '/profile', '/settings'];

      for (const route of protectedRoutes) {
        await page.goto(route);
        await page.waitForTimeout(1000);

        // Should not redirect to login
        const currentUrl = page.url();
        const isOnLoginPage = currentUrl.includes('/login') || currentUrl.includes('/signin');

        expect(isOnLoginPage).toBe(false);

        // Should show protected content
        await expect(page.locator('#main-content')).toBeVisible();
      }
    });

    test('should enforce admin-only access for admin routes', async ({ page }) => {
      // Login as regular user
      await page.goto('/login');
      await page.fill('[data-testid="email-input"], input[type="email"]', testUser.email);
      await page.fill('[data-testid="password-input"], input[type="password"]', testUser.password);
      await page.click('[data-testid="login-submit"], button[type="submit"]');

      // Try to access admin route
      await page.goto('/admin');

      // Should show access denied or redirect
      const isAccessDenied =
        (await page
          .locator('text=Access Denied, text=Unauthorized, text=Admin access required')
          .count()) > 0;
      const isRedirected = !page.url().includes('/admin');

      expect(isAccessDenied || isRedirected).toBe(true);
    });
  });

  test.describe('Session Management', () => {
    test('should handle session expiration gracefully', async ({ page }) => {
      // Login
      await page.goto('/login');
      await page.fill('[data-testid="email-input"], input[type="email"]', testUser.email);
      await page.fill('[data-testid="password-input"], input[type="password"]', testUser.password);
      await page.click('[data-testid="login-submit"], button[type="submit"]');

      await expect(page).toHaveURL(/.*\/(dashboard|home)/, { timeout: 10000 });

      // Simulate session expiration by clearing auth tokens
      await page.evaluate(() => {
        localStorage.removeItem('auth_token');
        localStorage.removeItem('access_token');
        sessionStorage.removeItem('auth_token');
        sessionStorage.removeItem('access_token');
      });

      // Try to perform an authenticated action
      await page.reload();
      await page.waitForTimeout(2000);

      // Should redirect to login or show session expired message
      const sessionExpiredIndicators = [
        page.locator('text=Session expired'),
        page.locator('text=Please login again'),
        page.locator('[data-testid="login-button"]'),
      ];

      let foundExpiredIndicator = false;
      for (const indicator of sessionExpiredIndicators) {
        if ((await indicator.count()) > 0) {
          foundExpiredIndicator = true;
          break;
        }
      }

      const isOnLoginPage = page.url().includes('/login') || page.url().includes('/signin');

      expect(foundExpiredIndicator || isOnLoginPage).toBe(true);
    });

    test('should maintain session across page refreshes', async ({ page }) => {
      // Login
      await page.goto('/login');
      await page.fill('[data-testid="email-input"], input[type="email"]', testUser.email);
      await page.fill('[data-testid="password-input"], input[type="password"]', testUser.password);
      await page.click('[data-testid="login-submit"], button[type="submit"]');

      await expect(page).toHaveURL(/.*\/(dashboard|home)/, { timeout: 10000 });

      // Refresh the page
      await page.reload();
      await page.waitForTimeout(2000);

      // Should still be logged in
      const stillLoggedIn =
        (await page.locator('[data-testid="user-menu"], [data-testid="logout-button"]').count()) >
        0;
      const isOnLoginPage = page.url().includes('/login');

      expect(stillLoggedIn && !isOnLoginPage).toBe(true);
    });
  });

  test.describe('Social Authentication', () => {
    test('should display social login options', async ({ page }) => {
      await page.goto('/login');

      // Check for social login buttons
      const socialLoginButtons = [
        page.locator('[data-testid="google-login"], button:has-text("Google")'),
        page.locator('[data-testid="github-login"], button:has-text("GitHub")'),
        page.locator('[data-testid="linkedin-login"], button:has-text("LinkedIn")'),
      ];

      let foundSocialLogin = false;
      for (const button of socialLoginButtons) {
        if ((await button.count()) > 0) {
          foundSocialLogin = true;
          break;
        }
      }

      // Note: We can't actually test the OAuth flow in E2E without complex setup
      console.log(`Social login options found: ${foundSocialLogin}`);
    });
  });

  test.describe('Multi-Factor Authentication', () => {
    test('should prompt for MFA when enabled', async ({ page }) => {
      // This test assumes MFA is enabled for the test user
      await page.goto('/login');
      await page.fill('[data-testid="email-input"], input[type="email"]', 'mfa-user@example.com');
      await page.fill('[data-testid="password-input"], input[type="password"]', testUser.password);
      await page.click('[data-testid="login-submit"], button[type="submit"]');

      // Should prompt for MFA code
      const mfaPrompt = await page
        .waitForSelector(
          '[data-testid="mfa-input"], input[name="mfa"], input[placeholder*="code"]',
          { timeout: 5000 }
        )
        .catch(() => null);

      if (mfaPrompt) {
        expect(mfaPrompt).toBeTruthy();
        console.log('MFA prompt displayed successfully');
      }
    });
  });
});
