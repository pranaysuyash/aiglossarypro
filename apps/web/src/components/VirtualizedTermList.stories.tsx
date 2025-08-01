import type { Meta, StoryObj } from '@storybook/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ITerm } from '@aiglossarypro/shared/types';
import VirtualizedTermList from './VirtualizedTermList';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: false },
    mutations: { retry: false },
  },
});

const meta: Meta<typeof VirtualizedTermList> = {
  title: 'Components/VirtualizedTermList',
  component: VirtualizedTermList,
  decorators: [
    Story => (
      <QueryClientProvider client={queryClient}>
        <div className="h-96 w-full border rounded-lg">
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
          'High-performance virtualized list component for displaying large sets of terms with smooth scrolling and efficient rendering.',
      },
    },
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

// Generate mock data
const generateMockTerms = (count: number): ITerm[] => {
  const categories = [
    'Machine Learning',
    'Deep Learning',
    'NLP',
    'Computer Vision',
    'Reinforcement Learning',
    'Statistics',
  ];
  const _difficulties = ['beginner', 'intermediate', 'advanced'] as const;

  return Array.from({ length: count }, (_, i) => ({
    id: `term-${i}`,
    name: `AI Term ${i + 1}`,
    definition: `This is a comprehensive definition for AI Term ${i + 1}. It explains the concept in detail with examples and technical explanations that help users understand the complex topic.`,
    category: categories[i % categories.length],
    viewCount: Math.floor(Math.random() * 1000) + 100,
    createdAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
    updatedAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
    isAiGenerated: i % 4 === 0,
    verificationStatus: (
      ['unverified', 'verified', 'flagged', 'needs_review', 'expert_reviewed'] as const
    )[i % 5],
  }));
};

const smallDataset = generateMockTerms(50);
const mediumDataset = generateMockTerms(500);
const largeDataset = generateMockTerms(5000);

export const Default: Story = {
  args: {
    terms: smallDataset,
    height: 400,
    itemHeight: 120,
    onTermClick: (termId: string) => console.log('Term clicked:', termId),
  },
};

export const LargeDataset: Story = {
  args: {
    terms: largeDataset,
    height: 400,
    itemHeight: 120,
    onTermClick: (termId: string) => console.log('Term clicked:', termId),
  },
};

export const CompactView: Story = {
  args: {
    terms: mediumDataset,
    height: 400,
    itemHeight: 80,
    onTermClick: (termId: string) => console.log('Term clicked:', termId),
  },
};

export const WithSearch: Story = {
  args: {
    terms: mediumDataset,
    height: 400,
    itemHeight: 120,
    onTermClick: (termId: string) => console.log('Term clicked:', termId),
  },
};

export const WithFilters: Story = {
  args: {
    terms: mediumDataset,
    height: 400,
    itemHeight: 120,
    onTermClick: (termId: string) => console.log('Term clicked:', termId),
  },
};

export const WithSorting: Story = {
  args: {
    terms: mediumDataset,
    height: 400,
    itemHeight: 120,
    onTermClick: (termId: string) => console.log('Term clicked:', termId),
  },
};

export const GridLayout: Story = {
  args: {
    terms: mediumDataset,
    height: 400,
    itemHeight: 200,
    onTermClick: (termId: string) => console.log('Term clicked:', termId),
  },
};

export const WithSelectionMode: Story = {
  args: {
    terms: smallDataset,
    height: 400,
    itemHeight: 120,
    onTermClick: (termId: string) => console.log('Term clicked:', termId),
    onFavoriteToggle: (termId: string, isFavorite: boolean) =>
      console.log('Favorite toggled:', termId, isFavorite),
  },
};

export const WithCustomActions: Story = {
  args: {
    terms: smallDataset,
    height: 400,
    itemHeight: 120,
    onTermClick: (termId: string) => console.log('Term clicked:', termId),
    onFavoriteToggle: (termId: string, isFavorite: boolean) =>
      console.log('Favorite toggled:', termId, isFavorite),
  },
};

export const WithGrouping: Story = {
  args: {
    terms: mediumDataset,
    height: 400,
    itemHeight: 120,
    onTermClick: (termId: string) => console.log('Term clicked:', termId),
  },
};

export const LoadingState: Story = {
  args: {
    terms: [],
    height: 400,
    itemHeight: 120,
    isNextPageLoading: true,
    onTermClick: (termId: string) => console.log('Term clicked:', termId),
  },
};

export const EmptyState: Story = {
  args: {
    terms: [],
    height: 400,
    itemHeight: 120,
    onTermClick: (termId: string) => console.log('Term clicked:', termId),
  },
};

export const WithInfiniteScroll: Story = {
  args: {
    terms: smallDataset,
    height: 400,
    itemHeight: 120,
    hasNextPage: true,
    isNextPageLoading: false,
    loadNextPage: async () => console.log('Loading more terms...'),
    onTermClick: (termId: string) => console.log('Term clicked:', termId),
  },
};

export const WithErrorState: Story = {
  args: {
    terms: [],
    height: 400,
    itemHeight: 120,
    onTermClick: (termId: string) => console.log('Term clicked:', termId),
  },
};

export const PerformanceTest: Story = {
  args: {
    terms: generateMockTerms(10000),
    height: 400,
    itemHeight: 120,
    onTermClick: (termId: string) => console.log('Term clicked:', termId),
  },
};

export const WithHighlighting: Story = {
  args: {
    terms: smallDataset,
    height: 400,
    itemHeight: 120,
    onTermClick: (termId: string) => console.log('Term clicked:', termId),
  },
};

export const MobileOptimized: Story = {
  args: {
    terms: mediumDataset,
    height: 400,
    itemHeight: 100,
    onTermClick: (termId: string) => console.log('Term clicked:', termId),
    onFavoriteToggle: (termId: string, isFavorite: boolean) =>
      console.log('Favorite toggled:', termId, isFavorite),
  },
  parameters: {
    viewport: {
      defaultViewport: 'mobile1',
    },
  },
};

export const WithAnalytics: Story = {
  args: {
    terms: mediumDataset,
    height: 400,
    itemHeight: 120,
    onTermClick: (termId: string) => console.log('Term clicked:', termId),
  },
};

export const AccessibleVersion: Story = {
  args: {
    terms: smallDataset,
    height: 400,
    itemHeight: 120,
    onTermClick: (termId: string) => console.log('Term clicked:', termId),
  },
};

export const DarkMode: Story = {
  args: {
    terms: mediumDataset,
    height: 400,
    itemHeight: 120,
    onTermClick: (termId: string) => console.log('Term clicked:', termId),
  },
  parameters: {
    themes: {
      default: 'dark',
    },
  },
};

export const CustomStyling: Story = {
  args: {
    terms: smallDataset,
    height: 400,
    itemHeight: 140,
    className: 'bg-gray-50 rounded-xl p-4',
    onTermClick: (termId: string) => console.log('Term clicked:', termId),
  },
};
