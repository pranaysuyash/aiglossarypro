import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import SimulationPlayer, { SimulationConfig } from './SimulationPlayer';

const meta: Meta<typeof SimulationPlayer> = {
  title: 'Interactive/SimulationPlayer',
  component: SimulationPlayer,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: 'An interactive simulation player for demonstrating algorithms and step-by-step processes.',
      },
    },
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof SimulationPlayer>;

// Bubble Sort Algorithm Simulation
const bubbleSortConfig: SimulationConfig = {
  title: 'Bubble Sort Algorithm',
  description: 'Watch how bubble sort compares and swaps adjacent elements to sort an array',
  autoPlay: false,
  loop: false,
  speed: 1.0,
  steps: [
    {
      id: 'init',
      title: 'Initialize Array',
      description: 'Starting with an unsorted array of numbers',
      data: { array: [64, 34, 25, 12, 22, 11, 90], comparisons: 0, swaps: 0 },
      duration: 2000,
    },
    {
      id: 'compare1',
      title: 'Compare 64 and 34',
      description: 'Compare first two elements. 64 > 34, so we swap them.',
      data: { array: [34, 64, 25, 12, 22, 11, 90], comparisons: 1, swaps: 1, highlight: [0, 1] },
      duration: 2500,
    },
    {
      id: 'compare2',
      title: 'Compare 64 and 25',
      description: 'Compare next pair. 64 > 25, so we swap them.',
      data: { array: [34, 25, 64, 12, 22, 11, 90], comparisons: 2, swaps: 2, highlight: [1, 2] },
      duration: 2500,
    },
    {
      id: 'compare3',
      title: 'Compare 64 and 12',
      description: 'Compare next pair. 64 > 12, so we swap them.',
      data: { array: [34, 25, 12, 64, 22, 11, 90], comparisons: 3, swaps: 3, highlight: [2, 3] },
      duration: 2500,
    },
    {
      id: 'compare4',
      title: 'Compare 64 and 22',
      description: 'Compare next pair. 64 > 22, so we swap them.',
      data: { array: [34, 25, 12, 22, 64, 11, 90], comparisons: 4, swaps: 4, highlight: [3, 4] },
      duration: 2500,
    },
    {
      id: 'compare5',
      title: 'Compare 64 and 11',
      description: 'Compare next pair. 64 > 11, so we swap them.',
      data: { array: [34, 25, 12, 22, 11, 64, 90], comparisons: 5, swaps: 5, highlight: [4, 5] },
      duration: 2500,
    },
    {
      id: 'compare6',
      title: 'Compare 64 and 90',
      description: 'Compare last pair. 64 < 90, so no swap needed.',
      data: { array: [34, 25, 12, 22, 11, 64, 90], comparisons: 6, swaps: 5, highlight: [5, 6] },
      duration: 2500,
    },
    {
      id: 'pass1',
      title: 'First Pass Complete',
      description: 'Largest element (90) is now in its correct position. Continue with remaining elements.',
      data: { array: [34, 25, 12, 22, 11, 64, 90], comparisons: 6, swaps: 5, sorted: [6] },
      duration: 3000,
    },
  ],
};

// Linear Search Simulation
const linearSearchConfig: SimulationConfig = {
  title: 'Linear Search Algorithm',
  description: 'Step-by-step demonstration of searching for a target value in an array',
  autoPlay: false,
  loop: true,
  speed: 1.5,
  steps: [
    {
      id: 'init',
      title: 'Initialize Search',
      description: 'Looking for target value 22 in the array',
      data: { array: [64, 34, 25, 12, 22, 11, 90], target: 22, current: -1, found: false },
      duration: 2000,
    },
    {
      id: 'check0',
      title: 'Check Index 0',
      description: 'Compare array[0] = 64 with target = 22. Not a match.',
      data: { array: [64, 34, 25, 12, 22, 11, 90], target: 22, current: 0, found: false },
      duration: 1500,
    },
    {
      id: 'check1',
      title: 'Check Index 1',
      description: 'Compare array[1] = 34 with target = 22. Not a match.',
      data: { array: [64, 34, 25, 12, 22, 11, 90], target: 22, current: 1, found: false },
      duration: 1500,
    },
    {
      id: 'check2',
      title: 'Check Index 2',
      description: 'Compare array[2] = 25 with target = 22. Not a match.',
      data: { array: [64, 34, 25, 12, 22, 11, 90], target: 22, current: 2, found: false },
      duration: 1500,
    },
    {
      id: 'check3',
      title: 'Check Index 3',
      description: 'Compare array[3] = 12 with target = 22. Not a match.',
      data: { array: [64, 34, 25, 12, 22, 11, 90], target: 22, current: 3, found: false },
      duration: 1500,
    },
    {
      id: 'found',
      title: 'Target Found!',
      description: 'Compare array[4] = 22 with target = 22. Match found at index 4!',
      data: { array: [64, 34, 25, 12, 22, 11, 90], target: 22, current: 4, found: true },
      duration: 3000,
    },
  ],
};

// Binary Search Tree Insertion
const bstInsertionConfig: SimulationConfig = {
  title: 'Binary Search Tree Insertion',
  description: 'Watch how elements are inserted into a binary search tree',
  autoPlay: false,
  loop: false,
  speed: 1.2,
  steps: [
    {
      id: 'empty',
      title: 'Empty Tree',
      description: 'Starting with an empty binary search tree',
      data: { tree: null, inserting: null },
      duration: 2000,
    },
    {
      id: 'insert50',
      title: 'Insert 50 (Root)',
      description: 'Insert 50 as the root of the tree',
      data: { tree: { value: 50, left: null, right: null }, inserting: 50 },
      duration: 2500,
    },
    {
      id: 'insert30',
      title: 'Insert 30',
      description: '30 < 50, so insert to the left of root',
      data: { 
        tree: { 
          value: 50, 
          left: { value: 30, left: null, right: null }, 
          right: null 
        }, 
        inserting: 30 
      },
      duration: 2500,
    },
    {
      id: 'insert70',
      title: 'Insert 70',
      description: '70 > 50, so insert to the right of root',
      data: { 
        tree: { 
          value: 50, 
          left: { value: 30, left: null, right: null }, 
          right: { value: 70, left: null, right: null }
        }, 
        inserting: 70 
      },
      duration: 2500,
    },
    {
      id: 'insert20',
      title: 'Insert 20',
      description: '20 < 50, go left. 20 < 30, insert to left of 30',
      data: { 
        tree: { 
          value: 50, 
          left: { 
            value: 30, 
            left: { value: 20, left: null, right: null }, 
            right: null 
          }, 
          right: { value: 70, left: null, right: null }
        }, 
        inserting: 20 
      },
      duration: 3000,
    },
  ],
};

export const BubbleSort: Story = {
  args: {
    config: bubbleSortConfig,
    renderStep: (step, index) => (
      <div className="p-6 bg-white dark:bg-gray-800 rounded-lg">
        <div className="flex justify-center mb-4">
          <div className="flex space-x-2">
            {step.data.array.map((value: number, i: number) => (
              <div
                key={i}
                className={`
                  w-12 h-12 flex items-center justify-center rounded border-2 font-bold text-sm
                  ${step.data.highlight?.includes(i) 
                    ? 'bg-yellow-200 border-yellow-400 text-yellow-800' 
                    : step.data.sorted?.includes(i)
                      ? 'bg-green-200 border-green-400 text-green-800'
                      : 'bg-blue-100 border-blue-300 text-blue-800'
                  }
                `}
              >
                {value}
              </div>
            ))}
          </div>
        </div>
        <div className="text-center text-sm text-gray-600 dark:text-gray-400">
          Comparisons: {step.data.comparisons} | Swaps: {step.data.swaps}
        </div>
      </div>
    ),
  },
};

export const LinearSearch: Story = {
  args: {
    config: linearSearchConfig,
    renderStep: (step, index) => (
      <div className="p-6 bg-white dark:bg-gray-800 rounded-lg">
        <div className="text-center mb-4">
          <span className="text-lg font-semibold">Target: {step.data.target}</span>
        </div>
        <div className="flex justify-center mb-4">
          <div className="flex space-x-2">
            {step.data.array.map((value: number, i: number) => (
              <div
                key={i}
                className={`
                  w-12 h-12 flex items-center justify-center rounded border-2 font-bold text-sm
                  ${i === step.data.current && step.data.found
                    ? 'bg-green-200 border-green-400 text-green-800'
                    : i === step.data.current
                      ? 'bg-yellow-200 border-yellow-400 text-yellow-800'
                      : i < step.data.current
                        ? 'bg-red-100 border-red-300 text-red-600'
                        : 'bg-blue-100 border-blue-300 text-blue-800'
                  }
                `}
              >
                {value}
              </div>
            ))}
          </div>
        </div>
        <div className="text-center text-sm">
          {step.data.found ? (
            <span className="text-green-600 font-semibold">Found at index {step.data.current}!</span>
          ) : step.data.current >= 0 ? (
            <span className="text-gray-600">Checking index {step.data.current}</span>
          ) : (
            <span className="text-gray-600">Ready to search...</span>
          )}
        </div>
      </div>
    ),
  },
};

export const BinarySearchTree: Story = {
  args: {
    config: bstInsertionConfig,
    renderStep: (step, index) => {
      const renderTree = (node: any, level = 0) => {
        if (!node) return null;
        
        return (
          <div className="flex flex-col items-center">
            <div className={`
              w-12 h-12 flex items-center justify-center rounded-full border-2 font-bold text-sm mb-2
              ${node.value === step.data.inserting 
                ? 'bg-green-200 border-green-400 text-green-800' 
                : 'bg-blue-100 border-blue-300 text-blue-800'
              }
            `}>
              {node.value}
            </div>
            {(node.left || node.right) && (
              <div className="flex space-x-8">
                <div className="text-center">
                  {node.left && renderTree(node.left, level + 1)}
                </div>
                <div className="text-center">
                  {node.right && renderTree(node.right, level + 1)}
                </div>
              </div>
            )}
          </div>
        );
      };

      return (
        <div className="p-6 bg-white dark:bg-gray-800 rounded-lg min-h-[300px] flex items-center justify-center">
          {step.data.tree ? renderTree(step.data.tree) : (
            <div className="text-gray-400 text-center">
              <div className="w-16 h-16 border-2 border-dashed border-gray-300 rounded-full mb-2"></div>
              <span>Empty Tree</span>
            </div>
          )}
        </div>
      );
    },
  },
};

export const AutoPlayDemo: Story = {
  args: {
    config: {
      ...linearSearchConfig,
      autoPlay: true,
      speed: 2.0,
    },
  },
};

export const BasicSimulation: Story = {
  args: {
    config: {
      title: 'Simple Counter',
      description: 'A basic counting simulation',
      steps: Array.from({ length: 5 }, (_, i) => ({
        id: `step-${i}`,
        title: `Step ${i + 1}`,
        description: `This is step number ${i + 1}`,
        data: { count: i + 1 },
        duration: 1000,
      })),
      autoPlay: false,
      loop: true,
      speed: 1.0,
    },
  },
};