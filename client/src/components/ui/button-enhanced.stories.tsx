import type { Meta, StoryObj } from '@storybook/react';
import { Button } from './button';
import { Heart, Download, Search, Settings, Plus, Trash2 } from 'lucide-react';

// Mock function for actions
const fn = () => () => {};

const meta: Meta<typeof Button> = {
  title: 'UI/Button Enhanced',
  component: Button,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'A versatile button component with multiple variants, sizes, and states.',
      },
    },
  },
  decorators: [
    (Story) => (
      <div className="p-4">
        <Story />
      </div>
    ),
  ],
  args: {
    onClick: fn(),
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const AllVariants: Story = {
  render: () => (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
      <Button variant="default">Default</Button>
      <Button variant="destructive">Destructive</Button>
      <Button variant="outline">Outline</Button>
      <Button variant="secondary">Secondary</Button>
      <Button variant="ghost">Ghost</Button>
      <Button variant="link">Link</Button>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'All available button variants displayed together.',
      },
    },
  },
};

export const AllSizes: Story = {
  render: () => (
    <div className="flex flex-col gap-4 items-start">
      <Button size="sm">Small</Button>
      <Button size="default">Default</Button>
      <Button size="lg">Large</Button>
      <Button size="icon"><Plus className="h-4 w-4" /></Button>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'All available button sizes including icon-only button.',
      },
    },
  },
};

export const WithIcons: Story = {
  render: () => (
    <div className="grid grid-cols-2 gap-4">
      <Button>
        <Heart className="mr-2 h-4 w-4" />
        Favorite
      </Button>
      <Button variant="outline">
        <Download className="mr-2 h-4 w-4" />
        Download
      </Button>
      <Button variant="secondary">
        <Search className="mr-2 h-4 w-4" />
        Search
      </Button>
      <Button variant="destructive">
        <Trash2 className="mr-2 h-4 w-4" />
        Delete
      </Button>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Buttons with icons to demonstrate icon integration.',
      },
    },
  },
};

export const IconOnly: Story = {
  render: () => (
    <div className="flex gap-2">
      <Button size="icon" variant="default">
        <Heart className="h-4 w-4" />
      </Button>
      <Button size="icon" variant="outline">
        <Settings className="h-4 w-4" />
      </Button>
      <Button size="icon" variant="ghost">
        <Plus className="h-4 w-4" />
      </Button>
      <Button size="icon" variant="destructive">
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Icon-only buttons with different variants.',
      },
    },
  },
};

export const States: Story = {
  render: () => (
    <div className="grid grid-cols-2 gap-4">
      <Button>Normal</Button>
      <Button disabled>Disabled</Button>
      <Button variant="outline">Normal Outline</Button>
      <Button variant="outline" disabled>Disabled Outline</Button>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Button states including disabled state.',
      },
    },
  },
};

export const Loading: Story = {
  render: () => (
    <div className="grid grid-cols-2 gap-4">
      <Button disabled>
        <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"></div>
        Loading...
      </Button>
      <Button variant="outline" disabled>
        <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"></div>
        Processing
      </Button>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Buttons in loading state with spinner animation.',
      },
    },
  },
};

export const LongText: Story = {
  render: () => (
    <div className="max-w-xs space-y-2">
      <Button className="w-full">
        This is a very long button text that might wrap
      </Button>
      <Button variant="outline" className="w-full">
        Another long text to test button wrapping behavior
      </Button>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Buttons with long text to test text wrapping.',
      },
    },
  },
};

export const FullWidth: Story = {
  render: () => (
    <div className="w-full max-w-md space-y-2">
      <Button className="w-full">Full Width Default</Button>
      <Button variant="outline" className="w-full">Full Width Outline</Button>
      <Button variant="secondary" className="w-full">Full Width Secondary</Button>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Full-width buttons for form layouts.',
      },
    },
  },
};

export const AsChild: Story = {
  render: () => (
    <div className="space-y-2">
      <Button asChild>
        <a href="#" className="inline-block">
          Link Button
        </a>
      </Button>
      <Button variant="outline" asChild>
        <a href="#" className="inline-block">
          Outline Link
        </a>
      </Button>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Buttons rendered as links using the asChild prop.',
      },
    },
  },
};

export const DarkMode: Story = {
  render: () => (
    <div className="grid grid-cols-2 gap-4">
      <Button>Default Dark</Button>
      <Button variant="outline">Outline Dark</Button>
      <Button variant="secondary">Secondary Dark</Button>
      <Button variant="ghost">Ghost Dark</Button>
    </div>
  ),
  parameters: {
    backgrounds: {
      default: 'dark',
    },
    docs: {
      description: {
        story: 'Buttons in dark mode theme.',
      },
    },
  },
  decorators: [
    (Story) => (
      <div className="p-4 dark">
        <Story />
      </div>
    ),
  ],
}; 