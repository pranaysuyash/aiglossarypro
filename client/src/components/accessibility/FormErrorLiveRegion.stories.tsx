import React from 'react';
import { Meta, StoryObj } from '@storybook/react';
import { FormErrorLiveRegion } from './FormErrorLiveRegion';

const meta = {
  title: 'Components/FormErrorLiveRegion',
  component: FormErrorLiveRegion,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
} satisfies Meta<typeof FormErrorLiveRegion>;

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
