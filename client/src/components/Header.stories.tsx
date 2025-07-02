import type { Meta, StoryObj } from '@storybook/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Header from './Header';

// Create a mock query client for stories
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
    },
  },
});

const meta: Meta<typeof Header> = {
  title: 'Components/Header',
  component: Header,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: 'The main header component with search, navigation, and authentication controls.',
      },
    },
  },
  decorators: [
    (Story) => (
      <QueryClientProvider client={queryClient}>
        <div className="min-h-screen bg-gray-50">
          <Story />
        </div>
      </QueryClientProvider>
    ),
  ],
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  parameters: {
    docs: {
      description: {
        story: 'Default header with search functionality and navigation.',
      },
    },
  },
};

export const WithLongSearch: Story = {
  parameters: {
    docs: {
      description: {
        story: 'Header with a long search query to test text overflow handling.',
      },
    },
  },
  play: async ({ canvasElement }) => {
    const searchInput = canvasElement.querySelector('input[type="text"]') as HTMLInputElement;
    if (searchInput) {
      searchInput.value = 'This is a very long search query that might overflow the search input field';
    }
  },
};

export const Mobile: Story = {
  parameters: {
    viewport: {
      defaultViewport: 'mobile1',
    },
    docs: {
      description: {
        story: 'Header optimized for mobile devices with responsive navigation.',
      },
    },
  },
};

export const Tablet: Story = {
  parameters: {
    viewport: {
      defaultViewport: 'tablet',
    },
    docs: {
      description: {
        story: 'Header optimized for tablet devices.',
      },
    },
  },
};

export const DarkMode: Story = {
  parameters: {
    backgrounds: {
      default: 'dark',
    },
    docs: {
      description: {
        story: 'Header in dark mode theme.',
      },
    },
  },
  decorators: [
    (Story) => (
      <QueryClientProvider client={queryClient}>
        <div className="min-h-screen bg-gray-900 dark">
          <Story />
        </div>
      </QueryClientProvider>
    ),
  ],
}; 