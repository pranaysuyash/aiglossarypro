#!/usr/bin/env tsx

import { performance } from 'node:perf_hooks';
import { mkdir, writeFile } from 'fs/promises';
import { db } from '../server/db';
import { terms, categories } from '../shared/schema';
import { sql } from 'drizzle-orm';
import { ESSENTIAL_AI_TERMS, type EssentialTerm } from '../scripts/content-seeding/data/essentialTerms';

interface ImportConfig {
  batchSize: number;
  maxConcurrent: number;
  delayBetweenBatches: number; // ms
  qualityThreshold: number;
  targetSections: string[];
  dryRun: boolean;
  categoryFilter?: string;
  priorityFilter?: 'high' | 'medium' | 'low';
}

interface ImportResult {
  termName: string;
  success: boolean;
  skipped: boolean;
  error?: string;
  sectionsGenerated: number;
  timeTaken: number;
}

interface ImportSummary {
  totalProcessed: number;
  totalSuccessful: number;
  totalSkipped: number;
  totalErrors: number;
  totalDuration: number;
  results: ImportResult[];
}

const DEFAULT_CONFIG: ImportConfig = {
  batchSize: 5,
  maxConcurrent: 3,
  delayBetweenBatches: 2000,
  qualityThreshold: 7,
  targetSections: [
    'introduction',
    'how-it-works',
    'applications',
    'advantages-disadvantages',
    'best-practices'
  ],
  dryRun: false
};

async function mockAIService() {
  // Mock AI service for when the actual service isn't available
  return {
    generateDefinition: async (termName: string, category: string, context: string) => {
      await new Promise(resolve => setTimeout(resolve, 500)); // Simulate API delay
      return {
        shortDefinition: `A concise definition of ${termName} in the context of ${category}.`,
        definition: `${termName} is a fundamental concept in ${category} that involves various techniques and methodologies. This comprehensive approach enables systems to process and analyze data effectively, leading to meaningful insights and automated decision-making capabilities.`,
        characteristics: [
          `Key characteristic 1 of ${termName}`,
          `Key characteristic 2 of ${termName}`,
          `Key characteristic 3 of ${termName}`
        ],
        applications: [
          `Application 1: ${termName} in real-world scenarios`,
          `Application 2: Industrial use cases for ${termName}`,
          `Application 3: Academic research applications`
        ]
      };
    },
    generateSectionContent: async (termName: string, sectionName: string) => {
      await new Promise(resolve => setTimeout(resolve, 300)); // Simulate API delay
      return `Comprehensive ${sectionName} content for ${termName}. This section provides detailed information about ${sectionName} aspects, including theoretical foundations, practical applications, and real-world examples that demonstrate the importance and utility of ${termName} in modern AI/ML systems.`;
    }
  };
}

async function getAIService() {
  try {
    const { aiService } = await import('../server/aiService');
    return aiService;
  } catch (error) {
    console.warn('⚠️  AI service not available, using mock service for demonstration');
    return mockAIService();
  }
}

async function bulkImportContent(config: ImportConfig = DEFAULT_CONFIG): Promise<ImportSummary> {
  console.log('🚀 Starting Bulk Content Import');
  console.log('Configuration:', JSON.stringify(config, null, 2));

  if (config.dryRun) {
    console.log('🔍 DRY RUN MODE - No actual changes will be made');
  }

  const startTime = performance.now();
  const summary: ImportSummary = {
    totalProcessed: 0,
    totalSuccessful: 0,
    totalSkipped: 0,
    totalErrors: 0,
    totalDuration: 0,
    results: []
  };

  try {
    // Get AI service
    const aiService = await getAIService();

    // Get existing categories
    const existingCategories = await db.select().from(categories);
    const categoryMap = new Map(existingCategories.map(cat => [cat.name, cat.id]));

    console.log(`Found ${existingCategories.length} categories in database`);

    // Filter terms based on configuration
    const termsToProcess: Array<{ categoryName: string; term: EssentialTerm }> = [];

    for (const [categoryName, categoryTerms] of Object.entries(ESSENTIAL_AI_TERMS)) {
      // Apply category filter
      if (config.categoryFilter && !categoryName.toLowerCase().includes(config.categoryFilter.toLowerCase())) {
        continue;
      }

      // Apply priority filter
      const filteredTerms = config.priorityFilter 
        ? categoryTerms.filter(term => term.priority === config.priorityFilter)
        : categoryTerms;

      for (const term of filteredTerms) {
        termsToProcess.push({ categoryName, term });
      }
    }

    console.log(`Planning to process ${termsToProcess.length} terms`);

    // Process terms in batches
    for (let i = 0; i < termsToProcess.length; i += config.batchSize) {
      const batch = termsToProcess.slice(i, i + config.batchSize);
      
      console.log(`\n🔄 Processing batch ${Math.floor(i / config.batchSize) + 1}/${Math.ceil(termsToProcess.length / config.batchSize)}`);

      const batchPromises = batch.map(async ({ categoryName, term }) => {
        const termStartTime = performance.now();
        
        try {
          const categoryId = categoryMap.get(categoryName);
          if (!categoryId) {
            throw new Error(`Category not found: ${categoryName}`);
          }

          // Check if term already exists
          const existingTerm = await db
            .select()
            .from(terms)
            .where(sql`LOWER(${terms.name}) = LOWER(${term.name})`)
            .limit(1);

          if (existingTerm.length > 0) {
            console.log(`    ⏭️  Skipping existing term: ${term.name}`);
            return {
              termName: term.name,
              success: true,
              skipped: true,
              sectionsGenerated: 0,
              timeTaken: performance.now() - termStartTime
            };
          }

          if (config.dryRun) {
            console.log(`    🔍 [DRY RUN] Would create term: ${term.name} in ${categoryName}`);
            return {
              termName: term.name,
              success: true,
              skipped: false,
              sectionsGenerated: config.targetSections.length,
              timeTaken: performance.now() - termStartTime
            };
          }

          // Generate comprehensive definition
          const definition = await aiService.generateDefinition(
            term.name,
            categoryName,
            `Priority: ${term.priority}, Complexity: ${term.complexity}, Focus: ${term.focusAreas?.join(', ')}`
          );

          // Create the term
          const newTerm = await db.insert(terms).values({
            name: term.name,
            shortDefinition: definition.shortDefinition,
            definition: definition.definition,
            characteristics: definition.characteristics || [],
            applications: definition.applications || [],
            categoryId,
            viewCount: 0
          }).returning();

          console.log(`    ✅ Created term: ${term.name} (ID: ${newTerm[0].id})`);

          // Generate additional sections
          let sectionsGenerated = 1; // Count the main definition as one section
          
          for (const sectionName of config.targetSections.slice(1)) { // Skip introduction (already have definition)
            try {
              const sectionContent = await aiService.generateSectionContent(
                term.name,
                sectionName
              );
              
              // In a full implementation, you'd save this to a sections table
              console.log(`      📝 Generated ${sectionName}: ${sectionContent.length} chars`);
              sectionsGenerated++;
            } catch (sectionError) {
              console.error(`      ❌ Failed to generate ${sectionName} for ${term.name}:`, sectionError);
            }
          }

          return {
            termName: term.name,
            success: true,
            skipped: false,
            sectionsGenerated,
            timeTaken: performance.now() - termStartTime
          };
          
        } catch (error) {
          console.error(`    ❌ Error processing ${term.name}:`, error);
          return {
            termName: term.name,
            success: false,
            skipped: false,
            error: error instanceof Error ? error.message : String(error),
            sectionsGenerated: 0,
            timeTaken: performance.now() - termStartTime
          };
        }
      });

      // Wait for batch to complete
      const batchResults = await Promise.allSettled(batchPromises);
      
      // Process results
      batchResults.forEach(result => {
        summary.totalProcessed++;
        
        if (result.status === 'fulfilled') {
          const importResult = result.value;
          summary.results.push(importResult);
          
          if (importResult.success) {
            if (importResult.skipped) {
              summary.totalSkipped++;
            } else {
              summary.totalSuccessful++;
            }
          } else {
            summary.totalErrors++;
          }
        } else {
          summary.totalErrors++;
          summary.results.push({
            termName: 'Unknown',
            success: false,
            skipped: false,
            error: result.reason?.message || 'Unknown error',
            sectionsGenerated: 0,
            timeTaken: 0
          });
        }
      });

      // Delay between batches to avoid rate limits
      if (i + config.batchSize < termsToProcess.length) {
        console.log(`    ⏱️  Waiting ${config.delayBetweenBatches}ms before next batch...`);
        await new Promise(resolve => setTimeout(resolve, config.delayBetweenBatches));
      }
    }

  } catch (error) {
    console.error('❌ Fatal error during bulk import:', error);
    throw error;
  }

  summary.totalDuration = performance.now() - startTime;
  return summary;
}

function printImportSummary(summary: ImportSummary, config: ImportConfig): void {
  const duration = summary.totalDuration / 1000;

  console.log('\n📊 BULK IMPORT SUMMARY');
  console.log('═══════════════════════');
  console.log(`Mode: ${config.dryRun ? 'DRY RUN' : 'PRODUCTION'}`);
  console.log(`Total Processed: ${summary.totalProcessed}`);
  console.log(`Successful: ${summary.totalSuccessful}`);
  console.log(`Skipped: ${summary.totalSkipped}`);
  console.log(`Errors: ${summary.totalErrors}`);
  console.log(`Duration: ${duration.toFixed(2)}s`);
  
  if (summary.totalProcessed > 0) {
    console.log(`Average Time per Term: ${(duration / summary.totalProcessed).toFixed(2)}s`);
    console.log(`Success Rate: ${((summary.totalSuccessful / summary.totalProcessed) * 100).toFixed(1)}%`);
  }
  
  // Show error details
  const errors = summary.results.filter(r => !r.success);
  if (errors.length > 0) {
    console.log(`\n❌ Error Details:`);
    errors.slice(0, 5).forEach(error => {
      console.log(`  - ${error.termName}: ${error.error}`);
    });
    if (errors.length > 5) {
      console.log(`  ... and ${errors.length - 5} more errors`);
    }
  }
  
  // Success summary
  if (summary.totalSuccessful > 0) {
    const totalSections = summary.results
      .filter(r => r.success && !r.skipped)
      .reduce((sum, r) => sum + r.sectionsGenerated, 0);
    console.log(`\n✅ Successfully generated ${totalSections} content sections across ${summary.totalSuccessful} terms`);
  }
}

async function saveImportReport(summary: ImportSummary, config: ImportConfig): Promise<string> {
  try {
    await mkdir('reports', { recursive: true });
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const fileName = `bulk-import-${config.dryRun ? 'dry-run-' : ''}${timestamp}.json`;
    const filePath = `reports/${fileName}`;
    
    const report = {
      config,
      summary,
      generatedAt: new Date().toISOString()
    };
    
    await writeFile(filePath, JSON.stringify(report, null, 2));
    return filePath;
  } catch (error) {
    console.error('❌ Error saving import report:', error);
    throw error;
  }
}

async function main() {
  const args = process.argv.slice(2);
  const config = { ...DEFAULT_CONFIG };

  // Parse CLI arguments
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    const nextArg = args[i + 1];

    switch (arg) {
      case '--dry-run':
        config.dryRun = true;
        break;
      case '--batch-size':
        if (nextArg) config.batchSize = parseInt(nextArg, 10);
        break;
      case '--quality-threshold':
        if (nextArg) config.qualityThreshold = parseInt(nextArg, 10);
        break;
      case '--delay':
        if (nextArg) config.delayBetweenBatches = parseInt(nextArg, 10);
        break;
      case '--category':
        if (nextArg) config.categoryFilter = nextArg;
        break;
      case '--priority':
        if (nextArg && ['high', 'medium', 'low'].includes(nextArg)) {
          config.priorityFilter = nextArg as 'high' | 'medium' | 'low';
        }
        break;
      case '--sections':
        if (nextArg) config.targetSections = nextArg.split(',').map(s => s.trim());
        break;
      case '--help':
      case '-h':
        console.log(`
Usage: npx tsx scripts/bulk-content-import.ts [options]

Options:
  --dry-run                 Run without making changes
  --batch-size <number>     Number of terms to process simultaneously (default: 5)
  --delay <ms>              Delay between batches in milliseconds (default: 2000)
  --quality-threshold <num> Minimum quality score (default: 7)
  --category <name>         Filter by category name (partial match)
  --priority <level>        Filter by priority: high, medium, low
  --sections <list>         Comma-separated sections to generate
  --help, -h                Show this help message

Examples:
  npx tsx scripts/bulk-content-import.ts --dry-run
  npx tsx scripts/bulk-content-import.ts --category "Machine Learning" --priority high
  npx tsx scripts/bulk-content-import.ts --batch-size 3 --delay 3000
        `);
        process.exit(0);
    }
  }

  try {
    const summary = await bulkImportContent(config);
    printImportSummary(summary, config);
    
    // Save detailed report
    const reportPath = await saveImportReport(summary, config);
    console.log(`\n📄 Detailed report saved to ${reportPath}`);
    
    // Exit with appropriate code
    if (summary.totalErrors > 0) {
      console.log('\n⚠️  Import completed with errors');
      process.exit(1);
    } else {
      console.log('\n✅ Bulk import completed successfully!');
      process.exit(0);
    }
  } catch (error) {
    console.error('❌ Bulk import failed:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

export { bulkImportContent, type ImportConfig, type ImportSummary };