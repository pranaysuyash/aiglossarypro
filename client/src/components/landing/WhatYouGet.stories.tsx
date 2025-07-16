import type { Meta, StoryObj } from '@storybook/react';
import { WhatYouGet } from './WhatYouGet';

const meta: Meta<typeof WhatYouGet> = {
  title: 'Landing/WhatYouGet',
  component: WhatYouGet,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'What You Get section showcasing all the features and benefits of the AI/ML Glossary Pro with lifetime access messaging.',
      },
    },
  },
  decorators: [
    Story => (
      <div className="min-h-screen bg-gray-50">
        <Story />
      </div>
    ),
  ],
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof WhatYouGet>;

export const Default: Story = {
  parameters: {
    docs: {
      description: {
        story: 'Default What You Get section with all features and benefits clearly displayed.',
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
        story: 'Mobile view of the What You Get section with responsive stacked layout.',
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
        story: 'Tablet view of the What You Get section with balanced grid layout.',
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
        story: 'Desktop view of the What You Get section with full three-column layout.',
      },
    },
  },
};

export const WithDarkBackground: Story = {
  decorators: [
    Story => (
      <div className="min-h-screen bg-gray-900">
        <div
          className="py-16 sm:py-20 lg:py-24 px-4 sm:px-6 lg:px-8"
          style={{ backgroundColor: '#1f2937' }}
        >
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <div className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-purple-100 text-purple-800 border border-purple-200 mb-4">
                One-Time Payment, Lifetime Access
              </div>
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
                Pay once, access forever. No recurring fees.
              </h2>
              <p className="text-xl text-gray-300 max-w-3xl mx-auto">
                Get everything you need to master AI and Machine Learning concepts.{' '}
                <span className="text-purple-400 font-semibold">
                  Save thousands vs annual subscriptions.
                </span>
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              <div className="bg-gray-800 border border-gray-700 p-6 rounded-lg">
                <h3 className="text-white font-bold mb-2">Complete AI/ML Reference</h3>
                <p className="text-gray-300 text-sm">10,000+ terms across all domains</p>
              </div>
              <div className="bg-gray-800 border border-gray-700 p-6 rounded-lg">
                <h3 className="text-white font-bold mb-2">Code Examples</h3>
                <p className="text-gray-300 text-sm">Python, R, and framework examples</p>
              </div>
              <div className="bg-gray-800 border border-gray-700 p-6 rounded-lg">
                <h3 className="text-white font-bold mb-2">Lifetime Updates</h3>
                <p className="text-gray-300 text-sm">Stay current with new concepts</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    ),
  ],
  parameters: {
    docs: {
      description: {
        story: 'What You Get section with dark theme styling for different design contexts.',
      },
    },
  },
};

export const CompactVersion: Story = {
  decorators: [
    Story => (
      <div className="bg-white py-12">
        <div className="max-w-4xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Everything You Need</h2>
            <p className="text-gray-600">Comprehensive AI/ML reference with lifetime access</p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="flex items-start gap-4 p-4 border rounded-lg">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <div className="w-5 h-5 bg-blue-600 rounded"></div>
              </div>
              <div>
                <h3 className="font-semibold mb-1">10,000+ Terms</h3>
                <p className="text-sm text-gray-600">Complete coverage of AI/ML concepts</p>
              </div>
            </div>

            <div className="flex items-start gap-4 p-4 border rounded-lg">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <div className="w-5 h-5 bg-green-600 rounded"></div>
              </div>
              <div>
                <h3 className="font-semibold mb-1">Code Examples</h3>
                <p className="text-sm text-gray-600">Practical implementations</p>
              </div>
            </div>

            <div className="flex items-start gap-4 p-4 border rounded-lg">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <div className="w-5 h-5 bg-purple-600 rounded"></div>
              </div>
              <div>
                <h3 className="font-semibold mb-1">Lifetime Updates</h3>
                <p className="text-sm text-gray-600">Always current content</p>
              </div>
            </div>

            <div className="flex items-start gap-4 p-4 border rounded-lg">
              <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                <div className="w-5 h-5 bg-orange-600 rounded"></div>
              </div>
              <div>
                <h3 className="font-semibold mb-1">Mobile Access</h3>
                <p className="text-sm text-gray-600">Learn anywhere, anytime</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    ),
  ],
  parameters: {
    docs: {
      description: {
        story:
          'Compact version of What You Get with simplified layout and fewer features highlighted.',
      },
    },
  },
};

export const WithPricing: Story = {
  decorators: [
    Story => (
      <div className="bg-gradient-to-br from-purple-50 to-blue-50 py-16">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
              Everything Included
            </h2>
            <div className="bg-white inline-block px-6 py-3 rounded-lg shadow-sm border mb-6">
              <div className="text-3xl font-bold text-purple-600">$129</div>
              <div className="text-sm text-gray-600">One-time payment</div>
            </div>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Compare to $400+ annual subscriptions elsewhere
            </p>
          </div>

          <Story />
        </div>
      </div>
    ),
  ],
  parameters: {
    docs: {
      description: {
        story: 'What You Get section with prominent pricing display and value comparison.',
      },
    },
  },
};

export const FeatureHighlight: Story = {
  decorators: [
    Story => (
      <div className="bg-white py-16">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
              Why Choose AI/ML Glossary Pro?
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              The most comprehensive AI/ML reference available
            </p>
          </div>

          <div className="grid lg:grid-cols-3 gap-8 mb-16">
            <div className="text-center p-6 bg-blue-50 rounded-xl border border-blue-200">
              <div className="w-12 h-12 bg-blue-600 rounded-full mx-auto mb-4 flex items-center justify-center">
                <div className="w-6 h-6 bg-white rounded"></div>
              </div>
              <h3 className="font-bold text-blue-900 mb-2">Comprehensive</h3>
              <p className="text-blue-700 text-sm">
                10,000+ terms covering every aspect of AI and Machine Learning
              </p>
            </div>

            <div className="text-center p-6 bg-green-50 rounded-xl border border-green-200">
              <div className="w-12 h-12 bg-green-600 rounded-full mx-auto mb-4 flex items-center justify-center">
                <div className="w-6 h-6 bg-white rounded"></div>
              </div>
              <h3 className="font-bold text-green-900 mb-2">Practical</h3>
              <p className="text-green-700 text-sm">
                Real code examples and implementations you can use immediately
              </p>
            </div>

            <div className="text-center p-6 bg-purple-50 rounded-xl border border-purple-200">
              <div className="w-12 h-12 bg-purple-600 rounded-full mx-auto mb-4 flex items-center justify-center">
                <div className="w-6 h-6 bg-white rounded"></div>
              </div>
              <h3 className="font-bold text-purple-900 mb-2">Updated</h3>
              <p className="text-purple-700 text-sm">
                Lifetime updates keep you current with the latest developments
              </p>
            </div>
          </div>
        </div>
      </div>
    ),
  ],
  parameters: {
    docs: {
      description: {
        story:
          'Feature highlight version emphasizing the key selling points with enhanced visual design.',
      },
    },
  },
};
