#!/usr/bin/env node
/**
 * Optimized import script for large datasets
 * Usage: npm run import:optimized [file-path] [options]
 */

import { optimizedImportFromFile } from "../optimizedBatchImporter";
import { resolve } from "path";

async function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.log(`
🚀 Optimized Data Import Tool

Usage: npm run import:optimized <file-path> [options]

Options:
  --batch-size <number>        Number of records to process in each batch (default: 1000)
  --bulk-insert-size <number>  Number of records to insert in single SQL operation (default: 100)
  --no-transactions           Disable transaction-based imports
  --no-skip-existing          Don't skip existing records
  --no-progress               Disable progress reporting
  --max-concurrent <number>    Maximum concurrent operations (default: 3)

Examples:
  npm run import:optimized data/large-glossary.json
  npm run import:optimized data/terms.json --batch-size 2000 --bulk-insert-size 200
  npm run import:optimized data/huge-dataset.json --no-transactions --max-concurrent 5
`);
    process.exit(1);
  }

  const filePath = resolve(args[0]);
  
  // Parse command line options
  const options: any = {};
  
  for (let i = 1; i < args.length; i += 2) {
    const flag = args[i];
    const value = args[i + 1];
    
    switch (flag) {
      case '--batch-size':
        options.batchSize = parseInt(value, 10);
        break;
      case '--bulk-insert-size':
        options.bulkInsertSize = parseInt(value, 10);
        break;
      case '--no-transactions':
        options.useTransactions = false;
        i--; // No value for this flag
        break;
      case '--no-skip-existing':
        options.skipExisting = false;
        i--; // No value for this flag
        break;
      case '--no-progress':
        options.enableProgress = false;
        i--; // No value for this flag
        break;
      case '--max-concurrent':
        options.maxConcurrentOperations = parseInt(value, 10);
        break;
      default:
        console.warn(`⚠️  Unknown option: ${flag}`);
        i--; // Adjust index if unknown flag
    }
  }

  console.log(`🎯 Starting optimized import...`);
  console.log(`📁 File: ${filePath}`);
  console.log(`⚙️  Options:`, JSON.stringify(options, null, 2));

  try {
    const result = await optimizedImportFromFile(filePath, options);
    
    if (result.success) {
      console.log(`\n✅ Import completed successfully!`);
      console.log(`📊 Summary:`);
      console.log(`   📂 Categories: ${result.imported.categories}`);
      console.log(`   📋 Subcategories: ${result.imported.subcategories}`);
      console.log(`   📄 Terms: ${result.imported.terms}`);
      console.log(`⏱️  Duration: ${(result.duration / 1000).toFixed(2)}s`);
      console.log(`📈 Performance:`);
      console.log(`   📂 Categories/sec: ${result.performance.categoriesPerSecond.toFixed(1)}`);
      console.log(`   📄 Terms/sec: ${result.performance.termsPerSecond.toFixed(1)}`);
      console.log(`💾 Memory used: ${Math.round(result.performance.memoryUsage.heapUsed / 1024 / 1024)}MB`);
      
      process.exit(0);
    } else {
      console.error(`❌ Import failed!`);
      result.errors.forEach(error => console.error(`   ❌ ${error}`));
      process.exit(1);
    }
  } catch (error) {
    console.error(`💥 Fatal error:`, error);
    process.exit(1);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}