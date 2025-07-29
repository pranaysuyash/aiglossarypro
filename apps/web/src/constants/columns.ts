export interface ColumnDefinition {
  id: string;
  name: string;
  description: string;
  category: string;
  priority: number;
  isEssential: boolean;
  placeholder?: string;
  tooltip?: string;
}

export const COLUMN_CATEGORIES = {
  ESSENTIAL: 'Essential',
  TECHNICAL: 'Technical Details',
  EXAMPLES: 'Examples & Use Cases',
  COMPARISON: 'Comparison & Analysis',
  ADVANCED: 'Advanced Topics',
  METADATA: 'Metadata & Classification',
} as const;

export const ALL_COLUMNS: ColumnDefinition[] = [
  // Essential columns (what currently exists)
  {
    id: 'term',
    name: 'Term Name',
    description: 'Core term name and variations',
    category: COLUMN_CATEGORIES.ESSENTIAL,
    priority: 1,
    isEssential: true,
    placeholder: 'Enter the primary term name',
    tooltip: 'The main name of the term and any common variations',
  },
  {
    id: 'definition_overview',
    name: 'Definition & Overview',
    description: 'Clear, comprehensive definition',
    category: COLUMN_CATEGORIES.ESSENTIAL,
    priority: 2,
    isEssential: true,
    placeholder: 'Provide a clear and comprehensive definition',
    tooltip: 'A detailed explanation of what the term means',
  },
  {
    id: 'key_concepts',
    name: 'Key Concepts',
    description: 'Essential understanding points',
    category: COLUMN_CATEGORIES.ESSENTIAL,
    priority: 3,
    isEssential: true,
    placeholder: 'List the key concepts users should understand',
    tooltip: 'Important concepts that are fundamental to understanding this term',
  },
  {
    id: 'basic_examples',
    name: 'Basic Examples',
    description: 'Concrete examples for clarity',
    category: COLUMN_CATEGORIES.EXAMPLES,
    priority: 4,
    isEssential: true,
    placeholder: 'Provide concrete examples',
    tooltip: 'Simple, clear examples that illustrate the concept',
  },
  {
    id: 'advantages',
    name: 'Advantages',
    description: 'Benefits and use cases',
    category: COLUMN_CATEGORIES.ESSENTIAL,
    priority: 5,
    isEssential: true,
    placeholder: 'List the main advantages and benefits',
    tooltip: 'Key benefits and positive aspects of this concept',
  },

  // Technical Details
  {
    id: 'technical_details',
    name: 'Technical Details',
    description: 'In-depth technical information',
    category: COLUMN_CATEGORIES.TECHNICAL,
    priority: 10,
    isEssential: false,
    placeholder: 'Provide detailed technical information',
    tooltip: 'Technical specifications, implementation details, and deep technical insights',
  },
  {
    id: 'algorithms',
    name: 'Algorithms & Methods',
    description: 'Core algorithms and methodologies',
    category: COLUMN_CATEGORIES.TECHNICAL,
    priority: 11,
    isEssential: false,
    placeholder: 'Describe the algorithms or methods used',
    tooltip: 'Specific algorithms, formulas, or methodologies associated with this term',
  },
  {
    id: 'implementation',
    name: 'Implementation',
    description: 'How to implement or use this concept',
    category: COLUMN_CATEGORIES.TECHNICAL,
    priority: 12,
    isEssential: false,
    placeholder: 'Explain how to implement or use this',
    tooltip: 'Practical implementation guidance and best practices',
  },
  {
    id: 'architecture',
    name: 'Architecture',
    description: 'System architecture and design patterns',
    category: COLUMN_CATEGORIES.TECHNICAL,
    priority: 13,
    isEssential: false,
    placeholder: 'Describe the architectural patterns or design',
    tooltip: 'System architecture, design patterns, and structural considerations',
  },
  {
    id: 'performance',
    name: 'Performance',
    description: 'Performance characteristics and metrics',
    category: COLUMN_CATEGORIES.TECHNICAL,
    priority: 14,
    isEssential: false,
    placeholder: 'Describe performance characteristics',
    tooltip: 'Performance metrics, benchmarks, and optimization considerations',
  },

  // Examples & Use Cases
  {
    id: 'real_world_examples',
    name: 'Real-World Examples',
    description: 'Practical applications in industry',
    category: COLUMN_CATEGORIES.EXAMPLES,
    priority: 20,
    isEssential: false,
    placeholder: 'Provide real-world application examples',
    tooltip: 'Examples of how this concept is used in real applications and industries',
  },
  {
    id: 'code_examples',
    name: 'Code Examples',
    description: 'Programming examples and snippets',
    category: COLUMN_CATEGORIES.EXAMPLES,
    priority: 21,
    isEssential: false,
    placeholder: 'Provide code examples or snippets',
    tooltip: 'Code samples, pseudocode, or programming examples',
  },
  {
    id: 'use_cases',
    name: 'Use Cases',
    description: 'Common scenarios and applications',
    category: COLUMN_CATEGORIES.EXAMPLES,
    priority: 22,
    isEssential: false,
    placeholder: 'Describe common use cases',
    tooltip: 'Typical scenarios where this concept is applied',
  },
  {
    id: 'case_studies',
    name: 'Case Studies',
    description: 'Detailed case studies and success stories',
    category: COLUMN_CATEGORIES.EXAMPLES,
    priority: 23,
    isEssential: false,
    placeholder: 'Provide detailed case studies',
    tooltip: 'In-depth case studies showing successful applications',
  },

  // Comparison & Analysis
  {
    id: 'disadvantages',
    name: 'Disadvantages',
    description: 'Limitations and drawbacks',
    category: COLUMN_CATEGORIES.COMPARISON,
    priority: 30,
    isEssential: false,
    placeholder: 'List limitations and drawbacks',
    tooltip: 'Known limitations, challenges, or negative aspects',
  },
  {
    id: 'alternatives',
    name: 'Alternatives',
    description: 'Alternative approaches or technologies',
    category: COLUMN_CATEGORIES.COMPARISON,
    priority: 31,
    isEssential: false,
    placeholder: 'Describe alternative approaches',
    tooltip: 'Alternative methods, technologies, or approaches',
  },
  {
    id: 'comparison',
    name: 'Comparison',
    description: 'Comparison with similar concepts',
    category: COLUMN_CATEGORIES.COMPARISON,
    priority: 32,
    isEssential: false,
    placeholder: 'Compare with similar concepts',
    tooltip: 'How this concept compares to similar or related terms',
  },
  {
    id: 'trade_offs',
    name: 'Trade-offs',
    description: 'Key trade-offs and considerations',
    category: COLUMN_CATEGORIES.COMPARISON,
    priority: 33,
    isEssential: false,
    placeholder: 'Describe key trade-offs',
    tooltip: 'Important trade-offs to consider when using this concept',
  },

  // Advanced Topics
  {
    id: 'advanced_concepts',
    name: 'Advanced Concepts',
    description: 'Complex or advanced aspects',
    category: COLUMN_CATEGORIES.ADVANCED,
    priority: 40,
    isEssential: false,
    placeholder: 'Explain advanced concepts',
    tooltip: 'Complex topics for users with deeper knowledge',
  },
  {
    id: 'research_directions',
    name: 'Research Directions',
    description: 'Current research and future directions',
    category: COLUMN_CATEGORIES.ADVANCED,
    priority: 41,
    isEssential: false,
    placeholder: 'Describe current research directions',
    tooltip: 'Active areas of research and future developments',
  },
  {
    id: 'challenges',
    name: 'Challenges',
    description: 'Current challenges and unsolved problems',
    category: COLUMN_CATEGORIES.ADVANCED,
    priority: 42,
    isEssential: false,
    placeholder: 'Describe current challenges',
    tooltip: 'Ongoing challenges and problems in this area',
  },
  {
    id: 'future_trends',
    name: 'Future Trends',
    description: 'Emerging trends and future outlook',
    category: COLUMN_CATEGORIES.ADVANCED,
    priority: 43,
    isEssential: false,
    placeholder: 'Describe future trends',
    tooltip: 'Expected future developments and trends',
  },

  // Metadata & Classification
  {
    id: 'tags',
    name: 'Tags',
    description: 'Categorization tags and keywords',
    category: COLUMN_CATEGORIES.METADATA,
    priority: 50,
    isEssential: false,
    placeholder: 'Add relevant tags',
    tooltip: 'Tags and keywords for categorization and search',
  },
  {
    id: 'prerequisites',
    name: 'Prerequisites',
    description: 'Required knowledge or concepts',
    category: COLUMN_CATEGORIES.METADATA,
    priority: 51,
    isEssential: false,
    placeholder: 'List required prerequisites',
    tooltip: 'Concepts or knowledge required to understand this term',
  },
  {
    id: 'related_terms',
    name: 'Related Terms',
    description: 'Connected concepts and terms',
    category: COLUMN_CATEGORIES.METADATA,
    priority: 52,
    isEssential: false,
    placeholder: 'List related terms',
    tooltip: 'Other terms that are closely related to this concept',
  },
  {
    id: 'difficulty_level',
    name: 'Difficulty Level',
    description: 'Complexity rating for learners',
    category: COLUMN_CATEGORIES.METADATA,
    priority: 53,
    isEssential: false,
    placeholder: 'Rate the difficulty level',
    tooltip: 'How difficult this concept is to understand (beginner, intermediate, advanced)',
  },
  {
    id: 'learning_path',
    name: 'Learning Path',
    description: 'Suggested learning progression',
    category: COLUMN_CATEGORIES.METADATA,
    priority: 54,
    isEssential: false,
    placeholder: 'Suggest a learning path',
    tooltip: 'Recommended order for learning this and related concepts',
  },
];

// Helper functions
export const getEssentialColumns = (): ColumnDefinition[] => {
  return ALL_COLUMNS.filter(col => col.isEssential);
};

export const getColumnsByCategory = (category: string): ColumnDefinition[] => {
  return ALL_COLUMNS.filter(col => col.category === category);
};

export const getColumnById = (id: string): ColumnDefinition | undefined => {
  return ALL_COLUMNS.find(col => col.id === id);
};

export const getColumnCategories = (): string[] => {
  return [...new Set(ALL_COLUMNS.map(col => col.category))];
};

export const searchColumns = (query: string): ColumnDefinition[] => {
  const lowerQuery = query.toLowerCase();
  return ALL_COLUMNS.filter(
    col =>
      col.name.toLowerCase().includes(lowerQuery) ||
      col.description.toLowerCase().includes(lowerQuery) ||
      col.category.toLowerCase().includes(lowerQuery)
  );
};
