import 'dotenv/config';
import { db } from '../server/db';
import { enhancedTerms } from '../shared/enhancedSchema';
import { eq } from 'drizzle-orm';

async function testAISimple() {
  console.log('🔍 Simple AI Pipeline Test...\n');

  try {
    // Step 1: Check for existing terms with proper sections
    console.log('1️⃣ Looking for existing terms in database...');
    const existingTerms = await db
      .select({
        id: enhancedTerms.id,
        name: enhancedTerms.name,
        slug: enhancedTerms.slug,
        hasCodeExamples: enhancedTerms.hasCodeExamples,
        hasImplementation: enhancedTerms.hasImplementation,
      })
      .from(enhancedTerms)
      .limit(10);

    console.log(`   Found ${existingTerms.length} terms in database`);
    
    if (existingTerms.length > 0) {
      console.log('\n   Available terms:');
      existingTerms.forEach((term, index) => {
        console.log(`   ${index + 1}. ${term.name} (${term.slug}) - ID: ${term.id}`);
      });

      // Step 2: Test the prompt template service directly
      console.log('\n2️⃣ Testing prompt template service...');
      const { promptTemplateService } = await import('../server/services/promptTemplateService');
      
      // Get available templates
      const templates = promptTemplateService.getAllTemplates();
      console.log(`   Found ${templates.length} templates`);
      
      // Get template categories
      const categories = [...new Set(templates.map(t => t.category))];
      console.log('   Template categories:', categories.join(', '));

      // Step 3: Test generating a prompt without the full AI service
      const testTermId = existingTerms[0].id;
      console.log(`\n3️⃣ Testing prompt generation for term: ${existingTerms[0].name}`);
      
      try {
        const prompt = await promptTemplateService.generateContent({
          termId: testTermId,
          sectionName: 'detailed_explanation',
          model: 'gpt-4o-mini',
          temperature: 0.7,
          maxTokens: 500,
        });
        
        console.log('   ✅ Prompt generated successfully!');
        console.log('   Prompt preview:', prompt.substring(0, 200) + '...');
      } catch (error) {
        console.log('   ❌ Prompt generation error:', error);
        
        // This is expected due to the section_items query issue
        if (error instanceof Error && error.message.includes('section_items')) {
          console.log('\n   💡 The issue is in promptTemplateService - it queries section_items incorrectly');
          console.log('   The service should either:');
          console.log('   1. Not query section_items at all for new content generation');
          console.log('   2. Query through sections table first, then section_items');
          console.log('   3. Use the 296-column structure mapping');
        }
      }

      // Step 4: Test if we can use the default templates
      console.log('\n4️⃣ Testing default template retrieval...');
      const defaultTemplate = promptTemplateService.getDefaultTemplate('detailed_explanation');
      if (defaultTemplate) {
        console.log('   ✅ Found default template:', defaultTemplate.name);
        console.log('   Template variables:', defaultTemplate.variables.join(', '));
      }

    } else {
      console.log('\n   ℹ️  No terms found in database');
      console.log('   You may need to run the import scripts first');
    }

    console.log('\n✨ Test Complete!');
    
    // Summary
    console.log('\n📊 Summary:');
    console.log('   The AI content generation pipeline has the following structure:');
    console.log('   1. Enhanced terms table with basic info');
    console.log('   2. Sections table for organizing content');
    console.log('   3. Section_items table with column_id linking to 296-column structure');
    console.log('   4. Prompt templates for generating content');
    console.log('\n   Current issue: promptTemplateService queries section_items incorrectly');
    console.log('   Solution: Modify the service to handle new content generation properly');

  } catch (error) {
    console.error('\n❌ Test failed:', error);
  } finally {
    process.exit(0);
  }
}

// Run the test
testAISimple().catch(console.error);