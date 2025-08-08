// scripts/generatePromptTriplets.ts
// Generate prompt triplets for all columns following the established pattern
import { ALL_295_COLUMNS } from '../shared/all295ColumnDefinitions';
import { ALL_295_PROMPT_TRIPLETS } from '../server/prompts/all295PromptTriplets';
import * as fs from 'fs';
import * as path from 'path';
// Get existing prompt column IDs
const existingIds = new Set(ALL_295_PROMPT_TRIPLETS.map(t => t.columnId));
// Generate prompt triplet for a column
function generatePromptTriplet(column) {
    const { id, displayName, description, contentType, estimatedTokens, category } = column;
    // Determine appropriate output format based on content type
    let outputFormat = '';
    if (contentType === 'array') {
        outputFormat = 'Provide a markdown unordered list';
    }
    else if (contentType === 'code') {
        outputFormat = 'Provide code snippets in appropriate language with markdown code blocks';
    }
    else if (contentType === 'interactive') {
        outputFormat = 'Provide interactive content specification in markdown format';
    }
    else if (contentType === 'object') {
        outputFormat = 'Provide structured content in JSON format';
    }
    else {
        outputFormat = 'Write content in Markdown format';
    }
    // Determine token guidance
    let tokenGuidance = '';
    if (estimatedTokens <= 50) {
        tokenGuidance = 'Keep it very concise (1-2 sentences)';
    }
    else if (estimatedTokens <= 150) {
        tokenGuidance = 'Keep it concise (2-4 sentences or 3-5 bullet points)';
    }
    else if (estimatedTokens <= 300) {
        tokenGuidance = 'Provide moderate detail (1-2 paragraphs or 5-7 bullet points)';
    }
    else {
        tokenGuidance = 'Provide comprehensive detail with multiple sections';
    }
    const generativePrompt = `ROLE: You are an AI/ML expert creating comprehensive glossary content.
TASK: Generate content for **[TERM]** focusing on: ${displayName}.
CONTEXT: ${description}
OUTPUT FORMAT: ${outputFormat}.
CONSTRAINTS:
- ${tokenGuidance}.
- Ensure accuracy and clarity for ${category} level content.
- Focus specifically on the aspect described in the column name.
- Use technical language appropriate for the audience level.`;
    const evaluativePrompt = `ROLE: You are an AI content reviewer specializing in technical accuracy.
TASK: Evaluate the ${displayName} content for **[TERM]**.
OUTPUT FORMAT: Return JSON with "score" (1-10) and "feedback" string.
CONSTRAINTS:
- Check accuracy and completeness for ${description}.
- Verify appropriate detail level for ${category} content.
- Assess clarity and technical correctness.
- Note any missing key points or inaccuracies.`;
    const improvementPrompt = `ROLE: You are an AI writing assistant improving technical content.
TASK: Enhance the ${displayName} content for **[TERM]**.
OUTPUT FORMAT: Return only the improved content in the same format.
CONSTRAINTS:
- Maintain accuracy while improving clarity.
- Ensure completeness for ${description}.
- Keep within appropriate scope and detail level.
- Address any feedback from evaluation.`;
    return {
        columnId: id,
        generativePrompt,
        evaluativePrompt,
        improvementPrompt
    };
}
// Generate all missing prompt triplets
const allPromptTriplets = [];
// First, check for duplicates in existing
console.log('Existing prompt triplets:', ALL_295_PROMPT_TRIPLETS.length);
const existingCounts = new Map();
ALL_295_PROMPT_TRIPLETS.forEach(t => {
    existingCounts.set(t.columnId, (existingCounts.get(t.columnId) || 0) + 1);
});
const duplicates = [...existingCounts.entries()].filter(([id, count]) => count > 1);
if (duplicates.length > 0) {
    console.log('Duplicate prompt triplets found:', duplicates);
}
// Add all prompt triplets
ALL_295_COLUMNS.forEach(column => {
    const existing = ALL_295_PROMPT_TRIPLETS.find(t => t.columnId === column.id);
    if (existing) {
        allPromptTriplets.push(existing);
    }
    else {
        allPromptTriplets.push(generatePromptTriplet(column));
    }
});
// Generate the complete file content
const fileContent = `// server/prompts/all295PromptTriplets.ts
// Complete set of prompt triplets for all 295 columns

export interface PromptTriplet {
  columnId: string;
  generativePrompt: string;
  evaluativePrompt: string;
  improvementPrompt: string;
}

export const ALL_295_PROMPT_TRIPLETS: PromptTriplet[] = [
${allPromptTriplets.map((triplet, index) => {
    const column = ALL_295_COLUMNS.find(c => c.id === triplet.columnId);
    return `  // Column ${column?.order}: ${column?.displayName}
  {
    columnId: '${triplet.columnId}',
    generativePrompt: \`${triplet.generativePrompt}\`,
    
    evaluativePrompt: \`${triplet.evaluativePrompt}\`,
    
    improvementPrompt: \`${triplet.improvementPrompt}\`
  }${index < allPromptTriplets.length - 1 ? ',' : ''}`;
}).join('\n\n')}
];

// Helper function to get prompt triplet by column ID
export function getPromptTripletByColumnId(columnId: string): PromptTriplet | undefined {
  return ALL_295_PROMPT_TRIPLETS.find(triplet => triplet.columnId === columnId);
}

// Helper function to validate all columns have prompt triplets
export function validatePromptCompleteness(columnIds: string[]): {
  complete: boolean;
  missing: string[];
} {
  const promptColumnIds = new Set(ALL_295_PROMPT_TRIPLETS.map(t => t.columnId));
  const missing = columnIds.filter(id => !promptColumnIds.has(id));
  
  return {
    complete: missing.length === 0,
    missing
  };
}
`;
// Write to file
const outputPath = path.join(process.cwd(), 'server/prompts/all295PromptTriplets.generated.ts');
fs.writeFileSync(outputPath, fileContent);
console.log(`Generated ${allPromptTriplets.length} prompt triplets`);
console.log(`File written to: ${outputPath}`);
console.log('\nValidation:');
console.log(`- Total columns: ${ALL_295_COLUMNS.length}`);
console.log(`- Total prompt triplets: ${allPromptTriplets.length}`);
console.log(`- Match: ${ALL_295_COLUMNS.length === allPromptTriplets.length ? '✅ YES' : '❌ NO'}`);
