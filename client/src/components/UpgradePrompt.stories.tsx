import React from 'react';
import { Meta, StoryObj } from '@storybook/react';
import { UpgradePrompt } from './UpgradePrompt';

const meta = {
  title: 'Components/UpgradePrompt',
  component: UpgradePrompt,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
} satisfies Meta<typeof UpgradePrompt>;

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
