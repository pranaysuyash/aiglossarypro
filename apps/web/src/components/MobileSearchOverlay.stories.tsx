import type { Meta, StoryObj } from '@storybook/react';
import { MobileSearchOverlay } from './MobileSearchOverlay';

const meta: Meta<typeof MobileSearchOverlay> = {
  title: 'Components/MobileSearchOverlay',
  component: MobileSearchOverlay,
  parameters: {
    layout: 'fullscreen',
    viewport: {
      defaultViewport: 'mobile1',
    },
    docs: {
      description: {
        component:
          'Full-screen mobile search overlay with touch-optimized interface, voice search, and filtering capabilities',
      },
    },
  },
  argTypes: {
    onClose: { action: 'overlay closed' },
    onResultClick: { action: 'result clicked' },
    onFavoriteToggle: { action: 'favorite toggled' },
  },
};

export default meta;
type Story = StoryObj<typeof MobileSearchOverlay>;

export const Default: Story = {
  args: {
    isOpen: true,
    placeholder: 'Search 10,000+ AI/ML terms...',
    showVoiceSearch: true,
  },
};

export const WithInitialQuery: Story = {
  args: {
    isOpen: true,
    initialQuery: 'neural network',
    placeholder: 'Search 10,000+ AI/ML terms...',
    showVoiceSearch: true,
  },
};

export const NoVoiceSearch: Story = {
  args: {
    isOpen: true,
    showVoiceSearch: false,
    placeholder: 'Search AI/ML definitions...',
  },
};

export const CustomPlaceholder: Story = {
  args: {
    isOpen: true,
    placeholder: 'What AI concept are you looking for?',
    showVoiceSearch: true,
  },
};

export const Closed: Story = {
  args: {
    isOpen: false,
    showVoiceSearch: true,
  },
};

// Interactive stories for testing different states
export const WithRecentSearches: Story = {
  args: {
    isOpen: true,
    showVoiceSearch: true,
  },
  beforeEach: () => {
    // Set up mock recent searches in localStorage
    localStorage.setItem(
      'mobile_recent_searches',
      JSON.stringify([
        'neural network',
        'machine learning',
        'deep learning',
        'artificial intelligence',
        'gradient descent',
      ])
    );
  },
};

export const EmptyState: Story = {
  args: {
    isOpen: true,
    showVoiceSearch: true,
  },
  beforeEach: () => {
    // Clear any existing recent searches
    localStorage.removeItem('mobile_recent_searches');
  },
};

export const TabletView: Story = {
  args: {
    isOpen: true,
    showVoiceSearch: true,
  },
  parameters: {
    viewport: {
      defaultViewport: 'tablet',
    },
  },
};

export const DarkMode: Story = {
  args: {
    isOpen: true,
    showVoiceSearch: true,
  },
  parameters: {
    backgrounds: {
      default: 'dark',
    },
  },
};

export const LoadingState: Story = {
  args: {
    isOpen: true,
    initialQuery: 'loading example',
    showVoiceSearch: true,
  },
  parameters: {
    docs: {
      description: {
        story: 'Demonstrates the loading state when search results are being fetched',
      },
    },
  },
};

export const NoResults: Story = {
  args: {
    isOpen: true,
    initialQuery: 'xyznoresults',
    showVoiceSearch: true,
  },
  parameters: {
    docs: {
      description: {
        story: 'Demonstrates the empty state when no search results are found',
      },
    },
  },
};
