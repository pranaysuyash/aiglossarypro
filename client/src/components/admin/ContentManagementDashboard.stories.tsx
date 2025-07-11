import type { Meta, StoryObj } from '@storybook/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ContentManagementDashboard } from './ContentManagementDashboard';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
    },
  },
});

const meta: Meta<typeof ContentManagementDashboard> = {
  title: 'Admin/ContentManagementDashboard',
  component: ContentManagementDashboard,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: 'Content management dashboard for generating, editing, and managing AI-powered glossary content across multiple sections.',
      },
    },
  },
  decorators: [
    (Story) => (
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
type Story = StoryObj<typeof ContentManagementDashboard>;

// Mock fetch for Storybook
const mockFetch = (url: string) => {
  if (url.includes('/api/admin/enhanced-terms')) {
    return Promise.resolve({
      ok: true,
      json: () => Promise.resolve([
        {
          id: '1',
          name: 'Machine Learning',
          slug: 'machine-learning',
          shortDefinition: 'A subset of AI that enables systems to learn and improve from experience.',
          difficultyLevel: 'Intermediate'
        },
        {
          id: '2',
          name: 'Deep Learning',
          slug: 'deep-learning',
          shortDefinition: 'A subset of ML using neural networks with multiple layers.',
          difficultyLevel: 'Advanced'
        },
        {
          id: '3',
          name: 'Supervised Learning',
          slug: 'supervised-learning',
          shortDefinition: 'Learning with labeled training data.',
          difficultyLevel: 'Beginner'
        },
        {
          id: '4',
          name: 'Unsupervised Learning',
          slug: 'unsupervised-learning',
          shortDefinition: 'Learning from data without labeled examples.',
          difficultyLevel: 'Intermediate'
        },
        {
          id: '5',
          name: 'Reinforcement Learning',
          slug: 'reinforcement-learning',
          shortDefinition: 'Learning through interaction with an environment using rewards.',
          difficultyLevel: 'Advanced'
        }
      ])
    });
  }
  
  if (url.includes('/api/admin/content-metrics')) {
    return Promise.resolve({
      ok: true,
      json: () => Promise.resolve({
        totalTerms: 10372,
        termsWithContent: 8945,
        sectionsGenerated: 42580,
        averageQualityScore: 8.4
      })
    });
  }
  
  if (url.includes('/api/admin/terms/1/sections')) {
    return Promise.resolve({
      ok: true,
      json: () => Promise.resolve([
        { id: 1, name: 'definition_overview', displayOrder: 1, isCompleted: true },
        { id: 2, name: 'key_characteristics', displayOrder: 2, isCompleted: true },
        { id: 3, name: 'real_world_applications', displayOrder: 3, isCompleted: false },
        { id: 4, name: 'related_concepts', displayOrder: 4, isCompleted: false }
      ])
    });
  }
  
  if (url.includes('/api/admin/terms/1/sections/definition_overview/content')) {
    return Promise.resolve({
      ok: true,
      json: () => Promise.resolve({
        content: 'Machine Learning is a method of data analysis that automates analytical model building. It is a branch of artificial intelligence (AI) based on the idea that systems can learn from data, identify patterns and make decisions with minimal human intervention.',
        isAiGenerated: true,
        qualityScore: 8.7,
        metadata: {
          generatedAt: '2024-01-15T10:30:00Z',
          model: 'gpt-4',
          reviewStatus: 'approved',
          lastModified: '2024-01-20T14:45:00Z'
        }
      })
    });
  }
  
  return Promise.resolve({
    ok: true,
    json: () => Promise.resolve({})
  });
};

// Override fetch for Storybook
global.fetch = mockFetch as any;

export const Default: Story = {
  parameters: {
    docs: {
      description: {
        story: 'Default view of the ContentManagementDashboard with metrics overview and term selection.',
      },
    },
  },
};

export const WithSelectedTerm: Story = {
  decorators: [
    (Story) => {
      // Pre-select a term in the story
      return (
        <QueryClientProvider client={queryClient}>
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
        story: 'ContentManagementDashboard with a term selected, showing the content editor interface.',
      },
    },
  },
};

export const Loading: Story = {
  decorators: [
    (Story) => {
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
        story: 'Loading state while fetching terms and content data.',
      },
    },
  },
};

export const EmptyTerms: Story = {
  decorators: [
    (Story) => {
      const emptyQueryClient = new QueryClient({
        defaultOptions: {
          queries: {
            retry: false,
          },
        },
      });
      
      // Mock empty response
      global.fetch = ((url: string) => {
        if (url.includes('/api/admin/enhanced-terms')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve([])
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

export const WithHighMetrics: Story = {
  decorators: [
    (Story) => {
      const highMetricsQueryClient = new QueryClient({
        defaultOptions: {
          queries: {
            retry: false,
          },
        },
      });
      
      // Mock high metrics response
      global.fetch = ((url: string) => {
        if (url.includes('/api/admin/content-metrics')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({
              totalTerms: 15000,
              termsWithContent: 14500,
              sectionsGenerated: 98000,
              averageQualityScore: 9.2
            })
          });
        }
        return mockFetch(url);
      }) as any;
      
      return (
        <QueryClientProvider client={highMetricsQueryClient}>
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
        story: 'ContentManagementDashboard with high content completion metrics.',
      },
    },
  },
};