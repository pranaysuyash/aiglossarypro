#!/usr/bin/env tsx
/**
 * Import All Terms - Wrapper for Bulk Import System
 *
 * This script provides backward compatibility for the old import-all-terms.ts
 * It now uses the new bulk import system that supports CSV and JSON formats.
 *
 * Usage:
 * npx tsx scripts/import-all-terms.ts
 * npx tsx scripts/import-all-terms.ts --source data/aiml.csv
 * npx tsx scripts/import-all-terms.ts --help
 */
import path from 'node:path';
import fs from 'node:fs/promises';
import { BulkTermImporter } from './import-bulk-terms';
async function importAllTerms() {
    console.log('🚀 AI Glossary Pro - Import All Terms\n');
    const args = process.argv.slice(2);
    // Show help if requested
    if (args.includes('--help') || args.includes('-h')) {
        console.log(`
This script imports AI/ML terms into the glossary database.

Usage: npx tsx scripts/import-all-terms.ts [options]

Options:
  --source <file>    Path to CSV or JSON file (default: auto-detect)
  --dry-run          Preview import without making changes
  --verbose          Show detailed progress
  --help             Show this help message

The script will automatically look for these files in order:
1. data/aiml.csv
2. data/aiml2_sample.csv
3. data/test_sample.csv
4. data/row1.csv (converted from Excel)
5. Any .json files in data directory

For more options, use the full bulk import script:
npx tsx scripts/import-bulk-terms.ts --help
    `);
        return;
    }
    try {
        // Check for source argument
        let sourceFile = args.find((arg, i) => args[i - 1] === '--source');
        // Auto-detect source file if not specified
        if (!sourceFile) {
            console.log('🔍 Auto-detecting data source...\n');
            const dataDir = path.join(process.cwd(), 'data');
            const possibleFiles = [
                'aiml.csv',
                'aiml2_sample.csv',
                'test_sample.csv',
                'row1.csv',
            ];
            // Check for CSV files
            for (const file of possibleFiles) {
                const filePath = path.join(dataDir, file);
                try {
                    await fs.access(filePath);
                    sourceFile = filePath;
                    console.log(`✅ Found: ${file}`);
                    break;
                }
                catch {
                    // File doesn't exist, continue
                }
            }
            // If no CSV found, check for JSON files
            if (!sourceFile) {
                const files = await fs.readdir(dataDir);
                const jsonFile = files.find(f => f.endsWith('.json') && f.includes('term'));
                if (jsonFile) {
                    sourceFile = path.join(dataDir, jsonFile);
                    console.log(`✅ Found: ${jsonFile}`);
                }
            }
            if (!sourceFile) {
                console.error('❌ No data file found!');
                console.log('\nPlease ensure one of these files exists:');
                possibleFiles.forEach(f => console.log(`  - data/${f}`));
                console.log('  - Or any .json file with terms');
                console.log('\nTo convert Excel files to CSV, run:');
                console.log('  npx tsx scripts/convert-excel-to-csv.ts');
                process.exit(1);
            }
        }
        // Determine format from extension
        const format = sourceFile.endsWith('.json') ? 'json' : 'csv';
        console.log(`\n📄 Source: ${path.relative(process.cwd(), sourceFile)}`);
        console.log(`📊 Format: ${format.toUpperCase()}\n`);
        // Build import options
        const options = {
            source: sourceFile,
            format,
            batchSize: 100,
            maxConcurrent: 5,
            skipDuplicates: true,
            validateData: true,
            dryRun: args.includes('--dry-run'),
            verbose: args.includes('--verbose'),
            progressInterval: 5000, // Update every 5 seconds
        };
        // Create importer
        const importer = new BulkTermImporter(options);
        // Handle graceful shutdown
        process.on('SIGINT', () => {
            console.log('\n\n⚠️  Import interrupted by user');
            importer.shutdown();
            process.exit(1);
        });
        // Run import
        const stats = await importer.import();
        // Show summary
        console.log('\n📊 Import Summary:');
        console.log('═════════════════');
        console.log(`✅ Successfully imported: ${stats.successfulImports} terms`);
        console.log(`⏭️  Skipped duplicates: ${stats.skippedDuplicates}`);
        console.log(`❌ Errors: ${stats.importErrors}`);
        console.log(`📁 Categories created: ${stats.categoriesCreated}`);
        console.log(`📄 Sections created: ${stats.sectionsCreated}`);
        if (stats.successfulImports > 0) {
            console.log('\n🎉 Import completed successfully!');
            console.log('\nNext steps:');
            console.log('1. Check the application to verify imported terms');
            console.log('2. Review any error logs if errors occurred');
            console.log('3. Run search indexing if needed');
        }
        else if (stats.skippedDuplicates > 0) {
            console.log('\n⚠️  All terms were already imported (duplicates skipped)');
        }
        else {
            console.log('\n❌ No terms were imported. Check the error logs.');
        }
    }
    catch (error) {
        console.error('\n❌ Import failed:', error);
        process.exit(1);
    }
}
// Show deprecation notice
console.log('⚠️  Note: This script now uses the new bulk import system.');
console.log('   For advanced options, use: npx tsx scripts/import-bulk-terms.ts --help\n');
// Run the import
importAllTerms().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
});
