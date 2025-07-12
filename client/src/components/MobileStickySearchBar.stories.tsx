import type { Meta, StoryObj } from '@storybook/react';
import { MobileStickySearchBar } from './MobileStickySearchBar';

const meta: Meta<typeof MobileStickySearchBar> = {
  title: 'Components/MobileStickySearchBar',
  component: MobileStickySearchBar,
  parameters: {
    layout: 'fullscreen',
    viewport: {
      defaultViewport: 'mobile1',
    },
    docs: {
      description: {
        component: 'Sticky search bar that appears at bottom of mobile screens and opens full-screen search overlay when tapped',
      },
    },
  },
  decorators: [
    (Story) => (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4">
        <div className="max-w-md mx-auto space-y-4">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">AI Glossary Pro</h1>
          <p className="text-gray-600 dark:text-gray-400">
            This page demonstrates the sticky search bar. Scroll down to see it in action.
          </p>
          
          {/* Sample content to demonstrate scrolling */}
          {Array.from({ length: 20 }, (_, i) => (
            <div key={i} className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
              <h3 className="font-semibold text-gray-900 dark:text-gray-100">Sample Term {i + 1}</h3>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                This is a sample AI/ML term definition that demonstrates how content would appear in the app.
                The sticky search bar should remain visible at the bottom while scrolling through this content.
              </p>
            </div>
          ))}
        </div>
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof MobileStickySearchBar>;

export const Default: Story = {
  args: {
    placeholder: "Search AI/ML terms...",
    showOnlyOnMobile: true,
  },
};

export const CustomPlaceholder: Story = {
  args: {
    placeholder: "What AI concept are you looking for?",
    showOnlyOnMobile: true,
  },
};

export const AlwaysVisible: Story = {
  args: {
    placeholder: "Search 10,000+ definitions...",
    showOnlyOnMobile: false,
  },
  parameters: {
    docs: {
      description: {
        story: 'Search bar visible on all screen sizes, not just mobile',
      },
    },
  },
};

export const TabletView: Story = {
  args: {
    placeholder: "Search AI/ML terms...",
    showOnlyOnMobile: true,
  },
  parameters: {
    viewport: {
      defaultViewport: 'tablet',
    },
    docs: {
      description: {
        story: 'On tablet view, the search bar is hidden by default (showOnlyOnMobile: true)',
      },
    },
  },
};

export const DesktopView: Story = {
  args: {
    placeholder: "Search AI/ML terms...",
    showOnlyOnMobile: true,
  },
  parameters: {
    viewport: {
      defaultViewport: 'desktop',
    },
    docs: {
      description: {
        story: 'On desktop view, the search bar is hidden by default (showOnlyOnMobile: true)',
      },
    },
  },
};

export const DarkMode: Story = {
  args: {
    placeholder: "Search AI/ML terms...",
    showOnlyOnMobile: true,
  },
  parameters: {
    backgrounds: {
      default: 'dark',
    },
  },
};

export const InteractiveDemo: Story = {
  args: {
    placeholder: "Tap to search 10,000+ terms...",
    showOnlyOnMobile: true,
  },
  parameters: {
    docs: {
      description: {
        story: 'Tap the search bar to open the full-screen mobile search overlay',
      },
    },
  },
};