import React from 'react';
import { Meta, StoryObj } from '@storybook/react';
import { SubcategoryDetail } from './SubcategoryDetail';

const meta = {
  title: 'Pages/SubcategoryDetail',
  component: SubcategoryDetail,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
} satisfies Meta<typeof SubcategoryDetail>;

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
