#!/usr/bin/env tsx

import { readFile, writeFile } from 'fs/promises';
import { glob } from 'glob';
import * as path from 'path';

interface TypeFix {
  pattern: RegExp;
  replacement: string;
  description: string;
}

// Critical type fixes for common patterns
const criticalFixes: TypeFix[] = [
  // Fix catch blocks
  {
    pattern: /catch \(error: any\)/g,
    replacement: 'catch (error)',
    description: 'Remove any from catch blocks (TypeScript infers unknown)'
  },
  {
    pattern: /catch \((\w+): any\)/g,
    replacement: 'catch ($1)',
    description: 'Remove any from named catch variables'
  },
  // Fix Request/Response types in Express
  {
    pattern: /\(req: any, res: Response\)/g,
    replacement: '(req: Request, res: Response)',
    description: 'Fix Express Request type'
  },
  {
    pattern: /\(req: any, res: any\)/g,
    replacement: '(req: Request, res: Response)',
    description: 'Fix Express Request/Response types'
  },
  {
    pattern: /async \(req: any, res: Response\)/g,
    replacement: 'async (req: Request, res: Response)',
    description: 'Fix async Express Request type'
  },
  // Fix Response body types
  {
    pattern: /res\.json\(function \(body: Response\)/g,
    replacement: 'res.json(function (body',
    description: 'Remove incorrect Response type from json body'
  },
  {
    pattern: /res\.json\(function \(this: Response, body: Response\)/g,
    replacement: 'res.json(function (this: Response, body',
    description: 'Fix json body parameter type'
  },
  {
    pattern: /res\.send\(function \(this: Response, body: Response\)/g,
    replacement: 'res.send(function (this: Response, body',
    description: 'Fix send body parameter type'
  },
  // Fix common patterns
  {
    pattern: /: any\[\]/g,
    replacement: ': unknown[]',
    description: 'Replace any[] with unknown[]'
  },
  {
    pattern: /Array<unknown>/g,
    replacement: 'Array<unknown>',
    description: 'Replace Array<unknown> with Array<unknown>'
  },
  {
    pattern: /Promise<unknown>/g,
    replacement: 'Promise<unknown>',
    description: 'Replace Promise<unknown> with Promise<unknown>'
  },
  {
    pattern: /Record<string, unknown>/g,
    replacement: 'Record<string, unknown>',
    description: 'Replace Record<string, unknown> with Record<string, unknown>'
  },
  // Fix type assertions
  {
    pattern: /as any;/g,
    replacement: 'as unknown;',
    description: 'Replace as any with as unknown'
  },
  {
    pattern: /\) as any\)/g,
    replacement: ') as unknown)',
    description: 'Replace as any in parentheses'
  }
];

async function fixFile(filePath: string): Promise<number> {
  try {
    let content = await readFile(filePath, 'utf-8');
    let fixCount = 0;
    
    // Skip if file is a test file
    if (filePath.includes('.test.') || filePath.includes('.spec.')) {
      return 0;
    }
    
    // Apply each fix
    for (const fix of criticalFixes) {
      const matches = content.match(fix.pattern);
      if (matches) {
        content = content.replace(fix.pattern, fix.replacement);
        fixCount += matches.length;
        console.log(`  Applied ${matches.length} fixes: ${fix.description}`);
      }
    }
    
    // Only write if we made changes
    if (fixCount > 0) {
      // Ensure we have the right imports
      if (content.includes('(req: Request') && !content.includes("import type { Request")) {
        if (content.includes("from 'express'")) {
          // Add Request to existing express import
          content = content.replace(
            /import ({[^}]+}) from 'express'
import type { Request, Response } from 'express';/,
            (match, imports) => {
              if (!imports.includes('Request')) {
                return `import { Request, ${imports.substring(1) } from 'express'`;
              }
              return match;
            }
          );
        } else {
          // Add new import at the top
          const lines = content.split('\n');
          let importIndex = 0;
          for (let i = 0; i < lines.length; i++) {
            if (lines[i].startsWith('import')) {
              importIndex = i + 1;
            } else if (lines[i].trim() && !lines[i].startsWith('//')) {
              break;
            }
          }
          content = lines.join('\n');
        }
      }
      
      await writeFile(filePath, content);
      console.log(`✅ Fixed ${fixCount} issues in ${path.relative(process.cwd(), filePath)}`);
    }
    
    return fixCount;
  } catch (error) {
    console.error(`❌ Error processing ${filePath}:`, error);
    return 0;
  }
}

async function main() {
  console.log('🔧 Fixing critical TypeScript issues...\n');
  
  // Find all TypeScript files in critical directories
  const patterns = [
    'server/middleware/**/*.ts',
    'server/routes/**/*.ts',
    'server/services/**/*.ts',
    'server/utils/**/*.ts',
    'server/*.ts'
  ];
  
  let totalFiles = 0;
  let totalFixes = 0;
  
  for (const pattern of patterns) {
    const files = await glob(pattern, { 
      ignore: ['**/*.test.ts', '**/*.spec.ts', '**/node_modules/**']
    });
    
    console.log(`\n📁 Processing ${files.length} files in ${pattern}...`);
    
    for (const file of files) {
      const fixes = await fixFile(file);
      if (fixes > 0) {
        totalFiles++;
        totalFixes += fixes;
      }
    }
  }
  
  console.log(`\n✨ Fixed ${totalFixes} issues in ${totalFiles} files`);
  
  // Now run a check to see remaining issues
  console.log('\n🔍 Checking for remaining critical issues...');
  
  const remainingPatterns = [
    ': any(?!thing)', // any type annotations (not "anything")
    'as any',
    '<any>',
    'Promise<unknown>',
    'Array<unknown>',
    ': any\\[\\]'
  ];
  
  let remainingIssues = 0;
  
  for (const pattern of patterns) {
    const files = await glob(pattern, {
      ignore: ['**/*.test.ts', '**/*.spec.ts', '**/node_modules/**']
    });
    
    for (const file of files) {
      const content = await readFile(file, 'utf-8');
      
      for (const searchPattern of remainingPatterns) {
        const regex = new RegExp(searchPattern, 'g');
        const matches = content.match(regex);
        if (matches) {
          remainingIssues += matches.length;
        }
      }
    }
  }
  
  if (remainingIssues > 0) {
    console.log(`\n⚠️  Found ${remainingIssues} remaining 'any' types that need manual review`);
  } else {
    console.log('\n✅ No critical TypeScript issues remaining!');
  }
}

main().catch(console.error);