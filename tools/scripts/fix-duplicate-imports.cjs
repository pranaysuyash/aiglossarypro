#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const glob = require('glob');

// Find all TypeScript and TSX files
const files = glob.sync('{client,server,shared,scripts,tests}/**/*.{ts,tsx}', {
  ignore: ['**/node_modules/**', '**/dist/**', '**/build/**']
});

let fixedCount = 0;

files.forEach(file => {
  try {
    let content = fs.readFileSync(file, 'utf8');
    let modified = false;

    // Fix duplicate React imports
    const reactImportRegex = /import\s+(?:type\s+)?(?:\{[^}]*\}\s+from\s+)?'react';\s*\nimport\s+(?:type\s+)?(?:\{[^}]*\}\s+from\s+)?'react';/g;
    
    // Check if file has duplicate React imports
    const lines = content.split('\n');
    const reactImports = [];
    const reactImportLines = [];
    
    lines.forEach((line, index) => {
      if (line.includes("from 'react'") && line.includes('import')) {
        reactImports.push(line);
        reactImportLines.push(index);
      }
    });
    
    if (reactImports.length > 1) {
      // Combine all React imports
      const namedImports = new Set();
      const typeImports = new Set();
      let hasDefaultImport = false;
      let hasTypeDefaultImport = false;
      
      reactImports.forEach(importLine => {
        // Check for default import
        if (importLine.match(/import\s+React\s+from/)) {
          hasDefaultImport = true;
        }
        if (importLine.match(/import\s+type\s+React\s+from/)) {
          hasTypeDefaultImport = true;
        }
        
        // Extract named imports
        const namedMatch = importLine.match(/import\s+(?:type\s+)?{([^}]+)}/);
        if (namedMatch) {
          const isTypeImport = importLine.includes('import type');
          const imports = namedMatch[1].split(',').map(s => s.trim());
          imports.forEach(imp => {
            if (isTypeImport) {
              typeImports.add(imp);
            } else {
              namedImports.add(imp);
            }
          });
        }
      });
      
      // Build combined import
      const importStatements = [];
      
      if (hasDefaultImport) {
        const named = Array.from(namedImports).join(', ');
        if (named) {
          importStatements.push(`import React, { ${named} } from 'react';`);
        } else {
          importStatements.push(`import React from 'react';`);
        }
      } else if (namedImports.size > 0) {
        importStatements.push(`import { ${Array.from(namedImports).join(', ')} } from 'react';`);
      }
      
      if (hasTypeDefaultImport && !hasDefaultImport) {
        importStatements.push(`import type React from 'react';`);
      }
      
      if (typeImports.size > 0) {
        importStatements.push(`import type { ${Array.from(typeImports).join(', ')} } from 'react';`);
      }
      
      // Replace the first React import with combined, remove the rest
      for (let i = reactImportLines.length - 1; i >= 0; i--) {
        if (i === 0) {
          lines[reactImportLines[i]] = importStatements.join('\n');
        } else {
          lines.splice(reactImportLines[i], 1);
        }
      }
      
      content = lines.join('\n');
      modified = true;
    }
    
    // Fix other duplicate imports
    const importMap = new Map();
    const importLines = [];
    
    lines.forEach((line, index) => {
      const match = line.match(/import\s+(?:type\s+)?(?:{[^}]+}|[^{]+)\s+from\s+['"]([^'"]+)['"]/);
      if (match) {
        const module = match[1];
        if (!importMap.has(module)) {
          importMap.set(module, []);
        }
        importMap.get(module).push({ line, index });
      }
    });
    
    // Find duplicates
    for (const [module, imports] of importMap.entries()) {
      if (imports.length > 1 && module !== 'react') { // React already handled
        // Combine imports from the same module
        const namedImports = new Set();
        const typeImports = new Set();
        let hasDefaultImport = false;
        let defaultImportName = '';
        
        imports.forEach(({ line }) => {
          // Check for default import
          const defaultMatch = line.match(/import\s+(?!type\s+)(?!{)(\w+)(?:\s*,\s*{)?/);
          if (defaultMatch && !line.includes(' type ')) {
            hasDefaultImport = true;
            defaultImportName = defaultMatch[1];
          }
          
          // Extract named imports
          const namedMatch = line.match(/import\s+(?:type\s+)?(?:\w+\s*,\s*)?{([^}]+)}/);
          if (namedMatch) {
            const isTypeImport = line.includes('import type');
            const importsList = namedMatch[1].split(',').map(s => s.trim());
            importsList.forEach(imp => {
              if (isTypeImport) {
                typeImports.add(imp);
              } else {
                namedImports.add(imp);
              }
            });
          }
        });
        
        // Build combined import
        let combinedImport = '';
        
        if (hasDefaultImport && namedImports.size > 0) {
          combinedImport = `import ${defaultImportName}, { ${Array.from(namedImports).join(', ')} } from '${module}';`;
        } else if (hasDefaultImport) {
          combinedImport = `import ${defaultImportName} from '${module}';`;
        } else if (namedImports.size > 0) {
          combinedImport = `import { ${Array.from(namedImports).join(', ')} } from '${module}';`;
        }
        
        if (typeImports.size > 0) {
          if (combinedImport) {
            combinedImport += `\nimport type { ${Array.from(typeImports).join(', ')} } from '${module}';`;
          } else {
            combinedImport = `import type { ${Array.from(typeImports).join(', ')} } from '${module}';`;
          }
        }
        
        // Replace first occurrence, remove others
        const sortedImports = imports.sort((a, b) => a.index - b.index);
        for (let i = sortedImports.length - 1; i >= 0; i--) {
          if (i === 0) {
            lines[sortedImports[i].index] = combinedImport;
          } else {
            lines.splice(sortedImports[i].index, 1);
          }
        }
        
        modified = true;
      }
    }
    
    if (modified) {
      fs.writeFileSync(file, lines.join('\n'));
      fixedCount++;
      console.log(`Fixed duplicate imports in: ${file}`);
    }
  } catch (error) {
    console.error(`Error processing ${file}:`, error.message);
  }
});

console.log(`\nFixed duplicate imports in ${fixedCount} files.`);