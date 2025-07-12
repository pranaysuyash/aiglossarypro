import React from 'react';
import { Meta, StoryObj } from '@storybook/react';
import { HierarchicalNavigation } from './HierarchicalNavigation';

const meta = {
  title: 'Components/HierarchicalNavigation',
  component: HierarchicalNavigation,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
} satisfies Meta<typeof HierarchicalNavigation>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
      "contentStructure": []
    },
};

export const WithProps: Story = {
  args: {
    contentStructure: []
  },
};
