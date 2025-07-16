import type { Meta, StoryObj } from '@storybook/react';
import { Skeleton } from './skeleton';

const meta: Meta<typeof Skeleton> = {
  title: 'UI/Skeleton',
  component: Skeleton,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'A skeleton loader component used to show loading states with animated placeholders.',
      },
    },
  },
  decorators: [
    Story => (
      <div className="w-full max-w-md p-4">
        <Story />
      </div>
    ),
  ],
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => <Skeleton className="h-4 w-[250px]" />,
  parameters: {
    docs: {
      description: {
        story: 'Default skeleton with standard dimensions.',
      },
    },
  },
};

export const Circle: Story = {
  render: () => <Skeleton className="h-12 w-12 rounded-full" />,
  parameters: {
    docs: {
      description: {
        story: 'Circular skeleton for avatar placeholders.',
      },
    },
  },
};

export const Rectangle: Story = {
  render: () => <Skeleton className="h-4 w-full" />,
  parameters: {
    docs: {
      description: {
        story: 'Rectangular skeleton for text lines.',
      },
    },
  },
};

export const CardSkeleton: Story = {
  render: () => (
    <div className="flex items-center space-x-4">
      <Skeleton className="h-12 w-12 rounded-full" />
      <div className="space-y-2">
        <Skeleton className="h-4 w-[250px]" />
        <Skeleton className="h-4 w-[200px]" />
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Skeleton pattern for a user card with avatar and text.',
      },
    },
  },
};

export const ArticleSkeleton: Story = {
  render: () => (
    <div className="w-full space-y-3">
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-4 w-1/2" />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Skeleton pattern for article or paragraph text.',
      },
    },
  },
};

export const ImageSkeleton: Story = {
  render: () => <Skeleton className="h-48 w-full rounded-lg" />,
  parameters: {
    docs: {
      description: {
        story: 'Skeleton for image placeholders.',
      },
    },
  },
};

export const ButtonSkeleton: Story = {
  render: () => (
    <div className="flex space-x-2">
      <Skeleton className="h-10 w-20" />
      <Skeleton className="h-10 w-24" />
      <Skeleton className="h-10 w-16" />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Skeleton placeholders for buttons.',
      },
    },
  },
};

export const ListSkeleton: Story = {
  render: () => (
    <div className="space-y-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="flex items-center space-x-4">
          <Skeleton className="h-10 w-10 rounded-full" />
          <div className="space-y-2 flex-1">
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-4/5" />
          </div>
          <Skeleton className="h-8 w-16" />
        </div>
      ))}
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Skeleton pattern for a list of items.',
      },
    },
  },
};

export const TableSkeleton: Story = {
  render: () => (
    <div className="w-full space-y-4">
      {/* Header */}
      <div className="flex space-x-4">
        <Skeleton className="h-4 w-1/4" />
        <Skeleton className="h-4 w-1/4" />
        <Skeleton className="h-4 w-1/4" />
        <Skeleton className="h-4 w-1/4" />
      </div>

      {/* Rows */}
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex space-x-4">
          <Skeleton className="h-3 w-1/4" />
          <Skeleton className="h-3 w-1/4" />
          <Skeleton className="h-3 w-1/4" />
          <Skeleton className="h-3 w-1/4" />
        </div>
      ))}
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Skeleton pattern for table data.',
      },
    },
  },
};

export const FormSkeleton: Story = {
  render: () => (
    <div className="space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-10 w-full" />
      </div>

      <div className="space-y-2">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-10 w-full" />
      </div>

      <div className="space-y-2">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-24 w-full" />
      </div>

      <div className="flex space-x-2">
        <Skeleton className="h-10 w-20" />
        <Skeleton className="h-10 w-16" />
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Skeleton pattern for form fields and controls.',
      },
    },
  },
};

export const DashboardSkeleton: Story = {
  render: () => (
    <div className="w-full space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-10 w-24" />
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="p-4 border rounded-lg space-y-3">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-8 w-16" />
            <Skeleton className="h-3 w-32" />
          </div>
        ))}
      </div>

      {/* Chart */}
      <div className="border rounded-lg p-4">
        <Skeleton className="h-4 w-32 mb-4" />
        <Skeleton className="h-64 w-full" />
      </div>

      {/* Table */}
      <div className="border rounded-lg p-4 space-y-4">
        <Skeleton className="h-4 w-24" />
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex space-x-4">
              <Skeleton className="h-3 w-1/4" />
              <Skeleton className="h-3 w-1/4" />
              <Skeleton className="h-3 w-1/4" />
              <Skeleton className="h-3 w-1/4" />
            </div>
          ))}
        </div>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Complex skeleton pattern for a dashboard layout.',
      },
    },
  },
};

export const DifferentSizes: Story = {
  render: () => (
    <div className="space-y-4">
      <div className="space-y-2">
        <p className="text-sm text-gray-600">Extra Small</p>
        <Skeleton className="h-2 w-full" />
      </div>

      <div className="space-y-2">
        <p className="text-sm text-gray-600">Small</p>
        <Skeleton className="h-3 w-full" />
      </div>

      <div className="space-y-2">
        <p className="text-sm text-gray-600">Medium (Default)</p>
        <Skeleton className="h-4 w-full" />
      </div>

      <div className="space-y-2">
        <p className="text-sm text-gray-600">Large</p>
        <Skeleton className="h-6 w-full" />
      </div>

      <div className="space-y-2">
        <p className="text-sm text-gray-600">Extra Large</p>
        <Skeleton className="h-8 w-full" />
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Skeletons in different heights for various use cases.',
      },
    },
  },
};

export const CustomShape: Story = {
  render: () => (
    <div className="flex space-x-4 items-end">
      <Skeleton className="h-16 w-4" />
      <Skeleton className="h-24 w-4" />
      <Skeleton className="h-20 w-4" />
      <Skeleton className="h-32 w-4" />
      <Skeleton className="h-12 w-4" />
      <Skeleton className="h-28 w-4" />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Custom shaped skeletons resembling a bar chart.',
      },
    },
  },
};

export const DarkMode: Story = {
  render: () => (
    <div className="space-y-4">
      <div className="flex items-center space-x-4">
        <Skeleton className="h-12 w-12 rounded-full" />
        <div className="space-y-2">
          <Skeleton className="h-4 w-[250px]" />
          <Skeleton className="h-4 w-[200px]" />
        </div>
      </div>

      <div className="space-y-2">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
      </div>

      <Skeleton className="h-48 w-full rounded-lg" />
    </div>
  ),
  parameters: {
    backgrounds: {
      default: 'dark',
    },
    docs: {
      description: {
        story: 'Skeleton components in dark mode theme.',
      },
    },
  },
  decorators: [
    Story => (
      <div className="w-full max-w-md p-4 dark">
        <Story />
      </div>
    ),
  ],
};
