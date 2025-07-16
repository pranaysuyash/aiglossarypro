import type { Options } from 'swagger-jsdoc';
import swaggerJSDoc from 'swagger-jsdoc';

const options: Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'AI/ML Glossary Pro API',
      version: '2.0.0',
      description: `
# AI/ML Glossary Pro API Documentation

The comprehensive API for AI/ML Glossary Pro - your complete reference platform for artificial intelligence and machine learning terminology.

## Authentication
Most endpoints require authentication via JWT tokens. Admin endpoints require additional authorization.

## Rate Limiting
- **Free users:** 50 requests per day (7-day grace period for new users)
- **Lifetime users:** Unlimited requests

## Pricing
- **Lifetime Access:** $249 (with automatic PPP discounts for 20+ countries)
- **Competitor Comparison:** Save $300-600 annually vs DataCamp/Coursera subscriptions

## Features
- 10,000+ AI/ML terms with comprehensive definitions
- Code examples in Python, TensorFlow, PyTorch, scikit-learn
- Real-world applications and use cases
- Advanced search and filtering capabilities
- Mobile-optimized responsive design
- Lifetime updates as the field evolves

## Support
- Email: support@aiglossarypro.com
- Response time: <24 hours
- 30-day money-back guarantee
      `,
      contact: {
        name: 'AI/ML Glossary Pro Support',
        email: 'support@aiglossarypro.com',
        url: 'https://aiglossarypro.com',
      },
      license: {
        name: 'Proprietary License',
        url: 'https://aiglossarypro.com/license',
      },
    },
    servers: [
      {
        url: 'http://localhost:3001',
        description: 'Development server',
      },
      {
        url: 'https://api.aiglossarypro.com',
        description: 'Production server',
      },
    ],
    components: {
      securitySchemes: {
        BearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'JWT token for authenticated requests',
        },
        AdminAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'JWT token with admin privileges',
        },
      },
      schemas: {
        Term: {
          type: 'object',
          required: ['id', 'name', 'shortDefinition'],
          properties: {
            id: {
              type: 'string',
              description: 'Unique identifier for the term',
              example: 'neural-network',
            },
            name: {
              type: 'string',
              description: 'Name of the AI/ML term',
              example: 'Neural Network',
            },
            shortDefinition: {
              type: 'string',
              description: 'Brief definition of the term',
              example: 'A computational model inspired by biological neural networks',
            },
            longDefinition: {
              type: 'string',
              description: 'Detailed explanation of the term',
              example: 'A neural network is a computational model...',
            },
            categoryId: {
              type: 'string',
              description: 'Category identifier',
              example: 'deep-learning',
            },
            category: {
              type: 'string',
              description: 'Category name',
              example: 'Deep Learning',
            },
            viewCount: {
              type: 'integer',
              description: 'Number of times this term has been viewed',
              example: 1250,
            },
            difficulty: {
              type: 'string',
              enum: ['beginner', 'intermediate', 'advanced'],
              description: 'Difficulty level of the term',
            },
            tags: {
              type: 'array',
              items: {
                type: 'string',
              },
              description: 'Associated tags',
              example: ['machine-learning', 'deep-learning', 'artificial-intelligence'],
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: 'When the term was created',
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
              description: 'When the term was last updated',
            },
          },
        },
        Category: {
          type: 'object',
          required: ['id', 'name'],
          properties: {
            id: {
              type: 'string',
              description: 'Unique identifier for the category',
              example: 'machine-learning',
            },
            name: {
              type: 'string',
              description: 'Category name',
              example: 'Machine Learning',
            },
            description: {
              type: 'string',
              description: 'Category description',
              example: 'Algorithms and techniques for machine learning',
            },
            termCount: {
              type: 'integer',
              description: 'Number of terms in this category',
              example: 145,
            },
            color: {
              type: 'string',
              description: 'Category color for UI',
              example: '#3B82F6',
            },
            icon: {
              type: 'string',
              description: 'Icon identifier',
              example: 'brain',
            },
          },
        },
        User: {
          type: 'object',
          required: ['id', 'email'],
          properties: {
            id: {
              type: 'string',
              description: 'Unique user identifier',
              example: 'user_123',
            },
            email: {
              type: 'string',
              format: 'email',
              description: 'User email address',
              example: 'user@example.com',
            },
            subscriptionTier: {
              type: 'string',
              enum: ['free', 'lifetime'],
              description: 'User subscription level',
            },
            lifetimeAccess: {
              type: 'boolean',
              description: 'Whether user has lifetime access',
              example: true,
            },
            dailyViews: {
              type: 'integer',
              description: 'Daily view count (for rate limiting)',
              example: 25,
            },
            isAdmin: {
              type: 'boolean',
              description: 'Whether user has admin privileges',
              example: false,
            },
          },
        },
        PaginatedResponse: {
          type: 'object',
          required: ['data', 'total', 'page', 'limit'],
          properties: {
            data: {
              type: 'array',
              items: {
                oneOf: [
                  { $ref: '#/components/schemas/Term' },
                  { $ref: '#/components/schemas/Category' },
                ],
              },
              description: 'Array of results',
            },
            total: {
              type: 'integer',
              description: 'Total number of items',
              example: 10372,
            },
            page: {
              type: 'integer',
              description: 'Current page number',
              example: 1,
            },
            limit: {
              type: 'integer',
              description: 'Items per page',
              example: 12,
            },
            hasMore: {
              type: 'boolean',
              description: 'Whether there are more pages',
              example: true,
            },
          },
        },
        ApiResponse: {
          type: 'object',
          required: ['success'],
          properties: {
            success: {
              type: 'boolean',
              description: 'Whether the request was successful',
              example: true,
            },
            data: {
              description: 'Response data (varies by endpoint)',
            },
            error: {
              type: 'string',
              description: 'Error message (only present when success is false)',
              example: 'Resource not found',
            },
            message: {
              type: 'string',
              description: 'Additional message',
              example: 'Operation completed successfully',
            },
          },
        },
        ErrorResponse: {
          type: 'object',
          required: ['success', 'error'],
          properties: {
            success: {
              type: 'boolean',
              example: false,
            },
            error: {
              type: 'string',
              description: 'Error message',
              example: 'Authentication required',
            },
            code: {
              type: 'string',
              description: 'Error code',
              example: 'UNAUTHORIZED',
            },
          },
        },
        CountryPricing: {
          type: 'object',
          required: ['basePrice', 'localPrice', 'countryCode'],
          properties: {
            basePrice: {
              type: 'number',
              description: 'Base price in USD',
              example: 249,
            },
            localPrice: {
              type: 'number',
              description: 'Local price with PPP discount',
              example: 99,
            },
            discount: {
              type: 'number',
              description: 'PPP discount percentage',
              example: 60,
            },
            countryCode: {
              type: 'string',
              description: 'ISO country code',
              example: 'IN',
            },
            countryName: {
              type: 'string',
              description: 'Country name',
              example: 'India',
            },
            flag: {
              type: 'string',
              description: 'Country flag emoji',
              example: '🇮🇳',
            },
            currency: {
              type: 'string',
              description: 'Currency code',
              example: 'USD',
            },
            annualSavings: {
              type: 'number',
              description: 'Annual savings vs competitors',
              example: 400,
            },
            localCompetitor: {
              type: 'string',
              description: 'Local competitor name',
              example: 'DataCamp India',
            },
          },
        },
      },
      responses: {
        UnauthorizedError: {
          description: 'Authentication required',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ErrorResponse',
              },
              example: {
                success: false,
                error: 'Authentication required',
                code: 'UNAUTHORIZED',
              },
            },
          },
        },
        ForbiddenError: {
          description: 'Insufficient permissions',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ErrorResponse',
              },
              example: {
                success: false,
                error: 'Admin access required',
                code: 'FORBIDDEN',
              },
            },
          },
        },
        NotFoundError: {
          description: 'Resource not found',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ErrorResponse',
              },
              example: {
                success: false,
                error: 'Resource not found',
                code: 'NOT_FOUND',
              },
            },
          },
        },
        RateLimitError: {
          description: 'Rate limit exceeded',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ErrorResponse',
              },
              example: {
                success: false,
                error: 'Daily view limit exceeded. Upgrade to lifetime access for unlimited views.',
                code: 'RATE_LIMITED',
              },
            },
          },
        },
      },
    },
    tags: [
      {
        name: 'Authentication',
        description: 'User authentication and authorization',
      },
      {
        name: 'Terms',
        description: 'AI/ML term operations - browse, search, and view detailed definitions',
      },
      {
        name: 'Categories',
        description: 'Term categories and classification',
      },
      {
        name: 'Search',
        description: 'Advanced search and filtering capabilities',
      },
      {
        name: 'User Management',
        description: 'User profile, favorites, and progress tracking',
      },
      {
        name: 'Admin',
        description: 'Administrative operations (requires admin privileges)',
      },
      {
        name: 'Analytics',
        description: 'Usage analytics and metrics',
      },
      {
        name: 'Monetization',
        description: 'Purchase processing and pricing information',
      },
      {
        name: 'System',
        description: 'System health and monitoring',
      },
    ],
  },
  apis: ['./server/routes/*.ts', './server/routes/**/*.ts', './server/swagger/paths/*.yaml'],
};

export const swaggerSpec = swaggerJSDoc(options);
export default swaggerSpec;
