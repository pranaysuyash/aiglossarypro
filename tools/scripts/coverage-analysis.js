#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { glob } from 'glob';

const projectRoot = process.cwd();
const _clientSrcPath = path.join(projectRoot, 'client/src');
const _serverPath = path.join(projectRoot, 'server');
const _testsPath = path.join(projectRoot, 'tests');

console.log('🔍 Analyzing test coverage gaps in AIGlossaryPro...\n');

// Get all source files
const clientFiles = await glob('client/src/**/*.{ts,tsx}', {
  ignore: ['**/*.d.ts', '**/*.stories.tsx'],
});
const serverFiles = await glob('server/**/*.{ts,js}', {
  ignore: ['**/*.d.ts', '**/public/**', '**/migrations/**', '**/scripts/**'],
});

// Get all test files
const testFiles = await glob('tests/**/*.{test,spec}.{ts,tsx}', {
  ignore: ['tests/visual/**', 'tests/e2e/**'],
});

console.log('📊 FILE ANALYSIS');
console.log('================');
console.log(`Total Client Files: ${clientFiles.length}`);
console.log(`Total Server Files: ${serverFiles.length}`);
console.log(`Total Test Files: ${testFiles.length}\n`);

// Analyze coverage gaps
const criticalModules = [];
const uncoveredFiles = [];

// Identify critical modules that need 80% coverage
const criticalPatterns = [
  { pattern: 'client/src/services/**', priority: 'HIGH' },
  { pattern: 'client/src/utils/**', priority: 'HIGH' },
  { pattern: 'client/src/hooks/**', priority: 'HIGH' },
  { pattern: 'server/services/**', priority: 'HIGH' },
  { pattern: 'server/utils/**', priority: 'HIGH' },
  { pattern: 'server/middleware/**', priority: 'HIGH' },
  { pattern: 'server/auth/**', priority: 'CRITICAL' },
  { pattern: 'server/routes/gumroad.ts', priority: 'CRITICAL' },
  { pattern: 'client/src/components/AI*.tsx', priority: 'HIGH' },
  { pattern: 'server/aiService.ts', priority: 'HIGH' },
  { pattern: 'server/db.ts', priority: 'HIGH' },
  { pattern: 'server/storage.ts', priority: 'HIGH' },
];

// Find files matching critical patterns
for (const { pattern, priority } of criticalPatterns) {
  const matchingFiles = await glob(pattern);
  matchingFiles.forEach(file => {
    criticalModules.push({ file, priority });
  });
}

// Check which files have tests
const testedFiles = new Set();
testFiles.forEach(testFile => {
  const content = fs.readFileSync(testFile, 'utf8');

  // Extract import paths from test files
  const importRegex = /from\s+['"]([^'"]+)['"]/g;
  let match;
  while ((match = importRegex.exec(content)) !== null) {
    const importPath = match[1];
    if (importPath.startsWith('@/') || importPath.startsWith('../')) {
      testedFiles.add(importPath);
    }
  }
});

console.log('🎯 CRITICAL MODULES REQUIRING 80%+ COVERAGE');
console.log('===========================================');
criticalModules.forEach(({ file, priority }) => {
  const hasTest = Array.from(testedFiles).some(testPath =>
    testPath.includes(path.basename(file, path.extname(file)))
  );

  const status = hasTest ? '✅ HAS TESTS' : '❌ NO TESTS';
  console.log(`${status} [${priority}] ${file}`);

  if (!hasTest) {
    uncoveredFiles.push({ file, priority });
  }
});

console.log('\n🚨 FILES WITHOUT TESTS (PRIORITY ORDER)');
console.log('=======================================');
const sortedUncovered = uncoveredFiles.sort((a, b) => {
  const priorityOrder = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };
  return priorityOrder[a.priority] - priorityOrder[b.priority];
});

sortedUncovered.forEach(({ file, priority }) => {
  console.log(`[${priority}] ${file}`);
});

console.log('\n📈 COVERAGE RECOMMENDATIONS');
console.log('===========================');
console.log('1. IMMEDIATE PRIORITY (90% coverage needed):');
console.log('   - server/auth/**');
console.log('   - server/routes/gumroad.ts');
console.log('   - client/src/components/PurchaseVerification.tsx');
console.log('   - client/src/components/TestPurchaseButton.tsx');

console.log('\n2. HIGH PRIORITY (80% coverage needed):');
console.log('   - server/services/**');
console.log('   - server/middleware/**');
console.log('   - client/src/services/**');
console.log('   - client/src/utils/**');
console.log('   - client/src/hooks/**');

console.log('\n3. MEDIUM PRIORITY (75% coverage needed):');
console.log('   - server/routes/**');
console.log('   - client/src/components/**');
console.log('   - client/src/pages/**');

console.log('\n4. SUGGESTED NEW TEST FILES:');
const suggestedTests = [
  'tests/unit/auth-service.test.ts',
  'tests/unit/gumroad-integration.test.ts',
  'tests/unit/purchase-verification.test.ts',
  'tests/unit/ai-service.test.ts',
  'tests/unit/middleware-security.test.ts',
  'tests/unit/user-service.test.ts',
  'tests/unit/analytics-service.test.ts',
  'tests/component/AI-components.test.tsx',
  'tests/integration/payment-flow.test.ts',
  'tests/integration/auth-flow.test.ts',
];

suggestedTests.forEach(test => {
  console.log(`   - ${test}`);
});

console.log('\n✅ NEXT STEPS:');
console.log('1. Fix existing failing tests');
console.log('2. Add tests for critical modules (auth, payments)');
console.log('3. Add tests for AI services and components');
console.log('4. Add middleware tests');
console.log('5. Run coverage analysis again');
