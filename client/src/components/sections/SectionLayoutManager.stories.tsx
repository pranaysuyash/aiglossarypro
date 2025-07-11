import { Meta, StoryObj } from '@storybook/react';
import { SectionLayoutManager } from './SectionLayoutManager';

const meta = {
  title: 'Components/SectionLayoutManager',
  component: SectionLayoutManager,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
} satisfies Meta<typeof SectionLayoutManager>;

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
