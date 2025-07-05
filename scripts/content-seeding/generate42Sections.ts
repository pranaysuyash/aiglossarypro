#!/usr/bin/env node

/**
 * 42-Section Content Generator
 * 
 * This script generates comprehensive 42-section content for AI/ML terms
 * using the existing AI service infrastructure. It creates detailed,
 * educational content following the complete structure outlined in the
 * 42-section architecture.
 * 
 * Usage:
 * npm run generate:sections [options]
 * 
 * Options:
 * --term <name>           Generate content for specific term
 * --batch <count>         Process multiple terms (default: 5)
 * --sections <list>       Comma-separated list of specific sections
 * --priority <level>      Focus on priority sections (high/medium/low)
 * --dry-run              Show what would be generated without writing
 * --validate             Validate existing section content
 */

import { db } from '../../server/db';
import { aiService } from '../../server/aiService';
import { terms, categories } from '../../shared/schema';
import { eq, sql, and, not, isNull } from 'drizzle-orm';
import { COMPLETE_CONTENT_SECTIONS } from '../complete_42_sections_config';
import { log as logger } from '../../server/utils/logger';
import { performance } from 'perf_hooks';

// Command line arguments
const args = process.argv.slice(2);
const getCLIArg = (flag: string, defaultValue: string | number = '') => {
  const index = args.indexOf(flag);
  return index !== -1 && args[index + 1] ? args[index + 1] : defaultValue;
};

const isDryRun = args.includes('--dry-run');
const isValidate = args.includes('--validate');
const targetTerm = getCLIArg('--term') as string;
const batchSize = parseInt(getCLIArg('--batch', '5') as string, 10);
const specificSections = getCLIArg('--sections') ? (getCLIArg('--sections') as string).split(',').map(s => s.trim()) : [];
const priorityLevel = getCLIArg('--priority') as 'high' | 'medium' | 'low' | '';

// Priority mapping for sections
const SECTION_PRIORITIES = {
  high: [
    'Introduction',
    'How It Works',
    'Applications',
    'Theoretical Concepts',
    'Implementation',
    'Advantages and Disadvantages',
    'Best Practices',
    'Common Challenges and Pitfalls'
  ],
  medium: [
    'Variants or Extensions',
    'Evaluation and Metrics',
    'Related Concepts',
    'Case Studies',
    'Tools and Frameworks',
    'Historical Context',
    'Future Directions',
    'Ethics and Responsible AI'
  ],
  low: [
    'Industry Insights',
    'Real-world Datasets and Benchmarks',
    'Research Papers',
    'Career Guidance',
    'Hands-on Tutorials',
    'Interactive Elements',
    'Interviews with Experts',
    'Security Considerations'
  ]
};

interface ContentSection {
  sectionName: string;
  columns: string[];
  displayType: 'card' | 'filter' | 'sidebar' | 'main' | 'metadata' | 'interactive';
  parseType: 'simple' | 'list' | 'structured' | 'ai_parse';
}

interface GeneratedContent {
  termId: string;
  termName: string;
  sectionName: string;
  content: string;
  wordCount: number;
  generationTime: number;
  quality: 'excellent' | 'good' | 'fair' | 'poor';
}

interface GenerationStats {
  totalTermsProcessed: number;
  totalSectionsGenerated: number;
  totalWords: number;
  totalTime: number;
  averageTimePerSection: number;
  averageWordsPerSection: number;
  qualityDistribution: { [key: string]: number };
  errors: number;
}

/**
 * Main function to generate 42-section content
 */
async function generate42Sections(): Promise<void> {
  const startTime = performance.now();
  const stats: GenerationStats = {
    totalTermsProcessed: 0,
    totalSectionsGenerated: 0,
    totalWords: 0,
    totalTime: 0,
    averageTimePerSection: 0,
    averageWordsPerSection: 0,
    qualityDistribution: { excellent: 0, good: 0, fair: 0, poor: 0 },
    errors: 0
  };

  try {
    logger.info('🚀 Starting 42-Section Content Generation');
    logger.info(`Mode: ${isDryRun ? 'DRY RUN' : 'PRODUCTION'}`);
    logger.info(`Target Term: ${targetTerm || 'BATCH PROCESSING'}`);
    logger.info(`Batch Size: ${batchSize}`);
    logger.info(`Priority Level: ${priorityLevel || 'ALL'}`);
    logger.info(`Specific Sections: ${specificSections.length ? specificSections.join(', ') : 'ALL'}`);

    if (isValidate) {
      await validateExistingSections();
      return;
    }

    // Step 1: Get terms to process
    const termsToProcess = await getTermsToProcess(targetTerm, batchSize);
    
    if (termsToProcess.length === 0) {
      logger.warn('No terms found to process');
      return;
    }

    logger.info(`Found ${termsToProcess.length} terms to process`);

    // Step 2: Get sections to generate
    const sectionsToGenerate = getSectionsToGenerate(specificSections, priorityLevel);
    
    logger.info(`Will generate ${sectionsToGenerate.length} sections per term`);
    logger.info(`Sections: ${sectionsToGenerate.map(s => s.sectionName).join(', ')}`);

    // Step 3: Generate content for each term
    for (const term of termsToProcess) {
      try {
        logger.info(`\n🎯 Processing term: ${term.name} (ID: ${term.id})`);
        
        const termStats = await generateContentForTerm(term, sectionsToGenerate);
        
        // Update overall stats
        stats.totalTermsProcessed++;
        stats.totalSectionsGenerated += termStats.sectionsGenerated;
        stats.totalWords += termStats.totalWords;
        stats.errors += termStats.errors;
        
        // Update quality distribution
        for (const [quality, count] of Object.entries(termStats.qualityDistribution)) {
          stats.qualityDistribution[quality] += count;
        }

        logger.info(`  ✅ Completed ${termStats.sectionsGenerated} sections (${termStats.totalWords} words)`);
        
      } catch (error) {
        logger.error(`Error processing term ${term.name}:`, error);
        stats.errors++;
      }
    }

    // Step 4: Report results
    const endTime = performance.now();
    stats.totalTime = endTime - startTime;
    stats.averageTimePerSection = stats.totalTime / Math.max(stats.totalSectionsGenerated, 1);
    stats.averageWordsPerSection = stats.totalWords / Math.max(stats.totalSectionsGenerated, 1);

    reportGenerationStats(stats);

  } catch (error) {
    logger.error('Fatal error in 42-section generation:', error);
    process.exit(1);
  }
}

/**
 * Get terms to process based on criteria
 */
async function getTermsToProcess(targetTerm: string, batchSize: number): Promise<any[]> {
  if (targetTerm) {
    // Get specific term
    const termResult = await db
      .select()
      .from(terms)
      .where(eq(terms.name, targetTerm))
      .limit(1);
    
    return termResult;
  } else {
    // Get batch of terms with basic content but missing comprehensive sections
    const termsResult = await db
      .select()
      .from(terms)
      .where(and(
        not(isNull(terms.definition)),
        not(eq(terms.definition, ''))
      ))
      .orderBy(sql`RANDOM()`)
      .limit(batchSize);
    
    return termsResult;
  }
}

/**
 * Get sections to generate based on criteria
 */
function getSectionsToGenerate(specificSections: string[], priorityLevel: string): ContentSection[] {
  let sectionsToGenerate = COMPLETE_CONTENT_SECTIONS;

  // Filter by specific sections if provided
  if (specificSections.length > 0) {
    sectionsToGenerate = sectionsToGenerate.filter(section =>
      specificSections.includes(section.sectionName)
    );
  }

  // Filter by priority level if provided
  if (priorityLevel && SECTION_PRIORITIES[priorityLevel as keyof typeof SECTION_PRIORITIES]) {
    const prioritySections = SECTION_PRIORITIES[priorityLevel as keyof typeof SECTION_PRIORITIES];
    sectionsToGenerate = sectionsToGenerate.filter(section =>
      prioritySections.includes(section.sectionName)
    );
  }

  return sectionsToGenerate;
}

/**
 * Generate content for all sections of a single term
 */
async function generateContentForTerm(
  term: any,
  sections: ContentSection[]
): Promise<{
  sectionsGenerated: number;
  totalWords: number;
  qualityDistribution: { [key: string]: number };
  errors: number;
}> {
  const termStats = {
    sectionsGenerated: 0,
    totalWords: 0,
    qualityDistribution: { excellent: 0, good: 0, fair: 0, poor: 0 },
    errors: 0
  };

  // Get category information for context
  let categoryContext = '';
  if (term.categoryId) {
    const categoryResult = await db
      .select()
      .from(categories)
      .where(eq(categories.id, term.categoryId))
      .limit(1);
    
    if (categoryResult.length > 0) {
      categoryContext = categoryResult[0].name;
    }
  }

  // Generate content for each section
  for (const section of sections) {
    try {
      const sectionStart = performance.now();
      
      logger.info(`    📝 Generating: ${section.sectionName}`);
      
      const content = await generateSectionContent(
        term,
        section,
        categoryContext
      );
      
      if (content) {
        const wordCount = content.split(/\s+/).length;
        const generationTime = performance.now() - sectionStart;
        const quality = assessContentQuality(content, section);
        
        const generatedContent: GeneratedContent = {
          termId: term.id,
          termName: term.name,
          sectionName: section.sectionName,
          content,
          wordCount,
          generationTime,
          quality
        };

        if (!isDryRun) {
          await saveGeneratedContent(generatedContent);
        } else {
          logger.info(`      [DRY RUN] Would save: ${wordCount} words, quality: ${quality}`);
        }

        termStats.sectionsGenerated++;
        termStats.totalWords += wordCount;
        termStats.qualityDistribution[quality]++;

        logger.info(`      ✅ ${wordCount} words, ${(generationTime / 1000).toFixed(2)}s, quality: ${quality}`);
      } else {
        termStats.errors++;
        logger.warn(`      ❌ Failed to generate content`);
      }

    } catch (error) {
      termStats.errors++;
      logger.error(`      ❌ Error generating ${section.sectionName}:`, error);
    }
  }

  return termStats;
}

/**
 * Generate content for a specific section
 */
async function generateSectionContent(
  term: any,
  section: ContentSection,
  categoryContext: string
): Promise<string | null> {
  try {
    // Build context-rich prompt for the section
    const context = buildSectionContext(term, section, categoryContext);
    
    // Use the existing AI service
    const content = await aiService.generateSectionContent(
      term.name,
      section.sectionName
    );

    // Enhance content based on section type
    const enhancedContent = enhanceContentByType(content, section);
    
    return enhancedContent;

  } catch (error) {
    logger.error(`Error generating content for section ${section.sectionName}:`, error);
    return null;
  }
}

/**
 * Build context for section generation
 */
function buildSectionContext(
  term: any,
  section: ContentSection,
  categoryContext: string
): string {
  let context = `Term: ${term.name}\n`;
  context += `Category: ${categoryContext}\n`;
  context += `Definition: ${term.definition}\n`;
  
  if (term.shortDefinition) {
    context += `Short Definition: ${term.shortDefinition}\n`;
  }
  
  if (term.characteristics && term.characteristics.length > 0) {
    context += `Characteristics: ${term.characteristics.join(', ')}\n`;
  }
  
  if (term.applications && term.applications.length > 0) {
    const appNames = term.applications.map((app: any) => 
      typeof app === 'string' ? app : app.name || 'Unknown'
    );
    context += `Applications: ${appNames.join(', ')}\n`;
  }
  
  context += `\nSection Type: ${section.sectionName}\n`;
  context += `Display Type: ${section.displayType}\n`;
  context += `Expected Columns: ${section.columns.slice(0, 3).join(', ')}...\n`;
  
  return context;
}

/**
 * Enhance content based on section type
 */
function enhanceContentByType(content: string, section: ContentSection): string {
  switch (section.parseType) {
    case 'structured':
      return enhanceStructuredContent(content, section);
    case 'list':
      return enhanceListContent(content, section);
    case 'ai_parse':
      return enhanceAIParseContent(content, section);
    default:
      return content;
  }
}

/**
 * Enhance structured content
 */
function enhanceStructuredContent(content: string, section: ContentSection): string {
  // Add structure markers for sections that need them
  if (section.sectionName.includes('Implementation')) {
    if (!content.includes('```')) {
      // Add code block formatting hints
      content += '\n\n[Code examples would be included here with proper syntax highlighting]';
    }
  }
  
  if (section.sectionName.includes('Mathematics') || section.sectionName.includes('Theoretical')) {
    if (!content.includes('formula') && !content.includes('equation')) {
      content += '\n\n[Mathematical formulations would be displayed here using LaTeX formatting]';
    }
  }
  
  return content;
}

/**
 * Enhance list content
 */
function enhanceListContent(content: string, section: ContentSection): string {
  // Ensure list format for sections that should be lists
  const lines = content.split('\n').filter(line => line.trim());
  
  if (lines.length > 1 && !content.includes('•') && !content.includes('-') && !content.includes('1.')) {
    return lines.map((line, index) => `${index + 1}. ${line.trim()}`).join('\n');
  }
  
  return content;
}

/**
 * Enhance AI-parsed content
 */
function enhanceAIParseContent(content: string, section: ContentSection): string {
  // Add metadata or structured markers for AI-parsed content
  if (section.sectionName.includes('Tags')) {
    // Ensure tag-like format
    const tags = content.split(/[,\n]/).map(tag => tag.trim()).filter(tag => tag);
    return tags.map(tag => `#${tag.replace(/^#/, '')}`).join(', ');
  }
  
  return content;
}

/**
 * Assess content quality
 */
function assessContentQuality(content: string, section: ContentSection): 'excellent' | 'good' | 'fair' | 'poor' {
  const wordCount = content.split(/\s+/).length;
  const hasStructure = content.includes('\n') || content.includes(':') || content.includes('•');
  const hasDetail = wordCount > 50;
  const hasExamples = content.toLowerCase().includes('example') || content.toLowerCase().includes('instance');
  
  let score = 0;
  
  // Word count scoring
  if (wordCount > 100) score += 3;
  else if (wordCount > 50) score += 2;
  else if (wordCount > 20) score += 1;
  
  // Structure scoring
  if (hasStructure) score += 2;
  
  // Detail scoring
  if (hasDetail) score += 2;
  
  // Examples scoring
  if (hasExamples) score += 1;
  
  // Section-specific scoring
  if (section.parseType === 'structured' && hasStructure) score += 1;
  if (section.displayType === 'interactive' && content.includes('interactive')) score += 1;
  
  if (score >= 7) return 'excellent';
  if (score >= 5) return 'good';
  if (score >= 3) return 'fair';
  return 'poor';
}

/**
 * Save generated content (placeholder - would integrate with actual storage)
 */
async function saveGeneratedContent(generatedContent: GeneratedContent): Promise<void> {
  // In a full implementation, this would save to a sections table or extend the terms table
  // For now, we'll log the content structure
  
  logger.info(`💾 Saving section: ${generatedContent.sectionName} for term: ${generatedContent.termName}`);
  
  // Here you would typically:
  // 1. Insert into a term_sections table
  // 2. Update the terms table with section data
  // 3. Cache the content for fast retrieval
  // 4. Index the content for search
  
  // Example structure for a sections table:
  // await db.insert(termSections).values({
  //   termId: generatedContent.termId,
  //   sectionName: generatedContent.sectionName,
  //   content: generatedContent.content,
  //   wordCount: generatedContent.wordCount,
  //   quality: generatedContent.quality,
  //   generatedAt: new Date()
  // });
}

/**
 * Validate existing sections
 */
async function validateExistingSections(): Promise<void> {
  logger.info('🔍 Validating existing section content...');
  
  // This would validate existing comprehensive content
  // For now, we'll check what basic content exists
  
  const existingTerms = await db.select().from(terms);
  
  let termsWithContent = 0;
  let termsWithBasicContent = 0;
  let termsWithComprehensiveContent = 0;
  
  for (const term of existingTerms) {
    if (term.definition && term.definition.trim().length > 0) {
      termsWithContent++;
      
      if (term.shortDefinition && term.characteristics && term.applications) {
        termsWithBasicContent++;
      }
      
      // Check for signs of comprehensive content
      const definitionLength = term.definition.length;
      if (definitionLength > 1000) {
        termsWithComprehensiveContent++;
      }
    }
  }
  
  logger.info(`📊 Content Validation Results:`);
  logger.info(`  Total terms: ${existingTerms.length}`);
  logger.info(`  Terms with content: ${termsWithContent}`);
  logger.info(`  Terms with basic content: ${termsWithBasicContent}`);
  logger.info(`  Terms with comprehensive content: ${termsWithComprehensiveContent}`);
  
  const contentCoverage = (termsWithContent / existingTerms.length * 100).toFixed(1);
  const comprehensiveCoverage = (termsWithComprehensiveContent / existingTerms.length * 100).toFixed(1);
  
  logger.info(`  Content coverage: ${contentCoverage}%`);
  logger.info(`  Comprehensive coverage: ${comprehensiveCoverage}%`);
  
  if (comprehensiveCoverage < '20') {
    logger.warn('⚠️  Low comprehensive content coverage. Consider running section generation.');
  }
}

/**
 * Report generation statistics
 */
function reportGenerationStats(stats: GenerationStats): void {
  logger.info('\n📊 42-SECTION GENERATION RESULTS');
  logger.info('════════════════════════════════');
  logger.info(`Terms Processed: ${stats.totalTermsProcessed}`);
  logger.info(`Sections Generated: ${stats.totalSectionsGenerated}`);
  logger.info(`Total Words: ${stats.totalWords.toLocaleString()}`);
  logger.info(`Total Time: ${(stats.totalTime / 1000).toFixed(2)}s`);
  logger.info(`Average Time per Section: ${(stats.averageTimePerSection / 1000).toFixed(2)}s`);
  logger.info(`Average Words per Section: ${Math.round(stats.averageWordsPerSection)}`);
  logger.info(`Errors: ${stats.errors}`);
  
  logger.info('\n📈 Quality Distribution:');
  for (const [quality, count] of Object.entries(stats.qualityDistribution)) {
    const percentage = stats.totalSectionsGenerated > 0 ? 
      (count / stats.totalSectionsGenerated * 100).toFixed(1) : '0';
    logger.info(`  ${quality}: ${count} (${percentage}%)`);
  }
  
  const successRate = stats.totalSectionsGenerated > 0 ? 
    ((stats.totalSectionsGenerated - stats.errors) / stats.totalSectionsGenerated * 100).toFixed(1) : '0';
  logger.info(`\n✅ Success Rate: ${successRate}%`);
  
  if (stats.totalSectionsGenerated > 0) {
    const estimatedFullContent = stats.totalSectionsGenerated * 42; // If all 42 sections were generated
    logger.info(`\n🎯 Content Scale: Generated ${stats.totalSectionsGenerated} sections`);
    logger.info(`   (Equivalent to ${(stats.totalSectionsGenerated / 42).toFixed(1)} complete 42-section terms)`);
  }
}

/**
 * Main execution
 */
if (require.main === module) {
  generate42Sections().catch(error => {
    logger.error('42-section generation failed:', error);
    process.exit(1);
  });
}

export { generate42Sections, generateSectionContent, assessContentQuality };