// scripts/findMissingColumn.ts
// Find which column from structure.md is missing from our current implementation

import { ALL_295_COLUMNS } from '../shared/all295ColumnDefinitions';
import * as fs from 'fs';

console.log('🔍 Finding missing column from structure.md...\n');

// Get all lines from structure.md that represent columns
const structureLines = fs.readFileSync('structure.md', 'utf8')
  .split('\n')
  .filter(line => line.trim() && !line.startsWith(' ') && !line.startsWith('{') && !line.startsWith('}'))
  .filter(line => line.match(/^[A-Z]/));

console.log(`Structure.md has ${structureLines.length} columns`);
console.log(`Current implementation has ${ALL_295_COLUMNS.length} columns`);
console.log(`But one of them is 'short_definition' which is NOT in structure.md`);

// Remove short_definition from our current columns to see what we have from structure.md
const currentStructureColumns = ALL_295_COLUMNS.filter(col => col.id !== 'short_definition');
console.log(`\nColumns from structure.md in current implementation: ${currentStructureColumns.length}`);
console.log(`Expected from structure.md: 295`);
console.log(`Missing from structure.md: ${295 - currentStructureColumns.length}`);

// Let's try to map structure.md lines to our current columns
console.log('\nMapping structure.md to current columns...');

// Create a simple mapping function
function lineToId(line: string): string {
  return line
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, '_')
    .replace(/^_+|_+$/g, '');
}

// Map structure lines to expected IDs
const expectedIds = structureLines.map(lineToId);
const currentIds = new Set(currentStructureColumns.map(col => col.id));

console.log('\nFirst 10 expected IDs:');
expectedIds.slice(0, 10).forEach((id, index) => {
  const exists = currentIds.has(id);
  console.log(`  ${index + 1}: ${id} - ${exists ? 'EXISTS' : 'MISSING'}`);
});

// Find missing IDs
const missingIds = expectedIds.filter(id => !currentIds.has(id));
console.log(`\nMissing IDs: ${missingIds.length}`);
if (missingIds.length > 0) {
  console.log('Missing columns:');
  missingIds.forEach(id => {
    const originalLine = structureLines[expectedIds.indexOf(id)];
    console.log(`  - ${id} (from: "${originalLine}")`);
  });
}

// Find extra IDs (shouldn't be any since we filtered out short_definition)
const extraIds = currentStructureColumns.filter(col => !expectedIds.includes(col.id)).map(col => col.id);
console.log(`\nExtra IDs: ${extraIds.length}`);
if (extraIds.length > 0) {
  console.log('Extra columns:');
  extraIds.forEach(id => {
    const col = currentStructureColumns.find(c => c.id === id);
    console.log(`  - ${id} (${col?.displayName})`);
  });
}

// The solution: We need to add back the missing column(s)
if (missingIds.length > 0) {
  console.log('\n🔧 Solution:');
  console.log('1. Add back the missing column(s) from structure.md');
  console.log('2. Keep short_definition as an additional column');
  console.log('3. Total should be 296 columns');
  console.log('4. Update all order numbers accordingly');
} else {
  console.log('\n🤔 No missing columns found. The issue might be elsewhere.');
}

export {};