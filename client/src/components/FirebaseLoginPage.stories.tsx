import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import FirebaseLoginPage from './FirebaseLoginPage';

const meta: Meta<typeof FirebaseLoginPage> = {
  title: 'Authentication/FirebaseLoginPage',
  component: FirebaseLoginPage,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Firebase-powered authentication page with email/password login, social providers, and registration flows.',
      },
    },
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    onLoginSuccess: (user: any) => console.log('Login successful:', user),
    onLoginError: (error: any) => console.log('Login error:', error),
    redirectTo: '/dashboard',
  },
};

export const WithRegistration: Story = {
  args: {
    initialMode: 'register',
    onLoginSuccess: (user: any) => console.log('Registration successful:', user),
    onLoginError: (error: any) => console.log('Registration error:', error),
    onModeChange: (mode: string) => console.log('Mode changed to:', mode),
    redirectTo: '/onboarding',
  },
};

export const WithSocialProviders: Story = {
  args: {
    socialProviders: ['google', 'github', 'twitter'],
    onSocialLogin: (provider: string) => console.log('Social login with:', provider),
    onLoginSuccess: (user: any) => console.log('Login successful:', user),
    onLoginError: (error: any) => console.log('Login error:', error),
  },
};

export const PasswordReset: Story = {
  args: {
    initialMode: 'reset-password',
    onPasswordResetSent: (email: string) => console.log('Password reset sent to:', email),
    onLoginError: (error: any) => console.log('Reset error:', error),
    onModeChange: (mode: string) => console.log('Mode changed to:', mode),
  },
};

export const WithEmailVerification: Story = {
  args: {
    requireEmailVerification: true,
    onEmailVerificationSent: (email: string) => console.log('Verification sent to:', email),
    onEmailVerified: () => console.log('Email verified successfully'),
    onLoginSuccess: (user: any) => console.log('Login successful:', user),
    onLoginError: (error: any) => console.log('Login error:', error),
  },
};

export const LoadingState: Story = {
  args: {
    loading: true,
    loadingMessage: 'Authenticating with Firebase...',
    onLoginSuccess: (user: any) => console.log('Login successful:', user),
    onLoginError: (error: any) => console.log('Login error:', error),
  },
};

export const WithValidationErrors: Story = {
  args: {
    initialErrors: {
      email: 'Please enter a valid email address',
      password: 'Password must be at least 6 characters',
    },
    onLoginSuccess: (user: any) => console.log('Login successful:', user),
    onLoginError: (error: any) => console.log('Login error:', error),
  },
};

export const LoginError: Story = {
  args: {
    initialError: 'Invalid email or password. Please try again.',
    onLoginSuccess: (user: any) => console.log('Login successful:', user),
    onLoginError: (error: any) => console.log('Login error:', error),
    onRetry: () => console.log('Retry login'),
  },
};

export const WithMultiFactorAuth: Story = {
  args: {
    mfaEnabled: true,
    initialMode: 'mfa-challenge',
    onMFAVerify: (code: string) => console.log('MFA code entered:', code),
    onLoginSuccess: (user: any) => console.log('Login successful:', user),
    onLoginError: (error: any) => console.log('Login error:', error),
  },
};

export const EnterpriseSSO: Story = {
  args: {
    ssoEnabled: true,
    ssoProviders: [
      { id: 'okta', name: 'Okta', logo: '/logos/okta.svg' },
      { id: 'azure', name: 'Microsoft Azure AD', logo: '/logos/azure.svg' },
      { id: 'gsuite', name: 'Google Workspace', logo: '/logos/gsuite.svg' },
    ],
    onSSOLogin: (providerId: string) => console.log('SSO login with:', providerId),
    onLoginSuccess: (user: any) => console.log('Login successful:', user),
    onLoginError: (error: any) => console.log('Login error:', error),
  },
};

export const CustomBranding: Story = {
  args: {
    branding: {
      logo: '/ai-glossary-logo.svg',
      title: 'AI Glossary Pro',
      subtitle: 'Your comprehensive AI & ML terminology resource',
      primaryColor: '#6366F1',
      backgroundColor: '#F8FAFC',
    },
    onLoginSuccess: (user: any) => console.log('Login successful:', user),
    onLoginError: (error: any) => console.log('Login error:', error),
  },
};

export const MobileOptimized: Story = {
  args: {
    mobileOptimized: true,
    socialProviders: ['google', 'apple'],
    onLoginSuccess: (user: any) => console.log('Login successful:', user),
    onLoginError: (error: any) => console.log('Login error:', error),
  },
  parameters: {
    viewport: {
      defaultViewport: 'mobile1',
    },
  },
};

export const WithTermsAndPrivacy: Story = {
  args: {
    showTermsAndPrivacy: true,
    termsUrl: '/terms-of-service',
    privacyUrl: '/privacy-policy',
    onTermsClick: () => console.log('Terms clicked'),
    onPrivacyClick: () => console.log('Privacy clicked'),
    onLoginSuccess: (user: any) => console.log('Login successful:', user),
    onLoginError: (error: any) => console.log('Login error:', error),
  },
};

export const FreeTrial: Story = {
  args: {
    showFreeTrial: true,
    trialLength: 14,
    trialFeatures: [
      'Full access to AI-powered search',
      'Interactive content and examples',
      'Progress tracking',
      'No credit card required',
    ],
    onStartTrial: () => console.log('Start free trial'),
    onLoginSuccess: (user: any) => console.log('Login successful:', user),
    onLoginError: (error: any) => console.log('Login error:', error),
  },
};

export const MaintenanceMode: Story = {
  args: {
    maintenanceMode: true,
    maintenanceMessage:
      'Our authentication system is currently undergoing maintenance. Please try again in a few minutes.',
    estimatedDuration: '15 minutes',
    onMaintenanceUpdate: () => console.log('Check for updates'),
  },
};

export const RegionalCompliance: Story = {
  args: {
    gdprCompliant: true,
    region: 'EU',
    cookieConsent: true,
    dataProcessingAgreement: true,
    onGDPRConsent: (consent: boolean) => console.log('GDPR consent:', consent),
    onLoginSuccess: (user: any) => console.log('Login successful:', user),
    onLoginError: (error: any) => console.log('Login error:', error),
  },
};

export const DarkMode: Story = {
  args: {
    socialProviders: ['google', 'github'],
    onLoginSuccess: (user: any) => console.log('Login successful:', user),
    onLoginError: (error: any) => console.log('Login error:', error),
  },
  parameters: {
    themes: {
      default: 'dark',
    },
  },
};

export const AccessibilityOptimized: Story = {
  args: {
    accessibilityFeatures: {
      highContrast: true,
      largeText: true,
      keyboardNavigation: true,
      screenReaderOptimized: true,
    },
    onLoginSuccess: (user: any) => console.log('Login successful:', user),
    onLoginError: (error: any) => console.log('Login error:', error),
  },
};

export const DeveloperMode: Story = {
  args: {
    developerMode: true,
    testAccounts: [
      { email: 'admin@test.com', password: 'admin123', role: 'admin' },
      { email: 'user@test.com', password: 'user123', role: 'user' },
      { email: 'premium@test.com', password: 'premium123', role: 'premium' },
    ],
    onQuickLogin: (account: any) => console.log('Quick login with:', account),
    onLoginSuccess: (user: any) => console.log('Login successful:', user),
    onLoginError: (error: any) => console.log('Login error:', error),
  },
};
