import type { Meta, StoryObj } from '@storybook/react';
import MermaidDiagram from './MermaidDiagram';

const meta: Meta<typeof MermaidDiagram> = {
  title: 'Interactive/MermaidDiagram',
  component: MermaidDiagram,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: 'Interactive component for rendering Mermaid diagrams to visualize AI/ML concepts, architectures, and processes.',
      },
    },
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

const neuralNetworkDiagram = `
graph LR
    A[Input Layer] --> B[Hidden Layer 1]
    B --> C[Hidden Layer 2]
    C --> D[Output Layer]
    
    A1[Input 1] --> B1[Neuron 1]
    A2[Input 2] --> B1
    A3[Input 3] --> B1
    
    A1 --> B2[Neuron 2]
    A2 --> B2
    A3 --> B2
    
    B1 --> C1[Neuron 3]
    B2 --> C1
    B1 --> C2[Neuron 4]
    B2 --> C2
    
    C1 --> D1[Output 1]
    C2 --> D1
    C1 --> D2[Output 2]
    C2 --> D2

    style A fill:#e1f5fe
    style B fill:#f3e5f5
    style C fill:#f3e5f5
    style D fill:#e8f5e8
`;

const mlPipelineDiagram = `
flowchart TD
    A[Raw Data] --> B[Data Preprocessing]
    B --> C[Feature Engineering]
    C --> D[Train/Test Split]
    D --> E[Model Training]
    E --> F[Model Validation]
    F --> G{Performance OK?}
    G -->|No| H[Hyperparameter Tuning]
    H --> E
    G -->|Yes| I[Model Testing]
    I --> J[Model Deployment]
    J --> K[Monitoring & Maintenance]
    
    style A fill:#ffcdd2
    style B fill:#f8bbd9
    style C fill:#e1bee7
    style D fill:#c5cae9
    style E fill:#bbdefb
    style F fill:#b2dfdb
    style G fill:#dcedc8
    style I fill:#f0f4c3
    style J fill:#fff9c4
    style K fill:#ffccbc
`;

const transformerArchitecture = `
graph TB
    subgraph "Transformer Architecture"
        A[Input Embeddings] --> B[Positional Encoding]
        B --> C[Multi-Head Attention]
        C --> D[Add & Norm]
        D --> E[Feed Forward]
        E --> F[Add & Norm]
        F --> G[Output]
        
        subgraph "Multi-Head Attention"
            H[Query] --> I[Attention Head 1]
            J[Key] --> I
            K[Value] --> I
            
            H --> L[Attention Head 2]
            J --> L
            K --> L
            
            H --> M[Attention Head n]
            J --> M
            K --> M
            
            I --> N[Concatenate]
            L --> N
            M --> N
            N --> O[Linear Layer]
        end
    end
    
    style A fill:#e3f2fd
    style C fill:#f3e5f5
    style E fill:#e8f5e8
    style I fill:#fff3e0
    style L fill:#fff3e0
    style M fill:#fff3e0
`;

const cnnArchitecture = `
graph LR
    subgraph "CNN Architecture"
        A[Input Image<br/>32x32x3] --> B[Conv Layer 1<br/>Filters: 32<br/>Size: 3x3]
        B --> C[ReLU Activation]
        C --> D[Max Pooling<br/>2x2]
        D --> E[Conv Layer 2<br/>Filters: 64<br/>Size: 3x3]
        E --> F[ReLU Activation]
        F --> G[Max Pooling<br/>2x2]
        G --> H[Flatten]
        H --> I[Dense Layer<br/>128 units]
        I --> J[Dropout<br/>0.5]
        J --> K[Output Layer<br/>10 classes]
    end
    
    style A fill:#ffebee
    style B fill:#e3f2fd
    style C fill:#e8f5e8
    style D fill:#fff3e0
    style E fill:#e3f2fd
    style F fill:#e8f5e8
    style G fill:#fff3e0
    style I fill:#f3e5f5
    style K fill:#e1f5fe
`;

const decisionTreeDiagram = `
graph TD
    A[Age > 30?] --> B[Yes]
    A --> C[No]
    B --> D[Income > 50k?]
    B --> E[Income ≤ 50k?]
    C --> F[Student?]
    C --> G[Not Student]
    D --> H[Buy: Yes]
    E --> I[Buy: No]
    F --> J[Buy: No]
    G --> K[Buy: Yes]
    
    style A fill:#e1f5fe
    style D fill:#e1f5fe
    style F fill:#e1f5fe
    style H fill:#c8e6c9
    style I fill:#ffcdd2
    style J fill:#ffcdd2
    style K fill:#c8e6c9
`;

const reinforcementLearningDiagram = `
graph LR
    A[Agent] --> |Action| B[Environment]
    B --> |State, Reward| A
    
    subgraph "RL Process"
        C[State St] --> D[Policy π]
        D --> E[Action At]
        E --> F[Environment]
        F --> G[Reward Rt+1]
        F --> H[State St+1]
        G --> I[Value Function]
        H --> I
        I --> J[Policy Update]
        J --> D
    end
    
    style A fill:#e3f2fd
    style B fill:#f3e5f5
    style D fill:#e8f5e8
    style F fill:#fff3e0
    style I fill:#ffebee
`;

export const Default: Story = {
  args: {
    diagram: neuralNetworkDiagram,
    title: 'Neural Network Architecture',
  },
};

export const MachineLearningPipeline: Story = {
  args: {
    diagram: mlPipelineDiagram,
    title: 'Machine Learning Pipeline',
    description: 'End-to-end machine learning workflow from data preprocessing to model deployment',
  },
};

export const TransformerArchitecture: Story = {
  args: {
    diagram: transformerArchitecture,
    title: 'Transformer Architecture',
    description: 'Neural network architecture based on attention mechanisms',
    interactive: true,
  },
};

export const CNNVisualization: Story = {
  args: {
    diagram: cnnArchitecture,
    title: 'Convolutional Neural Network',
    description: 'CNN architecture for image classification',
    showControls: true,
  },
};

export const DecisionTree: Story = {
  args: {
    diagram: decisionTreeDiagram,
    title: 'Decision Tree Example',
    description: 'Binary decision tree for classification',
    theme: 'neutral',
  },
};

export const ReinforcementLearning: Story = {
  args: {
    diagram: reinforcementLearningDiagram,
    title: 'Reinforcement Learning Process',
    description: 'Agent-environment interaction in RL',
    animated: true,
  },
};

export const WithCustomTheme: Story = {
  args: {
    diagram: neuralNetworkDiagram,
    title: 'Neural Network (Dark Theme)',
    theme: 'dark',
    config: {
      theme: 'dark',
      themeVariables: {
        primaryColor: '#4f46e5',
        primaryTextColor: '#ffffff',
        primaryBorderColor: '#6366f1',
        lineColor: '#9ca3af',
      },
    },
  },
};

export const InteractiveWithZoom: Story = {
  args: {
    diagram: transformerArchitecture,
    title: 'Interactive Transformer',
    interactive: true,
    zoomable: true,
    showControls: true,
    description: 'Click and drag to pan, use mouse wheel to zoom',
  },
};

export const LoadingState: Story = {
  args: {
    diagram: '',
    title: 'Loading Diagram...',
    loading: true,
  },
};

export const ErrorState: Story = {
  args: {
    diagram: 'invalid mermaid syntax [[[',
    title: 'Invalid Diagram',
    onError: (error: Error) => console.log('Diagram error:', error),
  },
};

export const WithExportOptions: Story = {
  args: {
    diagram: cnnArchitecture,
    title: 'CNN Architecture',
    showExportButtons: true,
    exportFormats: ['png', 'svg', 'pdf'],
    onExport: (format: string) => console.log(`Exporting as ${format}`),
  },
};

export const ResponsiveDesign: Story = {
  args: {
    diagram: neuralNetworkDiagram,
    title: 'Responsive Neural Network',
    responsive: true,
    maxWidth: '100%',
  },
  parameters: {
    viewport: {
      defaultViewport: 'mobile1',
    },
  },
};

export const WithStepByStepExplanation: Story = {
  args: {
    diagram: mlPipelineDiagram,
    title: 'ML Pipeline with Steps',
    showSteps: true,
    steps: [
      {
        id: 'data',
        title: 'Data Collection',
        description: 'Gather raw data from various sources',
        highlight: ['Raw Data'],
      },
      {
        id: 'preprocessing',
        title: 'Data Preprocessing',
        description: 'Clean and prepare data for analysis',
        highlight: ['Data Preprocessing'],
      },
      {
        id: 'features',
        title: 'Feature Engineering',
        description: 'Create and select relevant features',
        highlight: ['Feature Engineering'],
      },
      {
        id: 'training',
        title: 'Model Training',
        description: 'Train the machine learning model',
        highlight: ['Model Training'],
      },
    ],
    currentStep: 0,
    onStepChange: (step: number) => console.log('Current step:', step),
  },
};

export const ComparisonView: Story = {
  args: {
    diagrams: [
      {
        diagram: `graph LR; A[Traditional ML] --> B[Feature Engineering]; B --> C[Model Training]; C --> D[Prediction]`,
        title: 'Traditional ML',
      },
      {
        diagram: `graph LR; A[Deep Learning] --> B[Raw Data]; B --> C[Neural Network]; C --> D[Automatic Features]; D --> E[Prediction]`,
        title: 'Deep Learning',
      },
    ],
    comparison: true,
  },
};

export const WithAnnotations: Story = {
  args: {
    diagram: neuralNetworkDiagram,
    title: 'Annotated Neural Network',
    annotations: [
      {
        id: 'input',
        text: 'Input features',
        position: { x: 50, y: 100 },
        type: 'info',
      },
      {
        id: 'hidden',
        text: 'Feature extraction happens here',
        position: { x: 200, y: 150 },
        type: 'highlight',
      },
      {
        id: 'output',
        text: 'Final predictions',
        position: { x: 350, y: 100 },
        type: 'success',
      },
    ],
    showAnnotations: true,
  },
};

export const DarkMode: Story = {
  args: {
    diagram: transformerArchitecture,
    title: 'Transformer (Dark Mode)',
    theme: 'dark',
  },
  parameters: {
    themes: {
      default: 'dark',
    },
  },
};
