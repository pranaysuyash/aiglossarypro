import React from 'react';
import { Meta, StoryObj } from '@storybook/react';
import { About } from './About';

const meta = {
  title: 'Pages/About',
  component: About,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
} satisfies Meta<typeof About>;

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
