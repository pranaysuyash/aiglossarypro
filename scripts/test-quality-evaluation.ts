#!/usr/bin/env tsx

/**
 * Test script for Quality Evaluation System
 *
 * This script demonstrates the usage of the AI Quality Evaluation system
 * and can be used for testing and validation purposes.
 */

import dotenv from 'dotenv';

dotenv.config();

import { db } from '../server/db';
import { aiQualityEvaluationService } from '../server/services/aiQualityEvaluationService';
import { evaluationTemplateService } from '../server/services/evaluationTemplateService';
import { qualityAnalyticsService } from '../server/services/qualityAnalyticsService';
import { enhancedTerms } from '../shared/enhancedSchema';

// Sample content for testing
const SAMPLE_CONTENT = {
  goodDefinition: `
# Neural Networks

A neural network is a computational model inspired by the biological neural networks of animal brains. It consists of interconnected nodes (neurons) that process and transmit information.

## Key Components

1. **Neurons (Nodes)**: Basic processing units that receive inputs, apply weights, and produce outputs
2. **Layers**: Collections of neurons organized in input, hidden, and output layers
3. **Weights and Biases**: Parameters that determine the strength of connections between neurons
4. **Activation Functions**: Mathematical functions that determine neuron output (e.g., sigmoid, ReLU, tanh)

## How It Works

1. **Forward Propagation**: Data flows from input to output through weighted connections
2. **Activation**: Each neuron applies an activation function to weighted inputs
3. **Learning**: Networks adjust weights through backpropagation during training
4. **Prediction**: Trained networks make predictions on new data

## Mathematical Foundation

A single neuron computes: \`output = activation(Σ(weight_i × input_i) + bias)\`

For a network with multiple layers, this process repeats through each layer, with outputs becoming inputs for the next layer.

## Applications

- Image recognition and computer vision
- Natural language processing
- Speech recognition
- Autonomous vehicles
- Medical diagnosis
- Financial modeling

## Example Code

\`\`\`python
import tensorflow as tf

# Simple neural network
model = tf.keras.Sequential([
    tf.keras.layers.Dense(128, activation='relu', input_shape=(784,)),
    tf.keras.layers.Dropout(0.2),
    tf.keras.layers.Dense(10, activation='softmax')
])

model.compile(optimizer='adam',
              loss='sparse_categorical_crossentropy',
              metrics=['accuracy'])
\`\`\`

Neural networks form the foundation of deep learning and have revolutionized artificial intelligence across numerous domains.
  `,

  poorDefinition: `
# Backprop

Backprop is how neural nets learn. It goes backwards through the network and changes the weights. 

It uses calculus to figure out which weights are wrong. Then it fixes them. This happens many times until the network is good.

The math is complicated but computers can do it fast. Without backprop neural networks wouldn't work very well.

You need labeled data to train with backprop. The network makes predictions and backprop tells it what it did wrong.
  `,

  tutorialContent: `
# Implementing a Simple Neural Network from Scratch

This tutorial walks through building a basic neural network using only NumPy.

## Prerequisites
- Python programming knowledge
- Basic understanding of linear algebra
- Familiarity with calculus (derivatives)
- NumPy library

## Step 1: Import Dependencies

\`\`\`python
import numpy as np
import matplotlib.pyplot as plt
from sklearn.datasets import make_classification
\`\`\`

## Step 2: Define Activation Functions

\`\`\`python
def sigmoid(x):
    return 1 / (1 + np.exp(-np.clip(x, -250, 250)))

def sigmoid_derivative(x):
    return x * (1 - x)

def relu(x):
    return np.maximum(0, x)

def relu_derivative(x):
    return (x > 0).astype(float)
\`\`\`

## Step 3: Initialize the Network

\`\`\`python
class NeuralNetwork:
    def __init__(self, input_size, hidden_size, output_size):
        # Initialize weights randomly
        self.W1 = np.random.randn(input_size, hidden_size) * 0.01
        self.b1 = np.zeros((1, hidden_size))
        self.W2 = np.random.randn(hidden_size, output_size) * 0.01
        self.b2 = np.zeros((1, output_size))
        
    def forward(self, X):
        # Forward propagation
        self.z1 = np.dot(X, self.W1) + self.b1
        self.a1 = sigmoid(self.z1)
        self.z2 = np.dot(self.a1, self.W2) + self.b2
        self.a2 = sigmoid(self.z2)
        return self.a2
\`\`\`

## Step 4: Implement Backpropagation

\`\`\`python
    def backward(self, X, y, output):
        m = X.shape[0]
        
        # Calculate cost
        cost = np.mean((output - y) ** 2)
        
        # Backward propagation
        dz2 = (output - y) * sigmoid_derivative(output)
        dW2 = np.dot(self.a1.T, dz2) / m
        db2 = np.sum(dz2, axis=0, keepdims=True) / m
        
        da1 = np.dot(dz2, self.W2.T)
        dz1 = da1 * sigmoid_derivative(self.a1)
        dW1 = np.dot(X.T, dz1) / m
        db1 = np.sum(dz1, axis=0, keepdims=True) / m
        
        return dW1, db1, dW2, db2, cost
\`\`\`

## Step 5: Training Loop

\`\`\`python
    def train(self, X, y, epochs=1000, learning_rate=0.1):
        costs = []
        
        for epoch in range(epochs):
            # Forward pass
            output = self.forward(X)
            
            # Backward pass
            dW1, db1, dW2, db2, cost = self.backward(X, y, output)
            
            # Update weights
            self.W1 -= learning_rate * dW1
            self.b1 -= learning_rate * db1
            self.W2 -= learning_rate * dW2
            self.b2 -= learning_rate * db2
            
            costs.append(cost)
            
            if epoch % 100 == 0:
                print(f"Epoch {epoch}, Cost: {cost:.4f}")
        
        return costs
\`\`\`

## Step 6: Testing the Network

\`\`\`python
# Generate sample data
X, y = make_classification(n_samples=1000, n_features=2, n_redundant=0, 
                          n_informative=2, n_clusters_per_class=1, random_state=42)
y = y.reshape(-1, 1)

# Create and train network
nn = NeuralNetwork(input_size=2, hidden_size=10, output_size=1)
costs = nn.train(X, y, epochs=1000, learning_rate=0.1)

# Make predictions
predictions = nn.forward(X)
predictions = (predictions > 0.5).astype(int)
accuracy = np.mean(predictions == y)
print(f"Accuracy: {accuracy:.2f}")
\`\`\`

## Key Learning Points

1. **Weight Initialization**: Small random values prevent gradient problems
2. **Activation Functions**: Non-linear functions enable complex pattern learning
3. **Gradient Calculation**: Chain rule computes how each weight affects the loss
4. **Learning Rate**: Controls how quickly the network adapts

## Common Issues and Solutions

- **Vanishing Gradients**: Use ReLU activation or gradient clipping
- **Overfitting**: Add regularization or dropout layers
- **Slow Convergence**: Adjust learning rate or use adaptive optimizers

This implementation provides a foundation for understanding neural networks. Production systems would use frameworks like TensorFlow or PyTorch for efficiency and additional features.
  `,
};

async function testSingleEvaluation() {
  console.log('\n🔍 Testing Single Content Evaluation...\n');

  try {
    // Test good definition
    console.log('Evaluating GOOD definition...');
    const goodResult = await aiQualityEvaluationService.evaluateContent({
      termId: 'test-term-1',
      content: SAMPLE_CONTENT.goodDefinition,
      contentType: 'definition',
      targetAudience: 'intermediate',
    });

    console.log(`✅ Good Definition Results:`);
    console.log(`   Overall Score: ${goodResult.overallScore}/10`);
    console.log(`   Accuracy: ${goodResult.dimensions.accuracy.score}/10`);
    console.log(`   Clarity: ${goodResult.dimensions.clarity.score}/10`);
    console.log(`   Completeness: ${goodResult.dimensions.completeness.score}/10`);
    console.log(`   Cost: $${goodResult.metadata.cost.toFixed(4)}`);
    console.log(`   Strengths: ${goodResult.summary.strengths.slice(0, 2).join(', ')}`);

    // Test poor definition
    console.log('\nEvaluating POOR definition...');
    const poorResult = await aiQualityEvaluationService.evaluateContent({
      termId: 'test-term-2',
      content: SAMPLE_CONTENT.poorDefinition,
      contentType: 'definition',
      targetAudience: 'intermediate',
    });

    console.log(`❌ Poor Definition Results:`);
    console.log(`   Overall Score: ${poorResult.overallScore}/10`);
    console.log(`   Accuracy: ${poorResult.dimensions.accuracy.score}/10`);
    console.log(`   Clarity: ${poorResult.dimensions.clarity.score}/10`);
    console.log(`   Completeness: ${poorResult.dimensions.completeness.score}/10`);
    console.log(`   Cost: $${poorResult.metadata.cost.toFixed(4)}`);
    console.log(
      `   Issues: ${poorResult.summary.criticalIssues?.slice(0, 2).join(', ') || 'None'}`
    );

    // Test tutorial content
    console.log('\nEvaluating TUTORIAL content...');
    const tutorialResult = await aiQualityEvaluationService.evaluateContent({
      termId: 'test-term-3',
      content: SAMPLE_CONTENT.tutorialContent,
      contentType: 'tutorial',
      targetAudience: 'advanced',
    });

    console.log(`📚 Tutorial Results:`);
    console.log(`   Overall Score: ${tutorialResult.overallScore}/10`);
    console.log(`   Clarity: ${tutorialResult.dimensions.clarity.score}/10`);
    console.log(`   Completeness: ${tutorialResult.dimensions.completeness.score}/10`);
    console.log(`   Engagement: ${tutorialResult.dimensions.engagement.score}/10`);
    console.log(`   Cost: $${tutorialResult.metadata.cost.toFixed(4)}`);

    return { goodResult, poorResult, tutorialResult };
  } catch (error) {
    console.error('❌ Error in single evaluation test:', error);
    throw error;
  }
}

async function testBatchEvaluation() {
  console.log('\n📦 Testing Batch Evaluation...\n');

  try {
    const batchRequest = {
      evaluations: [
        {
          termId: 'batch-term-1',
          content: SAMPLE_CONTENT.goodDefinition,
          contentType: 'definition' as const,
          targetAudience: 'intermediate' as const,
        },
        {
          termId: 'batch-term-2',
          content: SAMPLE_CONTENT.poorDefinition,
          contentType: 'definition' as const,
          targetAudience: 'beginner' as const,
        },
        {
          termId: 'batch-term-3',
          content: SAMPLE_CONTENT.tutorialContent,
          contentType: 'tutorial' as const,
          targetAudience: 'advanced' as const,
        },
      ],
    };

    const batchResult = await aiQualityEvaluationService.batchEvaluate(batchRequest);

    console.log(`📊 Batch Evaluation Summary:`);
    console.log(`   Total Evaluations: ${batchResult.summary.totalEvaluations}`);
    console.log(`   Successful: ${batchResult.summary.successCount}`);
    console.log(`   Failed: ${batchResult.summary.failureCount}`);
    console.log(`   Average Score: ${batchResult.summary.averageScore.toFixed(1)}/10`);
    console.log(`   Total Cost: $${batchResult.summary.totalCost.toFixed(4)}`);
    console.log(`   Processing Time: ${(batchResult.summary.totalTime / 1000).toFixed(1)}s`);

    console.log(`\n📋 Individual Results:`);
    batchResult.results.forEach((result, index) => {
      if (result.success) {
        console.log(
          `   ${index + 1}. Score: ${result.overallScore}/10 (${result.metadata?.termName || 'Test Term'})`
        );
      } else {
        console.log(`   ${index + 1}. Failed: ${result.error}`);
      }
    });

    return batchResult;
  } catch (error) {
    console.error('❌ Error in batch evaluation test:', error);
    throw error;
  }
}

async function testComparisonEvaluation() {
  console.log('\n🔄 Testing Comparison Evaluation...\n');

  try {
    const comparisonResult = await aiQualityEvaluationService.compareWithReference(
      SAMPLE_CONTENT.poorDefinition,
      SAMPLE_CONTENT.goodDefinition,
      'definition'
    );

    console.log(`📊 Comparison Results:`);
    console.log(`   Similarity Score: ${comparisonResult.similarityScore}/100`);
    console.log(`   Missing Elements: ${comparisonResult.missingElements.slice(0, 3).join(', ')}`);
    console.log(`   Improvements Needed: ${comparisonResult.improvements.slice(0, 3).join(', ')}`);
    console.log(
      `   Additional Elements: ${comparisonResult.additionalElements.slice(0, 2).join(', ')}`
    );

    return comparisonResult;
  } catch (error) {
    console.error('❌ Error in comparison test:', error);
    throw error;
  }
}

async function testTemplateSystem() {
  console.log('\n📋 Testing Template System...\n');

  try {
    // Get all templates
    const allTemplates = evaluationTemplateService.getAllTemplates();
    console.log(`📚 Available Templates: ${allTemplates.length}`);
    allTemplates.forEach((template) => {
      console.log(`   - ${template.name} (${template.contentType})`);
    });

    // Get templates by content type
    const definitionTemplates = evaluationTemplateService.getTemplatesByContentType('definition');
    console.log(`\n🔍 Definition Templates: ${definitionTemplates.length}`);

    // Get template recommendation
    const recommended = evaluationTemplateService.recommendTemplate('tutorial', 'advanced');
    console.log(`\n💡 Recommended Template for Advanced Tutorial: ${recommended?.name || 'None'}`);

    // Test custom template creation
    const customTemplate = {
      id: 'test-custom-template',
      name: 'Test Custom Template',
      description: 'Custom template for testing',
      contentType: 'general',
      targetAudience: ['intermediate'],
      evaluationCriteria: [
        {
          dimension: 'accuracy',
          weight: 0.4,
          criteria: ['Test criterion 1', 'Test criterion 2'],
          examples: {
            good: ['Good example 1'],
            bad: ['Bad example 1'],
          },
        },
      ],
      prompts: {
        system: 'Test system prompt',
        evaluation: 'Test evaluation prompt',
        scoring: 'Test scoring prompt',
      },
      metadata: {
        version: '1.0',
        lastUpdated: new Date(),
        author: 'Test Script',
        tags: ['test', 'custom'],
      },
    };

    evaluationTemplateService.createCustomTemplate(customTemplate);
    console.log(`✅ Created custom template: ${customTemplate.id}`);

    // Clean up
    evaluationTemplateService.deleteTemplate(customTemplate.id);
    console.log(`🗑️  Deleted custom template: ${customTemplate.id}`);

    return { allTemplates, definitionTemplates, recommended };
  } catch (error) {
    console.error('❌ Error in template system test:', error);
    throw error;
  }
}

async function testQualityAnalytics() {
  console.log('\n📈 Testing Quality Analytics...\n');

  try {
    // Get analytics
    const analytics = await qualityAnalyticsService.getQualityAnalytics({
      startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      endDate: new Date(),
      groupBy: 'day',
    });

    console.log(`📊 Quality Analytics:`);
    console.log(`   Average Scores:`);
    console.log(`     Overall: ${analytics.averageScores.overall.toFixed(1)}/10`);
    console.log(`     Accuracy: ${analytics.averageScores.accuracy.toFixed(1)}/10`);
    console.log(`     Clarity: ${analytics.averageScores.clarity.toFixed(1)}/10`);
    console.log(`     Completeness: ${analytics.averageScores.completeness.toFixed(1)}/10`);

    console.log(`\n📈 Distribution:`);
    analytics.distribution.forEach((dist) => {
      console.log(`     ${dist.scoreRange}: ${dist.count} terms (${dist.percentage}%)`);
    });

    console.log(`\n🔍 Common Issues:`);
    analytics.commonIssues.slice(0, 3).forEach((issue, index) => {
      console.log(`     ${index + 1}. ${issue.issue} (${issue.frequency} occurrences)`);
    });

    // Get improvement recommendations
    const recommendations = await qualityAnalyticsService.getImprovementRecommendations();
    console.log(`\n💡 Improvement Recommendations:`);
    console.log(`   Current Average: ${recommendations.currentState.averageScore.toFixed(1)}/10`);
    console.log(
      `   Weakest Dimensions: ${recommendations.currentState.weakestDimensions.join(', ')}`
    );
    console.log(`   Top Recommendations:`);
    recommendations.recommendations.slice(0, 3).forEach((rec, index) => {
      console.log(
        `     ${index + 1}. ${rec.action} (${rec.priority} priority, +${rec.expectedImpact} impact)`
      );
    });

    return { analytics, recommendations };
  } catch (error) {
    console.error('❌ Error in analytics test:', error);
    throw error;
  }
}

async function testRealTermEvaluation() {
  console.log('\n🔍 Testing Real Term Evaluation...\n');

  try {
    // Get a real term from the database
    const terms = await db.select().from(enhancedTerms).limit(3);

    if (terms.length === 0) {
      console.log('⚠️  No terms found in database. Skipping real term evaluation.');
      return null;
    }

    console.log(`📚 Found ${terms.length} terms in database. Testing first term...`);

    const term = terms[0];
    const content = `${term.name}\n\n${term.definition || ''}\n\n${term.examples || ''}`;

    if (!content.trim() || content.length < 50) {
      console.log('⚠️  Term content too short. Skipping evaluation.');
      return null;
    }

    const result = await aiQualityEvaluationService.evaluateContent({
      termId: term.id,
      content,
      contentType: 'definition',
      targetAudience: 'intermediate',
    });

    console.log(`📖 Real Term Evaluation: "${term.name}"`);
    console.log(`   Overall Score: ${result.overallScore}/10`);
    console.log(`   Dimensions:`);
    console.log(`     Accuracy: ${result.dimensions.accuracy.score}/10`);
    console.log(`     Clarity: ${result.dimensions.clarity.score}/10`);
    console.log(`     Completeness: ${result.dimensions.completeness.score}/10`);
    console.log(`     Relevance: ${result.dimensions.relevance.score}/10`);
    console.log(`   Processing Time: ${result.metadata.evaluationTime}ms`);
    console.log(`   Cost: $${result.metadata.cost.toFixed(4)}`);

    if (result.summary.strengths.length > 0) {
      console.log(`   Strengths: ${result.summary.strengths.slice(0, 2).join(', ')}`);
    }

    if (result.summary.improvements.length > 0) {
      console.log(`   Improvements: ${result.summary.improvements.slice(0, 2).join(', ')}`);
    }

    return result;
  } catch (error) {
    console.error('❌ Error in real term evaluation test:', error);
    throw error;
  }
}

async function runComprehensiveTest() {
  console.log('🚀 Starting Comprehensive Quality Evaluation System Test\n');
  console.log('=' * 70);

  const results: any = {};

  try {
    // Test 1: Single evaluations
    results.singleEvaluation = await testSingleEvaluation();

    // Test 2: Batch evaluation
    results.batchEvaluation = await testBatchEvaluation();

    // Test 3: Comparison evaluation
    results.comparisonEvaluation = await testComparisonEvaluation();

    // Test 4: Template system
    results.templateSystem = await testTemplateSystem();

    // Test 5: Quality analytics
    results.qualityAnalytics = await testQualityAnalytics();

    // Test 6: Real term evaluation
    results.realTermEvaluation = await testRealTermEvaluation();

    console.log(`\n${'=' * 70}`);
    console.log('✅ ALL TESTS COMPLETED SUCCESSFULLY!');
    console.log('=' * 70);

    // Summary
    console.log('\n📊 Test Summary:');
    console.log(`   Single Evaluations: ✅ Completed`);
    console.log(
      `   Batch Evaluation: ✅ Completed (${results.batchEvaluation?.summary.successCount}/${results.batchEvaluation?.summary.totalEvaluations} successful)`
    );
    console.log(
      `   Comparison: ✅ Completed (${results.comparisonEvaluation?.similarityScore || 'N/A'}/100 similarity)`
    );
    console.log(
      `   Templates: ✅ Completed (${results.templateSystem?.allTemplates?.length || 0} templates loaded)`
    );
    console.log(`   Analytics: ✅ Completed`);
    console.log(`   Real Term: ${results.realTermEvaluation ? '✅ Completed' : '⚠️  Skipped'}`);

    const totalCost =
      (results.singleEvaluation?.goodResult?.metadata?.cost || 0) +
      (results.singleEvaluation?.poorResult?.metadata?.cost || 0) +
      (results.singleEvaluation?.tutorialResult?.metadata?.cost || 0) +
      (results.batchEvaluation?.summary?.totalCost || 0) +
      (results.realTermEvaluation?.metadata?.cost || 0);

    console.log(`\n💰 Total Test Cost: $${totalCost.toFixed(4)}`);

    return results;
  } catch (error) {
    console.error('\n❌ TEST FAILED:', error);
    throw error;
  }
}

// Main execution
if (require.main === module) {
  runComprehensiveTest()
    .then(() => {
      console.log('\n🎉 Quality Evaluation System test completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Test failed:', error);
      process.exit(1);
    });
}

export {
  testSingleEvaluation,
  testBatchEvaluation,
  testComparisonEvaluation,
  testTemplateSystem,
  testQualityAnalytics,
  testRealTermEvaluation,
  runComprehensiveTest,
};
