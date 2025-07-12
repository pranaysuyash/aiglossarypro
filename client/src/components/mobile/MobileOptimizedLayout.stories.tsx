import React from 'react';
import { Meta, StoryObj } from '@storybook/react';
import MobileOptimizedLayout from './MobileOptimizedLayout';

const meta = {
  title: 'Components/MobileOptimizedLayout',
  component: MobileOptimizedLayout,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
} satisfies Meta<typeof MobileOptimizedLayout>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    children: <div>Layout content</div>
  },
};

export const WithProps: Story = {
  args: {
    children: "Main content"
  },
};
