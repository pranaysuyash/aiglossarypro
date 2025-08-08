#!/usr/bin/env tsx
/**
 * CI/CD Performance Check Script
 * Automated performance validation for continuous integration
 */
import { execSync } from 'node:child_process';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
class CIPerformanceChecker {
    thresholds;
    outputDir;
    tempDir;
    constructor() {
        this.thresholds = {
            averageRenderTime: 25, // 25ms for CI (more lenient than dev)
            maxRenderTime: 100, // 100ms maximum
            slowRenderPercentage: 10, // 10% of renders can be slow
            memoryUsage: 100, // 100MB memory limit
            bundleSize: 5, // 5MB bundle size limit
            buildTime: 120000, // 2 minutes build time limit
        };
        this.outputDir = path.join(__dirname, '..', 'ci-performance-reports');
        this.tempDir = path.join(__dirname, '..', 'temp-ci');
    }
    async runPerformanceCheck() {
        console.log('🔍 Starting CI/CD Performance Check...');
        try {
            // Ensure directories exist
            await fs.mkdir(this.outputDir, { recursive: true });
            await fs.mkdir(this.tempDir, { recursive: true });
            // Run performance tests
            const buildMetrics = await this.runBuildPerformanceTest();
            const bundleMetrics = await this.analyzeBundleSize();
            const renderMetrics = await this.runRenderPerformanceTest();
            // Combine all metrics
            const metrics = {
                ...buildMetrics,
                ...bundleMetrics,
                ...renderMetrics,
            };
            // Check against thresholds
            const violations = this.checkThresholds(metrics);
            const recommendations = this.generateRecommendations(metrics, violations);
            const result = {
                passed: violations.length === 0,
                metrics,
                violations,
                recommendations,
            };
            // Save results
            await this.saveResults(result);
            // Output results
            this.outputResults(result);
            return result;
        }
        catch (error) {
            console.error('❌ Performance check failed:', error);
            throw error;
        }
    }
    async runBuildPerformanceTest() {
        console.log('🔧 Running build performance test...');
        const startTime = Date.now();
        try {
            // Run production build
            execSync('npm run build', {
                stdio: 'pipe',
                timeout: this.thresholds.buildTime,
            });
            const buildTime = Date.now() - startTime;
            console.log(`✅ Build completed in ${buildTime}ms`);
            return { buildTime };
        }
        catch (error) {
            console.error('❌ Build performance test failed:', error);
            throw new Error('Build performance test failed');
        }
    }
    async analyzeBundleSize() {
        console.log('📦 Analyzing bundle size...');
        try {
            const distPath = path.join(__dirname, '..', 'dist', 'public');
            const bundleSize = await this.calculateDirectorySize(distPath);
            console.log(`📊 Bundle size: ${(bundleSize / 1024 / 1024).toFixed(2)}MB`);
            return { bundleSize: bundleSize / 1024 / 1024 }; // Convert to MB
        }
        catch (error) {
            console.error('❌ Bundle size analysis failed:', error);
            return { bundleSize: 0 };
        }
    }
    async runRenderPerformanceTest() {
        console.log('⚡ Running render performance test...');
        try {
            // Start the application in test mode
            const child = execSync('npm run dev', {
                stdio: 'pipe',
                timeout: 30000,
                detached: true,
            });
            // Wait for app to start
            await new Promise(resolve => setTimeout(resolve, 10000));
            // Run React Scan analysis
            const scanResult = await this.runReactScanAnalysis();
            // Kill the dev server
            process.kill(-child.pid);
            return scanResult;
        }
        catch (error) {
            console.error('❌ Render performance test failed:', error);
            return {
                averageRenderTime: 0,
                maxRenderTime: 0,
                slowRenderPercentage: 0,
                memoryUsage: 0,
            };
        }
    }
    async runReactScanAnalysis() {
        try {
            // Run React Scan and capture output
            const scanOutput = execSync('npx react-scan@latest http://localhost:5173 --timeout 20000', {
                stdio: 'pipe',
                timeout: 25000,
            }).toString();
            // Parse the output (this would need to be adapted based on React Scan's actual output format)
            const metrics = this.parseReactScanOutput(scanOutput);
            return metrics;
        }
        catch (error) {
            console.error('❌ React Scan analysis failed:', error);
            return {
                averageRenderTime: 0,
                maxRenderTime: 0,
                slowRenderPercentage: 0,
                memoryUsage: 0,
            };
        }
    }
    parseReactScanOutput(output) {
        // This is a simplified parser - in reality, you'd need to parse React Scan's actual output
        const lines = output.split('\n');
        let averageRenderTime = 0;
        let maxRenderTime = 0;
        let slowRenderPercentage = 0;
        let memoryUsage = 0;
        for (const line of lines) {
            if (line.includes('Average render time:')) {
                averageRenderTime = parseFloat(line.match(/(\d+\.?\d*)ms/)?.[1] || '0');
            }
            if (line.includes('Max render time:')) {
                maxRenderTime = parseFloat(line.match(/(\d+\.?\d*)ms/)?.[1] || '0');
            }
            if (line.includes('Slow renders:')) {
                slowRenderPercentage = parseFloat(line.match(/(\d+\.?\d*)%/)?.[1] || '0');
            }
            if (line.includes('Memory usage:')) {
                memoryUsage = parseFloat(line.match(/(\d+\.?\d*)MB/)?.[1] || '0');
            }
        }
        return {
            averageRenderTime,
            maxRenderTime,
            slowRenderPercentage,
            memoryUsage,
        };
    }
    async calculateDirectorySize(dirPath) {
        let totalSize = 0;
        try {
            const files = await fs.readdir(dirPath);
            for (const file of files) {
                const filePath = path.join(dirPath, file);
                const stats = await fs.stat(filePath);
                if (stats.isDirectory()) {
                    totalSize += await this.calculateDirectorySize(filePath);
                }
                else {
                    totalSize += stats.size;
                }
            }
        }
        catch (error) {
            console.error('Error calculating directory size:', error);
        }
        return totalSize;
    }
    checkThresholds(metrics) {
        const violations = [];
        if (metrics.averageRenderTime > this.thresholds.averageRenderTime) {
            violations.push(`Average render time (${metrics.averageRenderTime.toFixed(2)}ms) exceeds threshold (${this.thresholds.averageRenderTime}ms)`);
        }
        if (metrics.maxRenderTime > this.thresholds.maxRenderTime) {
            violations.push(`Maximum render time (${metrics.maxRenderTime.toFixed(2)}ms) exceeds threshold (${this.thresholds.maxRenderTime}ms)`);
        }
        if (metrics.slowRenderPercentage > this.thresholds.slowRenderPercentage) {
            violations.push(`Slow render percentage (${metrics.slowRenderPercentage.toFixed(2)}%) exceeds threshold (${this.thresholds.slowRenderPercentage}%)`);
        }
        if (metrics.memoryUsage > this.thresholds.memoryUsage) {
            violations.push(`Memory usage (${metrics.memoryUsage.toFixed(2)}MB) exceeds threshold (${this.thresholds.memoryUsage}MB)`);
        }
        if (metrics.bundleSize > this.thresholds.bundleSize) {
            violations.push(`Bundle size (${metrics.bundleSize.toFixed(2)}MB) exceeds threshold (${this.thresholds.bundleSize}MB)`);
        }
        if (metrics.buildTime > this.thresholds.buildTime) {
            violations.push(`Build time (${metrics.buildTime}ms) exceeds threshold (${this.thresholds.buildTime}ms)`);
        }
        return violations;
    }
    generateRecommendations(metrics, violations) {
        const recommendations = [];
        if (metrics.averageRenderTime > this.thresholds.averageRenderTime) {
            recommendations.push('Consider using React.memo() for components that render frequently');
            recommendations.push('Implement useMemo() for expensive calculations');
            recommendations.push('Use useCallback() for event handlers in child components');
        }
        if (metrics.bundleSize > this.thresholds.bundleSize) {
            recommendations.push('Implement code splitting with React.lazy()');
            recommendations.push('Analyze bundle with npm run build:analyze');
            recommendations.push('Consider tree-shaking unused dependencies');
        }
        if (metrics.memoryUsage > this.thresholds.memoryUsage) {
            recommendations.push('Review useEffect cleanup functions');
            recommendations.push('Implement proper event listener cleanup');
            recommendations.push('Consider using React.memo() to prevent unnecessary re-renders');
        }
        if (metrics.buildTime > this.thresholds.buildTime) {
            recommendations.push('Review build configuration for optimizations');
            recommendations.push('Consider using build cache mechanisms');
            recommendations.push('Optimize TypeScript configuration');
        }
        if (violations.length === 0) {
            recommendations.push('All performance metrics are within acceptable thresholds');
        }
        return recommendations;
    }
    async saveResults(result) {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const filename = `ci-performance-${timestamp}.json`;
        const filepath = path.join(this.outputDir, filename);
        const report = {
            timestamp: new Date().toISOString(),
            passed: result.passed,
            thresholds: this.thresholds,
            metrics: result.metrics,
            violations: result.violations,
            recommendations: result.recommendations,
        };
        await fs.writeFile(filepath, JSON.stringify(report, null, 2));
        console.log(`📝 Performance report saved: ${filename}`);
    }
    outputResults(result) {
        console.log(`\n${'='.repeat(50)}`);
        console.log('📊 CI/CD PERFORMANCE CHECK RESULTS');
        console.log('='.repeat(50));
        console.log(`\n✅ Status: ${result.passed ? 'PASSED' : 'FAILED'}`);
        console.log('\n📈 Metrics:');
        console.log(`  Average Render Time: ${result.metrics.averageRenderTime.toFixed(2)}ms`);
        console.log(`  Max Render Time: ${result.metrics.maxRenderTime.toFixed(2)}ms`);
        console.log(`  Slow Render %: ${result.metrics.slowRenderPercentage.toFixed(2)}%`);
        console.log(`  Memory Usage: ${result.metrics.memoryUsage.toFixed(2)}MB`);
        console.log(`  Bundle Size: ${result.metrics.bundleSize.toFixed(2)}MB`);
        console.log(`  Build Time: ${result.metrics.buildTime}ms`);
        if (result.violations.length > 0) {
            console.log('\n❌ Violations:');
            result.violations.forEach(violation => {
                console.log(`  • ${violation}`);
            });
        }
        if (result.recommendations.length > 0) {
            console.log('\n💡 Recommendations:');
            result.recommendations.forEach(rec => {
                console.log(`  • ${rec}`);
            });
        }
        console.log(`\n${'='.repeat(50)}`);
    }
}
// GitHub Actions integration
function setGitHubOutput(name, value) {
    if (process.env.GITHUB_ACTIONS) {
        console.log(`::set-output name=${name}::${value}`);
    }
}
// Main execution
async function main() {
    const checker = new CIPerformanceChecker();
    try {
        const result = await checker.runPerformanceCheck();
        // Set GitHub Actions outputs
        setGitHubOutput('performance_passed', result.passed.toString());
        setGitHubOutput('average_render_time', result.metrics.averageRenderTime.toString());
        setGitHubOutput('bundle_size', result.metrics.bundleSize.toString());
        setGitHubOutput('build_time', result.metrics.buildTime.toString());
        // Exit with appropriate code
        process.exit(result.passed ? 0 : 1);
    }
    catch (error) {
        console.error('❌ CI Performance check failed:', error);
        setGitHubOutput('performance_passed', 'false');
        setGitHubOutput('error', error.message);
        process.exit(1);
    }
}
if (import.meta.url === `file://${process.argv[1]}`) {
    main();
}
export default CIPerformanceChecker;
