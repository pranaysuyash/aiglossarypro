import type { Meta, StoryObj } from '@storybook/react';
import { OfflineStatus } from './OfflineStatus';

const meta: Meta<typeof OfflineStatus> = {
  title: 'Components/OfflineStatus',
  component: OfflineStatus,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: 'Offline status indicator and sync management for PWA users with cached content',
      },
    },
  },
  argTypes: {
    onSync: { action: 'sync triggered' },
  },
  decorators: [
    (Story) => (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4">
        <div className="max-w-4xl mx-auto space-y-4">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">AI Glossary Pro</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Check the online/offline status indicator in the top-right corner.
            When offline, a banner will appear at the top.
          </p>
          
          {/* Sample content */}
          {Array.from({ length: 10 }, (_, i) => (
            <div key={i} className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
              <h3 className="font-semibold text-gray-900 dark:text-gray-100">Cached Term {i + 1}</h3>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                This term is available offline. Sync status is managed automatically.
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
type Story = StoryObj<typeof OfflineStatus>;

export const Online: Story = {
  args: {
    showSyncButton: true,
  },
  parameters: {
    docs: {
      description: {
        story: 'Normal online state with status indicator',
      },
    },
  },
};

export const Offline: Story = {
  args: {
    showSyncButton: true,
  },
  parameters: {
    docs: {
      description: {
        story: 'Offline state with banner and cached content info',
      },
    },
  },
  play: async () => {
    // Simulate going offline
    Object.defineProperty(navigator, 'onLine', {
      writable: true,
      value: false,
    });
    window.dispatchEvent(new Event('offline'));
  },
};

export const WithPendingSync: Story = {
  args: {
    showSyncButton: true,
  },
  parameters: {
    docs: {
      description: {
        story: 'Online state with pending sync items',
      },
    },
  },
  beforeEach: () => {
    // Add some mock sync queue items
    localStorage.setItem('sync_queue', JSON.stringify([
      { id: '1', type: 'favorite', data: { termId: 'neural-network' }, timestamp: new Date().toISOString() },
      { id: '2', type: 'progress', data: { termId: 'machine-learning', progress: 100 }, timestamp: new Date().toISOString() },
      { id: '3', type: 'view', data: { termId: 'deep-learning' }, timestamp: new Date().toISOString() },
    ]));
  },
};

export const WithCachedTerms: Story = {
  args: {
    showSyncButton: true,
  },
  beforeEach: () => {
    // Add mock cached terms
    localStorage.setItem('cached_terms', JSON.stringify([
      {
        id: 'neural-network',
        title: 'Neural Network',
        definition: 'A computing system inspired by biological neural networks...',
        category: 'Deep Learning',
        cachedAt: new Date().toISOString(),
        lastViewed: new Date().toISOString(),
      },
      {
        id: 'machine-learning',
        title: 'Machine Learning',
        definition: 'A subset of AI that enables computers to learn...',
        category: 'AI Fundamentals',
        cachedAt: new Date().toISOString(),
        lastViewed: new Date().toISOString(),
      },
    ]));
  },
  play: async () => {
    // Simulate going offline
    Object.defineProperty(navigator, 'onLine', {
      writable: true,
      value: false,
    });
    window.dispatchEvent(new Event('offline'));
  },
};

export const NoSyncButton: Story = {
  args: {
    showSyncButton: false,
  },
  parameters: {
    docs: {
      description: {
        story: 'Status indicator without manual sync button',
      },
    },
  },
};

export const MobileView: Story = {
  args: {
    showSyncButton: true,
  },
  parameters: {
    viewport: {
      defaultViewport: 'mobile1',
    },
  },
  play: async () => {
    // Simulate going offline on mobile
    Object.defineProperty(navigator, 'onLine', {
      writable: true,
      value: false,
    });
    window.dispatchEvent(new Event('offline'));
  },
};

export const DarkMode: Story = {
  args: {
    showSyncButton: true,
  },
  parameters: {
    backgrounds: {
      default: 'dark',
    },
  },
  play: async () => {
    // Simulate going offline in dark mode
    Object.defineProperty(navigator, 'onLine', {
      writable: true,
      value: false,
    });
    window.dispatchEvent(new Event('offline'));
  },
};

export const BackOnline: Story = {
  args: {
    showSyncButton: true,
  },
  parameters: {
    docs: {
      description: {
        story: 'Demonstrates coming back online and auto-sync behavior',
      },
    },
  },
  beforeEach: () => {
    // Add some sync queue items to demonstrate auto-sync
    localStorage.setItem('sync_queue', JSON.stringify([
      { id: '1', type: 'favorite', data: { termId: 'ai' }, timestamp: new Date().toISOString() },
    ]));
  },
  play: async () => {
    // Start offline
    Object.defineProperty(navigator, 'onLine', {
      writable: true,
      value: false,
    });
    window.dispatchEvent(new Event('offline'));
    
    // Come back online after 2 seconds
    setTimeout(() => {
      Object.defineProperty(navigator, 'onLine', {
        writable: true,
        value: true,
      });
      window.dispatchEvent(new Event('online'));
    }, 2000);
  },
};