import React from 'react';
import { Meta, StoryObj } from '@storybook/react';
import { TrendingWidget } from './TrendingWidget';

const meta = {
  title: 'Components/TrendingWidget',
  component: TrendingWidget,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
} satisfies Meta<typeof TrendingWidget>;

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
