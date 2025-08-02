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
        // Fix imports from 'shared/' without prefix
        { regex: /from ['"]shared\/(.*?)['"]/g, replacement: "from '@aiglossarypro/shared/$1'" },
        // Fix imports from '../shared/'
        { regex: /from ['"]\.\.\/shared\/(.*?)['"]/g, replacement: "from '@aiglossarypro/shared/$1'" },
        // Fix imports from 'database/' without prefix
        { regex: /from ['"]database\/(.*?)['"]/g, replacement: "from '@aiglossarypro/database/$1'" },
        // Fix imports from '../database/'
        { regex: /from ['"]\.\.\/database\/(.*?)['"]/g, replacement: "from '@aiglossarypro/database/$1'" },
        // Fix imports from 'auth/' without prefix
        { regex: /from ['"]auth\/(.*?)['"]/g, replacement: "from '@aiglossarypro/auth/$1'" },
        // Fix imports from '../auth/'
        { regex: /from ['"]\.\.\/auth\/(.*?)['"]/g, replacement: "from '@aiglossarypro/auth/$1'" },
        // Fix imports from 'config/' without prefix
        { regex: /from ['"]config\/(.*?)['"]/g, replacement: "from '@aiglossarypro/config/$1'" },
        // Fix imports from '../config/'
        { regex: /from ['"]\.\.\/config\/(.*?)['"]/g, replacement: "from '@aiglossarypro/config/$1'" },
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
