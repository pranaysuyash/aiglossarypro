import { Meta, StoryObj } from '@storybook/react';
import { ConceptDiscovery } from './ConceptDiscovery';

const meta = {
  title: 'Components/ConceptDiscovery',
  component: ConceptDiscovery,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
} satisfies Meta<typeof ConceptDiscovery>;

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
