import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from './table';
import { Badge } from './badge';
import { Button } from './button';
import { Checkbox } from './checkbox';

const meta: Meta<typeof Table> = {
  title: 'UI/Table',
  component: Table,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <div className="w-full max-w-4xl">
      <Table>
        <TableCaption>AI/ML Terms and Definitions</TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead>Term</TableHead>
            <TableHead>Category</TableHead>
            <TableHead>Difficulty</TableHead>
            <TableHead className="text-right">Views</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow>
            <TableCell className="font-medium">Machine Learning</TableCell>
            <TableCell>Artificial Intelligence</TableCell>
            <TableCell>Beginner</TableCell>
            <TableCell className="text-right">15,482</TableCell>
          </TableRow>
          <TableRow>
            <TableCell className="font-medium">Deep Learning</TableCell>
            <TableCell>Neural Networks</TableCell>
            <TableCell>Intermediate</TableCell>
            <TableCell className="text-right">12,739</TableCell>
          </TableRow>
          <TableRow>
            <TableCell className="font-medium">Transformer</TableCell>
            <TableCell>Natural Language Processing</TableCell>
            <TableCell>Advanced</TableCell>
            <TableCell className="text-right">8,956</TableCell>
          </TableRow>
          <TableRow>
            <TableCell className="font-medium">Convolutional Neural Network</TableCell>
            <TableCell>Computer Vision</TableCell>
            <TableCell>Intermediate</TableCell>
            <TableCell className="text-right">9,834</TableCell>
          </TableRow>
          <TableRow>
            <TableCell className="font-medium">Reinforcement Learning</TableCell>
            <TableCell>Machine Learning</TableCell>
            <TableCell>Advanced</TableCell>
            <TableCell className="text-right">6,127</TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </div>
  ),
};

export const WithBadges: Story = {
  render: () => (
    <div className="w-full max-w-5xl">
      <Table>
        <TableCaption>AI Models and Their Characteristics</TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead>Model Name</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Parameters</TableHead>
            <TableHead>Use Cases</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow>
            <TableCell className="font-medium">GPT-4</TableCell>
            <TableCell>Language Model</TableCell>
            <TableCell>
              <Badge variant="default">Active</Badge>
            </TableCell>
            <TableCell>~1.76T</TableCell>
            <TableCell>Text generation, Chat, Code</TableCell>
          </TableRow>
          <TableRow>
            <TableCell className="font-medium">BERT</TableCell>
            <TableCell>Language Model</TableCell>
            <TableCell>
              <Badge variant="secondary">Stable</Badge>
            </TableCell>
            <TableCell>340M</TableCell>
            <TableCell>Text classification, NER</TableCell>
          </TableRow>
          <TableRow>
            <TableCell className="font-medium">ResNet-50</TableCell>
            <TableCell>Vision Model</TableCell>
            <TableCell>
              <Badge variant="secondary">Stable</Badge>
            </TableCell>
            <TableCell>25.6M</TableCell>
            <TableCell>Image classification</TableCell>
          </TableRow>
          <TableRow>
            <TableCell className="font-medium">DALL-E 3</TableCell>
            <TableCell>Multimodal</TableCell>
            <TableCell>
              <Badge variant="default">Active</Badge>
            </TableCell>
            <TableCell>Unknown</TableCell>
            <TableCell>Text-to-image generation</TableCell>
          </TableRow>
          <TableRow>
            <TableCell className="font-medium">AlphaGo</TableCell>
            <TableCell>Reinforcement Learning</TableCell>
            <TableCell>
              <Badge variant="outline">Retired</Badge>
            </TableCell>
            <TableCell>-</TableCell>
            <TableCell>Game playing</TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </div>
  ),
};

export const WithActions: Story = {
  render: () => (
    <div className="w-full max-w-6xl">
      <Table>
        <TableCaption>User Contributions and Feedback</TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead>Contributor</TableHead>
            <TableHead>Term</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow>
            <TableCell className="font-medium">Dr. Sarah Chen</TableCell>
            <TableCell>Quantum Machine Learning</TableCell>
            <TableCell>New Definition</TableCell>
            <TableCell>2024-01-15</TableCell>
            <TableCell>
              <Badge variant="default">Pending</Badge>
            </TableCell>
            <TableCell className="text-right">
              <div className="flex gap-2 justify-end">
                <Button variant="outline" size="sm">Review</Button>
                <Button variant="default" size="sm">Approve</Button>
              </div>
            </TableCell>
          </TableRow>
          <TableRow>
            <TableCell className="font-medium">Michael Rodriguez</TableCell>
            <TableCell>Neural Architecture Search</TableCell>
            <TableCell>Edit Suggestion</TableCell>
            <TableCell>2024-01-14</TableCell>
            <TableCell>
              <Badge variant="secondary">Approved</Badge>
            </TableCell>
            <TableCell className="text-right">
              <div className="flex gap-2 justify-end">
                <Button variant="outline" size="sm">View</Button>
              </div>
            </TableCell>
          </TableRow>
          <TableRow>
            <TableCell className="font-medium">Emily Watson</TableCell>
            <TableCell>Federated Learning</TableCell>
            <TableCell>Correction</TableCell>
            <TableCell>2024-01-13</TableCell>
            <TableCell>
              <Badge variant="destructive">Rejected</Badge>
            </TableCell>
            <TableCell className="text-right">
              <div className="flex gap-2 justify-end">
                <Button variant="outline" size="sm">Feedback</Button>
              </div>
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </div>
  ),
};

export const WithSelection: Story = {
  render: () => {
    const [selectedRows, setSelectedRows] = React.useState<string[]>([]);
    
    const toggleRow = (id: string) => {
      setSelectedRows(prev => 
        prev.includes(id) 
          ? prev.filter(rowId => rowId !== id)
          : [...prev, id]
      );
    };

    const toggleAll = () => {
      setSelectedRows(prev => 
        prev.length === 5 ? [] : ['1', '2', '3', '4', '5']
      );
    };

    return (
      <div className="w-full max-w-5xl">
        <Table>
          <TableCaption>Select AI Terms for Bulk Operations</TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">
                <Checkbox
                  checked={selectedRows.length === 5}
                  onCheckedChange={toggleAll}
                />
              </TableHead>
              <TableHead>Term</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Last Updated</TableHead>
              <TableHead>Confidence Score</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {[
              { id: '1', term: 'Attention Mechanism', category: 'Deep Learning', date: '2024-01-15', score: 95 },
              { id: '2', term: 'Gradient Descent', category: 'Optimization', date: '2024-01-14', score: 92 },
              { id: '3', term: 'Backpropagation', category: 'Neural Networks', date: '2024-01-13', score: 98 },
              { id: '4', term: 'Overfitting', category: 'Model Training', date: '2024-01-12', score: 89 },
              { id: '5', term: 'Cross-Validation', category: 'Evaluation', date: '2024-01-11', score: 94 },
            ].map((row) => (
              <TableRow key={row.id} data-state={selectedRows.includes(row.id) ? "selected" : ""}>
                <TableCell>
                  <Checkbox
                    checked={selectedRows.includes(row.id)}
                    onCheckedChange={() => toggleRow(row.id)}
                  />
                </TableCell>
                <TableCell className="font-medium">{row.term}</TableCell>
                <TableCell>{row.category}</TableCell>
                <TableCell>{row.date}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-green-600 h-2 rounded-full" 
                        style={{ width: `${row.score}%` }}
                      />
                    </div>
                    <span className="text-sm">{row.score}%</span>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {selectedRows.length > 0 && (
          <div className="mt-4 p-3 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-800">
              {selectedRows.length} term(s) selected. 
              <Button variant="link" className="p-0 ml-2 h-auto">
                Bulk Edit
              </Button>
            </p>
          </div>
        )}
      </div>
    );
  },
};

export const DataTable: Story = {
  render: () => (
    <div className="w-full max-w-6xl">
      <Table>
        <TableCaption>AI Research Papers Database</TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead>Title</TableHead>
            <TableHead>Authors</TableHead>
            <TableHead>Conference</TableHead>
            <TableHead>Year</TableHead>
            <TableHead>Citations</TableHead>
            <TableHead className="text-right">Impact Factor</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow>
            <TableCell className="font-medium">Attention Is All You Need</TableCell>
            <TableCell>Vaswani et al.</TableCell>
            <TableCell>NIPS</TableCell>
            <TableCell>2017</TableCell>
            <TableCell>52,847</TableCell>
            <TableCell className="text-right">9.8</TableCell>
          </TableRow>
          <TableRow>
            <TableCell className="font-medium">BERT: Pre-training of Deep Bidirectional Transformers</TableCell>
            <TableCell>Devlin et al.</TableCell>
            <TableCell>NAACL</TableCell>
            <TableCell>2019</TableCell>
            <TableCell>41,923</TableCell>
            <TableCell className="text-right">8.7</TableCell>
          </TableRow>
          <TableRow>
            <TableCell className="font-medium">ResNet: Deep Residual Learning for Image Recognition</TableCell>
            <TableCell>He et al.</TableCell>
            <TableCell>CVPR</TableCell>
            <TableCell>2016</TableCell>
            <TableCell>89,156</TableCell>
            <TableCell className="text-right">9.9</TableCell>
          </TableRow>
          <TableRow>
            <TableCell className="font-medium">Generative Adversarial Networks</TableCell>
            <TableCell>Goodfellow et al.</TableCell>
            <TableCell>NIPS</TableCell>
            <TableCell>2014</TableCell>
            <TableCell>45,672</TableCell>
            <TableCell className="text-right">9.5</TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </div>
  ),
};

export const ResponsiveTable: Story = {
  render: () => (
    <div className="w-full max-w-full overflow-x-auto">
      <Table>
        <TableCaption>AI Model Performance Comparison</TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead>Model</TableHead>
            <TableHead>Architecture</TableHead>
            <TableHead>Dataset</TableHead>
            <TableHead>Accuracy</TableHead>
            <TableHead>Precision</TableHead>
            <TableHead>Recall</TableHead>
            <TableHead>F1-Score</TableHead>
            <TableHead>Training Time</TableHead>
            <TableHead className="text-right">Memory Usage</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow>
            <TableCell className="font-medium">ResNet-50</TableCell>
            <TableCell>Convolutional</TableCell>
            <TableCell>ImageNet</TableCell>
            <TableCell>76.1%</TableCell>
            <TableCell>75.8%</TableCell>
            <TableCell>76.1%</TableCell>
            <TableCell>75.9%</TableCell>
            <TableCell>2.5 hrs</TableCell>
            <TableCell className="text-right">98 MB</TableCell>
          </TableRow>
          <TableRow>
            <TableCell className="font-medium">Vision Transformer</TableCell>
            <TableCell>Transformer</TableCell>
            <TableCell>ImageNet</TableCell>
            <TableCell>81.8%</TableCell>
            <TableCell>82.1%</TableCell>
            <TableCell>81.8%</TableCell>
            <TableCell>82.0%</TableCell>
            <TableCell>4.2 hrs</TableCell>
            <TableCell className="text-right">632 MB</TableCell>
          </TableRow>
          <TableRow>
            <TableCell className="font-medium">EfficientNet-B7</TableCell>
            <TableCell>Convolutional</TableCell>
            <TableCell>ImageNet</TableCell>
            <TableCell>84.3%</TableCell>
            <TableCell>84.6%</TableCell>
            <TableCell>84.3%</TableCell>
            <TableCell>84.4%</TableCell>
            <TableCell>6.8 hrs</TableCell>
            <TableCell className="text-right">256 MB</TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </div>
  ),
};

export const EmptyState: Story = {
  render: () => (
    <div className="w-full max-w-4xl">
      <Table>
        <TableCaption>No AI terms found matching your criteria</TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead>Term</TableHead>
            <TableHead>Category</TableHead>
            <TableHead>Difficulty</TableHead>
            <TableHead className="text-right">Views</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow>
            <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
              No results found. Try adjusting your search criteria.
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </div>
  ),
};

export const WithFooter: Story = {
  render: () => (
    <div className="w-full max-w-5xl">
      <Table>
        <TableCaption>Monthly AI Term Engagement Statistics</TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead>Category</TableHead>
            <TableHead className="text-right">Views</TableHead>
            <TableHead className="text-right">Searches</TableHead>
            <TableHead className="text-right">Bookmarks</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow>
            <TableCell className="font-medium">Machine Learning</TableCell>
            <TableCell className="text-right">45,678</TableCell>
            <TableCell className="text-right">12,456</TableCell>
            <TableCell className="text-right">3,789</TableCell>
          </TableRow>
          <TableRow>
            <TableCell className="font-medium">Deep Learning</TableCell>
            <TableCell className="text-right">38,924</TableCell>
            <TableCell className="text-right">9,832</TableCell>
            <TableCell className="text-right">2,967</TableCell>
          </TableRow>
          <TableRow>
            <TableCell className="font-medium">Computer Vision</TableCell>
            <TableCell className="text-right">29,156</TableCell>
            <TableCell className="text-right">7,423</TableCell>
            <TableCell className="text-right">2,145</TableCell>
          </TableRow>
          <TableRow>
            <TableCell className="font-medium">Natural Language Processing</TableCell>
            <TableCell className="text-right">33,842</TableCell>
            <TableCell className="text-right">8,675</TableCell>
            <TableCell className="text-right">2,534</TableCell>
          </TableRow>
        </TableBody>
        <TableFooter>
          <TableRow>
            <TableCell className="font-medium">Total</TableCell>
            <TableCell className="text-right font-medium">147,600</TableCell>
            <TableCell className="text-right font-medium">38,386</TableCell>
            <TableCell className="text-right font-medium">11,435</TableCell>
          </TableRow>
        </TableFooter>
      </Table>
    </div>
  ),
};
