import { Meta, StoryObj } from '@storybook/react';
import AIToolsPage from './AITools';

const meta = {
  title: 'Pages/AIToolsPage',
  component: AIToolsPage,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
} satisfies Meta<typeof AIToolsPage>;

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
