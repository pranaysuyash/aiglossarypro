import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from './accordion';

// Define the props type for the Accordion component
type AccordionProps = React.ComponentProps<typeof Accordion>;

const meta: Meta<AccordionProps> = {
  title: 'UI/Accordion',
  component: Accordion,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    type: {
      control: { type: 'select' },
      options: ['single', 'multiple'],
    },
    collapsible: {
      control: { type: 'boolean' },
    },
  },
};

export default meta;
type Story = StoryObj<AccordionProps>;

export const Default: Story = {
  args: {
    type: 'single',
    collapsible: true,
    className: 'w-full max-w-md',
  },
  render: (args: AccordionProps) => (
    <Accordion {...args}>
      <AccordionItem value="item-1">
        <AccordionTrigger>What is AI/ML Glossary?</AccordionTrigger>
        <AccordionContent>
          AI/ML Glossary is a comprehensive resource for artificial intelligence and machine learning terms, definitions, and concepts. It helps students, professionals, and enthusiasts understand complex AI terminology.
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="item-2">
        <AccordionTrigger>How are definitions generated?</AccordionTrigger>
        <AccordionContent>
          Our definitions are created using advanced AI models and verified by experts in the field. Each definition includes examples, use cases, and related terms to provide comprehensive understanding.
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="item-3">
        <AccordionTrigger>Can I contribute to the glossary?</AccordionTrigger>
        <AccordionContent>
          Yes! We welcome contributions from the community. You can suggest new terms, improvements to existing definitions, or report inaccuracies through our feedback system.
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  ),
};

export const Multiple: Story = {
  args: {
    type: 'multiple',
    className: 'w-full max-w-md',
  },
  render: (args: AccordionProps) => (
    <Accordion {...args}>
      <AccordionItem value="item-1">
        <AccordionTrigger>Machine Learning</AccordionTrigger>
        <AccordionContent>
          A subset of artificial intelligence that enables computers to learn and improve from experience without being explicitly programmed. It uses algorithms to analyze data, identify patterns, and make predictions or decisions.
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="item-2">
        <AccordionTrigger>Deep Learning</AccordionTrigger>
        <AccordionContent>
          A specialized area of machine learning that uses artificial neural networks with multiple layers (hence "deep") to model and understand complex patterns in data. It's particularly effective for tasks like image recognition, natural language processing, and speech recognition.
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="item-3">
        <AccordionTrigger>Neural Networks</AccordionTrigger>
        <AccordionContent>
          Computing systems inspired by biological neural networks. They consist of interconnected nodes (neurons) that process information and learn patterns from data. Neural networks form the foundation of deep learning algorithms.
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  ),
};

export const SingleItem: Story = {
  args: {
    type: 'single',
    collapsible: true,
    className: 'w-full max-w-md',
  },
  render: (args: AccordionProps) => (
    <Accordion {...args}>
      <AccordionItem value="item-1">
        <AccordionTrigger>What is Artificial Intelligence?</AccordionTrigger>
        <AccordionContent>
          Artificial Intelligence (AI) refers to the simulation of human intelligence processes by machines, especially computer systems. These processes include learning (acquiring information and rules for using it), reasoning (using rules to reach approximate or definite conclusions), and self-correction.
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  ),
};

export const LongContent: Story = {
  args: {
    type: 'single',
    collapsible: true,
    className: 'w-full max-w-lg',
  },
  render: (args: AccordionProps) => (
    <Accordion {...args}>
      <AccordionItem value="item-1">
        <AccordionTrigger>Comprehensive Guide to Natural Language Processing</AccordionTrigger>
        <AccordionContent>
          <div className="space-y-4">
            <p>
              Natural Language Processing (NLP) is a branch of artificial intelligence that helps computers understand, interpret, and manipulate human language. It bridges the gap between human communication and computer understanding.
            </p>
            <p>
              <strong>Key Components:</strong>
            </p>
            <ul className="list-disc list-inside space-y-1">
              <li>Tokenization: Breaking text into individual words or phrases</li>
              <li>Part-of-speech tagging: Identifying grammatical roles</li>
              <li>Named entity recognition: Identifying specific entities like names, dates, locations</li>
              <li>Sentiment analysis: Understanding emotional tone</li>
              <li>Machine translation: Converting text between languages</li>
            </ul>
            <p>
              <strong>Applications:</strong> Chatbots, language translation, sentiment analysis, text summarization, speech recognition, and content recommendation systems.
            </p>
          </div>
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="item-2">
        <AccordionTrigger>Computer Vision Applications</AccordionTrigger>
        <AccordionContent>
          <div className="space-y-4">
            <p>
              Computer Vision enables machines to interpret and make decisions based on visual data from the world around them.
            </p>
            <p>
              <strong>Common Applications:</strong>
            </p>
            <ul className="list-disc list-inside space-y-1">
              <li>Medical imaging and diagnosis</li>
              <li>Autonomous vehicles</li>
              <li>Facial recognition systems</li>
              <li>Quality control in manufacturing</li>
              <li>Augmented reality applications</li>
              <li>Security and surveillance systems</li>
            </ul>
          </div>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  ),
};

export const CustomStyling: Story = {
  args: {
    type: 'single',
    collapsible: true,
    className: 'w-full max-w-md border rounded-lg p-4 bg-gradient-to-r from-blue-50 to-indigo-50',
  },
  render: (args: AccordionProps) => (
    <Accordion {...args}>
      <AccordionItem value="item-1" className="border-blue-200">
        <AccordionTrigger className="text-blue-800 hover:text-blue-900">
          AI Ethics and Responsible AI
        </AccordionTrigger>
        <AccordionContent className="text-blue-700">
          The practice of developing AI systems that are fair, transparent, accountable, and beneficial to society while minimizing potential harms and biases.
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="item-2" className="border-blue-200">
        <AccordionTrigger className="text-blue-800 hover:text-blue-900">
          Explainable AI (XAI)
        </AccordionTrigger>
        <AccordionContent className="text-blue-700">
          AI systems designed to provide clear, understandable explanations for their decisions and processes, making AI more transparent and trustworthy.
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  ),
};

export const EmptyState: Story = {
  args: {
    type: 'single',
    collapsible: true,
    className: 'w-full max-w-md',
  },
  render: (args: AccordionProps) => (
    <Accordion {...args}>
      {/* Empty accordion for testing purposes */}
    </Accordion>
  ),
};

export const DisabledState: Story = {
  args: {
    type: 'single',
    collapsible: true,
    className: 'w-full max-w-md',
  },
  render: (args: AccordionProps) => (
    <Accordion {...args}>
      <AccordionItem value="item-1">
        <AccordionTrigger disabled className="opacity-50 cursor-not-allowed">
          Disabled Section
        </AccordionTrigger>
        <AccordionContent>
          This content should not be accessible when the trigger is disabled.
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="item-2">
        <AccordionTrigger>Active Section</AccordionTrigger>
        <AccordionContent>
          This section remains fully functional and accessible.
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  ),
};
