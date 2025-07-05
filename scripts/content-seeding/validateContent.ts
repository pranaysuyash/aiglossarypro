#!/usr/bin/env node

/**
 * Content Quality Validation and Verification System
 * 
 * This script provides comprehensive validation and verification workflows
 * for AI-generated content in the glossary. It ensures content quality,
 * consistency, and completeness across all terms and sections.
 * 
 * Usage:
 * npm run validate:content [options]
 * 
 * Options:
 * --type <validation>     Type of validation (quality|completeness|consistency|all)
 * --term <name>          Validate specific term
 * --fix                  Automatically fix issues where possible
 * --report              Generate detailed validation report
 * --threshold <score>    Quality threshold (0-100, default: 70)
 */

import { db } from '../../server/db';
import { aiService } from '../../server/aiService';
import { terms, categories } from '../../shared/schema';
import { eq, sql, and, not, isNull, like } from 'drizzle-orm';
import { COMPLETE_CONTENT_SECTIONS } from '../complete_42_sections_config';
import { ESSENTIAL_AI_TERMS, getAllEssentialTerms } from './data/essentialTerms';
import { log as logger } from '../../server/utils/logger';
import { performance } from 'perf_hooks';
import fs from 'fs/promises';
import path from 'path';

// Command line arguments
const args = process.argv.slice(2);
const getCLIArg = (flag: string, defaultValue: string | number = '') => {
  const index = args.indexOf(flag);
  return index !== -1 && args[index + 1] ? args[index + 1] : defaultValue;
};

const validationType = getCLIArg('--type', 'all') as string;
const targetTerm = getCLIArg('--term') as string;
const shouldFix = args.includes('--fix');
const shouldReport = args.includes('--report');
const qualityThreshold = parseInt(getCLIArg('--threshold', '70') as string, 10);

// Validation types
type ValidationType = 'quality' | 'completeness' | 'consistency' | 'all';

interface ValidationIssue {
  type: 'error' | 'warning' | 'info';
  category: string;
  message: string;
  termId?: string;
  termName?: string;
  sectionName?: string;
  fixable: boolean;
  fixAction?: string;
}

interface ValidationResult {
  termId: string;
  termName: string;
  overallScore: number;
  qualityScore: number;
  completenessScore: number;
  consistencyScore: number;
  issues: ValidationIssue[];
  recommendations: string[];
}

interface ValidationReport {
  timestamp: string;
  totalTerms: number;
  validationResults: ValidationResult[];
  summary: {
    averageQualityScore: number;
    averageCompletenessScore: number;
    averageConsistencyScore: number;
    totalIssues: number;
    fixableIssues: number;
    termsAboveThreshold: number;
    termsBelowThreshold: number;
  };
  categoryBreakdown: { [category: string]: { count: number; averageScore: number } };
}

/**
 * Main validation function
 */
async function validateContent(): Promise<void> {
  const startTime = performance.now();

  try {
    logger.info('🔍 Starting Content Validation Process');
    logger.info(`Validation Type: ${validationType}`);
    logger.info(`Target Term: ${targetTerm || 'ALL'}`);
    logger.info(`Quality Threshold: ${qualityThreshold}`);
    logger.info(`Auto-fix: ${shouldFix ? 'ENABLED' : 'DISABLED'}`);

    // Step 1: Get terms to validate
    const termsToValidate = await getTermsToValidate(targetTerm);
    
    if (termsToValidate.length === 0) {
      logger.warn('No terms found to validate');
      return;
    }

    logger.info(`Found ${termsToValidate.length} terms to validate`);

    // Step 2: Perform validation
    const validationResults: ValidationResult[] = [];
    let processedCount = 0;

    for (const term of termsToValidate) {
      try {
        logger.info(`\n🎯 Validating: ${term.name} (${++processedCount}/${termsToValidate.length})`);
        
        const result = await validateTerm(term, validationType as ValidationType);
        validationResults.push(result);
        
        // Auto-fix if requested
        if (shouldFix && result.issues.some(issue => issue.fixable)) {
          await autoFixIssues(term, result.issues.filter(issue => issue.fixable));
        }
        
        logger.info(`  Score: ${result.overallScore}/100 (Q:${result.qualityScore} C:${result.completenessScore} Cons:${result.consistencyScore})`);
        
        if (result.issues.length > 0) {
          logger.info(`  Issues: ${result.issues.length} (${result.issues.filter(i => i.fixable).length} fixable)`);
        }

      } catch (error) {
        logger.error(`Error validating term ${term.name}:`, error);
      }
    }

    // Step 3: Generate report
    const report = generateValidationReport(validationResults);
    
    // Step 4: Output results
    if (shouldReport) {
      await saveValidationReport(report);
    }
    
    const endTime = performance.now();
    const duration = (endTime - startTime) / 1000;

    displayValidationSummary(report, duration);

  } catch (error) {
    logger.error('Fatal error in content validation:', error);
    process.exit(1);
  }
}

/**
 * Get terms to validate
 */
async function getTermsToValidate(targetTerm: string): Promise<any[]> {
  if (targetTerm) {
    const termResult = await db
      .select()
      .from(terms)
      .leftJoin(categories, eq(terms.categoryId, categories.id))
      .where(eq(terms.name, targetTerm))
      .limit(1);
    
    return termResult.map(row => ({ ...row.terms, category: row.categories?.name }));
  } else {
    const termsResult = await db
      .select()
      .from(terms)
      .leftJoin(categories, eq(terms.categoryId, categories.id))
      .orderBy(terms.name);
    
    return termsResult.map(row => ({ ...row.terms, category: row.categories?.name }));
  }
}

/**
 * Validate a single term
 */
async function validateTerm(term: any, validationType: ValidationType): Promise<ValidationResult> {
  const issues: ValidationIssue[] = [];
  const recommendations: string[] = [];
  
  let qualityScore = 0;
  let completenessScore = 0;
  let consistencyScore = 0;

  // Quality validation
  if (validationType === 'quality' || validationType === 'all') {
    const qualityResult = await validateQuality(term);
    qualityScore = qualityResult.score;
    issues.push(...qualityResult.issues);
    recommendations.push(...qualityResult.recommendations);
  }

  // Completeness validation
  if (validationType === 'completeness' || validationType === 'all') {
    const completenessResult = await validateCompleteness(term);
    completenessScore = completenessResult.score;
    issues.push(...completenessResult.issues);
    recommendations.push(...completenessResult.recommendations);
  }

  // Consistency validation
  if (validationType === 'consistency' || validationType === 'all') {
    const consistencyResult = await validateConsistency(term);
    consistencyScore = consistencyResult.score;
    issues.push(...consistencyResult.issues);
    recommendations.push(...consistencyResult.recommendations);
  }

  // Calculate overall score
  const scores = [qualityScore, completenessScore, consistencyScore].filter(s => s > 0);
  const overallScore = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;

  return {
    termId: term.id,
    termName: term.name,
    overallScore,
    qualityScore,
    completenessScore,
    consistencyScore,
    issues,
    recommendations: [...new Set(recommendations)] // Remove duplicates
  };
}

/**
 * Validate content quality
 */
async function validateQuality(term: any): Promise<{ score: number; issues: ValidationIssue[]; recommendations: string[] }> {
  const issues: ValidationIssue[] = [];
  const recommendations: string[] = [];
  let score = 100;

  // Check definition quality
  if (!term.definition || term.definition.trim().length < 50) {
    issues.push({
      type: 'error',
      category: 'Quality',
      message: 'Definition is too short or missing',
      termId: term.id,
      termName: term.name,
      fixable: true,
      fixAction: 'regenerate_definition'
    });
    score -= 30;
  } else {
    // Check for AI-generated quality indicators
    const definitionQuality = assessTextQuality(term.definition);
    if (definitionQuality < 70) {
      issues.push({
        type: 'warning',
        category: 'Quality',
        message: 'Definition quality could be improved',
        termId: term.id,
        termName: term.name,
        fixable: true,
        fixAction: 'improve_definition'
      });
      score -= 15;
    }
  }

  // Check short definition quality
  if (!term.shortDefinition || term.shortDefinition.trim().length < 20) {
    issues.push({
      type: 'warning',
      category: 'Quality',
      message: 'Short definition is too brief or missing',
      termId: term.id,
      termName: term.name,
      fixable: true,
      fixAction: 'generate_short_definition'
    });
    score -= 10;
  }

  // Check for spelling and grammar issues
  const textIssues = await checkTextIssues(term.definition + ' ' + (term.shortDefinition || ''));
  if (textIssues.length > 0) {
    issues.push({
      type: 'warning',
      category: 'Quality',
      message: `Found ${textIssues.length} potential text issues`,
      termId: term.id,
      termName: term.name,
      fixable: true,
      fixAction: 'fix_text_issues'
    });
    score -= Math.min(textIssues.length * 2, 15);
  }

  // Add recommendations
  if (score < 80) {
    recommendations.push('Consider regenerating content with higher quality prompts');
  }
  if (!term.mathFormulation && term.category?.toLowerCase().includes('algorithm')) {
    recommendations.push('Consider adding mathematical formulation for algorithmic terms');
  }

  return { score: Math.max(score, 0), issues, recommendations };
}

/**
 * Validate content completeness
 */
async function validateCompleteness(term: any): Promise<{ score: number; issues: ValidationIssue[]; recommendations: string[] }> {
  const issues: ValidationIssue[] = [];
  const recommendations: string[] = [];
  let score = 100;

  // Check basic required fields
  const requiredFields = [
    { field: 'name', weight: 10, message: 'Term name is missing' },
    { field: 'definition', weight: 30, message: 'Definition is missing' },
    { field: 'shortDefinition', weight: 15, message: 'Short definition is missing' },
    { field: 'categoryId', weight: 10, message: 'Category is not assigned' }
  ];

  for (const { field, weight, message } of requiredFields) {
    if (!term[field] || (typeof term[field] === 'string' && term[field].trim().length === 0)) {
      issues.push({
        type: 'error',
        category: 'Completeness',
        message,
        termId: term.id,
        termName: term.name,
        fixable: field !== 'name',
        fixAction: `generate_${field}`
      });
      score -= weight;
    }
  }

  // Check optional enrichment fields
  const enrichmentFields = [
    { field: 'characteristics', weight: 10, message: 'Key characteristics are missing' },
    { field: 'applications', weight: 15, message: 'Applications are missing' },
    { field: 'references', weight: 5, message: 'References are missing' },
    { field: 'mathFormulation', weight: 10, message: 'Mathematical formulation is missing (if applicable)' }
  ];

  for (const { field, weight, message } of enrichmentFields) {
    const value = term[field];
    const isEmpty = !value || 
      (Array.isArray(value) && value.length === 0) ||
      (typeof value === 'string' && value.trim().length === 0);

    if (isEmpty) {
      const isRequired = (field === 'mathFormulation' && term.category?.toLowerCase().includes('algorithm')) ||
                        field === 'characteristics' || field === 'applications';
      
      issues.push({
        type: isRequired ? 'warning' : 'info',
        category: 'Completeness',
        message,
        termId: term.id,
        termName: term.name,
        fixable: true,
        fixAction: `generate_${field}`
      });
      
      if (isRequired) {
        score -= weight;
      } else {
        score -= weight / 2;
      }
    }
  }

  // Check for 42-section completeness
  const sectionCompleteness = calculateSectionCompleteness(term);
  if (sectionCompleteness < 20) {
    recommendations.push('Generate comprehensive 42-section content');
    score -= 20;
  }

  return { score: Math.max(score, 0), issues, recommendations };
}

/**
 * Validate content consistency
 */
async function validateConsistency(term: any): Promise<{ score: number; issues: ValidationIssue[]; recommendations: string[] }> {
  const issues: ValidationIssue[] = [];
  const recommendations: string[] = [];
  let score = 100;

  // Check definition consistency
  if (term.definition && term.shortDefinition) {
    const consistencyScore = await checkDefinitionConsistency(term.definition, term.shortDefinition);
    if (consistencyScore < 70) {
      issues.push({
        type: 'warning',
        category: 'Consistency',
        message: 'Definition and short definition may not be consistent',
        termId: term.id,
        termName: term.name,
        fixable: true,
        fixAction: 'align_definitions'
      });
      score -= 15;
    }
  }

  // Check category consistency
  if (term.category && term.definition) {
    const categoryConsistency = await checkCategoryConsistency(term.name, term.definition, term.category);
    if (categoryConsistency < 80) {
      issues.push({
        type: 'warning',
        category: 'Consistency',
        message: 'Term may not fit well in assigned category',
        termId: term.id,
        termName: term.name,
        fixable: true,
        fixAction: 'verify_category'
      });
      score -= 10;
    }
  }

  // Check for duplicate or near-duplicate terms
  const duplicates = await findSimilarTerms(term.name, term.id);
  if (duplicates.length > 0) {
    issues.push({
      type: 'warning',
      category: 'Consistency',
      message: `Found ${duplicates.length} similar terms: ${duplicates.map(d => d.name).join(', ')}`,
      termId: term.id,
      termName: term.name,
      fixable: false
    });
    score -= 5;
  }

  // Check terminology consistency
  const terminologyIssues = checkTerminologyConsistency(term);
  if (terminologyIssues.length > 0) {
    issues.push(...terminologyIssues.map(issue => ({
      type: 'info' as const,
      category: 'Consistency',
      message: issue,
      termId: term.id,
      termName: term.name,
      fixable: true,
      fixAction: 'standardize_terminology'
    })));
    score -= terminologyIssues.length * 2;
  }

  return { score: Math.max(score, 0), issues, recommendations };
}

/**
 * Auto-fix issues where possible
 */
async function autoFixIssues(term: any, fixableIssues: ValidationIssue[]): Promise<void> {
  logger.info(`  🔧 Auto-fixing ${fixableIssues.length} issues for ${term.name}`);

  for (const issue of fixableIssues) {
    try {
      switch (issue.fixAction) {
        case 'regenerate_definition':
          await regenerateDefinition(term);
          break;
        case 'improve_definition':
          await improveDefinition(term);
          break;
        case 'generate_short_definition':
          await generateShortDefinition(term);
          break;
        case 'generate_characteristics':
          await generateCharacteristics(term);
          break;
        case 'generate_applications':
          await generateApplications(term);
          break;
        default:
          logger.info(`    ⚠️  No auto-fix available for: ${issue.fixAction}`);
      }
    } catch (error) {
      logger.error(`    ❌ Failed to fix ${issue.fixAction}:`, error);
    }
  }
}

/**
 * Helper functions for auto-fixing
 */
async function regenerateDefinition(term: any): Promise<void> {
  try {
    const newDefinition = await aiService.generateDefinition(term.name, term.category);
    
    await db
      .update(terms)
      .set({ 
        definition: newDefinition.definition,
        shortDefinition: newDefinition.shortDefinition
      })
      .where(eq(terms.id, term.id));
      
    logger.info(`    ✅ Regenerated definition for ${term.name}`);
  } catch (error) {
    logger.error(`    ❌ Failed to regenerate definition:`, error);
  }
}

async function improveDefinition(term: any): Promise<void> {
  try {
    const improvedDefinition = await aiService.improveDefinition(term);
    
    await db
      .update(terms)
      .set({ 
        definition: improvedDefinition.definition,
        shortDefinition: improvedDefinition.shortDefinition
      })
      .where(eq(terms.id, term.id));
      
    logger.info(`    ✅ Improved definition for ${term.name}`);
  } catch (error) {
    logger.error(`    ❌ Failed to improve definition:`, error);
  }
}

async function generateShortDefinition(term: any): Promise<void> {
  if (!term.definition) return;
  
  try {
    // Extract first sentence or create concise version
    const sentences = term.definition.split(/[.!?]+/);
    const shortDef = sentences[0]?.trim() + (sentences[0]?.endsWith('.') ? '' : '.');
    
    if (shortDef.length > 20 && shortDef.length < 200) {
      await db
        .update(terms)
        .set({ shortDefinition: shortDef })
        .where(eq(terms.id, term.id));
        
      logger.info(`    ✅ Generated short definition for ${term.name}`);
    }
  } catch (error) {
    logger.error(`    ❌ Failed to generate short definition:`, error);
  }
}

async function generateCharacteristics(term: any): Promise<void> {
  try {
    const content = await aiService.generateSectionContent(term.name, 'Key Characteristics');
    const characteristics = content.split('\n')
      .map(line => line.replace(/^[•\-\d\.]\s*/, '').trim())
      .filter(line => line.length > 0)
      .slice(0, 5);
    
    if (characteristics.length > 0) {
      await db
        .update(terms)
        .set({ characteristics })
        .where(eq(terms.id, term.id));
        
      logger.info(`    ✅ Generated ${characteristics.length} characteristics for ${term.name}`);
    }
  } catch (error) {
    logger.error(`    ❌ Failed to generate characteristics:`, error);
  }
}

async function generateApplications(term: any): Promise<void> {
  try {
    const content = await aiService.generateSectionContent(term.name, 'Applications');
    const appLines = content.split('\n')
      .map(line => line.replace(/^[•\-\d\.]\s*/, '').trim())
      .filter(line => line.length > 0)
      .slice(0, 5);
    
    const applications = appLines.map(line => ({
      name: line.split(':')[0]?.trim() || line.substring(0, 50),
      description: line.includes(':') ? line.split(':').slice(1).join(':').trim() : line
    }));
    
    if (applications.length > 0) {
      await db
        .update(terms)
        .set({ applications })
        .where(eq(terms.id, term.id));
        
      logger.info(`    ✅ Generated ${applications.length} applications for ${term.name}`);
    }
  } catch (error) {
    logger.error(`    ❌ Failed to generate applications:`, error);
  }
}

/**
 * Helper validation functions
 */
function assessTextQuality(text: string): number {
  if (!text) return 0;
  
  let score = 100;
  
  // Length check
  if (text.length < 50) score -= 30;
  else if (text.length < 100) score -= 15;
  
  // Sentence structure
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
  if (sentences.length < 2) score -= 20;
  
  // Word variety
  const words = text.toLowerCase().split(/\s+/);
  const uniqueWords = new Set(words);
  const variety = uniqueWords.size / words.length;
  if (variety < 0.5) score -= 15;
  
  // Technical depth indicators
  const technicalWords = ['algorithm', 'model', 'data', 'learning', 'neural', 'training', 'optimization'];
  const hasTechnicalTerms = technicalWords.some(word => text.toLowerCase().includes(word));
  if (!hasTechnicalTerms) score -= 10;
  
  return Math.max(score, 0);
}

async function checkTextIssues(text: string): Promise<string[]> {
  const issues: string[] = [];
  
  // Simple checks for common issues
  if (text.includes('  ')) issues.push('Multiple consecutive spaces');
  if (text.match(/[a-z]\.[A-Z]/)) issues.push('Missing space after period');
  if (text.match(/\b(the the|and and|of of|to to|in in)\b/)) issues.push('Repeated words');
  if (text.length > 0 && !text.trim().endsWith('.') && !text.trim().endsWith('!') && !text.trim().endsWith('?')) {
    issues.push('Missing sentence termination');
  }
  
  return issues;
}

async function checkDefinitionConsistency(definition: string, shortDefinition: string): Promise<number> {
  // Simple keyword overlap check
  const defWords = new Set(definition.toLowerCase().split(/\s+/).filter(word => word.length > 3));
  const shortWords = new Set(shortDefinition.toLowerCase().split(/\s+/).filter(word => word.length > 3));
  
  const overlap = [...defWords].filter(word => shortWords.has(word)).length;
  const maxWords = Math.max(defWords.size, shortWords.size);
  
  return maxWords > 0 ? (overlap / maxWords) * 100 : 0;
}

async function checkCategoryConsistency(termName: string, definition: string, category: string): Promise<number> {
  // Check if term appears in essential terms for this category
  const essentialTerms = ESSENTIAL_AI_TERMS[category] || [];
  const isEssential = essentialTerms.some(t => 
    t.name.toLowerCase() === termName.toLowerCase() ||
    t.aliases?.some(alias => alias.toLowerCase() === termName.toLowerCase())
  );
  
  if (isEssential) return 100;
  
  // Check category keywords in definition
  const categoryKeywords = {
    'Machine Learning': ['learning', 'training', 'model', 'algorithm', 'data'],
    'Deep Learning': ['neural', 'network', 'deep', 'layer', 'neuron'],
    'Natural Language Processing': ['language', 'text', 'linguistic', 'nlp', 'word'],
    'Computer Vision': ['image', 'visual', 'vision', 'pixel', 'object'],
    'Statistics': ['statistical', 'probability', 'distribution', 'statistical'],
    'Data Science': ['data', 'analysis', 'insight', 'pattern', 'dataset']
  };
  
  const keywords = categoryKeywords[category] || [];
  const definitionLower = definition.toLowerCase();
  const matches = keywords.filter(keyword => definitionLower.includes(keyword)).length;
  
  return keywords.length > 0 ? (matches / keywords.length) * 100 : 70;
}

async function findSimilarTerms(termName: string, excludeId: string): Promise<any[]> {
  const similarTerms = await db
    .select()
    .from(terms)
    .where(and(
      not(eq(terms.id, excludeId)),
      like(terms.name, `%${termName.substring(0, Math.min(termName.length - 2, 10))}%`)
    ))
    .limit(5);
  
  return similarTerms;
}

function checkTerminologyConsistency(term: any): string[] {
  const issues: string[] = [];
  const text = (term.definition + ' ' + (term.shortDefinition || '')).toLowerCase();
  
  // Common terminology inconsistencies
  const inconsistencies = [
    { wrong: 'artificial intelligence', preferred: 'AI', context: 'when used repeatedly' },
    { wrong: 'machine learning', preferred: 'ML', context: 'when used repeatedly' },
    { wrong: 'deep learning', preferred: 'DL', context: 'when used repeatedly' }
  ];
  
  for (const { wrong, preferred, context } of inconsistencies) {
    const occurrences = (text.match(new RegExp(wrong, 'g')) || []).length;
    if (occurrences > 2) {
      issues.push(`Consider using '${preferred}' instead of '${wrong}' ${context}`);
    }
  }
  
  return issues;
}

function calculateSectionCompleteness(term: any): number {
  // This would check for 42-section content
  // For now, estimate based on available content
  let completeness = 0;
  
  if (term.definition && term.definition.length > 100) completeness += 20;
  if (term.shortDefinition) completeness += 10;
  if (term.characteristics && term.characteristics.length > 0) completeness += 15;
  if (term.applications && term.applications.length > 0) completeness += 15;
  if (term.mathFormulation) completeness += 10;
  if (term.references && term.references.length > 0) completeness += 10;
  
  // Estimate additional sections based on definition length
  if (term.definition && term.definition.length > 1000) completeness += 20;
  
  return Math.min(completeness, 100);
}

/**
 * Generate validation report
 */
function generateValidationReport(results: ValidationResult[]): ValidationReport {
  const timestamp = new Date().toISOString();
  const totalTerms = results.length;
  
  // Calculate summary statistics
  const qualityScores = results.map(r => r.qualityScore).filter(s => s > 0);
  const completenessScores = results.map(r => r.completenessScore).filter(s => s > 0);
  const consistencyScores = results.map(r => r.consistencyScore).filter(s => s > 0);
  
  const averageQualityScore = qualityScores.length > 0 ? 
    Math.round(qualityScores.reduce((a, b) => a + b, 0) / qualityScores.length) : 0;
  const averageCompletenessScore = completenessScores.length > 0 ? 
    Math.round(completenessScores.reduce((a, b) => a + b, 0) / completenessScores.length) : 0;
  const averageConsistencyScore = consistencyScores.length > 0 ? 
    Math.round(consistencyScores.reduce((a, b) => a + b, 0) / consistencyScores.length) : 0;
  
  const allIssues = results.flatMap(r => r.issues);
  const totalIssues = allIssues.length;
  const fixableIssues = allIssues.filter(i => i.fixable).length;
  
  const termsAboveThreshold = results.filter(r => r.overallScore >= qualityThreshold).length;
  const termsBelowThreshold = totalTerms - termsAboveThreshold;
  
  // Category breakdown would require category data
  const categoryBreakdown: { [category: string]: { count: number; averageScore: number } } = {};
  
  return {
    timestamp,
    totalTerms,
    validationResults: results,
    summary: {
      averageQualityScore,
      averageCompletenessScore,
      averageConsistencyScore,
      totalIssues,
      fixableIssues,
      termsAboveThreshold,
      termsBelowThreshold
    },
    categoryBreakdown
  };
}

/**
 * Save validation report to file
 */
async function saveValidationReport(report: ValidationReport): Promise<void> {
  try {
    const reportsDir = path.join(process.cwd(), 'reports', 'validation');
    await fs.mkdir(reportsDir, { recursive: true });
    
    const filename = `validation-report-${new Date().toISOString().split('T')[0]}.json`;
    const filepath = path.join(reportsDir, filename);
    
    await fs.writeFile(filepath, JSON.stringify(report, null, 2), 'utf-8');
    
    logger.info(`📄 Validation report saved: ${filepath}`);
    
    // Also save a summary report
    const summaryFilename = `validation-summary-${new Date().toISOString().split('T')[0]}.txt`;
    const summaryFilepath = path.join(reportsDir, summaryFilename);
    
    const summary = generateSummaryText(report);
    await fs.writeFile(summaryFilepath, summary, 'utf-8');
    
    logger.info(`📄 Summary report saved: ${summaryFilepath}`);
    
  } catch (error) {
    logger.error('Failed to save validation report:', error);
  }
}

/**
 * Generate summary text
 */
function generateSummaryText(report: ValidationReport): string {
  const { summary } = report;
  
  return `
CONTENT VALIDATION SUMMARY
Generated: ${report.timestamp}

OVERVIEW
========
Total Terms Validated: ${report.totalTerms}
Terms Above Threshold (${qualityThreshold}): ${summary.termsAboveThreshold}
Terms Below Threshold: ${summary.termsBelowThreshold}

AVERAGE SCORES
==============
Quality Score: ${summary.averageQualityScore}/100
Completeness Score: ${summary.averageCompletenessScore}/100
Consistency Score: ${summary.averageConsistencyScore}/100

ISSUES IDENTIFIED
=================
Total Issues: ${summary.totalIssues}
Fixable Issues: ${summary.fixableIssues}
Auto-fixable Rate: ${summary.totalIssues > 0 ? Math.round((summary.fixableIssues / summary.totalIssues) * 100) : 0}%

RECOMMENDATIONS
===============
${summary.termsBelowThreshold > 0 ? `- ${summary.termsBelowThreshold} terms need quality improvement` : ''}
${summary.fixableIssues > 0 ? `- Run with --fix flag to automatically fix ${summary.fixableIssues} issues` : ''}
${summary.averageCompletenessScore < 70 ? '- Consider generating comprehensive 42-section content' : ''}
${summary.averageQualityScore < 80 ? '- Review and improve AI generation prompts' : ''}
`.trim();
}

/**
 * Display validation summary
 */
function displayValidationSummary(report: ValidationReport, duration: number): void {
  const { summary } = report;
  
  logger.info('\n📊 CONTENT VALIDATION RESULTS');
  logger.info('═══════════════════════════════');
  logger.info(`Total Terms: ${report.totalTerms}`);
  logger.info(`Validation Time: ${duration.toFixed(2)}s`);
  logger.info(`Average Time per Term: ${(duration / report.totalTerms).toFixed(2)}s`);
  
  logger.info('\n📈 Quality Scores:');
  logger.info(`  Quality: ${summary.averageQualityScore}/100`);
  logger.info(`  Completeness: ${summary.averageCompletenessScore}/100`);
  logger.info(`  Consistency: ${summary.averageConsistencyScore}/100`);
  
  logger.info('\n🎯 Threshold Analysis:');
  logger.info(`  Above Threshold (${qualityThreshold}): ${summary.termsAboveThreshold} (${Math.round((summary.termsAboveThreshold / report.totalTerms) * 100)}%)`);
  logger.info(`  Below Threshold: ${summary.termsBelowThreshold} (${Math.round((summary.termsBelowThreshold / report.totalTerms) * 100)}%)`);
  
  logger.info('\n🔧 Issues Found:');
  logger.info(`  Total Issues: ${summary.totalIssues}`);
  logger.info(`  Fixable Issues: ${summary.fixableIssues}`);
  logger.info(`  Auto-fix Rate: ${summary.totalIssues > 0 ? Math.round((summary.fixableIssues / summary.totalIssues) * 100) : 0}%`);
  
  if (summary.termsBelowThreshold > 0) {
    logger.warn(`\n⚠️  ${summary.termsBelowThreshold} terms need improvement`);
  }
  
  if (summary.fixableIssues > 0 && !shouldFix) {
    logger.info(`\n💡 Run with --fix flag to automatically fix ${summary.fixableIssues} issues`);
  }
  
  logger.info('\n✅ Validation completed successfully!');
}

/**
 * Main execution
 */
if (require.main === module) {
  validateContent().catch(error => {
    logger.error('Content validation failed:', error);
    process.exit(1);
  });
}

export { validateContent, validateTerm, ValidationResult, ValidationReport };