import React from 'react';
import { Meta, StoryObj } from '@storybook/react';
import { Terms } from './Terms';

const meta = {
  title: 'Pages/Terms',
  component: Terms,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
} satisfies Meta<typeof Terms>;

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
