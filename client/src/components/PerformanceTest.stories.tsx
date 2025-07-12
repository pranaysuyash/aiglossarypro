import React from 'react';
import { Meta, StoryObj } from '@storybook/react';
import { PerformanceTest } from './PerformanceTest';

const meta = {
  title: 'Components/PerformanceTest',
  component: PerformanceTest,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
} satisfies Meta<typeof PerformanceTest>;

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
