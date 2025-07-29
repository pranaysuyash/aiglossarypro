import type { Meta, StoryObj } from '@storybook/react';
import CodeBlock from './CodeBlock';

const CodeBlockDecorator = (Story: any, _context: any) => {
  return (
    <div className="w-full max-w-4xl">
      <Story />
    </div>
  );
};

const meta: Meta<typeof CodeBlock> = {
  title: 'Interactive/CodeBlock',
  component: CodeBlock,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'A sophisticated code block component with syntax highlighting, copy functionality, line numbers, and execution capabilities.',
      },
    },
  },
  decorators: [CodeBlockDecorator],
  args: {
    showLineNumbers: true,
    executable: false,
    maxHeight: '400px',
  },
  argTypes: {
    code: {
      control: { type: 'text' },
      description: 'The code content to display',
    },
    language: {
      control: { type: 'select' },
      options: [
        'javascript',
        'python',
        'typescript',
        'java',
        'cpp',
        'go',
        'rust',
        'html',
        'css',
        'json',
      ],
      description: 'Programming language for syntax highlighting',
    },
    title: {
      control: { type: 'text' },
      description: 'Optional title for the code block',
    },
    description: {
      control: { type: 'text' },
      description: 'Optional description explaining the code',
    },
    showLineNumbers: {
      control: { type: 'boolean' },
      description: 'Whether to show line numbers',
    },
    executable: {
      control: { type: 'boolean' },
      description: 'Whether the code can be executed (demo mode)',
    },
    maxHeight: {
      control: { type: 'text' },
      description: 'Maximum height before scrolling',
    },
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const JavaScript: Story = {
  args: {
    code: `// Simple neural network implementation
class NeuralNetwork {
  constructor(inputSize, hiddenSize, outputSize) {
    this.weights1 = this.randomMatrix(inputSize, hiddenSize);
    this.weights2 = this.randomMatrix(hiddenSize, outputSize);
    this.bias1 = new Array(hiddenSize).fill(0);
    this.bias2 = new Array(outputSize).fill(0);
  }

  randomMatrix(rows, cols) {
    return Array(rows).fill().map(() => 
      Array(cols).fill().map(() => Math.random() * 2 - 1)
    );
  }

  sigmoid(x) {
    return 1 / (1 + Math.exp(-x));
  }

  forward(input) {
    // Hidden layer
    const hidden = this.weights1[0].map((_, i) => {
      const sum = input.reduce((acc, val, j) => 
        acc + val * this.weights1[j][i], 0) + this.bias1[i];
      return this.sigmoid(sum);
    });

    // Output layer
    const output = this.weights2[0].map((_, i) => {
      const sum = hidden.reduce((acc, val, j) => 
        acc + val * this.weights2[j][i], 0) + this.bias2[i];
      return this.sigmoid(sum);
    });

    return output;
  }
}

// Example usage
const network = new NeuralNetwork(2, 4, 1);
const result = network.forward([0.5, 0.8]);
console.log('Prediction:', result[0]);`,
    language: 'javascript',
    title: 'Neural Network Implementation',
    description: 'A simple feedforward neural network with one hidden layer',
  },
  parameters: {
    docs: {
      description: {
        story: 'JavaScript code block with neural network implementation.',
      },
    },
  },
};

export const Python: Story = {
  args: {
    code: `import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import accuracy_score, classification_report

def train_sentiment_classifier(texts, labels):
    """
    Train a simple sentiment classification model
    
    Args:
        texts: List of text strings
        labels: List of sentiment labels (0=negative, 1=positive)
    
    Returns:
        Trained model and accuracy score
    """
    # Feature extraction (simplified - normally you'd use TF-IDF or embeddings)
    X = np.array([[len(text), text.count('good'), text.count('bad')] 
                  for text in texts])
    
    # Split data
    X_train, X_test, y_train, y_test = train_test_split(
        X, labels, test_size=0.2, random_state=42
    )
    
    # Train model
    model = LogisticRegression(random_state=42)
    model.fit(X_train, y_train)
    
    # Evaluate
    y_pred = model.predict(X_test)
    accuracy = accuracy_score(y_test, y_pred)
    
    print(f"Accuracy: {accuracy:.3f}")
    print("\\nClassification Report:")
    print(classification_report(y_test, y_pred))
    
    return model, accuracy

# Example usage
texts = ["This movie is great!", "Terrible acting", "Amazing plot twist"]
labels = [1, 0, 1]
model, acc = train_sentiment_classifier(texts, labels)`,
    language: 'python',
    title: 'Sentiment Analysis Classifier',
    description: 'A basic machine learning model for sentiment classification',
    executable: true,
  },
  parameters: {
    docs: {
      description: {
        story: 'Python code block with machine learning example and execution capability.',
      },
    },
  },
};

export const WithHighlighting: Story = {
  args: {
    code: `function gradientDescent(X, y, learningRate = 0.01, iterations = 1000) {
  let weights = new Array(X[0].length).fill(0);
  let bias = 0;
  const m = X.length;

  for (let i = 0; i < iterations; i++) {
    // Forward pass - compute predictions
    const predictions = X.map(row => 
      row.reduce((sum, x, j) => sum + x * weights[j], bias)
    );

    // Compute cost (mean squared error)
    const cost = predictions.reduce((sum, pred, idx) => 
      sum + Math.pow(pred - y[idx], 2), 0) / (2 * m);

    // Backward pass - compute gradients
    const dWeights = new Array(weights.length).fill(0);
    let dBias = 0;

    for (let j = 0; j < X.length; j++) {
      const error = predictions[j] - y[j];
      dBias += error;
      for (let k = 0; k < weights.length; k++) {
        dWeights[k] += error * X[j][k];
      }
    }

    // Update parameters
    for (let j = 0; j < weights.length; j++) {
      weights[j] -= learningRate * dWeights[j] / m;
    }
    bias -= learningRate * dBias / m;

    if (i % 100 === 0) {
      console.log(\`Iteration \${i}, Cost: \${cost.toFixed(4)}\`);
    }
  }

  return { weights, bias };
}`,
    language: 'javascript',
    title: 'Gradient Descent Algorithm',
    description: 'Implementation of gradient descent for linear regression',
    highlightLines: [7, 8, 9, 20, 21, 22, 23, 24, 25, 26],
  },
  parameters: {
    docs: {
      description: {
        story: 'Code block with specific lines highlighted to emphasize important sections.',
      },
    },
  },
};

export const SQL: Story = {
  args: {
    code: `-- Machine Learning Model Performance Analysis
WITH model_predictions AS (
  SELECT 
    model_id,
    prediction_date,
    actual_value,
    predicted_value,
    ABS(actual_value - predicted_value) as absolute_error,
    POWER(actual_value - predicted_value, 2) as squared_error
  FROM ml_predictions
  WHERE prediction_date >= '2024-01-01'
),

model_metrics AS (
  SELECT 
    model_id,
    COUNT(*) as total_predictions,
    AVG(absolute_error) as mae,
    SQRT(AVG(squared_error)) as rmse,
    CORR(actual_value, predicted_value) as correlation
  FROM model_predictions
  GROUP BY model_id
)

SELECT 
  m.model_id,
  m.total_predictions,
  ROUND(m.mae, 4) as mean_absolute_error,
  ROUND(m.rmse, 4) as root_mean_squared_error,
  ROUND(m.correlation, 4) as correlation_coefficient,
  CASE 
    WHEN m.correlation > 0.9 THEN 'Excellent'
    WHEN m.correlation > 0.8 THEN 'Good'
    WHEN m.correlation > 0.6 THEN 'Fair'
    ELSE 'Poor'
  END as model_quality
FROM model_metrics m
ORDER BY m.correlation DESC;`,
    language: 'sql',
    title: 'ML Model Performance Query',
    description: 'SQL query to analyze machine learning model performance metrics',
  },
  parameters: {
    docs: {
      description: {
        story: 'SQL code block for analyzing machine learning model performance.',
      },
    },
  },
};

export const ShortCode: Story = {
  args: {
    code: `const sigmoid = x => 1 / (1 + Math.exp(-x));
const relu = x => Math.max(0, x);
const softmax = arr => {
  const max = Math.max(...arr);
  const exp = arr.map(x => Math.exp(x - max));
  const sum = exp.reduce((a, b) => a + b);
  return exp.map(x => x / sum);
};`,
    language: 'javascript',
    title: 'Activation Functions',
    description: 'Common neural network activation functions',
  },
  parameters: {
    docs: {
      description: {
        story: 'Short code block that fits within the default height.',
      },
    },
  },
};

export const LongCode: Story = {
  args: {
    code: `import torch
import torch.nn as nn
import torch.optim as optim
from torch.utils.data import DataLoader, Dataset
import numpy as np

class TransformerBlock(nn.Module):
    def __init__(self, embed_dim, num_heads, ff_dim, dropout=0.1):
        super().__init__()
        self.attention = nn.MultiheadAttention(embed_dim, num_heads, dropout=dropout)
        self.norm1 = nn.LayerNorm(embed_dim)
        self.norm2 = nn.LayerNorm(embed_dim)
        
        self.ff = nn.Sequential(
            nn.Linear(embed_dim, ff_dim),
            nn.ReLU(),
            nn.Dropout(dropout),
            nn.Linear(ff_dim, embed_dim),
            nn.Dropout(dropout)
        )

    def forward(self, x):
        # Self-attention with residual connection
        attn_out, _ = self.attention(x, x, x)
        x = self.norm1(x + attn_out)
        
        # Feed-forward with residual connection
        ff_out = self.ff(x)
        x = self.norm2(x + ff_out)
        
        return x

class SimpleTransformer(nn.Module):
    def __init__(self, vocab_size, embed_dim, num_heads, ff_dim, num_layers, max_len, num_classes):
        super().__init__()
        self.embedding = nn.Embedding(vocab_size, embed_dim)
        self.pos_encoding = nn.Parameter(torch.randn(max_len, embed_dim))
        
        self.blocks = nn.ModuleList([
            TransformerBlock(embed_dim, num_heads, ff_dim)
            for _ in range(num_layers)
        ])
        
        self.norm = nn.LayerNorm(embed_dim)
        self.classifier = nn.Linear(embed_dim, num_classes)
        self.dropout = nn.Dropout(0.1)

    def forward(self, x):
        seq_len = x.size(1)
        
        # Embedding + positional encoding
        x = self.embedding(x) + self.pos_encoding[:seq_len]
        x = self.dropout(x)
        
        # Pass through transformer blocks
        for block in self.blocks:
            x = block(x)
        
        x = self.norm(x)
        
        # Global average pooling
        x = x.mean(dim=1)
        
        # Classification
        return self.classifier(x)

# Training function
def train_transformer(model, train_loader, val_loader, epochs=10):
    criterion = nn.CrossEntropyLoss()
    optimizer = optim.Adam(model.parameters(), lr=0.001)
    scheduler = optim.lr_scheduler.StepLR(optimizer, step_size=3, gamma=0.1)
    
    for epoch in range(epochs):
        model.train()
        total_loss = 0
        
        for batch_idx, (data, target) in enumerate(train_loader):
            optimizer.zero_grad()
            output = model(data)
            loss = criterion(output, target)
            loss.backward()
            
            # Gradient clipping
            torch.nn.utils.clip_grad_norm_(model.parameters(), max_norm=1.0)
            
            optimizer.step()
            total_loss += loss.item()
            
            if batch_idx % 100 == 0:
                print(f'Epoch {epoch}, Batch {batch_idx}, Loss: {loss.item():.4f}')
        
        # Validation
        model.eval()
        val_loss = 0
        correct = 0
        
        with torch.no_grad():
            for data, target in val_loader:
                output = model(data)
                val_loss += criterion(output, target).item()
                pred = output.argmax(dim=1)
                correct += pred.eq(target).sum().item()
        
        val_accuracy = correct / len(val_loader.dataset)
        print(f'Epoch {epoch}: Train Loss: {total_loss/len(train_loader):.4f}, '
              f'Val Loss: {val_loss/len(val_loader):.4f}, Val Acc: {val_accuracy:.4f}')
        
        scheduler.step()

# Example usage
if __name__ == "__main__":
    # Model parameters
    vocab_size = 10000
    embed_dim = 512
    num_heads = 8
    ff_dim = 2048
    num_layers = 6
    max_len = 512
    num_classes = 10
    
    # Initialize model
    model = SimpleTransformer(vocab_size, embed_dim, num_heads, ff_dim, 
                            num_layers, max_len, num_classes)
    
    print(f"Model has {sum(p.numel() for p in model.parameters())} parameters")`,
    language: 'python',
    title: 'Transformer Model Implementation',
    description: 'Complete transformer implementation in PyTorch with training loop',
  },
  parameters: {
    docs: {
      description: {
        story: 'Long code block that demonstrates expansion/collapse functionality.',
      },
    },
  },
};

export const JSON: Story = {
  args: {
    code: `{
  "model_config": {
    "architecture": "transformer",
    "num_layers": 12,
    "hidden_size": 768,
    "num_attention_heads": 12,
    "intermediate_size": 3072,
    "activation": "gelu",
    "dropout": 0.1,
    "max_position_embeddings": 512,
    "vocab_size": 50257
  },
  "training_config": {
    "learning_rate": 2e-5,
    "batch_size": 16,
    "epochs": 3,
    "warmup_steps": 500,
    "weight_decay": 0.01,
    "gradient_clipping": 1.0
  },
  "dataset": {
    "name": "ai_ml_corpus",
    "train_size": 50000,
    "validation_size": 5000,
    "test_size": 5000,
    "preprocessing": {
      "tokenizer": "bert-base-uncased",
      "max_length": 512,
      "padding": "max_length",
      "truncation": true
    }
  },
  "evaluation_metrics": {
    "accuracy": 0.94,
    "precision": 0.93,
    "recall": 0.95,
    "f1_score": 0.94,
    "confusion_matrix": [
      [850, 150],
      [100, 900]
    ]
  }
}`,
    language: 'json',
    title: 'ML Model Configuration',
    description: 'Configuration file for a machine learning model training pipeline',
  },
  parameters: {
    docs: {
      description: {
        story: 'JSON configuration file with machine learning parameters.',
      },
    },
  },
};

export const NoLineNumbers: Story = {
  args: {
    code: `# Quick data analysis
import pandas as pd
import matplotlib.pyplot as plt

df = pd.read_csv('data.csv')
df.describe()
df.plot()
plt.show()`,
    language: 'python',
    title: 'Quick Analysis',
    description: 'Simple data analysis script',
    showLineNumbers: false,
  },
  parameters: {
    docs: {
      description: {
        story: 'Code block without line numbers for cleaner appearance.',
      },
    },
  },
};

export const ExecutableCode: Story = {
  args: {
    code: `function calculateAccuracy(predictions, labels) {
  if (predictions.length !== labels.length) {
    throw new Error('Arrays must have the same length');
  }
  
  let correct = 0;
  for (let i = 0; i < predictions.length; i++) {
    if (predictions[i] === labels[i]) {
      correct++;
    }
  }
  
  return correct / predictions.length;
}

// Test the function
const preds = [1, 0, 1, 1, 0, 1, 0];
const labels = [1, 0, 1, 0, 0, 1, 0];
const accuracy = calculateAccuracy(preds, labels);
console.log(\`Accuracy: \${accuracy.toFixed(3)}\`);`,
    language: 'javascript',
    title: 'Accuracy Calculator',
    description: 'Function to calculate classification accuracy',
    executable: true,
  },
  parameters: {
    docs: {
      description: {
        story: 'Executable code block with run button and output display.',
      },
    },
  },
};

export const MultipleLanguages: Story = {
  render: () => (
    <div className="space-y-6">
      <CodeBlock
        code={`def sigmoid(x):
    return 1 / (1 + np.exp(-x))

def neural_network(X, weights):
    return sigmoid(np.dot(X, weights))`}
        language="python"
        title="Python Implementation"
        showLineNumbers={false}
      />

      <CodeBlock
        code={`function sigmoid(x) {
  return 1 / (1 + Math.exp(-x));
}

function neuralNetwork(X, weights) {
  return sigmoid(X.reduce((sum, x, i) => sum + x * weights[i], 0));
}`}
        language="javascript"
        title="JavaScript Implementation"
        showLineNumbers={false}
      />

      <CodeBlock
        code={`public static double sigmoid(double x) {
    return 1.0 / (1.0 + Math.exp(-x));
}

public static double neuralNetwork(double[] X, double[] weights) {
    double sum = 0;
    for (int i = 0; i < X.length; i++) {
        sum += X[i] * weights[i];
    }
    return sigmoid(sum);
}`}
        language="java"
        title="Java Implementation"
        showLineNumbers={false}
      />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Comparison of the same algorithm implemented in different programming languages.',
      },
    },
  },
};

export const CustomStyling: Story = {
  args: {
    code: `const aiQuote = "The question of whether a computer can think is no more interesting than the question of whether a submarine can swim.";
console.log(aiQuote);`,
    language: 'javascript',
    title: 'AI Quote',
    description: 'Famous quote about artificial intelligence',
    className: 'border-purple-200 shadow-lg',
  },
  parameters: {
    docs: {
      description: {
        story: 'Code block with custom styling applied.',
      },
    },
  },
};

export const InteractiveDemo: Story = {
  render: () => {
    const [selectedLanguage, setSelectedLanguage] = React.useState('python');
    const [showExecutable, setShowExecutable] = React.useState(false);

    const codeExamples = {
      python: `import numpy as np
from sklearn.cluster import KMeans

# Generate sample data
X = np.random.rand(100, 2)

# Apply K-means clustering
kmeans = KMeans(n_clusters=3, random_state=42)
labels = kmeans.fit_predict(X)

print(f"Cluster centers: {kmeans.cluster_centers_}")`,
      javascript: `// K-means clustering implementation
function kMeans(data, k) {
  // Initialize centroids randomly
  let centroids = data.slice(0, k);
  
  for (let iter = 0; iter < 100; iter++) {
    // Assign points to clusters
    const clusters = Array(k).fill().map(() => []);
    
    data.forEach(point => {
      let minDist = Infinity;
      let cluster = 0;
      
      centroids.forEach((centroid, i) => {
        const dist = distance(point, centroid);
        if (dist < minDist) {
          minDist = dist;
          cluster = i;
        }
      });
      
      clusters[cluster].push(point);
    });
    
    // Update centroids
    centroids = clusters.map(cluster => {
      if (cluster.length === 0) return [0, 0];
      return [
        cluster.reduce((sum, p) => sum + p[0], 0) / cluster.length,
        cluster.reduce((sum, p) => sum + p[1], 0) / cluster.length
      ];
    });
  }
  
  return centroids;
}`,
      java: `import java.util.*;

public class KMeans {
    public static void main(String[] args) {
        double[][] data = generateRandomData(100, 2);
        int k = 3;
        
        double[][] centroids = kMeans(data, k);
        
        System.out.println("Cluster centroids:");
        for (double[] centroid : centroids) {
            System.out.println(Arrays.toString(centroid));
        }
    }
    
    public static double[][] kMeans(double[][] data, int k) {
        // Implementation details...
        return new double[k][2];
    }
}`,
    };

    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-4">
          <label className="font-medium">Language:</label>
          <select
            value={selectedLanguage}
            onChange={e => setSelectedLanguage(e.target.value)}
            className="px-3 py-1 border rounded"
          >
            <option value="python">Python</option>
            <option value="javascript">JavaScript</option>
            <option value="java">Java</option>
          </select>

          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={showExecutable}
              onChange={e => setShowExecutable(e.target.checked)}
            />
            <span>Make executable</span>
          </label>
        </div>

        <CodeBlock
          code={codeExamples[selectedLanguage as keyof typeof codeExamples]}
          language={selectedLanguage}
          title={`K-Means Clustering (${selectedLanguage.charAt(0).toUpperCase() + selectedLanguage.slice(1)})`}
          description="Machine learning clustering algorithm implementation"
          executable={showExecutable}
        />
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story:
          'Interactive demo allowing users to switch between languages and toggle executable mode.',
      },
    },
  },
};

export const DarkMode: Story = {
  parameters: {
    theme: 'dark',
    backgrounds: {
      default: 'dark',
    },
    docs: {
      description: {
        story: 'Code block in dark mode theme.',
      },
    },
  },
  render: args => (
    <div className="dark bg-gray-900 p-6 rounded-lg">
      <CodeBlock {...args} />
    </div>
  ),
};
