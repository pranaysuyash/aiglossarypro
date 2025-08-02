#!/usr/bin/env node
/**
 * Fix remaining database usage issues where getDb is imported but db is still used
 */
import { readFileSync, writeFileSync } from 'fs';
import { glob } from 'glob';
async function main() {
    console.log('🔧 Fixing remaining database usage issues...\n');
    const files = await glob('server/**/*.ts', { ignore: ['node_modules/**', 'dist/**', 'server/db.ts'] });
    let fixedCount = 0;
    for (const file of files) {
        try {
            const content = readFileSync(file, 'utf-8');
            let fixed = content;
            let changed = false;
            // Check if file imports getDb but still uses bare 'db'
            if (fixed.includes('getDb') && fixed.includes('import { getDb }')) {
                // Find functions that use db but don't have const db = getDb()
                const functionBodies = fixed.split(/(?:async\s+)?function\s+\w+|(?:async\s+)?\w+\s*\([^)]*\)\s*(?::\s*[^{]+)?\s*\{|(?:async\s+)?\([^)]*\)\s*(?::\s*[^{]+)?\s*=>\s*\{/);
                for (let i = 1; i < functionBodies.length; i++) {
                    const body = functionBodies[i];
                    if (body.includes('await db.') && !body.includes('const db = getDb()')) {
                        // Add const db = getDb() at the start of the function
                        const beforeFunction = fixed.substring(0, fixed.indexOf(body));
                        const afterFunction = fixed.substring(fixed.indexOf(body) + body.length);
                        // Find the opening brace and add the db initialization
                        const braceIndex = body.indexOf('{');
                        if (braceIndex !== -1) {
                            const beforeBrace = body.substring(0, braceIndex + 1);
                            const afterBrace = body.substring(braceIndex + 1);
                            const newBody = beforeBrace + '\n    const db = getDb();' + afterBrace;
                            fixed = beforeFunction + newBody + afterFunction;
                            changed = true;
                            break; // Only fix one function at a time to avoid issues
                        }
                    }
                }
                // Simple pattern: replace standalone 'db.' with 'const db = getDb(); db.'
                // But only if there's no existing const db = getDb() in the same function
                const dbUsagePattern = /(\n\s*)(await\s+db\.)/g;
                fixed = fixed.replace(dbUsagePattern, (match, indent, dbCall) => {
                    // Check if there's already a const db = getDb() before this usage
                    const beforeMatch = fixed.substring(0, fixed.indexOf(match));
                    const lastFunctionStart = Math.max(beforeMatch.lastIndexOf('function '), beforeMatch.lastIndexOf(') => {'), beforeMatch.lastIndexOf(') {'));
                    if (lastFunctionStart !== -1) {
                        const functionPart = beforeMatch.substring(lastFunctionStart);
                        if (!functionPart.includes('const db = getDb()')) {
                            changed = true;
                            return indent + 'const db = getDb();\n' + indent + dbCall;
                        }
                    }
                    return match;
                });
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
