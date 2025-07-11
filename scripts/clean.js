#!/usr/bin/env node

import { exec } from 'node:child_process';
import { rm } from 'node:fs/promises';
import { join } from 'node:path';
import { promisify } from 'node:util';

const execAsync = promisify(exec);

// ANSI color codes
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  blue: '\x1b[34m',
};

const log = (message, color = 'blue') => {
  console.log(`${colors[color]}${message}${colors.reset}`);
};

const logSuccess = (message) => log(`✅ ${message}`, 'green');
const logError = (message) => log(`❌ ${message}`, 'red');
const logWarning = (message) => log(`⚠️  ${message}`, 'yellow');
const logInfo = (message) => log(`ℹ️  ${message}`, 'blue');

async function cleanDirectory(path, description) {
  try {
    await rm(path, { recursive: true, force: true });
    logSuccess(`Cleaned ${description}`);
  } catch (error) {
    if (error.code !== 'ENOENT') {
      logWarning(`Could not clean ${description}: ${error.message}`);
    }
  }
}

async function killProcesses() {
  logInfo('Killing any running development processes...');
  
  const commands = [
    "pkill -f 'npm.*dev'",
    "pkill -f 'tsx.*server'",
    "pkill -f 'vite.*dev'",
    "pkill -f 'dev-start'",
  ];

  for (const cmd of commands) {
    try {
      await execAsync(cmd);
    } catch (_error) {
      // Ignore errors - processes might not exist
    }
  }
  
  logSuccess('Processes cleaned up');
}

async function clean() {
  console.log('\n🧹 AI Glossary Pro - Clean Script\n');

  // Kill any running processes
  await killProcesses();

  // Clean build artifacts
  logInfo('Cleaning build artifacts...');
  await cleanDirectory(join(process.cwd(), 'dist'), 'dist directory');
  await cleanDirectory(join(process.cwd(), '.vite'), '.vite cache');
  await cleanDirectory(join(process.cwd(), 'node_modules/.vite'), 'vite module cache');
  
  // Clean coverage reports
  await cleanDirectory(join(process.cwd(), 'coverage'), 'coverage reports');
  await cleanDirectory(join(process.cwd(), '.nyc_output'), 'nyc output');
  
  // Clean test artifacts
  await cleanDirectory(join(process.cwd(), 'test-results'), 'test results');
  await cleanDirectory(join(process.cwd(), 'playwright-report'), 'playwright reports');
  await cleanDirectory(join(process.cwd(), '__screenshots__'), 'visual test screenshots');
  await cleanDirectory(join(process.cwd(), 'comprehensive-audit'), 'audit results');
  
  // Clean logs
  logInfo('Cleaning log files...');
  try {
    const { stdout } = await execAsync('find . -maxdepth 1 -name "*.log" -type f');
    const logFiles = stdout.trim().split('\n').filter(f => f);
    
    for (const logFile of logFiles) {
      await rm(logFile, { force: true });
      logSuccess(`Removed ${logFile}`);
    }
  } catch (_error) {
    // No log files found
  }
  
  // Clean temporary files
  await cleanDirectory(join(process.cwd(), '.tmp'), 'temporary files');
  await cleanDirectory(join(process.cwd(), 'tmp'), 'tmp directory');
  
  // Clean TypeScript build info
  try {
    await rm(join(process.cwd(), 'tsconfig.tsbuildinfo'), { force: true });
    logSuccess('Cleaned TypeScript build info');
  } catch (_error) {
    // File doesn't exist
  }
  
  // Clean package manager caches (optional)
  logInfo('Note: To clean npm cache, run: npm cache clean --force');
  
  console.log('\n✨ Clean complete!\n');
}

// Run the clean script
clean().catch((error) => {
  logError(`Clean script failed: ${error.message}`);
  process.exit(1);
});