import fs from 'fs';
import path from 'path';
import { glob } from 'glob';
// Fix ESM imports by adding .js extensions
async function fixESMImports() {
    console.log('🔧 Fixing ESM imports in TypeScript files...');
    // Find all TypeScript files in server and shared directories
    const files = await glob(['server/**/*.ts', 'shared/**/*.ts'], {
        ignore: ['node_modules/**', 'dist/**', '**/*.d.ts']
    });
    console.log(`Found ${files.length} TypeScript files to process`);
    let totalFixed = 0;
    for (const file of files) {
        let content = fs.readFileSync(file, 'utf-8');
        let modified = false;
        // Fix relative imports without extensions
        const relativeImportRegex = /from\s+['"](\.\.?\/[^'"]+?)(?<!\.js)(?<!\.json)['"]/g;
        const updatedContent = content.replace(relativeImportRegex, (match, importPath) => {
            // Skip if it already has an extension or is importing a directory with index
            if (importPath.includes('.') && !importPath.startsWith('./') && !importPath.startsWith('../')) {
                return match;
            }
            // Check if this is likely a directory import (has no file-like ending)
            const lastPart = importPath.split('/').pop();
            if (!lastPart || !lastPart.includes('-') && !lastPart.includes('_') && lastPart.length < 15) {
                // Likely a directory, add /index.js
                const basePath = path.dirname(file);
                const resolvedPath = path.resolve(basePath, importPath);
                // Check if index.ts exists
                if (fs.existsSync(resolvedPath + '/index.ts')) {
                    modified = true;
                    totalFixed++;
                    return match.replace(importPath, importPath + '/index.js');
                }
            }
            // Add .js extension
            modified = true;
            totalFixed++;
            return match.replace(importPath, importPath + '.js');
        });
        // Fix @shared imports
        const sharedImportRegex = /from\s+['"]@shared\/([^'"]+?)(?<!\.js)(?<!\.json)['"]/g;
        const finalContent = updatedContent.replace(sharedImportRegex, (match, importPath) => {
            modified = true;
            totalFixed++;
            return match.replace(`@shared/${importPath}`, `@shared/${importPath}.js`);
        });
        if (modified) {
            fs.writeFileSync(file, finalContent);
            console.log(`✅ Fixed imports in ${file}`);
        }
    }
    console.log(`\n✨ Fixed ${totalFixed} imports across ${files.length} files`);
}
// Run the script
fixESMImports().catch(console.error);
