import type { Meta, StoryObj } from '@storybook/react';
import AdvancedSearch from './AdvancedSearch';

const meta = {
  title: 'Components/AdvancedSearch',
  component: AdvancedSearch,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
} satisfies Meta<typeof AdvancedSearch>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    onSearch: filters => {
      console.log('Search filters:', filters);
    },
    availableFilters: {
      categories: ['Machine Learning', 'Deep Learning', 'Natural Language Processing'],
      subcategories: ['Neural Networks', 'Computer Vision', 'Reinforcement Learning'],
      applicationDomains: ['Healthcare', 'Finance', 'Autonomous Vehicles'],
      techniques: ['Supervised Learning', 'Unsupervised Learning', 'Transfer Learning'],
    },
  },
};

export const WithProps: Story = {
  args: {
    onSearch: filters => {
      console.log('Search filters:', filters);
    },
    availableFilters: {
      categories: ['Machine Learning', 'Deep Learning'],
      subcategories: ['Neural Networks', 'Computer Vision'],
      applicationDomains: ['Healthcare', 'Finance'],
      techniques: ['Supervised Learning', 'Unsupervised Learning'],
    },
    initialFilters: {
      query: 'neural network',
      categories: ['Machine Learning'],
    },
  },
};
