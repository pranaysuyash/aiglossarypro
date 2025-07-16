import type { Meta, StoryObj } from '@storybook/react';
import { LearningPaths } from './LearningPaths';

const meta = {
  title: 'Pages/LearningPaths',
  component: LearningPaths,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
} satisfies Meta<typeof LearningPaths>;

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
