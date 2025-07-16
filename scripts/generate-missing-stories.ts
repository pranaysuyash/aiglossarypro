#!/usr/bin/env tsx

/**
 * Automated Story Generation Script
 *
 * Scans the codebase for React components without Storybook stories
 * and generates boilerplate story files with proper structure.
 */

import fs from 'fs';
import { glob } from 'glob';
import path from 'path';

interface ComponentInfo {
  name: string;
  path: string;
  relativePath: string;
  category: string;
  hasExistingStory: boolean;
  exportType: 'default' | 'named' | 'both';
  props?: string[];
}

interface StoryTemplate {
  componentName: string;
  importPath: string;
  category: string;
  description: string;
  stories: StoryVariant[];
  needsDecorators: boolean;
}

interface StoryVariant {
  name: string;
  description: string;
  args?: Record<string, any>;
}

class StoryGenerator {
  private sourceDir = path.join(process.cwd(), 'client/src');
  private componentsFound: ComponentInfo[] = [];
  private storiesGenerated: number = 0;

  async run() {
    console.log('🔍 Scanning for React components without stories...\n');

    await this.scanComponents();
    await this.analyzeExistingStories();
    await this.generateMissingStories();

    console.log(`\n✅ Story generation complete!`);
    console.log(`📊 Generated ${this.storiesGenerated} new story files`);
    console.log(`📈 Estimated coverage increase: +${this.storiesGenerated} components`);
  }

  private async scanComponents() {
    // Find all React component files
    const componentPatterns = ['client/src/**/*.tsx', 'client/src/**/*.jsx'];

    for (const pattern of componentPatterns) {
      const files = await glob(pattern, {
        ignore: ['**/*.stories.*', '**/*.test.*', '**/*.spec.*'],
      });

      for (const file of files) {
        const componentInfo = await this.analyzeComponent(file);
        if (componentInfo) {
          this.componentsFound.push(componentInfo);
        }
      }
    }

    console.log(`📁 Found ${this.componentsFound.length} potential component files`);
  }

  private async analyzeComponent(filePath: string): Promise<ComponentInfo | null> {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      const relativePath = path.relative(this.sourceDir, filePath);

      // Check if it's a React component
      if (!this.isReactComponent(content)) {
        return null;
      }

      const componentName = this.extractComponentName(filePath, content);
      if (!componentName) {
        return null;
      }

      const category = this.categorizeComponent(relativePath);
      const exportType = this.detectExportType(content);
      const props = this.extractProps(content);

      return {
        name: componentName,
        path: filePath,
        relativePath,
        category,
        hasExistingStory: false, // Will be updated in analyzeExistingStories
        exportType,
        props,
      };
    } catch (error) {
      console.warn(`⚠️ Error analyzing ${filePath}: ${error.message}`);
      return null;
    }
  }

  private isReactComponent(content: string): boolean {
    return (
      (content.includes('import React') ||
        content.includes('import { ') ||
        content.includes('export function') ||
        content.includes('export const') ||
        content.includes('export default function') ||
        (content.includes('function') && content.includes('return (')) ||
        (content.includes('const') && content.includes('= (') && content.includes('return'))) &&
      (content.includes('JSX.Element') ||
        content.includes('ReactElement') ||
        content.includes('return (') ||
        content.includes('<div') ||
        content.includes('<span') ||
        content.includes('<section') ||
        content.includes('<main') ||
        content.includes('<article'))
    );
  }

  private extractComponentName(filePath: string, content: string): string | null {
    const filename = path.basename(filePath, path.extname(filePath));

    // Skip non-component files
    if (
      filename.includes('.') ||
      filename.toLowerCase().includes('util') ||
      filename.toLowerCase().includes('helper') ||
      filename.toLowerCase().includes('hook')
    ) {
      return null;
    }

    // Try to extract from export default
    const defaultExportMatch = content.match(/export\s+default\s+(?:function\s+)?(\w+)/);
    if (defaultExportMatch) {
      return defaultExportMatch[1];
    }

    // Try to extract from named export
    const namedExportMatch = content.match(/export\s+(?:const|function)\s+(\w+)/);
    if (namedExportMatch) {
      return namedExportMatch[1];
    }

    // Use filename if it starts with capital letter (React convention)
    if (filename[0] === filename[0].toUpperCase()) {
      return filename;
    }

    return null;
  }

  private categorizeComponent(relativePath: string): string {
    if (relativePath.includes('/pages/')) return 'Pages';
    if (relativePath.includes('/admin/')) return 'Admin';
    if (relativePath.includes('/landing/')) return 'Landing';
    if (relativePath.includes('/ui/')) return 'UI Components';
    if (relativePath.includes('/components/')) return 'Components';
    if (relativePath.includes('/interactive/')) return 'Interactive';
    if (relativePath.includes('/ar/') || relativePath.includes('/vr/')) return 'AR/VR';
    if (relativePath.includes('/accessibility/')) return 'Accessibility';
    if (relativePath.includes('/analytics/')) return 'Analytics';
    return 'Components';
  }

  private detectExportType(content: string): 'default' | 'named' | 'both' {
    const hasDefault = content.includes('export default');
    const hasNamed = content.match(/export\s+(?:const|function|class)/);

    if (hasDefault && hasNamed) return 'both';
    if (hasDefault) return 'default';
    if (hasNamed) return 'named';
    return 'default';
  }

  private extractProps(content: string): string[] {
    const props: string[] = [];

    // Try to extract from interface/type definitions
    const interfaceMatch = content.match(/interface\s+\w+Props\s*\{([^}]+)\}/s);
    if (interfaceMatch) {
      const propsContent = interfaceMatch[1];
      const propMatches = propsContent.match(/(\w+)(?:\?)?:/g);
      if (propMatches) {
        props.push(...propMatches.map(match => match.replace(/[?:]/g, '')));
      }
    }

    return props;
  }

  private async analyzeExistingStories() {
    const storyFiles = await glob('client/src/**/*.stories.*');
    const existingStoryComponents = new Set<string>();

    for (const storyFile of storyFiles) {
      const content = fs.readFileSync(storyFile, 'utf8');
      // Extract component name from story file
      const importMatch = content.match(/import.*\{.*(\w+).*\}.*from/);
      if (importMatch) {
        existingStoryComponents.add(importMatch[1]);
      }
    }

    // Update hasExistingStory flag
    this.componentsFound.forEach(component => {
      component.hasExistingStory = existingStoryComponents.has(component.name);
    });

    const missingStories = this.componentsFound.filter(c => !c.hasExistingStory);
    console.log(`📚 Found ${storyFiles.length} existing story files`);
    console.log(`❌ Found ${missingStories.length} components without stories`);

    // Group by category
    const byCategory = missingStories.reduce(
      (acc, comp) => {
        acc[comp.category] = (acc[comp.category] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    console.log('\n📊 Missing stories by category:');
    Object.entries(byCategory).forEach(([category, count]) => {
      console.log(`   ${category}: ${count} components`);
    });
  }

  private async generateMissingStories() {
    const missingStories = this.componentsFound.filter(c => !c.hasExistingStory);

    // Prioritize by category
    const priorityOrder = [
      'Pages',
      'UI Components',
      'Admin',
      'Landing',
      'Components',
      'Interactive',
      'Analytics',
      'AR/VR',
      'Accessibility',
    ];
    const prioritized = missingStories.sort((a, b) => {
      const aIndex = priorityOrder.indexOf(a.category);
      const bIndex = priorityOrder.indexOf(b.category);
      return (aIndex === -1 ? 999 : aIndex) - (bIndex === -1 ? 999 : bIndex);
    });

    console.log('\n🚀 Generating story files...');

    let generated = 0;
    for (const component of prioritized) {
      if (generated >= 50) {
        // Limit to 50 stories per run to avoid overwhelming
        console.log(`\n⚠️ Limited to 50 stories per run. Run script again to continue.`);
        break;
      }

      try {
        await this.generateStoryFile(component);
        generated++;
        if (generated % 10 === 0) {
          console.log(`   📝 Generated ${generated} stories...`);
        }
      } catch (error) {
        console.warn(`⚠️ Failed to generate story for ${component.name}: ${error.message}`);
      }
    }

    this.storiesGenerated = generated;
  }

  private async generateStoryFile(component: ComponentInfo) {
    const storyPath = component.path.replace(/\.(tsx|jsx)$/, '.stories.tsx');

    // Skip if story file already exists
    if (fs.existsSync(storyPath)) {
      return;
    }

    const template = this.createStoryTemplate(component);
    const storyContent = this.generateStoryContent(template);

    // Ensure directory exists
    const storyDir = path.dirname(storyPath);
    if (!fs.existsSync(storyDir)) {
      fs.mkdirSync(storyDir, { recursive: true });
    }

    fs.writeFileSync(storyPath, storyContent);
  }

  private createStoryTemplate(component: ComponentInfo): StoryTemplate {
    const needsDecorators = this.componentNeedsDecorators(component);
    const stories = this.generateStoryVariants(component);

    return {
      componentName: component.name,
      importPath: `./${component.name}`,
      category: component.category,
      description: this.generateDescription(component),
      stories,
      needsDecorators,
    };
  }

  private componentNeedsDecorators(component: ComponentInfo): boolean {
    // Components that likely need React Query or other providers
    return (
      component.name.toLowerCase().includes('dashboard') ||
      component.name.toLowerCase().includes('admin') ||
      component.name.toLowerCase().includes('api') ||
      component.name.toLowerCase().includes('data') ||
      component.category === 'Admin' ||
      component.category === 'Analytics'
    );
  }

  private generateStoryVariants(component: ComponentInfo): StoryVariant[] {
    const baseStories: StoryVariant[] = [
      {
        name: 'Default',
        description: `Default ${component.name} component state.`,
      },
      {
        name: 'Loading',
        description: `${component.name} in loading state.`,
        args: { loading: true, isLoading: true },
      },
      {
        name: 'Error',
        description: `${component.name} displaying error state.`,
        args: { error: 'Something went wrong', hasError: true },
      },
    ];

    // Add category-specific variants
    if (component.category === 'Pages') {
      baseStories.push({
        name: 'WithData',
        description: `${component.name} with sample data loaded.`,
      });
    }

    if (component.category === 'UI Components') {
      baseStories.push(
        {
          name: 'Disabled',
          description: `${component.name} in disabled state.`,
          args: { disabled: true },
        },
        {
          name: 'Small',
          description: `Small variant of ${component.name}.`,
          args: { size: 'small' },
        },
        {
          name: 'Large',
          description: `Large variant of ${component.name}.`,
          args: { size: 'large' },
        }
      );
    }

    if (component.category === 'Admin') {
      baseStories.push({
        name: 'WithPermissions',
        description: `${component.name} with full admin permissions.`,
      });
    }

    return baseStories;
  }

  private generateDescription(component: ComponentInfo): string {
    const categoryDescriptions = {
      Pages: 'Application page component',
      Admin: 'Administrative dashboard component',
      Landing: 'Landing page marketing component',
      'UI Components': 'Reusable UI component',
      Interactive: 'Interactive feature component',
      Analytics: 'Analytics and reporting component',
      'AR/VR': 'Augmented/Virtual reality component',
      Accessibility: 'Accessibility support component',
    };

    return categoryDescriptions[component.category] || 'Application component';
  }

  private generateStoryContent(template: StoryTemplate): string {
    const decorators = template.needsDecorators
      ? `
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: false, staleTime: Infinity },
  },
});`
      : '';

    const decoratorWrapper = template.needsDecorators
      ? `
  decorators: [
    (Story) => (
      <QueryClientProvider client={queryClient}>
        <Story />
      </QueryClientProvider>
    ),
  ],`
      : '';

    const stories = template.stories
      .map(
        story => `
export const ${story.name}: Story = {
  ${story.args ? `args: ${JSON.stringify(story.args, null, 2)},` : ''}
  parameters: {
    docs: {
      description: {
        story: '${story.description}'
      }
    }
  }
};`
      )
      .join('\n');

    return `import type { Meta, StoryObj } from '@storybook/react';${decorators}
import { ${template.componentName} } from '${template.importPath}';

const meta: Meta<typeof ${template.componentName}> = {
  title: '${template.category}/${template.componentName}',
  component: ${template.componentName},${decoratorWrapper}
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: '${template.description} for the AIGlossaryPro application.'
      }
    }
  },
  tags: ['autodocs'],
  argTypes: {
    // Add argTypes based on component props
  },
};

export default meta;
type Story = StoryObj<typeof meta>;
${stories}
`;
  }
}

// CLI interface
async function main() {
  const generator = new StoryGenerator();
  await generator.run();
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

export { StoryGenerator };
