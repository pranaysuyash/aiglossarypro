import React from 'react';
import { Meta, StoryObj } from '@storybook/react';
import TermOverview from './TermOverview';

const meta = {
  title: 'Components/TermOverview',
  component: TermOverview,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
} satisfies Meta<typeof TermOverview>;

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
