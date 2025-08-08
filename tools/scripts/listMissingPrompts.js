// scripts/listMissingPrompts.ts
// List which columns are missing prompt triplets
import { ALL_295_COLUMNS } from '../shared/all295ColumnDefinitions';
import { ALL_295_PROMPT_TRIPLETS } from '../server/prompts/all295PromptTriplets';
const promptColumnIds = new Set(ALL_295_PROMPT_TRIPLETS.map(t => t.columnId));
const missingPrompts = ALL_295_COLUMNS.filter(col => !promptColumnIds.has(col.id));
console.log(`Total columns: ${ALL_295_COLUMNS.length}`);
console.log(`Prompt triplets defined: ${ALL_295_PROMPT_TRIPLETS.length}`);
console.log(`Missing prompt triplets: ${missingPrompts.length}\n`);
console.log('First 30 columns missing prompt triplets:');
missingPrompts.slice(0, 30).forEach((col, index) => {
    console.log(`${index + 1}. [${col.order}] ${col.id} - ${col.displayName} (${col.section})`);
});
if (missingPrompts.length > 30) {
    console.log(`\n... and ${missingPrompts.length - 30} more columns`);
}
// Group by section
const bySection = missingPrompts.reduce((acc, col) => {
    if (!acc[col.section])
        acc[col.section] = [];
    acc[col.section].push(col);
    return acc;
}, {});
console.log('\nMissing prompts by section:');
Object.entries(bySection).forEach(([section, cols]) => {
    console.log(`  ${section}: ${cols.length} columns`);
});
