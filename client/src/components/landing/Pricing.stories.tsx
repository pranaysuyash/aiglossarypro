import type { Meta, StoryObj } from '@storybook/react';
import { Pricing } from './Pricing';

const meta: Meta<typeof Pricing> = {
  title: 'Landing/Pricing',
  component: Pricing,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: 'Pricing plans component with features comparison, billing toggles, and call-to-action buttons.',
      },
    },
  },
  argTypes: {
    onPlanSelect: { action: 'plan selected' },
    onBillingToggle: { action: 'billing period changed' },
    billingPeriod: {
      control: { type: 'select' },
      options: ['monthly', 'annual'],
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

const defaultPlans = [
  {
    id: 'free',
    name: 'Free',
    description: 'Perfect for getting started with AI/ML concepts',
    price: { monthly: 0, annual: 0 },
    originalPrice: null,
    badge: null,
    features: [
      '100 basic AI/ML term definitions',
      'Basic search functionality',
      'Mobile-responsive access',
      'Community support',
      'Email updates',
    ],
    limitations: [
      'No AI-powered features',
      'No code examples',
      'No progress tracking',
      'Limited search results',
    ],
    cta: 'Start Free',
    popular: false,
    color: 'gray',
  },
  {
    id: 'pro',
    name: 'Professional',
    description: 'For serious learners and professionals',
    price: { monthly: 19.99, annual: 199.99 },
    originalPrice: { monthly: null, annual: 239.88 },
    badge: 'Most Popular',
    features: [
      '2,000+ comprehensive term definitions',
      'AI-powered semantic search',
      'Interactive code examples',
      'Personalized learning paths',
      'Progress tracking & analytics',
      'Offline access',
      'Priority email support',
      'Export to popular formats',
      'Advanced filtering & categorization',
    ],
    limitations: [],
    cta: 'Start Pro Trial',
    popular: true,
    color: 'blue',
    trialDays: 14,
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    description: 'For teams and organizations',
    price: { monthly: 99.99, annual: 999.99 },
    originalPrice: { monthly: null, annual: 1199.88 },
    badge: 'Best Value',
    features: [
      'Everything in Professional',
      'Team collaboration features',
      'Custom content creation',
      'API access for integration',
      'White-label options',
      'Dedicated account manager',
      'Custom integrations',
      'Advanced analytics & reporting',
      'SSO integration',
      'Priority phone support',
    ],
    limitations: [],
    cta: 'Contact Sales',
    popular: false,
    color: 'purple',
    isCustomPricing: false,
  },
];

export const Default: Story = {
  args: {
    plans: defaultPlans,
    billingPeriod: 'monthly',
    showBillingToggle: true,
    showMoneyBackGuarantee: true,
  },
};

export const AnnualBilling: Story = {
  args: {
    plans: defaultPlans,
    billingPeriod: 'annual',
    showBillingToggle: true,
    showAnnualDiscount: true,
    annualDiscountPercentage: 17,
  },
};

export const SimplePlans: Story = {
  args: {
    plans: [
      {
        id: 'basic',
        name: 'Basic',
        description: 'Essential AI/ML knowledge',
        price: { monthly: 9.99, annual: 99.99 },
        features: [
          '500 term definitions',
          'Basic search',
          'Mobile access',
          'Email support',
        ],
        cta: 'Get Started',
        popular: false,
        color: 'blue',
      },
      {
        id: 'premium',
        name: 'Premium',
        description: 'Complete learning experience',
        price: { monthly: 19.99, annual: 199.99 },
        badge: 'Popular',
        features: [
          '2,000+ definitions',
          'AI-powered search',
          'Code examples',
          'Progress tracking',
          'Priority support',
        ],
        cta: 'Upgrade Now',
        popular: true,
        color: 'green',
      },
    ],
    billingPeriod: 'monthly',
    showBillingToggle: true,
    variant: 'simple',
  },
};

export const WithFeatureComparison: Story = {
  args: {
    plans: defaultPlans,
    billingPeriod: 'monthly',
    showFeatureComparison: true,
    featureCategories: [
      {
        name: 'Content Access',
        features: [
          { name: 'Term Definitions', free: '100', pro: '2,000+', enterprise: '2,000+' },
          { name: 'Code Examples', free: '❌', pro: '✅', enterprise: '✅' },
          { name: 'Interactive Content', free: '❌', pro: '✅', enterprise: '✅' },
        ],
      },
      {
        name: 'AI Features',
        features: [
          { name: 'Semantic Search', free: '❌', pro: '✅', enterprise: '✅' },
          { name: 'Personalized Paths', free: '❌', pro: '✅', enterprise: '✅' },
          { name: 'AI Explanations', free: '❌', pro: '✅', enterprise: '✅' },
        ],
      },
      {
        name: 'Support',
        features: [
          { name: 'Community Support', free: '✅', pro: '✅', enterprise: '✅' },
          { name: 'Email Support', free: '❌', pro: '✅', enterprise: '✅' },
          { name: 'Phone Support', free: '❌', pro: '❌', enterprise: '✅' },
        ],
      },
    ],
  },
};

export const StudentDiscountPricing: Story = {
  args: {
    plans: defaultPlans.map(plan => ({
      ...plan,
      price: {
        monthly: plan.price.monthly * 0.5,
        annual: plan.price.annual * 0.5,
      },
      badge: plan.id === 'pro' ? 'Student Discount' : plan.badge,
    })),
    billingPeriod: 'annual',
    showStudentDiscount: true,
    discountPercentage: 50,
  },
};

export const CustomPricingTiers: Story = {
  args: {
    plans: [
      {
        id: 'starter',
        name: 'Starter',
        description: 'For individuals just beginning',
        price: { monthly: 4.99, annual: 49.99 },
        features: [
          '300 term definitions',
          'Basic search',
          'Mobile access',
        ],
        cta: 'Start Learning',
        popular: false,
        color: 'blue',
      },
      {
        id: 'professional',
        name: 'Professional',
        description: 'For working professionals',
        price: { monthly: 14.99, annual: 149.99 },
        badge: 'Recommended',
        features: [
          '1,500+ definitions',
          'AI search',
          'Code examples',
          'Progress tracking',
        ],
        cta: 'Go Professional',
        popular: true,
        color: 'green',
      },
      {
        id: 'expert',
        name: 'Expert',
        description: 'For teams and experts',
        price: { monthly: 29.99, annual: 299.99 },
        features: [
          '2,500+ definitions',
          'Advanced AI features',
          'Team collaboration',
          'API access',
          'Custom content',
        ],
        cta: 'Become Expert',
        popular: false,
        color: 'purple',
      },
      {
        id: 'enterprise',
        name: 'Enterprise',
        description: 'Custom solutions',
        price: 'Custom',
        features: [
          'Unlimited access',
          'White-label solution',
          'Dedicated support',
          'Custom integrations',
        ],
        cta: 'Contact Sales',
        popular: false,
        color: 'gray',
        isCustomPricing: true,
      },
    ],
    billingPeriod: 'monthly',
    showBillingToggle: true,
  },
};

export const WithTestimonials: Story = {
  args: {
    plans: defaultPlans,
    billingPeriod: 'annual',
    showTestimonials: true,
    testimonials: [
      {
        text: "This glossary has been invaluable for my machine learning journey. The AI-powered search finds exactly what I need.",
        author: "Sarah Chen",
        role: "Data Scientist at Google",
        avatar: "SC",
      },
      {
        text: "The code examples and interactive content make complex concepts so much clearer. Worth every penny!",
        author: "Michael Rodriguez",
        role: "ML Engineer at Tesla",
        avatar: "MR",
      },
      {
        text: "Our entire team uses this for reference. The collaboration features in Enterprise are fantastic.",
        author: "Dr. Emily Watson",
        role: "AI Research Lead at OpenAI",
        avatar: "EW",
      },
    ],
  },
};

export const LimitedTimeOffer: Story = {
  args: {
    plans: defaultPlans.map(plan => ({
      ...plan,
      badge: plan.id === 'pro' ? '50% OFF - Limited Time!' : plan.badge,
      originalPrice: plan.id === 'pro' ? {
        monthly: 39.99,
        annual: 399.99,
      } : plan.originalPrice,
    })),
    billingPeriod: 'annual',
    showCountdown: true,
    countdownEndDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
  },
};

export const Loading: Story = {
  args: {
    isLoading: true,
    billingPeriod: 'monthly',
  },
};

export const DarkMode: Story = {
  args: {
    plans: defaultPlans,
    billingPeriod: 'annual',
    showBillingToggle: true,
  },
  decorators: [
    (Story) => (
      <div className="dark bg-gray-900 min-h-screen p-6">
        <Story />
      </div>
    ),
  ],
};

export const Mobile: Story = {
  args: {
    plans: defaultPlans,
    billingPeriod: 'monthly',
    showBillingToggle: true,
    mobileOptimized: true,
  },
  parameters: {
    viewport: {
      defaultViewport: 'mobile1',
    },
  },
};

export const CompactView: Story = {
  args: {
    plans: defaultPlans.slice(0, 2),
    billingPeriod: 'monthly',
    variant: 'compact',
    showBillingToggle: false,
  },
};

export const WithAddOns: Story = {
  args: {
    plans: defaultPlans,
    billingPeriod: 'monthly',
    showAddOns: true,
    addOns: [
      {
        id: 'priority-support',
        name: 'Priority Support',
        description: '24/7 priority email and chat support',
        price: { monthly: 9.99, annual: 99.99 },
      },
      {
        id: 'custom-content',
        name: 'Custom Content Creation',
        description: 'Get custom terms and definitions for your specific needs',
        price: { monthly: 19.99, annual: 199.99 },
      },
      {
        id: 'api-access',
        name: 'Extended API Access',
        description: 'Higher rate limits and advanced API features',
        price: { monthly: 14.99, annual: 149.99 },
      },
    ],
  },
};
