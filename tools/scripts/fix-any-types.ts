#!/usr/bin/env node
import { execSync } from 'child_process';
import * as fs from 'fs/promises';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

interface AnyTypeLocation {
  file: string;
  line: number;
  column: number;
  context: string;
}

async function findAnyTypes(): Promise<AnyTypeLocation[]> {
  const locations: AnyTypeLocation[] = [];
  
  // Find all TypeScript files
  const output = execSync('find . -name "*.ts" -o -name "*.tsx" | grep -v node_modules | grep -v dist | grep -v build', { encoding: 'utf8' });
  const files = output.trim().split('\n').filter(Boolean);
  
  for (const file of files) {
    try {
      const content = await fs.readFile(file, 'utf8');
      const lines = content.split('\n');
      
      lines.forEach((line, index) => {
        // Look for common any patterns
        const patterns = [
          /:\s*any\b/,
          /as\s+any\b/,
          /<any>/,
          /\bany\[\]/,
          /Array<unknown>/,
          /Promise<unknown>/,
          /\(.*:\s*any\)/,
          /=\s*\[.*\]\s*as\s*any/,
          /catch\s*\(.*:\s*any\)/
        ];
        
        patterns.forEach(pattern => {
          const match = line.match(pattern);
          if (match && match.index !== undefined) {
            locations.push({
              file,
              line: index + 1,
              column: match.index + 1,
              context: line.trim()
            });
          }
        });
      });
    } catch (error) {
      // Skip files that can't be read
    }
  }
  
  return locations;
}

async function fixCommonAnyPatterns(file: string, content: string): Promise<string> {
  let fixed = content;
  
  // Fix catch blocks
  fixed = fixed.replace(/catch\s*\(\s*(\w+)\s*:\s*any\s*\)/g, 'catch ($1)');
  
  // Fix error parameters in functions
  fixed = fixed.replace(/\(error:\s*any\)/g, '(error: unknown)');
  fixed = fixed.replace(/\(err:\s*any\)/g, '(err: unknown)');
  fixed = fixed.replace(/\(e:\s*any\)/g, '(e: unknown)');
  
  // Fix common array patterns
  fixed = fixed.replace(/:\s*any\[\]/g, ': unknown[]');
  fixed = fixed.replace(/Array<unknown>/g, 'Array<unknown>');
  
  // Fix Promise<unknown>
  fixed = fixed.replace(/Promise<unknown>/g, 'Promise<unknown>');
  
  // Fix Record<string, unknown>
  fixed = fixed.replace(/Record<string,\s*any>/g, 'Record<string, unknown>');
  fixed = fixed.replace(/Record<\w+,\s*any>/g, (match) => {
    const key = match.match(/Record<(\w+),/)?.[1];
    return `Record<${key}, unknown>`;
  });
  
  // Fix function return types
  fixed = fixed.replace(/\)\s*:\s*any\s*{/g, ') {');
  fixed = fixed.replace(/\)\s*:\s*Promise<unknown>\s*{/g, '): Promise<unknown> {');
  
  // Fix type assertions - be more careful here
  if (file.includes('.test.') || file.includes('.spec.')) {
    // In test files, we can be more aggressive
    fixed = fixed.replace(/as\s+any/g, 'as unknown');
  }
  
  return fixed;
}

async function inferTypes(file: string, content: string): Promise<string> {
  let fixed = content;
  
  // Infer express types
  if (content.includes('express') && (content.includes('req:') || content.includes('res:'))) {
    // Add proper express imports if not present
    if (!content.includes('import type { Request, Response }') && !content.includes('import { Request, Response }')) {
      const expressImportMatch = content.match(/import\s+.*from\s+['"]express['"]/);
      if (expressImportMatch) {
        fixed = fixed.replace(expressImportMatch[0], `${expressImportMatch[0]}\nimport type { Request, Response } from 'express';`);
      }
    }
    
    // Replace any with proper types
    fixed = fixed.replace(/\(req:\s*any,\s*res:\s*any\)/g, '(req: Request, res: Response)');
    fixed = fixed.replace(/\(req:\s*any\)/g, '(req: Request)');
    fixed = fixed.replace(/\(res:\s*any\)/g, '(res: Response)');
  }
  
  // Infer event types
  fixed = fixed.replace(/\(event:\s*any\)/g, '(event: Event)');
  fixed = fixed.replace(/\(e:\s*any\)\s*=>\s*{\s*e\.preventDefault/g, '(e: React.FormEvent) => { e.preventDefault');
  
  // Infer HTML element types
  fixed = fixed.replace(/:\s*any\s*=\s*document\.getElementById/g, ': HTMLElement | null = document.getElementById');
  fixed = fixed.replace(/:\s*any\s*=\s*document\.querySelector/g, ': Element | null = document.querySelector');
  
  return fixed;
}

async function main() {
  console.log('Finding TypeScript any types...\n');
  
  const locations = await findAnyTypes();
  console.log(`Found ${locations.length} instances of 'any' type\n`);
  
  if (locations.length === 0) {
    console.log('No any types found!');
    return;
  }
  
  // Group by file
  const fileGroups = new Map<string, AnyTypeLocation[]>();
  locations.forEach(loc => {
    if (!fileGroups.has(loc.file)) {
      fileGroups.set(loc.file, []);
    }
    fileGroups.get(loc.file)!.push(loc);
  });
  
  console.log('Files with most any types:');
  const sortedFiles = Array.from(fileGroups.entries())
    .sort((a, b) => b[1].length - a[1].length)
    .slice(0, 10);
  
  sortedFiles.forEach(([file, locs]) => {
    console.log(`  ${file}: ${locs.length} instances`);
  });
  
  console.log('\nFixing any types...\n');
  
  let totalFixed = 0;
  
  for (const [file, locs] of fileGroups) {
    try {
      let content = await fs.readFile(file, 'utf8');
      const originalContent = content;
      
      // Apply fixes
      content = await fixCommonAnyPatterns(file, content);
      content = await inferTypes(file, content);
      
      if (content !== originalContent) {
        await fs.writeFile(file, content);
        
        // Count how many were actually fixed
        const newContent = await fs.readFile(file, 'utf8');
        const originalAnyCount = (originalContent.match(/\bany\b/g) || []).length;
        const newAnyCount = (newContent.match(/\bany\b/g) || []).length;
        const fixed = originalAnyCount - newAnyCount;
        
        if (fixed > 0) {
          totalFixed += fixed;
          console.log(`Fixed ${fixed} any types in ${file}`);
        }
      }
    } catch (error) {
      console.error(`Error processing ${file}:`, error);
    }
  }
  
  console.log(`\nTotal any types fixed: ${totalFixed}`);
  
  // Re-check
  const remaining = await findAnyTypes();
  console.log(`Remaining any types: ${remaining.length}`);
}

main().catch(console.error);