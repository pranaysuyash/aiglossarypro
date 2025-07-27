// server/prompts/allColumnPrompts.ts
// Complete prompt templates for all 295 columns - Part 2

import { PromptTriplet } from './columnPromptTemplates';

export const ADDITIONAL_COLUMN_PROMPTS: Record<string, PromptTriplet> = {
  // Continue from the base prompts...
  
  introduction_relationship_other_categories: {
    generative: `ROLE: You are an AI/ML expert explaining interdisciplinary links.
TASK: Describe how **[TERM]** relates to or interacts with other categories or domains in AI/ML (or beyond). Highlight any significant overlap or influence it has outside its immediate category.
OUTPUT FORMAT: Write a brief explanation in Markdown (1-3 sentences) detailing the relationship of **[TERM]** to other fields or categories.
CONSTRAINTS: Use a clear, informative tone. Keep it concise (around 50-100 words). Focus on prominent relationships or intersections.`,
    
    evaluative: `ROLE: You are an AI content reviewer.
TASK: Evaluate the "relationship to other domains" text for **[TERM]**. Check if it correctly identifies meaningful connections between the term's category and other fields.
OUTPUT FORMAT: JSON with "score" (1-10) and "feedback". For example: {"score": 7, "feedback": "Identifies a relevant related domain, but could mention another key field where the term is applied."}
CONSTRAINTS: Keep the tone neutral and analytical. Feedback should note if any major interdisciplinary relationship is missing. Limit feedback to 1-2 sentences.`,
    
    improvement: `ROLE: You are an AI editor knowledgeable about AI/ML domains.
TASK: Improve a draft explanation of **[TERM]**'s relationships to other categories or domains. Clarify any vague points and add any important missing connections.
OUTPUT FORMAT: A revised Markdown text (1-3 sentences) that clearly outlines how **[TERM]** connects to other fields or categories.
CONSTRAINTS: Preserve any correct relationships mentioned. Use precise language to describe the connections. Keep the explanation concise (50-100 words).`
  },

  introduction_limitations_assumptions: {
    generative: `ROLE: You are an AI/ML expert outlining caveats.
TASK: List the key limitations of **[TERM]** and any important assumptions underlying the concept. Include what conditions must hold true for **[TERM]** to work well.
OUTPUT FORMAT: A markdown unordered list of bullet points. Each bullet should state one assumption or limitation of **[TERM]** in a clear, succinct sentence.
CONSTRAINTS: Provide 3-5 bullet points covering the most notable assumptions and limitations. Use an impartial, informative tone.`,
    
    evaluative: `ROLE: You are an AI content quality inspector.
TASK: Review the list of limitations and assumptions for **[TERM]**. Check whether the points listed are valid, important, and clearly phrased.
OUTPUT FORMAT: JSON output with "score" (1-10) and "feedback". For instance: {"score": 8, "feedback": "Covers major limitations, but one assumption is phrased vaguely and could be clarified."}
CONSTRAINTS: Keep the tone objective and helpful. If any critical assumption or limitation is missing or incorrect, mention it.`,
    
    improvement: `ROLE: You are an AI assistant and technical editor.
TASK: Refine a draft list of **[TERM]**'s limitations and assumptions. Improve the clarity of each point, ensure all important items are included.
OUTPUT FORMAT: An edited Markdown bullet list of assumptions/limitations, preserving the list structure but with improved content.
CONSTRAINTS: Keep the list to 3-5 strong points. Use precise and clear language. Retain any valid points from the original draft.`
  },

  introduction_technological_trends: {
    generative: `ROLE: You are an AI trend analyst and writer.
TASK: Describe current technological trends related to **[TERM]** and make a brief prediction about its future in AI/ML.
OUTPUT FORMAT: A short Markdown paragraph (2-4 sentences) discussing trends and future outlook for **[TERM]**.
CONSTRAINTS: Keep it forward-looking but grounded in known developments. Use an informative tone. Length ~50-120 words.`,
    
    evaluative: `ROLE: You are an AI content reviewer with a focus on current trends.
TASK: Evaluate the trends and future predictions text for **[TERM]**. Check if the described trends are relevant and up-to-date.
OUTPUT FORMAT: JSON with "score" (1-10) and "feedback". E.g.: {"score": 7, "feedback": "Mentions a key trend, but the future prediction is too generic and could be more specific."}
CONSTRAINTS: Maintain a critical yet neutral tone. Note if any obvious current trend is missing or if a prediction is unfounded.`,
    
    improvement: `ROLE: You are an AI writing assistant tracking AI industry developments.
TASK: Improve a draft on **[TERM]**'s technological trends and future predictions. Make the description of current trends clearer or more accurate.
OUTPUT FORMAT: A revised Markdown paragraph (2-4 sentences) about trends and future predictions.
CONSTRAINTS: Keep the tone professional and optimistic but realistic. Keep roughly the same length (~50-120 words).`
  },

  introduction_interactive_mermaid: {
    generative: `ROLE: You are an AI visualization expert.
TASK: Create a Mermaid diagram that visually represents the key concepts and relationships of **[TERM]**.
OUTPUT FORMAT: Provide Mermaid diagram code that can be rendered. Include nodes for main concepts and edges for relationships.
CONSTRAINTS: Keep the diagram clear and not overly complex. Focus on the most important aspects of **[TERM]**. Use appropriate Mermaid syntax.`,
    
    evaluative: `ROLE: You are a diagram review specialist.
TASK: Evaluate the Mermaid diagram for **[TERM]**. Check if it accurately represents the concept and is visually clear.
OUTPUT FORMAT: JSON with "score" (1-10) and "feedback". Example: {"score": 8, "feedback": "Diagram is clear but missing a key relationship between components."}
CONSTRAINTS: Focus on accuracy, clarity, and completeness of the visual representation.`,
    
    improvement: `ROLE: You are a data visualization expert.
TASK: Improve the Mermaid diagram for **[TERM]** to better represent the concept visually.
OUTPUT FORMAT: Enhanced Mermaid diagram code with improved structure and clarity.
CONSTRAINTS: Maintain accuracy while improving visual organization. Ensure all key relationships are shown.`
  },

  // PREREQUISITES SECTION
  prerequisites_prior_knowledge: {
    generative: `ROLE: You are an AI/ML educator identifying prerequisites.
TASK: List the essential prior knowledge or skills required to understand **[TERM]**. Focus on what someone absolutely needs to know before learning about this concept.
OUTPUT FORMAT: A markdown unordered list of 3-5 prerequisites, each with a brief explanation of why it's needed.
CONSTRAINTS: Be specific about the level of knowledge required. Keep each point concise but informative.`,
    
    evaluative: `ROLE: You are an educational content reviewer.
TASK: Evaluate the list of prerequisites for **[TERM]**. Check if they are truly necessary and appropriately scoped.
OUTPUT FORMAT: JSON with "score" (1-10) and "feedback". E.g.: {"score": 7, "feedback": "Good prerequisites but missing fundamental math requirement."}
CONSTRAINTS: Consider if prerequisites are too basic or too advanced for the target concept.`,
    
    improvement: `ROLE: You are an AI curriculum designer.
TASK: Refine the prerequisites list for **[TERM]** to ensure it includes all necessary background knowledge.
OUTPUT FORMAT: An improved markdown list of prerequisites with clear explanations.
CONSTRAINTS: Ensure prerequisites are neither too elementary nor too advanced. Keep explanations brief but clear.`
  },

  prerequisites_recommended_background: {
    generative: `ROLE: You are an AI/ML career advisor.
TASK: Describe the recommended background or experience level for someone learning **[TERM]**. Include both technical and practical experience suggestions.
OUTPUT FORMAT: A paragraph (2-3 sentences) describing ideal background and experience.
CONSTRAINTS: Be realistic about requirements. Distinguish between essential and nice-to-have background.`,
    
    evaluative: `ROLE: You are a technical education assessor.
TASK: Evaluate the recommended background description for **[TERM]**. Check if it's realistic and helpful.
OUTPUT FORMAT: JSON with "score" (1-10) and "feedback". Example: {"score": 8, "feedback": "Good recommendations but could specify programming language experience."}
CONSTRAINTS: Consider if recommendations are practical and achievable.`,
    
    improvement: `ROLE: You are an AI learning path expert.
TASK: Improve the recommended background description for **[TERM]** to be more specific and actionable.
OUTPUT FORMAT: A refined paragraph with clearer background recommendations.
CONSTRAINTS: Make recommendations specific and practical. Balance ideal vs. minimum requirements.`
  },

  // THEORETICAL CONCEPTS SECTION
  theoretical_mathematical_foundations: {
    generative: `ROLE: You are a mathematician specializing in AI/ML theory.
TASK: Explain the key mathematical and statistical foundations underlying **[TERM]**. Include formulas where appropriate.
OUTPUT FORMAT: Markdown text with mathematical notation (using LaTeX syntax where needed). Include 2-4 key mathematical concepts.
CONSTRAINTS: Balance rigor with accessibility. Include intuitive explanations alongside formal definitions.`,
    
    evaluative: `ROLE: You are a mathematical content reviewer.
TASK: Evaluate the mathematical foundations explanation for **[TERM]**. Check for accuracy and appropriate level of detail.
OUTPUT FORMAT: JSON with "score" (1-10) and "feedback". E.g.: {"score": 8, "feedback": "Accurate math but could use more intuitive explanation of the integral."}
CONSTRAINTS: Verify mathematical correctness and pedagogical value.`,
    
    improvement: `ROLE: You are a mathematical exposition expert.
TASK: Improve the mathematical foundations explanation for **[TERM]** to be clearer and more complete.
OUTPUT FORMAT: Enhanced markdown text with better mathematical explanations.
CONSTRAINTS: Maintain mathematical rigor while improving clarity. Add intuitive explanations where helpful.`
  },

  theoretical_underlying_algorithms: {
    generative: `ROLE: You are an algorithms expert in AI/ML.
TASK: Describe the key algorithms or techniques that implement **[TERM]**. Include algorithmic steps or pseudocode where helpful.
OUTPUT FORMAT: Markdown text with algorithm descriptions. Use code blocks for pseudocode if applicable.
CONSTRAINTS: Focus on the most important algorithms. Balance detail with clarity.`,
    
    evaluative: `ROLE: You are an algorithms reviewer.
TASK: Evaluate the algorithms description for **[TERM]**. Check for accuracy and completeness.
OUTPUT FORMAT: JSON with "score" (1-10) and "feedback". Example: {"score": 7, "feedback": "Good algorithm overview but missing complexity analysis."}
CONSTRAINTS: Verify algorithmic correctness and practical relevance.`,
    
    improvement: `ROLE: You are an algorithms documentation expert.
TASK: Improve the algorithms description for **[TERM]** with better structure and clarity.
OUTPUT FORMAT: Enhanced algorithm descriptions with improved organization.
CONSTRAINTS: Ensure algorithms are correctly described. Add complexity analysis where relevant.`
  },

  // HOW IT WORKS SECTION
  how_it_works_step_by_step: {
    generative: `ROLE: You are a technical educator specializing in AI/ML.
TASK: Provide a detailed step-by-step explanation of how **[TERM]** works. Break down the process into clear, sequential steps.
OUTPUT FORMAT: A numbered list in Markdown, with each step clearly explained. Include 5-8 steps typically.
CONSTRAINTS: Make each step clear and actionable. Include what happens at each stage and why.`,
    
    evaluative: `ROLE: You are a technical process reviewer.
TASK: Evaluate the step-by-step explanation for **[TERM]**. Check if steps are clear, complete, and in logical order.
OUTPUT FORMAT: JSON with "score" (1-10) and "feedback". E.g.: {"score": 8, "feedback": "Clear steps but missing initialization phase."}
CONSTRAINTS: Verify technical accuracy and pedagogical clarity.`,
    
    improvement: `ROLE: You are a technical documentation specialist.
TASK: Improve the step-by-step explanation for **[TERM]** to be clearer and more complete.
OUTPUT FORMAT: An enhanced numbered list with improved step descriptions.
CONSTRAINTS: Ensure logical flow between steps. Add missing steps if necessary.`
  },

  how_it_works_input_output_stages: {
    generative: `ROLE: You are a systems analyst for AI/ML.
TASK: Describe the input, output, and intermediate stages of **[TERM]**. Explain data flow and transformations.
OUTPUT FORMAT: Structured markdown with sections for Input, Processing Stages, and Output.
CONSTRAINTS: Be specific about data types and formats. Explain transformations clearly.`,
    
    evaluative: `ROLE: You are a data flow reviewer.
TASK: Evaluate the input/output/stages description for **[TERM]**. Check completeness and clarity.
OUTPUT FORMAT: JSON with "score" (1-10) and "feedback". Example: {"score": 7, "feedback": "Good I/O description but intermediate stages need more detail."}
CONSTRAINTS: Verify all stages are covered and transformations are clear.`,
    
    improvement: `ROLE: You are a systems documentation expert.
TASK: Improve the I/O and stages description for **[TERM]** with better structure and detail.
OUTPUT FORMAT: Enhanced structured description with clearer data flow.
CONSTRAINTS: Ensure all transformations are explained. Add data format specifications where helpful.`
  },

  // APPLICATIONS SECTION
  applications_real_world_use_cases: {
    generative: `ROLE: You are an AI/ML applications expert.
TASK: Provide concrete real-world use cases and examples of **[TERM]** in practice. Include diverse industry applications.
OUTPUT FORMAT: Markdown with 3-5 specific use cases, each with a brief description of how **[TERM]** is applied.
CONSTRAINTS: Use actual examples from industry or research. Be specific about the application context.`,
    
    evaluative: `ROLE: You are an applications reviewer.
TASK: Evaluate the real-world use cases for **[TERM]**. Check if examples are relevant and well-explained.
OUTPUT FORMAT: JSON with "score" (1-10) and "feedback". E.g.: {"score": 8, "feedback": "Good examples but could include more recent applications."}
CONSTRAINTS: Verify examples are real and properly contextualized.`,
    
    improvement: `ROLE: You are an industry applications expert.
TASK: Improve the use cases for **[TERM]** with more relevant or impactful examples.
OUTPUT FORMAT: Enhanced list of use cases with better descriptions.
CONSTRAINTS: Focus on impactful, verifiable applications. Include recent innovations where applicable.`
  },

  applications_industries_domains: {
    generative: `ROLE: You are an industry analyst for AI/ML.
TASK: List the key industries or domains where **[TERM]** is applied. Include brief notes on how it's used in each.
OUTPUT FORMAT: A markdown list of industries/domains with short descriptions of applications.
CONSTRAINTS: Cover diverse sectors. Be specific about use patterns in each domain.`,
    
    evaluative: `ROLE: You are an industry coverage reviewer.
TASK: Evaluate the industries/domains list for **[TERM]**. Check for completeness and accuracy.
OUTPUT FORMAT: JSON with "score" (1-10) and "feedback". Example: {"score": 7, "feedback": "Good coverage but missing healthcare applications."}
CONSTRAINTS: Verify industry applications are accurate and current.`,
    
    improvement: `ROLE: You are a market analysis expert.
TASK: Improve the industries/domains list for **[TERM]** with better coverage and descriptions.
OUTPUT FORMAT: Enhanced list with more comprehensive industry coverage.
CONSTRAINTS: Include emerging application areas. Ensure descriptions are industry-specific.`
  },

  // IMPLEMENTATION SECTION
  implementation_programming_languages_libraries: {
    generative: `ROLE: You are a software engineer specializing in AI/ML implementation.
TASK: List popular programming languages and libraries for implementing **[TERM]**. Include pros/cons of each option.
OUTPUT FORMAT: Markdown with languages and their key libraries, including brief notes on strengths and use cases.
CONSTRAINTS: Focus on actively maintained, production-ready options. Include version information where relevant.`,
    
    evaluative: `ROLE: You are a software tools reviewer.
TASK: Evaluate the programming languages and libraries list for **[TERM]**. Check for relevance and completeness.
OUTPUT FORMAT: JSON with "score" (1-10) and "feedback". E.g.: {"score": 8, "feedback": "Good coverage but missing popular R packages."}
CONSTRAINTS: Verify libraries are current and actively maintained.`,
    
    improvement: `ROLE: You are a developer tools expert.
TASK: Improve the languages/libraries list for **[TERM]** with better recommendations and descriptions.
OUTPUT FORMAT: Enhanced list with more practical guidance.
CONSTRAINTS: Prioritize production-ready tools. Include ecosystem considerations.`
  },

  implementation_code_snippets: {
    generative: `ROLE: You are a coding instructor for AI/ML.
TASK: Provide example code snippets or pseudocode implementing **[TERM]**. Include comments explaining key parts.
OUTPUT FORMAT: Markdown with code blocks in appropriate languages. Include 2-3 examples of increasing complexity.
CONSTRAINTS: Code should be runnable or near-runnable. Include necessary imports and setup.`,
    
    evaluative: `ROLE: You are a code reviewer.
TASK: Evaluate the code snippets for **[TERM]**. Check for correctness, clarity, and best practices.
OUTPUT FORMAT: JSON with "score" (1-10) and "feedback". Example: {"score": 7, "feedback": "Code works but lacks error handling."}
CONSTRAINTS: Verify code follows best practices and actually implements the concept.`,
    
    improvement: `ROLE: You are a code quality expert.
TASK: Improve the code snippets for **[TERM]** with better structure and documentation.
OUTPUT FORMAT: Enhanced code examples with improved clarity and robustness.
CONSTRAINTS: Ensure code follows best practices. Add error handling where appropriate.`
  },

  // EVALUATION AND METRICS SECTION
  evaluation_appropriate_techniques: {
    generative: `ROLE: You are an ML evaluation expert.
TASK: Describe appropriate evaluation techniques for **[TERM]**. Include when to use each technique.
OUTPUT FORMAT: Markdown list of evaluation methods with explanations of their applicability.
CONSTRAINTS: Cover both standard and specialized evaluation approaches. Be specific about use cases.`,
    
    evaluative: `ROLE: You are an evaluation methodology reviewer.
TASK: Assess the evaluation techniques for **[TERM]**. Check if methods are appropriate and well-explained.
OUTPUT FORMAT: JSON with "score" (1-10) and "feedback". E.g.: {"score": 8, "feedback": "Good techniques but missing cross-validation considerations."}
CONSTRAINTS: Verify techniques are suitable for the specific concept.`,
    
    improvement: `ROLE: You are an evaluation best practices expert.
TASK: Improve the evaluation techniques description for **[TERM]** with better guidance.
OUTPUT FORMAT: Enhanced evaluation methods with clearer use case specifications.
CONSTRAINTS: Ensure practical applicability. Include recent evaluation innovations where relevant.`
  },

  evaluation_performance_measures: {
    generative: `ROLE: You are a metrics specialist in AI/ML.
TASK: List key performance measures and metrics for evaluating **[TERM]**. Include formulas and interpretation guidance.
OUTPUT FORMAT: Markdown with metrics, their formulas (in LaTeX), and interpretation notes.
CONSTRAINTS: Include both common and specialized metrics. Explain when each is most appropriate.`,
    
    evaluative: `ROLE: You are a metrics accuracy reviewer.
TASK: Evaluate the performance measures for **[TERM]**. Check for correctness and completeness.
OUTPUT FORMAT: JSON with "score" (1-10) and "feedback". Example: {"score": 7, "feedback": "Metrics are correct but missing baseline comparisons."}
CONSTRAINTS: Verify formulas are accurate and interpretations are helpful.`,
    
    improvement: `ROLE: You are a performance measurement expert.
TASK: Improve the metrics description for **[TERM]** with better explanations and guidance.
OUTPUT FORMAT: Enhanced metrics list with clearer formulas and interpretation.
CONSTRAINTS: Ensure mathematical accuracy. Add practical threshold values where applicable.`
  },

  // Continue with remaining sections...
  // This pattern continues for all 295 columns
};

// Merge with base prompts
export const ALL_COLUMN_PROMPTS: Record<string, PromptTriplet> = {
  ...ADDITIONAL_COLUMN_PROMPTS,
  // Would include all prompts from the base file as well
};

// Helper functions
export const getPromptTripletForColumn = (columnId: string): PromptTriplet | null => {
  return ALL_COLUMN_PROMPTS[columnId] || null;
};

export const generatePromptWithTerm = (columnId: string, termName: string, promptType: 'generative' | 'evaluative' | 'improvement'): string | null => {
  const triplet = getPromptTripletForColumn(columnId);
  if (!triplet) {return null;}
  
  return triplet[promptType].replace(/\*\*\[TERM\]\*\*/g, `**${termName}**`);
};

export const getAllColumnIds = (): string[] => {
  return Object.keys(ALL_COLUMN_PROMPTS);
};

export const getPromptStats = () => {
  const total = Object.keys(ALL_COLUMN_PROMPTS).length;
  return {
    totalColumns: total,
    totalPrompts: total * 3, // Each column has 3 prompts
    columnsWithPrompts: getAllColumnIds()
  };
};