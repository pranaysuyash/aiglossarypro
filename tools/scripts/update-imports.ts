#!/usr/bin/env node
import { readFileSync, writeFileSync } from 'fs';
import { glob } from 'glob';
import { join } from 'path';

async function updateImports() {
  console.log('🔄 Updating imports in API source files...');
  
  const files = await glob('apps/api/src/**/*.ts');
  
  const replacements = [
    // Update @shared imports
    { from: /@shared\//g, to: '@aiglossarypro/shared/' },
    { from: /from '@shared'/g, to: "from '@aiglossarypro/shared'" },
    { from: /from "@shared"/g, to: 'from "@aiglossarypro/shared"' },
    
    // Update relative imports for moved packages
    { from: /from ['"]\.\/db['"]/g, to: "from '@aiglossarypro/database'" },
    { from: /from ['"]\.\/db\.js['"]/g, to: "from '@aiglossarypro/database'" },
    { from: /from ['"]\.\.\/db['"]/g, to: "from '@aiglossarypro/database'" },
    { from: /from ['"]\.\.\/auth\/simpleAuth['"]/g, to: "from '@aiglossarypro/auth'" },
    { from: /from ['"]\.\.\/config\/firebase['"]/g, to: "from '@aiglossarypro/config'" },
    { from: /from ['"]\.\/config['"]/g, to: "from '@aiglossarypro/config'" },
  ];
  
  let updatedCount = 0;
  
  for (const file of files) {
    let content = readFileSync(file, 'utf-8');
    let modified = false;
    
    for (const { from, to } of replacements) {
      const newContent = content.replace(from, to);
      if (newContent !== content) {
        content = newContent;
        modified = true;
      }
    }
    
    if (modified) {
      writeFileSync(file, content);
      console.log(`✅ Updated: ${file}`);
      updatedCount++;
    }
  }
  
  console.log(`\n✨ Updated ${updatedCount} files`);
}

updateImports().catch(console.error);