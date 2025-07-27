import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { api } from '@/lib/api';
import { signInWithEmail, signInWithProvider } from '@/lib/firebase';
import FirebaseLoginPage from '../FirebaseLoginPage';

// Mock dependencies
vi.mock('@/lib/firebase', () => ({
  signInWithProvider: vi.fn(),
  signInWithEmail: vi.fn(),
}));

vi.mock('@/lib/api', () => ({
  api: {
    post: vi.fn(),
  },
}));

vi.mock('wouter', () => ({
  useLocation: () => ['/', vi.fn()],
}));

// Mock toast
const mockToast = vi.fn();
vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({ toast: mockToast }),
}));

describe('FirebaseLoginPage', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
      },
    });
    vi.clearAllMocks();
  });

  const renderComponent = () => {
    return render(
      <QueryClientProvider client={queryClient}>
        <FirebaseLoginPage />
      </QueryClientProvider>
    );
  };

  it('should render login form', () => {
    renderComponent();

    expect(screen.getByText('Sign in to AI Glossary Pro')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Email')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Password')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign in with email/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /continue with google/i })).toBeInTheDocument();
  });

  it('should toggle between login and signup modes', () => {
    renderComponent();

    const toggleButton = screen.getByText("Don't have an account? Sign up");
    fireEvent.click(toggleButton);

    expect(screen.getByText('Create your AI Glossary Pro account')).toBeInTheDocument();
    expect(screen.getByText('Already have an account? Sign in')).toBeInTheDocument();
  });

  it('should handle Google sign in', async () => {
    const mockIdToken = 'mock-id-token';
    const mockUser = {
      id: '1',
      email: 'test@gmail.com',
      name: 'Test User',
      lifetimeAccess: false,
    };

    (signInWithProvider as unknown).mockResolvedValueOnce({ idToken: mockIdToken });
    (api.post as unknown).mockResolvedValueOnce({
      success: true,
      data: {
        token: 'mock-jwt-token',
        user: mockUser,
      },
    });

    renderComponent();

    const googleButton = screen.getByRole('button', { name: /Continue with Google/i });
    fireEvent.click(googleButton);

    await waitFor(() => {
      expect(signInWithProvider).toHaveBeenCalledWith('google');
      expect(api.post).toHaveBeenCalledWith('/auth/firebase/login', { idToken: mockIdToken });
      expect(mockToast).toHaveBeenCalledWith({
        title: 'Free User - Welcome back!',
        description: 'Welcome back, test@gmail.com!',
        duration: 5000,
      });
    });
  });

  it('should handle email sign in', async () => {
    const mockIdToken = 'mock-id-token';
    const mockUser = {
      id: '1',
      email: 'test@example.com',
      name: 'Test User',
      lifetimeAccess: true,
    };

    (signInWithEmail as unknown).mockResolvedValueOnce({ idToken: mockIdToken });
    (api.post as unknown).mockResolvedValueOnce({
      success: true,
      data: {
        token: 'mock-jwt-token',
        user: mockUser,
      },
    });

    renderComponent();

    const emailInput = screen.getByPlaceholderText('Email');
    const passwordInput = screen.getByPlaceholderText('Password');
    const submitButton = screen.getByRole('button', { name: /sign in with email/i });

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(signInWithEmail).toHaveBeenCalledWith('test@example.com', 'password123');
      expect(api.post).toHaveBeenCalledWith('/auth/firebase/login', { idToken: mockIdToken });
      expect(mockToast).toHaveBeenCalledWith({
        title: 'Premium User - Welcome back!',
        description: 'Welcome back, test@example.com! Your premium access is active.',
        duration: 5000,
      });
    });
  });

  it('should handle authentication errors', async () => {
    (signInWithProvider as unknown).mockRejectedValueOnce({
      code: 'auth/user-not-found',
      message: 'User not found',
    });

    renderComponent();

    const googleButton = screen.getByRole('button', { name: /Continue with Google/i });
    fireEvent.click(googleButton);

    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith({
        title: 'Authentication Error',
        description: 'No account found with this email. Please sign up first.',
        variant: 'destructive',
      });
    });
  });

  it('should validate email format', async () => {
    renderComponent();

    const emailInput = screen.getByPlaceholderText('Email');
    const passwordInput = screen.getByPlaceholderText('Password');
    const submitButton = screen.getByRole('button', { name: /sign in with email/i });

    fireEvent.change(emailInput, { target: { value: 'invalid-email' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(signInWithEmail).not.toHaveBeenCalled();
      expect(mockToast).toHaveBeenCalledWith({
        title: 'Validation Error',
        description: 'Please enter a valid email address',
        variant: 'destructive',
      });
    });
  });

  it('should show demo account information', () => {
    renderComponent();

    expect(screen.getByText(/Use Demo Account/)).toBeInTheDocument();
    expect(screen.getByText('demo@aiglosspro.com')).toBeInTheDocument();
  });
});
