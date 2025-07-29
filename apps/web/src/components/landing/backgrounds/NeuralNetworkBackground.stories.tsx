import type { Meta, StoryObj } from '@storybook/react';
import { NeuralNetworkBackground } from './NeuralNetworkBackground';

const meta: Meta<typeof NeuralNetworkBackground> = {
  title: 'Landing/NeuralNetworkBackground',
  component: NeuralNetworkBackground,
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
        story: 'Default NeuralNetworkBackground component state.',
      },
    },
  },
};

export const Loading: Story = {
  args: {
    className: 'animate-pulse',
    opacity: 0.5,
  },
  parameters: {
    docs: {
      description: {
        story: 'NeuralNetworkBackground in loading state.',
      },
    },
  },
};

export const Error: Story = {
  args: {
    className: 'opacity-50',
    opacity: 0.8,
  },
  parameters: {
    docs: {
      description: {
        story: 'NeuralNetworkBackground displaying error state.',
      },
    },
  },
};
