// scripts/fixOrderNumbers.ts
// Fix the order numbers in the 296-column implementation
import { ALL_296_COLUMNS } from '../shared/all296ColumnDefinitions';
import { ALL_296_PROMPT_TRIPLETS } from '../server/prompts/all296PromptTriplets';
import * as fs from 'fs';
console.log('🔧 Fixing order numbers in 296-column implementation...\n');
// The issue: The order numbers are wrong because we shifted by +1 but didn't recalculate correctly
// Solution: Recalculate all order numbers to be sequential 1-296
// Get all columns and sort them properly
const sortedColumns = [...ALL_296_COLUMNS].sort((a, b) => a.order - b.order);
console.log('Current order issues:');
console.log(`Column at index 0: order ${sortedColumns[0]?.order} (should be 1)`);
console.log(`Column at index 1: order ${sortedColumns[1]?.order} (should be 2)`);
console.log(`Column at index 2: order ${sortedColumns[2]?.order} (should be 3)`);
// Fix the order numbers
const fixedColumns = sortedColumns.map((col, index) => ({
    ...col,
    order: index + 1
}));
console.log('\nFixed structure:');
console.log(`Column 1: ${fixedColumns[0]?.id} (order: ${fixedColumns[0]?.order})`);
console.log(`Column 2: ${fixedColumns[1]?.id} (order: ${fixedColumns[1]?.order})`);
console.log(`Column 3: ${fixedColumns[2]?.id} (order: ${fixedColumns[2]?.order})`);
console.log(`Column 296: ${fixedColumns[295]?.id} (order: ${fixedColumns[295]?.order})`);
// Generate the corrected file
const columnDefinitionsFile = `// shared/all296ColumnDefinitions.ts
// Single source of truth for all 296 column definitions
// 295 columns from original structure.md + 1 short_definition = 296 total

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

export const ALL_296_COLUMNS: ColumnDefinition[] = [
${fixedColumns.map(col => `  {
    id: '${col.id}',
    name: '${col.name}',
    displayName: '${col.displayName}',
    path: '${col.path}',
    parentPath: ${col.parentPath ? `'${col.parentPath}'` : 'null'},
    section: '${col.section}',
    subsection: ${col.subsection ? `'${col.subsection}'` : 'null'},
    subsubsection: ${col.subsubsection ? `'${col.subsubsection}'` : 'null'},
    category: '${col.category}',
    priority: ${col.priority},
    estimatedTokens: ${col.estimatedTokens},
    contentType: '${col.contentType}',
    description: '${col.description}',
    isInteractive: ${col.isInteractive},
    order: ${col.order}
  }`).join(',\n')}
];

// Helper functions
export function getColumnById(id: string): ColumnDefinition | undefined {
  return ALL_296_COLUMNS.find(col => col.id === id);
}

export function getColumnsBySection(section: string): ColumnDefinition[] {
  return ALL_296_COLUMNS.filter(col => col.section === section);
}

export function getColumnsByCategory(category: string): ColumnDefinition[] {
  return ALL_296_COLUMNS.filter(col => col.category === category);
}

export function getEssentialColumns(): ColumnDefinition[] {
  return ALL_296_COLUMNS.filter(col => col.category === 'essential');
}

export function getInteractiveColumns(): ColumnDefinition[] {
  return ALL_296_COLUMNS.filter(col => col.isInteractive);
}

export function getMainSections(): string[] {
  return [...new Set(ALL_296_COLUMNS.map(col => col.section))];
}

export function getSubsections(section: string): string[] {
  return [...new Set(
    ALL_296_COLUMNS
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
  CERTIFICATION: 'certification',
  COMPLETION: 'completion'
};

export const TOTAL_COLUMNS = ALL_296_COLUMNS.length;

export function getStructureStats() {
  const total = ALL_296_COLUMNS.length;
  const byCategory = {
    essential: ALL_296_COLUMNS.filter(col => col.category === 'essential').length,
    important: ALL_296_COLUMNS.filter(col => col.category === 'important').length,
    supplementary: ALL_296_COLUMNS.filter(col => col.category === 'supplementary').length,
    advanced: ALL_296_COLUMNS.filter(col => col.category === 'advanced').length
  };
  const interactive = ALL_296_COLUMNS.filter(col => col.isInteractive).length;
  const totalTokens = ALL_296_COLUMNS.reduce((sum, col) => sum + col.estimatedTokens, 0);
  
  return {
    total,
    byCategory,
    interactive,
    totalTokens,
    averageTokens: Math.round(totalTokens / total)
  };
}

// Build hierarchical tree structure
export function buildHierarchicalTree() {
  const tree: any = {};
  
  ALL_296_COLUMNS.forEach(column => {
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
`;
// Write the corrected file
fs.writeFileSync('shared/all296ColumnDefinitions.ts', columnDefinitionsFile);
console.log('\n✅ Fixed shared/all296ColumnDefinitions.ts with correct order numbers');
// Also fix the prompt triplets to match the new order
const sortedPromptTriplets = ALL_296_PROMPT_TRIPLETS.sort((a, b) => {
    const colA = fixedColumns.find(c => c.id === a.columnId);
    const colB = fixedColumns.find(c => c.id === b.columnId);
    return (colA?.order || 0) - (colB?.order || 0);
});
const promptTripletsFile = `// server/prompts/all296PromptTriplets.ts
// Complete set of prompt triplets for all 296 columns
// 295 columns from original structure.md + 1 short_definition = 296 total

export interface PromptTriplet {
  columnId: string;
  generativePrompt: string;
  evaluativePrompt: string;
  improvementPrompt: string;
}

export const ALL_296_PROMPT_TRIPLETS: PromptTriplet[] = [
${sortedPromptTriplets.map((triplet, index) => {
    const column = fixedColumns.find(c => c.id === triplet.columnId);
    return `  // Column ${column?.order}: ${column?.displayName}
  {
    columnId: '${triplet.columnId}',
    generativePrompt: \`${triplet.generativePrompt}\`,
    
    evaluativePrompt: \`${triplet.evaluativePrompt}\`,
    
    improvementPrompt: \`${triplet.improvementPrompt}\`
  }${index < sortedPromptTriplets.length - 1 ? ',' : ''}`;
}).join('\n\n')}
];

// Helper function to get prompt triplet by column ID
export function getPromptTripletByColumnId(columnId: string): PromptTriplet | undefined {
  return ALL_296_PROMPT_TRIPLETS.find(triplet => triplet.columnId === columnId);
}

// Helper function to validate all columns have prompt triplets
export function validatePromptCompleteness(columnIds: string[]): {
  complete: boolean;
  missing: string[];
} {
  const promptColumnIds = new Set(ALL_296_PROMPT_TRIPLETS.map(t => t.columnId));
  const missing = columnIds.filter(id => !promptColumnIds.has(id));
  
  return {
    complete: missing.length === 0,
    missing
  };
}
`;
fs.writeFileSync('server/prompts/all296PromptTriplets.ts', promptTripletsFile);
console.log('✅ Fixed server/prompts/all296PromptTriplets.ts with correct order');
console.log('\n🎉 Order numbers fixed! All columns now have sequential order 1-296');
