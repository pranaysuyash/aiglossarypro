#!/usr/bin/env node

import dotenv from 'dotenv';
import OpenAI from 'openai';

// Load environment variables
dotenv.config();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

async function generateTransformerContent() {
  console.log('🤖 Testing AI Content Generation for "Transformer"...\n');

  try {
    const prompt = `Generate comprehensive educational content about "Transformer" in the context of machine learning and neural networks.

Please provide:
1. A clear, concise definition (2-3 sentences)
2. Key points (3-5 bullet points)
3. Real-world examples (2-3 examples)
4. Common use cases
5. Best practices when using transformers

Format the response as JSON with the following structure:
{
  "definition": "...",
  "keyPoints": ["...", "..."],
  "examples": ["...", "..."],
  "useCases": ["...", "..."],
  "bestPractices": ["...", "..."]
}`;

    console.log('📝 Sending request to OpenAI...\n');

    const response = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: 'You are an AI/ML expert creating educational content for a glossary. Provide accurate, clear, and comprehensive information suitable for learners at various levels.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 1500
    });

    const content = JSON.parse(response.choices[0].message.content);

    console.log('✅ Content Generated Successfully!\n');
    console.log('=====================================\n');
    
    console.log('📖 Definition:');
    console.log(content.definition);
    console.log();

    if (content.keyPoints && content.keyPoints.length > 0) {
      console.log('🔑 Key Points:');
      content.keyPoints.forEach((point, index) => {
        console.log(`${index + 1}. ${point}`);
      });
      console.log();
    }

    if (content.examples && content.examples.length > 0) {
      console.log('💡 Examples:');
      content.examples.forEach((example, index) => {
        console.log(`${index + 1}. ${example}`);
      });
      console.log();
    }

    if (content.useCases && content.useCases.length > 0) {
      console.log('🎯 Use Cases:');
      content.useCases.forEach((useCase, index) => {
        console.log(`${index + 1}. ${useCase}`);
      });
      console.log();
    }

    if (content.bestPractices && content.bestPractices.length > 0) {
      console.log('✨ Best Practices:');
      content.bestPractices.forEach((practice, index) => {
        console.log(`${index + 1}. ${practice}`);
      });
      console.log();
    }

    // Show usage statistics
    console.log('📊 Generation Statistics:');
    console.log(`- Model: ${response.model}`);
    console.log(`- Prompt Tokens: ${response.usage.prompt_tokens}`);
    console.log(`- Completion Tokens: ${response.usage.completion_tokens}`);
    console.log(`- Total Tokens: ${response.usage.total_tokens}`);
    console.log(`- Estimated Cost: $${((response.usage.prompt_tokens * 0.03 + response.usage.completion_tokens * 0.06) / 1000).toFixed(4)}`);

  } catch (error) {
    console.error('❌ Error generating content:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
    }
    process.exit(1);
  }
}

// Run the test
generateTransformerContent();