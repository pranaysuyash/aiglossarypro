import React from 'react';
import { Meta, StoryObj } from '@storybook/react';
import Settings from './Settings';

const meta = {
  title: 'Pages/Settings',
  component: Settings,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
} satisfies Meta<typeof Settings>;

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
