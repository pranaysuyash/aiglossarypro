#!/usr/bin/env node

import { readFileSync, writeFileSync, readdirSync, statSync } from 'fs';
import { join, relative, extname } from 'path';
import chalk from 'chalk';

interface ReplacementResult {
  file: string;
  replacements: number;
  skipped: boolean;
  reason?: string;
}

class ConsoleLogReplacer {
  private readonly excludeDirs = [
    'node_modules',
    'dist',
    'build',
    '.git',
    'coverage',
    'logs',
    '.next',
    '.vite',
    'tests',
    'scripts',
    'public'
  ];

  private readonly excludeFiles = [
    'logger.ts',
    'logger.js',
    'replace-console-logs.ts',
    '.test.',
    '.spec.',
    '.d.ts',
    'vite.config',
    'webpack.config',
    'rollup.config',
    'jest.config',
    'vitest.config'
  ];

  private readonly serverFileExtensions = ['.ts', '.js'];
  private readonly clientFileExtensions = ['.tsx', '.jsx', '.ts', '.js'];
  
  private totalFiles = 0;
  private totalReplacements = 0;
  private skippedFiles = 0;
  private results: ReplacementResult[] = [];

  async replaceInProject(dryRun = false): Promise<void> {
    console.log(chalk.cyan.bold('=== Console.log to Winston Logger Replacement ===\n'));
    console.log(chalk.yellow(`Mode: ${dryRun ? 'DRY RUN' : 'ACTUAL REPLACEMENT'}\n`));

    // Process server files
    console.log(chalk.blue('Processing server files...'));
    this.processDirectory(join(process.cwd(), 'server'), 'server', dryRun);

    // Process client files (but only for server-side rendering or build scripts)
    console.log(chalk.blue('\nProcessing client build/SSR files...'));
    this.processDirectory(join(process.cwd(), 'client'), 'client', dryRun);

    // Display results
    this.displayResults(dryRun);
  }

  private processDirectory(dir: string, type: 'server' | 'client', dryRun: boolean): void {
    try {
      const files = readdirSync(dir);

      for (const file of files) {
        const fullPath = join(dir, file);
        const stat = statSync(fullPath);

        if (stat.isDirectory()) {
          if (!this.shouldSkipDirectory(file)) {
            this.processDirectory(fullPath, type, dryRun);
          }
        } else if (stat.isFile()) {
          if (this.shouldProcessFile(file, type)) {
            this.processFile(fullPath, type, dryRun);
          }
        }
      }
    } catch (error) {
      console.error(chalk.red(`Error processing directory ${dir}:`, error));
    }
  }

  private shouldSkipDirectory(dirName: string): boolean {
    return this.excludeDirs.includes(dirName) || dirName.startsWith('.');
  }

  private shouldProcessFile(fileName: string, type: 'server' | 'client'): boolean {
    const ext = extname(fileName);
    const extensions = type === 'server' ? this.serverFileExtensions : this.clientFileExtensions;
    
    if (!extensions.includes(ext)) {
      return false;
    }

    return !this.excludeFiles.some(exclude => fileName.includes(exclude));
  }

  private processFile(filePath: string, type: 'server' | 'client', dryRun: boolean): void {
    this.totalFiles++;
    
    try {
      let content = readFileSync(filePath, 'utf8');
      const originalContent = content;
      
      // Skip if file already imports logger
      if (content.includes('import logger') || content.includes('require.*logger')) {
        this.results.push({
          file: relative(process.cwd(), filePath),
          replacements: 0,
          skipped: true,
          reason: 'Already uses logger'
        });
        this.skippedFiles++;
        return;
      }

      // Count console.log occurrences
      const consoleLogMatches = content.match(/console\.(log|error|warn|info|debug)/g) || [];
      
      if (consoleLogMatches.length === 0) {
        return;
      }

      let replacements = 0;

      if (type === 'server') {
        // Add logger import if needed
        if (!content.includes('import logger')) {
          const importStatement = this.getLoggerImport(filePath);
          
          // Add import after existing imports
          const importMatch = content.match(/^(import[\s\S]*?from\s+['"][^'"]+['"];?\s*\n)+/m);
          if (importMatch) {
            content = content.replace(importMatch[0], importMatch[0] + importStatement + '\n');
          } else {
            content = importStatement + '\n' + content;
          }
        }

        // Replace console methods with logger
        content = content.replace(/console\.log\(/g, () => {
          replacements++;
          return 'logger.info(';
        });
        
        content = content.replace(/console\.error\(/g, () => {
          replacements++;
          return 'logger.error(';
        });
        
        content = content.replace(/console\.warn\(/g, () => {
          replacements++;
          return 'logger.warn(';
        });
        
        content = content.replace(/console\.info\(/g, () => {
          replacements++;
          return 'logger.info(';
        });
        
        content = content.replace(/console\.debug\(/g, () => {
          replacements++;
          return 'logger.debug(';
        });
      } else {
        // For client files, only replace in build scripts or SSR contexts
        if (filePath.includes('vite') || filePath.includes('webpack') || filePath.includes('build')) {
          // Skip client files that shouldn't use winston
          this.results.push({
            file: relative(process.cwd(), filePath),
            replacements: 0,
            skipped: true,
            reason: 'Client-side file (use browser console)'
          });
          this.skippedFiles++;
          return;
        }
      }

      if (replacements > 0) {
        if (!dryRun) {
          writeFileSync(filePath, content, 'utf8');
        }
        
        this.totalReplacements += replacements;
        this.results.push({
          file: relative(process.cwd(), filePath),
          replacements,
          skipped: false
        });
      }
    } catch (error) {
      console.error(chalk.red(`Error processing file ${filePath}:`, error));
      this.results.push({
        file: relative(process.cwd(), filePath),
        replacements: 0,
        skipped: true,
        reason: 'Error processing file'
      });
      this.skippedFiles++;
    }
  }

  private getLoggerImport(filePath: string): string {
    // Calculate relative path from file to logger
    const serverDir = join(process.cwd(), 'server');
    const loggerPath = join(serverDir, 'utils', 'logger.ts');
    
    // Get relative path
    let relativePath = relative(filePath, loggerPath).replace(/\\/g, '/');
    
    // Remove file extension and fix path
    relativePath = relativePath.replace(/\.ts$/, '');
    relativePath = relativePath.substring(relativePath.indexOf('/') + 1);
    
    // Ensure path starts with ./ or ../
    if (!relativePath.startsWith('.')) {
      relativePath = './' + relativePath;
    }

    return `import logger from '${relativePath}';`;
  }

  private displayResults(dryRun: boolean): void {
    console.log(chalk.cyan.bold('\n=== Results ===\n'));

    // Show files with replacements
    const filesWithReplacements = this.results.filter(r => r.replacements > 0);
    if (filesWithReplacements.length > 0) {
      console.log(chalk.green.bold('Files with replacements:'));
      filesWithReplacements.forEach(result => {
        console.log(chalk.green(`  ✓ ${result.file} (${result.replacements} replacements)`));
      });
    }

    // Show skipped files
    const skippedResults = this.results.filter(r => r.skipped);
    if (skippedResults.length > 0) {
      console.log(chalk.yellow.bold('\nSkipped files:'));
      skippedResults.forEach(result => {
        console.log(chalk.yellow(`  ⚠ ${result.file} - ${result.reason}`));
      });
    }

    // Summary
    console.log(chalk.cyan.bold('\n=== Summary ==='));
    console.log(`Total files processed: ${this.totalFiles}`);
    console.log(`Files modified: ${filesWithReplacements.length}`);
    console.log(`Files skipped: ${this.skippedFiles}`);
    console.log(`Total replacements: ${this.totalReplacements}`);

    if (dryRun) {
      console.log(chalk.yellow.bold('\n⚠️  DRY RUN - No files were actually modified'));
      console.log(chalk.cyan('Run without --dry-run to apply changes'));
    } else {
      console.log(chalk.green.bold('\n✅ All replacements completed successfully!'));
    }

    // Generate report
    this.generateReport(dryRun);
  }

  private generateReport(dryRun: boolean): void {
    const reportPath = join(process.cwd(), 'console-log-replacement-report.md');
    
    let report = `# Console.log Replacement Report\n\n`;
    report += `**Date**: ${new Date().toISOString()}\n`;
    report += `**Mode**: ${dryRun ? 'DRY RUN' : 'ACTUAL REPLACEMENT'}\n\n`;
    
    report += `## Summary\n\n`;
    report += `- Total files processed: ${this.totalFiles}\n`;
    report += `- Files modified: ${this.results.filter(r => r.replacements > 0).length}\n`;
    report += `- Files skipped: ${this.skippedFiles}\n`;
    report += `- Total replacements: ${this.totalReplacements}\n\n`;
    
    report += `## Files Modified\n\n`;
    const filesWithReplacements = this.results.filter(r => r.replacements > 0);
    if (filesWithReplacements.length > 0) {
      filesWithReplacements.forEach(result => {
        report += `- ${result.file} (${result.replacements} replacements)\n`;
      });
    } else {
      report += `No files were modified.\n`;
    }
    
    report += `\n## Skipped Files\n\n`;
    const skippedResults = this.results.filter(r => r.skipped);
    if (skippedResults.length > 0) {
      skippedResults.forEach(result => {
        report += `- ${result.file} - ${result.reason}\n`;
      });
    } else {
      report += `No files were skipped.\n`;
    }
    
    report += `\n## Next Steps\n\n`;
    if (dryRun) {
      report += `1. Review this report\n`;
      report += `2. Run without --dry-run to apply changes\n`;
      report += `3. Test the application after replacement\n`;
    } else {
      report += `1. Run tests to ensure functionality\n`;
      report += `2. Review logger output format\n`;
      report += `3. Configure log levels for production\n`;
      report += `4. Set up log rotation if needed\n`;
    }
    
    writeFileSync(reportPath, report);
    console.log(chalk.green(`\n📄 Report saved to: ${reportPath}`));
  }
}

// Main execution
const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run') || args.includes('-d');

const replacer = new ConsoleLogReplacer();
replacer.replaceInProject(dryRun).catch(error => {
  console.error(chalk.red('Error:', error));
  process.exit(1);
});