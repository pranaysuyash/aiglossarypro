#!/usr/bin/env node

/**
 * Fix the most common TypeScript error patterns across all files
 */

import { readFileSync, writeFileSync } from 'fs';

interface FixResult {
    file: string;
    changes: string[];
    success: boolean;
    error?: string;
}

function fixCommonPatterns(filePath: string): FixResult {
    const result: FixResult = {
        file: filePath,
        changes: [],
        success: false
    };

    try {
        const content = readFileSync(filePath, 'utf-8');
        let fixed = content;

        // Pattern 1: Add missing const db = getDb() in functions that use db but import getDb
        if (fixed.includes('import { getDb }') && fixed.includes('await db.')) {
            // Find functions that use db but don't initialize it
            const functionMatches = fixed.match(/(async\s+function\s+\w+[^{]*{|async\s+\w+\s*\([^)]*\)\s*[^{]*{|\w+\s*:\s*async\s*\([^)]*\)\s*[^{]*{)/g);

            if (functionMatches) {
                for (const funcMatch of functionMatches) {
                    const funcStart = fixed.indexOf(funcMatch);
                    const funcEnd = findMatchingBrace(fixed, funcStart + funcMatch.length - 1);

                    if (funcEnd !== -1) {
                        const funcBody = fixed.substring(funcStart, funcEnd);

                        if (funcBody.includes('await db.') && !funcBody.includes('const db = getDb()')) {
                            const insertPoint = funcStart + funcMatch.length;
                            fixed = fixed.substring(0, insertPoint) + '\n    const db = getDb();' + fixed.substring(insertPoint);
                            result.changes.push('Added const db = getDb() to function');
                            break; // Only fix one at a time to avoid offset issues
                        }
                    }
                }
            }
        }

        // Pattern 2: Fix Response.status() calls - add proper typing
        if (fixed.includes('res.status(') && fixed.includes('Property \'status\' does not exist')) {
            // This needs proper Express Response typing - skip for now as it's complex
        }

        // Pattern 3: Fix unknown type assertions for common patterns
        const unknownPatterns = [
            { pattern: /(\w+)\.(\w+) is of type 'unknown'/g, fix: '($1 as any).$2' },
        ];

        // Pattern 4: Remove unused variables that are declared but never read
        const unusedVarPattern = /(\s+)(const|let|var)\s+(\w+)\s*[=:][^;]+;?\s*\n/g;
        // This is too risky to do automatically

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

function findMatchingBrace(content: string, startIndex: number): number {
    let braceCount = 1;
    let index = startIndex + 1;

    while (index < content.length && braceCount > 0) {
        if (content[index] === '{') {
            braceCount++;
        } else if (content[index] === '}') {
            braceCount--;
        }
        index++;
    }

    return braceCount === 0 ? index : -1;
}

async function main() {
    console.log('🔧 Fixing common TypeScript patterns...\n');

    // Focus on server files with the most errors
    const highErrorFiles = [
        'server/enhancedStorage.ts',
        'server/storage.ts',
        'server/optimizedStorage.ts',
        'server/enhancedStorage.backup.ts',
        'server/optimizedBatchImporter.ts'
    ];

    const results: FixResult[] = [];
    let fixedCount = 0;
    let errorCount = 0;

    for (const file of highErrorFiles) {
        const result = fixCommonPatterns(file);
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

    console.log(`\n✅ Common pattern fixes complete!`);
    console.log(`   Run 'npm run build:server' to test the fixes.`);
}

if (import.meta.url === `file://${process.argv[1]}`) {
    main().catch(console.error);
}