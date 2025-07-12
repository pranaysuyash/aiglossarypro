import React from 'react';
import { Meta, StoryObj } from '@storybook/react';
import InteractiveElementsManager from './InteractiveElementsManager';

const meta = {
  title: 'Components/InteractiveElementsManager',
  component: InteractiveElementsManager,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
} satisfies Meta<typeof InteractiveElementsManager>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
      "elements": []
    },
};

export const WithProps: Story = {
  args: {
    elements: [
      {
        id: "1",
        termId: "term-123",
        sectionName: "Example Section",
        elementType: "code",
        elementData: {
          title: "Sample Code",
          description: "A simple code example",
          code: "console.log('Hello World');",
          language: "javascript",
        },
        displayOrder: 1,
        isActive: true,
        createdAt: "2024-01-01T00:00:00Z",
      }
    ]
  },
};
