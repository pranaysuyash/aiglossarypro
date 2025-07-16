import type { Meta, StoryObj } from '@storybook/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: false, staleTime: Infinity },
  },
});

import { QualityEvaluationDashboard } from './QualityEvaluationDashboard';

const meta: Meta<typeof QualityEvaluationDashboard> = {
  title: 'Admin/QualityEvaluationDashboard',
  component: QualityEvaluationDashboard,
  decorators: [
    Story => (
      <QueryClientProvider client={queryClient}>
        <Story />
      </QueryClientProvider>
    ),
  ],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: 'Administrative dashboard component for the AIGlossaryPro application.',
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
        story: 'Default QualityEvaluationDashboard component state.',
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
        story: 'QualityEvaluationDashboard in loading state.',
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
        story: 'QualityEvaluationDashboard displaying error state.',
      },
    },
  },
};

export const WithPermissions: Story = {
  parameters: {
    docs: {
      description: {
        story: 'QualityEvaluationDashboard with full admin permissions.',
      },
    },
  },
};
