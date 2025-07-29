import 'dotenv/config';
import { aiContentGenerationService } from '../server/services/aiContentGenerationService';
import { db } from '../server/db';
import { enhancedTerms } from '../shared/enhancedSchema';
import { sql } from 'drizzle-orm';

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
    console.log('   - Found', testQuery.length, 'existing terms in database');

    if (testQuery.length === 0) {
      console.log('\n⚠️  No existing terms found in database.');
      console.log('   The database appears to be empty.');
      console.log('   This is expected if using the new content pipeline.');
      
      // Check table structure
      console.log('\n3️⃣ Checking database schema...');
      const schemaCheck = await db.execute(sql`
        SELECT column_name, data_type, is_nullable 
        FROM information_schema.columns 
        WHERE table_name = 'enhanced_terms' 
        ORDER BY ordinal_position
      `);
      console.log('   Enhanced terms table columns:');
      schemaCheck.rows.forEach((col: any) => {
        console.log(`   - ${col.column_name}: ${col.data_type} ${col.is_nullable === 'NO' ? '(required)' : ''}`);
      });
    } else {
      // Use existing term for testing
      const existingTerm = testQuery[0];
      console.log('\n3️⃣ Using existing term for test:', existingTerm.name);

      // Test AI content generation
      console.log('\n4️⃣ Testing AI content generation...');
      const generationRequest = {
        termId: existingTerm.id,
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
    }

    // Test OpenAI connectivity directly
    console.log('\n5️⃣ Testing OpenAI API directly...');
    const { OpenAI } = await import('openai');
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    try {
      const testCompletion = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: 'You are a helpful assistant.' },
          { role: 'user', content: 'Say "AI pipeline test successful!" in exactly 5 words.' }
        ],
        max_tokens: 20,
      });

      console.log('   ✅ OpenAI API connection successful!');
      console.log('   Response:', testCompletion.choices[0]?.message?.content);
    } catch (apiError) {
      console.error('   ❌ OpenAI API error:', apiError);
    }

    console.log('\n✨ AI Pipeline Audit Complete!');
    
    // Summary
    console.log('\n📊 Summary:');
    console.log('   - Environment: ✅ Configured');
    console.log('   - Database: ✅ Connected');
    console.log('   - Database Status:', testQuery.length > 0 ? '✅ Has data' : '⚠️  Empty (expected for new pipeline)');
    console.log('   - OpenAI API: Check results above');

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