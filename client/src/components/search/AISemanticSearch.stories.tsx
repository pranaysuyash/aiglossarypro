import React from 'react';
import { Meta, StoryObj } from '@storybook/react';
import AISemanticSearch from './AISemanticSearch';

const meta = {
  title: 'Components/AISemanticSearch',
  component: AISemanticSearch,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
} satisfies Meta<typeof AISemanticSearch>;

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
