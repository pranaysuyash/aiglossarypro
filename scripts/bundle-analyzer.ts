import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import chalk from 'chalk';
import Table from 'cli-table3';

interface BundleInfo {
  name: string;
  size: number;
  gzipSize: number;
  brotliSize: number;
  modules: string[];
}

class BundleAnalyzer {
  private distPath: string;
  private statsPath: string;

  constructor() {
    this.distPath = path.join(process.cwd(), 'dist/public');
    this.statsPath = path.join(process.cwd(), 'dist/bundle-stats.json');
  }

  async analyze() {
    console.log(chalk.blue('🔍 Analyzing bundle size...\n'));

    // Build with stats
    console.log(chalk.yellow('Building project with bundle analysis...'));
    try {
      execSync('npm run build:analyze', { stdio: 'inherit' });
    } catch (error) {
      console.error(chalk.red('Failed to build project'));
      process.exit(1);
    }

    // Analyze JS bundles
    const jsFiles = this.getFiles(this.distPath, '.js');
    const bundles = await this.analyzeBundles(jsFiles);

    // Display results
    this.displayResults(bundles);
    
    // Generate recommendations
    this.generateRecommendations(bundles);
  }

  private getFiles(dir: string, ext: string): string[] {
    const files: string[] = [];
    
    const walk = (currentDir: string) => {
      const entries = fs.readdirSync(currentDir, { withFileTypes: true });
      
      for (const entry of entries) {
        const fullPath = path.join(currentDir, entry.name);
        
        if (entry.isDirectory()) {
          walk(fullPath);
        } else if (entry.name.endsWith(ext)) {
          files.push(fullPath);
        }
      }
    };
    
    if (fs.existsSync(dir)) {
      walk(dir);
    }
    
    return files;
  }

  private async analyzeBundles(files: string[]): Promise<BundleInfo[]> {
    const bundles: BundleInfo[] = [];
    
    for (const file of files) {
      const stats = fs.statSync(file);
      const content = fs.readFileSync(file);
      
      // Calculate sizes
      const size = stats.size;
      const gzipSize = await this.getCompressedSize(content, 'gzip');
      const brotliSize = await this.getCompressedSize(content, 'br');
      
      // Extract module info from filename
      const name = path.basename(file);
      const modules = this.extractModules(content.toString());
      
      bundles.push({
        name,
        size,
        gzipSize,
        brotliSize,
        modules,
      });
    }
    
    return bundles.sort((a, b) => b.size - a.size);
  }

  private async getCompressedSize(content: Buffer, type: 'gzip' | 'br'): Promise<number> {
    const { gzipSync, brotliCompressSync } = await import('zlib');
    
    if (type === 'gzip') {
      return gzipSync(content).length;
    } else {
      return brotliCompressSync(content).length;
    }
  }

  private extractModules(content: string): string[] {
    const modules: string[] = [];
    
    // Extract common module patterns
    const patterns = [
      /from ["']([^"']+)["']/g,
      /require\(["']([^"']+)["']\)/g,
      /import\(["']([^"']+)["']\)/g,
    ];
    
    for (const pattern of patterns) {
      let match;
      while ((match = pattern.exec(content)) !== null) {
        const moduleName = match[1];
        if (!modules.includes(moduleName) && moduleName.includes('node_modules')) {
          modules.push(moduleName);
        }
      }
    }
    
    return modules.slice(0, 10); // Limit to top 10 for display
  }

  private formatSize(bytes: number): string {
    const kb = bytes / 1024;
    const mb = kb / 1024;
    
    if (mb >= 1) {
      return `${mb.toFixed(2)} MB`;
    } else {
      return `${kb.toFixed(2)} KB`;
    }
  }

  private displayResults(bundles: BundleInfo[]) {
    console.log(chalk.green('\n📊 Bundle Analysis Results:\n'));
    
    const table = new Table({
      head: ['Bundle', 'Size', 'Gzip', 'Brotli', 'Type'],
      colWidths: [40, 12, 12, 12, 15],
    });
    
    let totalSize = 0;
    let totalGzip = 0;
    let totalBrotli = 0;
    
    for (const bundle of bundles) {
      const type = this.getBundleType(bundle.name);
      const rowColor = this.getRowColor(bundle.size);
      
      table.push([
        chalk[rowColor](bundle.name),
        chalk[rowColor](this.formatSize(bundle.size)),
        chalk[rowColor](this.formatSize(bundle.gzipSize)),
        chalk[rowColor](this.formatSize(bundle.brotliSize)),
        chalk[rowColor](type),
      ]);
      
      totalSize += bundle.size;
      totalGzip += bundle.gzipSize;
      totalBrotli += bundle.brotliSize;
    }
    
    // Add totals row
    table.push([
      chalk.bold('TOTAL'),
      chalk.bold(this.formatSize(totalSize)),
      chalk.bold(this.formatSize(totalGzip)),
      chalk.bold(this.formatSize(totalBrotli)),
      '',
    ]);
    
    console.log(table.toString());
  }

  private getBundleType(filename: string): string {
    if (filename.includes('vendor')) return 'Vendor';
    if (filename.includes('page-')) return 'Page';
    if (filename.includes('component')) return 'Component';
    if (filename.includes('main') || filename.includes('index')) return 'Entry';
    return 'Other';
  }

  private getRowColor(size: number): string {
    const kb = size / 1024;
    
    if (kb > 500) return 'red';
    if (kb > 250) return 'yellow';
    return 'green';
  }

  private generateRecommendations(bundles: BundleInfo[]) {
    console.log(chalk.blue('\n💡 Recommendations:\n'));
    
    const largeBundles = bundles.filter(b => b.size > 250 * 1024);
    const vendorBundles = bundles.filter(b => b.name.includes('vendor'));
    
    const recommendations = [];
    
    // Large bundle recommendations
    if (largeBundles.length > 0) {
      recommendations.push({
        severity: 'high',
        message: `Found ${largeBundles.length} bundles over 250KB. Consider:`,
        actions: [
          'Implement code splitting for large components',
          'Lazy load heavy dependencies',
          'Review and remove unused imports',
        ],
      });
    }
    
    // Vendor bundle recommendations
    const totalVendorSize = vendorBundles.reduce((acc, b) => acc + b.size, 0);
    if (totalVendorSize > 1024 * 1024) {
      recommendations.push({
        severity: 'medium',
        message: `Vendor bundles total ${this.formatSize(totalVendorSize)}. Consider:`,
        actions: [
          'Use dynamic imports for heavy libraries',
          'Implement tree shaking',
          'Replace heavy dependencies with lighter alternatives',
        ],
      });
    }
    
    // Duplicate module detection
    const allModules = bundles.flatMap(b => b.modules);
    const duplicates = this.findDuplicates(allModules);
    if (duplicates.length > 0) {
      recommendations.push({
        severity: 'low',
        message: 'Found potential duplicate modules:',
        actions: duplicates.map(d => `Review multiple imports of: ${d}`),
      });
    }
    
    // Display recommendations
    for (const rec of recommendations) {
      const color = rec.severity === 'high' ? 'red' : rec.severity === 'medium' ? 'yellow' : 'blue';
      console.log(chalk[color](`[${rec.severity.toUpperCase()}] ${rec.message}`));
      
      for (const action of rec.actions) {
        console.log(chalk.gray(`  • ${action}`));
      }
      console.log();
    }
    
    // Performance budget
    this.checkPerformanceBudget(bundles);
  }

  private findDuplicates(arr: string[]): string[] {
    const counts = new Map<string, number>();
    
    for (const item of arr) {
      counts.set(item, (counts.get(item) || 0) + 1);
    }
    
    return Array.from(counts.entries())
      .filter(([_, count]) => count > 1)
      .map(([module]) => module);
  }

  private checkPerformanceBudget(bundles: BundleInfo[]) {
    console.log(chalk.blue('\n📏 Performance Budget Check:\n'));
    
    const budget = {
      totalSize: 5 * 1024 * 1024, // 5MB total
      mainBundle: 500 * 1024, // 500KB for main
      vendorBundle: 1 * 1024 * 1024, // 1MB for vendors
      chunkSize: 250 * 1024, // 250KB per chunk
    };
    
    const totalSize = bundles.reduce((acc, b) => acc + b.size, 0);
    const mainBundle = bundles.find(b => b.name.includes('main') || b.name.includes('index'));
    const vendorSize = bundles.filter(b => b.name.includes('vendor')).reduce((acc, b) => acc + b.size, 0);
    
    const checks = [
      {
        name: 'Total Bundle Size',
        current: totalSize,
        budget: budget.totalSize,
        passed: totalSize <= budget.totalSize,
      },
      {
        name: 'Main Bundle Size',
        current: mainBundle?.size || 0,
        budget: budget.mainBundle,
        passed: !mainBundle || mainBundle.size <= budget.mainBundle,
      },
      {
        name: 'Vendor Bundle Size',
        current: vendorSize,
        budget: budget.vendorBundle,
        passed: vendorSize <= budget.vendorBundle,
      },
    ];
    
    const table = new Table({
      head: ['Metric', 'Current', 'Budget', 'Status'],
      colWidths: [25, 15, 15, 10],
    });
    
    for (const check of checks) {
      const status = check.passed ? chalk.green('✓ PASS') : chalk.red('✗ FAIL');
      
      table.push([
        check.name,
        this.formatSize(check.current),
        this.formatSize(check.budget),
        status,
      ]);
    }
    
    console.log(table.toString());
  }
}

// Run analyzer
const analyzer = new BundleAnalyzer();
analyzer.analyze().catch(console.error);