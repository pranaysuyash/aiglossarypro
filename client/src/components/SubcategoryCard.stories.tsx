import React from 'react';
import { Meta, StoryObj } from '@storybook/react';
import { SubcategoryCard } from './SubcategoryCard';

const meta = {
  title: 'Components/SubcategoryCard',
  component: SubcategoryCard,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
} satisfies Meta<typeof SubcategoryCard>;

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
