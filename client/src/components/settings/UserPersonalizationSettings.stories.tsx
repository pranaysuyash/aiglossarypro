import { Meta, StoryObj } from '@storybook/react';
import { UserPersonalizationSettings } from './UserPersonalizationSettings';

const meta = {
  title: 'Components/UserPersonalizationSettings',
  component: UserPersonalizationSettings,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
} satisfies Meta<typeof UserPersonalizationSettings>;

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
