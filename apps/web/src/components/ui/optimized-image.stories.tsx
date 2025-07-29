// @ts-nocheck

import type { Meta, StoryObj } from '@storybook/react';
import { OptimizedImage } from './optimized-image';

const meta: Meta<typeof OptimizedImage> = {
  title: 'UI Components/OptimizedImage',
  component: OptimizedImage,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: 'Reusable UI component for the AIGlossaryPro application.',
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
        story: 'Default OptimizedImage component state.',
      },
    },
  },
};

export const Loading: Story = {
  args: {
    loading: true,
    isLoading: true,
  },
  parameters: {
    docs: {
      description: {
        story: 'OptimizedImage in loading state.',
      },
    },
  },
};

export const Error: Story = {
  args: {
    error: 'Something went wrong',
    hasError: true,
  },
  parameters: {
    docs: {
      description: {
        story: 'OptimizedImage displaying error state.',
      },
    },
  },
};

export const Disabled: Story = {
  args: {
    disabled: true,
  },
  parameters: {
    docs: {
      description: {
        story: 'OptimizedImage in disabled state.',
      },
    },
  },
};

export const Small: Story = {
  args: {
    size: 'small',
  },
  parameters: {
    docs: {
      description: {
        story: 'Small variant of OptimizedImage.',
      },
    },
  },
};

export const Large: Story = {
  args: {
    size: 'large',
  },
  parameters: {
    docs: {
      description: {
        story: 'Large variant of OptimizedImage.',
      },
    },
  },
};
