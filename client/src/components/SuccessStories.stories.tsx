import type { Meta, StoryObj } from '@storybook/react';
import { SuccessStories } from './SuccessStories';

const meta: Meta<typeof SuccessStories> = {
  title: 'Components/SuccessStories',
  component: SuccessStories,
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
