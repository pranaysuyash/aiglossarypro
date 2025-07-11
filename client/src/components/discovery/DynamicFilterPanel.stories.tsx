import { Meta, StoryObj } from '@storybook/react';
import { DynamicFilterPanel } from './DynamicFilterPanel';

const meta = {
  title: 'Components/DynamicFilterPanel',
  component: DynamicFilterPanel,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
} satisfies Meta<typeof DynamicFilterPanel>;

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
