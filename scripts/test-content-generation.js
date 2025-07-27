#!/usr/bin/env node

import dotenv from 'dotenv';
import { aiContentGenerationService } from '../server/services/aiContentGenerationService.js';

// Load environment variables
dotenv.config();

async function testContentGeneration() {
  console.log('🧪 Testing Content Generation for "transformer"...\n');

  try {
    // Test data
    const testTerm = {
      termId: 'transformer',
      term: 'Transformer',
      category: 'Deep Learning',
      subcategory: 'neural-networks',
      sectionName: 'definition'
    };

    console.log('📝 Input:', testTerm);
    console.log('\n⏳ Generating content...\n');

    // Generate content
    const result = await aiContentGenerationService.generateContent(testTerm);

    // Display results
    console.log('✅ Content Generated Successfully!\n');
    console.log('📊 Results:');
    console.log('=====================================\n');
    
    if (result.definition) {
      console.log('📖 Definition:');
      console.log(result.definition);
      console.log();
    }

    if (result.keyPoints && result.keyPoints.length > 0) {
      console.log('🔑 Key Points:');
      result.keyPoints.forEach((point, index) => {
        console.log(`${index + 1}. ${point}`);
      });
      console.log();
    }

    if (result.examples && result.examples.length > 0) {
      console.log('💡 Examples:');
      result.examples.forEach((example, index) => {
        console.log(`${index + 1}. ${example}`);
      });
      console.log();
    }

    if (result.useCases && result.useCases.length > 0) {
      console.log('🎯 Use Cases:');
      result.useCases.forEach((useCase, index) => {
        console.log(`${index + 1}. ${useCase}`);
      });
      console.log();
    }

    if (result.bestPractices && result.bestPractices.length > 0) {
      console.log('✨ Best Practices:');
      result.bestPractices.forEach((practice, index) => {
        console.log(`${index + 1}. ${practice}`);
      });
      console.log();
    }

    if (result.commonPitfalls && result.commonPitfalls.length > 0) {
      console.log('⚠️  Common Pitfalls:');
      result.commonPitfalls.forEach((pitfall, index) => {
        console.log(`${index + 1}. ${pitfall}`);
      });
      console.log();
    }

    // Show metadata
    console.log('📊 Metadata:');
    console.log(`- Model: ${result.model || 'gpt-4'}`);
    console.log(`- Tokens Used: ${result.tokensUsed || 'N/A'}`);
    console.log(`- Generation Time: ${result.generationTime || 'N/A'}`);

  } catch (error) {
    console.error('❌ Error generating content:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
    }
    process.exit(1);
  }
}

// Run the test
testContentGeneration();