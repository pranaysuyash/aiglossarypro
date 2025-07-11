import { Meta, StoryObj } from '@storybook/react';
import { MobileLayoutWrapper } from './MobileLayoutWrapper';

const meta = {
  title: 'Components/MobileLayoutWrapper',
  component: MobileLayoutWrapper,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
} satisfies Meta<typeof MobileLayoutWrapper>;

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
