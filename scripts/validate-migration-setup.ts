#!/usr/bin/env ts-node

/**
 * Validation Script: Check Migration Setup
 *
 * This script validates that all dependencies and configurations
 * are properly set up for the hierarchical migration.
 */

import fs from 'node:fs';
import path from 'node:path';
import * as dotenv from 'dotenv';

dotenv.config();

interface ValidationResult {
  check: string;
  passed: boolean;
  message: string;
  details?: any;
}

class MigrationSetupValidator {
  private results: ValidationResult[] = [];

  async validate(): Promise<void> {
    console.log('🔍 Validating migration setup...\n');

    // Check environment variables
    this.checkEnvironmentVariables();

    // Check database connection
    await this.checkDatabaseConnection();

    // Check required dependencies
    await this.checkDependencies();

    // Check file structure
    this.checkFileStructure();

    // Check TypeScript configuration
    this.checkTypeScriptConfig();

    // Generate report
    this.generateReport();
  }

  private checkEnvironmentVariables(): void {
    console.log('📋 Checking environment variables...');

    this.addResult({
      check: 'DATABASE_URL',
      passed: !!process.env.DATABASE_URL,
      message: process.env.DATABASE_URL
        ? 'Database URL is configured'
        : 'DATABASE_URL environment variable is missing',
    });
  }

  private async checkDatabaseConnection(): Promise<void> {
    console.log('🔌 Checking database connection...');

    try {
      const { Pool } = await import('@neondatabase/serverless');
      const pool = new Pool({ connectionString: process.env.DATABASE_URL });

      const _result = await pool.query('SELECT 1 as test');
      await pool.end();

      this.addResult({
        check: 'Database Connection',
        passed: true,
        message: 'Successfully connected to database',
      });
    } catch (error: any) {
      this.addResult({
        check: 'Database Connection',
        passed: false,
        message: `Failed to connect to database: ${error.message}`,
      });
    }
  }

  private async checkDependencies(): Promise<void> {
    console.log('📦 Checking required dependencies...');

    const requiredDeps = ['@neondatabase/serverless', 'drizzle-orm', 'dotenv'];

    for (const dep of requiredDeps) {
      try {
        await import(dep);
        this.addResult({
          check: `Dependency: ${dep}`,
          passed: true,
          message: `${dep} is available`,
        });
      } catch (_error) {
        this.addResult({
          check: `Dependency: ${dep}`,
          passed: false,
          message: `${dep} is not installed or not accessible`,
        });
      }
    }
  }

  private checkFileStructure(): void {
    console.log('📁 Checking file structure...');

    const requiredFiles = [
      'shared/enhancedSchema.ts',
      'complete_42_sections_config.ts',
      'client/src/data/content-outline.ts',
      'client/src/types/content-structure.ts',
    ];

    for (const file of requiredFiles) {
      const filePath = path.resolve(file);
      const exists = fs.existsSync(filePath);

      this.addResult({
        check: `File: ${file}`,
        passed: exists,
        message: exists ? `${file} exists` : `${file} is missing`,
      });
    }
  }

  private checkTypeScriptConfig(): void {
    console.log('⚙️  Checking TypeScript configuration...');

    try {
      const tsconfigPath = path.resolve('tsconfig.json');
      if (!fs.existsSync(tsconfigPath)) {
        this.addResult({
          check: 'TypeScript Config',
          passed: false,
          message: 'tsconfig.json not found',
        });
        return;
      }

      const tsconfig = JSON.parse(fs.readFileSync(tsconfigPath, 'utf8'));

      // Check for path mappings
      const hasPathMappings = tsconfig.compilerOptions?.paths;
      const hasSharedPath = hasPathMappings && tsconfig.compilerOptions.paths['@shared/*'];
      const hasClientPath = hasPathMappings && tsconfig.compilerOptions.paths['@/*'];

      this.addResult({
        check: 'TypeScript Path Mappings',
        passed: hasSharedPath && hasClientPath,
        message:
          hasSharedPath && hasClientPath
            ? 'Path mappings are configured correctly'
            : 'Path mappings are missing or incomplete',
        details: {
          hasSharedPath,
          hasClientPath,
          paths: tsconfig.compilerOptions?.paths,
        },
      });
    } catch (error: any) {
      this.addResult({
        check: 'TypeScript Config',
        passed: false,
        message: `Error reading tsconfig.json: ${error.message}`,
      });
    }
  }

  private addResult(result: ValidationResult): void {
    this.results.push(result);
    const icon = result.passed ? '✅' : '❌';
    console.log(`  ${icon} ${result.check}: ${result.message}`);
  }

  private generateReport(): void {
    console.log('\n📊 Validation Summary');
    console.log('====================');

    const passed = this.results.filter(r => r.passed).length;
    const total = this.results.length;
    const percentage = Math.round((passed / total) * 100);

    console.log(`\n✅ Passed: ${passed}/${total} (${percentage}%)`);
    console.log(`❌ Failed: ${total - passed}/${total}`);

    const failedChecks = this.results.filter(r => !r.passed);
    if (failedChecks.length > 0) {
      console.log('\n❌ Failed Checks:');
      failedChecks.forEach(check => {
        console.log(`  - ${check.check}: ${check.message}`);
      });

      console.log('\n🔧 Recommendations:');
      console.log('  1. Install missing dependencies: npm install');
      console.log('  2. Check DATABASE_URL in your .env file');
      console.log('  3. Ensure all required files exist');
      console.log('  4. Verify TypeScript configuration');
    } else {
      console.log('\n🎉 All checks passed! Migration setup is ready.');
    }

    // Save detailed report
    const reportPath = `validation-report-${Date.now()}.json`;
    fs.writeFileSync(
      reportPath,
      JSON.stringify(
        {
          timestamp: new Date().toISOString(),
          summary: { passed, total, percentage },
          results: this.results,
        },
        null,
        2
      )
    );

    console.log(`\n📁 Detailed report saved to: ${reportPath}`);
  }
}

// Main execution
async function main() {
  const validator = new MigrationSetupValidator();
  await validator.validate();
}

// Run if this is the main module
main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});

export { MigrationSetupValidator };
