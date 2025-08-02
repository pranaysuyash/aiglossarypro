#!/usr/bin/env tsx
import * as fs from 'node:fs';
import * as path from 'node:path';
import { glob } from 'glob';
import chalk from 'chalk';
import { execSync } from 'node:child_process';
/**
 * Comprehensive test quality and coverage checker
 */
class TestQualityChecker {
    srcFiles = [];
    testFiles = [];
    coverageReport = {
        totalFiles: 0,
        testedFiles: 0,
        untestedFiles: [],
        coveragePercentage: 0,
        criticalGaps: [],
        recommendations: [],
    };
    async run() {
        console.log(chalk.blue('🧪 AI-ML Glossary Test Quality Analysis\n'));
        console.log(chalk.gray('Scanning codebase for test coverage and quality...\n'));
        // Find all source files
        await this.findSourceFiles();
        // Find all test files
        await this.findTestFiles();
        // Analyze coverage
        await this.analyzeCoverage();
        // Check test quality
        await this.analyzeTestQuality();
        // Generate report
        this.generateReport();
        // Run actual tests if requested
        if (process.argv.includes('--run-tests')) {
            await this.runTests();
        }
    }
    async findSourceFiles() {
        const patterns = [
            'server/**/*.ts',
            'client/src/**/*.{ts,tsx}',
            'shared/**/*.ts',
        ];
        for (const pattern of patterns) {
            const files = await glob(pattern, {
                ignore: [
                    '**/node_modules/**',
                    '**/*.test.{ts,tsx}',
                    '**/*.spec.{ts,tsx}',
                    '**/__tests__/**',
                    '**/*.stories.{ts,tsx}',
                    '**/dist/**',
                    '**/build/**',
                ],
            });
            this.srcFiles.push(...files);
        }
        console.log(chalk.cyan(`Found ${this.srcFiles.length} source files\n`));
    }
    async findTestFiles() {
        const patterns = [
            '**/*.test.{ts,tsx}',
            '**/*.spec.{ts,tsx}',
            '**/__tests__/**/*.{ts,tsx}',
        ];
        for (const pattern of patterns) {
            const files = await glob(pattern, {
                ignore: ['**/node_modules/**', '**/dist/**', '**/build/**'],
            });
            this.testFiles.push(...files);
        }
        console.log(chalk.cyan(`Found ${this.testFiles.length} test files\n`));
    }
    async analyzeCoverage() {
        const testedFiles = new Set();
        // Map test files to source files
        for (const testFile of this.testFiles) {
            const possibleSourceFiles = this.getPossibleSourceFiles(testFile);
            possibleSourceFiles.forEach(file => {
                if (this.srcFiles.includes(file)) {
                    testedFiles.add(file);
                }
            });
        }
        // Identify untested files
        const untestedFiles = this.srcFiles.filter(file => !testedFiles.has(file));
        // Identify critical gaps
        const criticalPatterns = [
            /services\/.*\.ts$/,
            /middleware\/.*\.ts$/,
            /auth.*\.ts$/,
            /payment.*\.ts$/,
            /user.*\.ts$/,
            /admin.*\.ts$/,
        ];
        const criticalGaps = untestedFiles.filter(file => criticalPatterns.some(pattern => pattern.test(file)));
        this.coverageReport = {
            totalFiles: this.srcFiles.length,
            testedFiles: testedFiles.size,
            untestedFiles: untestedFiles,
            coveragePercentage: (testedFiles.size / this.srcFiles.length) * 100,
            criticalGaps: criticalGaps,
            recommendations: this.generateRecommendations(criticalGaps, untestedFiles),
        };
    }
    getPossibleSourceFiles(testFile) {
        const possibilities = [];
        const baseName = path.basename(testFile)
            .replace('.test.', '.')
            .replace('.spec.', '.')
            .replace(/\.(ts|tsx)$/, '');
        // Common test file patterns
        const testDir = path.dirname(testFile);
        // Same directory
        possibilities.push(path.join(testDir, `${baseName}.ts`));
        possibilities.push(path.join(testDir, `${baseName}.tsx`));
        // Parent directory
        possibilities.push(path.join(testDir, '..', `${baseName}.ts`));
        possibilities.push(path.join(testDir, '..', `${baseName}.tsx`));
        // __tests__ directory pattern
        if (testDir.includes('__tests__')) {
            const parentDir = testDir.replace('/__tests__', '');
            possibilities.push(path.join(parentDir, `${baseName}.ts`));
            possibilities.push(path.join(parentDir, `${baseName}.tsx`));
        }
        return possibilities;
    }
    generateRecommendations(criticalGaps, untestedFiles) {
        const recommendations = [];
        if (criticalGaps.length > 0) {
            recommendations.push(`🚨 Critical: Add tests for ${criticalGaps.length} security/business-critical files`);
        }
        const serviceFiles = untestedFiles.filter(f => f.includes('/services/'));
        if (serviceFiles.length > 5) {
            recommendations.push(`⚠️  High Priority: ${serviceFiles.length} service files lack tests`);
        }
        const componentFiles = untestedFiles.filter(f => f.endsWith('.tsx'));
        if (componentFiles.length > 50) {
            recommendations.push(`📊 Medium Priority: ${componentFiles.length} React components need tests`);
        }
        if (this.coverageReport.coveragePercentage < 50) {
            recommendations.push('🎯 Goal: Aim for at least 80% test coverage for critical paths');
        }
        return recommendations;
    }
    async analyzeTestQuality() {
        console.log(chalk.yellow('\n📋 Analyzing test quality...\n'));
        const qualityIssues = [];
        let highQualityTests = 0;
        for (const testFile of this.testFiles.slice(0, 50)) { // Sample first 50 files
            const metrics = await this.analyzeTestFile(testFile);
            if (metrics.testCount === 0) {
                qualityIssues.push(`${testFile}: No tests found`);
            }
            else if (metrics.assertionCount / metrics.testCount < 1) {
                qualityIssues.push(`${testFile}: Low assertion density`);
            }
            else if (!metrics.hasErrorCases) {
                qualityIssues.push(`${testFile}: Missing error case tests`);
            }
            else {
                highQualityTests++;
            }
        }
        console.log(chalk.green(`✅ ${highQualityTests} high-quality test files`));
        if (qualityIssues.length > 0) {
            console.log(chalk.yellow(`⚠️  ${qualityIssues.length} files with quality issues`));
            qualityIssues.slice(0, 5).forEach(issue => {
                console.log(chalk.gray(`   - ${issue}`));
            });
        }
    }
    async analyzeTestFile(filePath) {
        const content = await fs.promises.readFile(filePath, 'utf-8');
        return {
            hasDescribe: /describe\s*\(/.test(content),
            hasIt: /it\s*\(|test\s*\(/.test(content),
            hasExpect: /expect\s*\(/.test(content),
            hasMocks: /mock|vi\.fn|jest\.fn/.test(content),
            hasErrorCases: /throw|reject|error|fail/i.test(content),
            hasEdgeCases: /edge|boundary|limit|null|undefined|empty/i.test(content),
            testCount: (content.match(/it\s*\(|test\s*\(/g) || []).length,
            assertionCount: (content.match(/expect\s*\(/g) || []).length,
        };
    }
    generateReport() {
        console.log(chalk.blue('\n📊 Test Coverage Report\n'));
        console.log(chalk.white('─'.repeat(60)));
        // Overall coverage
        const coverage = this.coverageReport.coveragePercentage.toFixed(1);
        const coverageColor = this.coverageReport.coveragePercentage >= 80 ? chalk.green :
            this.coverageReport.coveragePercentage >= 50 ? chalk.yellow :
                chalk.red;
        console.log(`Total Source Files: ${chalk.cyan(this.coverageReport.totalFiles)}`);
        console.log(`Files with Tests: ${chalk.cyan(this.coverageReport.testedFiles)}`);
        console.log(`Coverage: ${coverageColor(coverage + '%')}`);
        console.log(chalk.white('─'.repeat(60)));
        // Critical gaps
        if (this.coverageReport.criticalGaps.length > 0) {
            console.log(chalk.red('\n🚨 Critical Files Without Tests:\n'));
            this.coverageReport.criticalGaps.slice(0, 10).forEach(file => {
                console.log(chalk.red(`  • ${file}`));
            });
            if (this.coverageReport.criticalGaps.length > 10) {
                console.log(chalk.gray(`  ... and ${this.coverageReport.criticalGaps.length - 10} more`));
            }
        }
        // Recommendations
        if (this.coverageReport.recommendations.length > 0) {
            console.log(chalk.yellow('\n💡 Recommendations:\n'));
            this.coverageReport.recommendations.forEach(rec => {
                console.log(`  ${rec}`);
            });
        }
        // Top untested directories
        const directoryCounts = this.getDirectoryCounts(this.coverageReport.untestedFiles);
        console.log(chalk.yellow('\n📁 Directories with Most Untested Files:\n'));
        Object.entries(directoryCounts)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 5)
            .forEach(([dir, count]) => {
            console.log(`  ${dir}: ${chalk.red(count)} files`);
        });
        // Save detailed report
        this.saveDetailedReport();
    }
    getDirectoryCounts(files) {
        const counts = {};
        files.forEach(file => {
            const dir = path.dirname(file).split('/').slice(0, 3).join('/');
            counts[dir] = (counts[dir] || 0) + 1;
        });
        return counts;
    }
    saveDetailedReport() {
        const report = {
            timestamp: new Date().toISOString(),
            summary: {
                totalFiles: this.coverageReport.totalFiles,
                testedFiles: this.coverageReport.testedFiles,
                coveragePercentage: this.coverageReport.coveragePercentage,
                testFileCount: this.testFiles.length,
            },
            criticalGaps: this.coverageReport.criticalGaps,
            recommendations: this.coverageReport.recommendations,
            untestedFiles: this.coverageReport.untestedFiles,
        };
        fs.writeFileSync('test-coverage-report.json', JSON.stringify(report, null, 2));
        console.log(chalk.gray('\n📄 Detailed report saved to test-coverage-report.json'));
    }
    async runTests() {
        console.log(chalk.blue('\n🏃 Running tests...\n'));
        try {
            execSync('npm test', { stdio: 'inherit' });
            console.log(chalk.green('\n✅ All tests passed!'));
        }
        catch (error) {
            console.log(chalk.red('\n❌ Some tests failed. See output above.'));
        }
    }
}
// Run the checker
const checker = new TestQualityChecker();
checker.run().catch(console.error);
// Export for testing
export { TestQualityChecker };
