#!/usr/bin/env node

/**
 * Bundle analysis script for monitoring bundle size and optimization
 * Provides detailed analysis of bundle composition and size trends
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

interface BundleStats {
    timestamp: number;
    totalSize: number;
    gzipSize: number;
    brotliSize: number;
    chunks: ChunkInfo[];
    assets: AssetInfo[];
    warnings: string[];
}

interface ChunkInfo {
    name: string;
    size: number;
    gzipSize?: number;
    modules: string[];
    isEntry: boolean;
    isDynamic: boolean;
}

interface AssetInfo {
    name: string;
    size: number;
    type: 'js' | 'css' | 'image' | 'font' | 'other';
}

interface BundleThresholds {
    totalSize: number; // 800KB
    chunkSize: number; // 200KB
    cssSize: number; // 100KB
    vendorSize: number; // 400KB
}

class BundleAnalyzer {
    private readonly thresholds: BundleThresholds = {
        totalSize: 800 * 1024, // 800KB
        chunkSize: 200 * 1024, // 200KB
        cssSize: 100 * 1024, // 100KB
        vendorSize: 400 * 1024, // 400KB
    };

    private readonly distPath = path.resolve(process.cwd(), 'dist/public');
    private readonly reportPath = path.resolve(process.cwd(), 'reports/bundle-analysis');

    constructor() {
        this.ensureDirectories();
    }

    /**
     * Run complete bundle analysis
     */
    async analyze(): Promise<BundleStats> {
        console.log('🔍 Starting bundle analysis...');

        // Build the project with analysis
        this.buildWithAnalysis();

        // Analyze the built files
        const stats = await this.analyzeBuildOutput();

        // Generate reports
        await this.generateReports(stats);

        // Check thresholds
        this.checkThresholds(stats);

        console.log('✅ Bundle analysis completed');
        return stats;
    }

    /**
     * Build project with bundle analysis enabled
     */
    private buildWithAnalysis(): void {
        console.log('📦 Building project with analysis...');

        try {
            execSync('NODE_ENV=analyze npm run build', {
                stdio: 'inherit',
                cwd: process.cwd(),
            });
        } catch (error) {
            console.error('❌ Build failed:', error);
            process.exit(1);
        }
    }

    /**
     * Analyze the build output directory
     */
    private async analyzeBuildOutput(): Promise<BundleStats> {
        const chunks: ChunkInfo[] = [];
        const assets: AssetInfo[] = [];
        const warnings: string[] = [];

        if (!fs.existsSync(this.distPath)) {
            throw new Error(`Build output directory not found: ${this.distPath}`);
        }

        // Analyze all files in the build output
        const files = this.getAllFiles(this.distPath);

        for (const file of files) {
            const relativePath = path.relative(this.distPath, file);
            const stats = fs.statSync(file);
            const size = stats.size;

            if (file.endsWith('.js')) {
                const isEntry = relativePath.startsWith('assets/') && !relativePath.includes('chunk');
                const isDynamic = relativePath.includes('chunk') || relativePath.includes('vendor');

                chunks.push({
                    name: relativePath,
                    size,
                    modules: await this.extractModules(file),
                    isEntry,
                    isDynamic,
                });
            } else {
                assets.push({
                    name: relativePath,
                    size,
                    type: this.getAssetType(file),
                });
            }
        }

        // Calculate total sizes
        const totalSize = chunks.reduce((sum, chunk) => sum + chunk.size, 0) +
            assets.reduce((sum, asset) => sum + asset.size, 0);

        // Estimate compressed sizes (rough approximation)
        const gzipSize = Math.round(totalSize * 0.3); // ~30% compression
        const brotliSize = Math.round(totalSize * 0.25); // ~25% compression

        return {
            timestamp: Date.now(),
            totalSize,
            gzipSize,
            brotliSize,
            chunks,
            assets,
            warnings,
        };
    }

    /**
     * Extract module information from a JavaScript file
     */
    private async extractModules(filePath: string): Promise<string[]> {
        try {
            const content = fs.readFileSync(filePath, 'utf-8');
            const modules: string[] = [];

            // Extract import statements and module references
            const importMatches = content.match(/from\s+["']([^"']+)["']/g) || [];
            const requireMatches = content.match(/require\(["']([^"']+)["']\)/g) || [];

            importMatches.forEach(match => {
                const module = match.match(/["']([^"']+)["']/)?.[1];
                if (module && !modules.includes(module)) {
                    modules.push(module);
                }
            });

            requireMatches.forEach(match => {
                const module = match.match(/["']([^"']+)["']/)?.[1];
                if (module && !modules.includes(module)) {
                    modules.push(module);
                }
            });

            return modules.slice(0, 20); // Limit to top 20 modules
        } catch (error) {
            return [];
        }
    }

    /**
     * Get all files recursively from a directory
     */
    private getAllFiles(dir: string): string[] {
        const files: string[] = [];

        const items = fs.readdirSync(dir);
        for (const item of items) {
            const fullPath = path.join(dir, item);
            const stats = fs.statSync(fullPath);

            if (stats.isDirectory()) {
                files.push(...this.getAllFiles(fullPath));
            } else {
                files.push(fullPath);
            }
        }

        return files;
    }

    /**
     * Determine asset type from file extension
     */
    private getAssetType(filePath: string): AssetInfo['type'] {
        const ext = path.extname(filePath).toLowerCase();

        if (['.js', '.mjs'].includes(ext)) return 'js';
        if (['.css'].includes(ext)) return 'css';
        if (['.png', '.jpg', '.jpeg', '.gif', '.svg', '.webp'].includes(ext)) return 'image';
        if (['.woff', '.woff2', '.ttf', '.eot'].includes(ext)) return 'font';

        return 'other';
    }

    /**
     * Generate analysis reports
     */
    private async generateReports(stats: BundleStats): Promise<void> {
        // JSON report
        const jsonReport = path.join(this.reportPath, `bundle-stats-${Date.now()}.json`);
        fs.writeFileSync(jsonReport, JSON.stringify(stats, null, 2));

        // Markdown report
        const markdownReport = path.join(this.reportPath, 'bundle-analysis.md');
        const markdown = this.generateMarkdownReport(stats);
        fs.writeFileSync(markdownReport, markdown);

        // CSV report for tracking over time
        const csvReport = path.join(this.reportPath, 'bundle-history.csv');
        this.appendToCsvReport(csvReport, stats);

        console.log(`📊 Reports generated:`);
        console.log(`  - JSON: ${jsonReport}`);
        console.log(`  - Markdown: ${markdownReport}`);
        console.log(`  - CSV: ${csvReport}`);
    }

    /**
     * Generate markdown report
     */
    private generateMarkdownReport(stats: BundleStats): string {
        const { chunks, assets, totalSize, gzipSize, brotliSize } = stats;

        const formatSize = (bytes: number) => {
            const kb = bytes / 1024;
            return kb > 1024 ? `${(kb / 1024).toFixed(2)} MB` : `${kb.toFixed(2)} KB`;
        };

        let markdown = `# Bundle Analysis Report\n\n`;
        markdown += `**Generated:** ${new Date(stats.timestamp).toISOString()}\n\n`;

        // Summary
        markdown += `## Summary\n\n`;
        markdown += `| Metric | Size | Status |\n`;
        markdown += `|--------|------|--------|\n`;
        markdown += `| Total Size | ${formatSize(totalSize)} | ${totalSize > this.thresholds.totalSize ? '⚠️ Over limit' : '✅ Within limit'} |\n`;
        markdown += `| Gzipped | ${formatSize(gzipSize)} | - |\n`;
        markdown += `| Brotli | ${formatSize(brotliSize)} | - |\n`;
        markdown += `| Chunks | ${chunks.length} | - |\n`;
        markdown += `| Assets | ${assets.length} | - |\n\n`;

        // Largest chunks
        markdown += `## Largest Chunks\n\n`;
        const sortedChunks = chunks.sort((a, b) => b.size - a.size).slice(0, 10);
        markdown += `| Chunk | Size | Type | Modules |\n`;
        markdown += `|-------|------|------|----------|\n`;

        for (const chunk of sortedChunks) {
            const type = chunk.isEntry ? 'Entry' : chunk.isDynamic ? 'Dynamic' : 'Static';
            const modules = chunk.modules.slice(0, 3).join(', ');
            const status = chunk.size > this.thresholds.chunkSize ? '⚠️' : '✅';
            markdown += `| ${chunk.name} | ${formatSize(chunk.size)} ${status} | ${type} | ${modules} |\n`;
        }

        // Assets by type
        markdown += `\n## Assets by Type\n\n`;
        const assetsByType = assets.reduce((acc, asset) => {
            if (!acc[asset.type]) acc[asset.type] = { count: 0, size: 0 };
            acc[asset.type].count++;
            acc[asset.type].size += asset.size;
            return acc;
        }, {} as Record<string, { count: number; size: number }>);

        markdown += `| Type | Count | Total Size |\n`;
        markdown += `|------|-------|------------|\n`;

        for (const [type, info] of Object.entries(assetsByType)) {
            markdown += `| ${type.toUpperCase()} | ${info.count} | ${formatSize(info.size)} |\n`;
        }

        // Recommendations
        markdown += `\n## Recommendations\n\n`;

        if (totalSize > this.thresholds.totalSize) {
            markdown += `- ⚠️ **Total bundle size exceeds ${formatSize(this.thresholds.totalSize)}**\n`;
            markdown += `  - Consider lazy loading non-critical components\n`;
            markdown += `  - Review and optimize large dependencies\n`;
            markdown += `  - Enable tree shaking for unused code\n\n`;
        }

        const largeChunks = chunks.filter(chunk => chunk.size > this.thresholds.chunkSize);
        if (largeChunks.length > 0) {
            markdown += `- ⚠️ **${largeChunks.length} chunks exceed ${formatSize(this.thresholds.chunkSize)}**\n`;
            markdown += `  - Split large chunks into smaller pieces\n`;
            markdown += `  - Move heavy dependencies to separate chunks\n\n`;
        }

        const cssAssets = assets.filter(asset => asset.type === 'css');
        const totalCssSize = cssAssets.reduce((sum, asset) => sum + asset.size, 0);
        if (totalCssSize > this.thresholds.cssSize) {
            markdown += `- ⚠️ **CSS size exceeds ${formatSize(this.thresholds.cssSize)}**\n`;
            markdown += `  - Enable CSS code splitting\n`;
            markdown += `  - Remove unused CSS rules\n`;
            markdown += `  - Consider CSS-in-JS for component-specific styles\n\n`;
        }

        return markdown;
    }

    /**
     * Append stats to CSV for historical tracking
     */
    private appendToCsvReport(csvPath: string, stats: BundleStats): void {
        const csvRow = [
            new Date(stats.timestamp).toISOString(),
            stats.totalSize,
            stats.gzipSize,
            stats.brotliSize,
            stats.chunks.length,
            stats.assets.length,
            stats.warnings.length,
        ].join(',');

        if (!fs.existsSync(csvPath)) {
            const header = 'timestamp,totalSize,gzipSize,brotliSize,chunks,assets,warnings\n';
            fs.writeFileSync(csvPath, header);
        }

        fs.appendFileSync(csvPath, csvRow + '\n');
    }

    /**
     * Check bundle size thresholds and exit with error if exceeded
     */
    private checkThresholds(stats: BundleStats): void {
        const errors: string[] = [];
        const warnings: string[] = [];

        // Check total size
        if (stats.totalSize > this.thresholds.totalSize) {
            errors.push(`Total bundle size (${this.formatSize(stats.totalSize)}) exceeds limit (${this.formatSize(this.thresholds.totalSize)})`);
        }

        // Check individual chunks
        const largeChunks = stats.chunks.filter(chunk => chunk.size > this.thresholds.chunkSize);
        if (largeChunks.length > 0) {
            warnings.push(`${largeChunks.length} chunks exceed size limit (${this.formatSize(this.thresholds.chunkSize)})`);
        }

        // Check CSS size
        const cssAssets = stats.assets.filter(asset => asset.type === 'css');
        const totalCssSize = cssAssets.reduce((sum, asset) => sum + asset.size, 0);
        if (totalCssSize > this.thresholds.cssSize) {
            warnings.push(`CSS size (${this.formatSize(totalCssSize)}) exceeds limit (${this.formatSize(this.thresholds.cssSize)})`);
        }

        // Report results
        if (warnings.length > 0) {
            console.warn('\n⚠️  Bundle size warnings:');
            warnings.forEach(warning => console.warn(`  - ${warning}`));
        }

        if (errors.length > 0) {
            console.error('\n❌ Bundle size errors:');
            errors.forEach(error => console.error(`  - ${error}`));

            if (process.env.CI === 'true') {
                process.exit(1); // Fail CI build if bundle size exceeds limits
            }
        } else {
            console.log('\n✅ All bundle size checks passed');
        }
    }

    /**
     * Format bytes to human readable string
     */
    private formatSize(bytes: number): string {
        const kb = bytes / 1024;
        return kb > 1024 ? `${(kb / 1024).toFixed(2)} MB` : `${kb.toFixed(2)} KB`;
    }

    /**
     * Ensure required directories exist
     */
    private ensureDirectories(): void {
        if (!fs.existsSync(this.reportPath)) {
            fs.mkdirSync(this.reportPath, { recursive: true });
        }
    }
}

// CLI interface
if (import.meta.url === `file://${process.argv[1]}`) {
    const analyzer = new BundleAnalyzer();

    analyzer.analyze().catch(error => {
        console.error('❌ Bundle analysis failed:', error);
        process.exit(1);
    });
}

export { BundleAnalyzer, type AssetInfo, type BundleStats, type ChunkInfo };
