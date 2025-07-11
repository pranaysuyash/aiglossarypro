import { Meta, StoryObj } from '@storybook/react';
import { AdvancedSearch } from './AdvancedSearch';

const meta = {
  title: 'Components/AdvancedSearch',
  component: AdvancedSearch,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
} satisfies Meta<typeof AdvancedSearch>;

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
