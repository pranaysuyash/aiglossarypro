// scripts/mergeAllColumns.ts
// Script to properly merge all column definitions

import { COMPLETE_295_STRUCTURE } from '../shared/completeColumnStructure';
import { REMAINING_COLUMNS } from '../shared/all295Columns';

// Get columns from completeColumnStructure (should be 1-63)
console.log(`Columns from completeColumnStructure: ${COMPLETE_295_STRUCTURE.length}`);
console.log(`First column: ${COMPLETE_295_STRUCTURE[0].id} (order: ${COMPLETE_295_STRUCTURE[0].order})`);
console.log(`Last column: ${COMPLETE_295_STRUCTURE[COMPLETE_295_STRUCTURE.length - 1].id} (order: ${COMPLETE_295_STRUCTURE[COMPLETE_295_STRUCTURE.length - 1].order})`);

// Get columns from all295Columns (should be 64-295 but actually has 232 more)
console.log(`\nColumns from all295Columns: ${REMAINING_COLUMNS.length}`);
console.log(`First column: ${REMAINING_COLUMNS[0].id} (order: ${REMAINING_COLUMNS[0].order})`);
console.log(`Last column: ${REMAINING_COLUMNS[REMAINING_COLUMNS.length - 1].id} (order: ${REMAINING_COLUMNS[REMAINING_COLUMNS.length - 1].order})`);

// Check for overlaps
const completeOrders = new Set(COMPLETE_295_STRUCTURE.map(c => c.order));
const remainingOrders = new Set(REMAINING_COLUMNS.map(c => c.order));
const overlaps = [...completeOrders].filter(order => remainingOrders.has(order));

console.log(`\nOverlapping orders: ${overlaps.length}`);
if (overlaps.length > 0) {
  console.log('Overlaps:', overlaps);
}

// Combine all columns
const ALL_COLUMNS = [...COMPLETE_295_STRUCTURE, ...REMAINING_COLUMNS];
console.log(`\nTotal columns after merge: ${ALL_COLUMNS.length}`);

// Check for duplicate orders
const orderCounts = new Map<number, number>();
ALL_COLUMNS.forEach(col => {
  orderCounts.set(col.order, (orderCounts.get(col.order) || 0) + 1);
});

const duplicateOrders = [...orderCounts.entries()].filter(([order, count]) => count > 1);
if (duplicateOrders.length > 0) {
  console.log('\nDuplicate orders found:');
  duplicateOrders.forEach(([order, count]) => {
    console.log(`  Order ${order}: ${count} columns`);
    const dupes = ALL_COLUMNS.filter(c => c.order === order);
    dupes.forEach(col => console.log(`    - ${col.id}`));
  });
}

// Sort by order and check sequence
ALL_COLUMNS.sort((a, b) => a.order - b.order);
console.log('\nChecking order sequence...');
let hasGaps = false;
for (let i = 0; i < ALL_COLUMNS.length; i++) {
  if (ALL_COLUMNS[i].order !== i + 1) {
    if (!hasGaps) {
      console.log('Order sequence has gaps or issues:');
      hasGaps = true;
    }
    console.log(`  Position ${i}: expected order ${i + 1}, got ${ALL_COLUMNS[i].order} (${ALL_COLUMNS[i].id})`);
  }
}

if (!hasGaps) {
  console.log('✅ Order sequence is correct (1-295)');
}

// Final summary
console.log('\n=== SUMMARY ===');
console.log(`Total unique columns: ${ALL_COLUMNS.length}`);
console.log(`Expected: 295`);
console.log(`Status: ${ALL_COLUMNS.length === 295 ? '✅ COMPLETE' : '❌ INCOMPLETE'}`);

export {};