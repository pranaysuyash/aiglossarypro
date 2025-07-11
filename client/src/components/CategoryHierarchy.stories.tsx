import type { Meta, StoryObj } from '@storybook/react';
import { BookOpen, FolderOpen, Home } from 'lucide-react';
import CategoryHierarchy, { createCategoryBreadcrumb } from './CategoryHierarchy';

const meta: Meta<typeof CategoryHierarchy> = {
  title: 'Core/CategoryHierarchy',
  component: CategoryHierarchy,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'Breadcrumb navigation component for showing hierarchical category structure with icons and responsive design.',
      },
    },
  },
  argTypes: {
    items: {
      control: 'object',
      description: 'Array of breadcrumb items with label, href, icon, and current page status',
    },
    className: {
      control: 'text',
      description: 'Additional CSS classes',
    },
    showIcons: {
      control: 'boolean',
      description: 'Whether to show icons next to breadcrumb items',
    },
    variant: {
      control: 'select',
      options: ['default', 'compact'],
      description: 'Visual variant of the breadcrumb',
    },
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof CategoryHierarchy>;

export const Default: Story = {
  args: {
    items: [
      { label: 'Home', href: '/app', icon: <Home className="w-4 h-4" /> },
      { label: 'Categories', href: '/categories' },
      { label: 'Machine Learning', href: '/categories/ml' },
      { label: 'Deep Learning', href: '/categories/ml/deep-learning' },
      { label: 'Convolutional Neural Networks', isCurrentPage: true },
    ],
    showIcons: true,
    variant: 'default',
  },
  parameters: {
    docs: {
      description: {
        story: 'Default breadcrumb with full hierarchy and icons.',
      },
    },
  },
};

export const CompactVariant: Story = {
  args: {
    items: [
      { label: 'Home', href: '/app' },
      { label: 'Categories', href: '/categories' },
      { label: 'Machine Learning', href: '/categories/ml' },
      { label: 'Deep Learning', href: '/categories/ml/deep-learning' },
      { label: 'Convolutional Neural Networks', isCurrentPage: true },
    ],
    showIcons: false,
    variant: 'compact',
  },
  parameters: {
    docs: {
      description: {
        story: 'Compact breadcrumb variant with no icons and minimal spacing.',
      },
    },
  },
};

export const WithoutIcons: Story = {
  args: {
    items: [
      { label: 'Home', href: '/app' },
      { label: 'Categories', href: '/categories' },
      { label: 'Neural Networks', href: '/categories/neural-networks' },
      { label: 'Backpropagation', isCurrentPage: true },
    ],
    showIcons: false,
    variant: 'default',
  },
  parameters: {
    docs: {
      description: {
        story: 'Breadcrumb without icons for cleaner appearance.',
      },
    },
  },
};

export const ShortPath: Story = {
  args: {
    items: [
      { label: 'Home', href: '/app', icon: <Home className="w-4 h-4" /> },
      { label: 'Terms', href: '/terms' },
      { label: 'Gradient Descent', isCurrentPage: true },
    ],
    showIcons: true,
    variant: 'default',
  },
  parameters: {
    docs: {
      description: {
        story: 'Short breadcrumb path with minimal hierarchy.',
      },
    },
  },
};

export const LongPath: Story = {
  args: {
    items: [
      { label: 'Home', href: '/app', icon: <Home className="w-4 h-4" /> },
      { label: 'Categories', href: '/categories' },
      { label: 'Machine Learning', href: '/categories/ml' },
      { label: 'Supervised Learning', href: '/categories/ml/supervised' },
      { label: 'Classification', href: '/categories/ml/supervised/classification' },
      { label: 'Support Vector Machines', href: '/categories/ml/supervised/classification/svm' },
      { label: 'Kernel Methods', href: '/categories/ml/supervised/classification/svm/kernels' },
      { label: 'Radial Basis Function Kernel', isCurrentPage: true },
    ],
    showIcons: true,
    variant: 'default',
  },
  parameters: {
    docs: {
      description: {
        story: 'Long breadcrumb path showing deep hierarchy navigation.',
      },
    },
  },
};

export const CustomIcons: Story = {
  args: {
    items: [
      { label: 'Home', href: '/app', icon: <Home className="w-4 h-4" /> },
      { label: 'AI Categories', href: '/categories', icon: <FolderOpen className="w-4 h-4" /> },
      { label: 'Natural Language Processing', href: '/categories/nlp', icon: <BookOpen className="w-4 h-4" /> },
      { label: 'BERT Model', isCurrentPage: true, icon: <BookOpen className="w-4 h-4" /> },
    ],
    showIcons: true,
    variant: 'default',
  },
  parameters: {
    docs: {
      description: {
        story: 'Breadcrumb with custom icons for each level.',
      },
    },
  },
};

export const GeneratedBreadcrumb: Story = {
  args: {
    items: createCategoryBreadcrumb(
      'Machine Learning',
      'Deep Learning',
      'Transformer Architecture',
      'ml-category',
      'deep-learning-subcategory'
    ),
    showIcons: true,
    variant: 'default',
  },
  parameters: {
    docs: {
      description: {
        story: 'Breadcrumb generated using the helper function createCategoryBreadcrumb.',
      },
    },
  },
};

export const CategoryOnly: Story = {
  args: {
    items: createCategoryBreadcrumb('Computer Vision', undefined, undefined, 'cv-category'),
    showIcons: true,
    variant: 'default',
  },
  parameters: {
    docs: {
      description: {
        story: 'Breadcrumb for category page without subcategory or term.',
      },
    },
  },
};

export const SubcategoryOnly: Story = {
  args: {
    items: createCategoryBreadcrumb(
      'Machine Learning',
      'Reinforcement Learning',
      undefined,
      'ml-category',
      'rl-subcategory'
    ),
    showIcons: true,
    variant: 'default',
  },
  parameters: {
    docs: {
      description: {
        story: 'Breadcrumb for subcategory page without specific term.',
      },
    },
  },
};

export const ResponsiveMobile: Story = {
  args: {
    items: [
      { label: 'Home', href: '/app' },
      { label: 'Categories', href: '/categories' },
      { label: 'Machine Learning', href: '/categories/ml' },
      { label: 'Deep Learning', href: '/categories/ml/deep-learning' },
      { label: 'Convolutional Neural Networks', isCurrentPage: true },
    ],
    showIcons: true,
    variant: 'compact',
    className: 'max-w-xs',
  },
  parameters: {
    viewport: {
      defaultViewport: 'mobile1',
    },
    docs: {
      description: {
        story: 'Breadcrumb on mobile with compact variant and text truncation.',
      },
    },
  },
};

export const DarkMode: Story = {
  args: {
    items: [
      { label: 'Home', href: '/app', icon: <Home className="w-4 h-4" /> },
      { label: 'Categories', href: '/categories' },
      { label: 'Machine Learning', href: '/categories/ml' },
      { label: 'Neural Networks', isCurrentPage: true },
    ],
    showIcons: true,
    variant: 'default',
    className: 'dark',
  },
  decorators: [
    (Story) => (
      <div className="dark bg-gray-900 p-6 rounded-lg">
        <Story />
      </div>
    ),
  ],
  parameters: {
    docs: {
      description: {
        story: 'Breadcrumb in dark mode with proper contrast.',
      },
    },
  },
};