import React from 'react';
import { Meta, StoryObj } from '@storybook/react';
import { HierarchicalNavigatorDemo } from './HierarchicalNavigatorDemo';

const meta = {
  title: 'Components/HierarchicalNavigatorDemo',
  component: HierarchicalNavigatorDemo,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
} satisfies Meta<typeof HierarchicalNavigatorDemo>;

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
