#!/usr/bin/env node

/**
 * Quick Content Management Status Check
 */

import { sql } from 'drizzle-orm';
import { db } from '../server/db';
import { log as logger } from '../server/utils/logger';

async function checkContentStatus() {
  try {
    logger.info('🔍 Checking Content Management System Status');
    
    // Check enhanced terms
    const termsResult = await db.execute(sql`
      SELECT COUNT(*) as total_terms,
             COUNT(CASE WHEN definition IS NOT NULL AND LENGTH(definition) > 0 THEN 1 END) as terms_with_definition,
             COUNT(CASE WHEN short_definition IS NOT NULL AND LENGTH(short_definition) > 0 THEN 1 END) as terms_with_short_def
      FROM enhanced_terms
    `);
    
    const termsStats = termsResult.rows[0];
    logger.info(`📊 Terms Status:`, {
      totalTerms: termsStats.total_terms,
      termsWithDefinition: termsStats.terms_with_definition,
      termsWithShortDef: termsStats.terms_with_short_def,
      definitionCompleteness: `${Math.round((Number(termsStats.terms_with_definition) / Number(termsStats.total_terms)) * 100)}%`
    });
    
    // Check sections
    const sectionsResult = await db.execute(sql`
      SELECT COUNT(*) as total_sections,
             COUNT(CASE WHEN is_completed = true THEN 1 END) as completed_sections
      FROM sections
    `);
    
    const sectionsStats = sectionsResult.rows[0];
    logger.info(`📝 Sections Status:`, {
      totalSections: sectionsStats.total_sections,
      completedSections: sectionsStats.completed_sections,
      completionRate: `${Math.round((Number(sectionsStats.completed_sections) / Number(sectionsStats.total_sections)) * 100)}%`
    });
    
    // Check section items (content)
    const contentResult = await db.execute(sql`
      SELECT COUNT(*) as total_items,
             COUNT(CASE WHEN content IS NOT NULL AND LENGTH(content) > 100 THEN 1 END) as substantial_content,
             COUNT(CASE WHEN is_ai_generated = true THEN 1 END) as ai_generated_content
      FROM section_items
    `);
    
    const contentStats = contentResult.rows[0];
    logger.info(`📄 Content Status:`, {
      totalItems: contentStats.total_items,
      substantialContent: contentStats.substantial_content,
      aiGeneratedContent: contentStats.ai_generated_content,
      contentQuality: `${Math.round((Number(contentStats.substantial_content) / Number(contentStats.total_items)) * 100)}%`
    });
    
    // Check AI usage analytics
    const aiStatsResult = await db.execute(sql`
      SELECT COUNT(*) as total_operations,
             COUNT(CASE WHEN success = true THEN 1 END) as successful_operations,
             SUM(CASE WHEN cost IS NOT NULL THEN CAST(cost AS DECIMAL) ELSE 0 END) as total_cost
      FROM ai_usage_analytics
      WHERE created_at > NOW() - INTERVAL '30 days'
    `);
    
    const aiStats = aiStatsResult.rows[0];
    logger.info(`🤖 AI Generation Status:`, {
      totalOperations: aiStats.total_operations,
      successfulOperations: aiStats.successful_operations,
      successRate: `${Math.round((Number(aiStats.successful_operations) / Number(aiStats.total_operations)) * 100)}%`,
      totalCost: `$${Number(aiStats.total_cost).toFixed(4)}`
    });
    
    // Check categories
    const categoriesResult = await db.execute(sql`
      SELECT COUNT(*) as total_categories
      FROM categories
    `);
    
    logger.info(`🏷️  Categories:`, {
      totalCategories: categoriesResult.rows[0].total_categories
    });
    
    // Overall assessment
    const definitionRate = Math.round((Number(termsStats.terms_with_definition) / Number(termsStats.total_terms)) * 100);
    const contentRate = Math.round((Number(contentStats.substantial_content) / Math.max(Number(contentStats.total_items), 1)) * 100);
    
    logger.info('\n🎯 Overall Assessment:');
    
    if (definitionRate >= 80 && contentRate >= 60) {
      logger.info('✅ Content management system is PRODUCTION READY');
    } else if (definitionRate >= 60 && contentRate >= 40) {
      logger.info('⚠️  Content management system needs MINOR IMPROVEMENTS');
    } else {
      logger.info('❌ Content management system needs SIGNIFICANT WORK');
    }
    
    logger.info(`Overall Content Completeness: ${Math.round((definitionRate + contentRate) / 2)}%`);
    
    // Recommendations
    const recommendations = [];
    
    if (definitionRate < 70) {
      recommendations.push('Improve term definitions (run content generation)');
    }
    
    if (contentRate < 50) {
      recommendations.push('Generate more comprehensive section content');
    }
    
    if (Number(termsStats.terms_with_short_def) / Number(termsStats.total_terms) < 0.9) {
      recommendations.push('Add short definitions for better search results');
    }
    
    if (recommendations.length > 0) {
      logger.info('\n📋 Recommendations:');
      recommendations.forEach(rec => logger.info(`- ${rec}`));
    }
    
    logger.info('\n✅ Content status check completed');
    
  } catch (error) {
    logger.error('Error checking content status:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  checkContentStatus().then(() => process.exit(0)).catch(error => {
    logger.error('Content status check failed:', error);
    process.exit(1);
  });
}

export { checkContentStatus };