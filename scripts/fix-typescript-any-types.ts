#!/usr/bin/env tsx

import * as fs from 'node:fs';
import * as path from 'node:path';
import { glob } from 'glob';
import chalk from 'chalk';

interface AnyTypeLocation {
  file: string;
  line: number;
  column: number;
  context: string;
  suggestedFix?: string;
}

/**
 * Script to identify and help fix TypeScript 'any' types in the codebase
 */
class TypeScriptAnyFixer {
  private anyLocations: AnyTypeLocation[] = [];
  private fixedCount = 0;

  async run() {
    console.log(chalk.blue('🔍 Scanning for TypeScript "any" types...\n'));

    // Find all TypeScript files
    const files = await glob('**/*.{ts,tsx}', {
      ignore: ['node_modules/**', 'dist/**', '**/*.test.ts', '**/*.spec.ts'],
    });

    console.log(chalk.gray(`Found ${files.length} TypeScript files to scan\n`));

    // Scan each file
    for (const file of files) {
      await this.scanFile(file);
    }

    // Report findings
    this.reportFindings();

    // Apply automated fixes if requested
    if (process.argv.includes('--fix')) {
      await this.applyFixes();
    }
  }

  private async scanFile(filePath: string) {
    const content = await fs.promises.readFile(filePath, 'utf-8');
    const lines = content.split('\n');

    lines.forEach((line, index) => {
      const anyMatches = this.findAnyTypes(line);
      
      anyMatches.forEach(match => {
        const location: AnyTypeLocation = {
          file: filePath,
          line: index + 1,
          column: match.index,
          context: line.trim(),
          suggestedFix: this.suggestFix(line, match),
        };
        
        this.anyLocations.push(location);
      });
    });
  }

  private findAnyTypes(line: string): Array<{ index: number; type: string }> {
    const patterns = [
      { regex: /:\s*any\b/g, type: 'type-annotation' },
      { regex: /<any>/g, type: 'type-cast' },
      { regex: /as\s+any\b/g, type: 'type-assertion' },
      { regex: /:\s*any\[\]/g, type: 'array-any' },
      { regex: /:\s*\{\s*\[key:\s*string\]:\s*any\s*\}/g, type: 'object-any' },
    ];

    const matches: Array<{ index: number; type: string }> = [];

    patterns.forEach(({ regex, type }) => {
      let match;
      while ((match = regex.exec(line)) !== null) {
        matches.push({ index: match.index, type });
      }
    });

    return matches;
  }

  private suggestFix(line: string, match: { type: string }): string | undefined {
    // Common patterns and their suggested fixes
    const suggestions: Record<string, (line: string) => string | undefined> = {
      'type-annotation': (line) => {
        // Try to infer type from context
        if (line.includes('req') || line.includes('request')) {
          return 'Request (from express)';
        }
        if (line.includes('res') || line.includes('response')) {
          return 'Response (from express)';
        }
        if (line.includes('error') || line.includes('err')) {
          return 'Error | unknown';
        }
        if (line.includes('data') || line.includes('result')) {
          return 'unknown (needs specific type)';
        }
        if (line.includes('config') || line.includes('options')) {
          return 'Record<string, unknown>';
        }
        return 'unknown';
      },
      'array-any': () => 'unknown[] or specific type[]',
      'object-any': () => 'Record<string, unknown>',
      'type-cast': () => 'Remove cast or use proper type',
      'type-assertion': () => 'Use proper type or unknown',
    };

    return suggestions[match.type]?.(line);
  }

  private reportFindings() {
    if (this.anyLocations.length === 0) {
      console.log(chalk.green('✅ No "any" types found!\n'));
      return;
    }

    console.log(chalk.yellow(`Found ${this.anyLocations.length} instances of "any" type:\n`));

    // Group by file
    const byFile = this.groupByFile();
    
    Object.entries(byFile).forEach(([file, locations]) => {
      console.log(chalk.cyan(`\n${file} (${locations.length} instances):`));
      
      locations.slice(0, 5).forEach(loc => {
        console.log(chalk.gray(`  Line ${loc.line}: ${loc.context}`));
        if (loc.suggestedFix) {
          console.log(chalk.green(`    → Suggestion: ${loc.suggestedFix}`));
        }
      });

      if (locations.length > 5) {
        console.log(chalk.gray(`  ... and ${locations.length - 5} more`));
      }
    });

    // Summary by type
    console.log(chalk.yellow('\n📊 Summary by pattern:'));
    const typeCount = this.countByPattern();
    Object.entries(typeCount).forEach(([pattern, count]) => {
      console.log(`  ${pattern}: ${count}`);
    });
  }

  private groupByFile(): Record<string, AnyTypeLocation[]> {
    const grouped: Record<string, AnyTypeLocation[]> = {};
    
    this.anyLocations.forEach(loc => {
      if (!grouped[loc.file]) {
        grouped[loc.file] = [];
      }
      grouped[loc.file].push(loc);
    });

    return grouped;
  }

  private countByPattern(): Record<string, number> {
    const counts: Record<string, number> = {};
    
    this.anyLocations.forEach(loc => {
      const pattern = this.getPatternFromContext(loc.context);
      counts[pattern] = (counts[pattern] || 0) + 1;
    });

    return counts;
  }

  private getPatternFromContext(context: string): string {
    if (context.includes(': unknown[]')) return 'Array<unknown>';
    if (context.includes(': any')) return 'Type annotation';
    if (context.includes('<any>')) return 'Type cast';
    if (context.includes('as any')) return 'Type assertion';
    if (context.includes('[key: string]: any')) return 'Index signature';
    return 'Other';
  }

  private async applyFixes() {
    console.log(chalk.blue('\n🔧 Applying automated fixes...\n'));

    const fixableLocations = this.anyLocations.filter(loc => 
      loc.suggestedFix && 
      !loc.suggestedFix.includes('needs specific type') &&
      loc.suggestedFix !== 'unknown'
    );

    console.log(chalk.gray(`Found ${fixableLocations.length} potentially fixable instances\n`));

    // Group by file for batch processing
    const byFile = this.groupFixableByFile(fixableLocations);

    for (const [filePath, locations] of Object.entries(byFile)) {
      await this.fixFile(filePath, locations);
    }

    console.log(chalk.green(`\n✅ Fixed ${this.fixedCount} instances of "any" type`));
    console.log(chalk.yellow(`⚠️  ${this.anyLocations.length - this.fixedCount} instances require manual review`));
  }

  private groupFixableByFile(locations: AnyTypeLocation[]): Record<string, AnyTypeLocation[]> {
    const grouped: Record<string, AnyTypeLocation[]> = {};
    
    locations.forEach(loc => {
      if (!grouped[loc.file]) {
        grouped[loc.file] = [];
      }
      grouped[loc.file].push(loc);
    });

    return grouped;
  }

  private async fixFile(filePath: string, locations: AnyTypeLocation[]) {
    try {
      let content = await fs.promises.readFile(filePath, 'utf-8');
      const lines = content.split('\n');
      let modified = false;

      // Sort locations by line number in reverse to avoid offset issues
      locations.sort((a, b) => b.line - a.line);

      locations.forEach(loc => {
        const lineIndex = loc.line - 1;
        const originalLine = lines[lineIndex];
        const fixedLine = this.applyFixToLine(originalLine, loc);

        if (fixedLine && fixedLine !== originalLine) {
          lines[lineIndex] = fixedLine;
          modified = true;
          this.fixedCount++;
          console.log(chalk.green(`  Fixed: ${filePath}:${loc.line}`));
        }
      });

      if (modified) {
        await fs.promises.writeFile(filePath, lines.join('\n'));
      }
    } catch (error) {
      console.error(chalk.red(`  Error fixing ${filePath}: ${error}`));
    }
  }

  private applyFixToLine(line: string, location: AnyTypeLocation): string | null {
    // Simple automated fixes only
    const fixes: Record<string, (line: string) => string> = {
      'Error | unknown': (line) => line.replace(/:\s*any\b/, ': Error | unknown'),
      'Record<string, unknown>': (line) => line.replace(/:\s*any\b/, ': Record<string, unknown>'),
      'unknown[] or specific type[]': (line) => line.replace(/:\s*any\[\]/, ': unknown[]'),
      'Request (from express)': (line) => line.replace(/:\s*any\b/, ': Request'),
      'Response (from express)': (line) => line.replace(/:\s*any\b/, ': Response'),
    };

    const fix = location.suggestedFix && fixes[location.suggestedFix];
    return fix ? fix(line) : null;
  }
}

// Run the script
const fixer = new TypeScriptAnyFixer();
fixer.run().catch(console.error);

// Export for testing
export { TypeScriptAnyFixer };