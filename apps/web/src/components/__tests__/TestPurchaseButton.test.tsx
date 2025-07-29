import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useAuth } from '@/hooks/useAuth';
import { api } from '@/lib/api';
import { TestPurchaseButton } from '../TestPurchaseButton';

// Mock dependencies
vi.mock('@/hooks/useAuth');
vi.mock('@/lib/api', () => ({
  api: {
    post: vi.fn(),
  },
}));

// Mock Stripe
const mockStripe = {
  redirectToCheckout: vi.fn(),
};

(global as unknown).Stripe = vi.fn(() => mockStripe);

const mockToast = vi.fn();
vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({ toast: mockToast }),
}));

describe('TestPurchaseButton', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
      },
    });
    vi.clearAllMocks();
  });

  const renderComponent = (props = {}) => {
    return render(
      <QueryClientProvider client={queryClient}>
        <TestPurchaseButton {...props} />
      </QueryClientProvider>
    );
  };

  it('should render purchase button for unauthenticated users', () => {
    (useAuth as unknown).mockReturnValue({
      isAuthenticated: false,
      user: null,
    });

    renderComponent();

    expect(screen.getByRole('button', { name: /test purchase/i })).toBeInTheDocument();
  });

  it('should show verification status for authenticated users with lifetime access', () => {
    (useAuth as unknown).mockReturnValue({
      isAuthenticated: true,
      user: {
        id: '1',
        email: 'premium@example.com',
        lifetimeAccess: true,
      },
    });

    renderComponent();

    expect(screen.getByText(/lifetime access active/i)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /test purchase/i })).not.toBeInTheDocument();
  });

  it('should handle successful test purchase', async () => {
    (useAuth as unknown).mockReturnValue({
      isAuthenticated: false,
      user: null,
    });

    const mockPurchaseData = {
      email: 'test@example.com',
      subscriptionTier: 'lifetime',
      lifetimeAccess: true,
      purchaseDate: new Date().toISOString(),
    };

    (api.post as unknown).mockResolvedValueOnce({
      success: true,
      data: {
        message: 'Test purchase successful',
        user: mockPurchaseData,
        paymentInfo: {
          orderId: 'TEST-ORDER-123',
          amount: '$199.00',
          environment: 'test',
        },
      },
    });

    renderComponent();

    const purchaseButton = screen.getByRole('button', { name: /test purchase/i });
    fireEvent.click(purchaseButton);

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith('/auth/purchase/test');
      expect(screen.getByText('Test Purchase Successful!')).toBeInTheDocument();
      expect(screen.getByText(mockPurchaseData.email)).toBeInTheDocument();
    });
  });

  it('should handle purchase errors', async () => {
    (useAuth as unknown).mockReturnValue({
      isAuthenticated: false,
      user: null,
    });

    (api.post as unknown).mockResolvedValueOnce({
      success: false,
      error: 'Purchase failed',
    });

    renderComponent();

    const purchaseButton = screen.getByRole('button', { name: /test purchase/i });
    fireEvent.click(purchaseButton);

    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith({
        title: 'Test Purchase Failed',
        description: 'Purchase failed',
        variant: 'destructive',
      });
    });
  });

  it('should show loading state during purchase', async () => {
    (useAuth as unknown).mockReturnValue({
      isAuthenticated: false,
      user: null,
    });

    // Create a promise that we can control
    let resolvePromise: Response;
    const purchasePromise = new Promise(resolve => {
      resolvePromise = resolve;
    });

    (api.post as unknown).mockReturnValueOnce(purchasePromise);

    renderComponent();

    const purchaseButton = screen.getByRole('button', { name: /test purchase/i });
    fireEvent.click(purchaseButton);

    expect(screen.getByText(/processing test purchase/i)).toBeInTheDocument();
    expect(purchaseButton).toBeDisabled();

    // Resolve the promise
    resolvePromise({
      success: true,
      data: {
        message: 'Success',
        user: { email: 'test@example.com', lifetimeAccess: true },
      },
    });

    await waitFor(() => {
      expect(screen.queryByText(/processing test purchase/i)).not.toBeInTheDocument();
    });
  });

  it('should display payment information correctly', async () => {
    (useAuth as unknown).mockReturnValue({
      isAuthenticated: false,
      user: null,
    });

    const mockPaymentInfo = {
      orderId: 'TEST-12345',
      amount: '$299.00',
      environment: 'test',
    };

    (api.post as unknown).mockResolvedValueOnce({
      success: true,
      data: {
        message: 'Test purchase successful',
        user: {
          email: 'buyer@example.com',
          lifetimeAccess: true,
        },
        paymentInfo: mockPaymentInfo,
      },
    });

    renderComponent();

    const purchaseButton = screen.getByRole('button', { name: /test purchase/i });
    fireEvent.click(purchaseButton);

    await waitFor(() => {
      expect(screen.getByText(`Order ID: ${mockPaymentInfo.orderId}`)).toBeInTheDocument();
      expect(screen.getByText(`Amount: ${mockPaymentInfo.amount}`)).toBeInTheDocument();
      expect(screen.getByText(/test mode/i)).toBeInTheDocument();
    });
  });
});
