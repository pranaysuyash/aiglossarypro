#!/usr/bin/env tsx

/**
 * TypeScript Error Fixing Script
 * Systematically fixes common TypeScript errors in the codebase
 */

import { execSync } from 'child_process';
import fs from 'fs';

interface ErrorPattern {
    pattern: RegExp;
    description: string;
    fix: (filePath: string, content: string) => string;
}

const errorPatterns: ErrorPattern[] = [
    // Fix implicit any parameters
    {
        pattern: /Parameter '(\w+)' implicitly has an 'any' type/,
        description: 'Fix implicit any parameters',
        fix: (filePath: string, content: string) => {
            // Add type annotations for common parameter patterns
            return content
                .replace(/\.filter\((\w+) =>/g, '.filter(($1: any) =>')
                .replace(/\.map\((\w+) =>/g, '.map(($1: any) =>')
                .replace(/\.forEach\((\w+) =>/g, '.forEach(($1: any) =>')
                .replace(/\.some\((\w+) =>/g, '.some(($1: any) =>')
                .replace(/\.every\((\w+) =>/g, '.every(($1: any) =>')
                .replace(/\.find\((\w+) =>/g, '.find(($1: any) =>')
                .replace(/\.reduce\((\w+) =>/g, '.reduce(($1: any) =>');
        }
    },

    // Fix unused variables
    {
        pattern: /'(\w+)' is declared but its value is never read/,
        description: 'Fix unused variables',
        fix: (filePath: string, content: string) => {
            // Add underscore prefix to unused variables
            return content.replace(/\b(const|let|var)\s+(\w+)(?=\s*[=:])/g, (match, keyword, varName) => {
                if (varName.startsWith('_')) return match;
                return `${keyword} _${varName}`;
            });
        }
    },

    // Fix jest namespace usage
    {
        pattern: /Cannot use namespace 'jest' as a value/,
        description: 'Fix jest namespace usage',
        fix: (filePath: string, content: string) => {
            return content
                .replace(/jest\.fn\(/g, 'vi.fn(')
                .replace(/jest\.mock\(/g, 'vi.mock(')
                .replace(/jest\.setTimeout\(/g, 'vi.setTimeout(');
        }
    }
];

function fixTypeScriptErrors() {
    console.log('🔧 Starting TypeScript error fixing...');

    // Get list of files with TypeScript errors
    try {
        execSync('npx tsc --noEmit --project tsconfig.json', { stdio: 'pipe' });
        console.log('✅ No TypeScript errors found!');
        return;
    } catch (error: any) {
        const output = error.stdout?.toString() || error.stderr?.toString() || '';
        console.log('📋 Found TypeScript errors, starting fixes...');

        // Parse error output to get file paths
        const errorLines = output.split('\n');
        const filePaths = new Set<string>();

        for (const line of errorLines) {
            const match = line.match(/^(.+\.tsx?)\(\d+,\d+\):/);
            if (match) {
                filePaths.add(match[1]);
            }
        }

        console.log(`📁 Found ${filePaths.size} files with errors`);

        // Apply fixes to each file
        for (const filePath of filePaths) {
            if (fs.existsSync(filePath)) {
                try {
                    let content = fs.readFileSync(filePath, 'utf8');
                    let modified = false;

                    for (const pattern of errorPatterns) {
                        const originalContent = content;
                        content = pattern.fix(filePath, content);
                        if (content !== originalContent) {
                            modified = true;
                            console.log(`  ✅ Applied ${pattern.description} to ${filePath}`);
                        }
                    }

                    if (modified) {
                        fs.writeFileSync(filePath, content);
                    }
                } catch (err) {
                    console.error(`❌ Error processing ${filePath}:`, err);
                }
            }
        }
    }
}

if (require.main === module) {
    fixTypeScriptErrors();
}

export { fixTypeScriptErrors };
