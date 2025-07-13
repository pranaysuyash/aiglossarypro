import type { Meta, StoryObj } from '@storybook/react';
import MathRenderer, { MathText } from './MathRenderer';

const meta: Meta<typeof MathRenderer> = {
  title: 'Components/Math/MathRenderer',
  component: MathRenderer,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'A component for rendering mathematical expressions using KaTeX. Supports both inline and display mode with AI/ML specific macros.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    math: {
      control: 'text',
      description: 'LaTeX mathematical expression to render',
    },
    displayMode: {
      control: 'boolean',
      description: 'Whether to render in display mode (centered, larger) or inline mode',
    },
    className: {
      control: 'text',
      description: 'Additional CSS classes',
    },
    errorColor: {
      control: 'color',
      description: 'Color for error messages',
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

// Basic Examples
export const SimpleEquation: Story = {
  args: {
    math: 'E = mc^2',
    displayMode: false,
  },
};

export const DisplayModeEquation: Story = {
  args: {
    math: '\\frac{\\partial L}{\\partial \\theta} = \\frac{1}{m} \\sum_{i=1}^{m} (h_\\theta(x^{(i)}) - y^{(i)}) x^{(i)}',
    displayMode: true,
  },
};

// AI/ML Specific Examples
export const NeuralNetworkFormula: Story = {
  args: {
    math: '\\output = \\sigmoid(\\weights \\cdot \\input + \\bias)',
    displayMode: true,
  },
  parameters: {
    docs: {
      description: {
        story: 'Example of neural network computation using AI/ML specific macros.',
      },
    },
  },
};

export const LossFunction: Story = {
  args: {
    math: '\\loss(\\params) = \\frac{1}{m} \\sum_{i=1}^{m} (f_\\params(x^{(i)}) - y^{(i)})^2',
    displayMode: true,
  },
  parameters: {
    docs: {
      description: {
        story: 'Mean squared error loss function commonly used in machine learning.',
      },
    },
  },
};

export const AttentionMechanism: Story = {
  args: {
    math: '\\attention(Q, K, V) = \\softmax\\left(\\frac{QK^T}{\\sqrt{d_k}}\\right)V',
    displayMode: true,
  },
  parameters: {
    docs: {
      description: {
        story: 'Scaled dot-product attention used in transformer models.',
      },
    },
  },
};

export const GradientDescent: Story = {
  args: {
    math: '\\params_{t+1} = \\params_t - \\alpha \\gradient_\\params \\loss(\\params_t)',
    displayMode: true,
  },
  parameters: {
    docs: {
      description: {
        story: 'Gradient descent optimization algorithm.',
      },
    },
  },
};

export const BayesTheorem: Story = {
  args: {
    math: 'P(A|B) = \\frac{P(B|A) \\cdot P(A)}{P(B)}',
    displayMode: true,
  },
  parameters: {
    docs: {
      description: {
        story: 'Bayes theorem fundamental to machine learning and statistics.',
      },
    },
  },
};

export const ConvolutionOperation: Story = {
  args: {
    math: '(f * g)(t) = \\int_{-\\infty}^{\\infty} f(\\tau) g(t - \\tau) d\\tau',
    displayMode: true,
  },
  parameters: {
    docs: {
      description: {
        story: 'Convolution operation used in convolutional neural networks.',
      },
    },
  },
};

// Error Handling
export const InvalidMath: Story = {
  args: {
    math: '\\invalid{syntax\\here',
    displayMode: false,
  },
  parameters: {
    docs: {
      description: {
        story: 'Example of error handling for invalid LaTeX syntax.',
      },
    },
  },
};

// Inline Math Examples
export const InlineExample: Story = {
  render: () => (
    <div className="max-w-2xl">
      <p className="text-base leading-relaxed">
        The <MathRenderer math="\\sigma" /> function, also known as the{' '}
        <MathRenderer math="\\sigmoid" /> function, is defined as{' '}
        <MathRenderer math="\\sigma(x) = \\frac{1}{1 + e^{-x}}" />. This function is commonly
        used in neural networks because it maps any real number to a value between 0 and 1.
      </p>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Example of inline mathematical expressions within text.',
      },
    },
  },
};

// MathText Component Examples
export const MathTextExample: Story = {
  render: () => (
    <div className="max-w-2xl space-y-4">
      <MathText className="text-base leading-relaxed">
        {"The loss function $\\\\loss(\\\\params) = \\\\frac{1}{m} \\\\sum_{i=1}^{m} (f_\\\\params(x^{(i)}) - y^{(i)})^2$ measures prediction errors in supervised learning."}
      </MathText>
      
      <MathText className="text-base leading-relaxed">
        {"In deep learning, we often use the ReLU activation function: $$\\\\ReLU(x) = \\\\max(0, x)$$ which helps with the vanishing gradient problem."}
      </MathText>
      
      <MathText className="text-base leading-relaxed">
        {"The gradient descent update rule is $\\\\params := \\\\params - \\\\alpha \\\\gradient \\\\loss$ where $\\\\alpha$ is the learning rate."}
      </MathText>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Example of the MathText component that automatically parses and renders embedded mathematical expressions.',
      },
    },
  },
};

// Complex Multi-line Equations
export const ComplexEquation: Story = {
  args: {
    math: '\\begin{align}\\frac{\\partial}{\\partial \\weights} \\loss &= \\frac{1}{m} \\sum_{i=1}^{m} \\frac{\\partial}{\\partial \\weights} \\left[ (\\weights^T \\input^{(i)} + b - \\output^{(i)})^2 \\right] \\\\&= \\frac{2}{m} \\sum_{i=1}^{m} (\\weights^T \\input^{(i)} + b - \\output^{(i)}) \\input^{(i)} \\\\&= \\frac{2}{m} X^T (X\\weights + b\\mathbf{1} - \\mathbf{y})\\end{align}',
    displayMode: true,
  },
  parameters: {
    docs: {
      description: {
        story: 'Complex multi-line equation showing gradient computation.',
      },
    },
  },
};

// Matrix Operations
export const MatrixOperations: Story = {
  args: {
    math: '\\begin{pmatrix} \\output_1 \\\\ \\output_2 \\\\ \\vdots \\\\ \\output_n \\end{pmatrix} = \\begin{pmatrix} w_{11} & w_{12} & \\cdots & w_{1m} \\\\ w_{21} & w_{22} & \\cdots & w_{2m} \\\\ \\vdots & \\vdots & \\ddots & \\vdots \\\\ w_{n1} & w_{n2} & \\cdots & w_{nm} \\end{pmatrix} \\begin{pmatrix} \\input_1 \\\\ \\input_2 \\\\ \\vdots \\\\ \\input_m \\end{pmatrix} + \\begin{pmatrix} \\bias_1 \\\\ \\bias_2 \\\\ \\vdots \\\\ \\bias_n \\end{pmatrix}',
    displayMode: true,
  },
  parameters: {
    docs: {
      description: {
        story: 'Matrix representation of linear transformation in neural networks.',
      },
    },
  },
};

// Statistics and Probability
export const ProbabilityDistribution: Story = {
  args: {
    math: 'f(x; \\mu, \\sigma^2) = \\frac{1}{\\sqrt{2\\pi\\sigma^2}} e^{-\\frac{(x-\\mu)^2}{2\\sigma^2}}',
    displayMode: true,
  },
  parameters: {
    docs: {
      description: {
        story: 'Normal distribution probability density function.',
      },
    },
  },
};

// Information Theory
export const InformationTheory: Story = {
  args: {
    math: 'H(X) = -\\sum_{i=1}^{n} P(x_i) \\log_2 P(x_i)',
    displayMode: true,
  },
  parameters: {
    docs: {
      description: {
        story: 'Shannon entropy formula used in information theory and machine learning.',
      },
    },
  },
};