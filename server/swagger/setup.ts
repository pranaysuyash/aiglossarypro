import type { Express } from 'express';
import swaggerUi from 'swagger-ui-express';
import { swaggerSpec } from './config';

import logger from '../utils/logger';
/**
 * Set up Swagger UI for API documentation
 */
export function setupSwagger(app: Express): void {
  // Swagger UI options
  const swaggerUiOptions = {
    explorer: true,
    customCss: `
      .swagger-ui .topbar { display: none; }
      .swagger-ui .scheme-container { display: none; }
      .swagger-ui .info .title { 
        color: #7C3AED; 
        font-size: 2.5rem; 
        font-weight: bold;
      }
      .swagger-ui .info .description { 
        font-size: 1rem; 
        line-height: 1.6;
      }
      .swagger-ui .btn.authorize { 
        background-color: #7C3AED; 
        border-color: #7C3AED; 
      }
      .swagger-ui .btn.authorize:hover { 
        background-color: #6D28D9; 
        border-color: #6D28D9; 
      }
      .swagger-ui .opblock.opblock-get .opblock-summary { 
        border-left: 4px solid #10B981; 
      }
      .swagger-ui .opblock.opblock-post .opblock-summary { 
        border-left: 4px solid #3B82F6; 
      }
      .swagger-ui .opblock.opblock-put .opblock-summary { 
        border-left: 4px solid #F59E0B; 
      }
      .swagger-ui .opblock.opblock-delete .opblock-summary { 
        border-left: 4px solid #EF4444; 
      }
    `,
    customSiteTitle: 'AI/ML Glossary Pro API Documentation',
    customfavIcon: '/favicon.ico',
    swaggerOptions: {
      persistAuthorization: true,
      displayOperationId: false,
      filter: true,
      showExtensions: true,
      showCommonExtensions: true,
      docExpansion: 'list',
      defaultModelsExpandDepth: 2,
      defaultModelExpandDepth: 2,
      tryItOutEnabled: true,
      requestInterceptor: (req: Request) => {
        // Add any request interceptors here
        return req;
      },
      responseInterceptor: (res: Response) => {
        // Add any response interceptors here
        return res;
      },
    },
  };

  // Serve Swagger JSON spec
  app.get('/api/docs/swagger.json', (_req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(swaggerSpec);
  });

  // Serve Swagger UI
  app.use('/api/docs', swaggerUi.serve);
  app.get('/api/docs', swaggerUi.setup(swaggerSpec, swaggerUiOptions));

  // Redirect /docs to /api/docs for convenience
  app.get('/docs', (_req, res) => {
    res.redirect('/api/docs');
  });

  logger.info('📚 Swagger UI available at /api/docs');
}
