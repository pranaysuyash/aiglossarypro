import fs from 'node:fs';
import { importProcessedData } from './server/pythonProcessor';
async function importFullData() {
    try {
        console.log('📊 Loading processed data from temp/full_aiml_processed.json...');
        const data = JSON.parse(fs.readFileSync('temp/full_aiml_processed.json', 'utf8'));
        console.log(`📈 Data summary: ${data.categories.length} categories, ${data.subcategories.length} subcategories, ${data.terms.length} terms`);
        console.log('💾 Importing into database...');
        const result = await importProcessedData(data);
        if (result.success) {
            console.log('✅ Import successful!');
            console.log(`   Categories imported: ${result.imported.categories}`);
            console.log(`   Subcategories imported: ${result.imported.subcategories}`);
            console.log(`   Terms imported: ${result.imported.terms}`);
        }
        else {
            console.error('❌ Import failed:', result.error);
        }
    }
    catch (error) {
        console.error('❌ Import error:', error);
    }
}
importFullData();
