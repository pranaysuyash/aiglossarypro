// scripts/addShortDefinitionColumn.ts
// Properly add short_definition column to the original 295 columns from structure.md

import { ALL_295_COLUMNS } from '../shared/all295ColumnDefinitions';
import { ALL_295_PROMPT_TRIPLETS } from '../server/prompts/all295PromptTriplets';
import * as fs from 'fs';

console.log('🔧 Adding short_definition column to original 295 columns...\n');

// Step 1: Check if short_definition already exists
const existingShortDef = ALL_295_COLUMNS.find(col => col.id === 'short_definition');
if (!existingShortDef) {
  console.error('❌ short_definition column not found in current structure!');
  console.log('Current columns 1-5:');
  ALL_295_COLUMNS.slice(0, 5).forEach(col => {
    console.log(`  ${col.order}: ${col.id} - ${col.displayName}`);
  });
  process.exit(1);
}

console.log('✅ Found existing short_definition column');
console.log(`   Currently at position: ${existingShortDef.order}`);
console.log(`   ID: ${existingShortDef.id}`);
console.log(`   Display: ${existingShortDef.displayName}`);

// Step 2: The issue is that we need to understand what the original structure was
// Let me check if we replaced something or if we're actually missing a column

// Let's look at the original structure.md and compare
const structureLines = fs.readFileSync('structure.md', 'utf8').split('\n').filter(line => line.trim() && !line.startsWith(' '));
console.log(`\\nOriginal structure.md has ${structureLines.length} non-empty lines`);
console.log('First 10 lines:');
structureLines.slice(0, 10).forEach((line, index) => {
  console.log(`  ${index + 1}: ${line}`);
});

// Check if short_definition exists in structure.md
const hasShortDef = structureLines.some(line => line.toLowerCase().includes('short') && line.toLowerCase().includes('definition'));
console.log(`\\nDoes structure.md contain short_definition? ${hasShortDef ? 'YES' : 'NO'}`);

if (!hasShortDef) {
  console.log('\\n✅ Confirmed: short_definition is NOT in original structure.md');
  console.log('We need to add it as a new column, making 296 total');
  
  // Create the proper 296-column structure
  const columns296 = [];
  
  // Add term as column 1
  const termColumn = ALL_295_COLUMNS.find(col => col.id === 'term');
  if (termColumn) {
    columns296.push({ ...termColumn, order: 1 });
  }
  
  // Add short_definition as column 2
  const shortDefColumn = ALL_295_COLUMNS.find(col => col.id === 'short_definition');
  if (shortDefColumn) {
    columns296.push({ ...shortDefColumn, order: 2 });
  }
  
  // Add all other columns (shifting their order by +1)
  ALL_295_COLUMNS.forEach(col => {
    if (col.id !== 'term' && col.id !== 'short_definition') {
      columns296.push({ ...col, order: col.order + 1 });
    }
  });
  
  // Sort by order
  columns296.sort((a, b) => a.order - b.order);
  
  console.log(`\\nCreated 296-column structure:`);
  console.log(`  Total columns: ${columns296.length}`);
  console.log(`  Column 1: ${columns296[0]?.id} (${columns296[0]?.displayName})`);
  console.log(`  Column 2: ${columns296[1]?.id} (${columns296[1]?.displayName})`);
  console.log(`  Column 3: ${columns296[2]?.id} (${columns296[2]?.displayName})`);
  console.log(`  Last column: ${columns296[columns296.length - 1]?.id} (order: ${columns296[columns296.length - 1]?.order})`);
  
  // Generate the file
  const fileContent = `// shared/all296ColumnDefinitions.ts
// Single source of truth for all 296 column definitions (295 from structure.md + short_definition)

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
${columns296.map(col => `  {
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

// Helper functions (same as before)
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

// Export sections
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
`;

  fs.writeFileSync('shared/all296ColumnDefinitions.ts', fileContent);
  console.log('\\n✅ Created shared/all296ColumnDefinitions.ts with 296 columns');
  
  // Now create the corresponding prompt triplets
  const promptTriplets296 = [];
  
  // Add all existing prompt triplets in the correct order
  columns296.forEach(col => {
    const existingTriplet = ALL_295_PROMPT_TRIPLETS.find(t => t.columnId === col.id);
    if (existingTriplet) {
      promptTriplets296.push(existingTriplet);
    }
  });
  
  const promptFileContent = `// server/prompts/all296PromptTriplets.ts
// Complete set of prompt triplets for all 296 columns (295 from structure.md + short_definition)

export interface PromptTriplet {
  columnId: string;
  generativePrompt: string;
  evaluativePrompt: string;
  improvementPrompt: string;
}

export const ALL_296_PROMPT_TRIPLETS: PromptTriplet[] = [
${promptTriplets296.map((triplet, index) => {
  const column = columns296.find(c => c.id === triplet.columnId);
  return `  // Column ${column?.order}: ${column?.displayName}
  {
    columnId: '${triplet.columnId}',
    generativePrompt: \`${triplet.generativePrompt}\`,
    
    evaluativePrompt: \`${triplet.evaluativePrompt}\`,
    
    improvementPrompt: \`${triplet.improvementPrompt}\`
  }${index < promptTriplets296.length - 1 ? ',' : ''}`;
}).join('\\n\\n')}
];

// Helper functions
export function getPromptTripletByColumnId(columnId: string): PromptTriplet | undefined {
  return ALL_296_PROMPT_TRIPLETS.find(triplet => triplet.columnId === columnId);
}

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

  fs.writeFileSync('server/prompts/all296PromptTriplets.ts', promptFileContent);
  console.log('✅ Created server/prompts/all296PromptTriplets.ts with 296 prompt triplets');
  
  console.log('\\n🎉 Successfully created 296-column structure!');
  console.log('- 295 columns from original structure.md');
  console.log('- 1 additional short_definition column');
  console.log('- Total: 296 columns');
  
} else {
  console.log('\\n❌ Unexpected: short_definition found in structure.md');
  console.log('This means we might have miscounted or misunderstood the original structure');
}

export {};