import React from 'react';
import { Meta, StoryObj } from '@storybook/react';
import { DynamicFilterPanel } from './DynamicFilterPanel';

const meta = {
  title: 'Components/DynamicFilterPanel',
  component: DynamicFilterPanel,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
} satisfies Meta<typeof DynamicFilterPanel>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    filters: {
      relationshipTypes: ['semantic'],
      relationshipStrength: [0, 1],
      nodeTypes: ['term'],
      categories: ['machine-learning'],
      subcategories: [],
      difficultyLevels: ['beginner'],
      hasImplementation: null,
      hasInteractiveElements: null,
      hasCaseStudies: null,
      hasCodeExamples: null,
      searchQuery: '',
      depth: 2,
      showOrphans: false,
      layoutType: 'force',
      nodeSize: 'uniform',
      edgeStyle: 'straight',
    },
    onFilterChange: () => {},
    availableCategories: ['machine-learning', 'deep-learning', 'ai'],
    availableSubcategories: ['neural-networks', 'computer-vision'],
  },
};

export const WithProps: Story = {
  args: {
    filters: {
      relationshipTypes: ['semantic', 'hierarchical'],
      relationshipStrength: [0.5, 1],
      nodeTypes: ['term', 'category'],
      categories: ['deep-learning'],
      subcategories: ['neural-networks'],
      difficultyLevels: ['intermediate', 'advanced'],
      hasImplementation: true,
      hasInteractiveElements: true,
      hasCaseStudies: false,
      hasCodeExamples: true,
      searchQuery: 'neural',
      depth: 3,
      showOrphans: true,
      layoutType: 'hierarchical',
      nodeSize: 'by-importance',
      edgeStyle: 'curved',
    },
    onFilterChange: () => {},
    availableCategories: ['machine-learning', 'deep-learning', 'ai'],
    availableSubcategories: ['neural-networks', 'computer-vision', 'nlp'],
    currentStats: {
      totalNodes: 150,
      totalRelationships: 300,
      filteredNodes: 45,
      filteredRelationships: 78,
    },
  },
};
