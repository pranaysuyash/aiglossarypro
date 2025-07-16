import type { Meta, StoryObj } from '@storybook/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AISemanticSearch } from './AISemanticSearch';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: false },
    mutations: { retry: false },
  },
});

const meta: Meta<typeof AISemanticSearch> = {
  title: 'AI/AISemanticSearch',
  component: AISemanticSearch,
  decorators: [
    Story => (
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
        component:
          'AI-powered semantic search component that provides intelligent search suggestions and results.',
      },
    },
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {},
};

export const WithInitialQuery: Story = {
  args: {},
  play: async ({ canvasElement }) => {
    const canvas = canvasElement;
    const searchInput = canvas.querySelector('input[type="text"]') as HTMLInputElement;
    if (searchInput) {
      searchInput.value = 'machine learning algorithms';
      searchInput.dispatchEvent(new Event('input', { bubbles: true }));
    }
  },
};

export const LoadingState: Story = {
  args: {},
  parameters: {
    mockData: [
      {
        url: '/api/ai/semantic-search',
        method: 'POST',
        status: 200,
        response: { results: [], loading: true },
        delay: 2000,
      },
    ],
  },
};

export const WithResults: Story = {
  args: {},
  parameters: {
    mockData: [
      {
        url: '/api/ai/semantic-search',
        method: 'POST',
        status: 200,
        response: {
          results: [
            {
              id: '1',
              term: 'Neural Networks',
              definition: 'Computational models inspired by biological neural networks',
              relevanceScore: 0.95,
              category: 'Deep Learning',
            },
            {
              id: '2',
              term: 'Gradient Descent',
              definition: 'Optimization algorithm used to minimize cost functions',
              relevanceScore: 0.87,
              category: 'Optimization',
            },
            {
              id: '3',
              term: 'Backpropagation',
              definition: 'Algorithm for training neural networks using gradient descent',
              relevanceScore: 0.82,
              category: 'Deep Learning',
            },
          ],
          suggestions: [
            'deep learning',
            'artificial neural networks',
            'machine learning optimization',
          ],
        },
      },
    ],
  },
};

export const EmptyResults: Story = {
  args: {},
  parameters: {
    mockData: [
      {
        url: '/api/ai/semantic-search',
        method: 'POST',
        status: 200,
        response: {
          results: [],
          suggestions: ['try searching for "neural networks"', 'or "machine learning"'],
        },
      },
    ],
  },
};

export const ErrorState: Story = {
  args: {},
  parameters: {
    mockData: [
      {
        url: '/api/ai/semantic-search',
        method: 'POST',
        status: 500,
        response: { error: 'AI service unavailable' },
      },
    ],
  },
};

export const DarkMode: Story = {
  args: {},
  parameters: {
    themes: {
      default: 'dark',
    },
  },
};

export const MobileView: Story = {
  args: {},
  parameters: {
    viewport: {
      defaultViewport: 'mobile1',
    },
  },
};
