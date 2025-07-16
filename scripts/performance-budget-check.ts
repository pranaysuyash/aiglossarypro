#!/usr/bin/env tsx

import chalk from 'chalk';
import fs from 'fs';
import path from 'path';

interface PerformanceBudget {
  name: string;
  path: string;
  maxSize: number;
  type: 'js' | 'css' | 'asset';
}

interface BudgetResult {
  budget: PerformanceBudget;
  actualSize: number;
  passed: boolean;
  excess?: number;
}

class PerformanceBudgetChecker {
  private budgets: PerformanceBudget[] = [
    {
      name: 'Main JavaScript Bundle',
      path: 'assets/index-*.js',
      maxSize: 300 * 1024, // 300KB
      type: 'js',
    },
    {
      name: 'Main CSS Bundle',
      path: 'assets/styles/index-*.css',
      maxSize: 150 * 1024, // 150KB
      type: 'css',
    },
    {
      name: 'Vendor JavaScript',
      path: 'vendor/*.js',
      maxSize: 500 * 1024, // 500KB
      type: 'js',
    },
    {
      name: 'Total JavaScript',
      path: '**/*.js',
      maxSize: 800 * 1024, // 800KB
      type: 'js',
    },
    {
      name: 'Total CSS',
      path: '**/*.css',
      maxSize: 200 * 1024, // 200KB
      type: 'css',
    },
  ];

  private distPath = path.resolve(process.cwd(), 'dist/public');

  async checkBudgets(): Promise<BudgetResult[]> {
    console.log(chalk.blue('💰 Checking performance budgets...'));

    if (!fs.existsSync(this.distPath)) {
      throw new Error('Build directory not found. Run build first.');
    }

    const results: BudgetResult[] = [];

    for (const budget of this.budgets) {
      const files = this.findMatchingFiles(budget.path);
      const totalSize = files.reduce((sum, file) => {
        const filePath = path.join(this.distPath, file);
        return sum + fs.statSync(filePath).size;
      }, 0);

      const passed = totalSize <= budget.maxSize;
      const result: BudgetResult = {
        budget,
        actualSize: totalSize,
        passed,
      };

      if (!passed) {
        result.excess = totalSize - budget.maxSize;
      }

      results.push(result);
    }

    this.printResults(results);
    return results;
  }

  private findMatchingFiles(pattern: string): string[] {
    const files: string[] = [];

    const scanDir = (dir: string, prefix = '') => {
      const entries = fs.readdirSync(dir);

      for (const entry of entries) {
        const fullPath = path.join(dir, entry);
        const relativePath = `${prefix}${entry}`;
        const stat = fs.statSync(fullPath);

        if (stat.isDirectory()) {
          scanDir(fullPath, `${relativePath}/`);
        } else if (this.matchesPattern(relativePath, pattern)) {
          files.push(relativePath);
        }
      }
    };

    scanDir(this.distPath);
    return files;
  }

  private matchesPattern(filePath: string, pattern: string): boolean {
    // Simple glob pattern matching
    const regexPattern = pattern
      .replace(/\*\*/g, '.*')
      .replace(/\*/g, '[^/]*')
      .replace(/\./g, '\\.');

    const regex = new RegExp(`^${regexPattern}$`);
    return regex.test(filePath);
  }

  private printResults(results: BudgetResult[]): void {
    console.log('\n' + chalk.cyan('📊 Performance Budget Results'));
    console.log('═'.repeat(50));

    let allPassed = true;

    results.forEach(result => {
      const { budget, actualSize, passed, excess } = result;
      const icon = passed ? '✅' : '❌';
      const color = passed ? chalk.green : chalk.red;

      console.log(`${icon} ${budget.name}`);
      console.log(`   ${color(this.formatSize(actualSize))} / ${this.formatSize(budget.maxSize)}`);

      if (!passed && excess) {
        console.log(`   ${chalk.red(`Exceeds budget by ${this.formatSize(excess)}`)}`);
        allPassed = false;
      }
      console.log();
    });

    if (allPassed) {
      console.log(chalk.green('🎉 All performance budgets passed!'));
    } else {
      console.log(chalk.red('⚠️  Some performance budgets exceeded.'));
      console.log(chalk.yellow('💡 Consider:'));
      console.log('   • Code splitting for large bundles');
      console.log('   • Lazy loading for non-critical features');
      console.log('   • Tree shaking unused dependencies');
      console.log('   • CSS purging and optimization');
    }

    // Exit with error code if budgets failed (for CI)
    if (!allPassed && process.env.CI) {
      process.exit(1);
    }
  }

  private formatSize(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / k ** i).toFixed(1))} ${sizes[i]}`;
  }
}

// CLI execution
if (import.meta.url === `file://${process.argv[1]}`) {
  const checker = new PerformanceBudgetChecker();
  checker.checkBudgets().catch(console.error);
}

export { PerformanceBudgetChecker };
