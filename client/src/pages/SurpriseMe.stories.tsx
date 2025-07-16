import type { Meta, StoryObj } from '@storybook/react';
import SurpriseMePage from './SurpriseMe';

const meta = {
  title: 'Pages/SurpriseMePage',
  component: SurpriseMePage,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
} satisfies Meta<typeof SurpriseMePage>;

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
