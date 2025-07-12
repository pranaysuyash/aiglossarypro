import React from 'react';
import { Meta, StoryObj } from '@storybook/react';
import PredictiveAnalytics from './PredictiveAnalytics';

const meta = {
  title: 'Components/PredictiveAnalytics',
  component: PredictiveAnalytics,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
} satisfies Meta<typeof PredictiveAnalytics>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    userId: 'user-123',
  },
};

export const WithProps: Story = {
  args: {
    userId: 'user-456',
    compact: true,
  },
};
