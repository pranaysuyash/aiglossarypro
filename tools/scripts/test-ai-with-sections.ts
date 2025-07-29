import 'dotenv/config';
import { aiContentGenerationService } from '../server/services/aiContentGenerationService';
import { db } from '../server/db';
import { enhancedTerms, sections, sectionItems } from '../shared/enhancedSchema';
import { eq, and } from 'drizzle-orm';
import { randomUUID } from 'crypto';

async function testAIWithSections() {
  console.log('🚀 Testing AI Generation with Proper Section Structure...\n');

  const testTermId = randomUUID();
  const testTermData = {
    id: testTermId,
    name: 'Neural Network',
    slug: 'neural-network',
    shortDefinition: 'A computing system inspired by biological neural networks that constitute animal brains',
    fullDefinition: 'A neural network is a series of algorithms that endeavors to recognize underlying relationships in a set of data through a process that mimics the way the human brain operates. Neural networks can adapt to changing input; so the network generates the best possible result without needing to redesign the output criteria.',
    mainCategories: ['machine-learning', 'artificial-intelligence'],
    subCategories: ['deep-learning', 'pattern-recognition'],
    relatedConcepts: ['perceptron', 'backpropagation', 'gradient-descent', 'activation-function'],
    applicationDomains: ['computer-vision', 'natural-language-processing', 'speech-recognition'],
    techniques: ['supervised-learning', 'unsupervised-learning', 'reinforcement-learning'],
    difficultyLevel: 'intermediate',
    hasImplementation: true,
    hasInteractiveElements: false,
    hasCaseStudies: true,
    hasCodeExamples: true,
    keywords: ['AI', 'ML', 'deep-learning', 'artificial-neurons', 'layers', 'weights', 'biases'],
  };

  try {
    // Step 1: Create the term
    console.log('1️⃣ Creating test term in database...');
    await db.insert(enhancedTerms).values(testTermData);
    console.log('   ✅ Term created:', testTermData.name);
    console.log('   - ID:', testTermId);

    // Step 2: Create sections structure
    console.log('\n2️⃣ Creating section structure...');
    
    // Based on user's comment about 296 columns and prompt structure, create sections
    const sectionsToCreate = [
      { name: 'detailed_explanation', displayOrder: 1 },
      { name: 'key_concepts', displayOrder: 2 },
      { name: 'practical_applications', displayOrder: 3 },
      { name: 'implementation_guide', displayOrder: 4 },
      { name: 'code_examples', displayOrder: 5 },
      { name: 'common_pitfalls', displayOrder: 6 },
      { name: 'best_practices', displayOrder: 7 },
      { name: 'real_world_examples', displayOrder: 8 },
      { name: 'learning_resources', displayOrder: 9 }
    ];

    for (const sectionData of sectionsToCreate) {
      const [section] = await db.insert(sections).values({
        termId: testTermId,
        name: sectionData.name,
        displayOrder: sectionData.displayOrder,
        isCompleted: false
      }).returning();
      
      console.log(`   ✅ Created section: ${sectionData.name} (ID: ${section.id})`);
    }

    // Step 3: Test AI generation for one section
    console.log('\n3️⃣ Testing AI content generation for detailed_explanation...\n');
    
    const startTime = Date.now();
    
    const result = await aiContentGenerationService.generateContent({
      termId: testTermId,
      sectionName: 'detailed_explanation',
      model: 'gpt-4o-mini',
      temperature: 0.7,
      maxTokens: 800,
      regenerate: true,
    });

    const endTime = Date.now();
    const processingTime = endTime - startTime;

    if (result.success && result.metadata) {
      console.log('   ✅ Content generated successfully!');
      console.log('   - Model:', result.metadata.model);
      console.log('   - Tokens used:', result.metadata.totalTokens);
      console.log('   - Cost: $' + result.metadata.cost.toFixed(4));
      console.log('   - Processing time:', processingTime + 'ms');
      console.log('\n   Generated content preview:');
      console.log('   "' + result.content?.substring(0, 200) + '..."');
      
      // Step 4: Verify the content was stored
      console.log('\n4️⃣ Verifying stored content...');
      
      const storedSection = await db
        .select()
        .from(sections)
        .where(and(
          eq(sections.termId, testTermId),
          eq(sections.name, 'detailed_explanation')
        ))
        .limit(1);
      
      if (storedSection.length > 0) {
        const storedItems = await db
          .select()
          .from(sectionItems)
          .where(eq(sectionItems.sectionId, storedSection[0].id));
        
        console.log('   ✅ Found section with', storedItems.length, 'items');
        storedItems.forEach((item, index) => {
          console.log(`   - Item ${index + 1}: ${item.label || 'unnamed'} (${item.contentType || 'text'})`);
        });
      }
      
    } else {
      console.log('   ❌ Generation failed:', result.error);
    }

    // Step 5: Test generation stats
    console.log('\n5️⃣ Checking generation statistics...');
    const stats = await aiContentGenerationService.getGenerationStats(testTermId);
    console.log('   - Total generations:', stats.totalGenerations);
    console.log('   - Success rate:', (stats.successRate * 100).toFixed(1) + '%');
    console.log('   - Total cost: $' + stats.totalCost.toFixed(4));
    console.log('   - Average tokens:', Math.round(stats.averageTokens));

    console.log('\n✨ Test completed successfully!');

    // Cleanup
    console.log('\n6️⃣ Cleaning up test data...');
    
    // Delete section items first
    const sectionsToDelete = await db
      .select()
      .from(sections)
      .where(eq(sections.termId, testTermId));
    
    for (const section of sectionsToDelete) {
      await db.delete(sectionItems).where(eq(sectionItems.sectionId, section.id));
    }
    
    // Delete sections
    await db.delete(sections).where(eq(sections.termId, testTermId));
    
    // Delete the term
    await db.delete(enhancedTerms).where(eq(enhancedTerms.id, testTermId));
    
    console.log('   ✅ Test data cleaned up');

  } catch (error) {
    console.error('\n❌ Test failed with error:', error);
    if (error instanceof Error) {
      console.error('   Stack:', error.stack);
    }
    
    // Attempt cleanup on error
    try {
      await db.delete(sections).where(eq(sections.termId, testTermId));
      await db.delete(enhancedTerms).where(eq(enhancedTerms.id, testTermId));
      console.log('   Cleaned up test data after error');
    } catch (cleanupError) {
      console.log('   Failed to cleanup:', cleanupError);
    }
  } finally {
    process.exit(0);
  }
}

// Run the test
testAIWithSections().catch(console.error);