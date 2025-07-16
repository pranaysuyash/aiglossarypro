#!/usr/bin/env node

/**
 * Complete Content Management Setup Script
 *
 * This script sets up the entire content management system from scratch,
 * including sample data, optimizations, and validation.
 */

import { sql } from 'drizzle-orm';
import { db } from '../server/db';
import { log as logger } from '../server/utils/logger';
import { enhancedTerms, sectionItems, sections } from '../shared/enhancedSchema';
import { categories } from '../shared/schema';

interface SampleTerm {
  name: string;
  definition: string;
  shortDefinition: string;
  category: string;
  difficulty?: 'beginner' | 'intermediate' | 'advanced';
  tags?: string[];
}

// Sample AI/ML terms to demonstrate the system
const SAMPLE_TERMS: SampleTerm[] = [
  {
    name: 'Machine Learning',
    shortDefinition:
      'A method of teaching computers to learn and make decisions from data without explicit programming.',
    definition:
      'Machine Learning (ML) is a subset of artificial intelligence that enables computer systems to automatically learn and improve their performance on a specific task through experience, without being explicitly programmed for every scenario. ML algorithms build mathematical models based on training data to make predictions or decisions.',
    category: 'Core AI Concepts',
    difficulty: 'beginner',
    tags: ['fundamental', 'algorithms', 'data'],
  },
  {
    name: 'Neural Network',
    shortDefinition:
      'A computing system inspired by biological neural networks that learns to perform tasks by analyzing examples.',
    definition:
      'A neural network is a series of algorithms that endeavors to recognize underlying relationships in a set of data through a process that mimics the way the human brain operates. Neural networks can adapt to changing input so the network generates the best possible result without needing to redesign the output criteria.',
    category: 'Deep Learning',
    difficulty: 'intermediate',
    tags: ['network', 'neurons', 'deep learning'],
  },
  {
    name: 'Natural Language Processing',
    shortDefinition:
      'The ability of computers to understand, interpret, and generate human language.',
    definition:
      'Natural Language Processing (NLP) is a branch of artificial intelligence that deals with the interaction between computers and humans through natural language. The ultimate objective of NLP is to read, decipher, understand, and make sense of human languages in a manner that is valuable.',
    category: 'NLP',
    difficulty: 'intermediate',
    tags: ['language', 'text', 'processing'],
  },
  {
    name: 'Deep Learning',
    shortDefinition:
      'A subset of machine learning using neural networks with multiple layers to model complex patterns.',
    definition:
      'Deep Learning is a subset of machine learning in artificial intelligence that has networks capable of learning unsupervised from data that is unstructured or unlabeled. Also known as deep neural learning or deep neural network, it mimics the workings of the human brain in processing data and creating patterns for use in decision making.',
    category: 'Deep Learning',
    difficulty: 'advanced',
    tags: ['neural networks', 'layers', 'complex patterns'],
  },
  {
    name: 'Computer Vision',
    shortDefinition:
      'The field of AI that enables computers to interpret and understand visual information from the world.',
    definition:
      'Computer Vision is a field of artificial intelligence that trains computers to interpret and understand the visual world. Using digital images from cameras and videos and deep learning models, machines can accurately identify and classify objects and then react to what they see.',
    category: 'Computer Vision',
    difficulty: 'intermediate',
    tags: ['vision', 'images', 'recognition'],
  },
];

// Default categories for the system
const DEFAULT_CATEGORIES = [
  {
    name: 'Core AI Concepts',
    description: 'Fundamental artificial intelligence concepts',
    slug: 'core-ai-concepts',
  },
  {
    name: 'Machine Learning',
    description: 'Machine learning algorithms and techniques',
    slug: 'machine-learning',
  },
  {
    name: 'Deep Learning',
    description: 'Deep neural networks and advanced architectures',
    slug: 'deep-learning',
  },
  {
    name: 'Natural Language Processing',
    description: 'NLP techniques and language understanding',
    slug: 'nlp',
  },
  {
    name: 'Computer Vision',
    description: 'Visual recognition and image processing',
    slug: 'computer-vision',
  },
  {
    name: 'Reinforcement Learning',
    description: 'Learning through interaction and rewards',
    slug: 'reinforcement-learning',
  },
  {
    name: 'Data Science',
    description: 'Data analysis and statistical methods',
    slug: 'data-science',
  },
  {
    name: 'Statistics',
    description: 'Statistical methods and probability theory',
    slug: 'statistics',
  },
];

// Default sections for the 42-section architecture
const DEFAULT_SECTIONS = [
  { name: 'definition_overview', displayOrder: 1 },
  { name: 'key_characteristics', displayOrder: 2 },
  { name: 'real_world_applications', displayOrder: 3 },
  { name: 'related_concepts', displayOrder: 4 },
  { name: 'tools_technologies', displayOrder: 5 },
  { name: 'implementation_details', displayOrder: 6 },
  { name: 'advantages_benefits', displayOrder: 7 },
  { name: 'challenges_limitations', displayOrder: 8 },
  { name: 'best_practices', displayOrder: 9 },
  { name: 'future_directions', displayOrder: 10 },
];

/**
 * Setup categories
 */
async function setupCategories() {
  logger.info('📁 Setting up categories...');

  for (const category of DEFAULT_CATEGORIES) {
    try {
      await db
        .insert(categories)
        .values({
          name: category.name,
          description: category.description,
          slug: category.slug,
          createdAt: new Date(),
        })
        .onConflictDoNothing();
    } catch (error) {
      logger.error(`Error creating category ${category.name}:`, error);
    }
  }

  logger.info(`✅ Created ${DEFAULT_CATEGORIES.length} categories`);
}

/**
 * Setup sample terms
 */
async function setupSampleTerms() {
  logger.info('📝 Setting up sample terms...');

  // Get category mappings
  const categoryMap = new Map();
  const categoriesResult = await db.select().from(categories);
  categoriesResult.forEach(cat => categoryMap.set(cat.name, cat.id));

  for (const term of SAMPLE_TERMS) {
    try {
      const categoryId = categoryMap.get(term.category);
      if (!categoryId) {
        logger.warn(`Category not found: ${term.category}`);
        continue;
      }

      // Create enhanced term
      const [newTerm] = await db
        .insert(enhancedTerms)
        .values({
          name: term.name,
          slug: term.name.toLowerCase().replace(/\s+/g, '-'),
          definition: term.definition,
          shortDefinition: term.shortDefinition,
          categoryId: categoryId,
          difficultyLevel: term.difficulty || 'intermediate',
          tags: term.tags || [],
          isAiGenerated: false,
          viewCount: 0,
          lastAiUpdate: new Date(),
          qualityScore: 85,
          completenessScore: 80,
          accuracyScore: 90,
          readabilityScore: 85,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .returning();

      // Create sections for this term
      for (const section of DEFAULT_SECTIONS) {
        const [newSection] = await db
          .insert(sections)
          .values({
            termId: newTerm.id,
            name: section.name,
            displayOrder: section.displayOrder,
            isCompleted: false,
            createdAt: new Date(),
            updatedAt: new Date(),
          })
          .returning();

        // Create a basic section item
        await db.insert(sectionItems).values({
          sectionId: newSection.id,
          label: section.name,
          content: `# ${section.name.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}\n\n*Content for ${term.name} ${section.name} will be generated here.*`,
          contentType: 'markdown',
          displayOrder: 1,
          isAiGenerated: false,
          verificationStatus: 'unverified',
          metadata: {
            created: new Date().toISOString(),
            placeholder: true,
          },
        });
      }

      logger.info(`✅ Created term: ${term.name} with ${DEFAULT_SECTIONS.length} sections`);
    } catch (error) {
      logger.error(`Error creating term ${term.name}:`, error);
    }
  }

  logger.info(`✅ Created ${SAMPLE_TERMS.length} sample terms`);
}

/**
 * Setup database optimizations
 */
async function setupOptimizations() {
  logger.info('⚡ Setting up database optimizations...');

  try {
    // Create indexes for better performance
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS idx_enhanced_terms_name_search 
      ON enhanced_terms USING gin(to_tsvector('english', name || ' ' || COALESCE(definition, '')));
    `);

    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS idx_enhanced_terms_category_id 
      ON enhanced_terms(category_id);
    `);

    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS idx_sections_term_id_name 
      ON sections(term_id, name);
    `);

    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS idx_section_items_section_id 
      ON section_items(section_id);
    `);

    // Create content quality tracking
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS content_quality_metrics (
        id SERIAL PRIMARY KEY,
        term_id VARCHAR(255) REFERENCES enhanced_terms(id),
        section_name VARCHAR(255),
        quality_score INTEGER,
        readability_score INTEGER,
        completeness_score INTEGER,
        last_evaluated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(term_id, section_name)
      );
    `);

    // Create content templates
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
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Insert basic template
    await db.execute(sql`
      INSERT INTO content_templates (name, category, template, description)
      VALUES (
        'basic_definition',
        'core',
        '# {term_name}\n\n## Definition\n{definition}\n\n## Key Points\n- {key_point_1}\n- {key_point_2}\n- {key_point_3}',
        'Basic definition template for AI/ML terms'
      ) ON CONFLICT (name) DO NOTHING;
    `);

    logger.info('✅ Database optimizations completed');
  } catch (error) {
    logger.error('Error setting up optimizations:', error);
    throw error;
  }
}

/**
 * Validate setup
 */
async function validateSetup() {
  logger.info('✔️ Validating setup...');

  try {
    // Check categories
    const categoryCount = await db.execute(sql`SELECT COUNT(*) as count FROM categories`);
    logger.info(`Categories: ${categoryCount.rows[0].count}`);

    // Check terms
    const termCount = await db.execute(sql`SELECT COUNT(*) as count FROM enhanced_terms`);
    logger.info(`Enhanced Terms: ${termCount.rows[0].count}`);

    // Check sections
    const sectionCount = await db.execute(sql`SELECT COUNT(*) as count FROM sections`);
    logger.info(`Sections: ${sectionCount.rows[0].count}`);

    // Check content items
    const itemCount = await db.execute(sql`SELECT COUNT(*) as count FROM section_items`);
    logger.info(`Section Items: ${itemCount.rows[0].count}`);

    // Check indexes
    const indexCount = await db.execute(sql`
      SELECT COUNT(*) as count 
      FROM pg_indexes 
      WHERE tablename IN ('enhanced_terms', 'sections', 'section_items')
      AND indexname LIKE 'idx_%'
    `);
    logger.info(`Custom Indexes: ${indexCount.rows[0].count}`);

    // Summary
    const totalContent =
      (Number(termCount.rows[0].count) * Number(sectionCount.rows[0].count)) /
      Number(termCount.rows[0].count);
    logger.info(`\n📊 Setup Summary:`);
    logger.info(`  - ${categoryCount.rows[0].count} categories created`);
    logger.info(`  - ${termCount.rows[0].count} terms with ${totalContent} sections each`);
    logger.info(`  - ${itemCount.rows[0].count} content items ready for generation`);
    logger.info(`  - ${indexCount.rows[0].count} performance indexes created`);

    return true;
  } catch (error) {
    logger.error('Validation failed:', error);
    return false;
  }
}

/**
 * Main setup function
 */
async function runCompleteSetup() {
  const startTime = Date.now();

  try {
    logger.info('🚀 Starting Complete Content Management Setup');
    logger.info('===========================================\n');

    await setupCategories();
    await setupSampleTerms();
    await setupOptimizations();

    const isValid = await validateSetup();

    const duration = Date.now() - startTime;

    if (isValid) {
      logger.info('\n✅ SETUP COMPLETED SUCCESSFULLY');
      logger.info(`Total time: ${(duration / 1000).toFixed(2)} seconds`);
      logger.info('\n🎯 Next Steps:');
      logger.info('1. Run: npm run status:content - Check system status');
      logger.info('2. Access: /admin/content-management - Start managing content');
      logger.info('3. Run: npm run generate:sections - Generate AI content');
      logger.info('4. Visit: /admin/content-import - Import more terms');
    } else {
      logger.error('❌ Setup validation failed');
      process.exit(1);
    }
  } catch (error) {
    logger.error('Fatal error during setup:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  runCompleteSetup()
    .then(() => process.exit(0))
    .catch(error => {
      logger.error('Setup failed:', error);
      process.exit(1);
    });
}

export { runCompleteSetup };
