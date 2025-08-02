/**
 * Complete Terms Import - Create Enhanced Terms from Regular Terms
 */
import { sql } from 'drizzle-orm';
import { db } from './server/db';
import { enhancedTerms } from './shared/enhancedSchema';
import { terms } from './shared/schema';
async function completeTermsImport() {
    console.log('🚀 Completing enhanced terms migration...\n');
    try {
        // Check current status
        const [termCount, enhancedCount] = await Promise.all([
            db.select({ count: sql `count(*)` }).from(terms),
            db.select({ count: sql `count(*)` }).from(enhancedTerms),
        ]);
        console.log(`📄 Regular terms: ${termCount[0].count}`);
        console.log(`✨ Enhanced terms: ${enhancedCount[0].count}`);
        if (enhancedCount[0].count >= termCount[0].count) {
            console.log('✅ Enhanced terms migration already complete!');
            return;
        }
        // Get all terms that need migration
        console.log('\n📋 Creating enhanced terms from regular terms...');
        const allTerms = await db.select().from(terms);
        const enhancedData = allTerms.map(term => ({
            name: term.name,
            slug: term.name
                .toLowerCase()
                .replace(/[^a-z0-9]+/g, '-')
                .replace(/^-|-$/g, ''),
            shortDefinition: term.definition.substring(0, 200),
            fullDefinition: term.definition,
            difficultyLevel: 'intermediate',
            parseVersion: '2.0',
        }));
        // Insert in batches with conflict handling
        const batchSize = 100;
        let created = 0;
        for (let i = 0; i < enhancedData.length; i += batchSize) {
            const batch = enhancedData.slice(i, i + batchSize);
            try {
                await db.insert(enhancedTerms).values(batch).onConflictDoNothing();
                created += batch.length;
                if (i % 1000 === 0) {
                    console.log(`   📊 Progress: ${created}/${enhancedData.length} terms processed`);
                }
            }
            catch (_error) {
                console.log(`   ⚠️  Batch ${i}-${i + batch.length} had conflicts, skipping`);
            }
        }
        // Final verification
        const finalCount = await db.select({ count: sql `count(*)` }).from(enhancedTerms);
        console.log(`\n🎉 Enhanced terms migration completed!`);
        console.log(`✨ Total enhanced terms: ${finalCount[0].count}`);
        console.log(`📈 Migration rate: ${((finalCount[0].count / termCount[0].count) * 100).toFixed(1)}%`);
    }
    catch (error) {
        console.error('❌ Enhanced terms migration failed:', error);
        throw error;
    }
}
// Run the completion
completeTermsImport()
    .then(() => {
    console.log('\n✅ Terms import completion successful!');
    process.exit(0);
})
    .catch(error => {
    console.error('\n❌ Terms import completion failed:', error);
    process.exit(1);
});
