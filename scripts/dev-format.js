#!/usr/bin/env node

/**
 * Development Code Formatting Automation Script
 *
 * This script provides automated code formatting for development workflow:
 * - Formats code with Biome
 * - Organizes imports
 * - Fixes linting issues where possible
 * - Provides detailed feedback
 */

import chalk from 'chalk';
import { execSync } from 'child_process';
import { existsSync } from 'fs';

const BIOME_CONFIG = 'biome.json';

function log(message, type = 'info') {
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

function runCommand(command, description) {
  try {
    log(`Running: ${description}...`);
    const output = execSync(command, {
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'pipe'],
    });

    if (output.trim()) {
      console.log(output);
    }

    log(`Completed: ${description}`, 'success');
    return true;
  } catch (error) {
    log(`Failed: ${description}`, 'error');
    if (error.stdout) {
      console.log(error.stdout);
    }
    if (error.stderr) {
      console.error(error.stderr);
    }
    return false;
  }
}

function main() {
  console.log(chalk.bold.blue('\n🔧 Development Code Formatting Automation\n'));

  // Check if Biome config exists
  if (!existsSync(BIOME_CONFIG)) {
    log(`Biome configuration file (${BIOME_CONFIG}) not found`, 'error');
    process.exit(1);
  }

  const tasks = [
    {
      command: 'npx biome check . --write',
      description: 'Format code and fix linting issues with Biome',
    },
    {
      command: 'npx biome format . --write',
      description: 'Format all supported files',
    },
  ];

  let allSuccessful = true;

  for (const task of tasks) {
    const success = runCommand(task.command, task.description);
    if (!success) {
      allSuccessful = false;
    }
  }

  console.log('\n' + '='.repeat(50));

  if (allSuccessful) {
    log('All formatting tasks completed successfully! 🎉', 'success');
  } else {
    log('Some formatting tasks failed. Please check the output above.', 'warning');
  }

  console.log('\n💡 Development Tips:');
  console.log('  • Run this script before committing code');
  console.log('  • Configure your editor to format on save');
  console.log('  • Use "npm run format:biome" for quick formatting');
  console.log('  • Check "npm run lint:biome" for linting issues\n');
}

main();
