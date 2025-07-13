#!/usr/bin/env node

/**
 * Content Management Optimization Script
 * 
 * This script optimizes the content management system for production use
 * by implementing missing features and improving existing ones.
 */

import { and, eq, isNull, sql } from 'drizzle-orm';
import { db } from '../server/db';
import { 
  enhancedTerms, 
  sections, 
  sectionItems,
  aiContentVerification,
  aiUsageAnalytics
} from '../shared/enhancedSchema';
import { log as logger } from '../server/utils/logger';

// Content quality thresholds
const QUALITY_THRESHOLDS = {
  MIN_DEFINITION_LENGTH: 100,
  MIN_SHORT_DEFINITION_LENGTH: 20,
  MAX_SHORT_DEFINITION_LENGTH: 150,
  MIN_QUALITY_SCORE: 70,
  BATCH_SIZE: 100
};

// Section priority mapping
const SECTION_PRIORITIES = {
  'definition_overview': 1,
  'key_characteristics': 1,
  'real_world_applications': 1,
  'related_concepts': 2,
  'tools_technologies': 2,
  'implementation_details': 2,
  'advantages_benefits': 3,
  'challenges_limitations': 3,
  'best_practices': 3,
  'future_directions': 4
};

/**
 * Optimize content import process
 */
async function optimizeContentImport() {
  logger.info('🔧 Optimizing Content Import Process');
  
  try {
    // Create indexes for faster imports
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS idx_enhanced_terms_name_lower 
      ON enhanced_terms(LOWER(name));
    `);
    
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS idx_sections_term_id_name 
      ON sections(term_id, name);
    `);
    
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS idx_section_items_section_id_label 
      ON section_items(section_id, label);
    `);
    
    // Create batch job tracking table if not exists
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS batch_import_jobs (
        id SERIAL PRIMARY KEY,
        job_id VARCHAR(255) UNIQUE NOT NULL,
        status VARCHAR(50) NOT NULL DEFAULT 'pending',
        total_items INTEGER DEFAULT 0,
        processed_items INTEGER DEFAULT 0,
        success_count INTEGER DEFAULT 0,
        error_count INTEGER DEFAULT 0,
        started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        completed_at TIMESTAMP,
        error_log JSONB,
        metadata JSONB,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    
    logger.info('✅ Content import optimization completed');
  } catch (error) {
    logger.error('Error optimizing content import:', error);
    throw error;
  }
}

/**
 * Set up content quality scoring system
 */
async function setupContentQualityScoring() {
  logger.info('📊 Setting up Content Quality Scoring System');
  
  try {
    // Create quality scoring function
    await db.execute(sql`
      CREATE OR REPLACE FUNCTION calculate_content_quality_score(
        content TEXT,
        content_type VARCHAR
      ) RETURNS INTEGER AS $$
      DECLARE
        score INTEGER := 100;
        word_count INTEGER;
        sentence_count INTEGER;
        has_structure BOOLEAN;
      BEGIN
        -- Basic validation
        IF content IS NULL OR LENGTH(content) = 0 THEN
          RETURN 0;
        END IF;
        
        -- Calculate metrics
        word_count := array_length(string_to_array(content, ' '), 1);
        sentence_count := array_length(string_to_array(content, '.'), 1);
        has_structure := content LIKE '%##%' OR content LIKE '%**%';
        
        -- Length scoring
        IF content_type = 'definition' THEN
          IF LENGTH(content) < 100 THEN score := score - 30;
          ELSIF LENGTH(content) < 200 THEN score := score - 15;
          END IF;
        ELSIF content_type = 'short_definition' THEN
          IF LENGTH(content) < 20 THEN score := score - 30;
          ELSIF LENGTH(content) > 150 THEN score := score - 15;
          END IF;
        END IF;
        
        -- Readability scoring
        IF word_count > 0 AND sentence_count > 0 THEN
          -- Average words per sentence
          IF (word_count / sentence_count) > 25 THEN
            score := score - 10; -- Sentences too long
          END IF;
        END IF;
        
        -- Structure bonus
        IF has_structure THEN
          score := score + 5;
        END IF;
        
        RETURN GREATEST(score, 0);
      END;
      $$ LANGUAGE plpgsql;
    `);
    
    // Create content quality tracking table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS content_quality_metrics (
        id SERIAL PRIMARY KEY,
        term_id VARCHAR(255) REFERENCES enhanced_terms(id),
        section_name VARCHAR(255),
        quality_score INTEGER,
        readability_score INTEGER,
        completeness_score INTEGER,
        accuracy_confidence DECIMAL(3,2),
        last_evaluated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        evaluation_metadata JSONB,
        UNIQUE(term_id, section_name)
      );
    `);
    
    logger.info('✅ Content quality scoring system set up');
  } catch (error) {
    logger.error('Error setting up quality scoring:', error);
    throw error;
  }
}

/**
 * Implement content performance tracking
 */
async function implementContentPerformanceTracking() {
  logger.info('📈 Implementing Content Performance Tracking');
  
  try {
    // Create content engagement tracking
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS content_engagement (
        id SERIAL PRIMARY KEY,
        term_id VARCHAR(255) REFERENCES enhanced_terms(id),
        section_name VARCHAR(255),
        view_count INTEGER DEFAULT 0,
        avg_time_spent INTEGER DEFAULT 0,
        bounce_rate DECIMAL(5,2),
        user_ratings JSONB DEFAULT '[]',
        feedback_count INTEGER DEFAULT 0,
        last_viewed TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(term_id, section_name)
      );
    `);
    
    // Create content generation cost tracking
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS content_generation_costs (
        id SERIAL PRIMARY KEY,
        term_id VARCHAR(255),
        section_name VARCHAR(255),
        model_used VARCHAR(100),
        prompt_tokens INTEGER,
        completion_tokens INTEGER,
        total_cost DECIMAL(10,6),
        generation_time INTEGER,
        generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        metadata JSONB
      );
    `);
    
    // Create aggregated analytics view
    await db.execute(sql`
      CREATE OR REPLACE VIEW content_analytics_summary AS
      SELECT 
        et.id as term_id,
        et.name as term_name,
        COUNT(DISTINCT s.id) as total_sections,
        COUNT(DISTINCT si.id) as completed_sections,
        AVG(cqm.quality_score) as avg_quality_score,
        SUM(ce.view_count) as total_views,
        AVG(ce.avg_time_spent) as avg_engagement_time,
        SUM(cgc.total_cost) as total_generation_cost
      FROM enhanced_terms et
      LEFT JOIN sections s ON s.term_id = et.id
      LEFT JOIN section_items si ON si.section_id = s.id
      LEFT JOIN content_quality_metrics cqm ON cqm.term_id = et.id
      LEFT JOIN content_engagement ce ON ce.term_id = et.id
      LEFT JOIN content_generation_costs cgc ON cgc.term_id = et.id
      GROUP BY et.id, et.name;
    `);
    
    logger.info('✅ Content performance tracking implemented');
  } catch (error) {
    logger.error('Error implementing performance tracking:', error);
    throw error;
  }
}

/**
 * Create content template management system
 */
async function createContentTemplateSystem() {
  logger.info('📝 Creating Content Template Management System');
  
  try {
    // Default templates for each section
    const defaultTemplates = [
      {
        name: 'definition_overview',
        category: 'core',
        template: `## Definition

{term_name} is {brief_explanation}.

### Core Concept
{detailed_explanation}

### Key Points
- {key_point_1}
- {key_point_2}
- {key_point_3}`,
        variables: ['term_name', 'brief_explanation', 'detailed_explanation', 'key_point_1', 'key_point_2', 'key_point_3'],
        description: 'Standard definition template for AI/ML terms'
      },
      {
        name: 'real_world_applications',
        category: 'practical',
        template: `## Real-World Applications

{term_name} has numerous practical applications across various domains:

### Industry Applications
1. **{industry_1}**: {application_1}
2. **{industry_2}**: {application_2}
3. **{industry_3}**: {application_3}

### Case Studies
{case_study_examples}`,
        variables: ['term_name', 'industry_1', 'application_1', 'industry_2', 'application_2', 'industry_3', 'application_3', 'case_study_examples'],
        description: 'Template for documenting real-world applications'
      },
      {
        name: 'implementation_details',
        category: 'technical',
        template: `## Implementation Details

### Technical Requirements
- {requirement_1}
- {requirement_2}
- {requirement_3}

### Code Example
\`\`\`{language}
{code_example}
\`\`\`

### Implementation Steps
1. {step_1}
2. {step_2}
3. {step_3}`,
        variables: ['requirement_1', 'requirement_2', 'requirement_3', 'language', 'code_example', 'step_1', 'step_2', 'step_3'],
        description: 'Technical implementation template with code examples'
      }
    ];
    
    // Create content templates table and insert default templates
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS content_templates (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) UNIQUE NOT NULL,
        category VARCHAR(100) NOT NULL,
        template TEXT NOT NULL,
        variables JSONB DEFAULT '[]',
        description TEXT,
        is_active BOOLEAN DEFAULT true,
        usage_count INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    
    // Insert default templates
    for (const template of defaultTemplates) {
      await db.execute(sql`
        INSERT INTO content_templates (name, category, template, variables, description, is_active, usage_count)
        VALUES (${template.name}, ${template.category}, ${template.template}, ${JSON.stringify(template.variables)}, ${template.description}, true, 0)
        ON CONFLICT (name) DO NOTHING;
      `);
    }
    
    logger.info(`✅ Created ${defaultTemplates.length} content templates`);
  } catch (error) {
    logger.error('Error creating template system:', error);
    throw error;
  }
}

/**
 * Optimize batch processing for large imports
 */
async function optimizeBatchProcessing() {
  logger.info('⚡ Optimizing Batch Processing');
  
  try {
    // Create batch processing functions
    await db.execute(sql`
      CREATE OR REPLACE FUNCTION process_content_batch(
        batch_size INTEGER DEFAULT 100
      ) RETURNS TABLE(
        processed INTEGER,
        success INTEGER,
        failed INTEGER
      ) AS $$
      DECLARE
        processed_count INTEGER := 0;
        success_count INTEGER := 0;
        failed_count INTEGER := 0;
        term_record RECORD;
      BEGIN
        -- Process terms without content in batches
        FOR term_record IN 
          SELECT et.id, et.name 
          FROM enhanced_terms et
          LEFT JOIN sections s ON s.term_id = et.id
          WHERE s.id IS NULL
          LIMIT batch_size
        LOOP
          BEGIN
            -- Create basic sections for each term
            INSERT INTO sections (term_id, name, display_order, is_completed)
            VALUES 
              (term_record.id, 'definition_overview', 1, false),
              (term_record.id, 'key_characteristics', 2, false),
              (term_record.id, 'real_world_applications', 3, false);
            
            success_count := success_count + 1;
          EXCEPTION WHEN OTHERS THEN
            failed_count := failed_count + 1;
          END;
          
          processed_count := processed_count + 1;
        END LOOP;
        
        RETURN QUERY SELECT processed_count, success_count, failed_count;
      END;
      $$ LANGUAGE plpgsql;
    `);
    
    // Create batch status monitoring
    await db.execute(sql`
      CREATE OR REPLACE VIEW batch_processing_status AS
      SELECT 
        COUNT(*) FILTER (WHERE status = 'pending') as pending_jobs,
        COUNT(*) FILTER (WHERE status = 'processing') as active_jobs,
        COUNT(*) FILTER (WHERE status = 'completed') as completed_jobs,
        COUNT(*) FILTER (WHERE status = 'failed') as failed_jobs,
        AVG(EXTRACT(EPOCH FROM (completed_at - started_at))) as avg_processing_time
      FROM batch_job_status
      WHERE created_at > CURRENT_TIMESTAMP - INTERVAL '24 hours';
    `);
    
    logger.info('✅ Batch processing optimization completed');
  } catch (error) {
    logger.error('Error optimizing batch processing:', error);
    throw error;
  }
}

/**
 * Set up content validation workflows
 */
async function setupContentValidationWorkflows() {
  logger.info('✔️ Setting up Content Validation Workflows');
  
  try {
    // Create validation rules table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS content_validation_rules (
        id SERIAL PRIMARY KEY,
        rule_name VARCHAR(255) UNIQUE NOT NULL,
        rule_type VARCHAR(50) NOT NULL,
        section_name VARCHAR(255),
        validation_function TEXT,
        severity VARCHAR(20) DEFAULT 'warning',
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    
    // Insert default validation rules
    const validationRules = [
      {
        rule_name: 'min_definition_length',
        rule_type: 'length',
        section_name: 'definition_overview',
        validation_function: 'LENGTH(content) >= 100',
        severity: 'error'
      },
      {
        rule_name: 'no_placeholder_text',
        rule_type: 'content',
        section_name: null,
        validation_function: "content NOT LIKE '%TODO%' AND content NOT LIKE '%TBD%'",
        severity: 'warning'
      },
      {
        rule_name: 'proper_markdown_structure',
        rule_type: 'format',
        section_name: null,
        validation_function: "content ~ '^#{1,6}\\s'",
        severity: 'info'
      }
    ];
    
    for (const rule of validationRules) {
      await db.execute(sql`
        INSERT INTO content_validation_rules (rule_name, rule_type, section_name, validation_function, severity)
        VALUES (${rule.rule_name}, ${rule.rule_type}, ${rule.section_name}, ${rule.validation_function}, ${rule.severity})
        ON CONFLICT (rule_name) DO NOTHING;
      `);
    }
    
    // Create validation results tracking
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS content_validation_results (
        id SERIAL PRIMARY KEY,
        term_id VARCHAR(255),
        section_name VARCHAR(255),
        rule_id INTEGER REFERENCES content_validation_rules(id),
        passed BOOLEAN,
        message TEXT,
        validated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    
    logger.info('✅ Content validation workflows set up');
  } catch (error) {
    logger.error('Error setting up validation workflows:', error);
    throw error;
  }
}

/**
 * Create content export and backup systems
 */
async function createContentExportSystems() {
  logger.info('💾 Creating Content Export and Backup Systems');
  
  try {
    // Create export job tracking
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS content_export_jobs (
        id SERIAL PRIMARY KEY,
        job_id VARCHAR(255) UNIQUE NOT NULL,
        export_type VARCHAR(50) NOT NULL,
        format VARCHAR(20) NOT NULL,
        filters JSONB,
        status VARCHAR(50) DEFAULT 'pending',
        file_path TEXT,
        file_size BIGINT,
        record_count INTEGER,
        started_at TIMESTAMP,
        completed_at TIMESTAMP,
        error_message TEXT,
        created_by VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    
    // Create export function
    await db.execute(sql`
      CREATE OR REPLACE FUNCTION export_content_to_json(
        filter_category VARCHAR DEFAULT NULL,
        limit_count INTEGER DEFAULT NULL
      ) RETURNS JSONB AS $$
      DECLARE
        result JSONB;
      BEGIN
        SELECT jsonb_agg(
          jsonb_build_object(
            'id', et.id,
            'name', et.name,
            'slug', et.slug,
            'definition', et.definition,
            'short_definition', et.short_definition,
            'category', c.name,
            'sections', (
              SELECT jsonb_agg(
                jsonb_build_object(
                  'name', s.name,
                  'items', (
                    SELECT jsonb_agg(
                      jsonb_build_object(
                        'label', si.label,
                        'content', si.content,
                        'content_type', si.content_type
                      )
                    )
                    FROM section_items si
                    WHERE si.section_id = s.id
                  )
                )
              )
              FROM sections s
              WHERE s.term_id = et.id
            )
          )
        ) INTO result
        FROM enhanced_terms et
        LEFT JOIN categories c ON c.id = et.category_id
        WHERE (filter_category IS NULL OR c.name = filter_category)
        LIMIT limit_count;
        
        RETURN COALESCE(result, '[]'::jsonb);
      END;
      $$ LANGUAGE plpgsql;
    `);
    
    logger.info('✅ Content export systems created');
  } catch (error) {
    logger.error('Error creating export systems:', error);
    throw error;
  }
}

/**
 * Main optimization runner
 */
async function runOptimizations() {
  logger.info('🚀 Starting Content Management Optimizations');
  logger.info('==========================================\n');
  
  const startTime = Date.now();
  
  try {
    // Run all optimizations
    await optimizeContentImport();
    await setupContentQualityScoring();
    await implementContentPerformanceTracking();
    await createContentTemplateSystem();
    await optimizeBatchProcessing();
    await setupContentValidationWorkflows();
    await createContentExportSystems();
    
    const duration = Date.now() - startTime;
    
    logger.info('\n==========================================');
    logger.info('✅ All Optimizations Completed Successfully');
    logger.info(`Total time: ${(duration / 1000).toFixed(2)} seconds`);
    logger.info('==========================================\n');
    
    // Generate optimization report
    const report = await generateOptimizationReport();
    logger.info('📊 Optimization Report:');
    logger.info(JSON.stringify(report, null, 2));
    
  } catch (error) {
    logger.error('Fatal error during optimization:', error);
    process.exit(1);
  }
}

/**
 * Generate optimization report
 */
async function generateOptimizationReport() {
  const report: any = {
    timestamp: new Date().toISOString(),
    optimizations_applied: []
  };
  
  // Check what was created/optimized
  try {
    // Check indexes
    const indexes = await db.execute(sql`
      SELECT indexname 
      FROM pg_indexes 
      WHERE tablename IN ('enhanced_terms', 'sections', 'section_items')
      AND indexname LIKE 'idx_%'
    `);
    report.indexes_created = indexes.rows.length;
    
    // Check templates
    const templates = await db.execute(sql`SELECT COUNT(*) as count FROM content_templates`);
    report.templates_created = templates.rows[0]?.count || 0;
    
    // Check validation rules
    const rules = await db.execute(sql`
      SELECT COUNT(*) as count FROM content_validation_rules
    `);
    report.validation_rules = rules.rows[0]?.count || 0;
    
    // Check batch processing capability
    const batchCapability = await db.execute(sql`
      SELECT proname 
      FROM pg_proc 
      WHERE proname = 'process_content_batch'
    `);
    report.batch_processing_enabled = batchCapability.rows.length > 0;
    
    report.status = 'SUCCESS';
    report.ready_for_production = true;
    
  } catch (error) {
    report.status = 'PARTIAL';
    report.error = error instanceof Error ? error.message : 'Unknown error';
  }
  
  return report;
}

// Run optimizations if called directly
if (require.main === module) {
  runOptimizations().catch(error => {
    logger.error('Optimization script failed:', error);
    process.exit(1);
  });
}

export { runOptimizations };