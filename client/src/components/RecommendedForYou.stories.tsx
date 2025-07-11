import { Meta, StoryObj } from '@storybook/react';
import { RecommendedForYou } from './RecommendedForYou';

const meta = {
  title: 'Components/RecommendedForYou',
  component: RecommendedForYou,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
} satisfies Meta<typeof RecommendedForYou>;

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
