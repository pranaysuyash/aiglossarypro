import type { Meta, StoryObj } from '@storybook/react';
import EnhancedTable, { type TableColumn, type TableData } from './enhanced-table';

const meta: Meta<typeof EnhancedTable> = {
  title: 'UI/EnhancedTable',
  component: EnhancedTable,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'An advanced data table component with sorting, filtering, search, and export capabilities.',
      },
    },
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof EnhancedTable>;

// Sample data for ML algorithms comparison
const mlAlgorithmsColumns: TableColumn[] = [
  { key: 'algorithm', label: 'Algorithm', sortable: true, filterable: true, type: 'text' },
  { key: 'type', label: 'Type', sortable: true, filterable: true, type: 'badge' },
  { key: 'complexity', label: 'Time Complexity', sortable: true, type: 'text', align: 'center' },
  { key: 'accuracy', label: 'Accuracy (%)', sortable: true, type: 'number', align: 'right' },
  {
    key: 'interpretable',
    label: 'Interpretable',
    sortable: true,
    type: 'boolean',
    align: 'center',
  },
  { key: 'lastUpdated', label: 'Last Updated', sortable: true, type: 'date' },
];

const mlAlgorithmsData: TableData[] = [
  {
    algorithm: 'Linear Regression',
    type: 'Supervised',
    complexity: 'O(n)',
    accuracy: 85.2,
    interpretable: true,
    lastUpdated: new Date('2024-01-15'),
  },
  {
    algorithm: 'Random Forest',
    type: 'Supervised',
    complexity: 'O(n log n)',
    accuracy: 92.8,
    interpretable: false,
    lastUpdated: new Date('2024-02-20'),
  },
  {
    algorithm: 'K-Means Clustering',
    type: 'Unsupervised',
    complexity: 'O(n²)',
    accuracy: 78.5,
    interpretable: true,
    lastUpdated: new Date('2024-01-08'),
  },
  {
    algorithm: 'Support Vector Machine',
    type: 'Supervised',
    complexity: 'O(n³)',
    accuracy: 89.1,
    interpretable: false,
    lastUpdated: new Date('2024-03-10'),
  },
  {
    algorithm: 'Neural Network',
    type: 'Supervised',
    complexity: 'O(n³)',
    accuracy: 94.7,
    interpretable: false,
    lastUpdated: new Date('2024-03-25'),
  },
  {
    algorithm: 'Decision Tree',
    type: 'Supervised',
    complexity: 'O(n log n)',
    accuracy: 87.3,
    interpretable: true,
    lastUpdated: new Date('2024-02-15'),
  },
];

// Sample data for dataset comparison
const datasetsColumns: TableColumn[] = [
  { key: 'name', label: 'Dataset Name', sortable: true, filterable: true, type: 'text' },
  { key: 'domain', label: 'Domain', sortable: true, filterable: true, type: 'badge' },
  { key: 'samples', label: 'Samples', sortable: true, type: 'number', align: 'right' },
  { key: 'features', label: 'Features', sortable: true, type: 'number', align: 'right' },
  { key: 'size', label: 'Size (MB)', sortable: true, type: 'number', align: 'right' },
  { key: 'license', label: 'License', sortable: true, filterable: true, type: 'text' },
];

const datasetsData: TableData[] = [
  {
    name: 'MNIST',
    domain: 'Computer Vision',
    samples: 70000,
    features: 784,
    size: 52.4,
    license: 'Public Domain',
  },
  {
    name: 'IMDB Reviews',
    domain: 'NLP',
    samples: 50000,
    features: 5000,
    size: 84.1,
    license: 'Academic Use',
  },
  {
    name: 'Iris',
    domain: 'Classification',
    samples: 150,
    features: 4,
    size: 0.01,
    license: 'Public Domain',
  },
  {
    name: 'CIFAR-10',
    domain: 'Computer Vision',
    samples: 60000,
    features: 3072,
    size: 162.5,
    license: 'MIT',
  },
  {
    name: 'Boston Housing',
    domain: 'Regression',
    samples: 506,
    features: 13,
    size: 0.05,
    license: 'MIT',
  },
  {
    name: 'WikiText-103',
    domain: 'NLP',
    samples: 28595,
    features: 267735,
    size: 1100.2,
    license: 'Creative Commons',
  },
];

export const MLAlgorithmsComparison: Story = {
  args: {
    columns: mlAlgorithmsColumns,
    data: mlAlgorithmsData,
    title: 'ML Algorithms Comparison',
    description: 'Compare different machine learning algorithms by performance and characteristics',
    searchable: true,
    exportable: true,
    pagination: true,
    pageSize: 5,
  },
};

export const DatasetsComparison: Story = {
  args: {
    columns: datasetsColumns,
    data: datasetsData,
    title: 'Popular Datasets',
    description: 'Overview of commonly used datasets in machine learning research',
    searchable: true,
    exportable: true,
    pagination: false,
  },
};

export const SimpleTable: Story = {
  args: {
    columns: [
      { key: 'metric', label: 'Metric', type: 'text' },
      { key: 'value', label: 'Value', type: 'number', align: 'right' },
      { key: 'status', label: 'Status', type: 'badge' },
    ],
    data: [
      { metric: 'Accuracy', value: 0.95, status: 'verified' },
      { metric: 'Precision', value: 0.92, status: 'pending' },
      { metric: 'Recall', value: 0.89, status: 'verified' },
      { metric: 'F1-Score', value: 0.9, status: 'verified' },
    ],
    title: 'Model Performance Metrics',
    searchable: false,
    exportable: false,
    pagination: false,
  },
};

export const LargeDataset: Story = {
  args: {
    columns: mlAlgorithmsColumns,
    data: Array.from({ length: 50 }, (_, i) => ({
      algorithm: `Algorithm ${i + 1}`,
      type: ['Supervised', 'Unsupervised', 'Reinforcement'][i % 3],
      complexity: ['O(n)', 'O(n log n)', 'O(n²)', 'O(n³)'][i % 4],
      accuracy: Math.round((Math.random() * 20 + 80) * 10) / 10,
      interpretable: Math.random() > 0.5,
      lastUpdated: new Date(
        2024,
        Math.floor(Math.random() * 12),
        Math.floor(Math.random() * 28) + 1
      ),
    })),
    title: 'Large Algorithm Database',
    description: 'Demonstrating pagination with 50+ algorithms',
    searchable: true,
    exportable: true,
    pagination: true,
    pageSize: 10,
  },
};

export const EmptyState: Story = {
  args: {
    columns: mlAlgorithmsColumns,
    data: [],
    title: 'No Data Available',
    description: 'Example of empty state handling',
    searchable: true,
    exportable: true,
  },
};

export const MinimalTable: Story = {
  args: {
    columns: [
      { key: 'name', label: 'Name' },
      { key: 'value', label: 'Value' },
    ],
    data: [
      { name: 'Learning Rate', value: '0.001' },
      { name: 'Batch Size', value: '32' },
      { name: 'Epochs', value: '100' },
    ],
    searchable: false,
    exportable: false,
    pagination: false,
  },
};
