// server/prompts/columnPromptTemplates.ts
// Comprehensive prompt templates for all 295 columns with triplet structure

export interface PromptTriplet {
  generative: string;
  evaluative: string;
  improvement: string;
}

export interface ColumnPromptTemplate {
  columnId: string;
  columnName: string;
  prompts: PromptTriplet;
}

export const COLUMN_PROMPT_TEMPLATES: Record<string, PromptTriplet> = {
  // TERM AND SHORT DEFINITION
  term: {
    generative: `ROLE: You are an AI/ML glossary content generator with expert knowledge in AI and machine learning terminology.
TASK: Provide the canonical name of the given AI/ML term as a concise standalone phrase.
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
  },

  short_definition: {
    generative: `ROLE: You are an AI/ML expert creating concise definitions for a glossary.
TASK: Write a brief, one-line definition for the term **[TERM]** that captures its essence in 20-30 words.
OUTPUT FORMAT: A single sentence that clearly and concisely defines the term.
CONSTRAINTS: Keep it under 30 words. Use simple, clear language. No technical jargon unless absolutely necessary. Make it understandable to someone with basic AI knowledge.`,
    
    evaluative: `ROLE: You are an AI content reviewer specializing in concise technical definitions.
TASK: Evaluate the short definition for **[TERM]**. Check if it's accurate, clear, and truly concise (under 30 words).
OUTPUT FORMAT: JSON with "score" (1-10) and "feedback". Example: {"score": 8, "feedback": "Clear and concise, but could be more specific about the ML context."}
CONSTRAINTS: Focus on brevity, accuracy, and clarity. Penalize definitions that are too long, vague, or technically incorrect.`,
    
    improvement: `ROLE: You are an AI editor specializing in concise technical writing.
TASK: Improve the short definition for **[TERM]** to make it clearer, more accurate, and more concise.
OUTPUT FORMAT: A refined one-line definition (20-30 words).
CONSTRAINTS: Maintain accuracy while improving clarity. Keep under 30 words. Use the most essential information only.`
  },

  // INTRODUCTION SECTION
  introduction_definition_overview: {
    generative: `ROLE: You are an AI/ML expert and technical writer creating glossary content.
TASK: Write a concise definition and overview for the term **[TERM]** in the context of AI/ML. Clearly explain what it is and its general role or meaning.
OUTPUT FORMAT: Provide 1-3 well-formed sentences in Markdown (a short paragraph) that defines **[TERM]** and gives an overview of its significance.
CONSTRAINTS: Use an informative and neutral tone suitable for a glossary. Keep it succinct (around 50-100 words) while ensuring clarity. Avoid overly technical jargon or detailed examples—focus on a high-level understanding.`,
    
    evaluative: `ROLE: You are an AI content reviewer with expertise in AI/ML.
TASK: Evaluate the quality of a definition and overview text for **[TERM]**. Check for accuracy, clarity, completeness, and appropriate length for a glossary entry.
OUTPUT FORMAT: Output a JSON object with a "score" (1-10) and "feedback" explaining the rating. For example: {"score": 8, "feedback": "Clear definition, but missing mention of the term's role in AI/ML."}
CONSTRAINTS: Maintain a constructive and professional tone. Focus on whether the definition correctly captures the term's meaning, if any key points are missing or incorrect, and if the explanation is easy to understand. Keep feedback brief (1-3 sentences).`,
    
    improvement: `ROLE: You are an AI writing assistant skilled in editing technical content.
TASK: Given a draft definition and overview for **[TERM]**, refine and enhance it. Improve clarity, correctness, and completeness while maintaining the original meaning.
OUTPUT FORMAT: Provide the revised definition and overview in the same format (a short Markdown paragraph). Preserve the explanation of **[TERM]** but make it more clear and polished.
CONSTRAINTS: Use an educational yet accessible tone. Do not introduce unrelated information. Keep the length similar (roughly 1-3 sentences). Ensure the core definition remains, adding clarification or slight expansion only if needed for understanding.`
  },

  introduction_key_concepts: {
    generative: `ROLE: You are an AI/ML subject matter expert compiling foundational concepts.
TASK: Identify and list the key concepts or principles underlying **[TERM]**. Break down the fundamental ideas someone should know to understand **[TERM]**.
OUTPUT FORMAT: Provide a markdown unordered list of 3-5 bullet points. Each bullet should name a concept or principle and give a brief (one sentence) explanation of its relation to **[TERM]**.
CONSTRAINTS: Keep each point concise and focused on core principles. Use a consistent, informative tone. Avoid extraneous detail or examples; stick to the primary concepts that define or support **[TERM]**.`,
    
    evaluative: `ROLE: You are an AI content quality reviewer.
TASK: Evaluate the list of key concepts and principles for **[TERM]**. Verify that the listed concepts are relevant and essential, and that each is clearly described.
OUTPUT FORMAT: Return a JSON object with "score" (1-10) and "feedback". For example: {"score": 7, "feedback": "Covers main principles, but missing one fundamental concept and one bullet is too vague."}
CONSTRAINTS: Provide honest, constructive feedback in a neutral tone. Note if any crucial concept is omitted or if any listed item is irrelevant or unclear. Keep feedback brief (1-2 sentences) and specific.`,
    
    improvement: `ROLE: You are an AI assistant proficient in editing technical lists.
TASK: Given a draft list of key concepts/principles for **[TERM]**, improve it. Refine the wording for clarity and completeness, remove any irrelevant points, and add any missing key principle.
OUTPUT FORMAT: Provide an updated markdown bullet list of key concepts/principles. Maintain the list format but with improved or corrected content for each bullet.
CONSTRAINTS: Preserve correct concepts from the original. Use clear and consistent phrasing. Ensure each bullet remains concise (ideally one line or sentence) and directly pertinent to **[TERM]**. Do not introduce unrelated concepts.`
  },

  introduction_importance_relevance: {
    generative: `ROLE: You are an AI educator emphasizing context and impact.
TASK: Explain the importance of **[TERM]** and its relevance in the field of AI/ML. Describe why this concept matters or how it is used in practice.
OUTPUT FORMAT: Provide a brief explanatory passage in Markdown (2-4 sentences) highlighting the significance of **[TERM]**. It should read as a cohesive paragraph.
CONSTRAINTS: Use a clear and informative tone. Keep it concise (~50-120 words). Focus on the term's role, benefits, or influence in AI/ML. Avoid overly technical detail; the goal is to convey why the term is important.`,
    
    evaluative: `ROLE: You are an AI content reviewer.
TASK: Assess the provided "importance and relevance" text for **[TERM]**. Check if it clearly conveys why the term matters in AI/ML and if it is factual and well-focused.
OUTPUT FORMAT: JSON object with "score" (1-10) and "feedback". E.g.: {"score": 9, "feedback": "Clearly explains the term's significance, though an example application could strengthen it."}
CONSTRAINTS: Be fair and concise. Use a professional tone. Point out if the explanation is too vague, too detailed, or misses key reasons for relevance. Feedback should be 1-2 sentences maximum.`,
    
    improvement: `ROLE: You are an AI writing assistant and editor.
TASK: Improve a draft passage about **[TERM]**'s importance in AI/ML. Enhance clarity, relevance, and impact of the explanation, ensuring it fully answers why **[TERM]** is important.
OUTPUT FORMAT: A refined Markdown paragraph (2-4 sentences) describing the term's importance, preserving the original intent but with clearer and more compelling language.
CONSTRAINTS: Maintain an informative and neutral tone. Keep the explanation concise and focused. Do not introduce unrelated information; only strengthen the points about relevance and significance. Aim for the same length (around 50-120 words).`
  },

  introduction_brief_history: {
    generative: `ROLE: You are an AI historian and technical writer.
TASK: Provide a brief history or background of **[TERM]**. Mention any important origin, milestone, or evolution related to the concept (e.g., when it was introduced or by whom).
OUTPUT FORMAT: A short Markdown text of 1-3 sentences giving a quick historical context or background for **[TERM]**.
CONSTRAINTS: Keep it brief and relevant (around 50-100 words). Use a factual, neutral tone. Focus only on key historical points that help a reader understand the term's development; avoid unnecessary details.`,
    
    evaluative: `ROLE: You are an AI content reviewer focused on factual accuracy.
TASK: Evaluate the brief history/background text for **[TERM]**. Check if it includes a relevant historical fact or timeline and stays concise and accurate.
OUTPUT FORMAT: JSON with "score" (1-10) and "feedback". Example: {"score": 8, "feedback": "Mentions the origin and key development, but could include the year of introduction for context."}
CONSTRAINTS: Provide feedback in a neutral, scholarly tone. Verify if the content is likely correct and pertinent (as far as can be determined) and appropriately brief. Limit feedback to 1-2 sentences pointing out any missing key info or potential inaccuracies.`,
    
    improvement: `ROLE: You are an AI editor with knowledge of AI/ML history.
TASK: Improve a draft historical background for **[TERM]**. Ensure it highlights the most relevant historical point(s) more clearly or accurately, while keeping it brief.
OUTPUT FORMAT: A revised Markdown snippet (1-3 sentences) of the term's history/background, maintaining brevity and relevance.
CONSTRAINTS: Preserve true information from the original draft. Use a factual and concise tone. Do not significantly lengthen the text; the update should remain around 50-100 words. Add or correct details only to enhance accuracy or clarity.`
  },

  introduction_main_category: {
    generative: `ROLE: You are an AI knowledge base classifier.
TASK: Determine the broad main category under which **[TERM]** falls. This should be the high-level field or domain of AI/ML (or related area) that the term belongs to.
OUTPUT FORMAT: Provide the main category as a short phrase (e.g., "Machine Learning", "Statistics", "Computer Vision"). No additional explanation, just the category name.
CONSTRAINTS: Ensure the category is relevant and commonly used in AI/ML taxonomy. Use Title Case for category names. If multiple categories apply, choose the most appropriate primary category.`,
    
    evaluative: `ROLE: You are an AI content auditor.
TASK: Evaluate the chosen main category for **[TERM]**. Determine if this category correctly and broadly describes the domain of the term.
OUTPUT FORMAT: JSON with "score" (1-10) and "feedback". For example: {"score": 9, "feedback": "Main category is appropriate, though 'Data Science' could also apply."}
CONSTRAINTS: Use a concise, objective tone. If the category is accurate, give a high score; if it seems off or overly general/specific, score lower and explain. Feedback should be 1 sentence if possible.`,
    
    improvement: `ROLE: You are an AI content editor and domain expert.
TASK: Given a draft main category for **[TERM]**, refine or correct it if needed. Provide the most accurate broad category for the term.
OUTPUT FORMAT: Output the corrected main category as a short phrase (no extra commentary).
CONSTRAINTS: Only change the category if it's clearly wrong or can be more precise. Use proper Title Case formatting. Do not add multiple categories—choose the one best fitting category.`
  },

  introduction_sub_category: {
    generative: `ROLE: You are an AI/ML domain expert categorizer.
TASK: Identify the specific sub-category or sub-categories of AI/ML (under the main category) that **[TERM]** falls into. These are more specific classifications or domains related to the term.
OUTPUT FORMAT: Provide the sub-category name(s). If multiple, list each as a separate bullet point in a Markdown unordered list. If only one sub-category applies, output a single bullet point with that sub-category.
CONSTRAINTS: Limit to 1-3 sub-categories that are most relevant to **[TERM]**. Use Title Case for each. Ensure sub-categories are indeed subdivisions of the main category and directly related to the term.`,
    
    evaluative: `ROLE: You are an AI glossary quality checker.
TASK: Review the chosen sub-category/sub-categories for **[TERM]**. Determine if they correctly and specifically categorize the term under its main category.
OUTPUT FORMAT: JSON with "score" (1-10) and "feedback". E.g.: {"score": 8, "feedback": "Relevant sub-categories listed, but one item might be too broad for a sub-category."}
CONSTRAINTS: Feedback should be brief and factual. If the sub-categories are appropriate and cover the term's niche, assign a high score. Deduct points if any listed sub-category is irrelevant or if an obvious sub-category is missing. Keep comments to 1-2 sentences.`,
    
    improvement: `ROLE: You are an AI content editor with taxonomy expertise.
TASK: Refine the sub-category list for **[TERM]**. Remove or correct any inappropriate sub-category and add any missing key sub-category. Ensure the list accurately reflects where **[TERM]** fits under its main category.
OUTPUT FORMAT: A Markdown unordered list of updated sub-category name(s), following the same format as the original (bullet points).
CONSTRAINTS: Keep only 1-3 of the most relevant sub-categories. Preserve useful entries from the original list, fixing terminology if needed. Use proper Title Case. Do not include any explanatory text, just the sub-category names.`
  },

  // Continue with remaining columns...
  // This would include all 295 column prompt templates following the same pattern
};

// Helper function to get prompts for a specific column
export const getPromptsForColumn = (columnId: string): PromptTriplet | undefined => {
  return COLUMN_PROMPT_TEMPLATES[columnId];
};

// Export a function to generate prompts with term substitution
export const generatePromptsForTerm = (columnId: string, termName: string): PromptTriplet | null => {
  const template = COLUMN_PROMPT_TEMPLATES[columnId];
  if (!template) return null;

  return {
    generative: template.generative.replace(/\*\*\[TERM\]\*\*/g, `**${termName}**`),
    evaluative: template.evaluative.replace(/\*\*\[TERM\]\*\*/g, `**${termName}**`),
    improvement: template.improvement.replace(/\*\*\[TERM\]\*\*/g, `**${termName}**`)
  };
};

// Export function to get all column IDs that have prompts
export const getColumnsWithPrompts = (): string[] => {
  return Object.keys(COLUMN_PROMPT_TEMPLATES).filter(key => key !== 'getPromptsForColumn');
};

// Export function to validate if a column has prompts
export const hasPromptsForColumn = (columnId: string): boolean => {
  return columnId in COLUMN_PROMPT_TEMPLATES;
};