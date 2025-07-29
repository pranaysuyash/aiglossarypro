#!/usr/bin/env node
import { readFileSync, writeFileSync } from 'fs';
import { glob } from 'glob';

async function fixSharedImports() {
  console.log('🔄 Fixing @aiglossarypro/shared imports...');
  
  const files = await glob('apps/api/src/**/*.ts');
  
  const replacements = [
    // Fix enhancedSchema import
    { from: /from '@aiglossarypro\/shared\/enhancedSchema'/g, to: "from '@aiglossarypro/shared'" },
    { from: /from "@aiglossarypro\/shared\/enhancedSchema"/g, to: 'from "@aiglossarypro/shared"' },
    
    // Fix schema import
    { from: /from '@aiglossarypro\/shared\/schema'/g, to: "from '@aiglossarypro/shared'" },
    { from: /from "@aiglossarypro\/shared\/schema"/g, to: 'from "@aiglossarypro/shared"' },
    
    // Fix types import
    { from: /from '@aiglossarypro\/shared\/types'/g, to: "from '@aiglossarypro/shared'" },
    { from: /from "@aiglossarypro\/shared\/types"/g, to: 'from "@aiglossarypro/shared"' },
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
  
  console.log(`\n✨ Fixed ${updatedCount} files`);
}

fixSharedImports().catch(console.error);