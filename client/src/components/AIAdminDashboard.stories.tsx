import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AIAdminDashboard } from './AIAdminDashboard';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: false },
    mutations: { retry: false },
  },
});

const meta: Meta<typeof AIAdminDashboard> = {
  title: 'Admin/AIAdminDashboard',
  component: AIAdminDashboard,
  decorators: [
    (Story) => (
      <QueryClientProvider client={queryClient}>
        <div className="min-h-screen bg-gray-50">
          <Story />
        </div>
      </QueryClientProvider>
    ),
  ],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Comprehensive admin dashboard for managing AI features, content generation, user feedback, and system analytics.',
      },
    },
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

const mockStats = {
  totalTerms: 12543,
  aiGeneratedTerms: 8921,
  pendingReviews: 234,
  userFeedback: 1847,
  dailyQueries: 45672,
  systemHealth: 98.5,
  apiCalls: {
    today: 15420,
    thisWeek: 89234,
    thisMonth: 367891,
  },
  topCategories: [
    { name: 'Machine Learning', count: 2341, growth: 12.5 },
    { name: 'Deep Learning', count: 1876, growth: 18.2 },
    { name: 'Natural Language Processing', count: 1654, growth: 15.7 },
    { name: 'Computer Vision', count: 1432, growth: 9.3 },
  ],
};

const mockRecentActivity = [
  {
    id: '1',
    type: 'term_generated',
    message: 'AI generated definition for "Quantum Machine Learning"',
    user: 'AI System',
    timestamp: '2024-01-15T10:30:00Z',
    status: 'pending_review',
  },
  {
    id: '2',
    type: 'feedback_received',
    message: 'User reported accuracy issue with "Neural Networks" definition',
    user: 'sarah.chen@example.com',
    timestamp: '2024-01-15T09:45:00Z',
    status: 'investigating',
  },
  {
    id: '3',
    type: 'content_approved',
    message: 'Approved 15 AI-generated definitions after review',
    user: 'admin@example.com',
    timestamp: '2024-01-15T09:15:00Z',
    status: 'completed',
  },
  {
    id: '4',
    type: 'system_alert',
    message: 'AI service response time increased to 2.3s',
    user: 'System Monitor',
    timestamp: '2024-01-15T08:30:00Z',
    status: 'monitoring',
  },
];

const mockPendingReviews = [
  {
    id: '1',
    termName: 'Quantum Machine Learning',
    generatedDefinition:
      'Quantum machine learning combines quantum computing principles with machine learning algorithms...',
    confidence: 0.87,
    flaggedIssues: ['needs_examples', 'technical_accuracy'],
    generatedAt: '2024-01-15T10:30:00Z',
  },
  {
    id: '2',
    termName: 'Federated Learning',
    generatedDefinition:
      'A machine learning technique that trains algorithms across decentralized edge devices...',
    confidence: 0.92,
    flaggedIssues: ['privacy_concerns'],
    generatedAt: '2024-01-15T09:20:00Z',
  },
];

export const Default: Story = {
  args: {
    stats: mockStats,
    recentActivity: mockRecentActivity,
    pendingReviews: mockPendingReviews,
    onReviewTerm: (termId: string) => console.log('Review term:', termId),
    onApproveTerm: (termId: string) => console.log('Approve term:', termId),
    onRejectTerm: (termId: string) => console.log('Reject term:', termId),
  },
};

export const WithHighActivity: Story = {
  args: {
    stats: {
      ...mockStats,
      pendingReviews: 1247,
      userFeedback: 5623,
      dailyQueries: 125780,
      systemHealth: 94.2,
    },
    recentActivity: [
      ...mockRecentActivity,
      {
        id: '5',
        type: 'bulk_generation',
        message: 'Bulk generated 50 definitions for Computer Vision category',
        user: 'AI System',
        timestamp: '2024-01-15T07:45:00Z',
        status: 'completed',
      },
      {
        id: '6',
        type: 'user_report',
        message: 'Multiple users reported outdated information in "Deep Learning" section',
        user: 'Multiple Users',
        timestamp: '2024-01-15T07:30:00Z',
        status: 'urgent',
      },
    ],
    pendingReviews: mockPendingReviews,
    onReviewTerm: (termId: string) => console.log('Review term:', termId),
    onApproveTerm: (termId: string) => console.log('Approve term:', termId),
    onRejectTerm: (termId: string) => console.log('Reject term:', termId),
  },
};

export const AIServiceStatus: Story = {
  args: {
    stats: mockStats,
    recentActivity: mockRecentActivity,
    pendingReviews: mockPendingReviews,
    aiServiceStatus: {
      openai: { status: 'operational', responseTime: 1.2, uptime: 99.9 },
      anthropic: { status: 'degraded', responseTime: 3.4, uptime: 97.8 },
      cohere: { status: 'operational', responseTime: 0.8, uptime: 99.7 },
      huggingface: { status: 'maintenance', responseTime: null, uptime: 95.2 },
    },
    onReviewTerm: (termId: string) => console.log('Review term:', termId),
    onApproveTerm: (termId: string) => console.log('Approve term:', termId),
    onRejectTerm: (termId: string) => console.log('Reject term:', termId),
  },
};

export const ContentModerationQueue: Story = {
  args: {
    stats: mockStats,
    recentActivity: mockRecentActivity,
    pendingReviews: [
      ...mockPendingReviews,
      {
        id: '3',
        termName: 'Explainable AI',
        generatedDefinition:
          'AI systems designed to provide clear explanations for their decisions and processes...',
        confidence: 0.94,
        flaggedIssues: ['bias_check', 'completeness'],
        generatedAt: '2024-01-15T08:45:00Z',
        userFeedback: [
          { rating: 4, comment: 'Good explanation but needs more examples' },
          { rating: 5, comment: 'Very clear and comprehensive' },
        ],
      },
    ],
    moderationQueue: [
      {
        id: '1',
        type: 'user_contribution',
        content: 'User-submitted definition for "Edge AI"',
        submittedBy: 'expert@university.edu',
        priority: 'high',
        submittedAt: '2024-01-15T11:00:00Z',
      },
      {
        id: '2',
        type: 'edit_suggestion',
        content: 'Suggested improvements to "Machine Learning" definition',
        submittedBy: 'researcher@company.com',
        priority: 'medium',
        submittedAt: '2024-01-15T10:15:00Z',
      },
    ],
    onReviewTerm: (termId: string) => console.log('Review term:', termId),
    onApproveTerm: (termId: string) => console.log('Approve term:', termId),
    onRejectTerm: (termId: string) => console.log('Reject term:', termId),
    onModerationAction: (itemId: string, action: string) =>
      console.log('Moderation:', itemId, action),
  },
};

export const AnalyticsView: Story = {
  args: {
    stats: mockStats,
    recentActivity: mockRecentActivity,
    pendingReviews: mockPendingReviews,
    analytics: {
      generationMetrics: {
        successRate: 94.2,
        averageConfidence: 0.87,
        averageGenerationTime: 2.3,
        dailyGenerations: 245,
      },
      userEngagement: {
        definitionViews: 45672,
        userFeedbackRate: 12.3,
        averageRating: 4.2,
        returnUsers: 78.9,
      },
      systemPerformance: {
        apiLatency: 1.8,
        errorRate: 0.02,
        cacheHitRate: 89.4,
        activeUsers: 2341,
      },
    },
    onReviewTerm: (termId: string) => console.log('Review term:', termId),
    onApproveTerm: (termId: string) => console.log('Approve term:', termId),
    onRejectTerm: (termId: string) => console.log('Reject term:', termId),
  },
};

export const BulkOperations: Story = {
  args: {
    stats: mockStats,
    recentActivity: mockRecentActivity,
    pendingReviews: mockPendingReviews,
    bulkOperations: {
      inProgress: [
        {
          id: '1',
          type: 'bulk_generation',
          category: 'Reinforcement Learning',
          progress: 67,
          totalItems: 150,
          completedItems: 100,
          startedAt: '2024-01-15T09:30:00Z',
          estimatedCompletion: '2024-01-15T12:00:00Z',
        },
      ],
      recent: [
        {
          id: '2',
          type: 'bulk_review',
          category: 'Computer Vision',
          status: 'completed',
          totalItems: 89,
          completedAt: '2024-01-15T08:45:00Z',
          results: { approved: 82, rejected: 7 },
        },
      ],
    },
    onReviewTerm: (termId: string) => console.log('Review term:', termId),
    onApproveTerm: (termId: string) => console.log('Approve term:', termId),
    onRejectTerm: (termId: string) => console.log('Reject term:', termId),
    onStartBulkOperation: (type: string, params: any) => console.log('Start bulk:', type, params),
  },
};

export const UserFeedbackAnalysis: Story = {
  args: {
    stats: mockStats,
    recentActivity: mockRecentActivity,
    pendingReviews: mockPendingReviews,
    feedbackAnalysis: {
      sentiment: {
        positive: 67.8,
        neutral: 24.1,
        negative: 8.1,
      },
      commonIssues: [
        { issue: 'Needs more examples', count: 234, trend: 'increasing' },
        { issue: 'Too technical', count: 189, trend: 'stable' },
        { issue: 'Outdated information', count: 156, trend: 'decreasing' },
        { issue: 'Missing context', count: 142, trend: 'increasing' },
      ],
      topRatedDefinitions: [
        { term: 'Neural Networks', rating: 4.8, votes: 2341 },
        { term: 'Machine Learning', rating: 4.7, votes: 1876 },
        { term: 'Deep Learning', rating: 4.6, votes: 1654 },
      ],
    },
    onReviewTerm: (termId: string) => console.log('Review term:', termId),
    onApproveTerm: (termId: string) => console.log('Approve term:', termId),
    onRejectTerm: (termId: string) => console.log('Reject term:', termId),
  },
};

export const EmptyState: Story = {
  args: {
    stats: {
      ...mockStats,
      pendingReviews: 0,
      userFeedback: 0,
    },
    recentActivity: [],
    pendingReviews: [],
    onReviewTerm: (termId: string) => console.log('Review term:', termId),
    onApproveTerm: (termId: string) => console.log('Approve term:', termId),
    onRejectTerm: (termId: string) => console.log('Reject term:', termId),
  },
};

export const LoadingState: Story = {
  args: {
    loading: true,
    onReviewTerm: (termId: string) => console.log('Review term:', termId),
    onApproveTerm: (termId: string) => console.log('Approve term:', termId),
    onRejectTerm: (termId: string) => console.log('Reject term:', termId),
  },
};

export const ErrorState: Story = {
  args: {
    error: 'Failed to load dashboard data. Please refresh and try again.',
    onRetry: () => console.log('Retry loading dashboard'),
    onReviewTerm: (termId: string) => console.log('Review term:', termId),
    onApproveTerm: (termId: string) => console.log('Approve term:', termId),
    onRejectTerm: (termId: string) => console.log('Reject term:', termId),
  },
};

export const DarkMode: Story = {
  args: {
    stats: mockStats,
    recentActivity: mockRecentActivity,
    pendingReviews: mockPendingReviews,
    onReviewTerm: (termId: string) => console.log('Review term:', termId),
    onApproveTerm: (termId: string) => console.log('Approve term:', termId),
    onRejectTerm: (termId: string) => console.log('Reject term:', termId),
  },
  parameters: {
    themes: {
      default: 'dark',
    },
  },
};
