#!/usr/bin/env tsx

/**
 * ACTUAL FEATURE TESTING - NO DOCS DEPENDENCY
 * Tests what actually works vs what the docs claim
 */

import { exec } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { promisify } from 'node:util';

const execAsync = promisify(exec);

class ActualFeatureTester {
  private results: Response[] = [];

  async testDatabaseConnection() {
    console.log('\n🗄️ Testing Database Connection...');
    try {
      const { stdout } = await execAsync('npm run db:status');
      const isConnected = stdout.includes('Connected') || stdout.includes('✅');
      this.logResult('Database Connection', isConnected, stdout.slice(0, 200));
    } catch (error) {
      this.logResult('Database Connection', false, error);
    }
  }

  async testAPIEndpoints() {
    console.log('\n🔌 Testing API Endpoints...');

    // Test if the server responds to basic API calls
    const endpoints = ['categories', 'terms', 'search/suggestions', 'enhanced/terms'];

    for (const endpoint of endpoints) {
      try {
        const { stdout } = await execAsync(
          `curl -s -f http://localhost:3001/api/${endpoint} || echo "FAILED"`
        );
        const works = !stdout.includes('FAILED') && !stdout.includes('Error');
        this.logResult(`API: /api/${endpoint}`, works, stdout.slice(0, 100));
      } catch (_error) {
        this.logResult(`API: /api/${endpoint}`, false, 'Connection failed');
      }
    }
  }

  async testFrontendComponents() {
    console.log('\n⚛️ Testing Frontend Components...');

    const componentTests = [
      { name: 'Categories Page', file: 'client/src/pages/Categories.tsx' },
      { name: 'Search Bar', file: 'client/src/components/SearchBar.tsx' },
      { name: 'Term Card', file: 'client/src/components/TermCard.tsx' },
      { name: 'Learning Paths', file: 'client/src/pages/LearningPaths.tsx' },
      { name: 'Code Examples', file: 'client/src/components/CodeExamples.tsx' },
      { name: 'User Progress', file: 'client/src/components/ProgressTracker.tsx' },
    ];

    for (const test of componentTests) {
      const exists = fs.existsSync(path.join(process.cwd(), test.file));
      if (exists) {
        const content = fs.readFileSync(path.join(process.cwd(), test.file), 'utf8');
        const hasLogic =
          content.includes('useQuery') || content.includes('useState') || content.includes('fetch');
        this.logResult(
          test.name,
          hasLogic,
          `File exists with ${hasLogic ? 'logic' : 'basic structure'}`
        );
      } else {
        this.logResult(test.name, false, 'File does not exist');
      }
    }
  }

  async testDatabaseSchema() {
    console.log('\n📊 Testing Database Schema...');

    const schemaFile = 'shared/schema.ts';
    if (fs.existsSync(schemaFile)) {
      const content = fs.readFileSync(schemaFile, 'utf8');

      const tests = [
        { name: 'Categories Table', pattern: /categories.*pgTable/ },
        { name: 'Terms Table', pattern: /terms.*pgTable/ },
        { name: 'Users Table', pattern: /users.*pgTable/ },
        { name: 'Learning Paths Table', pattern: /learning_paths.*pgTable/ },
        { name: 'Code Examples Table', pattern: /code_examples.*pgTable/ },
        { name: 'User Progress Table', pattern: /userProgress.*pgTable/ },
        { name: 'Favorites Table', pattern: /favorites.*pgTable/ },
      ];

      for (const test of tests) {
        const exists = test.pattern.test(content);
        this.logResult(test.name, exists, exists ? 'Schema defined' : 'Schema missing');
      }
    } else {
      this.logResult('Database Schema', false, 'Schema file not found');
    }
  }

  async testAPIRoutes() {
    console.log('\n🛣️ Testing API Route Definitions...');

    const routeTests = [
      { name: 'Categories Routes', file: 'server/routes/categories.ts' },
      { name: 'Terms Routes', file: 'server/routes/terms.ts' },
      { name: 'Search Routes', file: 'server/routes/search.ts' },
      { name: 'Enhanced Routes', file: 'server/enhancedRoutes.ts' },
      { name: 'Learning Paths Routes', file: 'server/routes/learning-paths.ts' },
      { name: 'User Progress Routes', file: 'server/routes/user/progress.ts' },
      { name: 'Code Examples Routes', file: 'server/routes/code-examples.ts' },
    ];

    for (const test of routeTests) {
      const exists = fs.existsSync(test.file);
      if (exists) {
        const content = fs.readFileSync(test.file, 'utf8');
        const hasRoutes =
          content.includes('app.get') || content.includes('app.post') || content.includes('router');
        this.logResult(
          test.name,
          hasRoutes,
          hasRoutes ? 'Routes implemented' : 'File exists but no routes'
        );
      } else {
        this.logResult(test.name, false, 'Route file does not exist');
      }
    }
  }

  async testSearchFunctionality() {
    console.log('\n🔍 Testing Search Implementation...');

    // Check for search-related files and their implementation
    const searchTests = [
      { name: 'Basic Search Service', file: 'server/optimizedSearchService.ts' },
      { name: 'Enhanced Search Service', file: 'server/enhancedSearchService.ts' },
      { name: 'AI Search Service', file: 'server/aiService.ts' },
      { name: 'Search Frontend Component', file: 'client/src/components/SearchBar.tsx' },
    ];

    for (const test of searchTests) {
      const exists = fs.existsSync(test.file);
      if (exists) {
        const content = fs.readFileSync(test.file, 'utf8');
        const hasImplementation = content.includes('search') && content.length > 1000;
        this.logResult(
          test.name,
          hasImplementation,
          `${hasImplementation ? 'Implemented' : 'Basic only'} (${content.length} chars)`
        );
      } else {
        this.logResult(test.name, false, 'File not found');
      }
    }
  }

  async testCodeExamples() {
    console.log('\n💻 Testing Code Examples Implementation...');

    const codeTests = [
      { name: 'Code Block Component', file: 'client/src/components/interactive/CodeBlock.tsx' },
      { name: 'Interactive Demo', file: 'client/src/components/interactive/InteractiveDemo.tsx' },
      { name: 'Code Examples API', file: 'server/routes/code-examples.ts' },
      { name: 'Code Examples in Schema', pattern: /code.*examples/i },
    ];

    for (const test of codeTests) {
      if (test.file) {
        const exists = fs.existsSync(test.file);
        if (exists) {
          const content = fs.readFileSync(test.file, 'utf8');
          const hasLogic =
            content.includes('highlight') ||
            content.includes('prism') ||
            content.includes('monaco');
          this.logResult(
            test.name,
            hasLogic,
            hasLogic ? 'Has syntax highlighting' : 'Basic component only'
          );
        } else {
          this.logResult(test.name, false, 'Component not found');
        }
      } else if (test.pattern) {
        const schemaContent = fs.readFileSync('shared/schema.ts', 'utf8');
        const hasPattern = test.pattern.test(schemaContent);
        this.logResult(
          test.name,
          hasPattern,
          hasPattern ? 'Schema includes code examples' : 'No code examples schema'
        );
      }
    }
  }

  private logResult(feature: string, working: boolean, details: any) {
    const status = working ? '✅' : '❌';
    const detailStr =
      typeof details === 'object'
        ? JSON.stringify(details).slice(0, 100)
        : String(details).slice(0, 100);
    console.log(`${status} ${feature}: ${detailStr}`);

    this.results.push({
      feature,
      working,
      details: detailStr,
    });
  }

  async generateReport() {
    console.log('\n📋 ACTUAL FEATURE STATUS REPORT');
    console.log('=' * 50);

    const workingFeatures = this.results.filter(r => r.working);
    const brokenFeatures = this.results.filter(r => !r.working);

    console.log(`\n✅ WORKING FEATURES (${workingFeatures.length}):`);
    workingFeatures.forEach(f => console.log(`  - ${f.feature}`));

    console.log(`\n❌ NOT WORKING/MISSING (${brokenFeatures.length}):`);
    brokenFeatures.forEach(f => console.log(`  - ${f.feature}: ${f.details}`));

    const completionRate = Math.round((workingFeatures.length / this.results.length) * 100);
    console.log(`\n📊 OVERALL COMPLETION: ${completionRate}%`);

    // Write detailed report
    const reportData = {
      timestamp: new Date().toISOString(),
      totalFeatures: this.results.length,
      workingFeatures: workingFeatures.length,
      completionRate: completionRate,
      details: this.results,
    };

    fs.writeFileSync('actual-feature-test-results.json', JSON.stringify(reportData, null, 2));

    console.log('\n📄 Detailed report saved to: actual-feature-test-results.json');
  }

  async run() {
    console.log('🚀 STARTING ACTUAL FEATURE TESTING');
    console.log('Testing what actually works, not what docs claim...\n');

    await this.testDatabaseSchema();
    await this.testAPIRoutes();
    await this.testFrontendComponents();
    await this.testSearchFunctionality();
    await this.testCodeExamples();

    // Only test live endpoints if we can connect
    try {
      await execAsync('curl -s http://localhost:3001/api/health');
      await this.testAPIEndpoints();
    } catch {
      console.log('\n⚠️ Server not running - skipping live API tests');
    }

    await this.generateReport();
  }
}

// Run the test
new ActualFeatureTester().run().catch(console.error);
