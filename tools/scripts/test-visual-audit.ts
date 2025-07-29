#!/usr/bin/env tsx

/**
 * Test Runner for Enhanced Visual Audit System
 *
 * Simple test to verify the enhanced visual audit system works correctly
 */

import fs from 'node:fs/promises';
import path from 'node:path';
import chalk from 'chalk';
import { EnhancedVisualAuditor } from './visual-audit-enhanced';

async function testEnhancedVisualAudit() {
  console.log(chalk.blue('🧪 Testing Enhanced Visual Audit System...'));

  try {
    // Create test instance
    const auditor = new EnhancedVisualAuditor();

    // Test basic functionality without full audit
    console.log(chalk.yellow('1. Testing initialization...'));
    await auditor.initialize();
    console.log(chalk.green('   ✅ Initialization successful'));

    console.log(chalk.yellow('2. Testing browser launch...'));
    await auditor.launchBrowser();
    console.log(chalk.green('   ✅ Browser launch successful'));

    console.log(chalk.yellow('3. Testing cleanup...'));
    await auditor.cleanup();
    console.log(chalk.green('   ✅ Cleanup successful'));

    console.log(chalk.green('\n✨ Enhanced Visual Audit System test completed successfully!'));

    // Show usage instructions
    console.log(chalk.blue('\n📋 Usage Instructions:'));
    console.log('  npm run audit:visual:enhanced    # Full enhanced audit');
    console.log('  npm run visual-test              # Interactive CLI');
    console.log('  npm run visual-test component Button --interactions');
    console.log('  npm run visual-test flow search-and-find');
    console.log('  npm run visual-test -- --type=accessibility');
  } catch (error) {
    console.error(chalk.red('❌ Test failed:'), error);
    process.exit(1);
  }
}

// Mock implementation for testing without dependencies
if (import.meta.url === `file://${process.argv[1]}`) {
  console.log(chalk.blue('🔧 Running in mock mode for dependency testing...'));

  const mockTest = async () => {
    console.log(chalk.yellow('Testing configuration loading...'));

    try {
      const configPath = path.join(
        path.dirname(new URL(import.meta.url).pathname),
        'visual-audit-config.ts'
      );
      const configExists = await fs
        .access(configPath)
        .then(() => true)
        .catch(() => false);

      if (configExists) {
        console.log(chalk.green('✅ Configuration file exists'));
      } else {
        console.log(chalk.red('❌ Configuration file missing'));
      }

      const scriptsDir = path.dirname(new URL(import.meta.url).pathname);

      const utilsPath = path.join(scriptsDir, 'visual-audit-utils.ts');
      const utilsExists = await fs
        .access(utilsPath)
        .then(() => true)
        .catch(() => false);

      if (utilsExists) {
        console.log(chalk.green('✅ Utils file exists'));
      } else {
        console.log(chalk.red('❌ Utils file missing'));
      }

      const cliPath = path.join(scriptsDir, 'visual-audit-cli.ts');
      const cliExists = await fs
        .access(cliPath)
        .then(() => true)
        .catch(() => false);

      if (cliExists) {
        console.log(chalk.green('✅ CLI file exists'));
      } else {
        console.log(chalk.red('❌ CLI file missing'));
      }

      const enhancedPath = path.join(scriptsDir, 'visual-audit-enhanced.ts');
      const enhancedExists = await fs
        .access(enhancedPath)
        .then(() => true)
        .catch(() => false);

      if (enhancedExists) {
        console.log(chalk.green('✅ Enhanced audit file exists'));
      } else {
        console.log(chalk.red('❌ Enhanced audit file missing'));
      }

      console.log(chalk.green('\n✨ File structure test completed!'));

      // Test TypeScript compilation
      console.log(chalk.yellow('\nTesting TypeScript compilation...'));
      console.log(chalk.gray('Note: Run "npm run check" to verify TypeScript compilation'));
    } catch (error) {
      console.error(chalk.red('❌ Mock test failed:'), error);
    }
  };

  mockTest();
}

export { testEnhancedVisualAudit };
