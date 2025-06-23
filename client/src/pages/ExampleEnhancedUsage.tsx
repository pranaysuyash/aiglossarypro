import { useState } from 'react';
import {
  EnhancedTermCard,
  AdvancedSearch,
  MermaidDiagram,
  CodeBlock,
  InteractiveQuiz,
  SectionDisplay,
  UserPersonalizationSettings,
  MobileOptimizedLayout,
  useResponsiveCardLayout,
  ResponsiveContainer
} from '@/components';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { IEnhancedTerm, ISearchFilters, ITermSection, IInteractiveElement } from '@/interfaces/interfaces';

// Example data
const exampleTerm: IEnhancedTerm = {
  id: "1",
  name: "Neural Networks",
  slug: "neural-networks",
  definition: "Neural networks are computing systems vaguely inspired by the biological neural networks that constitute animal brains. They consist of interconnected nodes (neurons) that process information using connectionist approaches to computation.",
  category: "Deep Learning",
  shortDefinition: "Computational models inspired by biological neural networks",
  fullDefinition: "Neural networks are computing systems vaguely inspired by the biological neural networks that constitute animal brains. They consist of interconnected nodes (neurons) that process information using connectionist approaches to computation.",
  mainCategories: ["Machine Learning", "Deep Learning"],
  subCategories: ["Artificial Intelligence", "Pattern Recognition"],
  relatedConcepts: ["Backpropagation", "Gradient Descent", "Activation Functions"],
  applicationDomains: ["Computer Vision", "Natural Language Processing", "Speech Recognition"],
  techniques: ["Feedforward", "Convolutional", "Recurrent"],
  difficultyLevel: "Intermediate",
  hasImplementation: true,
  hasInteractiveElements: true,
  hasCaseStudies: true,
  hasCodeExamples: true,
  searchText: "neural networks machine learning deep learning artificial intelligence",
  keywords: ["neural", "network", "artificial", "intelligence", "machine", "learning"],
  viewCount: 1250,
  createdAt: new Date("2024-01-01T00:00:00Z"),
  updatedAt: new Date("2024-01-15T00:00:00Z")
};

const exampleSections: ITermSection[] = [
  {
    id: "1",
    termId: "1",
    sectionName: "Introduction",
    sectionData: {
      type: "markdown",
      content: "# Introduction to Neural Networks\n\nNeural networks represent one of the most important breakthroughs in artificial intelligence..."
    },
    displayType: "main",
    priority: 1,
    isInteractive: false,
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-01T00:00:00Z"
  },
  {
    id: "2",
    termId: "1",
    sectionName: "Key Components",
    sectionData: {
      type: "list",
      items: [
        {
          title: "Neurons",
          description: "Basic processing units that receive, process, and transmit information"
        },
        {
          title: "Weights",
          description: "Parameters that determine the strength of connections between neurons"
        },
        {
          title: "Activation Functions",
          description: "Mathematical functions that determine the output of neurons"
        }
      ]
    },
    displayType: "card",
    priority: 2,
    isInteractive: false,
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-01T00:00:00Z"
  }
];

const exampleInteractiveElements: IInteractiveElement[] = [
  {
    id: "1",
    termId: "1",
    sectionName: "Architecture",
    elementType: "mermaid",
    elementData: {
      diagram: `graph TD
        A[Input Layer] --> B[Hidden Layer 1]
        B --> C[Hidden Layer 2]
        C --> D[Output Layer]
        E[Input 1] --> A
        F[Input 2] --> A
        G[Input 3] --> A
        D --> H[Output 1]
        D --> I[Output 2]`,
      title: "Neural Network Architecture",
      description: "Basic structure of a feedforward neural network"
    },
    displayOrder: 1,
    isActive: true,
    createdAt: "2024-01-01T00:00:00Z"
  },
  {
    id: "2",
    termId: "1",
    sectionName: "Implementation",
    elementType: "code",
    elementData: {
      code: `import numpy as np

class NeuralNetwork:
    def __init__(self, input_size, hidden_size, output_size):
        # Initialize weights randomly
        self.W1 = np.random.randn(input_size, hidden_size)
        self.W2 = np.random.randn(hidden_size, output_size)
        self.b1 = np.zeros((1, hidden_size))
        self.b2 = np.zeros((1, output_size))
    
    def sigmoid(self, x):
        return 1 / (1 + np.exp(-x))
    
    def forward(self, X):
        # Forward propagation
        self.z1 = np.dot(X, self.W1) + self.b1
        self.a1 = self.sigmoid(self.z1)
        self.z2 = np.dot(self.a1, self.W2) + self.b2
        self.a2 = self.sigmoid(self.z2)
        return self.a2

# Example usage
nn = NeuralNetwork(3, 4, 2)
input_data = np.array([[0.1, 0.2, 0.3]])
output = nn.forward(input_data)
print(f"Output: {output}")`,
      language: "python",
      title: "Simple Neural Network Implementation",
      description: "Basic implementation of a neural network in Python"
    },
    displayOrder: 2,
    isActive: true,
    createdAt: "2024-01-01T00:00:00Z"
  },
  {
    id: "3",
    termId: "1",
    sectionName: "Quiz",
    elementType: "quiz",
    elementData: {
      title: "Neural Networks Quiz",
      description: "Test your understanding of neural networks",
      questions: [
        {
          id: "1",
          question: "What is the primary function of an activation function in a neural network?",
          type: "multiple-choice",
          options: [
            "To initialize weights",
            "To introduce non-linearity",
            "To calculate gradients",
            "To normalize inputs"
          ],
          correctAnswer: 1,
          explanation: "Activation functions introduce non-linearity to the network, allowing it to learn complex patterns."
        },
        {
          id: "2",
          question: "Backpropagation is used for training neural networks.",
          type: "true-false",
          correctAnswer: "true",
          explanation: "Backpropagation is the standard algorithm for training neural networks by computing gradients."
        }
      ]
    },
    displayOrder: 3,
    isActive: true,
    createdAt: "2024-01-01T00:00:00Z"
  }
];

const availableFilters = {
  categories: ["Machine Learning", "Deep Learning", "Computer Vision", "NLP"],
  subcategories: ["Artificial Intelligence", "Pattern Recognition", "Signal Processing"],
  applicationDomains: ["Healthcare", "Finance", "Robotics", "Gaming"],
  techniques: ["Supervised Learning", "Unsupervised Learning", "Reinforcement Learning"]
};

export default function ExampleEnhancedUsage() {
  const [searchFilters, setSearchFilters] = useState<ISearchFilters>({});
  const [selectedTab, setSelectedTab] = useState("cards");
  const { getGridCols, getCardSpacing } = useResponsiveCardLayout();

  const handleSearch = (filters: ISearchFilters) => {
    setSearchFilters(filters);
    console.log("Search filters:", filters);
  };

  const handleSectionInteraction = (type: string, data: any) => {
    console.log("Section interaction:", type, data);
  };

  return (
    <MobileOptimizedLayout
      title="Enhanced Components Demo"
      searchComponent={
        <AdvancedSearch
          onSearch={handleSearch}
          initialFilters={searchFilters}
          availableFilters={availableFilters}
        />
      }
    >
      <div className="space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-4">Enhanced AI Glossary Components</h1>
          <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            This page demonstrates all the new enhanced components with interactive features,
            responsive design, and modern UI patterns.
          </p>
        </div>

        <Tabs value={selectedTab} onValueChange={setSelectedTab}>
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="cards">Term Cards</TabsTrigger>
            <TabsTrigger value="search">Search</TabsTrigger>
            <TabsTrigger value="sections">Sections</TabsTrigger>
            <TabsTrigger value="interactive">Interactive</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
            <TabsTrigger value="mobile">Mobile</TabsTrigger>
          </TabsList>

          <TabsContent value="cards" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Enhanced Term Cards</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  Enhanced term cards with new categorization, difficulty levels, and feature indicators.
                </p>
                <div className={`grid ${getGridCols(3)} ${getCardSpacing()}`}>
                  <EnhancedTermCard
                    term={exampleTerm}
                    displayMode="default"
                    showInteractive={true}
                  />
                  <EnhancedTermCard
                    term={exampleTerm}
                    displayMode="compact"
                    showInteractive={true}
                  />
                  <EnhancedTermCard
                    term={exampleTerm}
                    displayMode="detailed"
                    showInteractive={true}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="search" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Advanced Search</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  Advanced search with faceted filtering, AI-powered semantic search, and sorting options.
                </p>
                <AdvancedSearch
                  onSearch={handleSearch}
                  initialFilters={searchFilters}
                  availableFilters={availableFilters}
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="sections" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Section Display</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  Structured content sections with different display types and layouts.
                </p>
                <div className="space-y-4">
                  {exampleSections.map(section => (
                    <SectionDisplay
                      key={section.id}
                      section={section}
                      onInteraction={handleSectionInteraction}
                    />
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="interactive" className="space-y-6">
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Mermaid Diagrams</CardTitle>
                </CardHeader>
                <CardContent>
                  <MermaidDiagram
                    diagram={exampleInteractiveElements[0].elementData.diagram!}
                    title={exampleInteractiveElements[0].elementData.title}
                    description={exampleInteractiveElements[0].elementData.description}
                  />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Code Blocks</CardTitle>
                </CardHeader>
                <CardContent>
                  <CodeBlock
                    code={exampleInteractiveElements[1].elementData.code!}
                    language={exampleInteractiveElements[1].elementData.language!}
                    title={exampleInteractiveElements[1].elementData.title}
                    description={exampleInteractiveElements[1].elementData.description}
                    showLineNumbers={true}
                    executable={false}
                  />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Interactive Quiz</CardTitle>
                </CardHeader>
                <CardContent>
                  <InteractiveQuiz
                    questions={exampleInteractiveElements[2].elementData.questions!}
                    title={exampleInteractiveElements[2].elementData.title}
                    description={exampleInteractiveElements[2].elementData.description}
                    showExplanations={true}
                    allowRetry={true}
                    onComplete={(result) => console.log("Quiz completed:", result)}
                  />
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="settings" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>User Personalization</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  Comprehensive user settings for personalizing the learning experience.
                </p>
                <UserPersonalizationSettings
                  availableCategories={availableFilters.categories}
                  availableApplications={availableFilters.applicationDomains}
                  onSettingsChange={(settings) => console.log("Settings changed:", settings)}
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="mobile" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Mobile Optimization</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer>
                  <p className="text-gray-600 dark:text-gray-400 mb-4">
                    All components are optimized for mobile devices with responsive layouts,
                    touch-friendly interactions, and mobile-specific UI patterns.
                  </p>
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                        <h4 className="font-medium mb-2">Mobile Features</h4>
                        <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                          <li>• Responsive grid layouts</li>
                          <li>• Touch-optimized interactions</li>
                          <li>• Mobile-friendly navigation</li>
                          <li>• Optimized typography</li>
                        </ul>
                      </div>
                      <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                        <h4 className="font-medium mb-2">Adaptive Components</h4>
                        <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                          <li>• Collapsible sections</li>
                          <li>• Drawer-based menus</li>
                          <li>• Responsive cards</li>
                          <li>• Mobile search sheets</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </MobileOptimizedLayout>
  );
}