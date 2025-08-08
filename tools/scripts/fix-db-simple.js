#!/usr/bin/env node
/**
 * Simple script to fix the most common database import issues
 */
import { readFileSync, writeFileSync } from 'fs';
import { glob } from 'glob';
async function main() {
    console.log('🔧 Fixing database imports...\n');
    const files = await glob('server/**/*.ts', { ignore: ['node_modules/**', 'dist/**', 'server/db.ts'] });
    let fixedCount = 0;
    for (const file of files) {
        try {
            const content = readFileSync(file, 'utf-8');
            let fixed = content;
            let changed = false;
            // Fix 1: Change import { db } to import { getDb }
            if (fixed.includes('import { db }') && !fixed.includes('getDb')) {
                fixed = fixed.replace(/import\s*{\s*db\s*}/g, 'import { getDb }');
                changed = true;
            }
            // Fix 2: Change import { ..., db, ... } to include getDb
            const importWithDbPattern = /import\s*{\s*([^}]*)\bdb\b([^}]*)\s*}\s*from\s*['"][^'"]*\/db(?:\.js)?['"];?/g;
            fixed = fixed.replace(importWithDbPattern, (match, before, after) => {
                if (match.includes('getDb'))
                    return match;
                const beforeClean = before.trim().replace(/,$/, '');
                const afterClean = after.trim().replace(/^,/, '');
                let imports = [];
                if (beforeClean)
                    imports.push(beforeClean);
                imports.push('getDb');
                if (afterClean)
                    imports.push(afterClean);
                const newMatch = match.replace(/{\s*[^}]*\s*}/, `{ ${imports.join(', ')} }`);
                changed = true;
                return newMatch;
            });
            // Fix 3: Replace db() with getDb()
            if (fixed.includes('db()')) {
                fixed = fixed.replace(/\bdb\(\)/g, 'getDb()');
                changed = true;
            }
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
