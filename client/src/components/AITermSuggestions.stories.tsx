import type { Meta, StoryObj } from '@storybook/react';
import { AITermSuggestions } from './AITermSuggestions';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: false },
    mutations: { retry: false },
  },
});

const meta: Meta<typeof AITermSuggestions> = {
  title: 'AI/AITermSuggestions',
  component: AITermSuggestions,
  decorators: [
    (Story) => (
      <QueryClientProvider client={queryClient}>
        <div className="max-w-4xl mx-auto p-4">
          <Story />
        </div>
      </QueryClientProvider>
    ),
  ],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: 'AI-powered component that suggests related terms and concepts based on current content or user behavior.',
      },
    },
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

const mockSuggestions = [
  {
    id: '1',
    term: 'Deep Learning',
    relevanceScore: 0.95,
    category: 'Machine Learning',
    reason: 'Frequently viewed together with Neural Networks',
    definition: 'A subset of machine learning using neural networks with multiple layers',
    tags: ['popular', 'trending'],
  },
  {
    id: '2',
    term: 'Backpropagation',
    relevanceScore: 0.89,
    category: 'Algorithms',
    reason: 'Essential algorithm for training neural networks',
    definition: 'Algorithm for training neural networks by calculating gradients',
    tags: ['technical'],
  },
  {
    id: '3',
    term: 'Gradient Descent',
    relevanceScore: 0.87,
    category: 'Optimization',
    reason: 'Core optimization technique in machine learning',
    definition: 'Optimization algorithm to minimize cost functions',
    tags: ['fundamental'],
  },
  {
    id: '4',
    term: 'Convolutional Neural Networks',
    relevanceScore: 0.82,
    category: 'Computer Vision',
    reason: 'Specialized neural network architecture',
    definition: 'Neural networks designed for processing grid-like data such as images',
    tags: ['specialized'],
  },
  {
    id: '5',
    term: 'Transfer Learning',
    relevanceScore: 0.78,
    category: 'Machine Learning',
    reason: 'Advanced technique using pre-trained models',
    definition: 'Technique of using pre-trained models for new tasks',
    tags: ['advanced'],
  },
];

export const Default: Story = {
  args: {
    currentTerm: 'Neural Networks',
    onTermSelect: (termId: string) => console.log('Selected term:', termId),
  },
};

export const WithContext: Story = {
  args: {
    currentTerm: 'Neural Networks',
    context: {
      userLevel: 'intermediate',
      recentTerms: ['Machine Learning', 'Supervised Learning', 'Classification'],
      currentCategory: 'Deep Learning',
    },
    onTermSelect: (termId: string) => console.log('Selected term:', termId),
  },
};

export const LoadingState: Story = {
  args: {
    currentTerm: 'Natural Language Processing',
    onTermSelect: (termId: string) => console.log('Selected term:', termId),
  },
  parameters: {
    mockData: [
      {
        url: '/api/ai/term-suggestions',
        method: 'GET',
        status: 200,
        response: { loading: true },
        delay: 2000,
      },
    ],
  },
};

export const WithSuggestions: Story = {
  args: {
    currentTerm: 'Neural Networks',
    onTermSelect: (termId: string) => console.log('Selected term:', termId),
  },
  parameters: {
    mockData: [
      {
        url: '/api/ai/term-suggestions',
        method: 'GET',
        status: 200,
        response: {
          suggestions: mockSuggestions,
          totalCount: 5,
          categories: ['Machine Learning', 'Algorithms', 'Optimization', 'Computer Vision'],
        },
      },
    ],
  },
};

export const CategorizedSuggestions: Story = {
  args: {
    currentTerm: 'Machine Learning',
    showCategories: true,
    onTermSelect: (termId: string) => console.log('Selected term:', termId),
  },
  parameters: {
    mockData: [
      {
        url: '/api/ai/term-suggestions',
        method: 'GET',
        status: 200,
        response: {
          suggestionsByCategory: {
            'Algorithms': [
              {
                id: '1',
                term: 'Random Forest',
                relevanceScore: 0.91,
                definition: 'Ensemble learning method using multiple decision trees',
                tags: ['popular'],
              },
              {
                id: '2',
                term: 'Support Vector Machine',
                relevanceScore: 0.88,
                definition: 'Supervised learning model for classification and regression',
                tags: ['classic'],
              },
            ],
            'Deep Learning': [
              {
                id: '3',
                term: 'Transformer',
                relevanceScore: 0.94,
                definition: 'Neural network architecture based on attention mechanisms',
                tags: ['trending', 'advanced'],
              },
              {
                id: '4',
                term: 'LSTM',
                relevanceScore: 0.86,
                definition: 'Long Short-Term Memory networks for sequence processing',
                tags: ['specialized'],
              },
            ],
            'Statistics': [
              {
                id: '5',
                term: 'Bayesian Inference',
                relevanceScore: 0.83,
                definition: 'Statistical method for updating probability based on evidence',
                tags: ['fundamental'],
              },
            ],
          },
        },
      },
    ],
  },
};

export const PersonalizedSuggestions: Story = {
  args: {
    currentTerm: 'Computer Vision',
    personalized: true,
    userProfile: {
      level: 'advanced',
      interests: ['deep learning', 'image processing', 'medical AI'],
      completedTerms: ['CNN', 'Image Classification', 'Object Detection'],
    },
    onTermSelect: (termId: string) => console.log('Selected term:', termId),
  },
  parameters: {
    mockData: [
      {
        url: '/api/ai/term-suggestions',
        method: 'GET',
        status: 200,
        response: {
          suggestions: [
            {
              id: '1',
              term: 'Medical Image Segmentation',
              relevanceScore: 0.96,
              category: 'Medical AI',
              reason: 'Matches your interest in medical AI and computer vision',
              definition: 'Technique for identifying and delineating anatomical structures in medical images',
              tags: ['personalized', 'advanced'],
              personalizedReason: 'Based on your interest in medical AI',
            },
            {
              id: '2',
              term: 'GANs for Image Generation',
              relevanceScore: 0.93,
              category: 'Generative Models',
              reason: 'Advanced topic building on your computer vision knowledge',
              definition: 'Generative Adversarial Networks for creating realistic images',
              tags: ['advanced', 'trending'],
              personalizedReason: 'Recommended for advanced learners',
            },
          ],
        },
      },
    ],
  },
};

export const TrendingSuggestions: Story = {
  args: {
    currentTerm: 'Artificial Intelligence',
    showTrending: true,
    onTermSelect: (termId: string) => console.log('Selected term:', termId),
  },
  parameters: {
    mockData: [
      {
        url: '/api/ai/term-suggestions',
        method: 'GET',
        status: 200,
        response: {
          trendingSuggestions: [
            {
              id: '1',
              term: 'Large Language Models',
              relevanceScore: 0.98,
              category: 'NLP',
              trendScore: 0.95,
              definition: 'AI models trained on vast amounts of text data',
              tags: ['trending', 'hot'],
              weeklyGrowth: 234,
            },
            {
              id: '2',
              term: 'Prompt Engineering',
              relevanceScore: 0.89,
              category: 'AI Applications',
              trendScore: 0.92,
              definition: 'Art of crafting effective prompts for AI models',
              tags: ['trending', 'practical'],
              weeklyGrowth: 156,
            },
          ],
        },
      },
    ],
  },
};

export const WithInteractiveFilters: Story = {
  args: {
    currentTerm: 'Data Science',
    showFilters: true,
    availableFilters: {
      difficulty: ['beginner', 'intermediate', 'advanced'],
      category: ['Statistics', 'Programming', 'Visualization', 'Ethics'],
      type: ['algorithm', 'concept', 'tool', 'method'],
    },
    onTermSelect: (termId: string) => console.log('Selected term:', termId),
    onFilterChange: (filters: any) => console.log('Filters changed:', filters),
  },
};

export const EmptyState: Story = {
  args: {
    currentTerm: 'Obscure Technical Term',
    onTermSelect: (termId: string) => console.log('Selected term:', termId),
  },
  parameters: {
    mockData: [
      {
        url: '/api/ai/term-suggestions',
        method: 'GET',
        status: 200,
        response: {
          suggestions: [],
          message: 'No related terms found. Try exploring different categories.',
        },
      },
    ],
  },
};

export const ErrorState: Story = {
  args: {
    currentTerm: 'Machine Learning',
    onTermSelect: (termId: string) => console.log('Selected term:', termId),
  },
  parameters: {
    mockData: [
      {
        url: '/api/ai/term-suggestions',
        method: 'GET',
        status: 503,
        response: { error: 'Suggestion service temporarily unavailable' },
      },
    ],
  },
};

export const CompactLayout: Story = {
  args: {
    currentTerm: 'Neural Networks',
    layout: 'compact',
    maxSuggestions: 3,
    onTermSelect: (termId: string) => console.log('Selected term:', termId),
  },
  parameters: {
    mockData: [
      {
        url: '/api/ai/term-suggestions',
        method: 'GET',
        status: 200,
        response: {
          suggestions: mockSuggestions.slice(0, 3),
        },
      },
    ],
  },
};

export const WithExplanations: Story = {
  args: {
    currentTerm: 'Reinforcement Learning',
    showExplanations: true,
    onTermSelect: (termId: string) => console.log('Selected term:', termId),
  },
  parameters: {
    mockData: [
      {
        url: '/api/ai/term-suggestions',
        method: 'GET',
        status: 200,
        response: {
          suggestions: mockSuggestions.map(s => ({
            ...s,
            explanation: `This term is suggested because it ${s.reason.toLowerCase()} and complements your understanding of ${s.term}.`
          })),
        },
      },
    ],
  },
};

export const DarkMode: Story = {
  args: {
    currentTerm: 'Machine Learning',
    onTermSelect: (termId: string) => console.log('Selected term:', termId),
  },
  parameters: {
    themes: {
      default: 'dark',
    },
    mockData: [
      {
        url: '/api/ai/term-suggestions',
        method: 'GET',
        status: 200,
        response: { suggestions: mockSuggestions },
      },
    ],
  },
};

export const MobileView: Story = {
  args: {
    currentTerm: 'Deep Learning',
    onTermSelect: (termId: string) => console.log('Selected term:', termId),
  },
  parameters: {
    viewport: {
      defaultViewport: 'mobile1',
    },
    mockData: [
      {
        url: '/api/ai/term-suggestions',
        method: 'GET',
        status: 200,
        response: { suggestions: mockSuggestions },
      },
    ],
  },
};
