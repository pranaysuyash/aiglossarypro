import type { Meta, StoryObj } from '@storybook/react';
import EnhancedTermDetail from './EnhancedTermDetail';

const meta = {
  title: 'Pages/EnhancedTermDetail',
  component: EnhancedTermDetail,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
} satisfies Meta<typeof EnhancedTermDetail>;

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
