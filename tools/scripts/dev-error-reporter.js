#!/usr/bin/env node

/**
 * Development Error Reporter
 *
 * Enhanced error reporting for development environment:
 * - Captures and formats TypeScript errors
 * - Provides source map integration
 * - Offers debugging suggestions
 * - Integrates with development workflow
 */

import chalk from 'chalk';
import { execSync } from 'child_process';
import { existsSync, readFileSync } from 'fs';
import { relative, resolve } from 'path';

class DevErrorReporter {
  constructor() {
    this.projectRoot = process.cwd();
    this.tsConfigPath = resolve(this.projectRoot, 'tsconfig.json');
  }

  log(message, type = 'info') {
    const timestamp = new Date().toLocaleTimeString();
    const prefix = `[${timestamp}]`;

    switch (type) {
      case 'success':
        console.log(chalk.green(`${prefix} ✅ ${message}`));
        break;
      case 'error':
        console.log(chalk.red(`${prefix} ❌ ${message}`));
        break;
      case 'warning':
        console.log(chalk.yellow(`${prefix} ⚠️  ${message}`));
        break;
      case 'info':
      default:
        console.log(chalk.blue(`${prefix} ℹ️  ${message}`));
        break;
    }
  }

  parseTypeScriptError(errorOutput) {
    const errors = [];
    const lines = errorOutput.split('\n');

    let currentError = null;

    for (const line of lines) {
      // Match TypeScript error format: file(line,col): error TS####: message
      const errorMatch = line.match(/^(.+?)\((\d+),(\d+)\):\s+(error|warning)\s+TS(\d+):\s+(.+)$/);

      if (errorMatch) {
        if (currentError) {
          errors.push(currentError);
        }

        currentError = {
          file: errorMatch[1],
          line: parseInt(errorMatch[2]),
          column: parseInt(errorMatch[3]),
          severity: errorMatch[4],
          code: errorMatch[5],
          message: errorMatch[6],
          context: [],
        };
      } else if (currentError && line.trim()) {
        // Additional context lines
        currentError.context.push(line);
      }
    }

    if (currentError) {
      errors.push(currentError);
    }

    return errors;
  }

  getSourceContext(filePath, lineNumber, contextLines = 3) {
    try {
      if (!existsSync(filePath)) {
        return null;
      }

      const content = readFileSync(filePath, 'utf8');
      const lines = content.split('\n');

      const startLine = Math.max(0, lineNumber - contextLines - 1);
      const endLine = Math.min(lines.length, lineNumber + contextLines);

      const context = [];
      for (let i = startLine; i < endLine; i++) {
        const isErrorLine = i === lineNumber - 1;
        context.push({
          lineNumber: i + 1,
          content: lines[i] || '',
          isError: isErrorLine,
        });
      }

      return context;
    } catch (error) {
      return null;
    }
  }

  formatError(error) {
    const relativePath = relative(this.projectRoot, error.file);
    const severityColor = error.severity === 'error' ? chalk.red : chalk.yellow;

    console.log('\n' + '─'.repeat(80));
    console.log(severityColor.bold(`${error.severity.toUpperCase()} TS${error.code}`));
    console.log(chalk.cyan(`📁 ${relativePath}:${error.line}:${error.column}`));
    console.log(chalk.white(error.message));

    // Show source context
    const context = this.getSourceContext(error.file, error.line);
    if (context) {
      console.log('\n' + chalk.gray('Source:'));
      for (const line of context) {
        const lineNumStr = line.lineNumber.toString().padStart(4);
        const prefix = line.isError ? chalk.red('>>> ') : '    ';
        const lineContent = line.isError ? chalk.red(line.content) : chalk.gray(line.content);
        console.log(`${prefix}${chalk.gray(lineNumStr)} │ ${lineContent}`);
      }
    }

    // Provide debugging suggestions
    this.provideSuggestions(error);
  }

  provideSuggestions(error) {
    const suggestions = [];

    // Common TypeScript error suggestions
    if (error.code === '2304') {
      suggestions.push('Check if the identifier is imported correctly');
      suggestions.push('Verify the module path and export');
    } else if (error.code === '2322') {
      suggestions.push('Check type compatibility between assigned value and target');
      suggestions.push('Consider using type assertion if types are compatible');
    } else if (error.code === '2339') {
      suggestions.push('Verify the property exists on the object type');
      suggestions.push('Check for typos in property name');
    } else if (error.code === '2345') {
      suggestions.push('Check function parameter types and count');
      suggestions.push('Verify argument types match parameter expectations');
    }

    if (suggestions.length > 0) {
      console.log('\n' + chalk.blue('💡 Suggestions:'));
      for (const suggestion of suggestions) {
        console.log(`   • ${suggestion}`);
      }
    }

    // Editor integration
    console.log('\n' + chalk.green('🔧 Quick Actions:'));
    console.log(`   • Open in VS Code: code "${error.file}:${error.line}:${error.column}"`);
    console.log(`   • View in browser: file://${error.file}#L${error.line}`);
  }

  async checkTypeScript() {
    this.log('Running TypeScript compiler check...');

    try {
      execSync('npx tsc --noEmit', {
        encoding: 'utf8',
        stdio: ['pipe', 'pipe', 'pipe'],
      });

      this.log('No TypeScript errors found! 🎉', 'success');
      return true;
    } catch (error) {
      const errors = this.parseTypeScriptError(error.stdout || error.stderr || '');

      if (errors.length === 0) {
        this.log('TypeScript check failed but no parseable errors found', 'warning');
        console.log(error.stdout || error.stderr);
        return false;
      }

      console.log(chalk.red.bold(`\n🚨 Found ${errors.length} TypeScript error(s):\n`));

      for (const tsError of errors) {
        this.formatError(tsError);
      }

      console.log('\n' + '='.repeat(80));
      this.log(`Total errors: ${errors.length}`, 'error');

      return false;
    }
  }

  async run() {
    console.log(chalk.bold.blue('\n🔍 Development Error Reporter\n'));

    if (!existsSync(this.tsConfigPath)) {
      this.log('TypeScript configuration not found', 'warning');
      return;
    }

    const success = await this.checkTypeScript();

    if (!success) {
      console.log('\n' + chalk.yellow('💡 Development Tips:'));
      console.log('  • Fix errors one at a time, starting from the top');
      console.log("  • Use your editor's TypeScript integration for real-time feedback");
      console.log('  • Run "npm run check" to see all TypeScript errors');
      console.log('  • Enable source maps for better debugging experience\n');
    }
  }
}

// Run the error reporter
const reporter = new DevErrorReporter();
reporter.run().catch(console.error);
