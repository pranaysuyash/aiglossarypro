#!/usr/bin/env tsx
/**
 * Seed Sample Data Script
 * Creates sample learning paths and code examples for testing the new features
 */
import { db } from '../server/db';
import { categories, codeExamples, learningPathSteps, learningPaths, terms, } from '../shared/schema';
async function main() {
    console.log('🌱 Starting sample data seeding...');
    try {
        // Get some existing categories and terms
        const existingCategories = await db.select().from(categories).limit(10);
        const existingTerms = await db.select({ id: terms.id, name: terms.name }).from(terms).limit(20);
        if (existingCategories.length === 0 || existingTerms.length === 0) {
            console.error('❌ No existing categories or terms found. Please ensure the database has base data.');
            process.exit(1);
        }
        console.log(`📊 Found ${existingCategories.length} categories and ${existingTerms.length} terms`);
        // Create sample learning paths
        console.log('📚 Creating sample learning paths...');
        const sampleLearningPaths = [
            {
                name: 'Machine Learning Fundamentals',
                description: 'A comprehensive introduction to machine learning concepts and algorithms',
                difficulty_level: 'beginner',
                estimated_duration: 480, // 8 hours
                category_id: existingCategories[0]?.id,
                prerequisites: ['Basic Statistics', 'Linear Algebra'],
                learning_objectives: [
                    'Understand supervised vs unsupervised learning',
                    'Implement basic algorithms',
                    'Evaluate model performance',
                ],
                is_official: true,
                is_published: true,
                view_count: 1250,
                completion_count: 180,
                rating: 450, // 4.5 stars
            },
            {
                name: 'Deep Learning with Neural Networks',
                description: 'Dive deep into neural networks and deep learning architectures',
                difficulty_level: 'intermediate',
                estimated_duration: 720, // 12 hours
                category_id: existingCategories[1]?.id,
                prerequisites: ['Machine Learning Basics', 'Python Programming'],
                learning_objectives: [
                    'Build neural networks from scratch',
                    'Understand backpropagation',
                    'Work with CNNs and RNNs',
                ],
                is_official: true,
                is_published: true,
                view_count: 890,
                completion_count: 95,
                rating: 470, // 4.7 stars
            },
            {
                name: 'Natural Language Processing Essentials',
                description: 'Learn to process and analyze text data using modern NLP techniques',
                difficulty_level: 'intermediate',
                estimated_duration: 600, // 10 hours
                category_id: existingCategories[2]?.id,
                prerequisites: ['Python', 'Machine Learning Fundamentals'],
                learning_objectives: [
                    'Preprocess text data',
                    'Build sentiment analysis models',
                    'Understand transformers and BERT',
                ],
                is_official: false,
                is_published: true,
                view_count: 567,
                completion_count: 42,
                rating: 420, // 4.2 stars
            },
            {
                name: 'Computer Vision Basics',
                description: 'Introduction to image processing and computer vision techniques',
                difficulty_level: 'beginner',
                estimated_duration: 540, // 9 hours
                category_id: existingCategories[3]?.id,
                prerequisites: ['Python Programming', 'Linear Algebra'],
                learning_objectives: [
                    'Process and manipulate images',
                    'Implement edge detection',
                    'Build image classifiers',
                ],
                is_official: true,
                is_published: true,
                view_count: 723,
                completion_count: 67,
                rating: 440, // 4.4 stars
            },
            {
                name: 'Reinforcement Learning Fundamentals',
                description: 'Learn about agents, environments, and reward-based learning',
                difficulty_level: 'advanced',
                estimated_duration: 840, // 14 hours
                category_id: existingCategories[4]?.id,
                prerequisites: ['Machine Learning', 'Probability Theory', 'Dynamic Programming'],
                learning_objectives: [
                    'Understand Markov Decision Processes',
                    'Implement Q-learning',
                    'Build game-playing agents',
                ],
                is_official: false,
                is_published: true,
                view_count: 234,
                completion_count: 18,
                rating: 480, // 4.8 stars
            },
        ];
        // Insert learning paths
        const insertedPaths = await db.insert(learningPaths).values(sampleLearningPaths).returning();
        console.log(`✅ Created ${insertedPaths.length} learning paths`);
        // Create learning path steps for each path
        console.log('📖 Creating learning path steps...');
        for (let i = 0; i < insertedPaths.length; i++) {
            const path = insertedPaths[i];
            const stepCount = Math.min(5 + i, existingTerms.length); // Varying step counts
            const steps = [];
            for (let j = 0; j < stepCount; j++) {
                if (existingTerms[j]) {
                    steps.push({
                        learning_path_id: path.id,
                        term_id: existingTerms[j].id,
                        step_order: j + 1,
                        is_optional: j > 2, // First 3 steps are required
                        estimated_time: 45 + j * 15, // Increasing time per step
                        step_type: j === stepCount - 1 ? 'assessment' : j % 3 === 2 ? 'practice' : 'concept',
                        content: {
                            description: `Learn about ${existingTerms[j].name}`,
                            resources: [`https://example.com/resource-${j}`],
                            exercises: j % 3 === 2 ? [`Practice exercise for ${existingTerms[j].name}`] : [],
                        },
                    });
                }
            }
            await db.insert(learningPathSteps).values(steps);
        }
        console.log('✅ Created learning path steps');
        // Create sample code examples
        console.log('💻 Creating sample code examples...');
        const sampleCodeExamples = [
            {
                term_id: existingTerms[0]?.id,
                title: 'Linear Regression Implementation',
                description: 'A simple implementation of linear regression from scratch using NumPy',
                language: 'python',
                code: `import numpy as np
import matplotlib.pyplot as plt

class LinearRegression:
    def __init__(self):
        self.weights = None
        self.bias = None
    
    def fit(self, X, y, learning_rate=0.01, epochs=1000):
        n_samples, n_features = X.shape
        self.weights = np.zeros(n_features)
        self.bias = 0
        
        for i in range(epochs):
            y_pred = np.dot(X, self.weights) + self.bias
            
            # Calculate gradients
            dw = (1/n_samples) * np.dot(X.T, (y_pred - y))
            db = (1/n_samples) * np.sum(y_pred - y)
            
            # Update parameters
            self.weights -= learning_rate * dw
            self.bias -= learning_rate * db
    
    def predict(self, X):
        return np.dot(X, self.weights) + self.bias

# Example usage
X = np.random.randn(100, 1)
y = 2 * X.squeeze() + 1 + np.random.randn(100) * 0.1

model = LinearRegression()
model.fit(X, y)
predictions = model.predict(X)

print(f"Weights: {model.weights}")
print(f"Bias: {model.bias}")`,
                expected_output: 'Weights: [1.99...]\nBias: 1.01...',
                libraries: { python: ['numpy', 'matplotlib'] },
                difficulty_level: 'beginner',
                example_type: 'implementation',
                is_runnable: true,
                is_verified: true,
                upvotes: 45,
                downvotes: 2,
            },
            {
                term_id: existingTerms[1]?.id,
                title: 'Neural Network Forward Pass',
                description: 'Implementation of forward propagation in a simple neural network',
                language: 'python',
                code: `import numpy as np

def sigmoid(x):
    return 1 / (1 + np.exp(-x))

def relu(x):
    return np.maximum(0, x)

class NeuralNetwork:
    def __init__(self, input_size, hidden_size, output_size):
        # Initialize weights randomly
        self.W1 = np.random.randn(input_size, hidden_size) * 0.1
        self.b1 = np.zeros((1, hidden_size))
        self.W2 = np.random.randn(hidden_size, output_size) * 0.1
        self.b2 = np.zeros((1, output_size))
    
    def forward(self, X):
        # First layer
        self.z1 = np.dot(X, self.W1) + self.b1
        self.a1 = relu(self.z1)
        
        # Output layer
        self.z2 = np.dot(self.a1, self.W2) + self.b2
        self.a2 = sigmoid(self.z2)
        
        return self.a2

# Example usage
nn = NeuralNetwork(3, 4, 1)
X = np.random.randn(5, 3)  # 5 samples, 3 features
output = nn.forward(X)
print(f"Output shape: {output.shape}")
print(f"Sample output: {output[:2]}")`,
                expected_output: 'Output shape: (5, 1)\nSample output: [[0.52...], [0.48...]]',
                libraries: { python: ['numpy'] },
                difficulty_level: 'intermediate',
                example_type: 'implementation',
                is_runnable: true,
                is_verified: true,
                upvotes: 67,
                downvotes: 1,
            },
            {
                term_id: existingTerms[2]?.id,
                title: 'Text Preprocessing Pipeline',
                description: 'Complete text preprocessing pipeline for NLP tasks',
                language: 'python',
                code: `import re
import string
from collections import Counter

def preprocess_text(text):
    # Convert to lowercase
    text = text.lower()
    
    # Remove punctuation
    text = text.translate(str.maketrans('', '', string.punctuation))
    
    # Remove extra whitespace
    text = ' '.join(text.split())
    
    return text

def tokenize(text):
    return text.split()

def remove_stopwords(tokens, stopwords):
    return [token for token in tokens if token not in stopwords]

def get_word_frequencies(tokens):
    return Counter(tokens)

# Example usage
sample_text = "This is a sample text for NLP preprocessing! It contains various punctuation marks."
stopwords = {'a', 'an', 'and', 'the', 'is', 'it', 'for'}

# Apply preprocessing pipeline
cleaned_text = preprocess_text(sample_text)
tokens = tokenize(cleaned_text)
filtered_tokens = remove_stopwords(tokens, stopwords)
word_freq = get_word_frequencies(filtered_tokens)

print(f"Original: {sample_text}")
print(f"Cleaned: {cleaned_text}")
print(f"Tokens: {tokens}")
print(f"Filtered: {filtered_tokens}")
print(f"Frequencies: {dict(word_freq)}")`,
                expected_output: "Original: This is a sample text...\nCleaned: this is a sample text...\nTokens: ['this', 'is', ...]\nFiltered: ['this', 'sample', ...]\nFrequencies: {'this': 1, 'sample': 1, ...}",
                libraries: { python: ['re', 'string', 'collections'] },
                difficulty_level: 'beginner',
                example_type: 'implementation',
                is_runnable: true,
                is_verified: true,
                upvotes: 89,
                downvotes: 3,
            },
            {
                term_id: existingTerms[3]?.id,
                title: 'K-Means Clustering Visualization',
                description: 'Implementation of K-Means clustering with visualization',
                language: 'python',
                code: `import numpy as np
import matplotlib.pyplot as plt
from sklearn.datasets import make_blobs

class KMeans:
    def __init__(self, k=3, max_iters=100):
        self.k = k
        self.max_iters = max_iters
    
    def fit(self, X):
        # Initialize centroids randomly
        self.centroids = X[np.random.choice(X.shape[0], self.k, replace=False)]
        
        for _ in range(self.max_iters):
            # Assign points to closest centroid
            distances = np.sqrt(((X - self.centroids[:, np.newaxis])**2).sum(axis=2))
            labels = np.argmin(distances, axis=0)
            
            # Update centroids
            new_centroids = np.array([X[labels == i].mean(axis=0) for i in range(self.k)])
            
            # Check for convergence
            if np.allclose(self.centroids, new_centroids):
                break
                
            self.centroids = new_centroids
        
        self.labels_ = labels
        return self
    
    def predict(self, X):
        distances = np.sqrt(((X - self.centroids[:, np.newaxis])**2).sum(axis=2))
        return np.argmin(distances, axis=0)

# Generate sample data
X, _ = make_blobs(n_samples=300, centers=3, cluster_std=1.0, random_state=42)

# Apply K-Means
kmeans = KMeans(k=3)
kmeans.fit(X)

# Plot results
plt.figure(figsize=(10, 8))
colors = ['red', 'blue', 'green']
for i in range(3):
    plt.scatter(X[kmeans.labels_ == i, 0], X[kmeans.labels_ == i, 1], 
                c=colors[i], alpha=0.6, label=f'Cluster {i}')

plt.scatter(kmeans.centroids[:, 0], kmeans.centroids[:, 1], 
            c='black', marker='x', s=200, linewidths=3, label='Centroids')
plt.title('K-Means Clustering Results')
plt.legend()
plt.show()`,
                expected_output: 'Plot showing clustered data points with centroids marked',
                libraries: { python: ['numpy', 'matplotlib', 'sklearn'] },
                difficulty_level: 'intermediate',
                example_type: 'visualization',
                is_runnable: true,
                external_url: 'https://colab.research.google.com/drive/example-kmeans',
                is_verified: true,
                upvotes: 123,
                downvotes: 5,
            },
            {
                term_id: existingTerms[4]?.id,
                title: 'Decision Tree Classification',
                description: 'Simple decision tree implementation for binary classification',
                language: 'python',
                code: `import numpy as np
from collections import Counter

class DecisionTreeClassifier:
    def __init__(self, max_depth=10, min_samples_split=2):
        self.max_depth = max_depth
        self.min_samples_split = min_samples_split
        self.tree = None
    
    def _gini_impurity(self, y):
        proportions = [np.sum(y == c) / len(y) for c in np.unique(y)]
        return 1 - sum(p**2 for p in proportions)
    
    def _information_gain(self, X_column, y, threshold):
        parent_gini = self._gini_impurity(y)
        
        left_mask = X_column <= threshold
        right_mask = ~left_mask
        
        if len(y[left_mask]) == 0 or len(y[right_mask]) == 0:
            return 0
        
        n = len(y)
        left_gini = self._gini_impurity(y[left_mask])
        right_gini = self._gini_impurity(y[right_mask])
        
        weighted_gini = (len(y[left_mask]) / n) * left_gini + \\
                       (len(y[right_mask]) / n) * right_gini
        
        return parent_gini - weighted_gini
    
    def _best_split(self, X, y):
        best_gain = 0
        best_feature = None
        best_threshold = None
        
        for feature in range(X.shape[1]):
            thresholds = np.unique(X[:, feature])
            for threshold in thresholds:
                gain = self._information_gain(X[:, feature], y, threshold)
                if gain > best_gain:
                    best_gain = gain
                    best_feature = feature
                    best_threshold = threshold
        
        return best_feature, best_threshold
    
    def _build_tree(self, X, y, depth=0):
        # Stopping conditions
        if (depth >= self.max_depth or 
            len(set(y)) == 1 or 
            len(y) < self.min_samples_split):
            return Counter(y).most_common(1)[0][0]
        
        feature, threshold = self._best_split(X, y)
        if feature is None:
            return Counter(y).most_common(1)[0][0]
        
        left_mask = X[:, feature] <= threshold
        right_mask = ~left_mask
        
        left_subtree = self._build_tree(X[left_mask], y[left_mask], depth + 1)
        right_subtree = self._build_tree(X[right_mask], y[right_mask], depth + 1)
        
        return {
            'feature': feature,
            'threshold': threshold,
            'left': left_subtree,
            'right': right_subtree
        }
    
    def fit(self, X, y):
        self.tree = self._build_tree(X, y)
        return self
    
    def _predict_sample(self, sample, tree):
        if not isinstance(tree, dict):
            return tree
        
        if sample[tree['feature']] <= tree['threshold']:
            return self._predict_sample(sample, tree['left'])
        else:
            return self._predict_sample(sample, tree['right'])
    
    def predict(self, X):
        return [self._predict_sample(sample, self.tree) for sample in X]

# Example usage
from sklearn.datasets import make_classification
X, y = make_classification(n_samples=1000, n_features=4, n_classes=2, random_state=42)

dt = DecisionTreeClassifier(max_depth=5)
dt.fit(X, y)
predictions = dt.predict(X[:10])
print(f"Predictions: {predictions}")
print(f"Actual: {y[:10].tolist()}")`,
                expected_output: 'Predictions: [1, 0, 1, 0, 1, 0, 0, 1, 1, 0]\nActual: [1, 0, 1, 0, 1, 0, 0, 1, 1, 0]',
                libraries: { python: ['numpy', 'collections', 'sklearn'] },
                difficulty_level: 'advanced',
                example_type: 'implementation',
                is_runnable: true,
                is_verified: true,
                upvotes: 234,
                downvotes: 12,
            },
        ];
        // Insert code examples
        const insertedExamples = await db.insert(codeExamples).values(sampleCodeExamples).returning();
        console.log(`✅ Created ${insertedExamples.length} code examples`);
        console.log('🎉 Sample data seeding completed successfully!');
        console.log('\n📊 Summary:');
        console.log(`  - Learning Paths: ${insertedPaths.length}`);
        console.log(`  - Code Examples: ${insertedExamples.length}`);
        console.log(`  - Learning Path Steps: Created for all paths`);
    }
    catch (error) {
        console.error('❌ Error seeding sample data:', error);
        process.exit(1);
    }
}
// Run if this file is executed directly
main();
