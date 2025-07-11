import { Meta, StoryObj } from '@storybook/react';
import { VRConceptSpace } from './VRConceptSpace';

const meta = {
  title: 'Components/VRConceptSpace',
  component: VRConceptSpace,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
} satisfies Meta<typeof VRConceptSpace>;

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
