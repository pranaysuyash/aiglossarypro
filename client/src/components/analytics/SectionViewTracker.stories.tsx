import type { Meta, StoryObj } from '@storybook/react';
import SectionViewTracker from './SectionViewTracker';

const meta = {
  title: 'Components/SectionViewTracker',
  component: SectionViewTracker,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
} satisfies Meta<typeof SectionViewTracker>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    sectionName: 'hero-section',
    children: <div>Hero section content</div>,
  },
};

export const WithProps: Story = {
  args: {
    sectionName: 'pricing-section',
    sectionPosition: 3,
    threshold: 0.75,
    children: <div>Pricing section with custom tracking threshold</div>,
  },
};
