#!/usr/bin/env tsx

import fs from 'fs';
import { glob } from 'glob';
import path from 'path';

// Find and clean up TODO comments and dead code
async function cleanupTodos() {
  const files = await glob(['client/src/**/*.{ts,tsx,js,jsx}', 'server/**/*.{ts,js}']);

  let todoCount = 0;
  let fixmeCount = 0;
  let deprecatedCount = 0;
  let deadCodeCount = 0;

  const todoReport: string[] = [];
  const deprecatedReport: string[] = [];
  const deadCodeReport: string[] = [];

  for (const file of files) {
    const content = fs.readFileSync(file, 'utf-8');
    const lines = content.split('\n');

    lines.forEach((line, index) => {
      const lineNumber = index + 1;
      const trimmedLine = line.trim();

      // Find TODO comments
      if (trimmedLine.includes('TODO') || trimmedLine.includes('todo')) {
        todoCount++;
        todoReport.push(`${file}:${lineNumber} - ${trimmedLine}`);
      }

      // Find FIXME comments
      if (trimmedLine.includes('FIXME') || trimmedLine.includes('fixme')) {
        fixmeCount++;
        todoReport.push(`${file}:${lineNumber} - ${trimmedLine}`);
      }

      // Find deprecated code markers
      if (trimmedLine.includes('@deprecated') || trimmedLine.includes('DEPRECATED')) {
        deprecatedCount++;
        deprecatedReport.push(`${file}:${lineNumber} - ${trimmedLine}`);
      }

      // Find common dead code patterns
      if (
        trimmedLine.includes('console.log') ||
        trimmedLine.includes('debugger;') ||
        trimmedLine.startsWith('// DELETE') ||
        trimmedLine.startsWith('// REMOVE')
      ) {
        deadCodeCount++;
        deadCodeReport.push(`${file}:${lineNumber} - ${trimmedLine}`);
      }
    });
  }

  console.log('\n📋 Code Cleanup Report');
  console.log('='.repeat(50));

  console.log(`\n🔍 Found ${todoCount} TODO/FIXME items:`);
  if (todoReport.length > 0) {
    todoReport.slice(0, 10).forEach(item => console.log(`  ${item}`));
    if (todoReport.length > 10) {
      console.log(`  ... and ${todoReport.length - 10} more`);
    }
  }

  console.log(`\n⚠️  Found ${deprecatedCount} deprecated items:`);
  if (deprecatedReport.length > 0) {
    deprecatedReport.forEach(item => console.log(`  ${item}`));
  }

  console.log(`\n🗑️  Found ${deadCodeCount} potential dead code items:`);
  if (deadCodeReport.length > 0) {
    deadCodeReport.forEach(item => console.log(`  ${item}`));
  }

  // Generate cleanup suggestions
  console.log('\n💡 Cleanup Suggestions:');
  console.log('='.repeat(50));

  if (todoCount > 0) {
    console.log('• Review and address TODO/FIXME comments');
    console.log('• Create GitHub issues for important TODOs');
    console.log('• Remove or implement simple TODOs');
  }

  if (deprecatedCount > 0) {
    console.log('• Update or remove deprecated code');
    console.log('• Replace deprecated functions with modern alternatives');
  }

  if (deadCodeCount > 0) {
    console.log('• Remove console.log statements from production code');
    console.log('• Remove debugger statements');
    console.log('• Clean up commented-out code marked for deletion');
  }

  // Find unused imports (basic check)
  console.log('\n🔍 Checking for potentially unused imports...');
  let unusedImportFiles = 0;

  for (const file of files.filter(f => f.endsWith('.ts') || f.endsWith('.tsx'))) {
    const content = fs.readFileSync(file, 'utf-8');
    const lines = content.split('\n');

    for (const line of lines) {
      if (line.trim().startsWith('import') && line.includes('from')) {
        // Basic check for imports that might be unused
        const importMatch = line.match(/import\s+{([^}]+)}/);
        if (importMatch) {
          const imports = importMatch[1].split(',').map(i => i.trim());
          const fileContent = content;

          const unusedImports = imports.filter(imp => {
            const cleanImport = imp.replace(/\s+as\s+\w+/, '').trim();
            const usagePattern = new RegExp(`\\b${cleanImport}\\b`, 'g');
            const matches = fileContent.match(usagePattern) || [];
            return matches.length <= 1; // Only the import line itself
          });

          if (unusedImports.length > 0) {
            unusedImportFiles++;
            break;
          }
        }
      }
    }
  }

  if (unusedImportFiles > 0) {
    console.log(`• Review ${unusedImportFiles} files for potentially unused imports`);
  }

  console.log('\n✅ Use ESLint or similar tools for more comprehensive cleanup');
  console.log('✅ Consider using automated tools like "ts-unused-exports"');

  return {
    todoCount,
    fixmeCount,
    deprecatedCount,
    deadCodeCount,
    unusedImportFiles,
  };
}

cleanupTodos().catch(console.error);
