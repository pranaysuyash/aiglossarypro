#!/usr/bin/env tsx
import chalk from 'chalk';
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
class BundleAnalyzer {
    distPath = path.resolve(process.cwd(), 'dist/public');
    budgets = {
        totalJs: 800 * 1024, // 800KB
        totalCss: 200 * 1024, // 200KB
        totalBundle: 800 * 1024, // 800KB
        initialChunk: 300 * 1024, // 300KB
        vendorChunk: 500 * 1024, // 500KB
    };
    async analyze() {
        console.log(chalk.blue('🔍 Analyzing bundle...'));
        // Build with analysis mode
        try {
            execSync('NODE_ENV=analyze npm run build', {
                stdio: 'inherit',
                env: { ...process.env, NODE_ENV: 'analyze' },
            });
        }
        catch (error) {
            console.error(chalk.red('Build failed during analysis'));
            throw error;
        }
        const chunks = this.scanDistDirectory();
        const report = this.generateReport(chunks);
        this.printReport(report);
        this.checkBudgets(report);
        return report;
    }
    scanDistDirectory() {
        const chunks = [];
        if (!fs.existsSync(this.distPath)) {
            throw new Error('Dist directory not found. Run build first.');
        }
        const scanDir = (dir, prefix = '') => {
            const files = fs.readdirSync(dir);
            for (const file of files) {
                const filePath = path.join(dir, file);
                const stat = fs.statSync(filePath);
                if (stat.isDirectory()) {
                    scanDir(filePath, `${prefix}${file}/`);
                }
                else if (this.isRelevantFile(file)) {
                    const size = stat.size;
                    const type = this.getFileType(file);
                    chunks.push({
                        file: `${prefix}${file}`,
                        size,
                        type,
                    });
                }
            }
        };
        scanDir(this.distPath);
        return chunks.sort((a, b) => b.size - a.size);
    }
    isRelevantFile(file) {
        return (/\.(js|css|woff2?|ttf|png|jpg|jpeg|svg|webp)$/.test(file) &&
            !file.includes('.map') &&
            !file.includes('sw.js') &&
            !file.includes('workbox'));
    }
    getFileType(file) {
        if (file.endsWith('.js'))
            return 'js';
        if (file.endsWith('.css'))
            return 'css';
        return 'asset';
    }
    generateReport(chunks) {
        const jsChunks = chunks.filter(c => c.type === 'js');
        const cssChunks = chunks.filter(c => c.type === 'css');
        const assetChunks = chunks.filter(c => c.type === 'asset');
        const jsSize = jsChunks.reduce((sum, c) => sum + c.size, 0);
        const cssSize = cssChunks.reduce((sum, c) => sum + c.size, 0);
        const assetSize = assetChunks.reduce((sum, c) => sum + c.size, 0);
        const totalSize = jsSize + cssSize + assetSize;
        const recommendations = this.generateRecommendations(chunks, {
            jsSize,
            cssSize,
            assetSize,
            totalSize,
        });
        return {
            totalSize,
            totalGzipSize: Math.round(totalSize * 0.7), // Estimate
            jsSize,
            cssSize,
            assetSize,
            chunks,
            recommendations,
        };
    }
    generateRecommendations(chunks, sizes) {
        const recommendations = [];
        // Check for large JS files
        const largeJsFiles = chunks
            .filter(c => c.type === 'js' && c.size > 100 * 1024)
            .sort((a, b) => b.size - a.size);
        if (largeJsFiles.length > 0) {
            recommendations.push(`Large JS files detected: ${largeJsFiles
                .map(f => `${f.file} (${this.formatSize(f.size)})`)
                .join(', ')}`);
        }
        // Check for missing vendor chunks
        const hasVendorChunks = chunks.some(c => c.file.includes('vendor-'));
        if (!hasVendorChunks) {
            recommendations.push('Consider implementing vendor chunk splitting for better caching');
        }
        // Check for large CSS
        if (sizes.cssSize > this.budgets.totalCss) {
            recommendations.push(`CSS bundle is large (${this.formatSize(sizes.cssSize)}). Consider CSS code splitting.`);
        }
        // Check for unoptimized assets
        const largeAssets = chunks
            .filter(c => c.type === 'asset' && c.size > 50 * 1024)
            .filter(c => !c.file.includes('font') && !c.file.includes('KaTeX'));
        if (largeAssets.length > 0) {
            recommendations.push(`Large assets detected: ${largeAssets
                .map(f => `${f.file} (${this.formatSize(f.size)})`)
                .join(', ')}`);
        }
        return recommendations;
    }
    printReport(report) {
        console.log('\n' + chalk.green('📊 Bundle Analysis Report'));
        console.log('═'.repeat(50));
        console.log(chalk.cyan('\n📦 Bundle Sizes:'));
        console.log(`  Total: ${chalk.bold(this.formatSize(report.totalSize))}`);
        console.log(`  JavaScript: ${chalk.yellow(this.formatSize(report.jsSize))}`);
        console.log(`  CSS: ${chalk.blue(this.formatSize(report.cssSize))}`);
        console.log(`  Assets: ${chalk.magenta(this.formatSize(report.assetSize))}`);
        console.log(chalk.cyan('\n📁 Largest Files:'));
        report.chunks.slice(0, 10).forEach((chunk, i) => {
            const icon = chunk.type === 'js' ? '📜' : chunk.type === 'css' ? '🎨' : '🖼️';
            console.log(`  ${i + 1}. ${icon} ${chunk.file} - ${chalk.bold(this.formatSize(chunk.size))}`);
        });
        if (report.recommendations.length > 0) {
            console.log(chalk.yellow('\n💡 Recommendations:'));
            report.recommendations.forEach((rec, i) => {
                console.log(`  ${i + 1}. ${rec}`);
            });
        }
    }
    checkBudgets(report) {
        console.log(chalk.cyan('\n💰 Performance Budgets:'));
        const checks = [
            {
                name: 'Total JS',
                actual: report.jsSize,
                budget: this.budgets.totalJs,
            },
            {
                name: 'Total CSS',
                actual: report.cssSize,
                budget: this.budgets.totalCss,
            },
            {
                name: 'Total Bundle Size',
                actual: report.totalSize,
                budget: this.budgets.totalBundle,
            },
        ];
        let allPassed = true;
        checks.forEach(check => {
            const passed = check.actual <= check.budget;
            const icon = passed ? '✅' : '❌';
            const color = passed ? chalk.green : chalk.red;
            console.log(`  ${icon} ${check.name}: ${color(this.formatSize(check.actual))} / ${this.formatSize(check.budget)}`);
            if (!passed) {
                allPassed = false;
                const excess = check.actual - check.budget;
                console.log(`    ${chalk.red(`Exceeds budget by ${this.formatSize(excess)}`)}`);
            }
        });
        if (allPassed) {
            console.log(chalk.green('\n🎉 All performance budgets passed!'));
        }
        else {
            console.log(chalk.red('\n⚠️  Some performance budgets exceeded. Consider optimization.'));
        }
    }
    formatSize(bytes) {
        if (bytes === 0)
            return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return `${parseFloat((bytes / k ** i).toFixed(1))} ${sizes[i]}`;
    }
}
// CLI execution
if (import.meta.url === `file://${process.argv[1]}`) {
    const analyzer = new BundleAnalyzer();
    analyzer.analyze().catch(console.error);
}
export { BundleAnalyzer };
