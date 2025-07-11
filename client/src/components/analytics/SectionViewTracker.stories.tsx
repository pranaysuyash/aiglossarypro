import { Meta, StoryObj } from '@storybook/react';
import { SectionViewTracker } from './SectionViewTracker';

const meta = {
  title: 'Components/SectionViewTracker',
  component: SectionViewTracker,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
} satisfies Meta<typeof SectionViewTracker>;

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
