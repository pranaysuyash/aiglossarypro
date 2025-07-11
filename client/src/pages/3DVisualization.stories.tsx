import { Meta, StoryObj } from '@storybook/react';
import ThreeDVisualizationPage from './3DVisualization';

const meta = {
  title: 'Pages/ThreeDVisualizationPage',
  component: ThreeDVisualizationPage,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
} satisfies Meta<typeof ThreeDVisualizationPage>;

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
