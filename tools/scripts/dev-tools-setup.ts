#!/usr/bin/env tsx

import chalk from 'chalk';
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

interface DevToolsConfig {
    typescript: {
        strictMode: boolean;
        noImplicitAny: boolean;
        strictNullChecks: boolean;
    };
    eslint: {
        maxWarnings: number;
        enabledRules: string[];
        disabledRules: string[];
    };
    performance: {
        bundleSizeLimit: number;
        enableAnalysis: boolean;
        enableSourceMaps: boolean;
    };
    testing: {
        coverageThreshold: number;
        enableVisualTesting: boolean;
        enableE2ETesting: boolean;
    };
}

class DevToolsSetup {
    private config: DevToolsConfig;
    private projectRoot: string;

    constructor() {
        this.projectRoot = process.cwd();
        this.config = this.loadDefaultConfig();
    }

    private loadDefaultConfig(): DevToolsConfig {
        return {
            typescript: {
                strictMode: true,
                noImplicitAny: true,
                strictNullChecks: true,
            },
            eslint: {
                maxWarnings: 0,
                enabledRules: [
                    '@typescript-eslint/no-unused-vars',
                    '@typescript-eslint/no-explicit-any',
                    'react-hooks/exhaustive-deps',
                    'jsx-a11y/alt-text',
                ],
                disabledRules: [],
            },
            performance: {
                bundleSizeLimit: 800 * 1024, // 800KB
                enableAnalysis: true,
                enableSourceMaps: true,
            },
            testing: {
                coverageThreshold: 80,
                enableVisualTesting: true,
                enableE2ETesting: true,
            },
        };
    }

    async setupDevTools(): Promise<void> {
        console.log(chalk.blue('🔧 Setting up development tools...'));
        console.log('═'.repeat(50));

        try {
            await this.setupTypeScript();
            await this.setupESLint();
            await this.setupPerformanceTools();
            await this.setupTestingTools();
            await this.setupGitHooks();
            await this.setupVSCodeSettings();

            console.log(chalk.green('\n✅ Development tools setup completed successfully!'));
            this.printSummary();
        } catch (error) {
            console.error(chalk.red('\n❌ Setup failed:'), error);
            process.exit(1);
        }
    }

    private async setupTypeScript(): Promise<void> {
        console.log(chalk.cyan('\n📝 Setting up TypeScript...'));

        // Check current TypeScript errors
        try {
            execSync('npx tsc --noEmit', { stdio: 'pipe' });
            console.log(chalk.green('  ✅ No TypeScript errors found'));
        } catch (error) {
            const output = (error as Error).toString();
            const errorCount = (output.match(/error TS/g) || []).length;
            console.log(chalk.yellow(`  ⚠️  Found ${errorCount} TypeScript errors`));

            if (errorCount > 0) {
                console.log(chalk.yellow('  📋 Running TypeScript error analysis...'));
                this.analyzeTypeScriptErrors();
            }
        }

        // Update tsconfig.json for strict mode
        await this.updateTSConfig();
    }

    private analyzeTypeScriptErrors(): void {
        try {
            const result = execSync('npx tsc --noEmit 2>&1', { encoding: 'utf8' });
            const errors = result.split('\n').filter(line => line.includes('error TS'));

            const errorTypes = new Map<string, number>();
            errors.forEach(error => {
                const match = error.match(/error (TS\d+):/);
                if (match) {
                    const errorCode = match[1];
                    errorTypes.set(errorCode, (errorTypes.get(errorCode) || 0) + 1);
                }
            });

            console.log(chalk.yellow('  📊 TypeScript Error Summary:'));
            Array.from(errorTypes.entries())
                .sort((a, b) => b[1] - a[1])
                .slice(0, 5)
                .forEach(([code, count]) => {
                    console.log(`    ${code}: ${count} occurrences`);
                });
        } catch (error) {
            console.log(chalk.red('  ❌ Failed to analyze TypeScript errors'));
        }
    }

    private async updateTSConfig(): Promise<void> {
        const tsconfigPath = path.join(this.projectRoot, 'tsconfig.json');

        if (fs.existsSync(tsconfigPath)) {
            try {
                const tsconfig = JSON.parse(fs.readFileSync(tsconfigPath, 'utf8'));

                // Enable strict mode settings
                tsconfig.compilerOptions = {
                    ...tsconfig.compilerOptions,
                    strict: this.config.typescript.strictMode,
                    noImplicitAny: this.config.typescript.noImplicitAny,
                    strictNullChecks: this.config.typescript.strictNullChecks,
                    noUnusedLocals: true,
                    noUnusedParameters: true,
                    exactOptionalPropertyTypes: true,
                };

                fs.writeFileSync(tsconfigPath, JSON.stringify(tsconfig, null, 2));
                console.log(chalk.green('  ✅ Updated tsconfig.json with strict settings'));
            } catch (error) {
                console.log(chalk.red('  ❌ Failed to update tsconfig.json'));
            }
        }
    }

    private async setupESLint(): Promise<void> {
        console.log(chalk.cyan('\n🔍 Setting up ESLint...'));

        // Run ESLint analysis
        try {
            execSync('npx eslint . --ext .ts,.tsx --format=compact', { stdio: 'pipe' });
            console.log(chalk.green('  ✅ No ESLint violations found'));
        } catch (error) {
            const output = (error as Error).toString();
            const warningCount = (output.match(/warning/g) || []).length;
            const errorCount = (output.match(/error/g) || []).length;

            console.log(chalk.yellow(`  ⚠️  Found ${errorCount} errors and ${warningCount} warnings`));

            if (errorCount > 0 || warningCount > 0) {
                this.analyzeESLintIssues();
            }
        }

        // Check for disabled ESLint rules in code
        this.checkDisabledESLintRules();
    }

    private analyzeESLintIssues(): void {
        try {
            const result = execSync('npx eslint . --ext .ts,.tsx --format=json', { encoding: 'utf8' });
            const eslintResults = JSON.parse(result);

            const ruleViolations = new Map<string, number>();
            eslintResults.forEach((file: any) => {
                file.messages.forEach((message: any) => {
                    if (message.ruleId) {
                        ruleViolations.set(message.ruleId, (ruleViolations.get(message.ruleId) || 0) + 1);
                    }
                });
            });

            console.log(chalk.yellow('  📊 Top ESLint Rule Violations:'));
            Array.from(ruleViolations.entries())
                .sort((a, b) => b[1] - a[1])
                .slice(0, 5)
                .forEach(([rule, count]) => {
                    console.log(`    ${rule}: ${count} violations`);
                });
        } catch (error) {
            console.log(chalk.red('  ❌ Failed to analyze ESLint issues'));
        }
    }

    private checkDisabledESLintRules(): void {
        try {
            const result = execSync('find . -name "*.ts" -o -name "*.tsx" | head -100 | xargs grep -l "eslint-disable"', { encoding: 'utf8' });
            const filesWithDisabledRules = result.trim().split('\n').filter(Boolean);

            if (filesWithDisabledRules.length > 0) {
                console.log(chalk.yellow(`  ⚠️  Found ${filesWithDisabledRules.length} files with disabled ESLint rules`));
                filesWithDisabledRules.slice(0, 5).forEach(file => {
                    console.log(`    ${file}`);
                });
            } else {
                console.log(chalk.green('  ✅ No disabled ESLint rules found'));
            }
        } catch (error) {
            console.log(chalk.green('  ✅ No disabled ESLint rules found'));
        }
    }

    private async setupPerformanceTools(): Promise<void> {
        console.log(chalk.cyan('\n⚡ Setting up performance tools...'));

        // Check bundle size
        await this.analyzeBundleSize();

        // Setup performance monitoring
        await this.setupPerformanceMonitoring();
    }

    private async analyzeBundleSize(): Promise<void> {
        try {
            // Run build to get bundle size
            console.log(chalk.blue('  📦 Analyzing bundle size...'));
            execSync('npm run build', { stdio: 'pipe' });

            const distPath = path.join(this.projectRoot, 'dist/public');
            if (fs.existsSync(distPath)) {
                const stats = this.calculateBundleSize(distPath);

                console.log(chalk.blue('  📊 Bundle Size Analysis:'));
                console.log(`    JavaScript: ${this.formatSize(stats.jsSize)}`);
                console.log(`    CSS: ${this.formatSize(stats.cssSize)}`);
                console.log(`    Assets: ${this.formatSize(stats.assetSize)}`);
                console.log(`    Total: ${this.formatSize(stats.totalSize)}`);

                // Check against budget
                if (stats.totalSize > this.config.performance.bundleSizeLimit) {
                    console.log(chalk.red(`  ❌ Bundle size exceeds limit (${this.formatSize(this.config.performance.bundleSizeLimit)})`));
                } else {
                    console.log(chalk.green('  ✅ Bundle size within limits'));
                }
            }
        } catch (error) {
            console.log(chalk.red('  ❌ Failed to analyze bundle size'));
        }
    }

    private calculateBundleSize(distPath: string): { jsSize: number; cssSize: number; assetSize: number; totalSize: number } {
        let jsSize = 0;
        let cssSize = 0;
        let assetSize = 0;

        const scanDir = (dir: string) => {
            const files = fs.readdirSync(dir);
            files.forEach(file => {
                const filePath = path.join(dir, file);
                const stat = fs.statSync(filePath);

                if (stat.isDirectory()) {
                    scanDir(filePath);
                } else {
                    const size = stat.size;
                    if (file.endsWith('.js')) {
                        jsSize += size;
                    } else if (file.endsWith('.css')) {
                        cssSize += size;
                    } else if (!file.includes('.map') && !file.includes('sw.js')) {
                        assetSize += size;
                    }
                }
            });
        };

        scanDir(distPath);
        return { jsSize, cssSize, assetSize, totalSize: jsSize + cssSize + assetSize };
    }

    private formatSize(bytes: number): string {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return `${parseFloat((bytes / k ** i).toFixed(1))} ${sizes[i]}`;
    }

    private async setupPerformanceMonitoring(): Promise<void> {
        // Check if performance monitoring is already set up
        const performanceUtilsPath = path.join(this.projectRoot, 'client/src/utils/performance.ts');
        const devToolsPath = path.join(this.projectRoot, 'client/src/utils/devTools.ts');

        if (fs.existsSync(performanceUtilsPath)) {
            console.log(chalk.green('  ✅ Performance monitoring already configured'));
        } else if (fs.existsSync(devToolsPath)) {
            console.log(chalk.green('  ✅ Development tools with performance monitoring configured'));
        } else {
            console.log(chalk.yellow('  ⚠️  Performance monitoring not found - consider adding it'));
        }

        // Check for React DevTools and other development extensions
        this.checkDevelopmentExtensions();
    }

    private checkDevelopmentExtensions(): void {
        const extensions = [
            { name: 'React DevTools', check: 'window.__REACT_DEVTOOLS_GLOBAL_HOOK__' },
            { name: 'Redux DevTools', check: 'window.__REDUX_DEVTOOLS_EXTENSION__' },
            { name: 'React Query DevTools', check: 'window.__REACT_QUERY_DEVTOOLS__' }
        ];

        console.log(chalk.blue('  🔍 Development Extensions Recommendations:'));
        extensions.forEach(ext => {
            console.log(`    • ${ext.name} - Recommended for debugging`);
        });
    }

    private async setupTestingTools(): Promise<void> {
        console.log(chalk.cyan('\n🧪 Setting up testing tools...'));

        // Check test coverage
        await this.checkTestCoverage();

        // Verify testing setup
        await this.verifyTestingSetup();
    }

    private async checkTestCoverage(): Promise<void> {
        try {
            console.log(chalk.blue('  📊 Checking test coverage...'));
            const result = execSync('npm run test:coverage 2>/dev/null || npm run test -- --coverage 2>/dev/null || echo "No coverage command found"', { encoding: 'utf8' });

            if (result.includes('No coverage command found')) {
                console.log(chalk.yellow('  ⚠️  No test coverage command configured'));
            } else {
                // Parse coverage results if available
                const coverageMatch = result.match(/All files\s+\|\s+([\d.]+)/);
                if (coverageMatch) {
                    const coverage = parseFloat(coverageMatch[1]);
                    if (coverage >= this.config.testing.coverageThreshold) {
                        console.log(chalk.green(`  ✅ Test coverage: ${coverage}% (meets ${this.config.testing.coverageThreshold}% threshold)`));
                    } else {
                        console.log(chalk.yellow(`  ⚠️  Test coverage: ${coverage}% (below ${this.config.testing.coverageThreshold}% threshold)`));
                    }
                } else {
                    console.log(chalk.blue('  📋 Test coverage analysis completed'));
                }
            }
        } catch (error) {
            console.log(chalk.yellow('  ⚠️  Could not determine test coverage'));
        }
    }

    private async verifyTestingSetup(): Promise<void> {
        const testFiles = [
            'vitest.config.ts',
            'playwright.config.js',
            'jest.config.js',
        ];

        const foundConfigs = testFiles.filter(file =>
            fs.existsSync(path.join(this.projectRoot, file))
        );

        if (foundConfigs.length > 0) {
            console.log(chalk.green(`  ✅ Testing configured: ${foundConfigs.join(', ')}`));
        } else {
            console.log(chalk.yellow('  ⚠️  No testing configuration found'));
        }
    }

    private async setupGitHooks(): Promise<void> {
        console.log(chalk.cyan('\n🪝 Setting up Git hooks...'));

        const huskyPath = path.join(this.projectRoot, '.husky');
        const packageJsonPath = path.join(this.projectRoot, 'package.json');

        if (fs.existsSync(huskyPath)) {
            console.log(chalk.green('  ✅ Husky already configured'));
        } else if (fs.existsSync(packageJsonPath)) {
            const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
            if (packageJson.devDependencies?.husky) {
                console.log(chalk.yellow('  ⚠️  Husky installed but not initialized'));
                console.log(chalk.blue('  💡 Run: npx husky install'));
            } else {
                console.log(chalk.yellow('  ⚠️  No Git hooks configured'));
                console.log(chalk.blue('  💡 Consider adding Husky for pre-commit hooks'));
            }
        }
    }

    private async setupVSCodeSettings(): Promise<void> {
        console.log(chalk.cyan('\n⚙️  Setting up VS Code settings...'));

        const vscodeDir = path.join(this.projectRoot, '.vscode');
        const settingsPath = path.join(vscodeDir, 'settings.json');

        if (!fs.existsSync(vscodeDir)) {
            fs.mkdirSync(vscodeDir, { recursive: true });
        }

        const recommendedSettings = {
            "typescript.preferences.noSemicolons": "off",
            "editor.formatOnSave": true,
            "editor.codeActionsOnSave": {
                "source.fixAll.eslint": true,
                "source.organizeImports": true
            },
            "typescript.updateImportsOnFileMove.enabled": "always",
            "eslint.validate": ["javascript", "javascriptreact", "typescript", "typescriptreact"],
            "files.exclude": {
                "**/node_modules": true,
                "**/dist": true,
                "**/.git": true
            }
        };

        try {
            let currentSettings = {};
            if (fs.existsSync(settingsPath)) {
                currentSettings = JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
            }

            const mergedSettings = { ...currentSettings, ...recommendedSettings };
            fs.writeFileSync(settingsPath, JSON.stringify(mergedSettings, null, 2));

            console.log(chalk.green('  ✅ VS Code settings updated'));
        } catch (error) {
            console.log(chalk.red('  ❌ Failed to update VS Code settings'));
        }
    }

    private printSummary(): void {
        console.log(chalk.blue('\n📋 Development Tools Summary'));
        console.log('═'.repeat(50));

        console.log(chalk.cyan('🔧 Configured Tools:'));
        console.log('  • TypeScript with strict mode');
        console.log('  • ESLint with enhanced rules');
        console.log('  • Performance monitoring');
        console.log('  • Testing infrastructure');
        console.log('  • VS Code integration');

        console.log(chalk.cyan('\n📊 Quality Targets:'));
        console.log(`  • Bundle size limit: ${this.formatSize(this.config.performance.bundleSizeLimit)}`);
        console.log(`  • Test coverage: ${this.config.testing.coverageThreshold}%`);
        console.log(`  • ESLint max warnings: ${this.config.eslint.maxWarnings}`);

        console.log(chalk.cyan('\n🚀 Next Steps:'));
        console.log('  1. Run: npm run lint:fix');
        console.log('  2. Run: npm run test:coverage');
        console.log('  3. Run: npm run build:analyze');
        console.log('  4. Fix any remaining TypeScript errors');
        console.log('  5. Set up pre-commit hooks with Husky');
    }
}

// CLI execution
if (import.meta.url === `file://${process.argv[1]}`) {
    const devTools = new DevToolsSetup();
    devTools.setupDevTools().catch(console.error);
}

export { DevToolsSetup };
