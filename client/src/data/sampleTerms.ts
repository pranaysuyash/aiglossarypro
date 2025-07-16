// Curated sample terms for SEO discovery and signup conversion
export interface SampleTerm {
  id: string;
  slug: string;
  title: string;
  definition: string;
  category: string;
  complexity: 'Beginner' | 'Intermediate' | 'Advanced';
  tags: string[];
  examples: string[];
  useCases: string[];
  relatedTerms: Array<{
    id: string;
    title: string;
    category: string;
    locked: boolean;
  }>;
  seoMetadata: {
    metaTitle: string;
    metaDescription: string;
    keywords: string[];
    canonicalUrl: string;
  };
}

export const SAMPLE_TERMS: SampleTerm[] = [
  {
    id: 'neural-network',
    slug: 'neural-network',
    title: 'Neural Network',
    definition:
      'A neural network is a computing system inspired by biological neural networks that constitute animal brains. It consists of interconnected nodes (neurons) organized in layers that process information through weighted connections, enabling pattern recognition, learning, and decision-making capabilities.',
    category: 'Deep Learning',
    complexity: 'Intermediate',
    tags: [
      'Deep Learning',
      'AI',
      'Machine Learning',
      'Pattern Recognition',
      'Artificial Intelligence',
    ],
    examples: [
      'Image recognition systems that can identify objects, faces, and scenes in photographs',
      'Natural language processing models like ChatGPT that understand and generate human-like text',
      'Recommendation engines on platforms like Netflix and Amazon that suggest relevant content',
      'Autonomous vehicle systems that process sensor data to make driving decisions',
      'Medical diagnosis tools that analyze X-rays, MRIs, and other medical imaging data',
    ],
    useCases: [
      'Computer vision applications for automated quality control in manufacturing',
      'Financial fraud detection systems analyzing transaction patterns',
      'Voice recognition and speech-to-text conversion systems',
      'Predictive maintenance in industrial equipment monitoring',
      'Drug discovery and molecular analysis in pharmaceutical research',
    ],
    relatedTerms: [
      { id: 'deep-learning', title: 'Deep Learning', category: 'Deep Learning', locked: true },
      { id: 'backpropagation', title: 'Backpropagation', category: 'Deep Learning', locked: true },
      {
        id: 'activation-function',
        title: 'Activation Function',
        category: 'Deep Learning',
        locked: true,
      },
      { id: 'gradient-descent', title: 'Gradient Descent', category: 'Optimization', locked: true },
      {
        id: 'convolutional-neural-network',
        title: 'Convolutional Neural Network',
        category: 'Deep Learning',
        locked: true,
      },
      {
        id: 'recurrent-neural-network',
        title: 'Recurrent Neural Network',
        category: 'Deep Learning',
        locked: true,
      },
      {
        id: 'artificial-neuron',
        title: 'Artificial Neuron',
        category: 'Deep Learning',
        locked: true,
      },
      {
        id: 'multilayer-perceptron',
        title: 'Multilayer Perceptron',
        category: 'Deep Learning',
        locked: true,
      },
      {
        id: 'neural-network-architecture',
        title: 'Neural Network Architecture',
        category: 'Deep Learning',
        locked: true,
      },
      { id: 'training-data', title: 'Training Data', category: 'Machine Learning', locked: true },
    ],
    seoMetadata: {
      metaTitle: 'Neural Network Definition | AI/ML Glossary Pro',
      metaDescription:
        'Learn what a neural network is in artificial intelligence. Complete definition with examples, use cases, and related concepts. Free AI/ML glossary.',
      keywords: [
        'neural network',
        'artificial intelligence',
        'machine learning',
        'deep learning',
        'AI definition',
      ],
      canonicalUrl: '/sample/neural-network',
    },
  },
  {
    id: 'machine-learning',
    slug: 'machine-learning',
    title: 'Machine Learning',
    definition:
      'Machine Learning is a subset of artificial intelligence that enables computers to learn and improve from experience without being explicitly programmed. It uses algorithms to analyze data, identify patterns, and make predictions or decisions with minimal human intervention.',
    category: 'AI Fundamentals',
    complexity: 'Beginner',
    tags: ['AI', 'Machine Learning', 'Algorithms', 'Data Science', 'Automation'],
    examples: [
      'Email spam filters that automatically sort unwanted messages',
      'Recommendation systems on streaming platforms and e-commerce sites',
      'Navigation apps that find optimal routes and avoid traffic',
      'Virtual assistants like Siri, Alexa, and Google Assistant',
      'Credit card fraud detection systems',
    ],
    useCases: [
      'Customer service chatbots for 24/7 support',
      'Personalized marketing and content recommendations',
      'Predictive maintenance in manufacturing',
      'Medical diagnosis and treatment recommendations',
      'Automated trading in financial markets',
    ],
    relatedTerms: [
      {
        id: 'artificial-intelligence',
        title: 'Artificial Intelligence',
        category: 'AI Fundamentals',
        locked: true,
      },
      {
        id: 'supervised-learning',
        title: 'Supervised Learning',
        category: 'Machine Learning',
        locked: true,
      },
      {
        id: 'unsupervised-learning',
        title: 'Unsupervised Learning',
        category: 'Machine Learning',
        locked: true,
      },
      {
        id: 'reinforcement-learning',
        title: 'Reinforcement Learning',
        category: 'Machine Learning',
        locked: true,
      },
      { id: 'deep-learning', title: 'Deep Learning', category: 'Deep Learning', locked: true },
      { id: 'neural-network', title: 'Neural Network', category: 'Deep Learning', locked: true },
      { id: 'algorithm', title: 'Algorithm', category: 'Computer Science', locked: true },
      { id: 'data-mining', title: 'Data Mining', category: 'Data Science', locked: true },
      {
        id: 'pattern-recognition',
        title: 'Pattern Recognition',
        category: 'Machine Learning',
        locked: true,
      },
      {
        id: 'predictive-modeling',
        title: 'Predictive Modeling',
        category: 'Data Science',
        locked: true,
      },
    ],
    seoMetadata: {
      metaTitle: 'Machine Learning Definition | What is ML? | AI Glossary Pro',
      metaDescription:
        'Understand machine learning with our comprehensive definition. Learn how ML algorithms work, real-world examples, and applications. Start learning AI today.',
      keywords: [
        'machine learning',
        'ML definition',
        'artificial intelligence',
        'algorithms',
        'data science',
      ],
      canonicalUrl: '/sample/machine-learning',
    },
  },
  {
    id: 'artificial-intelligence',
    slug: 'artificial-intelligence',
    title: 'Artificial Intelligence',
    definition:
      'Artificial Intelligence (AI) refers to computer systems that can perform tasks typically requiring human intelligence, such as learning, reasoning, problem-solving, perception, and understanding language. AI enables machines to mimic cognitive functions and adapt to new situations.',
    category: 'AI Fundamentals',
    complexity: 'Beginner',
    tags: ['AI', 'Technology', 'Automation', 'Intelligence', 'Computing'],
    examples: [
      'Virtual assistants like Siri, Alexa, and Google Assistant',
      'Recommendation systems on streaming platforms and e-commerce sites',
      'Navigation apps that find optimal routes and avoid traffic',
      'Language translation tools like Google Translate',
      'Automated customer service chatbots',
    ],
    useCases: [
      'Healthcare diagnosis and treatment planning',
      'Autonomous vehicles and transportation',
      'Financial fraud detection and risk assessment',
      'Smart home automation and IoT devices',
      'Content creation and creative applications',
    ],
    relatedTerms: [
      {
        id: 'machine-learning',
        title: 'Machine Learning',
        category: 'AI Fundamentals',
        locked: true,
      },
      { id: 'deep-learning', title: 'Deep Learning', category: 'Deep Learning', locked: true },
      {
        id: 'natural-language-processing',
        title: 'Natural Language Processing',
        category: 'NLP',
        locked: true,
      },
      {
        id: 'computer-vision',
        title: 'Computer Vision',
        category: 'Computer Vision',
        locked: true,
      },
      { id: 'robotics', title: 'Robotics', category: 'Robotics', locked: true },
      { id: 'expert-systems', title: 'Expert Systems', category: 'AI Systems', locked: true },
      {
        id: 'cognitive-computing',
        title: 'Cognitive Computing',
        category: 'AI Fundamentals',
        locked: true,
      },
      {
        id: 'artificial-general-intelligence',
        title: 'Artificial General Intelligence',
        category: 'AI Theory',
        locked: true,
      },
      { id: 'narrow-ai', title: 'Narrow AI', category: 'AI Types', locked: true },
      { id: 'turing-test', title: 'Turing Test', category: 'AI Theory', locked: true },
    ],
    seoMetadata: {
      metaTitle: 'Artificial Intelligence (AI) Definition | Complete Guide | AI Glossary Pro',
      metaDescription:
        'What is Artificial Intelligence? Complete AI definition with examples, applications, and types. Learn about AI technology and its impact on society.',
      keywords: [
        'artificial intelligence',
        'AI definition',
        'AI technology',
        'machine intelligence',
        'AI applications',
      ],
      canonicalUrl: '/sample/artificial-intelligence',
    },
  },
  {
    id: 'deep-learning',
    slug: 'deep-learning',
    title: 'Deep Learning',
    definition:
      'Deep Learning is a subset of machine learning that uses neural networks with multiple layers (deep neural networks) to model and understand complex patterns in data. It automatically learns hierarchical representations without manual feature engineering.',
    category: 'Deep Learning',
    complexity: 'Intermediate',
    tags: ['Deep Learning', 'Neural Networks', 'AI', 'Machine Learning', 'Feature Learning'],
    examples: [
      'Image recognition systems that can identify thousands of objects and faces',
      'Large language models like GPT that generate human-like text',
      'Computer vision for autonomous vehicles',
      'Speech recognition and synthesis systems',
      'Medical image analysis for cancer detection',
    ],
    useCases: [
      'Natural language processing and chatbots',
      'Computer vision and image analysis',
      'Drug discovery and molecular research',
      'Financial trading and risk analysis',
      'Autonomous systems and robotics',
    ],
    relatedTerms: [
      { id: 'neural-network', title: 'Neural Network', category: 'Deep Learning', locked: true },
      {
        id: 'convolutional-neural-network',
        title: 'Convolutional Neural Network',
        category: 'Deep Learning',
        locked: true,
      },
      {
        id: 'recurrent-neural-network',
        title: 'Recurrent Neural Network',
        category: 'Deep Learning',
        locked: true,
      },
      { id: 'transformer', title: 'Transformer', category: 'Deep Learning', locked: true },
      { id: 'backpropagation', title: 'Backpropagation', category: 'Deep Learning', locked: true },
      { id: 'gradient-descent', title: 'Gradient Descent', category: 'Optimization', locked: true },
      {
        id: 'feature-learning',
        title: 'Feature Learning',
        category: 'Machine Learning',
        locked: true,
      },
      {
        id: 'representation-learning',
        title: 'Representation Learning',
        category: 'Machine Learning',
        locked: true,
      },
      {
        id: 'activation-function',
        title: 'Activation Function',
        category: 'Deep Learning',
        locked: true,
      },
      { id: 'regularization', title: 'Regularization', category: 'Machine Learning', locked: true },
    ],
    seoMetadata: {
      metaTitle: 'Deep Learning Definition | Neural Networks Explained | AI Glossary Pro',
      metaDescription:
        'Learn deep learning fundamentals: neural networks, layers, and applications. Comprehensive guide to deep learning with examples and use cases.',
      keywords: [
        'deep learning',
        'neural networks',
        'deep neural networks',
        'AI',
        'machine learning',
      ],
      canonicalUrl: '/sample/deep-learning',
    },
  },
  {
    id: 'natural-language-processing',
    slug: 'natural-language-processing',
    title: 'Natural Language Processing',
    definition:
      'Natural Language Processing (NLP) is a branch of artificial intelligence that focuses on the interaction between computers and human language. It enables machines to understand, interpret, generate, and respond to human language in a valuable way.',
    category: 'NLP',
    complexity: 'Intermediate',
    tags: ['NLP', 'Language', 'Text Processing', 'AI', 'Linguistics'],
    examples: [
      'Language translation services like Google Translate',
      'Chatbots and virtual assistants',
      'Sentiment analysis of social media posts',
      'Text summarization and document analysis',
      'Voice recognition and speech-to-text systems',
    ],
    useCases: [
      'Customer service automation and chatbots',
      'Content moderation on social platforms',
      'Document analysis and information extraction',
      'Market research and sentiment analysis',
      'Language learning applications',
    ],
    relatedTerms: [
      { id: 'text-mining', title: 'Text Mining', category: 'NLP', locked: true },
      { id: 'sentiment-analysis', title: 'Sentiment Analysis', category: 'NLP', locked: true },
      {
        id: 'named-entity-recognition',
        title: 'Named Entity Recognition',
        category: 'NLP',
        locked: true,
      },
      { id: 'machine-translation', title: 'Machine Translation', category: 'NLP', locked: true },
      { id: 'tokenization', title: 'Tokenization', category: 'NLP', locked: true },
      { id: 'language-model', title: 'Language Model', category: 'NLP', locked: true },
      { id: 'word-embedding', title: 'Word Embedding', category: 'NLP', locked: true },
      { id: 'speech-recognition', title: 'Speech Recognition', category: 'NLP', locked: true },
      { id: 'chatbot', title: 'Chatbot', category: 'AI Applications', locked: true },
      { id: 'text-classification', title: 'Text Classification', category: 'NLP', locked: true },
    ],
    seoMetadata: {
      metaTitle: 'Natural Language Processing (NLP) Definition | AI Language Understanding',
      metaDescription:
        'What is Natural Language Processing? Learn how NLP enables computers to understand human language. Examples, applications, and techniques explained.',
      keywords: [
        'natural language processing',
        'NLP',
        'text processing',
        'language AI',
        'computational linguistics',
      ],
      canonicalUrl: '/sample/natural-language-processing',
    },
  },
  {
    id: 'computer-vision',
    slug: 'computer-vision',
    title: 'Computer Vision',
    definition:
      'Computer Vision is a field of artificial intelligence that trains computers to interpret and understand visual information from the world. It enables machines to identify, analyze, and extract meaningful information from digital images and videos.',
    category: 'Computer Vision',
    complexity: 'Intermediate',
    tags: ['Computer Vision', 'Image Processing', 'AI', 'Visual Recognition', 'Machine Learning'],
    examples: [
      'Facial recognition systems for security and authentication',
      'Medical image analysis for diagnosing diseases',
      'Autonomous vehicle navigation and obstacle detection',
      'Quality control inspection in manufacturing',
      'Augmented reality applications and filters',
    ],
    useCases: [
      'Retail checkout automation and inventory management',
      'Sports analysis and performance tracking',
      'Agricultural monitoring and crop assessment',
      'Traffic monitoring and smart city applications',
      'Art and cultural heritage preservation',
    ],
    relatedTerms: [
      {
        id: 'image-recognition',
        title: 'Image Recognition',
        category: 'Computer Vision',
        locked: true,
      },
      {
        id: 'object-detection',
        title: 'Object Detection',
        category: 'Computer Vision',
        locked: true,
      },
      {
        id: 'facial-recognition',
        title: 'Facial Recognition',
        category: 'Computer Vision',
        locked: true,
      },
      {
        id: 'image-segmentation',
        title: 'Image Segmentation',
        category: 'Computer Vision',
        locked: true,
      },
      {
        id: 'optical-character-recognition',
        title: 'Optical Character Recognition',
        category: 'Computer Vision',
        locked: true,
      },
      {
        id: 'convolutional-neural-network',
        title: 'Convolutional Neural Network',
        category: 'Deep Learning',
        locked: true,
      },
      {
        id: 'feature-extraction',
        title: 'Feature Extraction',
        category: 'Machine Learning',
        locked: true,
      },
      {
        id: 'image-preprocessing',
        title: 'Image Preprocessing',
        category: 'Computer Vision',
        locked: true,
      },
      { id: 'edge-detection', title: 'Edge Detection', category: 'Computer Vision', locked: true },
      {
        id: 'pattern-recognition',
        title: 'Pattern Recognition',
        category: 'Machine Learning',
        locked: true,
      },
    ],
    seoMetadata: {
      metaTitle: 'Computer Vision Definition | AI Image Recognition Explained',
      metaDescription:
        'Learn computer vision fundamentals: how AI interprets images and videos. Applications, techniques, and real-world examples of visual AI.',
      keywords: [
        'computer vision',
        'image recognition',
        'visual AI',
        'image processing',
        'AI vision',
      ],
      canonicalUrl: '/sample/computer-vision',
    },
  },
  {
    id: 'reinforcement-learning',
    slug: 'reinforcement-learning',
    title: 'Reinforcement Learning',
    definition:
      'Reinforcement Learning is a machine learning paradigm where agents learn to make decisions by taking actions in an environment to maximize cumulative rewards. The agent learns through trial and error, receiving feedback in the form of rewards or penalties.',
    category: 'Machine Learning',
    complexity: 'Advanced',
    tags: ['Reinforcement Learning', 'AI', 'Decision Making', 'Optimization', 'Game Theory'],
    examples: [
      'Game-playing AI like AlphaGo and chess engines',
      'Autonomous vehicle navigation and decision-making',
      'Robot control and manipulation tasks',
      'Financial trading algorithms',
      'Recommendation systems optimization',
    ],
    useCases: [
      'Robotics and autonomous systems',
      'Resource allocation and scheduling',
      'Personalized education and adaptive learning',
      'Energy management and smart grids',
      'Drug discovery and molecular design',
    ],
    relatedTerms: [
      { id: 'q-learning', title: 'Q-Learning', category: 'Reinforcement Learning', locked: true },
      {
        id: 'policy-gradient',
        title: 'Policy Gradient',
        category: 'Reinforcement Learning',
        locked: true,
      },
      {
        id: 'markov-decision-process',
        title: 'Markov Decision Process',
        category: 'Reinforcement Learning',
        locked: true,
      },
      {
        id: 'reward-function',
        title: 'Reward Function',
        category: 'Reinforcement Learning',
        locked: true,
      },
      {
        id: 'exploration-exploitation',
        title: 'Exploration vs Exploitation',
        category: 'Reinforcement Learning',
        locked: true,
      },
      {
        id: 'temporal-difference',
        title: 'Temporal Difference Learning',
        category: 'Reinforcement Learning',
        locked: true,
      },
      {
        id: 'actor-critic',
        title: 'Actor-Critic',
        category: 'Reinforcement Learning',
        locked: true,
      },
      { id: 'deep-q-network', title: 'Deep Q-Network', category: 'Deep Learning', locked: true },
      {
        id: 'multi-agent-system',
        title: 'Multi-Agent System',
        category: 'AI Systems',
        locked: true,
      },
      { id: 'game-theory', title: 'Game Theory', category: 'Mathematics', locked: true },
    ],
    seoMetadata: {
      metaTitle: 'Reinforcement Learning Definition | AI Decision Making Explained',
      metaDescription:
        'What is reinforcement learning? Learn how AI agents learn through rewards and penalties. Applications in gaming, robotics, and autonomous systems.',
      keywords: [
        'reinforcement learning',
        'AI learning',
        'decision making',
        'reward learning',
        'agent-based learning',
      ],
      canonicalUrl: '/sample/reinforcement-learning',
    },
  },
  {
    id: 'transformer-architecture',
    slug: 'transformer-architecture',
    title: 'Transformer Architecture',
    definition:
      'The Transformer is a neural network architecture that revolutionized natural language processing by using self-attention mechanisms instead of recurrence or convolution. It enables parallel processing of sequences and has become the foundation for large language models like GPT and BERT.',
    category: 'Deep Learning',
    complexity: 'Advanced',
    tags: ['Transformers', 'Self-Attention', 'NLP', 'Deep Learning', 'Language Models'],
    examples: [
      'GPT models powering ChatGPT and other conversational AI',
      'BERT models used for search engine query understanding',
      'Machine translation systems like Google Translate',
      'Code generation tools like GitHub Copilot',
      'Vision Transformers for image classification',
    ],
    useCases: [
      'Large-scale language model training',
      'Document summarization and generation',
      'Multi-modal AI combining text and images',
      'Code analysis and programming assistance',
      'Scientific literature analysis',
    ],
    relatedTerms: [
      { id: 'self-attention', title: 'Self-Attention', category: 'Deep Learning', locked: true },
      {
        id: 'multi-head-attention',
        title: 'Multi-Head Attention',
        category: 'Deep Learning',
        locked: true,
      },
      {
        id: 'positional-encoding',
        title: 'Positional Encoding',
        category: 'Deep Learning',
        locked: true,
      },
      { id: 'bert', title: 'BERT', category: 'NLP', locked: true },
      { id: 'gpt', title: 'GPT', category: 'NLP', locked: true },
      { id: 'encoder-decoder', title: 'Encoder-Decoder', category: 'Deep Learning', locked: true },
      {
        id: 'attention-mechanism',
        title: 'Attention Mechanism',
        category: 'Deep Learning',
        locked: true,
      },
      {
        id: 'sequence-to-sequence',
        title: 'Sequence-to-Sequence',
        category: 'Deep Learning',
        locked: true,
      },
      { id: 'language-model', title: 'Language Model', category: 'NLP', locked: true },
      { id: 'pre-training', title: 'Pre-training', category: 'Machine Learning', locked: true },
    ],
    seoMetadata: {
      metaTitle: 'Transformer Architecture Definition | Self-Attention Neural Networks',
      metaDescription:
        'Learn about Transformer architecture: the foundation of GPT, BERT, and modern language models. How self-attention revolutionized AI.',
      keywords: [
        'transformer architecture',
        'self-attention',
        'neural networks',
        'language models',
        'NLP',
      ],
      canonicalUrl: '/sample/transformer-architecture',
    },
  },
  {
    id: 'gradient-descent',
    slug: 'gradient-descent',
    title: 'Gradient Descent',
    definition:
      'Gradient Descent is an optimization algorithm used to minimize the loss function in machine learning models by iteratively moving in the direction of steepest descent. It adjusts model parameters to find the optimal values that minimize prediction errors.',
    category: 'Optimization',
    complexity: 'Intermediate',
    tags: [
      'Optimization',
      'Machine Learning',
      'Training',
      'Algorithms',
      'Mathematical Optimization',
    ],
    examples: [
      'Training neural networks to minimize prediction errors',
      'Optimizing linear regression model coefficients',
      'Fine-tuning deep learning model parameters',
      'Adjusting weights in recommendation systems',
      'Optimizing hyperparameters in ML pipelines',
    ],
    useCases: [
      'Neural network training and optimization',
      'Linear and logistic regression parameter fitting',
      'Deep learning model convergence',
      'Cost function minimization in various ML algorithms',
      'Hyperparameter optimization and tuning',
    ],
    relatedTerms: [
      {
        id: 'stochastic-gradient-descent',
        title: 'Stochastic Gradient Descent',
        category: 'Optimization',
        locked: true,
      },
      { id: 'backpropagation', title: 'Backpropagation', category: 'Deep Learning', locked: true },
      { id: 'learning-rate', title: 'Learning Rate', category: 'Machine Learning', locked: true },
      { id: 'loss-function', title: 'Loss Function', category: 'Machine Learning', locked: true },
      { id: 'optimizer', title: 'Optimizer', category: 'Machine Learning', locked: true },
      { id: 'adam-optimizer', title: 'Adam Optimizer', category: 'Optimization', locked: true },
      { id: 'momentum', title: 'Momentum', category: 'Optimization', locked: true },
      { id: 'convergence', title: 'Convergence', category: 'Mathematics', locked: true },
      { id: 'local-minimum', title: 'Local Minimum', category: 'Optimization', locked: true },
      { id: 'global-minimum', title: 'Global Minimum', category: 'Optimization', locked: true },
    ],
    seoMetadata: {
      metaTitle: 'Gradient Descent Definition | ML Optimization Algorithm Explained',
      metaDescription:
        'What is gradient descent? Learn how this optimization algorithm trains machine learning models by minimizing loss functions. Examples and applications.',
      keywords: [
        'gradient descent',
        'optimization algorithm',
        'machine learning training',
        'loss function',
        'parameter optimization',
      ],
      canonicalUrl: '/sample/gradient-descent',
    },
  },
  {
    id: 'convolutional-neural-network',
    slug: 'convolutional-neural-network',
    title: 'Convolutional Neural Network',
    definition:
      'A Convolutional Neural Network (CNN) is a deep learning algorithm particularly effective for image recognition and computer vision tasks. It uses convolutional layers to detect features through filters and pooling layers to reduce dimensionality while preserving important information.',
    category: 'Deep Learning',
    complexity: 'Advanced',
    tags: ['CNN', 'Computer Vision', 'Deep Learning', 'Image Processing', 'Feature Detection'],
    examples: [
      'Image classification systems for photo tagging',
      'Medical image analysis for cancer detection',
      'Facial recognition in security systems',
      'Object detection in autonomous vehicles',
      'Quality control inspection in manufacturing',
    ],
    useCases: [
      'Medical imaging and diagnostic assistance',
      'Autonomous vehicle perception systems',
      'Satellite imagery analysis and mapping',
      'Retail visual search and recommendation',
      'Sports analysis and performance tracking',
    ],
    relatedTerms: [
      { id: 'convolution', title: 'Convolution', category: 'Deep Learning', locked: true },
      { id: 'pooling', title: 'Pooling', category: 'Deep Learning', locked: true },
      { id: 'filter', title: 'Filter', category: 'Computer Vision', locked: true },
      { id: 'feature-map', title: 'Feature Map', category: 'Deep Learning', locked: true },
      { id: 'stride', title: 'Stride', category: 'Deep Learning', locked: true },
      { id: 'padding', title: 'Padding', category: 'Deep Learning', locked: true },
      {
        id: 'activation-function',
        title: 'Activation Function',
        category: 'Deep Learning',
        locked: true,
      },
      { id: 'dropout', title: 'Dropout', category: 'Regularization', locked: true },
      {
        id: 'batch-normalization',
        title: 'Batch Normalization',
        category: 'Deep Learning',
        locked: true,
      },
      {
        id: 'transfer-learning',
        title: 'Transfer Learning',
        category: 'Machine Learning',
        locked: true,
      },
    ],
    seoMetadata: {
      metaTitle: 'Convolutional Neural Network (CNN) Definition | Deep Learning for Images',
      metaDescription:
        'Learn about CNNs: deep learning networks for image recognition and computer vision. How convolutional layers detect features in images.',
      keywords: [
        'convolutional neural network',
        'CNN',
        'image recognition',
        'computer vision',
        'deep learning',
      ],
      canonicalUrl: '/sample/convolutional-neural-network',
    },
  },
];

// Helper function to get a sample term by slug
export function getSampleTermBySlug(slug: string): SampleTerm | undefined {
  return SAMPLE_TERMS.find(term => term.slug === slug);
}

// Helper function to get all sample term slugs for routing
export function getSampleTermSlugs(): string[] {
  return SAMPLE_TERMS.map(term => term.slug);
}

// Helper function to get sample terms for sitemap generation
export function getSampleTermsForSitemap() {
  return SAMPLE_TERMS.map(term => ({
    url: `/sample/${term.slug}`,
    lastModified: new Date().toISOString(),
    changeFrequency: 'monthly' as const,
    priority: 0.8,
    ...term.seoMetadata,
  }));
}
