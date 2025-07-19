import { categories, subcategories, termSubcategories, terms } from '../shared/enhancedSchema';
import { db } from './db';

import logger from './utils/logger';
async function seed() {
  logger.info('Starting database seeding...');

  // Insert categories
  const aiCategory = await db
    .insert(categories)
    .values({
      name: 'Artificial Intelligence',
      description:
        'The field of computer science dedicated to creating systems that can perform tasks requiring human intelligence.',
    })
    .returning();

  const mlCategory = await db
    .insert(categories)
    .values({
      name: 'Machine Learning',
      description:
        'A subset of AI focused on systems that can learn from data without explicit programming.',
    })
    .returning();

  const dlCategory = await db
    .insert(categories)
    .values({
      name: 'Deep Learning',
      description: 'A subset of machine learning using neural networks with multiple layers.',
    })
    .returning();

  logger.info('Categories created:', aiCategory.length + mlCategory.length + dlCategory.length);

  // Insert subcategories
  const aiSubcategories = await db
    .insert(subcategories)
    .values([
      { name: 'General AI Concepts', categoryId: aiCategory[0].id },
      { name: 'AI Ethics', categoryId: aiCategory[0].id },
      { name: 'AI Applications', categoryId: aiCategory[0].id },
    ])
    .returning();

  const mlSubcategories = await db
    .insert(subcategories)
    .values([
      { name: 'Supervised Learning', categoryId: mlCategory[0].id },
      { name: 'Unsupervised Learning', categoryId: mlCategory[0].id },
      { name: 'Reinforcement Learning', categoryId: mlCategory[0].id },
    ])
    .returning();

  const dlSubcategories = await db
    .insert(subcategories)
    .values([
      { name: 'Neural Networks', categoryId: dlCategory[0].id },
      { name: 'CNN', categoryId: dlCategory[0].id },
      { name: 'RNN', categoryId: dlCategory[0].id },
    ])
    .returning();

  logger.info(
    'Subcategories created:',
    aiSubcategories.length + mlSubcategories.length + dlSubcategories.length
  );

  // Insert terms
  const aiTerms = await db
    .insert(terms)
    .values([
      {
        name: 'Artificial Intelligence',
        shortDefinition: 'Systems designed to mimic human intelligence',
        definition:
          'Artificial Intelligence (AI) refers to systems or machines that mimic human intelligence to perform tasks and can iteratively improve themselves based on the information they collect.',
        categoryId: aiCategory[0].id,
        characteristics: ['Automation', 'Reasoning', 'Learning', 'Problem-solving'],
        applications: JSON.stringify([
          { name: 'Virtual Assistants', description: 'AI-powered assistants like Siri and Alexa' },
          { name: 'Healthcare', description: 'Disease diagnosis and treatment recommendations' },
        ]),
      },
      {
        name: 'Turing Test',
        shortDefinition: "A test of a machine's ability to exhibit intelligent behavior",
        definition:
          "The Turing Test, proposed by Alan Turing in 1950, is a test of a machine's ability to exhibit intelligent behavior equivalent to, or indistinguishable from, that of a human.",
        categoryId: aiCategory[0].id,
        characteristics: ['Human-like interaction', 'Natural language processing', 'Reasoning'],
      },
    ])
    .returning();

  const mlTerms = await db
    .insert(terms)
    .values([
      {
        name: 'Supervised Learning',
        shortDefinition: 'Training with labeled data',
        definition:
          'Supervised learning is a type of machine learning where the algorithm learns from labeled training data, helping it to predict outcomes for unforeseen data.',
        categoryId: mlCategory[0].id,
        characteristics: ['Labeled data', 'Prediction', 'Classification', 'Regression'],
        mathFormulation: 'f: X → y where X is input and y is output',
      },
      {
        name: 'Unsupervised Learning',
        shortDefinition: 'Finding patterns in unlabeled data',
        definition:
          'Unsupervised learning is a type of machine learning where the algorithm learns patterns from unlabeled data without explicit instructions on what to look for.',
        categoryId: mlCategory[0].id,
        characteristics: [
          'Unlabeled data',
          'Pattern recognition',
          'Clustering',
          'Dimensionality reduction',
        ],
      },
    ])
    .returning();

  const dlTerms = await db
    .insert(terms)
    .values([
      {
        name: 'Neural Network',
        shortDefinition: 'Computing systems inspired by biological neural networks',
        definition:
          'Neural networks are computing systems inspired by the biological neural networks that constitute animal brains. They are capable of machine learning as well as pattern recognition.',
        categoryId: dlCategory[0].id,
        characteristics: ['Layers', 'Neurons', 'Activation functions', 'Weights and biases'],
        mathFormulation: 'y = f(∑(w_i * x_i) + b)',
      },
      {
        name: 'Convolutional Neural Network (CNN)',
        shortDefinition: 'Neural networks for processing grid-like data',
        definition:
          'A Convolutional Neural Network (CNN) is a class of deep neural networks most commonly applied to analyzing visual imagery. They are designed to automatically and adaptively learn spatial hierarchies of features from input images.',
        categoryId: dlCategory[0].id,
        characteristics: ['Convolution', 'Pooling', 'Feature maps', 'Filters/kernels'],
        applications: JSON.stringify([
          { name: 'Image recognition', description: 'Identifying objects in images' },
          { name: 'Video analysis', description: 'Processing video content for object detection' },
        ]),
      },
    ])
    .returning();

  logger.info('Terms created:', aiTerms.length + mlTerms.length + dlTerms.length);

  // Connect terms to subcategories
  const termSubcategoryRelations = [];

  // AI terms
  termSubcategoryRelations.push(
    { termId: aiTerms[0].id, subcategoryId: aiSubcategories[0].id }, // AI -> General AI Concepts
    { termId: aiTerms[1].id, subcategoryId: aiSubcategories[0].id } // Turing Test -> General AI Concepts
  );

  // ML terms
  termSubcategoryRelations.push(
    { termId: mlTerms[0].id, subcategoryId: mlSubcategories[0].id }, // Supervised Learning -> Supervised Learning
    { termId: mlTerms[1].id, subcategoryId: mlSubcategories[1].id } // Unsupervised Learning -> Unsupervised Learning
  );

  // DL terms
  termSubcategoryRelations.push(
    { termId: dlTerms[0].id, subcategoryId: dlSubcategories[0].id }, // Neural Network -> Neural Networks
    { termId: dlTerms[1].id, subcategoryId: dlSubcategories[1].id } // CNN -> CNN
  );

  await db.insert(termSubcategories).values(termSubcategoryRelations);

  logger.info('Term-subcategory relations created:', termSubcategoryRelations.length);
  logger.info('Database seeding completed successfully!');
}

seed().catch(error => {
  logger.error('Error seeding database:', error);
  process.exit(1);
});
