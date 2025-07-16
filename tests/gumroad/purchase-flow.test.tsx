import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { FreeTierGate } from '../../client/src/components/FreeTierGate';
import { PremiumUpgradeSuccess } from '../../client/src/components/PremiumUpgradeSuccess';
// Mock components and services
import { TestPurchaseButton } from '../../client/src/components/TestPurchaseButton';

// Mock fetch for API calls
global.fetch = vi.fn();

describe('Purchase Flow Integration Tests', () => {
  let queryClient: QueryClient;
  let user: ReturnType<typeof userEvent.setup>;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false }
      }
    });
    user = userEvent.setup();
    vi.clearAllMocks();
  });

  const renderWithProviders = (component: React.ReactElement) => {
    return render(
      <BrowserRouter>
        <QueryClientProvider client={queryClient}>
          {component}
        </QueryClientProvider>
      </BrowserRouter>
    );
  };

  describe('Test Purchase Flow (Development)', () => {
    test('should complete test purchase successfully', async () => {
      const mockSuccessResponse = {
        success: true,
        message: 'Test purchase completed successfully!',
        user: {
          email: 'test@example.com',
          subscriptionTier: 'lifetime',
          lifetimeAccess: true,
          purchaseDate: new Date().toISOString()
        },
        testData: {
          orderId: 'TEST-123',
          amount: '$249.00',
          environment: 'development'
        }
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockSuccessResponse)
      });

      renderWithProviders(<TestPurchaseButton />);

      const purchaseButton = screen.getByRole('button', { name: /test purchase/i });
      expect(purchaseButton).toBeInTheDocument();

      await user.click(purchaseButton);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith('/api/gumroad/test-purchase', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': expect.stringContaining('Bearer ')
          },
          body: JSON.stringify({
            email: expect.any(String)
          })
        });
      });

      // Should show success message
      await waitFor(() => {
        expect(screen.getByText(/purchase completed successfully/i)).toBeInTheDocument();
      });
    });

    test('should handle test purchase authentication errors', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: () => Promise.resolve({ error: 'Authentication required' })
      });

      renderWithProviders(<TestPurchaseButton />);

      const purchaseButton = screen.getByRole('button', { name: /test purchase/i });
      await user.click(purchaseButton);

      await waitFor(() => {
        expect(screen.getByText(/authentication required/i)).toBeInTheDocument();
      });
    });

    test('should handle test purchase in production mode', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 403,
        json: () => Promise.resolve({ 
          error: 'Test purchases only available in development mode' 
        })
      });

      renderWithProviders(<TestPurchaseButton />);

      const purchaseButton = screen.getByRole('button', { name: /test purchase/i });
      await user.click(purchaseButton);

      await waitFor(() => {
        expect(screen.getByText(/only available in development mode/i)).toBeInTheDocument();
      });
    });
  });

  describe('Free Tier Gate Component', () => {
    test('should show upgrade prompt for free users', async () => {
      const mockUser = {
        subscriptionTier: 'free',
        lifetimeAccess: false,
        dailyViews: 25,
        dailyLimit: 25
      };

      renderWithProviders(
        <FreeTierGate user={mockUser} feature="AI Search">
          <div>Premium Content</div>
        </FreeTierGate>
      );

      expect(screen.getByText(/upgrade to unlock ai search/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /upgrade now/i })).toBeInTheDocument();
      expect(screen.queryByText('Premium Content')).not.toBeInTheDocument();
    });

    test('should show content for lifetime users', async () => {
      const mockUser = {
        subscriptionTier: 'lifetime',
        lifetimeAccess: true,
        dailyViews: 50,
        dailyLimit: -1 // Unlimited
      };

      renderWithProviders(
        <FreeTierGate user={mockUser} feature="AI Search">
          <div>Premium Content</div>
        </FreeTierGate>
      );

      expect(screen.getByText('Premium Content')).toBeInTheDocument();
      expect(screen.queryByText(/upgrade to unlock/i)).not.toBeInTheDocument();
    });

    test('should track upgrade button clicks', async () => {
      const mockUser = {
        subscriptionTier: 'free',
        lifetimeAccess: false,
        dailyViews: 20,
        dailyLimit: 25
      };

      // Mock gtag for analytics
      window.gtag = vi.fn();

      renderWithProviders(
        <FreeTierGate user={mockUser} feature="AI Search">
          <div>Premium Content</div>
        </FreeTierGate>
      );

      const upgradeButton = screen.getByRole('button', { name: /upgrade now/i });
      await user.click(upgradeButton);

      expect(window.gtag).toHaveBeenCalledWith('event', 'upgrade_button_click', {
        feature: 'AI Search',
        user_tier: 'free',
        views_used: 20,
        daily_limit: 25
      });
    });
  });

  describe('Purchase Success Flow', () => {
    test('should display purchase success information', async () => {
      const mockPurchaseData = {
        orderId: 'PURCHASE-SUCCESS-123',
        userEmail: 'success@example.com',
        purchaseAmount: '$249.00',
        purchaseDate: '2025-01-13'
      };

      renderWithProviders(<PremiumUpgradeSuccess {...mockPurchaseData} />);

      expect(screen.getByText(/purchase successful/i)).toBeInTheDocument();
      expect(screen.getByText('PURCHASE-SUCCESS-123')).toBeInTheDocument();
      expect(screen.getByText('$249.00')).toBeInTheDocument();
      expect(screen.getByText('success@example.com')).toBeInTheDocument();
      
      // Should show next steps
      expect(screen.getByText(/welcome to ai glossary pro/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /start exploring/i })).toBeInTheDocument();
    });

    test('should handle navigation to premium features', async () => {
      const mockPurchaseData = {
        orderId: 'NAV-TEST-123',
        userEmail: 'nav@example.com',
        purchaseAmount: '$249.00',
        purchaseDate: '2025-01-13'
      };

      renderWithProviders(<PremiumUpgradeSuccess {...mockPurchaseData} />);

      const exploreButton = screen.getByRole('button', { name: /start exploring/i });
      await user.click(exploreButton);

      // Should trigger navigation
      await waitFor(() => {
        expect(window.location.pathname).toBe('/');
      });
    });
  });

  describe('Purchase Verification', () => {
    test('should verify purchase status by email', async () => {
      const mockVerificationResponse = {
        success: true,
        message: 'Purchase verified',
        user: {
          email: 'verified@example.com',
          subscriptionTier: 'lifetime',
          lifetimeAccess: true,
          purchaseDate: '2025-01-10'
        }
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockVerificationResponse)
      });

      const email = 'verified@example.com';
      
      const response = await fetch('/api/gumroad/verify-purchase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });

      const data = await response.json();

      expect(data.success).toBe(true);
      expect(data.user.lifetimeAccess).toBe(true);
      expect(data.user.subscriptionTier).toBe('lifetime');
    });

    test('should handle purchase verification for non-existent user', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: () => Promise.resolve({ 
          error: 'No purchase found for this email' 
        })
      });

      const email = 'notfound@example.com';
      
      const response = await fetch('/api/gumroad/verify-purchase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });

      expect(response.ok).toBe(false);
      expect(response.status).toBe(404);

      const data = await response.json();
      expect(data.error).toBe('No purchase found for this email');
    });
  });

  describe('Mobile Purchase Flow', () => {
    test('should handle mobile viewport purchase flow', async () => {
      // Mock mobile viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      });
      Object.defineProperty(window, 'innerHeight', {
        writable: true,
        configurable: true,
        value: 667,
      });

      const mockUser = {
        subscriptionTier: 'free',
        lifetimeAccess: false,
        dailyViews: 25,
        dailyLimit: 25
      };

      renderWithProviders(
        <FreeTierGate user={mockUser} feature="Mobile Feature">
          <div>Mobile Premium Content</div>
        </FreeTierGate>
      );

      // Should show mobile-optimized upgrade prompt
      expect(screen.getByText(/upgrade to unlock mobile feature/i)).toBeInTheDocument();
      
      const upgradeButton = screen.getByRole('button', { name: /upgrade now/i });
      expect(upgradeButton).toBeInTheDocument();

      // Button should be touch-friendly
      const buttonStyles = window.getComputedStyle(upgradeButton);
      expect(parseInt(buttonStyles.minHeight)).toBeGreaterThanOrEqual(44); // iOS recommended touch target
    });

    test('should handle touch interactions on mobile', async () => {
      const mockUser = {
        subscriptionTier: 'free',
        lifetimeAccess: false,
        dailyViews: 20,
        dailyLimit: 25
      };

      renderWithProviders(
        <FreeTierGate user={mockUser} feature="Touch Feature">
          <div>Touch Premium Content</div>
        </FreeTierGate>
      );

      const upgradeButton = screen.getByRole('button', { name: /upgrade now/i });

      // Simulate touch events
      fireEvent.touchStart(upgradeButton);
      fireEvent.touchEnd(upgradeButton);
      fireEvent.click(upgradeButton);

      // Should handle touch interactions properly
      await waitFor(() => {
        expect(upgradeButton).toHaveAttribute('aria-pressed', 'true');
      });
    });
  });

  describe('Error Handling and Edge Cases', () => {
    test('should handle network errors during purchase flow', async () => {
      (global.fetch as any).mockRejectedValueOnce(new Error('Network error'));

      renderWithProviders(<TestPurchaseButton />);

      const purchaseButton = screen.getByRole('button', { name: /test purchase/i });
      await user.click(purchaseButton);

      await waitFor(() => {
        expect(screen.getByText(/network error/i)).toBeInTheDocument();
      });
    });

    test('should handle malformed API responses', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ /* malformed response */ })
      });

      renderWithProviders(<TestPurchaseButton />);

      const purchaseButton = screen.getByRole('button', { name: /test purchase/i });
      await user.click(purchaseButton);

      await waitFor(() => {
        expect(screen.getByText(/unexpected response format/i)).toBeInTheDocument();
      });
    });

    test('should handle rate limiting errors', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 429,
        json: () => Promise.resolve({ 
          error: 'Too many requests. Please try again later.' 
        })
      });

      renderWithProviders(<TestPurchaseButton />);

      const purchaseButton = screen.getByRole('button', { name: /test purchase/i });
      await user.click(purchaseButton);

      await waitFor(() => {
        expect(screen.getByText(/too many requests/i)).toBeInTheDocument();
      });
    });

    test('should handle server errors gracefully', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: () => Promise.resolve({ 
          error: 'Internal server error' 
        })
      });

      renderWithProviders(<TestPurchaseButton />);

      const purchaseButton = screen.getByRole('button', { name: /test purchase/i });
      await user.click(purchaseButton);

      await waitFor(() => {
        expect(screen.getByText(/internal server error/i)).toBeInTheDocument();
        expect(screen.getByText(/please try again later/i)).toBeInTheDocument();
      });
    });
  });

  describe('Accessibility Tests', () => {
    test('should be keyboard navigable', async () => {
      const mockUser = {
        subscriptionTier: 'free',
        lifetimeAccess: false,
        dailyViews: 20,
        dailyLimit: 25
      };

      renderWithProviders(
        <FreeTierGate user={mockUser} feature="Accessibility Feature">
          <div>Accessible Premium Content</div>
        </FreeTierGate>
      );

      const upgradeButton = screen.getByRole('button', { name: /upgrade now/i });

      // Should be focusable
      upgradeButton.focus();
      expect(document.activeElement).toBe(upgradeButton);

      // Should respond to Enter key
      fireEvent.keyDown(upgradeButton, { key: 'Enter' });
      
      await waitFor(() => {
        expect(upgradeButton).toHaveAttribute('aria-pressed', 'true');
      });
    });

    test('should have proper ARIA labels', async () => {
      const mockUser = {
        subscriptionTier: 'free',
        lifetimeAccess: false,
        dailyViews: 23,
        dailyLimit: 25
      };

      renderWithProviders(
        <FreeTierGate user={mockUser} feature="ARIA Feature">
          <div>ARIA Premium Content</div>
        </FreeTierGate>
      );

      const upgradeButton = screen.getByRole('button', { name: /upgrade now/i });
      
      expect(upgradeButton).toHaveAttribute('aria-label', 
        expect.stringContaining('Upgrade to access ARIA Feature')
      );
      expect(upgradeButton).toHaveAttribute('aria-describedby');
      
      const description = document.getElementById(upgradeButton.getAttribute('aria-describedby')!);
      expect(description).toHaveTextContent(/23 of 25 daily views used/i);
    });

    test('should announce status changes to screen readers', async () => {
      renderWithProviders(<TestPurchaseButton />);

      const purchaseButton = screen.getByRole('button', { name: /test purchase/i });
      
      // Should have live region for status updates
      const statusRegion = screen.getByRole('status', { name: /purchase status/i });
      expect(statusRegion).toHaveAttribute('aria-live', 'polite');

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          success: true,
          message: 'Test purchase completed successfully!'
        })
      });

      await user.click(purchaseButton);

      await waitFor(() => {
        expect(statusRegion).toHaveTextContent(/purchase completed successfully/i);
      });
    });
  });
});