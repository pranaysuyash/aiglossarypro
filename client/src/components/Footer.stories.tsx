import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import Footer from './Footer';

const meta: Meta<typeof Footer> = {
  title: 'Components/Footer',
  component: Footer,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'The main footer component with navigation links, social media, and company information.',
      },
    },
  },
  decorators: [
    (Story) => (
      <div className="min-h-screen flex flex-col">
        <div className="flex-1 bg-gray-50 p-8">
          <div className="text-center text-gray-600">Page content goes here</div>
        </div>
        <Story />
      </div>
    ),
  ],
  tags: ['autodocs'],
  argTypes: {
    className: {
      control: 'text',
      description: 'Additional CSS classes',
    },
    onSubscribe: {
      action: 'subscribed',
      description: 'Callback when user subscribes to newsletter',
    },
  },
};

export default meta;
type Story = StoryObj<typeof Footer>;

export const Default: Story = {
  args: {},
  parameters: {
    docs: {
      description: {
        story: 'Default footer with all navigation links and company information.',
      },
    },
  },
};

export const Mobile: Story = {
  args: {},
  parameters: {
    viewport: {
      defaultViewport: 'mobile1',
    },
    docs: {
      description: {
        story: 'Footer optimized for mobile devices with responsive layout.',
      },
    },
  },
};

export const Tablet: Story = {
  args: {},
  parameters: {
    viewport: {
      defaultViewport: 'tablet',
    },
    docs: {
      description: {
        story: 'Footer optimized for tablet devices.',
      },
    },
  },
};

export const DarkMode: Story = {
  args: {},
  parameters: {
    backgrounds: {
      default: 'dark',
    },
    docs: {
      description: {
        story: 'Footer in dark mode theme.',
      },
    },
  },
  decorators: [
    (Story) => (
      <div className="min-h-screen flex flex-col dark">
        <div className="flex-1 bg-gray-900 p-8">
          <div className="text-center text-gray-400">Page content goes here</div>
        </div>
        <Story />
      </div>
    ),
  ],
};

export const WithLongContent: Story = {
  args: {},
  parameters: {
    docs: {
      description: {
        story: 'Footer with a longer page to demonstrate sticky behavior.',
      },
    },
  },
  decorators: [
    (Story) => (
      <div className="min-h-screen flex flex-col">
        <div className="flex-1 bg-gray-50 p-8">
          <div className="space-y-4">
            {Array.from({ length: 20 }, (_, i) => (
              <div key={i} className="p-4 bg-white rounded shadow">
                <h3 className="font-semibold">Content Block {i + 1}</h3>
                <p className="text-gray-600">
                  This is some sample content to demonstrate the footer positioning.
                </p>
              </div>
            ))}
          </div>
        </div>
        <Story />
      </div>
    ),
  ],
};
