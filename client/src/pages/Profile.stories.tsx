import React from 'react';
import { Meta, StoryObj } from '@storybook/react';
import { Profile } from './Profile';

const meta = {
  title: 'Pages/Profile',
  component: Profile,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
} satisfies Meta<typeof Profile>;

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
