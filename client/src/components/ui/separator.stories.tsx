import React from 'react';
import { Meta, StoryObj } from '@storybook/react';
import { Separator } from './Separator';

const meta = {
  title: 'UI/Separator',
  component: Separator,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
} satisfies Meta<typeof Separator>;

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
