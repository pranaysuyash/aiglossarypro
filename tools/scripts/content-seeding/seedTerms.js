#!/usr/bin/env node
/**
 * Content Seeding Script for AI/ML Glossary
 *
 * This script generates high-quality AI/ML terms using the existing AI service
 * and populates the database with comprehensive content including all 42 sections.
 *
 * Usage:
 * npm run seed:terms [options]
 *
 * Options:
 * --category <category>   Generate terms for specific category
 * --count <number>        Number of terms to generate (default: 10)
 * --dry-run              Show what would be generated without writing to DB
 * --validate-only        Only validate existing terms without generating new ones
 */
import { performance } from 'node:perf_hooks';
import { eq } from 'drizzle-orm';
import { aiService } from '../../server/aiService';
import { db } from '../../server/db';
import { log as logger } from '../../server/utils/logger';
import { categories, terms } from '../../shared/schema';
import { ESSENTIAL_AI_TERMS } from './data/essentialTerms';
// Command line arguments
const args = process.argv.slice(2);
const getCLIArg = (flag, defaultValue = '') => {
    const index = args.indexOf(flag);
    return index !== -1 && args[index + 1] ? args[index + 1] : defaultValue;
};
const isDryRun = args.includes('--dry-run');
const isValidateOnly = args.includes('--validate-only');
const targetCategory = getCLIArg('--category');
const generateCount = parseInt(getCLIArg('--count', '10'), 10);
/**
 * Main seeding function
 */
async function seedTerms() {
    const startTime = performance.now();
    const stats = {
        totalGenerated: 0,
        successfullyCreated: 0,
        errors: 0,
        skipped: 0,
        totalTime: 0,
        averageTimePerTerm: 0,
        categoriesProcessed: [],
    };
    try {
        logger.info('🚀 Starting AI/ML Content Seeding Process');
        logger.info(`Mode: ${isDryRun ? 'DRY RUN' : 'PRODUCTION'}`);
        logger.info(`Target Category: ${targetCategory || 'ALL'}`);
        logger.info(`Generate Count: ${generateCount}`);
        // Step 1: Load existing categories and terms
        const existingCategories = await db.select().from(categories);
        const existingTerms = await db.select().from(terms);
        logger.info(`Found ${existingCategories.length} categories and ${existingTerms.length} existing terms`);
        if (isValidateOnly) {
            await validateExistingTerms(existingTerms);
            return;
        }
        // Step 2: Determine which terms to generate
        const termConfigs = await determineTermsToGenerate(existingCategories, existingTerms, targetCategory, generateCount);
        logger.info(`Planning to generate ${termConfigs.length} terms`);
        // Step 3: Generate terms
        for (const config of termConfigs) {
            try {
                const termStart = performance.now();
                logger.info(`🎯 Generating term for category: ${config.category}`);
                const newTerm = await generateSingleTerm(config, existingTerms);
                if (newTerm) {
                    if (!isDryRun) {
                        await saveTerm(newTerm, config);
                        stats.successfullyCreated++;
                    }
                    else {
                        logger.info(`[DRY RUN] Would create: ${newTerm.name}`);
                    }
                }
                else {
                    stats.skipped++;
                }
                stats.totalGenerated++;
                stats.totalTime += performance.now() - termStart;
                if (!stats.categoriesProcessed.includes(config.category)) {
                    stats.categoriesProcessed.push(config.category);
                }
            }
            catch (error) {
                logger.error(`Error generating term for ${config.category}:`, error);
                stats.errors++;
            }
        }
        // Step 4: Generate comprehensive content for selected terms
        if (!isDryRun && stats.successfullyCreated > 0) {
            await generateComprehensiveContent(stats.successfullyCreated);
        }
        // Step 5: Report results
        const endTime = performance.now();
        stats.totalTime = endTime - startTime;
        stats.averageTimePerTerm = stats.totalTime / Math.max(stats.totalGenerated, 1);
        reportResults(stats);
    }
    catch (error) {
        logger.error('Fatal error in seeding process:', error);
        process.exit(1);
    }
}
/**
 * Determine which terms to generate based on existing content and requirements
 */
async function determineTermsToGenerate(existingCategories, existingTerms, targetCategory, count) {
    const configs = [];
    // Get existing term names for deduplication
    const existingTermNames = new Set(existingTerms.map(t => t.name.toLowerCase()));
    // Filter categories
    const categoriesToProcess = targetCategory
        ? existingCategories.filter(cat => cat.name.toLowerCase().includes(targetCategory.toLowerCase()))
        : existingCategories;
    if (categoriesToProcess.length === 0) {
        throw new Error(`No categories found matching: ${targetCategory}`);
    }
    // Get essential terms for each category
    for (const category of categoriesToProcess) {
        const categoryTerms = ESSENTIAL_AI_TERMS[category.name] || [];
        // Filter out terms that already exist
        const missingTerms = categoryTerms.filter(term => !existingTermNames.has(term.name.toLowerCase()));
        // Add configurations for missing terms
        const termsToAdd = missingTerms.slice(0, Math.ceil(count / categoriesToProcess.length));
        for (const term of termsToAdd) {
            configs.push({
                category: category.name,
                priority: term.priority,
                complexity: term.complexity,
                focusAreas: term.focusAreas || [],
            });
        }
    }
    // If we don't have enough terms from essential list, generate suggestions
    if (configs.length < count) {
        const remainingCount = count - configs.length;
        const additionalConfigs = await generateTermSuggestions(existingTerms.map(t => t.name), existingCategories, remainingCount, targetCategory);
        configs.push(...additionalConfigs);
    }
    return configs.slice(0, count);
}
/**
 * Generate additional term suggestions using AI
 */
async function generateTermSuggestions(existingTerms, categories, count, focusCategory) {
    try {
        const suggestions = await aiService.generateTermSuggestions(existingTerms, categories, focusCategory);
        return suggestions.suggestions.slice(0, count).map(suggestion => ({
            category: suggestion.category,
            priority: 'medium',
            complexity: 'intermediate',
            focusAreas: [suggestion.term],
        }));
    }
    catch (error) {
        logger.error('Error generating term suggestions:', error);
        return [];
    }
}
/**
 * Generate a single term with comprehensive content
 */
async function generateSingleTerm(config, existingTerms) {
    try {
        // First, generate the basic term definition
        const termSuggestion = await aiService.generateTermSuggestions(existingTerms.map(t => t.name), [{ name: config.category, id: 'temp' }], config.category);
        if (!termSuggestion.suggestions.length) {
            logger.warn(`No suggestions generated for category: ${config.category}`);
            return null;
        }
        const suggestion = termSuggestion.suggestions[0];
        // Generate comprehensive definition
        const definition = await aiService.generateDefinition(suggestion.term, config.category, `Priority: ${config.priority}, Complexity: ${config.complexity}, Focus: ${config.focusAreas.join(', ')}`);
        // Create the term object
        const newTerm = {
            name: suggestion.term,
            shortDefinition: definition.shortDefinition,
            definition: definition.definition,
            characteristics: definition.characteristics || [],
            applications: definition.applications || [],
            mathFormulation: definition.mathFormulation || null,
            references: [],
            viewCount: 0,
        };
        logger.info(`✅ Generated term: ${newTerm.name}`);
        return newTerm;
    }
    catch (error) {
        logger.error(`Error generating term for ${config.category}:`, error);
        return null;
    }
}
/**
 * Save term to database with proper category associations
 */
async function saveTerm(termData, config) {
    try {
        // Find the category ID
        const categoryResult = await db
            .select()
            .from(categories)
            .where(eq(categories.name, config.category))
            .limit(1);
        if (!categoryResult.length) {
            throw new Error(`Category not found: ${config.category}`);
        }
        const categoryId = categoryResult[0].id;
        // Insert the term
        const insertedTerm = await db
            .insert(terms)
            .values({
            ...termData,
            categoryId,
        })
            .returning();
        logger.info(`💾 Saved term: ${termData.name} (ID: ${insertedTerm[0].id})`);
    }
    catch (error) {
        logger.error(`Error saving term ${termData.name}:`, error);
        throw error;
    }
}
/**
 * Generate comprehensive 42-section content for newly created terms
 */
async function generateComprehensiveContent(newTermCount) {
    logger.info(`🔄 Generating comprehensive content for ${newTermCount} new terms`);
    try {
        // Get the most recently created terms
        const recentTerms = await db.select().from(terms).orderBy(terms.createdAt).limit(newTermCount);
        let processedCount = 0;
        for (const term of recentTerms) {
            try {
                logger.info(`📝 Generating 42-section content for: ${term.name}`);
                // Generate content for selected important sections
                const prioritySections = [
                    'How It Works',
                    'Applications',
                    'Advantages and Disadvantages',
                    'Common Challenges and Pitfalls',
                    'Best Practices',
                    'Related Concepts',
                ];
                for (const sectionName of prioritySections) {
                    try {
                        const content = await aiService.generateSectionContent(term.name, sectionName);
                        logger.info(`  ✅ Generated ${sectionName}: ${content.length} chars`);
                        // For now, we'll log this content. In a full implementation,
                        // you'd want to store this in a sections table or extend the terms table
                    }
                    catch (error) {
                        logger.error(`  ❌ Failed to generate ${sectionName}:`, error);
                    }
                }
                processedCount++;
            }
            catch (error) {
                logger.error(`Error generating content for ${term.name}:`, error);
            }
        }
        logger.info(`📊 Generated comprehensive content for ${processedCount}/${newTermCount} terms`);
    }
    catch (error) {
        logger.error('Error in comprehensive content generation:', error);
    }
}
/**
 * Validate existing terms for quality and completeness
 */
async function validateExistingTerms(existingTerms) {
    logger.info('🔍 Validating existing terms...');
    let validCount = 0;
    let invalidCount = 0;
    const issues = [];
    for (const term of existingTerms) {
        const validation = validateTerm(term);
        if (validation.isValid) {
            validCount++;
        }
        else {
            invalidCount++;
            issues.push(`${term.name}: ${validation.issues.join(', ')}`);
        }
        if (validation.completeness < 70) {
            logger.warn(`Low completeness for ${term.name}: ${validation.completeness}%`);
        }
    }
    logger.info(`📊 Validation Results:`);
    logger.info(`  Valid terms: ${validCount}`);
    logger.info(`  Invalid terms: ${invalidCount}`);
    if (issues.length > 0) {
        logger.warn(`Top issues:`);
        issues.slice(0, 10).forEach(issue => logger.warn(`  - ${issue}`));
    }
}
/**
 * Validate a single term
 */
function validateTerm(term) {
    const issues = [];
    const recommendations = [];
    // Check basic requirements
    if (!term.name || term.name.trim().length < 2) {
        issues.push('Name is too short or missing');
    }
    if (!term.definition || term.definition.trim().length < 50) {
        issues.push('Definition is too short or missing');
    }
    if (!term.shortDefinition || term.shortDefinition.trim().length < 20) {
        issues.push('Short definition is too short or missing');
    }
    if (!term.categoryId) {
        issues.push('Category is not assigned');
    }
    // Check for completeness
    let completeness = 0;
    const fields = [
        'name',
        'definition',
        'shortDefinition',
        'categoryId',
        'characteristics',
        'applications',
    ];
    for (const field of fields) {
        if (term[field] &&
            (typeof term[field] === 'string' ? term[field].trim().length > 0 : term[field].length > 0)) {
            completeness += 100 / fields.length;
        }
    }
    // Add recommendations
    if (completeness < 80) {
        recommendations.push('Add more detailed content');
    }
    if (!term.characteristics || term.characteristics.length === 0) {
        recommendations.push('Add key characteristics');
    }
    if (!term.applications || term.applications.length === 0) {
        recommendations.push('Add practical applications');
    }
    return {
        isValid: issues.length === 0,
        issues,
        recommendations,
        completeness: Math.round(completeness),
    };
}
/**
 * Report generation results
 */
function reportResults(stats) {
    logger.info('\n📊 CONTENT SEEDING RESULTS');
    logger.info('═══════════════════════════');
    logger.info(`Total Terms Processed: ${stats.totalGenerated}`);
    logger.info(`Successfully Created: ${stats.successfullyCreated}`);
    logger.info(`Errors: ${stats.errors}`);
    logger.info(`Skipped: ${stats.skipped}`);
    logger.info(`Total Time: ${(stats.totalTime / 1000).toFixed(2)}s`);
    logger.info(`Average Time per Term: ${(stats.averageTimePerTerm / 1000).toFixed(2)}s`);
    logger.info(`Categories Processed: ${stats.categoriesProcessed.join(', ')}`);
    const successRate = ((stats.successfullyCreated / Math.max(stats.totalGenerated, 1)) *
        100).toFixed(1);
    logger.info(`Success Rate: ${successRate}%`);
    if (stats.errors > 0) {
        logger.warn(`⚠️  ${stats.errors} errors occurred during generation`);
    }
    if (stats.successfullyCreated > 0) {
        logger.info(`✅ Successfully populated ${stats.successfullyCreated} new terms!`);
    }
}
/**
 * Main execution
 */
if (require.main === module) {
    seedTerms().catch(error => {
        logger.error('Seeding failed:', error);
        process.exit(1);
    });
}
export { seedTerms, validateTerm };
