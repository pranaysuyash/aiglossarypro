import type { Meta, StoryObj } from '@storybook/react';
import AdminSidebar from './AdminSidebar';

const meta: Meta<typeof AdminSidebar> = {
  title: 'Components/AdminSidebar',
  component: AdminSidebar,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    // Add argTypes here for component props
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    // Add default props here
  },
};

export const WithProps: Story = {
  args: {
    // Add alternative props here
  },
};
