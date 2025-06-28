import type { Meta, StoryObj } from '@storybook/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Sidebar from './Sidebar';

// Mock function for actions
const fn = () => () => {};

// Create a mock query client for stories
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
    },
  },
});

const meta: Meta<typeof Sidebar> = {
  title: 'Components/Sidebar',
  component: Sidebar,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: 'Navigation sidebar with categories, filters, and user preferences.',
      },
    },
  },
  decorators: [
    (Story) => (
      <QueryClientProvider client={queryClient}>
        <div className="flex h-screen">
          <Story />
          <div className="flex-1 bg-gray-50 p-8">
            <div className="text-center text-gray-600">
              <h2 className="text-xl font-semibold mb-2">Main Content Area</h2>
              <p>This represents the main application content that appears alongside the sidebar.</p>
            </div>
          </div>
        </div>
      </QueryClientProvider>
    ),
  ],
  args: {
    onCategorySelect: fn(),
    onFilterChange: fn(),
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {},
  parameters: {
    docs: {
      description: {
        story: 'Default sidebar with categories and navigation options.',
      },
    },
  },
};

export const Collapsed: Story = {
  args: {
    isCollapsed: true,
  },
  parameters: {
    docs: {
      description: {
        story: 'Collapsed sidebar showing only icons for space-saving.',
      },
    },
  },
};

export const WithActiveCategory: Story = {
  args: {
    activeCategory: 'machine-learning',
  },
  parameters: {
    docs: {
      description: {
        story: 'Sidebar with an active category highlighted.',
      },
    },
  },
};

export const WithFilters: Story = {
  args: {
    showFilters: true,
    activeFilters: {
      difficultyLevel: ['Intermediate'],
      hasCodeExamples: true,
    },
  },
  parameters: {
    docs: {
      description: {
        story: 'Sidebar with expanded filter options and active filters.',
      },
    },
  },
};

export const Mobile: Story = {
  args: {
    isMobile: true,
  },
  parameters: {
    viewport: {
      defaultViewport: 'mobile1',
    },
    docs: {
      description: {
        story: 'Mobile sidebar that can be toggled as an overlay.',
      },
    },
  },
  decorators: [
    (Story) => (
      <QueryClientProvider client={queryClient}>
        <div className="relative h-screen">
          <Story />
          <div className="h-full bg-gray-50 p-4">
            <div className="text-center text-gray-600">
              <h2 className="text-lg font-semibold mb-2">Mobile Layout</h2>
              <p className="text-sm">Sidebar appears as overlay on mobile devices.</p>
            </div>
          </div>
        </div>
      </QueryClientProvider>
    ),
  ],
};

export const WithSearchResults: Story = {
  args: {
    searchQuery: 'neural network',
    searchResultsCount: 23,
  },
  parameters: {
    docs: {
      description: {
        story: 'Sidebar showing search results and related filters.',
      },
    },
  },
};

export const UserPreferences: Story = {
  args: {
    showUserPreferences: true,
    userSettings: {
      favoriteCategories: ['machine-learning', 'deep-learning'],
      preferredDifficulty: 'Intermediate',
      showCodeExamples: true,
    },
  },
  parameters: {
    docs: {
      description: {
        story: 'Sidebar with user preferences and personalization options.',
      },
    },
  },
};

export const LoadingState: Story = {
  args: {
    isLoading: true,
  },
  parameters: {
    docs: {
      description: {
        story: 'Sidebar in loading state while fetching categories.',
      },
    },
  },
};

export const EmptyState: Story = {
  args: {
    categories: [],
    isEmpty: true,
  },
  parameters: {
    docs: {
      description: {
        story: 'Sidebar when no categories are available.',
      },
    },
  },
};

export const DarkMode: Story = {
  args: {},
  parameters: {
    backgrounds: {
      default: 'dark',
    },
    docs: {
      description: {
        story: 'Sidebar in dark mode theme.',
      },
    },
  },
  decorators: [
    (Story) => (
      <QueryClientProvider client={queryClient}>
        <div className="flex h-screen dark">
          <Story />
          <div className="flex-1 bg-gray-900 p-8">
            <div className="text-center text-gray-400">
              <h2 className="text-xl font-semibold mb-2">Main Content Area</h2>
              <p>Dark mode layout with sidebar navigation.</p>
            </div>
          </div>
        </div>
      </QueryClientProvider>
    ),
  ],
}; 