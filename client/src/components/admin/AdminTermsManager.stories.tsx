import type { Meta, StoryObj } from '@storybook/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AdminTermsManager } from './AdminTermsManager';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
    },
  },
});

const meta: Meta<typeof AdminTermsManager> = {
  title: 'Admin/AdminTermsManager',
  component: AdminTermsManager,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'AI-powered terms management dashboard for admins with content generation, verification, and bulk operations.',
      },
    },
  },
  decorators: [
    Story => (
      <QueryClientProvider client={queryClient}>
        <div className="min-h-screen bg-gray-50 p-6">
          <Story />
        </div>
      </QueryClientProvider>
    ),
  ],
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof AdminTermsManager>;

// Mock fetch for Storybook
const mockFetch = (url: string) => {
  if (url.includes('/api/terms')) {
    return Promise.resolve({
      ok: true,
      json: () =>
        Promise.resolve({
          data: [
            {
              id: '1',
              name: 'Machine Learning',
              shortDefinition:
                'A subset of AI that enables systems to learn and improve from experience.',
              definition:
                'Machine Learning is a method of data analysis that automates analytical model building.',
              category: 'Core ML',
              subcategory: 'Foundations',
              characteristics: ['Pattern Recognition', 'Automated Learning', 'Data-Driven'],
              applications: [
                { name: 'Image Recognition', description: 'Identifying objects in images' },
                {
                  name: 'Natural Language Processing',
                  description: 'Understanding human language',
                },
              ],
              mathFormulation: 'f(x) = θ₀ + θ₁x₁ + θ₂x₂ + ... + θₙxₙ',
              relatedTerms: ['Deep Learning', 'Neural Networks', 'Supervised Learning'],
              aiGenerated: true,
              verificationStatus: 'verified',
              qualityScore: 92,
              createdAt: '2024-01-15T10:30:00Z',
              updatedAt: '2024-01-20T14:45:00Z',
            },
            {
              id: '2',
              name: 'Deep Learning',
              shortDefinition: 'A subset of ML using neural networks with multiple layers.',
              definition:
                'Deep Learning uses artificial neural networks with multiple layers to model and understand complex patterns.',
              category: 'Neural Networks',
              subcategory: 'Deep Learning',
              characteristics: [
                'Multi-layer Networks',
                'Feature Learning',
                'Hierarchical Representations',
              ],
              applications: [
                { name: 'Computer Vision', description: 'Advanced image and video analysis' },
                { name: 'Speech Recognition', description: 'Converting speech to text' },
              ],
              mathFormulation: 'y = f(W₃f(W₂f(W₁x + b₁) + b₂) + b₃)',
              relatedTerms: ['Neural Networks', 'Convolutional Networks', 'Backpropagation'],
              aiGenerated: false,
              verificationStatus: 'unverified',
              qualityScore: 85,
              createdAt: '2024-01-16T09:15:00Z',
              updatedAt: '2024-01-18T16:20:00Z',
            },
            {
              id: '3',
              name: 'Reinforcement Learning',
              shortDefinition:
                'Learning through interaction with an environment using rewards and penalties.',
              definition:
                'Reinforcement Learning is a type of machine learning where an agent learns to make decisions by performing actions in an environment.',
              category: 'Learning Paradigms',
              subcategory: 'Reinforcement Learning',
              characteristics: [
                'Trial and Error',
                'Reward Maximization',
                'Sequential Decision Making',
              ],
              applications: [
                { name: 'Game Playing', description: 'AI agents learning to play games' },
                { name: 'Robotics', description: 'Robot control and navigation' },
              ],
              mathFormulation: "Q(s,a) = r + γ max Q(s',a')",
              relatedTerms: ['Q-Learning', 'Policy Gradient', 'Value Functions'],
              aiGenerated: true,
              verificationStatus: 'flagged',
              qualityScore: 78,
              createdAt: '2024-01-14T11:45:00Z',
              updatedAt: '2024-01-19T13:30:00Z',
            },
          ],
          pagination: {
            page: 1,
            limit: 50,
            total: 3,
            pages: 1,
          },
        }),
    });
  }

  if (url.includes('/api/categories')) {
    return Promise.resolve({
      ok: true,
      json: () =>
        Promise.resolve([
          { id: '1', name: 'Core ML', description: 'Fundamental machine learning concepts' },
          {
            id: '2',
            name: 'Neural Networks',
            description: 'Artificial neural network architectures',
          },
          {
            id: '3',
            name: 'Learning Paradigms',
            description: 'Different approaches to machine learning',
          },
        ]),
    });
  }

  if (url.includes('/api/ai/analytics')) {
    return Promise.resolve({
      ok: true,
      json: () =>
        Promise.resolve({
          success: true,
          data: {
            summary: {
              totalRequests: 1247,
              totalCost: 45.67,
              averageLatency: 850,
              successRate: 98.2,
              totalInputTokens: 125000,
              totalOutputTokens: 87500,
            },
            byOperation: {
              generate_definition: {
                count: 456,
                totalCost: 23.45,
                avgLatency: 920,
              },
              improve_definition: {
                count: 234,
                totalCost: 12.34,
                avgLatency: 780,
              },
            },
            byModel: {
              'gpt-4': {
                count: 300,
                totalCost: 25.67,
                avgLatency: 1200,
              },
              'gpt-3.5-turbo': {
                count: 947,
                totalCost: 20.0,
                avgLatency: 650,
              },
            },
          },
        }),
    });
  }

  return Promise.resolve({
    ok: true,
    json: () => Promise.resolve({}),
  });
};

// Override fetch for Storybook
global.fetch = mockFetch as any;

export const Default: Story = {
  parameters: {
    docs: {
      description: {
        story: 'Default view of the AdminTermsManager with sample terms and analytics data.',
      },
    },
  },
};

export const Loading: Story = {
  decorators: [
    Story => {
      const loadingQueryClient = new QueryClient({
        defaultOptions: {
          queries: {
            retry: false,
            enabled: false, // Disable queries to show loading state
          },
        },
      });
      return (
        <QueryClientProvider client={loadingQueryClient}>
          <div className="min-h-screen bg-gray-50 p-6">
            <Story />
          </div>
        </QueryClientProvider>
      );
    },
  ],
  parameters: {
    docs: {
      description: {
        story: 'Loading state while fetching terms and analytics data.',
      },
    },
  },
};

export const EmptyState: Story = {
  decorators: [
    Story => {
      const emptyQueryClient = new QueryClient({
        defaultOptions: {
          queries: {
            retry: false,
          },
        },
      });

      // Mock empty response
      global.fetch = ((url: string) => {
        if (url.includes('/api/terms')) {
          return Promise.resolve({
            ok: true,
            json: () =>
              Promise.resolve({
                data: [],
                pagination: { page: 1, limit: 50, total: 0, pages: 0 },
              }),
          });
        }
        return mockFetch(url);
      }) as any;

      return (
        <QueryClientProvider client={emptyQueryClient}>
          <div className="min-h-screen bg-gray-50 p-6">
            <Story />
          </div>
        </QueryClientProvider>
      );
    },
  ],
  parameters: {
    docs: {
      description: {
        story: 'Empty state when no terms are found.',
      },
    },
  },
};

export const WithFilters: Story = {
  parameters: {
    docs: {
      description: {
        story: 'AdminTermsManager with various filters applied to show filtered results.',
      },
    },
  },
};

export const AIAnalytics: Story = {
  parameters: {
    docs: {
      description: {
        story: 'Focus on the AI analytics section showing usage metrics and performance data.',
      },
    },
  },
};
