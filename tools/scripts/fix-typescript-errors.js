#!/usr/bin/env node

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const clientDir = path.join(__dirname, '..', 'client', 'src');

async function fixTypeScriptErrors() {
  console.log('🔧 Fixing common TypeScript errors...\n');

  let fixedCount = 0;

  // Fix 1: Storybook files with missing args
  console.log('📚 Fixing Storybook files...');
  await fixStorybookFiles();

  // Fix 2: Case sensitivity imports
  console.log('\n📁 Fixing case-sensitive imports...');
  await fixCaseSensitiveImports();

  // Fix 3: Type assertion errors
  console.log('\n🎯 Fixing type assertions...');
  await fixTypeAssertions();

  console.log(`\n✅ Fixed ${fixedCount} files`);

  async function fixStorybookFiles() {
    const storiesFiles = await findFiles(clientDir, '.stories.tsx');

    for (const file of storiesFiles) {
      const content = await fs.readFile(file, 'utf-8');
      let newContent = content;

      // Fix missing args in story definitions
      newContent = newContent.replace(
        /export const (\w+): Story = \{\s*\}/g,
        (match, storyName) => {
          fixedCount++;
          return `export const ${storyName}: Story = {\n  args: {\n    // Add default props here\n  },\n}`;
        }
      );

      if (newContent !== content) {
        await fs.writeFile(file, newContent);
        console.log(`  ✅ Fixed ${path.relative(clientDir, file)}`);
      }
    }
  }

  async function fixCaseSensitiveImports() {
    const fixes = [
      { wrong: './Checkbox', correct: './checkbox' },
      { wrong: './Drawer', correct: './drawer' },
      { wrong: './Label', correct: './label' },
      { wrong: '@/components/ui/Checkbox', correct: '@/components/ui/checkbox' },
      { wrong: '@/components/ui/Drawer', correct: '@/components/ui/drawer' },
      { wrong: '@/components/ui/Label', correct: '@/components/ui/label' },
    ];

    const files = await findFiles(clientDir, '.tsx');

    for (const file of files) {
      const content = await fs.readFile(file, 'utf-8');
      let newContent = content;

      for (const fix of fixes) {
        if (newContent.includes(fix.wrong)) {
          newContent = newContent.replace(new RegExp(fix.wrong, 'g'), fix.correct);
          fixedCount++;
        }
      }

      if (newContent !== content) {
        await fs.writeFile(file, newContent);
        console.log(`  ✅ Fixed imports in ${path.relative(clientDir, file)}`);
      }
    }
  }

  async function fixTypeAssertions() {
    const files = [
      'components/FirebaseLoginPage.tsx',
      'components/PurchaseVerification.tsx',
      'components/TestPurchaseButton.tsx',
    ];

    for (const file of files) {
      const filePath = path.join(clientDir, file);
      try {
        const content = await fs.readFile(filePath, 'utf-8');
        let newContent = content;

        // Fix type assertions for error handling
        newContent = newContent.replace(/catch \(error\) \{/g, 'catch (error: any) {');

        // Fix response.data checks
        newContent = newContent.replace(/response\.data\./g, 'response.data?.');

        // Fix type assertions for userData
        newContent = newContent.replace(
          /const userData = data\./g,
          'const userData = (data as any).'
        );

        // Fix setError calls
        newContent = newContent.replace(
          /setError\(error\)/g,
          'setError(error.message || String(error))'
        );

        if (newContent !== content) {
          await fs.writeFile(filePath, newContent);
          console.log(`  ✅ Fixed type assertions in ${file}`);
          fixedCount++;
        }
      } catch (error) {
        console.log(`  ⚠️  Could not process ${file}: ${error.message}`);
      }
    }
  }
}

async function findFiles(dir, extension) {
  const files = [];

  async function walk(currentDir) {
    const entries = await fs.readdir(currentDir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(currentDir, entry.name);

      if (entry.isDirectory() && !entry.name.startsWith('.') && entry.name !== 'node_modules') {
        await walk(fullPath);
      } else if (entry.isFile() && entry.name.endsWith(extension)) {
        files.push(fullPath);
      }
    }
  }

  await walk(dir);
  return files;
}

// Add additional specific fixes
async function fixSpecificErrors() {
  console.log('\n🎯 Fixing specific TypeScript errors...');

  // Fix FirebaseLoginPage signInWithGoogle import
  const firebaseLoginPath = path.join(clientDir, 'components/FirebaseLoginPage.tsx');
  try {
    let content = await fs.readFile(firebaseLoginPath, 'utf-8');

    // Remove invalid import
    content = content.replace("import { signInWithGoogle } from '@/lib/firebase';", '');

    // Add the function if it's used
    if (content.includes('signInWithGoogle')) {
      content = content.replace(
        "import { auth } from '@/lib/firebase';",
        `import { auth } from '@/lib/firebase';
import { signInWithPopup, GoogleAuthProvider } from 'firebase/auth';

const signInWithGoogle = async () => {
  const provider = new GoogleAuthProvider();
  return signInWithPopup(auth, provider);
};`
      );
    }

    await fs.writeFile(firebaseLoginPath, content);
    console.log('  ✅ Fixed FirebaseLoginPage imports');
  } catch (error) {
    console.log('  ⚠️  Could not fix FirebaseLoginPage:', error.message);
  }

  // Fix TestPurchaseButton export
  const testPurchasePath = path.join(clientDir, 'components/__tests__/TestPurchaseButton.test.tsx');
  try {
    let content = await fs.readFile(testPurchasePath, 'utf-8');

    content = content.replace(
      'import TestPurchaseButton from',
      'import { TestPurchaseButton } from'
    );

    await fs.writeFile(testPurchasePath, content);
    console.log('  ✅ Fixed TestPurchaseButton import');
  } catch (error) {
    console.log('  ⚠️  Could not fix TestPurchaseButton test:', error.message);
  }
}

// Create a tsconfig for stricter type checking
async function createStricterTsConfig() {
  console.log('\n📝 Creating stricter TypeScript configuration...');

  const tsConfigPath = path.join(__dirname, '..', 'tsconfig.strict.json');
  const strictConfig = {
    extends: './tsconfig.json',
    compilerOptions: {
      strict: true,
      noImplicitAny: true,
      strictNullChecks: true,
      strictFunctionTypes: true,
      strictBindCallApply: true,
      strictPropertyInitialization: true,
      noImplicitThis: true,
      alwaysStrict: true,
      noUnusedLocals: true,
      noUnusedParameters: true,
      noImplicitReturns: true,
      noFallthroughCasesInSwitch: true,
      skipLibCheck: false,
    },
  };

  await fs.writeFile(tsConfigPath, JSON.stringify(strictConfig, null, 2));
  console.log('  ✅ Created tsconfig.strict.json for gradual migration');
}

// Main execution
async function main() {
  try {
    await fixTypeScriptErrors();
    await fixSpecificErrors();
    await createStricterTsConfig();

    console.log('\n🎉 TypeScript error fixes completed!');
    console.log('\n💡 Next steps:');
    console.log('   1. Run "npm run check" to see remaining errors');
    console.log('   2. Manually fix any complex type errors');
    console.log('   3. Consider using tsconfig.strict.json for new files');
  } catch (error) {
    console.error('❌ Error during TypeScript fixes:', error);
    process.exit(1);
  }
}

main();
