import type { Meta, StoryObj } from '@storybook/react';
import SectionContentRenderer from './SectionContentRenderer';

const meta = {
  title: 'Components/SectionContentRenderer',
  component: SectionContentRenderer,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
} satisfies Meta<typeof SectionContentRenderer>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    sections: [
      {
        id: 1,
        name: 'Introduction',
        displayOrder: 1,
        isCompleted: false,
        items: [
          {
            id: 1,
            label: 'Overview',
            content: 'This is an introduction to machine learning...',
            contentType: 'markdown',
            displayOrder: 1,
            isAiGenerated: false,
            verificationStatus: 'verified',
          },
        ],
      },
      {
        id: 2,
        name: 'Code Examples',
        displayOrder: 2,
        isCompleted: false,
        items: [
          {
            id: 2,
            label: 'Python Implementation',
            content: 'print("Hello, Machine Learning!")',
            contentType: 'code',
            displayOrder: 1,
            metadata: { language: 'python' },
            isAiGenerated: true,
            verificationStatus: 'unverified',
          },
        ],
      },
    ],
  },
};

export const WithProps: Story = {
  args: {
    sections: [
      {
        id: 1,
        name: 'Advanced Topics',
        displayOrder: 1,
        isCompleted: true,
        items: [
          {
            id: 1,
            label: 'Neural Network Diagram',
            content: 'graph TD;\n    A[Input] --> B[Hidden Layer];\n    B --> C[Output];',
            contentType: 'mermaid',
            displayOrder: 1,
            isAiGenerated: false,
            verificationStatus: 'expert_reviewed',
          },
        ],
      },
    ],
    displayMode: 'tabs',
    onInteraction: (type, data) => {
      console.log('Interaction:', type, data);
    },
  },
};
