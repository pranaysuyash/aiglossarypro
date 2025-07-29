#!/usr/bin/env tsx

import { sql } from 'drizzle-orm';
import { db } from '../server/db.js';

async function comprehensiveDataStatus() {
  console.log('🔍 COMPREHENSIVE DATABASE STATUS INVESTIGATION\n');
  console.log('=' + '='.repeat(60));

  try {
    // 1. Table counts and basic stats
    console.log('\n📊 DATABASE OVERVIEW:');
    console.log('-'.repeat(40));

    const overview = await db.execute(sql`
      SELECT 
        (SELECT COUNT(*) FROM terms) as terms_count,
        (SELECT COUNT(*) FROM enhanced_terms) as enhanced_terms_count,
        (SELECT COUNT(*) FROM categories) as categories_count,
        (SELECT COUNT(*) FROM term_sections) as term_sections_count,
        (SELECT COUNT(*) FROM users) as users_count,
        (SELECT COUNT(*) FROM term_views) as term_views_count
    `);

    const stats = overview.rows[0] as any;
    console.log(`✅ Terms: ${stats.terms_count.toLocaleString()}`);
    console.log(`⭐ Enhanced Terms: ${stats.enhanced_terms_count.toLocaleString()}`);
    console.log(`📂 Categories: ${stats.categories_count.toLocaleString()}`);
    console.log(`📝 Term Sections: ${stats.term_sections_count.toLocaleString()}`);
    console.log(`👥 Users: ${stats.users_count.toLocaleString()}`);
    console.log(`👁️ Term Views: ${stats.term_views_count.toLocaleString()}`);

    // 2. Data quality check for terms
    console.log('\n📋 TERMS DATA QUALITY:');
    console.log('-'.repeat(40));

    const termsQuality = await db.execute(sql`
      SELECT 
        COUNT(*) as total_terms,
        COUNT(CASE WHEN definition IS NULL OR definition = '' THEN 1 END) as missing_definitions,
        COUNT(CASE WHEN short_definition IS NULL OR short_definition = '' THEN 1 END) as missing_short_definitions,
        COUNT(CASE WHEN category_id IS NULL THEN 1 END) as missing_categories,
        AVG(LENGTH(definition)) as avg_definition_length
      FROM terms
    `);

    const tq = termsQuality.rows[0] as any;
    const completeness = (
      ((tq.total_terms - tq.missing_definitions) / tq.total_terms) *
      100
    ).toFixed(1);

    console.log(`Total Terms: ${tq.total_terms.toLocaleString()}`);
    console.log(
      `Missing Definitions: ${tq.missing_definitions} (${((tq.missing_definitions / tq.total_terms) * 100).toFixed(1)}%)`
    );
    console.log(`Missing Short Definitions: ${tq.missing_short_definitions}`);
    console.log(`Missing Categories: ${tq.missing_categories}`);
    console.log(`Average Definition Length: ${Math.round(tq.avg_definition_length)} characters`);
    console.log(`Definition Completeness: ${completeness}%`);

    // 3. Enhanced terms quality check
    console.log('\n⭐ ENHANCED TERMS DATA QUALITY:');
    console.log('-'.repeat(40));

    const enhancedQuality = await db.execute(sql`
      SELECT 
        COUNT(*) as total_enhanced,
        COUNT(CASE WHEN has_code_examples = true THEN 1 END) as with_code_examples,
        COUNT(CASE WHEN has_interactive_elements = true THEN 1 END) as with_interactive,
        COUNT(CASE WHEN has_case_studies = true THEN 1 END) as with_case_studies,
        COUNT(CASE WHEN has_implementation = true THEN 1 END) as with_implementation,
        COUNT(CASE WHEN main_categories IS NOT NULL AND array_length(main_categories, 1) > 0 THEN 1 END) as with_categories
      FROM enhanced_terms
    `);

    const eq = enhancedQuality.rows[0] as any;

    console.log(`Total Enhanced Terms: ${eq.total_enhanced.toLocaleString()}`);
    console.log(
      `With Code Examples: ${eq.with_code_examples} (${((eq.with_code_examples / eq.total_enhanced) * 100).toFixed(1)}%)`
    );
    console.log(
      `With Interactive Elements: ${eq.with_interactive} (${((eq.with_interactive / eq.total_enhanced) * 100).toFixed(1)}%)`
    );
    console.log(
      `With Case Studies: ${eq.with_case_studies} (${((eq.with_case_studies / eq.total_enhanced) * 100).toFixed(1)}%)`
    );
    console.log(
      `With Implementation: ${eq.with_implementation} (${((eq.with_implementation / eq.total_enhanced) * 100).toFixed(1)}%)`
    );
    console.log(
      `With Categories: ${eq.with_categories} (${((eq.with_categories / eq.total_enhanced) * 100).toFixed(1)}%)`
    );

    // 4. Sample searchable content
    console.log('\n🔍 SEARCH FUNCTIONALITY TEST:');
    console.log('-'.repeat(40));

    const searchTests = [
      'machine learning',
      'neural network',
      'deep learning',
      'artificial intelligence',
      'algorithm',
    ];

    for (const searchTerm of searchTests) {
      const searchResults = await db.execute(sql`
        SELECT COUNT(*) as match_count
        FROM enhanced_terms 
        WHERE LOWER(name) LIKE ${`%${searchTerm.toLowerCase()}%`}
           OR LOWER(full_definition) LIKE ${`%${searchTerm.toLowerCase()}%`}
           OR LOWER(search_text) LIKE ${`%${searchTerm.toLowerCase()}%`}
      `);

      const count = (searchResults.rows[0] as any).match_count;
      const status = count > 0 ? '✅' : '❌';
      console.log(`${status} "${searchTerm}": ${count} matches`);
    }

    // 5. Sample content for verification
    console.log('\n📝 SAMPLE CONTENT:');
    console.log('-'.repeat(40));

    const sampleContent = await db.execute(sql`
      SELECT et.name, et.short_definition, et.main_categories[1] as primary_category,
             CASE WHEN et.has_code_examples THEN '✅' ELSE '❌' END as code_examples,
             CASE WHEN et.has_interactive_elements THEN '✅' ELSE '❌' END as interactive
      FROM enhanced_terms et 
      WHERE et.full_definition IS NOT NULL 
      ORDER BY et.view_count DESC NULLS LAST
      LIMIT 5
    `);

    sampleContent.rows.forEach((term: any, i) => {
      console.log(`${i + 1}. ${term.name} (${term.primary_category || 'Uncategorized'})`);
      console.log(`   ${term.short_definition?.substring(0, 80)}...`);
      console.log(`   Code: ${term.code_examples} | Interactive: ${term.interactive}`);
    });

    // 6. Categories breakdown
    console.log('\n📂 CATEGORIES BREAKDOWN:');
    console.log('-'.repeat(40));

    const topCategories = await db.execute(sql`
      SELECT c.name, COUNT(t.id) as term_count
      FROM categories c
      LEFT JOIN terms t ON c.id = t.category_id
      GROUP BY c.id, c.name
      ORDER BY term_count DESC
      LIMIT 10
    `);

    topCategories.rows.forEach((cat: any, i) => {
      console.log(`${i + 1}. ${cat.name}: ${cat.term_count} terms`);
    });

    // 7. API readiness check
    console.log('\n🚀 API READINESS ASSESSMENT:');
    console.log('-'.repeat(40));

    // Check if we have enough data for each major endpoint
    const apiReadiness = await db.execute(sql`
      SELECT 
        (SELECT COUNT(*) FROM enhanced_terms WHERE full_definition IS NOT NULL) as searchable_terms,
        (SELECT COUNT(DISTINCT c.name) FROM categories c 
         JOIN terms t ON c.id = t.category_id) as active_categories,
        (SELECT COUNT(*) FROM term_sections) as term_sections,
        (SELECT COUNT(*) FROM enhanced_terms WHERE has_code_examples = true) as terms_with_examples
    `);

    const api = apiReadiness.rows[0] as any;

    console.log(
      `Searchable Terms: ${api.searchable_terms.toLocaleString()} ${api.searchable_terms > 1000 ? '✅' : '⚠️'}`
    );
    console.log(
      `Active Categories: ${api.active_categories} ${api.active_categories > 10 ? '✅' : '⚠️'}`
    );
    console.log(`Term Sections: ${api.term_sections} ${api.term_sections > 0 ? '✅' : '⚠️'}`);
    console.log(
      `Terms with Examples: ${api.terms_with_examples} ${api.terms_with_examples > 100 ? '✅' : '⚠️'}`
    );

    // 8. Potential issues identification
    console.log('\n⚠️ POTENTIAL ISSUES:');
    console.log('-'.repeat(40));

    const issues: string[] = [];

    if (tq.missing_definitions > 0) {
      issues.push(`${tq.missing_definitions} terms missing definitions`);
    }

    if (eq.with_code_examples / eq.total_enhanced < 0.1) {
      issues.push(
        `Low code examples coverage: ${((eq.with_code_examples / eq.total_enhanced) * 100).toFixed(1)}%`
      );
    }

    if (api.active_categories < 20) {
      issues.push(`Limited category diversity: ${api.active_categories} active categories`);
    }

    if (issues.length === 0) {
      console.log('✅ No critical issues detected');
    } else {
      issues.forEach((issue, i) => {
        console.log(`${i + 1}. ⚠️ ${issue}`);
      });
    }

    // 9. Production readiness summary
    console.log('\n🎯 PRODUCTION READINESS SUMMARY:');
    console.log('=' + '='.repeat(40));

    const readinessScore = [
      stats.terms_count > 5000 ? 25 : 0, // Sufficient content
      completeness > 95 ? 25 : 0, // High quality
      api.searchable_terms > 1000 ? 25 : 0, // Search functionality
      issues.length === 0 ? 25 : 0, // No critical issues
    ].reduce((a, b) => a + b, 0);

    console.log(`📊 Readiness Score: ${readinessScore}/100`);

    if (readinessScore >= 75) {
      console.log('🟢 READY FOR PRODUCTION - Database is well-populated and functional');
    } else if (readinessScore >= 50) {
      console.log('🟡 PARTIALLY READY - Some optimization needed before production');
    } else {
      console.log('🔴 NOT READY - Significant issues need to be addressed');
    }

    console.log('\n✅ Comprehensive database investigation completed');
  } catch (error) {
    console.error('❌ Database investigation failed:', error);
  }
}

comprehensiveDataStatus().catch(console.error);
