/**
 * Essential AI/ML Terms Database
 * 
 * This file contains curated lists of essential AI/ML terms organized by category.
 * These terms are prioritized for content generation and form the foundation
 * of a comprehensive AI/ML glossary.
 */

interface EssentialTerm {
  name: string;
  priority: 'high' | 'medium' | 'low';
  complexity: 'beginner' | 'intermediate' | 'advanced';
  focusAreas?: string[];
  aliases?: string[];
  relatedTerms?: string[];
}

interface CategoryTerms {
  [categoryName: string]: EssentialTerm[];
}

export const ESSENTIAL_AI_TERMS: CategoryTerms = {
  
  // Machine Learning Fundamentals
  'Machine Learning': [
    {
      name: 'Supervised Learning',
      priority: 'high',
      complexity: 'beginner',
      focusAreas: ['classification', 'regression', 'labeled data'],
      aliases: ['supervised training'],
      relatedTerms: ['unsupervised learning', 'classification', 'regression']
    },
    {
      name: 'Unsupervised Learning',
      priority: 'high',
      complexity: 'beginner',
      focusAreas: ['clustering', 'dimensionality reduction', 'pattern discovery'],
      aliases: ['unsupervised training'],
      relatedTerms: ['supervised learning', 'clustering', 'PCA']
    },
    {
      name: 'Reinforcement Learning',
      priority: 'high',
      complexity: 'intermediate',
      focusAreas: ['agent-based learning', 'reward systems', 'policy optimization'],
      aliases: ['RL'],
      relatedTerms: ['Q-learning', 'policy gradient', 'actor-critic']
    },
    {
      name: 'Feature Engineering',
      priority: 'high',
      complexity: 'intermediate',
      focusAreas: ['data preprocessing', 'feature selection', 'dimensionality reduction'],
      relatedTerms: ['feature selection', 'principal component analysis', 'data preprocessing']
    },
    {
      name: 'Cross-Validation',
      priority: 'high',
      complexity: 'beginner',
      focusAreas: ['model validation', 'performance evaluation', 'overfitting prevention'],
      aliases: ['k-fold validation'],
      relatedTerms: ['train-test split', 'model validation', 'overfitting']
    },
    {
      name: 'Gradient Descent',
      priority: 'high',
      complexity: 'intermediate',
      focusAreas: ['optimization', 'loss function minimization', 'backpropagation'],
      relatedTerms: ['stochastic gradient descent', 'Adam optimizer', 'loss function']
    },
    {
      name: 'Bias-Variance Tradeoff',
      priority: 'high',
      complexity: 'intermediate',
      focusAreas: ['model complexity', 'generalization', 'overfitting'],
      relatedTerms: ['overfitting', 'underfitting', 'model complexity']
    },
    {
      name: 'Ensemble Methods',
      priority: 'medium',
      complexity: 'intermediate',
      focusAreas: ['model combination', 'bagging', 'boosting'],
      relatedTerms: ['random forest', 'gradient boosting', 'voting classifier']
    },
    {
      name: 'Hyperparameter Tuning',
      priority: 'medium',
      complexity: 'intermediate',
      focusAreas: ['model optimization', 'grid search', 'random search'],
      relatedTerms: ['grid search', 'random search', 'Bayesian optimization']
    },
    {
      name: 'Regularization',
      priority: 'medium',
      complexity: 'intermediate',
      focusAreas: ['overfitting prevention', 'model complexity control'],
      relatedTerms: ['L1 regularization', 'L2 regularization', 'dropout']
    }
  ],

  // Deep Learning
  'Deep Learning': [
    {
      name: 'Neural Network',
      priority: 'high',
      complexity: 'beginner',
      focusAreas: ['artificial neurons', 'multilayer perceptron', 'feedforward networks'],
      aliases: ['artificial neural network', 'ANN'],
      relatedTerms: ['perceptron', 'multilayer perceptron', 'deep learning']
    },
    {
      name: 'Convolutional Neural Network',
      priority: 'high',
      complexity: 'intermediate',
      focusAreas: ['computer vision', 'image recognition', 'feature extraction'],
      aliases: ['CNN', 'ConvNet'],
      relatedTerms: ['convolution', 'pooling', 'feature maps']
    },
    {
      name: 'Recurrent Neural Network',
      priority: 'high',
      complexity: 'intermediate',
      focusAreas: ['sequential data', 'time series', 'natural language processing'],
      aliases: ['RNN'],
      relatedTerms: ['LSTM', 'GRU', 'sequence modeling']
    },
    {
      name: 'Long Short-Term Memory',
      priority: 'high',
      complexity: 'intermediate',
      focusAreas: ['sequence modeling', 'vanishing gradient problem', 'memory networks'],
      aliases: ['LSTM'],
      relatedTerms: ['RNN', 'GRU', 'attention mechanism']
    },
    {
      name: 'Transformer',
      priority: 'high',
      complexity: 'advanced',
      focusAreas: ['attention mechanism', 'natural language processing', 'self-attention'],
      relatedTerms: ['attention mechanism', 'BERT', 'GPT']
    },
    {
      name: 'Attention Mechanism',
      priority: 'high',
      complexity: 'intermediate',
      focusAreas: ['sequence-to-sequence', 'focus mechanisms', 'weighted averaging'],
      relatedTerms: ['transformer', 'self-attention', 'multi-head attention']
    },
    {
      name: 'Backpropagation',
      priority: 'high',
      complexity: 'intermediate',
      focusAreas: ['gradient computation', 'neural network training', 'chain rule'],
      relatedTerms: ['gradient descent', 'chain rule', 'automatic differentiation']
    },
    {
      name: 'Dropout',
      priority: 'medium',
      complexity: 'intermediate',
      focusAreas: ['regularization', 'overfitting prevention', 'network robustness'],
      relatedTerms: ['regularization', 'overfitting', 'batch normalization']
    },
    {
      name: 'Batch Normalization',
      priority: 'medium',
      complexity: 'intermediate',
      focusAreas: ['training stability', 'gradient flow', 'internal covariate shift'],
      relatedTerms: ['layer normalization', 'normalization', 'training stability']
    },
    {
      name: 'Generative Adversarial Network',
      priority: 'medium',
      complexity: 'advanced',
      focusAreas: ['generative modeling', 'adversarial training', 'synthetic data'],
      aliases: ['GAN'],
      relatedTerms: ['generator', 'discriminator', 'adversarial training']
    }
  ],

  // Natural Language Processing
  'Natural Language Processing': [
    {
      name: 'Tokenization',
      priority: 'high',
      complexity: 'beginner',
      focusAreas: ['text preprocessing', 'word segmentation', 'subword tokenization'],
      relatedTerms: ['preprocessing', 'word segmentation', 'text normalization']
    },
    {
      name: 'Word Embedding',
      priority: 'high',
      complexity: 'intermediate',
      focusAreas: ['word representation', 'semantic similarity', 'vector space models'],
      relatedTerms: ['Word2Vec', 'GloVe', 'FastText']
    },
    {
      name: 'Word2Vec',
      priority: 'high',
      complexity: 'intermediate',
      focusAreas: ['word embeddings', 'skip-gram', 'CBOW'],
      relatedTerms: ['word embedding', 'skip-gram', 'continuous bag of words']
    },
    {
      name: 'BERT',
      priority: 'high',
      complexity: 'advanced',
      focusAreas: ['bidirectional encoding', 'pre-trained models', 'transfer learning'],
      aliases: ['Bidirectional Encoder Representations from Transformers'],
      relatedTerms: ['transformer', 'pre-training', 'fine-tuning']
    },
    {
      name: 'GPT',
      priority: 'high',
      complexity: 'advanced',
      focusAreas: ['generative pre-training', 'language modeling', 'autoregressive models'],
      aliases: ['Generative Pre-trained Transformer'],
      relatedTerms: ['transformer', 'language modeling', 'autoregressive']
    },
    {
      name: 'Named Entity Recognition',
      priority: 'medium',
      complexity: 'intermediate',
      focusAreas: ['entity extraction', 'information extraction', 'sequence labeling'],
      aliases: ['NER'],
      relatedTerms: ['entity extraction', 'information extraction', 'sequence labeling']
    },
    {
      name: 'Part-of-Speech Tagging',
      priority: 'medium',
      complexity: 'intermediate',
      focusAreas: ['grammatical analysis', 'syntactic parsing', 'linguistic annotation'],
      aliases: ['POS tagging'],
      relatedTerms: ['syntactic parsing', 'grammatical analysis', 'linguistic features']
    },
    {
      name: 'Sentiment Analysis',
      priority: 'medium',
      complexity: 'beginner',
      focusAreas: ['opinion mining', 'emotion detection', 'text classification'],
      relatedTerms: ['opinion mining', 'emotion detection', 'text classification']
    },
    {
      name: 'Language Model',
      priority: 'high',
      complexity: 'intermediate',
      focusAreas: ['text generation', 'probability distribution', 'sequence modeling'],
      relatedTerms: ['n-gram models', 'neural language models', 'autoregressive models']
    },
    {
      name: 'Machine Translation',
      priority: 'medium',
      complexity: 'intermediate',
      focusAreas: ['sequence-to-sequence', 'cross-lingual models', 'translation quality'],
      relatedTerms: ['seq2seq', 'neural machine translation', 'attention mechanism']
    }
  ],

  // Computer Vision
  'Computer Vision': [
    {
      name: 'Image Classification',
      priority: 'high',
      complexity: 'beginner',
      focusAreas: ['object recognition', 'categorical prediction', 'visual classification'],
      relatedTerms: ['object detection', 'feature extraction', 'convolutional neural networks']
    },
    {
      name: 'Object Detection',
      priority: 'high',
      complexity: 'intermediate',
      focusAreas: ['bounding boxes', 'localization', 'multi-object recognition'],
      relatedTerms: ['image classification', 'YOLO', 'R-CNN']
    },
    {
      name: 'Semantic Segmentation',
      priority: 'medium',
      complexity: 'intermediate',
      focusAreas: ['pixel-level classification', 'scene understanding', 'dense prediction'],
      relatedTerms: ['instance segmentation', 'panoptic segmentation', 'FCN']
    },
    {
      name: 'Feature Extraction',
      priority: 'high',
      complexity: 'intermediate',
      focusAreas: ['image features', 'descriptors', 'representation learning'],
      relatedTerms: ['SIFT', 'HOG', 'deep features']
    },
    {
      name: 'Convolution',
      priority: 'high',
      complexity: 'intermediate',
      focusAreas: ['image filtering', 'feature detection', 'spatial processing'],
      relatedTerms: ['kernel', 'filter', 'feature maps']
    },
    {
      name: 'Pooling',
      priority: 'medium',
      complexity: 'beginner',
      focusAreas: ['dimensionality reduction', 'translation invariance', 'feature aggregation'],
      relatedTerms: ['max pooling', 'average pooling', 'global pooling']
    },
    {
      name: 'Transfer Learning',
      priority: 'medium',
      complexity: 'intermediate',
      focusAreas: ['pre-trained models', 'fine-tuning', 'domain adaptation'],
      relatedTerms: ['pre-trained models', 'fine-tuning', 'feature extraction']
    },
    {
      name: 'Data Augmentation',
      priority: 'medium',
      complexity: 'beginner',
      focusAreas: ['training data expansion', 'robustness', 'generalization'],
      relatedTerms: ['image transformations', 'synthetic data', 'regularization']
    },
    {
      name: 'Optical Character Recognition',
      priority: 'low',
      complexity: 'intermediate',
      focusAreas: ['text recognition', 'document analysis', 'character detection'],
      aliases: ['OCR'],
      relatedTerms: ['text detection', 'character recognition', 'document parsing']
    },
    {
      name: 'Face Recognition',
      priority: 'low',
      complexity: 'intermediate',
      focusAreas: ['biometric identification', 'facial features', 'identity verification'],
      relatedTerms: ['face detection', 'facial landmarks', 'biometric systems']
    }
  ],

  // Algorithms and Techniques
  'Algorithms': [
    {
      name: 'Decision Tree',
      priority: 'high',
      complexity: 'beginner',
      focusAreas: ['rule-based learning', 'interpretable models', 'tree structures'],
      relatedTerms: ['random forest', 'gradient boosting', 'CART']
    },
    {
      name: 'Random Forest',
      priority: 'high',
      complexity: 'intermediate',
      focusAreas: ['ensemble methods', 'bagging', 'feature importance'],
      relatedTerms: ['decision tree', 'ensemble methods', 'bagging']
    },
    {
      name: 'Support Vector Machine',
      priority: 'high',
      complexity: 'intermediate',
      focusAreas: ['margin maximization', 'kernel methods', 'classification'],
      aliases: ['SVM'],
      relatedTerms: ['kernel trick', 'margin', 'support vectors']
    },
    {
      name: 'K-Means Clustering',
      priority: 'high',
      complexity: 'beginner',
      focusAreas: ['unsupervised learning', 'centroid-based clustering', 'partitional clustering'],
      relatedTerms: ['clustering', 'unsupervised learning', 'centroid']
    },
    {
      name: 'Principal Component Analysis',
      priority: 'high',
      complexity: 'intermediate',
      focusAreas: ['dimensionality reduction', 'feature extraction', 'data visualization'],
      aliases: ['PCA'],
      relatedTerms: ['dimensionality reduction', 'eigenvalues', 'feature extraction']
    },
    {
      name: 'Logistic Regression',
      priority: 'high',
      complexity: 'beginner',
      focusAreas: ['binary classification', 'linear models', 'probability estimation'],
      relatedTerms: ['linear regression', 'classification', 'sigmoid function']
    },
    {
      name: 'Naive Bayes',
      priority: 'medium',
      complexity: 'beginner',
      focusAreas: ['probabilistic classification', 'Bayes theorem', 'text classification'],
      relatedTerms: ['Bayes theorem', 'probabilistic models', 'text classification']
    },
    {
      name: 'K-Nearest Neighbors',
      priority: 'medium',
      complexity: 'beginner',
      focusAreas: ['instance-based learning', 'lazy learning', 'distance metrics'],
      aliases: ['KNN', 'k-NN'],
      relatedTerms: ['distance metrics', 'lazy learning', 'instance-based learning']
    },
    {
      name: 'Gradient Boosting',
      priority: 'medium',
      complexity: 'intermediate',
      focusAreas: ['ensemble methods', 'boosting', 'weak learners'],
      relatedTerms: ['XGBoost', 'AdaBoost', 'ensemble methods']
    },
    {
      name: 'Linear Regression',
      priority: 'high',
      complexity: 'beginner',
      focusAreas: ['regression analysis', 'linear models', 'prediction'],
      relatedTerms: ['least squares', 'regression', 'linear models']
    }
  ],

  // Statistics and Mathematics
  'Statistics': [
    {
      name: 'Bayes Theorem',
      priority: 'high',
      complexity: 'intermediate',
      focusAreas: ['conditional probability', 'prior probability', 'posterior probability'],
      relatedTerms: ['conditional probability', 'prior', 'posterior']
    },
    {
      name: 'Central Limit Theorem',
      priority: 'medium',
      complexity: 'intermediate',
      focusAreas: ['sampling distribution', 'normal distribution', 'statistical inference'],
      relatedTerms: ['normal distribution', 'sampling distribution', 'statistical inference']
    },
    {
      name: 'Hypothesis Testing',
      priority: 'medium',
      complexity: 'intermediate',
      focusAreas: ['statistical significance', 'p-values', 'null hypothesis'],
      relatedTerms: ['p-value', 'null hypothesis', 'statistical significance']
    },
    {
      name: 'Confidence Interval',
      priority: 'medium',
      complexity: 'intermediate',
      focusAreas: ['statistical inference', 'uncertainty quantification', 'parameter estimation'],
      relatedTerms: ['confidence level', 'margin of error', 'statistical inference']
    },
    {
      name: 'Probability Distribution',
      priority: 'high',
      complexity: 'intermediate',
      focusAreas: ['random variables', 'statistical modeling', 'probability theory'],
      relatedTerms: ['normal distribution', 'binomial distribution', 'probability density function']
    },
    {
      name: 'Maximum Likelihood Estimation',
      priority: 'medium',
      complexity: 'advanced',
      focusAreas: ['parameter estimation', 'likelihood function', 'statistical inference'],
      aliases: ['MLE'],
      relatedTerms: ['likelihood function', 'parameter estimation', 'statistical inference']
    },
    {
      name: 'Correlation',
      priority: 'medium',
      complexity: 'beginner',
      focusAreas: ['linear relationship', 'statistical association', 'data analysis'],
      relatedTerms: ['correlation coefficient', 'linear relationship', 'covariance']
    },
    {
      name: 'Regression Analysis',
      priority: 'high',
      complexity: 'beginner',
      focusAreas: ['predictive modeling', 'relationship analysis', 'curve fitting'],
      relatedTerms: ['linear regression', 'multiple regression', 'polynomial regression']
    },
    {
      name: 'Statistical Significance',
      priority: 'medium',
      complexity: 'intermediate',
      focusAreas: ['hypothesis testing', 'p-values', 'type I error'],
      relatedTerms: ['p-value', 'alpha level', 'hypothesis testing']
    },
    {
      name: 'Sampling',
      priority: 'medium',
      complexity: 'beginner',
      focusAreas: ['data collection', 'representative samples', 'sampling bias'],
      relatedTerms: ['random sampling', 'stratified sampling', 'sampling bias']
    }
  ],

  // Data Science and Analytics
  'Data Science': [
    {
      name: 'Data Preprocessing',
      priority: 'high',
      complexity: 'beginner',
      focusAreas: ['data cleaning', 'feature engineering', 'data transformation'],
      relatedTerms: ['data cleaning', 'feature engineering', 'data transformation']
    },
    {
      name: 'Data Visualization',
      priority: 'high',
      complexity: 'beginner',
      focusAreas: ['graphical representation', 'exploratory data analysis', 'visual analytics'],
      relatedTerms: ['exploratory data analysis', 'charts', 'statistical graphics']
    },
    {
      name: 'Exploratory Data Analysis',
      priority: 'high',
      complexity: 'beginner',
      focusAreas: ['data understanding', 'pattern discovery', 'descriptive statistics'],
      aliases: ['EDA'],
      relatedTerms: ['data visualization', 'descriptive statistics', 'data profiling']
    },
    {
      name: 'Big Data',
      priority: 'medium',
      complexity: 'intermediate',
      focusAreas: ['volume', 'velocity', 'variety', 'distributed computing'],
      relatedTerms: ['Hadoop', 'Spark', 'distributed computing']
    },
    {
      name: 'Data Mining',
      priority: 'medium',
      complexity: 'intermediate',
      focusAreas: ['pattern discovery', 'knowledge extraction', 'large datasets'],
      relatedTerms: ['pattern recognition', 'knowledge discovery', 'association rules']
    },
    {
      name: 'ETL Process',
      priority: 'medium',
      complexity: 'intermediate',
      focusAreas: ['extract', 'transform', 'load', 'data pipeline'],
      aliases: ['Extract Transform Load'],
      relatedTerms: ['data pipeline', 'data integration', 'data warehouse']
    },
    {
      name: 'A/B Testing',
      priority: 'medium',
      complexity: 'intermediate',
      focusAreas: ['controlled experiments', 'statistical testing', 'hypothesis testing'],
      relatedTerms: ['controlled experiment', 'statistical testing', 'conversion rate']
    },
    {
      name: 'Business Intelligence',
      priority: 'low',
      complexity: 'beginner',
      focusAreas: ['business analytics', 'reporting', 'decision support'],
      aliases: ['BI'],
      relatedTerms: ['business analytics', 'reporting', 'dashboards']
    },
    {
      name: 'Data Warehouse',
      priority: 'low',
      complexity: 'intermediate',
      focusAreas: ['centralized data storage', 'analytical processing', 'OLAP'],
      relatedTerms: ['OLAP', 'data mart', 'dimensional modeling']
    },
    {
      name: 'Time Series Analysis',
      priority: 'medium',
      complexity: 'intermediate',
      focusAreas: ['temporal data', 'forecasting', 'trend analysis'],
      relatedTerms: ['forecasting', 'trend analysis', 'seasonal decomposition']
    }
  ],

  // AI Ethics and Responsible AI
  'AI Ethics': [
    {
      name: 'Algorithmic Bias',
      priority: 'high',
      complexity: 'intermediate',
      focusAreas: ['fairness', 'discrimination', 'bias detection'],
      relatedTerms: ['fairness', 'discrimination', 'bias mitigation']
    },
    {
      name: 'Explainable AI',
      priority: 'high',
      complexity: 'intermediate',
      focusAreas: ['interpretability', 'transparency', 'model explanation'],
      aliases: ['XAI'],
      relatedTerms: ['interpretability', 'transparency', 'model explanation']
    },
    {
      name: 'Fairness in AI',
      priority: 'high',
      complexity: 'intermediate',
      focusAreas: ['algorithmic fairness', 'bias mitigation', 'equitable outcomes'],
      relatedTerms: ['algorithmic bias', 'bias mitigation', 'equitable AI']
    },
    {
      name: 'Privacy-Preserving AI',
      priority: 'medium',
      complexity: 'advanced',
      focusAreas: ['data privacy', 'differential privacy', 'federated learning'],
      relatedTerms: ['differential privacy', 'federated learning', 'data anonymization']
    },
    {
      name: 'Adversarial Examples',
      priority: 'medium',
      complexity: 'advanced',
      focusAreas: ['model robustness', 'security', 'adversarial attacks'],
      relatedTerms: ['adversarial attacks', 'model robustness', 'security']
    },
    {
      name: 'AI Governance',
      priority: 'medium',
      complexity: 'intermediate',
      focusAreas: ['regulation', 'compliance', 'responsible AI'],
      relatedTerms: ['AI regulation', 'responsible AI', 'compliance']
    },
    {
      name: 'Human-in-the-Loop',
      priority: 'medium',
      complexity: 'intermediate',
      focusAreas: ['human oversight', 'interactive AI', 'human-AI collaboration'],
      aliases: ['HITL'],
      relatedTerms: ['human oversight', 'interactive AI', 'human-AI collaboration']
    },
    {
      name: 'AI Transparency',
      priority: 'medium',
      complexity: 'intermediate',
      focusAreas: ['model interpretability', 'decision transparency', 'accountability'],
      relatedTerms: ['interpretability', 'accountability', 'explainable AI']
    },
    {
      name: 'Responsible AI',
      priority: 'high',
      complexity: 'intermediate',
      focusAreas: ['ethical AI', 'AI governance', 'sustainable AI'],
      relatedTerms: ['AI ethics', 'AI governance', 'sustainable AI']
    },
    {
      name: 'AI Safety',
      priority: 'medium',
      complexity: 'intermediate',
      focusAreas: ['risk mitigation', 'safe AI systems', 'alignment'],
      relatedTerms: ['AI alignment', 'risk mitigation', 'safe AI']
    }
  ],

  // Emerging Technologies
  'Emerging Technologies': [
    {
      name: 'Large Language Model',
      priority: 'high',
      complexity: 'advanced',
      focusAreas: ['transformer architecture', 'natural language understanding', 'generative AI'],
      aliases: ['LLM'],
      relatedTerms: ['transformer', 'generative AI', 'pre-trained models']
    },
    {
      name: 'Generative AI',
      priority: 'high',
      complexity: 'advanced',
      focusAreas: ['content generation', 'creative AI', 'synthetic data'],
      relatedTerms: ['large language models', 'diffusion models', 'generative adversarial networks']
    },
    {
      name: 'Federated Learning',
      priority: 'medium',
      complexity: 'advanced',
      focusAreas: ['distributed learning', 'privacy preservation', 'decentralized AI'],
      relatedTerms: ['distributed learning', 'privacy-preserving AI', 'edge computing']
    },
    {
      name: 'Few-Shot Learning',
      priority: 'medium',
      complexity: 'advanced',
      focusAreas: ['meta-learning', 'low-resource learning', 'transfer learning'],
      relatedTerms: ['meta-learning', 'zero-shot learning', 'transfer learning']
    },
    {
      name: 'AutoML',
      priority: 'medium',
      complexity: 'intermediate',
      focusAreas: ['automated machine learning', 'hyperparameter optimization', 'model selection'],
      aliases: ['Automated Machine Learning'],
      relatedTerms: ['hyperparameter optimization', 'neural architecture search', 'model selection']
    },
    {
      name: 'Edge AI',
      priority: 'medium',
      complexity: 'intermediate',
      focusAreas: ['edge computing', 'mobile AI', 'IoT intelligence'],
      relatedTerms: ['edge computing', 'mobile AI', 'IoT']
    },
    {
      name: 'Quantum Machine Learning',
      priority: 'low',
      complexity: 'advanced',
      focusAreas: ['quantum computing', 'quantum algorithms', 'hybrid systems'],
      aliases: ['QML'],
      relatedTerms: ['quantum computing', 'quantum algorithms', 'quantum advantage']
    },
    {
      name: 'Neuromorphic Computing',
      priority: 'low',
      complexity: 'advanced',
      focusAreas: ['brain-inspired computing', 'spiking neural networks', 'energy-efficient AI'],
      relatedTerms: ['spiking neural networks', 'brain-inspired computing', 'neuromorphic chips']
    },
    {
      name: 'Multimodal AI',
      priority: 'medium',
      complexity: 'advanced',
      focusAreas: ['cross-modal learning', 'vision-language models', 'multimodal fusion'],
      relatedTerms: ['vision-language models', 'cross-modal learning', 'multimodal fusion']
    },
    {
      name: 'AI Agents',
      priority: 'medium',
      complexity: 'advanced',
      focusAreas: ['autonomous agents', 'intelligent systems', 'multi-agent systems'],
      relatedTerms: ['autonomous agents', 'multi-agent systems', 'intelligent agents']
    }
  ]
};

/**
 * Get all essential terms across all categories
 */
export function getAllEssentialTerms(): EssentialTerm[] {
  return Object.values(ESSENTIAL_AI_TERMS).flat();
}

/**
 * Get essential terms for a specific category
 */
export function getEssentialTermsForCategory(categoryName: string): EssentialTerm[] {
  return ESSENTIAL_AI_TERMS[categoryName] || [];
}

/**
 * Get terms by priority level
 */
export function getTermsByPriority(priority: 'high' | 'medium' | 'low'): EssentialTerm[] {
  return getAllEssentialTerms().filter(term => term.priority === priority);
}

/**
 * Get terms by complexity level
 */
export function getTermsByComplexity(complexity: 'beginner' | 'intermediate' | 'advanced'): EssentialTerm[] {
  return getAllEssentialTerms().filter(term => term.complexity === complexity);
}

/**
 * Get category statistics
 */
export function getCategoryStatistics(): { [category: string]: { total: number; high: number; medium: number; low: number } } {
  const stats: { [category: string]: { total: number; high: number; medium: number; low: number } } = {};
  
  for (const [category, terms] of Object.entries(ESSENTIAL_AI_TERMS)) {
    stats[category] = {
      total: terms.length,
      high: terms.filter(t => t.priority === 'high').length,
      medium: terms.filter(t => t.priority === 'medium').length,
      low: terms.filter(t => t.priority === 'low').length
    };
  }
  
  return stats;
}

/**
 * Search terms by name or alias
 */
export function searchTerms(query: string): EssentialTerm[] {
  const normalizedQuery = query.toLowerCase();
  return getAllEssentialTerms().filter(term => 
    term.name.toLowerCase().includes(normalizedQuery) ||
    term.aliases?.some(alias => alias.toLowerCase().includes(normalizedQuery))
  );
}

export default ESSENTIAL_AI_TERMS;