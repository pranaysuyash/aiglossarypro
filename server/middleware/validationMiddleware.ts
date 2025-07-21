import { NextFunction, Request, Response } from 'express';
import { z, ZodError, ZodSchema } from 'zod';
import logger from '../utils/logger';
import DOMPurify from 'isomorphic-dompurify';
import sqlstring from 'sqlstring';

interface ValidationOptions {
  sanitizeHtml?: boolean;
  sanitizeSql?: boolean;
  allowPartial?: boolean;
  logErrors?: boolean;
}

/**
 * Enhanced validation middleware with security features
 */
export class ValidationMiddleware {
  /**
   * Validates request body against a Zod schema
   */
  static body<T>(schema: ZodSchema<T>, options: ValidationOptions = {}) {
    return async (req: Request, res: Response, next: NextFunction) => {
      try {
        // Sanitize input if needed
        let data = req.body;
        
        if (options.sanitizeHtml) {
          data = this.sanitizeHtmlRecursive(data);
        }
        
        if (options.sanitizeSql) {
          data = this.sanitizeSqlRecursive(data);
        }

        // Validate with Zod
        const validatedData = options.allowPartial 
          ? await schema.partial().parseAsync(data)
          : await schema.parseAsync(data);
        
        // Replace body with validated data
        req.body = validatedData;
        
        next();
      } catch (error) {
        this.handleValidationError(error, res, options);
      }
    };
  }

  /**
   * Validates request query parameters
   */
  static query<T>(schema: ZodSchema<T>, options: ValidationOptions = {}) {
    return async (req: Request, res: Response, next: NextFunction) => {
      try {
        let data = req.query;
        
        if (options.sanitizeHtml) {
          data = this.sanitizeHtmlRecursive(data);
        }
        
        if (options.sanitizeSql) {
          data = this.sanitizeSqlRecursive(data);
        }

        const validatedData = await schema.parseAsync(data);
        req.query = validatedData as any;
        
        next();
      } catch (error) {
        this.handleValidationError(error, res, options);
      }
    };
  }

  /**
   * Validates request parameters
   */
  static params<T>(schema: ZodSchema<T>, options: ValidationOptions = {}) {
    return async (req: Request, res: Response, next: NextFunction) => {
      try {
        let data = req.params;
        
        if (options.sanitizeSql) {
          data = this.sanitizeSqlRecursive(data);
        }

        const validatedData = await schema.parseAsync(data);
        req.params = validatedData as any;
        
        next();
      } catch (error) {
        this.handleValidationError(error, res, options);
      }
    };
  }

  /**
   * Combined validation for body, query, and params
   */
  static validate(schemas: {
    body?: ZodSchema<any>;
    query?: ZodSchema<any>;
    params?: ZodSchema<any>;
  }, options: ValidationOptions = {}) {
    return async (req: Request, res: Response, next: NextFunction) => {
      try {
        const errors: any[] = [];
        
        // Validate body
        if (schemas.body) {
          try {
            let bodyData = req.body;
            
            if (options.sanitizeHtml) {
              bodyData = this.sanitizeHtmlRecursive(bodyData);
            }
            
            if (options.sanitizeSql) {
              bodyData = this.sanitizeSqlRecursive(bodyData);
            }
            
            req.body = await schemas.body.parseAsync(bodyData);
          } catch (error) {
            if (error instanceof ZodError) {
              errors.push(...error.errors.map(e => ({ ...e, source: 'body' })));
            }
          }
        }
        
        // Validate query
        if (schemas.query) {
          try {
            let queryData = req.query;
            
            if (options.sanitizeHtml) {
              queryData = this.sanitizeHtmlRecursive(queryData);
            }
            
            if (options.sanitizeSql) {
              queryData = this.sanitizeSqlRecursive(queryData);
            }
            
            req.query = await schemas.query.parseAsync(queryData) as any;
          } catch (error) {
            if (error instanceof ZodError) {
              errors.push(...error.errors.map(e => ({ ...e, source: 'query' })));
            }
          }
        }
        
        // Validate params
        if (schemas.params) {
          try {
            let paramsData = req.params;
            
            if (options.sanitizeSql) {
              paramsData = this.sanitizeSqlRecursive(paramsData);
            }
            
            req.params = await schemas.params.parseAsync(paramsData) as any;
          } catch (error) {
            if (error instanceof ZodError) {
              errors.push(...error.errors.map(e => ({ ...e, source: 'params' })));
            }
          }
        }
        
        if (errors.length > 0) {
          return res.status(400).json({
            success: false,
            message: 'Validation failed',
            errors: errors
          });
        }
        
        next();
      } catch (error) {
        this.handleValidationError(error, res, options);
      }
    };
  }

  /**
   * Recursively sanitize HTML in an object
   */
  private static sanitizeHtmlRecursive(obj: any): any {
    if (typeof obj === 'string') {
      return DOMPurify.sanitize(obj, {
        ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a', 'code', 'pre', 'p', 'br', 'ul', 'ol', 'li'],
        ALLOWED_ATTR: ['href', 'target', 'rel']
      });
    }
    
    if (Array.isArray(obj)) {
      return obj.map(item => this.sanitizeHtmlRecursive(item));
    }
    
    if (obj !== null && typeof obj === 'object') {
      const sanitized: any = {};
      for (const key in obj) {
        if (obj.hasOwnProperty(key)) {
          sanitized[key] = this.sanitizeHtmlRecursive(obj[key]);
        }
      }
      return sanitized;
    }
    
    return obj;
  }

  /**
   * Recursively sanitize SQL injection attempts
   */
  private static sanitizeSqlRecursive(obj: any): any {
    if (typeof obj === 'string') {
      // Basic SQL injection prevention
      return sqlstring.escape(obj).slice(1, -1); // Remove quotes added by escape
    }
    
    if (Array.isArray(obj)) {
      return obj.map(item => this.sanitizeSqlRecursive(item));
    }
    
    if (obj !== null && typeof obj === 'object') {
      const sanitized: any = {};
      for (const key in obj) {
        if (obj.hasOwnProperty(key)) {
          sanitized[key] = this.sanitizeSqlRecursive(obj[key]);
        }
      }
      return sanitized;
    }
    
    return obj;
  }

  /**
   * Handle validation errors
   */
  private static handleValidationError(
    error: unknown, 
    res: Response, 
    options: ValidationOptions
  ): void {
    if (error instanceof ZodError) {
      if (options.logErrors) {
        logger.warn('Validation error', {
          errors: error.errors,
          path: res.req?.path,
          method: res.req?.method
        });
      }
      
      res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message,
          code: err.code
        }))
      });
    } else {
      logger.error('Unexpected validation error', error);
      res.status(500).json({
        success: false,
        message: 'Internal validation error'
      });
    }
  }
}

// Common validation schemas
export const commonSchemas = {
  // ID validations
  id: z.string().uuid('Invalid ID format'),
  numericId: z.coerce.number().int().positive('ID must be a positive integer'),
  
  // Pagination
  pagination: z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    sort: z.enum(['asc', 'desc']).optional(),
    sortBy: z.string().optional()
  }),
  
  // Search
  search: z.object({
    q: z.string().min(1).max(500),
    filters: z.record(z.string(), z.any()).optional()
  }),
  
  // User input
  email: z.string().email('Invalid email format'),
  password: z.string().min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
  
  // Content
  title: z.string().min(1).max(200),
  description: z.string().min(1).max(5000),
  content: z.string().min(1).max(50000),
  
  // Dates
  dateRange: z.object({
    startDate: z.string().datetime(),
    endDate: z.string().datetime()
  }).refine(data => new Date(data.startDate) <= new Date(data.endDate), {
    message: 'Start date must be before end date'
  })
};

// Export convenience methods
export const validate = ValidationMiddleware;