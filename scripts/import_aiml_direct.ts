import path from 'node:path';
import { smartLoadExcelData } from './server/smartExcelLoader';

async function importAimlData() {
  try {
    console.log('🎯 Starting aiml.xlsx import...');

    const filePath = path.join(process.cwd(), 'data', 'aiml.xlsx');

    // Import with chunking enabled and progress tracking
    await smartLoadExcelData(
      filePath,
      {
        chunkSize: 500, // Larger chunks for large file
        enableProgress: true,
        resumeProcessing: false,
      },
      true
    ); // Force reprocess to handle large file

    console.log('✅ aiml.xlsx import completed successfully!');
  } catch (error) {
    console.error('❌ Error importing aiml.xlsx:', error);
    console.error('Stack trace:', error.stack);
  }
}

// Run the import
importAimlData();
