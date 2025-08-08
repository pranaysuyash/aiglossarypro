/**
 * Test script for batched import functionality
 */
import { importLatestProcessedFile } from './server/batchedImporter';
async function testBatchedImport() {
    console.log('🧪 Testing batched import functionality...');
    try {
        // Test with a smaller batch size for the large dataset
        const result = await importLatestProcessedFile({
            batchSize: 100, // Smaller batches for large dataset
            skipExisting: true,
            enableProgress: true,
        });
        if (result.success) {
            console.log('✅ Batched import test successful!');
            console.log(`📊 Results:`);
            console.log(`   📂 Categories: ${result.imported.categories}`);
            console.log(`   📋 Subcategories: ${result.imported.subcategories}`);
            console.log(`   📄 Terms: ${result.imported.terms}`);
            console.log(`   ⏱️  Duration: ${(result.duration / 1000).toFixed(2)}s`);
            if (result.errors.length > 0) {
                console.log(`⚠️  Errors encountered: ${result.errors.length}`);
                console.log('First 5 errors:', result.errors.slice(0, 5));
            }
        }
        else {
            console.error('❌ Batched import failed');
            console.error('Errors:', result.errors);
        }
    }
    catch (error) {
        console.error('❌ Test failed:', error);
    }
}
// Run the test
testBatchedImport().catch(console.error);
