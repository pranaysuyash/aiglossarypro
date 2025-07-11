import { Meta, StoryObj } from '@storybook/react';
import { Home } from './Home';

const meta = {
  title: 'Pages/Home',
  component: Home,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
} satisfies Meta<typeof Home>;

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
