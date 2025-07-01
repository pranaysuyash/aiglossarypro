import type { Meta, StoryObj } from '@storybook/react';
import VirtualizedTermList from './VirtualizedTermList';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

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
    (Story) => (
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
        component: 'High-performance virtualized list component for displaying large sets of terms with smooth scrolling and efficient rendering.',
      },
    },
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

// Generate mock data
const generateMockTerms = (count: number) => {
  const categories = ['Machine Learning', 'Deep Learning', 'NLP', 'Computer Vision', 'Reinforcement Learning', 'Statistics'];
  const difficulties = ['beginner', 'intermediate', 'advanced'] as const;
  
  return Array.from({ length: count }, (_, i) => ({
    id: `term-${i}`,
    name: `AI Term ${i + 1}`,
    definition: `This is a comprehensive definition for AI Term ${i + 1}. It explains the concept in detail with examples and technical explanations that help users understand the complex topic.`,
    category: categories[i % categories.length],
    difficulty: difficulties[i % difficulties.length],
    views: Math.floor(Math.random() * 1000) + 100,
    lastUpdated: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
    tags: [`tag${i % 5}`, `category${i % 3}`],
    enhanced: i % 3 === 0,
    aiGenerated: i % 4 === 0,
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
    onScrollEnd: () => console.log('Scrolled to end'),
  },
};

export const CompactView: Story = {
  args: {
    terms: mediumDataset,
    height: 400,
    itemHeight: 80,
    layout: 'compact',
    showCategory: false,
    showDefinition: false,
    onTermClick: (termId: string) => console.log('Term clicked:', termId),
  },
};

export const WithSearch: Story = {
  args: {
    terms: mediumDataset,
    height: 400,
    itemHeight: 120,
    searchable: true,
    searchPlaceholder: 'Search terms...',
    onTermClick: (termId: string) => console.log('Term clicked:', termId),
    onSearch: (query: string) => console.log('Search query:', query),
  },
};

export const WithFilters: Story = {
  args: {
    terms: mediumDataset,
    height: 400,
    itemHeight: 120,
    filterable: true,
    availableFilters: {
      category: ['Machine Learning', 'Deep Learning', 'NLP', 'Computer Vision'],
      difficulty: ['beginner', 'intermediate', 'advanced'],
      enhanced: [true, false],
    },
    onTermClick: (termId: string) => console.log('Term clicked:', termId),
    onFilterChange: (filters: any) => console.log('Filters changed:', filters),
  },
};

export const WithSorting: Story = {
  args: {
    terms: mediumDataset,
    height: 400,
    itemHeight: 120,
    sortable: true,
    defaultSortBy: 'name',
    sortOptions: [
      { value: 'name', label: 'Alphabetical' },
      { value: 'views', label: 'Most Viewed' },
      { value: 'lastUpdated', label: 'Recently Updated' },
      { value: 'difficulty', label: 'Difficulty' },
    ],
    onTermClick: (termId: string) => console.log('Term clicked:', termId),
    onSortChange: (sortBy: string, order: string) => console.log('Sort changed:', sortBy, order),
  },
};

export const GridLayout: Story = {
  args: {
    terms: mediumDataset,
    height: 400,
    layout: 'grid',
    itemsPerRow: 3,
    itemHeight: 200,
    showDefinition: true,
    onTermClick: (termId: string) => console.log('Term clicked:', termId),
  },
};

export const WithSelectionMode: Story = {
  args: {
    terms: smallDataset,
    height: 400,
    itemHeight: 120,
    selectable: true,
    multiSelect: true,
    selectedTerms: ['term-1', 'term-3'],
    onTermClick: (termId: string) => console.log('Term clicked:', termId),
    onSelectionChange: (selectedIds: string[]) => console.log('Selection changed:', selectedIds),
  },
};

export const WithCustomActions: Story = {
  args: {
    terms: smallDataset,
    height: 400,
    itemHeight: 120,
    showActions: true,
    actions: [
      {
        id: 'favorite',
        label: 'Favorite',
        icon: 'heart',
        onClick: (termId: string) => console.log('Favorited:', termId),
      },
      {
        id: 'share',
        label: 'Share',
        icon: 'share',
        onClick: (termId: string) => console.log('Shared:', termId),
      },
      {
        id: 'edit',
        label: 'Edit',
        icon: 'edit',
        onClick: (termId: string) => console.log('Edit:', termId),
        adminOnly: true,
      },
    ],
    onTermClick: (termId: string) => console.log('Term clicked:', termId),
  },
};

export const WithGrouping: Story = {
  args: {
    terms: mediumDataset,
    height: 400,
    itemHeight: 120,
    groupBy: 'category',
    showGroupHeaders: true,
    collapsibleGroups: true,
    onTermClick: (termId: string) => console.log('Term clicked:', termId),
    onGroupToggle: (groupId: string, expanded: boolean) => console.log('Group toggled:', groupId, expanded),
  },
};

export const LoadingState: Story = {
  args: {
    terms: [],
    height: 400,
    itemHeight: 120,
    loading: true,
    skeletonCount: 10,
  },
};

export const EmptyState: Story = {
  args: {
    terms: [],
    height: 400,
    itemHeight: 120,
    loading: false,
    emptyStateMessage: 'No terms found',
    emptyStateDescription: 'Try adjusting your search or filters',
    showEmptyStateAction: true,
    emptyStateActionText: 'Browse All Terms',
    onEmptyStateAction: () => console.log('Empty state action clicked'),
  },
};

export const WithInfiniteScroll: Story = {
  args: {
    terms: smallDataset,
    height: 400,
    itemHeight: 120,
    infiniteScroll: true,
    hasMore: true,
    loadingMore: false,
    onLoadMore: () => console.log('Loading more terms...'),
    onTermClick: (termId: string) => console.log('Term clicked:', termId),
  },
};

export const WithErrorState: Story = {
  args: {
    terms: [],
    height: 400,
    itemHeight: 120,
    error: 'Failed to load terms. Please try again.',
    onRetry: () => console.log('Retrying...'),
  },
};

export const PerformanceTest: Story = {
  args: {
    terms: generateMockTerms(10000),
    height: 400,
    itemHeight: 120,
    onTermClick: (termId: string) => console.log('Term clicked:', termId),
    enablePerformanceMonitoring: true,
    onPerformanceMetrics: (metrics: any) => console.log('Performance metrics:', metrics),
  },
};

export const WithHighlighting: Story = {
  args: {
    terms: smallDataset,
    height: 400,
    itemHeight: 120,
    searchQuery: 'AI Term',
    highlightMatches: true,
    onTermClick: (termId: string) => console.log('Term clicked:', termId),
  },
};

export const MobileOptimized: Story = {
  args: {
    terms: mediumDataset,
    height: 400,
    itemHeight: 100,
    layout: 'compact',
    mobileOptimized: true,
    swipeActions: [
      {
        id: 'favorite',
        label: 'Favorite',
        icon: 'heart',
        color: 'red',
        side: 'right',
        onClick: (termId: string) => console.log('Favorited:', termId),
      },
      {
        id: 'share',
        label: 'Share',
        icon: 'share',
        color: 'blue',
        side: 'left',
        onClick: (termId: string) => console.log('Shared:', termId),
      },
    ],
    onTermClick: (termId: string) => console.log('Term clicked:', termId),
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
    enableAnalytics: true,
    onTermClick: (termId: string) => console.log('Term clicked:', termId),
    onTermView: (termId: string) => console.log('Term viewed:', termId),
    onScrollMetrics: (metrics: any) => console.log('Scroll metrics:', metrics),
  },
};

export const AccessibleVersion: Story = {
  args: {
    terms: smallDataset,
    height: 400,
    itemHeight: 120,
    accessibilityFeatures: {
      keyboardNavigation: true,
      screenReaderSupport: true,
      highContrast: false,
      announceChanges: true,
    },
    onTermClick: (termId: string) => console.log('Term clicked:', termId),
    onKeyboardNavigation: (direction: string) => console.log('Keyboard navigation:', direction),
  },
};

export const DarkMode: Story = {
  args: {
    terms: mediumDataset,
    height: 400,
    itemHeight: 120,
    theme: 'dark',
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
    customStyles: {
      backgroundColor: '#f8f9fa',
      borderRadius: '12px',
      padding: '16px',
    },
    itemStyles: {
      backgroundColor: '#ffffff',
      borderRadius: '8px',
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
      margin: '8px',
    },
    onTermClick: (termId: string) => console.log('Term clicked:', termId),
  },
};
