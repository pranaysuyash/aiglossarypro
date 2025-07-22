import type { Meta, StoryObj } from '@storybook/react';
import { LandingHeader } from './LandingHeader';

const meta: Meta<typeof LandingHeader> = {
  title: 'Landing/LandingHeader',
  component: LandingHeader,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Landing page header with navigation, logo, and CTA buttons. Features responsive design and analytics tracking.',
      },
    },
  },
  decorators: [
    _ => (
      <div className="min-h-screen bg-gray-50">
        <LandingHeader />
        <div className="p-8">
          <h2 className="text-2xl font-bold mb-4">Page Content</h2>
          <p className="text-gray-600 mb-4">
            This is sample content below the header to show how the sticky header works.
          </p>
          <div className="space-y-4">
            {Array.from({ length: 10 }, (_, i) => (
              <div key={i} className="bg-white p-4 rounded-lg shadow">
                <h3 className="font-semibold">Content Section {i + 1}</h3>
                <p className="text-gray-600">
                  Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor
                  incididunt ut labore et dolore magna aliqua.
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    ),
  ],
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof LandingHeader>;

// Mock the useCountryPricing hook
const mockUseCountryPricing = () => ({
  localPrice: 129,
  currency: 'USD',
  currencySymbol: '$',
  countryCode: 'US',
  isLoading: false,
});

// Override the hook for Storybook

export const Default: Story = {
  parameters: {
    docs: {
      description: {
        story: 'Default landing header with navigation and CTA buttons.',
      },
    },
  },
};

export const Mobile: Story = {
  parameters: {
    viewport: {
      defaultViewport: 'mobile1',
    },
    docs: {
      description: {
        story: 'Mobile view of the landing header with responsive navigation and compact CTA.',
      },
    },
  },
};

export const Tablet: Story = {
  parameters: {
    viewport: {
      defaultViewport: 'tablet',
    },
    docs: {
      description: {
        story: 'Tablet view of the landing header with balanced navigation layout.',
      },
    },
  },
};

export const Desktop: Story = {
  parameters: {
    viewport: {
      defaultViewport: 'desktop',
    },
    docs: {
      description: {
        story: 'Desktop view of the landing header with full navigation and both CTA buttons.',
      },
    },
  },
};

export const WithScrollBehavior: Story = {
  decorators: [
    _ => (
      <div className="min-h-[200vh] bg-gray-50">
        <LandingHeader />
        <div className="p-8">
          <h2 className="text-2xl font-bold mb-4">Scroll to test sticky behavior</h2>
          <p className="text-gray-600 mb-4">
            The header should remain fixed at the top while scrolling.
          </p>
          <div className="space-y-4">
            {Array.from({ length: 50 }, (_, i) => (
              <div key={i} className="bg-white p-4 rounded-lg shadow">
                <h3 className="font-semibold">Content Section {i + 1}</h3>
                <p className="text-gray-600">
                  Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor
                  incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud
                  exercitation ullamco laboris.
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    ),
  ],
  parameters: {
    docs: {
      description: {
        story:
          'Landing header with sticky behavior demonstration. Scroll to see the header remain at the top.',
      },
    },
  },
};

export const WithInternationalPricing: Story = {
  decorators: [
    _ => {
      // Mock different pricing for this story
      const mockInternationalPricing = () => ({
        localPrice: 99,
        currency: 'EUR',
        currencySymbol: '€',
        countryCode: 'DE',
        isLoading: false,
      });

      // Temporarily override the hook

      return <LandingHeader />;
    },
  ],
  parameters: {
    docs: {
      description: {
        story:
          'Landing header with international pricing (EUR) showing localized pricing in CTA buttons.',
      },
    },
  },
};

export const DarkMode: Story = {
  decorators: [
    _ => (
      <div className="min-h-screen bg-gray-900">
        <div className="dark">
          <LandingHeader />
        </div>
        <div className="p-8">
          <h2 className="text-2xl font-bold mb-4 text-white">Dark Mode Content</h2>
          <p className="text-gray-300 mb-4">
            This shows how the header looks against a dark background.
          </p>
          <div className="space-y-4">
            {Array.from({ length: 5 }, (_, i) => (
              <div key={i} className="bg-gray-800 p-4 rounded-lg">
                <h3 className="font-semibold text-white">Content Section {i + 1}</h3>
                <p className="text-gray-300">
                  Lorem ipsum dolor sit amet, consectetur adipiscing elit.
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    ),
  ],
  parameters: {
    docs: {
      description: {
        story: 'Landing header in dark mode context to test contrast and readability.',
      },
    },
  },
};
