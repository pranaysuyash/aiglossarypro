import type { Meta, StoryObj } from '@storybook/react';
import React from 'react';
import { Label } from './label';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from './select';

const meta: Meta<typeof Select> = {
  title: 'UI/Select',
  component: Select,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'A control that allows users to choose one option from a list of options.',
      },
    },
  },
  decorators: [
    (Story) => (
      <div className="w-full max-w-sm">
        <Story />
      </div>
    ),
  ],
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <Select>
      <SelectTrigger>
        <SelectValue placeholder="Select a fruit" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="apple">Apple</SelectItem>
        <SelectItem value="banana">Banana</SelectItem>
        <SelectItem value="orange">Orange</SelectItem>
        <SelectItem value="grape">Grape</SelectItem>
        <SelectItem value="pineapple">Pineapple</SelectItem>
      </SelectContent>
    </Select>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Default select with basic fruit options.',
      },
    },
  },
};

export const WithLabel: Story = {
  render: () => (
    <div className="space-y-2">
      <Label htmlFor="fruit-select">Choose your favorite fruit</Label>
      <Select>
        <SelectTrigger id="fruit-select">
          <SelectValue placeholder="Select a fruit" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="apple">Apple</SelectItem>
          <SelectItem value="banana">Banana</SelectItem>
          <SelectItem value="orange">Orange</SelectItem>
          <SelectItem value="grape">Grape</SelectItem>
          <SelectItem value="pineapple">Pineapple</SelectItem>
        </SelectContent>
      </Select>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Select with an associated label.',
      },
    },
  },
};

export const WithGroups: Story = {
  render: () => (
    <Select>
      <SelectTrigger>
        <SelectValue placeholder="Select a framework" />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          <SelectLabel>Frontend</SelectLabel>
          <SelectItem value="react">React</SelectItem>
          <SelectItem value="vue">Vue</SelectItem>
          <SelectItem value="angular">Angular</SelectItem>
          <SelectItem value="svelte">Svelte</SelectItem>
        </SelectGroup>
        <SelectSeparator />
        <SelectGroup>
          <SelectLabel>Backend</SelectLabel>
          <SelectItem value="node">Node.js</SelectItem>
          <SelectItem value="express">Express</SelectItem>
          <SelectItem value="fastify">Fastify</SelectItem>
          <SelectItem value="nest">NestJS</SelectItem>
        </SelectGroup>
        <SelectSeparator />
        <SelectGroup>
          <SelectLabel>Database</SelectLabel>
          <SelectItem value="postgresql">PostgreSQL</SelectItem>
          <SelectItem value="mysql">MySQL</SelectItem>
          <SelectItem value="mongodb">MongoDB</SelectItem>
          <SelectItem value="redis">Redis</SelectItem>
        </SelectGroup>
      </SelectContent>
    </Select>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Select with grouped options and separators.',
      },
    },
  },
};

export const WithDisabledOptions: Story = {
  render: () => (
    <Select>
      <SelectTrigger>
        <SelectValue placeholder="Select a plan" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="free">Free Plan</SelectItem>
        <SelectItem value="basic">Basic Plan</SelectItem>
        <SelectItem value="pro">Pro Plan</SelectItem>
        <SelectItem value="enterprise" disabled>
          Enterprise Plan (Coming Soon)
        </SelectItem>
      </SelectContent>
    </Select>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Select with some disabled options.',
      },
    },
  },
};

export const Disabled: Story = {
  render: () => (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Disabled (Empty)</Label>
        <Select disabled>
          <SelectTrigger>
            <SelectValue placeholder="Select an option" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="option1">Option 1</SelectItem>
            <SelectItem value="option2">Option 2</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>Disabled (With Value)</Label>
        <Select disabled defaultValue="option1">
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="option1">Option 1</SelectItem>
            <SelectItem value="option2">Option 2</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Disabled select components.',
      },
    },
  },
};

export const WithDefaultValue: Story = {
  render: () => (
    <Select defaultValue="react">
      <SelectTrigger>
        <SelectValue placeholder="Select a framework" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="react">React</SelectItem>
        <SelectItem value="vue">Vue</SelectItem>
        <SelectItem value="angular">Angular</SelectItem>
        <SelectItem value="svelte">Svelte</SelectItem>
      </SelectContent>
    </Select>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Select with a default value pre-selected.',
      },
    },
  },
};

export const LongOptions: Story = {
  render: () => (
    <Select>
      <SelectTrigger>
        <SelectValue placeholder="Select a very long option" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="short">Short option</SelectItem>
        <SelectItem value="medium">Medium length option</SelectItem>
        <SelectItem value="long">
          This is a very long option that demonstrates text truncation
        </SelectItem>
        <SelectItem value="extra-long">
          This is an extremely long option that shows how the select handles very long text content
          that might overflow
        </SelectItem>
      </SelectContent>
    </Select>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Select with long option text to test truncation.',
      },
    },
  },
};

export const ManyOptions: Story = {
  render: () => (
    <Select>
      <SelectTrigger>
        <SelectValue placeholder="Select a country" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="us">United States</SelectItem>
        <SelectItem value="ca">Canada</SelectItem>
        <SelectItem value="uk">United Kingdom</SelectItem>
        <SelectItem value="de">Germany</SelectItem>
        <SelectItem value="fr">France</SelectItem>
        <SelectItem value="es">Spain</SelectItem>
        <SelectItem value="it">Italy</SelectItem>
        <SelectItem value="au">Australia</SelectItem>
        <SelectItem value="jp">Japan</SelectItem>
        <SelectItem value="kr">South Korea</SelectItem>
        <SelectItem value="cn">China</SelectItem>
        <SelectItem value="in">India</SelectItem>
        <SelectItem value="br">Brazil</SelectItem>
        <SelectItem value="mx">Mexico</SelectItem>
        <SelectItem value="ar">Argentina</SelectItem>
        <SelectItem value="za">South Africa</SelectItem>
        <SelectItem value="eg">Egypt</SelectItem>
        <SelectItem value="ng">Nigeria</SelectItem>
        <SelectItem value="ru">Russia</SelectItem>
        <SelectItem value="tr">Turkey</SelectItem>
      </SelectContent>
    </Select>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Select with many options to test scrolling behavior.',
      },
    },
  },
};

export const FormExample: Story = {
  render: () => {
    const [formData, setFormData] = React.useState({
      category: '',
      priority: '',
      status: '',
      assignee: '',
    });

    return (
      <div className="w-full max-w-md space-y-4 p-4 border rounded-lg">
        <h3 className="text-lg font-semibold">Create Task</h3>

        <div className="space-y-2">
          <Label htmlFor="category">Category</Label>
          <Select
            value={formData.category}
            onValueChange={(value) => setFormData((prev) => ({ ...prev, category: value }))}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="bug">Bug</SelectItem>
              <SelectItem value="feature">Feature</SelectItem>
              <SelectItem value="improvement">Improvement</SelectItem>
              <SelectItem value="task">Task</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="priority">Priority</Label>
          <Select
            value={formData.priority}
            onValueChange={(value) => setFormData((prev) => ({ ...prev, priority: value }))}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select priority" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="low">Low</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="urgent">Urgent</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="status">Status</Label>
          <Select
            value={formData.status}
            onValueChange={(value) => setFormData((prev) => ({ ...prev, status: value }))}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todo">To Do</SelectItem>
              <SelectItem value="inprogress">In Progress</SelectItem>
              <SelectItem value="review">In Review</SelectItem>
              <SelectItem value="done">Done</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="assignee">Assignee</Label>
          <Select
            value={formData.assignee}
            onValueChange={(value) => setFormData((prev) => ({ ...prev, assignee: value }))}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select assignee" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="john">John Doe</SelectItem>
              <SelectItem value="jane">Jane Smith</SelectItem>
              <SelectItem value="bob">Bob Johnson</SelectItem>
              <SelectItem value="alice">Alice Brown</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-800 rounded text-sm">
          <strong>Form Data:</strong>
          <pre className="mt-1 text-xs">{JSON.stringify(formData, null, 2)}</pre>
        </div>
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story: 'Complete form example with multiple select components.',
      },
    },
  },
};

export const CustomWidth: Story = {
  render: () => (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Small (w-32)</Label>
        <Select>
          <SelectTrigger className="w-32">
            <SelectValue placeholder="Size" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="xs">XS</SelectItem>
            <SelectItem value="s">S</SelectItem>
            <SelectItem value="m">M</SelectItem>
            <SelectItem value="l">L</SelectItem>
            <SelectItem value="xl">XL</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>Medium (w-48)</Label>
        <Select>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Select option" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="option1">Option 1</SelectItem>
            <SelectItem value="option2">Option 2</SelectItem>
            <SelectItem value="option3">Option 3</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>Large (w-64)</Label>
        <Select>
          <SelectTrigger className="w-64">
            <SelectValue placeholder="Select a longer option" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="option1">A longer option name</SelectItem>
            <SelectItem value="option2">Another longer option</SelectItem>
            <SelectItem value="option3">Yet another option</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Select components with different widths.',
      },
    },
  },
};

export const Interactive: Story = {
  render: () => {
    const [selectedValue, setSelectedValue] = React.useState('');

    return (
      <div className="space-y-4">
        <div className="space-y-2">
          <Label>Interactive Select</Label>
          <Select value={selectedValue} onValueChange={setSelectedValue}>
            <SelectTrigger>
              <SelectValue placeholder="Make a selection" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="option1">Option 1</SelectItem>
              <SelectItem value="option2">Option 2</SelectItem>
              <SelectItem value="option3">Option 3</SelectItem>
              <SelectItem value="option4">Option 4</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded">
          <p className="text-sm">
            Selected value: <strong>{selectedValue || 'None'}</strong>
          </p>
          <button
            onClick={() => setSelectedValue('')}
            className="mt-2 text-sm text-blue-600 hover:text-blue-800"
          >
            Clear selection
          </button>
        </div>
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story: 'Interactive select with controlled state and clear functionality.',
      },
    },
  },
};

export const DarkMode: Story = {
  render: () => (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label>Theme Selection</Label>
        <Select defaultValue="dark">
          <SelectTrigger>
            <SelectValue placeholder="Select theme" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="light">Light</SelectItem>
            <SelectItem value="dark">Dark</SelectItem>
            <SelectItem value="system">System</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>Framework</Label>
        <Select>
          <SelectTrigger>
            <SelectValue placeholder="Select framework" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectLabel>Frontend</SelectLabel>
              <SelectItem value="react">React</SelectItem>
              <SelectItem value="vue">Vue</SelectItem>
              <SelectItem value="angular">Angular</SelectItem>
            </SelectGroup>
            <SelectSeparator />
            <SelectGroup>
              <SelectLabel>Backend</SelectLabel>
              <SelectItem value="node">Node.js</SelectItem>
              <SelectItem value="express">Express</SelectItem>
              <SelectItem value="fastify">Fastify</SelectItem>
            </SelectGroup>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>Disabled Select</Label>
        <Select disabled defaultValue="option1">
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="option1">Option 1</SelectItem>
            <SelectItem value="option2">Option 2</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  ),
  parameters: {
    backgrounds: {
      default: 'dark',
    },
    docs: {
      description: {
        story: 'Select components in dark mode theme.',
      },
    },
  },
  decorators: [
    (Story) => (
      <div className="w-full max-w-sm dark">
        <Story />
      </div>
    ),
  ],
};
