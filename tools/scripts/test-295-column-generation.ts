import { enhanced295ContentService } from '../server/services/enhanced295ContentService';
import { HIERARCHICAL_295_STRUCTURE } from '../shared/295ColumnStructure';
import { COLUMN_PROMPT_TRIPLETS } from '../server/services/promptTriplets295';

async function test295ColumnGeneration() {
  try {
    const contentService = enhanced295ContentService;
    
    // Our test term ID (CNN)
    const termId = '6a4b16b3-a686-4d7c-91d2-284e805f6f9d';
    
    // Test with the first few columns
    const testColumns = [
      'introduction_definition_overview',
      'introduction_key_concepts',
      'introduction_importance_relevance'
    ];
    
    console.log('Testing 295-column content generation...\n');
    
    for (const columnId of testColumns) {
      const columnDef = HIERARCHICAL_295_STRUCTURE.find(col => col.id === columnId);
      const promptDef = COLUMN_PROMPT_TRIPLETS[columnId];
      
      if (columnDef && promptDef) {
        console.log(`\n=== Testing Column: ${columnDef.displayName} ===`);
        console.log(`Path: ${columnDef.path}`);
        console.log(`Section: ${columnDef.section}`);
        console.log(`Priority: ${columnDef.priority}`);
        console.log(`Model: ${promptDef.model}`);
        console.log(`Complexity: ${promptDef.complexity}`);
        
        // Generate content for this column
        console.log('\nGenerating content...');
        const result = await contentService.generateSingleTermContent(
          termId,
          columnId,
          {
            mode: 'full-pipeline',
            qualityThreshold: 7,
            batchSize: 1,
            delayBetweenBatches: 0,
            skipExisting: false,
            model: 'gpt-4o-mini' // Use the actual model
          }
        );
        
        if (result.success) {
          console.log('✅ Generation successful!');
          console.log(`Content preview: ${result.content?.substring(0, 200)}...`);
          console.log(`Evaluation score: ${result.evaluationScore || 'N/A'}`);
          console.log(`Cost: $${result.cost.toFixed(4)}`);
          console.log(`Tokens - Input: ${result.tokens.input}, Output: ${result.tokens.output}`);
          
          if (result.improvedContent) {
            console.log(`Improved content preview: ${result.improvedContent.substring(0, 200)}...`);
          }
        } else {
          console.log(`❌ Generation failed: ${result.error}`);
        }
      }
    }
    
    // Show how the 295 columns map to the 42 sections
    console.log('\n\n=== 295-Column to 42-Section Mapping ===');
    const sectionMap = new Map<string, number>();
    
    HIERARCHICAL_295_STRUCTURE.forEach(col => {
      const count = sectionMap.get(col.section) || 0;
      sectionMap.set(col.section, count + 1);
    });
    
    console.log('\nColumns per section:');
    sectionMap.forEach((count, section) => {
      console.log(`- ${section}: ${count} columns`);
    });
    
    console.log(`\nTotal columns: ${HIERARCHICAL_295_STRUCTURE.length}`);
    
  } catch (error) {
    console.error('Error testing 295-column generation:', error);
  }
  process.exit(0);
}

test295ColumnGeneration();