#!/usr/bin/env node
/**
 * Bulk Content Import System
 *
 * This script provides bulk import capabilities for populating the database
 * with content from various sources including CSV files, JSON data,
 * and structured content files. It leverages the existing AI service
 * to enhance and validate imported content.
 *
 * Usage:
 * npm run import:bulk [options]
 *
 * Options:
 * --source <path>         Path to source file (CSV, JSON, or text)
 * --type <format>         Import format (csv|json|essential|excel)
 * --enhance               Use AI to enhance imported content
 * --validate              Validate content after import
 * --batch-size <number>   Import batch size (default: 10)
 * --dry-run              Show what would be imported without saving
 * --category <name>       Import only specific category
 */
import { createReadStream } from 'node:fs';
import fs from 'node:fs/promises';
import path from 'node:path';
import { performance } from 'node:perf_hooks';
import csv from 'csv-parser';
import { eq } from 'drizzle-orm';
import { aiService } from '../../server/aiService';
import { db } from '../../server/db';
import { log as logger } from '../../server/utils/logger';
import { categories, terms } from '../../shared/schema';
import { ESSENTIAL_AI_TERMS, getAllEssentialTerms } from './data/essentialTerms';
import { validateTerm } from './validateContent';
// Command line arguments
const args = process.argv.slice(2);
const getCLIArg = (flag, defaultValue = '') => {
    const index = args.indexOf(flag);
    return index !== -1 && args[index + 1] ? args[index + 1] : defaultValue;
};
const sourcePath = getCLIArg('--source');
const importType = getCLIArg('--type', 'essential');
const shouldEnhance = args.includes('--enhance');
const shouldValidate = args.includes('--validate');
const batchSize = parseInt(getCLIArg('--batch-size', '10'), 10);
const isDryRun = args.includes('--dry-run');
const targetCategory = getCLIArg('--category');
/**
 * Main bulk import function
 */
async function bulkImport() {
    const startTime = performance.now();
    const stats = {
        totalRecords: 0,
        successfulImports: 0,
        skipped: 0,
        errors: 0,
        enhanced: 0,
        validated: 0,
        totalTime: 0,
        averageTimePerRecord: 0,
        categoriesCreated: 0,
        categoriesUsed: [],
    };
    try {
        logger.info('🚀 Starting Bulk Content Import');
        logger.info(`Import Type: ${importType}`);
        logger.info(`Source: ${sourcePath || 'ESSENTIAL_TERMS'}`);
        logger.info(`Target Category: ${targetCategory || 'ALL'}`);
        logger.info(`Batch Size: ${batchSize}`);
        logger.info(`Enhance: ${shouldEnhance ? 'ENABLED' : 'DISABLED'}`);
        logger.info(`Validate: ${shouldValidate ? 'ENABLED' : 'DISABLED'}`);
        logger.info(`Mode: ${isDryRun ? 'DRY RUN' : 'PRODUCTION'}`);
        // Step 1: Load import data
        const importRecords = await loadImportData(importType, sourcePath);
        if (importRecords.length === 0) {
            logger.warn('No records found to import');
            return;
        }
        logger.info(`Loaded ${importRecords.length} records for import`);
        // Step 2: Filter by category if specified
        const filteredRecords = targetCategory
            ? importRecords.filter(record => record.category?.toLowerCase().includes(targetCategory.toLowerCase()))
            : importRecords;
        logger.info(`Processing ${filteredRecords.length} records after filtering`);
        // Step 3: Get existing data for deduplication
        const existingTerms = await db.select().from(terms);
        const existingTermNames = new Set(existingTerms.map(t => t.name.toLowerCase()));
        const existingCategories = await db.select().from(categories);
        logger.info(`Found ${existingTerms.length} existing terms, ${existingCategories.length} categories`);
        // Step 4: Process records in batches
        const batches = chunkArray(filteredRecords, batchSize);
        for (let i = 0; i < batches.length; i++) {
            const batch = batches[i];
            logger.info(`\n📦 Processing batch ${i + 1}/${batches.length} (${batch.length} records)`);
            const batchResults = await processBatch(batch, existingTermNames, existingCategories, shouldEnhance, shouldValidate, isDryRun);
            // Update stats
            stats.totalRecords += batchResults.processed;
            stats.successfulImports += batchResults.imported;
            stats.skipped += batchResults.skipped;
            stats.errors += batchResults.errors;
            stats.enhanced += batchResults.enhanced;
            stats.validated += batchResults.validated;
            stats.categoriesCreated += batchResults.categoriesCreated;
            // Update categories used
            for (const category of batchResults.categoriesUsed) {
                if (!stats.categoriesUsed.includes(category)) {
                    stats.categoriesUsed.push(category);
                }
            }
            logger.info(`  ✅ Batch completed: ${batchResults.imported} imported, ${batchResults.skipped} skipped, ${batchResults.errors} errors`);
        }
        // Step 5: Report results
        const endTime = performance.now();
        stats.totalTime = endTime - startTime;
        stats.averageTimePerRecord = stats.totalTime / Math.max(stats.totalRecords, 1);
        reportImportStats(stats);
    }
    catch (error) {
        logger.error('Fatal error in bulk import:', error);
        process.exit(1);
    }
}
/**
 * Load import data based on format
 */
async function loadImportData(format, sourcePath) {
    switch (format) {
        case 'essential':
            return loadEssentialTerms();
        case 'csv':
            return loadCSVData(sourcePath);
        case 'json':
            return loadJSONData(sourcePath);
        case 'excel':
            return loadExcelData(sourcePath);
        default:
            throw new Error(`Unsupported import format: ${format}`);
    }
}
/**
 * Load essential terms data
 */
async function loadEssentialTerms() {
    const essentialTerms = getAllEssentialTerms();
    return essentialTerms.map(term => ({
        name: term.name,
        category: getCategoryForTerm(term.name),
        priority: term.priority,
        complexity: term.complexity,
        aliases: term.aliases,
        relatedTerms: term.relatedTerms,
    }));
}
/**
 * Get category for a term from ESSENTIAL_AI_TERMS
 */
function getCategoryForTerm(termName) {
    for (const [category, terms] of Object.entries(ESSENTIAL_AI_TERMS)) {
        if (terms.some(t => t.name === termName || t.aliases?.includes(termName))) {
            return category;
        }
    }
    return 'General';
}
/**
 * Load CSV data
 */
async function loadCSVData(csvPath) {
    if (!csvPath) {
        throw new Error('CSV source path is required');
    }
    return new Promise((resolve, reject) => {
        const records = [];
        createReadStream(csvPath)
            .pipe(csv())
            .on('data', row => {
            try {
                const record = {
                    name: row.name || row.term || row.title,
                    shortDefinition: row.shortDefinition || row.short_definition,
                    definition: row.definition || row.description,
                    category: row.category,
                    mathFormulation: row.mathFormulation || row.math_formulation,
                };
                // Parse arrays from CSV
                if (row.characteristics) {
                    record.characteristics = parseCSVArray(row.characteristics);
                }
                if (row.applications) {
                    record.applications = parseCSVApplications(row.applications);
                }
                if (row.references) {
                    record.references = parseCSVArray(row.references);
                }
                if (row.aliases) {
                    record.aliases = parseCSVArray(row.aliases);
                }
                if (row.relatedTerms) {
                    record.relatedTerms = parseCSVArray(row.relatedTerms);
                }
                if (record.name && record.name.trim().length > 0) {
                    records.push(record);
                }
            }
            catch (error) {
                logger.warn(`Error parsing CSV row:`, error);
            }
        })
            .on('end', () => {
            logger.info(`Loaded ${records.length} records from CSV`);
            resolve(records);
        })
            .on('error', reject);
    });
}
/**
 * Load JSON data
 */
async function loadJSONData(jsonPath) {
    if (!jsonPath) {
        throw new Error('JSON source path is required');
    }
    try {
        const content = await fs.readFile(jsonPath, 'utf-8');
        const data = JSON.parse(content);
        // Handle different JSON structures
        if (Array.isArray(data)) {
            return data.map(normalizeRecord);
        }
        else if (data.terms && Array.isArray(data.terms)) {
            return data.terms.map(normalizeRecord);
        }
        else if (typeof data === 'object') {
            // Handle category-based structure
            const records = [];
            for (const [category, terms] of Object.entries(data)) {
                if (Array.isArray(terms)) {
                    for (const term of terms) {
                        const record = normalizeRecord(term);
                        record.category = record.category || category;
                        records.push(record);
                    }
                }
            }
            return records;
        }
        throw new Error('Unsupported JSON structure');
    }
    catch (error) {
        logger.error('Error loading JSON data:', error);
        throw error;
    }
}
/**
 * Load Excel data (placeholder - would use a library like exceljs)
 */
async function loadExcelData(excelPath) {
    if (!excelPath) {
        throw new Error('Excel source path is required');
    }
    // This would be implemented with a library like exceljs
    // For now, return empty array with warning
    logger.warn('Excel import not yet implemented. Use CSV format instead.');
    return [];
}
/**
 * Normalize import record to standard format
 */
function normalizeRecord(record) {
    return {
        name: record.name || record.term || record.title,
        shortDefinition: record.shortDefinition || record.short_definition,
        definition: record.definition || record.description,
        category: record.category,
        characteristics: Array.isArray(record.characteristics) ? record.characteristics : undefined,
        applications: Array.isArray(record.applications) ? record.applications : undefined,
        mathFormulation: record.mathFormulation || record.math_formulation,
        references: Array.isArray(record.references) ? record.references : undefined,
        priority: record.priority,
        complexity: record.complexity,
        aliases: Array.isArray(record.aliases) ? record.aliases : undefined,
        relatedTerms: Array.isArray(record.relatedTerms) ? record.relatedTerms : undefined,
    };
}
/**
 * Parse CSV array (comma-separated values in quotes)
 */
function parseCSVArray(value) {
    if (!value || typeof value !== 'string')
        return [];
    return value
        .split(',')
        .map(item => item.trim().replace(/^["']|["']$/g, ''))
        .filter(item => item.length > 0);
}
/**
 * Parse CSV applications (special format for name:description pairs)
 */
function parseCSVApplications(value) {
    if (!value || typeof value !== 'string')
        return [];
    const items = parseCSVArray(value);
    return items.map(item => {
        const [name, ...descParts] = item.split(':');
        return {
            name: name.trim(),
            description: descParts.join(':').trim() || name.trim(),
        };
    });
}
/**
 * Process a batch of import records
 */
async function processBatch(batch, existingTermNames, existingCategories, enhance, validate, dryRun) {
    const results = {
        processed: 0,
        imported: 0,
        skipped: 0,
        errors: 0,
        enhanced: 0,
        validated: 0,
        categoriesCreated: 0,
        categoriesUsed: [],
    };
    for (const record of batch) {
        try {
            results.processed++;
            // Check if term already exists
            if (existingTermNames.has(record.name.toLowerCase())) {
                logger.info(`  ⏭️  Skipping existing term: ${record.name}`);
                results.skipped++;
                continue;
            }
            // Ensure category exists
            let categoryId = null;
            if (record.category) {
                categoryId = await ensureCategoryExists(record.category, existingCategories, dryRun);
                if (categoryId && !results.categoriesUsed.includes(record.category)) {
                    results.categoriesUsed.push(record.category);
                }
            }
            // Enhance content if requested
            if (enhance) {
                await enhanceRecord(record);
                results.enhanced++;
            }
            // Import the term
            if (!dryRun) {
                const termId = await importTerm(record, categoryId);
                // Validate if requested
                if (validate && termId) {
                    const term = await db.select().from(terms).where(eq(terms.id, termId)).limit(1);
                    if (term.length > 0) {
                        const validationResult = await validateTerm(term[0], 'all');
                        if (validationResult.overallScore >= 70) {
                            results.validated++;
                        }
                    }
                }
                results.imported++;
                logger.info(`  ✅ Imported: ${record.name} (Category: ${record.category || 'None'})`);
            }
            else {
                results.imported++;
                logger.info(`  [DRY RUN] Would import: ${record.name} (Category: ${record.category || 'None'})`);
            }
        }
        catch (error) {
            results.errors++;
            logger.error(`  ❌ Error importing ${record.name}:`, error);
        }
    }
    return results;
}
/**
 * Ensure category exists, create if necessary
 */
async function ensureCategoryExists(categoryName, existingCategories, dryRun) {
    // Check if category already exists
    const existing = existingCategories.find(cat => cat.name.toLowerCase() === categoryName.toLowerCase());
    if (existing) {
        return existing.id;
    }
    // Create new category
    if (!dryRun) {
        try {
            const newCategory = await db
                .insert(categories)
                .values({
                name: categoryName,
                description: `AI/ML category for ${categoryName} related terms`,
            })
                .returning();
            // Add to existing categories list
            existingCategories.push(newCategory[0]);
            logger.info(`  📁 Created category: ${categoryName}`);
            return newCategory[0].id;
        }
        catch (error) {
            logger.error(`Failed to create category ${categoryName}:`, error);
            return null;
        }
    }
    else {
        logger.info(`  [DRY RUN] Would create category: ${categoryName}`);
        return 'dry-run-id';
    }
}
/**
 * Enhance record using AI service
 */
async function enhanceRecord(record) {
    try {
        // Generate missing definition
        if (!record.definition && record.name) {
            const aiDefinition = await aiService.generateDefinition(record.name, record.category, `Priority: ${record.priority || 'medium'}, Complexity: ${record.complexity || 'intermediate'}`);
            record.definition = aiDefinition.definition;
            record.shortDefinition = record.shortDefinition || aiDefinition.shortDefinition;
            record.characteristics = record.characteristics || aiDefinition.characteristics;
            record.applications = record.applications || aiDefinition.applications;
            record.mathFormulation = record.mathFormulation || aiDefinition.mathFormulation;
        }
        // Generate missing short definition
        if (!record.shortDefinition && record.definition) {
            const sentences = record.definition.split(/[.!?]+/);
            record.shortDefinition = sentences[0]?.trim() + (sentences[0]?.endsWith('.') ? '' : '.');
        }
        // Generate characteristics if missing
        if (!record.characteristics || record.characteristics.length === 0) {
            try {
                const content = await aiService.generateSectionContent(record.name, 'Key Characteristics');
                record.characteristics = content
                    .split('\n')
                    .map(line => line.replace(/^[•\-\d.]\s*/, '').trim())
                    .filter(line => line.length > 0)
                    .slice(0, 5);
            }
            catch (_error) {
                // Non-critical error
            }
        }
    }
    catch (error) {
        logger.warn(`Failed to enhance record ${record.name}:`, error);
    }
}
/**
 * Import a single term to database
 */
async function importTerm(record, categoryId) {
    const termData = {
        name: record.name,
        shortDefinition: record.shortDefinition || null,
        definition: record.definition || '',
        categoryId: categoryId,
        characteristics: record.characteristics || [],
        applications: record.applications || [],
        mathFormulation: record.mathFormulation || null,
        references: record.references || [],
    };
    const insertedTerm = await db.insert(terms).values(termData).returning();
    return insertedTerm[0].id;
}
/**
 * Chunk array into smaller batches
 */
function chunkArray(array, chunkSize) {
    const chunks = [];
    for (let i = 0; i < array.length; i += chunkSize) {
        chunks.push(array.slice(i, i + chunkSize));
    }
    return chunks;
}
/**
 * Report import statistics
 */
function reportImportStats(stats) {
    logger.info('\n📊 BULK IMPORT RESULTS');
    logger.info('════════════════════════');
    logger.info(`Total Records Processed: ${stats.totalRecords}`);
    logger.info(`Successfully Imported: ${stats.successfulImports}`);
    logger.info(`Skipped (Existing): ${stats.skipped}`);
    logger.info(`Errors: ${stats.errors}`);
    logger.info(`Enhanced: ${stats.enhanced}`);
    logger.info(`Validated: ${stats.validated}`);
    logger.info(`Total Time: ${(stats.totalTime / 1000).toFixed(2)}s`);
    logger.info(`Average Time per Record: ${(stats.averageTimePerRecord / 1000).toFixed(2)}s`);
    logger.info('\n📁 Categories:');
    logger.info(`  Categories Created: ${stats.categoriesCreated}`);
    logger.info(`  Categories Used: ${stats.categoriesUsed.length}`);
    if (stats.categoriesUsed.length > 0) {
        logger.info(`  Category List: ${stats.categoriesUsed.join(', ')}`);
    }
    const successRate = stats.totalRecords > 0
        ? ((stats.successfulImports / stats.totalRecords) * 100).toFixed(1)
        : '0';
    logger.info(`\n✅ Success Rate: ${successRate}%`);
    if (stats.errors > 0) {
        logger.warn(`⚠️  ${stats.errors} errors occurred during import`);
    }
    if (stats.successfulImports > 0) {
        logger.info(`🎉 Successfully imported ${stats.successfulImports} new terms!`);
        if (shouldEnhance && stats.enhanced > 0) {
            logger.info(`🤖 Enhanced ${stats.enhanced} terms with AI-generated content`);
        }
        if (shouldValidate && stats.validated > 0) {
            logger.info(`✅ Validated ${stats.validated} terms with high quality scores`);
        }
    }
}
/**
 * Create sample import files for testing
 */
async function createSampleFiles() {
    const samplesDir = path.join(process.cwd(), 'scripts', 'content-seeding', 'samples');
    await fs.mkdir(samplesDir, { recursive: true });
    // Create sample CSV
    const csvContent = `name,category,shortDefinition,definition,characteristics,applications
"Machine Learning","Machine Learning","A method of data analysis that automates analytical model building","Machine Learning is a method of data analysis that automates analytical model building. It is a branch of artificial intelligence (AI) based on the idea that systems can learn from data, identify patterns and make decisions with minimal human intervention.","automated learning,pattern recognition,data-driven","image recognition:Used in computer vision applications,recommendation systems:Powers Netflix and Amazon recommendations"
"Neural Network","Deep Learning","A computing system inspired by biological neural networks","A neural network is a computing system vaguely inspired by the biological neural networks that constitute animal brains. Such systems learn to perform tasks by considering examples, generally without being programmed with any task-specific rules.","interconnected nodes,learning capability,parallel processing","speech recognition:Used in voice assistants,medical diagnosis:Helps analyze medical images"`;
    await fs.writeFile(path.join(samplesDir, 'sample_terms.csv'), csvContent, 'utf-8');
    // Create sample JSON
    const jsonContent = {
        terms: [
            {
                name: 'Deep Learning',
                category: 'Deep Learning',
                shortDefinition: 'A subset of machine learning based on artificial neural networks',
                definition: 'Deep learning is part of a broader family of machine learning methods based on artificial neural networks with representation learning. Learning can be supervised, semi-supervised or unsupervised.',
                characteristics: [
                    'multiple layers',
                    'automatic feature extraction',
                    'hierarchical learning',
                ],
                applications: [
                    { name: 'computer vision', description: 'Object detection and image classification' },
                    {
                        name: 'natural language processing',
                        description: 'Language translation and text analysis',
                    },
                ],
            },
        ],
    };
    await fs.writeFile(path.join(samplesDir, 'sample_terms.json'), JSON.stringify(jsonContent, null, 2), 'utf-8');
    logger.info(`📄 Sample files created in ${samplesDir}`);
    logger.info('  - sample_terms.csv (CSV format example)');
    logger.info('  - sample_terms.json (JSON format example)');
}
/**
 * Main execution
 */
if (require.main === module) {
    // Check if user wants to create sample files
    if (args.includes('--create-samples')) {
        createSampleFiles().catch(error => {
            logger.error('Failed to create sample files:', error);
            process.exit(1);
        });
    }
    else {
        bulkImport().catch(error => {
            logger.error('Bulk import failed:', error);
            process.exit(1);
        });
    }
}
export { bulkImport, loadImportData };
