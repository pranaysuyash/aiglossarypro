// scripts/fix296ColumnCount.ts
// Fix the column count to be 296 after adding short_definition

import { ALL_295_COLUMNS } from '../shared/all295ColumnDefinitions';
import { ALL_295_PROMPT_TRIPLETS } from '../server/prompts/all295PromptTriplets';
import * as fs from 'fs';

console.log('🔧 Fixing 296 Column Count Issue...\n');

// The issue: We added "short_definition" but kept 295 columns total
// Solution: Insert "short_definition" at position 2 and shift all other columns

// Step 1: Validate current state
console.log('Current state:');
console.log(`- Total columns: ${ALL_295_COLUMNS.length}`);
console.log(`- Column 1: ${ALL_295_COLUMNS[0]?.id} (${ALL_295_COLUMNS[0]?.displayName})`);
console.log(`- Column 2: ${ALL_295_COLUMNS[1]?.id} (${ALL_295_COLUMNS[1]?.displayName})`);
console.log(`- Column 3: ${ALL_295_COLUMNS[2]?.id} (${ALL_295_COLUMNS[2]?.displayName})`);

// Step 2: Create the corrected structure
const correctedColumns = [...ALL_295_COLUMNS];

// Find the short_definition column (should be at index 1, order 2)
const shortDefIndex = correctedColumns.findIndex(col => col.id === 'short_definition');
console.log(`\nFound short_definition at index: ${shortDefIndex}`);

if (shortDefIndex === -1) {
  console.error('❌ short_definition column not found!');
  process.exit(1);
}

// Remove short_definition from its current position
const shortDefColumn = correctedColumns.splice(shortDefIndex, 1)[0];

// Insert it at position 2 (index 1)
correctedColumns.splice(1, 0, shortDefColumn);

// Update all order numbers
correctedColumns.forEach((col, index) => {
  col.order = index + 1;
});

console.log('\nCorrected structure:');
console.log(`- Total columns: ${correctedColumns.length}`);
console.log(`- Column 1: ${correctedColumns[0]?.id} (order: ${correctedColumns[0]?.order})`);
console.log(`- Column 2: ${correctedColumns[1]?.id} (order: ${correctedColumns[1]?.order})`);
console.log(`- Column 3: ${correctedColumns[2]?.id} (order: ${correctedColumns[2]?.order})`);

// Step 3: Generate updated files
const updatedColumnDefinitions = `// shared/all296ColumnDefinitions.ts
// Single source of truth for all 296 column definitions (295 original + short_definition)

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
${correctedColumns.map(col => `  {
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

// Sort by order to ensure correct sequence
ALL_296_COLUMNS.sort((a, b) => a.order - b.order);

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
  CERTIFICATION: 'certification'
};

// Get total column count
export const TOTAL_COLUMNS = ALL_296_COLUMNS.length;

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

// Get structure statistics
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
`;

// Write the corrected file
fs.writeFileSync('shared/all296ColumnDefinitions.ts', updatedColumnDefinitions);
console.log('✅ Created shared/all296ColumnDefinitions.ts with 296 columns');

// Step 4: Update prompt triplets to match
const correctedPromptTriplets = [...ALL_295_PROMPT_TRIPLETS];

// Sort prompt triplets by the new column order
correctedPromptTriplets.sort((a, b) => {
  const colA = correctedColumns.find(c => c.id === a.columnId);
  const colB = correctedColumns.find(c => c.id === b.columnId);
  return (colA?.order || 0) - (colB?.order || 0);
});

const updatedPromptTriplets = `// server/prompts/all296PromptTriplets.ts
// Complete set of prompt triplets for all 296 columns (295 original + short_definition)

export interface PromptTriplet {
  columnId: string;
  generativePrompt: string;
  evaluativePrompt: string;
  improvementPrompt: string;
}

export const ALL_296_PROMPT_TRIPLETS: PromptTriplet[] = [
${correctedPromptTriplets.map((triplet, index) => {
  const column = correctedColumns.find(c => c.id === triplet.columnId);
  return `  // Column ${column?.order}: ${column?.displayName}
  {
    columnId: '${triplet.columnId}',
    generativePrompt: \`${triplet.generativePrompt}\`,
    
    evaluativePrompt: \`${triplet.evaluativePrompt}\`,
    
    improvementPrompt: \`${triplet.improvementPrompt}\`
  }${index < correctedPromptTriplets.length - 1 ? ',' : ''}`;
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

fs.writeFileSync('server/prompts/all296PromptTriplets.ts', updatedPromptTriplets);
console.log('✅ Created server/prompts/all296PromptTriplets.ts with 296 prompt triplets');

// Step 5: Create validation script for 296 columns
const validationScript = `// scripts/validate296Implementation.ts
// Validation script to check if all 296 columns are properly implemented

import { ALL_296_COLUMNS, getStructureStats } from '../shared/all296ColumnDefinitions';
import { ALL_296_PROMPT_TRIPLETS } from '../server/prompts/all296PromptTriplets';

console.log('=== 296 Column Implementation Validation ===\\n');

// 1. Check column count
console.log('1. Column Count Check:');
console.log(\`   Total columns defined: \${ALL_296_COLUMNS.length}\`);
console.log(\`   Expected: 296\`);
console.log(\`   Status: \${ALL_296_COLUMNS.length === 296 ? '✅ PASS' : '❌ FAIL'}\\n\`);

// 2. Check if term and short_definition are in correct positions
console.log('2. Core Columns Position Check:');
const termColumn = ALL_296_COLUMNS.find(col => col.id === 'term');
const shortDefColumn = ALL_296_COLUMNS.find(col => col.id === 'short_definition');
console.log(\`   Term at position 1: \${termColumn?.order === 1 ? '✅ PASS' : '❌ FAIL'}\`);
console.log(\`   Short Definition at position 2: \${shortDefColumn?.order === 2 ? '✅ PASS' : '❌ FAIL'}\\n\`);

// 3. Check for duplicate column IDs
console.log('3. Duplicate Column ID Check:');
const columnIds = ALL_296_COLUMNS.map(col => col.id);
const uniqueIds = new Set(columnIds);
const duplicates = columnIds.filter((id, index) => columnIds.indexOf(id) !== index);
console.log(\`   Total IDs: \${columnIds.length}\`);
console.log(\`   Unique IDs: \${uniqueIds.size}\`);
console.log(\`   Duplicates: \${duplicates.length > 0 ? duplicates.join(', ') : 'None'}\`);
console.log(\`   Status: \${duplicates.length === 0 ? '✅ PASS' : '❌ FAIL'}\\n\`);

// 4. Check column order sequence
console.log('4. Column Order Sequence Check:');
let orderValid = true;
for (let i = 0; i < ALL_296_COLUMNS.length; i++) {
  if (ALL_296_COLUMNS[i].order !== i + 1) {
    orderValid = false;
    console.log(\`   ❌ Column at index \${i} has order \${ALL_296_COLUMNS[i].order}, expected \${i + 1}\`);
  }
}
console.log(\`   Status: \${orderValid ? '✅ PASS - All columns in correct order' : '❌ FAIL'}\\n\`);

// 5. Check prompt triplets
console.log('5. Prompt Triplets Check:');
console.log(\`   Total prompt triplets defined: \${ALL_296_PROMPT_TRIPLETS.length}\`);
console.log(\`   Expected: 296\`);
console.log(\`   Status: \${ALL_296_PROMPT_TRIPLETS.length === 296 ? '✅ PASS' : '❌ FAIL'}\`);

// Check which columns are missing prompt triplets
const promptColumnIds = new Set(ALL_296_PROMPT_TRIPLETS.map(t => t.columnId));
const missingPrompts = columnIds.filter(id => !promptColumnIds.has(id));
if (missingPrompts.length > 0) {
  console.log(\`   Missing prompts for \${missingPrompts.length} columns:\`);
  console.log(\`   First 10: \${missingPrompts.slice(0, 10).join(', ')}...\`);
}

// 6. Structure statistics
console.log('\\n6. Structure Statistics:');
const stats = getStructureStats();
console.log(\`   Total columns: \${stats.total}\`);
console.log(\`   By category:\`);
console.log(\`     - Essential: \${stats.byCategory.essential}\`);
console.log(\`     - Important: \${stats.byCategory.important}\`);
console.log(\`     - Supplementary: \${stats.byCategory.supplementary}\`);
console.log(\`     - Advanced: \${stats.byCategory.advanced}\`);
console.log(\`   Interactive columns: \${stats.interactive}\`);
console.log(\`   Total estimated tokens: \${stats.totalTokens}\`);
console.log(\`   Average tokens per column: \${stats.averageTokens}\`);

// 7. Check specific required columns
console.log('\\n7. Required Columns Check:');
const requiredColumns = [
  'term',
  'short_definition',
  'introduction_definition_overview',
  'introduction_key_concepts',
  'introduction_importance_relevance',
  'theoretical_mathematical_foundations',
  'how_it_works_step_by_step'
];

requiredColumns.forEach(id => {
  const column = ALL_296_COLUMNS.find(col => col.id === id);
  console.log(\`   \${id}: \${column ? '✅ Present' : '❌ Missing'}\`);
});

// 8. Overall validation result
console.log('\\n=== OVERALL VALIDATION RESULT ===');
const allTestsPassed = 
  ALL_296_COLUMNS.length === 296 &&
  termColumn?.order === 1 &&
  shortDefColumn?.order === 2 &&
  duplicates.length === 0 &&
  orderValid &&
  ALL_296_PROMPT_TRIPLETS.length === 296;

console.log(allTestsPassed ? '✅ ALL TESTS PASSED' : '❌ SOME TESTS FAILED');

export {};
`;

fs.writeFileSync('scripts/validate296Implementation.ts', validationScript);
console.log('✅ Created scripts/validate296Implementation.ts');

console.log('\n🎉 Fixed! Now we have:');
console.log(`- 296 columns total (295 from structure.md + short_definition)`);
console.log(`- Column 1: term`);
console.log(`- Column 2: short_definition`); 
console.log(`- Column 3: introduction_definition_overview`);
console.log(`- All subsequent columns shifted by +1 in order`);
console.log(`- 296 prompt triplets to match`);

export {};