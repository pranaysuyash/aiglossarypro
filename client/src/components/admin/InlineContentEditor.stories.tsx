import type { Meta, StoryObj } from '@storybook/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: false, staleTime: Infinity },
  },
});

import { InlineContentEditor } from './InlineContentEditor';

const meta: Meta<typeof InlineContentEditor> = {
  title: 'Admin/InlineContentEditor',
  component: InlineContentEditor,
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
        story: 'Default InlineContentEditor component state.',
      },
    },
  },
};

export const Loading: Story = {
  args: {
    content: 'Loading content...',
    termId: 'loading-term',
    termName: 'Loading Term',
    sectionName: 'loading-section',
    sectionLabel: 'Loading Section',
    onSave: async () => {},
  },
  parameters: {
    docs: {
      description: {
        story: 'InlineContentEditor in loading state.',
      },
    },
  },
};

export const Error: Story = {
  args: {
    content: 'Error loading content...',
    termId: 'error-term',
    termName: 'Error Term',
    sectionName: 'error-section',
    sectionLabel: 'Error Section',
    onSave: async () => {
      return Promise.reject('Something went wrong');
    },
  },
  parameters: {
    docs: {
      description: {
        story: 'InlineContentEditor displaying error state.',
      },
    },
  },
};

export const WithPermissions: Story = {
  parameters: {
    docs: {
      description: {
        story: 'InlineContentEditor with full admin permissions.',
      },
    },
  },
};
