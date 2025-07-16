// @ts-nocheck

import type { Meta, StoryObj } from '@storybook/react';
import {
  Activity,
  AlertCircle,
  Book,
  Heart,
  iconSizes,
  Search,
  Settings,
  Star,
  User,
} from './icons';

const meta: Meta<typeof iconSizes> = {
  title: 'UI Components/Icons',
  component: iconSizes,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: 'Centralized icon system with consistent sizing and styling.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    // Add argTypes based on component props
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const IconSizes: Story = {
  render: () => (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Available Icon Sizes</h3>
      <div className="grid grid-cols-4 gap-4">
        <div className="flex flex-col items-center space-y-2">
          <Activity size={iconSizes.xs} />
          <span className="text-sm">XS ({iconSizes.xs}px)</span>
        </div>
        <div className="flex flex-col items-center space-y-2">
          <Activity size={iconSizes.sm} />
          <span className="text-sm">SM ({iconSizes.sm}px)</span>
        </div>
        <div className="flex flex-col items-center space-y-2">
          <Activity size={iconSizes.md} />
          <span className="text-sm">MD ({iconSizes.md}px)</span>
        </div>
        <div className="flex flex-col items-center space-y-2">
          <Activity size={iconSizes.lg} />
          <span className="text-sm">LG ({iconSizes.lg}px)</span>
        </div>
        <div className="flex flex-col items-center space-y-2">
          <Activity size={iconSizes.xl} />
          <span className="text-sm">XL ({iconSizes.xl}px)</span>
        </div>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Available icon sizes from the centralized icon system.',
      },
    },
  },
};

export const CommonIcons: Story = {
  render: () => (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Common Icons</h3>
      <div className="grid grid-cols-6 gap-4">
        <div className="flex flex-col items-center space-y-2">
          <Activity size={iconSizes.lg} />
          <span className="text-sm">Activity</span>
        </div>
        <div className="flex flex-col items-center space-y-2">
          <AlertCircle size={iconSizes.lg} />
          <span className="text-sm">AlertCircle</span>
        </div>
        <div className="flex flex-col items-center space-y-2">
          <Book size={iconSizes.lg} />
          <span className="text-sm">Book</span>
        </div>
        <div className="flex flex-col items-center space-y-2">
          <Heart size={iconSizes.lg} />
          <span className="text-sm">Heart</span>
        </div>
        <div className="flex flex-col items-center space-y-2">
          <Star size={iconSizes.lg} />
          <span className="text-sm">Star</span>
        </div>
        <div className="flex flex-col items-center space-y-2">
          <Settings size={iconSizes.lg} />
          <span className="text-sm">Settings</span>
        </div>
        <div className="flex flex-col items-center space-y-2">
          <Search size={iconSizes.lg} />
          <span className="text-sm">Search</span>
        </div>
        <div className="flex flex-col items-center space-y-2">
          <User size={iconSizes.lg} />
          <span className="text-sm">User</span>
        </div>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Commonly used icons from the centralized icon system.',
      },
    },
  },
};

export const ColoredIcons: Story = {
  render: () => (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Colored Icons</h3>
      <div className="grid grid-cols-6 gap-4">
        <div className="flex flex-col items-center space-y-2">
          <Activity size={iconSizes.lg} className="text-blue-500" />
          <span className="text-sm">Blue</span>
        </div>
        <div className="flex flex-col items-center space-y-2">
          <Heart size={iconSizes.lg} className="text-red-500" />
          <span className="text-sm">Red</span>
        </div>
        <div className="flex flex-col items-center space-y-2">
          <Star size={iconSizes.lg} className="text-yellow-500" />
          <span className="text-sm">Yellow</span>
        </div>
        <div className="flex flex-col items-center space-y-2">
          <Book size={iconSizes.lg} className="text-green-500" />
          <span className="text-sm">Green</span>
        </div>
        <div className="flex flex-col items-center space-y-2">
          <Settings size={iconSizes.lg} className="text-purple-500" />
          <span className="text-sm">Purple</span>
        </div>
        <div className="flex flex-col items-center space-y-2">
          <AlertCircle size={iconSizes.lg} className="text-orange-500" />
          <span className="text-sm">Orange</span>
        </div>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Icons with different colors applied via Tailwind classes.',
      },
    },
  },
};

export const DisabledState: Story = {
  render: () => (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Disabled State</h3>
      <div className="grid grid-cols-4 gap-4">
        <div className="flex flex-col items-center space-y-2 opacity-50">
          <Activity size={iconSizes.lg} />
          <span className="text-sm">Activity</span>
        </div>
        <div className="flex flex-col items-center space-y-2 opacity-50">
          <Book size={iconSizes.lg} />
          <span className="text-sm">Book</span>
        </div>
        <div className="flex flex-col items-center space-y-2 opacity-50">
          <Settings size={iconSizes.lg} />
          <span className="text-sm">Settings</span>
        </div>
        <div className="flex flex-col items-center space-y-2 opacity-50">
          <User size={iconSizes.lg} />
          <span className="text-sm">User</span>
        </div>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Icons in disabled state with reduced opacity.',
      },
    },
  },
};

export const SmallIcons: Story = {
  render: () => (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Small Icons</h3>
      <div className="grid grid-cols-8 gap-4">
        <Activity size={iconSizes.sm} />
        <AlertCircle size={iconSizes.sm} />
        <Book size={iconSizes.sm} />
        <Heart size={iconSizes.sm} />
        <Star size={iconSizes.sm} />
        <Settings size={iconSizes.sm} />
        <Search size={iconSizes.sm} />
        <User size={iconSizes.sm} />
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Small variant of icons using iconSizes.sm.',
      },
    },
  },
};

export const LargeIcons: Story = {
  render: () => (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Large Icons</h3>
      <div className="grid grid-cols-4 gap-4">
        <Activity size={iconSizes.xl} />
        <AlertCircle size={iconSizes.xl} />
        <Book size={iconSizes.xl} />
        <Heart size={iconSizes.xl} />
        <Star size={iconSizes.xl} />
        <Settings size={iconSizes.xl} />
        <Search size={iconSizes.xl} />
        <User size={iconSizes.xl} />
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Large variant of icons using iconSizes.xl.',
      },
    },
  },
};
