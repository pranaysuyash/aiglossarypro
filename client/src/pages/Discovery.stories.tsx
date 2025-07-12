import React from 'react';
import { Meta, StoryObj } from '@storybook/react';
import { Discovery } from './Discovery';

const meta = {
  title: 'Pages/Discovery',
  component: Discovery,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
} satisfies Meta<typeof Discovery>;

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
