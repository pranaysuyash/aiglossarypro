import type { Meta, StoryObj } from '@storybook/react';
import { Drawer } from './drawer';

const meta = {
  title: 'U./drawer',
  component: Drawer,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
} satisfies Meta<typeof Drawer>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {},
};

export const WithProps: Story = {
  args: {
    // Add relevant props here
  },
};
