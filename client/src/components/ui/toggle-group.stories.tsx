import React from 'react';
import { Meta, StoryObj } from '@storybook/react';
import { ToggleGroup, ToggleGroupItem } from './toggle-group';
import { Bold, Italic, Underline } from 'lucide-react';

const meta = {
  title: 'UI/ToggleGroup',
  component: ToggleGroup,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
} satisfies Meta<typeof ToggleGroup>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <ToggleGroup type="multiple">
      <ToggleGroupItem value="bold" aria-label="Toggle bold">
        <Bold className="h-4 w-4" />
      </ToggleGroupItem>
      <ToggleGroupItem value="italic" aria-label="Toggle italic">
        <Italic className="h-4 w-4" />
      </ToggleGroupItem>
      <ToggleGroupItem value="underline" aria-label="Toggle underline">
        <Underline className="h-4 w-4" />
      </ToggleGroupItem>
    </ToggleGroup>
  ),
};

export const SingleSelect: Story = {
  render: () => (
    <ToggleGroup type="single">
      <ToggleGroupItem value="left" aria-label="Align left">
        Left
      </ToggleGroupItem>
      <ToggleGroupItem value="center" aria-label="Align center">
        Center
      </ToggleGroupItem>
      <ToggleGroupItem value="right" aria-label="Align right">
        Right
      </ToggleGroupItem>
    </ToggleGroup>
  ),
};
