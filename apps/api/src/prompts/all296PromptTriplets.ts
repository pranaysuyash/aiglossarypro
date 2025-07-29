// server/prompts/all296PromptTriplets.ts
// Complete set of prompt triplets for all 296 columns
// 295 columns from original structure.md + 1 short_definition = 296 total

export interface PromptTriplet {
  columnId: string;
  generativePrompt: string;
  evaluativePrompt: string;
  improvementPrompt: string;
}

export const ALL_296_PROMPT_TRIPLETS: PromptTriplet[] = [
  // Column 1: Term
  {
    columnId: 'term',
    generativePrompt: `ROLE: You are an AI glossary assistant.
TASK: Output the precise name of the term **[TERM]** in a clean, standardized format.
OUTPUT FORMAT: Return only the term name as plain text.
CONSTRAINTS:
- If the term is an abbreviation or acronym, present it as given (e.g., "GAN") and, if applicable, include the expanded form in parentheses (e.g., "GAN (Generative Adversarial Network)").
- If the term consists of multiple words or a phrase, capitalize it appropriately (e.g., "Convolutional Neural Network").
- Do NOT add any extra explanation or characters; output only the term itself exactly as it should appear as an entry title.`,
    
    evaluativePrompt: `ROLE: You are an AI content reviewer with expertise in terminology.
TASK: Evaluate the term entry **[TERM]** for formatting and appropriateness.
OUTPUT FORMAT: Return a JSON object with "score" (1-10) and "feedback" string.
CONSTRAINTS:
- Verify that the term is spelled correctly and capitalized properly.
- If the term is an acronym, check that it is either well-known or accompanied by its full form.
- Determine if the term is precise and not ambiguous.
- Provide feedback on any issues or confirm that the term is correctly presented.`,
    
    improvementPrompt: `ROLE: You are an AI writing assistant.
TASK: Improve the term entry **[TERM]** if it has formatting or clarity issues.
OUTPUT FORMAT: Return only the corrected term itself.
CONSTRAINTS:
- If the term is misformatted (wrong capitalization or extra words), rewrite it in the correct, standardized form.
- If the term is ambiguous or too broad, refine it or add clarifying detail in parentheses.
- Do NOT add definitions or extra explanation — only output the corrected term itself.`
  },

  // Column 2: Short Definition
  {
    columnId: 'short_definition',
    generativePrompt: `ROLE: You are an AI/ML expert creating concise definitions.
TASK: Write a brief one-sentence definition for the term **[TERM]**.
OUTPUT FORMAT: Return a single sentence (50-80 words) as plain text.
CONSTRAINTS:
- The definition must be accurate, clear, and accessible to a general technical audience.
- Focus on the core essence of the term without technical jargon.
- Do not include examples or extended explanations.
- End with a period.`,
    
    evaluativePrompt: `ROLE: You are an AI content reviewer specializing in technical definitions.
TASK: Evaluate the short definition for **[TERM]**.
OUTPUT FORMAT: Return a JSON object with "score" (1-10) and "feedback" string.
CONSTRAINTS:
- Check if the definition is accurate and captures the essence of the term.
- Verify it's truly one sentence and within 50-80 words.
- Assess clarity for a general technical audience.
- Note any inaccuracies or areas for improvement.`,
    
    improvementPrompt: `ROLE: You are an AI writing assistant specializing in technical communication.
TASK: Improve the short definition for **[TERM]**.
OUTPUT FORMAT: Return only the improved one-sentence definition.
CONSTRAINTS:
- Maintain accuracy while improving clarity.
- Keep it as a single sentence (50-80 words).
- Remove unnecessary jargon while preserving technical accuracy.
- Ensure it captures the core essence of the term.`
  },

  // Column 3: Definition and Overview
  {
    columnId: 'introduction_definition_overview',
    generativePrompt: `ROLE: You are an AI/ML expert and technical writer creating glossary content.
TASK: Write a concise definition and overview for the term **[TERM]** in the context of AI/ML. Clearly explain what it is and its general role or meaning.
OUTPUT FORMAT: Provide 1-3 well-formed sentences in Markdown (a short paragraph) that defines **[TERM]** and gives an overview of its significance.
CONSTRAINTS: Use an informative and neutral tone suitable for a glossary. Keep it succinct (around 50-100 words) while ensuring clarity. Avoid overly technical jargon or detailed examples—focus on a high-level understanding.`,
    
    evaluativePrompt: `ROLE: You are an AI content reviewer with expertise in AI/ML.
TASK: Evaluate the quality of a definition and overview text for **[TERM]**. Check for accuracy, clarity, completeness, and appropriate length for a glossary entry.
OUTPUT FORMAT: Output a JSON object with a "score" (1-10) and "feedback" explaining the rating. For example: {"score": 8, "feedback": "Clear definition, but missing mention of the term's role in AI/ML."}
CONSTRAINTS: Maintain a constructive and professional tone. Focus on whether the definition correctly captures the term's meaning, if any key points are missing or incorrect, and if the explanation is easy to understand. Keep feedback brief (1-3 sentences).`,
    
    improvementPrompt: `ROLE: You are an AI writing assistant skilled in editing technical content.
TASK: Given a draft definition and overview for **[TERM]**, refine and enhance it. Improve clarity, correctness, and completeness while maintaining the original meaning.
OUTPUT FORMAT: Provide the revised definition and overview in the same format (a short Markdown paragraph). Preserve the explanation of **[TERM]** but make it more clear and polished.
CONSTRAINTS: Use an educational yet accessible tone. Do not introduce unrelated information. Keep the length similar (roughly 1-3 sentences). Ensure the core definition remains, adding clarification or slight expansion only if needed for understanding.`
  },

  // Column 4: Key Concepts and Principles
  {
    columnId: 'introduction_key_concepts',
    generativePrompt: `ROLE: You are an AI/ML subject matter expert compiling foundational concepts.
TASK: Identify and list the key concepts or principles underlying **[TERM]**. Break down the fundamental ideas someone should know to understand **[TERM]**.
OUTPUT FORMAT: Provide a markdown unordered list of 3-5 bullet points. Each bullet should name a concept or principle and give a brief (one sentence) explanation of its relation to **[TERM]**.
CONSTRAINTS: Keep each point concise and focused on core principles. Use a consistent, informative tone. Avoid extraneous detail or examples; stick to the primary concepts that define or support **[TERM]**.`,
    
    evaluativePrompt: `ROLE: You are an AI content quality reviewer.
TASK: Evaluate the list of key concepts and principles for **[TERM]**. Verify that the listed concepts are relevant and essential, and that each is clearly described.
OUTPUT FORMAT: Return a JSON object with "score" (1-10) and "feedback". For example: {"score": 7, "feedback": "Covers main principles, but missing one fundamental concept and one bullet is too vague."}
CONSTRAINTS: Provide honest, constructive feedback in a neutral tone. Note if any crucial concept is omitted or if any listed item is irrelevant or unclear. Keep feedback brief (1-2 sentences) and specific.`,
    
    improvementPrompt: `ROLE: You are an AI content editor specializing in technical education.
TASK: Refine the list of key concepts and principles for **[TERM]**. Ensure all essential concepts are included and clearly explained.
OUTPUT FORMAT: Provide the improved markdown unordered list with 3-5 bullet points.
CONSTRAINTS: Each bullet should clearly name a concept and explain its relevance to **[TERM]** in one sentence. Remove any redundant or tangential concepts. Add missing essential concepts if needed.`
  },

  // Column 5: Importance and Relevance in AI/ML
  {
    columnId: 'introduction_importance_relevance',
    generativePrompt: `ROLE: You are an AI/ML expert explaining the significance of technical concepts.
TASK: Explain why **[TERM]** is important and relevant in the field of AI/ML.
OUTPUT FORMAT: Write 2-3 sentences in Markdown format explaining the importance and current relevance.
CONSTRAINTS: Focus on practical significance, current applications, and why practitioners should understand this concept. Keep it concise (80-120 words) and accessible.`,
    
    evaluativePrompt: `ROLE: You are an AI content reviewer assessing relevance explanations.
TASK: Evaluate the explanation of importance and relevance for **[TERM]**.
OUTPUT FORMAT: Return JSON with "score" (1-10) and "feedback".
CONSTRAINTS: Check if the explanation clearly conveys why the term matters, includes current relevance, and is appropriately concise. Note any missing aspects or overstatements.`,
    
    improvementPrompt: `ROLE: You are an AI writing assistant improving technical explanations.
TASK: Enhance the importance and relevance explanation for **[TERM]**.
OUTPUT FORMAT: Return the improved 2-3 sentence explanation in Markdown.
CONSTRAINTS: Ensure it clearly communicates practical significance, current applications, and value to practitioners. Maintain conciseness while improving clarity.`
  },

  // Column 6: Brief History or Background
  {
    columnId: 'introduction_brief_history',
    generativePrompt: `ROLE: You are an AI/ML expert creating comprehensive glossary content.
TASK: Generate content for **[TERM]** focusing on: Brief History or Background.
CONTEXT: Historical context and background of the term
OUTPUT FORMAT: Write content in Markdown format.
CONSTRAINTS:
- Keep it concise (2-4 sentences or 3-5 bullet points).
- Ensure accuracy and clarity for important level content.
- Focus specifically on the aspect described in the column name.
- Use technical language appropriate for the audience level.`,
    
    evaluativePrompt: `ROLE: You are an AI content reviewer specializing in technical accuracy.
TASK: Evaluate the Brief History or Background content for **[TERM]**.
OUTPUT FORMAT: Return JSON with "score" (1-10) and "feedback" string.
CONSTRAINTS:
- Check accuracy and completeness for Historical context and background of the term.
- Verify appropriate detail level for important content.
- Assess clarity and technical correctness.
- Note any missing key points or inaccuracies.`,
    
    improvementPrompt: `ROLE: You are an AI writing assistant improving technical content.
TASK: Enhance the Brief History or Background content for **[TERM]**.
OUTPUT FORMAT: Return only the improved content in the same format.
CONSTRAINTS:
- Maintain accuracy while improving clarity.
- Ensure completeness for Historical context and background of the term.
- Keep within appropriate scope and detail level.
- Address any feedback from evaluation.`
  },

  // Column 7: Main Category
  {
    columnId: 'introduction_main_category',
    generativePrompt: `ROLE: You are an AI/ML expert creating comprehensive glossary content.
TASK: Generate content for **[TERM]** focusing on: Main Category.
CONTEXT: Primary category classification of the term
OUTPUT FORMAT: Write content in Markdown format.
CONSTRAINTS:
- Keep it very concise (1-2 sentences).
- Ensure accuracy and clarity for important level content.
- Focus specifically on the aspect described in the column name.
- Use technical language appropriate for the audience level.`,
    
    evaluativePrompt: `ROLE: You are an AI content reviewer specializing in technical accuracy.
TASK: Evaluate the Main Category content for **[TERM]**.
OUTPUT FORMAT: Return JSON with "score" (1-10) and "feedback" string.
CONSTRAINTS:
- Check accuracy and completeness for Primary category classification of the term.
- Verify appropriate detail level for important content.
- Assess clarity and technical correctness.
- Note any missing key points or inaccuracies.`,
    
    improvementPrompt: `ROLE: You are an AI writing assistant improving technical content.
TASK: Enhance the Main Category content for **[TERM]**.
OUTPUT FORMAT: Return only the improved content in the same format.
CONSTRAINTS:
- Maintain accuracy while improving clarity.
- Ensure completeness for Primary category classification of the term.
- Keep within appropriate scope and detail level.
- Address any feedback from evaluation.`
  },

  // Column 8: Sub-category
  {
    columnId: 'introduction_sub_category',
    generativePrompt: `ROLE: You are an AI/ML expert creating comprehensive glossary content.
TASK: Generate content for **[TERM]** focusing on: Sub-category.
CONTEXT: Specific sub-category classification
OUTPUT FORMAT: Write content in Markdown format.
CONSTRAINTS:
- Keep it very concise (1-2 sentences).
- Ensure accuracy and clarity for important level content.
- Focus specifically on the aspect described in the column name.
- Use technical language appropriate for the audience level.`,
    
    evaluativePrompt: `ROLE: You are an AI content reviewer specializing in technical accuracy.
TASK: Evaluate the Sub-category content for **[TERM]**.
OUTPUT FORMAT: Return JSON with "score" (1-10) and "feedback" string.
CONSTRAINTS:
- Check accuracy and completeness for Specific sub-category classification.
- Verify appropriate detail level for important content.
- Assess clarity and technical correctness.
- Note any missing key points or inaccuracies.`,
    
    improvementPrompt: `ROLE: You are an AI writing assistant improving technical content.
TASK: Enhance the Sub-category content for **[TERM]**.
OUTPUT FORMAT: Return only the improved content in the same format.
CONSTRAINTS:
- Maintain accuracy while improving clarity.
- Ensure completeness for Specific sub-category classification.
- Keep within appropriate scope and detail level.
- Address any feedback from evaluation.`
  },

  // Column 9: Relationship to Other Categories or Domains
  {
    columnId: 'introduction_relationship_other_categories',
    generativePrompt: `ROLE: You are an AI/ML expert creating comprehensive glossary content.
TASK: Generate content for **[TERM]** focusing on: Relationship to Other Categories or Domains.
CONTEXT: How this term relates to other domains and categories
OUTPUT FORMAT: Write content in Markdown format.
CONSTRAINTS:
- Keep it concise (2-4 sentences or 3-5 bullet points).
- Ensure accuracy and clarity for supplementary level content.
- Focus specifically on the aspect described in the column name.
- Use technical language appropriate for the audience level.`,
    
    evaluativePrompt: `ROLE: You are an AI content reviewer specializing in technical accuracy.
TASK: Evaluate the Relationship to Other Categories or Domains content for **[TERM]**.
OUTPUT FORMAT: Return JSON with "score" (1-10) and "feedback" string.
CONSTRAINTS:
- Check accuracy and completeness for How this term relates to other domains and categories.
- Verify appropriate detail level for supplementary content.
- Assess clarity and technical correctness.
- Note any missing key points or inaccuracies.`,
    
    improvementPrompt: `ROLE: You are an AI writing assistant improving technical content.
TASK: Enhance the Relationship to Other Categories or Domains content for **[TERM]**.
OUTPUT FORMAT: Return only the improved content in the same format.
CONSTRAINTS:
- Maintain accuracy while improving clarity.
- Ensure completeness for How this term relates to other domains and categories.
- Keep within appropriate scope and detail level.
- Address any feedback from evaluation.`
  },

  // Column 10: Limitations and Assumptions of the Concept
  {
    columnId: 'introduction_limitations_assumptions',
    generativePrompt: `ROLE: You are an AI/ML expert creating comprehensive glossary content.
TASK: Generate content for **[TERM]** focusing on: Limitations and Assumptions of the Concept.
CONTEXT: Key limitations and underlying assumptions
OUTPUT FORMAT: Write content in Markdown format.
CONSTRAINTS:
- Keep it concise (2-4 sentences or 3-5 bullet points).
- Ensure accuracy and clarity for important level content.
- Focus specifically on the aspect described in the column name.
- Use technical language appropriate for the audience level.`,
    
    evaluativePrompt: `ROLE: You are an AI content reviewer specializing in technical accuracy.
TASK: Evaluate the Limitations and Assumptions of the Concept content for **[TERM]**.
OUTPUT FORMAT: Return JSON with "score" (1-10) and "feedback" string.
CONSTRAINTS:
- Check accuracy and completeness for Key limitations and underlying assumptions.
- Verify appropriate detail level for important content.
- Assess clarity and technical correctness.
- Note any missing key points or inaccuracies.`,
    
    improvementPrompt: `ROLE: You are an AI writing assistant improving technical content.
TASK: Enhance the Limitations and Assumptions of the Concept content for **[TERM]**.
OUTPUT FORMAT: Return only the improved content in the same format.
CONSTRAINTS:
- Maintain accuracy while improving clarity.
- Ensure completeness for Key limitations and underlying assumptions.
- Keep within appropriate scope and detail level.
- Address any feedback from evaluation.`
  },

  // Column 11: Technological Trends and Future Predictions
  {
    columnId: 'introduction_technological_trends',
    generativePrompt: `ROLE: You are an AI/ML expert creating comprehensive glossary content.
TASK: Generate content for **[TERM]** focusing on: Technological Trends and Future Predictions.
CONTEXT: Current trends and future outlook for this concept
OUTPUT FORMAT: Write content in Markdown format.
CONSTRAINTS:
- Provide moderate detail (1-2 paragraphs or 5-7 bullet points).
- Ensure accuracy and clarity for supplementary level content.
- Focus specifically on the aspect described in the column name.
- Use technical language appropriate for the audience level.`,
    
    evaluativePrompt: `ROLE: You are an AI content reviewer specializing in technical accuracy.
TASK: Evaluate the Technological Trends and Future Predictions content for **[TERM]**.
OUTPUT FORMAT: Return JSON with "score" (1-10) and "feedback" string.
CONSTRAINTS:
- Check accuracy and completeness for Current trends and future outlook for this concept.
- Verify appropriate detail level for supplementary content.
- Assess clarity and technical correctness.
- Note any missing key points or inaccuracies.`,
    
    improvementPrompt: `ROLE: You are an AI writing assistant improving technical content.
TASK: Enhance the Technological Trends and Future Predictions content for **[TERM]**.
OUTPUT FORMAT: Return only the improved content in the same format.
CONSTRAINTS:
- Maintain accuracy while improving clarity.
- Ensure completeness for Current trends and future outlook for this concept.
- Keep within appropriate scope and detail level.
- Address any feedback from evaluation.`
  },

  // Column 12: Interactive Element: Mermaid Diagram
  {
    columnId: 'introduction_interactive_mermaid',
    generativePrompt: `ROLE: You are an AI/ML expert creating comprehensive glossary content.
TASK: Generate content for **[TERM]** focusing on: Interactive Element: Mermaid Diagram.
CONTEXT: Interactive Mermaid diagram for visual explanation
OUTPUT FORMAT: Provide interactive content specification in markdown format.
CONSTRAINTS:
- Provide moderate detail (1-2 paragraphs or 5-7 bullet points).
- Ensure accuracy and clarity for advanced level content.
- Focus specifically on the aspect described in the column name.
- Use technical language appropriate for the audience level.`,
    
    evaluativePrompt: `ROLE: You are an AI content reviewer specializing in technical accuracy.
TASK: Evaluate the Interactive Element: Mermaid Diagram content for **[TERM]**.
OUTPUT FORMAT: Return JSON with "score" (1-10) and "feedback" string.
CONSTRAINTS:
- Check accuracy and completeness for Interactive Mermaid diagram for visual explanation.
- Verify appropriate detail level for advanced content.
- Assess clarity and technical correctness.
- Note any missing key points or inaccuracies.`,
    
    improvementPrompt: `ROLE: You are an AI writing assistant improving technical content.
TASK: Enhance the Interactive Element: Mermaid Diagram content for **[TERM]**.
OUTPUT FORMAT: Return only the improved content in the same format.
CONSTRAINTS:
- Maintain accuracy while improving clarity.
- Ensure completeness for Interactive Mermaid diagram for visual explanation.
- Keep within appropriate scope and detail level.
- Address any feedback from evaluation.`
  },

  // Column 13: Prior Knowledge or Skills Required
  {
    columnId: 'prerequisites_prior_knowledge',
    generativePrompt: `ROLE: You are an AI/ML expert creating comprehensive glossary content.
TASK: Generate content for **[TERM]** focusing on: Prior Knowledge or Skills Required.
CONTEXT: Essential background knowledge needed to understand this concept
OUTPUT FORMAT: Write content in Markdown format.
CONSTRAINTS:
- Keep it concise (2-4 sentences or 3-5 bullet points).
- Ensure accuracy and clarity for essential level content.
- Focus specifically on the aspect described in the column name.
- Use technical language appropriate for the audience level.`,
    
    evaluativePrompt: `ROLE: You are an AI content reviewer specializing in technical accuracy.
TASK: Evaluate the Prior Knowledge or Skills Required content for **[TERM]**.
OUTPUT FORMAT: Return JSON with "score" (1-10) and "feedback" string.
CONSTRAINTS:
- Check accuracy and completeness for Essential background knowledge needed to understand this concept.
- Verify appropriate detail level for essential content.
- Assess clarity and technical correctness.
- Note any missing key points or inaccuracies.`,
    
    improvementPrompt: `ROLE: You are an AI writing assistant improving technical content.
TASK: Enhance the Prior Knowledge or Skills Required content for **[TERM]**.
OUTPUT FORMAT: Return only the improved content in the same format.
CONSTRAINTS:
- Maintain accuracy while improving clarity.
- Ensure completeness for Essential background knowledge needed to understand this concept.
- Keep within appropriate scope and detail level.
- Address any feedback from evaluation.`
  },

  // Column 14: Recommended Background or Experience
  {
    columnId: 'prerequisites_recommended_background',
    generativePrompt: `ROLE: You are an AI/ML expert creating comprehensive glossary content.
TASK: Generate content for **[TERM]** focusing on: Recommended Background or Experience.
CONTEXT: Suggested background and experience level
OUTPUT FORMAT: Write content in Markdown format.
CONSTRAINTS:
- Keep it concise (2-4 sentences or 3-5 bullet points).
- Ensure accuracy and clarity for important level content.
- Focus specifically on the aspect described in the column name.
- Use technical language appropriate for the audience level.`,
    
    evaluativePrompt: `ROLE: You are an AI content reviewer specializing in technical accuracy.
TASK: Evaluate the Recommended Background or Experience content for **[TERM]**.
OUTPUT FORMAT: Return JSON with "score" (1-10) and "feedback" string.
CONSTRAINTS:
- Check accuracy and completeness for Suggested background and experience level.
- Verify appropriate detail level for important content.
- Assess clarity and technical correctness.
- Note any missing key points or inaccuracies.`,
    
    improvementPrompt: `ROLE: You are an AI writing assistant improving technical content.
TASK: Enhance the Recommended Background or Experience content for **[TERM]**.
OUTPUT FORMAT: Return only the improved content in the same format.
CONSTRAINTS:
- Maintain accuracy while improving clarity.
- Ensure completeness for Suggested background and experience level.
- Keep within appropriate scope and detail level.
- Address any feedback from evaluation.`
  },

  // Column 15: Suggested Introductory Topics or Courses
  {
    columnId: 'prerequisites_introductory_topics',
    generativePrompt: `ROLE: You are an AI/ML expert creating comprehensive glossary content.
TASK: Generate content for **[TERM]** focusing on: Suggested Introductory Topics or Courses.
CONTEXT: List of suggested preparatory topics and courses
OUTPUT FORMAT: Provide a markdown unordered list.
CONSTRAINTS:
- Keep it concise (2-4 sentences or 3-5 bullet points).
- Ensure accuracy and clarity for supplementary level content.
- Focus specifically on the aspect described in the column name.
- Use technical language appropriate for the audience level.`,
    
    evaluativePrompt: `ROLE: You are an AI content reviewer specializing in technical accuracy.
TASK: Evaluate the Suggested Introductory Topics or Courses content for **[TERM]**.
OUTPUT FORMAT: Return JSON with "score" (1-10) and "feedback" string.
CONSTRAINTS:
- Check accuracy and completeness for List of suggested preparatory topics and courses.
- Verify appropriate detail level for supplementary content.
- Assess clarity and technical correctness.
- Note any missing key points or inaccuracies.`,
    
    improvementPrompt: `ROLE: You are an AI writing assistant improving technical content.
TASK: Enhance the Suggested Introductory Topics or Courses content for **[TERM]**.
OUTPUT FORMAT: Return only the improved content in the same format.
CONSTRAINTS:
- Maintain accuracy while improving clarity.
- Ensure completeness for List of suggested preparatory topics and courses.
- Keep within appropriate scope and detail level.
- Address any feedback from evaluation.`
  },

  // Column 16: Recommended Learning Resources
  {
    columnId: 'prerequisites_learning_resources',
    generativePrompt: `ROLE: You are an AI/ML expert creating comprehensive glossary content.
TASK: Generate content for **[TERM]** focusing on: Recommended Learning Resources.
CONTEXT: Curated list of learning resources and materials
OUTPUT FORMAT: Provide a markdown unordered list.
CONSTRAINTS:
- Keep it concise (2-4 sentences or 3-5 bullet points).
- Ensure accuracy and clarity for supplementary level content.
- Focus specifically on the aspect described in the column name.
- Use technical language appropriate for the audience level.`,
    
    evaluativePrompt: `ROLE: You are an AI content reviewer specializing in technical accuracy.
TASK: Evaluate the Recommended Learning Resources content for **[TERM]**.
OUTPUT FORMAT: Return JSON with "score" (1-10) and "feedback" string.
CONSTRAINTS:
- Check accuracy and completeness for Curated list of learning resources and materials.
- Verify appropriate detail level for supplementary content.
- Assess clarity and technical correctness.
- Note any missing key points or inaccuracies.`,
    
    improvementPrompt: `ROLE: You are an AI writing assistant improving technical content.
TASK: Enhance the Recommended Learning Resources content for **[TERM]**.
OUTPUT FORMAT: Return only the improved content in the same format.
CONSTRAINTS:
- Maintain accuracy while improving clarity.
- Ensure completeness for Curated list of learning resources and materials.
- Keep within appropriate scope and detail level.
- Address any feedback from evaluation.`
  },

  // Column 17: Connections to Other Prerequisite Topics or Skills
  {
    columnId: 'prerequisites_connections_other_topics',
    generativePrompt: `ROLE: You are an AI/ML expert creating comprehensive glossary content.
TASK: Generate content for **[TERM]** focusing on: Connections to Other Prerequisite Topics or Skills.
CONTEXT: How prerequisite topics interconnect
OUTPUT FORMAT: Write content in Markdown format.
CONSTRAINTS:
- Keep it concise (2-4 sentences or 3-5 bullet points).
- Ensure accuracy and clarity for supplementary level content.
- Focus specifically on the aspect described in the column name.
- Use technical language appropriate for the audience level.`,
    
    evaluativePrompt: `ROLE: You are an AI content reviewer specializing in technical accuracy.
TASK: Evaluate the Connections to Other Prerequisite Topics or Skills content for **[TERM]**.
OUTPUT FORMAT: Return JSON with "score" (1-10) and "feedback" string.
CONSTRAINTS:
- Check accuracy and completeness for How prerequisite topics interconnect.
- Verify appropriate detail level for supplementary content.
- Assess clarity and technical correctness.
- Note any missing key points or inaccuracies.`,
    
    improvementPrompt: `ROLE: You are an AI writing assistant improving technical content.
TASK: Enhance the Connections to Other Prerequisite Topics or Skills content for **[TERM]**.
OUTPUT FORMAT: Return only the improved content in the same format.
CONSTRAINTS:
- Maintain accuracy while improving clarity.
- Ensure completeness for How prerequisite topics interconnect.
- Keep within appropriate scope and detail level.
- Address any feedback from evaluation.`
  },

  // Column 18: Interactive Element: Links to Introductory Tutorials or Courses
  {
    columnId: 'prerequisites_interactive_tutorials',
    generativePrompt: `ROLE: You are an AI/ML expert creating comprehensive glossary content.
TASK: Generate content for **[TERM]** focusing on: Interactive Element: Links to Introductory Tutorials or Courses.
CONTEXT: Interactive links and embedded tutorial content
OUTPUT FORMAT: Provide interactive content specification in markdown format.
CONSTRAINTS:
- Keep it concise (2-4 sentences or 3-5 bullet points).
- Ensure accuracy and clarity for advanced level content.
- Focus specifically on the aspect described in the column name.
- Use technical language appropriate for the audience level.`,
    
    evaluativePrompt: `ROLE: You are an AI content reviewer specializing in technical accuracy.
TASK: Evaluate the Interactive Element: Links to Introductory Tutorials or Courses content for **[TERM]**.
OUTPUT FORMAT: Return JSON with "score" (1-10) and "feedback" string.
CONSTRAINTS:
- Check accuracy and completeness for Interactive links and embedded tutorial content.
- Verify appropriate detail level for advanced content.
- Assess clarity and technical correctness.
- Note any missing key points or inaccuracies.`,
    
    improvementPrompt: `ROLE: You are an AI writing assistant improving technical content.
TASK: Enhance the Interactive Element: Links to Introductory Tutorials or Courses content for **[TERM]**.
OUTPUT FORMAT: Return only the improved content in the same format.
CONSTRAINTS:
- Maintain accuracy while improving clarity.
- Ensure completeness for Interactive links and embedded tutorial content.
- Keep within appropriate scope and detail level.
- Address any feedback from evaluation.`
  },

  // Column 19: Key Mathematical and Statistical Foundations
  {
    columnId: 'theoretical_mathematical_foundations',
    generativePrompt: `ROLE: You are an AI/ML expert creating comprehensive glossary content.
TASK: Generate content for **[TERM]** focusing on: Key Mathematical and Statistical Foundations.
CONTEXT: Core mathematical and statistical concepts underlying the term
OUTPUT FORMAT: Write content in Markdown format.
CONSTRAINTS:
- Provide moderate detail (1-2 paragraphs or 5-7 bullet points).
- Ensure accuracy and clarity for important level content.
- Focus specifically on the aspect described in the column name.
- Use technical language appropriate for the audience level.`,
    
    evaluativePrompt: `ROLE: You are an AI content reviewer specializing in technical accuracy.
TASK: Evaluate the Key Mathematical and Statistical Foundations content for **[TERM]**.
OUTPUT FORMAT: Return JSON with "score" (1-10) and "feedback" string.
CONSTRAINTS:
- Check accuracy and completeness for Core mathematical and statistical concepts underlying the term.
- Verify appropriate detail level for important content.
- Assess clarity and technical correctness.
- Note any missing key points or inaccuracies.`,
    
    improvementPrompt: `ROLE: You are an AI writing assistant improving technical content.
TASK: Enhance the Key Mathematical and Statistical Foundations content for **[TERM]**.
OUTPUT FORMAT: Return only the improved content in the same format.
CONSTRAINTS:
- Maintain accuracy while improving clarity.
- Ensure completeness for Core mathematical and statistical concepts underlying the term.
- Keep within appropriate scope and detail level.
- Address any feedback from evaluation.`
  },

  // Column 20: Underlying Algorithms or Techniques
  {
    columnId: 'theoretical_underlying_algorithms',
    generativePrompt: `ROLE: You are an AI/ML expert creating comprehensive glossary content.
TASK: Generate content for **[TERM]** focusing on: Underlying Algorithms or Techniques.
CONTEXT: Key algorithms and techniques that implement the concept
OUTPUT FORMAT: Write content in Markdown format.
CONSTRAINTS:
- Provide moderate detail (1-2 paragraphs or 5-7 bullet points).
- Ensure accuracy and clarity for important level content.
- Focus specifically on the aspect described in the column name.
- Use technical language appropriate for the audience level.`,
    
    evaluativePrompt: `ROLE: You are an AI content reviewer specializing in technical accuracy.
TASK: Evaluate the Underlying Algorithms or Techniques content for **[TERM]**.
OUTPUT FORMAT: Return JSON with "score" (1-10) and "feedback" string.
CONSTRAINTS:
- Check accuracy and completeness for Key algorithms and techniques that implement the concept.
- Verify appropriate detail level for important content.
- Assess clarity and technical correctness.
- Note any missing key points or inaccuracies.`,
    
    improvementPrompt: `ROLE: You are an AI writing assistant improving technical content.
TASK: Enhance the Underlying Algorithms or Techniques content for **[TERM]**.
OUTPUT FORMAT: Return only the improved content in the same format.
CONSTRAINTS:
- Maintain accuracy while improving clarity.
- Ensure completeness for Key algorithms and techniques that implement the concept.
- Keep within appropriate scope and detail level.
- Address any feedback from evaluation.`
  },

  // Column 21: Assumptions and Limitations
  {
    columnId: 'theoretical_assumptions_limitations',
    generativePrompt: `ROLE: You are an AI/ML expert creating comprehensive glossary content.
TASK: Generate content for **[TERM]** focusing on: Assumptions and Limitations.
CONTEXT: Theoretical assumptions and their limitations
OUTPUT FORMAT: Write content in Markdown format.
CONSTRAINTS:
- Keep it concise (2-4 sentences or 3-5 bullet points).
- Ensure accuracy and clarity for important level content.
- Focus specifically on the aspect described in the column name.
- Use technical language appropriate for the audience level.`,
    
    evaluativePrompt: `ROLE: You are an AI content reviewer specializing in technical accuracy.
TASK: Evaluate the Assumptions and Limitations content for **[TERM]**.
OUTPUT FORMAT: Return JSON with "score" (1-10) and "feedback" string.
CONSTRAINTS:
- Check accuracy and completeness for Theoretical assumptions and their limitations.
- Verify appropriate detail level for important content.
- Assess clarity and technical correctness.
- Note any missing key points or inaccuracies.`,
    
    improvementPrompt: `ROLE: You are an AI writing assistant improving technical content.
TASK: Enhance the Assumptions and Limitations content for **[TERM]**.
OUTPUT FORMAT: Return only the improved content in the same format.
CONSTRAINTS:
- Maintain accuracy while improving clarity.
- Ensure completeness for Theoretical assumptions and their limitations.
- Keep within appropriate scope and detail level.
- Address any feedback from evaluation.`
  },

  // Column 22: Mathematical Derivations or Proofs
  {
    columnId: 'theoretical_mathematical_derivations',
    generativePrompt: `ROLE: You are an AI/ML expert creating comprehensive glossary content.
TASK: Generate content for **[TERM]** focusing on: Mathematical Derivations or Proofs.
CONTEXT: Mathematical derivations and formal proofs
OUTPUT FORMAT: Write content in Markdown format.
CONSTRAINTS:
- Provide comprehensive detail with multiple sections.
- Ensure accuracy and clarity for advanced level content.
- Focus specifically on the aspect described in the column name.
- Use technical language appropriate for the audience level.`,
    
    evaluativePrompt: `ROLE: You are an AI content reviewer specializing in technical accuracy.
TASK: Evaluate the Mathematical Derivations or Proofs content for **[TERM]**.
OUTPUT FORMAT: Return JSON with "score" (1-10) and "feedback" string.
CONSTRAINTS:
- Check accuracy and completeness for Mathematical derivations and formal proofs.
- Verify appropriate detail level for advanced content.
- Assess clarity and technical correctness.
- Note any missing key points or inaccuracies.`,
    
    improvementPrompt: `ROLE: You are an AI writing assistant improving technical content.
TASK: Enhance the Mathematical Derivations or Proofs content for **[TERM]**.
OUTPUT FORMAT: Return only the improved content in the same format.
CONSTRAINTS:
- Maintain accuracy while improving clarity.
- Ensure completeness for Mathematical derivations and formal proofs.
- Keep within appropriate scope and detail level.
- Address any feedback from evaluation.`
  },

  // Column 23: Interpretability and Explainability of the Underlying Concepts
  {
    columnId: 'theoretical_interpretability_explainability',
    generativePrompt: `ROLE: You are an AI/ML expert creating comprehensive glossary content.
TASK: Generate content for **[TERM]** focusing on: Interpretability and Explainability of the Underlying Concepts.
CONTEXT: How to interpret and explain the theoretical concepts
OUTPUT FORMAT: Write content in Markdown format.
CONSTRAINTS:
- Provide moderate detail (1-2 paragraphs or 5-7 bullet points).
- Ensure accuracy and clarity for supplementary level content.
- Focus specifically on the aspect described in the column name.
- Use technical language appropriate for the audience level.`,
    
    evaluativePrompt: `ROLE: You are an AI content reviewer specializing in technical accuracy.
TASK: Evaluate the Interpretability and Explainability of the Underlying Concepts content for **[TERM]**.
OUTPUT FORMAT: Return JSON with "score" (1-10) and "feedback" string.
CONSTRAINTS:
- Check accuracy and completeness for How to interpret and explain the theoretical concepts.
- Verify appropriate detail level for supplementary content.
- Assess clarity and technical correctness.
- Note any missing key points or inaccuracies.`,
    
    improvementPrompt: `ROLE: You are an AI writing assistant improving technical content.
TASK: Enhance the Interpretability and Explainability of the Underlying Concepts content for **[TERM]**.
OUTPUT FORMAT: Return only the improved content in the same format.
CONSTRAINTS:
- Maintain accuracy while improving clarity.
- Ensure completeness for How to interpret and explain the theoretical concepts.
- Keep within appropriate scope and detail level.
- Address any feedback from evaluation.`
  },

  // Column 24: Theoretical Critiques and Counterarguments
  {
    columnId: 'theoretical_critiques_counterarguments',
    generativePrompt: `ROLE: You are an AI/ML expert creating comprehensive glossary content.
TASK: Generate content for **[TERM]** focusing on: Theoretical Critiques and Counterarguments.
CONTEXT: Academic critiques and alternative theoretical perspectives
OUTPUT FORMAT: Write content in Markdown format.
CONSTRAINTS:
- Provide moderate detail (1-2 paragraphs or 5-7 bullet points).
- Ensure accuracy and clarity for advanced level content.
- Focus specifically on the aspect described in the column name.
- Use technical language appropriate for the audience level.`,
    
    evaluativePrompt: `ROLE: You are an AI content reviewer specializing in technical accuracy.
TASK: Evaluate the Theoretical Critiques and Counterarguments content for **[TERM]**.
OUTPUT FORMAT: Return JSON with "score" (1-10) and "feedback" string.
CONSTRAINTS:
- Check accuracy and completeness for Academic critiques and alternative theoretical perspectives.
- Verify appropriate detail level for advanced content.
- Assess clarity and technical correctness.
- Note any missing key points or inaccuracies.`,
    
    improvementPrompt: `ROLE: You are an AI writing assistant improving technical content.
TASK: Enhance the Theoretical Critiques and Counterarguments content for **[TERM]**.
OUTPUT FORMAT: Return only the improved content in the same format.
CONSTRAINTS:
- Maintain accuracy while improving clarity.
- Ensure completeness for Academic critiques and alternative theoretical perspectives.
- Keep within appropriate scope and detail level.
- Address any feedback from evaluation.`
  },

  // Column 25: Interactive Element: Mathematical Visualizations or Interactive Proofs
  {
    columnId: 'theoretical_interactive_visualizations',
    generativePrompt: `ROLE: You are an AI/ML expert creating comprehensive glossary content.
TASK: Generate content for **[TERM]** focusing on: Interactive Element: Mathematical Visualizations or Interactive Proofs.
CONTEXT: Interactive mathematical visualizations and proof explorers
OUTPUT FORMAT: Provide interactive content specification in markdown format.
CONSTRAINTS:
- Provide moderate detail (1-2 paragraphs or 5-7 bullet points).
- Ensure accuracy and clarity for advanced level content.
- Focus specifically on the aspect described in the column name.
- Use technical language appropriate for the audience level.`,
    
    evaluativePrompt: `ROLE: You are an AI content reviewer specializing in technical accuracy.
TASK: Evaluate the Interactive Element: Mathematical Visualizations or Interactive Proofs content for **[TERM]**.
OUTPUT FORMAT: Return JSON with "score" (1-10) and "feedback" string.
CONSTRAINTS:
- Check accuracy and completeness for Interactive mathematical visualizations and proof explorers.
- Verify appropriate detail level for advanced content.
- Assess clarity and technical correctness.
- Note any missing key points or inaccuracies.`,
    
    improvementPrompt: `ROLE: You are an AI writing assistant improving technical content.
TASK: Enhance the Interactive Element: Mathematical Visualizations or Interactive Proofs content for **[TERM]**.
OUTPUT FORMAT: Return only the improved content in the same format.
CONSTRAINTS:
- Maintain accuracy while improving clarity.
- Ensure completeness for Interactive mathematical visualizations and proof explorers.
- Keep within appropriate scope and detail level.
- Address any feedback from evaluation.`
  },

  // Column 26: Step-by-Step Explanation of the Process
  {
    columnId: 'how_it_works_step_by_step',
    generativePrompt: `ROLE: You are an AI/ML expert creating comprehensive glossary content.
TASK: Generate content for **[TERM]** focusing on: Step-by-Step Explanation of the Process.
CONTEXT: Detailed step-by-step explanation of how the concept works
OUTPUT FORMAT: Write content in Markdown format.
CONSTRAINTS:
- Provide moderate detail (1-2 paragraphs or 5-7 bullet points).
- Ensure accuracy and clarity for essential level content.
- Focus specifically on the aspect described in the column name.
- Use technical language appropriate for the audience level.`,
    
    evaluativePrompt: `ROLE: You are an AI content reviewer specializing in technical accuracy.
TASK: Evaluate the Step-by-Step Explanation of the Process content for **[TERM]**.
OUTPUT FORMAT: Return JSON with "score" (1-10) and "feedback" string.
CONSTRAINTS:
- Check accuracy and completeness for Detailed step-by-step explanation of how the concept works.
- Verify appropriate detail level for essential content.
- Assess clarity and technical correctness.
- Note any missing key points or inaccuracies.`,
    
    improvementPrompt: `ROLE: You are an AI writing assistant improving technical content.
TASK: Enhance the Step-by-Step Explanation of the Process content for **[TERM]**.
OUTPUT FORMAT: Return only the improved content in the same format.
CONSTRAINTS:
- Maintain accuracy while improving clarity.
- Ensure completeness for Detailed step-by-step explanation of how the concept works.
- Keep within appropriate scope and detail level.
- Address any feedback from evaluation.`
  },

  // Column 27: Input, Output, and Intermediate Stages
  {
    columnId: 'how_it_works_input_output_stages',
    generativePrompt: `ROLE: You are an AI/ML expert creating comprehensive glossary content.
TASK: Generate content for **[TERM]** focusing on: Input, Output, and Intermediate Stages.
CONTEXT: What goes in, what comes out, and what happens in between
OUTPUT FORMAT: Write content in Markdown format.
CONSTRAINTS:
- Provide moderate detail (1-2 paragraphs or 5-7 bullet points).
- Ensure accuracy and clarity for essential level content.
- Focus specifically on the aspect described in the column name.
- Use technical language appropriate for the audience level.`,
    
    evaluativePrompt: `ROLE: You are an AI content reviewer specializing in technical accuracy.
TASK: Evaluate the Input, Output, and Intermediate Stages content for **[TERM]**.
OUTPUT FORMAT: Return JSON with "score" (1-10) and "feedback" string.
CONSTRAINTS:
- Check accuracy and completeness for What goes in, what comes out, and what happens in between.
- Verify appropriate detail level for essential content.
- Assess clarity and technical correctness.
- Note any missing key points or inaccuracies.`,
    
    improvementPrompt: `ROLE: You are an AI writing assistant improving technical content.
TASK: Enhance the Input, Output, and Intermediate Stages content for **[TERM]**.
OUTPUT FORMAT: Return only the improved content in the same format.
CONSTRAINTS:
- Maintain accuracy while improving clarity.
- Ensure completeness for What goes in, what comes out, and what happens in between.
- Keep within appropriate scope and detail level.
- Address any feedback from evaluation.`
  },

  // Column 28: Illustrative Examples or Case Studies
  {
    columnId: 'how_it_works_illustrative_examples',
    generativePrompt: `ROLE: You are an AI/ML expert creating comprehensive glossary content.
TASK: Generate content for **[TERM]** focusing on: Illustrative Examples or Case Studies.
CONTEXT: Concrete examples showing the concept in action
OUTPUT FORMAT: Write content in Markdown format.
CONSTRAINTS:
- Provide moderate detail (1-2 paragraphs or 5-7 bullet points).
- Ensure accuracy and clarity for essential level content.
- Focus specifically on the aspect described in the column name.
- Use technical language appropriate for the audience level.`,
    
    evaluativePrompt: `ROLE: You are an AI content reviewer specializing in technical accuracy.
TASK: Evaluate the Illustrative Examples or Case Studies content for **[TERM]**.
OUTPUT FORMAT: Return JSON with "score" (1-10) and "feedback" string.
CONSTRAINTS:
- Check accuracy and completeness for Concrete examples showing the concept in action.
- Verify appropriate detail level for essential content.
- Assess clarity and technical correctness.
- Note any missing key points or inaccuracies.`,
    
    improvementPrompt: `ROLE: You are an AI writing assistant improving technical content.
TASK: Enhance the Illustrative Examples or Case Studies content for **[TERM]**.
OUTPUT FORMAT: Return only the improved content in the same format.
CONSTRAINTS:
- Maintain accuracy while improving clarity.
- Ensure completeness for Concrete examples showing the concept in action.
- Keep within appropriate scope and detail level.
- Address any feedback from evaluation.`
  },

  // Column 29: Visualizations or Animations to Explain the Process
  {
    columnId: 'how_it_works_visualizations_animations',
    generativePrompt: `ROLE: You are an AI/ML expert creating comprehensive glossary content.
TASK: Generate content for **[TERM]** focusing on: Visualizations or Animations to Explain the Process.
CONTEXT: Visual aids and animations for better understanding
OUTPUT FORMAT: Provide interactive content specification in markdown format.
CONSTRAINTS:
- Keep it concise (2-4 sentences or 3-5 bullet points).
- Ensure accuracy and clarity for supplementary level content.
- Focus specifically on the aspect described in the column name.
- Use technical language appropriate for the audience level.`,
    
    evaluativePrompt: `ROLE: You are an AI content reviewer specializing in technical accuracy.
TASK: Evaluate the Visualizations or Animations to Explain the Process content for **[TERM]**.
OUTPUT FORMAT: Return JSON with "score" (1-10) and "feedback" string.
CONSTRAINTS:
- Check accuracy and completeness for Visual aids and animations for better understanding.
- Verify appropriate detail level for supplementary content.
- Assess clarity and technical correctness.
- Note any missing key points or inaccuracies.`,
    
    improvementPrompt: `ROLE: You are an AI writing assistant improving technical content.
TASK: Enhance the Visualizations or Animations to Explain the Process content for **[TERM]**.
OUTPUT FORMAT: Return only the improved content in the same format.
CONSTRAINTS:
- Maintain accuracy while improving clarity.
- Ensure completeness for Visual aids and animations for better understanding.
- Keep within appropriate scope and detail level.
- Address any feedback from evaluation.`
  },

  // Column 30: Component Breakdown
  {
    columnId: 'how_it_works_component_breakdown',
    generativePrompt: `ROLE: You are an AI/ML expert creating comprehensive glossary content.
TASK: Generate content for **[TERM]** focusing on: Component Breakdown.
CONTEXT: Breakdown of individual components and their roles
OUTPUT FORMAT: Write content in Markdown format.
CONSTRAINTS:
- Provide moderate detail (1-2 paragraphs or 5-7 bullet points).
- Ensure accuracy and clarity for important level content.
- Focus specifically on the aspect described in the column name.
- Use technical language appropriate for the audience level.`,
    
    evaluativePrompt: `ROLE: You are an AI content reviewer specializing in technical accuracy.
TASK: Evaluate the Component Breakdown content for **[TERM]**.
OUTPUT FORMAT: Return JSON with "score" (1-10) and "feedback" string.
CONSTRAINTS:
- Check accuracy and completeness for Breakdown of individual components and their roles.
- Verify appropriate detail level for important content.
- Assess clarity and technical correctness.
- Note any missing key points or inaccuracies.`,
    
    improvementPrompt: `ROLE: You are an AI writing assistant improving technical content.
TASK: Enhance the Component Breakdown content for **[TERM]**.
OUTPUT FORMAT: Return only the improved content in the same format.
CONSTRAINTS:
- Maintain accuracy while improving clarity.
- Ensure completeness for Breakdown of individual components and their roles.
- Keep within appropriate scope and detail level.
- Address any feedback from evaluation.`
  },

  // Column 31: Interactive Element: Flowcharts or Animated Diagrams
  {
    columnId: 'how_it_works_interactive_flowcharts',
    generativePrompt: `ROLE: You are an AI/ML expert creating comprehensive glossary content.
TASK: Generate content for **[TERM]** focusing on: Interactive Element: Flowcharts or Animated Diagrams.
CONTEXT: Interactive flowcharts and animated process diagrams
OUTPUT FORMAT: Provide interactive content specification in markdown format.
CONSTRAINTS:
- Provide moderate detail (1-2 paragraphs or 5-7 bullet points).
- Ensure accuracy and clarity for advanced level content.
- Focus specifically on the aspect described in the column name.
- Use technical language appropriate for the audience level.`,
    
    evaluativePrompt: `ROLE: You are an AI content reviewer specializing in technical accuracy.
TASK: Evaluate the Interactive Element: Flowcharts or Animated Diagrams content for **[TERM]**.
OUTPUT FORMAT: Return JSON with "score" (1-10) and "feedback" string.
CONSTRAINTS:
- Check accuracy and completeness for Interactive flowcharts and animated process diagrams.
- Verify appropriate detail level for advanced content.
- Assess clarity and technical correctness.
- Note any missing key points or inaccuracies.`,
    
    improvementPrompt: `ROLE: You are an AI writing assistant improving technical content.
TASK: Enhance the Interactive Element: Flowcharts or Animated Diagrams content for **[TERM]**.
OUTPUT FORMAT: Return only the improved content in the same format.
CONSTRAINTS:
- Maintain accuracy while improving clarity.
- Ensure completeness for Interactive flowcharts and animated process diagrams.
- Keep within appropriate scope and detail level.
- Address any feedback from evaluation.`
  },

  // Column 32: Different Types or Categories
  {
    columnId: 'variants_different_types',
    generativePrompt: `ROLE: You are an AI/ML expert creating comprehensive glossary content.
TASK: Generate content for **[TERM]** focusing on: Different Types or Categories.
CONTEXT: Different variations and categories of the concept
OUTPUT FORMAT: Write content in Markdown format.
CONSTRAINTS:
- Provide moderate detail (1-2 paragraphs or 5-7 bullet points).
- Ensure accuracy and clarity for important level content.
- Focus specifically on the aspect described in the column name.
- Use technical language appropriate for the audience level.`,
    
    evaluativePrompt: `ROLE: You are an AI content reviewer specializing in technical accuracy.
TASK: Evaluate the Different Types or Categories content for **[TERM]**.
OUTPUT FORMAT: Return JSON with "score" (1-10) and "feedback" string.
CONSTRAINTS:
- Check accuracy and completeness for Different variations and categories of the concept.
- Verify appropriate detail level for important content.
- Assess clarity and technical correctness.
- Note any missing key points or inaccuracies.`,
    
    improvementPrompt: `ROLE: You are an AI writing assistant improving technical content.
TASK: Enhance the Different Types or Categories content for **[TERM]**.
OUTPUT FORMAT: Return only the improved content in the same format.
CONSTRAINTS:
- Maintain accuracy while improving clarity.
- Ensure completeness for Different variations and categories of the concept.
- Keep within appropriate scope and detail level.
- Address any feedback from evaluation.`
  },

  // Column 33: Advanced or Specialized Versions
  {
    columnId: 'variants_advanced_specialized',
    generativePrompt: `ROLE: You are an AI/ML expert creating comprehensive glossary content.
TASK: Generate content for **[TERM]** focusing on: Advanced or Specialized Versions.
CONTEXT: Advanced and specialized variants of the concept
OUTPUT FORMAT: Write content in Markdown format.
CONSTRAINTS:
- Provide moderate detail (1-2 paragraphs or 5-7 bullet points).
- Ensure accuracy and clarity for supplementary level content.
- Focus specifically on the aspect described in the column name.
- Use technical language appropriate for the audience level.`,
    
    evaluativePrompt: `ROLE: You are an AI content reviewer specializing in technical accuracy.
TASK: Evaluate the Advanced or Specialized Versions content for **[TERM]**.
OUTPUT FORMAT: Return JSON with "score" (1-10) and "feedback" string.
CONSTRAINTS:
- Check accuracy and completeness for Advanced and specialized variants of the concept.
- Verify appropriate detail level for supplementary content.
- Assess clarity and technical correctness.
- Note any missing key points or inaccuracies.`,
    
    improvementPrompt: `ROLE: You are an AI writing assistant improving technical content.
TASK: Enhance the Advanced or Specialized Versions content for **[TERM]**.
OUTPUT FORMAT: Return only the improved content in the same format.
CONSTRAINTS:
- Maintain accuracy while improving clarity.
- Ensure completeness for Advanced and specialized variants of the concept.
- Keep within appropriate scope and detail level.
- Address any feedback from evaluation.`
  },

  // Column 34: Recent Developments or Improvements
  {
    columnId: 'variants_recent_developments',
    generativePrompt: `ROLE: You are an AI/ML expert creating comprehensive glossary content.
TASK: Generate content for **[TERM]** focusing on: Recent Developments or Improvements.
CONTEXT: Latest developments and improvements in the field
OUTPUT FORMAT: Write content in Markdown format.
CONSTRAINTS:
- Provide moderate detail (1-2 paragraphs or 5-7 bullet points).
- Ensure accuracy and clarity for supplementary level content.
- Focus specifically on the aspect described in the column name.
- Use technical language appropriate for the audience level.`,
    
    evaluativePrompt: `ROLE: You are an AI content reviewer specializing in technical accuracy.
TASK: Evaluate the Recent Developments or Improvements content for **[TERM]**.
OUTPUT FORMAT: Return JSON with "score" (1-10) and "feedback" string.
CONSTRAINTS:
- Check accuracy and completeness for Latest developments and improvements in the field.
- Verify appropriate detail level for supplementary content.
- Assess clarity and technical correctness.
- Note any missing key points or inaccuracies.`,
    
    improvementPrompt: `ROLE: You are an AI writing assistant improving technical content.
TASK: Enhance the Recent Developments or Improvements content for **[TERM]**.
OUTPUT FORMAT: Return only the improved content in the same format.
CONSTRAINTS:
- Maintain accuracy while improving clarity.
- Ensure completeness for Latest developments and improvements in the field.
- Keep within appropriate scope and detail level.
- Address any feedback from evaluation.`
  },

  // Column 35: Comparisons to Similar or Related Techniques
  {
    columnId: 'variants_comparisons_similar',
    generativePrompt: `ROLE: You are an AI/ML expert creating comprehensive glossary content.
TASK: Generate content for **[TERM]** focusing on: Comparisons to Similar or Related Techniques.
CONTEXT: Comparisons with related and similar techniques
OUTPUT FORMAT: Write content in Markdown format.
CONSTRAINTS:
- Provide moderate detail (1-2 paragraphs or 5-7 bullet points).
- Ensure accuracy and clarity for important level content.
- Focus specifically on the aspect described in the column name.
- Use technical language appropriate for the audience level.`,
    
    evaluativePrompt: `ROLE: You are an AI content reviewer specializing in technical accuracy.
TASK: Evaluate the Comparisons to Similar or Related Techniques content for **[TERM]**.
OUTPUT FORMAT: Return JSON with "score" (1-10) and "feedback" string.
CONSTRAINTS:
- Check accuracy and completeness for Comparisons with related and similar techniques.
- Verify appropriate detail level for important content.
- Assess clarity and technical correctness.
- Note any missing key points or inaccuracies.`,
    
    improvementPrompt: `ROLE: You are an AI writing assistant improving technical content.
TASK: Enhance the Comparisons to Similar or Related Techniques content for **[TERM]**.
OUTPUT FORMAT: Return only the improved content in the same format.
CONSTRAINTS:
- Maintain accuracy while improving clarity.
- Ensure completeness for Comparisons with related and similar techniques.
- Keep within appropriate scope and detail level.
- Address any feedback from evaluation.`
  },

  // Column 36: Comparative Analysis of Variants or Extensions
  {
    columnId: 'variants_comparative_analysis',
    generativePrompt: `ROLE: You are an AI/ML expert creating comprehensive glossary content.
TASK: Generate content for **[TERM]** focusing on: Comparative Analysis of Variants or Extensions.
CONTEXT: Detailed comparative analysis of different variants
OUTPUT FORMAT: Write content in Markdown format.
CONSTRAINTS:
- Provide moderate detail (1-2 paragraphs or 5-7 bullet points).
- Ensure accuracy and clarity for advanced level content.
- Focus specifically on the aspect described in the column name.
- Use technical language appropriate for the audience level.`,
    
    evaluativePrompt: `ROLE: You are an AI content reviewer specializing in technical accuracy.
TASK: Evaluate the Comparative Analysis of Variants or Extensions content for **[TERM]**.
OUTPUT FORMAT: Return JSON with "score" (1-10) and "feedback" string.
CONSTRAINTS:
- Check accuracy and completeness for Detailed comparative analysis of different variants.
- Verify appropriate detail level for advanced content.
- Assess clarity and technical correctness.
- Note any missing key points or inaccuracies.`,
    
    improvementPrompt: `ROLE: You are an AI writing assistant improving technical content.
TASK: Enhance the Comparative Analysis of Variants or Extensions content for **[TERM]**.
OUTPUT FORMAT: Return only the improved content in the same format.
CONSTRAINTS:
- Maintain accuracy while improving clarity.
- Ensure completeness for Detailed comparative analysis of different variants.
- Keep within appropriate scope and detail level.
- Address any feedback from evaluation.`
  },

  // Column 37: Interactive Element: Comparison Tables or Interactive Charts
  {
    columnId: 'variants_interactive_comparison',
    generativePrompt: `ROLE: You are an AI/ML expert creating comprehensive glossary content.
TASK: Generate content for **[TERM]** focusing on: Interactive Element: Comparison Tables or Interactive Charts.
CONTEXT: Interactive comparison tools and charts
OUTPUT FORMAT: Provide interactive content specification in markdown format.
CONSTRAINTS:
- Provide moderate detail (1-2 paragraphs or 5-7 bullet points).
- Ensure accuracy and clarity for advanced level content.
- Focus specifically on the aspect described in the column name.
- Use technical language appropriate for the audience level.`,
    
    evaluativePrompt: `ROLE: You are an AI content reviewer specializing in technical accuracy.
TASK: Evaluate the Interactive Element: Comparison Tables or Interactive Charts content for **[TERM]**.
OUTPUT FORMAT: Return JSON with "score" (1-10) and "feedback" string.
CONSTRAINTS:
- Check accuracy and completeness for Interactive comparison tools and charts.
- Verify appropriate detail level for advanced content.
- Assess clarity and technical correctness.
- Note any missing key points or inaccuracies.`,
    
    improvementPrompt: `ROLE: You are an AI writing assistant improving technical content.
TASK: Enhance the Interactive Element: Comparison Tables or Interactive Charts content for **[TERM]**.
OUTPUT FORMAT: Return only the improved content in the same format.
CONSTRAINTS:
- Maintain accuracy while improving clarity.
- Ensure completeness for Interactive comparison tools and charts.
- Keep within appropriate scope and detail level.
- Address any feedback from evaluation.`
  },

  // Column 38: Real-world Use Cases and Examples
  {
    columnId: 'applications_real_world_use_cases',
    generativePrompt: `ROLE: You are an AI/ML expert creating comprehensive glossary content.
TASK: Generate content for **[TERM]** focusing on: Real-world Use Cases and Examples.
CONTEXT: Practical real-world applications and use cases
OUTPUT FORMAT: Write content in Markdown format.
CONSTRAINTS:
- Provide moderate detail (1-2 paragraphs or 5-7 bullet points).
- Ensure accuracy and clarity for essential level content.
- Focus specifically on the aspect described in the column name.
- Use technical language appropriate for the audience level.`,
    
    evaluativePrompt: `ROLE: You are an AI content reviewer specializing in technical accuracy.
TASK: Evaluate the Real-world Use Cases and Examples content for **[TERM]**.
OUTPUT FORMAT: Return JSON with "score" (1-10) and "feedback" string.
CONSTRAINTS:
- Check accuracy and completeness for Practical real-world applications and use cases.
- Verify appropriate detail level for essential content.
- Assess clarity and technical correctness.
- Note any missing key points or inaccuracies.`,
    
    improvementPrompt: `ROLE: You are an AI writing assistant improving technical content.
TASK: Enhance the Real-world Use Cases and Examples content for **[TERM]**.
OUTPUT FORMAT: Return only the improved content in the same format.
CONSTRAINTS:
- Maintain accuracy while improving clarity.
- Ensure completeness for Practical real-world applications and use cases.
- Keep within appropriate scope and detail level.
- Address any feedback from evaluation.`
  },

  // Column 39: Industries or Domains of Application
  {
    columnId: 'applications_industries_domains',
    generativePrompt: `ROLE: You are an AI/ML expert creating comprehensive glossary content.
TASK: Generate content for **[TERM]** focusing on: Industries or Domains of Application.
CONTEXT: Industries and domains where this concept is applied
OUTPUT FORMAT: Provide a markdown unordered list.
CONSTRAINTS:
- Provide moderate detail (1-2 paragraphs or 5-7 bullet points).
- Ensure accuracy and clarity for important level content.
- Focus specifically on the aspect described in the column name.
- Use technical language appropriate for the audience level.`,
    
    evaluativePrompt: `ROLE: You are an AI content reviewer specializing in technical accuracy.
TASK: Evaluate the Industries or Domains of Application content for **[TERM]**.
OUTPUT FORMAT: Return JSON with "score" (1-10) and "feedback" string.
CONSTRAINTS:
- Check accuracy and completeness for Industries and domains where this concept is applied.
- Verify appropriate detail level for important content.
- Assess clarity and technical correctness.
- Note any missing key points or inaccuracies.`,
    
    improvementPrompt: `ROLE: You are an AI writing assistant improving technical content.
TASK: Enhance the Industries or Domains of Application content for **[TERM]**.
OUTPUT FORMAT: Return only the improved content in the same format.
CONSTRAINTS:
- Maintain accuracy while improving clarity.
- Ensure completeness for Industries and domains where this concept is applied.
- Keep within appropriate scope and detail level.
- Address any feedback from evaluation.`
  },

  // Column 40: Benefits and Impact
  {
    columnId: 'applications_benefits_impact',
    generativePrompt: `ROLE: You are an AI/ML expert creating comprehensive glossary content.
TASK: Generate content for **[TERM]** focusing on: Benefits and Impact.
CONTEXT: Benefits and real-world impact of applications
OUTPUT FORMAT: Write content in Markdown format.
CONSTRAINTS:
- Provide moderate detail (1-2 paragraphs or 5-7 bullet points).
- Ensure accuracy and clarity for essential level content.
- Focus specifically on the aspect described in the column name.
- Use technical language appropriate for the audience level.`,
    
    evaluativePrompt: `ROLE: You are an AI content reviewer specializing in technical accuracy.
TASK: Evaluate the Benefits and Impact content for **[TERM]**.
OUTPUT FORMAT: Return JSON with "score" (1-10) and "feedback" string.
CONSTRAINTS:
- Check accuracy and completeness for Benefits and real-world impact of applications.
- Verify appropriate detail level for essential content.
- Assess clarity and technical correctness.
- Note any missing key points or inaccuracies.`,
    
    improvementPrompt: `ROLE: You are an AI writing assistant improving technical content.
TASK: Enhance the Benefits and Impact content for **[TERM]**.
OUTPUT FORMAT: Return only the improved content in the same format.
CONSTRAINTS:
- Maintain accuracy while improving clarity.
- Ensure completeness for Benefits and real-world impact of applications.
- Keep within appropriate scope and detail level.
- Address any feedback from evaluation.`
  },

  // Column 41: Limitations or Challenges in Real-world Applications
  {
    columnId: 'applications_limitations_challenges',
    generativePrompt: `ROLE: You are an AI/ML expert creating comprehensive glossary content.
TASK: Generate content for **[TERM]** focusing on: Limitations or Challenges in Real-world Applications.
CONTEXT: Practical limitations and challenges in real applications
OUTPUT FORMAT: Write content in Markdown format.
CONSTRAINTS:
- Provide moderate detail (1-2 paragraphs or 5-7 bullet points).
- Ensure accuracy and clarity for important level content.
- Focus specifically on the aspect described in the column name.
- Use technical language appropriate for the audience level.`,
    
    evaluativePrompt: `ROLE: You are an AI content reviewer specializing in technical accuracy.
TASK: Evaluate the Limitations or Challenges in Real-world Applications content for **[TERM]**.
OUTPUT FORMAT: Return JSON with "score" (1-10) and "feedback" string.
CONSTRAINTS:
- Check accuracy and completeness for Practical limitations and challenges in real applications.
- Verify appropriate detail level for important content.
- Assess clarity and technical correctness.
- Note any missing key points or inaccuracies.`,
    
    improvementPrompt: `ROLE: You are an AI writing assistant improving technical content.
TASK: Enhance the Limitations or Challenges in Real-world Applications content for **[TERM]**.
OUTPUT FORMAT: Return only the improved content in the same format.
CONSTRAINTS:
- Maintain accuracy while improving clarity.
- Ensure completeness for Practical limitations and challenges in real applications.
- Keep within appropriate scope and detail level.
- Address any feedback from evaluation.`
  },

  // Column 42: Economic Impact
  {
    columnId: 'applications_economic_impact',
    generativePrompt: `ROLE: You are an AI/ML expert creating comprehensive glossary content.
TASK: Generate content for **[TERM]** focusing on: Economic Impact.
CONTEXT: Economic implications and business impact
OUTPUT FORMAT: Write content in Markdown format.
CONSTRAINTS:
- Keep it concise (2-4 sentences or 3-5 bullet points).
- Ensure accuracy and clarity for supplementary level content.
- Focus specifically on the aspect described in the column name.
- Use technical language appropriate for the audience level.`,
    
    evaluativePrompt: `ROLE: You are an AI content reviewer specializing in technical accuracy.
TASK: Evaluate the Economic Impact content for **[TERM]**.
OUTPUT FORMAT: Return JSON with "score" (1-10) and "feedback" string.
CONSTRAINTS:
- Check accuracy and completeness for Economic implications and business impact.
- Verify appropriate detail level for supplementary content.
- Assess clarity and technical correctness.
- Note any missing key points or inaccuracies.`,
    
    improvementPrompt: `ROLE: You are an AI writing assistant improving technical content.
TASK: Enhance the Economic Impact content for **[TERM]**.
OUTPUT FORMAT: Return only the improved content in the same format.
CONSTRAINTS:
- Maintain accuracy while improving clarity.
- Ensure completeness for Economic implications and business impact.
- Keep within appropriate scope and detail level.
- Address any feedback from evaluation.`
  },

  // Column 43: Interactive Element: Case Study Walkthroughs or Interactive Use Cases
  {
    columnId: 'applications_interactive_case_studies',
    generativePrompt: `ROLE: You are an AI/ML expert creating comprehensive glossary content.
TASK: Generate content for **[TERM]** focusing on: Interactive Element: Case Study Walkthroughs or Interactive Use Cases.
CONTEXT: Interactive case study explorations and walkthroughs
OUTPUT FORMAT: Provide interactive content specification in markdown format.
CONSTRAINTS:
- Provide moderate detail (1-2 paragraphs or 5-7 bullet points).
- Ensure accuracy and clarity for advanced level content.
- Focus specifically on the aspect described in the column name.
- Use technical language appropriate for the audience level.`,
    
    evaluativePrompt: `ROLE: You are an AI content reviewer specializing in technical accuracy.
TASK: Evaluate the Interactive Element: Case Study Walkthroughs or Interactive Use Cases content for **[TERM]**.
OUTPUT FORMAT: Return JSON with "score" (1-10) and "feedback" string.
CONSTRAINTS:
- Check accuracy and completeness for Interactive case study explorations and walkthroughs.
- Verify appropriate detail level for advanced content.
- Assess clarity and technical correctness.
- Note any missing key points or inaccuracies.`,
    
    improvementPrompt: `ROLE: You are an AI writing assistant improving technical content.
TASK: Enhance the Interactive Element: Case Study Walkthroughs or Interactive Use Cases content for **[TERM]**.
OUTPUT FORMAT: Return only the improved content in the same format.
CONSTRAINTS:
- Maintain accuracy while improving clarity.
- Ensure completeness for Interactive case study explorations and walkthroughs.
- Keep within appropriate scope and detail level.
- Address any feedback from evaluation.`
  },

  // Column 44: Popular Programming Languages and Libraries
  {
    columnId: 'implementation_programming_languages_libraries',
    generativePrompt: `ROLE: You are an AI/ML expert creating comprehensive glossary content.
TASK: Generate content for **[TERM]** focusing on: Popular Programming Languages and Libraries.
CONTEXT: Common programming languages and libraries for implementation
OUTPUT FORMAT: Write content in Markdown format.
CONSTRAINTS:
- Provide moderate detail (1-2 paragraphs or 5-7 bullet points).
- Ensure accuracy and clarity for essential level content.
- Focus specifically on the aspect described in the column name.
- Use technical language appropriate for the audience level.`,
    
    evaluativePrompt: `ROLE: You are an AI content reviewer specializing in technical accuracy.
TASK: Evaluate the Popular Programming Languages and Libraries content for **[TERM]**.
OUTPUT FORMAT: Return JSON with "score" (1-10) and "feedback" string.
CONSTRAINTS:
- Check accuracy and completeness for Common programming languages and libraries for implementation.
- Verify appropriate detail level for essential content.
- Assess clarity and technical correctness.
- Note any missing key points or inaccuracies.`,
    
    improvementPrompt: `ROLE: You are an AI writing assistant improving technical content.
TASK: Enhance the Popular Programming Languages and Libraries content for **[TERM]**.
OUTPUT FORMAT: Return only the improved content in the same format.
CONSTRAINTS:
- Maintain accuracy while improving clarity.
- Ensure completeness for Common programming languages and libraries for implementation.
- Keep within appropriate scope and detail level.
- Address any feedback from evaluation.`
  },

  // Column 45: Code Snippets or Pseudocode
  {
    columnId: 'implementation_code_snippets',
    generativePrompt: `ROLE: You are an AI/ML expert creating comprehensive glossary content.
TASK: Generate content for **[TERM]** focusing on: Code Snippets or Pseudocode.
CONTEXT: Example code snippets and pseudocode implementations
OUTPUT FORMAT: Write content in Markdown format.
CONSTRAINTS:
- Provide moderate detail (1-2 paragraphs or 5-7 bullet points).
- Ensure accuracy and clarity for essential level content.
- Focus specifically on the aspect described in the column name.
- Use technical language appropriate for the audience level.`,
    
    evaluativePrompt: `ROLE: You are an AI content reviewer specializing in technical accuracy.
TASK: Evaluate the Code Snippets or Pseudocode content for **[TERM]**.
OUTPUT FORMAT: Return JSON with "score" (1-10) and "feedback" string.
CONSTRAINTS:
- Check accuracy and completeness for Example code snippets and pseudocode implementations.
- Verify appropriate detail level for essential content.
- Assess clarity and technical correctness.
- Note any missing key points or inaccuracies.`,
    
    improvementPrompt: `ROLE: You are an AI writing assistant improving technical content.
TASK: Enhance the Code Snippets or Pseudocode content for **[TERM]**.
OUTPUT FORMAT: Return only the improved content in the same format.
CONSTRAINTS:
- Maintain accuracy while improving clarity.
- Ensure completeness for Example code snippets and pseudocode implementations.
- Keep within appropriate scope and detail level.
- Address any feedback from evaluation.`
  },

  // Column 46: Common Errors or Misconfigurations
  {
    columnId: 'implementation_common_errors',
    generativePrompt: `ROLE: You are an AI/ML expert creating comprehensive glossary content.
TASK: Generate content for **[TERM]** focusing on: Common Errors or Misconfigurations.
CONTEXT: Common implementation errors and misconfigurations
OUTPUT FORMAT: Write content in Markdown format.
CONSTRAINTS:
- Provide moderate detail (1-2 paragraphs or 5-7 bullet points).
- Ensure accuracy and clarity for important level content.
- Focus specifically on the aspect described in the column name.
- Use technical language appropriate for the audience level.`,
    
    evaluativePrompt: `ROLE: You are an AI content reviewer specializing in technical accuracy.
TASK: Evaluate the Common Errors or Misconfigurations content for **[TERM]**.
OUTPUT FORMAT: Return JSON with "score" (1-10) and "feedback" string.
CONSTRAINTS:
- Check accuracy and completeness for Common implementation errors and misconfigurations.
- Verify appropriate detail level for important content.
- Assess clarity and technical correctness.
- Note any missing key points or inaccuracies.`,
    
    improvementPrompt: `ROLE: You are an AI writing assistant improving technical content.
TASK: Enhance the Common Errors or Misconfigurations content for **[TERM]**.
OUTPUT FORMAT: Return only the improved content in the same format.
CONSTRAINTS:
- Maintain accuracy while improving clarity.
- Ensure completeness for Common implementation errors and misconfigurations.
- Keep within appropriate scope and detail level.
- Address any feedback from evaluation.`
  },

  // Column 47: Debugging Tips and Preventive Measures
  {
    columnId: 'implementation_debugging_tips',
    generativePrompt: `ROLE: You are an AI/ML expert creating comprehensive glossary content.
TASK: Generate content for **[TERM]** focusing on: Debugging Tips and Preventive Measures.
CONTEXT: Debugging strategies and preventive measures
OUTPUT FORMAT: Write content in Markdown format.
CONSTRAINTS:
- Provide moderate detail (1-2 paragraphs or 5-7 bullet points).
- Ensure accuracy and clarity for important level content.
- Focus specifically on the aspect described in the column name.
- Use technical language appropriate for the audience level.`,
    
    evaluativePrompt: `ROLE: You are an AI content reviewer specializing in technical accuracy.
TASK: Evaluate the Debugging Tips and Preventive Measures content for **[TERM]**.
OUTPUT FORMAT: Return JSON with "score" (1-10) and "feedback" string.
CONSTRAINTS:
- Check accuracy and completeness for Debugging strategies and preventive measures.
- Verify appropriate detail level for important content.
- Assess clarity and technical correctness.
- Note any missing key points or inaccuracies.`,
    
    improvementPrompt: `ROLE: You are an AI writing assistant improving technical content.
TASK: Enhance the Debugging Tips and Preventive Measures content for **[TERM]**.
OUTPUT FORMAT: Return only the improved content in the same format.
CONSTRAINTS:
- Maintain accuracy while improving clarity.
- Ensure completeness for Debugging strategies and preventive measures.
- Keep within appropriate scope and detail level.
- Address any feedback from evaluation.`
  },

  // Column 48: Key Hyperparameters and Their Effects
  {
    columnId: 'implementation_key_hyperparameters',
    generativePrompt: `ROLE: You are an AI/ML expert creating comprehensive glossary content.
TASK: Generate content for **[TERM]** focusing on: Key Hyperparameters and Their Effects.
CONTEXT: Important hyperparameters and their effects on performance
OUTPUT FORMAT: Write content in Markdown format.
CONSTRAINTS:
- Provide moderate detail (1-2 paragraphs or 5-7 bullet points).
- Ensure accuracy and clarity for important level content.
- Focus specifically on the aspect described in the column name.
- Use technical language appropriate for the audience level.`,
    
    evaluativePrompt: `ROLE: You are an AI content reviewer specializing in technical accuracy.
TASK: Evaluate the Key Hyperparameters and Their Effects content for **[TERM]**.
OUTPUT FORMAT: Return JSON with "score" (1-10) and "feedback" string.
CONSTRAINTS:
- Check accuracy and completeness for Important hyperparameters and their effects on performance.
- Verify appropriate detail level for important content.
- Assess clarity and technical correctness.
- Note any missing key points or inaccuracies.`,
    
    improvementPrompt: `ROLE: You are an AI writing assistant improving technical content.
TASK: Enhance the Key Hyperparameters and Their Effects content for **[TERM]**.
OUTPUT FORMAT: Return only the improved content in the same format.
CONSTRAINTS:
- Maintain accuracy while improving clarity.
- Ensure completeness for Important hyperparameters and their effects on performance.
- Keep within appropriate scope and detail level.
- Address any feedback from evaluation.`
  },

  // Column 49: Techniques for Hyperparameter Optimization
  {
    columnId: 'implementation_optimization_techniques',
    generativePrompt: `ROLE: You are an AI/ML expert creating comprehensive glossary content.
TASK: Generate content for **[TERM]** focusing on: Techniques for Hyperparameter Optimization.
CONTEXT: Methods and strategies for optimizing hyperparameters
OUTPUT FORMAT: Write content in Markdown format.
CONSTRAINTS:
- Provide moderate detail (1-2 paragraphs or 5-7 bullet points).
- Ensure accuracy and clarity for supplementary level content.
- Focus specifically on the aspect described in the column name.
- Use technical language appropriate for the audience level.`,
    
    evaluativePrompt: `ROLE: You are an AI content reviewer specializing in technical accuracy.
TASK: Evaluate the Techniques for Hyperparameter Optimization content for **[TERM]**.
OUTPUT FORMAT: Return JSON with "score" (1-10) and "feedback" string.
CONSTRAINTS:
- Check accuracy and completeness for Methods and strategies for optimizing hyperparameters.
- Verify appropriate detail level for supplementary content.
- Assess clarity and technical correctness.
- Note any missing key points or inaccuracies.`,
    
    improvementPrompt: `ROLE: You are an AI writing assistant improving technical content.
TASK: Enhance the Techniques for Hyperparameter Optimization content for **[TERM]**.
OUTPUT FORMAT: Return only the improved content in the same format.
CONSTRAINTS:
- Maintain accuracy while improving clarity.
- Ensure completeness for Methods and strategies for optimizing hyperparameters.
- Keep within appropriate scope and detail level.
- Address any feedback from evaluation.`
  },

  // Column 50: Best Practices and Guidelines
  {
    columnId: 'implementation_best_practices_guidelines',
    generativePrompt: `ROLE: You are an AI/ML expert creating comprehensive glossary content.
TASK: Generate content for **[TERM]** focusing on: Best Practices and Guidelines.
CONTEXT: Best practices for hyperparameter tuning
OUTPUT FORMAT: Write content in Markdown format.
CONSTRAINTS:
- Provide moderate detail (1-2 paragraphs or 5-7 bullet points).
- Ensure accuracy and clarity for important level content.
- Focus specifically on the aspect described in the column name.
- Use technical language appropriate for the audience level.`,
    
    evaluativePrompt: `ROLE: You are an AI content reviewer specializing in technical accuracy.
TASK: Evaluate the Best Practices and Guidelines content for **[TERM]**.
OUTPUT FORMAT: Return JSON with "score" (1-10) and "feedback" string.
CONSTRAINTS:
- Check accuracy and completeness for Best practices for hyperparameter tuning.
- Verify appropriate detail level for important content.
- Assess clarity and technical correctness.
- Note any missing key points or inaccuracies.`,
    
    improvementPrompt: `ROLE: You are an AI writing assistant improving technical content.
TASK: Enhance the Best Practices and Guidelines content for **[TERM]**.
OUTPUT FORMAT: Return only the improved content in the same format.
CONSTRAINTS:
- Maintain accuracy while improving clarity.
- Ensure completeness for Best practices for hyperparameter tuning.
- Keep within appropriate scope and detail level.
- Address any feedback from evaluation.`
  },

  // Column 51: Deployment and Scaling Considerations
  {
    columnId: 'implementation_deployment_scaling',
    generativePrompt: `ROLE: You are an AI/ML expert creating comprehensive glossary content.
TASK: Generate content for **[TERM]** focusing on: Deployment and Scaling Considerations.
CONTEXT: Considerations for deploying and scaling implementations
OUTPUT FORMAT: Write content in Markdown format.
CONSTRAINTS:
- Provide moderate detail (1-2 paragraphs or 5-7 bullet points).
- Ensure accuracy and clarity for important level content.
- Focus specifically on the aspect described in the column name.
- Use technical language appropriate for the audience level.`,
    
    evaluativePrompt: `ROLE: You are an AI content reviewer specializing in technical accuracy.
TASK: Evaluate the Deployment and Scaling Considerations content for **[TERM]**.
OUTPUT FORMAT: Return JSON with "score" (1-10) and "feedback" string.
CONSTRAINTS:
- Check accuracy and completeness for Considerations for deploying and scaling implementations.
- Verify appropriate detail level for important content.
- Assess clarity and technical correctness.
- Note any missing key points or inaccuracies.`,
    
    improvementPrompt: `ROLE: You are an AI writing assistant improving technical content.
TASK: Enhance the Deployment and Scaling Considerations content for **[TERM]**.
OUTPUT FORMAT: Return only the improved content in the same format.
CONSTRAINTS:
- Maintain accuracy while improving clarity.
- Ensure completeness for Considerations for deploying and scaling implementations.
- Keep within appropriate scope and detail level.
- Address any feedback from evaluation.`
  },

  // Column 52: Distributed and Parallel Computing Considerations
  {
    columnId: 'implementation_distributed_parallel',
    generativePrompt: `ROLE: You are an AI/ML expert creating comprehensive glossary content.
TASK: Generate content for **[TERM]** focusing on: Distributed and Parallel Computing Considerations.
CONTEXT: Distributed and parallel computing strategies
OUTPUT FORMAT: Write content in Markdown format.
CONSTRAINTS:
- Provide moderate detail (1-2 paragraphs or 5-7 bullet points).
- Ensure accuracy and clarity for supplementary level content.
- Focus specifically on the aspect described in the column name.
- Use technical language appropriate for the audience level.`,
    
    evaluativePrompt: `ROLE: You are an AI content reviewer specializing in technical accuracy.
TASK: Evaluate the Distributed and Parallel Computing Considerations content for **[TERM]**.
OUTPUT FORMAT: Return JSON with "score" (1-10) and "feedback" string.
CONSTRAINTS:
- Check accuracy and completeness for Distributed and parallel computing strategies.
- Verify appropriate detail level for supplementary content.
- Assess clarity and technical correctness.
- Note any missing key points or inaccuracies.`,
    
    improvementPrompt: `ROLE: You are an AI writing assistant improving technical content.
TASK: Enhance the Distributed and Parallel Computing Considerations content for **[TERM]**.
OUTPUT FORMAT: Return only the improved content in the same format.
CONSTRAINTS:
- Maintain accuracy while improving clarity.
- Ensure completeness for Distributed and parallel computing strategies.
- Keep within appropriate scope and detail level.
- Address any feedback from evaluation.`
  },

  // Column 53: Model Deployment and Serving Strategies
  {
    columnId: 'implementation_model_deployment_serving',
    generativePrompt: `ROLE: You are an AI/ML expert creating comprehensive glossary content.
TASK: Generate content for **[TERM]** focusing on: Model Deployment and Serving Strategies.
CONTEXT: Strategies for deploying and serving models in production
OUTPUT FORMAT: Write content in Markdown format.
CONSTRAINTS:
- Provide moderate detail (1-2 paragraphs or 5-7 bullet points).
- Ensure accuracy and clarity for important level content.
- Focus specifically on the aspect described in the column name.
- Use technical language appropriate for the audience level.`,
    
    evaluativePrompt: `ROLE: You are an AI content reviewer specializing in technical accuracy.
TASK: Evaluate the Model Deployment and Serving Strategies content for **[TERM]**.
OUTPUT FORMAT: Return JSON with "score" (1-10) and "feedback" string.
CONSTRAINTS:
- Check accuracy and completeness for Strategies for deploying and serving models in production.
- Verify appropriate detail level for important content.
- Assess clarity and technical correctness.
- Note any missing key points or inaccuracies.`,
    
    improvementPrompt: `ROLE: You are an AI writing assistant improving technical content.
TASK: Enhance the Model Deployment and Serving Strategies content for **[TERM]**.
OUTPUT FORMAT: Return only the improved content in the same format.
CONSTRAINTS:
- Maintain accuracy while improving clarity.
- Ensure completeness for Strategies for deploying and serving models in production.
- Keep within appropriate scope and detail level.
- Address any feedback from evaluation.`
  },

  // Column 54: Tips for Effective Implementation
  {
    columnId: 'implementation_tips_effective',
    generativePrompt: `ROLE: You are an AI/ML expert creating comprehensive glossary content.
TASK: Generate content for **[TERM]** focusing on: Tips for Effective Implementation.
CONTEXT: Practical tips for successful implementation
OUTPUT FORMAT: Write content in Markdown format.
CONSTRAINTS:
- Provide moderate detail (1-2 paragraphs or 5-7 bullet points).
- Ensure accuracy and clarity for supplementary level content.
- Focus specifically on the aspect described in the column name.
- Use technical language appropriate for the audience level.`,
    
    evaluativePrompt: `ROLE: You are an AI content reviewer specializing in technical accuracy.
TASK: Evaluate the Tips for Effective Implementation content for **[TERM]**.
OUTPUT FORMAT: Return JSON with "score" (1-10) and "feedback" string.
CONSTRAINTS:
- Check accuracy and completeness for Practical tips for successful implementation.
- Verify appropriate detail level for supplementary content.
- Assess clarity and technical correctness.
- Note any missing key points or inaccuracies.`,
    
    improvementPrompt: `ROLE: You are an AI writing assistant improving technical content.
TASK: Enhance the Tips for Effective Implementation content for **[TERM]**.
OUTPUT FORMAT: Return only the improved content in the same format.
CONSTRAINTS:
- Maintain accuracy while improving clarity.
- Ensure completeness for Practical tips for successful implementation.
- Keep within appropriate scope and detail level.
- Address any feedback from evaluation.`
  },

  // Column 55: Security Best Practices
  {
    columnId: 'implementation_security_best_practices',
    generativePrompt: `ROLE: You are an AI/ML expert creating comprehensive glossary content.
TASK: Generate content for **[TERM]** focusing on: Security Best Practices.
CONTEXT: Security considerations and best practices
OUTPUT FORMAT: Write content in Markdown format.
CONSTRAINTS:
- Provide moderate detail (1-2 paragraphs or 5-7 bullet points).
- Ensure accuracy and clarity for important level content.
- Focus specifically on the aspect described in the column name.
- Use technical language appropriate for the audience level.`,
    
    evaluativePrompt: `ROLE: You are an AI content reviewer specializing in technical accuracy.
TASK: Evaluate the Security Best Practices content for **[TERM]**.
OUTPUT FORMAT: Return JSON with "score" (1-10) and "feedback" string.
CONSTRAINTS:
- Check accuracy and completeness for Security considerations and best practices.
- Verify appropriate detail level for important content.
- Assess clarity and technical correctness.
- Note any missing key points or inaccuracies.`,
    
    improvementPrompt: `ROLE: You are an AI writing assistant improving technical content.
TASK: Enhance the Security Best Practices content for **[TERM]**.
OUTPUT FORMAT: Return only the improved content in the same format.
CONSTRAINTS:
- Maintain accuracy while improving clarity.
- Ensure completeness for Security considerations and best practices.
- Keep within appropriate scope and detail level.
- Address any feedback from evaluation.`
  },

  // Column 56: Interactive Element: Live Code Examples or Embedded Notebooks
  {
    columnId: 'implementation_interactive_code',
    generativePrompt: `ROLE: You are an AI/ML expert creating comprehensive glossary content.
TASK: Generate content for **[TERM]** focusing on: Interactive Element: Live Code Examples or Embedded Notebooks.
CONTEXT: Interactive code examples and embedded notebooks
OUTPUT FORMAT: Provide interactive content specification in markdown format.
CONSTRAINTS:
- Provide moderate detail (1-2 paragraphs or 5-7 bullet points).
- Ensure accuracy and clarity for advanced level content.
- Focus specifically on the aspect described in the column name.
- Use technical language appropriate for the audience level.`,
    
    evaluativePrompt: `ROLE: You are an AI content reviewer specializing in technical accuracy.
TASK: Evaluate the Interactive Element: Live Code Examples or Embedded Notebooks content for **[TERM]**.
OUTPUT FORMAT: Return JSON with "score" (1-10) and "feedback" string.
CONSTRAINTS:
- Check accuracy and completeness for Interactive code examples and embedded notebooks.
- Verify appropriate detail level for advanced content.
- Assess clarity and technical correctness.
- Note any missing key points or inaccuracies.`,
    
    improvementPrompt: `ROLE: You are an AI writing assistant improving technical content.
TASK: Enhance the Interactive Element: Live Code Examples or Embedded Notebooks content for **[TERM]**.
OUTPUT FORMAT: Return only the improved content in the same format.
CONSTRAINTS:
- Maintain accuracy while improving clarity.
- Ensure completeness for Interactive code examples and embedded notebooks.
- Keep within appropriate scope and detail level.
- Address any feedback from evaluation.`
  },

  // Column 57: Appropriate Evaluation Techniques
  {
    columnId: 'evaluation_appropriate_techniques',
    generativePrompt: `ROLE: You are an AI/ML expert creating comprehensive glossary content.
TASK: Generate content for **[TERM]** focusing on: Appropriate Evaluation Techniques.
CONTEXT: Suitable evaluation methods and techniques
OUTPUT FORMAT: Write content in Markdown format.
CONSTRAINTS:
- Provide moderate detail (1-2 paragraphs or 5-7 bullet points).
- Ensure accuracy and clarity for essential level content.
- Focus specifically on the aspect described in the column name.
- Use technical language appropriate for the audience level.`,
    
    evaluativePrompt: `ROLE: You are an AI content reviewer specializing in technical accuracy.
TASK: Evaluate the Appropriate Evaluation Techniques content for **[TERM]**.
OUTPUT FORMAT: Return JSON with "score" (1-10) and "feedback" string.
CONSTRAINTS:
- Check accuracy and completeness for Suitable evaluation methods and techniques.
- Verify appropriate detail level for essential content.
- Assess clarity and technical correctness.
- Note any missing key points or inaccuracies.`,
    
    improvementPrompt: `ROLE: You are an AI writing assistant improving technical content.
TASK: Enhance the Appropriate Evaluation Techniques content for **[TERM]**.
OUTPUT FORMAT: Return only the improved content in the same format.
CONSTRAINTS:
- Maintain accuracy while improving clarity.
- Ensure completeness for Suitable evaluation methods and techniques.
- Keep within appropriate scope and detail level.
- Address any feedback from evaluation.`
  },

  // Column 58: Performance Measures and Metrics
  {
    columnId: 'evaluation_performance_measures',
    generativePrompt: `ROLE: You are an AI/ML expert creating comprehensive glossary content.
TASK: Generate content for **[TERM]** focusing on: Performance Measures and Metrics.
CONTEXT: Key performance metrics and measurement approaches
OUTPUT FORMAT: Write content in Markdown format.
CONSTRAINTS:
- Provide moderate detail (1-2 paragraphs or 5-7 bullet points).
- Ensure accuracy and clarity for essential level content.
- Focus specifically on the aspect described in the column name.
- Use technical language appropriate for the audience level.`,
    
    evaluativePrompt: `ROLE: You are an AI content reviewer specializing in technical accuracy.
TASK: Evaluate the Performance Measures and Metrics content for **[TERM]**.
OUTPUT FORMAT: Return JSON with "score" (1-10) and "feedback" string.
CONSTRAINTS:
- Check accuracy and completeness for Key performance metrics and measurement approaches.
- Verify appropriate detail level for essential content.
- Assess clarity and technical correctness.
- Note any missing key points or inaccuracies.`,
    
    improvementPrompt: `ROLE: You are an AI writing assistant improving technical content.
TASK: Enhance the Performance Measures and Metrics content for **[TERM]**.
OUTPUT FORMAT: Return only the improved content in the same format.
CONSTRAINTS:
- Maintain accuracy while improving clarity.
- Ensure completeness for Key performance metrics and measurement approaches.
- Keep within appropriate scope and detail level.
- Address any feedback from evaluation.`
  },

  // Column 59: Benchmarking and Comparative Analysis
  {
    columnId: 'evaluation_benchmarking_comparative',
    generativePrompt: `ROLE: You are an AI/ML expert creating comprehensive glossary content.
TASK: Generate content for **[TERM]** focusing on: Benchmarking and Comparative Analysis.
CONTEXT: Benchmarking approaches and comparative analysis methods
OUTPUT FORMAT: Write content in Markdown format.
CONSTRAINTS:
- Provide moderate detail (1-2 paragraphs or 5-7 bullet points).
- Ensure accuracy and clarity for important level content.
- Focus specifically on the aspect described in the column name.
- Use technical language appropriate for the audience level.`,
    
    evaluativePrompt: `ROLE: You are an AI content reviewer specializing in technical accuracy.
TASK: Evaluate the Benchmarking and Comparative Analysis content for **[TERM]**.
OUTPUT FORMAT: Return JSON with "score" (1-10) and "feedback" string.
CONSTRAINTS:
- Check accuracy and completeness for Benchmarking approaches and comparative analysis methods.
- Verify appropriate detail level for important content.
- Assess clarity and technical correctness.
- Note any missing key points or inaccuracies.`,
    
    improvementPrompt: `ROLE: You are an AI writing assistant improving technical content.
TASK: Enhance the Benchmarking and Comparative Analysis content for **[TERM]**.
OUTPUT FORMAT: Return only the improved content in the same format.
CONSTRAINTS:
- Maintain accuracy while improving clarity.
- Ensure completeness for Benchmarking approaches and comparative analysis methods.
- Keep within appropriate scope and detail level.
- Address any feedback from evaluation.`
  },

  // Column 60: Interpreting and Analyzing Results
  {
    columnId: 'evaluation_interpreting_analyzing',
    generativePrompt: `ROLE: You are an AI/ML expert creating comprehensive glossary content.
TASK: Generate content for **[TERM]** focusing on: Interpreting and Analyzing Results.
CONTEXT: How to interpret and analyze evaluation results
OUTPUT FORMAT: Write content in Markdown format.
CONSTRAINTS:
- Provide moderate detail (1-2 paragraphs or 5-7 bullet points).
- Ensure accuracy and clarity for important level content.
- Focus specifically on the aspect described in the column name.
- Use technical language appropriate for the audience level.`,
    
    evaluativePrompt: `ROLE: You are an AI content reviewer specializing in technical accuracy.
TASK: Evaluate the Interpreting and Analyzing Results content for **[TERM]**.
OUTPUT FORMAT: Return JSON with "score" (1-10) and "feedback" string.
CONSTRAINTS:
- Check accuracy and completeness for How to interpret and analyze evaluation results.
- Verify appropriate detail level for important content.
- Assess clarity and technical correctness.
- Note any missing key points or inaccuracies.`,
    
    improvementPrompt: `ROLE: You are an AI writing assistant improving technical content.
TASK: Enhance the Interpreting and Analyzing Results content for **[TERM]**.
OUTPUT FORMAT: Return only the improved content in the same format.
CONSTRAINTS:
- Maintain accuracy while improving clarity.
- Ensure completeness for How to interpret and analyze evaluation results.
- Keep within appropriate scope and detail level.
- Address any feedback from evaluation.`
  },

  // Column 61: Statistical Significance and Hypothesis Testing
  {
    columnId: 'evaluation_statistical_significance',
    generativePrompt: `ROLE: You are an AI/ML expert creating comprehensive glossary content.
TASK: Generate content for **[TERM]** focusing on: Statistical Significance and Hypothesis Testing.
CONTEXT: Statistical methods for validating results
OUTPUT FORMAT: Write content in Markdown format.
CONSTRAINTS:
- Provide moderate detail (1-2 paragraphs or 5-7 bullet points).
- Ensure accuracy and clarity for advanced level content.
- Focus specifically on the aspect described in the column name.
- Use technical language appropriate for the audience level.`,
    
    evaluativePrompt: `ROLE: You are an AI content reviewer specializing in technical accuracy.
TASK: Evaluate the Statistical Significance and Hypothesis Testing content for **[TERM]**.
OUTPUT FORMAT: Return JSON with "score" (1-10) and "feedback" string.
CONSTRAINTS:
- Check accuracy and completeness for Statistical methods for validating results.
- Verify appropriate detail level for advanced content.
- Assess clarity and technical correctness.
- Note any missing key points or inaccuracies.`,
    
    improvementPrompt: `ROLE: You are an AI writing assistant improving technical content.
TASK: Enhance the Statistical Significance and Hypothesis Testing content for **[TERM]**.
OUTPUT FORMAT: Return only the improved content in the same format.
CONSTRAINTS:
- Maintain accuracy while improving clarity.
- Ensure completeness for Statistical methods for validating results.
- Keep within appropriate scope and detail level.
- Address any feedback from evaluation.`
  },

  // Column 62: Robustness and Stability Evaluation
  {
    columnId: 'evaluation_robustness_stability',
    generativePrompt: `ROLE: You are an AI/ML expert creating comprehensive glossary content.
TASK: Generate content for **[TERM]** focusing on: Robustness and Stability Evaluation.
CONTEXT: Evaluating model robustness and stability
OUTPUT FORMAT: Write content in Markdown format.
CONSTRAINTS:
- Provide moderate detail (1-2 paragraphs or 5-7 bullet points).
- Ensure accuracy and clarity for supplementary level content.
- Focus specifically on the aspect described in the column name.
- Use technical language appropriate for the audience level.`,
    
    evaluativePrompt: `ROLE: You are an AI content reviewer specializing in technical accuracy.
TASK: Evaluate the Robustness and Stability Evaluation content for **[TERM]**.
OUTPUT FORMAT: Return JSON with "score" (1-10) and "feedback" string.
CONSTRAINTS:
- Check accuracy and completeness for Evaluating model robustness and stability.
- Verify appropriate detail level for supplementary content.
- Assess clarity and technical correctness.
- Note any missing key points or inaccuracies.`,
    
    improvementPrompt: `ROLE: You are an AI writing assistant improving technical content.
TASK: Enhance the Robustness and Stability Evaluation content for **[TERM]**.
OUTPUT FORMAT: Return only the improved content in the same format.
CONSTRAINTS:
- Maintain accuracy while improving clarity.
- Ensure completeness for Evaluating model robustness and stability.
- Keep within appropriate scope and detail level.
- Address any feedback from evaluation.`
  },

  // Column 63: Interactive Element: Metric Calculators or Interactive Dashboards
  {
    columnId: 'evaluation_interactive_dashboards',
    generativePrompt: `ROLE: You are an AI/ML expert creating comprehensive glossary content.
TASK: Generate content for **[TERM]** focusing on: Interactive Element: Metric Calculators or Interactive Dashboards.
CONTEXT: Interactive metric calculators and evaluation dashboards
OUTPUT FORMAT: Provide interactive content specification in markdown format.
CONSTRAINTS:
- Provide moderate detail (1-2 paragraphs or 5-7 bullet points).
- Ensure accuracy and clarity for advanced level content.
- Focus specifically on the aspect described in the column name.
- Use technical language appropriate for the audience level.`,
    
    evaluativePrompt: `ROLE: You are an AI content reviewer specializing in technical accuracy.
TASK: Evaluate the Interactive Element: Metric Calculators or Interactive Dashboards content for **[TERM]**.
OUTPUT FORMAT: Return JSON with "score" (1-10) and "feedback" string.
CONSTRAINTS:
- Check accuracy and completeness for Interactive metric calculators and evaluation dashboards.
- Verify appropriate detail level for advanced content.
- Assess clarity and technical correctness.
- Note any missing key points or inaccuracies.`,
    
    improvementPrompt: `ROLE: You are an AI writing assistant improving technical content.
TASK: Enhance the Interactive Element: Metric Calculators or Interactive Dashboards content for **[TERM]**.
OUTPUT FORMAT: Return only the improved content in the same format.
CONSTRAINTS:
- Maintain accuracy while improving clarity.
- Ensure completeness for Interactive metric calculators and evaluation dashboards.
- Keep within appropriate scope and detail level.
- Address any feedback from evaluation.`
  },

  // Column 64: Strengths and Benefits
  {
    columnId: 'advantages_strengths_benefits',
    generativePrompt: `ROLE: You are an AI/ML expert creating comprehensive glossary content.
TASK: Generate content for **[TERM]** focusing on: Strengths and Benefits.
CONTEXT: Key strengths and benefits of the approach
OUTPUT FORMAT: Write content in Markdown format.
CONSTRAINTS:
- Provide moderate detail (1-2 paragraphs or 5-7 bullet points).
- Ensure accuracy and clarity for essential level content.
- Focus specifically on the aspect described in the column name.
- Use technical language appropriate for the audience level.`,
    
    evaluativePrompt: `ROLE: You are an AI content reviewer specializing in technical accuracy.
TASK: Evaluate the Strengths and Benefits content for **[TERM]**.
OUTPUT FORMAT: Return JSON with "score" (1-10) and "feedback" string.
CONSTRAINTS:
- Check accuracy and completeness for Key strengths and benefits of the approach.
- Verify appropriate detail level for essential content.
- Assess clarity and technical correctness.
- Note any missing key points or inaccuracies.`,
    
    improvementPrompt: `ROLE: You are an AI writing assistant improving technical content.
TASK: Enhance the Strengths and Benefits content for **[TERM]**.
OUTPUT FORMAT: Return only the improved content in the same format.
CONSTRAINTS:
- Maintain accuracy while improving clarity.
- Ensure completeness for Key strengths and benefits of the approach.
- Keep within appropriate scope and detail level.
- Address any feedback from evaluation.`
  },

  // Column 65: Weaknesses and Limitations
  {
    columnId: 'advantages_weaknesses_limitations',
    generativePrompt: `ROLE: You are an AI/ML expert creating comprehensive glossary content.
TASK: Generate content for **[TERM]** focusing on: Weaknesses and Limitations.
CONTEXT: Key weaknesses and limitations to be aware of
OUTPUT FORMAT: Write content in Markdown format.
CONSTRAINTS:
- Provide moderate detail (1-2 paragraphs or 5-7 bullet points).
- Ensure accuracy and clarity for essential level content.
- Focus specifically on the aspect described in the column name.
- Use technical language appropriate for the audience level.`,
    
    evaluativePrompt: `ROLE: You are an AI content reviewer specializing in technical accuracy.
TASK: Evaluate the Weaknesses and Limitations content for **[TERM]**.
OUTPUT FORMAT: Return JSON with "score" (1-10) and "feedback" string.
CONSTRAINTS:
- Check accuracy and completeness for Key weaknesses and limitations to be aware of.
- Verify appropriate detail level for essential content.
- Assess clarity and technical correctness.
- Note any missing key points or inaccuracies.`,
    
    improvementPrompt: `ROLE: You are an AI writing assistant improving technical content.
TASK: Enhance the Weaknesses and Limitations content for **[TERM]**.
OUTPUT FORMAT: Return only the improved content in the same format.
CONSTRAINTS:
- Maintain accuracy while improving clarity.
- Ensure completeness for Key weaknesses and limitations to be aware of.
- Keep within appropriate scope and detail level.
- Address any feedback from evaluation.`
  },

  // Column 66: Trade-offs and Considerations
  {
    columnId: 'advantages_tradeoffs_considerations',
    generativePrompt: `ROLE: You are an AI/ML expert creating comprehensive glossary content.
TASK: Generate content for **[TERM]** focusing on: Trade-offs and Considerations.
CONTEXT: Important trade-offs to consider when using this approach
OUTPUT FORMAT: Write content in Markdown format.
CONSTRAINTS:
- Provide moderate detail (1-2 paragraphs or 5-7 bullet points).
- Ensure accuracy and clarity for important level content.
- Focus specifically on the aspect described in the column name.
- Use technical language appropriate for the audience level.`,
    
    evaluativePrompt: `ROLE: You are an AI content reviewer specializing in technical accuracy.
TASK: Evaluate the Trade-offs and Considerations content for **[TERM]**.
OUTPUT FORMAT: Return JSON with "score" (1-10) and "feedback" string.
CONSTRAINTS:
- Check accuracy and completeness for Important trade-offs to consider when using this approach.
- Verify appropriate detail level for important content.
- Assess clarity and technical correctness.
- Note any missing key points or inaccuracies.`,
    
    improvementPrompt: `ROLE: You are an AI writing assistant improving technical content.
TASK: Enhance the Trade-offs and Considerations content for **[TERM]**.
OUTPUT FORMAT: Return only the improved content in the same format.
CONSTRAINTS:
- Maintain accuracy while improving clarity.
- Ensure completeness for Important trade-offs to consider when using this approach.
- Keep within appropriate scope and detail level.
- Address any feedback from evaluation.`
  },

  // Column 67: Interactive Element: Pros and Cons Lists with Visual Indicators
  {
    columnId: 'advantages_interactive_pros_cons',
    generativePrompt: `ROLE: You are an AI/ML expert creating comprehensive glossary content.
TASK: Generate content for **[TERM]** focusing on: Interactive Element: Pros and Cons Lists with Visual Indicators.
CONTEXT: Interactive visualization of pros and cons
OUTPUT FORMAT: Provide interactive content specification in markdown format.
CONSTRAINTS:
- Provide moderate detail (1-2 paragraphs or 5-7 bullet points).
- Ensure accuracy and clarity for advanced level content.
- Focus specifically on the aspect described in the column name.
- Use technical language appropriate for the audience level.`,
    
    evaluativePrompt: `ROLE: You are an AI content reviewer specializing in technical accuracy.
TASK: Evaluate the Interactive Element: Pros and Cons Lists with Visual Indicators content for **[TERM]**.
OUTPUT FORMAT: Return JSON with "score" (1-10) and "feedback" string.
CONSTRAINTS:
- Check accuracy and completeness for Interactive visualization of pros and cons.
- Verify appropriate detail level for advanced content.
- Assess clarity and technical correctness.
- Note any missing key points or inaccuracies.`,
    
    improvementPrompt: `ROLE: You are an AI writing assistant improving technical content.
TASK: Enhance the Interactive Element: Pros and Cons Lists with Visual Indicators content for **[TERM]**.
OUTPUT FORMAT: Return only the improved content in the same format.
CONSTRAINTS:
- Maintain accuracy while improving clarity.
- Ensure completeness for Interactive visualization of pros and cons.
- Keep within appropriate scope and detail level.
- Address any feedback from evaluation.`
  },

  // Column 68: Ethical Considerations and Implications
  {
    columnId: 'ethics_ethical_considerations',
    generativePrompt: `ROLE: You are an AI/ML expert creating comprehensive glossary content.
TASK: Generate content for **[TERM]** focusing on: Ethical Considerations and Implications.
CONTEXT: Ethical considerations and implications of the technology
OUTPUT FORMAT: Write content in Markdown format.
CONSTRAINTS:
- Provide moderate detail (1-2 paragraphs or 5-7 bullet points).
- Ensure accuracy and clarity for important level content.
- Focus specifically on the aspect described in the column name.
- Use technical language appropriate for the audience level.`,
    
    evaluativePrompt: `ROLE: You are an AI content reviewer specializing in technical accuracy.
TASK: Evaluate the Ethical Considerations and Implications content for **[TERM]**.
OUTPUT FORMAT: Return JSON with "score" (1-10) and "feedback" string.
CONSTRAINTS:
- Check accuracy and completeness for Ethical considerations and implications of the technology.
- Verify appropriate detail level for important content.
- Assess clarity and technical correctness.
- Note any missing key points or inaccuracies.`,
    
    improvementPrompt: `ROLE: You are an AI writing assistant improving technical content.
TASK: Enhance the Ethical Considerations and Implications content for **[TERM]**.
OUTPUT FORMAT: Return only the improved content in the same format.
CONSTRAINTS:
- Maintain accuracy while improving clarity.
- Ensure completeness for Ethical considerations and implications of the technology.
- Keep within appropriate scope and detail level.
- Address any feedback from evaluation.`
  },

  // Column 69: Fairness, Bias, and Transparency
  {
    columnId: 'ethics_fairness_bias_transparency',
    generativePrompt: `ROLE: You are an AI/ML expert creating comprehensive glossary content.
TASK: Generate content for **[TERM]** focusing on: Fairness, Bias, and Transparency.
CONTEXT: Issues of fairness, bias, and transparency in AI systems
OUTPUT FORMAT: Write content in Markdown format.
CONSTRAINTS:
- Provide moderate detail (1-2 paragraphs or 5-7 bullet points).
- Ensure accuracy and clarity for important level content.
- Focus specifically on the aspect described in the column name.
- Use technical language appropriate for the audience level.`,
    
    evaluativePrompt: `ROLE: You are an AI content reviewer specializing in technical accuracy.
TASK: Evaluate the Fairness, Bias, and Transparency content for **[TERM]**.
OUTPUT FORMAT: Return JSON with "score" (1-10) and "feedback" string.
CONSTRAINTS:
- Check accuracy and completeness for Issues of fairness, bias, and transparency in AI systems.
- Verify appropriate detail level for important content.
- Assess clarity and technical correctness.
- Note any missing key points or inaccuracies.`,
    
    improvementPrompt: `ROLE: You are an AI writing assistant improving technical content.
TASK: Enhance the Fairness, Bias, and Transparency content for **[TERM]**.
OUTPUT FORMAT: Return only the improved content in the same format.
CONSTRAINTS:
- Maintain accuracy while improving clarity.
- Ensure completeness for Issues of fairness, bias, and transparency in AI systems.
- Keep within appropriate scope and detail level.
- Address any feedback from evaluation.`
  },

  // Column 70: Privacy and Security Concerns
  {
    columnId: 'ethics_privacy_security',
    generativePrompt: `ROLE: You are an AI/ML expert creating comprehensive glossary content.
TASK: Generate content for **[TERM]** focusing on: Privacy and Security Concerns.
CONTEXT: Privacy and security implications
OUTPUT FORMAT: Write content in Markdown format.
CONSTRAINTS:
- Provide moderate detail (1-2 paragraphs or 5-7 bullet points).
- Ensure accuracy and clarity for important level content.
- Focus specifically on the aspect described in the column name.
- Use technical language appropriate for the audience level.`,
    
    evaluativePrompt: `ROLE: You are an AI content reviewer specializing in technical accuracy.
TASK: Evaluate the Privacy and Security Concerns content for **[TERM]**.
OUTPUT FORMAT: Return JSON with "score" (1-10) and "feedback" string.
CONSTRAINTS:
- Check accuracy and completeness for Privacy and security implications.
- Verify appropriate detail level for important content.
- Assess clarity and technical correctness.
- Note any missing key points or inaccuracies.`,
    
    improvementPrompt: `ROLE: You are an AI writing assistant improving technical content.
TASK: Enhance the Privacy and Security Concerns content for **[TERM]**.
OUTPUT FORMAT: Return only the improved content in the same format.
CONSTRAINTS:
- Maintain accuracy while improving clarity.
- Ensure completeness for Privacy and security implications.
- Keep within appropriate scope and detail level.
- Address any feedback from evaluation.`
  },

  // Column 71: Best Practices for Responsible AI Development
  {
    columnId: 'ethics_best_practices',
    generativePrompt: `ROLE: You are an AI/ML expert creating comprehensive glossary content.
TASK: Generate content for **[TERM]** focusing on: Best Practices for Responsible AI Development.
CONTEXT: Guidelines for responsible AI development
OUTPUT FORMAT: Write content in Markdown format.
CONSTRAINTS:
- Provide moderate detail (1-2 paragraphs or 5-7 bullet points).
- Ensure accuracy and clarity for essential level content.
- Focus specifically on the aspect described in the column name.
- Use technical language appropriate for the audience level.`,
    
    evaluativePrompt: `ROLE: You are an AI content reviewer specializing in technical accuracy.
TASK: Evaluate the Best Practices for Responsible AI Development content for **[TERM]**.
OUTPUT FORMAT: Return JSON with "score" (1-10) and "feedback" string.
CONSTRAINTS:
- Check accuracy and completeness for Guidelines for responsible AI development.
- Verify appropriate detail level for essential content.
- Assess clarity and technical correctness.
- Note any missing key points or inaccuracies.`,
    
    improvementPrompt: `ROLE: You are an AI writing assistant improving technical content.
TASK: Enhance the Best Practices for Responsible AI Development content for **[TERM]**.
OUTPUT FORMAT: Return only the improved content in the same format.
CONSTRAINTS:
- Maintain accuracy while improving clarity.
- Ensure completeness for Guidelines for responsible AI development.
- Keep within appropriate scope and detail level.
- Address any feedback from evaluation.`
  },

  // Column 72: Case Studies or Examples of Ethical Concerns
  {
    columnId: 'ethics_case_studies',
    generativePrompt: `ROLE: You are an AI/ML expert creating comprehensive glossary content.
TASK: Generate content for **[TERM]** focusing on: Case Studies or Examples of Ethical Concerns.
CONTEXT: Real-world examples of ethical challenges
OUTPUT FORMAT: Write content in Markdown format.
CONSTRAINTS:
- Provide moderate detail (1-2 paragraphs or 5-7 bullet points).
- Ensure accuracy and clarity for supplementary level content.
- Focus specifically on the aspect described in the column name.
- Use technical language appropriate for the audience level.`,
    
    evaluativePrompt: `ROLE: You are an AI content reviewer specializing in technical accuracy.
TASK: Evaluate the Case Studies or Examples of Ethical Concerns content for **[TERM]**.
OUTPUT FORMAT: Return JSON with "score" (1-10) and "feedback" string.
CONSTRAINTS:
- Check accuracy and completeness for Real-world examples of ethical challenges.
- Verify appropriate detail level for supplementary content.
- Assess clarity and technical correctness.
- Note any missing key points or inaccuracies.`,
    
    improvementPrompt: `ROLE: You are an AI writing assistant improving technical content.
TASK: Enhance the Case Studies or Examples of Ethical Concerns content for **[TERM]**.
OUTPUT FORMAT: Return only the improved content in the same format.
CONSTRAINTS:
- Maintain accuracy while improving clarity.
- Ensure completeness for Real-world examples of ethical challenges.
- Keep within appropriate scope and detail level.
- Address any feedback from evaluation.`
  },

  // Column 73: Mitigation Strategies for Ethical Concerns
  {
    columnId: 'ethics_mitigation_strategies',
    generativePrompt: `ROLE: You are an AI/ML expert creating comprehensive glossary content.
TASK: Generate content for **[TERM]** focusing on: Mitigation Strategies for Ethical Concerns.
CONTEXT: Strategies to address and mitigate ethical concerns
OUTPUT FORMAT: Write content in Markdown format.
CONSTRAINTS:
- Provide moderate detail (1-2 paragraphs or 5-7 bullet points).
- Ensure accuracy and clarity for important level content.
- Focus specifically on the aspect described in the column name.
- Use technical language appropriate for the audience level.`,
    
    evaluativePrompt: `ROLE: You are an AI content reviewer specializing in technical accuracy.
TASK: Evaluate the Mitigation Strategies for Ethical Concerns content for **[TERM]**.
OUTPUT FORMAT: Return JSON with "score" (1-10) and "feedback" string.
CONSTRAINTS:
- Check accuracy and completeness for Strategies to address and mitigate ethical concerns.
- Verify appropriate detail level for important content.
- Assess clarity and technical correctness.
- Note any missing key points or inaccuracies.`,
    
    improvementPrompt: `ROLE: You are an AI writing assistant improving technical content.
TASK: Enhance the Mitigation Strategies for Ethical Concerns content for **[TERM]**.
OUTPUT FORMAT: Return only the improved content in the same format.
CONSTRAINTS:
- Maintain accuracy while improving clarity.
- Ensure completeness for Strategies to address and mitigate ethical concerns.
- Keep within appropriate scope and detail level.
- Address any feedback from evaluation.`
  },

  // Column 74: Long-Term Societal Impact
  {
    columnId: 'ethics_long_term_impact',
    generativePrompt: `ROLE: You are an AI/ML expert creating comprehensive glossary content.
TASK: Generate content for **[TERM]** focusing on: Long-Term Societal Impact.
CONTEXT: Long-term societal implications and considerations
OUTPUT FORMAT: Write content in Markdown format.
CONSTRAINTS:
- Provide moderate detail (1-2 paragraphs or 5-7 bullet points).
- Ensure accuracy and clarity for supplementary level content.
- Focus specifically on the aspect described in the column name.
- Use technical language appropriate for the audience level.`,
    
    evaluativePrompt: `ROLE: You are an AI content reviewer specializing in technical accuracy.
TASK: Evaluate the Long-Term Societal Impact content for **[TERM]**.
OUTPUT FORMAT: Return JSON with "score" (1-10) and "feedback" string.
CONSTRAINTS:
- Check accuracy and completeness for Long-term societal implications and considerations.
- Verify appropriate detail level for supplementary content.
- Assess clarity and technical correctness.
- Note any missing key points or inaccuracies.`,
    
    improvementPrompt: `ROLE: You are an AI writing assistant improving technical content.
TASK: Enhance the Long-Term Societal Impact content for **[TERM]**.
OUTPUT FORMAT: Return only the improved content in the same format.
CONSTRAINTS:
- Maintain accuracy while improving clarity.
- Ensure completeness for Long-term societal implications and considerations.
- Keep within appropriate scope and detail level.
- Address any feedback from evaluation.`
  },

  // Column 75: Interactive Element: Ethical Decision-Making Scenarios or Quizzes
  {
    columnId: 'ethics_interactive_scenarios',
    generativePrompt: `ROLE: You are an AI/ML expert creating comprehensive glossary content.
TASK: Generate content for **[TERM]** focusing on: Interactive Element: Ethical Decision-Making Scenarios or Quizzes.
CONTEXT: Interactive ethical scenarios and decision-making exercises
OUTPUT FORMAT: Provide interactive content specification in markdown format.
CONSTRAINTS:
- Provide moderate detail (1-2 paragraphs or 5-7 bullet points).
- Ensure accuracy and clarity for advanced level content.
- Focus specifically on the aspect described in the column name.
- Use technical language appropriate for the audience level.`,
    
    evaluativePrompt: `ROLE: You are an AI content reviewer specializing in technical accuracy.
TASK: Evaluate the Interactive Element: Ethical Decision-Making Scenarios or Quizzes content for **[TERM]**.
OUTPUT FORMAT: Return JSON with "score" (1-10) and "feedback" string.
CONSTRAINTS:
- Check accuracy and completeness for Interactive ethical scenarios and decision-making exercises.
- Verify appropriate detail level for advanced content.
- Assess clarity and technical correctness.
- Note any missing key points or inaccuracies.`,
    
    improvementPrompt: `ROLE: You are an AI writing assistant improving technical content.
TASK: Enhance the Interactive Element: Ethical Decision-Making Scenarios or Quizzes content for **[TERM]**.
OUTPUT FORMAT: Return only the improved content in the same format.
CONSTRAINTS:
- Maintain accuracy while improving clarity.
- Ensure completeness for Interactive ethical scenarios and decision-making exercises.
- Keep within appropriate scope and detail level.
- Address any feedback from evaluation.`
  },

  // Column 76: Origin and Evolution
  {
    columnId: 'history_origin_evolution',
    generativePrompt: `ROLE: You are an AI/ML expert creating comprehensive glossary content.
TASK: Generate content for **[TERM]** focusing on: Origin and Evolution.
CONTEXT: The origin and evolution of the concept
OUTPUT FORMAT: Write content in Markdown format.
CONSTRAINTS:
- Provide moderate detail (1-2 paragraphs or 5-7 bullet points).
- Ensure accuracy and clarity for important level content.
- Focus specifically on the aspect described in the column name.
- Use technical language appropriate for the audience level.`,
    
    evaluativePrompt: `ROLE: You are an AI content reviewer specializing in technical accuracy.
TASK: Evaluate the Origin and Evolution content for **[TERM]**.
OUTPUT FORMAT: Return JSON with "score" (1-10) and "feedback" string.
CONSTRAINTS:
- Check accuracy and completeness for The origin and evolution of the concept.
- Verify appropriate detail level for important content.
- Assess clarity and technical correctness.
- Note any missing key points or inaccuracies.`,
    
    improvementPrompt: `ROLE: You are an AI writing assistant improving technical content.
TASK: Enhance the Origin and Evolution content for **[TERM]**.
OUTPUT FORMAT: Return only the improved content in the same format.
CONSTRAINTS:
- Maintain accuracy while improving clarity.
- Ensure completeness for The origin and evolution of the concept.
- Keep within appropriate scope and detail level.
- Address any feedback from evaluation.`
  },

  // Column 77: Significant Milestones or Breakthroughs
  {
    columnId: 'history_significant_milestones',
    generativePrompt: `ROLE: You are an AI/ML expert creating comprehensive glossary content.
TASK: Generate content for **[TERM]** focusing on: Significant Milestones or Breakthroughs.
CONTEXT: Key milestones and breakthroughs in development
OUTPUT FORMAT: Write content in Markdown format.
CONSTRAINTS:
- Provide moderate detail (1-2 paragraphs or 5-7 bullet points).
- Ensure accuracy and clarity for important level content.
- Focus specifically on the aspect described in the column name.
- Use technical language appropriate for the audience level.`,
    
    evaluativePrompt: `ROLE: You are an AI content reviewer specializing in technical accuracy.
TASK: Evaluate the Significant Milestones or Breakthroughs content for **[TERM]**.
OUTPUT FORMAT: Return JSON with "score" (1-10) and "feedback" string.
CONSTRAINTS:
- Check accuracy and completeness for Key milestones and breakthroughs in development.
- Verify appropriate detail level for important content.
- Assess clarity and technical correctness.
- Note any missing key points or inaccuracies.`,
    
    improvementPrompt: `ROLE: You are an AI writing assistant improving technical content.
TASK: Enhance the Significant Milestones or Breakthroughs content for **[TERM]**.
OUTPUT FORMAT: Return only the improved content in the same format.
CONSTRAINTS:
- Maintain accuracy while improving clarity.
- Ensure completeness for Key milestones and breakthroughs in development.
- Keep within appropriate scope and detail level.
- Address any feedback from evaluation.`
  },

  // Column 78: Key Contributors or Researchers
  {
    columnId: 'history_key_contributors',
    generativePrompt: `ROLE: You are an AI/ML expert creating comprehensive glossary content.
TASK: Generate content for **[TERM]** focusing on: Key Contributors or Researchers.
CONTEXT: Important researchers and contributors to the field
OUTPUT FORMAT: Write content in Markdown format.
CONSTRAINTS:
- Provide moderate detail (1-2 paragraphs or 5-7 bullet points).
- Ensure accuracy and clarity for supplementary level content.
- Focus specifically on the aspect described in the column name.
- Use technical language appropriate for the audience level.`,
    
    evaluativePrompt: `ROLE: You are an AI content reviewer specializing in technical accuracy.
TASK: Evaluate the Key Contributors or Researchers content for **[TERM]**.
OUTPUT FORMAT: Return JSON with "score" (1-10) and "feedback" string.
CONSTRAINTS:
- Check accuracy and completeness for Important researchers and contributors to the field.
- Verify appropriate detail level for supplementary content.
- Assess clarity and technical correctness.
- Note any missing key points or inaccuracies.`,
    
    improvementPrompt: `ROLE: You are an AI writing assistant improving technical content.
TASK: Enhance the Key Contributors or Researchers content for **[TERM]**.
OUTPUT FORMAT: Return only the improved content in the same format.
CONSTRAINTS:
- Maintain accuracy while improving clarity.
- Ensure completeness for Important researchers and contributors to the field.
- Keep within appropriate scope and detail level.
- Address any feedback from evaluation.`
  },

  // Column 79: Shifts in Paradigms or Approaches
  {
    columnId: 'history_paradigm_shifts',
    generativePrompt: `ROLE: You are an AI/ML expert creating comprehensive glossary content.
TASK: Generate content for **[TERM]** focusing on: Shifts in Paradigms or Approaches.
CONTEXT: Major paradigm shifts and changes in approach
OUTPUT FORMAT: Write content in Markdown format.
CONSTRAINTS:
- Provide moderate detail (1-2 paragraphs or 5-7 bullet points).
- Ensure accuracy and clarity for supplementary level content.
- Focus specifically on the aspect described in the column name.
- Use technical language appropriate for the audience level.`,
    
    evaluativePrompt: `ROLE: You are an AI content reviewer specializing in technical accuracy.
TASK: Evaluate the Shifts in Paradigms or Approaches content for **[TERM]**.
OUTPUT FORMAT: Return JSON with "score" (1-10) and "feedback" string.
CONSTRAINTS:
- Check accuracy and completeness for Major paradigm shifts and changes in approach.
- Verify appropriate detail level for supplementary content.
- Assess clarity and technical correctness.
- Note any missing key points or inaccuracies.`,
    
    improvementPrompt: `ROLE: You are an AI writing assistant improving technical content.
TASK: Enhance the Shifts in Paradigms or Approaches content for **[TERM]**.
OUTPUT FORMAT: Return only the improved content in the same format.
CONSTRAINTS:
- Maintain accuracy while improving clarity.
- Ensure completeness for Major paradigm shifts and changes in approach.
- Keep within appropriate scope and detail level.
- Address any feedback from evaluation.`
  },

  // Column 80: First Appearance or Proposal of the Concept
  {
    columnId: 'history_first_appearance',
    generativePrompt: `ROLE: You are an AI/ML expert creating comprehensive glossary content.
TASK: Generate content for **[TERM]** focusing on: First Appearance or Proposal of the Concept.
CONTEXT: When the concept was first proposed or appeared
OUTPUT FORMAT: Write content in Markdown format.
CONSTRAINTS:
- Keep it concise (2-4 sentences or 3-5 bullet points).
- Ensure accuracy and clarity for supplementary level content.
- Focus specifically on the aspect described in the column name.
- Use technical language appropriate for the audience level.`,
    
    evaluativePrompt: `ROLE: You are an AI content reviewer specializing in technical accuracy.
TASK: Evaluate the First Appearance or Proposal of the Concept content for **[TERM]**.
OUTPUT FORMAT: Return JSON with "score" (1-10) and "feedback" string.
CONSTRAINTS:
- Check accuracy and completeness for When the concept was first proposed or appeared.
- Verify appropriate detail level for supplementary content.
- Assess clarity and technical correctness.
- Note any missing key points or inaccuracies.`,
    
    improvementPrompt: `ROLE: You are an AI writing assistant improving technical content.
TASK: Enhance the First Appearance or Proposal of the Concept content for **[TERM]**.
OUTPUT FORMAT: Return only the improved content in the same format.
CONSTRAINTS:
- Maintain accuracy while improving clarity.
- Ensure completeness for When the concept was first proposed or appeared.
- Keep within appropriate scope and detail level.
- Address any feedback from evaluation.`
  },

  // Column 81: Landmark Papers or Publications
  {
    columnId: 'history_landmark_papers',
    generativePrompt: `ROLE: You are an AI/ML expert creating comprehensive glossary content.
TASK: Generate content for **[TERM]** focusing on: Landmark Papers or Publications.
CONTEXT: Important papers and publications with dates
OUTPUT FORMAT: Provide a markdown unordered list.
CONSTRAINTS:
- Keep it concise (2-4 sentences or 3-5 bullet points).
- Ensure accuracy and clarity for supplementary level content.
- Focus specifically on the aspect described in the column name.
- Use technical language appropriate for the audience level.`,
    
    evaluativePrompt: `ROLE: You are an AI content reviewer specializing in technical accuracy.
TASK: Evaluate the Landmark Papers or Publications content for **[TERM]**.
OUTPUT FORMAT: Return JSON with "score" (1-10) and "feedback" string.
CONSTRAINTS:
- Check accuracy and completeness for Important papers and publications with dates.
- Verify appropriate detail level for supplementary content.
- Assess clarity and technical correctness.
- Note any missing key points or inaccuracies.`,
    
    improvementPrompt: `ROLE: You are an AI writing assistant improving technical content.
TASK: Enhance the Landmark Papers or Publications content for **[TERM]**.
OUTPUT FORMAT: Return only the improved content in the same format.
CONSTRAINTS:
- Maintain accuracy while improving clarity.
- Ensure completeness for Important papers and publications with dates.
- Keep within appropriate scope and detail level.
- Address any feedback from evaluation.`
  },

  // Column 82: Significant Conferences or Events
  {
    columnId: 'history_significant_conferences',
    generativePrompt: `ROLE: You are an AI/ML expert creating comprehensive glossary content.
TASK: Generate content for **[TERM]** focusing on: Significant Conferences or Events.
CONTEXT: Important conferences and events in the field
OUTPUT FORMAT: Provide a markdown unordered list.
CONSTRAINTS:
- Keep it concise (2-4 sentences or 3-5 bullet points).
- Ensure accuracy and clarity for supplementary level content.
- Focus specifically on the aspect described in the column name.
- Use technical language appropriate for the audience level.`,
    
    evaluativePrompt: `ROLE: You are an AI content reviewer specializing in technical accuracy.
TASK: Evaluate the Significant Conferences or Events content for **[TERM]**.
OUTPUT FORMAT: Return JSON with "score" (1-10) and "feedback" string.
CONSTRAINTS:
- Check accuracy and completeness for Important conferences and events in the field.
- Verify appropriate detail level for supplementary content.
- Assess clarity and technical correctness.
- Note any missing key points or inaccuracies.`,
    
    improvementPrompt: `ROLE: You are an AI writing assistant improving technical content.
TASK: Enhance the Significant Conferences or Events content for **[TERM]**.
OUTPUT FORMAT: Return only the improved content in the same format.
CONSTRAINTS:
- Maintain accuracy while improving clarity.
- Ensure completeness for Important conferences and events in the field.
- Keep within appropriate scope and detail level.
- Address any feedback from evaluation.`
  },

  // Column 83: Key Implementations or Applications
  {
    columnId: 'history_key_implementations',
    generativePrompt: `ROLE: You are an AI/ML expert creating comprehensive glossary content.
TASK: Generate content for **[TERM]** focusing on: Key Implementations or Applications.
CONTEXT: Notable implementations and applications with dates
OUTPUT FORMAT: Provide a markdown unordered list.
CONSTRAINTS:
- Keep it concise (2-4 sentences or 3-5 bullet points).
- Ensure accuracy and clarity for supplementary level content.
- Focus specifically on the aspect described in the column name.
- Use technical language appropriate for the audience level.`,
    
    evaluativePrompt: `ROLE: You are an AI content reviewer specializing in technical accuracy.
TASK: Evaluate the Key Implementations or Applications content for **[TERM]**.
OUTPUT FORMAT: Return JSON with "score" (1-10) and "feedback" string.
CONSTRAINTS:
- Check accuracy and completeness for Notable implementations and applications with dates.
- Verify appropriate detail level for supplementary content.
- Assess clarity and technical correctness.
- Note any missing key points or inaccuracies.`,
    
    improvementPrompt: `ROLE: You are an AI writing assistant improving technical content.
TASK: Enhance the Key Implementations or Applications content for **[TERM]**.
OUTPUT FORMAT: Return only the improved content in the same format.
CONSTRAINTS:
- Maintain accuracy while improving clarity.
- Ensure completeness for Notable implementations and applications with dates.
- Keep within appropriate scope and detail level.
- Address any feedback from evaluation.`
  },

  // Column 84: Impact on the AI/ML Research Community
  {
    columnId: 'history_research_impact',
    generativePrompt: `ROLE: You are an AI/ML expert creating comprehensive glossary content.
TASK: Generate content for **[TERM]** focusing on: Impact on the AI/ML Research Community.
CONTEXT: How this concept impacted AI/ML research
OUTPUT FORMAT: Write content in Markdown format.
CONSTRAINTS:
- Provide moderate detail (1-2 paragraphs or 5-7 bullet points).
- Ensure accuracy and clarity for supplementary level content.
- Focus specifically on the aspect described in the column name.
- Use technical language appropriate for the audience level.`,
    
    evaluativePrompt: `ROLE: You are an AI content reviewer specializing in technical accuracy.
TASK: Evaluate the Impact on the AI/ML Research Community content for **[TERM]**.
OUTPUT FORMAT: Return JSON with "score" (1-10) and "feedback" string.
CONSTRAINTS:
- Check accuracy and completeness for How this concept impacted AI/ML research.
- Verify appropriate detail level for supplementary content.
- Assess clarity and technical correctness.
- Note any missing key points or inaccuracies.`,
    
    improvementPrompt: `ROLE: You are an AI writing assistant improving technical content.
TASK: Enhance the Impact on the AI/ML Research Community content for **[TERM]**.
OUTPUT FORMAT: Return only the improved content in the same format.
CONSTRAINTS:
- Maintain accuracy while improving clarity.
- Ensure completeness for How this concept impacted AI/ML research.
- Keep within appropriate scope and detail level.
- Address any feedback from evaluation.`
  },

  // Column 85: Future Outlook and Potential Developments
  {
    columnId: 'history_future_outlook',
    generativePrompt: `ROLE: You are an AI/ML expert creating comprehensive glossary content.
TASK: Generate content for **[TERM]** focusing on: Future Outlook and Potential Developments.
CONTEXT: Future possibilities based on historical trends
OUTPUT FORMAT: Write content in Markdown format.
CONSTRAINTS:
- Provide moderate detail (1-2 paragraphs or 5-7 bullet points).
- Ensure accuracy and clarity for supplementary level content.
- Focus specifically on the aspect described in the column name.
- Use technical language appropriate for the audience level.`,
    
    evaluativePrompt: `ROLE: You are an AI content reviewer specializing in technical accuracy.
TASK: Evaluate the Future Outlook and Potential Developments content for **[TERM]**.
OUTPUT FORMAT: Return JSON with "score" (1-10) and "feedback" string.
CONSTRAINTS:
- Check accuracy and completeness for Future possibilities based on historical trends.
- Verify appropriate detail level for supplementary content.
- Assess clarity and technical correctness.
- Note any missing key points or inaccuracies.`,
    
    improvementPrompt: `ROLE: You are an AI writing assistant improving technical content.
TASK: Enhance the Future Outlook and Potential Developments content for **[TERM]**.
OUTPUT FORMAT: Return only the improved content in the same format.
CONSTRAINTS:
- Maintain accuracy while improving clarity.
- Ensure completeness for Future possibilities based on historical trends.
- Keep within appropriate scope and detail level.
- Address any feedback from evaluation.`
  },

  // Column 86: Interactive Element: Timeline Diagrams
  {
    columnId: 'history_interactive_timeline',
    generativePrompt: `ROLE: You are an AI/ML expert creating comprehensive glossary content.
TASK: Generate content for **[TERM]** focusing on: Interactive Element: Timeline Diagrams.
CONTEXT: Interactive timeline visualization of historical events
OUTPUT FORMAT: Provide interactive content specification in markdown format.
CONSTRAINTS:
- Provide moderate detail (1-2 paragraphs or 5-7 bullet points).
- Ensure accuracy and clarity for advanced level content.
- Focus specifically on the aspect described in the column name.
- Use technical language appropriate for the audience level.`,
    
    evaluativePrompt: `ROLE: You are an AI content reviewer specializing in technical accuracy.
TASK: Evaluate the Interactive Element: Timeline Diagrams content for **[TERM]**.
OUTPUT FORMAT: Return JSON with "score" (1-10) and "feedback" string.
CONSTRAINTS:
- Check accuracy and completeness for Interactive timeline visualization of historical events.
- Verify appropriate detail level for advanced content.
- Assess clarity and technical correctness.
- Note any missing key points or inaccuracies.`,
    
    improvementPrompt: `ROLE: You are an AI writing assistant improving technical content.
TASK: Enhance the Interactive Element: Timeline Diagrams content for **[TERM]**.
OUTPUT FORMAT: Return only the improved content in the same format.
CONSTRAINTS:
- Maintain accuracy while improving clarity.
- Ensure completeness for Interactive timeline visualization of historical events.
- Keep within appropriate scope and detail level.
- Address any feedback from evaluation.`
  },

  // Column 87: Visual Representation of the Concept
  {
    columnId: 'illustration_visual_representation',
    generativePrompt: `ROLE: You are an AI/ML expert creating comprehensive glossary content.
TASK: Generate content for **[TERM]** focusing on: Visual Representation of the Concept.
CONTEXT: Visual diagram or illustration of the concept
OUTPUT FORMAT: Write content in Markdown format.
CONSTRAINTS:
- Provide moderate detail (1-2 paragraphs or 5-7 bullet points).
- Ensure accuracy and clarity for important level content.
- Focus specifically on the aspect described in the column name.
- Use technical language appropriate for the audience level.`,
    
    evaluativePrompt: `ROLE: You are an AI content reviewer specializing in technical accuracy.
TASK: Evaluate the Visual Representation of the Concept content for **[TERM]**.
OUTPUT FORMAT: Return JSON with "score" (1-10) and "feedback" string.
CONSTRAINTS:
- Check accuracy and completeness for Visual diagram or illustration of the concept.
- Verify appropriate detail level for important content.
- Assess clarity and technical correctness.
- Note any missing key points or inaccuracies.`,
    
    improvementPrompt: `ROLE: You are an AI writing assistant improving technical content.
TASK: Enhance the Visual Representation of the Concept content for **[TERM]**.
OUTPUT FORMAT: Return only the improved content in the same format.
CONSTRAINTS:
- Maintain accuracy while improving clarity.
- Ensure completeness for Visual diagram or illustration of the concept.
- Keep within appropriate scope and detail level.
- Address any feedback from evaluation.`
  },

  // Column 88: Flowcharts or Process Diagrams
  {
    columnId: 'illustration_flowcharts_process',
    generativePrompt: `ROLE: You are an AI/ML expert creating comprehensive glossary content.
TASK: Generate content for **[TERM]** focusing on: Flowcharts or Process Diagrams.
CONTEXT: Process flow diagrams and flowcharts
OUTPUT FORMAT: Write content in Markdown format.
CONSTRAINTS:
- Provide moderate detail (1-2 paragraphs or 5-7 bullet points).
- Ensure accuracy and clarity for important level content.
- Focus specifically on the aspect described in the column name.
- Use technical language appropriate for the audience level.`,
    
    evaluativePrompt: `ROLE: You are an AI content reviewer specializing in technical accuracy.
TASK: Evaluate the Flowcharts or Process Diagrams content for **[TERM]**.
OUTPUT FORMAT: Return JSON with "score" (1-10) and "feedback" string.
CONSTRAINTS:
- Check accuracy and completeness for Process flow diagrams and flowcharts.
- Verify appropriate detail level for important content.
- Assess clarity and technical correctness.
- Note any missing key points or inaccuracies.`,
    
    improvementPrompt: `ROLE: You are an AI writing assistant improving technical content.
TASK: Enhance the Flowcharts or Process Diagrams content for **[TERM]**.
OUTPUT FORMAT: Return only the improved content in the same format.
CONSTRAINTS:
- Maintain accuracy while improving clarity.
- Ensure completeness for Process flow diagrams and flowcharts.
- Keep within appropriate scope and detail level.
- Address any feedback from evaluation.`
  },

  // Column 89: Architectural or Model Schemas
  {
    columnId: 'illustration_architectural_schemas',
    generativePrompt: `ROLE: You are an AI/ML expert creating comprehensive glossary content.
TASK: Generate content for **[TERM]** focusing on: Architectural or Model Schemas.
CONTEXT: Architectural diagrams and model schemas
OUTPUT FORMAT: Write content in Markdown format.
CONSTRAINTS:
- Provide moderate detail (1-2 paragraphs or 5-7 bullet points).
- Ensure accuracy and clarity for important level content.
- Focus specifically on the aspect described in the column name.
- Use technical language appropriate for the audience level.`,
    
    evaluativePrompt: `ROLE: You are an AI content reviewer specializing in technical accuracy.
TASK: Evaluate the Architectural or Model Schemas content for **[TERM]**.
OUTPUT FORMAT: Return JSON with "score" (1-10) and "feedback" string.
CONSTRAINTS:
- Check accuracy and completeness for Architectural diagrams and model schemas.
- Verify appropriate detail level for important content.
- Assess clarity and technical correctness.
- Note any missing key points or inaccuracies.`,
    
    improvementPrompt: `ROLE: You are an AI writing assistant improving technical content.
TASK: Enhance the Architectural or Model Schemas content for **[TERM]**.
OUTPUT FORMAT: Return only the improved content in the same format.
CONSTRAINTS:
- Maintain accuracy while improving clarity.
- Ensure completeness for Architectural diagrams and model schemas.
- Keep within appropriate scope and detail level.
- Address any feedback from evaluation.`
  },

  // Column 90: Interactive or Dynamic Visualizations
  {
    columnId: 'illustration_interactive_dynamic',
    generativePrompt: `ROLE: You are an AI/ML expert creating comprehensive glossary content.
TASK: Generate content for **[TERM]** focusing on: Interactive or Dynamic Visualizations.
CONTEXT: Dynamic and interactive visualizations
OUTPUT FORMAT: Provide interactive content specification in markdown format.
CONSTRAINTS:
- Provide moderate detail (1-2 paragraphs or 5-7 bullet points).
- Ensure accuracy and clarity for advanced level content.
- Focus specifically on the aspect described in the column name.
- Use technical language appropriate for the audience level.`,
    
    evaluativePrompt: `ROLE: You are an AI content reviewer specializing in technical accuracy.
TASK: Evaluate the Interactive or Dynamic Visualizations content for **[TERM]**.
OUTPUT FORMAT: Return JSON with "score" (1-10) and "feedback" string.
CONSTRAINTS:
- Check accuracy and completeness for Dynamic and interactive visualizations.
- Verify appropriate detail level for advanced content.
- Assess clarity and technical correctness.
- Note any missing key points or inaccuracies.`,
    
    improvementPrompt: `ROLE: You are an AI writing assistant improving technical content.
TASK: Enhance the Interactive or Dynamic Visualizations content for **[TERM]**.
OUTPUT FORMAT: Return only the improved content in the same format.
CONSTRAINTS:
- Maintain accuracy while improving clarity.
- Ensure completeness for Dynamic and interactive visualizations.
- Keep within appropriate scope and detail level.
- Address any feedback from evaluation.`
  },

  // Column 91: Interactive Element: Mermaid Diagrams, UML Diagrams, or Interactive Models
  {
    columnId: 'illustration_interactive_models',
    generativePrompt: `ROLE: You are an AI/ML expert creating comprehensive glossary content.
TASK: Generate content for **[TERM]** focusing on: Interactive Element: Mermaid Diagrams, UML Diagrams, or Interactive Models.
CONTEXT: Interactive diagram tools and model visualizations
OUTPUT FORMAT: Provide interactive content specification in markdown format.
CONSTRAINTS:
- Provide moderate detail (1-2 paragraphs or 5-7 bullet points).
- Ensure accuracy and clarity for advanced level content.
- Focus specifically on the aspect described in the column name.
- Use technical language appropriate for the audience level.`,
    
    evaluativePrompt: `ROLE: You are an AI content reviewer specializing in technical accuracy.
TASK: Evaluate the Interactive Element: Mermaid Diagrams, UML Diagrams, or Interactive Models content for **[TERM]**.
OUTPUT FORMAT: Return JSON with "score" (1-10) and "feedback" string.
CONSTRAINTS:
- Check accuracy and completeness for Interactive diagram tools and model visualizations.
- Verify appropriate detail level for advanced content.
- Assess clarity and technical correctness.
- Note any missing key points or inaccuracies.`,
    
    improvementPrompt: `ROLE: You are an AI writing assistant improving technical content.
TASK: Enhance the Interactive Element: Mermaid Diagrams, UML Diagrams, or Interactive Models content for **[TERM]**.
OUTPUT FORMAT: Return only the improved content in the same format.
CONSTRAINTS:
- Maintain accuracy while improving clarity.
- Ensure completeness for Interactive diagram tools and model visualizations.
- Keep within appropriate scope and detail level.
- Address any feedback from evaluation.`
  },

  // Column 92: Connection to Other AI/ML Terms or Topics
  {
    columnId: 'related_connection_other_terms',
    generativePrompt: `ROLE: You are an AI/ML expert creating comprehensive glossary content.
TASK: Generate content for **[TERM]** focusing on: Connection to Other AI/ML Terms or Topics.
CONTEXT: How this term connects to other AI/ML concepts
OUTPUT FORMAT: Write content in Markdown format.
CONSTRAINTS:
- Provide moderate detail (1-2 paragraphs or 5-7 bullet points).
- Ensure accuracy and clarity for important level content.
- Focus specifically on the aspect described in the column name.
- Use technical language appropriate for the audience level.`,
    
    evaluativePrompt: `ROLE: You are an AI content reviewer specializing in technical accuracy.
TASK: Evaluate the Connection to Other AI/ML Terms or Topics content for **[TERM]**.
OUTPUT FORMAT: Return JSON with "score" (1-10) and "feedback" string.
CONSTRAINTS:
- Check accuracy and completeness for How this term connects to other AI/ML concepts.
- Verify appropriate detail level for important content.
- Assess clarity and technical correctness.
- Note any missing key points or inaccuracies.`,
    
    improvementPrompt: `ROLE: You are an AI writing assistant improving technical content.
TASK: Enhance the Connection to Other AI/ML Terms or Topics content for **[TERM]**.
OUTPUT FORMAT: Return only the improved content in the same format.
CONSTRAINTS:
- Maintain accuracy while improving clarity.
- Ensure completeness for How this term connects to other AI/ML concepts.
- Keep within appropriate scope and detail level.
- Address any feedback from evaluation.`
  },

  // Column 93: Similarities and Differences
  {
    columnId: 'related_similarities_differences',
    generativePrompt: `ROLE: You are an AI/ML expert creating comprehensive glossary content.
TASK: Generate content for **[TERM]** focusing on: Similarities and Differences.
CONTEXT: Key similarities and differences with related concepts
OUTPUT FORMAT: Write content in Markdown format.
CONSTRAINTS:
- Provide moderate detail (1-2 paragraphs or 5-7 bullet points).
- Ensure accuracy and clarity for important level content.
- Focus specifically on the aspect described in the column name.
- Use technical language appropriate for the audience level.`,
    
    evaluativePrompt: `ROLE: You are an AI content reviewer specializing in technical accuracy.
TASK: Evaluate the Similarities and Differences content for **[TERM]**.
OUTPUT FORMAT: Return JSON with "score" (1-10) and "feedback" string.
CONSTRAINTS:
- Check accuracy and completeness for Key similarities and differences with related concepts.
- Verify appropriate detail level for important content.
- Assess clarity and technical correctness.
- Note any missing key points or inaccuracies.`,
    
    improvementPrompt: `ROLE: You are an AI writing assistant improving technical content.
TASK: Enhance the Similarities and Differences content for **[TERM]**.
OUTPUT FORMAT: Return only the improved content in the same format.
CONSTRAINTS:
- Maintain accuracy while improving clarity.
- Ensure completeness for Key similarities and differences with related concepts.
- Keep within appropriate scope and detail level.
- Address any feedback from evaluation.`
  },

  // Column 94: Hybrid or Ensemble Approaches
  {
    columnId: 'related_hybrid_ensemble',
    generativePrompt: `ROLE: You are an AI/ML expert creating comprehensive glossary content.
TASK: Generate content for **[TERM]** focusing on: Hybrid or Ensemble Approaches.
CONTEXT: Hybrid and ensemble approaches combining concepts
OUTPUT FORMAT: Write content in Markdown format.
CONSTRAINTS:
- Provide moderate detail (1-2 paragraphs or 5-7 bullet points).
- Ensure accuracy and clarity for supplementary level content.
- Focus specifically on the aspect described in the column name.
- Use technical language appropriate for the audience level.`,
    
    evaluativePrompt: `ROLE: You are an AI content reviewer specializing in technical accuracy.
TASK: Evaluate the Hybrid or Ensemble Approaches content for **[TERM]**.
OUTPUT FORMAT: Return JSON with "score" (1-10) and "feedback" string.
CONSTRAINTS:
- Check accuracy and completeness for Hybrid and ensemble approaches combining concepts.
- Verify appropriate detail level for supplementary content.
- Assess clarity and technical correctness.
- Note any missing key points or inaccuracies.`,
    
    improvementPrompt: `ROLE: You are an AI writing assistant improving technical content.
TASK: Enhance the Hybrid or Ensemble Approaches content for **[TERM]**.
OUTPUT FORMAT: Return only the improved content in the same format.
CONSTRAINTS:
- Maintain accuracy while improving clarity.
- Ensure completeness for Hybrid and ensemble approaches combining concepts.
- Keep within appropriate scope and detail level.
- Address any feedback from evaluation.`
  },

  // Column 95: Prerequisites or Foundational Topics
  {
    columnId: 'related_prerequisites_foundational',
    generativePrompt: `ROLE: You are an AI/ML expert creating comprehensive glossary content.
TASK: Generate content for **[TERM]** focusing on: Prerequisites or Foundational Topics.
CONTEXT: Prerequisite and foundational concepts
OUTPUT FORMAT: Provide a markdown unordered list.
CONSTRAINTS:
- Keep it concise (2-4 sentences or 3-5 bullet points).
- Ensure accuracy and clarity for important level content.
- Focus specifically on the aspect described in the column name.
- Use technical language appropriate for the audience level.`,
    
    evaluativePrompt: `ROLE: You are an AI content reviewer specializing in technical accuracy.
TASK: Evaluate the Prerequisites or Foundational Topics content for **[TERM]**.
OUTPUT FORMAT: Return JSON with "score" (1-10) and "feedback" string.
CONSTRAINTS:
- Check accuracy and completeness for Prerequisite and foundational concepts.
- Verify appropriate detail level for important content.
- Assess clarity and technical correctness.
- Note any missing key points or inaccuracies.`,
    
    improvementPrompt: `ROLE: You are an AI writing assistant improving technical content.
TASK: Enhance the Prerequisites or Foundational Topics content for **[TERM]**.
OUTPUT FORMAT: Return only the improved content in the same format.
CONSTRAINTS:
- Maintain accuracy while improving clarity.
- Ensure completeness for Prerequisite and foundational concepts.
- Keep within appropriate scope and detail level.
- Address any feedback from evaluation.`
  },

  // Column 96: Related or Complementary Techniques
  {
    columnId: 'related_complementary_techniques',
    generativePrompt: `ROLE: You are an AI/ML expert creating comprehensive glossary content.
TASK: Generate content for **[TERM]** focusing on: Related or Complementary Techniques.
CONTEXT: Related and complementary techniques
OUTPUT FORMAT: Provide a markdown unordered list.
CONSTRAINTS:
- Provide moderate detail (1-2 paragraphs or 5-7 bullet points).
- Ensure accuracy and clarity for important level content.
- Focus specifically on the aspect described in the column name.
- Use technical language appropriate for the audience level.`,
    
    evaluativePrompt: `ROLE: You are an AI content reviewer specializing in technical accuracy.
TASK: Evaluate the Related or Complementary Techniques content for **[TERM]**.
OUTPUT FORMAT: Return JSON with "score" (1-10) and "feedback" string.
CONSTRAINTS:
- Check accuracy and completeness for Related and complementary techniques.
- Verify appropriate detail level for important content.
- Assess clarity and technical correctness.
- Note any missing key points or inaccuracies.`,
    
    improvementPrompt: `ROLE: You are an AI writing assistant improving technical content.
TASK: Enhance the Related or Complementary Techniques content for **[TERM]**.
OUTPUT FORMAT: Return only the improved content in the same format.
CONSTRAINTS:
- Maintain accuracy while improving clarity.
- Ensure completeness for Related and complementary techniques.
- Keep within appropriate scope and detail level.
- Address any feedback from evaluation.`
  },

  // Column 97: Contrasting or Alternative Approaches
  {
    columnId: 'related_contrasting_approaches',
    generativePrompt: `ROLE: You are an AI/ML expert creating comprehensive glossary content.
TASK: Generate content for **[TERM]** focusing on: Contrasting or Alternative Approaches.
CONTEXT: Alternative and contrasting approaches
OUTPUT FORMAT: Provide a markdown unordered list.
CONSTRAINTS:
- Provide moderate detail (1-2 paragraphs or 5-7 bullet points).
- Ensure accuracy and clarity for supplementary level content.
- Focus specifically on the aspect described in the column name.
- Use technical language appropriate for the audience level.`,
    
    evaluativePrompt: `ROLE: You are an AI content reviewer specializing in technical accuracy.
TASK: Evaluate the Contrasting or Alternative Approaches content for **[TERM]**.
OUTPUT FORMAT: Return JSON with "score" (1-10) and "feedback" string.
CONSTRAINTS:
- Check accuracy and completeness for Alternative and contrasting approaches.
- Verify appropriate detail level for supplementary content.
- Assess clarity and technical correctness.
- Note any missing key points or inaccuracies.`,
    
    improvementPrompt: `ROLE: You are an AI writing assistant improving technical content.
TASK: Enhance the Contrasting or Alternative Approaches content for **[TERM]**.
OUTPUT FORMAT: Return only the improved content in the same format.
CONSTRAINTS:
- Maintain accuracy while improving clarity.
- Ensure completeness for Alternative and contrasting approaches.
- Keep within appropriate scope and detail level.
- Address any feedback from evaluation.`
  },

  // Column 98: Interdisciplinary Connections
  {
    columnId: 'related_interdisciplinary_connections',
    generativePrompt: `ROLE: You are an AI/ML expert creating comprehensive glossary content.
TASK: Generate content for **[TERM]** focusing on: Interdisciplinary Connections.
CONTEXT: Connections to other fields like cognitive science, psychology, neuroscience
OUTPUT FORMAT: Write content in Markdown format.
CONSTRAINTS:
- Provide moderate detail (1-2 paragraphs or 5-7 bullet points).
- Ensure accuracy and clarity for supplementary level content.
- Focus specifically on the aspect described in the column name.
- Use technical language appropriate for the audience level.`,
    
    evaluativePrompt: `ROLE: You are an AI content reviewer specializing in technical accuracy.
TASK: Evaluate the Interdisciplinary Connections content for **[TERM]**.
OUTPUT FORMAT: Return JSON with "score" (1-10) and "feedback" string.
CONSTRAINTS:
- Check accuracy and completeness for Connections to other fields like cognitive science, psychology, neuroscience.
- Verify appropriate detail level for supplementary content.
- Assess clarity and technical correctness.
- Note any missing key points or inaccuracies.`,
    
    improvementPrompt: `ROLE: You are an AI writing assistant improving technical content.
TASK: Enhance the Interdisciplinary Connections content for **[TERM]**.
OUTPUT FORMAT: Return only the improved content in the same format.
CONSTRAINTS:
- Maintain accuracy while improving clarity.
- Ensure completeness for Connections to other fields like cognitive science, psychology, neuroscience.
- Keep within appropriate scope and detail level.
- Address any feedback from evaluation.`
  },

  // Column 99: Interdisciplinary Applications and Cross-pollination
  {
    columnId: 'related_interdisciplinary_applications',
    generativePrompt: `ROLE: You are an AI/ML expert creating comprehensive glossary content.
TASK: Generate content for **[TERM]** focusing on: Interdisciplinary Applications and Cross-pollination.
CONTEXT: Cross-disciplinary applications and influences
OUTPUT FORMAT: Write content in Markdown format.
CONSTRAINTS:
- Provide moderate detail (1-2 paragraphs or 5-7 bullet points).
- Ensure accuracy and clarity for supplementary level content.
- Focus specifically on the aspect described in the column name.
- Use technical language appropriate for the audience level.`,
    
    evaluativePrompt: `ROLE: You are an AI content reviewer specializing in technical accuracy.
TASK: Evaluate the Interdisciplinary Applications and Cross-pollination content for **[TERM]**.
OUTPUT FORMAT: Return JSON with "score" (1-10) and "feedback" string.
CONSTRAINTS:
- Check accuracy and completeness for Cross-disciplinary applications and influences.
- Verify appropriate detail level for supplementary content.
- Assess clarity and technical correctness.
- Note any missing key points or inaccuracies.`,
    
    improvementPrompt: `ROLE: You are an AI writing assistant improving technical content.
TASK: Enhance the Interdisciplinary Applications and Cross-pollination content for **[TERM]**.
OUTPUT FORMAT: Return only the improved content in the same format.
CONSTRAINTS:
- Maintain accuracy while improving clarity.
- Ensure completeness for Cross-disciplinary applications and influences.
- Keep within appropriate scope and detail level.
- Address any feedback from evaluation.`
  },

  // Column 100: Influence of Non-Technical Fields
  {
    columnId: 'related_non_technical_influence',
    generativePrompt: `ROLE: You are an AI/ML expert creating comprehensive glossary content.
TASK: Generate content for **[TERM]** focusing on: Influence of Non-Technical Fields.
CONTEXT: How non-technical fields influence this concept
OUTPUT FORMAT: Write content in Markdown format.
CONSTRAINTS:
- Provide moderate detail (1-2 paragraphs or 5-7 bullet points).
- Ensure accuracy and clarity for supplementary level content.
- Focus specifically on the aspect described in the column name.
- Use technical language appropriate for the audience level.`,
    
    evaluativePrompt: `ROLE: You are an AI content reviewer specializing in technical accuracy.
TASK: Evaluate the Influence of Non-Technical Fields content for **[TERM]**.
OUTPUT FORMAT: Return JSON with "score" (1-10) and "feedback" string.
CONSTRAINTS:
- Check accuracy and completeness for How non-technical fields influence this concept.
- Verify appropriate detail level for supplementary content.
- Assess clarity and technical correctness.
- Note any missing key points or inaccuracies.`,
    
    improvementPrompt: `ROLE: You are an AI writing assistant improving technical content.
TASK: Enhance the Influence of Non-Technical Fields content for **[TERM]**.
OUTPUT FORMAT: Return only the improved content in the same format.
CONSTRAINTS:
- Maintain accuracy while improving clarity.
- Ensure completeness for How non-technical fields influence this concept.
- Keep within appropriate scope and detail level.
- Address any feedback from evaluation.`
  },

  // Column 101: Interactive Element: Concept Maps or Linked Interactive Diagrams
  {
    columnId: 'related_interactive_concept_maps',
    generativePrompt: `ROLE: You are an AI/ML expert creating comprehensive glossary content.
TASK: Generate content for **[TERM]** focusing on: Interactive Element: Concept Maps or Linked Interactive Diagrams.
CONTEXT: Interactive concept maps showing relationships
OUTPUT FORMAT: Provide interactive content specification in markdown format.
CONSTRAINTS:
- Provide moderate detail (1-2 paragraphs or 5-7 bullet points).
- Ensure accuracy and clarity for advanced level content.
- Focus specifically on the aspect described in the column name.
- Use technical language appropriate for the audience level.`,
    
    evaluativePrompt: `ROLE: You are an AI content reviewer specializing in technical accuracy.
TASK: Evaluate the Interactive Element: Concept Maps or Linked Interactive Diagrams content for **[TERM]**.
OUTPUT FORMAT: Return JSON with "score" (1-10) and "feedback" string.
CONSTRAINTS:
- Check accuracy and completeness for Interactive concept maps showing relationships.
- Verify appropriate detail level for advanced content.
- Assess clarity and technical correctness.
- Note any missing key points or inaccuracies.`,
    
    improvementPrompt: `ROLE: You are an AI writing assistant improving technical content.
TASK: Enhance the Interactive Element: Concept Maps or Linked Interactive Diagrams content for **[TERM]**.
OUTPUT FORMAT: Return only the improved content in the same format.
CONSTRAINTS:
- Maintain accuracy while improving clarity.
- Ensure completeness for Interactive concept maps showing relationships.
- Keep within appropriate scope and detail level.
- Address any feedback from evaluation.`
  },

  // Column 102: In-depth Analysis of Real-world Applications
  {
    columnId: 'case_studies_in_depth_analysis',
    generativePrompt: `ROLE: You are an AI/ML expert creating comprehensive glossary content.
TASK: Generate content for **[TERM]** focusing on: In-depth Analysis of Real-world Applications.
CONTEXT: Detailed analysis of real-world case studies
OUTPUT FORMAT: Write content in Markdown format.
CONSTRAINTS:
- Provide moderate detail (1-2 paragraphs or 5-7 bullet points).
- Ensure accuracy and clarity for important level content.
- Focus specifically on the aspect described in the column name.
- Use technical language appropriate for the audience level.`,
    
    evaluativePrompt: `ROLE: You are an AI content reviewer specializing in technical accuracy.
TASK: Evaluate the In-depth Analysis of Real-world Applications content for **[TERM]**.
OUTPUT FORMAT: Return JSON with "score" (1-10) and "feedback" string.
CONSTRAINTS:
- Check accuracy and completeness for Detailed analysis of real-world case studies.
- Verify appropriate detail level for important content.
- Assess clarity and technical correctness.
- Note any missing key points or inaccuracies.`,
    
    improvementPrompt: `ROLE: You are an AI writing assistant improving technical content.
TASK: Enhance the In-depth Analysis of Real-world Applications content for **[TERM]**.
OUTPUT FORMAT: Return only the improved content in the same format.
CONSTRAINTS:
- Maintain accuracy while improving clarity.
- Ensure completeness for Detailed analysis of real-world case studies.
- Keep within appropriate scope and detail level.
- Address any feedback from evaluation.`
  },

  // Column 103: Success Stories and Lessons Learned
  {
    columnId: 'case_studies_success_stories',
    generativePrompt: `ROLE: You are an AI/ML expert creating comprehensive glossary content.
TASK: Generate content for **[TERM]** focusing on: Success Stories and Lessons Learned.
CONTEXT: Successful implementations and key lessons
OUTPUT FORMAT: Write content in Markdown format.
CONSTRAINTS:
- Provide moderate detail (1-2 paragraphs or 5-7 bullet points).
- Ensure accuracy and clarity for important level content.
- Focus specifically on the aspect described in the column name.
- Use technical language appropriate for the audience level.`,
    
    evaluativePrompt: `ROLE: You are an AI content reviewer specializing in technical accuracy.
TASK: Evaluate the Success Stories and Lessons Learned content for **[TERM]**.
OUTPUT FORMAT: Return JSON with "score" (1-10) and "feedback" string.
CONSTRAINTS:
- Check accuracy and completeness for Successful implementations and key lessons.
- Verify appropriate detail level for important content.
- Assess clarity and technical correctness.
- Note any missing key points or inaccuracies.`,
    
    improvementPrompt: `ROLE: You are an AI writing assistant improving technical content.
TASK: Enhance the Success Stories and Lessons Learned content for **[TERM]**.
OUTPUT FORMAT: Return only the improved content in the same format.
CONSTRAINTS:
- Maintain accuracy while improving clarity.
- Ensure completeness for Successful implementations and key lessons.
- Keep within appropriate scope and detail level.
- Address any feedback from evaluation.`
  },

  // Column 104: Challenges and Solutions
  {
    columnId: 'case_studies_challenges_solutions',
    generativePrompt: `ROLE: You are an AI/ML expert creating comprehensive glossary content.
TASK: Generate content for **[TERM]** focusing on: Challenges and Solutions.
CONTEXT: Challenges faced and solutions implemented
OUTPUT FORMAT: Write content in Markdown format.
CONSTRAINTS:
- Provide moderate detail (1-2 paragraphs or 5-7 bullet points).
- Ensure accuracy and clarity for important level content.
- Focus specifically on the aspect described in the column name.
- Use technical language appropriate for the audience level.`,
    
    evaluativePrompt: `ROLE: You are an AI content reviewer specializing in technical accuracy.
TASK: Evaluate the Challenges and Solutions content for **[TERM]**.
OUTPUT FORMAT: Return JSON with "score" (1-10) and "feedback" string.
CONSTRAINTS:
- Check accuracy and completeness for Challenges faced and solutions implemented.
- Verify appropriate detail level for important content.
- Assess clarity and technical correctness.
- Note any missing key points or inaccuracies.`,
    
    improvementPrompt: `ROLE: You are an AI writing assistant improving technical content.
TASK: Enhance the Challenges and Solutions content for **[TERM]**.
OUTPUT FORMAT: Return only the improved content in the same format.
CONSTRAINTS:
- Maintain accuracy while improving clarity.
- Ensure completeness for Challenges faced and solutions implemented.
- Keep within appropriate scope and detail level.
- Address any feedback from evaluation.`
  },

  // Column 105: Insights and Takeaways
  {
    columnId: 'case_studies_insights_takeaways',
    generativePrompt: `ROLE: You are an AI/ML expert creating comprehensive glossary content.
TASK: Generate content for **[TERM]** focusing on: Insights and Takeaways.
CONTEXT: Key insights and takeaways from case studies
OUTPUT FORMAT: Write content in Markdown format.
CONSTRAINTS:
- Provide moderate detail (1-2 paragraphs or 5-7 bullet points).
- Ensure accuracy and clarity for important level content.
- Focus specifically on the aspect described in the column name.
- Use technical language appropriate for the audience level.`,
    
    evaluativePrompt: `ROLE: You are an AI content reviewer specializing in technical accuracy.
TASK: Evaluate the Insights and Takeaways content for **[TERM]**.
OUTPUT FORMAT: Return JSON with "score" (1-10) and "feedback" string.
CONSTRAINTS:
- Check accuracy and completeness for Key insights and takeaways from case studies.
- Verify appropriate detail level for important content.
- Assess clarity and technical correctness.
- Note any missing key points or inaccuracies.`,
    
    improvementPrompt: `ROLE: You are an AI writing assistant improving technical content.
TASK: Enhance the Insights and Takeaways content for **[TERM]**.
OUTPUT FORMAT: Return only the improved content in the same format.
CONSTRAINTS:
- Maintain accuracy while improving clarity.
- Ensure completeness for Key insights and takeaways from case studies.
- Keep within appropriate scope and detail level.
- Address any feedback from evaluation.`
  },

  // Column 106: Limitations or Drawbacks Encountered
  {
    columnId: 'case_studies_limitations_drawbacks',
    generativePrompt: `ROLE: You are an AI/ML expert creating comprehensive glossary content.
TASK: Generate content for **[TERM]** focusing on: Limitations or Drawbacks Encountered.
CONTEXT: Real-world limitations and drawbacks discovered
OUTPUT FORMAT: Write content in Markdown format.
CONSTRAINTS:
- Provide moderate detail (1-2 paragraphs or 5-7 bullet points).
- Ensure accuracy and clarity for supplementary level content.
- Focus specifically on the aspect described in the column name.
- Use technical language appropriate for the audience level.`,
    
    evaluativePrompt: `ROLE: You are an AI content reviewer specializing in technical accuracy.
TASK: Evaluate the Limitations or Drawbacks Encountered content for **[TERM]**.
OUTPUT FORMAT: Return JSON with "score" (1-10) and "feedback" string.
CONSTRAINTS:
- Check accuracy and completeness for Real-world limitations and drawbacks discovered.
- Verify appropriate detail level for supplementary content.
- Assess clarity and technical correctness.
- Note any missing key points or inaccuracies.`,
    
    improvementPrompt: `ROLE: You are an AI writing assistant improving technical content.
TASK: Enhance the Limitations or Drawbacks Encountered content for **[TERM]**.
OUTPUT FORMAT: Return only the improved content in the same format.
CONSTRAINTS:
- Maintain accuracy while improving clarity.
- Ensure completeness for Real-world limitations and drawbacks discovered.
- Keep within appropriate scope and detail level.
- Address any feedback from evaluation.`
  },

  // Column 107: Comparative Case Studies
  {
    columnId: 'case_studies_comparative',
    generativePrompt: `ROLE: You are an AI/ML expert creating comprehensive glossary content.
TASK: Generate content for **[TERM]** focusing on: Comparative Case Studies.
CONTEXT: Comparative analysis across multiple case studies
OUTPUT FORMAT: Write content in Markdown format.
CONSTRAINTS:
- Provide moderate detail (1-2 paragraphs or 5-7 bullet points).
- Ensure accuracy and clarity for advanced level content.
- Focus specifically on the aspect described in the column name.
- Use technical language appropriate for the audience level.`,
    
    evaluativePrompt: `ROLE: You are an AI content reviewer specializing in technical accuracy.
TASK: Evaluate the Comparative Case Studies content for **[TERM]**.
OUTPUT FORMAT: Return JSON with "score" (1-10) and "feedback" string.
CONSTRAINTS:
- Check accuracy and completeness for Comparative analysis across multiple case studies.
- Verify appropriate detail level for advanced content.
- Assess clarity and technical correctness.
- Note any missing key points or inaccuracies.`,
    
    improvementPrompt: `ROLE: You are an AI writing assistant improving technical content.
TASK: Enhance the Comparative Case Studies content for **[TERM]**.
OUTPUT FORMAT: Return only the improved content in the same format.
CONSTRAINTS:
- Maintain accuracy while improving clarity.
- Ensure completeness for Comparative analysis across multiple case studies.
- Keep within appropriate scope and detail level.
- Address any feedback from evaluation.`
  },

  // Column 108: Interactive Element: Detailed Case Study Walkthroughs
  {
    columnId: 'case_studies_interactive_walkthroughs',
    generativePrompt: `ROLE: You are an AI/ML expert creating comprehensive glossary content.
TASK: Generate content for **[TERM]** focusing on: Interactive Element: Detailed Case Study Walkthroughs.
CONTEXT: Interactive case study explorations
OUTPUT FORMAT: Provide interactive content specification in markdown format.
CONSTRAINTS:
- Provide comprehensive detail with multiple sections.
- Ensure accuracy and clarity for advanced level content.
- Focus specifically on the aspect described in the column name.
- Use technical language appropriate for the audience level.`,
    
    evaluativePrompt: `ROLE: You are an AI content reviewer specializing in technical accuracy.
TASK: Evaluate the Interactive Element: Detailed Case Study Walkthroughs content for **[TERM]**.
OUTPUT FORMAT: Return JSON with "score" (1-10) and "feedback" string.
CONSTRAINTS:
- Check accuracy and completeness for Interactive case study explorations.
- Verify appropriate detail level for advanced content.
- Assess clarity and technical correctness.
- Note any missing key points or inaccuracies.`,
    
    improvementPrompt: `ROLE: You are an AI writing assistant improving technical content.
TASK: Enhance the Interactive Element: Detailed Case Study Walkthroughs content for **[TERM]**.
OUTPUT FORMAT: Return only the improved content in the same format.
CONSTRAINTS:
- Maintain accuracy while improving clarity.
- Ensure completeness for Interactive case study explorations.
- Keep within appropriate scope and detail level.
- Address any feedback from evaluation.`
  },

  // Column 109: Key Research Papers or Publications
  {
    columnId: 'research_key_papers',
    generativePrompt: `ROLE: You are an AI/ML expert creating comprehensive glossary content.
TASK: Generate content for **[TERM]** focusing on: Key Research Papers or Publications.
CONTEXT: Essential research papers and publications
OUTPUT FORMAT: Provide a markdown unordered list.
CONSTRAINTS:
- Provide moderate detail (1-2 paragraphs or 5-7 bullet points).
- Ensure accuracy and clarity for important level content.
- Focus specifically on the aspect described in the column name.
- Use technical language appropriate for the audience level.`,
    
    evaluativePrompt: `ROLE: You are an AI content reviewer specializing in technical accuracy.
TASK: Evaluate the Key Research Papers or Publications content for **[TERM]**.
OUTPUT FORMAT: Return JSON with "score" (1-10) and "feedback" string.
CONSTRAINTS:
- Check accuracy and completeness for Essential research papers and publications.
- Verify appropriate detail level for important content.
- Assess clarity and technical correctness.
- Note any missing key points or inaccuracies.`,
    
    improvementPrompt: `ROLE: You are an AI writing assistant improving technical content.
TASK: Enhance the Key Research Papers or Publications content for **[TERM]**.
OUTPUT FORMAT: Return only the improved content in the same format.
CONSTRAINTS:
- Maintain accuracy while improving clarity.
- Ensure completeness for Essential research papers and publications.
- Keep within appropriate scope and detail level.
- Address any feedback from evaluation.`
  },

  // Column 110: Recent Advancements or State-of-the-Art
  {
    columnId: 'research_recent_advancements',
    generativePrompt: `ROLE: You are an AI/ML expert creating comprehensive glossary content.
TASK: Generate content for **[TERM]** focusing on: Recent Advancements or State-of-the-Art.
CONTEXT: Current state-of-the-art and recent developments
OUTPUT FORMAT: Write content in Markdown format.
CONSTRAINTS:
- Provide moderate detail (1-2 paragraphs or 5-7 bullet points).
- Ensure accuracy and clarity for important level content.
- Focus specifically on the aspect described in the column name.
- Use technical language appropriate for the audience level.`,
    
    evaluativePrompt: `ROLE: You are an AI content reviewer specializing in technical accuracy.
TASK: Evaluate the Recent Advancements or State-of-the-Art content for **[TERM]**.
OUTPUT FORMAT: Return JSON with "score" (1-10) and "feedback" string.
CONSTRAINTS:
- Check accuracy and completeness for Current state-of-the-art and recent developments.
- Verify appropriate detail level for important content.
- Assess clarity and technical correctness.
- Note any missing key points or inaccuracies.`,
    
    improvementPrompt: `ROLE: You are an AI writing assistant improving technical content.
TASK: Enhance the Recent Advancements or State-of-the-Art content for **[TERM]**.
OUTPUT FORMAT: Return only the improved content in the same format.
CONSTRAINTS:
- Maintain accuracy while improving clarity.
- Ensure completeness for Current state-of-the-art and recent developments.
- Keep within appropriate scope and detail level.
- Address any feedback from evaluation.`
  },

  // Column 111: Academic Papers or ArXiv Links
  {
    columnId: 'research_academic_links',
    generativePrompt: `ROLE: You are an AI/ML expert creating comprehensive glossary content.
TASK: Generate content for **[TERM]** focusing on: Academic Papers or ArXiv Links.
CONTEXT: Links to academic papers and preprints
OUTPUT FORMAT: Provide a markdown unordered list.
CONSTRAINTS:
- Keep it concise (2-4 sentences or 3-5 bullet points).
- Ensure accuracy and clarity for supplementary level content.
- Focus specifically on the aspect described in the column name.
- Use technical language appropriate for the audience level.`,
    
    evaluativePrompt: `ROLE: You are an AI content reviewer specializing in technical accuracy.
TASK: Evaluate the Academic Papers or ArXiv Links content for **[TERM]**.
OUTPUT FORMAT: Return JSON with "score" (1-10) and "feedback" string.
CONSTRAINTS:
- Check accuracy and completeness for Links to academic papers and preprints.
- Verify appropriate detail level for supplementary content.
- Assess clarity and technical correctness.
- Note any missing key points or inaccuracies.`,
    
    improvementPrompt: `ROLE: You are an AI writing assistant improving technical content.
TASK: Enhance the Academic Papers or ArXiv Links content for **[TERM]**.
OUTPUT FORMAT: Return only the improved content in the same format.
CONSTRAINTS:
- Maintain accuracy while improving clarity.
- Ensure completeness for Links to academic papers and preprints.
- Keep within appropriate scope and detail level.
- Address any feedback from evaluation.`
  },

  // Column 112: GitHub Repositories or Code
  {
    columnId: 'research_github_repos',
    generativePrompt: `ROLE: You are an AI/ML expert creating comprehensive glossary content.
TASK: Generate content for **[TERM]** focusing on: GitHub Repositories or Code.
CONTEXT: Relevant GitHub repositories and code implementations
OUTPUT FORMAT: Provide a markdown unordered list.
CONSTRAINTS:
- Provide moderate detail (1-2 paragraphs or 5-7 bullet points).
- Ensure accuracy and clarity for important level content.
- Focus specifically on the aspect described in the column name.
- Use technical language appropriate for the audience level.`,
    
    evaluativePrompt: `ROLE: You are an AI content reviewer specializing in technical accuracy.
TASK: Evaluate the GitHub Repositories or Code content for **[TERM]**.
OUTPUT FORMAT: Return JSON with "score" (1-10) and "feedback" string.
CONSTRAINTS:
- Check accuracy and completeness for Relevant GitHub repositories and code implementations.
- Verify appropriate detail level for important content.
- Assess clarity and technical correctness.
- Note any missing key points or inaccuracies.`,
    
    improvementPrompt: `ROLE: You are an AI writing assistant improving technical content.
TASK: Enhance the GitHub Repositories or Code content for **[TERM]**.
OUTPUT FORMAT: Return only the improved content in the same format.
CONSTRAINTS:
- Maintain accuracy while improving clarity.
- Ensure completeness for Relevant GitHub repositories and code implementations.
- Keep within appropriate scope and detail level.
- Address any feedback from evaluation.`
  },

  // Column 113: Tutorials or Blog Posts
  {
    columnId: 'research_tutorials_blogs',
    generativePrompt: `ROLE: You are an AI/ML expert creating comprehensive glossary content.
TASK: Generate content for **[TERM]** focusing on: Tutorials or Blog Posts.
CONTEXT: Helpful tutorials and blog posts
OUTPUT FORMAT: Provide a markdown unordered list.
CONSTRAINTS:
- Provide moderate detail (1-2 paragraphs or 5-7 bullet points).
- Ensure accuracy and clarity for supplementary level content.
- Focus specifically on the aspect described in the column name.
- Use technical language appropriate for the audience level.`,
    
    evaluativePrompt: `ROLE: You are an AI content reviewer specializing in technical accuracy.
TASK: Evaluate the Tutorials or Blog Posts content for **[TERM]**.
OUTPUT FORMAT: Return JSON with "score" (1-10) and "feedback" string.
CONSTRAINTS:
- Check accuracy and completeness for Helpful tutorials and blog posts.
- Verify appropriate detail level for supplementary content.
- Assess clarity and technical correctness.
- Note any missing key points or inaccuracies.`,
    
    improvementPrompt: `ROLE: You are an AI writing assistant improving technical content.
TASK: Enhance the Tutorials or Blog Posts content for **[TERM]**.
OUTPUT FORMAT: Return only the improved content in the same format.
CONSTRAINTS:
- Maintain accuracy while improving clarity.
- Ensure completeness for Helpful tutorials and blog posts.
- Keep within appropriate scope and detail level.
- Address any feedback from evaluation.`
  },

  // Column 114: Conferences or Journals
  {
    columnId: 'research_conferences_journals',
    generativePrompt: `ROLE: You are an AI/ML expert creating comprehensive glossary content.
TASK: Generate content for **[TERM]** focusing on: Conferences or Journals.
CONTEXT: Relevant conferences and journals in the field
OUTPUT FORMAT: Provide a markdown unordered list.
CONSTRAINTS:
- Keep it concise (2-4 sentences or 3-5 bullet points).
- Ensure accuracy and clarity for supplementary level content.
- Focus specifically on the aspect described in the column name.
- Use technical language appropriate for the audience level.`,
    
    evaluativePrompt: `ROLE: You are an AI content reviewer specializing in technical accuracy.
TASK: Evaluate the Conferences or Journals content for **[TERM]**.
OUTPUT FORMAT: Return JSON with "score" (1-10) and "feedback" string.
CONSTRAINTS:
- Check accuracy and completeness for Relevant conferences and journals in the field.
- Verify appropriate detail level for supplementary content.
- Assess clarity and technical correctness.
- Note any missing key points or inaccuracies.`,
    
    improvementPrompt: `ROLE: You are an AI writing assistant improving technical content.
TASK: Enhance the Conferences or Journals content for **[TERM]**.
OUTPUT FORMAT: Return only the improved content in the same format.
CONSTRAINTS:
- Maintain accuracy while improving clarity.
- Ensure completeness for Relevant conferences and journals in the field.
- Keep within appropriate scope and detail level.
- Address any feedback from evaluation.`
  },

  // Column 115: Online Resources and Repositories
  {
    columnId: 'research_online_resources',
    generativePrompt: `ROLE: You are an AI/ML expert creating comprehensive glossary content.
TASK: Generate content for **[TERM]** focusing on: Online Resources and Repositories.
CONTEXT: Additional online resources and repositories
OUTPUT FORMAT: Provide a markdown unordered list.
CONSTRAINTS:
- Provide moderate detail (1-2 paragraphs or 5-7 bullet points).
- Ensure accuracy and clarity for supplementary level content.
- Focus specifically on the aspect described in the column name.
- Use technical language appropriate for the audience level.`,
    
    evaluativePrompt: `ROLE: You are an AI content reviewer specializing in technical accuracy.
TASK: Evaluate the Online Resources and Repositories content for **[TERM]**.
OUTPUT FORMAT: Return JSON with "score" (1-10) and "feedback" string.
CONSTRAINTS:
- Check accuracy and completeness for Additional online resources and repositories.
- Verify appropriate detail level for supplementary content.
- Assess clarity and technical correctness.
- Note any missing key points or inaccuracies.`,
    
    improvementPrompt: `ROLE: You are an AI writing assistant improving technical content.
TASK: Enhance the Online Resources and Repositories content for **[TERM]**.
OUTPUT FORMAT: Return only the improved content in the same format.
CONSTRAINTS:
- Maintain accuracy while improving clarity.
- Ensure completeness for Additional online resources and repositories.
- Keep within appropriate scope and detail level.
- Address any feedback from evaluation.`
  },

  // Column 116: Benchmark Datasets or Challenges
  {
    columnId: 'research_benchmark_datasets',
    generativePrompt: `ROLE: You are an AI/ML expert creating comprehensive glossary content.
TASK: Generate content for **[TERM]** focusing on: Benchmark Datasets or Challenges.
CONTEXT: Standard benchmarks and challenge datasets
OUTPUT FORMAT: Provide a markdown unordered list.
CONSTRAINTS:
- Provide moderate detail (1-2 paragraphs or 5-7 bullet points).
- Ensure accuracy and clarity for important level content.
- Focus specifically on the aspect described in the column name.
- Use technical language appropriate for the audience level.`,
    
    evaluativePrompt: `ROLE: You are an AI content reviewer specializing in technical accuracy.
TASK: Evaluate the Benchmark Datasets or Challenges content for **[TERM]**.
OUTPUT FORMAT: Return JSON with "score" (1-10) and "feedback" string.
CONSTRAINTS:
- Check accuracy and completeness for Standard benchmarks and challenge datasets.
- Verify appropriate detail level for important content.
- Assess clarity and technical correctness.
- Note any missing key points or inaccuracies.`,
    
    improvementPrompt: `ROLE: You are an AI writing assistant improving technical content.
TASK: Enhance the Benchmark Datasets or Challenges content for **[TERM]**.
OUTPUT FORMAT: Return only the improved content in the same format.
CONSTRAINTS:
- Maintain accuracy while improving clarity.
- Ensure completeness for Standard benchmarks and challenge datasets.
- Keep within appropriate scope and detail level.
- Address any feedback from evaluation.`
  },

  // Column 117: Open Research Problems and Future Directions
  {
    columnId: 'research_open_problems',
    generativePrompt: `ROLE: You are an AI/ML expert creating comprehensive glossary content.
TASK: Generate content for **[TERM]** focusing on: Open Research Problems and Future Directions.
CONTEXT: Current open problems and research opportunities
OUTPUT FORMAT: Write content in Markdown format.
CONSTRAINTS:
- Provide moderate detail (1-2 paragraphs or 5-7 bullet points).
- Ensure accuracy and clarity for supplementary level content.
- Focus specifically on the aspect described in the column name.
- Use technical language appropriate for the audience level.`,
    
    evaluativePrompt: `ROLE: You are an AI content reviewer specializing in technical accuracy.
TASK: Evaluate the Open Research Problems and Future Directions content for **[TERM]**.
OUTPUT FORMAT: Return JSON with "score" (1-10) and "feedback" string.
CONSTRAINTS:
- Check accuracy and completeness for Current open problems and research opportunities.
- Verify appropriate detail level for supplementary content.
- Assess clarity and technical correctness.
- Note any missing key points or inaccuracies.`,
    
    improvementPrompt: `ROLE: You are an AI writing assistant improving technical content.
TASK: Enhance the Open Research Problems and Future Directions content for **[TERM]**.
OUTPUT FORMAT: Return only the improved content in the same format.
CONSTRAINTS:
- Maintain accuracy while improving clarity.
- Ensure completeness for Current open problems and research opportunities.
- Keep within appropriate scope and detail level.
- Address any feedback from evaluation.`
  },

  // Column 118: Interactive Element: Searchable Library or Recommendation System
  {
    columnId: 'research_interactive_library',
    generativePrompt: `ROLE: You are an AI/ML expert creating comprehensive glossary content.
TASK: Generate content for **[TERM]** focusing on: Interactive Element: Searchable Library or Recommendation System.
CONTEXT: Interactive paper search and recommendation system
OUTPUT FORMAT: Provide interactive content specification in markdown format.
CONSTRAINTS:
- Provide moderate detail (1-2 paragraphs or 5-7 bullet points).
- Ensure accuracy and clarity for advanced level content.
- Focus specifically on the aspect described in the column name.
- Use technical language appropriate for the audience level.`,
    
    evaluativePrompt: `ROLE: You are an AI content reviewer specializing in technical accuracy.
TASK: Evaluate the Interactive Element: Searchable Library or Recommendation System content for **[TERM]**.
OUTPUT FORMAT: Return JSON with "score" (1-10) and "feedback" string.
CONSTRAINTS:
- Check accuracy and completeness for Interactive paper search and recommendation system.
- Verify appropriate detail level for advanced content.
- Assess clarity and technical correctness.
- Note any missing key points or inaccuracies.`,
    
    improvementPrompt: `ROLE: You are an AI writing assistant improving technical content.
TASK: Enhance the Interactive Element: Searchable Library or Recommendation System content for **[TERM]**.
OUTPUT FORMAT: Return only the improved content in the same format.
CONSTRAINTS:
- Maintain accuracy while improving clarity.
- Ensure completeness for Interactive paper search and recommendation system.
- Keep within appropriate scope and detail level.
- Address any feedback from evaluation.`
  },

  // Column 119: Popular Tools, Frameworks, or Libraries
  {
    columnId: 'tools_popular_tools',
    generativePrompt: `ROLE: You are an AI/ML expert creating comprehensive glossary content.
TASK: Generate content for **[TERM]** focusing on: Popular Tools, Frameworks, or Libraries.
CONTEXT: Most popular and widely-used tools
OUTPUT FORMAT: Provide a markdown unordered list.
CONSTRAINTS:
- Provide moderate detail (1-2 paragraphs or 5-7 bullet points).
- Ensure accuracy and clarity for essential level content.
- Focus specifically on the aspect described in the column name.
- Use technical language appropriate for the audience level.`,
    
    evaluativePrompt: `ROLE: You are an AI content reviewer specializing in technical accuracy.
TASK: Evaluate the Popular Tools, Frameworks, or Libraries content for **[TERM]**.
OUTPUT FORMAT: Return JSON with "score" (1-10) and "feedback" string.
CONSTRAINTS:
- Check accuracy and completeness for Most popular and widely-used tools.
- Verify appropriate detail level for essential content.
- Assess clarity and technical correctness.
- Note any missing key points or inaccuracies.`,
    
    improvementPrompt: `ROLE: You are an AI writing assistant improving technical content.
TASK: Enhance the Popular Tools, Frameworks, or Libraries content for **[TERM]**.
OUTPUT FORMAT: Return only the improved content in the same format.
CONSTRAINTS:
- Maintain accuracy while improving clarity.
- Ensure completeness for Most popular and widely-used tools.
- Keep within appropriate scope and detail level.
- Address any feedback from evaluation.`
  },

  // Column 120: Installation or Setup Guides
  {
    columnId: 'tools_installation_guides',
    generativePrompt: `ROLE: You are an AI/ML expert creating comprehensive glossary content.
TASK: Generate content for **[TERM]** focusing on: Installation or Setup Guides.
CONTEXT: How to install and set up the tools
OUTPUT FORMAT: Write content in Markdown format.
CONSTRAINTS:
- Provide moderate detail (1-2 paragraphs or 5-7 bullet points).
- Ensure accuracy and clarity for important level content.
- Focus specifically on the aspect described in the column name.
- Use technical language appropriate for the audience level.`,
    
    evaluativePrompt: `ROLE: You are an AI content reviewer specializing in technical accuracy.
TASK: Evaluate the Installation or Setup Guides content for **[TERM]**.
OUTPUT FORMAT: Return JSON with "score" (1-10) and "feedback" string.
CONSTRAINTS:
- Check accuracy and completeness for How to install and set up the tools.
- Verify appropriate detail level for important content.
- Assess clarity and technical correctness.
- Note any missing key points or inaccuracies.`,
    
    improvementPrompt: `ROLE: You are an AI writing assistant improving technical content.
TASK: Enhance the Installation or Setup Guides content for **[TERM]**.
OUTPUT FORMAT: Return only the improved content in the same format.
CONSTRAINTS:
- Maintain accuracy while improving clarity.
- Ensure completeness for How to install and set up the tools.
- Keep within appropriate scope and detail level.
- Address any feedback from evaluation.`
  },

  // Column 121: Comparison of Different Tools
  {
    columnId: 'tools_comparison',
    generativePrompt: `ROLE: You are an AI/ML expert creating comprehensive glossary content.
TASK: Generate content for **[TERM]** focusing on: Comparison of Different Tools.
CONTEXT: Detailed comparison of available tools
OUTPUT FORMAT: Write content in Markdown format.
CONSTRAINTS:
- Provide moderate detail (1-2 paragraphs or 5-7 bullet points).
- Ensure accuracy and clarity for important level content.
- Focus specifically on the aspect described in the column name.
- Use technical language appropriate for the audience level.`,
    
    evaluativePrompt: `ROLE: You are an AI content reviewer specializing in technical accuracy.
TASK: Evaluate the Comparison of Different Tools content for **[TERM]**.
OUTPUT FORMAT: Return JSON with "score" (1-10) and "feedback" string.
CONSTRAINTS:
- Check accuracy and completeness for Detailed comparison of available tools.
- Verify appropriate detail level for important content.
- Assess clarity and technical correctness.
- Note any missing key points or inaccuracies.`,
    
    improvementPrompt: `ROLE: You are an AI writing assistant improving technical content.
TASK: Enhance the Comparison of Different Tools content for **[TERM]**.
OUTPUT FORMAT: Return only the improved content in the same format.
CONSTRAINTS:
- Maintain accuracy while improving clarity.
- Ensure completeness for Detailed comparison of available tools.
- Keep within appropriate scope and detail level.
- Address any feedback from evaluation.`
  },

  // Column 122: Python Libraries
  {
    columnId: 'tools_python_libraries',
    generativePrompt: `ROLE: You are an AI/ML expert creating comprehensive glossary content.
TASK: Generate content for **[TERM]** focusing on: Python Libraries.
CONTEXT: Python libraries for implementation
OUTPUT FORMAT: Provide a markdown unordered list.
CONSTRAINTS:
- Provide moderate detail (1-2 paragraphs or 5-7 bullet points).
- Ensure accuracy and clarity for essential level content.
- Focus specifically on the aspect described in the column name.
- Use technical language appropriate for the audience level.`,
    
    evaluativePrompt: `ROLE: You are an AI content reviewer specializing in technical accuracy.
TASK: Evaluate the Python Libraries content for **[TERM]**.
OUTPUT FORMAT: Return JSON with "score" (1-10) and "feedback" string.
CONSTRAINTS:
- Check accuracy and completeness for Python libraries for implementation.
- Verify appropriate detail level for essential content.
- Assess clarity and technical correctness.
- Note any missing key points or inaccuracies.`,
    
    improvementPrompt: `ROLE: You are an AI writing assistant improving technical content.
TASK: Enhance the Python Libraries content for **[TERM]**.
OUTPUT FORMAT: Return only the improved content in the same format.
CONSTRAINTS:
- Maintain accuracy while improving clarity.
- Ensure completeness for Python libraries for implementation.
- Keep within appropriate scope and detail level.
- Address any feedback from evaluation.`
  },

  // Column 123: R Packages
  {
    columnId: 'tools_r_packages',
    generativePrompt: `ROLE: You are an AI/ML expert creating comprehensive glossary content.
TASK: Generate content for **[TERM]** focusing on: R Packages.
CONTEXT: R packages for implementation
OUTPUT FORMAT: Provide a markdown unordered list.
CONSTRAINTS:
- Keep it concise (2-4 sentences or 3-5 bullet points).
- Ensure accuracy and clarity for supplementary level content.
- Focus specifically on the aspect described in the column name.
- Use technical language appropriate for the audience level.`,
    
    evaluativePrompt: `ROLE: You are an AI content reviewer specializing in technical accuracy.
TASK: Evaluate the R Packages content for **[TERM]**.
OUTPUT FORMAT: Return JSON with "score" (1-10) and "feedback" string.
CONSTRAINTS:
- Check accuracy and completeness for R packages for implementation.
- Verify appropriate detail level for supplementary content.
- Assess clarity and technical correctness.
- Note any missing key points or inaccuracies.`,
    
    improvementPrompt: `ROLE: You are an AI writing assistant improving technical content.
TASK: Enhance the R Packages content for **[TERM]**.
OUTPUT FORMAT: Return only the improved content in the same format.
CONSTRAINTS:
- Maintain accuracy while improving clarity.
- Ensure completeness for R packages for implementation.
- Keep within appropriate scope and detail level.
- Address any feedback from evaluation.`
  },

  // Column 124: Other Language-Specific Tools
  {
    columnId: 'tools_other_languages',
    generativePrompt: `ROLE: You are an AI/ML expert creating comprehensive glossary content.
TASK: Generate content for **[TERM]** focusing on: Other Language-Specific Tools.
CONTEXT: Tools for Java, C++, Julia, etc.
OUTPUT FORMAT: Provide a markdown unordered list.
CONSTRAINTS:
- Provide moderate detail (1-2 paragraphs or 5-7 bullet points).
- Ensure accuracy and clarity for supplementary level content.
- Focus specifically on the aspect described in the column name.
- Use technical language appropriate for the audience level.`,
    
    evaluativePrompt: `ROLE: You are an AI content reviewer specializing in technical accuracy.
TASK: Evaluate the Other Language-Specific Tools content for **[TERM]**.
OUTPUT FORMAT: Return JSON with "score" (1-10) and "feedback" string.
CONSTRAINTS:
- Check accuracy and completeness for Tools for Java, C++, Julia, etc..
- Verify appropriate detail level for supplementary content.
- Assess clarity and technical correctness.
- Note any missing key points or inaccuracies.`,
    
    improvementPrompt: `ROLE: You are an AI writing assistant improving technical content.
TASK: Enhance the Other Language-Specific Tools content for **[TERM]**.
OUTPUT FORMAT: Return only the improved content in the same format.
CONSTRAINTS:
- Maintain accuracy while improving clarity.
- Ensure completeness for Tools for Java, C++, Julia, etc..
- Keep within appropriate scope and detail level.
- Address any feedback from evaluation.`
  },

  // Column 125: API References and Documentation
  {
    columnId: 'tools_api_documentation',
    generativePrompt: `ROLE: You are an AI/ML expert creating comprehensive glossary content.
TASK: Generate content for **[TERM]** focusing on: API References and Documentation.
CONTEXT: API documentation and references
OUTPUT FORMAT: Write content in Markdown format.
CONSTRAINTS:
- Provide moderate detail (1-2 paragraphs or 5-7 bullet points).
- Ensure accuracy and clarity for important level content.
- Focus specifically on the aspect described in the column name.
- Use technical language appropriate for the audience level.`,
    
    evaluativePrompt: `ROLE: You are an AI content reviewer specializing in technical accuracy.
TASK: Evaluate the API References and Documentation content for **[TERM]**.
OUTPUT FORMAT: Return JSON with "score" (1-10) and "feedback" string.
CONSTRAINTS:
- Check accuracy and completeness for API documentation and references.
- Verify appropriate detail level for important content.
- Assess clarity and technical correctness.
- Note any missing key points or inaccuracies.`,
    
    improvementPrompt: `ROLE: You are an AI writing assistant improving technical content.
TASK: Enhance the API References and Documentation content for **[TERM]**.
OUTPUT FORMAT: Return only the improved content in the same format.
CONSTRAINTS:
- Maintain accuracy while improving clarity.
- Ensure completeness for API documentation and references.
- Keep within appropriate scope and detail level.
- Address any feedback from evaluation.`
  },

  // Column 126: Interactive Element: Code Playgrounds or Tool Comparisons
  {
    columnId: 'tools_interactive_playground',
    generativePrompt: `ROLE: You are an AI/ML expert creating comprehensive glossary content.
TASK: Generate content for **[TERM]** focusing on: Interactive Element: Code Playgrounds or Tool Comparisons.
CONTEXT: Interactive code playground and tool comparison
OUTPUT FORMAT: Provide interactive content specification in markdown format.
CONSTRAINTS:
- Provide comprehensive detail with multiple sections.
- Ensure accuracy and clarity for advanced level content.
- Focus specifically on the aspect described in the column name.
- Use technical language appropriate for the audience level.`,
    
    evaluativePrompt: `ROLE: You are an AI content reviewer specializing in technical accuracy.
TASK: Evaluate the Interactive Element: Code Playgrounds or Tool Comparisons content for **[TERM]**.
OUTPUT FORMAT: Return JSON with "score" (1-10) and "feedback" string.
CONSTRAINTS:
- Check accuracy and completeness for Interactive code playground and tool comparison.
- Verify appropriate detail level for advanced content.
- Assess clarity and technical correctness.
- Note any missing key points or inaccuracies.`,
    
    improvementPrompt: `ROLE: You are an AI writing assistant improving technical content.
TASK: Enhance the Interactive Element: Code Playgrounds or Tool Comparisons content for **[TERM]**.
OUTPUT FORMAT: Return only the improved content in the same format.
CONSTRAINTS:
- Maintain accuracy while improving clarity.
- Ensure completeness for Interactive code playground and tool comparison.
- Keep within appropriate scope and detail level.
- Address any feedback from evaluation.`
  },

  // Column 127: Frequent Errors or Misconceptions
  {
    columnId: 'mistakes_frequent_errors',
    generativePrompt: `ROLE: You are an AI/ML expert creating comprehensive glossary content.
TASK: Generate content for **[TERM]** focusing on: Frequent Errors or Misconceptions.
CONTEXT: Common errors and misconceptions to avoid
OUTPUT FORMAT: Write content in Markdown format.
CONSTRAINTS:
- Provide moderate detail (1-2 paragraphs or 5-7 bullet points).
- Ensure accuracy and clarity for important level content.
- Focus specifically on the aspect described in the column name.
- Use technical language appropriate for the audience level.`,
    
    evaluativePrompt: `ROLE: You are an AI content reviewer specializing in technical accuracy.
TASK: Evaluate the Frequent Errors or Misconceptions content for **[TERM]**.
OUTPUT FORMAT: Return JSON with "score" (1-10) and "feedback" string.
CONSTRAINTS:
- Check accuracy and completeness for Common errors and misconceptions to avoid.
- Verify appropriate detail level for important content.
- Assess clarity and technical correctness.
- Note any missing key points or inaccuracies.`,
    
    improvementPrompt: `ROLE: You are an AI writing assistant improving technical content.
TASK: Enhance the Frequent Errors or Misconceptions content for **[TERM]**.
OUTPUT FORMAT: Return only the improved content in the same format.
CONSTRAINTS:
- Maintain accuracy while improving clarity.
- Ensure completeness for Common errors and misconceptions to avoid.
- Keep within appropriate scope and detail level.
- Address any feedback from evaluation.`
  },

  // Column 128: Debugging Tips and Troubleshooting
  {
    columnId: 'mistakes_debugging_tips',
    generativePrompt: `ROLE: You are an AI/ML expert creating comprehensive glossary content.
TASK: Generate content for **[TERM]** focusing on: Debugging Tips and Troubleshooting.
CONTEXT: Practical debugging and troubleshooting advice
OUTPUT FORMAT: Write content in Markdown format.
CONSTRAINTS:
- Provide moderate detail (1-2 paragraphs or 5-7 bullet points).
- Ensure accuracy and clarity for important level content.
- Focus specifically on the aspect described in the column name.
- Use technical language appropriate for the audience level.`,
    
    evaluativePrompt: `ROLE: You are an AI content reviewer specializing in technical accuracy.
TASK: Evaluate the Debugging Tips and Troubleshooting content for **[TERM]**.
OUTPUT FORMAT: Return JSON with "score" (1-10) and "feedback" string.
CONSTRAINTS:
- Check accuracy and completeness for Practical debugging and troubleshooting advice.
- Verify appropriate detail level for important content.
- Assess clarity and technical correctness.
- Note any missing key points or inaccuracies.`,
    
    improvementPrompt: `ROLE: You are an AI writing assistant improving technical content.
TASK: Enhance the Debugging Tips and Troubleshooting content for **[TERM]**.
OUTPUT FORMAT: Return only the improved content in the same format.
CONSTRAINTS:
- Maintain accuracy while improving clarity.
- Ensure completeness for Practical debugging and troubleshooting advice.
- Keep within appropriate scope and detail level.
- Address any feedback from evaluation.`
  },

  // Column 129: Best Practices to Avoid Pitfalls
  {
    columnId: 'mistakes_best_practices_avoid',
    generativePrompt: `ROLE: You are an AI/ML expert creating comprehensive glossary content.
TASK: Generate content for **[TERM]** focusing on: Best Practices to Avoid Pitfalls.
CONTEXT: Best practices to prevent common mistakes
OUTPUT FORMAT: Write content in Markdown format.
CONSTRAINTS:
- Provide moderate detail (1-2 paragraphs or 5-7 bullet points).
- Ensure accuracy and clarity for essential level content.
- Focus specifically on the aspect described in the column name.
- Use technical language appropriate for the audience level.`,
    
    evaluativePrompt: `ROLE: You are an AI content reviewer specializing in technical accuracy.
TASK: Evaluate the Best Practices to Avoid Pitfalls content for **[TERM]**.
OUTPUT FORMAT: Return JSON with "score" (1-10) and "feedback" string.
CONSTRAINTS:
- Check accuracy and completeness for Best practices to prevent common mistakes.
- Verify appropriate detail level for essential content.
- Assess clarity and technical correctness.
- Note any missing key points or inaccuracies.`,
    
    improvementPrompt: `ROLE: You are an AI writing assistant improving technical content.
TASK: Enhance the Best Practices to Avoid Pitfalls content for **[TERM]**.
OUTPUT FORMAT: Return only the improved content in the same format.
CONSTRAINTS:
- Maintain accuracy while improving clarity.
- Ensure completeness for Best practices to prevent common mistakes.
- Keep within appropriate scope and detail level.
- Address any feedback from evaluation.`
  },

  // Column 130: Real-world Examples of Failures
  {
    columnId: 'mistakes_real_world_failures',
    generativePrompt: `ROLE: You are an AI/ML expert creating comprehensive glossary content.
TASK: Generate content for **[TERM]** focusing on: Real-world Examples of Failures.
CONTEXT: Case studies of real-world failures and lessons
OUTPUT FORMAT: Write content in Markdown format.
CONSTRAINTS:
- Provide moderate detail (1-2 paragraphs or 5-7 bullet points).
- Ensure accuracy and clarity for supplementary level content.
- Focus specifically on the aspect described in the column name.
- Use technical language appropriate for the audience level.`,
    
    evaluativePrompt: `ROLE: You are an AI content reviewer specializing in technical accuracy.
TASK: Evaluate the Real-world Examples of Failures content for **[TERM]**.
OUTPUT FORMAT: Return JSON with "score" (1-10) and "feedback" string.
CONSTRAINTS:
- Check accuracy and completeness for Case studies of real-world failures and lessons.
- Verify appropriate detail level for supplementary content.
- Assess clarity and technical correctness.
- Note any missing key points or inaccuracies.`,
    
    improvementPrompt: `ROLE: You are an AI writing assistant improving technical content.
TASK: Enhance the Real-world Examples of Failures content for **[TERM]**.
OUTPUT FORMAT: Return only the improved content in the same format.
CONSTRAINTS:
- Maintain accuracy while improving clarity.
- Ensure completeness for Case studies of real-world failures and lessons.
- Keep within appropriate scope and detail level.
- Address any feedback from evaluation.`
  },

  // Column 131: Common Myths Debunked
  {
    columnId: 'mistakes_myths_debunked',
    generativePrompt: `ROLE: You are an AI/ML expert creating comprehensive glossary content.
TASK: Generate content for **[TERM]** focusing on: Common Myths Debunked.
CONTEXT: Debunking common myths and misconceptions
OUTPUT FORMAT: Write content in Markdown format.
CONSTRAINTS:
- Provide moderate detail (1-2 paragraphs or 5-7 bullet points).
- Ensure accuracy and clarity for supplementary level content.
- Focus specifically on the aspect described in the column name.
- Use technical language appropriate for the audience level.`,
    
    evaluativePrompt: `ROLE: You are an AI content reviewer specializing in technical accuracy.
TASK: Evaluate the Common Myths Debunked content for **[TERM]**.
OUTPUT FORMAT: Return JSON with "score" (1-10) and "feedback" string.
CONSTRAINTS:
- Check accuracy and completeness for Debunking common myths and misconceptions.
- Verify appropriate detail level for supplementary content.
- Assess clarity and technical correctness.
- Note any missing key points or inaccuracies.`,
    
    improvementPrompt: `ROLE: You are an AI writing assistant improving technical content.
TASK: Enhance the Common Myths Debunked content for **[TERM]**.
OUTPUT FORMAT: Return only the improved content in the same format.
CONSTRAINTS:
- Maintain accuracy while improving clarity.
- Ensure completeness for Debunking common myths and misconceptions.
- Keep within appropriate scope and detail level.
- Address any feedback from evaluation.`
  },

  // Column 132: How to Spot and Correct Mistakes
  {
    columnId: 'mistakes_how_to_spot',
    generativePrompt: `ROLE: You are an AI/ML expert creating comprehensive glossary content.
TASK: Generate content for **[TERM]** focusing on: How to Spot and Correct Mistakes.
CONTEXT: Techniques for identifying and fixing errors
OUTPUT FORMAT: Write content in Markdown format.
CONSTRAINTS:
- Provide moderate detail (1-2 paragraphs or 5-7 bullet points).
- Ensure accuracy and clarity for important level content.
- Focus specifically on the aspect described in the column name.
- Use technical language appropriate for the audience level.`,
    
    evaluativePrompt: `ROLE: You are an AI content reviewer specializing in technical accuracy.
TASK: Evaluate the How to Spot and Correct Mistakes content for **[TERM]**.
OUTPUT FORMAT: Return JSON with "score" (1-10) and "feedback" string.
CONSTRAINTS:
- Check accuracy and completeness for Techniques for identifying and fixing errors.
- Verify appropriate detail level for important content.
- Assess clarity and technical correctness.
- Note any missing key points or inaccuracies.`,
    
    improvementPrompt: `ROLE: You are an AI writing assistant improving technical content.
TASK: Enhance the How to Spot and Correct Mistakes content for **[TERM]**.
OUTPUT FORMAT: Return only the improved content in the same format.
CONSTRAINTS:
- Maintain accuracy while improving clarity.
- Ensure completeness for Techniques for identifying and fixing errors.
- Keep within appropriate scope and detail level.
- Address any feedback from evaluation.`
  },

  // Column 133: Interactive Element: Quiz or Diagnostic Tool
  {
    columnId: 'mistakes_interactive_quiz',
    generativePrompt: `ROLE: You are an AI/ML expert creating comprehensive glossary content.
TASK: Generate content for **[TERM]** focusing on: Interactive Element: Quiz or Diagnostic Tool.
CONTEXT: Interactive quiz to test understanding and identify mistakes
OUTPUT FORMAT: Provide interactive content specification in markdown format.
CONSTRAINTS:
- Provide moderate detail (1-2 paragraphs or 5-7 bullet points).
- Ensure accuracy and clarity for advanced level content.
- Focus specifically on the aspect described in the column name.
- Use technical language appropriate for the audience level.`,
    
    evaluativePrompt: `ROLE: You are an AI content reviewer specializing in technical accuracy.
TASK: Evaluate the Interactive Element: Quiz or Diagnostic Tool content for **[TERM]**.
OUTPUT FORMAT: Return JSON with "score" (1-10) and "feedback" string.
CONSTRAINTS:
- Check accuracy and completeness for Interactive quiz to test understanding and identify mistakes.
- Verify appropriate detail level for advanced content.
- Assess clarity and technical correctness.
- Note any missing key points or inaccuracies.`,
    
    improvementPrompt: `ROLE: You are an AI writing assistant improving technical content.
TASK: Enhance the Interactive Element: Quiz or Diagnostic Tool content for **[TERM]**.
OUTPUT FORMAT: Return only the improved content in the same format.
CONSTRAINTS:
- Maintain accuracy while improving clarity.
- Ensure completeness for Interactive quiz to test understanding and identify mistakes.
- Keep within appropriate scope and detail level.
- Address any feedback from evaluation.`
  },

  // Column 134: Scalability to Large Datasets or High-Dimensional Data
  {
    columnId: 'scalability_large_scale',
    generativePrompt: `ROLE: You are an AI/ML expert creating comprehensive glossary content.
TASK: Generate content for **[TERM]** focusing on: Scalability to Large Datasets or High-Dimensional Data.
CONTEXT: How the approach scales with data size and dimensionality
OUTPUT FORMAT: Write content in Markdown format.
CONSTRAINTS:
- Provide moderate detail (1-2 paragraphs or 5-7 bullet points).
- Ensure accuracy and clarity for important level content.
- Focus specifically on the aspect described in the column name.
- Use technical language appropriate for the audience level.`,
    
    evaluativePrompt: `ROLE: You are an AI content reviewer specializing in technical accuracy.
TASK: Evaluate the Scalability to Large Datasets or High-Dimensional Data content for **[TERM]**.
OUTPUT FORMAT: Return JSON with "score" (1-10) and "feedback" string.
CONSTRAINTS:
- Check accuracy and completeness for How the approach scales with data size and dimensionality.
- Verify appropriate detail level for important content.
- Assess clarity and technical correctness.
- Note any missing key points or inaccuracies.`,
    
    improvementPrompt: `ROLE: You are an AI writing assistant improving technical content.
TASK: Enhance the Scalability to Large Datasets or High-Dimensional Data content for **[TERM]**.
OUTPUT FORMAT: Return only the improved content in the same format.
CONSTRAINTS:
- Maintain accuracy while improving clarity.
- Ensure completeness for How the approach scales with data size and dimensionality.
- Keep within appropriate scope and detail level.
- Address any feedback from evaluation.`
  },

  // Column 135: Distributed Computing Approaches
  {
    columnId: 'scalability_distributed_computing',
    generativePrompt: `ROLE: You are an AI/ML expert creating comprehensive glossary content.
TASK: Generate content for **[TERM]** focusing on: Distributed Computing Approaches.
CONTEXT: Distributed and parallel computing strategies
OUTPUT FORMAT: Write content in Markdown format.
CONSTRAINTS:
- Provide moderate detail (1-2 paragraphs or 5-7 bullet points).
- Ensure accuracy and clarity for advanced level content.
- Focus specifically on the aspect described in the column name.
- Use technical language appropriate for the audience level.`,
    
    evaluativePrompt: `ROLE: You are an AI content reviewer specializing in technical accuracy.
TASK: Evaluate the Distributed Computing Approaches content for **[TERM]**.
OUTPUT FORMAT: Return JSON with "score" (1-10) and "feedback" string.
CONSTRAINTS:
- Check accuracy and completeness for Distributed and parallel computing strategies.
- Verify appropriate detail level for advanced content.
- Assess clarity and technical correctness.
- Note any missing key points or inaccuracies.`,
    
    improvementPrompt: `ROLE: You are an AI writing assistant improving technical content.
TASK: Enhance the Distributed Computing Approaches content for **[TERM]**.
OUTPUT FORMAT: Return only the improved content in the same format.
CONSTRAINTS:
- Maintain accuracy while improving clarity.
- Ensure completeness for Distributed and parallel computing strategies.
- Keep within appropriate scope and detail level.
- Address any feedback from evaluation.`
  },

  // Column 136: Cloud Platforms and Services
  {
    columnId: 'scalability_cloud_platforms',
    generativePrompt: `ROLE: You are an AI/ML expert creating comprehensive glossary content.
TASK: Generate content for **[TERM]** focusing on: Cloud Platforms and Services.
CONTEXT: Cloud services for scalable deployment
OUTPUT FORMAT: Provide a markdown unordered list.
CONSTRAINTS:
- Provide moderate detail (1-2 paragraphs or 5-7 bullet points).
- Ensure accuracy and clarity for important level content.
- Focus specifically on the aspect described in the column name.
- Use technical language appropriate for the audience level.`,
    
    evaluativePrompt: `ROLE: You are an AI content reviewer specializing in technical accuracy.
TASK: Evaluate the Cloud Platforms and Services content for **[TERM]**.
OUTPUT FORMAT: Return JSON with "score" (1-10) and "feedback" string.
CONSTRAINTS:
- Check accuracy and completeness for Cloud services for scalable deployment.
- Verify appropriate detail level for important content.
- Assess clarity and technical correctness.
- Note any missing key points or inaccuracies.`,
    
    improvementPrompt: `ROLE: You are an AI writing assistant improving technical content.
TASK: Enhance the Cloud Platforms and Services content for **[TERM]**.
OUTPUT FORMAT: Return only the improved content in the same format.
CONSTRAINTS:
- Maintain accuracy while improving clarity.
- Ensure completeness for Cloud services for scalable deployment.
- Keep within appropriate scope and detail level.
- Address any feedback from evaluation.`
  },

  // Column 137: Hardware Requirements and Considerations
  {
    columnId: 'scalability_hardware_requirements',
    generativePrompt: `ROLE: You are an AI/ML expert creating comprehensive glossary content.
TASK: Generate content for **[TERM]** focusing on: Hardware Requirements and Considerations.
CONTEXT: Hardware needs for different scales
OUTPUT FORMAT: Write content in Markdown format.
CONSTRAINTS:
- Provide moderate detail (1-2 paragraphs or 5-7 bullet points).
- Ensure accuracy and clarity for important level content.
- Focus specifically on the aspect described in the column name.
- Use technical language appropriate for the audience level.`,
    
    evaluativePrompt: `ROLE: You are an AI content reviewer specializing in technical accuracy.
TASK: Evaluate the Hardware Requirements and Considerations content for **[TERM]**.
OUTPUT FORMAT: Return JSON with "score" (1-10) and "feedback" string.
CONSTRAINTS:
- Check accuracy and completeness for Hardware needs for different scales.
- Verify appropriate detail level for important content.
- Assess clarity and technical correctness.
- Note any missing key points or inaccuracies.`,
    
    improvementPrompt: `ROLE: You are an AI writing assistant improving technical content.
TASK: Enhance the Hardware Requirements and Considerations content for **[TERM]**.
OUTPUT FORMAT: Return only the improved content in the same format.
CONSTRAINTS:
- Maintain accuracy while improving clarity.
- Ensure completeness for Hardware needs for different scales.
- Keep within appropriate scope and detail level.
- Address any feedback from evaluation.`
  },

  // Column 138: Optimization Techniques for Scale
  {
    columnId: 'scalability_optimization_techniques',
    generativePrompt: `ROLE: You are an AI/ML expert creating comprehensive glossary content.
TASK: Generate content for **[TERM]** focusing on: Optimization Techniques for Scale.
CONTEXT: Techniques to optimize for large-scale deployment
OUTPUT FORMAT: Write content in Markdown format.
CONSTRAINTS:
- Provide moderate detail (1-2 paragraphs or 5-7 bullet points).
- Ensure accuracy and clarity for important level content.
- Focus specifically on the aspect described in the column name.
- Use technical language appropriate for the audience level.`,
    
    evaluativePrompt: `ROLE: You are an AI content reviewer specializing in technical accuracy.
TASK: Evaluate the Optimization Techniques for Scale content for **[TERM]**.
OUTPUT FORMAT: Return JSON with "score" (1-10) and "feedback" string.
CONSTRAINTS:
- Check accuracy and completeness for Techniques to optimize for large-scale deployment.
- Verify appropriate detail level for important content.
- Assess clarity and technical correctness.
- Note any missing key points or inaccuracies.`,
    
    improvementPrompt: `ROLE: You are an AI writing assistant improving technical content.
TASK: Enhance the Optimization Techniques for Scale content for **[TERM]**.
OUTPUT FORMAT: Return only the improved content in the same format.
CONSTRAINTS:
- Maintain accuracy while improving clarity.
- Ensure completeness for Techniques to optimize for large-scale deployment.
- Keep within appropriate scope and detail level.
- Address any feedback from evaluation.`
  },

  // Column 139: Real-world Large-scale Deployments
  {
    columnId: 'scalability_real_world_deployments',
    generativePrompt: `ROLE: You are an AI/ML expert creating comprehensive glossary content.
TASK: Generate content for **[TERM]** focusing on: Real-world Large-scale Deployments.
CONTEXT: Examples of successful large-scale deployments
OUTPUT FORMAT: Write content in Markdown format.
CONSTRAINTS:
- Provide moderate detail (1-2 paragraphs or 5-7 bullet points).
- Ensure accuracy and clarity for supplementary level content.
- Focus specifically on the aspect described in the column name.
- Use technical language appropriate for the audience level.`,
    
    evaluativePrompt: `ROLE: You are an AI content reviewer specializing in technical accuracy.
TASK: Evaluate the Real-world Large-scale Deployments content for **[TERM]**.
OUTPUT FORMAT: Return JSON with "score" (1-10) and "feedback" string.
CONSTRAINTS:
- Check accuracy and completeness for Examples of successful large-scale deployments.
- Verify appropriate detail level for supplementary content.
- Assess clarity and technical correctness.
- Note any missing key points or inaccuracies.`,
    
    improvementPrompt: `ROLE: You are an AI writing assistant improving technical content.
TASK: Enhance the Real-world Large-scale Deployments content for **[TERM]**.
OUTPUT FORMAT: Return only the improved content in the same format.
CONSTRAINTS:
- Maintain accuracy while improving clarity.
- Ensure completeness for Examples of successful large-scale deployments.
- Keep within appropriate scope and detail level.
- Address any feedback from evaluation.`
  },

  // Column 140: Interactive Element: Scalability Calculator
  {
    columnId: 'scalability_interactive_calculator',
    generativePrompt: `ROLE: You are an AI/ML expert creating comprehensive glossary content.
TASK: Generate content for **[TERM]** focusing on: Interactive Element: Scalability Calculator.
CONTEXT: Interactive tool to estimate scalability and performance
OUTPUT FORMAT: Provide interactive content specification in markdown format.
CONSTRAINTS:
- Provide moderate detail (1-2 paragraphs or 5-7 bullet points).
- Ensure accuracy and clarity for advanced level content.
- Focus specifically on the aspect described in the column name.
- Use technical language appropriate for the audience level.`,
    
    evaluativePrompt: `ROLE: You are an AI content reviewer specializing in technical accuracy.
TASK: Evaluate the Interactive Element: Scalability Calculator content for **[TERM]**.
OUTPUT FORMAT: Return JSON with "score" (1-10) and "feedback" string.
CONSTRAINTS:
- Check accuracy and completeness for Interactive tool to estimate scalability and performance.
- Verify appropriate detail level for advanced content.
- Assess clarity and technical correctness.
- Note any missing key points or inaccuracies.`,
    
    improvementPrompt: `ROLE: You are an AI writing assistant improving technical content.
TASK: Enhance the Interactive Element: Scalability Calculator content for **[TERM]**.
OUTPUT FORMAT: Return only the improved content in the same format.
CONSTRAINTS:
- Maintain accuracy while improving clarity.
- Ensure completeness for Interactive tool to estimate scalability and performance.
- Keep within appropriate scope and detail level.
- Address any feedback from evaluation.`
  },

  // Column 141: Beginner-Friendly Tutorials or Courses
  {
    columnId: 'learning_beginner_resources',
    generativePrompt: `ROLE: You are an AI/ML expert creating comprehensive glossary content.
TASK: Generate content for **[TERM]** focusing on: Beginner-Friendly Tutorials or Courses.
CONTEXT: Resources for beginners to start learning
OUTPUT FORMAT: Provide a markdown unordered list.
CONSTRAINTS:
- Provide moderate detail (1-2 paragraphs or 5-7 bullet points).
- Ensure accuracy and clarity for essential level content.
- Focus specifically on the aspect described in the column name.
- Use technical language appropriate for the audience level.`,
    
    evaluativePrompt: `ROLE: You are an AI content reviewer specializing in technical accuracy.
TASK: Evaluate the Beginner-Friendly Tutorials or Courses content for **[TERM]**.
OUTPUT FORMAT: Return JSON with "score" (1-10) and "feedback" string.
CONSTRAINTS:
- Check accuracy and completeness for Resources for beginners to start learning.
- Verify appropriate detail level for essential content.
- Assess clarity and technical correctness.
- Note any missing key points or inaccuracies.`,
    
    improvementPrompt: `ROLE: You are an AI writing assistant improving technical content.
TASK: Enhance the Beginner-Friendly Tutorials or Courses content for **[TERM]**.
OUTPUT FORMAT: Return only the improved content in the same format.
CONSTRAINTS:
- Maintain accuracy while improving clarity.
- Ensure completeness for Resources for beginners to start learning.
- Keep within appropriate scope and detail level.
- Address any feedback from evaluation.`
  },

  // Column 142: Intermediate to Advanced Resources
  {
    columnId: 'learning_intermediate_advanced',
    generativePrompt: `ROLE: You are an AI/ML expert creating comprehensive glossary content.
TASK: Generate content for **[TERM]** focusing on: Intermediate to Advanced Resources.
CONTEXT: Resources for intermediate and advanced learners
OUTPUT FORMAT: Provide a markdown unordered list.
CONSTRAINTS:
- Provide moderate detail (1-2 paragraphs or 5-7 bullet points).
- Ensure accuracy and clarity for important level content.
- Focus specifically on the aspect described in the column name.
- Use technical language appropriate for the audience level.`,
    
    evaluativePrompt: `ROLE: You are an AI content reviewer specializing in technical accuracy.
TASK: Evaluate the Intermediate to Advanced Resources content for **[TERM]**.
OUTPUT FORMAT: Return JSON with "score" (1-10) and "feedback" string.
CONSTRAINTS:
- Check accuracy and completeness for Resources for intermediate and advanced learners.
- Verify appropriate detail level for important content.
- Assess clarity and technical correctness.
- Note any missing key points or inaccuracies.`,
    
    improvementPrompt: `ROLE: You are an AI writing assistant improving technical content.
TASK: Enhance the Intermediate to Advanced Resources content for **[TERM]**.
OUTPUT FORMAT: Return only the improved content in the same format.
CONSTRAINTS:
- Maintain accuracy while improving clarity.
- Ensure completeness for Resources for intermediate and advanced learners.
- Keep within appropriate scope and detail level.
- Address any feedback from evaluation.`
  },

  // Column 143: Online Courses and MOOCs
  {
    columnId: 'learning_online_courses',
    generativePrompt: `ROLE: You are an AI/ML expert creating comprehensive glossary content.
TASK: Generate content for **[TERM]** focusing on: Online Courses and MOOCs.
CONTEXT: Available online courses and MOOCs
OUTPUT FORMAT: Provide a markdown unordered list.
CONSTRAINTS:
- Provide moderate detail (1-2 paragraphs or 5-7 bullet points).
- Ensure accuracy and clarity for important level content.
- Focus specifically on the aspect described in the column name.
- Use technical language appropriate for the audience level.`,
    
    evaluativePrompt: `ROLE: You are an AI content reviewer specializing in technical accuracy.
TASK: Evaluate the Online Courses and MOOCs content for **[TERM]**.
OUTPUT FORMAT: Return JSON with "score" (1-10) and "feedback" string.
CONSTRAINTS:
- Check accuracy and completeness for Available online courses and MOOCs.
- Verify appropriate detail level for important content.
- Assess clarity and technical correctness.
- Note any missing key points or inaccuracies.`,
    
    improvementPrompt: `ROLE: You are an AI writing assistant improving technical content.
TASK: Enhance the Online Courses and MOOCs content for **[TERM]**.
OUTPUT FORMAT: Return only the improved content in the same format.
CONSTRAINTS:
- Maintain accuracy while improving clarity.
- Ensure completeness for Available online courses and MOOCs.
- Keep within appropriate scope and detail level.
- Address any feedback from evaluation.`
  },

  // Column 144: Textbooks and Reference Materials
  {
    columnId: 'learning_textbooks_reference',
    generativePrompt: `ROLE: You are an AI/ML expert creating comprehensive glossary content.
TASK: Generate content for **[TERM]** focusing on: Textbooks and Reference Materials.
CONTEXT: Recommended textbooks and reference materials
OUTPUT FORMAT: Provide a markdown unordered list.
CONSTRAINTS:
- Provide moderate detail (1-2 paragraphs or 5-7 bullet points).
- Ensure accuracy and clarity for supplementary level content.
- Focus specifically on the aspect described in the column name.
- Use technical language appropriate for the audience level.`,
    
    evaluativePrompt: `ROLE: You are an AI content reviewer specializing in technical accuracy.
TASK: Evaluate the Textbooks and Reference Materials content for **[TERM]**.
OUTPUT FORMAT: Return JSON with "score" (1-10) and "feedback" string.
CONSTRAINTS:
- Check accuracy and completeness for Recommended textbooks and reference materials.
- Verify appropriate detail level for supplementary content.
- Assess clarity and technical correctness.
- Note any missing key points or inaccuracies.`,
    
    improvementPrompt: `ROLE: You are an AI writing assistant improving technical content.
TASK: Enhance the Textbooks and Reference Materials content for **[TERM]**.
OUTPUT FORMAT: Return only the improved content in the same format.
CONSTRAINTS:
- Maintain accuracy while improving clarity.
- Ensure completeness for Recommended textbooks and reference materials.
- Keep within appropriate scope and detail level.
- Address any feedback from evaluation.`
  },

  // Column 145: Hands-on Projects or Exercises
  {
    columnId: 'learning_hands_on_projects',
    generativePrompt: `ROLE: You are an AI/ML expert creating comprehensive glossary content.
TASK: Generate content for **[TERM]** focusing on: Hands-on Projects or Exercises.
CONTEXT: Practical projects and exercises for learning
OUTPUT FORMAT: Provide a markdown unordered list.
CONSTRAINTS:
- Provide moderate detail (1-2 paragraphs or 5-7 bullet points).
- Ensure accuracy and clarity for essential level content.
- Focus specifically on the aspect described in the column name.
- Use technical language appropriate for the audience level.`,
    
    evaluativePrompt: `ROLE: You are an AI content reviewer specializing in technical accuracy.
TASK: Evaluate the Hands-on Projects or Exercises content for **[TERM]**.
OUTPUT FORMAT: Return JSON with "score" (1-10) and "feedback" string.
CONSTRAINTS:
- Check accuracy and completeness for Practical projects and exercises for learning.
- Verify appropriate detail level for essential content.
- Assess clarity and technical correctness.
- Note any missing key points or inaccuracies.`,
    
    improvementPrompt: `ROLE: You are an AI writing assistant improving technical content.
TASK: Enhance the Hands-on Projects or Exercises content for **[TERM]**.
OUTPUT FORMAT: Return only the improved content in the same format.
CONSTRAINTS:
- Maintain accuracy while improving clarity.
- Ensure completeness for Practical projects and exercises for learning.
- Keep within appropriate scope and detail level.
- Address any feedback from evaluation.`
  },

  // Column 146: Certification Programs
  {
    columnId: 'learning_certification_programs',
    generativePrompt: `ROLE: You are an AI/ML expert creating comprehensive glossary content.
TASK: Generate content for **[TERM]** focusing on: Certification Programs.
CONTEXT: Available certification programs
OUTPUT FORMAT: Provide a markdown unordered list.
CONSTRAINTS:
- Provide moderate detail (1-2 paragraphs or 5-7 bullet points).
- Ensure accuracy and clarity for supplementary level content.
- Focus specifically on the aspect described in the column name.
- Use technical language appropriate for the audience level.`,
    
    evaluativePrompt: `ROLE: You are an AI content reviewer specializing in technical accuracy.
TASK: Evaluate the Certification Programs content for **[TERM]**.
OUTPUT FORMAT: Return JSON with "score" (1-10) and "feedback" string.
CONSTRAINTS:
- Check accuracy and completeness for Available certification programs.
- Verify appropriate detail level for supplementary content.
- Assess clarity and technical correctness.
- Note any missing key points or inaccuracies.`,
    
    improvementPrompt: `ROLE: You are an AI writing assistant improving technical content.
TASK: Enhance the Certification Programs content for **[TERM]**.
OUTPUT FORMAT: Return only the improved content in the same format.
CONSTRAINTS:
- Maintain accuracy while improving clarity.
- Ensure completeness for Available certification programs.
- Keep within appropriate scope and detail level.
- Address any feedback from evaluation.`
  },

  // Column 147: Study Groups and Communities
  {
    columnId: 'learning_study_groups',
    generativePrompt: `ROLE: You are an AI/ML expert creating comprehensive glossary content.
TASK: Generate content for **[TERM]** focusing on: Study Groups and Communities.
CONTEXT: Learning communities and study groups
OUTPUT FORMAT: Provide a markdown unordered list.
CONSTRAINTS:
- Keep it concise (2-4 sentences or 3-5 bullet points).
- Ensure accuracy and clarity for supplementary level content.
- Focus specifically on the aspect described in the column name.
- Use technical language appropriate for the audience level.`,
    
    evaluativePrompt: `ROLE: You are an AI content reviewer specializing in technical accuracy.
TASK: Evaluate the Study Groups and Communities content for **[TERM]**.
OUTPUT FORMAT: Return JSON with "score" (1-10) and "feedback" string.
CONSTRAINTS:
- Check accuracy and completeness for Learning communities and study groups.
- Verify appropriate detail level for supplementary content.
- Assess clarity and technical correctness.
- Note any missing key points or inaccuracies.`,
    
    improvementPrompt: `ROLE: You are an AI writing assistant improving technical content.
TASK: Enhance the Study Groups and Communities content for **[TERM]**.
OUTPUT FORMAT: Return only the improved content in the same format.
CONSTRAINTS:
- Maintain accuracy while improving clarity.
- Ensure completeness for Learning communities and study groups.
- Keep within appropriate scope and detail level.
- Address any feedback from evaluation.`
  },

  // Column 148: Recommended Learning Paths
  {
    columnId: 'learning_learning_paths',
    generativePrompt: `ROLE: You are an AI/ML expert creating comprehensive glossary content.
TASK: Generate content for **[TERM]** focusing on: Recommended Learning Paths.
CONTEXT: Structured learning paths and progressions
OUTPUT FORMAT: Write content in Markdown format.
CONSTRAINTS:
- Provide moderate detail (1-2 paragraphs or 5-7 bullet points).
- Ensure accuracy and clarity for important level content.
- Focus specifically on the aspect described in the column name.
- Use technical language appropriate for the audience level.`,
    
    evaluativePrompt: `ROLE: You are an AI content reviewer specializing in technical accuracy.
TASK: Evaluate the Recommended Learning Paths content for **[TERM]**.
OUTPUT FORMAT: Return JSON with "score" (1-10) and "feedback" string.
CONSTRAINTS:
- Check accuracy and completeness for Structured learning paths and progressions.
- Verify appropriate detail level for important content.
- Assess clarity and technical correctness.
- Note any missing key points or inaccuracies.`,
    
    improvementPrompt: `ROLE: You are an AI writing assistant improving technical content.
TASK: Enhance the Recommended Learning Paths content for **[TERM]**.
OUTPUT FORMAT: Return only the improved content in the same format.
CONSTRAINTS:
- Maintain accuracy while improving clarity.
- Ensure completeness for Structured learning paths and progressions.
- Keep within appropriate scope and detail level.
- Address any feedback from evaluation.`
  },

  // Column 149: Interactive Element: Personalized Learning Paths
  {
    columnId: 'learning_interactive_paths',
    generativePrompt: `ROLE: You are an AI/ML expert creating comprehensive glossary content.
TASK: Generate content for **[TERM]** focusing on: Interactive Element: Personalized Learning Paths.
CONTEXT: Interactive learning path generator and skill assessment
OUTPUT FORMAT: Provide interactive content specification in markdown format.
CONSTRAINTS:
- Provide comprehensive detail with multiple sections.
- Ensure accuracy and clarity for advanced level content.
- Focus specifically on the aspect described in the column name.
- Use technical language appropriate for the audience level.`,
    
    evaluativePrompt: `ROLE: You are an AI content reviewer specializing in technical accuracy.
TASK: Evaluate the Interactive Element: Personalized Learning Paths content for **[TERM]**.
OUTPUT FORMAT: Return JSON with "score" (1-10) and "feedback" string.
CONSTRAINTS:
- Check accuracy and completeness for Interactive learning path generator and skill assessment.
- Verify appropriate detail level for advanced content.
- Assess clarity and technical correctness.
- Note any missing key points or inaccuracies.`,
    
    improvementPrompt: `ROLE: You are an AI writing assistant improving technical content.
TASK: Enhance the Interactive Element: Personalized Learning Paths content for **[TERM]**.
OUTPUT FORMAT: Return only the improved content in the same format.
CONSTRAINTS:
- Maintain accuracy while improving clarity.
- Ensure completeness for Interactive learning path generator and skill assessment.
- Keep within appropriate scope and detail level.
- Address any feedback from evaluation.`
  },

  // Column 150: Forums and Discussion Groups
  {
    columnId: 'community_forums_discussion',
    generativePrompt: `ROLE: You are an AI/ML expert creating comprehensive glossary content.
TASK: Generate content for **[TERM]** focusing on: Forums and Discussion Groups.
CONTEXT: Active forums and discussion communities
OUTPUT FORMAT: Provide a markdown unordered list.
CONSTRAINTS:
- Provide moderate detail (1-2 paragraphs or 5-7 bullet points).
- Ensure accuracy and clarity for supplementary level content.
- Focus specifically on the aspect described in the column name.
- Use technical language appropriate for the audience level.`,
    
    evaluativePrompt: `ROLE: You are an AI content reviewer specializing in technical accuracy.
TASK: Evaluate the Forums and Discussion Groups content for **[TERM]**.
OUTPUT FORMAT: Return JSON with "score" (1-10) and "feedback" string.
CONSTRAINTS:
- Check accuracy and completeness for Active forums and discussion communities.
- Verify appropriate detail level for supplementary content.
- Assess clarity and technical correctness.
- Note any missing key points or inaccuracies.`,
    
    improvementPrompt: `ROLE: You are an AI writing assistant improving technical content.
TASK: Enhance the Forums and Discussion Groups content for **[TERM]**.
OUTPUT FORMAT: Return only the improved content in the same format.
CONSTRAINTS:
- Maintain accuracy while improving clarity.
- Ensure completeness for Active forums and discussion communities.
- Keep within appropriate scope and detail level.
- Address any feedback from evaluation.`
  },

  // Column 151: Professional Associations or Societies
  {
    columnId: 'community_professional_associations',
    generativePrompt: `ROLE: You are an AI/ML expert creating comprehensive glossary content.
TASK: Generate content for **[TERM]** focusing on: Professional Associations or Societies.
CONTEXT: Relevant professional organizations
OUTPUT FORMAT: Provide a markdown unordered list.
CONSTRAINTS:
- Provide moderate detail (1-2 paragraphs or 5-7 bullet points).
- Ensure accuracy and clarity for supplementary level content.
- Focus specifically on the aspect described in the column name.
- Use technical language appropriate for the audience level.`,
    
    evaluativePrompt: `ROLE: You are an AI content reviewer specializing in technical accuracy.
TASK: Evaluate the Professional Associations or Societies content for **[TERM]**.
OUTPUT FORMAT: Return JSON with "score" (1-10) and "feedback" string.
CONSTRAINTS:
- Check accuracy and completeness for Relevant professional organizations.
- Verify appropriate detail level for supplementary content.
- Assess clarity and technical correctness.
- Note any missing key points or inaccuracies.`,
    
    improvementPrompt: `ROLE: You are an AI writing assistant improving technical content.
TASK: Enhance the Professional Associations or Societies content for **[TERM]**.
OUTPUT FORMAT: Return only the improved content in the same format.
CONSTRAINTS:
- Maintain accuracy while improving clarity.
- Ensure completeness for Relevant professional organizations.
- Keep within appropriate scope and detail level.
- Address any feedback from evaluation.`
  },

  // Column 152: Conferences and Events
  {
    columnId: 'community_conferences_events',
    generativePrompt: `ROLE: You are an AI/ML expert creating comprehensive glossary content.
TASK: Generate content for **[TERM]** focusing on: Conferences and Events.
CONTEXT: Major conferences and community events
OUTPUT FORMAT: Provide a markdown unordered list.
CONSTRAINTS:
- Provide moderate detail (1-2 paragraphs or 5-7 bullet points).
- Ensure accuracy and clarity for supplementary level content.
- Focus specifically on the aspect described in the column name.
- Use technical language appropriate for the audience level.`,
    
    evaluativePrompt: `ROLE: You are an AI content reviewer specializing in technical accuracy.
TASK: Evaluate the Conferences and Events content for **[TERM]**.
OUTPUT FORMAT: Return JSON with "score" (1-10) and "feedback" string.
CONSTRAINTS:
- Check accuracy and completeness for Major conferences and community events.
- Verify appropriate detail level for supplementary content.
- Assess clarity and technical correctness.
- Note any missing key points or inaccuracies.`,
    
    improvementPrompt: `ROLE: You are an AI writing assistant improving technical content.
TASK: Enhance the Conferences and Events content for **[TERM]**.
OUTPUT FORMAT: Return only the improved content in the same format.
CONSTRAINTS:
- Maintain accuracy while improving clarity.
- Ensure completeness for Major conferences and community events.
- Keep within appropriate scope and detail level.
- Address any feedback from evaluation.`
  },

  // Column 153: Online Communities and Social Media
  {
    columnId: 'community_online_communities',
    generativePrompt: `ROLE: You are an AI/ML expert creating comprehensive glossary content.
TASK: Generate content for **[TERM]** focusing on: Online Communities and Social Media.
CONTEXT: Social media groups and online communities
OUTPUT FORMAT: Provide a markdown unordered list.
CONSTRAINTS:
- Keep it concise (2-4 sentences or 3-5 bullet points).
- Ensure accuracy and clarity for supplementary level content.
- Focus specifically on the aspect described in the column name.
- Use technical language appropriate for the audience level.`,
    
    evaluativePrompt: `ROLE: You are an AI content reviewer specializing in technical accuracy.
TASK: Evaluate the Online Communities and Social Media content for **[TERM]**.
OUTPUT FORMAT: Return JSON with "score" (1-10) and "feedback" string.
CONSTRAINTS:
- Check accuracy and completeness for Social media groups and online communities.
- Verify appropriate detail level for supplementary content.
- Assess clarity and technical correctness.
- Note any missing key points or inaccuracies.`,
    
    improvementPrompt: `ROLE: You are an AI writing assistant improving technical content.
TASK: Enhance the Online Communities and Social Media content for **[TERM]**.
OUTPUT FORMAT: Return only the improved content in the same format.
CONSTRAINTS:
- Maintain accuracy while improving clarity.
- Ensure completeness for Social media groups and online communities.
- Keep within appropriate scope and detail level.
- Address any feedback from evaluation.`
  },

  // Column 154: Contributing to the Community
  {
    columnId: 'community_contributing',
    generativePrompt: `ROLE: You are an AI/ML expert creating comprehensive glossary content.
TASK: Generate content for **[TERM]** focusing on: Contributing to the Community.
CONTEXT: How to contribute and participate
OUTPUT FORMAT: Write content in Markdown format.
CONSTRAINTS:
- Provide moderate detail (1-2 paragraphs or 5-7 bullet points).
- Ensure accuracy and clarity for supplementary level content.
- Focus specifically on the aspect described in the column name.
- Use technical language appropriate for the audience level.`,
    
    evaluativePrompt: `ROLE: You are an AI content reviewer specializing in technical accuracy.
TASK: Evaluate the Contributing to the Community content for **[TERM]**.
OUTPUT FORMAT: Return JSON with "score" (1-10) and "feedback" string.
CONSTRAINTS:
- Check accuracy and completeness for How to contribute and participate.
- Verify appropriate detail level for supplementary content.
- Assess clarity and technical correctness.
- Note any missing key points or inaccuracies.`,
    
    improvementPrompt: `ROLE: You are an AI writing assistant improving technical content.
TASK: Enhance the Contributing to the Community content for **[TERM]**.
OUTPUT FORMAT: Return only the improved content in the same format.
CONSTRAINTS:
- Maintain accuracy while improving clarity.
- Ensure completeness for How to contribute and participate.
- Keep within appropriate scope and detail level.
- Address any feedback from evaluation.`
  },

  // Column 155: Interactive Element: Community Forum Links or Live Chat
  {
    columnId: 'community_interactive_forum',
    generativePrompt: `ROLE: You are an AI/ML expert creating comprehensive glossary content.
TASK: Generate content for **[TERM]** focusing on: Interactive Element: Community Forum Links or Live Chat.
CONTEXT: Interactive community features and chat
OUTPUT FORMAT: Provide interactive content specification in markdown format.
CONSTRAINTS:
- Provide moderate detail (1-2 paragraphs or 5-7 bullet points).
- Ensure accuracy and clarity for advanced level content.
- Focus specifically on the aspect described in the column name.
- Use technical language appropriate for the audience level.`,
    
    evaluativePrompt: `ROLE: You are an AI content reviewer specializing in technical accuracy.
TASK: Evaluate the Interactive Element: Community Forum Links or Live Chat content for **[TERM]**.
OUTPUT FORMAT: Return JSON with "score" (1-10) and "feedback" string.
CONSTRAINTS:
- Check accuracy and completeness for Interactive community features and chat.
- Verify appropriate detail level for advanced content.
- Assess clarity and technical correctness.
- Note any missing key points or inaccuracies.`,
    
    improvementPrompt: `ROLE: You are an AI writing assistant improving technical content.
TASK: Enhance the Interactive Element: Community Forum Links or Live Chat content for **[TERM]**.
OUTPUT FORMAT: Return only the improved content in the same format.
CONSTRAINTS:
- Maintain accuracy while improving clarity.
- Ensure completeness for Interactive community features and chat.
- Keep within appropriate scope and detail level.
- Address any feedback from evaluation.`
  },

  // Column 156: Emerging Trends and Technologies
  {
    columnId: 'future_emerging_trends',
    generativePrompt: `ROLE: You are an AI/ML expert creating comprehensive glossary content.
TASK: Generate content for **[TERM]** focusing on: Emerging Trends and Technologies.
CONTEXT: Emerging trends and future technologies
OUTPUT FORMAT: Write content in Markdown format.
CONSTRAINTS:
- Provide moderate detail (1-2 paragraphs or 5-7 bullet points).
- Ensure accuracy and clarity for important level content.
- Focus specifically on the aspect described in the column name.
- Use technical language appropriate for the audience level.`,
    
    evaluativePrompt: `ROLE: You are an AI content reviewer specializing in technical accuracy.
TASK: Evaluate the Emerging Trends and Technologies content for **[TERM]**.
OUTPUT FORMAT: Return JSON with "score" (1-10) and "feedback" string.
CONSTRAINTS:
- Check accuracy and completeness for Emerging trends and future technologies.
- Verify appropriate detail level for important content.
- Assess clarity and technical correctness.
- Note any missing key points or inaccuracies.`,
    
    improvementPrompt: `ROLE: You are an AI writing assistant improving technical content.
TASK: Enhance the Emerging Trends and Technologies content for **[TERM]**.
OUTPUT FORMAT: Return only the improved content in the same format.
CONSTRAINTS:
- Maintain accuracy while improving clarity.
- Ensure completeness for Emerging trends and future technologies.
- Keep within appropriate scope and detail level.
- Address any feedback from evaluation.`
  },

  // Column 157: Predictions and Speculations
  {
    columnId: 'future_predictions_speculations',
    generativePrompt: `ROLE: You are an AI/ML expert creating comprehensive glossary content.
TASK: Generate content for **[TERM]** focusing on: Predictions and Speculations.
CONTEXT: Future predictions and expert speculations
OUTPUT FORMAT: Write content in Markdown format.
CONSTRAINTS:
- Provide moderate detail (1-2 paragraphs or 5-7 bullet points).
- Ensure accuracy and clarity for supplementary level content.
- Focus specifically on the aspect described in the column name.
- Use technical language appropriate for the audience level.`,
    
    evaluativePrompt: `ROLE: You are an AI content reviewer specializing in technical accuracy.
TASK: Evaluate the Predictions and Speculations content for **[TERM]**.
OUTPUT FORMAT: Return JSON with "score" (1-10) and "feedback" string.
CONSTRAINTS:
- Check accuracy and completeness for Future predictions and expert speculations.
- Verify appropriate detail level for supplementary content.
- Assess clarity and technical correctness.
- Note any missing key points or inaccuracies.`,
    
    improvementPrompt: `ROLE: You are an AI writing assistant improving technical content.
TASK: Enhance the Predictions and Speculations content for **[TERM]**.
OUTPUT FORMAT: Return only the improved content in the same format.
CONSTRAINTS:
- Maintain accuracy while improving clarity.
- Ensure completeness for Future predictions and expert speculations.
- Keep within appropriate scope and detail level.
- Address any feedback from evaluation.`
  },

  // Column 158: Ongoing Research and Development
  {
    columnId: 'future_ongoing_research',
    generativePrompt: `ROLE: You are an AI/ML expert creating comprehensive glossary content.
TASK: Generate content for **[TERM]** focusing on: Ongoing Research and Development.
CONTEXT: Current research directions and development
OUTPUT FORMAT: Write content in Markdown format.
CONSTRAINTS:
- Provide moderate detail (1-2 paragraphs or 5-7 bullet points).
- Ensure accuracy and clarity for important level content.
- Focus specifically on the aspect described in the column name.
- Use technical language appropriate for the audience level.`,
    
    evaluativePrompt: `ROLE: You are an AI content reviewer specializing in technical accuracy.
TASK: Evaluate the Ongoing Research and Development content for **[TERM]**.
OUTPUT FORMAT: Return JSON with "score" (1-10) and "feedback" string.
CONSTRAINTS:
- Check accuracy and completeness for Current research directions and development.
- Verify appropriate detail level for important content.
- Assess clarity and technical correctness.
- Note any missing key points or inaccuracies.`,
    
    improvementPrompt: `ROLE: You are an AI writing assistant improving technical content.
TASK: Enhance the Ongoing Research and Development content for **[TERM]**.
OUTPUT FORMAT: Return only the improved content in the same format.
CONSTRAINTS:
- Maintain accuracy while improving clarity.
- Ensure completeness for Current research directions and development.
- Keep within appropriate scope and detail level.
- Address any feedback from evaluation.`
  },

  // Column 159: Potential Breakthroughs
  {
    columnId: 'future_potential_breakthroughs',
    generativePrompt: `ROLE: You are an AI/ML expert creating comprehensive glossary content.
TASK: Generate content for **[TERM]** focusing on: Potential Breakthroughs.
CONTEXT: Potential game-changing breakthroughs
OUTPUT FORMAT: Write content in Markdown format.
CONSTRAINTS:
- Provide moderate detail (1-2 paragraphs or 5-7 bullet points).
- Ensure accuracy and clarity for supplementary level content.
- Focus specifically on the aspect described in the column name.
- Use technical language appropriate for the audience level.`,
    
    evaluativePrompt: `ROLE: You are an AI content reviewer specializing in technical accuracy.
TASK: Evaluate the Potential Breakthroughs content for **[TERM]**.
OUTPUT FORMAT: Return JSON with "score" (1-10) and "feedback" string.
CONSTRAINTS:
- Check accuracy and completeness for Potential game-changing breakthroughs.
- Verify appropriate detail level for supplementary content.
- Assess clarity and technical correctness.
- Note any missing key points or inaccuracies.`,
    
    improvementPrompt: `ROLE: You are an AI writing assistant improving technical content.
TASK: Enhance the Potential Breakthroughs content for **[TERM]**.
OUTPUT FORMAT: Return only the improved content in the same format.
CONSTRAINTS:
- Maintain accuracy while improving clarity.
- Ensure completeness for Potential game-changing breakthroughs.
- Keep within appropriate scope and detail level.
- Address any feedback from evaluation.`
  },

  // Column 160: Roadmaps and Timelines
  {
    columnId: 'future_roadmaps_timelines',
    generativePrompt: `ROLE: You are an AI/ML expert creating comprehensive glossary content.
TASK: Generate content for **[TERM]** focusing on: Roadmaps and Timelines.
CONTEXT: Development roadmaps and expected timelines
OUTPUT FORMAT: Write content in Markdown format.
CONSTRAINTS:
- Provide moderate detail (1-2 paragraphs or 5-7 bullet points).
- Ensure accuracy and clarity for supplementary level content.
- Focus specifically on the aspect described in the column name.
- Use technical language appropriate for the audience level.`,
    
    evaluativePrompt: `ROLE: You are an AI content reviewer specializing in technical accuracy.
TASK: Evaluate the Roadmaps and Timelines content for **[TERM]**.
OUTPUT FORMAT: Return JSON with "score" (1-10) and "feedback" string.
CONSTRAINTS:
- Check accuracy and completeness for Development roadmaps and expected timelines.
- Verify appropriate detail level for supplementary content.
- Assess clarity and technical correctness.
- Note any missing key points or inaccuracies.`,
    
    improvementPrompt: `ROLE: You are an AI writing assistant improving technical content.
TASK: Enhance the Roadmaps and Timelines content for **[TERM]**.
OUTPUT FORMAT: Return only the improved content in the same format.
CONSTRAINTS:
- Maintain accuracy while improving clarity.
- Ensure completeness for Development roadmaps and expected timelines.
- Keep within appropriate scope and detail level.
- Address any feedback from evaluation.`
  },

  // Column 161: Vision Statements from Leaders
  {
    columnId: 'future_vision_statements',
    generativePrompt: `ROLE: You are an AI/ML expert creating comprehensive glossary content.
TASK: Generate content for **[TERM]** focusing on: Vision Statements from Leaders.
CONTEXT: Vision statements from industry leaders
OUTPUT FORMAT: Provide a markdown unordered list.
CONSTRAINTS:
- Provide moderate detail (1-2 paragraphs or 5-7 bullet points).
- Ensure accuracy and clarity for supplementary level content.
- Focus specifically on the aspect described in the column name.
- Use technical language appropriate for the audience level.`,
    
    evaluativePrompt: `ROLE: You are an AI content reviewer specializing in technical accuracy.
TASK: Evaluate the Vision Statements from Leaders content for **[TERM]**.
OUTPUT FORMAT: Return JSON with "score" (1-10) and "feedback" string.
CONSTRAINTS:
- Check accuracy and completeness for Vision statements from industry leaders.
- Verify appropriate detail level for supplementary content.
- Assess clarity and technical correctness.
- Note any missing key points or inaccuracies.`,
    
    improvementPrompt: `ROLE: You are an AI writing assistant improving technical content.
TASK: Enhance the Vision Statements from Leaders content for **[TERM]**.
OUTPUT FORMAT: Return only the improved content in the same format.
CONSTRAINTS:
- Maintain accuracy while improving clarity.
- Ensure completeness for Vision statements from industry leaders.
- Keep within appropriate scope and detail level.
- Address any feedback from evaluation.`
  },

  // Column 162: Interactive Element: Future Predictions Poll
  {
    columnId: 'future_interactive_predictions',
    generativePrompt: `ROLE: You are an AI/ML expert creating comprehensive glossary content.
TASK: Generate content for **[TERM]** focusing on: Interactive Element: Future Predictions Poll.
CONTEXT: Interactive future trends visualization
OUTPUT FORMAT: Provide interactive content specification in markdown format.
CONSTRAINTS:
- Provide moderate detail (1-2 paragraphs or 5-7 bullet points).
- Ensure accuracy and clarity for advanced level content.
- Focus specifically on the aspect described in the column name.
- Use technical language appropriate for the audience level.`,
    
    evaluativePrompt: `ROLE: You are an AI content reviewer specializing in technical accuracy.
TASK: Evaluate the Interactive Element: Future Predictions Poll content for **[TERM]**.
OUTPUT FORMAT: Return JSON with "score" (1-10) and "feedback" string.
CONSTRAINTS:
- Check accuracy and completeness for Interactive future trends visualization.
- Verify appropriate detail level for advanced content.
- Assess clarity and technical correctness.
- Note any missing key points or inaccuracies.`,
    
    improvementPrompt: `ROLE: You are an AI writing assistant improving technical content.
TASK: Enhance the Interactive Element: Future Predictions Poll content for **[TERM]**.
OUTPUT FORMAT: Return only the improved content in the same format.
CONSTRAINTS:
- Maintain accuracy while improving clarity.
- Ensure completeness for Interactive future trends visualization.
- Keep within appropriate scope and detail level.
- Address any feedback from evaluation.`
  },

  // Column 163: Common Questions and Answers
  {
    columnId: 'faq_common_questions',
    generativePrompt: `ROLE: You are an AI/ML expert creating comprehensive glossary content.
TASK: Generate content for **[TERM]** focusing on: Common Questions and Answers.
CONTEXT: Frequently asked questions with answers
OUTPUT FORMAT: Provide a markdown unordered list.
CONSTRAINTS:
- Provide moderate detail (1-2 paragraphs or 5-7 bullet points).
- Ensure accuracy and clarity for essential level content.
- Focus specifically on the aspect described in the column name.
- Use technical language appropriate for the audience level.`,
    
    evaluativePrompt: `ROLE: You are an AI content reviewer specializing in technical accuracy.
TASK: Evaluate the Common Questions and Answers content for **[TERM]**.
OUTPUT FORMAT: Return JSON with "score" (1-10) and "feedback" string.
CONSTRAINTS:
- Check accuracy and completeness for Frequently asked questions with answers.
- Verify appropriate detail level for essential content.
- Assess clarity and technical correctness.
- Note any missing key points or inaccuracies.`,
    
    improvementPrompt: `ROLE: You are an AI writing assistant improving technical content.
TASK: Enhance the Common Questions and Answers content for **[TERM]**.
OUTPUT FORMAT: Return only the improved content in the same format.
CONSTRAINTS:
- Maintain accuracy while improving clarity.
- Ensure completeness for Frequently asked questions with answers.
- Keep within appropriate scope and detail level.
- Address any feedback from evaluation.`
  },

  // Column 164: Clarifications of Misunderstandings
  {
    columnId: 'faq_clarifications_misunderstandings',
    generativePrompt: `ROLE: You are an AI/ML expert creating comprehensive glossary content.
TASK: Generate content for **[TERM]** focusing on: Clarifications of Misunderstandings.
CONTEXT: Common misunderstandings clarified
OUTPUT FORMAT: Write content in Markdown format.
CONSTRAINTS:
- Provide moderate detail (1-2 paragraphs or 5-7 bullet points).
- Ensure accuracy and clarity for important level content.
- Focus specifically on the aspect described in the column name.
- Use technical language appropriate for the audience level.`,
    
    evaluativePrompt: `ROLE: You are an AI content reviewer specializing in technical accuracy.
TASK: Evaluate the Clarifications of Misunderstandings content for **[TERM]**.
OUTPUT FORMAT: Return JSON with "score" (1-10) and "feedback" string.
CONSTRAINTS:
- Check accuracy and completeness for Common misunderstandings clarified.
- Verify appropriate detail level for important content.
- Assess clarity and technical correctness.
- Note any missing key points or inaccuracies.`,
    
    improvementPrompt: `ROLE: You are an AI writing assistant improving technical content.
TASK: Enhance the Clarifications of Misunderstandings content for **[TERM]**.
OUTPUT FORMAT: Return only the improved content in the same format.
CONSTRAINTS:
- Maintain accuracy while improving clarity.
- Ensure completeness for Common misunderstandings clarified.
- Keep within appropriate scope and detail level.
- Address any feedback from evaluation.`
  },

  // Column 165: Practical Tips and Advice
  {
    columnId: 'faq_practical_tips',
    generativePrompt: `ROLE: You are an AI/ML expert creating comprehensive glossary content.
TASK: Generate content for **[TERM]** focusing on: Practical Tips and Advice.
CONTEXT: Practical tips from experience
OUTPUT FORMAT: Write content in Markdown format.
CONSTRAINTS:
- Provide moderate detail (1-2 paragraphs or 5-7 bullet points).
- Ensure accuracy and clarity for important level content.
- Focus specifically on the aspect described in the column name.
- Use technical language appropriate for the audience level.`,
    
    evaluativePrompt: `ROLE: You are an AI content reviewer specializing in technical accuracy.
TASK: Evaluate the Practical Tips and Advice content for **[TERM]**.
OUTPUT FORMAT: Return JSON with "score" (1-10) and "feedback" string.
CONSTRAINTS:
- Check accuracy and completeness for Practical tips from experience.
- Verify appropriate detail level for important content.
- Assess clarity and technical correctness.
- Note any missing key points or inaccuracies.`,
    
    improvementPrompt: `ROLE: You are an AI writing assistant improving technical content.
TASK: Enhance the Practical Tips and Advice content for **[TERM]**.
OUTPUT FORMAT: Return only the improved content in the same format.
CONSTRAINTS:
- Maintain accuracy while improving clarity.
- Ensure completeness for Practical tips from experience.
- Keep within appropriate scope and detail level.
- Address any feedback from evaluation.`
  },

  // Column 166: Quick Reference Guide
  {
    columnId: 'faq_quick_reference',
    generativePrompt: `ROLE: You are an AI/ML expert creating comprehensive glossary content.
TASK: Generate content for **[TERM]** focusing on: Quick Reference Guide.
CONTEXT: Quick reference for common tasks
OUTPUT FORMAT: Write content in Markdown format.
CONSTRAINTS:
- Provide moderate detail (1-2 paragraphs or 5-7 bullet points).
- Ensure accuracy and clarity for essential level content.
- Focus specifically on the aspect described in the column name.
- Use technical language appropriate for the audience level.`,
    
    evaluativePrompt: `ROLE: You are an AI content reviewer specializing in technical accuracy.
TASK: Evaluate the Quick Reference Guide content for **[TERM]**.
OUTPUT FORMAT: Return JSON with "score" (1-10) and "feedback" string.
CONSTRAINTS:
- Check accuracy and completeness for Quick reference for common tasks.
- Verify appropriate detail level for essential content.
- Assess clarity and technical correctness.
- Note any missing key points or inaccuracies.`,
    
    improvementPrompt: `ROLE: You are an AI writing assistant improving technical content.
TASK: Enhance the Quick Reference Guide content for **[TERM]**.
OUTPUT FORMAT: Return only the improved content in the same format.
CONSTRAINTS:
- Maintain accuracy while improving clarity.
- Ensure completeness for Quick reference for common tasks.
- Keep within appropriate scope and detail level.
- Address any feedback from evaluation.`
  },

  // Column 167: Interactive Element: Searchable FAQ
  {
    columnId: 'faq_interactive_search',
    generativePrompt: `ROLE: You are an AI/ML expert creating comprehensive glossary content.
TASK: Generate content for **[TERM]** focusing on: Interactive Element: Searchable FAQ.
CONTEXT: Interactive FAQ search and assistance
OUTPUT FORMAT: Provide interactive content specification in markdown format.
CONSTRAINTS:
- Provide comprehensive detail with multiple sections.
- Ensure accuracy and clarity for advanced level content.
- Focus specifically on the aspect described in the column name.
- Use technical language appropriate for the audience level.`,
    
    evaluativePrompt: `ROLE: You are an AI content reviewer specializing in technical accuracy.
TASK: Evaluate the Interactive Element: Searchable FAQ content for **[TERM]**.
OUTPUT FORMAT: Return JSON with "score" (1-10) and "feedback" string.
CONSTRAINTS:
- Check accuracy and completeness for Interactive FAQ search and assistance.
- Verify appropriate detail level for advanced content.
- Assess clarity and technical correctness.
- Note any missing key points or inaccuracies.`,
    
    improvementPrompt: `ROLE: You are an AI writing assistant improving technical content.
TASK: Enhance the Interactive Element: Searchable FAQ content for **[TERM]**.
OUTPUT FORMAT: Return only the improved content in the same format.
CONSTRAINTS:
- Maintain accuracy while improving clarity.
- Ensure completeness for Interactive FAQ search and assistance.
- Keep within appropriate scope and detail level.
- Address any feedback from evaluation.`
  },

  // Column 168: Common Issues and Solutions
  {
    columnId: 'troubleshooting_common_issues',
    generativePrompt: `ROLE: You are an AI/ML expert creating comprehensive glossary content.
TASK: Generate content for **[TERM]** focusing on: Common Issues and Solutions.
CONTEXT: Common problems and their solutions
OUTPUT FORMAT: Provide a markdown unordered list.
CONSTRAINTS:
- Provide moderate detail (1-2 paragraphs or 5-7 bullet points).
- Ensure accuracy and clarity for essential level content.
- Focus specifically on the aspect described in the column name.
- Use technical language appropriate for the audience level.`,
    
    evaluativePrompt: `ROLE: You are an AI content reviewer specializing in technical accuracy.
TASK: Evaluate the Common Issues and Solutions content for **[TERM]**.
OUTPUT FORMAT: Return JSON with "score" (1-10) and "feedback" string.
CONSTRAINTS:
- Check accuracy and completeness for Common problems and their solutions.
- Verify appropriate detail level for essential content.
- Assess clarity and technical correctness.
- Note any missing key points or inaccuracies.`,
    
    improvementPrompt: `ROLE: You are an AI writing assistant improving technical content.
TASK: Enhance the Common Issues and Solutions content for **[TERM]**.
OUTPUT FORMAT: Return only the improved content in the same format.
CONSTRAINTS:
- Maintain accuracy while improving clarity.
- Ensure completeness for Common problems and their solutions.
- Keep within appropriate scope and detail level.
- Address any feedback from evaluation.`
  },

  // Column 169: Diagnostic Steps
  {
    columnId: 'troubleshooting_diagnostic_steps',
    generativePrompt: `ROLE: You are an AI/ML expert creating comprehensive glossary content.
TASK: Generate content for **[TERM]** focusing on: Diagnostic Steps.
CONTEXT: Step-by-step diagnostic procedures
OUTPUT FORMAT: Write content in Markdown format.
CONSTRAINTS:
- Provide moderate detail (1-2 paragraphs or 5-7 bullet points).
- Ensure accuracy and clarity for important level content.
- Focus specifically on the aspect described in the column name.
- Use technical language appropriate for the audience level.`,
    
    evaluativePrompt: `ROLE: You are an AI content reviewer specializing in technical accuracy.
TASK: Evaluate the Diagnostic Steps content for **[TERM]**.
OUTPUT FORMAT: Return JSON with "score" (1-10) and "feedback" string.
CONSTRAINTS:
- Check accuracy and completeness for Step-by-step diagnostic procedures.
- Verify appropriate detail level for important content.
- Assess clarity and technical correctness.
- Note any missing key points or inaccuracies.`,
    
    improvementPrompt: `ROLE: You are an AI writing assistant improving technical content.
TASK: Enhance the Diagnostic Steps content for **[TERM]**.
OUTPUT FORMAT: Return only the improved content in the same format.
CONSTRAINTS:
- Maintain accuracy while improving clarity.
- Ensure completeness for Step-by-step diagnostic procedures.
- Keep within appropriate scope and detail level.
- Address any feedback from evaluation.`
  },

  // Column 170: Error Messages and Codes
  {
    columnId: 'troubleshooting_error_messages',
    generativePrompt: `ROLE: You are an AI/ML expert creating comprehensive glossary content.
TASK: Generate content for **[TERM]** focusing on: Error Messages and Codes.
CONTEXT: Common error messages and their meanings
OUTPUT FORMAT: Provide a markdown unordered list.
CONSTRAINTS:
- Provide moderate detail (1-2 paragraphs or 5-7 bullet points).
- Ensure accuracy and clarity for important level content.
- Focus specifically on the aspect described in the column name.
- Use technical language appropriate for the audience level.`,
    
    evaluativePrompt: `ROLE: You are an AI content reviewer specializing in technical accuracy.
TASK: Evaluate the Error Messages and Codes content for **[TERM]**.
OUTPUT FORMAT: Return JSON with "score" (1-10) and "feedback" string.
CONSTRAINTS:
- Check accuracy and completeness for Common error messages and their meanings.
- Verify appropriate detail level for important content.
- Assess clarity and technical correctness.
- Note any missing key points or inaccuracies.`,
    
    improvementPrompt: `ROLE: You are an AI writing assistant improving technical content.
TASK: Enhance the Error Messages and Codes content for **[TERM]**.
OUTPUT FORMAT: Return only the improved content in the same format.
CONSTRAINTS:
- Maintain accuracy while improving clarity.
- Ensure completeness for Common error messages and their meanings.
- Keep within appropriate scope and detail level.
- Address any feedback from evaluation.`
  },

  // Column 171: Workarounds and Temporary Fixes
  {
    columnId: 'troubleshooting_workarounds',
    generativePrompt: `ROLE: You are an AI/ML expert creating comprehensive glossary content.
TASK: Generate content for **[TERM]** focusing on: Workarounds and Temporary Fixes.
CONTEXT: Temporary solutions and workarounds
OUTPUT FORMAT: Write content in Markdown format.
CONSTRAINTS:
- Provide moderate detail (1-2 paragraphs or 5-7 bullet points).
- Ensure accuracy and clarity for supplementary level content.
- Focus specifically on the aspect described in the column name.
- Use technical language appropriate for the audience level.`,
    
    evaluativePrompt: `ROLE: You are an AI content reviewer specializing in technical accuracy.
TASK: Evaluate the Workarounds and Temporary Fixes content for **[TERM]**.
OUTPUT FORMAT: Return JSON with "score" (1-10) and "feedback" string.
CONSTRAINTS:
- Check accuracy and completeness for Temporary solutions and workarounds.
- Verify appropriate detail level for supplementary content.
- Assess clarity and technical correctness.
- Note any missing key points or inaccuracies.`,
    
    improvementPrompt: `ROLE: You are an AI writing assistant improving technical content.
TASK: Enhance the Workarounds and Temporary Fixes content for **[TERM]**.
OUTPUT FORMAT: Return only the improved content in the same format.
CONSTRAINTS:
- Maintain accuracy while improving clarity.
- Ensure completeness for Temporary solutions and workarounds.
- Keep within appropriate scope and detail level.
- Address any feedback from evaluation.`
  },

  // Column 172: Support Resources
  {
    columnId: 'troubleshooting_support_resources',
    generativePrompt: `ROLE: You are an AI/ML expert creating comprehensive glossary content.
TASK: Generate content for **[TERM]** focusing on: Support Resources.
CONTEXT: Where to get additional help
OUTPUT FORMAT: Provide a markdown unordered list.
CONSTRAINTS:
- Keep it concise (2-4 sentences or 3-5 bullet points).
- Ensure accuracy and clarity for supplementary level content.
- Focus specifically on the aspect described in the column name.
- Use technical language appropriate for the audience level.`,
    
    evaluativePrompt: `ROLE: You are an AI content reviewer specializing in technical accuracy.
TASK: Evaluate the Support Resources content for **[TERM]**.
OUTPUT FORMAT: Return JSON with "score" (1-10) and "feedback" string.
CONSTRAINTS:
- Check accuracy and completeness for Where to get additional help.
- Verify appropriate detail level for supplementary content.
- Assess clarity and technical correctness.
- Note any missing key points or inaccuracies.`,
    
    improvementPrompt: `ROLE: You are an AI writing assistant improving technical content.
TASK: Enhance the Support Resources content for **[TERM]**.
OUTPUT FORMAT: Return only the improved content in the same format.
CONSTRAINTS:
- Maintain accuracy while improving clarity.
- Ensure completeness for Where to get additional help.
- Keep within appropriate scope and detail level.
- Address any feedback from evaluation.`
  },

  // Column 173: Interactive Element: Diagnostic Tool
  {
    columnId: 'troubleshooting_interactive_diagnostic',
    generativePrompt: `ROLE: You are an AI/ML expert creating comprehensive glossary content.
TASK: Generate content for **[TERM]** focusing on: Interactive Element: Diagnostic Tool.
CONTEXT: Interactive troubleshooting decision tree
OUTPUT FORMAT: Provide interactive content specification in markdown format.
CONSTRAINTS:
- Provide comprehensive detail with multiple sections.
- Ensure accuracy and clarity for advanced level content.
- Focus specifically on the aspect described in the column name.
- Use technical language appropriate for the audience level.`,
    
    evaluativePrompt: `ROLE: You are an AI content reviewer specializing in technical accuracy.
TASK: Evaluate the Interactive Element: Diagnostic Tool content for **[TERM]**.
OUTPUT FORMAT: Return JSON with "score" (1-10) and "feedback" string.
CONSTRAINTS:
- Check accuracy and completeness for Interactive troubleshooting decision tree.
- Verify appropriate detail level for advanced content.
- Assess clarity and technical correctness.
- Note any missing key points or inaccuracies.`,
    
    improvementPrompt: `ROLE: You are an AI writing assistant improving technical content.
TASK: Enhance the Interactive Element: Diagnostic Tool content for **[TERM]**.
OUTPUT FORMAT: Return only the improved content in the same format.
CONSTRAINTS:
- Maintain accuracy while improving clarity.
- Ensure completeness for Interactive troubleshooting decision tree.
- Keep within appropriate scope and detail level.
- Address any feedback from evaluation.`
  },

  // Column 174: Finance and Banking
  {
    columnId: 'industry_finance_banking',
    generativePrompt: `ROLE: You are an AI/ML expert creating comprehensive glossary content.
TASK: Generate content for **[TERM]** focusing on: Finance and Banking.
CONTEXT: Applications in finance and banking sector
OUTPUT FORMAT: Write content in Markdown format.
CONSTRAINTS:
- Provide moderate detail (1-2 paragraphs or 5-7 bullet points).
- Ensure accuracy and clarity for important level content.
- Focus specifically on the aspect described in the column name.
- Use technical language appropriate for the audience level.`,
    
    evaluativePrompt: `ROLE: You are an AI content reviewer specializing in technical accuracy.
TASK: Evaluate the Finance and Banking content for **[TERM]**.
OUTPUT FORMAT: Return JSON with "score" (1-10) and "feedback" string.
CONSTRAINTS:
- Check accuracy and completeness for Applications in finance and banking sector.
- Verify appropriate detail level for important content.
- Assess clarity and technical correctness.
- Note any missing key points or inaccuracies.`,
    
    improvementPrompt: `ROLE: You are an AI writing assistant improving technical content.
TASK: Enhance the Finance and Banking content for **[TERM]**.
OUTPUT FORMAT: Return only the improved content in the same format.
CONSTRAINTS:
- Maintain accuracy while improving clarity.
- Ensure completeness for Applications in finance and banking sector.
- Keep within appropriate scope and detail level.
- Address any feedback from evaluation.`
  },

  // Column 175: Healthcare and Medical
  {
    columnId: 'industry_healthcare_medical',
    generativePrompt: `ROLE: You are an AI/ML expert creating comprehensive glossary content.
TASK: Generate content for **[TERM]** focusing on: Healthcare and Medical.
CONTEXT: Healthcare and medical applications
OUTPUT FORMAT: Write content in Markdown format.
CONSTRAINTS:
- Provide moderate detail (1-2 paragraphs or 5-7 bullet points).
- Ensure accuracy and clarity for important level content.
- Focus specifically on the aspect described in the column name.
- Use technical language appropriate for the audience level.`,
    
    evaluativePrompt: `ROLE: You are an AI content reviewer specializing in technical accuracy.
TASK: Evaluate the Healthcare and Medical content for **[TERM]**.
OUTPUT FORMAT: Return JSON with "score" (1-10) and "feedback" string.
CONSTRAINTS:
- Check accuracy and completeness for Healthcare and medical applications.
- Verify appropriate detail level for important content.
- Assess clarity and technical correctness.
- Note any missing key points or inaccuracies.`,
    
    improvementPrompt: `ROLE: You are an AI writing assistant improving technical content.
TASK: Enhance the Healthcare and Medical content for **[TERM]**.
OUTPUT FORMAT: Return only the improved content in the same format.
CONSTRAINTS:
- Maintain accuracy while improving clarity.
- Ensure completeness for Healthcare and medical applications.
- Keep within appropriate scope and detail level.
- Address any feedback from evaluation.`
  },

  // Column 176: Retail and E-commerce
  {
    columnId: 'industry_retail_ecommerce',
    generativePrompt: `ROLE: You are an AI/ML expert creating comprehensive glossary content.
TASK: Generate content for **[TERM]** focusing on: Retail and E-commerce.
CONTEXT: Retail and e-commerce applications
OUTPUT FORMAT: Write content in Markdown format.
CONSTRAINTS:
- Provide moderate detail (1-2 paragraphs or 5-7 bullet points).
- Ensure accuracy and clarity for important level content.
- Focus specifically on the aspect described in the column name.
- Use technical language appropriate for the audience level.`,
    
    evaluativePrompt: `ROLE: You are an AI content reviewer specializing in technical accuracy.
TASK: Evaluate the Retail and E-commerce content for **[TERM]**.
OUTPUT FORMAT: Return JSON with "score" (1-10) and "feedback" string.
CONSTRAINTS:
- Check accuracy and completeness for Retail and e-commerce applications.
- Verify appropriate detail level for important content.
- Assess clarity and technical correctness.
- Note any missing key points or inaccuracies.`,
    
    improvementPrompt: `ROLE: You are an AI writing assistant improving technical content.
TASK: Enhance the Retail and E-commerce content for **[TERM]**.
OUTPUT FORMAT: Return only the improved content in the same format.
CONSTRAINTS:
- Maintain accuracy while improving clarity.
- Ensure completeness for Retail and e-commerce applications.
- Keep within appropriate scope and detail level.
- Address any feedback from evaluation.`
  },

  // Column 177: Automotive and Transportation
  {
    columnId: 'industry_automotive_transportation',
    generativePrompt: `ROLE: You are an AI/ML expert creating comprehensive glossary content.
TASK: Generate content for **[TERM]** focusing on: Automotive and Transportation.
CONTEXT: Transportation and automotive applications
OUTPUT FORMAT: Write content in Markdown format.
CONSTRAINTS:
- Provide moderate detail (1-2 paragraphs or 5-7 bullet points).
- Ensure accuracy and clarity for important level content.
- Focus specifically on the aspect described in the column name.
- Use technical language appropriate for the audience level.`,
    
    evaluativePrompt: `ROLE: You are an AI content reviewer specializing in technical accuracy.
TASK: Evaluate the Automotive and Transportation content for **[TERM]**.
OUTPUT FORMAT: Return JSON with "score" (1-10) and "feedback" string.
CONSTRAINTS:
- Check accuracy and completeness for Transportation and automotive applications.
- Verify appropriate detail level for important content.
- Assess clarity and technical correctness.
- Note any missing key points or inaccuracies.`,
    
    improvementPrompt: `ROLE: You are an AI writing assistant improving technical content.
TASK: Enhance the Automotive and Transportation content for **[TERM]**.
OUTPUT FORMAT: Return only the improved content in the same format.
CONSTRAINTS:
- Maintain accuracy while improving clarity.
- Ensure completeness for Transportation and automotive applications.
- Keep within appropriate scope and detail level.
- Address any feedback from evaluation.`
  },

  // Column 178: Education and Training
  {
    columnId: 'industry_education_training',
    generativePrompt: `ROLE: You are an AI/ML expert creating comprehensive glossary content.
TASK: Generate content for **[TERM]** focusing on: Education and Training.
CONTEXT: Educational applications and training
OUTPUT FORMAT: Write content in Markdown format.
CONSTRAINTS:
- Provide moderate detail (1-2 paragraphs or 5-7 bullet points).
- Ensure accuracy and clarity for supplementary level content.
- Focus specifically on the aspect described in the column name.
- Use technical language appropriate for the audience level.`,
    
    evaluativePrompt: `ROLE: You are an AI content reviewer specializing in technical accuracy.
TASK: Evaluate the Education and Training content for **[TERM]**.
OUTPUT FORMAT: Return JSON with "score" (1-10) and "feedback" string.
CONSTRAINTS:
- Check accuracy and completeness for Educational applications and training.
- Verify appropriate detail level for supplementary content.
- Assess clarity and technical correctness.
- Note any missing key points or inaccuracies.`,
    
    improvementPrompt: `ROLE: You are an AI writing assistant improving technical content.
TASK: Enhance the Education and Training content for **[TERM]**.
OUTPUT FORMAT: Return only the improved content in the same format.
CONSTRAINTS:
- Maintain accuracy while improving clarity.
- Ensure completeness for Educational applications and training.
- Keep within appropriate scope and detail level.
- Address any feedback from evaluation.`
  },

  // Column 179: Manufacturing and Supply Chain
  {
    columnId: 'industry_manufacturing_supply',
    generativePrompt: `ROLE: You are an AI/ML expert creating comprehensive glossary content.
TASK: Generate content for **[TERM]** focusing on: Manufacturing and Supply Chain.
CONTEXT: Manufacturing and supply chain applications
OUTPUT FORMAT: Write content in Markdown format.
CONSTRAINTS:
- Provide moderate detail (1-2 paragraphs or 5-7 bullet points).
- Ensure accuracy and clarity for important level content.
- Focus specifically on the aspect described in the column name.
- Use technical language appropriate for the audience level.`,
    
    evaluativePrompt: `ROLE: You are an AI content reviewer specializing in technical accuracy.
TASK: Evaluate the Manufacturing and Supply Chain content for **[TERM]**.
OUTPUT FORMAT: Return JSON with "score" (1-10) and "feedback" string.
CONSTRAINTS:
- Check accuracy and completeness for Manufacturing and supply chain applications.
- Verify appropriate detail level for important content.
- Assess clarity and technical correctness.
- Note any missing key points or inaccuracies.`,
    
    improvementPrompt: `ROLE: You are an AI writing assistant improving technical content.
TASK: Enhance the Manufacturing and Supply Chain content for **[TERM]**.
OUTPUT FORMAT: Return only the improved content in the same format.
CONSTRAINTS:
- Maintain accuracy while improving clarity.
- Ensure completeness for Manufacturing and supply chain applications.
- Keep within appropriate scope and detail level.
- Address any feedback from evaluation.`
  },

  // Column 180: Media and Entertainment
  {
    columnId: 'industry_media_entertainment',
    generativePrompt: `ROLE: You are an AI/ML expert creating comprehensive glossary content.
TASK: Generate content for **[TERM]** focusing on: Media and Entertainment.
CONTEXT: Media and entertainment applications
OUTPUT FORMAT: Write content in Markdown format.
CONSTRAINTS:
- Provide moderate detail (1-2 paragraphs or 5-7 bullet points).
- Ensure accuracy and clarity for supplementary level content.
- Focus specifically on the aspect described in the column name.
- Use technical language appropriate for the audience level.`,
    
    evaluativePrompt: `ROLE: You are an AI content reviewer specializing in technical accuracy.
TASK: Evaluate the Media and Entertainment content for **[TERM]**.
OUTPUT FORMAT: Return JSON with "score" (1-10) and "feedback" string.
CONSTRAINTS:
- Check accuracy and completeness for Media and entertainment applications.
- Verify appropriate detail level for supplementary content.
- Assess clarity and technical correctness.
- Note any missing key points or inaccuracies.`,
    
    improvementPrompt: `ROLE: You are an AI writing assistant improving technical content.
TASK: Enhance the Media and Entertainment content for **[TERM]**.
OUTPUT FORMAT: Return only the improved content in the same format.
CONSTRAINTS:
- Maintain accuracy while improving clarity.
- Ensure completeness for Media and entertainment applications.
- Keep within appropriate scope and detail level.
- Address any feedback from evaluation.`
  },

  // Column 181: Agriculture and Environment
  {
    columnId: 'industry_agriculture_environment',
    generativePrompt: `ROLE: You are an AI/ML expert creating comprehensive glossary content.
TASK: Generate content for **[TERM]** focusing on: Agriculture and Environment.
CONTEXT: Agricultural and environmental applications
OUTPUT FORMAT: Write content in Markdown format.
CONSTRAINTS:
- Provide moderate detail (1-2 paragraphs or 5-7 bullet points).
- Ensure accuracy and clarity for supplementary level content.
- Focus specifically on the aspect described in the column name.
- Use technical language appropriate for the audience level.`,
    
    evaluativePrompt: `ROLE: You are an AI content reviewer specializing in technical accuracy.
TASK: Evaluate the Agriculture and Environment content for **[TERM]**.
OUTPUT FORMAT: Return JSON with "score" (1-10) and "feedback" string.
CONSTRAINTS:
- Check accuracy and completeness for Agricultural and environmental applications.
- Verify appropriate detail level for supplementary content.
- Assess clarity and technical correctness.
- Note any missing key points or inaccuracies.`,
    
    improvementPrompt: `ROLE: You are an AI writing assistant improving technical content.
TASK: Enhance the Agriculture and Environment content for **[TERM]**.
OUTPUT FORMAT: Return only the improved content in the same format.
CONSTRAINTS:
- Maintain accuracy while improving clarity.
- Ensure completeness for Agricultural and environmental applications.
- Keep within appropriate scope and detail level.
- Address any feedback from evaluation.`
  },

  // Column 182: Government and Public Sector
  {
    columnId: 'industry_government_public',
    generativePrompt: `ROLE: You are an AI/ML expert creating comprehensive glossary content.
TASK: Generate content for **[TERM]** focusing on: Government and Public Sector.
CONTEXT: Government and public sector applications
OUTPUT FORMAT: Write content in Markdown format.
CONSTRAINTS:
- Provide moderate detail (1-2 paragraphs or 5-7 bullet points).
- Ensure accuracy and clarity for supplementary level content.
- Focus specifically on the aspect described in the column name.
- Use technical language appropriate for the audience level.`,
    
    evaluativePrompt: `ROLE: You are an AI content reviewer specializing in technical accuracy.
TASK: Evaluate the Government and Public Sector content for **[TERM]**.
OUTPUT FORMAT: Return JSON with "score" (1-10) and "feedback" string.
CONSTRAINTS:
- Check accuracy and completeness for Government and public sector applications.
- Verify appropriate detail level for supplementary content.
- Assess clarity and technical correctness.
- Note any missing key points or inaccuracies.`,
    
    improvementPrompt: `ROLE: You are an AI writing assistant improving technical content.
TASK: Enhance the Government and Public Sector content for **[TERM]**.
OUTPUT FORMAT: Return only the improved content in the same format.
CONSTRAINTS:
- Maintain accuracy while improving clarity.
- Ensure completeness for Government and public sector applications.
- Keep within appropriate scope and detail level.
- Address any feedback from evaluation.`
  },

  // Column 183: Cross-Industry Case Comparisons
  {
    columnId: 'industry_case_comparison',
    generativePrompt: `ROLE: You are an AI/ML expert creating comprehensive glossary content.
TASK: Generate content for **[TERM]** focusing on: Cross-Industry Case Comparisons.
CONTEXT: Comparative analysis across industries
OUTPUT FORMAT: Write content in Markdown format.
CONSTRAINTS:
- Provide moderate detail (1-2 paragraphs or 5-7 bullet points).
- Ensure accuracy and clarity for advanced level content.
- Focus specifically on the aspect described in the column name.
- Use technical language appropriate for the audience level.`,
    
    evaluativePrompt: `ROLE: You are an AI content reviewer specializing in technical accuracy.
TASK: Evaluate the Cross-Industry Case Comparisons content for **[TERM]**.
OUTPUT FORMAT: Return JSON with "score" (1-10) and "feedback" string.
CONSTRAINTS:
- Check accuracy and completeness for Comparative analysis across industries.
- Verify appropriate detail level for advanced content.
- Assess clarity and technical correctness.
- Note any missing key points or inaccuracies.`,
    
    improvementPrompt: `ROLE: You are an AI writing assistant improving technical content.
TASK: Enhance the Cross-Industry Case Comparisons content for **[TERM]**.
OUTPUT FORMAT: Return only the improved content in the same format.
CONSTRAINTS:
- Maintain accuracy while improving clarity.
- Ensure completeness for Comparative analysis across industries.
- Keep within appropriate scope and detail level.
- Address any feedback from evaluation.`
  },

  // Column 184: Interactive Element: Industry Use Case Explorer
  {
    columnId: 'industry_interactive_explorer',
    generativePrompt: `ROLE: You are an AI/ML expert creating comprehensive glossary content.
TASK: Generate content for **[TERM]** focusing on: Interactive Element: Industry Use Case Explorer.
CONTEXT: Interactive industry application explorer
OUTPUT FORMAT: Provide interactive content specification in markdown format.
CONSTRAINTS:
- Provide comprehensive detail with multiple sections.
- Ensure accuracy and clarity for advanced level content.
- Focus specifically on the aspect described in the column name.
- Use technical language appropriate for the audience level.`,
    
    evaluativePrompt: `ROLE: You are an AI content reviewer specializing in technical accuracy.
TASK: Evaluate the Interactive Element: Industry Use Case Explorer content for **[TERM]**.
OUTPUT FORMAT: Return JSON with "score" (1-10) and "feedback" string.
CONSTRAINTS:
- Check accuracy and completeness for Interactive industry application explorer.
- Verify appropriate detail level for advanced content.
- Assess clarity and technical correctness.
- Note any missing key points or inaccuracies.`,
    
    improvementPrompt: `ROLE: You are an AI writing assistant improving technical content.
TASK: Enhance the Interactive Element: Industry Use Case Explorer content for **[TERM]**.
OUTPUT FORMAT: Return only the improved content in the same format.
CONSTRAINTS:
- Maintain accuracy while improving clarity.
- Ensure completeness for Interactive industry application explorer.
- Keep within appropriate scope and detail level.
- Address any feedback from evaluation.`
  },

  // Column 185: Performance Metrics and Benchmarks
  {
    columnId: 'evaluation_performance_metrics',
    generativePrompt: `ROLE: You are an AI/ML expert creating comprehensive glossary content.
TASK: Generate content for **[TERM]** focusing on: Performance Metrics and Benchmarks.
CONTEXT: Key performance metrics and benchmarks
OUTPUT FORMAT: Write content in Markdown format.
CONSTRAINTS:
- Provide moderate detail (1-2 paragraphs or 5-7 bullet points).
- Ensure accuracy and clarity for essential level content.
- Focus specifically on the aspect described in the column name.
- Use technical language appropriate for the audience level.`,
    
    evaluativePrompt: `ROLE: You are an AI content reviewer specializing in technical accuracy.
TASK: Evaluate the Performance Metrics and Benchmarks content for **[TERM]**.
OUTPUT FORMAT: Return JSON with "score" (1-10) and "feedback" string.
CONSTRAINTS:
- Check accuracy and completeness for Key performance metrics and benchmarks.
- Verify appropriate detail level for essential content.
- Assess clarity and technical correctness.
- Note any missing key points or inaccuracies.`,
    
    improvementPrompt: `ROLE: You are an AI writing assistant improving technical content.
TASK: Enhance the Performance Metrics and Benchmarks content for **[TERM]**.
OUTPUT FORMAT: Return only the improved content in the same format.
CONSTRAINTS:
- Maintain accuracy while improving clarity.
- Ensure completeness for Key performance metrics and benchmarks.
- Keep within appropriate scope and detail level.
- Address any feedback from evaluation.`
  },

  // Column 186: Evaluation Methods and Protocols
  {
    columnId: 'evaluation_evaluation_methods',
    generativePrompt: `ROLE: You are an AI/ML expert creating comprehensive glossary content.
TASK: Generate content for **[TERM]** focusing on: Evaluation Methods and Protocols.
CONTEXT: Standard evaluation methods and protocols
OUTPUT FORMAT: Write content in Markdown format.
CONSTRAINTS:
- Provide moderate detail (1-2 paragraphs or 5-7 bullet points).
- Ensure accuracy and clarity for important level content.
- Focus specifically on the aspect described in the column name.
- Use technical language appropriate for the audience level.`,
    
    evaluativePrompt: `ROLE: You are an AI content reviewer specializing in technical accuracy.
TASK: Evaluate the Evaluation Methods and Protocols content for **[TERM]**.
OUTPUT FORMAT: Return JSON with "score" (1-10) and "feedback" string.
CONSTRAINTS:
- Check accuracy and completeness for Standard evaluation methods and protocols.
- Verify appropriate detail level for important content.
- Assess clarity and technical correctness.
- Note any missing key points or inaccuracies.`,
    
    improvementPrompt: `ROLE: You are an AI writing assistant improving technical content.
TASK: Enhance the Evaluation Methods and Protocols content for **[TERM]**.
OUTPUT FORMAT: Return only the improved content in the same format.
CONSTRAINTS:
- Maintain accuracy while improving clarity.
- Ensure completeness for Standard evaluation methods and protocols.
- Keep within appropriate scope and detail level.
- Address any feedback from evaluation.`
  },

  // Column 187: Comparison of Different Metrics
  {
    columnId: 'evaluation_comparison_metrics',
    generativePrompt: `ROLE: You are an AI/ML expert creating comprehensive glossary content.
TASK: Generate content for **[TERM]** focusing on: Comparison of Different Metrics.
CONTEXT: Comparing different evaluation metrics
OUTPUT FORMAT: Write content in Markdown format.
CONSTRAINTS:
- Provide moderate detail (1-2 paragraphs or 5-7 bullet points).
- Ensure accuracy and clarity for important level content.
- Focus specifically on the aspect described in the column name.
- Use technical language appropriate for the audience level.`,
    
    evaluativePrompt: `ROLE: You are an AI content reviewer specializing in technical accuracy.
TASK: Evaluate the Comparison of Different Metrics content for **[TERM]**.
OUTPUT FORMAT: Return JSON with "score" (1-10) and "feedback" string.
CONSTRAINTS:
- Check accuracy and completeness for Comparing different evaluation metrics.
- Verify appropriate detail level for important content.
- Assess clarity and technical correctness.
- Note any missing key points or inaccuracies.`,
    
    improvementPrompt: `ROLE: You are an AI writing assistant improving technical content.
TASK: Enhance the Comparison of Different Metrics content for **[TERM]**.
OUTPUT FORMAT: Return only the improved content in the same format.
CONSTRAINTS:
- Maintain accuracy while improving clarity.
- Ensure completeness for Comparing different evaluation metrics.
- Keep within appropriate scope and detail level.
- Address any feedback from evaluation.`
  },

  // Column 188: Statistical Significance Testing
  {
    columnId: 'evaluation_metrics_statistical_significance',
    generativePrompt: `ROLE: You are an AI/ML expert creating comprehensive glossary content.
TASK: Generate content for **[TERM]** focusing on: Statistical Significance Testing.
CONTEXT: Statistical testing for evaluation
OUTPUT FORMAT: Write content in Markdown format.
CONSTRAINTS:
- Provide moderate detail (1-2 paragraphs or 5-7 bullet points).
- Ensure accuracy and clarity for advanced level content.
- Focus specifically on the aspect described in the column name.
- Use technical language appropriate for the audience level.`,
    
    evaluativePrompt: `ROLE: You are an AI content reviewer specializing in technical accuracy.
TASK: Evaluate the Statistical Significance Testing content for **[TERM]**.
OUTPUT FORMAT: Return JSON with "score" (1-10) and "feedback" string.
CONSTRAINTS:
- Check accuracy and completeness for Statistical testing for evaluation.
- Verify appropriate detail level for advanced content.
- Assess clarity and technical correctness.
- Note any missing key points or inaccuracies.`,
    
    improvementPrompt: `ROLE: You are an AI writing assistant improving technical content.
TASK: Enhance the Statistical Significance Testing content for **[TERM]**.
OUTPUT FORMAT: Return only the improved content in the same format.
CONSTRAINTS:
- Maintain accuracy while improving clarity.
- Ensure completeness for Statistical testing for evaluation.
- Keep within appropriate scope and detail level.
- Address any feedback from evaluation.`
  },

  // Column 189: Validation Techniques
  {
    columnId: 'evaluation_validation_techniques',
    generativePrompt: `ROLE: You are an AI/ML expert creating comprehensive glossary content.
TASK: Generate content for **[TERM]** focusing on: Validation Techniques.
CONTEXT: Cross-validation and other techniques
OUTPUT FORMAT: Write content in Markdown format.
CONSTRAINTS:
- Provide moderate detail (1-2 paragraphs or 5-7 bullet points).
- Ensure accuracy and clarity for important level content.
- Focus specifically on the aspect described in the column name.
- Use technical language appropriate for the audience level.`,
    
    evaluativePrompt: `ROLE: You are an AI content reviewer specializing in technical accuracy.
TASK: Evaluate the Validation Techniques content for **[TERM]**.
OUTPUT FORMAT: Return JSON with "score" (1-10) and "feedback" string.
CONSTRAINTS:
- Check accuracy and completeness for Cross-validation and other techniques.
- Verify appropriate detail level for important content.
- Assess clarity and technical correctness.
- Note any missing key points or inaccuracies.`,
    
    improvementPrompt: `ROLE: You are an AI writing assistant improving technical content.
TASK: Enhance the Validation Techniques content for **[TERM]**.
OUTPUT FORMAT: Return only the improved content in the same format.
CONSTRAINTS:
- Maintain accuracy while improving clarity.
- Ensure completeness for Cross-validation and other techniques.
- Keep within appropriate scope and detail level.
- Address any feedback from evaluation.`
  },

  // Column 190: Reporting Standards
  {
    columnId: 'evaluation_reporting_standards',
    generativePrompt: `ROLE: You are an AI/ML expert creating comprehensive glossary content.
TASK: Generate content for **[TERM]** focusing on: Reporting Standards.
CONTEXT: Standards for reporting evaluation results
OUTPUT FORMAT: Write content in Markdown format.
CONSTRAINTS:
- Provide moderate detail (1-2 paragraphs or 5-7 bullet points).
- Ensure accuracy and clarity for supplementary level content.
- Focus specifically on the aspect described in the column name.
- Use technical language appropriate for the audience level.`,
    
    evaluativePrompt: `ROLE: You are an AI content reviewer specializing in technical accuracy.
TASK: Evaluate the Reporting Standards content for **[TERM]**.
OUTPUT FORMAT: Return JSON with "score" (1-10) and "feedback" string.
CONSTRAINTS:
- Check accuracy and completeness for Standards for reporting evaluation results.
- Verify appropriate detail level for supplementary content.
- Assess clarity and technical correctness.
- Note any missing key points or inaccuracies.`,
    
    improvementPrompt: `ROLE: You are an AI writing assistant improving technical content.
TASK: Enhance the Reporting Standards content for **[TERM]**.
OUTPUT FORMAT: Return only the improved content in the same format.
CONSTRAINTS:
- Maintain accuracy while improving clarity.
- Ensure completeness for Standards for reporting evaluation results.
- Keep within appropriate scope and detail level.
- Address any feedback from evaluation.`
  },

  // Column 191: Common Pitfalls in Evaluation
  {
    columnId: 'evaluation_common_pitfalls',
    generativePrompt: `ROLE: You are an AI/ML expert creating comprehensive glossary content.
TASK: Generate content for **[TERM]** focusing on: Common Pitfalls in Evaluation.
CONTEXT: Common mistakes in evaluation
OUTPUT FORMAT: Write content in Markdown format.
CONSTRAINTS:
- Provide moderate detail (1-2 paragraphs or 5-7 bullet points).
- Ensure accuracy and clarity for important level content.
- Focus specifically on the aspect described in the column name.
- Use technical language appropriate for the audience level.`,
    
    evaluativePrompt: `ROLE: You are an AI content reviewer specializing in technical accuracy.
TASK: Evaluate the Common Pitfalls in Evaluation content for **[TERM]**.
OUTPUT FORMAT: Return JSON with "score" (1-10) and "feedback" string.
CONSTRAINTS:
- Check accuracy and completeness for Common mistakes in evaluation.
- Verify appropriate detail level for important content.
- Assess clarity and technical correctness.
- Note any missing key points or inaccuracies.`,
    
    improvementPrompt: `ROLE: You are an AI writing assistant improving technical content.
TASK: Enhance the Common Pitfalls in Evaluation content for **[TERM]**.
OUTPUT FORMAT: Return only the improved content in the same format.
CONSTRAINTS:
- Maintain accuracy while improving clarity.
- Ensure completeness for Common mistakes in evaluation.
- Keep within appropriate scope and detail level.
- Address any feedback from evaluation.`
  },

  // Column 192: Domain-Specific Metrics
  {
    columnId: 'evaluation_domain_specific',
    generativePrompt: `ROLE: You are an AI/ML expert creating comprehensive glossary content.
TASK: Generate content for **[TERM]** focusing on: Domain-Specific Metrics.
CONTEXT: Metrics specific to different domains
OUTPUT FORMAT: Write content in Markdown format.
CONSTRAINTS:
- Provide moderate detail (1-2 paragraphs or 5-7 bullet points).
- Ensure accuracy and clarity for supplementary level content.
- Focus specifically on the aspect described in the column name.
- Use technical language appropriate for the audience level.`,
    
    evaluativePrompt: `ROLE: You are an AI content reviewer specializing in technical accuracy.
TASK: Evaluate the Domain-Specific Metrics content for **[TERM]**.
OUTPUT FORMAT: Return JSON with "score" (1-10) and "feedback" string.
CONSTRAINTS:
- Check accuracy and completeness for Metrics specific to different domains.
- Verify appropriate detail level for supplementary content.
- Assess clarity and technical correctness.
- Note any missing key points or inaccuracies.`,
    
    improvementPrompt: `ROLE: You are an AI writing assistant improving technical content.
TASK: Enhance the Domain-Specific Metrics content for **[TERM]**.
OUTPUT FORMAT: Return only the improved content in the same format.
CONSTRAINTS:
- Maintain accuracy while improving clarity.
- Ensure completeness for Metrics specific to different domains.
- Keep within appropriate scope and detail level.
- Address any feedback from evaluation.`
  },

  // Column 193: Interactive Element: Metrics Calculator
  {
    columnId: 'evaluation_interactive_calculator',
    generativePrompt: `ROLE: You are an AI/ML expert creating comprehensive glossary content.
TASK: Generate content for **[TERM]** focusing on: Interactive Element: Metrics Calculator.
CONTEXT: Interactive metrics calculator and comparison
OUTPUT FORMAT: Provide interactive content specification in markdown format.
CONSTRAINTS:
- Provide comprehensive detail with multiple sections.
- Ensure accuracy and clarity for advanced level content.
- Focus specifically on the aspect described in the column name.
- Use technical language appropriate for the audience level.`,
    
    evaluativePrompt: `ROLE: You are an AI content reviewer specializing in technical accuracy.
TASK: Evaluate the Interactive Element: Metrics Calculator content for **[TERM]**.
OUTPUT FORMAT: Return JSON with "score" (1-10) and "feedback" string.
CONSTRAINTS:
- Check accuracy and completeness for Interactive metrics calculator and comparison.
- Verify appropriate detail level for advanced content.
- Assess clarity and technical correctness.
- Note any missing key points or inaccuracies.`,
    
    improvementPrompt: `ROLE: You are an AI writing assistant improving technical content.
TASK: Enhance the Interactive Element: Metrics Calculator content for **[TERM]**.
OUTPUT FORMAT: Return only the improved content in the same format.
CONSTRAINTS:
- Maintain accuracy while improving clarity.
- Ensure completeness for Interactive metrics calculator and comparison.
- Keep within appropriate scope and detail level.
- Address any feedback from evaluation.`
  },

  // Column 194: Production Deployment Considerations
  {
    columnId: 'deployment_production_considerations',
    generativePrompt: `ROLE: You are an AI/ML expert creating comprehensive glossary content.
TASK: Generate content for **[TERM]** focusing on: Production Deployment Considerations.
CONTEXT: Key considerations for production deployment
OUTPUT FORMAT: Write content in Markdown format.
CONSTRAINTS:
- Provide moderate detail (1-2 paragraphs or 5-7 bullet points).
- Ensure accuracy and clarity for essential level content.
- Focus specifically on the aspect described in the column name.
- Use technical language appropriate for the audience level.`,
    
    evaluativePrompt: `ROLE: You are an AI content reviewer specializing in technical accuracy.
TASK: Evaluate the Production Deployment Considerations content for **[TERM]**.
OUTPUT FORMAT: Return JSON with "score" (1-10) and "feedback" string.
CONSTRAINTS:
- Check accuracy and completeness for Key considerations for production deployment.
- Verify appropriate detail level for essential content.
- Assess clarity and technical correctness.
- Note any missing key points or inaccuracies.`,
    
    improvementPrompt: `ROLE: You are an AI writing assistant improving technical content.
TASK: Enhance the Production Deployment Considerations content for **[TERM]**.
OUTPUT FORMAT: Return only the improved content in the same format.
CONSTRAINTS:
- Maintain accuracy while improving clarity.
- Ensure completeness for Key considerations for production deployment.
- Keep within appropriate scope and detail level.
- Address any feedback from evaluation.`
  },

  // Column 195: Containerization and Orchestration
  {
    columnId: 'deployment_containerization_orchestration',
    generativePrompt: `ROLE: You are an AI/ML expert creating comprehensive glossary content.
TASK: Generate content for **[TERM]** focusing on: Containerization and Orchestration.
CONTEXT: Docker, Kubernetes, and orchestration strategies
OUTPUT FORMAT: Write content in Markdown format.
CONSTRAINTS:
- Provide moderate detail (1-2 paragraphs or 5-7 bullet points).
- Ensure accuracy and clarity for important level content.
- Focus specifically on the aspect described in the column name.
- Use technical language appropriate for the audience level.`,
    
    evaluativePrompt: `ROLE: You are an AI content reviewer specializing in technical accuracy.
TASK: Evaluate the Containerization and Orchestration content for **[TERM]**.
OUTPUT FORMAT: Return JSON with "score" (1-10) and "feedback" string.
CONSTRAINTS:
- Check accuracy and completeness for Docker, Kubernetes, and orchestration strategies.
- Verify appropriate detail level for important content.
- Assess clarity and technical correctness.
- Note any missing key points or inaccuracies.`,
    
    improvementPrompt: `ROLE: You are an AI writing assistant improving technical content.
TASK: Enhance the Containerization and Orchestration content for **[TERM]**.
OUTPUT FORMAT: Return only the improved content in the same format.
CONSTRAINTS:
- Maintain accuracy while improving clarity.
- Ensure completeness for Docker, Kubernetes, and orchestration strategies.
- Keep within appropriate scope and detail level.
- Address any feedback from evaluation.`
  },

  // Column 196: CI/CD Pipelines
  {
    columnId: 'deployment_ci_cd_pipelines',
    generativePrompt: `ROLE: You are an AI/ML expert creating comprehensive glossary content.
TASK: Generate content for **[TERM]** focusing on: CI/CD Pipelines.
CONTEXT: Continuous integration and deployment pipelines
OUTPUT FORMAT: Write content in Markdown format.
CONSTRAINTS:
- Provide moderate detail (1-2 paragraphs or 5-7 bullet points).
- Ensure accuracy and clarity for important level content.
- Focus specifically on the aspect described in the column name.
- Use technical language appropriate for the audience level.`,
    
    evaluativePrompt: `ROLE: You are an AI content reviewer specializing in technical accuracy.
TASK: Evaluate the CI/CD Pipelines content for **[TERM]**.
OUTPUT FORMAT: Return JSON with "score" (1-10) and "feedback" string.
CONSTRAINTS:
- Check accuracy and completeness for Continuous integration and deployment pipelines.
- Verify appropriate detail level for important content.
- Assess clarity and technical correctness.
- Note any missing key points or inaccuracies.`,
    
    improvementPrompt: `ROLE: You are an AI writing assistant improving technical content.
TASK: Enhance the CI/CD Pipelines content for **[TERM]**.
OUTPUT FORMAT: Return only the improved content in the same format.
CONSTRAINTS:
- Maintain accuracy while improving clarity.
- Ensure completeness for Continuous integration and deployment pipelines.
- Keep within appropriate scope and detail level.
- Address any feedback from evaluation.`
  },

  // Column 197: Monitoring and Logging
  {
    columnId: 'deployment_monitoring_logging',
    generativePrompt: `ROLE: You are an AI/ML expert creating comprehensive glossary content.
TASK: Generate content for **[TERM]** focusing on: Monitoring and Logging.
CONTEXT: Production monitoring and logging strategies
OUTPUT FORMAT: Write content in Markdown format.
CONSTRAINTS:
- Provide moderate detail (1-2 paragraphs or 5-7 bullet points).
- Ensure accuracy and clarity for essential level content.
- Focus specifically on the aspect described in the column name.
- Use technical language appropriate for the audience level.`,
    
    evaluativePrompt: `ROLE: You are an AI content reviewer specializing in technical accuracy.
TASK: Evaluate the Monitoring and Logging content for **[TERM]**.
OUTPUT FORMAT: Return JSON with "score" (1-10) and "feedback" string.
CONSTRAINTS:
- Check accuracy and completeness for Production monitoring and logging strategies.
- Verify appropriate detail level for essential content.
- Assess clarity and technical correctness.
- Note any missing key points or inaccuracies.`,
    
    improvementPrompt: `ROLE: You are an AI writing assistant improving technical content.
TASK: Enhance the Monitoring and Logging content for **[TERM]**.
OUTPUT FORMAT: Return only the improved content in the same format.
CONSTRAINTS:
- Maintain accuracy while improving clarity.
- Ensure completeness for Production monitoring and logging strategies.
- Keep within appropriate scope and detail level.
- Address any feedback from evaluation.`
  },

  // Column 198: Scaling Strategies
  {
    columnId: 'deployment_scaling_strategies',
    generativePrompt: `ROLE: You are an AI/ML expert creating comprehensive glossary content.
TASK: Generate content for **[TERM]** focusing on: Scaling Strategies.
CONTEXT: Horizontal and vertical scaling approaches
OUTPUT FORMAT: Write content in Markdown format.
CONSTRAINTS:
- Provide moderate detail (1-2 paragraphs or 5-7 bullet points).
- Ensure accuracy and clarity for important level content.
- Focus specifically on the aspect described in the column name.
- Use technical language appropriate for the audience level.`,
    
    evaluativePrompt: `ROLE: You are an AI content reviewer specializing in technical accuracy.
TASK: Evaluate the Scaling Strategies content for **[TERM]**.
OUTPUT FORMAT: Return JSON with "score" (1-10) and "feedback" string.
CONSTRAINTS:
- Check accuracy and completeness for Horizontal and vertical scaling approaches.
- Verify appropriate detail level for important content.
- Assess clarity and technical correctness.
- Note any missing key points or inaccuracies.`,
    
    improvementPrompt: `ROLE: You are an AI writing assistant improving technical content.
TASK: Enhance the Scaling Strategies content for **[TERM]**.
OUTPUT FORMAT: Return only the improved content in the same format.
CONSTRAINTS:
- Maintain accuracy while improving clarity.
- Ensure completeness for Horizontal and vertical scaling approaches.
- Keep within appropriate scope and detail level.
- Address any feedback from evaluation.`
  },

  // Column 199: Rollback and Recovery Procedures
  {
    columnId: 'deployment_rollback_recovery',
    generativePrompt: `ROLE: You are an AI/ML expert creating comprehensive glossary content.
TASK: Generate content for **[TERM]** focusing on: Rollback and Recovery Procedures.
CONTEXT: Disaster recovery and rollback strategies
OUTPUT FORMAT: Write content in Markdown format.
CONSTRAINTS:
- Provide moderate detail (1-2 paragraphs or 5-7 bullet points).
- Ensure accuracy and clarity for essential level content.
- Focus specifically on the aspect described in the column name.
- Use technical language appropriate for the audience level.`,
    
    evaluativePrompt: `ROLE: You are an AI content reviewer specializing in technical accuracy.
TASK: Evaluate the Rollback and Recovery Procedures content for **[TERM]**.
OUTPUT FORMAT: Return JSON with "score" (1-10) and "feedback" string.
CONSTRAINTS:
- Check accuracy and completeness for Disaster recovery and rollback strategies.
- Verify appropriate detail level for essential content.
- Assess clarity and technical correctness.
- Note any missing key points or inaccuracies.`,
    
    improvementPrompt: `ROLE: You are an AI writing assistant improving technical content.
TASK: Enhance the Rollback and Recovery Procedures content for **[TERM]**.
OUTPUT FORMAT: Return only the improved content in the same format.
CONSTRAINTS:
- Maintain accuracy while improving clarity.
- Ensure completeness for Disaster recovery and rollback strategies.
- Keep within appropriate scope and detail level.
- Address any feedback from evaluation.`
  },

  // Column 200: Performance Tuning in Production
  {
    columnId: 'deployment_performance_tuning',
    generativePrompt: `ROLE: You are an AI/ML expert creating comprehensive glossary content.
TASK: Generate content for **[TERM]** focusing on: Performance Tuning in Production.
CONTEXT: Production performance optimization
OUTPUT FORMAT: Write content in Markdown format.
CONSTRAINTS:
- Provide moderate detail (1-2 paragraphs or 5-7 bullet points).
- Ensure accuracy and clarity for important level content.
- Focus specifically on the aspect described in the column name.
- Use technical language appropriate for the audience level.`,
    
    evaluativePrompt: `ROLE: You are an AI content reviewer specializing in technical accuracy.
TASK: Evaluate the Performance Tuning in Production content for **[TERM]**.
OUTPUT FORMAT: Return JSON with "score" (1-10) and "feedback" string.
CONSTRAINTS:
- Check accuracy and completeness for Production performance optimization.
- Verify appropriate detail level for important content.
- Assess clarity and technical correctness.
- Note any missing key points or inaccuracies.`,
    
    improvementPrompt: `ROLE: You are an AI writing assistant improving technical content.
TASK: Enhance the Performance Tuning in Production content for **[TERM]**.
OUTPUT FORMAT: Return only the improved content in the same format.
CONSTRAINTS:
- Maintain accuracy while improving clarity.
- Ensure completeness for Production performance optimization.
- Keep within appropriate scope and detail level.
- Address any feedback from evaluation.`
  },

  // Column 201: Edge and Mobile Deployment
  {
    columnId: 'deployment_edge_deployment',
    generativePrompt: `ROLE: You are an AI/ML expert creating comprehensive glossary content.
TASK: Generate content for **[TERM]** focusing on: Edge and Mobile Deployment.
CONTEXT: Deploying to edge devices and mobile
OUTPUT FORMAT: Write content in Markdown format.
CONSTRAINTS:
- Provide moderate detail (1-2 paragraphs or 5-7 bullet points).
- Ensure accuracy and clarity for advanced level content.
- Focus specifically on the aspect described in the column name.
- Use technical language appropriate for the audience level.`,
    
    evaluativePrompt: `ROLE: You are an AI content reviewer specializing in technical accuracy.
TASK: Evaluate the Edge and Mobile Deployment content for **[TERM]**.
OUTPUT FORMAT: Return JSON with "score" (1-10) and "feedback" string.
CONSTRAINTS:
- Check accuracy and completeness for Deploying to edge devices and mobile.
- Verify appropriate detail level for advanced content.
- Assess clarity and technical correctness.
- Note any missing key points or inaccuracies.`,
    
    improvementPrompt: `ROLE: You are an AI writing assistant improving technical content.
TASK: Enhance the Edge and Mobile Deployment content for **[TERM]**.
OUTPUT FORMAT: Return only the improved content in the same format.
CONSTRAINTS:
- Maintain accuracy while improving clarity.
- Ensure completeness for Deploying to edge devices and mobile.
- Keep within appropriate scope and detail level.
- Address any feedback from evaluation.`
  },

  // Column 202: Interactive Element: Deployment Checklist
  {
    columnId: 'deployment_interactive_checklist',
    generativePrompt: `ROLE: You are an AI/ML expert creating comprehensive glossary content.
TASK: Generate content for **[TERM]** focusing on: Interactive Element: Deployment Checklist.
CONTEXT: Interactive deployment checklist and architecture tool
OUTPUT FORMAT: Provide interactive content specification in markdown format.
CONSTRAINTS:
- Provide comprehensive detail with multiple sections.
- Ensure accuracy and clarity for advanced level content.
- Focus specifically on the aspect described in the column name.
- Use technical language appropriate for the audience level.`,
    
    evaluativePrompt: `ROLE: You are an AI content reviewer specializing in technical accuracy.
TASK: Evaluate the Interactive Element: Deployment Checklist content for **[TERM]**.
OUTPUT FORMAT: Return JSON with "score" (1-10) and "feedback" string.
CONSTRAINTS:
- Check accuracy and completeness for Interactive deployment checklist and architecture tool.
- Verify appropriate detail level for advanced content.
- Assess clarity and technical correctness.
- Note any missing key points or inaccuracies.`,
    
    improvementPrompt: `ROLE: You are an AI writing assistant improving technical content.
TASK: Enhance the Interactive Element: Deployment Checklist content for **[TERM]**.
OUTPUT FORMAT: Return only the improved content in the same format.
CONSTRAINTS:
- Maintain accuracy while improving clarity.
- Ensure completeness for Interactive deployment checklist and architecture tool.
- Keep within appropriate scope and detail level.
- Address any feedback from evaluation.`
  },

  // Column 203: Security Threat Landscape
  {
    columnId: 'security_threat_landscape',
    generativePrompt: `ROLE: You are an AI/ML expert creating comprehensive glossary content.
TASK: Generate content for **[TERM]** focusing on: Security Threat Landscape.
CONTEXT: Current security threats and vulnerabilities
OUTPUT FORMAT: Write content in Markdown format.
CONSTRAINTS:
- Provide moderate detail (1-2 paragraphs or 5-7 bullet points).
- Ensure accuracy and clarity for essential level content.
- Focus specifically on the aspect described in the column name.
- Use technical language appropriate for the audience level.`,
    
    evaluativePrompt: `ROLE: You are an AI content reviewer specializing in technical accuracy.
TASK: Evaluate the Security Threat Landscape content for **[TERM]**.
OUTPUT FORMAT: Return JSON with "score" (1-10) and "feedback" string.
CONSTRAINTS:
- Check accuracy and completeness for Current security threats and vulnerabilities.
- Verify appropriate detail level for essential content.
- Assess clarity and technical correctness.
- Note any missing key points or inaccuracies.`,
    
    improvementPrompt: `ROLE: You are an AI writing assistant improving technical content.
TASK: Enhance the Security Threat Landscape content for **[TERM]**.
OUTPUT FORMAT: Return only the improved content in the same format.
CONSTRAINTS:
- Maintain accuracy while improving clarity.
- Ensure completeness for Current security threats and vulnerabilities.
- Keep within appropriate scope and detail level.
- Address any feedback from evaluation.`
  },

  // Column 204: Authentication and Authorization
  {
    columnId: 'security_authentication_authorization',
    generativePrompt: `ROLE: You are an AI/ML expert creating comprehensive glossary content.
TASK: Generate content for **[TERM]** focusing on: Authentication and Authorization.
CONTEXT: Auth mechanisms and access control
OUTPUT FORMAT: Write content in Markdown format.
CONSTRAINTS:
- Provide moderate detail (1-2 paragraphs or 5-7 bullet points).
- Ensure accuracy and clarity for essential level content.
- Focus specifically on the aspect described in the column name.
- Use technical language appropriate for the audience level.`,
    
    evaluativePrompt: `ROLE: You are an AI content reviewer specializing in technical accuracy.
TASK: Evaluate the Authentication and Authorization content for **[TERM]**.
OUTPUT FORMAT: Return JSON with "score" (1-10) and "feedback" string.
CONSTRAINTS:
- Check accuracy and completeness for Auth mechanisms and access control.
- Verify appropriate detail level for essential content.
- Assess clarity and technical correctness.
- Note any missing key points or inaccuracies.`,
    
    improvementPrompt: `ROLE: You are an AI writing assistant improving technical content.
TASK: Enhance the Authentication and Authorization content for **[TERM]**.
OUTPUT FORMAT: Return only the improved content in the same format.
CONSTRAINTS:
- Maintain accuracy while improving clarity.
- Ensure completeness for Auth mechanisms and access control.
- Keep within appropriate scope and detail level.
- Address any feedback from evaluation.`
  },

  // Column 205: Data Protection and Encryption
  {
    columnId: 'security_data_protection',
    generativePrompt: `ROLE: You are an AI/ML expert creating comprehensive glossary content.
TASK: Generate content for **[TERM]** focusing on: Data Protection and Encryption.
CONTEXT: Encryption strategies and data protection
OUTPUT FORMAT: Write content in Markdown format.
CONSTRAINTS:
- Provide moderate detail (1-2 paragraphs or 5-7 bullet points).
- Ensure accuracy and clarity for essential level content.
- Focus specifically on the aspect described in the column name.
- Use technical language appropriate for the audience level.`,
    
    evaluativePrompt: `ROLE: You are an AI content reviewer specializing in technical accuracy.
TASK: Evaluate the Data Protection and Encryption content for **[TERM]**.
OUTPUT FORMAT: Return JSON with "score" (1-10) and "feedback" string.
CONSTRAINTS:
- Check accuracy and completeness for Encryption strategies and data protection.
- Verify appropriate detail level for essential content.
- Assess clarity and technical correctness.
- Note any missing key points or inaccuracies.`,
    
    improvementPrompt: `ROLE: You are an AI writing assistant improving technical content.
TASK: Enhance the Data Protection and Encryption content for **[TERM]**.
OUTPUT FORMAT: Return only the improved content in the same format.
CONSTRAINTS:
- Maintain accuracy while improving clarity.
- Ensure completeness for Encryption strategies and data protection.
- Keep within appropriate scope and detail level.
- Address any feedback from evaluation.`
  },

  // Column 206: Model Security and Adversarial Attacks
  {
    columnId: 'security_model_security',
    generativePrompt: `ROLE: You are an AI/ML expert creating comprehensive glossary content.
TASK: Generate content for **[TERM]** focusing on: Model Security and Adversarial Attacks.
CONTEXT: Protecting models from adversarial attacks
OUTPUT FORMAT: Write content in Markdown format.
CONSTRAINTS:
- Provide moderate detail (1-2 paragraphs or 5-7 bullet points).
- Ensure accuracy and clarity for important level content.
- Focus specifically on the aspect described in the column name.
- Use technical language appropriate for the audience level.`,
    
    evaluativePrompt: `ROLE: You are an AI content reviewer specializing in technical accuracy.
TASK: Evaluate the Model Security and Adversarial Attacks content for **[TERM]**.
OUTPUT FORMAT: Return JSON with "score" (1-10) and "feedback" string.
CONSTRAINTS:
- Check accuracy and completeness for Protecting models from adversarial attacks.
- Verify appropriate detail level for important content.
- Assess clarity and technical correctness.
- Note any missing key points or inaccuracies.`,
    
    improvementPrompt: `ROLE: You are an AI writing assistant improving technical content.
TASK: Enhance the Model Security and Adversarial Attacks content for **[TERM]**.
OUTPUT FORMAT: Return only the improved content in the same format.
CONSTRAINTS:
- Maintain accuracy while improving clarity.
- Ensure completeness for Protecting models from adversarial attacks.
- Keep within appropriate scope and detail level.
- Address any feedback from evaluation.`
  },

  // Column 207: Compliance and Regulations
  {
    columnId: 'security_compliance_regulations',
    generativePrompt: `ROLE: You are an AI/ML expert creating comprehensive glossary content.
TASK: Generate content for **[TERM]** focusing on: Compliance and Regulations.
CONTEXT: GDPR, HIPAA, and other compliance requirements
OUTPUT FORMAT: Write content in Markdown format.
CONSTRAINTS:
- Provide moderate detail (1-2 paragraphs or 5-7 bullet points).
- Ensure accuracy and clarity for important level content.
- Focus specifically on the aspect described in the column name.
- Use technical language appropriate for the audience level.`,
    
    evaluativePrompt: `ROLE: You are an AI content reviewer specializing in technical accuracy.
TASK: Evaluate the Compliance and Regulations content for **[TERM]**.
OUTPUT FORMAT: Return JSON with "score" (1-10) and "feedback" string.
CONSTRAINTS:
- Check accuracy and completeness for GDPR, HIPAA, and other compliance requirements.
- Verify appropriate detail level for important content.
- Assess clarity and technical correctness.
- Note any missing key points or inaccuracies.`,
    
    improvementPrompt: `ROLE: You are an AI writing assistant improving technical content.
TASK: Enhance the Compliance and Regulations content for **[TERM]**.
OUTPUT FORMAT: Return only the improved content in the same format.
CONSTRAINTS:
- Maintain accuracy while improving clarity.
- Ensure completeness for GDPR, HIPAA, and other compliance requirements.
- Keep within appropriate scope and detail level.
- Address any feedback from evaluation.`
  },

  // Column 208: Security Auditing and Logging
  {
    columnId: 'security_audit_logging',
    generativePrompt: `ROLE: You are an AI/ML expert creating comprehensive glossary content.
TASK: Generate content for **[TERM]** focusing on: Security Auditing and Logging.
CONTEXT: Security audit trails and logging practices
OUTPUT FORMAT: Write content in Markdown format.
CONSTRAINTS:
- Provide moderate detail (1-2 paragraphs or 5-7 bullet points).
- Ensure accuracy and clarity for important level content.
- Focus specifically on the aspect described in the column name.
- Use technical language appropriate for the audience level.`,
    
    evaluativePrompt: `ROLE: You are an AI content reviewer specializing in technical accuracy.
TASK: Evaluate the Security Auditing and Logging content for **[TERM]**.
OUTPUT FORMAT: Return JSON with "score" (1-10) and "feedback" string.
CONSTRAINTS:
- Check accuracy and completeness for Security audit trails and logging practices.
- Verify appropriate detail level for important content.
- Assess clarity and technical correctness.
- Note any missing key points or inaccuracies.`,
    
    improvementPrompt: `ROLE: You are an AI writing assistant improving technical content.
TASK: Enhance the Security Auditing and Logging content for **[TERM]**.
OUTPUT FORMAT: Return only the improved content in the same format.
CONSTRAINTS:
- Maintain accuracy while improving clarity.
- Ensure completeness for Security audit trails and logging practices.
- Keep within appropriate scope and detail level.
- Address any feedback from evaluation.`
  },

  // Column 209: Incident Response Planning
  {
    columnId: 'security_incident_response',
    generativePrompt: `ROLE: You are an AI/ML expert creating comprehensive glossary content.
TASK: Generate content for **[TERM]** focusing on: Incident Response Planning.
CONTEXT: Security incident response procedures
OUTPUT FORMAT: Write content in Markdown format.
CONSTRAINTS:
- Provide moderate detail (1-2 paragraphs or 5-7 bullet points).
- Ensure accuracy and clarity for essential level content.
- Focus specifically on the aspect described in the column name.
- Use technical language appropriate for the audience level.`,
    
    evaluativePrompt: `ROLE: You are an AI content reviewer specializing in technical accuracy.
TASK: Evaluate the Incident Response Planning content for **[TERM]**.
OUTPUT FORMAT: Return JSON with "score" (1-10) and "feedback" string.
CONSTRAINTS:
- Check accuracy and completeness for Security incident response procedures.
- Verify appropriate detail level for essential content.
- Assess clarity and technical correctness.
- Note any missing key points or inaccuracies.`,
    
    improvementPrompt: `ROLE: You are an AI writing assistant improving technical content.
TASK: Enhance the Incident Response Planning content for **[TERM]**.
OUTPUT FORMAT: Return only the improved content in the same format.
CONSTRAINTS:
- Maintain accuracy while improving clarity.
- Ensure completeness for Security incident response procedures.
- Keep within appropriate scope and detail level.
- Address any feedback from evaluation.`
  },

  // Column 210: Vulnerability Assessment
  {
    columnId: 'security_vulnerability_assessment',
    generativePrompt: `ROLE: You are an AI/ML expert creating comprehensive glossary content.
TASK: Generate content for **[TERM]** focusing on: Vulnerability Assessment.
CONTEXT: Security vulnerability scanning and assessment
OUTPUT FORMAT: Write content in Markdown format.
CONSTRAINTS:
- Provide moderate detail (1-2 paragraphs or 5-7 bullet points).
- Ensure accuracy and clarity for important level content.
- Focus specifically on the aspect described in the column name.
- Use technical language appropriate for the audience level.`,
    
    evaluativePrompt: `ROLE: You are an AI content reviewer specializing in technical accuracy.
TASK: Evaluate the Vulnerability Assessment content for **[TERM]**.
OUTPUT FORMAT: Return JSON with "score" (1-10) and "feedback" string.
CONSTRAINTS:
- Check accuracy and completeness for Security vulnerability scanning and assessment.
- Verify appropriate detail level for important content.
- Assess clarity and technical correctness.
- Note any missing key points or inaccuracies.`,
    
    improvementPrompt: `ROLE: You are an AI writing assistant improving technical content.
TASK: Enhance the Vulnerability Assessment content for **[TERM]**.
OUTPUT FORMAT: Return only the improved content in the same format.
CONSTRAINTS:
- Maintain accuracy while improving clarity.
- Ensure completeness for Security vulnerability scanning and assessment.
- Keep within appropriate scope and detail level.
- Address any feedback from evaluation.`
  },

  // Column 211: Interactive Element: Security Assessment Tool
  {
    columnId: 'security_interactive_assessment',
    generativePrompt: `ROLE: You are an AI/ML expert creating comprehensive glossary content.
TASK: Generate content for **[TERM]** focusing on: Interactive Element: Security Assessment Tool.
CONTEXT: Interactive security assessment and threat modeling
OUTPUT FORMAT: Provide interactive content specification in markdown format.
CONSTRAINTS:
- Provide comprehensive detail with multiple sections.
- Ensure accuracy and clarity for advanced level content.
- Focus specifically on the aspect described in the column name.
- Use technical language appropriate for the audience level.`,
    
    evaluativePrompt: `ROLE: You are an AI content reviewer specializing in technical accuracy.
TASK: Evaluate the Interactive Element: Security Assessment Tool content for **[TERM]**.
OUTPUT FORMAT: Return JSON with "score" (1-10) and "feedback" string.
CONSTRAINTS:
- Check accuracy and completeness for Interactive security assessment and threat modeling.
- Verify appropriate detail level for advanced content.
- Assess clarity and technical correctness.
- Note any missing key points or inaccuracies.`,
    
    improvementPrompt: `ROLE: You are an AI writing assistant improving technical content.
TASK: Enhance the Interactive Element: Security Assessment Tool content for **[TERM]**.
OUTPUT FORMAT: Return only the improved content in the same format.
CONSTRAINTS:
- Maintain accuracy while improving clarity.
- Ensure completeness for Interactive security assessment and threat modeling.
- Keep within appropriate scope and detail level.
- Address any feedback from evaluation.`
  },

  // Column 212: Accessibility Design Principles
  {
    columnId: 'accessibility_design_principles',
    generativePrompt: `ROLE: You are an AI/ML expert creating comprehensive glossary content.
TASK: Generate content for **[TERM]** focusing on: Accessibility Design Principles.
CONTEXT: Core principles of accessible design
OUTPUT FORMAT: Write content in Markdown format.
CONSTRAINTS:
- Provide moderate detail (1-2 paragraphs or 5-7 bullet points).
- Ensure accuracy and clarity for important level content.
- Focus specifically on the aspect described in the column name.
- Use technical language appropriate for the audience level.`,
    
    evaluativePrompt: `ROLE: You are an AI content reviewer specializing in technical accuracy.
TASK: Evaluate the Accessibility Design Principles content for **[TERM]**.
OUTPUT FORMAT: Return JSON with "score" (1-10) and "feedback" string.
CONSTRAINTS:
- Check accuracy and completeness for Core principles of accessible design.
- Verify appropriate detail level for important content.
- Assess clarity and technical correctness.
- Note any missing key points or inaccuracies.`,
    
    improvementPrompt: `ROLE: You are an AI writing assistant improving technical content.
TASK: Enhance the Accessibility Design Principles content for **[TERM]**.
OUTPUT FORMAT: Return only the improved content in the same format.
CONSTRAINTS:
- Maintain accuracy while improving clarity.
- Ensure completeness for Core principles of accessible design.
- Keep within appropriate scope and detail level.
- Address any feedback from evaluation.`
  },

  // Column 213: WCAG Compliance
  {
    columnId: 'accessibility_wcag_compliance',
    generativePrompt: `ROLE: You are an AI/ML expert creating comprehensive glossary content.
TASK: Generate content for **[TERM]** focusing on: WCAG Compliance.
CONTEXT: Web Content Accessibility Guidelines compliance
OUTPUT FORMAT: Write content in Markdown format.
CONSTRAINTS:
- Provide moderate detail (1-2 paragraphs or 5-7 bullet points).
- Ensure accuracy and clarity for important level content.
- Focus specifically on the aspect described in the column name.
- Use technical language appropriate for the audience level.`,
    
    evaluativePrompt: `ROLE: You are an AI content reviewer specializing in technical accuracy.
TASK: Evaluate the WCAG Compliance content for **[TERM]**.
OUTPUT FORMAT: Return JSON with "score" (1-10) and "feedback" string.
CONSTRAINTS:
- Check accuracy and completeness for Web Content Accessibility Guidelines compliance.
- Verify appropriate detail level for important content.
- Assess clarity and technical correctness.
- Note any missing key points or inaccuracies.`,
    
    improvementPrompt: `ROLE: You are an AI writing assistant improving technical content.
TASK: Enhance the WCAG Compliance content for **[TERM]**.
OUTPUT FORMAT: Return only the improved content in the same format.
CONSTRAINTS:
- Maintain accuracy while improving clarity.
- Ensure completeness for Web Content Accessibility Guidelines compliance.
- Keep within appropriate scope and detail level.
- Address any feedback from evaluation.`
  },

  // Column 214: Assistive Technologies Support
  {
    columnId: 'accessibility_assistive_technologies',
    generativePrompt: `ROLE: You are an AI/ML expert creating comprehensive glossary content.
TASK: Generate content for **[TERM]** focusing on: Assistive Technologies Support.
CONTEXT: Supporting screen readers and other assistive tech
OUTPUT FORMAT: Write content in Markdown format.
CONSTRAINTS:
- Provide moderate detail (1-2 paragraphs or 5-7 bullet points).
- Ensure accuracy and clarity for important level content.
- Focus specifically on the aspect described in the column name.
- Use technical language appropriate for the audience level.`,
    
    evaluativePrompt: `ROLE: You are an AI content reviewer specializing in technical accuracy.
TASK: Evaluate the Assistive Technologies Support content for **[TERM]**.
OUTPUT FORMAT: Return JSON with "score" (1-10) and "feedback" string.
CONSTRAINTS:
- Check accuracy and completeness for Supporting screen readers and other assistive tech.
- Verify appropriate detail level for important content.
- Assess clarity and technical correctness.
- Note any missing key points or inaccuracies.`,
    
    improvementPrompt: `ROLE: You are an AI writing assistant improving technical content.
TASK: Enhance the Assistive Technologies Support content for **[TERM]**.
OUTPUT FORMAT: Return only the improved content in the same format.
CONSTRAINTS:
- Maintain accuracy while improving clarity.
- Ensure completeness for Supporting screen readers and other assistive tech.
- Keep within appropriate scope and detail level.
- Address any feedback from evaluation.`
  },

  // Column 215: Testing Tools and Methods
  {
    columnId: 'accessibility_testing_tools',
    generativePrompt: `ROLE: You are an AI/ML expert creating comprehensive glossary content.
TASK: Generate content for **[TERM]** focusing on: Testing Tools and Methods.
CONTEXT: Accessibility testing tools and methodologies
OUTPUT FORMAT: Provide a markdown unordered list.
CONSTRAINTS:
- Provide moderate detail (1-2 paragraphs or 5-7 bullet points).
- Ensure accuracy and clarity for supplementary level content.
- Focus specifically on the aspect described in the column name.
- Use technical language appropriate for the audience level.`,
    
    evaluativePrompt: `ROLE: You are an AI content reviewer specializing in technical accuracy.
TASK: Evaluate the Testing Tools and Methods content for **[TERM]**.
OUTPUT FORMAT: Return JSON with "score" (1-10) and "feedback" string.
CONSTRAINTS:
- Check accuracy and completeness for Accessibility testing tools and methodologies.
- Verify appropriate detail level for supplementary content.
- Assess clarity and technical correctness.
- Note any missing key points or inaccuracies.`,
    
    improvementPrompt: `ROLE: You are an AI writing assistant improving technical content.
TASK: Enhance the Testing Tools and Methods content for **[TERM]**.
OUTPUT FORMAT: Return only the improved content in the same format.
CONSTRAINTS:
- Maintain accuracy while improving clarity.
- Ensure completeness for Accessibility testing tools and methodologies.
- Keep within appropriate scope and detail level.
- Address any feedback from evaluation.`
  },

  // Column 216: Inclusive Design Practices
  {
    columnId: 'accessibility_inclusive_design',
    generativePrompt: `ROLE: You are an AI/ML expert creating comprehensive glossary content.
TASK: Generate content for **[TERM]** focusing on: Inclusive Design Practices.
CONTEXT: Building inclusive AI/ML systems
OUTPUT FORMAT: Write content in Markdown format.
CONSTRAINTS:
- Provide moderate detail (1-2 paragraphs or 5-7 bullet points).
- Ensure accuracy and clarity for important level content.
- Focus specifically on the aspect described in the column name.
- Use technical language appropriate for the audience level.`,
    
    evaluativePrompt: `ROLE: You are an AI content reviewer specializing in technical accuracy.
TASK: Evaluate the Inclusive Design Practices content for **[TERM]**.
OUTPUT FORMAT: Return JSON with "score" (1-10) and "feedback" string.
CONSTRAINTS:
- Check accuracy and completeness for Building inclusive AI/ML systems.
- Verify appropriate detail level for important content.
- Assess clarity and technical correctness.
- Note any missing key points or inaccuracies.`,
    
    improvementPrompt: `ROLE: You are an AI writing assistant improving technical content.
TASK: Enhance the Inclusive Design Practices content for **[TERM]**.
OUTPUT FORMAT: Return only the improved content in the same format.
CONSTRAINTS:
- Maintain accuracy while improving clarity.
- Ensure completeness for Building inclusive AI/ML systems.
- Keep within appropriate scope and detail level.
- Address any feedback from evaluation.`
  },

  // Column 217: Interactive Element: Accessibility Checker
  {
    columnId: 'accessibility_interactive_checker',
    generativePrompt: `ROLE: You are an AI/ML expert creating comprehensive glossary content.
TASK: Generate content for **[TERM]** focusing on: Interactive Element: Accessibility Checker.
CONTEXT: Interactive accessibility checker and guidelines
OUTPUT FORMAT: Provide interactive content specification in markdown format.
CONSTRAINTS:
- Provide comprehensive detail with multiple sections.
- Ensure accuracy and clarity for advanced level content.
- Focus specifically on the aspect described in the column name.
- Use technical language appropriate for the audience level.`,
    
    evaluativePrompt: `ROLE: You are an AI content reviewer specializing in technical accuracy.
TASK: Evaluate the Interactive Element: Accessibility Checker content for **[TERM]**.
OUTPUT FORMAT: Return JSON with "score" (1-10) and "feedback" string.
CONSTRAINTS:
- Check accuracy and completeness for Interactive accessibility checker and guidelines.
- Verify appropriate detail level for advanced content.
- Assess clarity and technical correctness.
- Note any missing key points or inaccuracies.`,
    
    improvementPrompt: `ROLE: You are an AI writing assistant improving technical content.
TASK: Enhance the Interactive Element: Accessibility Checker content for **[TERM]**.
OUTPUT FORMAT: Return only the improved content in the same format.
CONSTRAINTS:
- Maintain accuracy while improving clarity.
- Ensure completeness for Interactive accessibility checker and guidelines.
- Keep within appropriate scope and detail level.
- Address any feedback from evaluation.`
  },

  // Column 218: Code Sandbox or Playground
  {
    columnId: 'interactive_code_sandbox',
    generativePrompt: `ROLE: You are an AI/ML expert creating comprehensive glossary content.
TASK: Generate content for **[TERM]** focusing on: Code Sandbox or Playground.
CONTEXT: Interactive code playground for experimentation
OUTPUT FORMAT: Provide interactive content specification in markdown format.
CONSTRAINTS:
- Provide comprehensive detail with multiple sections.
- Ensure accuracy and clarity for advanced level content.
- Focus specifically on the aspect described in the column name.
- Use technical language appropriate for the audience level.`,
    
    evaluativePrompt: `ROLE: You are an AI content reviewer specializing in technical accuracy.
TASK: Evaluate the Code Sandbox or Playground content for **[TERM]**.
OUTPUT FORMAT: Return JSON with "score" (1-10) and "feedback" string.
CONSTRAINTS:
- Check accuracy and completeness for Interactive code playground for experimentation.
- Verify appropriate detail level for advanced content.
- Assess clarity and technical correctness.
- Note any missing key points or inaccuracies.`,
    
    improvementPrompt: `ROLE: You are an AI writing assistant improving technical content.
TASK: Enhance the Code Sandbox or Playground content for **[TERM]**.
OUTPUT FORMAT: Return only the improved content in the same format.
CONSTRAINTS:
- Maintain accuracy while improving clarity.
- Ensure completeness for Interactive code playground for experimentation.
- Keep within appropriate scope and detail level.
- Address any feedback from evaluation.`
  },

  // Column 219: Interactive Visualization Tools
  {
    columnId: 'interactive_visualization_tools',
    generativePrompt: `ROLE: You are an AI/ML expert creating comprehensive glossary content.
TASK: Generate content for **[TERM]** focusing on: Interactive Visualization Tools.
CONTEXT: Dynamic data and model visualization tools
OUTPUT FORMAT: Provide interactive content specification in markdown format.
CONSTRAINTS:
- Provide comprehensive detail with multiple sections.
- Ensure accuracy and clarity for advanced level content.
- Focus specifically on the aspect described in the column name.
- Use technical language appropriate for the audience level.`,
    
    evaluativePrompt: `ROLE: You are an AI content reviewer specializing in technical accuracy.
TASK: Evaluate the Interactive Visualization Tools content for **[TERM]**.
OUTPUT FORMAT: Return JSON with "score" (1-10) and "feedback" string.
CONSTRAINTS:
- Check accuracy and completeness for Dynamic data and model visualization tools.
- Verify appropriate detail level for advanced content.
- Assess clarity and technical correctness.
- Note any missing key points or inaccuracies.`,
    
    improvementPrompt: `ROLE: You are an AI writing assistant improving technical content.
TASK: Enhance the Interactive Visualization Tools content for **[TERM]**.
OUTPUT FORMAT: Return only the improved content in the same format.
CONSTRAINTS:
- Maintain accuracy while improving clarity.
- Ensure completeness for Dynamic data and model visualization tools.
- Keep within appropriate scope and detail level.
- Address any feedback from evaluation.`
  },

  // Column 220: Simulation or Demo Applications
  {
    columnId: 'interactive_simulation_demos',
    generativePrompt: `ROLE: You are an AI/ML expert creating comprehensive glossary content.
TASK: Generate content for **[TERM]** focusing on: Simulation or Demo Applications.
CONTEXT: Interactive simulations and demonstrations
OUTPUT FORMAT: Provide interactive content specification in markdown format.
CONSTRAINTS:
- Provide comprehensive detail with multiple sections.
- Ensure accuracy and clarity for advanced level content.
- Focus specifically on the aspect described in the column name.
- Use technical language appropriate for the audience level.`,
    
    evaluativePrompt: `ROLE: You are an AI content reviewer specializing in technical accuracy.
TASK: Evaluate the Simulation or Demo Applications content for **[TERM]**.
OUTPUT FORMAT: Return JSON with "score" (1-10) and "feedback" string.
CONSTRAINTS:
- Check accuracy and completeness for Interactive simulations and demonstrations.
- Verify appropriate detail level for advanced content.
- Assess clarity and technical correctness.
- Note any missing key points or inaccuracies.`,
    
    improvementPrompt: `ROLE: You are an AI writing assistant improving technical content.
TASK: Enhance the Simulation or Demo Applications content for **[TERM]**.
OUTPUT FORMAT: Return only the improved content in the same format.
CONSTRAINTS:
- Maintain accuracy while improving clarity.
- Ensure completeness for Interactive simulations and demonstrations.
- Keep within appropriate scope and detail level.
- Address any feedback from evaluation.`
  },

  // Column 221: Interactive Quizzes or Assessments
  {
    columnId: 'interactive_quiz_assessments',
    generativePrompt: `ROLE: You are an AI/ML expert creating comprehensive glossary content.
TASK: Generate content for **[TERM]** focusing on: Interactive Quizzes or Assessments.
CONTEXT: Knowledge assessment quizzes
OUTPUT FORMAT: Provide interactive content specification in markdown format.
CONSTRAINTS:
- Provide moderate detail (1-2 paragraphs or 5-7 bullet points).
- Ensure accuracy and clarity for advanced level content.
- Focus specifically on the aspect described in the column name.
- Use technical language appropriate for the audience level.`,
    
    evaluativePrompt: `ROLE: You are an AI content reviewer specializing in technical accuracy.
TASK: Evaluate the Interactive Quizzes or Assessments content for **[TERM]**.
OUTPUT FORMAT: Return JSON with "score" (1-10) and "feedback" string.
CONSTRAINTS:
- Check accuracy and completeness for Knowledge assessment quizzes.
- Verify appropriate detail level for advanced content.
- Assess clarity and technical correctness.
- Note any missing key points or inaccuracies.`,
    
    improvementPrompt: `ROLE: You are an AI writing assistant improving technical content.
TASK: Enhance the Interactive Quizzes or Assessments content for **[TERM]**.
OUTPUT FORMAT: Return only the improved content in the same format.
CONSTRAINTS:
- Maintain accuracy while improving clarity.
- Ensure completeness for Knowledge assessment quizzes.
- Keep within appropriate scope and detail level.
- Address any feedback from evaluation.`
  },

  // Column 222: Calculators or Utility Tools
  {
    columnId: 'interactive_calculators_tools',
    generativePrompt: `ROLE: You are an AI/ML expert creating comprehensive glossary content.
TASK: Generate content for **[TERM]** focusing on: Calculators or Utility Tools.
CONTEXT: Interactive calculators and utilities
OUTPUT FORMAT: Provide interactive content specification in markdown format.
CONSTRAINTS:
- Provide moderate detail (1-2 paragraphs or 5-7 bullet points).
- Ensure accuracy and clarity for advanced level content.
- Focus specifically on the aspect described in the column name.
- Use technical language appropriate for the audience level.`,
    
    evaluativePrompt: `ROLE: You are an AI content reviewer specializing in technical accuracy.
TASK: Evaluate the Calculators or Utility Tools content for **[TERM]**.
OUTPUT FORMAT: Return JSON with "score" (1-10) and "feedback" string.
CONSTRAINTS:
- Check accuracy and completeness for Interactive calculators and utilities.
- Verify appropriate detail level for advanced content.
- Assess clarity and technical correctness.
- Note any missing key points or inaccuracies.`,
    
    improvementPrompt: `ROLE: You are an AI writing assistant improving technical content.
TASK: Enhance the Calculators or Utility Tools content for **[TERM]**.
OUTPUT FORMAT: Return only the improved content in the same format.
CONSTRAINTS:
- Maintain accuracy while improving clarity.
- Ensure completeness for Interactive calculators and utilities.
- Keep within appropriate scope and detail level.
- Address any feedback from evaluation.`
  },

  // Column 223: Collaborative Features
  {
    columnId: 'interactive_collaborative_features',
    generativePrompt: `ROLE: You are an AI/ML expert creating comprehensive glossary content.
TASK: Generate content for **[TERM]** focusing on: Collaborative Features.
CONTEXT: Collaborative learning and sharing features
OUTPUT FORMAT: Provide interactive content specification in markdown format.
CONSTRAINTS:
- Provide moderate detail (1-2 paragraphs or 5-7 bullet points).
- Ensure accuracy and clarity for advanced level content.
- Focus specifically on the aspect described in the column name.
- Use technical language appropriate for the audience level.`,
    
    evaluativePrompt: `ROLE: You are an AI content reviewer specializing in technical accuracy.
TASK: Evaluate the Collaborative Features content for **[TERM]**.
OUTPUT FORMAT: Return JSON with "score" (1-10) and "feedback" string.
CONSTRAINTS:
- Check accuracy and completeness for Collaborative learning and sharing features.
- Verify appropriate detail level for advanced content.
- Assess clarity and technical correctness.
- Note any missing key points or inaccuracies.`,
    
    improvementPrompt: `ROLE: You are an AI writing assistant improving technical content.
TASK: Enhance the Collaborative Features content for **[TERM]**.
OUTPUT FORMAT: Return only the improved content in the same format.
CONSTRAINTS:
- Maintain accuracy while improving clarity.
- Ensure completeness for Collaborative learning and sharing features.
- Keep within appropriate scope and detail level.
- Address any feedback from evaluation.`
  },

  // Column 224: API Explorer
  {
    columnId: 'interactive_api_explorer',
    generativePrompt: `ROLE: You are an AI/ML expert creating comprehensive glossary content.
TASK: Generate content for **[TERM]** focusing on: API Explorer.
CONTEXT: Interactive API testing and exploration
OUTPUT FORMAT: Provide interactive content specification in markdown format.
CONSTRAINTS:
- Provide comprehensive detail with multiple sections.
- Ensure accuracy and clarity for advanced level content.
- Focus specifically on the aspect described in the column name.
- Use technical language appropriate for the audience level.`,
    
    evaluativePrompt: `ROLE: You are an AI content reviewer specializing in technical accuracy.
TASK: Evaluate the API Explorer content for **[TERM]**.
OUTPUT FORMAT: Return JSON with "score" (1-10) and "feedback" string.
CONSTRAINTS:
- Check accuracy and completeness for Interactive API testing and exploration.
- Verify appropriate detail level for advanced content.
- Assess clarity and technical correctness.
- Note any missing key points or inaccuracies.`,
    
    improvementPrompt: `ROLE: You are an AI writing assistant improving technical content.
TASK: Enhance the API Explorer content for **[TERM]**.
OUTPUT FORMAT: Return only the improved content in the same format.
CONSTRAINTS:
- Maintain accuracy while improving clarity.
- Ensure completeness for Interactive API testing and exploration.
- Keep within appropriate scope and detail level.
- Address any feedback from evaluation.`
  },

  // Column 225: User Feedback System
  {
    columnId: 'interactive_feedback_system',
    generativePrompt: `ROLE: You are an AI/ML expert creating comprehensive glossary content.
TASK: Generate content for **[TERM]** focusing on: User Feedback System.
CONTEXT: Interactive feedback and rating system
OUTPUT FORMAT: Provide interactive content specification in markdown format.
CONSTRAINTS:
- Provide moderate detail (1-2 paragraphs or 5-7 bullet points).
- Ensure accuracy and clarity for advanced level content.
- Focus specifically on the aspect described in the column name.
- Use technical language appropriate for the audience level.`,
    
    evaluativePrompt: `ROLE: You are an AI content reviewer specializing in technical accuracy.
TASK: Evaluate the User Feedback System content for **[TERM]**.
OUTPUT FORMAT: Return JSON with "score" (1-10) and "feedback" string.
CONSTRAINTS:
- Check accuracy and completeness for Interactive feedback and rating system.
- Verify appropriate detail level for advanced content.
- Assess clarity and technical correctness.
- Note any missing key points or inaccuracies.`,
    
    improvementPrompt: `ROLE: You are an AI writing assistant improving technical content.
TASK: Enhance the User Feedback System content for **[TERM]**.
OUTPUT FORMAT: Return only the improved content in the same format.
CONSTRAINTS:
- Maintain accuracy while improving clarity.
- Ensure completeness for Interactive feedback and rating system.
- Keep within appropriate scope and detail level.
- Address any feedback from evaluation.`
  },

  // Column 226: Personalization Features
  {
    columnId: 'interactive_personalization',
    generativePrompt: `ROLE: You are an AI/ML expert creating comprehensive glossary content.
TASK: Generate content for **[TERM]** focusing on: Personalization Features.
CONTEXT: Personalized learning paths and content
OUTPUT FORMAT: Provide interactive content specification in markdown format.
CONSTRAINTS:
- Provide moderate detail (1-2 paragraphs or 5-7 bullet points).
- Ensure accuracy and clarity for advanced level content.
- Focus specifically on the aspect described in the column name.
- Use technical language appropriate for the audience level.`,
    
    evaluativePrompt: `ROLE: You are an AI content reviewer specializing in technical accuracy.
TASK: Evaluate the Personalization Features content for **[TERM]**.
OUTPUT FORMAT: Return JSON with "score" (1-10) and "feedback" string.
CONSTRAINTS:
- Check accuracy and completeness for Personalized learning paths and content.
- Verify appropriate detail level for advanced content.
- Assess clarity and technical correctness.
- Note any missing key points or inaccuracies.`,
    
    improvementPrompt: `ROLE: You are an AI writing assistant improving technical content.
TASK: Enhance the Personalization Features content for **[TERM]**.
OUTPUT FORMAT: Return only the improved content in the same format.
CONSTRAINTS:
- Maintain accuracy while improving clarity.
- Ensure completeness for Personalized learning paths and content.
- Keep within appropriate scope and detail level.
- Address any feedback from evaluation.`
  },

  // Column 227: Key Takeaways
  {
    columnId: 'summary_key_takeaways',
    generativePrompt: `ROLE: You are an AI/ML expert creating comprehensive glossary content.
TASK: Generate content for **[TERM]** focusing on: Key Takeaways.
CONTEXT: Essential points to remember
OUTPUT FORMAT: Provide a markdown unordered list.
CONSTRAINTS:
- Provide moderate detail (1-2 paragraphs or 5-7 bullet points).
- Ensure accuracy and clarity for essential level content.
- Focus specifically on the aspect described in the column name.
- Use technical language appropriate for the audience level.`,
    
    evaluativePrompt: `ROLE: You are an AI content reviewer specializing in technical accuracy.
TASK: Evaluate the Key Takeaways content for **[TERM]**.
OUTPUT FORMAT: Return JSON with "score" (1-10) and "feedback" string.
CONSTRAINTS:
- Check accuracy and completeness for Essential points to remember.
- Verify appropriate detail level for essential content.
- Assess clarity and technical correctness.
- Note any missing key points or inaccuracies.`,
    
    improvementPrompt: `ROLE: You are an AI writing assistant improving technical content.
TASK: Enhance the Key Takeaways content for **[TERM]**.
OUTPUT FORMAT: Return only the improved content in the same format.
CONSTRAINTS:
- Maintain accuracy while improving clarity.
- Ensure completeness for Essential points to remember.
- Keep within appropriate scope and detail level.
- Address any feedback from evaluation.`
  },

  // Column 228: Recap of Main Points
  {
    columnId: 'summary_recap_main_points',
    generativePrompt: `ROLE: You are an AI/ML expert creating comprehensive glossary content.
TASK: Generate content for **[TERM]** focusing on: Recap of Main Points.
CONTEXT: Comprehensive recap of all major points
OUTPUT FORMAT: Write content in Markdown format.
CONSTRAINTS:
- Provide moderate detail (1-2 paragraphs or 5-7 bullet points).
- Ensure accuracy and clarity for important level content.
- Focus specifically on the aspect described in the column name.
- Use technical language appropriate for the audience level.`,
    
    evaluativePrompt: `ROLE: You are an AI content reviewer specializing in technical accuracy.
TASK: Evaluate the Recap of Main Points content for **[TERM]**.
OUTPUT FORMAT: Return JSON with "score" (1-10) and "feedback" string.
CONSTRAINTS:
- Check accuracy and completeness for Comprehensive recap of all major points.
- Verify appropriate detail level for important content.
- Assess clarity and technical correctness.
- Note any missing key points or inaccuracies.`,
    
    improvementPrompt: `ROLE: You are an AI writing assistant improving technical content.
TASK: Enhance the Recap of Main Points content for **[TERM]**.
OUTPUT FORMAT: Return only the improved content in the same format.
CONSTRAINTS:
- Maintain accuracy while improving clarity.
- Ensure completeness for Comprehensive recap of all major points.
- Keep within appropriate scope and detail level.
- Address any feedback from evaluation.`
  },

  // Column 229: Action Items or Next Steps
  {
    columnId: 'summary_action_items',
    generativePrompt: `ROLE: You are an AI/ML expert creating comprehensive glossary content.
TASK: Generate content for **[TERM]** focusing on: Action Items or Next Steps.
CONTEXT: Recommended next steps for learners
OUTPUT FORMAT: Provide a markdown unordered list.
CONSTRAINTS:
- Provide moderate detail (1-2 paragraphs or 5-7 bullet points).
- Ensure accuracy and clarity for essential level content.
- Focus specifically on the aspect described in the column name.
- Use technical language appropriate for the audience level.`,
    
    evaluativePrompt: `ROLE: You are an AI content reviewer specializing in technical accuracy.
TASK: Evaluate the Action Items or Next Steps content for **[TERM]**.
OUTPUT FORMAT: Return JSON with "score" (1-10) and "feedback" string.
CONSTRAINTS:
- Check accuracy and completeness for Recommended next steps for learners.
- Verify appropriate detail level for essential content.
- Assess clarity and technical correctness.
- Note any missing key points or inaccuracies.`,
    
    improvementPrompt: `ROLE: You are an AI writing assistant improving technical content.
TASK: Enhance the Action Items or Next Steps content for **[TERM]**.
OUTPUT FORMAT: Return only the improved content in the same format.
CONSTRAINTS:
- Maintain accuracy while improving clarity.
- Ensure completeness for Recommended next steps for learners.
- Keep within appropriate scope and detail level.
- Address any feedback from evaluation.`
  },

  // Column 230: Further Reading Suggestions
  {
    columnId: 'summary_further_reading',
    generativePrompt: `ROLE: You are an AI/ML expert creating comprehensive glossary content.
TASK: Generate content for **[TERM]** focusing on: Further Reading Suggestions.
CONTEXT: Additional resources for deeper learning
OUTPUT FORMAT: Provide a markdown unordered list.
CONSTRAINTS:
- Provide moderate detail (1-2 paragraphs or 5-7 bullet points).
- Ensure accuracy and clarity for supplementary level content.
- Focus specifically on the aspect described in the column name.
- Use technical language appropriate for the audience level.`,
    
    evaluativePrompt: `ROLE: You are an AI content reviewer specializing in technical accuracy.
TASK: Evaluate the Further Reading Suggestions content for **[TERM]**.
OUTPUT FORMAT: Return JSON with "score" (1-10) and "feedback" string.
CONSTRAINTS:
- Check accuracy and completeness for Additional resources for deeper learning.
- Verify appropriate detail level for supplementary content.
- Assess clarity and technical correctness.
- Note any missing key points or inaccuracies.`,
    
    improvementPrompt: `ROLE: You are an AI writing assistant improving technical content.
TASK: Enhance the Further Reading Suggestions content for **[TERM]**.
OUTPUT FORMAT: Return only the improved content in the same format.
CONSTRAINTS:
- Maintain accuracy while improving clarity.
- Ensure completeness for Additional resources for deeper learning.
- Keep within appropriate scope and detail level.
- Address any feedback from evaluation.`
  },

  // Column 231: Interactive Element: Review Quiz
  {
    columnId: 'summary_interactive_review',
    generativePrompt: `ROLE: You are an AI/ML expert creating comprehensive glossary content.
TASK: Generate content for **[TERM]** focusing on: Interactive Element: Review Quiz.
CONTEXT: Interactive review quiz and summary cards
OUTPUT FORMAT: Provide interactive content specification in markdown format.
CONSTRAINTS:
- Provide comprehensive detail with multiple sections.
- Ensure accuracy and clarity for advanced level content.
- Focus specifically on the aspect described in the column name.
- Use technical language appropriate for the audience level.`,
    
    evaluativePrompt: `ROLE: You are an AI content reviewer specializing in technical accuracy.
TASK: Evaluate the Interactive Element: Review Quiz content for **[TERM]**.
OUTPUT FORMAT: Return JSON with "score" (1-10) and "feedback" string.
CONSTRAINTS:
- Check accuracy and completeness for Interactive review quiz and summary cards.
- Verify appropriate detail level for advanced content.
- Assess clarity and technical correctness.
- Note any missing key points or inaccuracies.`,
    
    improvementPrompt: `ROLE: You are an AI writing assistant improving technical content.
TASK: Enhance the Interactive Element: Review Quiz content for **[TERM]**.
OUTPUT FORMAT: Return only the improved content in the same format.
CONSTRAINTS:
- Maintain accuracy while improving clarity.
- Ensure completeness for Interactive review quiz and summary cards.
- Keep within appropriate scope and detail level.
- Address any feedback from evaluation.`
  },

  // Column 232: Key Terms and Definitions
  {
    columnId: 'glossary_key_terms',
    generativePrompt: `ROLE: You are an AI/ML expert creating comprehensive glossary content.
TASK: Generate content for **[TERM]** focusing on: Key Terms and Definitions.
CONTEXT: Essential terminology and definitions
OUTPUT FORMAT: Provide a markdown unordered list.
CONSTRAINTS:
- Provide moderate detail (1-2 paragraphs or 5-7 bullet points).
- Ensure accuracy and clarity for essential level content.
- Focus specifically on the aspect described in the column name.
- Use technical language appropriate for the audience level.`,
    
    evaluativePrompt: `ROLE: You are an AI content reviewer specializing in technical accuracy.
TASK: Evaluate the Key Terms and Definitions content for **[TERM]**.
OUTPUT FORMAT: Return JSON with "score" (1-10) and "feedback" string.
CONSTRAINTS:
- Check accuracy and completeness for Essential terminology and definitions.
- Verify appropriate detail level for essential content.
- Assess clarity and technical correctness.
- Note any missing key points or inaccuracies.`,
    
    improvementPrompt: `ROLE: You are an AI writing assistant improving technical content.
TASK: Enhance the Key Terms and Definitions content for **[TERM]**.
OUTPUT FORMAT: Return only the improved content in the same format.
CONSTRAINTS:
- Maintain accuracy while improving clarity.
- Ensure completeness for Essential terminology and definitions.
- Keep within appropriate scope and detail level.
- Address any feedback from evaluation.`
  },

  // Column 233: Acronyms and Abbreviations
  {
    columnId: 'glossary_acronyms_abbreviations',
    generativePrompt: `ROLE: You are an AI/ML expert creating comprehensive glossary content.
TASK: Generate content for **[TERM]** focusing on: Acronyms and Abbreviations.
CONTEXT: Common acronyms and their meanings
OUTPUT FORMAT: Provide a markdown unordered list.
CONSTRAINTS:
- Provide moderate detail (1-2 paragraphs or 5-7 bullet points).
- Ensure accuracy and clarity for important level content.
- Focus specifically on the aspect described in the column name.
- Use technical language appropriate for the audience level.`,
    
    evaluativePrompt: `ROLE: You are an AI content reviewer specializing in technical accuracy.
TASK: Evaluate the Acronyms and Abbreviations content for **[TERM]**.
OUTPUT FORMAT: Return JSON with "score" (1-10) and "feedback" string.
CONSTRAINTS:
- Check accuracy and completeness for Common acronyms and their meanings.
- Verify appropriate detail level for important content.
- Assess clarity and technical correctness.
- Note any missing key points or inaccuracies.`,
    
    improvementPrompt: `ROLE: You are an AI writing assistant improving technical content.
TASK: Enhance the Acronyms and Abbreviations content for **[TERM]**.
OUTPUT FORMAT: Return only the improved content in the same format.
CONSTRAINTS:
- Maintain accuracy while improving clarity.
- Ensure completeness for Common acronyms and their meanings.
- Keep within appropriate scope and detail level.
- Address any feedback from evaluation.`
  },

  // Column 234: Technical Jargon Explained
  {
    columnId: 'glossary_technical_jargon',
    generativePrompt: `ROLE: You are an AI/ML expert creating comprehensive glossary content.
TASK: Generate content for **[TERM]** focusing on: Technical Jargon Explained.
CONTEXT: Explanation of technical terminology
OUTPUT FORMAT: Write content in Markdown format.
CONSTRAINTS:
- Provide moderate detail (1-2 paragraphs or 5-7 bullet points).
- Ensure accuracy and clarity for supplementary level content.
- Focus specifically on the aspect described in the column name.
- Use technical language appropriate for the audience level.`,
    
    evaluativePrompt: `ROLE: You are an AI content reviewer specializing in technical accuracy.
TASK: Evaluate the Technical Jargon Explained content for **[TERM]**.
OUTPUT FORMAT: Return JSON with "score" (1-10) and "feedback" string.
CONSTRAINTS:
- Check accuracy and completeness for Explanation of technical terminology.
- Verify appropriate detail level for supplementary content.
- Assess clarity and technical correctness.
- Note any missing key points or inaccuracies.`,
    
    improvementPrompt: `ROLE: You are an AI writing assistant improving technical content.
TASK: Enhance the Technical Jargon Explained content for **[TERM]**.
OUTPUT FORMAT: Return only the improved content in the same format.
CONSTRAINTS:
- Maintain accuracy while improving clarity.
- Ensure completeness for Explanation of technical terminology.
- Keep within appropriate scope and detail level.
- Address any feedback from evaluation.`
  },

  // Column 235: Interactive Element: Searchable Glossary
  {
    columnId: 'glossary_interactive_lookup',
    generativePrompt: `ROLE: You are an AI/ML expert creating comprehensive glossary content.
TASK: Generate content for **[TERM]** focusing on: Interactive Element: Searchable Glossary.
CONTEXT: Interactive glossary search and lookup
OUTPUT FORMAT: Provide interactive content specification in markdown format.
CONSTRAINTS:
- Provide comprehensive detail with multiple sections.
- Ensure accuracy and clarity for advanced level content.
- Focus specifically on the aspect described in the column name.
- Use technical language appropriate for the audience level.`,
    
    evaluativePrompt: `ROLE: You are an AI content reviewer specializing in technical accuracy.
TASK: Evaluate the Interactive Element: Searchable Glossary content for **[TERM]**.
OUTPUT FORMAT: Return JSON with "score" (1-10) and "feedback" string.
CONSTRAINTS:
- Check accuracy and completeness for Interactive glossary search and lookup.
- Verify appropriate detail level for advanced content.
- Assess clarity and technical correctness.
- Note any missing key points or inaccuracies.`,
    
    improvementPrompt: `ROLE: You are an AI writing assistant improving technical content.
TASK: Enhance the Interactive Element: Searchable Glossary content for **[TERM]**.
OUTPUT FORMAT: Return only the improved content in the same format.
CONSTRAINTS:
- Maintain accuracy while improving clarity.
- Ensure completeness for Interactive glossary search and lookup.
- Keep within appropriate scope and detail level.
- Address any feedback from evaluation.`
  },

  // Column 236: Bibliography
  {
    columnId: 'references_bibliography',
    generativePrompt: `ROLE: You are an AI/ML expert creating comprehensive glossary content.
TASK: Generate content for **[TERM]** focusing on: Bibliography.
CONTEXT: Complete bibliography of sources
OUTPUT FORMAT: Provide a markdown unordered list.
CONSTRAINTS:
- Provide moderate detail (1-2 paragraphs or 5-7 bullet points).
- Ensure accuracy and clarity for supplementary level content.
- Focus specifically on the aspect described in the column name.
- Use technical language appropriate for the audience level.`,
    
    evaluativePrompt: `ROLE: You are an AI content reviewer specializing in technical accuracy.
TASK: Evaluate the Bibliography content for **[TERM]**.
OUTPUT FORMAT: Return JSON with "score" (1-10) and "feedback" string.
CONSTRAINTS:
- Check accuracy and completeness for Complete bibliography of sources.
- Verify appropriate detail level for supplementary content.
- Assess clarity and technical correctness.
- Note any missing key points or inaccuracies.`,
    
    improvementPrompt: `ROLE: You are an AI writing assistant improving technical content.
TASK: Enhance the Bibliography content for **[TERM]**.
OUTPUT FORMAT: Return only the improved content in the same format.
CONSTRAINTS:
- Maintain accuracy while improving clarity.
- Ensure completeness for Complete bibliography of sources.
- Keep within appropriate scope and detail level.
- Address any feedback from evaluation.`
  },

  // Column 237: Academic Papers
  {
    columnId: 'references_academic_papers',
    generativePrompt: `ROLE: You are an AI/ML expert creating comprehensive glossary content.
TASK: Generate content for **[TERM]** focusing on: Academic Papers.
CONTEXT: Referenced academic papers and research
OUTPUT FORMAT: Provide a markdown unordered list.
CONSTRAINTS:
- Provide moderate detail (1-2 paragraphs or 5-7 bullet points).
- Ensure accuracy and clarity for supplementary level content.
- Focus specifically on the aspect described in the column name.
- Use technical language appropriate for the audience level.`,
    
    evaluativePrompt: `ROLE: You are an AI content reviewer specializing in technical accuracy.
TASK: Evaluate the Academic Papers content for **[TERM]**.
OUTPUT FORMAT: Return JSON with "score" (1-10) and "feedback" string.
CONSTRAINTS:
- Check accuracy and completeness for Referenced academic papers and research.
- Verify appropriate detail level for supplementary content.
- Assess clarity and technical correctness.
- Note any missing key points or inaccuracies.`,
    
    improvementPrompt: `ROLE: You are an AI writing assistant improving technical content.
TASK: Enhance the Academic Papers content for **[TERM]**.
OUTPUT FORMAT: Return only the improved content in the same format.
CONSTRAINTS:
- Maintain accuracy while improving clarity.
- Ensure completeness for Referenced academic papers and research.
- Keep within appropriate scope and detail level.
- Address any feedback from evaluation.`
  },

  // Column 238: Online Sources
  {
    columnId: 'references_online_sources',
    generativePrompt: `ROLE: You are an AI/ML expert creating comprehensive glossary content.
TASK: Generate content for **[TERM]** focusing on: Online Sources.
CONTEXT: Web resources and online references
OUTPUT FORMAT: Provide a markdown unordered list.
CONSTRAINTS:
- Provide moderate detail (1-2 paragraphs or 5-7 bullet points).
- Ensure accuracy and clarity for supplementary level content.
- Focus specifically on the aspect described in the column name.
- Use technical language appropriate for the audience level.`,
    
    evaluativePrompt: `ROLE: You are an AI content reviewer specializing in technical accuracy.
TASK: Evaluate the Online Sources content for **[TERM]**.
OUTPUT FORMAT: Return JSON with "score" (1-10) and "feedback" string.
CONSTRAINTS:
- Check accuracy and completeness for Web resources and online references.
- Verify appropriate detail level for supplementary content.
- Assess clarity and technical correctness.
- Note any missing key points or inaccuracies.`,
    
    improvementPrompt: `ROLE: You are an AI writing assistant improving technical content.
TASK: Enhance the Online Sources content for **[TERM]**.
OUTPUT FORMAT: Return only the improved content in the same format.
CONSTRAINTS:
- Maintain accuracy while improving clarity.
- Ensure completeness for Web resources and online references.
- Keep within appropriate scope and detail level.
- Address any feedback from evaluation.`
  },

  // Column 239: Books and Textbooks
  {
    columnId: 'references_books_textbooks',
    generativePrompt: `ROLE: You are an AI/ML expert creating comprehensive glossary content.
TASK: Generate content for **[TERM]** focusing on: Books and Textbooks.
CONTEXT: Referenced books and textbooks
OUTPUT FORMAT: Provide a markdown unordered list.
CONSTRAINTS:
- Provide moderate detail (1-2 paragraphs or 5-7 bullet points).
- Ensure accuracy and clarity for supplementary level content.
- Focus specifically on the aspect described in the column name.
- Use technical language appropriate for the audience level.`,
    
    evaluativePrompt: `ROLE: You are an AI content reviewer specializing in technical accuracy.
TASK: Evaluate the Books and Textbooks content for **[TERM]**.
OUTPUT FORMAT: Return JSON with "score" (1-10) and "feedback" string.
CONSTRAINTS:
- Check accuracy and completeness for Referenced books and textbooks.
- Verify appropriate detail level for supplementary content.
- Assess clarity and technical correctness.
- Note any missing key points or inaccuracies.`,
    
    improvementPrompt: `ROLE: You are an AI writing assistant improving technical content.
TASK: Enhance the Books and Textbooks content for **[TERM]**.
OUTPUT FORMAT: Return only the improved content in the same format.
CONSTRAINTS:
- Maintain accuracy while improving clarity.
- Ensure completeness for Referenced books and textbooks.
- Keep within appropriate scope and detail level.
- Address any feedback from evaluation.`
  },

  // Column 240: Interactive Element: Citation Manager
  {
    columnId: 'references_interactive_citations',
    generativePrompt: `ROLE: You are an AI/ML expert creating comprehensive glossary content.
TASK: Generate content for **[TERM]** focusing on: Interactive Element: Citation Manager.
CONTEXT: Interactive citation management tool
OUTPUT FORMAT: Provide interactive content specification in markdown format.
CONSTRAINTS:
- Provide moderate detail (1-2 paragraphs or 5-7 bullet points).
- Ensure accuracy and clarity for advanced level content.
- Focus specifically on the aspect described in the column name.
- Use technical language appropriate for the audience level.`,
    
    evaluativePrompt: `ROLE: You are an AI content reviewer specializing in technical accuracy.
TASK: Evaluate the Interactive Element: Citation Manager content for **[TERM]**.
OUTPUT FORMAT: Return JSON with "score" (1-10) and "feedback" string.
CONSTRAINTS:
- Check accuracy and completeness for Interactive citation management tool.
- Verify appropriate detail level for advanced content.
- Assess clarity and technical correctness.
- Note any missing key points or inaccuracies.`,
    
    improvementPrompt: `ROLE: You are an AI writing assistant improving technical content.
TASK: Enhance the Interactive Element: Citation Manager content for **[TERM]**.
OUTPUT FORMAT: Return only the improved content in the same format.
CONSTRAINTS:
- Maintain accuracy while improving clarity.
- Ensure completeness for Interactive citation management tool.
- Keep within appropriate scope and detail level.
- Address any feedback from evaluation.`
  },

  // Column 241: Version History
  {
    columnId: 'updates_version_history',
    generativePrompt: `ROLE: You are an AI/ML expert creating comprehensive glossary content.
TASK: Generate content for **[TERM]** focusing on: Version History.
CONTEXT: Version history and major updates
OUTPUT FORMAT: Provide a markdown unordered list.
CONSTRAINTS:
- Provide moderate detail (1-2 paragraphs or 5-7 bullet points).
- Ensure accuracy and clarity for supplementary level content.
- Focus specifically on the aspect described in the column name.
- Use technical language appropriate for the audience level.`,
    
    evaluativePrompt: `ROLE: You are an AI content reviewer specializing in technical accuracy.
TASK: Evaluate the Version History content for **[TERM]**.
OUTPUT FORMAT: Return JSON with "score" (1-10) and "feedback" string.
CONSTRAINTS:
- Check accuracy and completeness for Version history and major updates.
- Verify appropriate detail level for supplementary content.
- Assess clarity and technical correctness.
- Note any missing key points or inaccuracies.`,
    
    improvementPrompt: `ROLE: You are an AI writing assistant improving technical content.
TASK: Enhance the Version History content for **[TERM]**.
OUTPUT FORMAT: Return only the improved content in the same format.
CONSTRAINTS:
- Maintain accuracy while improving clarity.
- Ensure completeness for Version history and major updates.
- Keep within appropriate scope and detail level.
- Address any feedback from evaluation.`
  },

  // Column 242: Recent Changes
  {
    columnId: 'updates_recent_changes',
    generativePrompt: `ROLE: You are an AI/ML expert creating comprehensive glossary content.
TASK: Generate content for **[TERM]** focusing on: Recent Changes.
CONTEXT: Latest updates and modifications
OUTPUT FORMAT: Provide a markdown unordered list.
CONSTRAINTS:
- Provide moderate detail (1-2 paragraphs or 5-7 bullet points).
- Ensure accuracy and clarity for supplementary level content.
- Focus specifically on the aspect described in the column name.
- Use technical language appropriate for the audience level.`,
    
    evaluativePrompt: `ROLE: You are an AI content reviewer specializing in technical accuracy.
TASK: Evaluate the Recent Changes content for **[TERM]**.
OUTPUT FORMAT: Return JSON with "score" (1-10) and "feedback" string.
CONSTRAINTS:
- Check accuracy and completeness for Latest updates and modifications.
- Verify appropriate detail level for supplementary content.
- Assess clarity and technical correctness.
- Note any missing key points or inaccuracies.`,
    
    improvementPrompt: `ROLE: You are an AI writing assistant improving technical content.
TASK: Enhance the Recent Changes content for **[TERM]**.
OUTPUT FORMAT: Return only the improved content in the same format.
CONSTRAINTS:
- Maintain accuracy while improving clarity.
- Ensure completeness for Latest updates and modifications.
- Keep within appropriate scope and detail level.
- Address any feedback from evaluation.`
  },

  // Column 243: Planned Updates
  {
    columnId: 'updates_planned_updates',
    generativePrompt: `ROLE: You are an AI/ML expert creating comprehensive glossary content.
TASK: Generate content for **[TERM]** focusing on: Planned Updates.
CONTEXT: Upcoming features and improvements
OUTPUT FORMAT: Provide a markdown unordered list.
CONSTRAINTS:
- Provide moderate detail (1-2 paragraphs or 5-7 bullet points).
- Ensure accuracy and clarity for supplementary level content.
- Focus specifically on the aspect described in the column name.
- Use technical language appropriate for the audience level.`,
    
    evaluativePrompt: `ROLE: You are an AI content reviewer specializing in technical accuracy.
TASK: Evaluate the Planned Updates content for **[TERM]**.
OUTPUT FORMAT: Return JSON with "score" (1-10) and "feedback" string.
CONSTRAINTS:
- Check accuracy and completeness for Upcoming features and improvements.
- Verify appropriate detail level for supplementary content.
- Assess clarity and technical correctness.
- Note any missing key points or inaccuracies.`,
    
    improvementPrompt: `ROLE: You are an AI writing assistant improving technical content.
TASK: Enhance the Planned Updates content for **[TERM]**.
OUTPUT FORMAT: Return only the improved content in the same format.
CONSTRAINTS:
- Maintain accuracy while improving clarity.
- Ensure completeness for Upcoming features and improvements.
- Keep within appropriate scope and detail level.
- Address any feedback from evaluation.`
  },

  // Column 244: Deprecations and Breaking Changes
  {
    columnId: 'updates_deprecations',
    generativePrompt: `ROLE: You are an AI/ML expert creating comprehensive glossary content.
TASK: Generate content for **[TERM]** focusing on: Deprecations and Breaking Changes.
CONTEXT: Deprecated features and breaking changes
OUTPUT FORMAT: Write content in Markdown format.
CONSTRAINTS:
- Provide moderate detail (1-2 paragraphs or 5-7 bullet points).
- Ensure accuracy and clarity for important level content.
- Focus specifically on the aspect described in the column name.
- Use technical language appropriate for the audience level.`,
    
    evaluativePrompt: `ROLE: You are an AI content reviewer specializing in technical accuracy.
TASK: Evaluate the Deprecations and Breaking Changes content for **[TERM]**.
OUTPUT FORMAT: Return JSON with "score" (1-10) and "feedback" string.
CONSTRAINTS:
- Check accuracy and completeness for Deprecated features and breaking changes.
- Verify appropriate detail level for important content.
- Assess clarity and technical correctness.
- Note any missing key points or inaccuracies.`,
    
    improvementPrompt: `ROLE: You are an AI writing assistant improving technical content.
TASK: Enhance the Deprecations and Breaking Changes content for **[TERM]**.
OUTPUT FORMAT: Return only the improved content in the same format.
CONSTRAINTS:
- Maintain accuracy while improving clarity.
- Ensure completeness for Deprecated features and breaking changes.
- Keep within appropriate scope and detail level.
- Address any feedback from evaluation.`
  },

  // Column 245: Interactive Element: Update Notifications
  {
    columnId: 'updates_interactive_tracker',
    generativePrompt: `ROLE: You are an AI/ML expert creating comprehensive glossary content.
TASK: Generate content for **[TERM]** focusing on: Interactive Element: Update Notifications.
CONTEXT: Interactive update tracking and notifications
OUTPUT FORMAT: Provide interactive content specification in markdown format.
CONSTRAINTS:
- Provide moderate detail (1-2 paragraphs or 5-7 bullet points).
- Ensure accuracy and clarity for advanced level content.
- Focus specifically on the aspect described in the column name.
- Use technical language appropriate for the audience level.`,
    
    evaluativePrompt: `ROLE: You are an AI content reviewer specializing in technical accuracy.
TASK: Evaluate the Interactive Element: Update Notifications content for **[TERM]**.
OUTPUT FORMAT: Return JSON with "score" (1-10) and "feedback" string.
CONSTRAINTS:
- Check accuracy and completeness for Interactive update tracking and notifications.
- Verify appropriate detail level for advanced content.
- Assess clarity and technical correctness.
- Note any missing key points or inaccuracies.`,
    
    improvementPrompt: `ROLE: You are an AI writing assistant improving technical content.
TASK: Enhance the Interactive Element: Update Notifications content for **[TERM]**.
OUTPUT FORMAT: Return only the improved content in the same format.
CONSTRAINTS:
- Maintain accuracy while improving clarity.
- Ensure completeness for Interactive update tracking and notifications.
- Keep within appropriate scope and detail level.
- Address any feedback from evaluation.`
  },

  // Column 246: How to Submit Content
  {
    columnId: 'contributions_submit_content',
    generativePrompt: `ROLE: You are an AI/ML expert creating comprehensive glossary content.
TASK: Generate content for **[TERM]** focusing on: How to Submit Content.
CONTEXT: Guidelines for submitting user content
OUTPUT FORMAT: Write content in Markdown format.
CONSTRAINTS:
- Provide moderate detail (1-2 paragraphs or 5-7 bullet points).
- Ensure accuracy and clarity for supplementary level content.
- Focus specifically on the aspect described in the column name.
- Use technical language appropriate for the audience level.`,
    
    evaluativePrompt: `ROLE: You are an AI content reviewer specializing in technical accuracy.
TASK: Evaluate the How to Submit Content content for **[TERM]**.
OUTPUT FORMAT: Return JSON with "score" (1-10) and "feedback" string.
CONSTRAINTS:
- Check accuracy and completeness for Guidelines for submitting user content.
- Verify appropriate detail level for supplementary content.
- Assess clarity and technical correctness.
- Note any missing key points or inaccuracies.`,
    
    improvementPrompt: `ROLE: You are an AI writing assistant improving technical content.
TASK: Enhance the How to Submit Content content for **[TERM]**.
OUTPUT FORMAT: Return only the improved content in the same format.
CONSTRAINTS:
- Maintain accuracy while improving clarity.
- Ensure completeness for Guidelines for submitting user content.
- Keep within appropriate scope and detail level.
- Address any feedback from evaluation.`
  },

  // Column 247: Community Examples
  {
    columnId: 'contributions_community_examples',
    generativePrompt: `ROLE: You are an AI/ML expert creating comprehensive glossary content.
TASK: Generate content for **[TERM]** focusing on: Community Examples.
CONTEXT: Examples contributed by the community
OUTPUT FORMAT: Provide a markdown unordered list.
CONSTRAINTS:
- Provide moderate detail (1-2 paragraphs or 5-7 bullet points).
- Ensure accuracy and clarity for supplementary level content.
- Focus specifically on the aspect described in the column name.
- Use technical language appropriate for the audience level.`,
    
    evaluativePrompt: `ROLE: You are an AI content reviewer specializing in technical accuracy.
TASK: Evaluate the Community Examples content for **[TERM]**.
OUTPUT FORMAT: Return JSON with "score" (1-10) and "feedback" string.
CONSTRAINTS:
- Check accuracy and completeness for Examples contributed by the community.
- Verify appropriate detail level for supplementary content.
- Assess clarity and technical correctness.
- Note any missing key points or inaccuracies.`,
    
    improvementPrompt: `ROLE: You are an AI writing assistant improving technical content.
TASK: Enhance the Community Examples content for **[TERM]**.
OUTPUT FORMAT: Return only the improved content in the same format.
CONSTRAINTS:
- Maintain accuracy while improving clarity.
- Ensure completeness for Examples contributed by the community.
- Keep within appropriate scope and detail level.
- Address any feedback from evaluation.`
  },

  // Column 248: User Feedback and Reviews
  {
    columnId: 'contributions_user_feedback',
    generativePrompt: `ROLE: You are an AI/ML expert creating comprehensive glossary content.
TASK: Generate content for **[TERM]** focusing on: User Feedback and Reviews.
CONTEXT: User reviews and feedback
OUTPUT FORMAT: Provide a markdown unordered list.
CONSTRAINTS:
- Provide moderate detail (1-2 paragraphs or 5-7 bullet points).
- Ensure accuracy and clarity for supplementary level content.
- Focus specifically on the aspect described in the column name.
- Use technical language appropriate for the audience level.`,
    
    evaluativePrompt: `ROLE: You are an AI content reviewer specializing in technical accuracy.
TASK: Evaluate the User Feedback and Reviews content for **[TERM]**.
OUTPUT FORMAT: Return JSON with "score" (1-10) and "feedback" string.
CONSTRAINTS:
- Check accuracy and completeness for User reviews and feedback.
- Verify appropriate detail level for supplementary content.
- Assess clarity and technical correctness.
- Note any missing key points or inaccuracies.`,
    
    improvementPrompt: `ROLE: You are an AI writing assistant improving technical content.
TASK: Enhance the User Feedback and Reviews content for **[TERM]**.
OUTPUT FORMAT: Return only the improved content in the same format.
CONSTRAINTS:
- Maintain accuracy while improving clarity.
- Ensure completeness for User reviews and feedback.
- Keep within appropriate scope and detail level.
- Address any feedback from evaluation.`
  },

  // Column 249: Contributor Guidelines
  {
    columnId: 'contributions_contributor_guidelines',
    generativePrompt: `ROLE: You are an AI/ML expert creating comprehensive glossary content.
TASK: Generate content for **[TERM]** focusing on: Contributor Guidelines.
CONTEXT: Guidelines for contributors
OUTPUT FORMAT: Write content in Markdown format.
CONSTRAINTS:
- Provide moderate detail (1-2 paragraphs or 5-7 bullet points).
- Ensure accuracy and clarity for supplementary level content.
- Focus specifically on the aspect described in the column name.
- Use technical language appropriate for the audience level.`,
    
    evaluativePrompt: `ROLE: You are an AI content reviewer specializing in technical accuracy.
TASK: Evaluate the Contributor Guidelines content for **[TERM]**.
OUTPUT FORMAT: Return JSON with "score" (1-10) and "feedback" string.
CONSTRAINTS:
- Check accuracy and completeness for Guidelines for contributors.
- Verify appropriate detail level for supplementary content.
- Assess clarity and technical correctness.
- Note any missing key points or inaccuracies.`,
    
    improvementPrompt: `ROLE: You are an AI writing assistant improving technical content.
TASK: Enhance the Contributor Guidelines content for **[TERM]**.
OUTPUT FORMAT: Return only the improved content in the same format.
CONSTRAINTS:
- Maintain accuracy while improving clarity.
- Ensure completeness for Guidelines for contributors.
- Keep within appropriate scope and detail level.
- Address any feedback from evaluation.`
  },

  // Column 250: Interactive Element: Contribution Portal
  {
    columnId: 'contributions_interactive_submission',
    generativePrompt: `ROLE: You are an AI/ML expert creating comprehensive glossary content.
TASK: Generate content for **[TERM]** focusing on: Interactive Element: Contribution Portal.
CONTEXT: Interactive contribution submission system
OUTPUT FORMAT: Provide interactive content specification in markdown format.
CONSTRAINTS:
- Provide comprehensive detail with multiple sections.
- Ensure accuracy and clarity for advanced level content.
- Focus specifically on the aspect described in the column name.
- Use technical language appropriate for the audience level.`,
    
    evaluativePrompt: `ROLE: You are an AI content reviewer specializing in technical accuracy.
TASK: Evaluate the Interactive Element: Contribution Portal content for **[TERM]**.
OUTPUT FORMAT: Return JSON with "score" (1-10) and "feedback" string.
CONSTRAINTS:
- Check accuracy and completeness for Interactive contribution submission system.
- Verify appropriate detail level for advanced content.
- Assess clarity and technical correctness.
- Note any missing key points or inaccuracies.`,
    
    improvementPrompt: `ROLE: You are an AI writing assistant improving technical content.
TASK: Enhance the Interactive Element: Contribution Portal content for **[TERM]**.
OUTPUT FORMAT: Return only the improved content in the same format.
CONSTRAINTS:
- Maintain accuracy while improving clarity.
- Ensure completeness for Interactive contribution submission system.
- Keep within appropriate scope and detail level.
- Address any feedback from evaluation.`
  },

  // Column 251: Video Tutorials
  {
    columnId: 'additional_video_tutorials',
    generativePrompt: `ROLE: You are an AI/ML expert creating comprehensive glossary content.
TASK: Generate content for **[TERM]** focusing on: Video Tutorials.
CONTEXT: Video tutorial resources
OUTPUT FORMAT: Provide a markdown unordered list.
CONSTRAINTS:
- Provide moderate detail (1-2 paragraphs or 5-7 bullet points).
- Ensure accuracy and clarity for supplementary level content.
- Focus specifically on the aspect described in the column name.
- Use technical language appropriate for the audience level.`,
    
    evaluativePrompt: `ROLE: You are an AI content reviewer specializing in technical accuracy.
TASK: Evaluate the Video Tutorials content for **[TERM]**.
OUTPUT FORMAT: Return JSON with "score" (1-10) and "feedback" string.
CONSTRAINTS:
- Check accuracy and completeness for Video tutorial resources.
- Verify appropriate detail level for supplementary content.
- Assess clarity and technical correctness.
- Note any missing key points or inaccuracies.`,
    
    improvementPrompt: `ROLE: You are an AI writing assistant improving technical content.
TASK: Enhance the Video Tutorials content for **[TERM]**.
OUTPUT FORMAT: Return only the improved content in the same format.
CONSTRAINTS:
- Maintain accuracy while improving clarity.
- Ensure completeness for Video tutorial resources.
- Keep within appropriate scope and detail level.
- Address any feedback from evaluation.`
  },

  // Column 252: Podcasts and Webinars
  {
    columnId: 'additional_podcasts_webinars',
    generativePrompt: `ROLE: You are an AI/ML expert creating comprehensive glossary content.
TASK: Generate content for **[TERM]** focusing on: Podcasts and Webinars.
CONTEXT: Relevant podcasts and webinars
OUTPUT FORMAT: Provide a markdown unordered list.
CONSTRAINTS:
- Provide moderate detail (1-2 paragraphs or 5-7 bullet points).
- Ensure accuracy and clarity for supplementary level content.
- Focus specifically on the aspect described in the column name.
- Use technical language appropriate for the audience level.`,
    
    evaluativePrompt: `ROLE: You are an AI content reviewer specializing in technical accuracy.
TASK: Evaluate the Podcasts and Webinars content for **[TERM]**.
OUTPUT FORMAT: Return JSON with "score" (1-10) and "feedback" string.
CONSTRAINTS:
- Check accuracy and completeness for Relevant podcasts and webinars.
- Verify appropriate detail level for supplementary content.
- Assess clarity and technical correctness.
- Note any missing key points or inaccuracies.`,
    
    improvementPrompt: `ROLE: You are an AI writing assistant improving technical content.
TASK: Enhance the Podcasts and Webinars content for **[TERM]**.
OUTPUT FORMAT: Return only the improved content in the same format.
CONSTRAINTS:
- Maintain accuracy while improving clarity.
- Ensure completeness for Relevant podcasts and webinars.
- Keep within appropriate scope and detail level.
- Address any feedback from evaluation.`
  },

  // Column 253: Newsletters and Blogs
  {
    columnId: 'additional_newsletters_blogs',
    generativePrompt: `ROLE: You are an AI/ML expert creating comprehensive glossary content.
TASK: Generate content for **[TERM]** focusing on: Newsletters and Blogs.
CONTEXT: Recommended newsletters and blogs
OUTPUT FORMAT: Provide a markdown unordered list.
CONSTRAINTS:
- Keep it concise (2-4 sentences or 3-5 bullet points).
- Ensure accuracy and clarity for supplementary level content.
- Focus specifically on the aspect described in the column name.
- Use technical language appropriate for the audience level.`,
    
    evaluativePrompt: `ROLE: You are an AI content reviewer specializing in technical accuracy.
TASK: Evaluate the Newsletters and Blogs content for **[TERM]**.
OUTPUT FORMAT: Return JSON with "score" (1-10) and "feedback" string.
CONSTRAINTS:
- Check accuracy and completeness for Recommended newsletters and blogs.
- Verify appropriate detail level for supplementary content.
- Assess clarity and technical correctness.
- Note any missing key points or inaccuracies.`,
    
    improvementPrompt: `ROLE: You are an AI writing assistant improving technical content.
TASK: Enhance the Newsletters and Blogs content for **[TERM]**.
OUTPUT FORMAT: Return only the improved content in the same format.
CONSTRAINTS:
- Maintain accuracy while improving clarity.
- Ensure completeness for Recommended newsletters and blogs.
- Keep within appropriate scope and detail level.
- Address any feedback from evaluation.`
  },

  // Column 254: Datasets and Benchmarks
  {
    columnId: 'additional_datasets_benchmarks',
    generativePrompt: `ROLE: You are an AI/ML expert creating comprehensive glossary content.
TASK: Generate content for **[TERM]** focusing on: Datasets and Benchmarks.
CONTEXT: Available datasets and benchmarks
OUTPUT FORMAT: Provide a markdown unordered list.
CONSTRAINTS:
- Provide moderate detail (1-2 paragraphs or 5-7 bullet points).
- Ensure accuracy and clarity for important level content.
- Focus specifically on the aspect described in the column name.
- Use technical language appropriate for the audience level.`,
    
    evaluativePrompt: `ROLE: You are an AI content reviewer specializing in technical accuracy.
TASK: Evaluate the Datasets and Benchmarks content for **[TERM]**.
OUTPUT FORMAT: Return JSON with "score" (1-10) and "feedback" string.
CONSTRAINTS:
- Check accuracy and completeness for Available datasets and benchmarks.
- Verify appropriate detail level for important content.
- Assess clarity and technical correctness.
- Note any missing key points or inaccuracies.`,
    
    improvementPrompt: `ROLE: You are an AI writing assistant improving technical content.
TASK: Enhance the Datasets and Benchmarks content for **[TERM]**.
OUTPUT FORMAT: Return only the improved content in the same format.
CONSTRAINTS:
- Maintain accuracy while improving clarity.
- Ensure completeness for Available datasets and benchmarks.
- Keep within appropriate scope and detail level.
- Address any feedback from evaluation.`
  },

  // Column 255: Competitions and Challenges
  {
    columnId: 'additional_competitions_challenges',
    generativePrompt: `ROLE: You are an AI/ML expert creating comprehensive glossary content.
TASK: Generate content for **[TERM]** focusing on: Competitions and Challenges.
CONTEXT: ML competitions and challenges
OUTPUT FORMAT: Provide a markdown unordered list.
CONSTRAINTS:
- Provide moderate detail (1-2 paragraphs or 5-7 bullet points).
- Ensure accuracy and clarity for supplementary level content.
- Focus specifically on the aspect described in the column name.
- Use technical language appropriate for the audience level.`,
    
    evaluativePrompt: `ROLE: You are an AI content reviewer specializing in technical accuracy.
TASK: Evaluate the Competitions and Challenges content for **[TERM]**.
OUTPUT FORMAT: Return JSON with "score" (1-10) and "feedback" string.
CONSTRAINTS:
- Check accuracy and completeness for ML competitions and challenges.
- Verify appropriate detail level for supplementary content.
- Assess clarity and technical correctness.
- Note any missing key points or inaccuracies.`,
    
    improvementPrompt: `ROLE: You are an AI writing assistant improving technical content.
TASK: Enhance the Competitions and Challenges content for **[TERM]**.
OUTPUT FORMAT: Return only the improved content in the same format.
CONSTRAINTS:
- Maintain accuracy while improving clarity.
- Ensure completeness for ML competitions and challenges.
- Keep within appropriate scope and detail level.
- Address any feedback from evaluation.`
  },

  // Column 256: Mentorship Programs
  {
    columnId: 'additional_mentorship_programs',
    generativePrompt: `ROLE: You are an AI/ML expert creating comprehensive glossary content.
TASK: Generate content for **[TERM]** focusing on: Mentorship Programs.
CONTEXT: Available mentorship opportunities
OUTPUT FORMAT: Provide a markdown unordered list.
CONSTRAINTS:
- Provide moderate detail (1-2 paragraphs or 5-7 bullet points).
- Ensure accuracy and clarity for supplementary level content.
- Focus specifically on the aspect described in the column name.
- Use technical language appropriate for the audience level.`,
    
    evaluativePrompt: `ROLE: You are an AI content reviewer specializing in technical accuracy.
TASK: Evaluate the Mentorship Programs content for **[TERM]**.
OUTPUT FORMAT: Return JSON with "score" (1-10) and "feedback" string.
CONSTRAINTS:
- Check accuracy and completeness for Available mentorship opportunities.
- Verify appropriate detail level for supplementary content.
- Assess clarity and technical correctness.
- Note any missing key points or inaccuracies.`,
    
    improvementPrompt: `ROLE: You are an AI writing assistant improving technical content.
TASK: Enhance the Mentorship Programs content for **[TERM]**.
OUTPUT FORMAT: Return only the improved content in the same format.
CONSTRAINTS:
- Maintain accuracy while improving clarity.
- Ensure completeness for Available mentorship opportunities.
- Keep within appropriate scope and detail level.
- Address any feedback from evaluation.`
  },

  // Column 257: Career Development Resources
  {
    columnId: 'additional_career_resources',
    generativePrompt: `ROLE: You are an AI/ML expert creating comprehensive glossary content.
TASK: Generate content for **[TERM]** focusing on: Career Development Resources.
CONTEXT: Career development and job resources
OUTPUT FORMAT: Write content in Markdown format.
CONSTRAINTS:
- Provide moderate detail (1-2 paragraphs or 5-7 bullet points).
- Ensure accuracy and clarity for supplementary level content.
- Focus specifically on the aspect described in the column name.
- Use technical language appropriate for the audience level.`,
    
    evaluativePrompt: `ROLE: You are an AI content reviewer specializing in technical accuracy.
TASK: Evaluate the Career Development Resources content for **[TERM]**.
OUTPUT FORMAT: Return JSON with "score" (1-10) and "feedback" string.
CONSTRAINTS:
- Check accuracy and completeness for Career development and job resources.
- Verify appropriate detail level for supplementary content.
- Assess clarity and technical correctness.
- Note any missing key points or inaccuracies.`,
    
    improvementPrompt: `ROLE: You are an AI writing assistant improving technical content.
TASK: Enhance the Career Development Resources content for **[TERM]**.
OUTPUT FORMAT: Return only the improved content in the same format.
CONSTRAINTS:
- Maintain accuracy while improving clarity.
- Ensure completeness for Career development and job resources.
- Keep within appropriate scope and detail level.
- Address any feedback from evaluation.`
  },

  // Column 258: Funding and Grants
  {
    columnId: 'additional_funding_grants',
    generativePrompt: `ROLE: You are an AI/ML expert creating comprehensive glossary content.
TASK: Generate content for **[TERM]** focusing on: Funding and Grants.
CONTEXT: Funding opportunities and grants
OUTPUT FORMAT: Provide a markdown unordered list.
CONSTRAINTS:
- Provide moderate detail (1-2 paragraphs or 5-7 bullet points).
- Ensure accuracy and clarity for supplementary level content.
- Focus specifically on the aspect described in the column name.
- Use technical language appropriate for the audience level.`,
    
    evaluativePrompt: `ROLE: You are an AI content reviewer specializing in technical accuracy.
TASK: Evaluate the Funding and Grants content for **[TERM]**.
OUTPUT FORMAT: Return JSON with "score" (1-10) and "feedback" string.
CONSTRAINTS:
- Check accuracy and completeness for Funding opportunities and grants.
- Verify appropriate detail level for supplementary content.
- Assess clarity and technical correctness.
- Note any missing key points or inaccuracies.`,
    
    improvementPrompt: `ROLE: You are an AI writing assistant improving technical content.
TASK: Enhance the Funding and Grants content for **[TERM]**.
OUTPUT FORMAT: Return only the improved content in the same format.
CONSTRAINTS:
- Maintain accuracy while improving clarity.
- Ensure completeness for Funding opportunities and grants.
- Keep within appropriate scope and detail level.
- Address any feedback from evaluation.`
  },

  // Column 259: Collaboration Platforms
  {
    columnId: 'additional_collaboration_platforms',
    generativePrompt: `ROLE: You are an AI/ML expert creating comprehensive glossary content.
TASK: Generate content for **[TERM]** focusing on: Collaboration Platforms.
CONTEXT: Platforms for collaboration and teamwork
OUTPUT FORMAT: Provide a markdown unordered list.
CONSTRAINTS:
- Provide moderate detail (1-2 paragraphs or 5-7 bullet points).
- Ensure accuracy and clarity for supplementary level content.
- Focus specifically on the aspect described in the column name.
- Use technical language appropriate for the audience level.`,
    
    evaluativePrompt: `ROLE: You are an AI content reviewer specializing in technical accuracy.
TASK: Evaluate the Collaboration Platforms content for **[TERM]**.
OUTPUT FORMAT: Return JSON with "score" (1-10) and "feedback" string.
CONSTRAINTS:
- Check accuracy and completeness for Platforms for collaboration and teamwork.
- Verify appropriate detail level for supplementary content.
- Assess clarity and technical correctness.
- Note any missing key points or inaccuracies.`,
    
    improvementPrompt: `ROLE: You are an AI writing assistant improving technical content.
TASK: Enhance the Collaboration Platforms content for **[TERM]**.
OUTPUT FORMAT: Return only the improved content in the same format.
CONSTRAINTS:
- Maintain accuracy while improving clarity.
- Ensure completeness for Platforms for collaboration and teamwork.
- Keep within appropriate scope and detail level.
- Address any feedback from evaluation.`
  },

  // Column 260: Interactive Element: Resource Directory
  {
    columnId: 'additional_interactive_directory',
    generativePrompt: `ROLE: You are an AI/ML expert creating comprehensive glossary content.
TASK: Generate content for **[TERM]** focusing on: Interactive Element: Resource Directory.
CONTEXT: Interactive searchable resource directory
OUTPUT FORMAT: Provide interactive content specification in markdown format.
CONSTRAINTS:
- Provide comprehensive detail with multiple sections.
- Ensure accuracy and clarity for advanced level content.
- Focus specifically on the aspect described in the column name.
- Use technical language appropriate for the audience level.`,
    
    evaluativePrompt: `ROLE: You are an AI content reviewer specializing in technical accuracy.
TASK: Evaluate the Interactive Element: Resource Directory content for **[TERM]**.
OUTPUT FORMAT: Return JSON with "score" (1-10) and "feedback" string.
CONSTRAINTS:
- Check accuracy and completeness for Interactive searchable resource directory.
- Verify appropriate detail level for advanced content.
- Assess clarity and technical correctness.
- Note any missing key points or inaccuracies.`,
    
    improvementPrompt: `ROLE: You are an AI writing assistant improving technical content.
TASK: Enhance the Interactive Element: Resource Directory content for **[TERM]**.
OUTPUT FORMAT: Return only the improved content in the same format.
CONSTRAINTS:
- Maintain accuracy while improving clarity.
- Ensure completeness for Interactive searchable resource directory.
- Keep within appropriate scope and detail level.
- Address any feedback from evaluation.`
  },

  // Column 261: Edge AI and IoT
  {
    columnId: 'special_edge_ai',
    generativePrompt: `ROLE: You are an AI/ML expert creating comprehensive glossary content.
TASK: Generate content for **[TERM]** focusing on: Edge AI and IoT.
CONTEXT: AI at the edge and IoT applications
OUTPUT FORMAT: Write content in Markdown format.
CONSTRAINTS:
- Provide moderate detail (1-2 paragraphs or 5-7 bullet points).
- Ensure accuracy and clarity for advanced level content.
- Focus specifically on the aspect described in the column name.
- Use technical language appropriate for the audience level.`,
    
    evaluativePrompt: `ROLE: You are an AI content reviewer specializing in technical accuracy.
TASK: Evaluate the Edge AI and IoT content for **[TERM]**.
OUTPUT FORMAT: Return JSON with "score" (1-10) and "feedback" string.
CONSTRAINTS:
- Check accuracy and completeness for AI at the edge and IoT applications.
- Verify appropriate detail level for advanced content.
- Assess clarity and technical correctness.
- Note any missing key points or inaccuracies.`,
    
    improvementPrompt: `ROLE: You are an AI writing assistant improving technical content.
TASK: Enhance the Edge AI and IoT content for **[TERM]**.
OUTPUT FORMAT: Return only the improved content in the same format.
CONSTRAINTS:
- Maintain accuracy while improving clarity.
- Ensure completeness for AI at the edge and IoT applications.
- Keep within appropriate scope and detail level.
- Address any feedback from evaluation.`
  },

  // Column 262: Quantum Machine Learning
  {
    columnId: 'special_quantum_ml',
    generativePrompt: `ROLE: You are an AI/ML expert creating comprehensive glossary content.
TASK: Generate content for **[TERM]** focusing on: Quantum Machine Learning.
CONTEXT: Quantum computing in machine learning
OUTPUT FORMAT: Write content in Markdown format.
CONSTRAINTS:
- Provide moderate detail (1-2 paragraphs or 5-7 bullet points).
- Ensure accuracy and clarity for advanced level content.
- Focus specifically on the aspect described in the column name.
- Use technical language appropriate for the audience level.`,
    
    evaluativePrompt: `ROLE: You are an AI content reviewer specializing in technical accuracy.
TASK: Evaluate the Quantum Machine Learning content for **[TERM]**.
OUTPUT FORMAT: Return JSON with "score" (1-10) and "feedback" string.
CONSTRAINTS:
- Check accuracy and completeness for Quantum computing in machine learning.
- Verify appropriate detail level for advanced content.
- Assess clarity and technical correctness.
- Note any missing key points or inaccuracies.`,
    
    improvementPrompt: `ROLE: You are an AI writing assistant improving technical content.
TASK: Enhance the Quantum Machine Learning content for **[TERM]**.
OUTPUT FORMAT: Return only the improved content in the same format.
CONSTRAINTS:
- Maintain accuracy while improving clarity.
- Ensure completeness for Quantum computing in machine learning.
- Keep within appropriate scope and detail level.
- Address any feedback from evaluation.`
  },

  // Column 263: Federated Learning
  {
    columnId: 'special_federated_learning',
    generativePrompt: `ROLE: You are an AI/ML expert creating comprehensive glossary content.
TASK: Generate content for **[TERM]** focusing on: Federated Learning.
CONTEXT: Distributed and privacy-preserving ML
OUTPUT FORMAT: Write content in Markdown format.
CONSTRAINTS:
- Provide moderate detail (1-2 paragraphs or 5-7 bullet points).
- Ensure accuracy and clarity for advanced level content.
- Focus specifically on the aspect described in the column name.
- Use technical language appropriate for the audience level.`,
    
    evaluativePrompt: `ROLE: You are an AI content reviewer specializing in technical accuracy.
TASK: Evaluate the Federated Learning content for **[TERM]**.
OUTPUT FORMAT: Return JSON with "score" (1-10) and "feedback" string.
CONSTRAINTS:
- Check accuracy and completeness for Distributed and privacy-preserving ML.
- Verify appropriate detail level for advanced content.
- Assess clarity and technical correctness.
- Note any missing key points or inaccuracies.`,
    
    improvementPrompt: `ROLE: You are an AI writing assistant improving technical content.
TASK: Enhance the Federated Learning content for **[TERM]**.
OUTPUT FORMAT: Return only the improved content in the same format.
CONSTRAINTS:
- Maintain accuracy while improving clarity.
- Ensure completeness for Distributed and privacy-preserving ML.
- Keep within appropriate scope and detail level.
- Address any feedback from evaluation.`
  },

  // Column 264: Neuromorphic Computing
  {
    columnId: 'special_neuromorphic_computing',
    generativePrompt: `ROLE: You are an AI/ML expert creating comprehensive glossary content.
TASK: Generate content for **[TERM]** focusing on: Neuromorphic Computing.
CONTEXT: Brain-inspired computing architectures
OUTPUT FORMAT: Write content in Markdown format.
CONSTRAINTS:
- Provide moderate detail (1-2 paragraphs or 5-7 bullet points).
- Ensure accuracy and clarity for advanced level content.
- Focus specifically on the aspect described in the column name.
- Use technical language appropriate for the audience level.`,
    
    evaluativePrompt: `ROLE: You are an AI content reviewer specializing in technical accuracy.
TASK: Evaluate the Neuromorphic Computing content for **[TERM]**.
OUTPUT FORMAT: Return JSON with "score" (1-10) and "feedback" string.
CONSTRAINTS:
- Check accuracy and completeness for Brain-inspired computing architectures.
- Verify appropriate detail level for advanced content.
- Assess clarity and technical correctness.
- Note any missing key points or inaccuracies.`,
    
    improvementPrompt: `ROLE: You are an AI writing assistant improving technical content.
TASK: Enhance the Neuromorphic Computing content for **[TERM]**.
OUTPUT FORMAT: Return only the improved content in the same format.
CONSTRAINTS:
- Maintain accuracy while improving clarity.
- Ensure completeness for Brain-inspired computing architectures.
- Keep within appropriate scope and detail level.
- Address any feedback from evaluation.`
  },

  // Column 265: AI and Creativity
  {
    columnId: 'special_ai_creativity',
    generativePrompt: `ROLE: You are an AI/ML expert creating comprehensive glossary content.
TASK: Generate content for **[TERM]** focusing on: AI and Creativity.
CONTEXT: AI in creative applications
OUTPUT FORMAT: Write content in Markdown format.
CONSTRAINTS:
- Provide moderate detail (1-2 paragraphs or 5-7 bullet points).
- Ensure accuracy and clarity for supplementary level content.
- Focus specifically on the aspect described in the column name.
- Use technical language appropriate for the audience level.`,
    
    evaluativePrompt: `ROLE: You are an AI content reviewer specializing in technical accuracy.
TASK: Evaluate the AI and Creativity content for **[TERM]**.
OUTPUT FORMAT: Return JSON with "score" (1-10) and "feedback" string.
CONSTRAINTS:
- Check accuracy and completeness for AI in creative applications.
- Verify appropriate detail level for supplementary content.
- Assess clarity and technical correctness.
- Note any missing key points or inaccuracies.`,
    
    improvementPrompt: `ROLE: You are an AI writing assistant improving technical content.
TASK: Enhance the AI and Creativity content for **[TERM]**.
OUTPUT FORMAT: Return only the improved content in the same format.
CONSTRAINTS:
- Maintain accuracy while improving clarity.
- Ensure completeness for AI in creative applications.
- Keep within appropriate scope and detail level.
- Address any feedback from evaluation.`
  },

  // Column 266: AI in Robotics
  {
    columnId: 'special_ai_robotics',
    generativePrompt: `ROLE: You are an AI/ML expert creating comprehensive glossary content.
TASK: Generate content for **[TERM]** focusing on: AI in Robotics.
CONTEXT: AI applications in robotics
OUTPUT FORMAT: Write content in Markdown format.
CONSTRAINTS:
- Provide moderate detail (1-2 paragraphs or 5-7 bullet points).
- Ensure accuracy and clarity for advanced level content.
- Focus specifically on the aspect described in the column name.
- Use technical language appropriate for the audience level.`,
    
    evaluativePrompt: `ROLE: You are an AI content reviewer specializing in technical accuracy.
TASK: Evaluate the AI in Robotics content for **[TERM]**.
OUTPUT FORMAT: Return JSON with "score" (1-10) and "feedback" string.
CONSTRAINTS:
- Check accuracy and completeness for AI applications in robotics.
- Verify appropriate detail level for advanced content.
- Assess clarity and technical correctness.
- Note any missing key points or inaccuracies.`,
    
    improvementPrompt: `ROLE: You are an AI writing assistant improving technical content.
TASK: Enhance the AI in Robotics content for **[TERM]**.
OUTPUT FORMAT: Return only the improved content in the same format.
CONSTRAINTS:
- Maintain accuracy while improving clarity.
- Ensure completeness for AI applications in robotics.
- Keep within appropriate scope and detail level.
- Address any feedback from evaluation.`
  },

  // Column 267: AI in Healthcare Innovations
  {
    columnId: 'special_ai_healthcare',
    generativePrompt: `ROLE: You are an AI/ML expert creating comprehensive glossary content.
TASK: Generate content for **[TERM]** focusing on: AI in Healthcare Innovations.
CONTEXT: Cutting-edge AI healthcare applications
OUTPUT FORMAT: Write content in Markdown format.
CONSTRAINTS:
- Provide moderate detail (1-2 paragraphs or 5-7 bullet points).
- Ensure accuracy and clarity for important level content.
- Focus specifically on the aspect described in the column name.
- Use technical language appropriate for the audience level.`,
    
    evaluativePrompt: `ROLE: You are an AI content reviewer specializing in technical accuracy.
TASK: Evaluate the AI in Healthcare Innovations content for **[TERM]**.
OUTPUT FORMAT: Return JSON with "score" (1-10) and "feedback" string.
CONSTRAINTS:
- Check accuracy and completeness for Cutting-edge AI healthcare applications.
- Verify appropriate detail level for important content.
- Assess clarity and technical correctness.
- Note any missing key points or inaccuracies.`,
    
    improvementPrompt: `ROLE: You are an AI writing assistant improving technical content.
TASK: Enhance the AI in Healthcare Innovations content for **[TERM]**.
OUTPUT FORMAT: Return only the improved content in the same format.
CONSTRAINTS:
- Maintain accuracy while improving clarity.
- Ensure completeness for Cutting-edge AI healthcare applications.
- Keep within appropriate scope and detail level.
- Address any feedback from evaluation.`
  },

  // Column 268: AI for Climate Change
  {
    columnId: 'special_ai_climate',
    generativePrompt: `ROLE: You are an AI/ML expert creating comprehensive glossary content.
TASK: Generate content for **[TERM]** focusing on: AI for Climate Change.
CONTEXT: AI applications for climate solutions
OUTPUT FORMAT: Write content in Markdown format.
CONSTRAINTS:
- Provide moderate detail (1-2 paragraphs or 5-7 bullet points).
- Ensure accuracy and clarity for supplementary level content.
- Focus specifically on the aspect described in the column name.
- Use technical language appropriate for the audience level.`,
    
    evaluativePrompt: `ROLE: You are an AI content reviewer specializing in technical accuracy.
TASK: Evaluate the AI for Climate Change content for **[TERM]**.
OUTPUT FORMAT: Return JSON with "score" (1-10) and "feedback" string.
CONSTRAINTS:
- Check accuracy and completeness for AI applications for climate solutions.
- Verify appropriate detail level for supplementary content.
- Assess clarity and technical correctness.
- Note any missing key points or inaccuracies.`,
    
    improvementPrompt: `ROLE: You are an AI writing assistant improving technical content.
TASK: Enhance the AI for Climate Change content for **[TERM]**.
OUTPUT FORMAT: Return only the improved content in the same format.
CONSTRAINTS:
- Maintain accuracy while improving clarity.
- Ensure completeness for AI applications for climate solutions.
- Keep within appropriate scope and detail level.
- Address any feedback from evaluation.`
  },

  // Column 269: Interactive Element: Special Topics Explorer
  {
    columnId: 'special_interactive_explorer',
    generativePrompt: `ROLE: You are an AI/ML expert creating comprehensive glossary content.
TASK: Generate content for **[TERM]** focusing on: Interactive Element: Special Topics Explorer.
CONTEXT: Interactive exploration of special topics
OUTPUT FORMAT: Provide interactive content specification in markdown format.
CONSTRAINTS:
- Provide comprehensive detail with multiple sections.
- Ensure accuracy and clarity for advanced level content.
- Focus specifically on the aspect described in the column name.
- Use technical language appropriate for the audience level.`,
    
    evaluativePrompt: `ROLE: You are an AI content reviewer specializing in technical accuracy.
TASK: Evaluate the Interactive Element: Special Topics Explorer content for **[TERM]**.
OUTPUT FORMAT: Return JSON with "score" (1-10) and "feedback" string.
CONSTRAINTS:
- Check accuracy and completeness for Interactive exploration of special topics.
- Verify appropriate detail level for advanced content.
- Assess clarity and technical correctness.
- Note any missing key points or inaccuracies.`,
    
    improvementPrompt: `ROLE: You are an AI writing assistant improving technical content.
TASK: Enhance the Interactive Element: Special Topics Explorer content for **[TERM]**.
OUTPUT FORMAT: Return only the improved content in the same format.
CONSTRAINTS:
- Maintain accuracy while improving clarity.
- Ensure completeness for Interactive exploration of special topics.
- Keep within appropriate scope and detail level.
- Address any feedback from evaluation.`
  },

  // Column 270: Global AI/ML Landscape
  {
    columnId: 'regional_global_overview',
    generativePrompt: `ROLE: You are an AI/ML expert creating comprehensive glossary content.
TASK: Generate content for **[TERM]** focusing on: Global AI/ML Landscape.
CONTEXT: Global perspective on AI/ML development
OUTPUT FORMAT: Write content in Markdown format.
CONSTRAINTS:
- Provide moderate detail (1-2 paragraphs or 5-7 bullet points).
- Ensure accuracy and clarity for supplementary level content.
- Focus specifically on the aspect described in the column name.
- Use technical language appropriate for the audience level.`,
    
    evaluativePrompt: `ROLE: You are an AI content reviewer specializing in technical accuracy.
TASK: Evaluate the Global AI/ML Landscape content for **[TERM]**.
OUTPUT FORMAT: Return JSON with "score" (1-10) and "feedback" string.
CONSTRAINTS:
- Check accuracy and completeness for Global perspective on AI/ML development.
- Verify appropriate detail level for supplementary content.
- Assess clarity and technical correctness.
- Note any missing key points or inaccuracies.`,
    
    improvementPrompt: `ROLE: You are an AI writing assistant improving technical content.
TASK: Enhance the Global AI/ML Landscape content for **[TERM]**.
OUTPUT FORMAT: Return only the improved content in the same format.
CONSTRAINTS:
- Maintain accuracy while improving clarity.
- Ensure completeness for Global perspective on AI/ML development.
- Keep within appropriate scope and detail level.
- Address any feedback from evaluation.`
  },

  // Column 271: Cultural Considerations
  {
    columnId: 'regional_cultural_considerations',
    generativePrompt: `ROLE: You are an AI/ML expert creating comprehensive glossary content.
TASK: Generate content for **[TERM]** focusing on: Cultural Considerations.
CONTEXT: Cultural factors in AI/ML deployment
OUTPUT FORMAT: Write content in Markdown format.
CONSTRAINTS:
- Provide moderate detail (1-2 paragraphs or 5-7 bullet points).
- Ensure accuracy and clarity for supplementary level content.
- Focus specifically on the aspect described in the column name.
- Use technical language appropriate for the audience level.`,
    
    evaluativePrompt: `ROLE: You are an AI content reviewer specializing in technical accuracy.
TASK: Evaluate the Cultural Considerations content for **[TERM]**.
OUTPUT FORMAT: Return JSON with "score" (1-10) and "feedback" string.
CONSTRAINTS:
- Check accuracy and completeness for Cultural factors in AI/ML deployment.
- Verify appropriate detail level for supplementary content.
- Assess clarity and technical correctness.
- Note any missing key points or inaccuracies.`,
    
    improvementPrompt: `ROLE: You are an AI writing assistant improving technical content.
TASK: Enhance the Cultural Considerations content for **[TERM]**.
OUTPUT FORMAT: Return only the improved content in the same format.
CONSTRAINTS:
- Maintain accuracy while improving clarity.
- Ensure completeness for Cultural factors in AI/ML deployment.
- Keep within appropriate scope and detail level.
- Address any feedback from evaluation.`
  },

  // Column 272: Regional Regulatory Differences
  {
    columnId: 'regional_regulatory_differences',
    generativePrompt: `ROLE: You are an AI/ML expert creating comprehensive glossary content.
TASK: Generate content for **[TERM]** focusing on: Regional Regulatory Differences.
CONTEXT: Regulatory variations across regions
OUTPUT FORMAT: Write content in Markdown format.
CONSTRAINTS:
- Provide moderate detail (1-2 paragraphs or 5-7 bullet points).
- Ensure accuracy and clarity for important level content.
- Focus specifically on the aspect described in the column name.
- Use technical language appropriate for the audience level.`,
    
    evaluativePrompt: `ROLE: You are an AI content reviewer specializing in technical accuracy.
TASK: Evaluate the Regional Regulatory Differences content for **[TERM]**.
OUTPUT FORMAT: Return JSON with "score" (1-10) and "feedback" string.
CONSTRAINTS:
- Check accuracy and completeness for Regulatory variations across regions.
- Verify appropriate detail level for important content.
- Assess clarity and technical correctness.
- Note any missing key points or inaccuracies.`,
    
    improvementPrompt: `ROLE: You are an AI writing assistant improving technical content.
TASK: Enhance the Regional Regulatory Differences content for **[TERM]**.
OUTPUT FORMAT: Return only the improved content in the same format.
CONSTRAINTS:
- Maintain accuracy while improving clarity.
- Ensure completeness for Regulatory variations across regions.
- Keep within appropriate scope and detail level.
- Address any feedback from evaluation.`
  },

  // Column 273: Local Innovations and Solutions
  {
    columnId: 'regional_local_innovations',
    generativePrompt: `ROLE: You are an AI/ML expert creating comprehensive glossary content.
TASK: Generate content for **[TERM]** focusing on: Local Innovations and Solutions.
CONTEXT: Region-specific innovations
OUTPUT FORMAT: Write content in Markdown format.
CONSTRAINTS:
- Provide moderate detail (1-2 paragraphs or 5-7 bullet points).
- Ensure accuracy and clarity for supplementary level content.
- Focus specifically on the aspect described in the column name.
- Use technical language appropriate for the audience level.`,
    
    evaluativePrompt: `ROLE: You are an AI content reviewer specializing in technical accuracy.
TASK: Evaluate the Local Innovations and Solutions content for **[TERM]**.
OUTPUT FORMAT: Return JSON with "score" (1-10) and "feedback" string.
CONSTRAINTS:
- Check accuracy and completeness for Region-specific innovations.
- Verify appropriate detail level for supplementary content.
- Assess clarity and technical correctness.
- Note any missing key points or inaccuracies.`,
    
    improvementPrompt: `ROLE: You are an AI writing assistant improving technical content.
TASK: Enhance the Local Innovations and Solutions content for **[TERM]**.
OUTPUT FORMAT: Return only the improved content in the same format.
CONSTRAINTS:
- Maintain accuracy while improving clarity.
- Ensure completeness for Region-specific innovations.
- Keep within appropriate scope and detail level.
- Address any feedback from evaluation.`
  },

  // Column 274: Language and Localization
  {
    columnId: 'regional_language_considerations',
    generativePrompt: `ROLE: You are an AI/ML expert creating comprehensive glossary content.
TASK: Generate content for **[TERM]** focusing on: Language and Localization.
CONTEXT: Language-specific AI/ML considerations
OUTPUT FORMAT: Write content in Markdown format.
CONSTRAINTS:
- Provide moderate detail (1-2 paragraphs or 5-7 bullet points).
- Ensure accuracy and clarity for important level content.
- Focus specifically on the aspect described in the column name.
- Use technical language appropriate for the audience level.`,
    
    evaluativePrompt: `ROLE: You are an AI content reviewer specializing in technical accuracy.
TASK: Evaluate the Language and Localization content for **[TERM]**.
OUTPUT FORMAT: Return JSON with "score" (1-10) and "feedback" string.
CONSTRAINTS:
- Check accuracy and completeness for Language-specific AI/ML considerations.
- Verify appropriate detail level for important content.
- Assess clarity and technical correctness.
- Note any missing key points or inaccuracies.`,
    
    improvementPrompt: `ROLE: You are an AI writing assistant improving technical content.
TASK: Enhance the Language and Localization content for **[TERM]**.
OUTPUT FORMAT: Return only the improved content in the same format.
CONSTRAINTS:
- Maintain accuracy while improving clarity.
- Ensure completeness for Language-specific AI/ML considerations.
- Keep within appropriate scope and detail level.
- Address any feedback from evaluation.`
  },

  // Column 275: Interactive Element: Global AI Map
  {
    columnId: 'regional_interactive_map',
    generativePrompt: `ROLE: You are an AI/ML expert creating comprehensive glossary content.
TASK: Generate content for **[TERM]** focusing on: Interactive Element: Global AI Map.
CONTEXT: Interactive global AI development map
OUTPUT FORMAT: Provide interactive content specification in markdown format.
CONSTRAINTS:
- Provide comprehensive detail with multiple sections.
- Ensure accuracy and clarity for advanced level content.
- Focus specifically on the aspect described in the column name.
- Use technical language appropriate for the audience level.`,
    
    evaluativePrompt: `ROLE: You are an AI content reviewer specializing in technical accuracy.
TASK: Evaluate the Interactive Element: Global AI Map content for **[TERM]**.
OUTPUT FORMAT: Return JSON with "score" (1-10) and "feedback" string.
CONSTRAINTS:
- Check accuracy and completeness for Interactive global AI development map.
- Verify appropriate detail level for advanced content.
- Assess clarity and technical correctness.
- Note any missing key points or inaccuracies.`,
    
    improvementPrompt: `ROLE: You are an AI writing assistant improving technical content.
TASK: Enhance the Interactive Element: Global AI Map content for **[TERM]**.
OUTPUT FORMAT: Return only the improved content in the same format.
CONSTRAINTS:
- Maintain accuracy while improving clarity.
- Ensure completeness for Interactive global AI development map.
- Keep within appropriate scope and detail level.
- Address any feedback from evaluation.`
  },

  // Column 276: Hands-on Labs
  {
    columnId: 'exercises_hands_on_labs',
    generativePrompt: `ROLE: You are an AI/ML expert creating comprehensive glossary content.
TASK: Generate content for **[TERM]** focusing on: Hands-on Labs.
CONTEXT: Practical lab exercises
OUTPUT FORMAT: Provide a markdown unordered list.
CONSTRAINTS:
- Provide moderate detail (1-2 paragraphs or 5-7 bullet points).
- Ensure accuracy and clarity for essential level content.
- Focus specifically on the aspect described in the column name.
- Use technical language appropriate for the audience level.`,
    
    evaluativePrompt: `ROLE: You are an AI content reviewer specializing in technical accuracy.
TASK: Evaluate the Hands-on Labs content for **[TERM]**.
OUTPUT FORMAT: Return JSON with "score" (1-10) and "feedback" string.
CONSTRAINTS:
- Check accuracy and completeness for Practical lab exercises.
- Verify appropriate detail level for essential content.
- Assess clarity and technical correctness.
- Note any missing key points or inaccuracies.`,
    
    improvementPrompt: `ROLE: You are an AI writing assistant improving technical content.
TASK: Enhance the Hands-on Labs content for **[TERM]**.
OUTPUT FORMAT: Return only the improved content in the same format.
CONSTRAINTS:
- Maintain accuracy while improving clarity.
- Ensure completeness for Practical lab exercises.
- Keep within appropriate scope and detail level.
- Address any feedback from evaluation.`
  },

  // Column 277: Coding Challenges
  {
    columnId: 'exercises_coding_challenges',
    generativePrompt: `ROLE: You are an AI/ML expert creating comprehensive glossary content.
TASK: Generate content for **[TERM]** focusing on: Coding Challenges.
CONTEXT: Programming challenges and problems
OUTPUT FORMAT: Provide a markdown unordered list.
CONSTRAINTS:
- Provide moderate detail (1-2 paragraphs or 5-7 bullet points).
- Ensure accuracy and clarity for important level content.
- Focus specifically on the aspect described in the column name.
- Use technical language appropriate for the audience level.`,
    
    evaluativePrompt: `ROLE: You are an AI content reviewer specializing in technical accuracy.
TASK: Evaluate the Coding Challenges content for **[TERM]**.
OUTPUT FORMAT: Return JSON with "score" (1-10) and "feedback" string.
CONSTRAINTS:
- Check accuracy and completeness for Programming challenges and problems.
- Verify appropriate detail level for important content.
- Assess clarity and technical correctness.
- Note any missing key points or inaccuracies.`,
    
    improvementPrompt: `ROLE: You are an AI writing assistant improving technical content.
TASK: Enhance the Coding Challenges content for **[TERM]**.
OUTPUT FORMAT: Return only the improved content in the same format.
CONSTRAINTS:
- Maintain accuracy while improving clarity.
- Ensure completeness for Programming challenges and problems.
- Keep within appropriate scope and detail level.
- Address any feedback from evaluation.`
  },

  // Column 278: Project Ideas
  {
    columnId: 'exercises_project_ideas',
    generativePrompt: `ROLE: You are an AI/ML expert creating comprehensive glossary content.
TASK: Generate content for **[TERM]** focusing on: Project Ideas.
CONTEXT: Ideas for practical projects
OUTPUT FORMAT: Provide a markdown unordered list.
CONSTRAINTS:
- Provide moderate detail (1-2 paragraphs or 5-7 bullet points).
- Ensure accuracy and clarity for supplementary level content.
- Focus specifically on the aspect described in the column name.
- Use technical language appropriate for the audience level.`,
    
    evaluativePrompt: `ROLE: You are an AI content reviewer specializing in technical accuracy.
TASK: Evaluate the Project Ideas content for **[TERM]**.
OUTPUT FORMAT: Return JSON with "score" (1-10) and "feedback" string.
CONSTRAINTS:
- Check accuracy and completeness for Ideas for practical projects.
- Verify appropriate detail level for supplementary content.
- Assess clarity and technical correctness.
- Note any missing key points or inaccuracies.`,
    
    improvementPrompt: `ROLE: You are an AI writing assistant improving technical content.
TASK: Enhance the Project Ideas content for **[TERM]**.
OUTPUT FORMAT: Return only the improved content in the same format.
CONSTRAINTS:
- Maintain accuracy while improving clarity.
- Ensure completeness for Ideas for practical projects.
- Keep within appropriate scope and detail level.
- Address any feedback from evaluation.`
  },

  // Column 279: Solution Walkthroughs
  {
    columnId: 'exercises_solution_walkthroughs',
    generativePrompt: `ROLE: You are an AI/ML expert creating comprehensive glossary content.
TASK: Generate content for **[TERM]** focusing on: Solution Walkthroughs.
CONTEXT: Detailed solution explanations
OUTPUT FORMAT: Write content in Markdown format.
CONSTRAINTS:
- Provide moderate detail (1-2 paragraphs or 5-7 bullet points).
- Ensure accuracy and clarity for important level content.
- Focus specifically on the aspect described in the column name.
- Use technical language appropriate for the audience level.`,
    
    evaluativePrompt: `ROLE: You are an AI content reviewer specializing in technical accuracy.
TASK: Evaluate the Solution Walkthroughs content for **[TERM]**.
OUTPUT FORMAT: Return JSON with "score" (1-10) and "feedback" string.
CONSTRAINTS:
- Check accuracy and completeness for Detailed solution explanations.
- Verify appropriate detail level for important content.
- Assess clarity and technical correctness.
- Note any missing key points or inaccuracies.`,
    
    improvementPrompt: `ROLE: You are an AI writing assistant improving technical content.
TASK: Enhance the Solution Walkthroughs content for **[TERM]**.
OUTPUT FORMAT: Return only the improved content in the same format.
CONSTRAINTS:
- Maintain accuracy while improving clarity.
- Ensure completeness for Detailed solution explanations.
- Keep within appropriate scope and detail level.
- Address any feedback from evaluation.`
  },

  // Column 280: Peer Review Exercises
  {
    columnId: 'exercises_peer_review',
    generativePrompt: `ROLE: You are an AI/ML expert creating comprehensive glossary content.
TASK: Generate content for **[TERM]** focusing on: Peer Review Exercises.
CONTEXT: Collaborative review exercises
OUTPUT FORMAT: Write content in Markdown format.
CONSTRAINTS:
- Provide moderate detail (1-2 paragraphs or 5-7 bullet points).
- Ensure accuracy and clarity for supplementary level content.
- Focus specifically on the aspect described in the column name.
- Use technical language appropriate for the audience level.`,
    
    evaluativePrompt: `ROLE: You are an AI content reviewer specializing in technical accuracy.
TASK: Evaluate the Peer Review Exercises content for **[TERM]**.
OUTPUT FORMAT: Return JSON with "score" (1-10) and "feedback" string.
CONSTRAINTS:
- Check accuracy and completeness for Collaborative review exercises.
- Verify appropriate detail level for supplementary content.
- Assess clarity and technical correctness.
- Note any missing key points or inaccuracies.`,
    
    improvementPrompt: `ROLE: You are an AI writing assistant improving technical content.
TASK: Enhance the Peer Review Exercises content for **[TERM]**.
OUTPUT FORMAT: Return only the improved content in the same format.
CONSTRAINTS:
- Maintain accuracy while improving clarity.
- Ensure completeness for Collaborative review exercises.
- Keep within appropriate scope and detail level.
- Address any feedback from evaluation.`
  },

  // Column 281: Skill Assessments
  {
    columnId: 'exercises_skill_assessments',
    generativePrompt: `ROLE: You are an AI/ML expert creating comprehensive glossary content.
TASK: Generate content for **[TERM]** focusing on: Skill Assessments.
CONTEXT: Skills evaluation exercises
OUTPUT FORMAT: Provide a markdown unordered list.
CONSTRAINTS:
- Provide moderate detail (1-2 paragraphs or 5-7 bullet points).
- Ensure accuracy and clarity for important level content.
- Focus specifically on the aspect described in the column name.
- Use technical language appropriate for the audience level.`,
    
    evaluativePrompt: `ROLE: You are an AI content reviewer specializing in technical accuracy.
TASK: Evaluate the Skill Assessments content for **[TERM]**.
OUTPUT FORMAT: Return JSON with "score" (1-10) and "feedback" string.
CONSTRAINTS:
- Check accuracy and completeness for Skills evaluation exercises.
- Verify appropriate detail level for important content.
- Assess clarity and technical correctness.
- Note any missing key points or inaccuracies.`,
    
    improvementPrompt: `ROLE: You are an AI writing assistant improving technical content.
TASK: Enhance the Skill Assessments content for **[TERM]**.
OUTPUT FORMAT: Return only the improved content in the same format.
CONSTRAINTS:
- Maintain accuracy while improving clarity.
- Ensure completeness for Skills evaluation exercises.
- Keep within appropriate scope and detail level.
- Address any feedback from evaluation.`
  },

  // Column 282: Interactive Element: Virtual Lab
  {
    columnId: 'exercises_interactive_lab',
    generativePrompt: `ROLE: You are an AI/ML expert creating comprehensive glossary content.
TASK: Generate content for **[TERM]** focusing on: Interactive Element: Virtual Lab.
CONTEXT: Interactive virtual lab environment
OUTPUT FORMAT: Provide interactive content specification in markdown format.
CONSTRAINTS:
- Provide comprehensive detail with multiple sections.
- Ensure accuracy and clarity for advanced level content.
- Focus specifically on the aspect described in the column name.
- Use technical language appropriate for the audience level.`,
    
    evaluativePrompt: `ROLE: You are an AI content reviewer specializing in technical accuracy.
TASK: Evaluate the Interactive Element: Virtual Lab content for **[TERM]**.
OUTPUT FORMAT: Return JSON with "score" (1-10) and "feedback" string.
CONSTRAINTS:
- Check accuracy and completeness for Interactive virtual lab environment.
- Verify appropriate detail level for advanced content.
- Assess clarity and technical correctness.
- Note any missing key points or inaccuracies.`,
    
    improvementPrompt: `ROLE: You are an AI writing assistant improving technical content.
TASK: Enhance the Interactive Element: Virtual Lab content for **[TERM]**.
OUTPUT FORMAT: Return only the improved content in the same format.
CONSTRAINTS:
- Maintain accuracy while improving clarity.
- Ensure completeness for Interactive virtual lab environment.
- Keep within appropriate scope and detail level.
- Address any feedback from evaluation.`
  },

  // Column 283: Version Control Best Practices
  {
    columnId: 'collaboration_version_control',
    generativePrompt: `ROLE: You are an AI/ML expert creating comprehensive glossary content.
TASK: Generate content for **[TERM]** focusing on: Version Control Best Practices.
CONTEXT: Git and version control for ML projects
OUTPUT FORMAT: Write content in Markdown format.
CONSTRAINTS:
- Provide moderate detail (1-2 paragraphs or 5-7 bullet points).
- Ensure accuracy and clarity for essential level content.
- Focus specifically on the aspect described in the column name.
- Use technical language appropriate for the audience level.`,
    
    evaluativePrompt: `ROLE: You are an AI content reviewer specializing in technical accuracy.
TASK: Evaluate the Version Control Best Practices content for **[TERM]**.
OUTPUT FORMAT: Return JSON with "score" (1-10) and "feedback" string.
CONSTRAINTS:
- Check accuracy and completeness for Git and version control for ML projects.
- Verify appropriate detail level for essential content.
- Assess clarity and technical correctness.
- Note any missing key points or inaccuracies.`,
    
    improvementPrompt: `ROLE: You are an AI writing assistant improving technical content.
TASK: Enhance the Version Control Best Practices content for **[TERM]**.
OUTPUT FORMAT: Return only the improved content in the same format.
CONSTRAINTS:
- Maintain accuracy while improving clarity.
- Ensure completeness for Git and version control for ML projects.
- Keep within appropriate scope and detail level.
- Address any feedback from evaluation.`
  },

  // Column 284: Team Workflows
  {
    columnId: 'collaboration_team_workflows',
    generativePrompt: `ROLE: You are an AI/ML expert creating comprehensive glossary content.
TASK: Generate content for **[TERM]** focusing on: Team Workflows.
CONTEXT: Effective team collaboration workflows
OUTPUT FORMAT: Write content in Markdown format.
CONSTRAINTS:
- Provide moderate detail (1-2 paragraphs or 5-7 bullet points).
- Ensure accuracy and clarity for important level content.
- Focus specifically on the aspect described in the column name.
- Use technical language appropriate for the audience level.`,
    
    evaluativePrompt: `ROLE: You are an AI content reviewer specializing in technical accuracy.
TASK: Evaluate the Team Workflows content for **[TERM]**.
OUTPUT FORMAT: Return JSON with "score" (1-10) and "feedback" string.
CONSTRAINTS:
- Check accuracy and completeness for Effective team collaboration workflows.
- Verify appropriate detail level for important content.
- Assess clarity and technical correctness.
- Note any missing key points or inaccuracies.`,
    
    improvementPrompt: `ROLE: You are an AI writing assistant improving technical content.
TASK: Enhance the Team Workflows content for **[TERM]**.
OUTPUT FORMAT: Return only the improved content in the same format.
CONSTRAINTS:
- Maintain accuracy while improving clarity.
- Ensure completeness for Effective team collaboration workflows.
- Keep within appropriate scope and detail level.
- Address any feedback from evaluation.`
  },

  // Column 285: Documentation Standards
  {
    columnId: 'collaboration_documentation_standards',
    generativePrompt: `ROLE: You are an AI/ML expert creating comprehensive glossary content.
TASK: Generate content for **[TERM]** focusing on: Documentation Standards.
CONTEXT: Standards for project documentation
OUTPUT FORMAT: Write content in Markdown format.
CONSTRAINTS:
- Provide moderate detail (1-2 paragraphs or 5-7 bullet points).
- Ensure accuracy and clarity for essential level content.
- Focus specifically on the aspect described in the column name.
- Use technical language appropriate for the audience level.`,
    
    evaluativePrompt: `ROLE: You are an AI content reviewer specializing in technical accuracy.
TASK: Evaluate the Documentation Standards content for **[TERM]**.
OUTPUT FORMAT: Return JSON with "score" (1-10) and "feedback" string.
CONSTRAINTS:
- Check accuracy and completeness for Standards for project documentation.
- Verify appropriate detail level for essential content.
- Assess clarity and technical correctness.
- Note any missing key points or inaccuracies.`,
    
    improvementPrompt: `ROLE: You are an AI writing assistant improving technical content.
TASK: Enhance the Documentation Standards content for **[TERM]**.
OUTPUT FORMAT: Return only the improved content in the same format.
CONSTRAINTS:
- Maintain accuracy while improving clarity.
- Ensure completeness for Standards for project documentation.
- Keep within appropriate scope and detail level.
- Address any feedback from evaluation.`
  },

  // Column 286: Code Review Practices
  {
    columnId: 'collaboration_code_review',
    generativePrompt: `ROLE: You are an AI/ML expert creating comprehensive glossary content.
TASK: Generate content for **[TERM]** focusing on: Code Review Practices.
CONTEXT: Best practices for code reviews
OUTPUT FORMAT: Write content in Markdown format.
CONSTRAINTS:
- Provide moderate detail (1-2 paragraphs or 5-7 bullet points).
- Ensure accuracy and clarity for important level content.
- Focus specifically on the aspect described in the column name.
- Use technical language appropriate for the audience level.`,
    
    evaluativePrompt: `ROLE: You are an AI content reviewer specializing in technical accuracy.
TASK: Evaluate the Code Review Practices content for **[TERM]**.
OUTPUT FORMAT: Return JSON with "score" (1-10) and "feedback" string.
CONSTRAINTS:
- Check accuracy and completeness for Best practices for code reviews.
- Verify appropriate detail level for important content.
- Assess clarity and technical correctness.
- Note any missing key points or inaccuracies.`,
    
    improvementPrompt: `ROLE: You are an AI writing assistant improving technical content.
TASK: Enhance the Code Review Practices content for **[TERM]**.
OUTPUT FORMAT: Return only the improved content in the same format.
CONSTRAINTS:
- Maintain accuracy while improving clarity.
- Ensure completeness for Best practices for code reviews.
- Keep within appropriate scope and detail level.
- Address any feedback from evaluation.`
  },

  // Column 287: Interactive Element: Collaborative Workspace
  {
    columnId: 'collaboration_interactive_workspace',
    generativePrompt: `ROLE: You are an AI/ML expert creating comprehensive glossary content.
TASK: Generate content for **[TERM]** focusing on: Interactive Element: Collaborative Workspace.
CONTEXT: Interactive collaborative workspace
OUTPUT FORMAT: Provide interactive content specification in markdown format.
CONSTRAINTS:
- Provide comprehensive detail with multiple sections.
- Ensure accuracy and clarity for advanced level content.
- Focus specifically on the aspect described in the column name.
- Use technical language appropriate for the audience level.`,
    
    evaluativePrompt: `ROLE: You are an AI content reviewer specializing in technical accuracy.
TASK: Evaluate the Interactive Element: Collaborative Workspace content for **[TERM]**.
OUTPUT FORMAT: Return JSON with "score" (1-10) and "feedback" string.
CONSTRAINTS:
- Check accuracy and completeness for Interactive collaborative workspace.
- Verify appropriate detail level for advanced content.
- Assess clarity and technical correctness.
- Note any missing key points or inaccuracies.`,
    
    improvementPrompt: `ROLE: You are an AI writing assistant improving technical content.
TASK: Enhance the Interactive Element: Collaborative Workspace content for **[TERM]**.
OUTPUT FORMAT: Return only the improved content in the same format.
CONSTRAINTS:
- Maintain accuracy while improving clarity.
- Ensure completeness for Interactive collaborative workspace.
- Keep within appropriate scope and detail level.
- Address any feedback from evaluation.`
  },

  // Column 288: Exam Preparation Guides
  {
    columnId: 'certification_exam_preparation',
    generativePrompt: `ROLE: You are an AI/ML expert creating comprehensive glossary content.
TASK: Generate content for **[TERM]** focusing on: Exam Preparation Guides.
CONTEXT: Guides for certification exam preparation
OUTPUT FORMAT: Write content in Markdown format.
CONSTRAINTS:
- Provide moderate detail (1-2 paragraphs or 5-7 bullet points).
- Ensure accuracy and clarity for supplementary level content.
- Focus specifically on the aspect described in the column name.
- Use technical language appropriate for the audience level.`,
    
    evaluativePrompt: `ROLE: You are an AI content reviewer specializing in technical accuracy.
TASK: Evaluate the Exam Preparation Guides content for **[TERM]**.
OUTPUT FORMAT: Return JSON with "score" (1-10) and "feedback" string.
CONSTRAINTS:
- Check accuracy and completeness for Guides for certification exam preparation.
- Verify appropriate detail level for supplementary content.
- Assess clarity and technical correctness.
- Note any missing key points or inaccuracies.`,
    
    improvementPrompt: `ROLE: You are an AI writing assistant improving technical content.
TASK: Enhance the Exam Preparation Guides content for **[TERM]**.
OUTPUT FORMAT: Return only the improved content in the same format.
CONSTRAINTS:
- Maintain accuracy while improving clarity.
- Ensure completeness for Guides for certification exam preparation.
- Keep within appropriate scope and detail level.
- Address any feedback from evaluation.`
  },

  // Column 289: Practice Tests
  {
    columnId: 'certification_practice_tests',
    generativePrompt: `ROLE: You are an AI/ML expert creating comprehensive glossary content.
TASK: Generate content for **[TERM]** focusing on: Practice Tests.
CONTEXT: Practice tests and mock exams
OUTPUT FORMAT: Provide a markdown unordered list.
CONSTRAINTS:
- Provide moderate detail (1-2 paragraphs or 5-7 bullet points).
- Ensure accuracy and clarity for supplementary level content.
- Focus specifically on the aspect described in the column name.
- Use technical language appropriate for the audience level.`,
    
    evaluativePrompt: `ROLE: You are an AI content reviewer specializing in technical accuracy.
TASK: Evaluate the Practice Tests content for **[TERM]**.
OUTPUT FORMAT: Return JSON with "score" (1-10) and "feedback" string.
CONSTRAINTS:
- Check accuracy and completeness for Practice tests and mock exams.
- Verify appropriate detail level for supplementary content.
- Assess clarity and technical correctness.
- Note any missing key points or inaccuracies.`,
    
    improvementPrompt: `ROLE: You are an AI writing assistant improving technical content.
TASK: Enhance the Practice Tests content for **[TERM]**.
OUTPUT FORMAT: Return only the improved content in the same format.
CONSTRAINTS:
- Maintain accuracy while improving clarity.
- Ensure completeness for Practice tests and mock exams.
- Keep within appropriate scope and detail level.
- Address any feedback from evaluation.`
  },

  // Column 290: Study Materials
  {
    columnId: 'certification_study_materials',
    generativePrompt: `ROLE: You are an AI/ML expert creating comprehensive glossary content.
TASK: Generate content for **[TERM]** focusing on: Study Materials.
CONTEXT: Recommended study resources
OUTPUT FORMAT: Provide a markdown unordered list.
CONSTRAINTS:
- Provide moderate detail (1-2 paragraphs or 5-7 bullet points).
- Ensure accuracy and clarity for supplementary level content.
- Focus specifically on the aspect described in the column name.
- Use technical language appropriate for the audience level.`,
    
    evaluativePrompt: `ROLE: You are an AI content reviewer specializing in technical accuracy.
TASK: Evaluate the Study Materials content for **[TERM]**.
OUTPUT FORMAT: Return JSON with "score" (1-10) and "feedback" string.
CONSTRAINTS:
- Check accuracy and completeness for Recommended study resources.
- Verify appropriate detail level for supplementary content.
- Assess clarity and technical correctness.
- Note any missing key points or inaccuracies.`,
    
    improvementPrompt: `ROLE: You are an AI writing assistant improving technical content.
TASK: Enhance the Study Materials content for **[TERM]**.
OUTPUT FORMAT: Return only the improved content in the same format.
CONSTRAINTS:
- Maintain accuracy while improving clarity.
- Ensure completeness for Recommended study resources.
- Keep within appropriate scope and detail level.
- Address any feedback from evaluation.`
  },

  // Column 291: Certification Pathways
  {
    columnId: 'certification_pathways',
    generativePrompt: `ROLE: You are an AI/ML expert creating comprehensive glossary content.
TASK: Generate content for **[TERM]** focusing on: Certification Pathways.
CONTEXT: Different certification paths and options
OUTPUT FORMAT: Write content in Markdown format.
CONSTRAINTS:
- Provide moderate detail (1-2 paragraphs or 5-7 bullet points).
- Ensure accuracy and clarity for supplementary level content.
- Focus specifically on the aspect described in the column name.
- Use technical language appropriate for the audience level.`,
    
    evaluativePrompt: `ROLE: You are an AI content reviewer specializing in technical accuracy.
TASK: Evaluate the Certification Pathways content for **[TERM]**.
OUTPUT FORMAT: Return JSON with "score" (1-10) and "feedback" string.
CONSTRAINTS:
- Check accuracy and completeness for Different certification paths and options.
- Verify appropriate detail level for supplementary content.
- Assess clarity and technical correctness.
- Note any missing key points or inaccuracies.`,
    
    improvementPrompt: `ROLE: You are an AI writing assistant improving technical content.
TASK: Enhance the Certification Pathways content for **[TERM]**.
OUTPUT FORMAT: Return only the improved content in the same format.
CONSTRAINTS:
- Maintain accuracy while improving clarity.
- Ensure completeness for Different certification paths and options.
- Keep within appropriate scope and detail level.
- Address any feedback from evaluation.`
  },

  // Column 292: Success Tips and Strategies
  {
    columnId: 'certification_success_tips',
    generativePrompt: `ROLE: You are an AI/ML expert creating comprehensive glossary content.
TASK: Generate content for **[TERM]** focusing on: Success Tips and Strategies.
CONTEXT: Tips for certification success
OUTPUT FORMAT: Write content in Markdown format.
CONSTRAINTS:
- Provide moderate detail (1-2 paragraphs or 5-7 bullet points).
- Ensure accuracy and clarity for supplementary level content.
- Focus specifically on the aspect described in the column name.
- Use technical language appropriate for the audience level.`,
    
    evaluativePrompt: `ROLE: You are an AI content reviewer specializing in technical accuracy.
TASK: Evaluate the Success Tips and Strategies content for **[TERM]**.
OUTPUT FORMAT: Return JSON with "score" (1-10) and "feedback" string.
CONSTRAINTS:
- Check accuracy and completeness for Tips for certification success.
- Verify appropriate detail level for supplementary content.
- Assess clarity and technical correctness.
- Note any missing key points or inaccuracies.`,
    
    improvementPrompt: `ROLE: You are an AI writing assistant improving technical content.
TASK: Enhance the Success Tips and Strategies content for **[TERM]**.
OUTPUT FORMAT: Return only the improved content in the same format.
CONSTRAINTS:
- Maintain accuracy while improving clarity.
- Ensure completeness for Tips for certification success.
- Keep within appropriate scope and detail level.
- Address any feedback from evaluation.`
  },

  // Column 293: Industry Recognition
  {
    columnId: 'certification_industry_recognition',
    generativePrompt: `ROLE: You are an AI/ML expert creating comprehensive glossary content.
TASK: Generate content for **[TERM]** focusing on: Industry Recognition.
CONTEXT: Industry recognition of certifications
OUTPUT FORMAT: Write content in Markdown format.
CONSTRAINTS:
- Provide moderate detail (1-2 paragraphs or 5-7 bullet points).
- Ensure accuracy and clarity for supplementary level content.
- Focus specifically on the aspect described in the column name.
- Use technical language appropriate for the audience level.`,
    
    evaluativePrompt: `ROLE: You are an AI content reviewer specializing in technical accuracy.
TASK: Evaluate the Industry Recognition content for **[TERM]**.
OUTPUT FORMAT: Return JSON with "score" (1-10) and "feedback" string.
CONSTRAINTS:
- Check accuracy and completeness for Industry recognition of certifications.
- Verify appropriate detail level for supplementary content.
- Assess clarity and technical correctness.
- Note any missing key points or inaccuracies.`,
    
    improvementPrompt: `ROLE: You are an AI writing assistant improving technical content.
TASK: Enhance the Industry Recognition content for **[TERM]**.
OUTPUT FORMAT: Return only the improved content in the same format.
CONSTRAINTS:
- Maintain accuracy while improving clarity.
- Ensure completeness for Industry recognition of certifications.
- Keep within appropriate scope and detail level.
- Address any feedback from evaluation.`
  },

  // Column 294: Interactive Element: Certification Path Planner
  {
    columnId: 'certification_interactive_planner',
    generativePrompt: `ROLE: You are an AI/ML expert creating comprehensive glossary content.
TASK: Generate content for **[TERM]** focusing on: Interactive Element: Certification Path Planner.
CONTEXT: Interactive certification planning tool
OUTPUT FORMAT: Provide interactive content specification in markdown format.
CONSTRAINTS:
- Provide comprehensive detail with multiple sections.
- Ensure accuracy and clarity for advanced level content.
- Focus specifically on the aspect described in the column name.
- Use technical language appropriate for the audience level.`,
    
    evaluativePrompt: `ROLE: You are an AI content reviewer specializing in technical accuracy.
TASK: Evaluate the Interactive Element: Certification Path Planner content for **[TERM]**.
OUTPUT FORMAT: Return JSON with "score" (1-10) and "feedback" string.
CONSTRAINTS:
- Check accuracy and completeness for Interactive certification planning tool.
- Verify appropriate detail level for advanced content.
- Assess clarity and technical correctness.
- Note any missing key points or inaccuracies.`,
    
    improvementPrompt: `ROLE: You are an AI writing assistant improving technical content.
TASK: Enhance the Interactive Element: Certification Path Planner content for **[TERM]**.
OUTPUT FORMAT: Return only the improved content in the same format.
CONSTRAINTS:
- Maintain accuracy while improving clarity.
- Ensure completeness for Interactive certification planning tool.
- Keep within appropriate scope and detail level.
- Address any feedback from evaluation.`
  },

  // Column 295: Complete Glossary Reference
  {
    columnId: 'ai_ml_glossary_complete',
    generativePrompt: `ROLE: You are an AI/ML expert creating comprehensive glossary content.
TASK: Generate content for **[TERM]** focusing on: Complete Glossary Reference.
CONTEXT: Complete glossary reference with all terms and cross-references
OUTPUT FORMAT: Write content in Markdown format.
CONSTRAINTS:
- Provide comprehensive detail with multiple sections.
- Ensure accuracy and clarity for supplementary level content.
- Focus specifically on the aspect described in the column name.
- Use technical language appropriate for the audience level.`,
    
    evaluativePrompt: `ROLE: You are an AI content reviewer specializing in technical accuracy.
TASK: Evaluate the Complete Glossary Reference content for **[TERM]**.
OUTPUT FORMAT: Return JSON with "score" (1-10) and "feedback" string.
CONSTRAINTS:
- Check accuracy and completeness for Complete glossary reference with all terms and cross-references.
- Verify appropriate detail level for supplementary content.
- Assess clarity and technical correctness.
- Note any missing key points or inaccuracies.`,
    
    improvementPrompt: `ROLE: You are an AI writing assistant improving technical content.
TASK: Enhance the Complete Glossary Reference content for **[TERM]**.
OUTPUT FORMAT: Return only the improved content in the same format.
CONSTRAINTS:
- Maintain accuracy while improving clarity.
- Ensure completeness for Complete glossary reference with all terms and cross-references.
- Keep within appropriate scope and detail level.
- Address any feedback from evaluation.`
  },

  // Column 296: Complete Implementation Reference
  {
    columnId: 'final_completion_marker',
    generativePrompt: `ROLE: You are an AI glossary completion assistant.
TASK: Generate a final completion marker for the term **[TERM]** indicating the full 296-column glossary implementation is complete.
OUTPUT FORMAT: Return a brief completion message in plain text.
CONSTRAINTS:
- Keep it very concise (1-2 sentences).
- Indicate that the comprehensive 296-column analysis is complete.
- Maintain a professional and conclusive tone.`,
    
    evaluativePrompt: `ROLE: You are an AI content reviewer assessing completion markers.
TASK: Evaluate the completion marker for **[TERM]**.
OUTPUT FORMAT: Return JSON with "score" (1-10) and "feedback" string.
CONSTRAINTS:
- Check if the message clearly indicates completion.
- Verify appropriate tone and brevity.
- Assess clarity and professionalism.`,
    
    improvementPrompt: `ROLE: You are an AI writing assistant improving completion messages.
TASK: Enhance the completion marker for **[TERM]**.
OUTPUT FORMAT: Return only the improved completion message.
CONSTRAINTS:
- Maintain brevity and clarity.
- Ensure it appropriately concludes the comprehensive analysis.
- Keep professional tone.`
  }
];

// Helper function to get prompt triplet by column ID
export function getPromptTripletByColumnId(columnId: string): PromptTriplet | undefined {
  return ALL_296_PROMPT_TRIPLETS.find(triplet => triplet.columnId === columnId);
}

// Helper function to validate all columns have prompt triplets
export function validatePromptCompleteness(columnIds: string[]): {
  complete: boolean;
  missing: string[];
} {
  const promptColumnIds = new Set(ALL_296_PROMPT_TRIPLETS.map(t => t.columnId));
  const missing = columnIds.filter(id => !promptColumnIds.has(id));
  
  return {
    complete: missing.length === 0,
    missing
  };
}
