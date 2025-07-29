#!/usr/bin/env node
import { existsSync } from 'node:fs';
import { join } from 'node:path';

const requiredDirs = [
  'apps/api',
  'apps/web',
  'packages/shared',
  'packages/database',
  'packages/auth',
  'packages/config',
  'infrastructure/docker',
  'tools/build',
  'docs/reports'
];

const requiredFiles = [
  'pnpm-workspace.yaml',
  'apps/api/package.json',
  'apps/web/package.json',
  'packages/shared/package.json',
  'packages/database/package.json',
  'packages/auth/package.json',
  'packages/config/package.json'
];

console.log('🔍 Verifying monorepo structure...\n');

let allGood = true;

// Check directories
console.log('📁 Checking directories:');
for (const dir of requiredDirs) {
  const exists = existsSync(dir);
  console.log(`  ${exists ? '✅' : '❌'} ${dir}`);
  if (!exists) allGood = false;
}

console.log('\n📄 Checking files:');
for (const file of requiredFiles) {
  const exists = existsSync(file);
  console.log(`  ${exists ? '✅' : '❌'} ${file}`);
  if (!exists) allGood = false;
}

console.log('\n' + (allGood ? '✅ Monorepo structure verified!' : '❌ Some items are missing'));
process.exit(allGood ? 0 : 1);