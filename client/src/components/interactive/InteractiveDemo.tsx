import { useCallback, useMemo, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BookOpen, Brain, Code, Lightbulb, Search, Sparkles } from '@/components/ui/icons';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import CodeBlock from './CodeBlock';

// Demo term interface
interface DemoTerm {
  id: string;
  name: string;
  category: string;
  technicalDefinition: string;
  plainEnglishExplanation: string;
  codeExample?: {
    language: string;
    code: string;
    description: string;
  };
  useCases: string[];
  relatedTerms: string[];
  keywords: string[];
}

// High-quality demo terms
const DEMO_TERMS: DemoTerm[] = [
  {
    id: 'neural-network',
    name: 'Neural Network',
    category: 'Deep Learning',
    technicalDefinition:
      'A computational model inspired by biological neural networks, consisting of interconnected nodes (neurons) organized in layers that process information through weighted connections and activation functions.',
    plainEnglishExplanation:
      'Think of a neural network like a simplified version of how your brain processes information. It\'s made up of artificial "neurons" that work together to recognize patterns, make predictions, or solve problems by learning from examples.',
    codeExample: {
      language: 'python',
      code: `import numpy as np
from sklearn.neural_network import MLPClassifier
from sklearn.datasets import make_classification
from sklearn.model_selection import train_test_split

# Create sample data
X, y = make_classification(n_samples=1000, n_features=20, n_classes=2, random_state=42)
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

# Create and train a neural network
neural_net = MLPClassifier(
    hidden_layer_sizes=(100, 50),  # Two hidden layers
    activation='relu',             # Activation function
    solver='adam',                 # Optimizer
    max_iter=1000,
    random_state=42
)

# Train the model
neural_net.fit(X_train, y_train)

# Make predictions
accuracy = neural_net.score(X_test, y_test)
print(f"Neural Network Accuracy: {accuracy:.3f}")`,
      description:
        'A simple neural network implementation using scikit-learn for binary classification.',
    },
    useCases: [
      'Image recognition and computer vision',
      'Natural language processing and translation',
      'Recommendation systems',
      'Medical diagnosis and drug discovery',
      'Autonomous vehicles and robotics',
    ],
    relatedTerms: ['Deep Learning', 'Backpropagation', 'Activation Function', 'Gradient Descent'],
    keywords: [
      'neural',
      'network',
      'neurons',
      'layers',
      'deep learning',
      'artificial intelligence',
      'machine learning',
    ],
  },
  {
    id: 'transformer',
    name: 'Transformer',
    category: 'Natural Language Processing',
    technicalDefinition:
      'A neural network architecture that relies entirely on attention mechanisms to draw global dependencies between input and output, eliminating the need for recurrence and convolutions entirely.',
    plainEnglishExplanation:
      'Transformers are like super-smart reading comprehension systems. They can look at all parts of a sentence at once and understand how each word relates to every other word, making them excellent at understanding context and meaning in language.',
    codeExample: {
      language: 'python',
      code: `from transformers import AutoTokenizer, AutoModel
import torch

# Load a pre-trained transformer model (BERT)
model_name = "bert-base-uncased"
tokenizer = AutoTokenizer.from_pretrained(model_name)
model = AutoModel.from_pretrained(model_name)

# Example text
text = "Transformers revolutionized natural language processing"

# Tokenize and encode the text
inputs = tokenizer(text, return_tensors="pt", padding=True, truncation=True)

# Get the model output
with torch.no_grad():
    outputs = model(**inputs)
    
# Extract embeddings (hidden states)
embeddings = outputs.last_hidden_state
print(f"Text: {text}")
print(f"Embedding shape: {embeddings.shape}")
print(f"Each word is represented by a {embeddings.shape[-1]}-dimensional vector")`,
      description: 'Using a pre-trained BERT transformer to generate contextual word embeddings.',
    },
    useCases: [
      'Language translation (Google Translate)',
      'Text summarization and generation',
      'Question answering systems',
      'Chatbots and virtual assistants (ChatGPT, GPT-4)',
      'Code generation and completion',
    ],
    relatedTerms: ['Attention Mechanism', 'BERT', 'GPT', 'Self-Attention', 'Positional Encoding'],
    keywords: [
      'transformer',
      'attention',
      'bert',
      'gpt',
      'nlp',
      'language model',
      'self-attention',
    ],
  },
  {
    id: 'gradient-descent',
    name: 'Gradient Descent',
    category: 'Optimization',
    technicalDefinition:
      'An iterative optimization algorithm used to minimize a function by moving in the direction of steepest descent as defined by the negative of the gradient.',
    plainEnglishExplanation:
      "Imagine you're lost in the mountains at night and want to get to the bottom of the valley. Gradient descent is like feeling the slope of the ground with your feet and always stepping in the direction that goes downhill the steepest. Eventually, you'll reach the bottom.",
    codeExample: {
      language: 'python',
      code: `import numpy as np
import matplotlib.pyplot as plt

def cost_function(x):
    """Simple quadratic function: f(x) = x^2 + 2x + 1"""
    return x**2 + 2*x + 1

def gradient(x):
    """Derivative of the cost function: f'(x) = 2x + 2"""
    return 2*x + 2

# Gradient descent implementation
def gradient_descent(starting_point, learning_rate, num_iterations):
    x = starting_point
    history = [x]
    
    for i in range(num_iterations):
        # Calculate gradient at current point
        grad = gradient(x)
        
        # Update x by moving in opposite direction of gradient
        x = x - learning_rate * grad
        history.append(x)
        
        print(f"Iteration {i+1}: x = {x:.4f}, cost = {cost_function(x):.4f}")
    
    return x, history

# Run gradient descent
final_x, path = gradient_descent(starting_point=5.0, learning_rate=0.1, num_iterations=10)
print(f"\\nMinimum found at x = {final_x:.4f}")
print(f"Minimum cost = {cost_function(final_x):.4f}")`,
      description:
        'A simple implementation of gradient descent to find the minimum of a quadratic function.',
    },
    useCases: [
      'Training neural networks and deep learning models',
      'Linear and logistic regression',
      'Support vector machines',
      'Recommendation system optimization',
      'Computer vision model training',
    ],
    relatedTerms: [
      'Backpropagation',
      'Learning Rate',
      'Stochastic Gradient Descent',
      'Optimization',
      'Loss Function',
    ],
    keywords: [
      'gradient',
      'descent',
      'optimization',
      'minimize',
      'learning rate',
      'convergence',
      'derivative',
    ],
  },
  {
    id: 'reinforcement-learning',
    name: 'Reinforcement Learning',
    category: 'Machine Learning',
    technicalDefinition:
      'A type of machine learning where an agent learns to make decisions by performing actions in an environment to maximize cumulative reward through trial and error.',
    plainEnglishExplanation:
      'Reinforcement learning is like training a pet with treats. The AI agent tries different actions, gets rewards for good choices and penalties for bad ones, and gradually learns the best strategy to maximize its rewards over time.',
    codeExample: {
      language: 'python',
      code: `import numpy as np
import random

class SimpleQLearning:
    def __init__(self, states, actions, learning_rate=0.1, discount_factor=0.9):
        self.states = states
        self.actions = actions
        self.lr = learning_rate
        self.gamma = discount_factor
        # Initialize Q-table with zeros
        self.q_table = np.zeros((states, actions))
    
    def choose_action(self, state, epsilon=0.1):
        """Choose action using epsilon-greedy strategy"""
        if random.random() < epsilon:
            return random.randint(0, self.actions - 1)  # Explore
        else:
            return np.argmax(self.q_table[state])  # Exploit
    
    def update_q_value(self, state, action, reward, next_state):
        """Update Q-value using Q-learning formula"""
        current_q = self.q_table[state, action]
        max_next_q = np.max(self.q_table[next_state])
        
        # Q-learning update rule
        new_q = current_q + self.lr * (reward + self.gamma * max_next_q - current_q)
        self.q_table[state, action] = new_q

# Example: Simple grid world
agent = SimpleQLearning(states=10, actions=4)  # 10 states, 4 actions (up, down, left, right)

# Training loop example
for episode in range(1000):
    state = 0  # Start state
    for step in range(100):
        action = agent.choose_action(state)
        # Simulate environment response (reward and next state)
        next_state = (state + action) % 10
        reward = 1 if next_state == 9 else -0.1  # Reward for reaching goal
        
        agent.update_q_value(state, action, reward, next_state)
        state = next_state
        
        if next_state == 9:  # Reached goal
            break

print("Training completed! Q-table learned optimal policy.")`,
      description:
        'A basic Q-learning implementation for a simple environment where an agent learns to reach a goal.',
    },
    useCases: [
      'Game AI (AlphaGo, chess engines, video game NPCs)',
      'Autonomous vehicles and robotics',
      'Trading algorithms and financial optimization',
      'Resource allocation and scheduling',
      'Personalized recommendation systems',
    ],
    relatedTerms: [
      'Q-Learning',
      'Policy Gradient',
      'Markov Decision Process',
      'Exploration vs Exploitation',
      'Reward Function',
    ],
    keywords: [
      'reinforcement',
      'learning',
      'agent',
      'environment',
      'reward',
      'policy',
      'q-learning',
      'exploration',
    ],
  },
  {
    id: 'convolutional-neural-network',
    name: 'Convolutional Neural Network (CNN)',
    category: 'Computer Vision',
    technicalDefinition:
      'A class of deep neural networks most commonly applied to analyzing visual imagery, using convolution operations to detect local features through learnable filters and pooling layers for spatial dimensionality reduction.',
    plainEnglishExplanation:
      'CNNs are like digital eyes that can "see" and understand images. They work by looking at small parts of an image at a time (like focusing on edges, shapes, or textures) and gradually building up an understanding of what the whole image contains.',
    codeExample: {
      language: 'python',
      code: `import tensorflow as tf
from tensorflow.keras import layers, models
from tensorflow.keras.datasets import cifar10
from tensorflow.keras.utils import to_categorical

# Load and preprocess CIFAR-10 dataset
(x_train, y_train), (x_test, y_test) = cifar10.load_data()
x_train = x_train.astype('float32') / 255.0
x_test = x_test.astype('float32') / 255.0
y_train = to_categorical(y_train, 10)
y_test = to_categorical(y_test, 10)

# Build CNN model
model = models.Sequential([
    # First convolutional block
    layers.Conv2D(32, (3, 3), activation='relu', input_shape=(32, 32, 3)),
    layers.MaxPooling2D((2, 2)),
    
    # Second convolutional block
    layers.Conv2D(64, (3, 3), activation='relu'),
    layers.MaxPooling2D((2, 2)),
    
    # Third convolutional block
    layers.Conv2D(64, (3, 3), activation='relu'),
    
    # Dense layers for classification
    layers.Flatten(),
    layers.Dense(64, activation='relu'),
    layers.Dense(10, activation='softmax')  # 10 classes in CIFAR-10
])

# Compile the model
model.compile(
    optimizer='adam',
    loss='categorical_crossentropy',
    metrics=['accuracy']
)

# Display model architecture
model.summary()

# Train the model (uncomment to run)
# history = model.fit(x_train, y_train, epochs=10, validation_data=(x_test, y_test))`,
      description:
        'A CNN implementation using TensorFlow/Keras for image classification on the CIFAR-10 dataset.',
    },
    useCases: [
      'Image classification and object detection',
      'Medical image analysis (X-rays, MRIs)',
      'Facial recognition and biometric systems',
      'Autonomous vehicle vision systems',
      'Quality control in manufacturing',
    ],
    relatedTerms: ['Computer Vision', 'Convolution', 'Pooling', 'Feature Maps', 'Deep Learning'],
    keywords: [
      'cnn',
      'convolutional',
      'computer vision',
      'image',
      'convolution',
      'pooling',
      'feature detection',
    ],
  },
];

interface InteractiveDemoProps {
  className?: string | undefined;
}

export default function InteractiveDemo({ className }: InteractiveDemoProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTerm, setSelectedTerm] = useState<DemoTerm | null>(null);

  // Filter terms based on search query
  const filteredTerms = useMemo(() => {
    if (!searchQuery.trim()) {return DEMO_TERMS;}

    const query = searchQuery.toLowerCase();
    return DEMO_TERMS.filter(
      term =>
        term.name.toLowerCase().includes(query) ||
        term.category.toLowerCase().includes(query) ||
        term.technicalDefinition.toLowerCase().includes(query) ||
        term.plainEnglishExplanation.toLowerCase().includes(query) ||
        term.keywords.some(keyword => keyword.includes(query)) ||
        term.useCases.some(useCase => useCase.toLowerCase().includes(query))
    );
  }, [searchQuery]);

  // Highlight matching text
  const highlightText = useCallback((text: string, query: string) => {
    if (!query.trim()) {return text;}

    const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    const parts = text.split(regex);

    return parts.map((part, index) =>
      regex.test(part) ? (
        <mark key={index} className="bg-yellow-200 dark:bg-yellow-800 px-1 rounded">
          {part}
        </mark>
      ) : (
        part
      )
    );
  }, []);

  const handleTermSelect = (term: DemoTerm) => {
    setSelectedTerm(term);
  };

  const handleBackToList = () => {
    setSelectedTerm(null);
  };

  // Mobile-friendly term card component
  const TermCard = ({ term }: { term: DemoTerm }) => (
    <Card
      className="cursor-pointer transition-all duration-200 hover:shadow-lg hover:scale-[1.02] active:scale-[0.98]"
      onClick={() => handleTermSelect(term)}
    >
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold">
            {highlightText(term.name, searchQuery)}
          </CardTitle>
          <Badge variant="secondary" className="text-xs">
            {term.category}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-3 mb-3">
          {highlightText(term.plainEnglishExplanation, searchQuery)}
        </p>
        <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
          <Brain className="w-3 h-3" />
          <span>{term.useCases.length} use cases</span>
          {term.codeExample && (
            <>
              <Code className="w-3 h-3 ml-2" />
              <span>Code example</span>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );

  // Term detail view
  const TermDetail = ({ term }: { term: DemoTerm }) => (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" onClick={handleBackToList} className="flex-shrink-0">
          ← Back to Demo
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">{term.name}</h1>
          <Badge variant="secondary" className="mt-1">
            {term.category}
          </Badge>
        </div>
      </div>

      {/* Technical Definition */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="w-5 h-5" />
            Technical Definition
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-700 dark:text-gray-300">{term.technicalDefinition}</p>
        </CardContent>
      </Card>

      {/* Plain English Explanation */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lightbulb className="w-5 h-5" />
            Plain English Explanation
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-700 dark:text-gray-300">{term.plainEnglishExplanation}</p>
        </CardContent>
      </Card>

      {/* Code Example */}
      {term.codeExample && (
        <CodeBlock
          code={term.codeExample.code}
          language={term.codeExample.language}
          title="Code Example"
          description={term.codeExample.description}
          executable={false}
        />
      )}

      {/* Use Cases */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5" />
            Real-World Use Cases
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2">
            {term.useCases.map((useCase, index) => (
              <li key={index} className="flex items-start gap-2">
                <span className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0" />
                <span className="text-gray-700 dark:text-gray-300">{useCase}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      {/* Related Terms */}
      <Card>
        <CardHeader>
          <CardTitle>Related Terms</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {term.relatedTerms.map((relatedTerm, index) => (
              <Badge key={index} variant="outline" className="text-xs">
                {relatedTerm}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  return (
    <div className={cn('w-full max-w-6xl mx-auto p-4', className)}>
      {selectedTerm ? (
        <TermDetail term={selectedTerm} />
      ) : (
        <>
          {/* Header */}
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold mb-2">Interactive AI Glossary Demo</h2>
            <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              Explore our comprehensive AI/ML glossary with detailed explanations, code examples,
              and real-world use cases. Try searching for any term or concept to see how our search
              works.
            </p>
          </div>

          {/* Search Bar */}
          <div className="relative mb-8 max-w-md mx-auto">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              type="text"
              placeholder="Search AI/ML terms..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-3 text-lg"
            />
          </div>

          {/* Results Count */}
          {searchQuery && (
            <div className="text-center mb-6">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Found {filteredTerms.length} result{filteredTerms.length !== 1 ? 's' : ''} for "
                {searchQuery}"
              </p>
            </div>
          )}

          {/* Terms Grid */}
          {filteredTerms.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredTerms.map(term => (
                <TermCard key={term.id} term={term} />
              ))}
            </div>
          ) : (
            /* No Results State */
            <Card className="text-center py-12">
              <CardContent>
                <Search className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No results found</h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  We couldn't find any terms matching "{searchQuery}". Try searching for:
                </p>
                <div className="flex flex-wrap justify-center gap-2">
                  {['neural network', 'transformer', 'machine learning', 'deep learning', 'AI'].map(
                    suggestion => (
                      <Button
                        key={suggestion}
                        variant="outline"
                        size="sm"
                        onClick={() => setSearchQuery(suggestion)}
                      >
                        {suggestion}
                      </Button>
                    )
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Call to Action */}
          {!searchQuery && (
            <div className="mt-12 text-center">
              <Card className="max-w-lg mx-auto">
                <CardContent className="pt-6">
                  <h3 className="text-lg font-semibold mb-2">Discover More</h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-4">
                    This demo shows just 5 terms. Our full glossary contains thousands of AI/ML
                    concepts with detailed explanations, code examples, and interactive elements.
                  </p>
                  <Button className="w-full">Explore Full Glossary</Button>
                </CardContent>
              </Card>
            </div>
          )}
        </>
      )}
    </div>
  );
}
