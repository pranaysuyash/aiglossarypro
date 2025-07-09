import path from 'node:path';
import { smartLoadExcelData } from './server/smartExcelLoader';

async function importRow1Data() {
  try {
    console.log('🎯 Starting row1.xlsx import...');

    const filePath = path.join(process.cwd(), 'data', 'row1.xlsx');

    // Import with chunking enabled and progress tracking
    await smartLoadExcelData(
      filePath,
      {
        chunkSize: 100, // Smaller chunks for stability
        enableProgress: true,
        resumeProcessing: false,
      },
      true
    ); // Force reprocess to ensure fresh data

    console.log('✅ row1.xlsx import completed successfully!');
  } catch (error) {
    console.error('❌ Error importing row1.xlsx:', error);
    process.exit(1);
  }
}

// Run the import
importRow1Data();
