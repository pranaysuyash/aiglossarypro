import type { Meta, StoryObj } from '@storybook/react';
import AISearchPage from './AISearch';

const meta = {
  title: 'Pages/AISearchPage',
  component: AISearchPage,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
} satisfies Meta<typeof AISearchPage>;

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
