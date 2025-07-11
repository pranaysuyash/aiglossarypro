import type { Meta, StoryObj } from '@storybook/react';
import { FounderStory } from './FounderStory';

const meta: Meta<typeof FounderStory> = {
  title: 'Landing/FounderStory',
  component: FounderStory,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: 'Founder story section sharing the personal journey and motivation behind creating the AI/ML Glossary Pro platform.',
      },
    },
  },
  decorators: [
    (Story) => (
      <div className="min-h-screen">
        <Story />
      </div>
    ),
  ],
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof FounderStory>;

export const Default: Story = {
  parameters: {
    docs: {
      description: {
        story: 'Default founder story section with personal narrative and motivation.',
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
        story: 'Mobile view of the founder story with stacked layout and responsive design.',
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
        story: 'Tablet view of the founder story with balanced layout.',
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
        story: 'Desktop view of the founder story with full layout and side-by-side content.',
      },
    },
  },
};

export const WithAlternativeBackground: Story = {
  decorators: [
    (Story) => (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
        <Story />
      </div>
    ),
  ],
  parameters: {
    docs: {
      description: {
        story: 'Founder story with alternative background gradient for visual variety.',
      },
    },
  },
};

export const CompactVersion: Story = {
  decorators: [
    (Story) => (
      <div className="bg-white py-16">
        <div className="max-w-4xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">
              Why I Built This
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              A personal journey from confusion to clarity in AI/ML
            </p>
          </div>
          
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-8 rounded-xl border border-blue-200">
            <div className="flex items-start gap-6">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
                <div className="w-8 h-8 bg-white rounded-full"></div>
              </div>
              <div>
                <blockquote className="text-lg text-gray-700 italic leading-relaxed mb-4">
                  "As a busy professional, I needed AI/ML knowledge for business decisions but had no time for deep research. So I built what I wished existed - a comprehensive, practical reference that saves time and confusion."
                </blockquote>
                <cite className="text-gray-600">— Pranay, Founder</cite>
              </div>
            </div>
          </div>
          
          <div className="grid md:grid-cols-2 gap-6 mt-12">
            <div className="bg-red-50 border border-red-200 p-6 rounded-lg">
              <h3 className="font-bold text-red-900 mb-2">The Problem</h3>
              <p className="text-red-700 text-sm">
                Scattered information, complex explanations, and no time to piece together a complete understanding.
              </p>
            </div>
            <div className="bg-green-50 border border-green-200 p-6 rounded-lg">
              <h3 className="font-bold text-green-900 mb-2">The Solution</h3>
              <p className="text-green-700 text-sm">
                A single, comprehensive resource with practical explanations built by someone who understands the struggle.
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
        story: 'Compact version of the founder story focusing on the core message.',
      },
    },
  },
};

export const WithRealPhoto: Story = {
  decorators: [
    (Story) => (
      <div className="py-16 bg-gradient-to-br from-blue-50 to-purple-50">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
              Meet the Founder
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              A personal journey from confusion to clarity in the AI/ML world
            </p>
          </div>
          
          <div className="bg-white p-8 sm:p-12 rounded-xl shadow-lg border border-blue-200">
            <div className="flex flex-col lg:flex-row gap-8 lg:gap-12 items-center">
              <div className="flex-shrink-0">
                <img 
                  src="/api/placeholder/200/200" 
                  alt="Pranay, Founder" 
                  className="w-32 h-32 sm:w-40 sm:h-40 rounded-full object-cover"
                />
              </div>
              <div className="flex-1 text-center lg:text-left">
                <blockquote className="text-lg sm:text-xl text-gray-700 mb-6 italic leading-relaxed">
                  "I'm a CS grad who spent years as a functional consultant and founder. While I stayed connected to technology through my consulting work and startup journey, AI/ML was exploding with concepts I needed to understand for business decisions. I realized: it's impossible to study 10,000+ terms in depth while running a business. So I combined my practical notes with thorough research to help other busy professionals."
                </blockquote>
                <cite className="text-base text-gray-600 not-italic">— Pranay, Founder</cite>
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
        story: 'Founder story with placeholder for real photo instead of icon.',
      },
    },
  },
};

export const MinimalVersion: Story = {
  decorators: [
    (Story) => (
      <div className="bg-gray-50 py-16">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-8">
            Built by Someone Who Gets It
          </h2>
          
          <div className="bg-white p-8 rounded-lg shadow-sm border max-w-2xl mx-auto">
            <p className="text-lg text-gray-700 mb-6 italic">
              "I built this because I needed it. As a busy professional, I couldn't find a single source for AI/ML concepts that was both comprehensive and practical. So I created what I wished existed."
            </p>
            <div className="text-gray-600">— Pranay, Founder</div>
          </div>
          
          <div className="mt-12 grid md:grid-cols-3 gap-6 text-sm">
            <div className="flex items-center justify-center gap-2">
              <div className="w-3 h-3 bg-red-500 rounded-full"></div>
              <span>Career changer perspective</span>
            </div>
            <div className="flex items-center justify-center gap-2">
              <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
              <span>Re-entering tech after 10 years</span>
            </div>
            <div className="flex items-center justify-center gap-2">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span>Focused on practical learning</span>
            </div>
          </div>
        </div>
      </div>
    ),
  ],
  parameters: {
    docs: {
      description: {
        story: 'Minimal version of the founder story with essential message and trust signals.',
      },
    },
  },
};