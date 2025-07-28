// Missing type declarations for Phase A green build
// TODO: Replace these with proper types in Phase B/C

// Missing module declarations
declare module 'vite';
declare module 'swagger-ui-express';
declare module 'swagger-jsdoc';
declare module 'express-ws';
declare module 'memorystore';
declare module 'isomorphic-dompurify';

// Fix for duplicate Request/Response types
import type { Request as ExpressRequest, Response as ExpressResponse } from 'express';

// Global type extensions to avoid conflicts
declare global {
  namespace Express {
    export interface Request extends ExpressRequest {
      // Add custom properties if needed
    }
    export interface Response extends ExpressResponse {
      // Add custom properties if needed
    }
  }
}

export {};