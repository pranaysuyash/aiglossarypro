import React from 'react';
import { Meta, StoryObj } from '@storybook/react';
import Categories from './Categories';

const meta = {
  title: 'Pages/Categories',
  component: Categories,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
} satisfies Meta<typeof Categories>;

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
