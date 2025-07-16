import type { Meta, StoryObj } from '@storybook/react';
import SectionLayoutManager from './SectionLayoutManager';

const meta = {
  title: 'Components/SectionLayoutManager',
  component: SectionLayoutManager,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
} satisfies Meta<typeof SectionLayoutManager>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    sections: [
      {
        id: 'section-1',
        termId: 'term-123',
        sectionName: 'Introduction',
        sectionData: {
          content: 'This is an introduction section...',
        },
        displayType: 'card',
        priority: 5,
        isInteractive: false,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      },
      {
        id: 'section-2',
        termId: 'term-123',
        sectionName: 'Examples',
        sectionData: {
          content: 'Examples and use cases...',
        },
        displayType: 'main',
        priority: 7,
        isInteractive: true,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      },
    ],
  },
};

export const WithProps: Story = {
  args: {
    sections: [
      {
        id: 'section-3',
        termId: 'term-456',
        sectionName: 'Advanced Topic',
        sectionData: {
          content: 'Advanced concepts and implementations...',
        },
        displayType: 'sidebar',
        priority: 9,
        isInteractive: true,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      },
    ],
    onInteraction: (sectionId, interactionType, data) => {
      console.log('Interaction:', { sectionId, interactionType, data });
    },
  },
};
