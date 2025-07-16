import type { Meta, StoryObj } from '@storybook/react';
import { SectionNavigator } from './SectionNavigator';

const meta = {
  title: 'Components/SectionNavigator',
  component: SectionNavigator,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
} satisfies Meta<typeof SectionNavigator>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    sections: [],
    userProgress: [],
    onSectionClick: () => {},
  },
};

export const WithProps: Story = {
  args: {
    // Add relevant props here
  },
};
