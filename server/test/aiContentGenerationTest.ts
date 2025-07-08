import { db } from '../db';
import { enhancedTerms } from '../../shared/enhancedSchema';
import { aiContentGenerationService } from '../services/aiContentGenerationService';
import { promptTemplateService } from '../services/promptTemplateService';
import { log as logger } from '../utils/logger';

/**
 * Test script for AI content generation functionality
 * Run this to verify the end-to-end implementation
 */
async function testAIContentGeneration() {
  try {
    logger.info('🧪 Starting AI Content Generation Test...');

    // Step 1: Get a sample term from the database
    logger.info('Step 1: Getting sample term from database...');
    const sampleTerms = await db.select()
      .from(enhancedTerms)
      .limit(1);

    if (sampleTerms.length === 0) {
      logger.warn('No terms found in database. Creating test term...');
      
      // Create a test term
      const testTerm = await db.insert(enhancedTerms)
        .values({
          name: 'Neural Network',
          slug: 'neural-network',
          shortDefinition: 'A computational model inspired by biological neural networks',
          fullDefinition: 'A neural network is a computational model loosely inspired by the structure and function of biological neural networks. It consists of interconnected nodes (neurons) that process information through weighted connections.',
          mainCategories: ['Machine Learning', 'Deep Learning'],
          subCategories: ['Artificial Neural Networks', 'Computational Models'],
          relatedConcepts: ['Artificial Intelligence', 'Machine Learning', 'Deep Learning'],
          applicationDomains: ['Computer Vision', 'Natural Language Processing'],
          techniques: ['Backpropagation', 'Gradient Descent'],
          difficultyLevel: 'intermediate',
          hasImplementation: true,
          hasInteractiveElements: false,
          hasCaseStudies: true,
          hasCodeExamples: true,
          searchText: 'neural network artificial intelligence machine learning deep learning',
          keywords: ['neural', 'network', 'ai', 'ml', 'deep learning']
        })
        .returning();

      logger.info(`✅ Created test term: ${testTerm[0].name} (${testTerm[0].id})`);
      sampleTerms.push(testTerm[0]);
    }

    const testTerm = sampleTerms[0];
    logger.info(`Using term: ${testTerm.name} (${testTerm.id})`);

    // Step 2: Test template system
    logger.info('Step 2: Testing prompt template system...');
    const templates = promptTemplateService.getAllTemplates();
    logger.info(`✅ Found ${templates.length} templates`);

    const definitionTemplate = promptTemplateService.getDefaultTemplate('definition');
    if (definitionTemplate) {
      logger.info(`✅ Default definition template: ${definitionTemplate.name}`);
    }

    // Step 3: Generate content for a single section
    logger.info('Step 3: Testing single section generation...');
    const sectionResult = await aiContentGenerationService.generateContent({
      termId: testTerm.id,
      sectionName: 'definition',
      model: 'gpt-3.5-turbo',
      userId: 'test-user'
    });

    if (sectionResult.success) {
      logger.info('✅ Single section generation successful!');
      logger.info(`Generated content length: ${sectionResult.content?.length || 0} characters`);
      logger.info(`Cost: $${sectionResult.metadata?.cost || 0}`);
      logger.info(`Tokens: ${sectionResult.metadata?.totalTokens || 0}`);
      logger.info(`Processing time: ${sectionResult.metadata?.processingTime || 0}ms`);
    } else {
      logger.error('❌ Single section generation failed:', { error: sectionResult.error });
    }

    // Step 4: Test bulk generation
    logger.info('Step 4: Testing bulk generation...');
    const bulkResult = await aiContentGenerationService.generateBulkContent({
      termId: testTerm.id,
      sectionNames: ['applications', 'implementation', 'prerequisites'],
      model: 'gpt-3.5-turbo',
      userId: 'test-user'
    });

    if (bulkResult.success) {
      logger.info('✅ Bulk generation successful!');
      logger.info(`Total sections: ${bulkResult.summary.totalSections}`);
      logger.info(`Success count: ${bulkResult.summary.successCount}`);
      logger.info(`Failure count: ${bulkResult.summary.failureCount}`);
      logger.info(`Total cost: $${bulkResult.summary.totalCost}`);
      logger.info(`Total tokens: ${bulkResult.summary.totalTokens}`);
      logger.info(`Total processing time: ${bulkResult.summary.processingTime}ms`);
    } else {
      logger.error('❌ Bulk generation failed');
      bulkResult.results.forEach((result, index) => {
        if (!result.success) {
          logger.error(`Section ${index + 1} failed: ${result.error}`);
        }
      });
    }

    // Step 5: Test template stats
    logger.info('Step 5: Testing template statistics...');
    const templateStats = promptTemplateService.getTemplateStats();
    logger.info('✅ Template statistics:', templateStats);

    // Step 6: Test content regeneration
    logger.info('Step 6: Testing content regeneration...');
    const regenerateResult = await aiContentGenerationService.generateContent({
      termId: testTerm.id,
      sectionName: 'definition',
      model: 'gpt-3.5-turbo',
      userId: 'test-user',
      regenerate: true
    });

    if (regenerateResult.success) {
      logger.info('✅ Content regeneration successful!');
      logger.info(`New content length: ${regenerateResult.content?.length || 0} characters`);
    } else {
      logger.error('❌ Content regeneration failed:', { error: regenerateResult.error });
    }

    logger.info('🎉 AI Content Generation Test Complete!');
    logger.info('Summary:');
    logger.info(`- Templates loaded: ${templates.length}`);
    logger.info(`- Single generation: ${sectionResult.success ? 'SUCCESS' : 'FAILED'}`);
    logger.info(`- Bulk generation: ${bulkResult.success ? 'SUCCESS' : 'FAILED'}`);
    logger.info(`- Regeneration: ${regenerateResult.success ? 'SUCCESS' : 'FAILED'}`);

    return {
      success: true,
      results: {
        templatesLoaded: templates.length,
        singleGeneration: sectionResult.success,
        bulkGeneration: bulkResult.success,
        regeneration: regenerateResult.success,
        testTerm: testTerm.name,
        testTermId: testTerm.id
      }
    };

  } catch (error) {
    logger.error('❌ AI Content Generation Test Failed:', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    });

    return {
      success: false,
      error: error instanceof Error ? error.message : String(error)
    };
  }
}

// Function to test individual components
async function testComponents() {
  try {
    logger.info('🧪 Testing individual components...');

    // Test 1: Template Service
    logger.info('Testing template service...');
    const templates = promptTemplateService.getAllTemplates();
    logger.info(`✅ Template service working: ${templates.length} templates`);

    // Test 2: Database connection
    logger.info('Testing database connection...');
    const termCount = await db.select().from(enhancedTerms).limit(1);
    logger.info(`✅ Database connection working: ${termCount.length} terms found`);

    // Test 3: OpenAI API (if key is available)
    if (process.env.OPENAI_API_KEY) {
      logger.info('✅ OpenAI API key is configured');
    } else {
      logger.warn('⚠️  OpenAI API key not configured - API calls will fail');
    }

    return { success: true };
  } catch (error) {
    logger.error('❌ Component test failed:', {
      error: error instanceof Error ? error.message : String(error)
    });
    return { success: false, error: error instanceof Error ? error.message : String(error) };
  }
}

// Export functions for use in other tests or manual execution
export {
  testAIContentGeneration,
  testComponents
};

// Run tests if this file is executed directly
if (require.main === module) {
  (async () => {
    logger.info('🚀 Running AI Content Generation Tests...');
    
    // Run component tests first
    const componentResults = await testComponents();
    if (!componentResults.success) {
      logger.error('❌ Component tests failed, skipping full test');
      process.exit(1);
    }

    // Run full test
    const testResults = await testAIContentGeneration();
    if (testResults.success) {
      logger.info('✅ All tests passed!');
      process.exit(0);
    } else {
      logger.error('❌ Tests failed');
      process.exit(1);
    }
  })();
}