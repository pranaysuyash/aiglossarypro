#!/usr/bin/env node

/**
 * Replace console.log with proper logger calls throughout the codebase
 */

const fs = require('fs');
const path = require('path');

const TARGET_FILES = [
  'server/advancedExcelParser.ts',
  'server/checkpointManager.ts',
  'server/versioningService.ts',
  'server/aiService.ts'
];

function replaceConsoleInFile(filePath) {
  console.log(`🔧 Processing: ${filePath}`);
  
  if (!fs.existsSync(filePath)) {
    console.log(`⚠️  File not found: ${filePath}`);
    return;
  }
  
  let content = fs.readFileSync(filePath, 'utf-8');
  let changes = 0;
  
  // Replace different console patterns
  const replacements = [
    // console.log patterns
    { from: /console\.log\(/g, to: 'logger.info(' },
    { from: /console\.info\(/g, to: 'logger.info(' },
    { from: /console\.warn\(/g, to: 'logger.warn(' },
    { from: /console\.error\(/g, to: 'logger.error(' },
    { from: /console\.debug\(/g, to: 'logger.debug(' },
  ];
  
  replacements.forEach(replacement => {
    const matches = content.match(replacement.from);
    if (matches) {
      content = content.replace(replacement.from, replacement.to);
      changes += matches.length;
    }
  });
  
  if (changes > 0) {
    // Ensure logger import exists
    if (!content.includes("import { log as logger }")) {
      // Find the right place to add the import
      const importSection = content.match(/^import[^;]+;$/gm);
      if (importSection && importSection.length > 0) {
        const lastImport = importSection[importSection.length - 1];
        const importIndex = content.indexOf(lastImport) + lastImport.length;
        content = content.slice(0, importIndex) + 
                 "\nimport { log as logger } from './utils/logger';" + 
                 content.slice(importIndex);
      }
    }
    
    fs.writeFileSync(filePath, content, 'utf-8');
    console.log(`✅ Replaced ${changes} console calls with logger in ${filePath}`);
  } else {
    console.log(`📝 No console calls found in ${filePath}`);
  }
}

function main() {
  console.log('🔄 Replacing console.log with logger calls...');
  console.log('============================================');
  
  TARGET_FILES.forEach(replaceConsoleInFile);
  
  console.log('\n✅ Console replacement complete!');
  console.log('Note: Manual verification recommended for complex cases');
}

main();