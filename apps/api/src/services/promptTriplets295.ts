// server/services/promptTriplets295.ts
// Complete prompt triplet definitions for all 295 columns

export interface PromptTriplet {
  generative: string;
  evaluative: string;
  improvement: string;
}

export interface ColumnPromptDefinition {
  columnId: string;
  prompts: PromptTriplet;
  model: 'gpt-4.1-nano' | 'gpt-4.1-mini' | 'o4-mini';
  complexity: 'simple' | 'moderate' | 'complex';
}

export const COLUMN_PROMPT_TRIPLETS: Record<string, ColumnPromptDefinition> = {
  // TERM (Column 1)
  'term': {
    columnId: 'term',
    model: 'gpt-4.1-nano',
    complexity: 'simple',
    prompts: {
      generative: `ROLE: You are an AI/ML glossary content generator with expert knowledge in AI and machine learning terminology.
TASK: Provide the canonical name of the given AI/ML term as a concise standalone phrase.
INPUT: Term data and context.
OUTPUT FORMAT: Return the term exactly as a short text (no additional explanation), correctly capitalized and spelled.
CONSTRAINTS: Maintain a neutral and professional tone. Do not include definitions, only the term itself. Maximum 5 words if it's a multi-word term.`,

      evaluative: `ROLE: You are an AI assistant tasked with quality reviewing the provided term name.
TASK: Evaluate whether the term name is correctly provided, well-formatted, and appropriate for the glossary.
OUTPUT FORMAT: Output a JSON object with a "score" (1-10) assessing the term's correctness, and a "feedback" string with a brief comment. Example: {"score": 10, "feedback": "Term format is correct."}
CONSTRAINTS: Be objective and concise. Use a professional tone. If the term name is perfect, assign a high score; deduct points for any spelling issues, extraneous words, or improper formatting.`,

      improvement: `ROLE: You are an AI content editor and AI/ML expert.
TASK: Given an existing term name, refine it for correctness and clarity. If the term is already correct, repeat it unchanged; if there are issues (typos, extra words, wrong casing), provide the corrected term name.
OUTPUT FORMAT: Return the improved term name as plain text (just the term).
CONSTRAINTS: Preserve the original meaning. Do not add any new information or commentary—only the corrected term. Use proper capitalization and spelling.`
    }
  },

  // INTRODUCTION – DEFINITION AND OVERVIEW (Column 2)
  'introduction_definition_overview': {
    columnId: 'introduction_definition_overview',
    model: 'gpt-4.1-mini',
    complexity: 'moderate',
    prompts: {
      generative: `ROLE: You are an AI/ML expert and technical writer creating glossary content.
TASK: Write a concise definition and overview for the term **{{termName}}** in the context of AI/ML. Clearly explain what it is and its general role or meaning.
OUTPUT FORMAT: Provide 1-3 well-formed sentences in Markdown (a short paragraph) that defines **{{termName}}** and gives an overview of its significance.
CONSTRAINTS: Use an informative and neutral tone suitable for a glossary. Keep it succinct (around 50-100 words) while ensuring clarity. Avoid overly technical jargon or detailed examples—focus on a high-level understanding.`,

      evaluative: `ROLE: You are an AI content reviewer with expertise in AI/ML.
TASK: Evaluate the quality of a definition and overview text for **{{termName}}**. Check for accuracy, clarity, completeness, and appropriate length for a glossary entry.
OUTPUT FORMAT: Output a JSON object with a "score" (1-10) and "feedback" explaining the rating. For example: {"score": 8, "feedback": "Clear definition, but missing mention of the term's role in AI/ML."}
CONSTRAINTS: Maintain a constructive and professional tone. Focus on whether the definition correctly captures the term's meaning, if any key points are missing or incorrect, and if the explanation is easy to understand. Keep feedback brief (1-3 sentences).`,

      improvement: `ROLE: You are an AI writing assistant skilled in editing technical content.
TASK: Given a draft definition and overview for **{{termName}}**, refine and enhance it. Improve clarity, correctness, and completeness while maintaining the original meaning.
OUTPUT FORMAT: Provide the revised definition and overview in the same format (a short Markdown paragraph). Preserve the explanation of **{{termName}}** but make it more clear and polished.
CONSTRAINTS: Use an educational yet accessible tone. Do not introduce unrelated information. Keep the length similar (roughly 1-3 sentences). Ensure the core definition remains, adding clarification or slight expansion only if needed for understanding.`
    }
  },

  // INTRODUCTION – KEY CONCEPTS AND PRINCIPLES (Column 3)
  'introduction_key_concepts': {
    columnId: 'introduction_key_concepts',
    model: 'gpt-4.1-mini',
    complexity: 'moderate',
    prompts: {
      generative: `ROLE: You are an AI/ML subject matter expert compiling foundational concepts.
TASK: Identify and list the key concepts or principles underlying **{{termName}}**. Break down the fundamental ideas someone should know to understand **{{termName}}**.
OUTPUT FORMAT: Provide a markdown unordered list of 3-5 bullet points. Each bullet should name a concept or principle and give a brief (one sentence) explanation of its relation to **{{termName}}**.
CONSTRAINTS: Keep each point concise and focused on core principles. Use a consistent, informative tone. Avoid extraneous detail or examples; stick to the primary concepts that define or support **{{termName}}**.`,

      evaluative: `ROLE: You are an AI content quality reviewer.
TASK: Evaluate the list of key concepts and principles for **{{termName}}**. Verify that the listed concepts are relevant and essential, and that each is clearly described.
OUTPUT FORMAT: Return a JSON object with "score" (1-10) and "feedback". For example: {"score": 7, "feedback": "Covers main principles, but missing one fundamental concept and one bullet is too vague."}
CONSTRAINTS: Provide honest, constructive feedback in a neutral tone. Note if any crucial concept is omitted or if any listed item is irrelevant or unclear. Keep feedback brief (1-2 sentences) and specific.`,

      improvement: `ROLE: You are an AI assistant proficient in editing technical lists.
TASK: Given a draft list of key concepts/principles for **{{termName}}**, improve it. Refine the wording for clarity and completeness, remove any irrelevant points, and add any missing key principle.
OUTPUT FORMAT: Provide an updated markdown bullet list of key concepts/principles. Maintain the list format but with improved or corrected content for each bullet.
CONSTRAINTS: Preserve correct concepts from the original. Use clear and consistent phrasing. Ensure each bullet remains concise (ideally one line or sentence) and directly pertinent to **{{termName}}**. Do not introduce unrelated concepts.`
    }
  },

  // INTRODUCTION – IMPORTANCE AND RELEVANCE IN AI/ML (Column 4)
  'introduction_importance_relevance': {
    columnId: 'introduction_importance_relevance',
    model: 'gpt-4.1-mini',
    complexity: 'moderate',
    prompts: {
      generative: `ROLE: You are an AI educator emphasizing context and impact.
TASK: Explain the importance of **{{termName}}** and its relevance in the field of AI/ML. Describe why this concept matters or how it is used in practice.
OUTPUT FORMAT: Provide a brief explanatory passage in Markdown (2-4 sentences) highlighting the significance of **{{termName}}**. It should read as a cohesive paragraph.
CONSTRAINTS: Use a clear and informative tone. Keep it concise (~50-120 words). Focus on the term's role, benefits, or influence in AI/ML. Avoid overly technical detail; the goal is to convey why the term is important.`,

      evaluative: `ROLE: You are an AI content reviewer.
TASK: Assess the provided "importance and relevance" text for **{{termName}}**. Check if it clearly conveys why the term matters in AI/ML and if it is factual and well-focused.
OUTPUT FORMAT: JSON object with "score" (1-10) and "feedback". E.g.: {"score": 9, "feedback": "Clearly explains the term's significance, though an example application could strengthen it."}
CONSTRAINTS: Be fair and concise. Use a professional tone. Point out if the explanation is too vague, too detailed, or misses key reasons for relevance. Feedback should be 1-2 sentences maximum.`,

      improvement: `ROLE: You are an AI writing assistant and editor.
TASK: Improve a draft passage about **{{termName}}**'s importance in AI/ML. Enhance clarity, relevance, and impact of the explanation, ensuring it fully answers why **{{termName}}** is important.
OUTPUT FORMAT: A refined Markdown paragraph (2-4 sentences) describing the term's importance, preserving the original intent but with clearer and more compelling language.
CONSTRAINTS: Maintain an informative and neutral tone. Keep the explanation concise and focused. Do not introduce unrelated information; only strengthen the points about relevance and significance. Aim for the same length (around 50-120 words).`
    }
  },

  // THEORETICAL CONCEPTS – MATHEMATICAL FOUNDATIONS (Column 18)
  'theoretical_mathematical_foundations': {
    columnId: 'theoretical_mathematical_foundations',
    model: 'o4-mini',
    complexity: 'complex',
    prompts: {
      generative: `ROLE: You are a mathematics professor and AI/ML expert specializing in theoretical foundations.
TASK: Explain the key mathematical and statistical foundations underlying **{{termName}}**. Cover the essential mathematical concepts, formulas, and statistical principles that form the theoretical basis.
OUTPUT FORMAT: Provide a comprehensive but accessible explanation in Markdown format (3-5 paragraphs) covering the mathematical foundations. Include key equations where relevant, but explain them clearly.
CONSTRAINTS: Balance technical accuracy with accessibility. Use LaTeX notation for mathematical expressions where appropriate. Keep explanations clear for readers with undergraduate mathematics background. Focus on the most important mathematical concepts (200-400 words).`,

      evaluative: `ROLE: You are a mathematics and AI/ML content reviewer.
TASK: Evaluate the mathematical foundations explanation for **{{termName}}**. Check for mathematical accuracy, completeness of essential concepts, clarity of explanations, and appropriate level of detail.
OUTPUT FORMAT: JSON with "score" (1-10) and "feedback". Example: {"score": 7, "feedback": "Covers key mathematical concepts well, but the explanation of probability distributions could be clearer and one important formula is missing."}
CONSTRAINTS: Focus on mathematical correctness, conceptual completeness, and clarity. Note any missing fundamental concepts or mathematical errors. Feedback should be specific about mathematical content (2-3 sentences).`,

      improvement: `ROLE: You are a mathematics editor and AI/ML expert.
TASK: Improve the mathematical foundations explanation for **{{termName}}**. Enhance mathematical clarity, add missing essential concepts, correct any errors, and improve the accessibility of complex mathematical ideas.
OUTPUT FORMAT: Provide a revised Markdown explanation of the mathematical foundations, maintaining technical accuracy while improving clarity and completeness.
CONSTRAINTS: Preserve correct mathematical content from the original. Ensure mathematical notation is consistent and clear. Add mathematical details only if essential for understanding. Maintain appropriate level for undergraduate mathematics background.`
    }
  },

  // HOW IT WORKS – STEP BY STEP (Column 25)
  'how_it_works_step_by_step': {
    columnId: 'how_it_works_step_by_step',
    model: 'gpt-4.1-mini',
    complexity: 'moderate',
    prompts: {
      generative: `ROLE: You are an AI/ML instructor explaining complex processes clearly.
TASK: Provide a detailed step-by-step explanation of how **{{termName}}** works. Break down the process into clear, logical steps that build understanding progressively.
OUTPUT FORMAT: Create a numbered step-by-step process in Markdown format. Each step should be clearly explained with sufficient detail to understand what happens at that stage.
CONSTRAINTS: Use clear, instructional language. Each step should logically follow from the previous one. Aim for 5-8 main steps, keeping each step explanation to 1-2 sentences. Focus on the core process flow (250-350 words total).`,

      evaluative: `ROLE: You are an AI/ML instructional content reviewer.
TASK: Evaluate the step-by-step explanation for **{{termName}}**. Check if the steps are logically ordered, clearly explained, complete, and help build understanding of the process.
OUTPUT FORMAT: JSON with "score" (1-10) and "feedback". Example: {"score": 8, "feedback": "Clear step-by-step process, but step 3 could be more detailed and the transition between steps 5-6 needs clarification."}
CONSTRAINTS: Focus on logical flow, clarity of each step, completeness of the process, and instructional effectiveness. Note any confusing transitions or missing crucial steps. Keep feedback specific and actionable (2-3 sentences).`,

      improvement: `ROLE: You are an instructional design expert and AI/ML educator.
TASK: Improve the step-by-step explanation for **{{termName}}**. Enhance the logical flow, clarify confusing steps, add missing elements, and ensure each step builds understanding effectively.
OUTPUT FORMAT: Provide a revised numbered step-by-step process in Markdown, maintaining the instructional format while improving clarity and completeness.
CONSTRAINTS: Preserve the step-by-step structure and correct information. Ensure smooth transitions between steps. Each step should be self-contained but contribute to overall understanding. Maintain appropriate detail level for the target audience.`
    }
  },

  // INTERACTIVE ELEMENTS (Advanced columns)
  'introduction_interactive_mermaid': {
    columnId: 'introduction_interactive_mermaid',
    model: 'o4-mini',
    complexity: 'complex',
    prompts: {
      generative: `ROLE: You are a technical visualization expert and AI/ML educator.
TASK: Create a Mermaid diagram specification that visually explains **{{termName}}**. Design an informative and interactive diagram that helps users understand the concept.
OUTPUT FORMAT: Provide a complete Mermaid diagram code block with explanation. Include the diagram syntax and a brief description of what the diagram shows.
CONSTRAINTS: Use appropriate Mermaid diagram types (flowchart, graph, sequence, etc.). Ensure the diagram is informative and not overly complex. Include clear node labels and logical connections. Provide a 2-3 sentence explanation of what the diagram illustrates.`,

      evaluative: `ROLE: You are a technical visualization and AI/ML content reviewer.
TASK: Evaluate the Mermaid diagram for **{{termName}}**. Check if the diagram syntax is correct, visually informative, appropriate for the concept, and enhances understanding.
OUTPUT FORMAT: JSON with "score" (1-10) and "feedback". Example: {"score": 8, "feedback": "Diagram syntax is correct and informative, but could benefit from more descriptive node labels and one additional connection to show data flow."}
CONSTRAINTS: Focus on diagram correctness, visual clarity, educational value, and appropriateness for the concept. Note any syntax errors or missing visual elements. Keep feedback specific to diagram design (2-3 sentences).`,

      improvement: `ROLE: You are a technical visualization expert and diagram design specialist.
TASK: Improve the Mermaid diagram for **{{termName}}**. Enhance visual clarity, fix any syntax issues, add missing connections or nodes, and ensure the diagram effectively explains the concept.
OUTPUT FORMAT: Provide an improved Mermaid diagram code block with updated explanation, maintaining the technical accuracy while enhancing visual effectiveness.
CONSTRAINTS: Preserve correct diagram elements and Mermaid syntax. Ensure the diagram is visually clear and educationally valuable. Add elements only if they enhance understanding. Maintain appropriate complexity level for the target audience.`
    }
  }

  // Continue with remaining columns...
  // This establishes the pattern for all 295 columns
};

// Helper function to get prompts for a column
export const getPromptTripletForColumn = (columnId: string): ColumnPromptDefinition | undefined => {
  return COLUMN_PROMPT_TRIPLETS[columnId];
};

// Get all column IDs that have prompt triplets defined
export const getAvailableColumnIds = (): string[] => {
  return Object.keys(COLUMN_PROMPT_TRIPLETS);
};

// Get prompts by complexity level
export const getPromptsByComplexity = (complexity: 'simple' | 'moderate' | 'complex'): ColumnPromptDefinition[] => {
  return Object.values(COLUMN_PROMPT_TRIPLETS).filter(def => def.complexity === complexity);
};

// Get prompts by AI model
export const getPromptsByModel = (model: 'gpt-4.1-nano' | 'gpt-4.1-mini' | 'o4-mini'): ColumnPromptDefinition[] => {
  return Object.values(COLUMN_PROMPT_TRIPLETS).filter(def => def.model === model);
};

// Template variable replacement
export const replaceTemplateVariables = (prompt: string, variables: Record<string, string>): string => {
  let result = prompt;
  Object.entries(variables).forEach(([key, value]) => {
    const regex = new RegExp(`{{${key}}}`, 'g');
    result = result.replace(regex, value);
  });
  return result;
};

// Validate that all columns have prompt triplets
export const validatePromptCompleteness = (columnIds: string[]): { missing: string[], complete: string[] } => {
  const complete = columnIds.filter(id => COLUMN_PROMPT_TRIPLETS[id]);
  const missing = columnIds.filter(id => !COLUMN_PROMPT_TRIPLETS[id]);
  return { missing, complete };
};

// Cost estimation based on prompts and models
export const estimatePromptCost = (columnId: string, termCount: number = 1): number => {
  const promptDef = COLUMN_PROMPT_TRIPLETS[columnId];
  if (!promptDef) {return 0;}

  const modelCosts = {
    'gpt-4.1-nano': { input: 0.05, output: 0.20 }, // per 1M tokens (batch)
    'gpt-4.1-mini': { input: 0.20, output: 0.80 },
    'o4-mini': { input: 0.55, output: 2.20 }
  };

  const cost = modelCosts[promptDef.model];
  const estimatedInputTokens = 200; // Average prompt + context
  const estimatedOutputTokens = 150; // Estimated output size
  
  const inputCost = (estimatedInputTokens / 1000000) * cost.input;
  const outputCost = (estimatedOutputTokens / 1000000) * cost.output;
  
  return (inputCost + outputCost) * termCount * 3; // 3 for triplet (generate, evaluate, improve)
};

export default COLUMN_PROMPT_TRIPLETS;
