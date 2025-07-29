/**
 * Test script for streaming import functionality
 */

import { streamingImportLatestProcessedFile } from './server/streamingImporter';

async function testStreamingImport() {
  console.log('🌊 Testing streaming import functionality...');

  try {
    // Test with a smaller batch size for the large dataset
    const result = await streamingImportLatestProcessedFile({
      batchSize: 50, // Very small batches for large dataset
      skipExisting: true,
      enableProgress: true,
    });

    if (result.success) {
      console.log('✅ Streaming import test successful!');
      console.log(`📊 Results:`);
      console.log(`   📂 Categories: ${result.imported.categories}`);
      console.log(`   📋 Subcategories: ${result.imported.subcategories}`);
      console.log(`   📄 Terms: ${result.imported.terms}`);
      console.log(`   ⏱️  Duration: ${(result.duration / 1000).toFixed(2)}s`);

      if (result.errors.length > 0) {
        console.log(`⚠️  Errors encountered: ${result.errors.length}`);
        console.log('First 5 errors:', result.errors.slice(0, 5));
      }
    } else {
      console.error('❌ Streaming import failed');
      console.error('Errors:', result.errors);
    }
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test
testStreamingImport().catch(console.error);
