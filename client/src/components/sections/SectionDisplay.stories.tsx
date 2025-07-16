import type { Meta, StoryObj } from '@storybook/react';
import SectionDisplay from './SectionDisplay';

const meta = {
  title: 'Components/SectionDisplay',
  component: SectionDisplay,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
} satisfies Meta<typeof SectionDisplay>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    section: {
      id: 'section-1',
      termId: 'term-123',
      sectionName: 'Introduction',
      sectionData: {
        content: 'This is an introduction to the concept...',
        type: 'text',
      },
      displayType: 'card',
      priority: 5,
      isInteractive: false,
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
    },
  },
};

export const WithProps: Story = {
  args: {
    section: {
      id: 'section-2',
      termId: 'term-456',
      sectionName: 'Interactive Demo',
      sectionData: {
        content: 'Interactive content here...',
        type: 'interactive',
        demoUrl: 'https://example.com/demo',
      },
      displayType: 'main',
      priority: 8,
      isInteractive: true,
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
    },
    isExpanded: true,
    showControls: true,
    onInteraction: (interactionType, data) => {
      console.log('Interaction:', interactionType, data);
    },
  },
};
