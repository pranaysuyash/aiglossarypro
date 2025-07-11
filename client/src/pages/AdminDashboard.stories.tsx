import { Meta, StoryObj } from '@storybook/react';
import { AdminDashboard } from './AdminDashboard';

const meta = {
  title: 'Pages/AdminDashboard',
  component: AdminDashboard,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
} satisfies Meta<typeof AdminDashboard>;

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
