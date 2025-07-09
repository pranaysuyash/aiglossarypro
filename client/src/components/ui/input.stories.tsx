import type { Meta, StoryObj } from '@storybook/react';
import { Input } from './input';
import { Label } from './label';

// Mock function for actions
const fn = () => () => {};

const meta: Meta<typeof Input> = {
  title: 'UI/Input',
  component: Input,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'A customizable input component with various states and styles.',
      },
    },
  },
  decorators: [
    (Story) => (
      <div className="w-full max-w-sm p-4">
        <Story />
      </div>
    ),
  ],
  args: {
    onChange: fn(),
    onBlur: fn(),
    onFocus: fn(),
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    placeholder: 'Enter text...',
  },
  parameters: {
    docs: {
      description: {
        story: 'Default input with placeholder text.',
      },
    },
  },
};

export const WithValue: Story = {
  args: {
    value: 'Neural Network',
    placeholder: 'Enter text...',
  },
  parameters: {
    docs: {
      description: {
        story: 'Input with a pre-filled value.',
      },
    },
  },
};

export const WithLabel: Story = {
  render: (args) => (
    <div className="space-y-2">
      <Label htmlFor="term-name">Term Name</Label>
      <Input id="term-name" {...args} />
    </div>
  ),
  args: {
    placeholder: 'Enter term name...',
  },
  parameters: {
    docs: {
      description: {
        story: 'Input with an associated label.',
      },
    },
  },
};

export const Disabled: Story = {
  args: {
    placeholder: 'Disabled input...',
    disabled: true,
    value: 'Cannot edit this',
  },
  parameters: {
    docs: {
      description: {
        story: 'Disabled input that cannot be interacted with.',
      },
    },
  },
};

export const Required: Story = {
  render: (args) => (
    <div className="space-y-2">
      <Label htmlFor="required-input">
        Required Field <span className="text-red-500">*</span>
      </Label>
      <Input id="required-input" {...args} />
    </div>
  ),
  args: {
    placeholder: 'This field is required...',
    required: true,
  },
  parameters: {
    docs: {
      description: {
        story: 'Required input field with visual indicator.',
      },
    },
  },
};

export const WithError: Story = {
  render: (args) => (
    <div className="space-y-2">
      <Label htmlFor="error-input">Email Address</Label>
      <Input id="error-input" {...args} className="border-red-500 focus:border-red-500" />
      <p className="text-sm text-red-500">Please enter a valid email address</p>
    </div>
  ),
  args: {
    placeholder: 'Enter email...',
    value: 'invalid-email',
    type: 'email',
  },
  parameters: {
    docs: {
      description: {
        story: 'Input in error state with validation message.',
      },
    },
  },
};

export const Password: Story = {
  render: (args) => (
    <div className="space-y-2">
      <Label htmlFor="password-input">Password</Label>
      <Input id="password-input" {...args} />
    </div>
  ),
  args: {
    type: 'password',
    placeholder: 'Enter password...',
  },
  parameters: {
    docs: {
      description: {
        story: 'Password input with hidden text.',
      },
    },
  },
};

export const Search: Story = {
  args: {
    type: 'search',
    placeholder: 'Search terms...',
  },
  parameters: {
    docs: {
      description: {
        story: 'Search input with appropriate styling.',
      },
    },
  },
};

export const Number: Story = {
  render: (args) => (
    <div className="space-y-2">
      <Label htmlFor="number-input">Term Count</Label>
      <Input id="number-input" {...args} />
    </div>
  ),
  args: {
    type: 'number',
    placeholder: '0',
    min: 0,
    max: 1000,
  },
  parameters: {
    docs: {
      description: {
        story: 'Number input with min/max constraints.',
      },
    },
  },
};

export const LongValue: Story = {
  args: {
    value:
      'This is a very long input value that tests how the component handles overflow text and maintains proper styling',
    placeholder: 'Enter text...',
  },
  parameters: {
    docs: {
      description: {
        story: 'Input with long text to test overflow handling.',
      },
    },
  },
};

export const Focused: Story = {
  args: {
    placeholder: 'Focused input...',
    autoFocus: true,
  },
  parameters: {
    docs: {
      description: {
        story: 'Input in focused state.',
      },
    },
  },
};

export const DarkMode: Story = {
  args: {
    placeholder: 'Enter text...',
  },
  parameters: {
    backgrounds: {
      default: 'dark',
    },
    docs: {
      description: {
        story: 'Input in dark mode theme.',
      },
    },
  },
  decorators: [
    (Story) => (
      <div className="w-full max-w-sm p-4 dark">
        <Story />
      </div>
    ),
  ],
};
