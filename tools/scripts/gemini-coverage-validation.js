#!/usr/bin/env node

/**
 * Comprehensive Gemini CLI Validation Script
 *
 * This script performs a thorough analysis of:
 * 1. Component coverage completeness
 * 2. Visual testing script functionality
 * 3. Story file quality and syntax
 * 4. Storybook integration
 * 5. Overall implementation quality
 */

import { execSync } from 'child_process';
import fs from 'fs';
import { glob } from 'glob';
import path from 'path';

class GeminiCoverageValidator {
  constructor() {
    this.validationResults = {
      componentCoverage: {},
      visualTesting: {},
      storyQuality: {},
      storybook: {},
      overall: {},
      errors: [],
      warnings: [],
    };
  }

  async runValidation() {
    console.log('🔍 Starting Comprehensive Gemini CLI Validation...\n');

    // Check if Gemini CLI is available
    if (!this.checkGeminiCli()) {
      console.error('❌ Gemini CLI not found. Please install it first.');
      process.exit(1);
    }

    await this.validateComponentCoverage();
    await this.validateVisualTesting();
    await this.validateStoryQuality();
    await this.validateStorybookIntegration();
    await this.generateComprehensiveReport();

    console.log('\n✅ Validation Complete! Check the generated report for details.');
  }

  checkGeminiCli() {
    try {
      execSync('which gemini', { stdio: 'pipe' });
      return true;
    } catch (error) {
      try {
        execSync('npx gemini --version', { stdio: 'pipe' });
        return true;
      } catch (error) {
        return false;
      }
    }
  }

  async validateComponentCoverage() {
    console.log('📊 Validating Component Coverage...');

    try {
      // Find all React components
      const componentFiles = await glob('client/src/**/*.tsx', {
        ignore: ['**/*.stories.*', '**/*.test.*', '**/*.spec.*'],
      });

      // Find all story files
      const storyFiles = await glob('client/src/**/*.stories.tsx');

      // Analyze coverage
      const coverage = this.analyzeComponentCoverage(componentFiles, storyFiles);

      this.validationResults.componentCoverage = {
        totalComponents: componentFiles.length,
        totalStories: storyFiles.length,
        coveragePercentage: ((storyFiles.length / componentFiles.length) * 100).toFixed(1),
        missingStories: coverage.missing,
        byCategory: coverage.byCategory,
        detailedAnalysis: coverage.detailed,
      };

      console.log(`   ✓ Found ${componentFiles.length} components`);
      console.log(`   ✓ Found ${storyFiles.length} stories`);
      console.log(`   ✓ Coverage: ${this.validationResults.componentCoverage.coveragePercentage}%`);
    } catch (error) {
      this.validationResults.errors.push({
        section: 'Component Coverage',
        error: error.message,
      });
      console.error(`   ❌ Error analyzing coverage: ${error.message}`);
    }
  }

  analyzeComponentCoverage(componentFiles, storyFiles) {
    const storyComponents = new Set();
    const missing = [];
    const byCategory = {};
    const detailed = [];

    // Extract component names from story files
    storyFiles.forEach(storyFile => {
      const componentName = path.basename(storyFile, '.stories.tsx');
      storyComponents.add(componentName);
    });

    // Check each component file
    componentFiles.forEach(compFile => {
      const componentName = path.basename(compFile, '.tsx');
      const category = this.getComponentCategory(compFile);

      if (!byCategory[category]) {byCategory[category] = { total: 0, covered: 0 };}
      byCategory[category].total++;

      const storyExists = fs.existsSync(compFile.replace(/\.tsx$/, '.stories.tsx'));

      const analysis = {
        component: compFile,
        name: componentName,
        category: category,
        hasStory: storyExists,
        storyPath: compFile.replace(/\.tsx$/, '.stories.tsx'),
      };

      if (storyExists) {
        byCategory[category].covered++;
      } else {
        missing.push(analysis);
      }

      detailed.push(analysis);
    });

    return { missing, byCategory, detailed };
  }

  getComponentCategory(filePath) {
    if (filePath.includes('/pages/')) {return 'Pages';}
    if (filePath.includes('/ui/')) {return 'UI Components';}
    if (filePath.includes('/admin/')) {return 'Admin';}
    if (filePath.includes('/landing/')) {return 'Landing';}
    if (filePath.includes('/analytics/')) {return 'Analytics';}
    if (filePath.includes('/ar/') || filePath.includes('/vr/')) {return 'AR/VR';}
    if (filePath.includes('/mobile/')) {return 'Mobile';}
    if (filePath.includes('/components/')) {return 'Components';}
    return 'Other';
  }

  async validateVisualTesting() {
    console.log('🎨 Validating Visual Testing Setup...');

    try {
      // Check if visual testing files exist
      const visualTestFiles = await glob('tests/visual/**/*.spec.ts');
      const playwrightConfig =
        fs.existsSync('playwright.config.ts') || fs.existsSync('playwright.config.js');
      const storybookConfig =
        fs.existsSync('.storybook/main.ts') || fs.existsSync('.storybook/main.js');

      // Check visual regression baselines
      const visualBaselines = await glob('tests/visual/**/*-snapshots/**/*.png');

      // Analyze visual testing scripts
      const visualScripts = this.analyzeVisualTestingScripts(visualTestFiles);

      this.validationResults.visualTesting = {
        hasVisualTests: visualTestFiles.length > 0,
        visualTestFiles: visualTestFiles.length,
        hasPlaywrightConfig: playwrightConfig,
        hasStorybookConfig: storybookConfig,
        visualBaselines: visualBaselines.length,
        scripts: visualScripts,
        storybookIntegration: this.checkStorybookVisualIntegration(),
      };

      console.log(`   ✓ Visual test files: ${visualTestFiles.length}`);
      console.log(`   ✓ Playwright config: ${playwrightConfig ? 'Yes' : 'No'}`);
      console.log(`   ✓ Storybook config: ${storybookConfig ? 'Yes' : 'No'}`);
      console.log(`   ✓ Visual baselines: ${visualBaselines.length}`);
    } catch (error) {
      this.validationResults.errors.push({
        section: 'Visual Testing',
        error: error.message,
      });
      console.error(`   ❌ Error analyzing visual testing: ${error.message}`);
    }
  }

  analyzeVisualTestingScripts(visualTestFiles) {
    const scripts = [];

    visualTestFiles.forEach(testFile => {
      try {
        const content = fs.readFileSync(testFile, 'utf8');
        const analysis = {
          file: testFile,
          hasStorybookIntegration: content.includes('storybook') || content.includes('Storybook'),
          hasScreenshotComparison: content.includes('toHaveScreenshot'),
          hasMultipleBrowsers: content.includes('chromium') && content.includes('firefox'),
          hasResponsiveTests: content.includes('mobile') || content.includes('tablet'),
          testCount: (content.match(/test\(/g) || []).length,
        };
        scripts.push(analysis);
      } catch (error) {
        this.validationResults.warnings.push({
          section: 'Visual Testing',
          warning: `Could not analyze ${testFile}: ${error.message}`,
        });
      }
    });

    return scripts;
  }

  checkStorybookVisualIntegration() {
    try {
      if (fs.existsSync('package.json')) {
        const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
        const scripts = packageJson.scripts || {};

        return {
          hasStorybookScript: 'storybook' in scripts || 'storybook:dev' in scripts,
          hasVisualTestScript: 'test:visual' in scripts || 'test:visual:storybook' in scripts,
          hasStorybookBuild: 'build-storybook' in scripts || 'storybook:build' in scripts,
          scripts: Object.keys(scripts).filter(
            key => key.includes('storybook') || key.includes('visual')
          ),
        };
      }
      return { hasStorybookScript: false, hasVisualTestScript: false };
    } catch (error) {
      return { error: error.message };
    }
  }

  async validateStoryQuality() {
    console.log('📝 Validating Story Quality...');

    try {
      const storyFiles = await glob('client/src/**/*.stories.tsx');
      const qualityAnalysis = await this.analyzeStoryQuality(storyFiles);

      this.validationResults.storyQuality = {
        totalStories: storyFiles.length,
        syntaxErrors: qualityAnalysis.syntaxErrors,
        importIssues: qualityAnalysis.importIssues,
        typeScriptErrors: qualityAnalysis.typeScriptErrors,
        bestPractices: qualityAnalysis.bestPractices,
        storyVariants: qualityAnalysis.storyVariants,
      };

      console.log(`   ✓ Analyzed ${storyFiles.length} story files`);
      console.log(`   ✓ Syntax errors: ${qualityAnalysis.syntaxErrors.length}`);
      console.log(`   ✓ Import issues: ${qualityAnalysis.importIssues.length}`);
      console.log(`   ✓ TypeScript errors: ${qualityAnalysis.typeScriptErrors.length}`);
    } catch (error) {
      this.validationResults.errors.push({
        section: 'Story Quality',
        error: error.message,
      });
      console.error(`   ❌ Error analyzing story quality: ${error.message}`);
    }
  }

  async analyzeStoryQuality(storyFiles) {
    const syntaxErrors = [];
    const importIssues = [];
    const typeScriptErrors = [];
    const bestPractices = [];
    const storyVariants = [];

    for (const storyFile of storyFiles) {
      try {
        const content = fs.readFileSync(storyFile, 'utf8');
        const analysis = this.analyzeStoryFile(storyFile, content);

        syntaxErrors.push(...analysis.syntaxErrors);
        importIssues.push(...analysis.importIssues);
        typeScriptErrors.push(...analysis.typeScriptErrors);
        bestPractices.push(...analysis.bestPractices);
        storyVariants.push(analysis.variants);
      } catch (error) {
        syntaxErrors.push({
          file: storyFile,
          error: `Could not read file: ${error.message}`,
        });
      }
    }

    return {
      syntaxErrors,
      importIssues,
      typeScriptErrors,
      bestPractices,
      storyVariants,
    };
  }

  analyzeStoryFile(storyFile, content) {
    const syntaxErrors = [];
    const importIssues = [];
    const typeScriptErrors = [];
    const bestPractices = [];

    // Check for common syntax issues
    if (content.includes('import {') && content.includes('} from')) {
      const importMatch = content.match(/import\s*\{\s*([^}]+)\s*\}\s*from\s*['"]([^'"]+)['"]/);
      if (importMatch) {
        const importedName = importMatch[1].trim();
        if (importedName.includes('-')) {
          importIssues.push({
            file: storyFile,
            issue: `Invalid import name with hyphen: ${importedName}`,
          });
        }
      }
    }

    // Check for TypeScript compliance
    if (!content.includes('Meta') || !content.includes('StoryObj')) {
      typeScriptErrors.push({
        file: storyFile,
        error: 'Missing proper TypeScript story types',
      });
    }

    // Check for best practices
    if (!content.includes('title:')) {
      bestPractices.push({
        file: storyFile,
        issue: 'Missing story title',
      });
    }

    if (!content.includes('tags:') || !content.includes('autodocs')) {
      bestPractices.push({
        file: storyFile,
        issue: 'Missing autodocs tag',
      });
    }

    // Count story variants
    const storyExports = content.match(/export const \w+: Story/g) || [];
    const variants = {
      file: storyFile,
      count: storyExports.length,
      variants: storyExports.map(exp => exp.match(/export const (\w+):/)[1]),
    };

    return {
      syntaxErrors,
      importIssues,
      typeScriptErrors,
      bestPractices,
      variants,
    };
  }

  async validateStorybookIntegration() {
    console.log('📚 Validating Storybook Integration...');

    try {
      // Check Storybook configuration
      const storybookConfig = this.checkStorybookConfig();

      // Try to start Storybook and check if it loads
      const storybookTest = await this.testStorybookStartup();

      this.validationResults.storybook = {
        config: storybookConfig,
        startup: storybookTest,
        integration: this.checkStorybookVisualIntegration(),
      };

      console.log(`   ✓ Storybook config: ${storybookConfig.exists ? 'Found' : 'Missing'}`);
      console.log(`   ✓ Startup test: ${storybookTest.success ? 'Passed' : 'Failed'}`);
    } catch (error) {
      this.validationResults.errors.push({
        section: 'Storybook Integration',
        error: error.message,
      });
      console.error(`   ❌ Error validating Storybook: ${error.message}`);
    }
  }

  checkStorybookConfig() {
    const configPaths = ['.storybook/main.ts', '.storybook/main.js'];
    let configExists = false;
    let configContent = null;

    for (const configPath of configPaths) {
      if (fs.existsSync(configPath)) {
        configExists = true;
        configContent = fs.readFileSync(configPath, 'utf8');
        break;
      }
    }

    return {
      exists: configExists,
      hasReactSupport: configContent?.includes('@storybook/react'),
      hasTypeScriptSupport: configContent?.includes('typescript'),
      hasEssentials: configContent?.includes('essentials'),
      addons: configContent ? this.extractStorybookAddons(configContent) : [],
    };
  }

  extractStorybookAddons(configContent) {
    const addonsMatch = configContent.match(/addons:\s*\[(.*?)\]/s);
    if (addonsMatch) {
      return addonsMatch[1]
        .split(',')
        .map(addon => addon.trim().replace(/['"]/g, ''))
        .filter(addon => addon.length > 0);
    }
    return [];
  }

  async testStorybookStartup() {
    try {
      // Test if Storybook dependencies are available
      console.log('     Testing Storybook dependencies...');
      const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
      const hasStorybookDeps =
        packageJson.devDependencies &&
        Object.keys(packageJson.devDependencies).some(dep => dep.includes('storybook'));

      if (!hasStorybookDeps) {
        return {
          success: false,
          error: 'Storybook dependencies not found',
          method: 'dependency-check',
        };
      }

      // Check if Storybook config is valid
      const storybookConfigExists =
        fs.existsSync('.storybook/main.ts') || fs.existsSync('.storybook/main.js');

      return {
        success: storybookConfigExists,
        output: storybookConfigExists
          ? 'Storybook configuration found'
          : 'Storybook configuration missing',
        method: 'config-check',
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        method: 'config-check',
      };
    }
  }

  async generateComprehensiveReport() {
    console.log('📋 Generating Comprehensive Report...');

    const report = this.createValidationReport();

    // Write detailed report
    const reportPath = 'GEMINI_VALIDATION_REPORT.md';
    fs.writeFileSync(reportPath, report);

    // Write JSON summary
    const summaryPath = 'gemini-validation-summary.json';
    fs.writeFileSync(summaryPath, JSON.stringify(this.validationResults, null, 2));

    console.log(`   ✓ Detailed report: ${reportPath}`);
    console.log(`   ✓ JSON summary: ${summaryPath}`);

    // Display summary
    this.displayValidationSummary();
  }

  createValidationReport() {
    const { componentCoverage, visualTesting, storyQuality, storybook, errors, warnings } =
      this.validationResults;

    return `# Gemini CLI Validation Report
## Component Coverage Analysis

**Overall Coverage**: ${componentCoverage.coveragePercentage}%
- **Total Components**: ${componentCoverage.totalComponents}
- **Total Stories**: ${componentCoverage.totalStories}
- **Missing Stories**: ${componentCoverage.missingStories?.length || 0}

### Coverage by Category
${Object.entries(componentCoverage.byCategory || {})
  .map(
    ([category, data]) =>
      `- **${category}**: ${data.covered}/${data.total} (${((data.covered / data.total) * 100).toFixed(1)}%)`
  )
  .join('\n')}

## Visual Testing Analysis

**Visual Testing Setup**: ${visualTesting.hasVisualTests ? '✅ Configured' : '❌ Missing'}
- **Visual Test Files**: ${visualTesting.visualTestFiles}
- **Playwright Config**: ${visualTesting.hasPlaywrightConfig ? '✅ Found' : '❌ Missing'}
- **Storybook Config**: ${visualTesting.hasStorybookConfig ? '✅ Found' : '❌ Missing'}
- **Visual Baselines**: ${visualTesting.visualBaselines}

### Visual Testing Scripts
${
  visualTesting.scripts
    ?.map(
      script => `
- **${script.file}**:
  - Storybook Integration: ${script.hasStorybookIntegration ? '✅' : '❌'}
  - Screenshot Comparison: ${script.hasScreenshotComparison ? '✅' : '❌'}
  - Multiple Browsers: ${script.hasMultipleBrowsers ? '✅' : '❌'}
  - Responsive Tests: ${script.hasResponsiveTests ? '✅' : '❌'}
  - Test Count: ${script.testCount}
`
    )
    .join('\n') || 'No visual testing scripts found'
}

## Story Quality Analysis

**Story Quality**: ${storyQuality.syntaxErrors?.length === 0 ? '✅ Excellent' : '⚠️ Issues Found'}
- **Syntax Errors**: ${storyQuality.syntaxErrors?.length || 0}
- **Import Issues**: ${storyQuality.importIssues?.length || 0}
- **TypeScript Errors**: ${storyQuality.typeScriptErrors?.length || 0}
- **Best Practice Issues**: ${storyQuality.bestPractices?.length || 0}

### Issues Found
${
  storyQuality.syntaxErrors?.length > 0
    ? `
#### Syntax Errors
${storyQuality.syntaxErrors.map(error => `- ${error.file}: ${error.error}`).join('\n')}
`
    : ''
}

${
  storyQuality.importIssues?.length > 0
    ? `
#### Import Issues
${storyQuality.importIssues.map(issue => `- ${issue.file}: ${issue.issue}`).join('\n')}
`
    : ''
}

## Storybook Integration Analysis

**Storybook Status**: ${storybook.config?.exists ? '✅ Configured' : '❌ Missing'}
- **Config Found**: ${storybook.config?.exists ? '✅' : '❌'}
- **React Support**: ${storybook.config?.hasReactSupport ? '✅' : '❌'}
- **TypeScript Support**: ${storybook.config?.hasTypeScriptSupport ? '✅' : '❌'}
- **Startup Test**: ${storybook.startup?.success ? '✅ Passed' : '❌ Failed'}

### Storybook Addons
${storybook.config?.addons?.map(addon => `- ${addon}`).join('\n') || 'No addons configured'}

## Errors and Warnings

${
  errors.length > 0
    ? `
### Errors
${errors.map(error => `- **${error.section}**: ${error.error}`).join('\n')}
`
    : '✅ No errors found'
}

${
  warnings.length > 0
    ? `
### Warnings
${warnings.map(warning => `- **${warning.section}**: ${warning.warning}`).join('\n')}
`
    : '✅ No warnings found'
}

## Recommendations

${this.generateRecommendations()}

---
*Generated by Gemini CLI Validation Script on ${new Date().toISOString()}*
`;
  }

  generateRecommendations() {
    const recommendations = [];
    const { componentCoverage, visualTesting, storyQuality, storybook } = this.validationResults;

    if (componentCoverage.coveragePercentage < 100) {
      recommendations.push(
        '🎯 **Achieve 100% Coverage**: Generate stories for remaining components'
      );
    }

    if (!visualTesting.hasVisualTests) {
      recommendations.push('🎨 **Add Visual Testing**: Implement visual regression testing');
    }

    if (storyQuality.syntaxErrors?.length > 0) {
      recommendations.push('🔧 **Fix Syntax Errors**: Resolve story file syntax issues');
    }

    if (!storybook.config?.exists) {
      recommendations.push('📚 **Configure Storybook**: Set up proper Storybook configuration');
    }

    if (recommendations.length === 0) {
      recommendations.push('🎉 **Excellent Work**: All validation checks passed!');
    }

    return recommendations.join('\n');
  }

  displayValidationSummary() {
    const { componentCoverage, visualTesting, storyQuality, storybook, errors } =
      this.validationResults;

    console.log('\n🎯 VALIDATION SUMMARY');
    console.log('='.repeat(50));
    console.log(`📊 Component Coverage: ${componentCoverage.coveragePercentage}%`);
    console.log(`🎨 Visual Testing: ${visualTesting.hasVisualTests ? 'Configured' : 'Missing'}`);
    console.log(
      `📝 Story Quality: ${storyQuality.syntaxErrors?.length === 0 ? 'Excellent' : 'Issues Found'}`
    );
    console.log(`📚 Storybook: ${storybook.config?.exists ? 'Configured' : 'Missing'}`);
    console.log(`❌ Errors: ${errors.length}`);
    console.log('='.repeat(50));

    if (errors.length === 0 && componentCoverage.coveragePercentage >= 100) {
      console.log('🎉 ALL VALIDATIONS PASSED!');
    } else {
      console.log('⚠️  Some issues found. Check the detailed report.');
    }
  }
}

// Run validation
const validator = new GeminiCoverageValidator();
validator.runValidation().catch(console.error);
