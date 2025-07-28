#!/usr/bin/env node

/**
 * Script to fix duplicate Request/Response type imports from Express
 * This addresses the critical TypeScript compilation errors blocking deployment
 */

import { readFileSync, writeFileSync } from 'fs';
import { glob } from 'glob';

interface FixResult {
    file: string;
    changes: string[];
    success: boolean;
    error?: string;
}

function fixDuplicateExpressTypes(filePath: string): FixResult {
    const result: FixResult = {
        file: filePath,
        changes: [],
        success: false
    };

    try {
        const content = readFileSync(filePath, 'utf-8');
        let fixed = content;

        // Pattern 1: Remove duplicate import type lines
        const duplicateImportPattern = /import type { Request, Response } from 'express';\s*\n/g;
        const matches = content.match(duplicateImportPattern);
        if (matches && matches.length > 1) {
            // Keep only the first occurrence, remove the rest
            let count = 0;
            fixed = fixed.replace(duplicateImportPattern, (match) => {
                count++;
                if (count === 1) {
                    return match; // Keep the first one
                } else {
                    result.changes.push(`Removed duplicate import type { Request, Response } from 'express'`);
                    return ''; // Remove subsequent ones
                }
            });
        }

        // Pattern 2: Merge imports when we have both regular and type imports
        const regularImportPattern = /import\s+({[^}]+})\s+from\s+['"]express['"];?\s*\n/;
        const typeImportPattern = /import\s+type\s+({[^}]+})\s+from\s+['"]express['"];?\s*\n/;

        const regularMatch = fixed.match(regularImportPattern);
        const typeMatch = fixed.match(typeImportPattern);

        if (regularMatch && typeMatch) {
            // Extract imports from both
            const regularImports = regularMatch[1].replace(/[{}]/g, '').split(',').map(s => s.trim()).filter(Boolean);
            const typeImports = typeMatch[1].replace(/[{}]/g, '').split(',').map(s => s.trim()).filter(Boolean);

            // Separate runtime vs type-only imports
            const runtimeImports = regularImports.filter(imp => !['Request', 'Response', 'NextFunction'].includes(imp));
            const allTypeImports = [...new Set([...typeImports, ...regularImports.filter(imp => ['Request', 'Response', 'NextFunction'].includes(imp))])];

            // Build new import statements
            let newImports = '';
            if (runtimeImports.length > 0) {
                newImports += `import { ${runtimeImports.join(', ')} } from 'express';\n`;
            }
            if (allTypeImports.length > 0) {
                newImports += `import type { ${allTypeImports.join(', ')} } from 'express';\n`;
            }

            // Replace both import statements with the merged ones
            fixed = fixed.replace(regularImportPattern, '');
            fixed = fixed.replace(typeImportPattern, newImports);

            result.changes.push(`Merged Express imports: runtime=[${runtimeImports.join(', ')}], types=[${allTypeImports.join(', ')}]`);
        }

        // Pattern 3: Fix cases where we have conflicting imports in the same line
        const conflictingPattern = /import\s+type\s+{\s*([^}]*Request[^}]*Response[^}]*|[^}]*Response[^}]*Request[^}]*)\s*}\s+from\s+['"]express['"];?\s*\nimport\s+type\s+{\s*([^}]*Request[^}]*Response[^}]*|[^}]*Response[^}]*Request[^}]*)\s*}\s+from\s+['"]express['"];?\s*/g;

        if (conflictingPattern.test(fixed)) {
            fixed = fixed.replace(conflictingPattern, (match, imports1, imports2) => {
                const allImports = [...new Set([
                    ...imports1.split(',').map((s: string) => s.trim()).filter(Boolean),
                    ...imports2.split(',').map((s: string) => s.trim()).filter(Boolean)
                ])];
                result.changes.push(`Merged conflicting Express type imports: [${allImports.join(', ')}]`);
                return `import type { ${allImports.join(', ')} } from 'express';\n`;
            });
        }

        // Only write if we made changes
        if (result.changes.length > 0) {
            writeFileSync(filePath, fixed, 'utf-8');
            result.success = true;
            console.log(`✅ Fixed ${filePath}: ${result.changes.join(', ')}`);
        } else {
            result.success = true; // No changes needed is also success
        }

    } catch (error) {
        result.error = error instanceof Error ? error.message : String(error);
        console.error(`❌ Error fixing ${filePath}: ${result.error}`);
    }

    return result;
}

async function main() {
    console.log('🔧 Fixing duplicate Express type imports...\n');

    // Find all TypeScript files in server directory
    const files = await glob('server/**/*.ts', { ignore: ['node_modules/**', 'dist/**'] });

    const results: FixResult[] = [];
    let fixedCount = 0;
    let errorCount = 0;

    for (const file of files) {
        const result = fixDuplicateExpressTypes(file);
        results.push(result);

        if (result.success && result.changes.length > 0) {
            fixedCount++;
        } else if (!result.success) {
            errorCount++;
        }
    }

    // Also check shared directory
    const sharedFiles = await glob('shared/**/*.ts', { ignore: ['node_modules/**', 'dist/**'] });
    for (const file of sharedFiles) {
        const result = fixDuplicateExpressTypes(file);
        results.push(result);

        if (result.success && result.changes.length > 0) {
            fixedCount++;
        } else if (!result.success) {
            errorCount++;
        }
    }

    console.log(`\n📊 Summary:`);
    console.log(`   Files processed: ${results.length}`);
    console.log(`   Files fixed: ${fixedCount}`);
    console.log(`   Errors: ${errorCount}`);

    if (errorCount > 0) {
        console.log(`\n❌ Files with errors:`);
        results.filter(r => !r.success).forEach(r => {
            console.log(`   ${r.file}: ${r.error}`);
        });
    }

    console.log(`\n✅ Duplicate Express type import fixes complete!`);
    console.log(`   Run 'npm run build:server' to test the fixes.`);
}

if (import.meta.url === `file://${process.argv[1]}`) {
    main().catch(console.error);
}