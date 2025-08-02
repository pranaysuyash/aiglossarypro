#!/usr/bin/env node
/**
 * Remove unused imports and declarations to reduce TypeScript errors
 */
import { readFileSync, writeFileSync } from 'fs';
import { glob } from 'glob';
async function main() {
    console.log('🔧 Removing unused imports and declarations...\n');
    const files = await glob('server/**/*.ts', { ignore: ['node_modules/**', 'dist/**'] });
    let fixedCount = 0;
    for (const file of files) {
        try {
            const content = readFileSync(file, 'utf-8');
            let fixed = content;
            let changed = false;
            // Remove unused import items (but keep the import statement structure)
            const unusedImports = [
                'SearchFacets', 'AdminActivity', 'TableStatistics', 'IndexStatistics',
                'ConnectionStatistics', 'QueryPerformance', 'Term', 'User',
                'PersonalizedRecommendation', 'LearningPath', 'ICategory', 'ITerm',
                'PaginatedResult', 'ApiResponse'
            ];
            for (const unusedImport of unusedImports) {
                // Remove from import statements
                const importPattern = new RegExp(`\\s*,?\\s*${unusedImport}\\s*,?`, 'g');
                if (fixed.includes(unusedImport) && fixed.includes(`error TS6196: '${unusedImport}' is declared but never used`)) {
                    fixed = fixed.replace(importPattern, '');
                    changed = true;
                }
            }
            // Clean up empty import lines or trailing commas
            fixed = fixed.replace(/import\s*{\s*,\s*}/g, '');
            fixed = fixed.replace(/{\s*,/g, '{');
            fixed = fixed.replace(/,\s*}/g, '}');
            fixed = fixed.replace(/,\s*,/g, ',');
            if (changed) {
                writeFileSync(file, fixed, 'utf-8');
                console.log(`✅ Fixed ${file}`);
                fixedCount++;
            }
        }
        catch (error) {
            console.error(`❌ Error fixing ${file}:`, error);
        }
    }
    console.log(`\n📊 Fixed ${fixedCount} files`);
}
main().catch(console.error);
