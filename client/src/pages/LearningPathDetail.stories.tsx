import { Meta, StoryObj } from '@storybook/react';
import { LearningPathDetail } from './LearningPathDetail';

const meta = {
  title: 'Pages/LearningPathDetail',
  component: LearningPathDetail,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
} satisfies Meta<typeof LearningPathDetail>;

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
