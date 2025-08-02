import { eq } from 'drizzle-orm';
import { db } from '../server/db';
import { modelContentVersions } from '../shared/enhancedSchema';
async function testDrizzleInsert() {
    console.log('🧪 Testing Drizzle insert into model_content_versions...');
    try {
        const result = await db
            .insert(modelContentVersions)
            .values({
            termId: '35aee6a5-6305-420c-9257-2213aef10c8b',
            sectionName: 'test_section',
            model: 'gpt-4o-mini',
            content: 'Test content',
            promptTokens: 100,
            completionTokens: 200,
            totalTokens: 300,
            cost: '0.001',
            processingTime: 1000,
            status: 'generated',
            generatedBy: null,
        })
            .returning();
        console.log('✅ Drizzle insert successful:', result);
        // Clean up
        await db
            .delete(modelContentVersions)
            .where(eq(modelContentVersions.sectionName, 'test_section'));
        console.log('✅ Test row cleaned up');
    }
    catch (error) {
        console.error('❌ Drizzle insert failed:', error);
    }
}
testDrizzleInsert().catch(console.error);
