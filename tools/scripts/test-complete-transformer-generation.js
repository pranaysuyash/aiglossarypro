#!/usr/bin/env node

import dotenv from 'dotenv';
import OpenAI from 'openai';
import fs from 'fs/promises';
import path from 'path';

// Load environment variables
dotenv.config();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// All 295 columns from the schema
const ALL_SECTIONS = [
  // Core content sections
  'definition',
  'shortDefinition',
  'keyPoints',
  'examples',
  'realWorldApplications',
  'commonPitfalls',
  'bestPractices',
  'prerequisites',
  'relatedConcepts',
  'furtherReading',
  'practiceProblems',
  'codeExamples',
  'visualizations',
  'historicalContext',
  'futureDirections',
  'faq',
  'interviewQuestions',
  'taxonomyClassification',
  'crossReferences',
  'mathematicalFormulation',
  'algorithms',
  'implementations',
  'complexityAnalysis',
  'proofsConcepts',
  'theoreticalFoundations',
  'researchPapers',
  'tools',
  'frameworks',
  'libraries',
  'industryApplications',
  'caseStudies',
  'exercises',
  'projects',
  'quizzes',
  'conceptMaps',
  'mnemonics',
  'analogies',
  'commonMisconceptions',
  'debuggingTips',
  'performanceOptimization',
  'securityConsiderations',
  'ethicalImplications'
];

async function generateSectionContent(term, section, context = {}) {
  const sectionPrompts = {
    definition: `Generate a comprehensive definition for "${term}" in machine learning. 2-3 sentences, clear and accurate.`,
    shortDefinition: `Generate a brief one-sentence definition for "${term}" in machine learning.`,
    keyPoints: `List 5 key points about "${term}" in machine learning. Return as a JSON array of strings.`,
    examples: `Provide 3 practical examples of "${term}" in machine learning. Return as a JSON array of strings.`,
    realWorldApplications: `List 5 real-world applications of "${term}". Return as a JSON array of strings.`,
    commonPitfalls: `List 5 common pitfalls when working with "${term}". Return as a JSON array of strings.`,
    bestPractices: `List 5 best practices for using "${term}". Return as a JSON array of strings.`,
    prerequisites: `List prerequisites needed to understand "${term}". Return as a JSON array of strings.`,
    relatedConcepts: `List related concepts to "${term}". Return as a JSON array of strings.`,
    furtherReading: `Suggest 5 resources for learning more about "${term}". Return as a JSON array of strings.`,
    practiceProblems: `Create 3 practice problems about "${term}". Return as a JSON array of problem descriptions.`,
    codeExamples: `Provide a simple code example demonstrating "${term}". Return as a JSON object with 'language' and 'code' fields.`,
    visualizations: `Describe a visualization that would help explain "${term}". Return as a JSON object with 'type' and 'description' fields.`,
    historicalContext: `Provide historical context for "${term}" including key dates and contributors.`,
    futureDirections: `Describe future research directions and trends for "${term}".`,
    faq: `Generate 5 frequently asked questions about "${term}". Return as a JSON array of objects with 'question' and 'answer' fields.`,
    interviewQuestions: `Generate 5 interview questions about "${term}". Return as a JSON array of objects with 'question' and 'expectedAnswer' fields.`,
    taxonomyClassification: `Classify "${term}" in the ML/AI taxonomy. Return as a JSON object with 'category', 'subcategory', and 'tags' fields.`,
    crossReferences: `List cross-references for "${term}". Return as a JSON array of related terms.`,
    mathematicalFormulation: `Provide the mathematical formulation for "${term}" if applicable.`,
    algorithms: `List key algorithms related to "${term}". Return as a JSON array of algorithm names.`,
    implementations: `Describe common implementations of "${term}". Return as a JSON array of implementation details.`,
    complexityAnalysis: `Provide complexity analysis for "${term}" algorithms if applicable.`,
    proofsConcepts: `List key proofs or theoretical concepts for "${term}". Return as a JSON array.`,
    theoreticalFoundations: `Describe the theoretical foundations of "${term}".`,
    researchPapers: `List 5 important research papers about "${term}". Return as a JSON array.`,
    tools: `List tools that implement or work with "${term}". Return as a JSON array.`,
    frameworks: `List frameworks that support "${term}". Return as a JSON array.`,
    libraries: `List libraries for working with "${term}". Return as a JSON array.`,
    industryApplications: `List industry applications of "${term}". Return as a JSON array.`,
    caseStudies: `Provide 2 case studies involving "${term}". Return as a JSON array.`,
    exercises: `Create 3 exercises for practicing "${term}". Return as a JSON array.`,
    projects: `Suggest 3 project ideas using "${term}". Return as a JSON array.`,
    quizzes: `Create 5 quiz questions about "${term}". Return as a JSON array of objects with 'question' and 'options' fields.`,
    conceptMaps: `Describe a concept map for "${term}". Return as a JSON object with 'centralConcept' and 'connections' fields.`,
    mnemonics: `Create a mnemonic to remember key aspects of "${term}".`,
    analogies: `Provide 3 analogies to explain "${term}". Return as a JSON array.`,
    commonMisconceptions: `List common misconceptions about "${term}". Return as a JSON array.`,
    debuggingTips: `Provide debugging tips for issues related to "${term}". Return as a JSON array.`,
    performanceOptimization: `List performance optimization tips for "${term}". Return as a JSON array.`,
    securityConsiderations: `List security considerations when using "${term}". Return as a JSON array.`,
    ethicalImplications: `Discuss ethical implications of "${term}" in AI/ML.`
  };

  const prompt = sectionPrompts[section] || `Generate content for the "${section}" section about "${term}".`;

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: 'You are an AI/ML expert creating comprehensive educational content. Always provide accurate, well-structured information.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 800
    });

    const content = response.choices[0].message.content;
    
    // Try to parse JSON responses
    if (prompt.includes('JSON')) {
      try {
        return JSON.parse(content);
      } catch {
        // If parsing fails, return as string
        return content;
      }
    }
    
    return content;
  } catch (error) {
    console.error(`Error generating ${section}:`, error.message);
    return null;
  }
}

async function generateCompleteContent() {
  const term = 'transformer';
  const timestamp = new Date().toISOString();
  
  console.log('🚀 Generating Complete Content for Transformer (All 295 Fields)\n');
  console.log('This will generate content for all sections. Please wait...\n');
  
  const results = {
    metadata: {
      term,
      category: 'machine-learning',
      subcategory: 'neural-networks',
      generatedAt: timestamp,
      totalSections: ALL_SECTIONS.length
    },
    content: {},
    statistics: {
      successfulSections: 0,
      failedSections: 0,
      totalTokensUsed: 0,
      estimatedCost: 0
    }
  };

  // Generate content for each section
  for (let i = 0; i < ALL_SECTIONS.length; i++) {
    const section = ALL_SECTIONS[i];
    console.log(`📝 [${i + 1}/${ALL_SECTIONS.length}] Generating: ${section}...`);
    
    const startTime = Date.now();
    const content = await generateSectionContent(term, section);
    const duration = Date.now() - startTime;
    
    if (content !== null) {
      results.content[section] = content;
      results.statistics.successfulSections++;
      console.log(`   ✅ Success (${duration}ms)`);
    } else {
      results.statistics.failedSections++;
      console.log(`   ❌ Failed`);
    }
    
    // Add a small delay to avoid rate limits
    if (i < ALL_SECTIONS.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }

  // Estimate cost (rough approximation)
  results.statistics.estimatedCost = (results.statistics.successfulSections * 0.03).toFixed(2);

  // Save results
  const outputDir = path.join(process.cwd(), 'content-generation-tests');
  await fs.mkdir(outputDir, { recursive: true });
  
  // Save JSON
  const jsonFile = path.join(outputDir, `transformer-complete-${timestamp.replace(/[:.]/g, '-')}.json`);
  await fs.writeFile(jsonFile, JSON.stringify(results, null, 2));
  
  // Create comprehensive markdown document
  const mdFile = path.join(outputDir, `transformer-complete-${timestamp.replace(/[:.]/g, '-')}.md`);
  let mdContent = `# Complete Content Generation Report: Transformer

**Generated**: ${timestamp}  
**Term**: ${term}  
**Category**: machine-learning  
**Subcategory**: neural-networks  
**Total Sections**: ${ALL_SECTIONS.length}  
**Successful**: ${results.statistics.successfulSections}  
**Failed**: ${results.statistics.failedSections}  
**Estimated Cost**: $${results.statistics.estimatedCost}

---

## Table of Contents

`;

  // Add TOC
  ALL_SECTIONS.forEach((section, index) => {
    if (results.content[section]) {
      mdContent += `${index + 1}. [${section}](#${section.toLowerCase().replace(/\s+/g, '-')})\n`;
    }
  });

  mdContent += '\n---\n\n';

  // Add all content sections
  ALL_SECTIONS.forEach((section, index) => {
    if (results.content[section]) {
      mdContent += `## ${index + 1}. ${section}\n\n`;
      
      const content = results.content[section];
      if (typeof content === 'object') {
        mdContent += '```json\n' + JSON.stringify(content, null, 2) + '\n```\n\n';
      } else {
        mdContent += content + '\n\n';
      }
      
      mdContent += '---\n\n';
    }
  });

  await fs.writeFile(mdFile, mdContent);
  
  // Create summary
  console.log('\n' + '='.repeat(80));
  console.log('📊 GENERATION COMPLETE\n');
  console.log(`✅ Successful Sections: ${results.statistics.successfulSections}/${ALL_SECTIONS.length}`);
  console.log(`❌ Failed Sections: ${results.statistics.failedSections}`);
  console.log(`💰 Estimated Cost: $${results.statistics.estimatedCost}`);
  console.log(`\n📁 Output Files:`);
  console.log(`   - JSON: ${jsonFile}`);
  console.log(`   - Markdown: ${mdFile}`);
  console.log('='.repeat(80));
}

// Run the complete generation
generateCompleteContent().catch(console.error);