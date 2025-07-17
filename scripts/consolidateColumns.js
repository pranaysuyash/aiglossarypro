// Script to consolidate all column definitions into a single file
const fs = require('fs');
const path = require('path');

// Read the complete column structure (1-63)
const completeStructureFile = fs.readFileSync(
  path.join(__dirname, '../shared/completeColumnStructure.ts'), 
  'utf8'
);

// Extract columns 1-63 from completeColumnStructure
const completeColumns = [];
const completeMatch = completeStructureFile.match(/COMPLETE_295_STRUCTURE = \[([\s\S]*?)\];/);
if (completeMatch) {
  const columnDefs = completeMatch[1];
  const columnMatches = columnDefs.matchAll(/\{[\s\S]*?order:\s*(\d+)\s*\}/g);
  for (const match of columnMatches) {
    completeColumns.push(match[0]);
  }
}

// Read all295Columns (64-295)
const all295File = fs.readFileSync(
  path.join(__dirname, '../shared/all295Columns.ts'), 
  'utf8'
);

// Extract columns 64-295
const remainingColumns = [];
const remainingMatch = all295File.match(/REMAINING_COLUMNS: ColumnDefinition\[\] = \[([\s\S]*?)\];/);
if (remainingMatch) {
  const columnDefs = remainingMatch[1];
  const columnMatches = columnDefs.matchAll(/\{[\s\S]*?order:\s*(\d+)\s*\}/g);
  for (const match of columnMatches) {
    remainingColumns.push(match[0]);
  }
}

// Create consolidated file content
const consolidatedContent = `// shared/completeColumnDefinitions.ts
// Single source of truth for all 295 column definitions
// Consolidated from multiple files into one complete structure

export interface ColumnDefinition {
  id: string;
  name: string;
  displayName: string;
  path: string;
  parentPath?: string | null;
  section: string;
  subsection?: string;
  subsubsection?: string;
  category: 'essential' | 'important' | 'supplementary' | 'advanced';
  priority: 1 | 2 | 3 | 4 | 5;
  estimatedTokens: number;
  contentType: 'text' | 'markdown' | 'code' | 'array' | 'object' | 'interactive';
  description: string;
  isInteractive: boolean;
  order: number;
}

export const ALL_295_COLUMNS: ColumnDefinition[] = [
${completeColumns.join(',\n')}${completeColumns.length > 0 && remainingColumns.length > 0 ? ',' : ''}
${remainingColumns.join(',\n')}
];

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

console.log(\`Total columns found: \${ALL_295_COLUMNS.length}\`);
`;

console.log(`Found ${completeColumns.length} columns from completeColumnStructure.ts`);
console.log(`Found ${remainingColumns.length} columns from all295Columns.ts`);
console.log(`Total: ${completeColumns.length + remainingColumns.length} columns`);

// Write consolidated file
fs.writeFileSync(
  path.join(__dirname, '../shared/completeColumnDefinitions.ts'),
  consolidatedContent
);

console.log('Consolidation complete!');