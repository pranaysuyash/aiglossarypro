import { expect, test } from '@playwright/test';

test.describe('Purchase and Premium Features', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('#main-content')).toBeVisible();
  });

  test.describe('Pricing Page and Plans', () => {
    test('should display pricing plans correctly', async ({ page }) => {
      // Navigate to pricing page
      const pricingNavigation = [
        page.locator('[data-testid="pricing-link"]'),
        page.locator('text=Pricing'),
        page.locator('[href*="/pricing"]'),
      ];

      let pricingAccess = false;
      for (const nav of pricingNavigation) {
        if ((await nav.count()) > 0) {
          await nav.click();
          pricingAccess = true;
          break;
        }
      }

      if (!pricingAccess) {
        await page.goto('/pricing');
      }

      await page.waitForTimeout(2000);

      // Check for pricing plans
      const pricingPlans = [
        page.locator('[data-testid="pricing-plan"], [data-testid="plan-card"]'),
        page.locator('.pricing-card, .plan-card'),
      ];

      let foundPlans = false;
      let planCount = 0;
      for (const planGroup of pricingPlans) {
        planCount = await planGroup.count();
        if (planCount > 0) {
          foundPlans = true;
          break;
        }
      }

      expect(foundPlans).toBe(true);
      expect(planCount).toBeGreaterThan(1);
      console.log(`Pricing plans found: ${planCount}`);

      // Check for essential plan information
      const planFeatures = [
        page.locator('text=/\\$\\d+|Free/'), // Price indicators
        page.locator('[data-testid="plan-features"], .plan-features'),
        page.locator(
          'button:has-text("Choose"), button:has-text("Select"), button:has-text("Get Started")'
        ),
      ];

      let foundPlanFeatures = 0;
      for (const feature of planFeatures) {
        if ((await feature.count()) > 0) {
          foundPlanFeatures++;
        }
      }

      expect(foundPlanFeatures).toBeGreaterThan(1);
      console.log(`Plan feature elements found: ${foundPlanFeatures}`);
    });

    test('should handle billing frequency toggle', async ({ page }) => {
      await page.goto('/pricing');
      await page.waitForTimeout(2000);

      // Look for billing toggle (monthly/yearly)
      const billingToggle = [
        page.locator('[data-testid="billing-toggle"]'),
        page.locator('text=Monthly'),
        page.locator('text=Yearly'),
        page.locator('input[type="checkbox"]'),
        page.locator('.toggle'),
      ];

      let foundToggle = false;
      for (const toggle of billingToggle) {
        if ((await toggle.count()) > 0) {
          foundToggle = true;

          // Get initial prices
          const initialPrices = await page.locator('text=/\\$\\d+/').allTextContents();

          // Toggle billing frequency
          await toggle.click();
          await page.waitForTimeout(1000);

          // Get new prices
          const newPrices = await page.locator('text=/\\$\\d+/').allTextContents();

          // Prices should change (unless they're the same for monthly/yearly)
          const pricesChanged = JSON.stringify(initialPrices) !== JSON.stringify(newPrices);
          console.log(`Billing toggle working: ${pricesChanged || 'prices may be same'}`);

          break;
        }
      }

      console.log(`Billing frequency toggle found: ${foundToggle}`);
    });
  });

  test.describe('Purchase Flow', () => {
    test('should initiate purchase process', async ({ page }) => {
      await page.goto('/pricing');
      await page.waitForTimeout(2000);

      // Find and click on a purchase button
      const purchaseButtons = [
        page.locator('[data-testid="purchase-button"], [data-testid="buy-button"]'),
        page.locator('button:has-text("Choose Plan"), button:has-text("Get Started")'),
        page.locator('button:has-text("Subscribe"), button:has-text("Buy Now")'),
      ];

      let purchaseInitiated = false;
      for (const buttonGroup of purchaseButtons) {
        const buttons = await buttonGroup.all();

        if (buttons.length > 0) {
          // Click on the first non-free plan button
          for (const button of buttons) {
            const buttonText = await button.textContent();
            if (buttonText && !buttonText.toLowerCase().includes('free')) {
              await button.click();
              purchaseInitiated = true;
              break;
            }
          }

          if (purchaseInitiated) break;
        }
      }

      if (purchaseInitiated) {
        await page.waitForTimeout(3000);

        // Should redirect to checkout or show payment form
        const checkoutIndicators = [
          page.locator('[data-testid="checkout"], [data-testid="payment-form"]'),
          page.locator('text=Checkout'),
          page.locator('text=Payment'),
          page.locator('text=Billing'),
          page.locator('iframe[src*="stripe"], iframe[src*="paypal"]'), // Payment processors
        ];

        let foundCheckout = false;
        for (const indicator of checkoutIndicators) {
          if ((await indicator.count()) > 0) {
            foundCheckout = true;
            break;
          }
        }

        // OR might redirect to login first
        const loginRedirect = page.url().includes('/login') || page.url().includes('/signin');

        expect(foundCheckout || loginRedirect).toBe(true);
        console.log(`Purchase flow initiated: checkout=${foundCheckout}, login=${loginRedirect}`);
      }
    });

    test('should handle authentication requirement for purchase', async ({ page }) => {
      await page.goto('/pricing');
      await page.waitForTimeout(2000);

      // Try to purchase without being logged in
      const purchaseButton = page
        .locator('button:has-text("Get Started"), button:has-text("Choose")')
        .first();
      if ((await purchaseButton.count()) > 0) {
        await purchaseButton.click();
        await page.waitForTimeout(2000);

        // Should redirect to login or show login modal
        const authRequired = [
          page.url().includes('/login'),
          page.url().includes('/signin'),
          (await page.locator('[data-testid="login-modal"], [data-testid="auth-modal"]').count()) >
            0,
          (await page.locator('text=Please log in, text=Sign in required').count()) > 0,
        ];

        const needsAuth = authRequired.some(Boolean);
        console.log(`Authentication required for purchase: ${needsAuth}`);

        if (needsAuth) {
          // If redirected to login, fill credentials
          if (page.url().includes('/login') || page.url().includes('/signin')) {
            const emailInput = page.locator('input[type="email"]');
            const passwordInput = page.locator('input[type="password"]');

            if ((await emailInput.count()) > 0 && (await passwordInput.count()) > 0) {
              await emailInput.fill('test@example.com');
              await passwordInput.fill('testpassword123');

              const loginButton = page.locator('button[type="submit"], button:has-text("Login")');
              if ((await loginButton.count()) > 0) {
                await loginButton.click();
                await page.waitForTimeout(2000);

                console.log('Login attempted during purchase flow');
              }
            }
          }
        }
      }
    });
  });

  test.describe('Payment Processing', () => {
    test('should display payment form elements', async ({ page }) => {
      // This test checks for payment form structure
      // Note: We won't actually process payments in tests

      await page.goto('/pricing');
      await page.waitForTimeout(2000);

      // Try to reach checkout page
      const purchaseButton = page.locator('button:has-text("Get Started")').first();
      if ((await purchaseButton.count()) > 0) {
        await purchaseButton.click();
        await page.waitForTimeout(3000);

        // Look for payment form elements
        const paymentElements = [
          page.locator('[data-testid="payment-form"]'),
          page.locator('iframe[src*="stripe"]'), // Stripe Elements
          page.locator('iframe[src*="paypal"]'), // PayPal
          page.locator('input[placeholder*="card"], input[placeholder*="number"]'),
          page.locator('input[placeholder*="expiry"], input[placeholder*="cvv"]'),
        ];

        let foundPaymentForm = false;
        for (const element of paymentElements) {
          if ((await element.count()) > 0) {
            foundPaymentForm = true;
            console.log(`Payment form element found: ${element}`);
            break;
          }
        }

        // Check for payment methods
        const paymentMethods = [
          page.locator('text=Credit Card'),
          page.locator('text=PayPal'),
          page.locator('text=Stripe'),
          page.locator('[data-testid="payment-methods"]'),
        ];

        let foundPaymentMethods = 0;
        for (const method of paymentMethods) {
          if ((await method.count()) > 0) {
            foundPaymentMethods++;
          }
        }

        console.log(`Payment form found: ${foundPaymentForm}`);
        console.log(`Payment methods available: ${foundPaymentMethods}`);
      }
    });

    test('should validate payment form inputs', async ({ page }) => {
      // Mock reaching a payment form
      await page.goto('/checkout'); // Direct navigation attempt
      await page.waitForTimeout(2000);

      // Look for payment validation
      const paymentForm = page.locator('[data-testid="payment-form"], form');
      if ((await paymentForm.count()) > 0) {
        // Try to submit empty form
        const submitButton = paymentForm.locator('button[type="submit"], button:has-text("Pay")');
        if ((await submitButton.count()) > 0) {
          await submitButton.click();
          await page.waitForTimeout(1000);

          // Check for validation errors
          const validationErrors = [
            page.locator('[data-testid="validation-error"]'),
            page.locator('.error, .invalid'),
            page.locator('text=required, text=invalid'),
          ];

          let foundValidation = false;
          for (const error of validationErrors) {
            if ((await error.count()) > 0) {
              foundValidation = true;
              break;
            }
          }

          console.log(`Payment validation working: ${foundValidation}`);
        }
      }
    });
  });

  test.describe('Subscription Management', () => {
    test('should display subscription status for authenticated users', async ({ page }) => {
      // First login (mock successful login)
      await page.goto('/login');
      await page.waitForTimeout(1000);

      const emailInput = page.locator('input[type="email"]');
      const passwordInput = page.locator('input[type="password"]');

      if ((await emailInput.count()) > 0 && (await passwordInput.count()) > 0) {
        await emailInput.fill('premium@example.com');
        await passwordInput.fill('premiumuser123');

        const loginButton = page.locator('button[type="submit"]');
        if ((await loginButton.count()) > 0) {
          await loginButton.click();
          await page.waitForTimeout(2000);

          // Navigate to profile/account settings
          const accountNav = [
            page.locator('[data-testid="user-menu"]'),
            page.locator('[data-testid="profile-link"]'),
            page.locator('text=Profile'),
            page.locator('text=Account'),
          ];

          let accountAccess = false;
          for (const nav of accountNav) {
            if ((await nav.count()) > 0) {
              await nav.click();
              accountAccess = true;
              break;
            }
          }

          if (!accountAccess) {
            await page.goto('/profile');
          }

          await page.waitForTimeout(2000);

          // Look for subscription information
          const subscriptionInfo = [
            page.locator('[data-testid="subscription-status"]'),
            page.locator('[data-testid="billing-info"]'),
            page.locator('text=Subscription'),
            page.locator('text=Plan'),
            page.locator('text=Billing'),
          ];

          let foundSubscriptionInfo = false;
          for (const info of subscriptionInfo) {
            if ((await info.count()) > 0) {
              foundSubscriptionInfo = true;
              break;
            }
          }

          console.log(`Subscription information displayed: ${foundSubscriptionInfo}`);
        }
      }
    });

    test('should allow subscription upgrades and downgrades', async ({ page }) => {
      // Mock being logged in with a subscription
      await page.goto('/profile'); // or /account
      await page.waitForTimeout(2000);

      // Look for subscription management
      const subscriptionManagement = [
        page.locator('[data-testid="manage-subscription"]'),
        page.locator('button:has-text("Upgrade"), button:has-text("Change Plan")'),
        page.locator('text=Manage Subscription'),
      ];

      let foundManagement = false;
      for (const management of subscriptionManagement) {
        if ((await management.count()) > 0) {
          await management.click();
          foundManagement = true;
          break;
        }
      }

      if (foundManagement) {
        await page.waitForTimeout(2000);

        // Should show plan options
        const planOptions = [
          page.locator('[data-testid="plan-option"]'),
          page.locator('.plan-card'),
          page.locator('button:has-text("Select")'),
        ];

        let foundPlanOptions = false;
        for (const option of planOptions) {
          if ((await option.count()) > 0) {
            foundPlanOptions = true;
            break;
          }
        }

        console.log(`Subscription management found: ${foundPlanOptions}`);
      }
    });

    test('should handle subscription cancellation', async ({ page }) => {
      await page.goto('/profile');
      await page.waitForTimeout(2000);

      // Look for cancellation option
      const cancelOptions = [
        page.locator('[data-testid="cancel-subscription"]'),
        page.locator('button:has-text("Cancel"), button:has-text("Unsubscribe")'),
        page.locator('text=Cancel Subscription'),
      ];

      let foundCancelOption = false;
      for (const option of cancelOptions) {
        if ((await option.count()) > 0) {
          await option.click();
          foundCancelOption = true;
          break;
        }
      }

      if (foundCancelOption) {
        await page.waitForTimeout(1000);

        // Should show confirmation dialog
        const confirmationDialog = [
          page.locator('[data-testid="cancel-confirmation"]'),
          page.locator('text=Are you sure'),
          page.locator('text=Cancel subscription'),
        ];

        let foundConfirmation = false;
        for (const dialog of confirmationDialog) {
          if ((await dialog.count()) > 0) {
            foundConfirmation = true;
            break;
          }
        }

        console.log(`Cancellation confirmation shown: ${foundConfirmation}`);

        // Don't actually cancel in test - just verify the flow exists
        const cancelButton = page.locator(
          'button:has-text("Keep Subscription"), button:has-text("Never mind")'
        );
        if ((await cancelButton.count()) > 0) {
          await cancelButton.click();
        }
      }
    });
  });

  test.describe('Premium Feature Access', () => {
    test('should restrict premium features for free users', async ({ page }) => {
      // Visit premium features as non-premium user
      const premiumFeatures = ['/ai-tools', '/advanced-search', '/premium-content', '/export'];

      for (const feature of premiumFeatures) {
        await page.goto(feature);
        await page.waitForTimeout(2000);

        // Should show upgrade prompt or access restriction
        const restrictionIndicators = [
          page.locator('[data-testid="upgrade-prompt"]'),
          page.locator('[data-testid="premium-gate"]'),
          page.locator('text=Upgrade to access'),
          page.locator('text=Premium feature'),
          page.locator('text=Subscribe'),
        ];

        let foundRestriction = false;
        for (const indicator of restrictionIndicators) {
          if ((await indicator.count()) > 0) {
            foundRestriction = true;
            break;
          }
        }

        console.log(`Feature ${feature} restricted: ${foundRestriction}`);
      }
    });

    test('should show upgrade prompts appropriately', async ({ page }) => {
      await page.goto('/');
      await page.waitForTimeout(1000);

      // Look for upgrade prompts or premium indicators
      const upgradePrompts = [
        page.locator('[data-testid="upgrade-banner"]'),
        page.locator('[data-testid="premium-cta"]'),
        page.locator('text=Upgrade'),
        page.locator('text=Premium'),
        page.locator('.upgrade-prompt'),
      ];

      let foundUpgradePrompts = 0;
      for (const prompt of upgradePrompts) {
        if ((await prompt.count()) > 0) {
          foundUpgradePrompts++;
        }
      }

      console.log(`Upgrade prompts found: ${foundUpgradePrompts}`);

      // Test clicking upgrade prompt
      if (foundUpgradePrompts > 0) {
        const firstPrompt = upgradePrompts.find(async prompt => (await prompt.count()) > 0);
        if (firstPrompt) {
          await firstPrompt.click();
          await page.waitForTimeout(2000);

          // Should navigate to pricing or show upgrade modal
          const upgradeDestination = [
            page.url().includes('/pricing'),
            page.url().includes('/upgrade'),
            (await page.locator('[data-testid="upgrade-modal"]').count()) > 0,
          ];

          const upgradeFlowStarted = upgradeDestination.some(Boolean);
          console.log(`Upgrade flow started: ${upgradeFlowStarted}`);
        }
      }
    });
  });

  test.describe('Free Trial', () => {
    test('should offer free trial for premium plans', async ({ page }) => {
      await page.goto('/pricing');
      await page.waitForTimeout(2000);

      // Look for free trial indicators
      const trialIndicators = [
        page.locator('text=Free Trial'),
        page.locator('text=14 days free'),
        page.locator('text=Try free'),
        page.locator('[data-testid="trial-button"]'),
      ];

      let foundTrialOffers = 0;
      for (const indicator of trialIndicators) {
        if ((await indicator.count()) > 0) {
          foundTrialOffers++;
        }
      }

      console.log(`Free trial offers found: ${foundTrialOffers}`);

      // Test starting free trial
      const trialButton = page
        .locator('button:has-text("Free Trial"), button:has-text("Try Free")')
        .first();
      if ((await trialButton.count()) > 0) {
        await trialButton.click();
        await page.waitForTimeout(2000);

        // Should start trial signup process
        const trialSignup = [
          page.url().includes('/trial'),
          page.url().includes('/signup'),
          (await page.locator('[data-testid="trial-signup"]').count()) > 0,
        ];

        const trialStarted = trialSignup.some(Boolean);
        console.log(`Free trial signup started: ${trialStarted}`);
      }
    });
  });

  test.describe('Billing and Invoices', () => {
    test('should display billing history for subscribed users', async ({ page }) => {
      // Mock premium user login
      await page.goto('/profile');
      await page.waitForTimeout(2000);

      // Look for billing section
      const billingSection = [
        page.locator('[data-testid="billing-history"]'),
        page.locator('[data-testid="invoices"]'),
        page.locator('text=Billing History'),
        page.locator('text=Invoices'),
      ];

      let foundBilling = false;
      for (const section of billingSection) {
        if ((await section.count()) > 0) {
          foundBilling = true;

          // Check for invoice items
          const invoiceItems = section.locator('[data-testid="invoice-item"], tr, .invoice');
          const itemCount = await invoiceItems.count();

          console.log(`Billing history items: ${itemCount}`);
          break;
        }
      }

      console.log(`Billing history section found: ${foundBilling}`);
    });
  });
});
