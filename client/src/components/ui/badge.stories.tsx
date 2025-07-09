import type { Meta, StoryObj } from '@storybook/react';
import { Badge } from './badge';

const meta: Meta<typeof Badge> = {
  title: 'UI/Badge',
  component: Badge,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'A versatile badge component for displaying status, categories, counts, and other short pieces of information.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: { type: 'select' },
      options: ['default', 'secondary', 'destructive', 'outline'],
      description: 'The visual style variant of the badge',
    },
    children: {
      control: { type: 'text' },
      description: 'The content of the badge',
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    children: 'Badge',
  },
  parameters: {
    docs: {
      description: {
        story: 'Default badge with primary styling.',
      },
    },
  },
};

export const Secondary: Story = {
  args: {
    variant: 'secondary',
    children: 'Secondary',
  },
  parameters: {
    docs: {
      description: {
        story: 'Secondary variant with subtle styling.',
      },
    },
  },
};

export const Destructive: Story = {
  args: {
    variant: 'destructive',
    children: 'Error',
  },
  parameters: {
    docs: {
      description: {
        story: 'Destructive variant for errors or warnings.',
      },
    },
  },
};

export const Outline: Story = {
  args: {
    variant: 'outline',
    children: 'Outline',
  },
  parameters: {
    docs: {
      description: {
        story: 'Outline variant with transparent background.',
      },
    },
  },
};

export const WithNumbers: Story = {
  args: {
    children: '42',
  },
  parameters: {
    docs: {
      description: {
        story: 'Badge displaying numeric content.',
      },
    },
  },
};

export const StatusBadges: Story = {
  render: () => (
    <div className="flex flex-wrap gap-2">
      <Badge variant="default">Active</Badge>
      <Badge variant="secondary">Draft</Badge>
      <Badge variant="destructive">Archived</Badge>
      <Badge variant="outline">Pending</Badge>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Collection of badges showing different status states.',
      },
    },
  },
};

export const CategoryBadges: Story = {
  render: () => (
    <div className="flex flex-wrap gap-2">
      <Badge>Machine Learning</Badge>
      <Badge variant="secondary">Deep Learning</Badge>
      <Badge variant="outline">AI Ethics</Badge>
      <Badge>Computer Vision</Badge>
      <Badge variant="secondary">NLP</Badge>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Badges used for categorizing content.',
      },
    },
  },
};

export const WithEmoji: Story = {
  args: {
    children: '🔥 Hot',
  },
  parameters: {
    docs: {
      description: {
        story: 'Badge with emoji for enhanced visual appeal.',
      },
    },
  },
};

export const LongText: Story = {
  args: {
    children: 'Very Long Badge Text',
    variant: 'outline',
  },
  parameters: {
    docs: {
      description: {
        story: 'Badge with longer text content to test text handling.',
      },
    },
  },
};

export const Interactive: Story = {
  args: {
    children: 'Clickable',
    className: 'cursor-pointer hover:scale-105 transition-transform',
    onClick: () => alert('Badge clicked!'),
  },
  parameters: {
    docs: {
      description: {
        story: 'Interactive badge that can be clicked.',
      },
    },
  },
};

export const DarkMode: Story = {
  args: {
    children: 'Dark Mode',
  },
  parameters: {
    backgrounds: {
      default: 'dark',
    },
    docs: {
      description: {
        story: 'Badge appearance in dark mode.',
      },
    },
  },
  decorators: [
    (Story) => (
      <div className="dark">
        <Story />
      </div>
    ),
  ],
};

export const AllVariantsComparison: Story = {
  render: () => (
    <div className="space-y-4">
      <div className="space-y-2">
        <h3 className="text-sm font-medium">Light Mode</h3>
        <div className="flex flex-wrap gap-2">
          <Badge variant="default">Default</Badge>
          <Badge variant="secondary">Secondary</Badge>
          <Badge variant="destructive">Destructive</Badge>
          <Badge variant="outline">Outline</Badge>
        </div>
      </div>
      <div className="space-y-2 dark">
        <h3 className="text-sm font-medium">Dark Mode</h3>
        <div className="flex flex-wrap gap-2">
          <Badge variant="default">Default</Badge>
          <Badge variant="secondary">Secondary</Badge>
          <Badge variant="destructive">Destructive</Badge>
          <Badge variant="outline">Outline</Badge>
        </div>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Comparison of all badge variants in both light and dark modes.',
      },
    },
  },
};
