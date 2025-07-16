import type { Meta, StoryObj } from '@storybook/react';
import { EnhancedFormExample } from './EnhancedFormExample';

const meta = {
  title: 'Components/EnhancedFormExample',
  component: EnhancedFormExample,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
} satisfies Meta<typeof EnhancedFormExample>;

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
