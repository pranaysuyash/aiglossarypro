import type { Meta, StoryObj } from '@storybook/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AIContentMonitor } from './AIContentMonitor';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
    },
  },
});

const meta: Meta<typeof AIContentMonitor> = {
  title: 'Admin/AIContentMonitor',
  component: AIContentMonitor,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: 'AI content monitoring dashboard for tracking content quality, user feedback, system performance, and content verification.',
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
type Story = StoryObj<typeof AIContentMonitor>;

// Mock fetch for Storybook
const mockFetch = (url: string) => {
  if (url.includes('/api/ai/feedback')) {
    return Promise.resolve({
      ok: true,
      json: () => Promise.resolve({
        data: [
          {
            id: '1',
            termId: 'term-1',
            termName: 'Machine Learning',
            userId: 'user-1',
            userEmail: 'user1@example.com',
            section: 'definition_overview',
            feedbackType: 'accuracy',
            description: 'The definition seems incomplete and could benefit from more technical detail.',
            severity: 'medium',
            status: 'pending',
            createdAt: '2024-01-20T10:30:00Z',
            updatedAt: '2024-01-20T10:30:00Z'
          },
          {
            id: '2',
            termId: 'term-2',
            termName: 'Deep Learning',
            userId: 'user-2',
            userEmail: 'user2@example.com',
            section: 'key_characteristics',
            feedbackType: 'clarity',
            description: 'The explanation is too complex for beginners. Could use simpler language.',
            severity: 'low',
            status: 'reviewed',
            createdAt: '2024-01-19T14:15:00Z',
            updatedAt: '2024-01-19T16:30:00Z'
          },
          {
            id: '3',
            termId: 'term-3',
            termName: 'Neural Networks',
            userId: 'user-3',
            userEmail: 'user3@example.com',
            section: 'applications',
            feedbackType: 'completeness',
            description: 'Missing important applications like medical imaging and drug discovery.',
            severity: 'high',
            status: 'pending',
            createdAt: '2024-01-18T09:45:00Z',
            updatedAt: '2024-01-18T09:45:00Z'
          },
          {
            id: '4',
            termId: 'term-4',
            termName: 'Reinforcement Learning',
            userId: 'user-4',
            userEmail: 'user4@example.com',
            section: 'math_formulation',
            feedbackType: 'accuracy',
            description: 'The mathematical formulation contains errors in the Q-learning equation.',
            severity: 'critical',
            status: 'resolved',
            createdAt: '2024-01-17T11:20:00Z',
            updatedAt: '2024-01-17T15:45:00Z'
          }
        ]
      })
    });
  }
  
  if (url.includes('/api/ai/verification')) {
    return Promise.resolve({
      ok: true,
      json: () => Promise.resolve({
        data: {
          stats: {
            total: 10372,
            verified: 8945,
            unverified: 1127,
            flagged: 300
          },
          recentUnverified: [
            {
              id: '1',
              termId: 'term-1',
              termName: 'Transformer Architecture',
              verificationStatus: 'unverified',
              accuracyScore: 85,
              createdAt: '2024-01-20T10:30:00Z'
            },
            {
              id: '2',
              termId: 'term-2',
              termName: 'BERT Model',
              verificationStatus: 'unverified',
              accuracyScore: 78,
              createdAt: '2024-01-19T14:15:00Z'
            },
            {
              id: '3',
              termId: 'term-3',
              termName: 'GPT Architecture',
              verificationStatus: 'flagged',
              accuracyScore: 65,
              createdAt: '2024-01-18T09:45:00Z'
            }
          ]
        }
      })
    });
  }
  
  if (url.includes('/api/ai/analytics')) {
    return Promise.resolve({
      ok: true,
      json: () => Promise.resolve({
        data: {
          summary: {
            totalRequests: 15647,
            totalCost: 234.56,
            averageLatency: 1250,
            successRate: 97.8,
            totalInputTokens: 2456789,
            totalOutputTokens: 1234567
          },
          byOperation: {
            'generate_definition': {
              count: 5234,
              totalCost: 123.45,
              avgLatency: 1400
            },
            'improve_definition': {
              count: 3456,
              totalCost: 67.89,
              avgLatency: 1100
            },
            'quality_check': {
              count: 2345,
              totalCost: 23.45,
              avgLatency: 800
            },
            'content_verification': {
              count: 4612,
              totalCost: 19.77,
              avgLatency: 600
            }
          },
          byModel: {
            'gpt-4': {
              count: 4567,
              totalCost: 156.78,
              avgLatency: 1800
            },
            'gpt-3.5-turbo': {
              count: 8934,
              totalCost: 65.43,
              avgLatency: 900
            },
            'claude-3-sonnet': {
              count: 2146,
              totalCost: 12.35,
              avgLatency: 1200
            }
          },
          timeline: [
            { date: '2024-01-14', requests: 1234, cost: 23.45, errors: 12 },
            { date: '2024-01-15', requests: 1456, cost: 34.56, errors: 8 },
            { date: '2024-01-16', requests: 1678, cost: 45.67, errors: 15 },
            { date: '2024-01-17', requests: 1890, cost: 56.78, errors: 6 },
            { date: '2024-01-18', requests: 2012, cost: 67.89, errors: 9 },
            { date: '2024-01-19', requests: 2234, cost: 78.90, errors: 4 },
            { date: '2024-01-20', requests: 2456, cost: 89.01, errors: 11 }
          ]
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
        story: 'Default view of the AIContentMonitor showing overview metrics and recent activity.',
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
        story: 'Loading state while fetching AI monitoring data.',
      },
    },
  },
};

export const HighPendingFeedback: Story = {
  decorators: [
    (Story) => {
      const highFeedbackQueryClient = new QueryClient({
        defaultOptions: {
          queries: {
            retry: false,
          },
        },
      });
      
      // Mock high pending feedback response
      global.fetch = ((url: string) => {
        if (url.includes('/api/ai/feedback')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({
              data: Array.from({ length: 15 }, (_, i) => ({
                id: `feedback-${i + 1}`,
                termId: `term-${i + 1}`,
                termName: `AI Term ${i + 1}`,
                userId: `user-${i + 1}`,
                userEmail: `user${i + 1}@example.com`,
                section: ['definition_overview', 'key_characteristics', 'applications'][i % 3],
                feedbackType: ['accuracy', 'clarity', 'completeness', 'relevance'][i % 4],
                description: `Feedback description for term ${i + 1}`,
                severity: ['low', 'medium', 'high', 'critical'][i % 4],
                status: 'pending',
                createdAt: new Date(Date.now() - i * 3600000).toISOString(),
                updatedAt: new Date(Date.now() - i * 3600000).toISOString()
              }))
            })
          });
        }
        return mockFetch(url);
      }) as any;
      
      return (
        <QueryClientProvider client={highFeedbackQueryClient}>
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
        story: 'AIContentMonitor with high number of pending feedback items requiring attention.',
      },
    },
  },
};

export const CriticalIssues: Story = {
  decorators: [
    (Story) => {
      const criticalIssuesQueryClient = new QueryClient({
        defaultOptions: {
          queries: {
            retry: false,
          },
        },
      });
      
      // Mock critical issues response
      global.fetch = ((url: string) => {
        if (url.includes('/api/ai/feedback')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({
              data: [
                {
                  id: '1',
                  termId: 'term-1',
                  termName: 'Machine Learning',
                  userId: 'user-1',
                  userEmail: 'expert@ml.com',
                  section: 'definition_overview',
                  feedbackType: 'accuracy',
                  description: 'Critical error in the fundamental definition. This could mislead users.',
                  severity: 'critical',
                  status: 'pending',
                  createdAt: '2024-01-20T10:30:00Z',
                  updatedAt: '2024-01-20T10:30:00Z'
                },
                {
                  id: '2',
                  termId: 'term-2',
                  termName: 'Deep Learning',
                  userId: 'user-2',
                  userEmail: 'researcher@ai.org',
                  section: 'math_formulation',
                  feedbackType: 'accuracy',
                  description: 'Mathematical formula is completely wrong and needs immediate correction.',
                  severity: 'critical',
                  status: 'pending',
                  createdAt: '2024-01-19T14:15:00Z',
                  updatedAt: '2024-01-19T14:15:00Z'
                }
              ]
            })
          });
        }
        return mockFetch(url);
      }) as any;
      
      return (
        <QueryClientProvider client={criticalIssuesQueryClient}>
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
        story: 'AIContentMonitor showing critical issues that need immediate attention.',
      },
    },
  },
};

export const HighPerformance: Story = {
  decorators: [
    (Story) => {
      const highPerformanceQueryClient = new QueryClient({
        defaultOptions: {
          queries: {
            retry: false,
          },
        },
      });
      
      // Mock high performance response
      global.fetch = ((url: string) => {
        if (url.includes('/api/ai/analytics')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({
              data: {
                summary: {
                  totalRequests: 50000,
                  totalCost: 890.12,
                  averageLatency: 650,
                  successRate: 99.5,
                  totalInputTokens: 8500000,
                  totalOutputTokens: 4250000
                },
                byOperation: {
                  'generate_definition': {
                    count: 15000,
                    totalCost: 456.78,
                    avgLatency: 750
                  },
                  'improve_definition': {
                    count: 12000,
                    totalCost: 234.56,
                    avgLatency: 600
                  },
                  'quality_check': {
                    count: 18000,
                    totalCost: 123.45,
                    avgLatency: 400
                  },
                  'content_verification': {
                    count: 5000,
                    totalCost: 75.33,
                    avgLatency: 300
                  }
                },
                byModel: {
                  'gpt-4': {
                    count: 20000,
                    totalCost: 567.89,
                    avgLatency: 800
                  },
                  'gpt-3.5-turbo': {
                    count: 25000,
                    totalCost: 234.56,
                    avgLatency: 500
                  },
                  'claude-3-sonnet': {
                    count: 5000,
                    totalCost: 87.67,
                    avgLatency: 650
                  }
                }
              }
            })
          });
        }
        return mockFetch(url);
      }) as any;
      
      return (
        <QueryClientProvider client={highPerformanceQueryClient}>
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
        story: 'AIContentMonitor showing high performance metrics with excellent success rates.',
      },
    },
  },
};