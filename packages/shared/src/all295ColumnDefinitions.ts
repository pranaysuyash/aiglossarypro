// shared/all295ColumnDefinitions.ts
// Single source of truth for all 295 column definitions

export interface ColumnDefinition {
  id: string;
  name: string;
  displayName: string;
  path: string;
  parentPath?: string | null;
  section: string;
  subsection?: string | null;
  subsubsection?: string | null;
  category: 'essential' | 'important' | 'supplementary' | 'advanced';
  priority: 1 | 2 | 3 | 4 | 5;
  estimatedTokens: number;
  contentType: 'text' | 'markdown' | 'code' | 'array' | 'object' | 'interactive';
  description: string;
  isInteractive: boolean;
  order: number;
}

// Import and merge columns from both existing files
import { COMPLETE_295_STRUCTURE } from './completeColumnStructure';
import { REMAINING_COLUMNS } from './all295Columns';

// Combine all columns - completeColumnStructure already has term and short_definition
export const ALL_295_COLUMNS: ColumnDefinition[] = [
  ...COMPLETE_295_STRUCTURE,
  ...REMAINING_COLUMNS
];

// Sort by order to ensure correct sequence
ALL_295_COLUMNS.sort((a, b) => a.order - b.order);

// Helper functions
export function getColumnById(id: string): ColumnDefinition | undefined {
  return ALL_295_COLUMNS.find(col => col.id === id);
}

export function getColumnsBySection(section: string): ColumnDefinition[] {
  return ALL_295_COLUMNS.filter(col => col.section === section);
}

export function getColumnsByCategory(category: string): ColumnDefinition[] {
  return ALL_295_COLUMNS.filter(col => col.category === category);
}

export function getEssentialColumns(): ColumnDefinition[] {
  return ALL_295_COLUMNS.filter(col => col.category === 'essential');
}

export function getInteractiveColumns(): ColumnDefinition[] {
  return ALL_295_COLUMNS.filter(col => col.isInteractive);
}

export function getMainSections(): string[] {
  return [...new Set(ALL_295_COLUMNS.map(col => col.section))];
}

export function getSubsections(section: string): string[] {
  return [...new Set(
    ALL_295_COLUMNS
      .filter(col => col.section === section && col.subsection)
      .map(col => col.subsection!)
  )];
}

// Export sections for easy access
export const SECTIONS = {
  BASIC: 'basic',
  INTRODUCTION: 'introduction',
  PREREQUISITES: 'prerequisites',
  THEORETICAL: 'theoretical',
  HOW_IT_WORKS: 'how_it_works',
  VARIANTS: 'variants',
  APPLICATIONS: 'applications',
  IMPLEMENTATION: 'implementation',
  PERFORMANCE: 'performance',
  ADVANTAGES_DISADVANTAGES: 'advantages_disadvantages',
  ETHICS: 'ethics',
  HISTORY: 'history',
  ILLUSTRATION: 'illustration',
  RELATED: 'related',
  CASE_STUDIES: 'case_studies',
  RESEARCH: 'research',
  TOOLS: 'tools',
  MISTAKES: 'mistakes',
  SCALABILITY: 'scalability',
  LEARNING: 'learning',
  COMMUNITY: 'community',
  FUTURE: 'future',
  FAQ: 'faq',
  TROUBLESHOOTING: 'troubleshooting',
  INDUSTRY: 'industry',
  EVALUATION: 'evaluation',
  DEPLOYMENT: 'deployment',
  SECURITY: 'security',
  ACCESSIBILITY: 'accessibility',
  INTERACTIVE: 'interactive',
  SUMMARY: 'summary',
  GLOSSARY: 'glossary',
  REFERENCES: 'references',
  UPDATES: 'updates',
  CONTRIBUTIONS: 'contributions',
  ADDITIONAL: 'additional',
  SPECIAL: 'special',
  REGIONAL: 'regional',
  EXERCISES: 'exercises',
  COLLABORATION: 'collaboration',
  CERTIFICATION: 'certification'
};

// Get total column count
export const TOTAL_COLUMNS = ALL_295_COLUMNS.length;

// Build hierarchical tree structure
export function buildHierarchicalTree() {
  const tree: any = {};
  
  ALL_295_COLUMNS.forEach(column => {
    const pathParts = column.path.split('.');
    let current = tree;
    
    pathParts.forEach((part, index) => {
      if (!current[part]) {
        current[part] = {
          metadata: index === pathParts.length - 1 ? column : null,
          children: {}
        };
      }
      current = current[part].children;
    });
  });
  
  return tree;
}

// Get structure statistics
export function getStructureStats() {
  const total = ALL_295_COLUMNS.length;
  const byCategory = {
    essential: ALL_295_COLUMNS.filter(col => col.category === 'essential').length,
    important: ALL_295_COLUMNS.filter(col => col.category === 'important').length,
    supplementary: ALL_295_COLUMNS.filter(col => col.category === 'supplementary').length,
    advanced: ALL_295_COLUMNS.filter(col => col.category === 'advanced').length
  };
  const interactive = ALL_295_COLUMNS.filter(col => col.isInteractive).length;
  const totalTokens = ALL_295_COLUMNS.reduce((sum, col) => sum + col.estimatedTokens, 0);
  
  return {
    total,
    byCategory,
    interactive,
    totalTokens,
    averageTokens: Math.round(totalTokens / total)
  };
}