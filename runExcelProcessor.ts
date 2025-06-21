import { smartLoadExcelData } from './server/smartExcelLoader';
import path from 'path';

async function runExcelProcessor() {
  try {
    console.log('🚀 Running Excel processor on large dataset...');
    
    const excelFilePath = path.join(process.cwd(), 'data', 'aiml.xlsx');
    
    console.log(`📁 Processing: ${excelFilePath}`);
    console.log('⚙️  Using chunked processing for 286MB file');
    console.log('');
    
    await smartLoadExcelData(excelFilePath, {
      chunkSize: 500,
      enableProgress: true,
      resumeProcessing: false
    }, true); // Force reprocess
    
    console.log('');
    console.log('✅ Excel processing complete!');
    console.log('🎉 Your database now has the full 10k+ term dataset');
    
  } catch (error) {
    console.error('❌ Excel processing failed:', error);
  }
}

runExcelProcessor();
