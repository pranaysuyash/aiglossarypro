// scripts/manualFix296.ts
// Manually fix the 296 column issue by properly analyzing the current structure

import { ALL_295_COLUMNS } from '../shared/all295ColumnDefinitions';
import { ALL_295_PROMPT_TRIPLETS } from '../server/prompts/all295PromptTriplets';

console.log('🔍 Analyzing current structure...');

// Current structure analysis
console.log(`Current ALL_295_COLUMNS.length: ${ALL_295_COLUMNS.length}`);
console.log(`Current ALL_295_PROMPT_TRIPLETS.length: ${ALL_295_PROMPT_TRIPLETS.length}`);

// Find term and short_definition
const termColumn = ALL_295_COLUMNS.find(col => col.id === 'term');
const shortDefColumn = ALL_295_COLUMNS.find(col => col.id === 'short_definition');

console.log('\nCurrent structure:');
console.log(`Term column: ${termColumn ? 'FOUND' : 'NOT FOUND'} (order: ${termColumn?.order})`);
console.log(`Short definition column: ${shortDefColumn ? 'FOUND' : 'NOT FOUND'} (order: ${shortDefColumn?.order})`);

// The issue: We have 295 columns total, but we should have 296 because we added short_definition
// The solution: Check if we accidentally removed a column when we added short_definition

// Let's check what the original structure.md contains
import * as fs from 'fs';

const structureLines = fs.readFileSync('structure.md', 'utf8')
  .split('\n')
  .filter(line => line.trim() && !line.startsWith(' ') && !line.startsWith('{') && !line.startsWith('}'))
  .filter(line => line.match(/^[A-Z]/));

console.log(`\nOriginal structure.md column count: ${structureLines.length}`);
console.log('First 5 original columns:');
structureLines.slice(0, 5).forEach((line, index) => {
  console.log(`  ${index + 1}: ${line}`);
});

// Let's check the current column IDs and see what's missing
const currentIds = new Set(ALL_295_COLUMNS.map(col => col.id));
console.log('\nChecking if we have the expected columns...');

// Create expected ID mapping from structure.md
const expectedIds = [
  'term', // This should be column 1
  'short_definition', // This should be column 2 (ADDED)
  'introduction_definition_overview', // This should be column 3 (from "Introduction – Definition and Overview")
  'introduction_key_concepts', // This should be column 4 (from "Introduction – Key Concepts and Principles")
  'introduction_importance_relevance', // This should be column 5 (from "Introduction – Importance and Relevance in AI/ML")
];

expectedIds.forEach(id => {
  const exists = currentIds.has(id);
  console.log(`  ${id}: ${exists ? 'EXISTS' : 'MISSING'}`);
});

// The real issue: Let's see what our current order 295 column is
const lastColumn = ALL_295_COLUMNS.find(col => col.order === 295);
console.log(`\nCurrent last column (order 295): ${lastColumn?.id} - ${lastColumn?.displayName}`);

// Check orders
const orders = ALL_295_COLUMNS.map(col => col.order).sort((a, b) => a - b);
console.log(`\nOrder range: ${orders[0]} to ${orders[orders.length - 1]}`);
console.log(`Expected range: 1 to 296`);

// Look for gaps in orders
const gaps = [];
for (let i = 1; i <= 296; i++) {
  if (!orders.includes(i)) {
    gaps.push(i);
  }
}
console.log(`Gaps in order sequence: ${gaps.length > 0 ? gaps.join(', ') : 'None'}`);

// The fix: We need to create a proper 296-column structure
// 1. Keep 'term' at position 1
// 2. Keep 'short_definition' at position 2  
// 3. Shift all other columns from the original 295 to positions 3-296

const fixed296Columns = [];

// Add term at position 1
if (termColumn) {
  fixed296Columns.push({ ...termColumn, order: 1 });
}

// Add short_definition at position 2
if (shortDefColumn) {
  fixed296Columns.push({ ...shortDefColumn, order: 2 });
}

// Add all other columns (from original 295 structure) at positions 3-296
let nextOrder = 3;
ALL_295_COLUMNS.forEach(col => {
  if (col.id !== 'term' && col.id !== 'short_definition') {
    fixed296Columns.push({ ...col, order: nextOrder });
    nextOrder++;
  }
});

console.log(`\nFixed structure:`);
console.log(`  Total columns: ${fixed296Columns.length}`);
console.log(`  Column 1: ${fixed296Columns[0]?.id} (${fixed296Columns[0]?.displayName})`);
console.log(`  Column 2: ${fixed296Columns[1]?.id} (${fixed296Columns[1]?.displayName})`);
console.log(`  Column 3: ${fixed296Columns[2]?.id} (${fixed296Columns[2]?.displayName})`);
console.log(`  Last column: ${fixed296Columns[fixed296Columns.length - 1]?.id} (order: ${fixed296Columns[fixed296Columns.length - 1]?.order})`);

if (fixed296Columns.length === 296) {
  console.log('\n✅ Successfully created 296-column structure!');
  
  // Update todos
  console.log('\n📝 This fixes the column count issue:');
  console.log('- Original structure.md: 295 columns');
  console.log('- Added short_definition: +1 column');
  console.log('- Total: 296 columns');
  console.log('- All orders now range from 1 to 296');
} else {
  console.log(`\n❌ Still wrong count: ${fixed296Columns.length}`);
}

export {};