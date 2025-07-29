import type { Meta, StoryObj } from '@storybook/react';
import Dashboard from './Dashboard';

const meta = {
  title: 'Pages/Dashboard',
  component: Dashboard,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
} satisfies Meta<typeof Dashboard>;

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
