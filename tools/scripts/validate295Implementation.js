// scripts/validate295Implementation.ts
// Validation script to check if all 295 columns are properly implemented
import { ALL_295_COLUMNS, getStructureStats } from '../shared/all295ColumnDefinitions';
import { ALL_295_PROMPT_TRIPLETS } from '../server/prompts/all295PromptTriplets';
console.log('=== 295 Column Implementation Validation ===\n');
// 1. Check column count
console.log('1. Column Count Check:');
console.log(`   Total columns defined: ${ALL_295_COLUMNS.length}`);
console.log(`   Expected: 295`);
console.log(`   Status: ${ALL_295_COLUMNS.length === 295 ? '✅ PASS' : '❌ FAIL'}\n`);
// 2. Check if term and short_definition are in correct positions
console.log('2. Core Columns Position Check:');
const termColumn = ALL_295_COLUMNS.find(col => col.id === 'term');
const shortDefColumn = ALL_295_COLUMNS.find(col => col.id === 'short_definition');
console.log(`   Term at position 1: ${termColumn?.order === 1 ? '✅ PASS' : '❌ FAIL'}`);
console.log(`   Short Definition at position 2: ${shortDefColumn?.order === 2 ? '✅ PASS' : '❌ FAIL'}\n`);
// 3. Check for duplicate column IDs
console.log('3. Duplicate Column ID Check:');
const columnIds = ALL_295_COLUMNS.map(col => col.id);
const uniqueIds = new Set(columnIds);
const duplicates = columnIds.filter((id, index) => columnIds.indexOf(id) !== index);
console.log(`   Total IDs: ${columnIds.length}`);
console.log(`   Unique IDs: ${uniqueIds.size}`);
console.log(`   Duplicates: ${duplicates.length > 0 ? duplicates.join(', ') : 'None'}`);
console.log(`   Status: ${duplicates.length === 0 ? '✅ PASS' : '❌ FAIL'}\n`);
// 4. Check column order sequence
console.log('4. Column Order Sequence Check:');
let orderValid = true;
for (let i = 0; i < ALL_295_COLUMNS.length; i++) {
    if (ALL_295_COLUMNS[i].order !== i + 1) {
        orderValid = false;
        console.log(`   ❌ Column at index ${i} has order ${ALL_295_COLUMNS[i].order}, expected ${i + 1}`);
    }
}
console.log(`   Status: ${orderValid ? '✅ PASS - All columns in correct order' : '❌ FAIL'}\n`);
// 5. Check prompt triplets
console.log('5. Prompt Triplets Check:');
console.log(`   Total prompt triplets defined: ${ALL_295_PROMPT_TRIPLETS.length}`);
console.log(`   Expected: 295`);
console.log(`   Status: ${ALL_295_PROMPT_TRIPLETS.length === 295 ? '✅ PASS' : '❌ FAIL'}`);
// Check which columns are missing prompt triplets
const promptColumnIds = new Set(ALL_295_PROMPT_TRIPLETS.map(t => t.columnId));
const missingPrompts = columnIds.filter(id => !promptColumnIds.has(id));
if (missingPrompts.length > 0) {
    console.log(`   Missing prompts for ${missingPrompts.length} columns:`);
    console.log(`   First 10: ${missingPrompts.slice(0, 10).join(', ')}...`);
}
// 6. Structure statistics
console.log('\n6. Structure Statistics:');
const stats = getStructureStats();
console.log(`   Total columns: ${stats.total}`);
console.log(`   By category:`);
console.log(`     - Essential: ${stats.byCategory.essential}`);
console.log(`     - Important: ${stats.byCategory.important}`);
console.log(`     - Supplementary: ${stats.byCategory.supplementary}`);
console.log(`     - Advanced: ${stats.byCategory.advanced}`);
console.log(`   Interactive columns: ${stats.interactive}`);
console.log(`   Total estimated tokens: ${stats.totalTokens}`);
console.log(`   Average tokens per column: ${stats.averageTokens}`);
// 7. Check specific required columns
console.log('\n7. Required Columns Check:');
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
    const column = ALL_295_COLUMNS.find(col => col.id === id);
    console.log(`   ${id}: ${column ? '✅ Present' : '❌ Missing'}`);
});
// 8. Overall validation result
console.log('\n=== OVERALL VALIDATION RESULT ===');
const allTestsPassed = ALL_295_COLUMNS.length === 295 &&
    termColumn?.order === 1 &&
    shortDefColumn?.order === 2 &&
    duplicates.length === 0 &&
    orderValid;
console.log(allTestsPassed ? '✅ ALL TESTS PASSED' : '❌ SOME TESTS FAILED');
