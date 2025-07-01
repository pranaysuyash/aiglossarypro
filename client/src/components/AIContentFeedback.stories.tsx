import type { Meta, StoryObj } from '@storybook/react';
import { AIContentFeedback } from './AIContentFeedback';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
    },
  },
});

const meta: Meta<typeof AIContentFeedback> = {
  title: 'AI Components/AIContentFeedback',
  component: AIContentFeedback,
  decorators: [
    (Story) => (
      <QueryClientProvider client={queryClient}>
        <div className="max-w-4xl mx-auto p-6">
          <Story />
        </div>
      </QueryClientProvider>
    ),
  ],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: 'AI-powered feedback system that analyzes content quality, accuracy, and provides improvement suggestions.',
      },
    },
  },
  argTypes: {
    onFeedbackSubmit: { action: 'feedback submitted' },
    onImprovementApply: { action: 'improvement applied' },
    contentType: {
      control: { type: 'select' },
      options: ['definition', 'example', 'explanation', 'code'],
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    contentId: 'term-123',
    contentType: 'definition',
    content: 'Machine learning is a subset of artificial intelligence that enables computers to learn and make decisions without being explicitly programmed.',
  },
};

export const WithAnalysis: Story = {
  args: {
    contentId: 'term-456',
    contentType: 'definition',
    content: 'Neural networks are computing systems inspired by biological neural networks.',
    analysis: {
      accuracyScore: 0.85,
      clarityScore: 0.72,
      completenessScore: 0.68,
      technicalLevel: 'beginner',
      suggestions: [
        {
          type: 'clarity',
          priority: 'high',
          issue: 'Definition is too brief and lacks technical detail',
          suggestion: 'Consider adding information about layers, weights, and activation functions',
          confidence: 0.91,
        },
        {
          type: 'accuracy',
          priority: 'medium',
          issue: 'Could be more specific about the inspiration from biological systems',
          suggestion: 'Mention neurons, synapses, and signal processing similarities',
          confidence: 0.78,
        },
        {
          type: 'completeness',
          priority: 'medium',
          issue: 'Missing information about common applications',
          suggestion: 'Add examples like image recognition, natural language processing',
          confidence: 0.82,
        },
      ],
      overallScore: 0.75,
    },
  },
};

export const CodeFeedback: Story = {
  args: {
    contentId: 'code-example-789',
    contentType: 'code',
    content: `def neural_network(x):
    w = 0.5
    return x * w`,
    analysis: {
      accuracyScore: 0.45,
      clarityScore: 0.38,
      completenessScore: 0.22,
      technicalLevel: 'beginner',
      suggestions: [
        {
          type: 'accuracy',
          priority: 'high',
          issue: 'This is not a complete neural network implementation',
          suggestion: 'Add layers, activation functions, and bias terms',
          confidence: 0.95,
        },
        {
          type: 'clarity',
          priority: 'high',
          issue: 'Variable names are not descriptive',
          suggestion: 'Use meaningful names like "weights" instead of "w"',
          confidence: 0.88,
        },
        {
          type: 'completeness',
          priority: 'high',
          issue: 'Missing essential neural network components',
          suggestion: 'Include forward propagation, activation function, and multiple layers',
          confidence: 0.92,
        },
      ],
      overallScore: 0.35,
    },
  },
};

export const HighQualityContent: Story = {
  args: {
    contentId: 'term-excellent',
    contentType: 'definition',
    content: 'A Convolutional Neural Network (CNN) is a specialized deep learning architecture designed for processing grid-like data such as images. CNNs utilize convolutional layers with learnable filters to detect local features, pooling layers to reduce spatial dimensions while preserving important information, and fully connected layers for final classification or regression tasks.',
    analysis: {
      accuracyScore: 0.94,
      clarityScore: 0.91,
      completenessScore: 0.88,
      technicalLevel: 'intermediate',
      suggestions: [
        {
          type: 'enhancement',
          priority: 'low',
          issue: 'Could benefit from a specific example',
          suggestion: 'Consider adding a brief example like "commonly used in image classification tasks"',
          confidence: 0.65,
        },
      ],
      overallScore: 0.91,
    },
  },
};

export const Loading: Story = {
  args: {
    contentId: 'term-loading',
    contentType: 'definition',
    content: 'Machine learning algorithms...',
    isAnalyzing: true,
  },
};

export const WithError: Story = {
  args: {
    contentId: 'term-error',
    contentType: 'definition',
    content: 'Some content here...',
    error: 'Failed to analyze content. AI service is temporarily unavailable.',
  },
};

export const UserFeedback: Story = {
  args: {
    contentId: 'term-feedback',
    contentType: 'definition',
    content: 'Deep learning is a subset of machine learning...',
    showUserFeedback: true,
    userFeedback: {
      helpful: 89,
      notHelpful: 12,
      comments: [
        {
          id: '1',
          text: 'Very clear explanation, helped me understand the concept',
          helpful: true,
          timestamp: '2024-01-15T10:30:00Z',
        },
        {
          id: '2',
          text: 'Could use more examples',
          helpful: false,
          timestamp: '2024-01-14T15:20:00Z',
        },
      ],
    },
  },
};

export const CompactMode: Story = {
  args: {
    contentId: 'term-compact',
    contentType: 'definition',
    content: 'Brief definition here...',
    variant: 'compact',
  },
  decorators: [
    (Story) => (
      <QueryClientProvider client={queryClient}>
        <div className="max-w-2xl mx-auto p-4">
          <Story />
        </div>
      </QueryClientProvider>
    ),
  ],
};

export const AdminView: Story = {
  args: {
    contentId: 'term-admin',
    contentType: 'definition',
    content: 'Machine learning definition...',
    showAdminActions: true,
    adminMetrics: {
      views: 1247,
      likes: 89,
      shares: 23,
      lastUpdated: '2024-01-10T14:30:00Z',
      contributor: 'Dr. Sarah Johnson',
    },
  },
};

export const DarkMode: Story = {
  args: {
    contentId: 'term-dark',
    contentType: 'definition',
    content: 'Artificial Intelligence definition...',
  },
  decorators: [
    (Story) => (
      <QueryClientProvider client={queryClient}>
        <div className="dark bg-gray-900 min-h-screen p-6">
          <div className="max-w-4xl mx-auto">
            <Story />
          </div>
        </div>
      </QueryClientProvider>
    ),
  ],
};
