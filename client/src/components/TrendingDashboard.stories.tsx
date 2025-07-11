import type { Meta, StoryObj } from '@storybook/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import TrendingDashboard from './TrendingDashboard';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
    },
  },
});

const meta: Meta<typeof TrendingDashboard> = {
  title: 'Core/TrendingDashboard',
  component: TrendingDashboard,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: 'Real-time trending dashboard showing popular terms, categories, and engagement analytics with filtering and time-based insights.',
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
type Story = StoryObj<typeof TrendingDashboard>;

// Mock trending data
const mockTrendingTerms = [
  {
    id: 'term-1',
    name: 'Large Language Models',
    shortDefinition: 'AI models trained on vast amounts of text data to understand and generate human-like text.',
    categoryName: 'Natural Language Processing',
    viewCount: 15420,
    recentViews: 2340,
    velocityScore: 95.7,
    engagementScore: 89.3,
    trendDirection: 'up' as const,
    percentageChange: 245.6,
    averageTimeSpent: 485,
    shareCount: 156,
    bookmarkCount: 89
  },
  {
    id: 'term-2',
    name: 'Transformer Architecture',
    shortDefinition: 'A neural network architecture that relies entirely on attention mechanisms.',
    categoryName: 'Deep Learning',
    viewCount: 12890,
    recentViews: 1890,
    velocityScore: 87.4,
    engagementScore: 92.1,
    trendDirection: 'up' as const,
    percentageChange: 156.3,
    averageTimeSpent: 520,
    shareCount: 203,
    bookmarkCount: 145
  },
  {
    id: 'term-3',
    name: 'Generative AI',
    shortDefinition: 'AI systems that can create new content, including text, images, and other media.',
    categoryName: 'Machine Learning',
    viewCount: 11200,
    recentViews: 1650,
    velocityScore: 82.1,
    engagementScore: 85.7,
    trendDirection: 'up' as const,
    percentageChange: 189.4,
    averageTimeSpent: 390,
    shareCount: 178,
    bookmarkCount: 112
  },
  {
    id: 'term-4',
    name: 'Attention Mechanism',
    shortDefinition: 'A technique that allows models to focus on specific parts of input data.',
    categoryName: 'Deep Learning',
    viewCount: 8950,
    recentViews: 1340,
    velocityScore: 75.8,
    engagementScore: 88.9,
    trendDirection: 'up' as const,
    percentageChange: 89.7,
    averageTimeSpent: 445,
    shareCount: 134,
    bookmarkCount: 98
  },
  {
    id: 'term-5',
    name: 'BERT',
    shortDefinition: 'Bidirectional Encoder Representations from Transformers.',
    categoryName: 'Natural Language Processing',
    viewCount: 7650,
    recentViews: 980,
    velocityScore: 65.3,
    engagementScore: 79.2,
    trendDirection: 'stable' as const,
    percentageChange: 12.4,
    averageTimeSpent: 380,
    shareCount: 89,
    bookmarkCount: 67
  },
  {
    id: 'term-6',
    name: 'GPT',
    shortDefinition: 'Generative Pre-trained Transformer models.',
    categoryName: 'Natural Language Processing',
    viewCount: 6890,
    recentViews: 850,
    velocityScore: 58.7,
    engagementScore: 82.4,
    trendDirection: 'down' as const,
    percentageChange: -8.3,
    averageTimeSpent: 420,
    shareCount: 95,
    bookmarkCount: 78
  }
];

const mockTrendingCategories = [
  {
    id: 'cat-1',
    name: 'Natural Language Processing',
    description: 'AI techniques for understanding and processing human language',
    viewCount: 45680,
    trendDirection: 'up',
    percentageChange: 67.4
  },
  {
    id: 'cat-2',
    name: 'Generative AI',
    description: 'AI systems that create new content and media',
    viewCount: 38920,
    trendDirection: 'up',
    percentageChange: 134.8
  },
  {
    id: 'cat-3',
    name: 'Deep Learning',
    description: 'Neural networks with multiple layers for complex pattern recognition',
    viewCount: 32450,
    trendDirection: 'up',
    percentageChange: 23.7
  },
  {
    id: 'cat-4',
    name: 'Computer Vision',
    description: 'AI techniques for analyzing and understanding visual content',
    viewCount: 28760,
    trendDirection: 'stable',
    percentageChange: 5.2
  },
  {
    id: 'cat-5',
    name: 'Reinforcement Learning',
    description: 'Learning through interaction with an environment',
    viewCount: 19340,
    trendDirection: 'down',
    percentageChange: -12.6
  }
];

const mockAnalytics = {
  totalTrendingTerms: 847,
  averageVelocityScore: 73.4,
  topCategories: [
    { categoryId: 'cat-1', name: 'Natural Language Processing', trendingCount: 156 },
    { categoryId: 'cat-2', name: 'Generative AI', trendingCount: 134 },
    { categoryId: 'cat-3', name: 'Deep Learning', trendingCount: 98 }
  ],
  trendingChangeFromPrevious: 15.7
};

// Mock fetch for Storybook
const mockFetch = (url: string) => {
  if (url.includes('/api/trending/terms')) {
    return Promise.resolve({
      ok: true,
      json: () => Promise.resolve({
        data: mockTrendingTerms
      })
    });
  }
  
  if (url.includes('/api/trending/categories')) {
    return Promise.resolve({
      ok: true,
      json: () => Promise.resolve({
        data: mockTrendingCategories
      })
    });
  }
  
  if (url.includes('/api/trending/analytics')) {
    return Promise.resolve({
      ok: true,
      json: () => Promise.resolve({
        data: mockAnalytics
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
        story: 'Default trending dashboard with popular terms and analytics.',
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
        story: 'Loading state while fetching trending data.',
      },
    },
  },
};

export const EmptyState: Story = {
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
        if (url.includes('/api/trending/terms')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({
              data: []
            })
          });
        }
        if (url.includes('/api/trending/categories')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({
              data: []
            })
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
        story: 'Empty state when no trending terms are found.',
      },
    },
  },
};

export const HighVelocity: Story = {
  decorators: [
    (Story) => {
      const highVelocityQueryClient = new QueryClient({
        defaultOptions: {
          queries: {
            retry: false,
          },
        },
      });
      
      // Mock high velocity data
      global.fetch = ((url: string) => {
        if (url.includes('/api/trending/terms')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({
              data: mockTrendingTerms.map(term => ({
                ...term,
                velocityScore: Math.min(100, term.velocityScore + 20),
                percentageChange: term.percentageChange * 2,
                trendDirection: 'up' as const
              }))
            })
          });
        }
        return mockFetch(url);
      }) as any;
      
      return (
        <QueryClientProvider client={highVelocityQueryClient}>
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
        story: 'Dashboard showing terms with very high velocity and growth rates.',
      },
    },
  },
};

export const MixedTrends: Story = {
  decorators: [
    (Story) => {
      const mixedTrendsQueryClient = new QueryClient({
        defaultOptions: {
          queries: {
            retry: false,
          },
        },
      });
      
      // Mock mixed trends data
      global.fetch = ((url: string) => {
        if (url.includes('/api/trending/terms')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({
              data: [
                { ...mockTrendingTerms[0], trendDirection: 'up' as const, percentageChange: 156.7 },
                { ...mockTrendingTerms[1], trendDirection: 'down' as const, percentageChange: -23.4 },
                { ...mockTrendingTerms[2], trendDirection: 'stable' as const, percentageChange: 2.1 },
                { ...mockTrendingTerms[3], trendDirection: 'up' as const, percentageChange: 89.3 },
                { ...mockTrendingTerms[4], trendDirection: 'down' as const, percentageChange: -45.8 },
                { ...mockTrendingTerms[5], trendDirection: 'stable' as const, percentageChange: -1.2 }
              ]
            })
          });
        }
        return mockFetch(url);
      }) as any;
      
      return (
        <QueryClientProvider client={mixedTrendsQueryClient}>
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
        story: 'Dashboard showing mixed trending directions with up, down, and stable trends.',
      },
    },
  },
};

export const CategoryFocus: Story = {
  decorators: [
    (Story) => {
      const categoryFocusQueryClient = new QueryClient({
        defaultOptions: {
          queries: {
            retry: false,
          },
        },
      });
      
      // Mock category-focused data
      global.fetch = ((url: string) => {
        if (url.includes('/api/trending/categories')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({
              data: mockTrendingCategories.map(cat => ({
                ...cat,
                viewCount: cat.viewCount * 1.5,
                percentageChange: cat.percentageChange * 1.3
              }))
            })
          });
        }
        return mockFetch(url);
      }) as any;
      
      return (
        <QueryClientProvider client={categoryFocusQueryClient}>
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
        story: 'Dashboard with enhanced category trending data and higher engagement.',
      },
    },
  },
};

export const RealTimeUpdate: Story = {
  decorators: [
    (Story) => {
      const realTimeQueryClient = new QueryClient({
        defaultOptions: {
          queries: {
            retry: false,
            refetchInterval: 30000, // Simulate real-time updates
          },
        },
      });
      
      return (
        <QueryClientProvider client={realTimeQueryClient}>
          <div className="min-h-screen bg-gray-50 p-6">
            <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-800">
                🔴 Live Demo: Data refreshes every 30 seconds to simulate real-time updates
              </p>
            </div>
            <Story />
          </div>
        </QueryClientProvider>
      );
    },
  ],
  parameters: {
    docs: {
      description: {
        story: 'Dashboard with real-time data updates every 30 seconds.',
      },
    },
  },
};