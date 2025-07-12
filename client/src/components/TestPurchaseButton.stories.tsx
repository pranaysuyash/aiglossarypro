import React from 'react';
import { Meta, StoryObj } from '@storybook/react';
import { TestPurchaseButton } from './TestPurchaseButton';

const meta = {
  title: 'Components/TestPurchaseButton',
  component: TestPurchaseButton,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
} satisfies Meta<typeof TestPurchaseButton>;

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
