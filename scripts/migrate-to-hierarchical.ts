#!/usr/bin/env ts-node

/**
 * Migration Script: Transform Flat Section Structure to Hierarchical Structure
 * 
 * This script transforms the current flat section structure to the hierarchical 
 * structure based on the 42-section, 295-column architecture defined in 
 * complete_42_sections_config.ts.
 * 
 * Key operations:
 * 1. Read current terms and sections from database
 * 2. Map flat sections to hierarchical structure
 * 3. Preserve user progress data
 * 4. Create new hierarchical section structure
 * 5. Update enhanced_terms table with hierarchical metadata
 * 6. Maintain referential integrity
 */

import * as dotenv from "dotenv";
dotenv.config();

import { Pool } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import { eq, sql } from 'drizzle-orm';
import * as schema from '@shared/enhancedSchema';
import { COMPLETE_CONTENT_SECTIONS } from '../complete_42_sections_config';
import { contentOutline } from '@/data/content-outline';
import { ContentNode } from '@/types/content-structure';
import crypto from 'crypto';

// Types for migration
interface FlatSection {
  id: string;
  termId: string;
  name: string;
  displayOrder: number;
  isCompleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface FlatSectionItem {
  id: string;
  sectionId: string;
  label: string;
  content: string | null;
  contentType: string;
  displayOrder: number;
  metadata: any;
  isAiGenerated: boolean;
  verificationStatus: string;
  createdAt: Date;
  updatedAt: Date;
}

interface HierarchicalSection {
  termId: string;
  sectionName: string;
  sectionData: any;
  displayType: string;
  priority: number;
  isInteractive: boolean;
  path: string;
  parentPath?: string;
  depth: number;
}

interface UserProgressData {
  userId: string;
  termId: string;
  sectionId: string;
  status: string;
  completionPercentage: number;
  timeSpentMinutes: number;
  lastAccessedAt: Date | null;
  completedAt: Date | null;
}

class HierarchicalMigrator {
  private db: ReturnType<typeof drizzle>;
  private pool: Pool;
  private isDryRun: boolean = false;
  private batchSize: number = 100;
  private logFile: string = `migration-log-${Date.now()}.json`;
  private migrationLog: any[] = [];

  constructor(dryRun: boolean = false) {
    if (!process.env.DATABASE_URL) {
      throw new Error("DATABASE_URL must be set");
    }

    this.pool = new Pool({ connectionString: process.env.DATABASE_URL });
    this.db = drizzle({ client: this.pool, schema });
    this.isDryRun = dryRun;
  }

  /**
   * Main migration function
   */
  async migrate(): Promise<void> {
    console.log('🚀 Starting hierarchical migration...');
    console.log(`📊 Mode: ${this.isDryRun ? 'DRY RUN' : 'LIVE MIGRATION'}`);
    
    try {
      // Step 1: Validate current database state
      await this.validateDatabaseState();

      // Step 2: Backup current data
      await this.backupCurrentData();

      // Step 3: Get all terms and their current sections
      const terms = await this.getCurrentTerms();
      console.log(`📋 Found ${terms.length} terms to migrate`);

      // Step 4: Process terms in batches
      const results = await this.processBatches(terms);

      // Step 5: Verify migration integrity
      await this.verifyMigrationIntegrity(results);

      // Step 6: Update search indexes and metadata
      await this.updateSearchIndexes();

      console.log('✅ Migration completed successfully!');
      console.log(`📁 Migration log saved to: ${this.logFile}`);

    } catch (error) {
      console.error('❌ Migration failed:', error);
      throw error;
    } finally {
      await this.cleanup();
    }
  }

  /**
   * Validate database state before migration
   */
  private async validateDatabaseState(): Promise<void> {
    console.log('🔍 Validating database state...');

    // Check if required tables exist
    const requiredTables = ['enhanced_terms', 'sections', 'section_items', 'user_progress'];
    for (const table of requiredTables) {
      const result = await this.db.execute(
        sql`SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = ${table})`
      );
      if (!result.rows[0].exists) {
        throw new Error(`Required table '${table}' does not exist`);
      }
    }

    // Check for data integrity issues
    const orphanedSections = await this.db.execute(
      sql`SELECT COUNT(*) as count FROM sections s 
          LEFT JOIN enhanced_terms et ON s.term_id = et.id 
          WHERE et.id IS NULL`
    );

    if (orphanedSections.rows[0].count > 0) {
      console.warn(`⚠️  Found ${orphanedSections.rows[0].count} orphaned sections`);
    }

    console.log('✅ Database state validation passed');
  }

  /**
   * Backup current data before migration
   */
  private async backupCurrentData(): Promise<void> {
    console.log('💾 Creating backup of current data...');
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupTables = ['sections', 'section_items', 'user_progress'];

    for (const table of backupTables) {
      const backupTableName = `${table}_backup_${timestamp}`;
      
      if (!this.isDryRun) {
        await this.db.execute(
          sql`CREATE TABLE ${sql.identifier(backupTableName)} AS SELECT * FROM ${sql.identifier(table)}`
        );
      }
      
      console.log(`📦 Backed up ${table} to ${backupTableName}`);
    }
  }

  /**
   * Get all terms with their current sections
   */
  private async getCurrentTerms(): Promise<any[]> {
    console.log('📊 Fetching current terms and sections...');

    const terms = await this.db.execute(
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
        GROUP BY et.id, et.name, et.slug, et.main_categories, et.sub_categories, et.created_at, et.updated_at
        ORDER BY et.created_at ASC
      `
    );

    return terms.rows;
  }

  /**
   * Process terms in batches to avoid memory issues
   */
  private async processBatches(terms: any[]): Promise<any[]> {
    console.log(`⚙️  Processing ${terms.length} terms in batches of ${this.batchSize}...`);

    const results = [];
    for (let i = 0; i < terms.length; i += this.batchSize) {
      const batch = terms.slice(i, i + this.batchSize);
      console.log(`📦 Processing batch ${Math.floor(i / this.batchSize) + 1}/${Math.ceil(terms.length / this.batchSize)}`);
      
      const batchResults = await this.processBatch(batch);
      results.push(...batchResults);
      
      // Add small delay to avoid overwhelming the database
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    return results;
  }

  /**
   * Process a single batch of terms
   */
  private async processBatch(terms: any[]): Promise<any[]> {
    const results = [];

    for (const term of terms) {
      try {
        const result = await this.migrateTerm(term);
        results.push(result);
      } catch (error) {
        console.error(`❌ Failed to migrate term ${term.name}:`, error);
        this.migrationLog.push({
          type: 'error',
          termId: term.id,
          termName: term.name,
          error: error.message,
          timestamp: new Date().toISOString()
        });
      }
    }

    return results;
  }

  /**
   * Migrate a single term from flat to hierarchical structure
   */
  private async migrateTerm(term: any): Promise<any> {
    console.log(`🔄 Migrating term: ${term.name}`);

    // Get current sections for this term
    const currentSections = await this.getCurrentSections(term.id);
    const currentSectionItems = await this.getCurrentSectionItems(currentSections.map(s => s.id));
    const userProgress = await this.getUserProgress(term.id);

    // Create hierarchical structure
    const hierarchicalSections = this.createHierarchicalStructure(term, currentSections, currentSectionItems);

    // Preserve user progress data
    const migratedProgress = this.migrateUserProgress(userProgress, hierarchicalSections);

    if (!this.isDryRun) {
      // Delete old sections (cascade will handle section_items)
      await this.deleteOldSections(term.id);

      // Insert new hierarchical sections
      await this.insertHierarchicalSections(hierarchicalSections);

      // Update user progress with new structure
      await this.updateUserProgress(migratedProgress);

      // Update enhanced_terms with metadata
      await this.updateTermMetadata(term.id, hierarchicalSections);
    }

    this.migrationLog.push({
      type: 'success',
      termId: term.id,
      termName: term.name,
      oldSectionCount: currentSections.length,
      newSectionCount: hierarchicalSections.length,
      userProgressRecords: migratedProgress.length,
      timestamp: new Date().toISOString()
    });

    return {
      termId: term.id,
      termName: term.name,
      migrated: true,
      hierarchicalSections: hierarchicalSections.length
    };
  }

  /**
   * Get current sections for a term
   */
  private async getCurrentSections(termId: string): Promise<FlatSection[]> {
    const sections = await this.db.execute(
      sql`
        SELECT id, term_id, name, display_order, is_completed, created_at, updated_at
        FROM sections
        WHERE term_id = ${termId}
        ORDER BY display_order ASC
      `
    );

    return sections.rows as FlatSection[];
  }

  /**
   * Get current section items for sections
   */
  private async getCurrentSectionItems(sectionIds: string[]): Promise<FlatSectionItem[]> {
    if (sectionIds.length === 0) return [];

    const items = await this.db.execute(
      sql`
        SELECT id, section_id, label, content, content_type, display_order, metadata, 
               is_ai_generated, verification_status, created_at, updated_at
        FROM section_items
        WHERE section_id = ANY(${sectionIds})
        ORDER BY section_id, display_order ASC
      `
    );

    return items.rows as FlatSectionItem[];
  }

  /**
   * Get user progress for a term
   */
  private async getUserProgress(termId: string): Promise<UserProgressData[]> {
    const progress = await this.db.execute(
      sql`
        SELECT user_id, term_id, section_id, status, completion_percentage, 
               time_spent_minutes, last_accessed_at, completed_at
        FROM user_progress
        WHERE term_id = ${termId}
      `
    );

    return progress.rows as UserProgressData[];
  }

  /**
   * Create hierarchical structure from flat sections
   */
  private createHierarchicalStructure(
    term: any,
    currentSections: FlatSection[],
    currentSectionItems: FlatSectionItem[]
  ): HierarchicalSection[] {
    const hierarchicalSections: HierarchicalSection[] = [];

    // Create a map for quick lookups
    const sectionItemsBySection = new Map<string, FlatSectionItem[]>();
    currentSectionItems.forEach(item => {
      if (!sectionItemsBySection.has(item.sectionId)) {
        sectionItemsBySection.set(item.sectionId, []);
      }
      sectionItemsBySection.get(item.sectionId)?.push(item);
    });

    // Map content outline to hierarchical sections
    const processNode = (node: ContentNode, path: string, depth: number, parentPath?: string) => {
      // Find matching current section or create new one
      const existingSection = currentSections.find(s => 
        s.name.toLowerCase() === node.name.toLowerCase() ||
        s.name.toLowerCase().includes(node.name.toLowerCase())
      );

      const sectionItems = existingSection ? sectionItemsBySection.get(existingSection.id) || [] : [];

      // Create hierarchical section
      const hierarchicalSection: HierarchicalSection = {
        termId: term.id,
        sectionName: node.name,
        sectionData: {
          slug: node.slug,
          contentType: node.contentType || 'markdown',
          metadata: node.metadata || {},
          content: existingSection ? this.aggregateContent(sectionItems) : null,
          items: sectionItems.map(item => ({
            label: item.label,
            content: item.content,
            contentType: item.contentType,
            displayOrder: item.displayOrder,
            metadata: item.metadata,
            isAiGenerated: item.isAiGenerated,
            verificationStatus: item.verificationStatus
          }))
        },
        displayType: node.metadata?.displayType || 'main',
        priority: this.getPriority(node.metadata?.priority),
        isInteractive: node.metadata?.isInteractive || false,
        path: path,
        parentPath: parentPath,
        depth: depth
      };

      hierarchicalSections.push(hierarchicalSection);

      // Process subsections recursively
      if (node.subsections && node.subsections.length > 0) {
        node.subsections.forEach((subsection, index) => {
          const childPath = `${path}.${index}`;
          processNode(subsection, childPath, depth + 1, path);
        });
      }
    };

    // Process each section from the content outline
    contentOutline.sections.forEach((section, index) => {
      const rootPath = `${index}`;
      processNode(section, rootPath, 0);
    });

    return hierarchicalSections;
  }

  /**
   * Aggregate content from section items
   */
  private aggregateContent(items: FlatSectionItem[]): string {
    if (items.length === 0) return '';
    
    return items
      .sort((a, b) => a.displayOrder - b.displayOrder)
      .map(item => {
        if (item.content) {
          return `### ${item.label}\n\n${item.content}`;
        }
        return `### ${item.label}\n\n*Content not available*`;
      })
      .join('\n\n---\n\n');
  }

  /**
   * Get priority number from string
   */
  private getPriority(priority?: string): number {
    switch (priority?.toLowerCase()) {
      case 'high': return 1;
      case 'medium': return 5;
      case 'low': return 10;
      default: return 5;
    }
  }

  /**
   * Migrate user progress to new structure
   */
  private migrateUserProgress(
    oldProgress: UserProgressData[],
    newSections: HierarchicalSection[]
  ): UserProgressData[] {
    const migratedProgress: UserProgressData[] = [];

    // Create mapping from old sections to new hierarchical paths
    const pathMapping = new Map<string, string>();
    
    // For each old progress record, find the best matching new section
    oldProgress.forEach(progress => {
      const matchingSection = newSections.find(section => 
        section.sectionData.items?.some((item: any) => 
          item.originalSectionId === progress.sectionId
        )
      );

      if (matchingSection) {
        migratedProgress.push({
          ...progress,
          sectionId: matchingSection.path // Use path as new section identifier
        });
      }
    });

    return migratedProgress;
  }

  /**
   * Delete old flat sections
   */
  private async deleteOldSections(termId: string): Promise<void> {
    await this.db.execute(
      sql`DELETE FROM sections WHERE term_id = ${termId}`
    );
  }

  /**
   * Insert new hierarchical sections
   */
  private async insertHierarchicalSections(sections: HierarchicalSection[]): Promise<void> {
    for (const section of sections) {
      await this.db.execute(
        sql`
          INSERT INTO term_sections (term_id, section_name, section_data, display_type, priority, is_interactive)
          VALUES (${section.termId}, ${section.sectionName}, ${JSON.stringify(section.sectionData)}, 
                  ${section.displayType}, ${section.priority}, ${section.isInteractive})
        `
      );
    }
  }

  /**
   * Update user progress with new structure
   */
  private async updateUserProgress(progress: UserProgressData[]): Promise<void> {
    // Delete old progress records
    if (progress.length > 0) {
      const termIds = [...new Set(progress.map(p => p.termId))];
      for (const termId of termIds) {
        await this.db.execute(
          sql`DELETE FROM user_progress WHERE term_id = ${termId}`
        );
      }
    }

    // Insert new progress records
    for (const p of progress) {
      await this.db.execute(
        sql`
          INSERT INTO user_progress (user_id, term_id, section_id, status, completion_percentage, 
                                    time_spent_minutes, last_accessed_at, completed_at)
          VALUES (${p.userId}, ${p.termId}, ${p.sectionId}, ${p.status}, ${p.completionPercentage},
                  ${p.timeSpentMinutes}, ${p.lastAccessedAt}, ${p.completedAt})
        `
      );
    }
  }

  /**
   * Update enhanced_terms table with hierarchical metadata
   */
  private async updateTermMetadata(termId: string, sections: HierarchicalSection[]): Promise<void> {
    const hasInteractive = sections.some(s => s.isInteractive);
    const hasCodeExamples = sections.some(s => 
      s.sectionData.items?.some((item: any) => item.contentType === 'code')
    );
    const hasCaseStudies = sections.some(s => 
      s.sectionName.toLowerCase().includes('case study')
    );

    await this.db.execute(
      sql`
        UPDATE enhanced_terms 
        SET has_interactive_elements = ${hasInteractive},
            has_code_examples = ${hasCodeExamples},
            has_case_studies = ${hasCaseStudies},
            parse_version = '2.0',
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ${termId}
      `
    );
  }

  /**
   * Verify migration integrity
   */
  private async verifyMigrationIntegrity(results: any[]): Promise<void> {
    console.log('🔍 Verifying migration integrity...');

    const totalTerms = results.length;
    const successfulMigrations = results.filter(r => r.migrated).length;
    const failedMigrations = totalTerms - successfulMigrations;

    console.log(`📊 Migration Results:`);
    console.log(`  ✅ Successful: ${successfulMigrations}`);
    console.log(`  ❌ Failed: ${failedMigrations}`);
    console.log(`  📈 Success Rate: ${((successfulMigrations / totalTerms) * 100).toFixed(2)}%`);

    // Check for orphaned data
    const orphanedSections = await this.db.execute(
      sql`
        SELECT COUNT(*) as count 
        FROM term_sections ts 
        LEFT JOIN enhanced_terms et ON ts.term_id = et.id 
        WHERE et.id IS NULL
      `
    );

    if (orphanedSections.rows[0].count > 0) {
      console.warn(`⚠️  Found ${orphanedSections.rows[0].count} orphaned sections after migration`);
    }

    // Save migration log
    await this.saveMigrationLog();
  }

  /**
   * Update search indexes after migration
   */
  private async updateSearchIndexes(): Promise<void> {
    console.log('🔍 Updating search indexes...');

    if (!this.isDryRun) {
      await this.db.execute(
        sql`
          UPDATE enhanced_terms 
          SET search_text = (
            SELECT string_agg(ts.section_name || ' ' || COALESCE(ts.section_data::text, ''), ' ')
            FROM term_sections ts
            WHERE ts.term_id = enhanced_terms.id
          )
          WHERE EXISTS (
            SELECT 1 FROM term_sections ts WHERE ts.term_id = enhanced_terms.id
          )
        `
      );
    }

    console.log('✅ Search indexes updated');
  }

  /**
   * Save migration log to file
   */
  private async saveMigrationLog(): Promise<void> {
    const fs = require('fs');
    const logData = {
      timestamp: new Date().toISOString(),
      isDryRun: this.isDryRun,
      totalRecords: this.migrationLog.length,
      successCount: this.migrationLog.filter(l => l.type === 'success').length,
      errorCount: this.migrationLog.filter(l => l.type === 'error').length,
      logs: this.migrationLog
    };

    fs.writeFileSync(this.logFile, JSON.stringify(logData, null, 2));
  }

  /**
   * Cleanup resources
   */
  private async cleanup(): Promise<void> {
    await this.pool.end();
  }
}

// CLI interface
async function main() {
  const args = process.argv.slice(2);
  const isDryRun = args.includes('--dry-run');
  const skipConfirmation = args.includes('--yes');

  if (!isDryRun && !skipConfirmation) {
    console.log('⚠️  This will perform a LIVE migration of your database structure.');
    console.log('📦 Backup tables will be created automatically.');
    console.log('💡 Use --dry-run to test without making changes.');
    console.log('');
    
    const readline = require('readline').createInterface({
      input: process.stdin,
      output: process.stdout
    });

    const answer = await new Promise<string>((resolve) => {
      readline.question('Do you want to continue? (yes/no): ', resolve);
    });

    readline.close();

    if (answer.toLowerCase() !== 'yes') {
      console.log('❌ Migration cancelled.');
      process.exit(0);
    }
  }

  const migrator = new HierarchicalMigrator(isDryRun);
  await migrator.migrate();
}

// Run if called directly
if (require.main === module) {
  main().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

export { HierarchicalMigrator };