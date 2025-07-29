import type { Meta, StoryObj } from '@storybook/react';
import { OwnerDashboard } from './OwnerDashboard';

const meta = {
  title: 'Pages/OwnerDashboard',
  component: OwnerDashboard,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
} satisfies Meta<typeof OwnerDashboard>;

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
