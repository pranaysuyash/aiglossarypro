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
  
  // Fix imports from '../../../shared/' to '@aiglossarypro/shared'
  const sharedImportRegex = /from ['"]\.\.\/\.\.\/\.\.\/shared\/(.*?)['"]/g;
  if (sharedImportRegex.test(content)) {
    content = content.replace(sharedImportRegex, "from '@aiglossarypro/shared/$1'");
    modified = true;
  }
  
  // Fix imports from '../../../database/' to '@aiglossarypro/database'
  const dbImportRegex = /from ['"]\.\.\/\.\.\/\.\.\/database\/(.*?)['"]/g;
  if (dbImportRegex.test(content)) {
    content = content.replace(dbImportRegex, "from '@aiglossarypro/database/$1'");
    modified = true;
  }
  
  // Fix imports from '../../../auth/' to '@aiglossarypro/auth'
  const authImportRegex = /from ['"]\.\.\/\.\.\/\.\.\/auth\/(.*?)['"]/g;
  if (authImportRegex.test(content)) {
    content = content.replace(authImportRegex, "from '@aiglossarypro/auth/$1'");
    modified = true;
  }
  
  // Fix imports from '../../../config/' to '@aiglossarypro/config'
  const configImportRegex = /from ['"]\.\.\/\.\.\/\.\.\/config\/(.*?)['"]/g;
  if (configImportRegex.test(content)) {
    content = content.replace(configImportRegex, "from '@aiglossarypro/config/$1'");
    modified = true;
  }
  
  if (modified) {
    writeFileSync(fullPath, content);
    console.log(`✅ Fixed imports in: ${file}`);
    totalFixed++;
  }
});

console.log(`\n✨ Fixed imports in ${totalFixed} files`);