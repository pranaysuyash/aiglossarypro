import React from 'react';
import { Meta, StoryObj } from '@storybook/react';
import { ScrollArea, ScrollBar } from './scroll-area';

const meta = {
  title: 'UI/ScrollArea',
  component: ScrollArea,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
} satisfies Meta<typeof ScrollArea>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <ScrollArea className="h-[200px] w-[350px] rounded-md border p-4">
      <div className="space-y-2">
        {Array.from({ length: 50 }, (_, i) => (
          <div key={i} className="text-sm">
            This is item {i + 1}. It's inside a scrollable area.
          </div>
        ))}
      </div>
    </ScrollArea>
  ),
};

export const WithHorizontalScroll: Story = {
  render: () => (
    <ScrollArea className="w-96 whitespace-nowrap rounded-md border">
      <div className="flex w-max space-x-4 p-4">
        {Array.from({ length: 20 }, (_, i) => (
          <div key={i} className="shrink-0 w-[150px] h-[100px] rounded-md border-2 border-dashed border-gray-300 flex items-center justify-center">
            Item {i + 1}
          </div>
        ))}
      </div>
      <ScrollBar orientation="horizontal" />
    </ScrollArea>
  ),
};
