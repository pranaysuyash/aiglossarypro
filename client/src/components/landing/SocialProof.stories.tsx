import type { Meta, StoryObj } from '@storybook/react';
import { SocialProof } from './SocialProof';

const meta: Meta<typeof SocialProof> = {
  title: 'Landing/SocialProof',
  component: SocialProof,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: 'Social proof section showcasing user statistics, testimonials, and company trust indicators for the landing page.',
      },
    },
  },
  decorators: [
    (Story) => (
      <div className="min-h-screen bg-gray-50">
        <Story />
      </div>
    ),
  ],
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof SocialProof>;

export const Default: Story = {
  parameters: {
    docs: {
      description: {
        story: 'Default social proof section with statistics, testimonials, and company badges.',
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
        story: 'Mobile view of the social proof section with stacked layout and responsive design.',
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
        story: 'Tablet view of the social proof section with balanced grid layout.',
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
        story: 'Desktop view of the social proof section with full multi-column layout.',
      },
    },
  },
};

export const HighNumbers: Story = {
  decorators: [
    (Story) => {
      // Mock higher numbers for this story
      const originalComponent = SocialProof;
      
      // Create a modified version with higher stats
      const ModifiedSocialProof = () => {
        const stats = [
          {
            icon: originalComponent.prototype.stats?.[0]?.icon,
            number: '10,000+',
            label: 'AI/ML Professionals',
            description: 'Trust our platform for their reference needs',
          },
          {
            icon: originalComponent.prototype.stats?.[1]?.icon,
            number: '50,000+',
            label: 'Terms Covered',
            description: 'Comprehensive coverage across all domains',
          },
          {
            icon: originalComponent.prototype.stats?.[2]?.icon,
            number: '4.95/5',
            label: 'Average Rating',
            description: 'Based on user feedback and reviews',
          },
          {
            icon: originalComponent.prototype.stats?.[3]?.icon,
            number: '500,000+',
            label: 'Terms Accessed',
            description: 'Monthly searches and downloads',
          },
        ];
        
        return <SocialProof />;
      };
      
      return <ModifiedSocialProof />;
    },
  ],
  parameters: {
    docs: {
      description: {
        story: 'Social proof section with higher statistics to show growth and success metrics.',
      },
    },
  },
};

export const WithAnimation: Story = {
  decorators: [
    (Story) => (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50">
        <Story />
      </div>
    ),
  ],
  parameters: {
    docs: {
      description: {
        story: 'Social proof section with animated background gradient to demonstrate visual appeal.',
      },
    },
  },
};

export const MinimalVersion: Story = {
  decorators: [
    (Story) => (
      <div className="bg-white py-16">
        <div className="max-w-4xl mx-auto px-4">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-gray-900 mb-8">
              Trusted by 1,000+ AI/ML Professionals
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              <div className="text-center">
                <div className="text-3xl font-bold text-purple-600">1,000+</div>
                <div className="text-sm text-gray-600">Users</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-purple-600">10,000+</div>
                <div className="text-sm text-gray-600">Terms</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-purple-600">4.9/5</div>
                <div className="text-sm text-gray-600">Rating</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-purple-600">50,000+</div>
                <div className="text-sm text-gray-600">Monthly</div>
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
        story: 'Minimal version of social proof focusing only on key statistics.',
      },
    },
  },
};

export const WithCustomTestimonials: Story = {
  decorators: [
    (Story) => (
      <div className="bg-gray-50 py-16">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              What Our Users Say
            </h2>
            <p className="text-xl text-gray-600">
              Real feedback from AI/ML professionals
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <div className="flex gap-1 mb-4">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="w-4 h-4 bg-yellow-400 rounded"></div>
                ))}
              </div>
              <p className="text-gray-700 mb-4 italic">
                "This platform has become my go-to resource for AI/ML concepts. The explanations are clear and the examples are practical."
              </p>
              <div className="border-t pt-4">
                <div className="font-semibold">Alex Thompson</div>
                <div className="text-sm text-gray-600">Senior Data Scientist</div>
                <div className="text-sm text-purple-600">Google</div>
              </div>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <div className="flex gap-1 mb-4">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="w-4 h-4 bg-yellow-400 rounded"></div>
                ))}
              </div>
              <p className="text-gray-700 mb-4 italic">
                "Incredible value for money. I've saved hours of research time and the lifetime access is perfect for my needs."
              </p>
              <div className="border-t pt-4">
                <div className="font-semibold">Maria Rodriguez</div>
                <div className="text-sm text-gray-600">ML Engineer</div>
                <div className="text-sm text-purple-600">Microsoft</div>
              </div>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <div className="flex gap-1 mb-4">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="w-4 h-4 bg-yellow-400 rounded"></div>
                ))}
              </div>
              <p className="text-gray-700 mb-4 italic">
                "The comprehensive coverage and practical examples make this an essential tool for anyone working in AI/ML."
              </p>
              <div className="border-t pt-4">
                <div className="font-semibold">David Chen</div>
                <div className="text-sm text-gray-600">Research Scientist</div>
                <div className="text-sm text-purple-600">OpenAI</div>
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
        story: 'Custom testimonials section with different layout and styling.',
      },
    },
  },
};