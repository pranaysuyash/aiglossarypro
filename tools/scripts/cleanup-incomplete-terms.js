#!/usr/bin/env tsx
import { pool } from '../server/config/database';
import { logger } from '../server/config/logger';
async function cleanupIncompleteTerms() {
    console.log('🧹 Starting cleanup of incomplete terms...\n');
    try {
        // First, let's analyze what we have
        const analysisQuery = `
      SELECT 
        COUNT(*) as total_terms,
        COUNT(CASE WHEN definition IS NULL OR definition = '' THEN 1 END) as missing_definitions,
        COUNT(CASE WHEN short_definition IS NULL OR short_definition = '' THEN 1 END) as missing_short_definitions,
        COUNT(CASE WHEN category_id IS NULL THEN 1 END) as uncategorized
      FROM terms
    `;
        const analysis = await pool.query(analysisQuery);
        const stats = analysis.rows[0];
        console.log('📊 Current database status:');
        console.log(`   Total terms: ${stats.total_terms}`);
        console.log(`   Missing definitions: ${stats.missing_definitions} (${((stats.missing_definitions / stats.total_terms) * 100).toFixed(1)}%)`);
        console.log(`   Missing short definitions: ${stats.missing_short_definitions} (${((stats.missing_short_definitions / stats.total_terms) * 100).toFixed(1)}%)`);
        console.log(`   Uncategorized: ${stats.uncategorized} (${((stats.uncategorized / stats.total_terms) * 100).toFixed(1)}%)`);
        // Show sample of incomplete terms
        const sampleQuery = `
      SELECT id, name, 
        CASE WHEN definition IS NULL OR definition = '' THEN 'No definition' ELSE 'Has definition' END as def_status,
        CASE WHEN short_definition IS NULL OR short_definition = '' THEN 'No short def' ELSE 'Has short def' END as short_def_status
      FROM terms
      WHERE (definition IS NULL OR definition = '' 
        OR short_definition IS NULL OR short_definition = '')
      LIMIT 10
    `;
        const samples = await pool.query(sampleQuery);
        console.log('\n📋 Sample of incomplete terms:');
        samples.rows.forEach(term => {
            console.log(`   - ${term.name} (ID: ${term.id}) - ${term.def_status}, ${term.short_def_status}`);
        });
        // Ask for confirmation
        console.log('\n⚠️  WARNING: This will delete all terms with missing content!');
        console.log('   These terms can be recreated properly using the admin dashboard.');
        if (process.argv[2] !== '--confirm') {
            console.log('\n💡 To proceed with cleanup, run:');
            console.log('   npm run cleanup:terms -- --confirm');
            console.log('\n🔍 To see which terms would be deleted, run:');
            console.log('   npm run cleanup:terms -- --dry-run');
            return;
        }
        if (process.argv[2] === '--dry-run') {
            const dryRunQuery = `
        SELECT id, name, slug
        FROM terms
        WHERE definition IS NULL OR definition = '' 
          OR short_definition IS NULL OR short_definition = ''
        ORDER BY name
      `;
            const termsToDelete = await pool.query(dryRunQuery);
            console.log(`\n🔍 Would delete ${termsToDelete.rows.length} terms:`);
            termsToDelete.rows.forEach(term => {
                console.log(`   - ${term.name} (${term.slug})`);
            });
            return;
        }
        // Perform the cleanup
        console.log('\n🗑️  Deleting incomplete terms...');
        // Delete related data first (to maintain referential integrity)
        const deleteRelatedQuery = `
      WITH incomplete_terms AS (
        SELECT id FROM terms
        WHERE definition IS NULL OR definition = '' 
          OR short_definition IS NULL OR short_definition = ''
      )
      DELETE FROM user_progress WHERE term_id IN (SELECT id FROM incomplete_terms);
    `;
        await pool.query(deleteRelatedQuery);
        // Delete favorites
        const deleteFavoritesQuery = `
      WITH incomplete_terms AS (
        SELECT id FROM terms
        WHERE definition IS NULL OR definition = '' 
          OR short_definition IS NULL OR short_definition = ''
      )
      DELETE FROM user_favorites WHERE term_id IN (SELECT id FROM incomplete_terms);
    `;
        await pool.query(deleteFavoritesQuery);
        // Delete the incomplete terms
        const deleteQuery = `
      DELETE FROM terms
      WHERE definition IS NULL OR definition = '' 
        OR short_definition IS NULL OR short_definition = ''
      RETURNING id, name
    `;
        const result = await pool.query(deleteQuery);
        console.log(`\n✅ Successfully deleted ${result.rows.length} incomplete terms`);
        // Show updated statistics
        const finalAnalysis = await pool.query(analysisQuery);
        const finalStats = finalAnalysis.rows[0];
        console.log('\n📊 Updated database status:');
        console.log(`   Total terms: ${finalStats.total_terms}`);
        console.log(`   Missing definitions: ${finalStats.missing_definitions}`);
        console.log(`   Missing short definitions: ${finalStats.missing_short_definitions}`);
        console.log(`   Uncategorized: ${finalStats.uncategorized}`);
        console.log('\n✨ Cleanup completed successfully!');
        console.log('   Use the admin dashboard to create new, complete terms.');
        // Log the action
        logger.info('Cleanup of incomplete terms completed', {
            deletedCount: result.rows.length,
            remainingTerms: finalStats.total_terms,
        });
    }
    catch (error) {
        console.error('❌ Error during cleanup:', error);
        logger.error('Failed to cleanup incomplete terms', { error });
        process.exit(1);
    }
    finally {
        await pool.end();
    }
}
// Run the cleanup
cleanupIncompleteTerms();
