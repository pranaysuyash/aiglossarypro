import React from 'react';
import { Meta, StoryObj } from '@storybook/react';
import Subcategories from './Subcategories';

const meta = {
  title: 'Pages/Subcategories',
  component: Subcategories,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
} satisfies Meta<typeof Subcategories>;

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
