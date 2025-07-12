import React from 'react';
import { Meta, StoryObj } from '@storybook/react';
import { TermActions } from './TermActions';

const meta = {
  title: 'Components/TermActions',
  component: TermActions,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
} satisfies Meta<typeof TermActions>;

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
