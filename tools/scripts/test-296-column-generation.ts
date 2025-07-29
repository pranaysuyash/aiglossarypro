import { ALL_296_PROMPT_TRIPLETS, getPromptTripletByColumnId } from '../server/prompts/all296PromptTriplets';
import { db } from '../server/db';
import { enhancedTerms, sectionItems } from '../shared/enhancedSchema';
import { eq } from 'drizzle-orm';
import OpenAI from 'openai';

// Simple template replacement
function replaceTemplateVariables(prompt: string, vars: Record<string, string>): string {
  let result = prompt;
  Object.entries(vars).forEach(([key, value]) => {
    result = result.replace(new RegExp(`\\[${key}\\]`, 'g'), value);
  });
  return result;
}

async function test296ColumnGeneration() {
  try {
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });

    // Our test term
    const termId = '6a4b16b3-a686-4d7c-91d2-284e805f6f9d';
    const [term] = await db.select().from(enhancedTerms)
      .where(eq(enhancedTerms.id, termId))
      .limit(1);

    if (!term) {
      console.log('Term not found');
      return;
    }

    console.log('=== Testing 296-Column Content Generation ===\n');
    console.log(`Term: ${term.name}`);
    console.log(`ID: ${term.id}\n`);

    // Test the first few essential columns
    const testColumns = [
      'term',
      'short_definition', 
      'introduction_definition_overview',
      'introduction_key_concepts',
      'introduction_importance_relevance'
    ];

    for (const columnId of testColumns) {
      const triplet = getPromptTripletByColumnId(columnId);
      if (!triplet) {
        console.log(`No triplet found for column: ${columnId}`);
        continue;
      }

      console.log(`\n=== Column: ${columnId} ===`);
      
      // Replace template variables
      const vars = {
        'TERM': term.name,
        'termName': term.name,
        'category': term.mainCategories?.[0] || 'AI/ML'
      };

      // 1. Generate content
      console.log('Generating content...');
      const generativePrompt = replaceTemplateVariables(triplet.generativePrompt, vars);
      
      try {
        const genResponse = await openai.chat.completions.create({
          model: 'gpt-4o-mini',
          messages: [{ role: 'user', content: generativePrompt }],
          temperature: 0.7,
          max_tokens: 500
        });

        const content = genResponse.choices[0]?.message?.content || '';
        console.log(`Generated: ${content.substring(0, 150)}...`);

        // 2. Evaluate content
        console.log('\nEvaluating content...');
        const evaluativePrompt = replaceTemplateVariables(triplet.evaluativePrompt, vars)
          .replace('[CONTENT]', content);

        const evalResponse = await openai.chat.completions.create({
          model: 'gpt-4o-mini',
          messages: [{ role: 'user', content: evaluativePrompt }],
          temperature: 0.3,
          max_tokens: 200
        });

        const evalResult = evalResponse.choices[0]?.message?.content || '';
        console.log(`Evaluation: ${evalResult}`);

        // Parse evaluation score
        let score = 0;
        let feedback = '';
        try {
          const evalJson = JSON.parse(evalResult);
          score = evalJson.score || 0;
          feedback = evalJson.feedback || '';
        } catch (e) {
          console.log('Failed to parse evaluation result');
        }

        // 3. Improve if needed
        if (score < 7 && score > 0) {
          console.log('\nImproving content (score < 7)...');
          const improvementPrompt = replaceTemplateVariables(triplet.improvementPrompt, vars)
            .replace('[CONTENT]', content)
            .replace('[FEEDBACK]', feedback);

          const improveResponse = await openai.chat.completions.create({
            model: 'gpt-4o-mini',
            messages: [{ role: 'user', content: improvementPrompt }],
            temperature: 0.5,
            max_tokens: 500
          });

          const improvedContent = improveResponse.choices[0]?.message?.content || '';
          console.log(`Improved: ${improvedContent.substring(0, 150)}...`);
        }

        // Calculate costs (approximate)
        const inputTokens = (genResponse.usage?.prompt_tokens || 0) + 
                          (evalResponse.usage?.prompt_tokens || 0);
        const outputTokens = (genResponse.usage?.completion_tokens || 0) + 
                           (evalResponse.usage?.completion_tokens || 0);
        const cost = (inputTokens * 0.00015 + outputTokens * 0.0006) / 1000; // GPT-4o-mini pricing
        
        console.log(`\nTokens - Input: ${inputTokens}, Output: ${outputTokens}`);
        console.log(`Estimated cost: $${cost.toFixed(4)}`);

      } catch (error) {
        console.error(`Error processing column ${columnId}:`, error);
      }
    }

    // Show total column count
    console.log(`\n\n=== 296-Column System Summary ===`);
    console.log(`Total prompt triplets defined: ${ALL_296_PROMPT_TRIPLETS.length}`);
    
    // Check which columns have prompts
    const columnIds = new Set(ALL_296_PROMPT_TRIPLETS.map(t => t.columnId));
    console.log(`Unique columns with prompts: ${columnIds.size}`);
    
    // Sample some column IDs
    console.log('\nSample column IDs:');
    Array.from(columnIds).slice(0, 10).forEach(id => {
      console.log(`  - ${id}`);
    });

  } catch (error) {
    console.error('Error:', error);
  }
  process.exit(0);
}

// Run the test
test296ColumnGeneration();