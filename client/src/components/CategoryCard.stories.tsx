import type { Meta, StoryObj } from '@storybook/react';
import CategoryCard from './CategoryCard';

// Mock function for actions (if needed later)

// Mock category data
const mockCategory = {
  id: '1',
  name: 'Machine Learning',
  description:
    'Algorithms and statistical models that computer systems use to perform tasks without explicit instructions.',
  termCount: 45,
};

const meta: Meta<typeof CategoryCard> = {
  title: 'Components/CategoryCard',
  component: CategoryCard,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'A card component displaying category information with term count and navigation.',
      },
    },
  },
  decorators: [
    Story => (
      <div className="w-full max-w-sm p-4">
        <Story />
      </div>
    ),
  ],
  args: {
    category: mockCategory,
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {},
  parameters: {
    docs: {
      description: {
        story: 'Default category card with icon, name, description, and term count.',
      },
    },
  },
};

export const WithLongName: Story = {
  args: {
    category: {
      ...mockCategory,
      name: 'Natural Language Processing and Understanding',
      description:
        'A very long description that tests how the card handles overflow text and maintains proper layout with extensive content.',
    },
  },
  parameters: {
    docs: {
      description: {
        story: 'Category card with long name and description to test text overflow handling.',
      },
    },
  },
};

export const WithLowTermCount: Story = {
  args: {
    category: {
      ...mockCategory,
      name: 'Quantum Computing',
      description: 'Computing using quantum-mechanical phenomena.',
      termCount: 3,
    },
  },
  parameters: {
    docs: {
      description: {
        story: 'Category card with a low term count.',
      },
    },
  },
};

export const WithHighTermCount: Story = {
  args: {
    category: {
      ...mockCategory,
      name: 'Deep Learning',
      description: 'Machine learning methods based on artificial neural networks.',
      termCount: 127,
    },
  },
  parameters: {
    docs: {
      description: {
        story: 'Category card with a high term count.',
      },
    },
  },
};

export const WithoutIcon: Story = {
  args: {
    category: {
      ...mockCategory,
      name: 'Computer Vision',
      description:
        'Interdisciplinary field that deals with how computers can be made to gain understanding from digital images.',
    },
  },
  parameters: {
    docs: {
      description: {
        story: 'Category card without an icon.',
      },
    },
  },
};

export const WithShortDescription: Story = {
  args: {
    category: {
      ...mockCategory,
      name: 'Robotics',
      description: 'Robots and automation.',
      termCount: 23,
    },
  },
  parameters: {
    docs: {
      description: {
        story: 'Category card with a very short description.',
      },
    },
  },
};

export const Mobile: Story = {
  args: {},
  parameters: {
    viewport: {
      defaultViewport: 'mobile1',
    },
    docs: {
      description: {
        story: 'Category card optimized for mobile devices.',
      },
    },
  },
};

export const DarkMode: Story = {
  args: {},
  parameters: {
    backgrounds: {
      default: 'dark',
    },
    docs: {
      description: {
        story: 'Category card in dark mode theme.',
      },
    },
  },
  decorators: [
    Story => (
      <div className="w-full max-w-sm p-4 dark">
        <Story />
      </div>
    ),
  ],
};

export const Hover: Story = {
  args: {},
  parameters: {
    docs: {
      description: {
        story: 'Category card in hover state.',
      },
    },
  },
  play: async ({ canvasElement }) => {
    const card =
      canvasElement.querySelector('[data-testid="category-card"]') ||
      canvasElement.querySelector('.card');
    if (card) {
      card.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));
    }
  },
};
