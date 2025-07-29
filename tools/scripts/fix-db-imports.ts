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
  
  // Fix db imports
  const patterns = [
    { regex: /from ['"]\.\.\/\.\.\/db['"]/g, replacement: "from '@aiglossarypro/database'" },
    { regex: /from ['"]\.\.\/db['"]/g, replacement: "from '@aiglossarypro/database'" },
    { regex: /from ['"]\.\/db['"]/g, replacement: "from '@aiglossarypro/database'" },
  ];
  
  patterns.forEach(({ regex, replacement }) => {
    if (regex.test(content)) {
      content = content.replace(regex, replacement);
      modified = true;
    }
  });
  
  if (modified) {
    writeFileSync(fullPath, content);
    console.log(`✅ Fixed db imports in: ${file}`);
    totalFixed++;
  }
});

console.log(`\n✨ Fixed db imports in ${totalFixed} files`);