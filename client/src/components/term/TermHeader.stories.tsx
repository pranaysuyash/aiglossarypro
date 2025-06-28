import type { Meta, StoryObj } from '@storybook/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import TermHeader from './TermHeader';

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

// Mock term data
const mockTerm = {
  id: '1',
  name: 'Neural Network',
  shortDefinition: 'A computing system inspired by biological neural networks.',
  definition: 'A neural network is a computing system inspired by the biological neural networks that constitute animal brains.',
  category: 'Machine Learning',
  viewCount: 1247,
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-15'),
};

const meta: Meta<typeof TermHeader> = {
  title: 'Components/Term/TermHeader',
  component: TermHeader,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: 'The header component for term detail pages with actions and metadata.',
      },
    },
  },
  decorators: [
    (Story) => (
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <div className="min-h-screen bg-gray-50 p-4">
            <Story />
          </div>
        </MemoryRouter>
      </QueryClientProvider>
    ),
  ],
  args: {
    term: mockTerm,
    onFavorite: fn(),
    onShare: fn(),
    isFavorite: false,
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
        story: 'Default term header with actions and metadata.',
      },
    },
  },
};

export const WithLongName: Story = {
  args: {
    term: {
      ...mockTerm,
      name: 'Convolutional Neural Network with Attention Mechanism and Transfer Learning',
      shortDefinition: 'A very long definition that tests how the header handles overflow text and maintains proper layout with extensive content that might wrap to multiple lines.',
    },
  },
  parameters: {
    docs: {
      description: {
        story: 'Term header with long name and definition to test text overflow handling.',
      },
    },
  },
};

export const Favorited: Story = {
  args: {
    isFavorite: true,
  },
  parameters: {
    docs: {
      description: {
        story: 'Term header with the term marked as favorite.',
      },
    },
  },
};

export const HighViewCount: Story = {
  args: {
    term: {
      ...mockTerm,
      name: 'Machine Learning',
      viewCount: 15743,
    },
  },
  parameters: {
    docs: {
      description: {
        story: 'Term header with high view count.',
      },
    },
  },
};

export const RecentlyUpdated: Story = {
  args: {
    term: {
      ...mockTerm,
      name: 'Transformer Architecture',
      updatedAt: new Date(),
    },
  },
  parameters: {
    docs: {
      description: {
        story: 'Term header for recently updated content.',
      },
    },
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
        story: 'Term header optimized for mobile devices.',
      },
    },
  },
};

export const Tablet: Story = {
  args: {},
  parameters: {
    viewport: {
      defaultViewport: 'tablet',
    },
    docs: {
      description: {
        story: 'Term header optimized for tablet devices.',
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
        story: 'Term header in dark mode theme.',
      },
    },
  },
  decorators: [
    (Story) => (
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <div className="min-h-screen bg-gray-900 p-4 dark">
            <Story />
          </div>
        </MemoryRouter>
      </QueryClientProvider>
    ),
  ],
}; 