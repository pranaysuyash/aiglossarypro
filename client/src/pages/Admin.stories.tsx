import { Meta, StoryObj } from '@storybook/react';
import AdminPage from './Admin';

const meta = {
  title: 'Pages/AdminPage',
  component: AdminPage,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
} satisfies Meta<typeof AdminPage>;

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
