import { Meta, StoryObj } from '@storybook/react';
import { PersonalizedDiscoveryHub } from './PersonalizedDiscoveryHub';

const meta = {
  title: 'Components/PersonalizedDiscoveryHub',
  component: PersonalizedDiscoveryHub,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
} satisfies Meta<typeof PersonalizedDiscoveryHub>;

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
