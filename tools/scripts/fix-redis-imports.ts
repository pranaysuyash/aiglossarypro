#!/usr/bin/env tsx

import { readFileSync, writeFileSync } from 'fs';
import { globSync } from 'glob';
import { resolve } from 'path';

const apiRoot = resolve(process.cwd(), 'apps/api');

// Find all TypeScript files in the API
const files = globSync('src/**/*.{ts,tsx}', { cwd: apiRoot });

let totalFixed = 0;

files.forEach(file => {
  const fullPath = resolve(apiRoot, file);
  let content = readFileSync(fullPath, 'utf-8');
  let modified = false;
  
  // Fix redis import patterns
  const patterns = [
    // Fix relative redis imports
    { regex: /from ['"]\.\/config\/redis['"]/g, replacement: "from '@aiglossarypro/config/config/redis'" },
    { regex: /from ['"]\.\.\/config\/redis['"]/g, replacement: "from '@aiglossarypro/config/config/redis'" },
    { regex: /from ['"]\.\.\/\.\.\/config\/redis['"]/g, replacement: "from '@aiglossarypro/config/config/redis'" },
    // Fix incorrect package redis imports
    { regex: /from ['"]@aiglossarypro\/config\/redis['"]/g, replacement: "from '@aiglossarypro/config/config/redis'" },
  ];
  
  patterns.forEach(({ regex, replacement }) => {
    if (regex.test(content)) {
      content = content.replace(regex, replacement);
      modified = true;
    }
  });
  
  if (modified) {
    writeFileSync(fullPath, content);
    console.log(`✅ Fixed redis imports in: ${file}`);
    totalFixed++;
  }
});

console.log(`\n✨ Fixed redis imports in ${totalFixed} files`);