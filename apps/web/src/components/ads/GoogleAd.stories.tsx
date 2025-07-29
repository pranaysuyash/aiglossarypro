import type { Meta, StoryObj } from '@storybook/react';
import GoogleAd from './GoogleAd';

const meta: Meta<typeof GoogleAd> = {
  title: 'Components/Ads/GoogleAd',
  component: GoogleAd,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Google AdSense ad component with support for various formats, lazy loading, and premium user exclusion.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    slot: {
      control: 'text',
      description: 'AdSense ad slot ID',
    },
    format: {
      control: 'select',
      options: ['auto', 'fluid', 'rectangle', 'vertical', 'horizontal'],
      description: 'Ad format type',
    },
    responsive: {
      control: 'boolean',
      description: 'Whether the ad should be responsive',
    },
    lazy: {
      control: 'boolean',
      description: 'Whether to lazy load the ad',
    },
    className: {
      control: 'text',
      description: 'Additional CSS classes',
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Rectangle: Story = {
  args: {
    slot: '1234567890',
    format: 'rectangle',
    responsive: true,
    lazy: false,
  },
  parameters: {
    docs: {
      description: {
        story: 'Standard 300x250 rectangle ad format, commonly used in content areas.',
      },
    },
  },
};

export const Responsive: Story = {
  args: {
    slot: '0987654321',
    format: 'auto',
    responsive: true,
    lazy: false,
  },
  parameters: {
    docs: {
      description: {
        story: 'Auto-sizing responsive ad that adapts to container width.',
      },
    },
  },
};

export const Horizontal: Story = {
  args: {
    slot: '1122334455',
    format: 'horizontal',
    responsive: true,
    lazy: false,
  },
  parameters: {
    docs: {
      description: {
        story:
          'Horizontal banner ad (728x90), typically used in headers or between content sections.',
      },
    },
  },
};

export const Vertical: Story = {
  args: {
    slot: '5544332211',
    format: 'vertical',
    responsive: false,
    lazy: false,
  },
  parameters: {
    docs: {
      description: {
        story: 'Vertical skyscraper ad (160x600), commonly used in sidebars.',
      },
    },
  },
};

export const LazyLoading: Story = {
  args: {
    slot: '9988776655',
    format: 'rectangle',
    responsive: true,
    lazy: true,
  },
  parameters: {
    docs: {
      description: {
        story: 'Ad with lazy loading enabled - will only load when scrolled into view.',
      },
    },
  },
};

export const Disabled: Story = {
  args: {
    slot: '',
    format: 'rectangle',
    responsive: true,
    lazy: false,
  },
  parameters: {
    docs: {
      description: {
        story: 'Ad component when disabled (empty slot) - should render nothing.',
      },
    },
  },
};

export const DevelopmentMode: Story = {
  args: {
    slot: '1234567890',
    format: 'rectangle',
    responsive: true,
    lazy: false,
  },
  parameters: {
    docs: {
      description: {
        story: 'Ad in development mode with test ads enabled.',
      },
    },
  },
};
