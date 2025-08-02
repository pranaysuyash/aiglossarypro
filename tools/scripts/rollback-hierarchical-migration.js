#!/usr/bin/env ts-node
/**
 * Rollback Script: Revert Hierarchical Migration
 *
 * This script rolls back the hierarchical migration by restoring data from backup tables
 * and reverting the database to its previous flat structure state.
 *
 * Key operations:
 * 1. Identify backup tables from migration
 * 2. Restore sections, section_items, and user_progress from backups
 * 3. Clean up hierarchical structures (term_sections)
 * 4. Revert enhanced_terms metadata changes
 * 5. Verify rollback integrity
 */
import * as dotenv from 'dotenv';
dotenv.config();
import { Pool } from '@neondatabase/serverless';
import * as schema from '@shared/enhancedSchema';
import { sql } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/neon-serverless';
class HierarchicalRollback {
    db;
    pool;
    isDryRun = false;
    rollbackLog = [];
    logFile = `rollback-log-${Date.now()}.json`;
    constructor(dryRun = false) {
        if (!process.env.DATABASE_URL) {
            throw new Error('DATABASE_URL must be set');
        }
        this.pool = new Pool({ connectionString: process.env.DATABASE_URL });
        this.db = drizzle({ client: this.pool, schema });
        this.isDryRun = dryRun;
    }
    /**
     * Main rollback function
     */
    async rollback(backupTimestamp) {
        console.log('🔄 Starting hierarchical migration rollback...');
        console.log(`📊 Mode: ${this.isDryRun ? 'DRY RUN' : 'LIVE ROLLBACK'}`);
        try {
            // Step 1: Validate current state and find backup tables
            const backupTables = await this.findBackupTables(backupTimestamp);
            if (backupTables.length === 0) {
                throw new Error('No backup tables found. Cannot perform rollback.');
            }
            console.log(`📦 Found ${backupTables.length} backup tables`);
            // Step 2: Validate backup table integrity
            await this.validateBackupTables(backupTables);
            // Step 3: Create safety backup of current hierarchical state
            await this.createSafetyBackup();
            // Step 4: Restore from backup tables
            await this.restoreFromBackups(backupTables);
            // Step 5: Clean up hierarchical structures
            await this.cleanupHierarchicalStructures();
            // Step 6: Revert enhanced_terms metadata
            await this.revertTermsMetadata();
            // Step 7: Verify rollback integrity
            await this.verifyRollbackIntegrity();
            // Step 8: Update search indexes
            await this.updateSearchIndexes();
            console.log('✅ Rollback completed successfully!');
            console.log(`📁 Rollback log saved to: ${this.logFile}`);
        }
        catch (error) {
            console.error('❌ Rollback failed:', error);
            this.logError('Rollback failed', error);
            throw error;
        }
        finally {
            await this.cleanup();
        }
    }
    /**
     * Find backup tables from previous migration
     */
    async findBackupTables(backupTimestamp) {
        console.log('🔍 Searching for backup tables...');
        let timestampPattern = '%backup_%';
        if (backupTimestamp) {
            timestampPattern = `%backup_${backupTimestamp}%`;
        }
        const result = await this.db.execute(sql `
        SELECT table_name
        FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_name LIKE ${timestampPattern}
        AND (table_name LIKE '%sections_backup_%' 
             OR table_name LIKE '%section_items_backup_%' 
             OR table_name LIKE '%user_progress_backup_%')
        ORDER BY table_name
      `);
        const backupTables = [];
        for (const row of result.rows) {
            const tableName = row.table_name;
            // Determine original table name
            const originalTable = tableName.includes('sections_backup_')
                ? tableName.includes('section_items_backup_')
                    ? 'section_items'
                    : 'sections'
                : 'user_progress';
            // Get record count
            const countResult = await this.db.execute(sql `SELECT COUNT(*) as count FROM ${sql.identifier(tableName)}`);
            backupTables.push({
                tableName: originalTable,
                backupTableName: tableName,
                recordCount: parseInt(countResult.rows[0].count),
            });
            this.logInfo(`Found backup table: ${tableName} (${countResult.rows[0].count} records)`);
        }
        return backupTables;
    }
    /**
     * Validate backup table integrity
     */
    async validateBackupTables(backupTables) {
        console.log('🔍 Validating backup table integrity...');
        const requiredTables = ['sections', 'section_items', 'user_progress'];
        const foundTables = [...new Set(backupTables.map(bt => bt.tableName))];
        for (const requiredTable of requiredTables) {
            if (!foundTables.includes(requiredTable)) {
                this.logWarning(`Missing backup for table: ${requiredTable}`);
            }
        }
        // Check for orphaned section_items in backup
        const sectionsBackup = backupTables.find(bt => bt.tableName === 'sections');
        const sectionItemsBackup = backupTables.find(bt => bt.tableName === 'section_items');
        if (sectionsBackup && sectionItemsBackup) {
            const orphanedItems = await this.db.execute(sql `
          SELECT COUNT(*) as count
          FROM ${sql.identifier(sectionItemsBackup.backupTableName)} si
          LEFT JOIN ${sql.identifier(sectionsBackup.backupTableName)} s ON si.section_id = s.id
          WHERE s.id IS NULL
        `);
            if (parseInt(orphanedItems.rows[0].count) > 0) {
                this.logWarning(`Found ${orphanedItems.rows[0].count} orphaned section items in backup`);
            }
        }
        this.logInfo('Backup table validation completed');
    }
    /**
     * Create safety backup of current hierarchical state
     */
    async createSafetyBackup() {
        console.log('💾 Creating safety backup of current hierarchical state...');
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const hierarchicalTables = ['term_sections', 'enhanced_terms'];
        for (const table of hierarchicalTables) {
            const safetyBackupName = `${table}_rollback_safety_${timestamp}`;
            if (!this.isDryRun) {
                await this.db.execute(sql `CREATE TABLE ${sql.identifier(safetyBackupName)} AS SELECT * FROM ${sql.identifier(table)}`);
            }
            this.logInfo(`Created safety backup: ${safetyBackupName}`);
        }
    }
    /**
     * Restore tables from backup
     */
    async restoreFromBackups(backupTables) {
        console.log('📥 Restoring tables from backup...');
        for (const backup of backupTables) {
            console.log(`🔄 Restoring ${backup.tableName} from ${backup.backupTableName}...`);
            if (!this.isDryRun) {
                // Truncate current table
                await this.db.execute(sql `TRUNCATE TABLE ${sql.identifier(backup.tableName)} CASCADE`);
                // Restore from backup
                await this.db.execute(sql `INSERT INTO ${sql.identifier(backup.tableName)} SELECT * FROM ${sql.identifier(backup.backupTableName)}`);
                // Verify restoration
                const restoredCount = await this.db.execute(sql `SELECT COUNT(*) as count FROM ${sql.identifier(backup.tableName)}`);
                const restoredRecords = parseInt(restoredCount.rows[0].count);
                if (restoredRecords !== backup.recordCount) {
                    throw new Error(`Restoration verification failed for ${backup.tableName}: ` +
                        `expected ${backup.recordCount}, got ${restoredRecords}`);
                }
            }
            this.logSuccess(`Restored ${backup.tableName}: ${backup.recordCount} records`);
        }
    }
    /**
     * Clean up hierarchical structures
     */
    async cleanupHierarchicalStructures() {
        console.log('🧹 Cleaning up hierarchical structures...');
        const hierarchicalTables = [
            'term_sections',
            'interactive_elements',
            'term_relationships',
            'display_configs',
        ];
        for (const table of hierarchicalTables) {
            if (!this.isDryRun) {
                const deleteResult = await this.db.execute(sql `DELETE FROM ${sql.identifier(table)}`);
                this.logInfo(`Cleaned up ${table}: ${deleteResult.rowsAffected || 0} records removed`);
            }
            else {
                const countResult = await this.db.execute(sql `SELECT COUNT(*) as count FROM ${sql.identifier(table)}`);
                this.logInfo(`Would clean up ${table}: ${countResult.rows[0].count} records`);
            }
        }
    }
    /**
     * Revert enhanced_terms metadata changes
     */
    async revertTermsMetadata() {
        console.log('⚙️  Reverting enhanced_terms metadata...');
        if (!this.isDryRun) {
            await this.db.execute(sql `
          UPDATE enhanced_terms 
          SET 
            has_interactive_elements = false,
            has_code_examples = false,
            has_case_studies = false,
            parse_version = '1.0',
            updated_at = CURRENT_TIMESTAMP
        `);
        }
        this.logSuccess('Reverted enhanced_terms metadata');
    }
    /**
     * Verify rollback integrity
     */
    async verifyRollbackIntegrity() {
        console.log('🔍 Verifying rollback integrity...');
        // Check that flat structure is restored
        const sectionsCount = await this.db.execute(sql `SELECT COUNT(*) as count FROM sections`);
        const sectionItemsCount = await this.db.execute(sql `SELECT COUNT(*) as count FROM section_items`);
        const userProgressCount = await this.db.execute(sql `SELECT COUNT(*) as count FROM user_progress`);
        this.logInfo(`Restored flat structure:`);
        this.logInfo(`  - Sections: ${sectionsCount.rows[0].count}`);
        this.logInfo(`  - Section Items: ${sectionItemsCount.rows[0].count}`);
        this.logInfo(`  - User Progress: ${userProgressCount.rows[0].count}`);
        // Check that hierarchical structures are cleaned
        const termSectionsCount = await this.db.execute(sql `SELECT COUNT(*) as count FROM term_sections`);
        if (parseInt(termSectionsCount.rows[0].count) > 0) {
            this.logWarning(`term_sections table still contains ${termSectionsCount.rows[0].count} records`);
        }
        else {
            this.logSuccess('Hierarchical structures successfully cleaned');
        }
        // Check for orphaned data
        const orphanedSectionItems = await this.db.execute(sql `
        SELECT COUNT(*) as count
        FROM section_items si
        LEFT JOIN sections s ON si.section_id = s.id
        WHERE s.id IS NULL
      `);
        if (parseInt(orphanedSectionItems.rows[0].count) > 0) {
            this.logWarning(`Found ${orphanedSectionItems.rows[0].count} orphaned section items`);
        }
        const orphanedUserProgress = await this.db.execute(sql `
        SELECT COUNT(*) as count
        FROM user_progress up
        LEFT JOIN sections s ON up.section_id = s.id
        WHERE s.id IS NULL
      `);
        if (parseInt(orphanedUserProgress.rows[0].count) > 0) {
            this.logWarning(`Found ${orphanedUserProgress.rows[0].count} orphaned user progress records`);
        }
        await this.saveRollbackLog();
    }
    /**
     * Update search indexes after rollback
     */
    async updateSearchIndexes() {
        console.log('🔍 Updating search indexes...');
        if (!this.isDryRun) {
            await this.db.execute(sql `
          UPDATE enhanced_terms 
          SET search_text = COALESCE(
            name || ' ' || 
            COALESCE(short_definition, '') || ' ' || 
            COALESCE(full_definition, ''),
            name
          )
        `);
        }
        this.logSuccess('Search indexes updated');
    }
    /**
     * List available backup timestamps
     */
    async listBackups() {
        console.log('📦 Available backup timestamps:');
        const result = await this.db.execute(sql `
        SELECT DISTINCT 
          SUBSTRING(table_name FROM 'backup_(.*)') as timestamp
        FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_name LIKE '%backup_%'
        ORDER BY timestamp DESC
      `);
        if (result.rows.length === 0) {
            console.log('  No backup tables found.');
            return;
        }
        result.rows.forEach((row, index) => {
            console.log(`  ${index + 1}. ${row.timestamp}`);
        });
    }
    /**
     * Logging methods
     */
    logInfo(message, data) {
        this.rollbackLog.push({
            type: 'info',
            message,
            timestamp: new Date().toISOString(),
            data,
        });
        console.log(`ℹ️  ${message}`);
    }
    logSuccess(message, data) {
        this.rollbackLog.push({
            type: 'success',
            message,
            timestamp: new Date().toISOString(),
            data,
        });
        console.log(`✅ ${message}`);
    }
    logWarning(message, data) {
        this.rollbackLog.push({
            type: 'warning',
            message,
            timestamp: new Date().toISOString(),
            data,
        });
        console.warn(`⚠️  ${message}`);
    }
    logError(message, error) {
        this.rollbackLog.push({
            type: 'error',
            message,
            timestamp: new Date().toISOString(),
            data: { error: error.message, stack: error.stack },
        });
        console.error(`❌ ${message}`);
    }
    /**
     * Save rollback log to file
     */
    async saveRollbackLog() {
        const fs = require('node:fs');
        const logData = {
            timestamp: new Date().toISOString(),
            isDryRun: this.isDryRun,
            totalLogs: this.rollbackLog.length,
            successCount: this.rollbackLog.filter(l => l.type === 'success').length,
            warningCount: this.rollbackLog.filter(l => l.type === 'warning').length,
            errorCount: this.rollbackLog.filter(l => l.type === 'error').length,
            logs: this.rollbackLog,
        };
        fs.writeFileSync(this.logFile, JSON.stringify(logData, null, 2));
    }
    /**
     * Cleanup resources
     */
    async cleanup() {
        await this.pool.end();
    }
}
// CLI interface
async function main() {
    const args = process.argv.slice(2);
    const isDryRun = args.includes('--dry-run');
    const skipConfirmation = args.includes('--yes');
    const listBackups = args.includes('--list-backups');
    const timestampIndex = args.findIndex(arg => arg === '--timestamp');
    const backupTimestamp = timestampIndex !== -1 && args[timestampIndex + 1] ? args[timestampIndex + 1] : undefined;
    const rollback = new HierarchicalRollback(isDryRun);
    if (listBackups) {
        await rollback.listBackups();
        await rollback.cleanup();
        return;
    }
    if (!isDryRun && !skipConfirmation) {
        console.log('⚠️  This will perform a LIVE ROLLBACK of your hierarchical migration.');
        console.log('📦 This will restore data from backup tables and remove hierarchical structures.');
        console.log('🔒 A safety backup of current hierarchical state will be created.');
        console.log('💡 Use --dry-run to test without making changes.');
        console.log('📋 Use --list-backups to see available backup timestamps.');
        if (backupTimestamp) {
            console.log(`🕒 Using backup timestamp: ${backupTimestamp}`);
        }
        console.log('');
        const readline = require('node:readline').createInterface({
            input: process.stdin,
            output: process.stdout,
        });
        const answer = await new Promise(resolve => {
            readline.question('Do you want to continue with the rollback? (yes/no): ', resolve);
        });
        readline.close();
        if (answer.toLowerCase() !== 'yes') {
            console.log('❌ Rollback cancelled.');
            process.exit(0);
        }
    }
    await rollback.rollback(backupTimestamp);
}
// Run if called directly
if (require.main === module) {
    main().catch(error => {
        console.error('Fatal error:', error);
        process.exit(1);
    });
}
export { HierarchicalRollback };
