import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
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
  name: 'Machine Learning',
  definition:
    'A subset of artificial intelligence (AI) that provides systems the ability to automatically learn and improve from experience without being explicitly programmed.',
  shortDefinition: 'A subset of AI that enables systems to learn from experience.',
  category: 'Core Concepts',
  viewCount: 1250,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const meta: Meta<typeof TermHeader> = {
  title: 'Components/Term/TermHeader',
  component: TermHeader,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Header component for term detail pages with title, metadata, and action buttons.',
      },
    },
  },
  decorators: [
    (Story) => (
      <QueryClientProvider client={queryClient}>
        <div className="min-h-screen bg-gray-50 p-4">
          <Story />
        </div>
      </QueryClientProvider>
    ),
  ],
  args: {
    term: mockTerm,
    isEnhanced: false,
    favorite: false,
    favoriteLoading: false,
    shareMenuOpen: false,
    onToggleFavorite: fn(),
    onCopyLink: fn(),
    onShareMenuToggle: fn(),
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
      shortDefinition:
        'A very long definition that tests how the header handles overflow text and maintains proper layout with extensive content that might wrap to multiple lines.',
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
    favorite: true,
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
        <div className="min-h-screen bg-gray-900 p-4 dark">
          <Story />
        </div>
      </QueryClientProvider>
    ),
  ],
};
