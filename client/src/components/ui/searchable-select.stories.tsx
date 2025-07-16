import type { Meta, StoryObj } from '@storybook/react';
import React, { useState } from 'react';
import { SearchableSelect } from './searchable-select';

const meta: Meta<typeof SearchableSelect> = {
  title: 'UI/SearchableSelect',
  component: SearchableSelect,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Searchable select component with filtering, categorization, and flexible option display built on top of Command and Popover components.',
      },
    },
  },
  argTypes: {
    value: {
      control: 'text',
      description: 'Currently selected value',
    },
    placeholder: {
      control: 'text',
      description: 'Placeholder text when no option is selected',
    },
    searchPlaceholder: {
      control: 'text',
      description: 'Placeholder text for search input',
    },
    groupByCategory: {
      control: 'boolean',
      description: 'Whether to group options by category',
    },
    disabled: {
      control: 'boolean',
      description: 'Whether the select is disabled',
    },
    emptyMessage: {
      control: 'text',
      description: 'Message to show when no options are found',
    },
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof SearchableSelect>;

// Sample data for different scenarios
const basicOptions = [
  { value: 'apple', label: 'Apple' },
  { value: 'banana', label: 'Banana' },
  { value: 'cherry', label: 'Cherry' },
  { value: 'date', label: 'Date' },
  { value: 'elderberry', label: 'Elderberry' },
  { value: 'fig', label: 'Fig' },
  { value: 'grape', label: 'Grape' },
  { value: 'honeydew', label: 'Honeydew' },
];

const aiMlTerms = [
  {
    value: 'machine-learning',
    label: 'Machine Learning',
    description: 'Algorithms that learn patterns from data',
    category: 'Core AI',
  },
  {
    value: 'deep-learning',
    label: 'Deep Learning',
    description: 'Neural networks with multiple layers',
    category: 'Core AI',
  },
  {
    value: 'neural-network',
    label: 'Neural Network',
    description: 'Computing system inspired by biological neural networks',
    category: 'Core AI',
  },
  {
    value: 'reinforcement-learning',
    label: 'Reinforcement Learning',
    description: 'Learning through interaction with environment',
    category: 'Learning Types',
  },
  {
    value: 'supervised-learning',
    label: 'Supervised Learning',
    description: 'Learning with labeled training data',
    category: 'Learning Types',
  },
  {
    value: 'unsupervised-learning',
    label: 'Unsupervised Learning',
    description: 'Learning patterns from unlabeled data',
    category: 'Learning Types',
  },
  {
    value: 'cnn',
    label: 'Convolutional Neural Network',
    description: 'Neural network designed for image processing',
    category: 'Neural Networks',
  },
  {
    value: 'rnn',
    label: 'Recurrent Neural Network',
    description: 'Neural network for sequential data',
    category: 'Neural Networks',
  },
  {
    value: 'transformer',
    label: 'Transformer',
    description: 'Architecture using self-attention mechanism',
    category: 'Neural Networks',
  },
  {
    value: 'gradient-descent',
    label: 'Gradient Descent',
    description: 'Optimization algorithm for finding minimum',
    category: 'Optimization',
  },
  {
    value: 'backpropagation',
    label: 'Backpropagation',
    description: 'Algorithm for training neural networks',
    category: 'Optimization',
  },
  {
    value: 'overfitting',
    label: 'Overfitting',
    description: 'Model performs well on training but poorly on new data',
    category: 'Model Issues',
  },
  {
    value: 'underfitting',
    label: 'Underfitting',
    description: 'Model is too simple to capture underlying patterns',
    category: 'Model Issues',
  },
];

const countriesOptions = [
  { value: 'us', label: 'United States', category: 'North America' },
  { value: 'ca', label: 'Canada', category: 'North America' },
  { value: 'mx', label: 'Mexico', category: 'North America' },
  { value: 'uk', label: 'United Kingdom', category: 'Europe' },
  { value: 'de', label: 'Germany', category: 'Europe' },
  { value: 'fr', label: 'France', category: 'Europe' },
  { value: 'it', label: 'Italy', category: 'Europe' },
  { value: 'es', label: 'Spain', category: 'Europe' },
  { value: 'jp', label: 'Japan', category: 'Asia' },
  { value: 'cn', label: 'China', category: 'Asia' },
  { value: 'kr', label: 'South Korea', category: 'Asia' },
  { value: 'in', label: 'India', category: 'Asia' },
  { value: 'au', label: 'Australia', category: 'Oceania' },
  { value: 'nz', label: 'New Zealand', category: 'Oceania' },
];

// Interactive wrapper for stories
function SelectWrapper({ options, ...props }: any) {
  const [value, setValue] = useState<string>('');

  return (
    <div className="w-80 space-y-2">
      <SearchableSelect value={value} onValueChange={setValue} options={options} {...props} />
      {value && (
        <p className="text-sm text-muted-foreground">
          Selected: {options.find((opt: any) => opt.value === value)?.label}
        </p>
      )}
    </div>
  );
}

export const Default: Story = {
  render: () => (
    <SelectWrapper
      options={basicOptions}
      placeholder="Select a fruit..."
      searchPlaceholder="Search fruits..."
    />
  ),
  parameters: {
    docs: {
      description: {
        story: 'Basic searchable select with simple options.',
      },
    },
  },
};

export const WithDescriptions: Story = {
  render: () => (
    <SelectWrapper
      options={aiMlTerms}
      placeholder="Select an AI/ML term..."
      searchPlaceholder="Search AI/ML terms..."
      groupByCategory={false}
    />
  ),
  parameters: {
    docs: {
      description: {
        story: 'Searchable select with options that include descriptions.',
      },
    },
  },
};

export const GroupedByCategory: Story = {
  render: () => (
    <SelectWrapper
      options={aiMlTerms}
      placeholder="Select an AI/ML term..."
      searchPlaceholder="Search AI/ML terms..."
      groupByCategory={true}
    />
  ),
  parameters: {
    docs: {
      description: {
        story: 'Searchable select with options grouped by category.',
      },
    },
  },
};

export const CountriesGrouped: Story = {
  render: () => (
    <SelectWrapper
      options={countriesOptions}
      placeholder="Select a country..."
      searchPlaceholder="Search countries..."
      groupByCategory={true}
    />
  ),
  parameters: {
    docs: {
      description: {
        story: 'Countries select grouped by continent.',
      },
    },
  },
};

export const WithDisabledOptions: Story = {
  render: () => (
    <SelectWrapper
      options={[
        { value: 'option1', label: 'Available Option 1' },
        { value: 'option2', label: 'Available Option 2' },
        { value: 'option3', label: 'Disabled Option', disabled: true },
        { value: 'option4', label: 'Another Disabled Option', disabled: true },
        { value: 'option5', label: 'Available Option 3' },
      ]}
      placeholder="Select an option..."
      searchPlaceholder="Search options..."
    />
  ),
  parameters: {
    docs: {
      description: {
        story: 'Searchable select with some disabled options.',
      },
    },
  },
};

export const Disabled: Story = {
  render: () => (
    <SelectWrapper
      options={basicOptions}
      placeholder="This select is disabled..."
      searchPlaceholder="Search fruits..."
      disabled={true}
    />
  ),
  parameters: {
    docs: {
      description: {
        story: 'Disabled searchable select component.',
      },
    },
  },
};

export const EmptyState: Story = {
  render: () => (
    <SelectWrapper
      options={[]}
      placeholder="No options available..."
      searchPlaceholder="Search..."
      emptyMessage="No options to display"
    />
  ),
  parameters: {
    docs: {
      description: {
        story: 'Searchable select with no options showing empty state.',
      },
    },
  },
};

export const CustomEmptyMessage: Story = {
  render: () => (
    <SelectWrapper
      options={aiMlTerms}
      placeholder="Search for AI/ML terms..."
      searchPlaceholder="Type to search..."
      emptyMessage="No AI/ML terms found. Try adjusting your search."
    />
  ),
  parameters: {
    docs: {
      description: {
        story: 'Searchable select with custom empty message for search results.',
      },
    },
  },
};

export const LongOptionsList: Story = {
  render: () => {
    const longOptions = Array.from({ length: 100 }, (_, i) => ({
      value: `option-${i}`,
      label: `Option ${i + 1}`,
      description: `This is the description for option ${i + 1}`,
      category: `Category ${Math.floor(i / 10) + 1}`,
    }));

    return (
      <SelectWrapper
        options={longOptions}
        placeholder="Select from many options..."
        searchPlaceholder="Search through 100 options..."
        groupByCategory={true}
      />
    );
  },
  parameters: {
    docs: {
      description: {
        story: 'Searchable select with a large number of options to test performance.',
      },
    },
  },
};

export const PreselectedValue: Story = {
  render: () => {
    const [value, setValue] = useState<string>('machine-learning');

    return (
      <div className="w-80 space-y-2">
        <SearchableSelect
          value={value}
          onValueChange={setValue}
          options={aiMlTerms}
          placeholder="Select an AI/ML term..."
          searchPlaceholder="Search AI/ML terms..."
          groupByCategory={true}
        />
        <p className="text-sm text-muted-foreground">
          Selected: {aiMlTerms.find(opt => opt.value === value)?.label}
        </p>
        <button onClick={() => setValue('')} className="text-sm text-blue-600 hover:text-blue-800">
          Clear selection
        </button>
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story: 'Searchable select with a pre-selected value.',
      },
    },
  },
};

export const CompactWidth: Story = {
  render: () => (
    <div className="w-48">
      <SelectWrapper options={basicOptions} placeholder="Select..." searchPlaceholder="Search..." />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Searchable select with compact width showing text truncation.',
      },
    },
  },
};

export const CustomStyling: Story = {
  render: () => (
    <SelectWrapper
      options={aiMlTerms}
      placeholder="Custom styled select..."
      searchPlaceholder="Search AI/ML terms..."
      className="border-2 border-blue-300 focus:border-blue-500"
      groupByCategory={true}
    />
  ),
  parameters: {
    docs: {
      description: {
        story: 'Searchable select with custom styling applied.',
      },
    },
  },
};

export const AIGlossaryExample: Story = {
  render: () => {
    const [selectedTerm, setSelectedTerm] = useState<string>('');
    const [selectedCategory, setSelectedCategory] = useState<string>('');

    const categories = [
      { value: 'core-ai', label: 'Core AI' },
      { value: 'learning-types', label: 'Learning Types' },
      { value: 'neural-networks', label: 'Neural Networks' },
      { value: 'optimization', label: 'Optimization' },
      { value: 'model-issues', label: 'Model Issues' },
    ];

    return (
      <div className="space-y-6 max-w-md">
        <div className="space-y-2">
          <h3 className="text-lg font-semibold">AI/ML Glossary Search</h3>
          <p className="text-sm text-muted-foreground">
            Example of how searchable select might be used in the glossary.
          </p>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Select Category</label>
            <SearchableSelect
              value={selectedCategory}
              onValueChange={setSelectedCategory}
              options={categories}
              placeholder="All categories..."
              searchPlaceholder="Search categories..."
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Select Term</label>
            <SearchableSelect
              value={selectedTerm}
              onValueChange={setSelectedTerm}
              options={aiMlTerms}
              placeholder="Search for AI/ML terms..."
              searchPlaceholder="Type to search terms..."
              groupByCategory={true}
              emptyMessage="No terms found. Try a different search."
            />
          </div>

          {selectedTerm && (
            <div className="p-3 bg-blue-50 rounded-lg">
              <p className="text-sm font-medium text-blue-900">
                Selected: {aiMlTerms.find(term => term.value === selectedTerm)?.label}
              </p>
              <p className="text-sm text-blue-700 mt-1">
                {aiMlTerms.find(term => term.value === selectedTerm)?.description}
              </p>
            </div>
          )}
        </div>
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story: 'Example implementation in AI/ML Glossary context with category and term selection.',
      },
    },
  },
};

export const AllVariants: Story = {
  render: () => (
    <div className="space-y-8">
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Basic Variants</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Simple Select</label>
            <SelectWrapper
              options={basicOptions}
              placeholder="Select fruit..."
              searchPlaceholder="Search..."
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">With Categories</label>
            <SelectWrapper
              options={countriesOptions}
              placeholder="Select country..."
              searchPlaceholder="Search countries..."
              groupByCategory={true}
            />
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Advanced Features</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">With Descriptions</label>
            <SelectWrapper
              options={aiMlTerms.slice(0, 5)}
              placeholder="AI/ML terms..."
              searchPlaceholder="Search..."
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Disabled State</label>
            <SelectWrapper
              options={basicOptions}
              placeholder="Disabled select..."
              disabled={true}
            />
          </div>
        </div>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Showcase of all searchable select variants and features.',
      },
    },
  },
};
