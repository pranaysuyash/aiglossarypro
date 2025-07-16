import type { Meta, StoryObj } from '@storybook/react';
import { Pricing } from './Pricing';

const meta: Meta<typeof Pricing> = {
  title: 'Landing/Pricing',
  component: Pricing,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Pricing component for the landing page with flexible plans, feature comparisons, and purchase integration.',
      },
    },
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

const basicPricingData = [
  {
    id: 'free',
    name: 'Free',
    price: 0,
    currency: 'USD',
    interval: 'month',
    description: 'Perfect for students and casual learners',
    features: [
      '1,000+ basic AI/ML terms',
      'Basic search functionality',
      'Mobile app access',
      'Community support',
    ],
    limitations: ['No AI-powered features', 'Limited search results', 'Basic definitions only'],
    buttonText: 'Get Started Free',
    buttonAction: 'signup',
    popular: false,
    recommended: false,
  },
  {
    id: 'pro',
    name: 'Professional',
    price: 29,
    currency: 'USD',
    interval: 'month',
    yearlyPrice: 290,
    yearlyDiscount: 17,
    description: 'For professionals and advanced learners',
    features: [
      '10,000+ comprehensive terms',
      'AI-powered semantic search',
      'Interactive visualizations',
      'Code examples & implementations',
      'Learning paths & progress tracking',
      'Offline access',
      'Priority support',
      'Export capabilities',
    ],
    buttonText: 'Start Free Trial',
    buttonAction: 'trial',
    popular: true,
    recommended: true,
    badge: 'Most Popular',
  },
  {
    id: 'team',
    name: 'Team',
    price: 99,
    currency: 'USD',
    interval: 'month',
    yearlyPrice: 990,
    yearlyDiscount: 17,
    description: 'For teams and organizations',
    features: [
      'Everything in Professional',
      'Team collaboration tools',
      'Custom glossaries',
      'Admin dashboard',
      'Team progress analytics',
      'SSO integration',
      'API access',
      'Dedicated account manager',
    ],
    buttonText: 'Contact Sales',
    buttonAction: 'contact',
    popular: false,
    recommended: false,
    minSeats: 5,
    maxSeats: 50,
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: null,
    currency: 'USD',
    interval: 'month',
    description: 'Custom solutions for large organizations',
    features: [
      'Everything in Team',
      'Custom integrations',
      'White-label solutions',
      'Advanced analytics',
      'Custom AI training',
      'On-premise deployment',
      '24/7 phone support',
      'SLA guarantee',
    ],
    buttonText: 'Contact Sales',
    buttonAction: 'contact',
    popular: false,
    recommended: false,
    customPricing: true,
  },
];

const advancedPricingData = [
  {
    id: 'student',
    name: 'Student',
    price: 9,
    currency: 'USD',
    interval: 'month',
    originalPrice: 29,
    discount: 69,
    description: 'Special pricing for students and educators',
    features: [
      'Full Professional features',
      'Student community access',
      'Academic resources',
      'Thesis support tools',
    ],
    requirements: ['Valid student ID required', 'Educational email address', 'Annual verification'],
    buttonText: 'Verify Student Status',
    buttonAction: 'verify',
    badge: '69% OFF',
    popular: false,
    recommended: false,
  },
  ...basicPricingData.slice(1),
];

export const Default: Story = {
  args: {
    plans: basicPricingData,
    onPlanSelect: (planId: string, action: string) =>
      console.log(`Selected plan: ${planId}, action: ${action}`),
  },
};

export const WithYearlyToggle: Story = {
  args: {
    plans: basicPricingData,
    showYearlyToggle: true,
    defaultInterval: 'month',
    yearlyDiscountText: 'Save 17% with yearly billing',
    onPlanSelect: (planId: string, action: string) =>
      console.log(`Selected plan: ${planId}, action: ${action}`),
    onIntervalChange: (interval: string) => console.log(`Billing interval changed to: ${interval}`),
  },
};

export const WithStudentPricing: Story = {
  args: {
    plans: advancedPricingData,
    showStudentPricing: true,
    onPlanSelect: (planId: string, action: string) =>
      console.log(`Selected plan: ${planId}, action: ${action}`),
  },
};

export const ComparisonView: Story = {
  args: {
    plans: basicPricingData,
    layout: 'comparison',
    showFeatureComparison: true,
    onPlanSelect: (planId: string, action: string) =>
      console.log(`Selected plan: ${planId}, action: ${action}`),
  },
};

export const WithTrialBanner: Story = {
  args: {
    plans: basicPricingData,
    showTrialBanner: true,
    trialDays: 14,
    trialFeatures: [
      'Full access to all Professional features',
      'No credit card required',
      'Cancel anytime',
    ],
    onPlanSelect: (planId: string, action: string) =>
      console.log(`Selected plan: ${planId}, action: ${action}`),
  },
};

export const WithCustomCurrency: Story = {
  args: {
    plans: basicPricingData.map(plan => ({
      ...plan,
      price: plan.price ? plan.price * 0.85 : null,
      currency: 'EUR',
      yearlyPrice: plan.yearlyPrice ? plan.yearlyPrice * 0.85 : undefined,
    })),
    currency: 'EUR',
    onPlanSelect: (planId: string, action: string) =>
      console.log(`Selected plan: ${planId}, action: ${action}`),
  },
};

export const WithPPPBanner: Story = {
  args: {
    plans: basicPricingData,
    showPPPBanner: true,
    pppDiscount: 40,
    userCountry: 'IN',
    pppMessage: 'Special pricing available for your region',
    onPPPApply: () => console.log('PPP discount applied'),
    onPlanSelect: (planId: string, action: string) =>
      console.log(`Selected plan: ${planId}, action: ${action}`),
  },
};

export const WithTestimonials: Story = {
  args: {
    plans: basicPricingData,
    showTestimonials: true,
    testimonials: [
      {
        id: '1',
        author: 'Sarah Chen',
        role: 'ML Engineer at Google',
        content:
          'This glossary has become my go-to resource for AI terminology. The semantic search is incredibly accurate.',
        rating: 5,
        plan: 'pro',
      },
      {
        id: '2',
        author: 'Dr. Michael Rodriguez',
        role: 'AI Research Professor',
        content:
          'I use this with my students. The learning paths and interactive content make complex concepts accessible.',
        rating: 5,
        plan: 'team',
      },
    ],
    onPlanSelect: (planId: string, action: string) =>
      console.log(`Selected plan: ${planId}, action: ${action}`),
  },
};

export const WithFAQ: Story = {
  args: {
    plans: basicPricingData,
    showFAQ: true,
    faqItems: [
      {
        question: 'Can I change plans anytime?',
        answer:
          'Yes, you can upgrade or downgrade your plan at any time. Changes take effect immediately.',
      },
      {
        question: 'What payment methods do you accept?',
        answer:
          'We accept all major credit cards, PayPal, and wire transfers for enterprise customers.',
      },
      {
        question: 'Is there a free trial?',
        answer:
          'Yes, we offer a 14-day free trial of our Professional plan with full access to all features.',
      },
    ],
    onPlanSelect: (planId: string, action: string) =>
      console.log(`Selected plan: ${planId}, action: ${action}`),
  },
};

export const WithLimitedTimeOffer: Story = {
  args: {
    plans: basicPricingData.map(plan => ({
      ...plan,
      limitedOffer:
        plan.id === 'pro'
          ? {
              discount: 30,
              originalPrice: plan.price,
              expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
              reason: 'Launch Special',
            }
          : undefined,
    })),
    onPlanSelect: (planId: string, action: string) =>
      console.log(`Selected plan: ${planId}, action: ${action}`),
  },
};

export const WithUsageBasedPricing: Story = {
  args: {
    plans: [
      ...basicPricingData.slice(0, 2),
      {
        id: 'usage',
        name: 'Pay-as-you-go',
        price: null,
        currency: 'USD',
        interval: 'usage',
        description: 'Perfect for occasional users',
        usagePricing: {
          basePrice: 5,
          perQuery: 0.1,
          includedQueries: 50,
          maxQueries: 1000,
        },
        features: [
          '$5 base fee per month',
          '$0.10 per AI search query',
          '50 queries included',
          'All Professional features',
        ],
        buttonText: 'Start Usage Plan',
        buttonAction: 'usage',
      },
      ...basicPricingData.slice(2),
    ],
    onPlanSelect: (planId: string, action: string) =>
      console.log(`Selected plan: ${planId}, action: ${action}`),
  },
};

export const WithAddOns: Story = {
  args: {
    plans: basicPricingData.map(plan => ({
      ...plan,
      addOns:
        plan.id === 'pro' || plan.id === 'team'
          ? [
              {
                id: 'priority-support',
                name: 'Priority Support',
                price: 15,
                description: '24/7 priority support with 1-hour response time',
              },
              {
                id: 'custom-integrations',
                name: 'Custom Integrations',
                price: 50,
                description: 'Custom API integrations with your existing tools',
              },
            ]
          : undefined,
    })),
    onPlanSelect: (planId: string, action: string) =>
      console.log(`Selected plan: ${planId}, action: ${action}`),
    onAddOnToggle: (planId: string, addOnId: string, selected: boolean) =>
      console.log(`Add-on ${addOnId} ${selected ? 'added to' : 'removed from'} plan ${planId}`),
  },
};

export const LoadingState: Story = {
  args: {
    loading: true,
    skeletonCount: 3,
  },
};

export const ErrorState: Story = {
  args: {
    error: 'Failed to load pricing information. Please try again.',
    onRetry: () => console.log('Retrying pricing load...'),
  },
};

export const DarkMode: Story = {
  args: {
    plans: basicPricingData,
    showYearlyToggle: true,
    theme: 'dark',
    onPlanSelect: (planId: string, action: string) =>
      console.log(`Selected plan: ${planId}, action: ${action}`),
  },
  parameters: {
    themes: {
      default: 'dark',
    },
  },
};

export const MobileOptimized: Story = {
  args: {
    plans: basicPricingData,
    showYearlyToggle: true,
    mobileOptimized: true,
    onPlanSelect: (planId: string, action: string) =>
      console.log(`Selected plan: ${planId}, action: ${action}`),
  },
  parameters: {
    viewport: {
      defaultViewport: 'mobile1',
    },
  },
};

export const WithAnalytics: Story = {
  args: {
    plans: basicPricingData,
    trackingEnabled: true,
    onPlanSelect: (planId: string, action: string) => {
      console.log(`Selected plan: ${planId}, action: ${action}`);
      // Analytics tracking would happen here
    },
    onPlanView: (planId: string) => console.log(`Plan ${planId} viewed`),
    onFeatureClick: (planId: string, feature: string) =>
      console.log(`Feature "${feature}" clicked on plan ${planId}`),
  },
};

export const WithCustomization: Story = {
  args: {
    plans: basicPricingData,
    customization: {
      primaryColor: '#6366f1',
      borderRadius: 'large',
      fontFamily: 'Inter',
      buttonStyle: 'gradient',
      cardStyle: 'elevated',
    },
    onPlanSelect: (planId: string, action: string) =>
      console.log(`Selected plan: ${planId}, action: ${action}`),
  },
};

export const WithExperimentalFeatures: Story = {
  args: {
    plans: basicPricingData,
    experimentalFeatures: {
      aiPriceOptimization: true,
      dynamicPricing: true,
      personalizedRecommendations: true,
    },
    userProfile: {
      usage: 'heavy',
      teamSize: 12,
      industry: 'technology',
      budget: 'medium',
    },
    onPlanSelect: (planId: string, action: string) =>
      console.log(`Selected plan: ${planId}, action: ${action}`),
  },
};
