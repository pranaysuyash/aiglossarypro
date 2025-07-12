import React from 'react';
import { Meta, StoryObj } from '@storybook/react';
import TouchOptimizedScroll from './TouchOptimizedScroll';

const meta = {
  title: 'Components/TouchOptimizedScroll',
  component: TouchOptimizedScroll,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
} satisfies Meta<typeof TouchOptimizedScroll>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    children: (
      <div className="p-4 space-y-4">
        {Array.from({ length: 20 }, (_, i) => (
          <div key={i} className="p-4 bg-gray-100 rounded">
            Item {i + 1}
          </div>
        ))}
      </div>
    ),
  },
};

export const WithProps: Story = {
  args: {
    children: "Scrollable content"
  },
};
