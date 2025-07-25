import type { Meta, StoryObj } from '@storybook/react';
import { PricingCountdown } from './PricingCountdown';

const meta: Meta<typeof PricingCountdown> = {
  title: 'Landing/PricingCountdown',
  component: PricingCountdown,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: 'Landing page marketing component for the AIGlossaryPro application.',
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

export const Default: Story = {
  parameters: {
    docs: {
      description: {
        story: 'Default PricingCountdown component state.',
      },
    },
  },
};

export const Loading: Story = {
  args: {},
  parameters: {
    docs: {
      description: {
        story: 'PricingCountdown in loading state.',
      },
    },
  },
};

export const Error: Story = {
  args: {},
  parameters: {
    docs: {
      description: {
        story: 'PricingCountdown displaying error state.',
      },
    },
  },
};
