import { describe, expect, it } from 'vitest';
import {
  type ContentNode,
  countTotalSubsections,
  createSlug,
  findNodeByPath,
  flattenStructure,
  getBreadcrumbPath,
} from '../content-structure';

describe('Content Structure Helper Functions', () => {
  // Mock data for testing
  const mockContentNode: ContentNode = {
    name: 'Introduction to AI',
    slug: 'introduction-to-ai',
    content: 'This is an introduction to artificial intelligence.',
    contentType: 'markdown',
    metadata: {
      isInteractive: false,
      displayType: 'main',
      parseType: 'simple',
      priority: 'high',
      estimatedReadTime: 5,
      prerequisites: [],
      relatedTopics: ['Machine Learning', 'Deep Learning'],
    },
    isCompleted: false,
    progress: 0,
    subsections: [
      {
        name: 'What is AI?',
        slug: 'what-is-ai',
        content: 'AI definition and overview.',
        contentType: 'markdown',
        metadata: {
          isInteractive: true,
          displayType: 'card',
          parseType: 'simple',
          priority: 'medium',
          estimatedReadTime: 3,
        },
        isCompleted: true,
        progress: 100,
        subsections: [
          {
            name: 'Types of AI',
            slug: 'types-of-ai',
            content: 'Different types of artificial intelligence.',
            contentType: 'interactive',
            metadata: {
              isInteractive: true,
              displayType: 'interactive',
              parseType: 'structured',
              priority: 'high',
              estimatedReadTime: 7,
            },
            isCompleted: false,
            progress: 25,
          },
        ],
      },
      {
        name: 'History of AI',
        slug: 'history-of-ai',
        content: 'The historical development of AI.',
        contentType: 'markdown',
        metadata: {
          isInteractive: false,
          displayType: 'main',
          parseType: 'list',
          priority: 'low',
          estimatedReadTime: 10,
        },
        isCompleted: false,
        progress: 0,
      },
    ],
  };

  const mockSectionsArray: ContentNode[] = [
    mockContentNode,
    {
      name: 'Machine Learning Basics',
      slug: 'machine-learning-basics',
      content: 'Introduction to machine learning.',
      contentType: 'code',
      metadata: {
        isInteractive: false,
        displayType: 'main',
        parseType: 'structured',
        priority: 'high',
        estimatedReadTime: 15,
      },
      isCompleted: false,
      progress: 50,
      subsections: [
        {
          name: 'Supervised Learning',
          slug: 'supervised-learning',
          content: 'Overview of supervised learning.',
          contentType: 'mermaid',
          metadata: {
            isInteractive: true,
            displayType: 'interactive',
            parseType: 'ai_parse',
            priority: 'medium',
            estimatedReadTime: 8,
          },
          isCompleted: true,
          progress: 100,
        },
      ],
    },
    {
      name: 'Deep Learning',
      slug: 'deep-learning',
      content: 'Advanced neural network concepts.',
      contentType: 'json',
      metadata: {
        isInteractive: false,
        displayType: 'sidebar',
        parseType: 'structured',
        priority: 'high',
        estimatedReadTime: 20,
      },
      isCompleted: false,
      progress: 0,
    },
  ];

  describe('createSlug', () => {
    it('should convert section name to lowercase slug', () => {
      const result = createSlug('Introduction to AI');
      expect(result).toBe('introduction-to-ai');
    });

    it('should handle special characters and spaces', () => {
      const result = createSlug('Neural Networks & Deep Learning!');
      expect(result).toBe('neural-networks-deep-learning');
    });

    it('should handle multiple consecutive spaces', () => {
      const result = createSlug('Machine    Learning     Basics');
      expect(result).toBe('machine-learning-basics');
    });

    it('should handle numbers and mixed case', () => {
      const result = createSlug('AI in 2024: The Future');
      expect(result).toBe('ai-in-2024-the-future');
    });

    it('should handle leading and trailing spaces/hyphens', () => {
      const result = createSlug('  -Neural Networks-  ');
      expect(result).toBe('neural-networks');
    });

    it('should handle empty string', () => {
      const result = createSlug('');
      expect(result).toBe('');
    });

    it('should handle only special characters', () => {
      const result = createSlug('!@#$%^&*()');
      expect(result).toBe('');
    });

    it('should handle Unicode characters', () => {
      const result = createSlug('Réseau de Neurones');
      expect(result).toBe('r-seau-de-neurones');
    });

    it('should handle programming language names', () => {
      const result = createSlug('C++ Programming');
      expect(result).toBe('c-programming');
    });

    it('should handle acronyms and abbreviations', () => {
      const result = createSlug('AI/ML/DL Overview');
      expect(result).toBe('ai-ml-dl-overview');
    });
  });

  describe('countTotalSubsections', () => {
    it('should count subsections recursively', () => {
      const result = countTotalSubsections(mockContentNode);
      expect(result).toBe(3); // 2 direct subsections + 1 nested subsection
    });

    it('should return 0 for node without subsections', () => {
      const nodeWithoutSubsections: ContentNode = {
        name: 'Simple Node',
        content: 'No subsections here',
      };
      const result = countTotalSubsections(nodeWithoutSubsections);
      expect(result).toBe(0);
    });

    it('should return 0 for node with empty subsections array', () => {
      const nodeWithEmptySubsections: ContentNode = {
        name: 'Empty Subsections',
        content: 'Empty array',
        subsections: [],
      };
      const result = countTotalSubsections(nodeWithEmptySubsections);
      expect(result).toBe(0);
    });

    it('should handle deep nesting', () => {
      const deeplyNested: ContentNode = {
        name: 'Level 1',
        subsections: [
          {
            name: 'Level 2',
            subsections: [
              {
                name: 'Level 3',
                subsections: [
                  {
                    name: 'Level 4',
                  },
                ],
              },
            ],
          },
        ],
      };
      const result = countTotalSubsections(deeplyNested);
      expect(result).toBe(3); // 1 + 1 + 1 subsections across all levels
    });

    it('should handle multiple branches', () => {
      const multipleBranches: ContentNode = {
        name: 'Root',
        subsections: [
          {
            name: 'Branch 1',
            subsections: [{ name: 'Leaf 1' }, { name: 'Leaf 2' }],
          },
          {
            name: 'Branch 2',
            subsections: [{ name: 'Leaf 3' }],
          },
        ],
      };
      const result = countTotalSubsections(multipleBranches);
      expect(result).toBe(5); // 2 branches + 3 leaves
    });
  });

  describe('flattenStructure', () => {
    it('should flatten nested structure with correct paths and depths', () => {
      const result = flattenStructure(mockSectionsArray);

      expect(result.length).toBeGreaterThan(3); // At least 3 root nodes

      // Check root level items
      expect(result[0].name).toBe('Introduction to AI');
      expect(result[0].path).toBe('0');
      expect(result[0].depth).toBe(0);
      expect(result[0].node).toBe(mockSectionsArray[0]);

      // Check we have nested items
      const nestedItems = result.filter(item => item.depth > 0);
      expect(nestedItems.length).toBeGreaterThan(0);
    });

    it('should handle nested subsections with correct paths', () => {
      const result = flattenStructure(mockSectionsArray);

      // Check nested items
      const nestedItems = result.filter(item => item.depth > 0);
      expect(nestedItems.length).toBeGreaterThan(0);

      // Check paths for nested items from first section
      const aiSubsections = nestedItems.filter(item => item.path.startsWith('0.'));
      expect(aiSubsections.length).toBeGreaterThan(0);

      if (aiSubsections.length > 0) {
        expect(aiSubsections[0].path).toBe('0.0');
        expect(aiSubsections[0].depth).toBe(1);
      }
    });

    it('should handle empty array', () => {
      const result = flattenStructure([]);
      expect(result).toHaveLength(0);
    });

    it('should handle single node without subsections', () => {
      const singleNode: ContentNode[] = [
        {
          name: 'Single Node',
          content: 'Just one node',
        },
      ];

      const result = flattenStructure(singleNode);
      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        name: 'Single Node',
        path: '0',
        depth: 0,
        node: singleNode[0],
      });
    });

    it('should handle custom parent path', () => {
      const singleNode: ContentNode[] = [
        {
          name: 'Test Node',
          content: 'Test content',
        },
      ];

      const result = flattenStructure(singleNode, '1.2');
      expect(result[0].path).toBe('1.2.0');
      expect(result[0].depth).toBe(2);
    });

    it('should preserve all node properties', () => {
      const result = flattenStructure([mockContentNode]);

      expect(result[0].node).toBe(mockContentNode);
      expect(result[0].node.metadata).toBeDefined();
      expect(result[0].node.contentType).toBe('markdown');
      expect(result[0].node.isCompleted).toBe(false);
      expect(result[0].node.progress).toBe(0);
    });
  });

  describe('findNodeByPath', () => {
    it('should find root level nodes', () => {
      const result = findNodeByPath(mockSectionsArray, '0');
      expect(result).toBe(mockSectionsArray[0]);

      const result2 = findNodeByPath(mockSectionsArray, '1');
      expect(result2).toBe(mockSectionsArray[1]);
    });

    it('should find nested nodes with simple test data', () => {
      const simpleData: ContentNode[] = [
        {
          name: 'Root Node',
          content: 'Root content',
          subsections: [
            {
              name: 'Child Node',
              content: 'Child content',
              subsections: [
                {
                  name: 'Grandchild Node',
                  content: 'Grandchild content',
                },
              ],
            },
          ],
        },
      ];

      const result = findNodeByPath(simpleData, '0.0');
      expect(result?.name).toBe('Child Node');

      const result2 = findNodeByPath(simpleData, '0.0.0');
      expect(result2?.name).toBe('Grandchild Node');
    });

    it('should return null for invalid paths', () => {
      const result = findNodeByPath(mockSectionsArray, '999');
      expect(result).toBeNull();

      const result2 = findNodeByPath(mockSectionsArray, '0.999');
      expect(result2).toBeNull();
    });

    it('should handle empty path', () => {
      const result = findNodeByPath(mockSectionsArray, '');
      expect(result).toBeNull();
    });

    it('should handle malformed paths', () => {
      const result = findNodeByPath(mockSectionsArray, 'invalid.path');
      expect(result).toBeNull();

      const result2 = findNodeByPath(mockSectionsArray, '0.invalid');
      expect(result2).toBeNull();
    });

    it('should handle paths with non-existent subsections', () => {
      const result = findNodeByPath(mockSectionsArray, '2.0'); // Deep Learning has no subsections
      expect(result).toBeNull();
    });

    it('should handle deeply nested paths with simple data', () => {
      const simpleData: ContentNode[] = [
        {
          name: 'Root',
          content: 'Root content',
          subsections: [
            {
              name: 'Level 1',
              content: 'Level 1 content',
              subsections: [
                {
                  name: 'Level 2',
                  content: 'Level 2 content',
                  contentType: 'interactive',
                },
              ],
            },
          ],
        },
      ];

      const result = findNodeByPath(simpleData, '0.0.0');
      expect(result?.name).toBe('Level 2');
      expect(result?.contentType).toBe('interactive');
    });

    it('should handle empty nodes array', () => {
      const result = findNodeByPath([], '0');
      expect(result).toBeNull();
    });
  });

  describe('getBreadcrumbPath', () => {
    it('should generate breadcrumb path for root level', () => {
      const result = getBreadcrumbPath(mockSectionsArray, '0');
      expect(result).toEqual(['Introduction to AI']);
    });

    it('should generate breadcrumb path for nested items', () => {
      const result = getBreadcrumbPath(mockSectionsArray, '0.0');
      expect(result).toEqual(['Introduction to AI', 'What is AI?']);
    });

    it('should generate breadcrumb path for deeply nested items', () => {
      const result = getBreadcrumbPath(mockSectionsArray, '0.0.0');
      expect(result).toEqual(['Introduction to AI', 'What is AI?', 'Types of AI']);
    });

    it('should handle invalid paths gracefully', () => {
      const result = getBreadcrumbPath(mockSectionsArray, '999');
      expect(result).toEqual([]);
    });

    it('should handle empty path', () => {
      const result = getBreadcrumbPath(mockSectionsArray, '');
      expect(result).toEqual([]);
    });

    it('should handle malformed paths', () => {
      const result = getBreadcrumbPath(mockSectionsArray, 'invalid.path');
      expect(result).toEqual([]);
    });

    it('should handle partial invalid paths', () => {
      const result = getBreadcrumbPath(mockSectionsArray, '0.999');
      expect(result).toEqual(['Introduction to AI']);
    });

    it('should handle empty nodes array', () => {
      const result = getBreadcrumbPath([], '0');
      expect(result).toEqual([]);
    });

    it('should handle single level path', () => {
      const result = getBreadcrumbPath(mockSectionsArray, '1');
      expect(result).toEqual(['Machine Learning Basics']);
    });

    it('should handle paths with nodes that have no subsections', () => {
      const result = getBreadcrumbPath(mockSectionsArray, '2.0');
      expect(result).toEqual(['Deep Learning']);
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle nodes with null/undefined values', () => {
      const nodesWithNulls: ContentNode[] = [
        {
          name: 'Valid Node',
          content: 'Valid content',
        },
        {
          name: '',
          content: undefined as unknown,
        },
      ];

      expect(() => flattenStructure(nodesWithNulls)).not.toThrow();
      expect(() => findNodeByPath(nodesWithNulls, '0')).not.toThrow();
      expect(() => getBreadcrumbPath(nodesWithNulls, '0')).not.toThrow();
    });

    it('should handle very large numbers in paths', () => {
      const result = findNodeByPath(mockSectionsArray, '999999999');
      expect(result).toBeNull();
    });

    it('should handle negative numbers in paths', () => {
      const result = findNodeByPath(mockSectionsArray, '-1');
      expect(result).toBeNull();
    });

    it('should handle paths with decimal numbers', () => {
      const result = findNodeByPath(mockSectionsArray, '0.5');
      expect(result).toBeNull();
    });

    it('should handle nodes with many subsections', () => {
      const nodeWithManySubsections: ContentNode = {
        name: 'Node with Many Subsections',
        content: 'Content with many children',
        subsections: Array.from({ length: 100 }, (_, i) => ({
          name: `Subsection ${i + 1}`,
          content: `Content ${i + 1}`,
        })),
      };

      expect(() => countTotalSubsections(nodeWithManySubsections)).not.toThrow();
      expect(() => flattenStructure([nodeWithManySubsections])).not.toThrow();
    });
  });

  describe('Performance Tests', () => {
    it('should handle large datasets efficiently', () => {
      // Create a large dataset
      const largeDataset: ContentNode[] = [];
      for (let i = 0; i < 1000; i++) {
        largeDataset.push({
          name: `Node ${i}`,
          content: `Content for node ${i}`,
          subsections:
            i % 10 === 0
              ? [
                  {
                    name: `Subsection ${i}`,
                    content: `Subsection content ${i}`,
                  },
                ]
              : undefined,
        });
      }

      const start = performance.now();
      const flattened = flattenStructure(largeDataset);
      const end = performance.now();

      expect(flattened.length).toBeGreaterThan(1000);
      expect(end - start).toBeLessThan(100); // Should complete in under 100ms
    });

    it('should handle moderate nesting efficiently', () => {
      // Create moderately nested structure (10 levels to avoid stack overflow)
      let deepNode: ContentNode = {
        name: 'Deep Node Level 10',
        content: 'Deepest content',
      };

      for (let i = 9; i >= 0; i--) {
        deepNode = {
          name: `Deep Node Level ${i}`,
          content: `Content for level ${i}`,
          subsections: [deepNode],
        };
      }

      const start = performance.now();
      const count = countTotalSubsections(deepNode);
      const flattened = flattenStructure([deepNode]);
      const found = findNodeByPath([deepNode], '0.0.0.0.0');
      const end = performance.now();

      expect(count).toBe(10);
      expect(flattened.length).toBe(11);
      expect(found).toBeTruthy();
      expect(end - start).toBeLessThan(50); // Should complete in under 50ms
    });
  });
});
