import type { Meta, StoryObj } from '@storybook/react';
import { Sidebar } from './sidebar';

const meta = {
  title: 'UI/Sidebar',
  component: Sidebar,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
} satisfies Meta<typeof Sidebar>;

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
