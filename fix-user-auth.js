#!/usr/bin/env node

/**
 * Script to fix all user authentication references in user.ts
 */

const fs = require('fs');
const path = require('path');

const filePath = '/Users/pranay/Projects/AIMLGlossary/AIGlossaryPro/server/routes/user.ts';

console.log('🔧 Fixing user authentication references...');

// Read the file
let content = fs.readFileSync(filePath, 'utf8');

// Replace all instances where we need to add tokenMiddleware and fix user ID access
const middlewareReplacements = [
  // Add tokenMiddleware to routes that don't have it
  {
    search: /authMiddleware as any,\s*parseId\(\) as any,/g,
    replace: 'authMiddleware as any,\n    tokenMiddleware,\n    parseId() as any,',
  },
  {
    search: /authMiddleware as any,\s*parsePagination/g,
    replace: 'authMiddleware as any,\n    tokenMiddleware,\n    parsePagination',
  },
  {
    search: /authMiddleware as any,\s*parseNumericQuery/g,
    replace: 'authMiddleware as any,\n    tokenMiddleware,\n    parseNumericQuery',
  },
  {
    search: /authMiddleware as any,\s*async \(req: AuthenticatedRequest/g,
    replace: 'authMiddleware as any,\n    tokenMiddleware,\n    async (req: AuthenticatedRequest',
  },
];

// Apply middleware replacements
middlewareReplacements.forEach(replacement => {
  content = content.replace(replacement.search, replacement.replace);
});

// Replace user ID access patterns
const userIdReplacements = [
  {
    search: /const userId = req\.user\.claims\.sub;/g,
    replace: `const userInfo = getUserInfo(req);
        if (!userInfo) {
          return res.status(401).json({
            success: false,
            message: 'Authentication required',
          });
        }
        const userId = userInfo.id;`,
  },
];

// Apply user ID replacements
userIdReplacements.forEach(replacement => {
  content = content.replace(replacement.search, replacement.replace);
});

// Write the file back
fs.writeFileSync(filePath, content);

console.log('✅ Fixed user authentication references');
console.log('📝 Updated middleware calls and user ID access patterns');
