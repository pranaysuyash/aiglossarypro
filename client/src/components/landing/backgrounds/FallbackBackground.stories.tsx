import type { Meta, StoryObj } from '@storybook/react';
import { FallbackBackground } from './FallbackBackground';

const meta: Meta<typeof FallbackBackground> = {
  title: 'Landing/FallbackBackground',
  component: FallbackBackground,
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
        story: 'Default FallbackBackground component state.',
      },
    },
  },
};

export const Loading: Story = {
  args: {
    className: 'animate-pulse',
  },
  parameters: {
    docs: {
      description: {
        story: 'FallbackBackground in loading state.',
      },
    },
  },
};

export const Error: Story = {
  args: {
    className: 'opacity-50 grayscale',
  },
  parameters: {
    docs: {
      description: {
        story: 'FallbackBackground displaying error state.',
      },
    },
  },
};
