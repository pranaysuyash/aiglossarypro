import type { Express, Request, Response } from 'express';
import { enhancedStorage } from './enhancedTermsStorage';
import { mockIsAuthenticated } from './middleware/dev/mockAuth';

import logger from './utils/logger';
/**
 * Demo routes to showcase the enhanced API capabilities
 * These routes demonstrate the full functionality of the enhanced parsing system
 */
export function registerEnhancedDemoRoutes(app: Express): void {
  /**
   * Demo endpoint showcasing enhanced search capabilities
   * GET /api/demo/enhanced-search
   */
  app.get('/api/demo/enhanced-search', async (_req: Request, res: Response) => {
    try {
      // Demo search with various filter combinations
      const demoSearches = [
        {
          name: 'Basic AI Search',
          params: {
            query: 'neural network',
            page: 1,
            limit: 5,
          },
        },
        {
          name: 'Advanced ML with Code Examples',
          params: {
            query: 'machine learning',
            page: 1,
            limit: 5,
            difficultyLevel: 'Advanced',
            hasCodeExamples: true,
          },
        },
        {
          name: 'Beginner Deep Learning',
          params: {
            query: 'deep learning',
            page: 1,
            limit: 5,
            difficultyLevel: 'Beginner',
            hasInteractiveElements: true,
          },
        },
      ];

      const searchResults = [];

      for (const demo of demoSearches) {
        try {
          const result = await enhancedStorage.enhancedSearch(demo.params);
          searchResults.push({
            ...demo,
            results: result,
            success: true,
          });
        } catch (error) {
          searchResults.push({
            ...demo,
            error: error instanceof Error ? error.message : 'Unknown error',
            success: false,
          });
        }
      }

      res.json({
        title: 'Enhanced Search Demonstration',
        description: 'Showcasing advanced search capabilities with multiple filters',
        searches: searchResults,
      });
    } catch (error) {
      logger.error('Error in enhanced search demo:', error);
      res.status(500).json({
        message: 'Demo failed',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  /**
   * Demo endpoint for filtering capabilities
   * GET /api/demo/advanced-filtering
   */
  app.get('/api/demo/advanced-filtering', async (_req: Request, res: Response) => {
    try {
      const demoFilters = [
        {
          name: 'All Advanced Terms',
          params: {
            page: 1,
            limit: 10,
            difficultyLevel: 'Advanced',
            sortBy: 'viewCount',
            sortOrder: 'desc',
          },
        },
        {
          name: 'Terms with Interactive Elements',
          params: {
            page: 1,
            limit: 10,
            hasInteractiveElements: true,
            sortBy: 'name',
            sortOrder: 'asc',
          },
        },
        {
          name: 'Computer Vision Applications',
          params: {
            page: 1,
            limit: 10,
            applicationDomains: 'Computer Vision,Image Processing',
            hasCodeExamples: true,
            sortBy: 'createdAt',
            sortOrder: 'desc',
          },
        },
      ];

      const filterResults = [];

      for (const demo of demoFilters) {
        try {
          const result = await enhancedStorage.advancedFilter(demo.params);
          filterResults.push({
            ...demo,
            results: result,
            success: true,
          });
        } catch (error) {
          filterResults.push({
            ...demo,
            error: error instanceof Error ? error.message : 'Unknown error',
            success: false,
          });
        }
      }

      res.json({
        title: 'Advanced Filtering Demonstration',
        description: 'Showcasing complex filtering with multiple criteria and sorting',
        filters: filterResults,
      });
    } catch (error) {
      logger.error('Error in advanced filtering demo:', error);
      res.status(500).json({
        message: 'Demo failed',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  /**
   * Demo endpoint for faceted search
   * GET /api/demo/search-facets
   */
  app.get('/api/demo/search-facets', async (_req: Request, res: Response) => {
    try {
      const facets = await enhancedStorage.getSearchFacets();

      res.json({
        title: 'Search Facets Demonstration',
        description: 'Available filter categories for building dynamic search interfaces',
        facets: facets,
        usage: {
          categories: 'Use these to build category filter dropdowns',
          difficulties: 'Build difficulty level filters',
          domains: 'Create application domain filters',
          techniques: 'Filter by specific algorithms or techniques',
        },
      });
    } catch (error) {
      logger.error('Error in search facets demo:', error);
      res.status(500).json({
        message: 'Demo failed',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  /**
   * Demo endpoint for personalized features
   * GET /api/demo/personalization
   */
  app.get('/api/demo/personalization', mockIsAuthenticated, async (req: any, res: Response) => {
    try {
      const userId = req.user.claims.sub;

      // Get user preferences
      const preferences = await enhancedStorage.getUserPreferences(userId);

      // Get personalized recommendations
      const recommendations = await enhancedStorage.getPersonalizedRecommendations(userId, 5);

      // Get suggestions for improvement
      const suggestions = await enhancedStorage.getAutocompleteSuggestions('neural', 5);

      res.json({
        title: 'Personalization Features Demonstration',
        description: 'Showcasing user-specific preferences and recommendations',
        data: {
          userPreferences: preferences,
          personalizedRecommendations: recommendations,
          autocompleteSuggestions: suggestions,
        },
        features: {
          preferences: 'Users can customize their experience based on skill level and interests',
          recommendations: 'AI-powered suggestions based on user behavior and preferences',
          autocomplete: 'Smart search suggestions as users type',
        },
      });
    } catch (error) {
      logger.error('Error in personalization demo:', error);
      res.status(500).json({
        message: 'Demo failed',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  /**
   * Demo endpoint for analytics features
   * GET /api/demo/analytics
   */
  app.get('/api/demo/analytics', mockIsAuthenticated, async (req: any, res: Response) => {
    try {
      const userId = req.user.claims.sub;
      const _user = await enhancedStorage.getUser(userId);

      // For demo purposes, allow all authenticated users to see analytics
      // In production, you'd check for admin role

      const overview = await enhancedStorage.getAnalyticsOverview();
      const processingStats = await enhancedStorage.getProcessingStats();

      res.json({
        title: 'Analytics Dashboard Demonstration',
        description: 'Comprehensive analytics for content performance and user engagement',
        data: {
          overview: overview,
          processingStats: processingStats,
        },
        features: {
          contentAnalytics: 'Track which terms are most popular and well-rated',
          userEngagement: 'Monitor how users interact with different content types',
          qualityMetrics: 'Identify content that needs improvement based on user feedback',
          processingStats: 'Monitor the enhanced parsing system performance',
        },
      });
    } catch (error) {
      logger.error('Error in analytics demo:', error);
      res.status(500).json({
        message: 'Demo failed',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  /**
   * Demo endpoint showcasing complete enhanced term structure
   * GET /api/demo/enhanced-term-structure
   */
  app.get('/api/demo/enhanced-term-structure', async (_req: Request, res: Response) => {
    try {
      // This would demonstrate the full structure of an enhanced term
      // For demo purposes, we'll create a mock structure

      const mockEnhancedTerm = {
        id: 'demo-term-id',
        name: 'Convolutional Neural Network',
        slug: 'convolutional-neural-network',
        shortDefinition:
          'A type of deep neural network designed for processing grid-like data such as images.',
        fullDefinition:
          'A Convolutional Neural Network (CNN) is a class of deep neural networks most commonly applied to analyze visual imagery...',

        // Enhanced categorization
        mainCategories: ['Deep Learning', 'Computer Vision', 'Neural Networks'],
        subCategories: ['CNN', 'Image Processing', 'Feature Extraction'],
        relatedConcepts: ['Pooling', 'Convolution', 'Backpropagation'],
        applicationDomains: ['Computer Vision', 'Medical Imaging', 'Autonomous Vehicles'],
        techniques: ['Convolution', 'Max Pooling', 'Dropout'],

        // Metadata
        difficultyLevel: 'Advanced',
        hasImplementation: true,
        hasInteractiveElements: true,
        hasCaseStudies: true,
        hasCodeExamples: true,

        // Structure sections (42 sections)
        sections: [
          {
            sectionName: 'Introduction',
            displayType: 'main',
            priority: 10,
            sectionData: {
              definition_and_overview:
                'CNNs are specialized neural networks for processing grid-like data...',
              key_concepts_and_principles: [
                'Spatial locality',
                'Parameter sharing',
                'Translation invariance',
              ],
              importance_and_relevance:
                'CNNs revolutionized computer vision by achieving human-level performance...',
            },
          },
          {
            sectionName: 'Theoretical Concepts',
            displayType: 'main',
            priority: 8,
            sectionData: {
              mathematical_foundations: 'Convolution operation: (f * g)(t) = ∫ f(τ)g(t - τ)dτ',
              underlying_algorithms: ['Convolution', 'Pooling', 'Backpropagation'],
              assumptions_and_limitations: 'Assumes spatial locality and translation invariance',
            },
          },
          {
            sectionName: 'Implementation',
            displayType: 'main',
            priority: 7,
            sectionData: {
              popular_languages: ['Python', 'TensorFlow', 'PyTorch'],
              code_snippets:
                '```python\nimport tensorflow as tf\nmodel = tf.keras.Sequential([...])```',
              practical_challenges: 'Overfitting, vanishing gradients, computational complexity',
            },
          },
        ],

        // Interactive elements
        interactiveElements: [
          {
            elementType: 'mermaid',
            elementData: {
              type: 'mermaid',
              diagram:
                'graph TD\n    A[Input Image] --> B[Conv Layer]\n    B --> C[Pooling]\n    C --> D[Dense Layer]',
              title: 'CNN Architecture',
            },
          },
          {
            elementType: 'code',
            elementData: {
              type: 'code',
              examples: [
                {
                  language: 'python',
                  code: "model = tf.keras.Sequential([\n    tf.keras.layers.Conv2D(32, 3, activation='relu'),\n    tf.keras.layers.MaxPooling2D(),\n    tf.keras.layers.Dense(10, activation='softmax')\n])",
                  title: 'Basic CNN Architecture',
                },
              ],
            },
          },
        ],

        // Display configuration
        displayConfig: {
          configType: 'default',
          layout: {
            cardContent: 'Brief overview with key concepts',
            sidebarContent: 'Prerequisites and related terms',
            mainContent: 'Detailed explanation with examples',
            modalContent: 'Historical context and case studies',
          },
        },
      };

      res.json({
        title: 'Enhanced Term Structure Demonstration',
        description:
          'Complete structure of an enhanced term with 42 sections, interactive elements, and display configurations',
        structure: mockEnhancedTerm,
        features: {
          enhancedCategorization: 'AI-powered multi-level categorization system',
          structuredSections: '42 predefined sections for comprehensive coverage',
          interactiveElements: 'Mermaid diagrams, code examples, quizzes, and demos',
          displayConfigurations: 'Customizable layouts for different viewing contexts',
          relationships: 'Prerequisite chains and related concept networks',
        },
      });
    } catch (error) {
      logger.error('Error in enhanced term structure demo:', error);
      res.status(500).json({
        message: 'Demo failed',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  /**
   * Demo endpoint for API capabilities overview
   * GET /api/demo/api-overview
   */
  app.get('/api/demo/api-overview', async (_req: Request, res: Response) => {
    try {
      const apiEndpoints = {
        'Enhanced Excel Upload': {
          endpoint: 'POST /api/enhanced/upload',
          description: 'Upload and process Excel files with 42-section structure using AI parsing',
          features: ['AI-powered content extraction', 'Caching for performance', 'Error handling'],
        },

        'Advanced Search': {
          endpoint: 'GET /api/enhanced/search',
          description: 'Multi-field search with faceted filtering',
          parameters: [
            'query',
            'categories',
            'difficultyLevel',
            'hasCodeExamples',
            'applicationDomains',
          ],
        },

        'Enhanced Filtering': {
          endpoint: 'GET /api/enhanced/filter',
          description: 'Complex filtering with multiple criteria and sorting',
          parameters: ['mainCategories', 'subCategories', 'techniques', 'sortBy', 'sortOrder'],
        },

        'Term Retrieval': {
          endpoint: 'GET /api/enhanced/terms/:id',
          description: 'Get complete term data with all sections and interactive elements',
          features: ['Section-based display', 'Interactive elements', 'Relationship mapping'],
        },

        'User Personalization': {
          endpoint: 'PUT /api/enhanced/preferences',
          description: 'Manage user preferences for personalized experience',
          features: ['Experience level customization', 'Section preferences', 'UI preferences'],
        },

        'Analytics & Insights': {
          endpoint: 'GET /api/enhanced/analytics/*',
          description: 'Comprehensive analytics for content performance',
          features: ['Usage tracking', 'Quality metrics', 'User engagement'],
        },

        'Interactive Elements': {
          endpoint: 'GET /api/enhanced/terms/:id/interactive',
          description: 'Manage interactive components like Mermaid diagrams and code examples',
          features: ['Mermaid diagrams', 'Code execution', 'Quiz systems'],
        },

        'Learning Paths': {
          endpoint: 'GET /api/enhanced/terms/:id/learning-path',
          description: 'Generate prerequisite chains and learning recommendations',
          features: ['Prerequisite mapping', 'Progress tracking', 'Personalized paths'],
        },
      };

      const systemCapabilities = {
        'AI-Powered Parsing':
          'Uses OpenAI GPT-4 for intelligent content extraction and categorization',
        '42-Section Structure': 'Comprehensive content organization with predefined sections',
        'Interactive Elements': 'Support for Mermaid diagrams, code examples, quizzes, and demos',
        'Advanced Search': 'Multi-field search with faceted filtering and autocompletion',
        Personalization: 'User-specific recommendations and customizable display preferences',
        Analytics: 'Comprehensive tracking of user engagement and content quality',
        Relationships: 'Prerequisite chains and related concept networks',
        Caching: 'Intelligent caching for performance optimization',
        Scalability: 'Designed to handle large datasets with efficient database operations',
      };

      res.json({
        title: 'Enhanced API System Overview',
        description:
          'Comprehensive API system for AI/ML glossary management with advanced features',
        endpoints: apiEndpoints,
        capabilities: systemCapabilities,
        technicalStack: {
          backend: 'Node.js + Express + TypeScript',
          database: 'PostgreSQL with Drizzle ORM',
          ai: 'OpenAI GPT-4 for content parsing',
          validation: 'Zod for type-safe validation',
          caching: 'File-based caching with hash-based invalidation',
        },
      });
    } catch (error) {
      logger.error('Error in API overview demo:', error);
      res.status(500).json({
        message: 'Demo failed',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  logger.info('✅ Enhanced demo routes registered successfully');
}
