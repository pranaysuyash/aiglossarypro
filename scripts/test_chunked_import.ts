/**
 * Test script for chunked import functionality with large dataset
 */

import { chunkedImportLatestProcessedFile } from './server/chunkedImporter';

async function testChunkedImport() {
  console.log('🧪 Testing chunked import functionality with large dataset...');
  
  try {
    // Test with the chunked importer for the large 1.1GB file
    const result = await chunkedImportLatestProcessedFile({
      chunkSize: 500, // Process 500 items per chunk
      skipExisting: true,
      enableProgress: true
    });
    
    if (result.success) {
      console.log('✅ Chunked import test successful!');
      console.log(`📊 Results:`);
      console.log(`   📂 Categories: ${result.imported.categories}`);
      console.log(`   📋 Subcategories: ${result.imported.subcategories}`);
      console.log(`   📄 Terms: ${result.imported.terms}`);
      console.log(`   🔄 Chunks processed: ${result.chunksProcessed}`);
      console.log(`   ⏱️  Duration: ${(result.duration / 1000).toFixed(2)}s`);
      
      if (result.errors.length > 0) {
        console.log(`⚠️  Errors encountered: ${result.errors.length}`);
        console.log('First 5 errors:', result.errors.slice(0, 5));
      }
    } else {
      console.error('❌ Chunked import failed');
      console.error('Errors:', result.errors);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test
testChunkedImport().catch(console.error); 