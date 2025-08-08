#!/usr/bin/env node
/**
 * Script to fix database import and usage patterns
 * Changes `db` function calls to proper `getDb()` usage
 */
import { readFileSync, writeFileSync } from 'fs';
import { glob } from 'glob';
function fixDatabaseUsage(filePath) {
    const result = {
        file: filePath,
        changes: [],
        success: false
    };
    try {
        const content = readFileSync(filePath, 'utf-8');
        let fixed = content;
        // Pattern 1: Fix import statements
        // Change: import { db } from '../db'
        // To: import { getDb } from '../db'
        const importPattern = /import\s*{\s*([^}]*\b)db(\b[^}]*)\s*}\s*from\s*['"][^'"]*\/db(?:\.js)?['"];?/g;
        fixed = fixed.replace(importPattern, (match, before, after) => {
            // If it already has getDb, don't change
            if (match.includes('getDb')) {
                return match;
            }
            const beforeClean = before ? before.trim().replace(/,$/, '') : '';
            const afterClean = after ? after.trim().replace(/^,/, '') : '';
            let newImports = [];
            if (beforeClean)
                newImports.push(beforeClean);
            newImports.push('getDb');
            if (afterClean)
                newImports.push(afterClean);
            const newImportList = newImports.filter(Boolean).join(', ');
            const newImport = match.replace(/{\s*[^}]*\s*}/, `{ ${newImportList} }`);
            result.changes.push(`Updated import to include getDb`);
            return newImport;
        });
        // Pattern 2: Fix usage patterns
        // Change: await db.select()
        // To: const db = getDb(); await db.select()
        // First, find all function/method contexts where db is used
        const dbUsagePattern = /(\w+\.)?db\.(select|insert|update|delete|execute|transaction)/g;
        const matches = [...fixed.matchAll(dbUsagePattern)];
        if (matches.length > 0) {
            // Add getDb() call at the beginning of functions that use db
            const functionPattern = /((?:async\s+)?(?:function\s+\w+|(?:\w+\s*[:=]\s*)?(?:async\s+)?\([^)]*\)\s*(?::\s*[^{]+)?\s*=>\s*|(?:async\s+)?\w+\s*\([^)]*\)\s*(?::\s*[^{]+)?\s*)\{)/g;
            fixed = fixed.replace(functionPattern, (match, funcStart) => {
                // Check if this function uses db
                const funcEndIndex = fixed.indexOf('}', fixed.indexOf(match));
                const funcBody = fixed.substring(fixed.indexOf(match), funcEndIndex);
                if (funcBody.includes('db.') && !funcBody.includes('const db = getDb()') && !funcBody.includes('getDb()')) {
                    result.changes.push(`Added getDb() call in function`);
                    return funcStart + '\n    const db = getDb();';
                }
                return match;
            });
        }
        // Pattern 3: Simple direct usage fixes
        // For cases where we just need to replace db() with getDb()
        const directCallPattern = /\bdb\(\)/g;
        if (directCallPattern.test(fixed)) {
            fixed = fixed.replace(directCallPattern, 'getDb()');
            result.changes.push(`Replaced db() calls with getDb()`);
        }
        // Only write if we made changes
        if (result.changes.length > 0) {
            writeFileSync(filePath, fixed, 'utf-8');
            result.success = true;
            console.log(`✅ Fixed ${filePath}: ${result.changes.join(', ')}`);
        }
        else {
            result.success = true; // No changes needed is also success
        }
    }
    catch (error) {
        result.error = error instanceof Error ? error.message : String(error);
        console.error(`❌ Error fixing ${filePath}: ${result.error}`);
    }
    return result;
}
async function main() {
    console.log('🔧 Fixing database import and usage patterns...\n');
    // Find all TypeScript files in server directory
    const files = await glob('server/**/*.ts', { ignore: ['node_modules/**', 'dist/**', 'server/db.ts'] });
    const results = [];
    let fixedCount = 0;
    let errorCount = 0;
    for (const file of files) {
        const result = fixDatabaseUsage(file);
        results.push(result);
        if (result.success && result.changes.length > 0) {
            fixedCount++;
        }
        else if (!result.success) {
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
    console.log(`\n✅ Database import fixes complete!`);
    console.log(`   Run 'npm run build:server' to test the fixes.`);
}
if (import.meta.url === `file://${process.argv[1]}`) {
    main().catch(console.error);
}
