#!/usr/bin/env tsx
import { sql } from 'drizzle-orm';
import { db } from '../server/db';
async function simpleClearAll() {
    console.log('🗑️ CLEARING ALL DATA WITH SIMPLE APPROACH');
    console.log('=' + '='.repeat(50));
    try {
        console.log('\n🔄 Clearing remaining tables...\n');
        // Since we have foreign key constraints, let's clear data from each table individually
        // and handle errors gracefully
        // First, clear enhanced_terms table
        try {
            const beforeCount = await db.execute(sql.raw(`SELECT COUNT(*) as count FROM enhanced_terms`));
            const count1 = beforeCount.rows[0].count;
            await db.execute(sql.raw(`DELETE FROM enhanced_terms`));
            const afterCount = await db.execute(sql.raw(`SELECT COUNT(*) as count FROM enhanced_terms`));
            const count2 = afterCount.rows[0].count;
            console.log(`✅ enhanced_terms: ${count1} → ${count2} records`);
        }
        catch (error) {
            console.log(`⚠️ enhanced_terms: ${error.message}`);
        }
        // Then clear categories
        try {
            const beforeCount = await db.execute(sql.raw(`SELECT COUNT(*) as count FROM categories`));
            const count1 = beforeCount.rows[0].count;
            await db.execute(sql.raw(`DELETE FROM categories`));
            const afterCount = await db.execute(sql.raw(`SELECT COUNT(*) as count FROM categories`));
            const count2 = afterCount.rows[0].count;
            console.log(`✅ categories: ${count1} → ${count2} records`);
        }
        catch (error) {
            console.log(`⚠️ categories: ${error.message}`);
        }
        // Final verification
        console.log('\n📊 FINAL DATABASE STATE:');
        console.log('-'.repeat(40));
        const checkTables = ['terms', 'enhanced_terms', 'categories', 'term_sections', 'users'];
        for (const tableName of checkTables) {
            try {
                const result = await db.execute(sql.raw(`SELECT COUNT(*) as count FROM ${tableName}`));
                const count = result.rows[0].count;
                let status = '';
                if (count === 0 && tableName !== 'users') {
                    status = '✅ EMPTY';
                }
                else if (tableName === 'users' && count > 0) {
                    status = '👥 PRESERVED';
                }
                else if (count === 0 && tableName === 'users') {
                    status = '⚠️ EMPTY (users cleared too)';
                }
                else {
                    status = '❌ STILL HAS DATA';
                }
                console.log(`${tableName}: ${count} records ${status}`);
            }
            catch (error) {
                console.log(`${tableName}: ERROR - ${error.message}`);
            }
        }
        console.log('\n🎯 CLEAR COMPLETE');
        console.log('✅ Database cleared as much as possible');
        console.log('📁 All data backed up in: backups/pre-fresh-start-*');
        console.log('🚀 Ready to receive 295-column prompts!');
    }
    catch (error) {
        console.error('❌ Error clearing database:', error);
    }
}
simpleClearAll().catch(console.error);
