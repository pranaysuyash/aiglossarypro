import type { Meta, StoryObj } from '@storybook/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
// Mock function for actions
const fn = () => () => {};
import SearchBar from './SearchBar';

// Create a mock query client for stories
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
    },
  },
});

const meta: Meta<typeof SearchBar> = {
  title: 'Components/SearchBar',
  component: SearchBar,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'A comprehensive search bar with autocomplete, suggestions, and advanced search features.',
      },
    },
  },
  decorators: [
    (Story) => (
      <QueryClientProvider client={queryClient}>
        <div className="w-full max-w-2xl p-4">
          <Story />
        </div>
      </QueryClientProvider>
    ),
  ],
  args: {
    onSearch: fn(),
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
        story: 'Default search bar with placeholder text and search functionality.',
      },
    },
  },
};

export const WithInitialValue: Story = {
  args: {
    initialValue: 'machine learning',
  },
  parameters: {
    docs: {
      description: {
        story: 'Search bar with an initial search value pre-filled.',
      },
    },
  },
};

export const Loading: Story = {
  args: {},
  parameters: {
    docs: {
      description: {
        story: 'Search bar in loading state while fetching suggestions.',
      },
    },
  },
  play: async ({ canvasElement }) => {
    const searchInput = canvasElement.querySelector('input[type="text"]') as HTMLInputElement;
    if (searchInput) {
      searchInput.focus();
      searchInput.value = 'neural';
      // Simulate typing to trigger suggestions
      const event = new Event('input', { bubbles: true });
      searchInput.dispatchEvent(event);
    }
  },
};

export const WithSuggestions: Story = {
  args: {},
  parameters: {
    docs: {
      description: {
        story: 'Search bar showing autocomplete suggestions dropdown.',
      },
    },
  },
  play: async ({ canvasElement }) => {
    const searchInput = canvasElement.querySelector('input[type="text"]') as HTMLInputElement;
    if (searchInput) {
      searchInput.focus();
      searchInput.value = 'deep';
      const event = new Event('input', { bubbles: true });
      searchInput.dispatchEvent(event);
    }
  },
};

export const Mobile: Story = {
  args: {},
  parameters: {
    viewport: {
      defaultViewport: 'mobile1',
    },
    docs: {
      description: {
        story: 'Search bar optimized for mobile devices with touch-friendly interface.',
      },
    },
  },
};

export const Focused: Story = {
  args: {},
  parameters: {
    docs: {
      description: {
        story: 'Search bar in focused state with enhanced visual feedback.',
      },
    },
  },
  play: async ({ canvasElement }) => {
    const searchInput = canvasElement.querySelector('input[type="text"]') as HTMLInputElement;
    if (searchInput) {
      searchInput.focus();
    }
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
        story: 'Search bar in dark mode theme.',
      },
    },
  },
  decorators: [
    (Story) => (
      <QueryClientProvider client={queryClient}>
        <div className="w-full max-w-2xl p-4 dark">
          <Story />
        </div>
      </QueryClientProvider>
    ),
  ],
}; 