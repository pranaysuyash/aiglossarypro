import type { Meta, StoryObj } from '@storybook/react';
import { PremiumBadge } from './PremiumBadge';

const meta: Meta<typeof PremiumBadge> = {
  title: 'Core/PremiumBadge',
  component: PremiumBadge,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Badge component showing user premium status with different visual variants and conditional rendering.',
      },
    },
  },
  argTypes: {
    variant: {
      control: 'select',
      options: ['default', 'compact', 'icon-only'],
      description: 'Visual variant of the badge',
    },
    className: {
      control: 'text',
      description: 'Additional CSS classes',
    },
    showFreeStatus: {
      control: 'boolean',
      description: 'Whether to show badge for free users',
    },
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof PremiumBadge>;

// Mock the useAccess hook
const mockUseAccess = (accessStatus: any) => ({
  accessStatus,
});

export const PremiumDefault: Story = {
  args: {
    variant: 'default',
    showFreeStatus: false,
  },
  decorators: [
    Story => {
      // Mock premium access

      return <Story />;
    },
  ],
  parameters: {
    docs: {
      description: {
        story: 'Default premium badge with crown icon and full text.',
      },
    },
  },
};

export const PremiumCompact: Story = {
  args: {
    variant: 'compact',
    showFreeStatus: false,
  },
  decorators: [
    Story => {
      return <Story />;
    },
  ],
  parameters: {
    docs: {
      description: {
        story: 'Compact premium badge with minimal text.',
      },
    },
  },
};

export const PremiumIconOnly: Story = {
  args: {
    variant: 'icon-only',
    showFreeStatus: false,
  },
  decorators: [
    Story => {
      return <Story />;
    },
  ],
  parameters: {
    docs: {
      description: {
        story: 'Premium badge showing only the crown icon.',
      },
    },
  },
};

export const FreeUserDefault: Story = {
  args: {
    variant: 'default',
    showFreeStatus: true,
  },
  decorators: [
    Story => {
      // Mock free access

      return <Story />;
    },
  ],
  parameters: {
    docs: {
      description: {
        story: 'Default badge for free users when showFreeStatus is enabled.',
      },
    },
  },
};

export const FreeUserCompact: Story = {
  args: {
    variant: 'compact',
    showFreeStatus: true,
  },
  decorators: [
    Story => {
      return <Story />;
    },
  ],
  parameters: {
    docs: {
      description: {
        story: 'Compact badge for free users.',
      },
    },
  },
};

export const FreeUserIconOnly: Story = {
  args: {
    variant: 'icon-only',
    showFreeStatus: true,
  },
  decorators: [
    Story => {
      return <Story />;
    },
  ],
  parameters: {
    docs: {
      description: {
        story: 'Icon-only badge for free users showing star icon.',
      },
    },
  },
};

export const FreeUserHidden: Story = {
  args: {
    variant: 'default',
    showFreeStatus: false,
  },
  decorators: [
    Story => {
      return (
        <div className="p-4 border border-gray-200 rounded-lg">
          <p className="text-sm text-gray-600 mb-2">
            Free user with showFreeStatus=false (no badge should appear):
          </p>
          <Story />
          <p className="text-xs text-gray-500 mt-2">Badge is hidden for free users by default</p>
        </div>
      );
    },
  ],
  parameters: {
    docs: {
      description: {
        story: 'Free user with showFreeStatus=false - no badge is rendered.',
      },
    },
  },
};

export const NoAccessStatus: Story = {
  args: {
    variant: 'default',
    showFreeStatus: true,
  },
  decorators: [
    Story => {
      // Mock no access status

      return (
        <div className="p-4 border border-gray-200 rounded-lg">
          <p className="text-sm text-gray-600 mb-2">
            No access status available (no badge should appear):
          </p>
          <Story />
          <p className="text-xs text-gray-500 mt-2">
            Badge is hidden when access status is unavailable
          </p>
        </div>
      );
    },
  ],
  parameters: {
    docs: {
      description: {
        story: 'When access status is unavailable, no badge is rendered.',
      },
    },
  },
};

export const AllVariants: Story = {
  decorators: [
    Story => {
      return (
        <div className="space-y-6">
          <div className="space-y-3">
            <h3 className="text-lg font-semibold">Premium User Badges</h3>
            <div className="flex flex-wrap gap-4 items-center">
              <PremiumBadge variant="default" />
              <PremiumBadge variant="compact" />
              <PremiumBadge variant="icon-only" />
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="text-lg font-semibold">Free User Badges (with showFreeStatus)</h3>
            <div className="flex flex-wrap gap-4 items-center">
              <PremiumBadge variant="default" showFreeStatus={true} />
              <PremiumBadge variant="compact" showFreeStatus={true} />
              <PremiumBadge variant="icon-only" showFreeStatus={true} />
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="text-lg font-semibold">Custom Styling</h3>
            <div className="flex flex-wrap gap-4 items-center">
              <PremiumBadge variant="default" className="text-lg" />
              <PremiumBadge variant="compact" className="border-2 border-yellow-300" />
              <PremiumBadge variant="icon-only" className="text-yellow-600" />
            </div>
          </div>
        </div>
      );
    },
  ],
  parameters: {
    docs: {
      description: {
        story: 'Showcase of all badge variants and customization options.',
      },
    },
  },
};

export const InContext: Story = {
  decorators: [
    Story => {
      return (
        <div className="space-y-6">
          {/* In a user profile card */}
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">User Profile</h3>
              <PremiumBadge variant="compact" />
            </div>
            <div className="space-y-2">
              <p className="text-sm text-gray-600">John Doe</p>
              <p className="text-sm text-gray-600">john.doe@example.com</p>
              <p className="text-sm text-gray-600">Member since January 2024</p>
            </div>
          </div>

          {/* In a header */}
          <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white p-4 rounded-lg">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold">AI/ML Glossary Pro</h2>
              <PremiumBadge variant="icon-only" className="text-yellow-300" />
            </div>
          </div>

          {/* In a list item */}
          <div className="space-y-2">
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
              <span>Dashboard Access</span>
              <PremiumBadge variant="compact" />
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
              <span>Advanced Features</span>
              <PremiumBadge variant="compact" />
            </div>
          </div>
        </div>
      );
    },
  ],
  parameters: {
    docs: {
      description: {
        story: 'Premium badge used in various UI contexts like profile cards, headers, and lists.',
      },
    },
  },
};

export const DarkMode: Story = {
  args: {
    variant: 'default',
    showFreeStatus: false,
  },
  decorators: [
    Story => {
      return (
        <div className="dark bg-gray-900 p-6 rounded-lg">
          <div className="space-y-4">
            <h3 className="text-white text-lg font-semibold">Dark Mode Badges</h3>
            <div className="flex flex-wrap gap-4 items-center">
              <PremiumBadge variant="default" />
              <PremiumBadge variant="compact" />
              <PremiumBadge variant="icon-only" />
            </div>
          </div>
        </div>
      );
    },
  ],
  parameters: {
    docs: {
      description: {
        story: 'Premium badge in dark mode with proper contrast and styling.',
      },
    },
  },
};
