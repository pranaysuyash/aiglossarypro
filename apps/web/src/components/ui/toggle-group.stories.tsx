import type { Meta, StoryObj } from '@storybook/react';
import { Bold, Italic, Underline } from 'lucide-react';
import { ToggleGroup, ToggleGroupItem } from './toggle-group';

const meta = {
  title: 'UI/ToggleGroup',
  component: ToggleGroup,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
} satisfies Meta<typeof ToggleGroup>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    type: 'single',
    defaultValue: 'center',
  },
  render: args => (
    <ToggleGroup {...args}>
      <ToggleGroupItem value="left">Left</ToggleGroupItem>
      <ToggleGroupItem value="center">Center</ToggleGroupItem>
      <ToggleGroupItem value="right">Right</ToggleGroupItem>
    </ToggleGroup>
  ),
};

export const Multiple: Story = {
  args: {
    type: 'multiple',
    defaultValue: ['center'],
  },
  render: args => (
    <ToggleGroup {...args}>
      <ToggleGroupItem value="bold">Bold</ToggleGroupItem>
      <ToggleGroupItem value="italic">Italic</ToggleGroupItem>
      <ToggleGroupItem value="underline">Underline</ToggleGroupItem>
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
