import type { Meta, StoryObj } from '@storybook/react';
import type React from 'react';
import { PriceDisplay } from './PriceDisplay';

// Helper to create mock pricing data
const createMockPricing = (overrides = {}) => ({
  basePrice: 299,
  localPrice: 249,
  discount: 17,
  countryName: 'United States',
  countryCode: 'US',
  currency: 'USD',
  annualSavings: 351,
  loading: false,
  flag: '🇺🇸',
  localCompetitor: 'DataCamp',
  ...overrides,
});

// Simple mock decorator that doesn't rely on jest
const MockPricingDecorator = (Story: any, _context: any) => {
  return (
    <div className="p-6 bg-white rounded-lg shadow-sm">
      <Story />
    </div>
  );
};

// Helper component to wrap stories that need specific mock data
const MockPricingWrapper = ({
  children,
  mockPricing,
}: {
  children: React.ReactNode;
  mockPricing: any;
}) => {
  return <>{children}</>;
};

const meta: Meta<typeof PriceDisplay> = {
  title: 'Landing/PriceDisplay',
  component: PriceDisplay,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'A flexible price display component that shows localized pricing with discounts, comparisons, and loading states.',
      },
    },
  },
  decorators: [
    MockPricingDecorator, // Apply our custom decorator
  ],
  args: {
    showComparison: false,
    showSavings: false,
    size: 'lg',
  },
  argTypes: {
    showComparison: {
      control: { type: 'boolean' },
      description: 'Show original price comparison when discounted',
    },
    showSavings: {
      control: { type: 'boolean' },
      description: 'Show annual savings information',
    },
    size: {
      control: { type: 'select' },
      options: ['sm', 'md', 'lg', 'xl'],
      description: 'Size of the price display',
    },
    className: {
      control: { type: 'text' },
      description: 'Additional CSS classes',
    },
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {},
  parameters: {
    docs: {
      description: {
        story: 'Default price display showing the current price with discount badge.',
      },
    },
  },
};

export const WithComparison: Story = {
  args: {
    showComparison: true,
  },
  parameters: {
    docs: {
      description: {
        story: 'Price display with original price comparison showing the discount.',
      },
    },
  },
};

export const WithSavings: Story = {
  args: {
    showSavings: true,
  },
  parameters: {
    docs: {
      description: {
        story: 'Price display highlighting annual savings compared to competitors.',
      },
    },
  },
};

export const FullFeatures: Story = {
  args: {
    showComparison: true,
    showSavings: true,
  },
  parameters: {
    docs: {
      description: {
        story: 'Complete price display with all features: comparison, discount, and savings.',
      },
    },
  },
};

export const SmallSize: Story = {
  args: {
    size: 'sm',
    showComparison: true,
  },
  parameters: {
    docs: {
      description: {
        story: 'Small size price display for compact layouts.',
      },
    },
  },
};

export const MediumSize: Story = {
  args: {
    size: 'md',
    showComparison: true,
  },
  parameters: {
    docs: {
      description: {
        story: 'Medium size price display for balanced layouts.',
      },
    },
  },
};

export const ExtraLarge: Story = {
  args: {
    size: 'xl',
    showComparison: true,
    showSavings: true,
  },
  parameters: {
    docs: {
      description: {
        story: 'Extra large price display for hero sections and prominent placement.',
      },
    },
  },
};

export const LoadingState: Story = {
  args: {
    showComparison: true,
    showSavings: true,
  },
  parameters: {
    mockPricing: createMockPricing({ loading: true }),
    docs: {
      description: {
        story: 'Price display showing loading skeleton while pricing data is being fetched.',
      },
    },
  },
};

export const InternationalPricing: Story = {
  render: () => {
    const countries = [
      { name: 'United States', code: 'US', price: 249, discount: 17, basePrice: 299 },
      { name: 'India', code: 'IN', price: 199, discount: 33, basePrice: 299 },
      { name: 'Brazil', code: 'BR', price: 179, discount: 40, basePrice: 299 },
      { name: 'Nigeria', code: 'NG', price: 149, discount: 50, basePrice: 299 },
      { name: 'Germany', code: 'DE', price: 229, discount: 23, basePrice: 299 },
    ];

    return (
      <div className="space-y-6">
        <h3 className="text-lg font-semibold text-center mb-6">International Pricing Examples</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {countries.map(country => (
            <MockPricingWrapper
              key={country.code}
              mockPricing={createMockPricing({
                localPrice: country.price,
                basePrice: country.basePrice,
                discount: country.discount,
                countryName: country.name,
                countryCode: country.code,
                annualSavings: Math.round((country.basePrice - country.price) * 1.5),
              })}
            >
              <div className="p-4 border rounded-lg text-center">
                <h4 className="font-medium mb-2">{country.name}</h4>
                <PriceDisplay size="md" showComparison={true} showSavings={true} />
              </div>
            </MockPricingWrapper>
          ))}
        </div>
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story: 'Examples of price display for different countries with varying discounts.',
      },
    },
  },
};

export const NoDiscount: Story = {
  args: {
    showComparison: true,
    showSavings: true,
  },
  parameters: {
    mockPricing: createMockPricing({
      localPrice: 299,
      basePrice: 299,
      discount: 0,
      countryName: 'Switzerland',
      countryCode: 'CH',
    }),
    docs: {
      description: {
        story: 'Price display for regions without discount pricing.',
      },
    },
  },
};

export const PricingCards: Story = {
  render: () => {
    const plans = [
      {
        name: 'Basic',
        features: ['5,000 terms', 'Basic search', 'Email support'],
        price: 149,
        popular: false,
      },
      {
        name: 'Pro',
        features: ['10,000+ terms', 'Advanced search', 'Code examples', 'Priority support'],
        price: 249,
        popular: true,
      },
      {
        name: 'Enterprise',
        features: ['15,000+ terms', 'API access', 'Custom integrations', 'Dedicated support'],
        price: 399,
        popular: false,
      },
    ];

    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
        {plans.map(plan => (
          <MockPricingWrapper
            key={plan.name}
            mockPricing={createMockPricing({
              localPrice: plan.price,
              basePrice: plan.price + 50,
              discount: plan.popular ? 17 : 0,
              annualSavings: plan.price * 1.2,
            })}
          >
            <div
              className={`p-6 border rounded-xl ${plan.popular ? 'border-purple-500 bg-purple-50' : 'border-gray-200'}`}
            >
              {plan.popular && (
                <div className="bg-purple-500 text-white text-xs font-bold px-3 py-1 rounded-full text-center mb-4">
                  MOST POPULAR
                </div>
              )}

              <h3 className="text-xl font-bold text-center mb-2">{plan.name}</h3>

              <PriceDisplay size="lg" showComparison={plan.popular} className="mb-6" />

              <ul className="space-y-2 mb-6">
                {plan.features.map((feature, index) => (
                  <li key={index} className="flex items-center text-sm">
                    <span className="text-green-500 mr-2">✓</span>
                    {feature}
                  </li>
                ))}
              </ul>

              <button
                className={`w-full py-3 rounded-lg font-semibold ${
                  plan.popular
                    ? 'bg-purple-500 text-white hover:bg-purple-600'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Get Started
              </button>
            </div>
          </MockPricingWrapper>
        ))}
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story: 'Price display component used in pricing cards layout.',
      },
    },
  },
};

export const InlineUsage: Story = {
  render: () => (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2">Get Lifetime Access</h2>
        <p className="text-gray-600 mb-4">
          Join thousands of AI professionals with our comprehensive glossary
        </p>
        <PriceDisplay size="xl" showComparison={true} showSavings={true} />
        <button className="mt-4 bg-purple-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-purple-700">
          Get Started Now
        </button>
      </div>

      <div className="border-t pt-6">
        <div className="text-center">
          <p className="text-gray-600 mb-2">Special pricing available in your region</p>
          <PriceDisplay size="md" showComparison={false} />
          <p className="text-sm text-gray-500 mt-2">
            One-time payment • Lifetime access • No subscriptions
          </p>
        </div>
      </div>

      <div className="bg-gray-50 p-4 rounded-lg">
        <div className="flex justify-between items-center">
          <div>
            <h4 className="font-semibold">AI/ML Glossary Pro</h4>
            <p className="text-sm text-gray-600">10,000+ terms & examples</p>
          </div>
          <PriceDisplay size="sm" />
        </div>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Various inline usage examples of the price display component.',
      },
    },
  },
};

export const CustomStyling: Story = {
  render: () => (
    <div className="space-y-8">
      <div className="text-center">
        <h3 className="text-lg font-semibold mb-4">Custom Styled Variants</h3>
      </div>

      {/* Gradient background */}
      <div className="bg-gradient-to-r from-purple-600 to-blue-600 p-6 rounded-lg text-white text-center">
        <h4 className="font-semibold mb-2">Hero Section Style</h4>
        <PriceDisplay
          size="xl"
          showComparison={true}
          className="text-white [&_.text-purple-900]:text-white [&_.bg-green-100]:bg-white/20 [&_.text-green-800]:text-white"
        />
      </div>

      {/* Bordered */}
      <div className="border-2 border-purple-200 p-6 rounded-lg text-center bg-purple-50">
        <h4 className="font-semibold mb-2 text-purple-900">Highlighted Pricing</h4>
        <PriceDisplay size="lg" showComparison={true} showSavings={true} />
      </div>

      {/* Minimal */}
      <div className="text-center">
        <h4 className="font-semibold mb-2">Minimal Style</h4>
        <PriceDisplay size="md" className="text-gray-800" />
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Examples of custom styling and theming for different contexts.',
      },
    },
  },
};

export const DarkMode: Story = {
  args: {
    showComparison: true,
    showSavings: true,
    size: 'lg',
  },
  parameters: {
    backgrounds: {
      default: 'dark',
    },
    docs: {
      description: {
        story: 'Price display in dark mode theme.',
      },
    },
  },
  decorators: [
    _ => (
      <div className="p-6 bg-gray-900 rounded-lg shadow-sm dark">
        <div className="text-white">
          <PriceDisplay showComparison={true} showSavings={true} size="lg" />
        </div>
      </div>
    ),
  ],
};
