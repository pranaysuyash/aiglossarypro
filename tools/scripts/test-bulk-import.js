#!/usr/bin/env tsx
/**
 * Test Bulk Import Functionality
 *
 * This script tests the bulk import system with sample data
 * to ensure everything is working correctly.
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import { BulkTermImporter } from './import-bulk-terms';
async function testBulkImport() {
    console.log('🧪 Testing Bulk Import Functionality\n');
    // Create test data directory
    const testDir = path.join(process.cwd(), 'test-import-data');
    await fs.mkdir(testDir, { recursive: true });
    try {
        // Test 1: CSV Import
        console.log('📝 Test 1: Creating sample CSV file...');
        const csvContent = `Term,Definition,Category,Prerequisites,Related Terms,Complexity,Status
"Supervised Learning","Machine learning where models are trained on labeled data","Machine Learning","Statistics,Linear Algebra","Classification,Regression","intermediate","implemented"
"Neural Network","Computing system inspired by biological neural networks","Deep Learning","Linear Algebra,Calculus","Deep Learning,Backpropagation","advanced","implemented"
"Natural Language Processing","Field of AI focused on interaction between computers and human language","NLP","Machine Learning,Linguistics","Text Analysis,Sentiment Analysis","advanced","implemented"
"Gradient Descent","Optimization algorithm to minimize cost function","Machine Learning","Calculus,Linear Algebra","Backpropagation,Optimization","intermediate","theoretical"
"Convolutional Neural Network","Deep learning architecture for processing grid-like data","Deep Learning","Neural Networks,Linear Algebra","Computer Vision,Image Recognition","advanced","implemented"`;
        const csvPath = path.join(testDir, 'test-terms.csv');
        await fs.writeFile(csvPath, csvContent, 'utf-8');
        console.log(`✅ Created ${csvPath}\n`);
        // Test 2: JSON Import
        console.log('📝 Test 2: Creating sample JSON file...');
        const jsonContent = {
            terms: [
                {
                    term_name: "Reinforcement Learning",
                    basic_definition: "ML paradigm where agents learn through interaction with environment",
                    main_categories: ["Machine Learning"],
                    sub_categories: ["Deep Learning"],
                    prerequisites: ["Probability Theory", "Dynamic Programming"],
                    related_terms: ["Q-Learning", "Policy Gradient"],
                    complexity_level: "advanced",
                    implementation_status: "implemented"
                },
                {
                    term_name: "Transfer Learning",
                    basic_definition: "Technique where model trained on one task is adapted for related task",
                    main_categories: ["Machine Learning", "Deep Learning"],
                    prerequisites: ["Neural Networks", "Model Training"],
                    related_terms: ["Fine-tuning", "Domain Adaptation"],
                    complexity_level: "intermediate",
                    implementation_status: "implemented"
                }
            ]
        };
        const jsonPath = path.join(testDir, 'test-terms.json');
        await fs.writeFile(jsonPath, JSON.stringify(jsonContent, null, 2), 'utf-8');
        console.log(`✅ Created ${jsonPath}\n`);
        // Test 3: Dry run CSV import
        console.log('🔄 Test 3: Dry run CSV import...');
        const csvImporter = new BulkTermImporter({
            source: csvPath,
            format: 'csv',
            dryRun: true,
            verbose: true,
            batchSize: 2
        });
        const csvStats = await csvImporter.import();
        console.log(`✅ CSV dry run completed: ${csvStats.processedRows} rows processed\n`);
        // Test 4: Dry run JSON import
        console.log('🔄 Test 4: Dry run JSON import...');
        const jsonImporter = new BulkTermImporter({
            source: jsonPath,
            format: 'json',
            dryRun: true,
            verbose: true
        });
        const jsonStats = await jsonImporter.import();
        console.log(`✅ JSON dry run completed: ${jsonStats.processedRows} terms processed\n`);
        // Test 5: Large CSV generation
        console.log('📝 Test 5: Creating large CSV file (1000 terms)...');
        let largeCsvContent = 'Term,Definition,Category,Prerequisites,Related Terms\n';
        const categories = ['Machine Learning', 'Deep Learning', 'NLP', 'Computer Vision', 'Statistics'];
        const complexities = ['beginner', 'intermediate', 'advanced'];
        for (let i = 1; i <= 1000; i++) {
            const category = categories[i % categories.length];
            const complexity = complexities[i % complexities.length];
            largeCsvContent += `"Test Term ${i}","Definition for test term ${i} in ${category}","${category}","Prerequisite ${i}","Related ${i}"\n`;
        }
        const largeCsvPath = path.join(testDir, 'large-test.csv');
        await fs.writeFile(largeCsvPath, largeCsvContent, 'utf-8');
        console.log(`✅ Created ${largeCsvPath} with 1000 terms\n`);
        // Summary
        console.log('📊 Test Summary:');
        console.log('================');
        console.log('✅ All test files created successfully');
        console.log('✅ Dry run imports completed without errors');
        console.log(`\n📁 Test files created in: ${testDir}`);
        console.log('\nYou can now test actual imports with:');
        console.log(`  npx tsx scripts/import-bulk-terms.ts --source ${path.relative(process.cwd(), csvPath)}`);
        console.log(`  npx tsx scripts/import-bulk-terms.ts --source ${path.relative(process.cwd(), jsonPath)}`);
        console.log(`  npx tsx scripts/import-bulk-terms.ts --source ${path.relative(process.cwd(), largeCsvPath)} --batch-size 50`);
    }
    catch (error) {
        console.error('❌ Test failed:', error);
        process.exit(1);
    }
}
// Run tests
testBulkImport().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
});
