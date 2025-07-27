import 'dotenv/config';
import { aiContentGenerationService } from '../server/services/aiContentGenerationService';
import { db } from '../server/db';
import { enhancedTerms } from '../shared/enhancedSchema';
import { eq } from 'drizzle-orm';
import { randomUUID } from 'crypto';

async function testAIPipeline() {
  console.log('🔍 Testing AI Content Generation Pipeline...\n');

  // Check environment variables
  console.log('1️⃣ Checking environment variables:');
  console.log('   - OPENAI_API_KEY:', process.env.OPENAI_API_KEY ? '✅ Present' : '❌ Missing');
  console.log('   - DATABASE_URL:', process.env.DATABASE_URL ? '✅ Present' : '❌ Missing');
  console.log('   - OPENAI_API_URL:', process.env.OPENAI_API_URL || 'https://api.openai.com/v1 (default)');
  
  if (!process.env.OPENAI_API_KEY) {
    console.error('\n❌ OPENAI_API_KEY is missing from .env file!');
    console.log('Please add: OPENAI_API_KEY=your-api-key-here');
    process.exit(1);
  }

  try {
    // Test database connection
    console.log('\n2️⃣ Testing database connection...');
    const testQuery = await db.select().from(enhancedTerms).limit(1);
    console.log('   ✅ Database connected successfully');

    // Create or find a test term
    console.log('\n3️⃣ Creating test AI/ML term...');
    const testTermData = {
      id: randomUUID(),
      name: 'Neural Network',
      slug: 'neural-network',
      shortDefinition: 'AI system inspired by the brain',
      // enhancedTerms schema uses different field names
      mainCategories: ['machine-learning'],
      subCategories: ['deep-learning'],
      relatedConcepts: ['perceptron', 'backpropagation'],
      difficultyLevel: 'intermediate' as const,
    };

    // Insert test term
    await db.insert(enhancedTerms).values(testTermData);
    console.log('   ✅ Test term created:', testTermData.name);

    // Test AI content generation
    console.log('\n4️⃣ Testing AI content generation...');
    const generationRequest = {
      termId: testTermData.id,
      sectionName: 'detailed_explanation',
      model: 'gpt-4o-mini', // Using the cheaper model for testing
      temperature: 0.7,
      maxTokens: 500,
      regenerate: true,
    };

    console.log('   - Generating content for section:', generationRequest.sectionName);
    console.log('   - Using model:', generationRequest.model);
    
    const startTime = Date.now();
    const result = await aiContentGenerationService.generateContent(generationRequest);
    const endTime = Date.now();

    if (result.success) {
      console.log('\n   ✅ Content generated successfully!');
      console.log('   - Processing time:', endTime - startTime, 'ms');
      console.log('   - Tokens used:', result.metadata?.totalTokens);
      console.log('   - Cost: $', result.metadata?.cost.toFixed(4));
      console.log('\n   Generated content preview:');
      console.log('   ', result.content?.substring(0, 200) + '...');
    } else {
      console.error('\n   ❌ Generation failed:', result.error);
    }

    // Clean up test term
    console.log('\n5️⃣ Cleaning up test data...');
    await db.delete(enhancedTerms).where(eq(enhancedTerms.id, testTermData.id));
    console.log('   ✅ Test term deleted');

    console.log('\n✨ AI Pipeline Test Complete!');
    
    // Summary
    console.log('\n📊 Summary:');
    console.log('   - Environment: ✅ Configured');
    console.log('   - Database: ✅ Connected');
    console.log('   - OpenAI API: ' + (result.success ? '✅ Working' : '❌ Failed'));
    console.log('   - Content Generation: ' + (result.success ? '✅ Functional' : '❌ Not working'));

  } catch (error) {
    console.error('\n❌ Test failed with error:', error);
    if (error instanceof Error) {
      console.error('   Error message:', error.message);
      console.error('   Stack trace:', error.stack);
    }
  } finally {
    process.exit(0);
  }
}

// Run the test
testAIPipeline().catch(console.error);