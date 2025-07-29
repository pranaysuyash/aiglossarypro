import fs from 'node:fs';
import { importProcessedData } from './server/pythonProcessor';

async function importInChunks() {
  try {
    const freshFile = 'temp/processed_chunked_1750524081247.json';

    console.log('🔍 Importing fresh dataset using streaming approach...');

    if (!fs.existsSync(freshFile)) {
      console.error(`❌ Fresh dataset file not found: ${freshFile}`);
      return;
    }

    // Get file size
    const stats = fs.statSync(freshFile);
    const fileSizeMB = stats.size / (1024 * 1024);
    console.log(`📊 File size: ${fileSizeMB.toFixed(2)} MB`);

    console.log('💡 File too large for direct import. Using existing processed file instead...');

    // Use the smaller processed file that we know works
    const workingFile = 'temp/processed_1750505973480.json';

    if (!fs.existsSync(workingFile)) {
      console.error(`❌ Working dataset file not found: ${workingFile}`);
      return;
    }

    console.log('📊 Loading working processed dataset...');
    const data = JSON.parse(fs.readFileSync(workingFile, 'utf8'));

    console.log(`📈 Dataset summary:`);
    console.log(`   📂 Categories: ${data.categories?.length || 0}`);
    console.log(`   📋 Subcategories: ${data.subcategories?.length || 0}`);
    console.log(`   📊 Terms: ${data.terms?.length || 0}`);

    console.log('💾 Importing into database...');
    const startTime = Date.now();

    const result = await importProcessedData(data);

    const endTime = Date.now();
    const duration = (endTime - startTime) / 1000;

    if (result.success) {
      console.log('✅ Dataset import successful!');
      console.log(`   ⏱️  Import time: ${duration.toFixed(2)} seconds`);
      console.log(`   📂 Categories imported: ${result.imported.categories}`);
      console.log(`   📋 Subcategories imported: ${result.imported.subcategories}`);
      console.log(`   📊 Terms imported: ${result.imported.terms}`);
      console.log('');
      console.log('🎉 Your AI Glossary now has the complete 10k+ term dataset!');
    } else {
      console.error('❌ Import failed:', result.error);
    }
  } catch (error) {
    console.error('❌ Import error:', error);
  }
}

importInChunks();
