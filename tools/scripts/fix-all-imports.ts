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
  
  // Fix various import patterns
  const patterns = [
    // Fix config imports
    { regex: /from ['"]\.\.\/config['"]/g, replacement: "from '@aiglossarypro/config'" },
    { regex: /from ['"]\.\.\/\.\.\/config['"]/g, replacement: "from '@aiglossarypro/config'" },
    
    // Fix environment config imports
    { regex: /from ['"]\.\.\/config\/environment['"]/g, replacement: "from '@aiglossarypro/config/environment'" },
    { regex: /from ['"]\.\.\/\.\.\/config\/environment['"]/g, replacement: "from '@aiglossarypro/config/environment'" },
    
    // Fix redis config imports
    { regex: /from ['"]\.\.\/config\/redis['"]/g, replacement: "from '@aiglossarypro/config/config/redis'" },
    { regex: /from ['"]\.\.\/\.\.\/config\/redis['"]/g, replacement: "from '@aiglossarypro/config/config/redis'" },
    
    // Fix server imports that should be from shared
    { regex: /from ['"]\.\.\/\.\.\/server\/types\/express['"]/g, replacement: "from '@aiglossarypro/shared/types'" },
    
    // Fix any remaining client imports
    { regex: /from ['"]\.\.\/\.\.\/client\/(.*?)['"]/g, replacement: "// TODO: Move from client - $1" },
    { regex: /from ['"]\.\.\/client\/(.*?)['"]/g, replacement: "// TODO: Move from client - $1" },
  ];
  
  patterns.forEach(({ regex, replacement }) => {
    if (regex.test(content)) {
      content = content.replace(regex, replacement);
      modified = true;
    }
  });
  
  if (modified) {
    writeFileSync(fullPath, content);
    console.log(`✅ Fixed imports in: ${file}`);
    totalFixed++;
  }
});

console.log(`\n✨ Fixed imports in ${totalFixed} files`);