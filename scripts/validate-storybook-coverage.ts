#!/usr/bin/env tsx

/**
 * Storybook Coverage Validation Script
 * 
 * This script ensures 100% Storybook coverage by scanning for React components
 * and verifying each has a corresponding story file. This enforces complete
 * visual testing coverage as a prerequisite for the AI-driven audit workflow.
 * 
 * Usage:
 * - npm run validate:storybook-coverage
 * - tsx scripts/validate-storybook-coverage.ts
 * - tsx scripts/validate-storybook-coverage.ts --fix (generates missing story templates)
 */

import fs from 'fs';
import path from 'path';
import { glob } from 'glob';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '..');
const clientSrcPath = path.join(projectRoot, 'client', 'src');
const componentsPath = path.join(clientSrcPath, 'components');

interface ComponentInfo {
  name: string;
  filePath: string;
  relativePath: string;
  hasStory: boolean;
  storyPath?: string;
}

interface ValidationResult {
  totalComponents: number;
  componentsWithStories: number;
  componentsWithoutStories: ComponentInfo[];
  coveragePercentage: number;
  success: boolean;
}

class StorybookCoverageValidator {
  private components: ComponentInfo[] = [];
  private shouldFix: boolean = false;

  constructor() {
    this.shouldFix = process.argv.includes('--fix');
  }

  async validate(): Promise<ValidationResult> {
    console.log('🔍 Scanning for React components...');
    await this.scanComponents();
    
    console.log('📚 Checking for existing story files...');
    await this.checkStoryCoverage();
    
    const result = this.generateReport();
    
    if (this.shouldFix && result.componentsWithoutStories.length > 0) {
      console.log('🔧 Generating missing story templates...');
      await this.generateMissingStories(result.componentsWithoutStories);
    }
    
    return result;
  }

  private async scanComponents(): Promise<void> {
    try {
      // Find all React component files
      const componentFiles = await glob('**/*.{tsx,jsx}', {
        cwd: componentsPath,
        ignore: [
          '**/*.test.{tsx,jsx}',
          '**/*.spec.{tsx,jsx}',
          '**/*.stories.{tsx,jsx}',
          '**/index.{tsx,jsx}',
          '**/*.d.ts'
        ]
      });

      for (const file of componentFiles) {
        const filePath = path.join(componentsPath, file);
        const fileContent = fs.readFileSync(filePath, 'utf-8');
        
        // Check if this is actually a React component file
        if (this.isReactComponent(fileContent)) {
          const componentName = this.extractComponentName(file, fileContent);
          if (componentName) {
            this.components.push({
              name: componentName,
              filePath,
              relativePath: file,
              hasStory: false
            });
          }
        }
      }

      console.log(`   Found ${this.components.length} React components`);
    } catch (error) {
      throw new Error(`Failed to scan components: ${error.message}`);
    }
  }

  private isReactComponent(content: string): boolean {
    // Check for React component patterns
    const reactPatterns = [
      /export\s+(?:default\s+)?(?:function|const)\s+\w+/,
      /export\s+(?:default\s+)?\w+/,
      /React\.FC/,
      /FunctionComponent/,
      /JSX\.Element/,
      /<[A-Z]/  // JSX elements
    ];

    return reactPatterns.some(pattern => pattern.test(content)) &&
           (content.includes('import React') || content.includes('from \'react\'') || content.includes('JSX'));
  }

  private extractComponentName(filePath: string, content: string): string | null {
    // Try to extract component name from file name first
    const fileName = path.basename(filePath, path.extname(filePath));
    
    // Skip if it's clearly not a component name (lowercase, etc.)
    if (fileName[0] !== fileName[0].toUpperCase()) {
      return null;
    }

    // Verify the component is actually exported
    const exportPatterns = [
      new RegExp(`export\\s+default\\s+${fileName}`),
      new RegExp(`export\\s+default\\s+function\\s+${fileName}`),
      new RegExp(`export\\s+const\\s+${fileName}`),
      new RegExp(`export\\s+function\\s+${fileName}`),
      new RegExp(`export\\s+{[^}]*${fileName}[^}]*}`)
    ];

    const hasExport = exportPatterns.some(pattern => pattern.test(content));
    
    return hasExport ? fileName : null;
  }

  private async checkStoryCoverage(): Promise<void> {
    try {
      // Find all story files
      const storyFiles = await glob('**/*.stories.{tsx,jsx,ts,js}', {
        cwd: projectRoot
      });

      // Create a map of story files for quick lookup
      const storyMap = new Map<string, string>();
      
      for (const storyFile of storyFiles) {
        const storyName = this.extractStoryComponentName(storyFile);
        if (storyName) {
          storyMap.set(storyName.toLowerCase(), path.join(projectRoot, storyFile));
        }
      }

      // Check each component for story coverage
      for (const component of this.components) {
        const storyPath = storyMap.get(component.name.toLowerCase());
        if (storyPath) {
          component.hasStory = true;
          component.storyPath = storyPath;
        }
      }

      const withStories = this.components.filter(c => c.hasStory).length;
      console.log(`   Found stories for ${withStories}/${this.components.length} components`);
    } catch (error) {
      throw new Error(`Failed to check story coverage: ${error.message}`);
    }
  }

  private extractStoryComponentName(storyPath: string): string | null {
    const fileName = path.basename(storyPath);
    // Extract component name from story file name (e.g., "Button.stories.tsx" -> "Button")
    const match = fileName.match(/^([A-Z][a-zA-Z0-9]*)\.stories\./);
    return match ? match[1] : null;
  }

  private generateReport(): ValidationResult {
    const componentsWithoutStories = this.components.filter(c => !c.hasStory);
    const componentsWithStories = this.components.filter(c => c.hasStory);
    const coveragePercentage = this.components.length > 0 
      ? Math.round((componentsWithStories.length / this.components.length) * 100)
      : 100;

    console.log('\n📊 Coverage Report:');
    console.log(`   Total Components: ${this.components.length}`);
    console.log(`   With Stories: ${componentsWithStories.length}`);
    console.log(`   Without Stories: ${componentsWithoutStories.length}`);
    console.log(`   Coverage: ${coveragePercentage}%`);

    if (componentsWithoutStories.length > 0) {
      console.log('\n❌ Missing Stories:');
      componentsWithoutStories.forEach(component => {
        console.log(`   - ${component.name} (${component.relativePath})`);
      });
    }

    const success = componentsWithoutStories.length === 0;
    const status = success ? '✅ PASS' : '❌ FAIL';
    console.log(`\n${status}: Storybook coverage is ${coveragePercentage}%`);

    if (!success) {
      console.log('\n💡 To generate missing story templates, run:');
      console.log('   npm run validate:storybook-coverage -- --fix');
    }

    return {
      totalComponents: this.components.length,
      componentsWithStories: componentsWithStories.length,
      componentsWithoutStories,
      coveragePercentage,
      success
    };
  }

  private async generateMissingStories(missingComponents: ComponentInfo[]): Promise<void> {
    for (const component of missingComponents) {
      const storyTemplate = this.generateStoryTemplate(component);
      const storyPath = this.getStoryPath(component);
      
      // Ensure directory exists
      const storyDir = path.dirname(storyPath);
      if (!fs.existsSync(storyDir)) {
        fs.mkdirSync(storyDir, { recursive: true });
      }
      
      // Write story file
      fs.writeFileSync(storyPath, storyTemplate);
      console.log(`   ✅ Generated: ${path.relative(projectRoot, storyPath)}`);
    }
  }

  private getStoryPath(component: ComponentInfo): string {
    // Place story files in the same directory as the component
    const componentDir = path.dirname(component.filePath);
    return path.join(componentDir, `${component.name}.stories.tsx`);
  }

  private generateStoryTemplate(component: ComponentInfo): string {
    const importPath = `./${component.name}`;
    
    return `import type { Meta, StoryObj } from '@storybook/react';
import { ${component.name} } from '${importPath}';

const meta: Meta<typeof ${component.name}> = {
  title: 'Components/${component.name}',
  component: ${component.name},
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    // Add argTypes here for component props
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    // Add default props here
  },
};

export const WithProps: Story = {
  args: {
    // Add alternative props here
  },
};
`;
  }
}

// CLI Interface
async function main() {
  try {
    const validator = new StorybookCoverageValidator();
    const result = await validator.validate();
    
    // Exit with error code if coverage is not 100%
    if (!result.success) {
      process.exit(1);
    }
    
    console.log('\n🎉 All components have Storybook coverage!');
  } catch (error) {
    console.error('❌ Validation failed:', error.message);
    process.exit(1);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { StorybookCoverageValidator, ValidationResult, ComponentInfo };