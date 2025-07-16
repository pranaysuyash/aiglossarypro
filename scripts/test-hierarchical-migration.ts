#!/usr/bin/env ts-node

/**
 * Test Script: Hierarchical Migration with Small Dataset
 *
 * This script tests the hierarchical migration with a small subset of data
 * to validate the migration logic before running on the full dataset.
 *
 * Features:
 * 1. Creates test data if none exists
 * 2. Runs migration on limited dataset
 * 3. Validates results
 * 4. Provides detailed reporting
 * 5. Can clean up test data after validation
 */

import * as dotenv from 'dotenv';

dotenv.config();

import crypto from 'node:crypto';
import { Pool } from '@neondatabase/serverless';
import * as schema from '@shared/enhancedSchema';
import { sql } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/neon-serverless';
import { HierarchicalMigrator } from './migrate-to-hierarchical';

interface TestTerm {
  id: string;
  name: string;
  slug: string;
  shortDefinition: string;
  fullDefinition: string;
  mainCategories: string[];
  subCategories: string[];
}

interface TestSection {
  id: string;
  termId: string;
  name: string;
  displayOrder: number;
  isCompleted: boolean;
}

interface TestSectionItem {
  id: string;
  sectionId: string;
  label: string;
  content: string;
  contentType: string;
  displayOrder: number;
  metadata: any;
}

interface TestResults {
  beforeMigration: {
    terms: number;
    sections: number;
    sectionItems: number;
    userProgress: number;
  };
  afterMigration: {
    terms: number;
    termSections: number;
    userProgress: number;
  };
  migrationResults: any[];
  validationResults: any;
}

class HierarchicalMigrationTester {
  private db: ReturnType<typeof drizzle>;
  private pool: Pool;
  private testDataPrefix: string = 'test_migration_';
  private testResults: TestResults = {
    beforeMigration: { terms: 0, sections: 0, sectionItems: 0, userProgress: 0 },
    afterMigration: { terms: 0, termSections: 0, userProgress: 0 },
    migrationResults: [],
    validationResults: {},
  };

  constructor() {
    if (!process.env.DATABASE_URL) {
      throw new Error('DATABASE_URL must be set');
    }

    this.pool = new Pool({ connectionString: process.env.DATABASE_URL });
    this.db = drizzle({ client: this.pool, schema });
  }

  /**
   * Main test function
   */
  async runTest(
    options: {
      useExistingData?: boolean;
      termCount?: number;
      sectionsPerTerm?: number;
      itemsPerSection?: number;
      cleanupAfter?: boolean;
    } = {}
  ): Promise<void> {
    const {
      useExistingData = false,
      termCount = 3,
      sectionsPerTerm = 5,
      itemsPerSection = 3,
      cleanupAfter = true,
    } = options;

    console.log('🧪 Starting hierarchical migration test...');
    console.log(`📊 Test Parameters:`);
    console.log(`  - Use existing data: ${useExistingData}`);
    console.log(`  - Terms to test: ${termCount}`);
    console.log(`  - Sections per term: ${sectionsPerTerm}`);
    console.log(`  - Items per section: ${itemsPerSection}`);
    console.log(`  - Cleanup after test: ${cleanupAfter}`);
    console.log('');

    try {
      // Step 1: Setup test data
      if (!useExistingData) {
        await this.createTestData(termCount, sectionsPerTerm, itemsPerSection);
      } else {
        await this.identifyExistingTestData(termCount);
      }

      // Step 2: Record before state
      await this.recordBeforeState();

      // Step 3: Run migration on test data
      await this.runMigrationTest();

      // Step 4: Record after state
      await this.recordAfterState();

      // Step 5: Validate migration results
      await this.validateMigrationResults();

      // Step 6: Generate detailed report
      await this.generateTestReport();

      // Step 7: Cleanup if requested
      if (cleanupAfter) {
        await this.cleanupTestData();
      }

      console.log('✅ Migration test completed successfully!');
    } catch (error) {
      console.error('❌ Migration test failed:', error);
      throw error;
    } finally {
      await this.cleanup();
    }
  }

  /**
   * Create test data for migration testing
   */
  private async createTestData(
    termCount: number,
    sectionsPerTerm: number,
    itemsPerSection: number
  ): Promise<void> {
    console.log('🏗️  Creating test data...');

    // Clean up any existing test data first
    await this.cleanupTestData();

    const testTerms: TestTerm[] = [];
    const testSections: TestSection[] = [];
    const testSectionItems: TestSectionItem[] = [];

    // Create test terms
    for (let i = 0; i < termCount; i++) {
      const termId = crypto.randomUUID();
      const termName = `${this.testDataPrefix}term_${i + 1}`;

      testTerms.push({
        id: termId,
        name: termName,
        slug: termName.toLowerCase().replace(/ /g, '-'),
        shortDefinition: `Short definition for ${termName}`,
        fullDefinition: `Full definition for ${termName}. This is a comprehensive explanation of the concept.`,
        mainCategories: [`Category ${i + 1}`, 'Machine Learning'],
        subCategories: [`Subcategory ${i + 1}`, 'Deep Learning'],
      });

      // Create sections for each term
      for (let j = 0; j < sectionsPerTerm; j++) {
        const sectionId = crypto.randomUUID();
        const sectionName = `Section ${j + 1}`;

        testSections.push({
          id: sectionId,
          termId: termId,
          name: sectionName,
          displayOrder: j,
          isCompleted: j < 2, // Mark first 2 sections as completed
        });

        // Create section items
        for (let k = 0; k < itemsPerSection; k++) {
          testSectionItems.push({
            id: crypto.randomUUID(),
            sectionId: sectionId,
            label: `Item ${k + 1}`,
            content: `Content for item ${k + 1} in ${sectionName} of ${termName}. This is sample content for testing.`,
            contentType: k === 0 ? 'markdown' : k === 1 ? 'code' : 'interactive',
            displayOrder: k,
            metadata: {
              isInteractive: k === 2,
              displayType: k === 2 ? 'interactive' : 'main',
              priority: 'medium',
            },
          });
        }
      }
    }

    // Insert test data into database
    await this.insertTestTerms(testTerms);
    await this.insertTestSections(testSections);
    await this.insertTestSectionItems(testSectionItems);
    await this.createTestUserProgress(testTerms, testSections);

    console.log(`✅ Created test data:`);
    console.log(`  - Terms: ${testTerms.length}`);
    console.log(`  - Sections: ${testSections.length}`);
    console.log(`  - Section Items: ${testSectionItems.length}`);
  }

  /**
   * Identify existing data to use for testing
   */
  private async identifyExistingTestData(limit: number): Promise<void> {
    console.log('🔍 Identifying existing data for testing...');

    const existingTerms = await this.db.execute(
      sql`
        SELECT et.id, et.name
        FROM enhanced_terms et
        WHERE et.name NOT LIKE ${`${this.testDataPrefix}%`}
        ORDER BY et.created_at ASC
        LIMIT ${limit}
      `
    );

    if (existingTerms.rows.length === 0) {
      throw new Error('No existing terms found for testing. Use createTestData option instead.');
    }

    console.log(`📋 Using ${existingTerms.rows.length} existing terms for testing:`);
    existingTerms.rows.forEach((term: any, index) => {
      console.log(`  ${index + 1}. ${term.name}`);
    });
  }

  /**
   * Record database state before migration
   */
  private async recordBeforeState(): Promise<void> {
    console.log('📊 Recording before migration state...');

    const [terms, sections, sectionItems, userProgress] = await Promise.all([
      this.db.execute(
        sql`SELECT COUNT(*) as count FROM enhanced_terms WHERE name LIKE ${`${this.testDataPrefix}%`}`
      ),
      this.db.execute(
        sql`SELECT COUNT(*) as count FROM sections s JOIN enhanced_terms et ON s.term_id = et.id WHERE et.name LIKE ${`${this.testDataPrefix}%`}`
      ),
      this.db.execute(
        sql`SELECT COUNT(*) as count FROM section_items si JOIN sections s ON si.section_id = s.id JOIN enhanced_terms et ON s.term_id = et.id WHERE et.name LIKE ${`${this.testDataPrefix}%`}`
      ),
      this.db.execute(
        sql`SELECT COUNT(*) as count FROM user_progress up JOIN enhanced_terms et ON up.term_id = et.id WHERE et.name LIKE ${`${this.testDataPrefix}%`}`
      ),
    ]);

    this.testResults.beforeMigration = {
      terms: parseInt(terms.rows[0].count as string),
      sections: parseInt(sections.rows[0].count as string),
      sectionItems: parseInt(sectionItems.rows[0].count as string),
      userProgress: parseInt(userProgress.rows[0].count as string),
    };

    console.log('📋 Before migration state:', this.testResults.beforeMigration);
  }

  /**
   * Run migration test on test data
   */
  private async runMigrationTest(): Promise<void> {
    console.log('🔄 Running migration test...');

    // Create a custom migrator for test data only
    const testMigrator = new TestMigrator();
    this.testResults.migrationResults = await testMigrator.migrateTestData(this.testDataPrefix);

    console.log(`✅ Migration completed for ${this.testResults.migrationResults.length} terms`);
  }

  /**
   * Record database state after migration
   */
  private async recordAfterState(): Promise<void> {
    console.log('📊 Recording after migration state...');

    const [terms, termSections, userProgress] = await Promise.all([
      this.db.execute(
        sql`SELECT COUNT(*) as count FROM enhanced_terms WHERE name LIKE ${`${this.testDataPrefix}%`}`
      ),
      this.db.execute(
        sql`SELECT COUNT(*) as count FROM term_sections ts JOIN enhanced_terms et ON ts.term_id = et.id WHERE et.name LIKE ${`${this.testDataPrefix}%`}`
      ),
      this.db.execute(
        sql`SELECT COUNT(*) as count FROM user_progress up JOIN enhanced_terms et ON up.term_id = et.id WHERE et.name LIKE ${`${this.testDataPrefix}%`}`
      ),
    ]);

    this.testResults.afterMigration = {
      terms: parseInt(terms.rows[0].count as string),
      termSections: parseInt(termSections.rows[0].count as string),
      userProgress: parseInt(userProgress.rows[0].count as string),
    };

    console.log('📋 After migration state:', this.testResults.afterMigration);
  }

  /**
   * Validate migration results
   */
  private async validateMigrationResults(): Promise<void> {
    console.log('🔍 Validating migration results...');

    const validation: any = {
      dataIntegrity: {
        termsPreserved:
          this.testResults.beforeMigration.terms === this.testResults.afterMigration.terms,
        userProgressPreserved: this.testResults.afterMigration.userProgress > 0,
        hierarchicalStructureCreated: this.testResults.afterMigration.termSections > 0,
      },
      contentMapping: {},
      userProgressMapping: {},
      errors: [],
    };

    // Check that hierarchical sections were created
    if (this.testResults.afterMigration.termSections === 0) {
      validation.errors.push('No hierarchical sections were created');
    }

    // Check specific term migration
    for (const result of this.testResults.migrationResults) {
      const termSections = await this.db.execute(
        sql`
          SELECT COUNT(*) as count, 
                 COUNT(CASE WHEN is_interactive = true THEN 1 END) as interactive_count
          FROM term_sections 
          WHERE term_id = ${result.termId}
        `
      );

      validation.contentMapping[result.termName] = {
        sectionsCreated: parseInt(termSections.rows[0].count as string),
        interactiveSections: parseInt(termSections.rows[0].interactive_count as string),
        expectedSections: result.hierarchicalSections,
      };
    }

    // Check user progress mapping
    const progressMapping = await this.db.execute(
      sql`
        SELECT up.term_id, COUNT(*) as progress_count
        FROM user_progress up
        JOIN enhanced_terms et ON up.term_id = et.id
        WHERE et.name LIKE ${`${this.testDataPrefix}%`}
        GROUP BY up.term_id
      `
    );

    progressMapping.rows.forEach((row: any) => {
      validation.userProgressMapping[row.term_id] = parseInt(row.progress_count as string);
    });

    this.testResults.validationResults = validation;

    // Report validation results
    console.log('📋 Validation Results:');
    console.log(`  ✅ Terms preserved: ${validation.dataIntegrity.termsPreserved}`);
    console.log(`  ✅ User progress preserved: ${validation.dataIntegrity.userProgressPreserved}`);
    console.log(
      `  ✅ Hierarchical structure created: ${validation.dataIntegrity.hierarchicalStructureCreated}`
    );

    if (validation.errors.length > 0) {
      console.log('  ❌ Errors found:');
      validation.errors.forEach((error: string) => console.log(`    - ${error}`));
    }
  }

  /**
   * Generate detailed test report
   */
  private async generateTestReport(): Promise<void> {
    const reportPath = `test-migration-report-${Date.now()}.json`;
    const fs = require('node:fs');

    const report = {
      testTimestamp: new Date().toISOString(),
      testDataPrefix: this.testDataPrefix,
      results: this.testResults,
      summary: {
        testsPassed: this.testResults.validationResults.errors.length === 0,
        totalErrors: this.testResults.validationResults.errors.length,
        dataIntegrityScore: this.calculateDataIntegrityScore(),
        recommendations: this.generateRecommendations(),
      },
    };

    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

    console.log('📄 Test report generated:');
    console.log(`  📁 File: ${reportPath}`);
    console.log(`  📊 Tests passed: ${report.summary.testsPassed}`);
    console.log(`  📈 Data integrity score: ${report.summary.dataIntegrityScore}%`);
  }

  /**
   * Calculate data integrity score
   */
  private calculateDataIntegrityScore(): number {
    const checks = [
      this.testResults.validationResults.dataIntegrity.termsPreserved,
      this.testResults.validationResults.dataIntegrity.userProgressPreserved,
      this.testResults.validationResults.dataIntegrity.hierarchicalStructureCreated,
      this.testResults.validationResults.errors.length === 0,
    ];

    const passedChecks = checks.filter(check => check).length;
    return Math.round((passedChecks / checks.length) * 100);
  }

  /**
   * Generate recommendations based on test results
   */
  private generateRecommendations(): string[] {
    const recommendations: string[] = [];

    if (!this.testResults.validationResults.dataIntegrity.termsPreserved) {
      recommendations.push('Review term preservation logic in migration');
    }

    if (!this.testResults.validationResults.dataIntegrity.userProgressPreserved) {
      recommendations.push('Check user progress migration mapping');
    }

    if (!this.testResults.validationResults.dataIntegrity.hierarchicalStructureCreated) {
      recommendations.push('Verify hierarchical section creation logic');
    }

    if (this.testResults.validationResults.errors.length > 0) {
      recommendations.push('Address reported errors before full migration');
    }

    if (recommendations.length === 0) {
      recommendations.push('Test results look good - ready for full migration');
    }

    return recommendations;
  }

  /**
   * Helper methods for test data creation
   */
  private async insertTestTerms(terms: TestTerm[]): Promise<void> {
    for (const term of terms) {
      await this.db.execute(
        sql`
          INSERT INTO enhanced_terms (id, name, slug, short_definition, full_definition, main_categories, sub_categories)
          VALUES (${term.id}, ${term.name}, ${term.slug}, ${term.shortDefinition}, ${term.fullDefinition}, 
                  ${term.mainCategories}, ${term.subCategories})
        `
      );
    }
  }

  private async insertTestSections(sections: TestSection[]): Promise<void> {
    for (const section of sections) {
      await this.db.execute(
        sql`
          INSERT INTO sections (id, term_id, name, display_order, is_completed)
          VALUES (${section.id}, ${section.termId}, ${section.name}, ${section.displayOrder}, ${section.isCompleted})
        `
      );
    }
  }

  private async insertTestSectionItems(items: TestSectionItem[]): Promise<void> {
    for (const item of items) {
      await this.db.execute(
        sql`
          INSERT INTO section_items (id, section_id, label, content, content_type, display_order, metadata)
          VALUES (${item.id}, ${item.sectionId}, ${item.label}, ${item.content}, ${item.contentType}, 
                  ${item.displayOrder}, ${JSON.stringify(item.metadata)})
        `
      );
    }
  }

  private async createTestUserProgress(terms: TestTerm[], sections: TestSection[]): Promise<void> {
    const testUserId = 'test_user_123';

    // Create some sample user progress
    for (const term of terms.slice(0, 2)) {
      // Only for first 2 terms
      const termSections = sections.filter(s => s.termId === term.id);

      for (const section of termSections.slice(0, 3)) {
        // Only for first 3 sections
        await this.db.execute(
          sql`
            INSERT INTO user_progress (user_id, term_id, section_id, status, completion_percentage)
            VALUES (${testUserId}, ${term.id}, ${section.id}, 'completed', ${Math.floor(Math.random() * 100)})
          `
        );
      }
    }
  }

  /**
   * Cleanup test data
   */
  private async cleanupTestData(): Promise<void> {
    console.log('🧹 Cleaning up test data...');

    // Delete in reverse order of dependencies
    await this.db.execute(
      sql`DELETE FROM user_progress WHERE term_id IN (SELECT id FROM enhanced_terms WHERE name LIKE ${`${this.testDataPrefix}%`})`
    );

    await this.db.execute(
      sql`DELETE FROM term_sections WHERE term_id IN (SELECT id FROM enhanced_terms WHERE name LIKE ${`${this.testDataPrefix}%`})`
    );

    await this.db.execute(
      sql`
        DELETE FROM section_items 
        WHERE section_id IN (
          SELECT s.id FROM sections s 
          JOIN enhanced_terms et ON s.term_id = et.id 
          WHERE et.name LIKE ${`${this.testDataPrefix}%`}
        )
      `
    );

    await this.db.execute(
      sql`DELETE FROM sections WHERE term_id IN (SELECT id FROM enhanced_terms WHERE name LIKE ${`${this.testDataPrefix}%`})`
    );

    await this.db.execute(
      sql`DELETE FROM enhanced_terms WHERE name LIKE ${`${this.testDataPrefix}%`}`
    );

    console.log('✅ Test data cleanup completed');
  }

  /**
   * Cleanup resources
   */
  private async cleanup(): Promise<void> {
    await this.pool.end();
  }
}

/**
 * Custom migrator for test data
 */
class TestMigrator extends HierarchicalMigrator {
  constructor() {
    super(false); // Not a dry run for test
  }

  async migrateTestData(testPrefix: string): Promise<any[]> {
    // Override the migration to only process test terms
    const terms = await this.getTestTerms(testPrefix);
    return await this.processBatches(terms);
  }

  private async getTestTerms(testPrefix: string): Promise<any[]> {
    const db = this.db;
    const terms = await db.execute(
      sql`
        SELECT 
          et.id,
          et.name,
          et.slug,
          et.main_categories,
          et.sub_categories,
          et.created_at,
          et.updated_at,
          COUNT(s.id) as section_count
        FROM enhanced_terms et
        LEFT JOIN sections s ON et.id = s.term_id
        WHERE et.name LIKE ${`${testPrefix}%`}
        GROUP BY et.id, et.name, et.slug, et.main_categories, et.sub_categories, et.created_at, et.updated_at
        ORDER BY et.created_at ASC
      `
    );

    return terms.rows;
  }
}

// CLI interface
async function main() {
  const args = process.argv.slice(2);

  const options = {
    useExistingData: args.includes('--use-existing'),
    termCount: parseInt(args.find(arg => arg.startsWith('--terms='))?.split('=')[1] || '3'),
    sectionsPerTerm: parseInt(
      args.find(arg => arg.startsWith('--sections='))?.split('=')[1] || '5'
    ),
    itemsPerSection: parseInt(args.find(arg => arg.startsWith('--items='))?.split('=')[1] || '3'),
    cleanupAfter: !args.includes('--no-cleanup'),
  };

  console.log('🧪 Hierarchical Migration Test Suite');
  console.log('====================================');

  const tester = new HierarchicalMigrationTester();
  await tester.runTest(options);
}

// Run if called directly
if (require.main === module) {
  main().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

export { HierarchicalMigrationTester };
