import type { Meta, StoryObj } from '@storybook/react';
import { BookOpen, Clock, Heart, Share } from 'lucide-react';
import { Badge } from './badge';
import { Button } from './button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from './card';

const meta: Meta<typeof Card> = {
  title: 'UI/Card Enhanced',
  component: Card,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'A flexible card component with header, content, and footer sections.',
      },
    },
  },
  decorators: [
    (Story) => (
      <div className="w-full max-w-md p-4">
        <Story />
      </div>
    ),
  ],
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <Card>
      <CardHeader>
        <CardTitle>Neural Network</CardTitle>
        <CardDescription>A computing system inspired by biological neural networks</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">
          Neural networks are a fundamental concept in machine learning and artificial intelligence,
          consisting of layers of interconnected nodes that can learn complex patterns from data.
        </p>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Badge variant="secondary">Machine Learning</Badge>
        <div className="flex gap-2">
          <Button size="sm" variant="ghost">
            <Heart className="h-4 w-4" />
          </Button>
          <Button size="sm" variant="ghost">
            <Share className="h-4 w-4" />
          </Button>
        </div>
      </CardFooter>
    </Card>
  ),
  parameters: {
    docs: {
      description: {
        story: 'A complete card with header, content, and footer sections.',
      },
    },
  },
};

export const SimpleCard: Story = {
  render: () => (
    <Card>
      <CardContent className="pt-6">
        <p>This is a simple card with just content.</p>
      </CardContent>
    </Card>
  ),
  parameters: {
    docs: {
      description: {
        story: 'A minimal card with only content.',
      },
    },
  },
};

export const WithHeaderOnly: Story = {
  render: () => (
    <Card>
      <CardHeader>
        <CardTitle>Deep Learning</CardTitle>
        <CardDescription>
          Machine learning methods based on artificial neural networks with representation learning
        </CardDescription>
      </CardHeader>
    </Card>
  ),
  parameters: {
    docs: {
      description: {
        story: 'A card with only header content.',
      },
    },
  },
};

export const TermCard: Story = {
  render: () => (
    <Card className="hover:shadow-lg transition-shadow cursor-pointer">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-lg">Transformer Architecture</CardTitle>
            <CardDescription>Advanced neural network architecture</CardDescription>
          </div>
          <Badge variant="outline">Advanced</Badge>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground mb-4">
          A neural network architecture that relies entirely on attention mechanisms, dispensing
          with recurrence and convolutions entirely.
        </p>
        <div className="flex gap-2 flex-wrap">
          <Badge variant="secondary" className="text-xs">
            NLP
          </Badge>
          <Badge variant="secondary" className="text-xs">
            Attention
          </Badge>
          <Badge variant="secondary" className="text-xs">
            BERT
          </Badge>
        </div>
      </CardContent>
      <CardFooter className="flex justify-between items-center">
        <div className="flex items-center text-sm text-muted-foreground">
          <BookOpen className="h-4 w-4 mr-1" />
          <span>1,247 views</span>
        </div>
        <div className="flex gap-1">
          <Button size="sm" variant="ghost">
            <Heart className="h-4 w-4" />
          </Button>
          <Button size="sm" variant="ghost">
            <Share className="h-4 w-4" />
          </Button>
        </div>
      </CardFooter>
    </Card>
  ),
  parameters: {
    docs: {
      description: {
        story: 'A detailed term card with hover effects and interactive elements.',
      },
    },
  },
};

export const StatsCard: Story = {
  render: () => (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Total Terms</CardTitle>
        <BookOpen className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">1,247</div>
        <p className="text-xs text-muted-foreground">+12% from last month</p>
      </CardContent>
    </Card>
  ),
  parameters: {
    docs: {
      description: {
        story: 'A statistics card showing metrics with icons.',
      },
    },
  },
};

export const ArticleCard: Story = {
  render: () => (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center space-x-2 text-sm text-muted-foreground">
          <Clock className="h-4 w-4" />
          <span>5 min read</span>
          <span>•</span>
          <span>Dec 15, 2024</span>
        </div>
        <CardTitle className="text-xl">Understanding Neural Networks</CardTitle>
        <CardDescription>
          A comprehensive guide to neural networks and their applications in modern AI
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">
          Neural networks have revolutionized the field of artificial intelligence, enabling
          machines to learn complex patterns and make decisions in ways that were previously
          impossible...
        </p>
      </CardContent>
      <CardFooter>
        <Button className="w-full">Read More</Button>
      </CardFooter>
    </Card>
  ),
  parameters: {
    docs: {
      description: {
        story: 'An article card with metadata and call-to-action.',
      },
    },
  },
};

export const CompactCard: Story = {
  render: () => (
    <Card className="w-full">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="font-semibold">Machine Learning</h4>
            <p className="text-sm text-muted-foreground">45 terms</p>
          </div>
          <Badge>🤖</Badge>
        </div>
      </CardContent>
    </Card>
  ),
  parameters: {
    docs: {
      description: {
        story: 'A compact card for category or list items.',
      },
    },
  },
};

export const LoadingCard: Story = {
  render: () => (
    <Card>
      <CardHeader>
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
          <div className="h-3 bg-gray-200 rounded w-1/2"></div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="animate-pulse space-y-2">
          <div className="h-3 bg-gray-200 rounded"></div>
          <div className="h-3 bg-gray-200 rounded w-5/6"></div>
          <div className="h-3 bg-gray-200 rounded w-4/6"></div>
        </div>
      </CardContent>
    </Card>
  ),
  parameters: {
    docs: {
      description: {
        story: 'A loading state card with skeleton animation.',
      },
    },
  },
};

export const ErrorCard: Story = {
  render: () => (
    <Card className="border-red-200">
      <CardHeader>
        <CardTitle className="text-red-600">Error Loading Content</CardTitle>
        <CardDescription>Failed to load the requested term. Please try again.</CardDescription>
      </CardHeader>
      <CardFooter>
        <Button variant="outline" className="w-full">
          Retry
        </Button>
      </CardFooter>
    </Card>
  ),
  parameters: {
    docs: {
      description: {
        story: 'An error state card with retry action.',
      },
    },
  },
};

export const DarkMode: Story = {
  render: () => (
    <Card>
      <CardHeader>
        <CardTitle>Neural Network</CardTitle>
        <CardDescription>A computing system inspired by biological neural networks</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">
          Neural networks are a fundamental concept in machine learning and artificial intelligence.
        </p>
      </CardContent>
      <CardFooter>
        <Button className="w-full">Learn More</Button>
      </CardFooter>
    </Card>
  ),
  parameters: {
    backgrounds: {
      default: 'dark',
    },
    docs: {
      description: {
        story: 'Card component in dark mode theme.',
      },
    },
  },
  decorators: [
    (Story) => (
      <div className="w-full max-w-md p-4 dark">
        <Story />
      </div>
    ),
  ],
};
