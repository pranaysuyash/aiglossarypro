#!/usr/bin/env tsx

/**
 * AI-DRIVEN AUDIT ORCHESTRATOR
 *
 * This script orchestrates the complete AI-driven end-to-end audit workflow:
 * 1. Validates Storybook coverage (prerequisite)
 * 2. Executes enhanced functional tests with step-by-step capture
 * 3. Consolidates all artifacts into organized directory structure
 * 4. Generates AI analysis prompt with context
 * 5. Executes AI analysis (if API key provided)
 * 6. Generates structured audit report
 *
 * Usage:
 * npm run audit:ai-driven
 * tsx scripts/run-ai-driven-audit.ts
 * tsx scripts/run-ai-driven-audit.ts --skip-coverage --full-capture --ai-analysis
 *
 * Flags:
 * --skip-coverage: Skip Storybook coverage validation
 * --full-capture: Enable all capture options (screenshots, video, accessibility)
 * --ai-analysis: Attempt to run AI analysis (requires API key)
 * --fix-stories: Auto-generate missing Storybook stories
 */

import chalk from 'chalk';
import { execSync, spawn } from 'child_process';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '..');

interface WorkflowConfig {
  skipCoverage: boolean;
  fullCapture: boolean;
  aiAnalysis: boolean;
  fixStories: boolean;
  outputDir: string;
  timestamp: string;
}

interface ArtifactSummary {
  screenshots: string[];
  videos: string[];
  accessibilityReports: string[];
  functionalReports: string[];
  coverageReport?: string;
}

interface AIDrivenAuditResult {
  timestamp: string;
  status: 'success' | 'partial' | 'failed';
  coverageValidation: {
    passed: boolean;
    coveragePercentage: number;
    missingStories: number;
  };
  functionalTesting: {
    totalUsers: number;
    totalActions: number;
    totalScreenshots: number;
    accessibilityViolations: number;
  };
  artifacts: ArtifactSummary;
  aiAnalysis?: {
    executed: boolean;
    promptGenerated: boolean;
    reportGenerated: boolean;
  };
  reportPath: string;
  duration: number;
}

class AIDrivenAuditOrchestrator {
  private config: WorkflowConfig;
  private startTime: number;
  private artifacts: ArtifactSummary = {
    screenshots: [],
    videos: [],
    accessibilityReports: [],
    functionalReports: [],
  };

  constructor() {
    this.startTime = Date.now();

    // Parse command line flags
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    this.config = {
      skipCoverage: process.argv.includes('--skip-coverage'),
      fullCapture: process.argv.includes('--full-capture'),
      aiAnalysis: process.argv.includes('--ai-analysis'),
      fixStories: process.argv.includes('--fix-stories'),
      outputDir: path.join(projectRoot, 'reports', 'ai-driven-audit', timestamp),
      timestamp,
    };
  }

  async execute(): Promise<AIDrivenAuditResult> {
    console.log(chalk.bold.blue('🤖 AI-Driven End-to-End Audit Workflow'));
    console.log(chalk.gray('=========================================\\n'));

    await this.initializeWorkspace();

    const result: AIDrivenAuditResult = {
      timestamp: this.config.timestamp,
      status: 'failed',
      coverageValidation: { passed: false, coveragePercentage: 0, missingStories: 0 },
      functionalTesting: {
        totalUsers: 0,
        totalActions: 0,
        totalScreenshots: 0,
        accessibilityViolations: 0,
      },
      artifacts: this.artifacts,
      reportPath: '',
      duration: 0,
    };

    try {
      // Step 1: Validate Storybook Coverage
      if (!this.config.skipCoverage) {
        result.coverageValidation = await this.validateStorybookCoverage();
      } else {
        console.log(chalk.yellow('⏭️ Skipping Storybook coverage validation'));
        result.coverageValidation = { passed: true, coveragePercentage: 100, missingStories: 0 };
      }

      // Step 2: Execute Enhanced Functional Tests
      result.functionalTesting = await this.executeEnhancedFunctionalTests();

      // Step 3: Consolidate Artifacts
      await this.consolidateArtifacts();

      // Step 4: Generate AI Analysis Prompt
      const promptGenerated = await this.generateAIAnalysisPrompt();

      // Step 5: Execute AI Analysis (if enabled)
      let aiAnalysisResult = { executed: false, promptGenerated, reportGenerated: false };
      if (this.config.aiAnalysis) {
        aiAnalysisResult = await this.executeAIAnalysis();
      }

      // Step 6: Generate Final Report
      result.reportPath = await this.generateFinalReport(result);
      result.aiAnalysis = aiAnalysisResult;
      result.duration = Date.now() - this.startTime;
      result.status = this.determineOverallStatus(result);

      console.log(chalk.bold.green('\\n✨ AI-Driven Audit Workflow Complete!'));
      console.log(chalk.cyan(`📄 Final Report: ${result.reportPath}`));
      console.log(chalk.gray(`⏱️ Duration: ${(result.duration / 1000).toFixed(2)}s`));

      return result;
    } catch (error) {
      console.error(chalk.red('❌ Workflow failed:'), error.message);
      result.duration = Date.now() - this.startTime;
      result.status = 'failed';
      throw error;
    }
  }

  private async initializeWorkspace(): Promise<void> {
    console.log(chalk.blue('📁 Initializing workspace...'));

    await fs.mkdir(this.config.outputDir, { recursive: true });
    await fs.mkdir(path.join(this.config.outputDir, 'consolidated-artifacts'), { recursive: true });
    await fs.mkdir(path.join(this.config.outputDir, 'ai-analysis'), { recursive: true });

    console.log(chalk.gray(`   Workspace: ${this.config.outputDir}`));
    console.log(chalk.gray(`   Full Capture: ${this.config.fullCapture}`));
    console.log(chalk.gray(`   AI Analysis: ${this.config.aiAnalysis}`));
  }

  private async validateStorybookCoverage(): Promise<{
    passed: boolean;
    coveragePercentage: number;
    missingStories: number;
  }> {
    console.log(chalk.blue('\\n📚 Step 1: Validating Storybook Coverage...'));

    try {
      const coverageScript = path.join(__dirname, 'validate-storybook-coverage.ts');
      const flags = this.config.fixStories ? '--fix' : '';

      const result = execSync(`tsx ${coverageScript} ${flags}`, {
        encoding: 'utf-8',
        cwd: projectRoot,
      });

      // Parse coverage results from output
      const coverageMatch = result.match(/Coverage: (\\d+)%/);
      const missingMatch = result.match(/Without Stories: (\\d+)/);

      const coveragePercentage = coverageMatch ? parseInt(coverageMatch[1]) : 0;
      const missingStories = missingMatch ? parseInt(missingMatch[1]) : 0;
      const passed = coveragePercentage === 100;

      if (passed) {
        console.log(chalk.green('✅ Storybook coverage validation passed'));
      } else {
        console.log(
          chalk.yellow(
            `⚠️ Storybook coverage: ${coveragePercentage}% (${missingStories} missing stories)`
          )
        );
        if (this.config.fixStories) {
          console.log(chalk.blue('🔧 Missing story templates generated'));
        }
      }

      return { passed, coveragePercentage, missingStories };
    } catch (error) {
      console.log(chalk.red('❌ Storybook coverage validation failed:', error.message));
      return { passed: false, coveragePercentage: 0, missingStories: 999 };
    }
  }

  private async executeEnhancedFunctionalTests(): Promise<{
    totalUsers: number;
    totalActions: number;
    totalScreenshots: number;
    accessibilityViolations: number;
  }> {
    console.log(chalk.blue('\\n🧪 Step 2: Executing Enhanced Functional Tests...'));

    try {
      const functionalScript = path.join(__dirname, 'enhanced-functional-audit.ts');

      // Build command with appropriate flags
      const flags = [];
      if (this.config.fullCapture) {
        flags.push('--capture-all', '--record-video', '--interact-all', '--accessibility');
      }

      console.log(chalk.gray(`   Running: tsx ${functionalScript} ${flags.join(' ')}`));

      const result = execSync(`tsx ${functionalScript} ${flags.join(' ')}`, {
        encoding: 'utf-8',
        cwd: projectRoot,
        timeout: 600000, // 10 minute timeout
      });

      // Parse results from output
      const actionsMatch = result.match(/Total Actions: (\\d+)/);
      const screenshotsMatch = result.match(/Screenshots: (\\d+)/);
      const a11yMatch = result.match(/A11y Issues: (\\d+)/);

      const totalUsers = 3; // Free, Premium, Admin
      const totalActions = actionsMatch ? parseInt(actionsMatch[1]) : 0;
      const totalScreenshots = screenshotsMatch ? parseInt(screenshotsMatch[1]) : 0;
      const accessibilityViolations = a11yMatch ? parseInt(a11yMatch[1]) : 0;

      console.log(chalk.green(`✅ Functional tests completed`));
      console.log(chalk.cyan(`   👥 Users tested: ${totalUsers}`));
      console.log(chalk.cyan(`   🎬 Actions performed: ${totalActions}`));
      console.log(chalk.cyan(`   📸 Screenshots captured: ${totalScreenshots}`));
      console.log(chalk.cyan(`   ♿ Accessibility issues: ${accessibilityViolations}`));

      return { totalUsers, totalActions, totalScreenshots, accessibilityViolations };
    } catch (error) {
      console.log(chalk.red('❌ Enhanced functional tests failed:', error.message));
      return { totalUsers: 0, totalActions: 0, totalScreenshots: 0, accessibilityViolations: 0 };
    }
  }

  private async consolidateArtifacts(): Promise<void> {
    console.log(chalk.blue('\\n📦 Step 3: Consolidating Artifacts...'));

    try {
      // Find all generated artifact directories
      const reportsDir = path.join(projectRoot, 'reports', 'ai-driven-audit');
      const directories = await fs.readdir(reportsDir);

      // Find the most recent artifacts (should be from current run)
      for (const dir of directories) {
        if (dir !== path.basename(this.config.outputDir)) {
          const artifactPath = path.join(reportsDir, dir);

          // Copy screenshots
          const screenshotsPath = path.join(artifactPath, 'screenshots');
          if (await this.directoryExists(screenshotsPath)) {
            const screenshots = await fs.readdir(screenshotsPath);
            for (const screenshot of screenshots) {
              const sourcePath = path.join(screenshotsPath, screenshot);
              const destPath = path.join(
                this.config.outputDir,
                'consolidated-artifacts',
                screenshot
              );
              await fs.copyFile(sourcePath, destPath);
              this.artifacts.screenshots.push(destPath);
            }
          }

          // Copy videos
          const videosPath = path.join(artifactPath, 'videos');
          if (await this.directoryExists(videosPath)) {
            const videos = await fs.readdir(videosPath);
            for (const video of videos) {
              const sourcePath = path.join(videosPath, video);
              const destPath = path.join(this.config.outputDir, 'consolidated-artifacts', video);
              await fs.copyFile(sourcePath, destPath);
              this.artifacts.videos.push(destPath);
            }
          }

          // Copy accessibility reports
          const a11yPath = path.join(artifactPath, 'accessibility');
          if (await this.directoryExists(a11yPath)) {
            const reports = await fs.readdir(a11yPath);
            for (const report of reports) {
              const sourcePath = path.join(a11yPath, report);
              const destPath = path.join(this.config.outputDir, 'consolidated-artifacts', report);
              await fs.copyFile(sourcePath, destPath);
              this.artifacts.accessibilityReports.push(destPath);
            }
          }

          // Copy functional reports
          const reportFiles = await fs.readdir(artifactPath);
          for (const file of reportFiles) {
            if (file.endsWith('.json')) {
              const sourcePath = path.join(artifactPath, file);
              const destPath = path.join(this.config.outputDir, 'consolidated-artifacts', file);
              await fs.copyFile(sourcePath, destPath);
              this.artifacts.functionalReports.push(destPath);
            }
          }
        }
      }

      console.log(chalk.green('✅ Artifacts consolidated'));
      console.log(chalk.cyan(`   📸 Screenshots: ${this.artifacts.screenshots.length}`));
      console.log(chalk.cyan(`   🎥 Videos: ${this.artifacts.videos.length}`));
      console.log(chalk.cyan(`   ♿ A11y Reports: ${this.artifacts.accessibilityReports.length}`));
      console.log(
        chalk.cyan(`   📊 Functional Reports: ${this.artifacts.functionalReports.length}`)
      );
    } catch (error) {
      console.log(chalk.yellow('⚠️ Artifact consolidation had issues:', error.message));
    }
  }

  private async generateAIAnalysisPrompt(): Promise<boolean> {
    console.log(chalk.blue('\\n🧠 Step 4: Generating AI Analysis Prompt...'));

    try {
      const promptPath = path.join(
        this.config.outputDir,
        'ai-analysis',
        'claude-analysis-prompt.md'
      );

      const prompt = `# AI-Driven UI/UX Quality Analysis

## Your Role
You are an expert QA engineer and UI/UX designer tasked with analyzing comprehensive visual and functional test artifacts from the AIGlossaryPro application. Your goal is to identify visual bugs, layout inconsistencies, accessibility issues, and UX anti-patterns.

## Analysis Instructions

### 1. Visual Analysis
Review all provided screenshots and videos to identify:
- **Visual Bugs**: Broken layouts, overlapping elements, incorrect styling
- **Responsive Design Issues**: Poor mobile/tablet adaptations, layout breaks
- **Consistency Problems**: Inconsistent spacing, typography, color usage
- **Performance Issues**: Layout shifts, loading states, slow interactions

### 2. Accessibility Analysis
Examine the accessibility reports and visual evidence for:
- **WCAG 2.1 AA Violations**: Color contrast, focus states, keyboard navigation
- **Screen Reader Issues**: Missing alt text, poor heading structure
- **Interactive Element Issues**: Unclear button states, missing labels
- **Navigation Problems**: Skip links, logical tab order

### 3. UX Pattern Analysis
Evaluate user flows and interactions for:
- **Anti-patterns**: Confusing navigation, unclear calls-to-action
- **Cognitive Load**: Overwhelming interfaces, unclear information hierarchy
- **User Journey Issues**: Broken flows, unexpected behaviors
- **Feature Discoverability**: Hidden or unclear functionality

### 4. Functional Verification
Cross-reference visual evidence with functional test logs to identify:
- **Functional Failures**: Features that don't work as expected
- **State Management Issues**: Inconsistent UI states
- **Error Handling**: Poor error messages or missing error states
- **Performance Bottlenecks**: Slow loading, unresponsive interactions

## Artifacts Available for Analysis

### Screenshots: ${this.artifacts.screenshots.length} files
${this.artifacts.screenshots.map(file => `- ${path.basename(file)}`).join('\\n')}

### Videos: ${this.artifacts.videos.length} files  
${this.artifacts.videos.map(file => `- ${path.basename(file)}`).join('\\n')}

### Accessibility Reports: ${this.artifacts.accessibilityReports.length} files
${this.artifacts.accessibilityReports.map(file => `- ${path.basename(file)}`).join('\\n')}

### Functional Test Reports: ${this.artifacts.functionalReports.length} files
${this.artifacts.functionalReports.map(file => `- ${path.basename(file)}`).join('\\n')}

## Expected Output Format

For each issue identified, provide:

\`\`\`json
{
  "issueId": "unique-identifier",
  "category": "visual|accessibility|ux|functional",
  "severity": "critical|high|medium|low", 
  "title": "Brief issue description",
  "description": "Detailed explanation of the problem",
  "evidence": ["screenshot-001.png", "video-flow-1.webm"],
  "location": "Page/component where issue occurs",
  "impact": "How this affects users",
  "recommendation": "Specific fix or improvement suggestion",
  "wcagViolation": "WCAG criterion if applicable",
  "priority": "1-5 scale for fixing order"
}
\`\`\`

## Analysis Context

- **Application**: AIGlossaryPro - AI/ML terminology glossary
- **User Types**: Free users, Premium users, Admin users
- **Key Features**: Search, content browsing, authentication, admin dashboard
- **Target Browsers**: Chrome, Firefox, Safari (desktop + mobile)
- **Accessibility Target**: WCAG 2.1 Level AA compliance

## Additional Guidelines

1. **Be Specific**: Reference exact screenshots/videos when identifying issues
2. **Prioritize Impact**: Focus on issues that affect core user journeys
3. **Consider Context**: Account for different user types and their expected experiences
4. **Provide Actionable Feedback**: Include specific, implementable recommendations
5. **Cross-Reference**: Connect visual evidence with functional test results when possible

Begin your analysis with a high-level summary, then proceed with detailed issue identification and recommendations.
`;

      await fs.writeFile(promptPath, prompt);

      console.log(chalk.green('✅ AI analysis prompt generated'));
      console.log(chalk.gray(`   📄 Prompt file: ${promptPath}`));

      return true;
    } catch (error) {
      console.log(chalk.red('❌ Failed to generate AI analysis prompt:', error.message));
      return false;
    }
  }

  private async executeAIAnalysis(): Promise<{
    executed: boolean;
    promptGenerated: boolean;
    reportGenerated: boolean;
  }> {
    console.log(chalk.blue('\\n🤖 Step 5: Executing AI Analysis...'));

    // For now, this is a placeholder for future AI integration
    // In a real implementation, this would:
    // 1. Read the generated prompt
    // 2. Gather all artifacts
    // 3. Send to AI API (Claude, GPT-4, etc.)
    // 4. Parse the response
    // 5. Generate structured findings

    console.log(chalk.yellow('⚠️ AI Analysis integration not yet implemented'));
    console.log(chalk.gray('   This would integrate with Claude/GPT-4 APIs to analyze artifacts'));
    console.log(chalk.gray('   For now, the prompt has been generated for manual analysis'));

    return {
      executed: false,
      promptGenerated: true,
      reportGenerated: false,
    };
  }

  private async generateFinalReport(result: AIDrivenAuditResult): Promise<string> {
    console.log(chalk.blue('\\n📊 Step 6: Generating Final Report...'));

    const reportPath = path.join(this.config.outputDir, 'ai-driven-audit-report.json');

    const report = {
      ...result,
      configuration: this.config,
      workflow: {
        steps: [
          'Storybook Coverage Validation',
          'Enhanced Functional Testing',
          'Artifact Consolidation',
          'AI Analysis Prompt Generation',
          'AI Analysis Execution',
          'Report Generation',
        ],
        completedSteps: result.status === 'success' ? 6 : 4,
      },
      nextSteps: [
        'Review generated AI analysis prompt',
        'Manually run AI analysis with provided artifacts',
        'Implement fixes based on findings',
        'Re-run audit to verify improvements',
      ],
    };

    await fs.writeFile(reportPath, JSON.stringify(report, null, 2));

    // Also generate a human-readable summary
    const summaryPath = path.join(this.config.outputDir, 'AUDIT_SUMMARY.md');
    const summary = this.generateMarkdownSummary(result);
    await fs.writeFile(summaryPath, summary);

    console.log(chalk.green('✅ Final report generated'));
    console.log(chalk.gray(`   📄 JSON Report: ${reportPath}`));
    console.log(chalk.gray(`   📄 Summary: ${summaryPath}`));

    return reportPath;
  }

  private generateMarkdownSummary(result: AIDrivenAuditResult): string {
    const status =
      result.status === 'success'
        ? '✅ SUCCESS'
        : result.status === 'partial'
          ? '⚠️ PARTIAL'
          : '❌ FAILED';

    return `# AI-Driven Audit Report Summary

**Status**: ${status}  
**Timestamp**: ${result.timestamp}  
**Duration**: ${(result.duration / 1000).toFixed(2)}s  

## Storybook Coverage
- **Passed**: ${result.coverageValidation.passed ? '✅' : '❌'}
- **Coverage**: ${result.coverageValidation.coveragePercentage}%
- **Missing Stories**: ${result.coverageValidation.missingStories}

## Functional Testing
- **Users Tested**: ${result.functionalTesting.totalUsers}
- **Actions Performed**: ${result.functionalTesting.totalActions}
- **Screenshots Captured**: ${result.functionalTesting.totalScreenshots}  
- **Accessibility Violations**: ${result.functionalTesting.accessibilityViolations}

## Generated Artifacts
- **Screenshots**: ${result.artifacts.screenshots.length}
- **Videos**: ${result.artifacts.videos.length}
- **Accessibility Reports**: ${result.artifacts.accessibilityReports.length}
- **Functional Reports**: ${result.artifacts.functionalReports.length}

## AI Analysis
- **Prompt Generated**: ${result.aiAnalysis?.promptGenerated ? '✅' : '❌'}
- **Analysis Executed**: ${result.aiAnalysis?.executed ? '✅' : '❌'}
- **Report Generated**: ${result.aiAnalysis?.reportGenerated ? '✅' : '❌'}

## Next Steps
1. Review the generated AI analysis prompt in \`ai-analysis/claude-analysis-prompt.md\`
2. Use the prompt with Claude/GPT-4 along with the consolidated artifacts
3. Implement fixes based on AI recommendations
4. Re-run the audit to verify improvements

## Files Generated
- \`ai-driven-audit-report.json\` - Complete JSON report
- \`ai-analysis/claude-analysis-prompt.md\` - AI analysis prompt
- \`consolidated-artifacts/\` - All screenshots, videos, and reports
`;
  }

  private determineOverallStatus(result: AIDrivenAuditResult): 'success' | 'partial' | 'failed' {
    if (!result.coverageValidation.passed) {
      return 'partial';
    }

    if (result.functionalTesting.totalActions === 0) {
      return 'failed';
    }

    if (result.functionalTesting.accessibilityViolations > 20) {
      return 'partial';
    }

    return 'success';
  }

  private async directoryExists(dirPath: string): Promise<boolean> {
    try {
      const stat = await fs.stat(dirPath);
      return stat.isDirectory();
    } catch {
      return false;
    }
  }
}

// CLI Interface
async function main() {
  try {
    const orchestrator = new AIDrivenAuditOrchestrator();
    const result = await orchestrator.execute();

    // Exit with appropriate code
    if (result.status === 'failed') {
      process.exit(1);
    } else if (result.status === 'partial') {
      process.exit(2); // Partial success
    }

    process.exit(0); // Success
  } catch (error) {
    console.error(chalk.red('💥 AI-Driven Audit Orchestrator failed:'), error);
    process.exit(1);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { AIDrivenAuditOrchestrator, type AIDrivenAuditResult, type WorkflowConfig };
