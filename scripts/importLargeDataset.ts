import fs from 'node:fs';
import { importProcessedData } from './server/pythonProcessor';

async function importLargeDataset() {
  try {
    const largeFile = 'temp/processed_1750505973480.json';

    console.log('🔍 Checking for large processed dataset...');

    if (!fs.existsSync(largeFile)) {
      console.error(`❌ Large dataset file not found: ${largeFile}`);
      console.log('💡 To generate the dataset, run the Excel processor on data/aiml.xlsx');
      console.log('   This will process the 286MB Excel file with 10k+ terms');
      return;
    }

    console.log('📊 Loading large processed dataset...');
    const data = JSON.parse(fs.readFileSync(largeFile, 'utf8'));

    console.log(`📈 Dataset summary:`);
    console.log(`   📂 Categories: ${data.categories?.length || 0}`);
    console.log(`   📋 Subcategories: ${data.subcategories?.length || 0}`);
    console.log(`   📊 Terms: ${data.terms?.length || 0}`);

    if (data.terms?.length < 5000) {
      console.warn('⚠️  Dataset seems smaller than expected. Proceeding anyway...');
    }

    console.log('💾 Importing into database (this may take a few minutes)...');
    const startTime = Date.now();

    const result = await importProcessedData(data);

    const endTime = Date.now();
    const duration = (endTime - startTime) / 1000;

    if (result.success) {
      console.log('✅ Large dataset import successful!');
      console.log(`   ⏱️  Import time: ${duration.toFixed(2)} seconds`);
      console.log(`   📂 Categories imported: ${result.imported.categories}`);
      console.log(`   📋 Subcategories imported: ${result.imported.subcategories}`);
      console.log(`   📊 Terms imported: ${result.imported.terms}`);
      console.log('');
      console.log('🎉 Your AI Glossary now has the complete 10k+ term dataset!');
      console.log('💡 Large processed files remain in gitignore to keep repo size manageable');
    } else {
      console.error('❌ Import failed:', result.error);
    }
  } catch (error) {
    console.error('❌ Import error:', error);
    console.log('💡 If you encounter memory issues, try processing in chunks');
  }
}

// Also provide instructions for regenerating the dataset
console.log('🚀 AI Glossary Pro - Large Dataset Importer');
console.log('');
console.log('📋 This script imports the complete 10k+ term dataset from processed JSON');
console.log('🔒 Large files remain in gitignore to keep repository size manageable');
console.log('');

importLargeDataset();
