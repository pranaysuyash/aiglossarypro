import 'dotenv/config';
import { aiContentGenerationService } from '../server/services/aiContentGenerationService';
import { db } from '../server/db';
import { enhancedTerms, sections, sectionItems } from '../shared/enhancedSchema';
import { eq, and } from 'drizzle-orm';
import { randomUUID } from 'crypto';

async function testCompleteAITerm() {
  console.log('🚀 Testing Complete AI Term Generation Pipeline...\n');

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
    console.log('   - Categories:', testTermData.mainCategories.join(', '));

    // Step 2: Define sections to generate
    const sectionsToGenerate = [
      'detailed_explanation',
      'key_concepts',
      'practical_applications',
      'implementation_guide',
      'code_examples',
      'common_pitfalls',
      'best_practices',
      'real_world_examples',
      'learning_resources'
    ];

    console.log('\n2️⃣ Generating AI content for', sectionsToGenerate.length, 'sections...\n');

    const results = {
      successful: 0,
      failed: 0,
      totalCost: 0,
      totalTokens: 0,
      totalTime: 0
    };

    // Step 3: Generate content for each section
    for (const sectionName of sectionsToGenerate) {
      console.log(`   📝 Generating: ${sectionName}`);
      
      const startTime = Date.now();
      
      try {
        const result = await aiContentGenerationService.generateContent({
          termId: testTermId,
          sectionName,
          model: 'gpt-4o-mini', // Using cost-effective model
          temperature: 0.7,
          maxTokens: 800,
          regenerate: true,
        });

        const endTime = Date.now();
        const processingTime = endTime - startTime;

        if (result.success && result.metadata) {
          results.successful++;
          results.totalCost += result.metadata.cost;
          results.totalTokens += result.metadata.totalTokens;
          results.totalTime += processingTime;

          console.log(`      ✅ Success!`);
          console.log(`      - Tokens: ${result.metadata.totalTokens}`);
          console.log(`      - Cost: $${result.metadata.cost.toFixed(4)}`);
          console.log(`      - Time: ${processingTime}ms`);
          console.log(`      - Preview: "${result.content?.substring(0, 100)}..."`);
        } else {
          results.failed++;
          console.log(`      ❌ Failed: ${result.error}`);
        }
      } catch (error) {
        results.failed++;
        console.log(`      ❌ Error: ${error instanceof Error ? error.message : String(error)}`);
      }

      // Add small delay between requests
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    // Step 4: Verify stored content
    console.log('\n3️⃣ Verifying stored content...');
    
    // Check sections
    const storedSections = await db
      .select()
      .from(sections)
      .where(eq(sections.termId, testTermId));
    
    console.log(`   - Found ${storedSections.length} sections in database`);

    // Check section items
    const storedItems = await db
      .select({
        sectionName: sections.name,
        content: sectionItems.content,
        isAiGenerated: sectionItems.isAiGenerated,
      })
      .from(sectionItems)
      .innerJoin(sections, eq(sectionItems.sectionId, sections.id))
      .where(eq(sections.termId, testTermId));

    console.log(`   - Found ${storedItems.length} section items with content`);
    
    storedItems.forEach(item => {
      console.log(`     • ${item.sectionName}: ${item.content?.substring(0, 50)}...`);
    });

    // Step 5: Test retrieving the complete term with all content
    console.log('\n4️⃣ Testing complete term retrieval...');
    
    const completeTermData = await db
      .select()
      .from(enhancedTerms)
      .where(eq(enhancedTerms.id, testTermId))
      .limit(1);

    if (completeTermData.length > 0) {
      console.log('   ✅ Term retrieved successfully');
      console.log('   - View count:', completeTermData[0].viewCount);
      console.log('   - Has content sections:', storedSections.length > 0);
    }

    // Summary
    console.log('\n📊 Generation Summary:');
    console.log('   - Sections attempted:', sectionsToGenerate.length);
    console.log('   - Successful:', results.successful);
    console.log('   - Failed:', results.failed);
    console.log('   - Total tokens used:', results.totalTokens);
    console.log('   - Total cost: $' + results.totalCost.toFixed(4));
    console.log('   - Average time per section:', Math.round(results.totalTime / sectionsToGenerate.length) + 'ms');
    console.log('   - Success rate:', Math.round((results.successful / sectionsToGenerate.length) * 100) + '%');

    // Step 6: Cleanup
    console.log('\n5️⃣ Cleaning up test data...');
    
    // Delete section items first (due to foreign key)
    const sectionIds = storedSections.map(s => s.id);
    if (sectionIds.length > 0) {
      await db.delete(sectionItems).where(
        and(...sectionIds.map(id => eq(sectionItems.sectionId, id)))
      );
    }
    
    // Delete sections
    await db.delete(sections).where(eq(sections.termId, testTermId));
    
    // Delete the term
    await db.delete(enhancedTerms).where(eq(enhancedTerms.id, testTermId));
    
    console.log('   ✅ Test data cleaned up');

    console.log('\n✨ Complete AI Term Test Finished Successfully!');

  } catch (error) {
    console.error('\n❌ Test failed with error:', error);
    
    // Attempt cleanup on error
    try {
      await db.delete(enhancedTerms).where(eq(enhancedTerms.id, testTermId));
      console.log('   Cleaned up test term after error');
    } catch (cleanupError) {
      console.log('   Failed to cleanup:', cleanupError);
    }
  } finally {
    process.exit(0);
  }
}

// Run the test
testCompleteAITerm().catch(console.error);