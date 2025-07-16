import type { Meta, StoryObj } from '@storybook/react';
import { Favorites } from './Favorites';

const meta = {
  title: 'Pages/Favorites',
  component: Favorites,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
} satisfies Meta<typeof Favorites>;

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
