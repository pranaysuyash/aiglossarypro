import fs from 'node:fs';
import { importProcessedData } from './server/pythonProcessor';
async function importFreshDataset() {
    try {
        const freshFile = 'temp/processed_chunked_1750524081247.json';
        console.log('🔍 Importing fresh dataset from Excel processor...');
        if (!fs.existsSync(freshFile)) {
            console.error(`❌ Fresh dataset file not found: ${freshFile}`);
            return;
        }
        console.log('📊 Loading fresh processed dataset...');
        const data = JSON.parse(fs.readFileSync(freshFile, 'utf8'));
        console.log(`�� Fresh dataset summary:`);
        console.log(`   📂 Categories: ${data.categories?.length || 0}`);
        console.log(`   📋 Subcategories: ${data.subcategories?.length || 0}`);
        console.log(`   📊 Terms: ${data.terms?.length || 0}`);
        console.log('💾 Importing into database...');
        const startTime = Date.now();
        const result = await importProcessedData(data);
        const endTime = Date.now();
        const duration = (endTime - startTime) / 1000;
        if (result.success) {
            console.log('✅ Fresh dataset import successful!');
            console.log(`   ⏱️  Import time: ${duration.toFixed(2)} seconds`);
            console.log(`   📂 Categories imported: ${result.imported.categories}`);
            console.log(`   📋 Subcategories imported: ${result.imported.subcategories}`);
            console.log(`   📊 Terms imported: ${result.imported.terms}`);
            console.log('');
            console.log('🎉 Your AI Glossary now has the complete fresh 10k+ term dataset!');
        }
        else {
            console.error('❌ Import failed:', result.error);
        }
    }
    catch (error) {
        console.error('❌ Import error:', error);
    }
}
importFreshDataset();
