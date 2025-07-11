import type { Meta, StoryObj } from '@storybook/react';
import { AdBlockDetector } from './AdBlockDetector';

const meta: Meta<typeof AdBlockDetector> = {
  title: 'Components/Ads/AdBlockDetector',
  component: AdBlockDetector,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: 'Detects ad blockers and shows appropriate messaging to encourage whitelisting or premium upgrade.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    onDetected: {
      action: 'onDetected',
      description: 'Callback when ad blocker is detected',
    },
    showUpgradePrompt: {
      control: 'boolean',
      description: 'Whether to show the premium upgrade prompt',
    },
    className: {
      control: 'text',
      description: 'Additional CSS classes',
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    showUpgradePrompt: true,
  },
  parameters: {
    docs: {
      description: {
        story: 'Default ad block detector with full upgrade prompt.',
      },
    },
  },
};

export const WithCallback: Story = {
  args: {
    showUpgradePrompt: true,
    onDetected: (isBlocked: boolean) => {
      console.log('Ad blocker detected:', isBlocked);
    },
  },
  parameters: {
    docs: {
      description: {
        story: 'Ad block detector with detection callback for analytics.',
      },
    },
  },
};

export const NoUpgradePrompt: Story = {
  args: {
    showUpgradePrompt: false,
  },
  parameters: {
    docs: {
      description: {
        story: 'Ad block detector without showing upgrade prompt - only detection.',
      },
    },
  },
};

export const CustomStyling: Story = {
  args: {
    showUpgradePrompt: true,
    className: 'my-custom-detector',
  },
  parameters: {
    docs: {
      description: {
        story: 'Ad block detector with custom CSS classes.',
      },
    },
  },
};