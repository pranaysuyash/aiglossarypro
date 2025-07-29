#!/usr/bin/env node

import { exec } from 'child_process';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { promisify } from 'util';

const execAsync = promisify(exec);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const clientDir = path.join(__dirname, '..', 'client', 'src');

async function fixRemainingErrors() {
  console.log('🔧 Fixing remaining TypeScript errors...\n');

  // Fix 1: Add missing types to API responses
  await fixApiResponseTypes();

  // Fix 2: Fix Storybook args
  await fixStorybookArgs();

  // Fix 3: Add type definitions for common patterns
  await addTypeDefinitions();

  // Fix 4: Fix optional chaining and null checks
  await fixOptionalChaining();

  console.log('\n✅ TypeScript error fixes completed!');
}

async function fixApiResponseTypes() {
  console.log('📡 Adding API response types...');

  const typeDefPath = path.join(clientDir, 'types', 'api-responses.ts');

  const apiTypes = `// API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface AuthResponse {
  token: string;
  user: {
    id: string;
    email: string;
    firstName?: string;
    lastName?: string;
    lifetimeAccess: boolean;
    isAdmin: boolean;
    subscriptionTier?: string;
    purchaseDate?: string;
  };
}

export interface PurchaseVerificationResponse {
  success: boolean;
  message: string;
  user?: {
    email: string;
    subscriptionTier: string;
    lifetimeAccess: boolean;
    purchaseDate: string;
  };
}

export interface TestPurchaseData {
  orderId: string;
  amount: string;
  environment: string;
}
`;

  await fs.mkdir(path.dirname(typeDefPath), { recursive: true });
  await fs.writeFile(typeDefPath, apiTypes);
  console.log('  ✅ Created api-responses.ts');

  // Update imports in affected files
  const filesToUpdate = [
    'components/FirebaseLoginPage.tsx',
    'components/PurchaseVerification.tsx',
    'components/TestPurchaseButton.tsx',
  ];

  for (const file of filesToUpdate) {
    const filePath = path.join(clientDir, file);
    try {
      let content = await fs.readFile(filePath, 'utf-8');

      // Add import if not present
      if (!content.includes('api-responses')) {
        content = `import type { ApiResponse, AuthResponse, PurchaseVerificationResponse } from '@/types/api-responses';\n${content}`;
      }

      // Fix response types
      content = content.replace(
        /const response = await api\.(post|get)\(/g,
        'const response: ApiResponse = await api.$1('
      );

      await fs.writeFile(filePath, content);
      console.log(`  ✅ Updated ${file}`);
    } catch (error) {
      console.log(`  ⚠️  Could not update ${file}: ${error.message}`);
    }
  }
}

async function fixStorybookArgs() {
  console.log('\n📚 Fixing Storybook story args...');

  const storiesFiles = await findFiles(clientDir, '.stories.tsx');

  for (const file of storiesFiles) {
    try {
      let content = await fs.readFile(file, 'utf-8');

      // Extract component name from file path
      const componentName = path.basename(file, '.stories.tsx');

      // Fix empty story objects
      content = content.replace(/export const (\w+): Story = \{\s*\};?/g, (match, storyName) => {
        return `export const ${storyName}: Story = {
  args: {
    // TODO: Add default props for ${componentName}
  },
};`;
      });

      // Fix specific known stories
      if (file.includes('ShareMenu.stories')) {
        content = content.replace(
          /args: \{\s*\/\/ TODO[^}]*\}/g,
          `args: {
    isOpen: true,
    onClose: () => console.log('Close'),
    title: 'Share this term',
    url: 'https://example.com',
  }`
        );
      }

      if (file.includes('TermActions.stories')) {
        content = content.replace(
          /args: \{\s*\/\/ TODO[^}]*\}/g,
          `args: {
    term: { id: 1, name: 'Test Term', definition: 'Test definition' },
    favoriteLoading: false,
    shareMenuOpen: false,
    onToggleFavorite: () => console.log('Toggle favorite'),
    onCopyLink: () => console.log('Copy link'),
    onShareMenuToggle: (open: boolean) => console.log('Toggle share menu', open),
  }`
        );
      }

      await fs.writeFile(file, content);
      console.log(`  ✅ Fixed ${path.basename(file)}`);
    } catch (error) {
      console.log(`  ⚠️  Could not fix ${path.basename(file)}: ${error.message}`);
    }
  }
}

async function addTypeDefinitions() {
  console.log('\n📝 Adding missing type definitions...');

  // Add utility types
  const utilityTypesPath = path.join(clientDir, 'types', 'utilities.ts');
  const utilityTypes = `// Utility Types
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export type Nullable<T> = T | null;
export type Maybe<T> = T | undefined;
export type AsyncReturnType<T extends (...args: any) => Promise<any>> = 
  T extends (...args: any) => Promise<infer R> ? R : never;

// Common prop types
export interface WithClassName {
  className?: string;
}

export interface WithChildren {
  children?: React.ReactNode;
}

export interface WithStyle {
  style?: React.CSSProperties;
}
`;

  await fs.writeFile(utilityTypesPath, utilityTypes);
  console.log('  ✅ Created utilities.ts');

  // Fix imports in lib/firebase.ts to export signInWithGoogle
  const firebasePath = path.join(clientDir, 'lib', 'firebase.ts');
  try {
    let content = await fs.readFile(firebasePath, 'utf-8');

    if (!content.includes('signInWithGoogle')) {
      content += `\n\n// Google Sign In
export const signInWithGoogle = async () => {
  const provider = new GoogleAuthProvider();
  return signInWithPopup(auth, provider);
};\n`;

      // Add imports if needed
      if (!content.includes('GoogleAuthProvider')) {
        content = content.replace(
          'import {',
          'import {\n  GoogleAuthProvider,\n  signInWithPopup,'
        );
      }
    }

    await fs.writeFile(firebasePath, content);
    console.log('  ✅ Fixed firebase.ts exports');
  } catch (error) {
    console.log('  ⚠️  Could not fix firebase.ts:', error.message);
  }
}

async function fixOptionalChaining() {
  console.log('\n🔗 Fixing optional chaining and null checks...');

  const files = await findFiles(clientDir, '.tsx');
  let fixedCount = 0;

  for (const file of files) {
    try {
      let content = await fs.readFile(file, 'utf-8');
      const originalContent = content;

      // Fix common patterns
      content = content.replace(/response\.data\./g, 'response.data?.');
      content = content.replace(/error\.response\.data/g, 'error?.response?.data');
      content = content.replace(/error\.message/g, 'error?.message');

      // Fix userData access patterns
      content = content.replace(/const userData = (.*?)\.user;/g, 'const userData = $1?.user;');

      // Fix type assertions in catch blocks
      content = content.replace(/} catch \(error\) {/g, '} catch (error: any) {');

      if (content !== originalContent) {
        await fs.writeFile(file, content);
        fixedCount++;
      }
    } catch (error) {
      // Silently continue
    }
  }

  console.log(`  ✅ Fixed optional chaining in ${fixedCount} files`);
}

async function findFiles(dir, extension) {
  const files = [];

  async function walk(currentDir) {
    try {
      const entries = await fs.readdir(currentDir, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = path.join(currentDir, entry.name);

        if (entry.isDirectory() && !entry.name.startsWith('.') && entry.name !== 'node_modules') {
          await walk(fullPath);
        } else if (entry.isFile() && entry.name.endsWith(extension)) {
          files.push(fullPath);
        }
      }
    } catch (error) {
      // Skip directories we can't read
    }
  }

  await walk(dir);
  return files;
}

// Create a summary report
async function createErrorReport() {
  console.log('\n📊 Creating TypeScript error report...');

  try {
    const { stdout } = await execAsync(
      'cd client && npx tsc --noEmit 2>&1 | grep "error TS" | sort | uniq -c | sort -nr | head -20'
    );

    const reportPath = path.join(__dirname, '..', 'docs', 'typescript-errors-report.md');
    const report = `# TypeScript Error Report

Generated: ${new Date().toISOString()}

## Most Common Errors

\`\`\`
${stdout}
\`\`\`

## Next Steps

1. Fix the most common errors first
2. Run \`npm run check\` to verify progress
3. Use \`npx tsc --noEmit --listFiles\` to see all checked files
4. Consider using \`// @ts-ignore\` for complex third-party library issues
5. Gradually migrate to stricter TypeScript settings
`;

    await fs.mkdir(path.dirname(reportPath), { recursive: true });
    await fs.writeFile(reportPath, report);
    console.log('  ✅ Created typescript-errors-report.md');
  } catch (error) {
    console.log('  ⚠️  Could not create error report:', error.message);
  }
}

// Main execution
async function main() {
  try {
    await fixRemainingErrors();
    await createErrorReport();

    // Count remaining errors
    try {
      const { stdout } = await execAsync(
        'cd client && npx tsc --noEmit 2>&1 | grep "error TS" | wc -l'
      );
      const errorCount = parseInt(stdout.trim());

      console.log('\n📊 Error Summary:');
      console.log(`   Remaining TypeScript errors: ${errorCount}`);

      if (errorCount < 100) {
        console.log('   ✅ Great progress! Consider fixing remaining errors manually.');
      } else {
        console.log('   💡 Run this script again to fix more errors.');
      }
    } catch (error) {
      console.log('   ⚠️  Could not count remaining errors');
    }
  } catch (error) {
    console.error('❌ Error during TypeScript fixes:', error);
    process.exit(1);
  }
}

main();
