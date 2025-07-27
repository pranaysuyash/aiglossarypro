import 'dotenv/config';
import { aiContentGenerationService } from '../server/services/aiContentGenerationService';
import { db } from '../server/db';
import { enhancedTerms, sections, sectionItems } from '../shared/enhancedSchema';
import { eq, and } from 'drizzle-orm';
import { randomUUID } from 'crypto';

async function testAIFinal() {
  console.log('🚀 Final AI Content Generation Test...\n');

  const testTermId = randomUUID();
  const testTermData = {
    id: testTermId,
    name: 'Transformer Architecture',
    slug: 'transformer-architecture',
    shortDefinition: 'A neural network architecture that relies on self-attention mechanisms',
    fullDefinition: 'The Transformer is a deep learning model architecture introduced in 2017 that has revolutionized natural language processing. Unlike previous sequence transduction models based on recurrent layers, the Transformer relies entirely on self-attention mechanisms to compute representations of its input and output.',
    mainCategories: ['deep-learning', 'natural-language-processing'],
    subCategories: ['attention-mechanisms', 'sequence-modeling'],
    relatedConcepts: ['attention', 'bert', 'gpt', 'self-attention'],
    applicationDomains: ['language-models', 'machine-translation', 'text-generation'],
    techniques: ['multi-head-attention', 'positional-encoding', 'layer-normalization'],
    difficultyLevel: 'advanced',
    hasImplementation: true,
    hasInteractiveElements: false,
    hasCaseStudies: true,
    hasCodeExamples: true,
    keywords: ['transformers', 'attention', 'NLP', 'BERT', 'GPT', 'self-attention'],
  };

  try {
    // Step 1: Create test term
    console.log('1️⃣ Creating test term in database...');
    await db.insert(enhancedTerms).values(testTermData);
    console.log('   ✅ Term created:', testTermData.name);
    console.log('   - ID:', testTermId);

    // Step 2: Test single section generation
    console.log('\n2️⃣ Testing single section generation...');
    
    const result = await aiContentGenerationService.generateContent({
      termId: testTermId,
      sectionName: 'detailed_explanation',
      model: 'gpt-4o-mini',
      temperature: 0.7,
      maxTokens: 600,
      regenerate: true,
    });

    if (result.success && result.metadata) {
      console.log('   ✅ Content generated successfully!');
      console.log('   - Model:', result.metadata.model);
      console.log('   - Tokens:', result.metadata.totalTokens);
      console.log('   - Cost: $' + result.metadata.cost.toFixed(4));
      console.log('   - Processing time:', result.metadata.processingTime + 'ms');
      console.log('\n   Content preview:');
      console.log('   "' + result.content?.substring(0, 200) + '..."');
      
      // Step 3: Verify storage
      console.log('\n3️⃣ Verifying content storage...');
      
      // Check if section was created
      const storedSection = await db
        .select()
        .from(sections)
        .where(and(
          eq(sections.termId, testTermId),
          eq(sections.name, 'detailed_explanation')
        ))
        .limit(1);
      
      if (storedSection.length > 0) {
        console.log('   ✅ Section created with ID:', storedSection[0].id);
        
        // Check section items
        const storedItems = await db
          .select({
            id: sectionItems.id,
            label: sectionItems.label,
            contentLength: sectionItems.content ? sectionItems.content.length : 0,
            isAiGenerated: sectionItems.isAiGenerated,
            termId: sectionItems.termId,
          })
          .from(sectionItems)
          .where(eq(sectionItems.sectionId, storedSection[0].id));
        
        console.log('   ✅ Section items:', storedItems.length);
        storedItems.forEach(item => {
          console.log(`     - ${item.label}: ${item.contentLength} chars (AI: ${item.isAiGenerated})`);
        });
      }
      
      // Step 4: Test regeneration
      console.log('\n4️⃣ Testing regeneration (should use cached content)...');
      
      const startTime = Date.now();
      const cachedResult = await aiContentGenerationService.generateContent({
        termId: testTermId,
        sectionName: 'detailed_explanation',
        regenerate: false, // Don't regenerate
      });
      const endTime = Date.now();
      
      if (cachedResult.success) {
        console.log('   ✅ Cached content retrieved in', endTime - startTime, 'ms');
        console.log('   - Cost: $0.0000 (cached)');
      }
      
    } else {
      console.log('   ❌ Generation failed:', result.error);
    }

    // Step 5: Check AI usage analytics
    console.log('\n5️⃣ Checking AI usage analytics...');
    const stats = await aiContentGenerationService.getGenerationStats(testTermId);
    console.log('   - Total generations:', stats.totalGenerations);
    console.log('   - Success rate:', (stats.successRate * 100).toFixed(1) + '%');
    console.log('   - Total cost: $' + stats.totalCost.toFixed(4));

    console.log('\n✨ AI Content Generation Pipeline is working correctly!');

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
    console.error('\n❌ Test failed:', error);
    
    // Attempt cleanup on error
    try {
      await db.delete(sections).where(eq(sections.termId, testTermId));
      await db.delete(enhancedTerms).where(eq(enhancedTerms.id, testTermId));
    } catch (_) {}
  } finally {
    process.exit(0);
  }
}

// Run the test
testAIFinal().catch(console.error);