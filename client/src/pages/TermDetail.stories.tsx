import React from 'react';
import { Meta, StoryObj } from '@storybook/react';
import { TermDetail } from './TermDetail';

const meta = {
  title: 'Pages/TermDetail',
  component: TermDetail,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
} satisfies Meta<typeof TermDetail>;

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
