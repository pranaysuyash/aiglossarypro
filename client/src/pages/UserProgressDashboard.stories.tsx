import React from 'react';
import { Meta, StoryObj } from '@storybook/react';
import { UserProgressDashboard } from './UserProgressDashboard';

const meta = {
  title: 'Pages/UserProgressDashboard',
  component: UserProgressDashboard,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
} satisfies Meta<typeof UserProgressDashboard>;

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
