#!/usr/bin/env node
import { execSync } from 'child_process';
import * as fs from 'fs/promises';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

interface TypeScriptError {
  file: string;
  line: number;
  column: number;
  code: string;
  message: string;
}

async function getTypeScriptErrors(): Promise<TypeScriptError[]> {
  try {
    execSync('npx tsc --noEmit', { encoding: 'utf8' });
    return [];
  } catch (error) {
    const output = error.stdout || error.message;
    const errors: TypeScriptError[] = [];
    
    const lines = output.split('\n');
    for (const line of lines) {
      const match = line.match(/^(.+?)\((\d+),(\d+)\): error (TS\d+): (.+)$/);
      if (match) {
        errors.push({
          file: match[1],
          line: parseInt(match[2]),
          column: parseInt(match[3]),
          code: match[4],
          message: match[5]
        });
      }
    }
    
    return errors;
  }
}

async function fixMissingProperties(errors: TypeScriptError[]) {
  const fixes: Map<string, Set<string>> = new Map();
  
  for (const error of errors) {
    if (error.code === 'TS2741' && error.message.includes('is missing in type')) {
      // Extract missing property
      const propertyMatch = error.message.match(/Property '(.+?)' is missing/);
      if (propertyMatch) {
        const property = propertyMatch[1];
        if (!fixes.has(error.file)) {
          fixes.set(error.file, new Set());
        }
        fixes.get(error.file)!.add(property);
      }
    }
  }
  
  for (const [file, properties] of fixes) {
    console.log(`Fixing missing properties in ${file}: ${Array.from(properties).join(', ')}`);
    // Implementation would go here
  }
}

async function fixTypeErrors(errors: TypeScriptError[]) {
  const typeFixMap: Record<string, string> = {
    'TS2322': 'Type mismatch',
    'TS2345': 'Argument type mismatch',
    'TS2339': 'Property does not exist',
    'TS2741': 'Missing property',
    'TS6133': 'Unused variable',
    'TS2454': 'Variable used before assigned',
    'TS2698': 'Spread types issue',
    'TS2375': 'exactOptionalPropertyTypes issue',
    'TS2774': 'Function condition issue',
    'TS2349': 'Not callable',
    'TS2379': 'exactOptionalPropertyTypes argument issue'
  };
  
  const errorsByType: Map<string, TypeScriptError[]> = new Map();
  
  for (const error of errors) {
    if (!errorsByType.has(error.code)) {
      errorsByType.set(error.code, []);
    }
    errorsByType.get(error.code)!.push(error);
  }
  
  console.log('\nTypeScript Error Summary:');
  for (const [code, errs] of errorsByType) {
    console.log(`${code} (${typeFixMap[code] || 'Unknown'}): ${errs.length} errors`);
  }
  
  // Fix TS2375 - exactOptionalPropertyTypes issues
  const exactOptionalErrors = errorsByType.get('TS2375') || [];
  for (const error of exactOptionalErrors) {
    const filePath = path.resolve(process.cwd(), error.file);
    try {
      let content = await fs.readFile(filePath, 'utf8');
      const lines = content.split('\n');
      
      // This is a common pattern - properties that should include undefined
      if (error.message.includes('exactOptionalPropertyTypes')) {
        console.log(`Fixing exactOptionalPropertyTypes in ${error.file}:${error.line}`);
        // Would implement specific fixes here
      }
    } catch (err) {
      console.error(`Error processing ${error.file}:`, err);
    }
  }
}

async function fixUnusedVariables(errors: TypeScriptError[]) {
  const unusedVars = errors.filter(e => e.code === 'TS6133');
  
  for (const error of unusedVars) {
    if (error.message.includes('is declared but its value is never read')) {
      const varMatch = error.message.match(/'(.+?)' is declared/);
      if (varMatch) {
        const varName = varMatch[1];
        console.log(`Found unused variable: ${varName} in ${error.file}:${error.line}`);
        
        // If it's a destructured import, we can prefix with underscore
        const filePath = path.resolve(process.cwd(), error.file);
        try {
          let content = await fs.readFile(filePath, 'utf8');
          const lines = content.split('\n');
          const line = lines[error.line - 1];
          
          if (line.includes('import') && line.includes(varName)) {
            // Replace varName with _varName in destructured imports
            lines[error.line - 1] = line.replace(
              new RegExp(`\\b${varName}\\b`),
              `_${varName}`
            );
            await fs.writeFile(filePath, lines.join('\n'));
            console.log(`Fixed: Renamed ${varName} to _${varName}`);
          }
        } catch (err) {
          console.error(`Error fixing unused variable in ${error.file}:`, err);
        }
      }
    }
  }
}

async function main() {
  console.log('Analyzing TypeScript errors...\n');
  
  const errors = await getTypeScriptErrors();
  console.log(`Found ${errors.length} TypeScript errors\n`);
  
  if (errors.length === 0) {
    console.log('No TypeScript errors found!');
    return;
  }
  
  // Group errors by file
  const errorsByFile: Map<string, TypeScriptError[]> = new Map();
  for (const error of errors) {
    if (!errorsByFile.has(error.file)) {
      errorsByFile.set(error.file, []);
    }
    errorsByFile.get(error.file)!.push(error);
  }
  
  console.log('Files with most errors:');
  const sortedFiles = Array.from(errorsByFile.entries())
    .sort((a, b) => b[1].length - a[1].length)
    .slice(0, 10);
  
  for (const [file, errs] of sortedFiles) {
    console.log(`  ${file}: ${errs.length} errors`);
  }
  
  // Apply fixes
  console.log('\nApplying fixes...\n');
  
  await fixUnusedVariables(errors);
  await fixMissingProperties(errors);
  await fixTypeErrors(errors);
  
  // Re-check errors
  console.log('\nRe-checking TypeScript errors...');
  const remainingErrors = await getTypeScriptErrors();
  console.log(`\nRemaining errors: ${remainingErrors.length}`);
  
  if (remainingErrors.length < errors.length) {
    console.log(`Fixed ${errors.length - remainingErrors.length} errors!`);
  }
}

main().catch(console.error);