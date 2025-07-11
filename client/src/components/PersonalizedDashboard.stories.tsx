import type { Meta, StoryObj } from '@storybook/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import PersonalizedDashboard from './PersonalizedDashboard';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
    },
  },
});

const meta: Meta<typeof PersonalizedDashboard> = {
  title: 'Core/PersonalizedDashboard',
  component: PersonalizedDashboard,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: 'AI-powered adaptive dashboard with personalized content recommendations, learning paths, and user insights.',
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
type Story = StoryObj<typeof PersonalizedDashboard>;

// Mock personalized data
const mockPersonalizedData = {
  userProfile: {
    userId: 'user-123',
    interests: [
      { categoryId: '1', categoryName: 'Machine Learning', interestScore: 95, timeSpent: 3600, recentActivity: 120 },
      { categoryId: '2', categoryName: 'Deep Learning', interestScore: 88, timeSpent: 2400, recentActivity: 90 },
      { categoryId: '3', categoryName: 'Natural Language Processing', interestScore: 75, timeSpent: 1800, recentActivity: 60 },
      { categoryId: '4', categoryName: 'Computer Vision', interestScore: 62, timeSpent: 1200, recentActivity: 45 },
      { categoryId: '5', categoryName: 'Reinforcement Learning', interestScore: 58, timeSpent: 900, recentActivity: 30 }
    ],
    skillLevel: 'intermediate' as const,
    learningStyle: 'practical' as const,
    activityLevel: 'high' as const,
    preferredContentTypes: ['examples', 'tutorials', 'code'],
    recentTopics: ['Transformers', 'BERT', 'GPT', 'Attention Mechanism', 'Transfer Learning'],
    engagementScore: 87,
    lastUpdated: '2024-01-20T10:30:00Z'
  },
  recommendations: [
    {
      type: 'term' as const,
      id: 'term-1',
      title: 'Transformer Architecture',
      description: 'Deep dive into the architecture that revolutionized NLP',
      relevanceScore: 94,
      reason: 'Based on your interest in attention mechanisms',
      metadata: { category: 'Deep Learning', difficulty: 'Advanced' }
    },
    {
      type: 'learning_path' as const,
      id: 'path-1',
      title: 'Advanced NLP Techniques',
      description: 'Master modern natural language processing methods',
      relevanceScore: 89,
      reason: 'Follows your current learning progression',
      metadata: { duration: '4 weeks', lessons: 12 }
    },
    {
      type: 'category' as const,
      id: 'cat-1',
      title: 'Generative AI',
      description: 'Explore the latest in AI content generation',
      relevanceScore: 82,
      reason: 'Trending topic in your field',
      metadata: { terms: 156, trending: true }
    }
  ],
  personalizedSections: {
    recentActivity: [
      { termId: 'term-1', termName: 'BERT', timestamp: '2024-01-20T09:30:00Z', duration: 480 },
      { termId: 'term-2', termName: 'Attention Mechanism', timestamp: '2024-01-19T16:15:00Z', duration: 360 },
      { termId: 'term-3', termName: 'Transfer Learning', timestamp: '2024-01-19T14:45:00Z', duration: 420 }
    ],
    recommendedForYou: [
      {
        type: 'term' as const,
        id: 'term-4',
        title: 'GPT Architecture',
        description: 'Understanding Generative Pre-trained Transformers',
        relevanceScore: 91,
        reason: 'Based on your BERT studies',
        metadata: { category: 'NLP', difficulty: 'Advanced' }
      },
      {
        type: 'term' as const,
        id: 'term-5',
        title: 'Vision Transformer',
        description: 'Applying transformer architecture to computer vision',
        relevanceScore: 86,
        reason: 'Expanding your transformer knowledge',
        metadata: { category: 'Computer Vision', difficulty: 'Advanced' }
      },
      {
        type: 'learning_path' as const,
        id: 'path-2',
        title: 'Modern Deep Learning',
        description: 'Latest architectures and techniques in deep learning',
        relevanceScore: 88,
        reason: 'Perfect for your intermediate level',
        metadata: { duration: '6 weeks', lessons: 18 }
      }
    ],
    continuelearning: [
      {
        pathId: 'path-1',
        pathName: 'Natural Language Processing Fundamentals',
        completionPercentage: 65,
        lastAccessed: '2024-01-19T20:30:00Z',
        nextLesson: 'Named Entity Recognition'
      },
      {
        pathId: 'path-2',
        pathName: 'Deep Learning Specialization',
        completionPercentage: 23,
        lastAccessed: '2024-01-18T14:15:00Z',
        nextLesson: 'Convolutional Neural Networks'
      }
    ],
    exploreNew: [
      {
        type: 'category' as const,
        id: 'cat-2',
        title: 'Quantum Machine Learning',
        description: 'Intersection of quantum computing and ML',
        relevanceScore: 73,
        reason: 'New emerging field',
        metadata: { terms: 45, newCategory: true }
      },
      {
        type: 'term' as const,
        id: 'term-6',
        title: 'Federated Learning',
        description: 'Distributed machine learning approach',
        relevanceScore: 69,
        reason: 'Outside your usual focus',
        metadata: { category: 'Distributed ML', difficulty: 'Intermediate' }
      }
    ],
    trending: [
      {
        type: 'term' as const,
        id: 'term-7',
        title: 'Large Language Models',
        description: 'Latest developments in LLMs',
        relevanceScore: 95,
        reason: 'Trending in AI community',
        metadata: { category: 'NLP', views: 2450, growth: '+45%' }
      }
    ]
  },
  adaptiveNavigation: {
    priorityCategories: ['Machine Learning', 'Deep Learning', 'Natural Language Processing'],
    suggestedPaths: ['Advanced NLP', 'Modern Deep Learning', 'AI Ethics'],
    recentTopics: ['Transformers', 'BERT', 'GPT', 'Attention Mechanism']
  }
};

// Mock fetch for Storybook
const mockFetch = (url: string) => {
  if (url.includes('/api/personalized/homepage')) {
    return Promise.resolve({
      ok: true,
      json: () => Promise.resolve({
        data: mockPersonalizedData
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
        story: 'Default personalized dashboard with user profile, recommendations, and learning paths.',
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
        story: 'Loading state while fetching personalized data.',
      },
    },
  },
};

export const BeginnerUser: Story = {
  decorators: [
    (Story) => {
      const beginnerQueryClient = new QueryClient({
        defaultOptions: {
          queries: {
            retry: false,
          },
        },
      });
      
      // Mock beginner user data
      global.fetch = ((url: string) => {
        if (url.includes('/api/personalized/homepage')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({
              data: {
                ...mockPersonalizedData,
                userProfile: {
                  ...mockPersonalizedData.userProfile,
                  skillLevel: 'beginner',
                  learningStyle: 'visual',
                  activityLevel: 'moderate',
                  engagementScore: 45,
                  interests: [
                    { categoryId: '1', categoryName: 'Machine Learning Basics', interestScore: 78, timeSpent: 1200, recentActivity: 60 },
                    { categoryId: '2', categoryName: 'Python for AI', interestScore: 65, timeSpent: 900, recentActivity: 45 },
                    { categoryId: '3', categoryName: 'Statistics', interestScore: 52, timeSpent: 600, recentActivity: 30 }
                  ],
                  recentTopics: ['Linear Regression', 'Decision Trees', 'Data Preprocessing']
                }
              }
            })
          });
        }
        return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
      }) as any;
      
      return (
        <QueryClientProvider client={beginnerQueryClient}>
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
        story: 'Personalized dashboard for a beginner user with basic topics and foundational content.',
      },
    },
  },
};

export const ExpertUser: Story = {
  decorators: [
    (Story) => {
      const expertQueryClient = new QueryClient({
        defaultOptions: {
          queries: {
            retry: false,
          },
        },
      });
      
      // Mock expert user data
      global.fetch = ((url: string) => {
        if (url.includes('/api/personalized/homepage')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({
              data: {
                ...mockPersonalizedData,
                userProfile: {
                  ...mockPersonalizedData.userProfile,
                  skillLevel: 'expert',
                  learningStyle: 'theoretical',
                  activityLevel: 'high',
                  engagementScore: 96,
                  interests: [
                    { categoryId: '1', categoryName: 'Advanced Neural Architectures', interestScore: 98, timeSpent: 4800, recentActivity: 180 },
                    { categoryId: '2', categoryName: 'Quantum ML', interestScore: 92, timeSpent: 3600, recentActivity: 150 },
                    { categoryId: '3', categoryName: 'Meta Learning', interestScore: 89, timeSpent: 3200, recentActivity: 120 }
                  ],
                  recentTopics: ['Neural Architecture Search', 'Few-Shot Learning', 'Causal Inference', 'Differential Privacy']
                }
              }
            })
          });
        }
        return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
      }) as any;
      
      return (
        <QueryClientProvider client={expertQueryClient}>
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
        story: 'Personalized dashboard for an expert user with advanced topics and cutting-edge research.',
      },
    },
  },
};

export const NoData: Story = {
  decorators: [
    (Story) => {
      const noDataQueryClient = new QueryClient({
        defaultOptions: {
          queries: {
            retry: false,
          },
        },
      });
      
      // Mock no data response
      global.fetch = ((url: string) => {
        if (url.includes('/api/personalized/homepage')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({
              data: null
            })
          });
        }
        return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
      }) as any;
      
      return (
        <QueryClientProvider client={noDataQueryClient}>
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
        story: 'Dashboard state when no personalized data is available.',
      },
    },
  },
};

export const HighEngagement: Story = {
  decorators: [
    (Story) => {
      const highEngagementQueryClient = new QueryClient({
        defaultOptions: {
          queries: {
            retry: false,
          },
        },
      });
      
      // Mock high engagement data
      global.fetch = ((url: string) => {
        if (url.includes('/api/personalized/homepage')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({
              data: {
                ...mockPersonalizedData,
                userProfile: {
                  ...mockPersonalizedData.userProfile,
                  engagementScore: 98,
                  activityLevel: 'high',
                  interests: mockPersonalizedData.userProfile.interests.map(interest => ({
                    ...interest,
                    interestScore: Math.min(100, interest.interestScore + 15),
                    timeSpent: interest.timeSpent * 2,
                    recentActivity: interest.recentActivity * 1.5
                  }))
                }
              }
            })
          });
        }
        return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
      }) as any;
      
      return (
        <QueryClientProvider client={highEngagementQueryClient}>
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
        story: 'Dashboard for a highly engaged user with strong activity patterns and interests.',
      },
    },
  },
};