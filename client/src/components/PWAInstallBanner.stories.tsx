import type { Meta, StoryObj } from '@storybook/react';
import { PWAInstallBanner } from './PWAInstallBanner';

const meta: Meta<typeof PWAInstallBanner> = {
  title: 'Components/PWAInstallBanner',
  component: PWAInstallBanner,
  parameters: {
    layout: 'fullscreen',
    viewport: {
      defaultViewport: 'mobile1',
    },
    docs: {
      description: {
        component: 'PWA installation banner that appears after 3+ mobile visits or offline events, with native install prompt support',
      },
    },
  },
  argTypes: {
    onInstall: { action: 'app installed' },
    onDismiss: { action: 'banner dismissed' },
  },
  decorators: [
    (Story) => (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4">
        <div className="max-w-md mx-auto space-y-4">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">AI Glossary Pro</h1>
          <p className="text-gray-600 dark:text-gray-400">
            The PWA install banner will appear at the bottom of the screen.
          </p>
          
          {/* Sample content */}
          {Array.from({ length: 10 }, (_, i) => (
            <div key={i} className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
              <h3 className="font-semibold text-gray-900 dark:text-gray-100">Neural Network</h3>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                A computing system inspired by biological neural networks...
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
type Story = StoryObj<typeof PWAInstallBanner>;

export const Default: Story = {
  args: {
    showOnlyOnMobile: true,
  },
  beforeEach: () => {
    // Set up conditions for banner to show
    localStorage.setItem('mobile_visits', '3');
  },
};

export const OfflineTrigger: Story = {
  args: {
    showOnlyOnMobile: true,
  },
  parameters: {
    docs: {
      description: {
        story: 'Banner triggered by offline event - emphasizes offline functionality',
      },
    },
  },
  beforeEach: () => {
    localStorage.setItem('mobile_visits', '3');
  },
  play: async () => {
    // Simulate offline event after a delay
    setTimeout(() => {
      window.dispatchEvent(new Event('offline'));
    }, 1000);
  },
};

export const NativePromptAvailable: Story = {
  args: {
    showOnlyOnMobile: true,
  },
  parameters: {
    docs: {
      description: {
        story: 'Banner with native browser install prompt available',
      },
    },
  },
  beforeEach: () => {
    localStorage.setItem('mobile_visits', '3');
  },
  play: async () => {
    // Simulate beforeinstallprompt event
    setTimeout(() => {
      const event = new Event('beforeinstallprompt') as any;
      event.prompt = async () => Promise.resolve();
      event.userChoice = Promise.resolve({ outcome: 'accepted', platform: 'web' });
      window.dispatchEvent(event);
    }, 1000);
  },
};

export const AlwaysVisible: Story = {
  args: {
    showOnlyOnMobile: false,
  },
  parameters: {
    docs: {
      description: {
        story: 'Banner visible on all device types',
      },
    },
  },
  beforeEach: () => {
    localStorage.setItem('mobile_visits', '3');
  },
};

export const TabletView: Story = {
  args: {
    showOnlyOnMobile: false,
  },
  parameters: {
    viewport: {
      defaultViewport: 'tablet',
    },
  },
  beforeEach: () => {
    localStorage.setItem('mobile_visits', '3');
  },
};

export const DesktopView: Story = {
  args: {
    showOnlyOnMobile: false,
  },
  parameters: {
    viewport: {
      defaultViewport: 'desktop',
    },
  },
  beforeEach: () => {
    localStorage.setItem('mobile_visits', '3');
  },
};

export const DarkMode: Story = {
  args: {
    showOnlyOnMobile: true,
  },
  parameters: {
    backgrounds: {
      default: 'dark',
    },
  },
  beforeEach: () => {
    localStorage.setItem('mobile_visits', '3');
  },
};

export const FirstVisit: Story = {
  args: {
    showOnlyOnMobile: true,
  },
  parameters: {
    docs: {
      description: {
        story: 'User with only 1 visit - banner should not appear',
      },
    },
  },
  beforeEach: () => {
    localStorage.setItem('mobile_visits', '1');
  },
};

export const RecentlyDismissed: Story = {
  args: {
    showOnlyOnMobile: true,
  },
  parameters: {
    docs: {
      description: {
        story: 'User who recently dismissed the banner - should not appear',
      },
    },
  },
  beforeEach: () => {
    localStorage.setItem('mobile_visits', '5');
    localStorage.setItem('pwa_install_dismissed', new Date().toISOString());
  },
};