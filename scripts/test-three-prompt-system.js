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

async function generateContent(term, category, subcategory) {
  const prompt = `Generate a comprehensive definition for "${term}" in the context of ${category} - ${subcategory}.

Requirements:
- Clear and concise definition (2-3 sentences)
- Explain the core concept
- Mention why it's important in the field
- Use language suitable for both beginners and advanced learners

Provide ONLY the definition text, no additional formatting.`;

  const response = await openai.chat.completions.create({
    model: 'gpt-4',
    messages: [
      {
        role: 'system',
        content: 'You are an AI/ML expert creating educational content. Be accurate, clear, and comprehensive.'
      },
      {
        role: 'user',
        content: prompt
      }
    ],
    temperature: 0.7,
    max_tokens: 300
  });

  return response.choices[0].message.content;
}

async function evaluateContent(content, term) {
  const prompt = `Evaluate the following definition for "${term}" and provide a quality score and detailed feedback:

Definition:
${content}

Evaluation Criteria:
1. Accuracy (0-10): Is the information correct and up-to-date?
2. Clarity (0-10): Is it easy to understand for beginners?
3. Completeness (0-10): Does it cover all essential aspects?
4. Conciseness (0-10): Is it appropriately brief without losing important information?
5. Relevance (0-10): Is it relevant to the field and practical applications?

Provide your evaluation in the following JSON format:
{
  "scores": {
    "accuracy": 0,
    "clarity": 0,
    "completeness": 0,
    "conciseness": 0,
    "relevance": 0,
    "overall": 0
  },
  "strengths": ["strength1", "strength2"],
  "weaknesses": ["weakness1", "weakness2"],
  "suggestions": ["suggestion1", "suggestion2"]
}`;

  const response = await openai.chat.completions.create({
    model: 'gpt-4',
    messages: [
      {
        role: 'system',
        content: 'You are an expert content evaluator for educational materials. Provide constructive feedback.'
      },
      {
        role: 'user',
        content: prompt
      }
    ],
    temperature: 0.3,
    max_tokens: 500
  });

  return JSON.parse(response.choices[0].message.content);
}

async function improveContent(originalContent, evaluation, term) {
  const prompt = `Improve the following definition for "${term}" based on the evaluation feedback:

Original Definition:
${originalContent}

Evaluation Feedback:
- Strengths: ${evaluation.strengths.join(', ')}
- Weaknesses: ${evaluation.weaknesses.join(', ')}
- Suggestions: ${evaluation.suggestions.join(', ')}

Create an improved version that:
1. Maintains all the strengths
2. Addresses all the weaknesses
3. Implements the suggestions
4. Keeps the same format (2-3 sentences)

Provide ONLY the improved definition text.`;

  const response = await openai.chat.completions.create({
    model: 'gpt-4',
    messages: [
      {
        role: 'system',
        content: 'You are an expert content improver. Create enhanced versions while maintaining clarity.'
      },
      {
        role: 'user',
        content: prompt
      }
    ],
    temperature: 0.5,
    max_tokens: 300
  });

  return response.choices[0].message.content;
}

async function testThreePromptSystem() {
  const term = 'transformer';
  const category = 'machine-learning';
  const subcategory = 'neural-networks';
  
  console.log('🚀 Testing Three-Prompt Content Generation System\n');
  console.log(`📚 Term: ${term}`);
  console.log(`📁 Category: ${category}`);
  console.log(`📂 Subcategory: ${subcategory}\n`);
  console.log('='.repeat(80));

  try {
    // Step 1: Generate
    console.log('\n📝 STEP 1: GENERATING INITIAL CONTENT...\n');
    const startGen = Date.now();
    const generatedContent = await generateContent(term, category, subcategory);
    const genTime = Date.now() - startGen;
    
    console.log('Generated Definition:');
    console.log('-'.repeat(80));
    console.log(generatedContent);
    console.log('-'.repeat(80));
    console.log(`⏱️  Generation Time: ${genTime}ms\n`);

    // Step 2: Evaluate
    console.log('\n🔍 STEP 2: EVALUATING CONTENT QUALITY...\n');
    const startEval = Date.now();
    const evaluation = await evaluateContent(generatedContent, term);
    const evalTime = Date.now() - startEval;
    
    console.log('Evaluation Results:');
    console.log('-'.repeat(80));
    console.log('📊 Quality Scores:');
    Object.entries(evaluation.scores).forEach(([metric, score]) => {
      const bar = '█'.repeat(score) + '░'.repeat(10 - score);
      console.log(`  ${metric.padEnd(12)}: ${bar} ${score}/10`);
    });
    
    console.log('\n💪 Strengths:');
    evaluation.strengths.forEach((s, i) => console.log(`  ${i + 1}. ${s}`));
    
    console.log('\n⚠️  Weaknesses:');
    evaluation.weaknesses.forEach((w, i) => console.log(`  ${i + 1}. ${w}`));
    
    console.log('\n💡 Suggestions:');
    evaluation.suggestions.forEach((s, i) => console.log(`  ${i + 1}. ${s}`));
    console.log('-'.repeat(80));
    console.log(`⏱️  Evaluation Time: ${evalTime}ms\n`);

    // Step 3: Improve
    console.log('\n✨ STEP 3: IMPROVING BASED ON FEEDBACK...\n');
    const startImprove = Date.now();
    const improvedContent = await improveContent(generatedContent, evaluation, term);
    const improveTime = Date.now() - startImprove;
    
    console.log('Improved Definition:');
    console.log('-'.repeat(80));
    console.log(improvedContent);
    console.log('-'.repeat(80));
    console.log(`⏱️  Improvement Time: ${improveTime}ms\n`);

    // Re-evaluate improved content
    console.log('\n🔄 STEP 4: RE-EVALUATING IMPROVED CONTENT...\n');
    const startReEval = Date.now();
    const reEvaluation = await evaluateContent(improvedContent, term);
    const reEvalTime = Date.now() - startReEval;
    
    console.log('Re-evaluation Results:');
    console.log('-'.repeat(80));
    console.log('📊 Quality Scores Comparison:');
    console.log('  Metric        | Original | Improved | Change');
    console.log('  ' + '-'.repeat(45));
    Object.entries(evaluation.scores).forEach(([metric, originalScore]) => {
      const improvedScore = reEvaluation.scores[metric];
      const change = improvedScore - originalScore;
      const changeStr = change > 0 ? `+${change}` : `${change}`;
      const emoji = change > 0 ? '📈' : change < 0 ? '📉' : '➡️';
      console.log(`  ${metric.padEnd(12)} | ${originalScore.toString().padStart(8)} | ${improvedScore.toString().padStart(8)} | ${changeStr.padStart(6)} ${emoji}`);
    });
    console.log('-'.repeat(80));
    console.log(`⏱️  Re-evaluation Time: ${reEvalTime}ms\n`);

    // Summary
    console.log('\n📊 PROCESS SUMMARY\n');
    console.log('='.repeat(80));
    console.log(`Total Processing Time: ${genTime + evalTime + improveTime + reEvalTime}ms`);
    console.log(`Quality Improvement: ${reEvaluation.scores.overall - evaluation.scores.overall} points`);
    console.log('='.repeat(80));

    // Save to file
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const outputDir = path.join(process.cwd(), 'content-generation-tests');
    await fs.mkdir(outputDir, { recursive: true });
    
    const outputFile = path.join(outputDir, `transformer-test-${timestamp}.json`);
    const fullOutput = {
      metadata: {
        term,
        category,
        subcategory,
        timestamp: new Date().toISOString(),
        processingTime: {
          generation: genTime,
          evaluation: evalTime,
          improvement: improveTime,
          reEvaluation: reEvalTime,
          total: genTime + evalTime + improveTime + reEvalTime
        }
      },
      content: {
        original: generatedContent,
        improved: improvedContent
      },
      evaluations: {
        original: evaluation,
        improved: reEvaluation
      },
      qualityImprovement: {
        overall: reEvaluation.scores.overall - evaluation.scores.overall,
        byMetric: Object.fromEntries(
          Object.entries(evaluation.scores).map(([metric, originalScore]) => [
            metric,
            reEvaluation.scores[metric] - originalScore
          ])
        )
      }
    };

    await fs.writeFile(outputFile, JSON.stringify(fullOutput, null, 2));
    console.log(`\n💾 Full output saved to: ${outputFile}`);

    // Create markdown report
    const mdFile = path.join(outputDir, `transformer-test-${timestamp}.md`);
    const mdContent = `# Content Generation Test Report: Transformer

**Date**: ${new Date().toISOString()}  
**Term**: ${term}  
**Category**: ${category}  
**Subcategory**: ${subcategory}

## Process Overview

The three-prompt content generation system consists of:
1. **Generate**: Create initial content
2. **Evaluate**: Assess quality and identify improvements
3. **Improve**: Enhance based on feedback

## Generated Content

### Original Definition
${generatedContent}

### Evaluation Results
- **Overall Score**: ${evaluation.scores.overall}/10
- **Strengths**: ${evaluation.strengths.join(', ')}
- **Weaknesses**: ${evaluation.weaknesses.join(', ')}
- **Suggestions**: ${evaluation.suggestions.join(', ')}

### Improved Definition
${improvedContent}

### Quality Improvement
- **Original Overall Score**: ${evaluation.scores.overall}/10
- **Improved Overall Score**: ${reEvaluation.scores.overall}/10
- **Improvement**: +${reEvaluation.scores.overall - evaluation.scores.overall} points

## Detailed Metrics

| Metric | Original | Improved | Change |
|--------|----------|----------|---------|
${Object.entries(evaluation.scores).map(([metric, originalScore]) => {
  const improvedScore = reEvaluation.scores[metric];
  const change = improvedScore - originalScore;
  return `| ${metric} | ${originalScore}/10 | ${improvedScore}/10 | ${change > 0 ? '+' : ''}${change} |`;
}).join('\n')}

## Processing Times
- Generation: ${genTime}ms
- Evaluation: ${evalTime}ms
- Improvement: ${improveTime}ms
- Re-evaluation: ${reEvalTime}ms
- **Total**: ${genTime + evalTime + improveTime + reEvalTime}ms

## Conclusion
The three-prompt system successfully improved the content quality by ${reEvaluation.scores.overall - evaluation.scores.overall} points overall.
`;

    await fs.writeFile(mdFile, mdContent);
    console.log(`📄 Markdown report saved to: ${mdFile}\n`);

  } catch (error) {
    console.error('❌ Error in three-prompt system:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
    }
    process.exit(1);
  }
}

// Run the test
testThreePromptSystem();