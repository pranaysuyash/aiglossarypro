import { z } from 'zod';
import { ANALYTICS_CONSTANTS, PAGINATION_CONSTANTS } from '../utils/constants';

// Valid timeframe options
const TimeframeSchema = z.enum(ANALYTICS_CONSTANTS.VALID_TIMEFRAMES, {
  errorMap: () => ({ message: `Timeframe must be one of: ${ANALYTICS_CONSTANTS.VALID_TIMEFRAMES.join(', ')}` })
});

// Valid granularity options
const GranularitySchema = z.enum(ANALYTICS_CONSTANTS.VALID_GRANULARITIES, {
  errorMap: () => ({ message: `Granularity must be one of: ${ANALYTICS_CONSTANTS.VALID_GRANULARITIES.join(', ')}` })
});

// Valid sort options
const SortSchema = z.enum(['views', 'name', 'recent', 'lastViewed'], {
  errorMap: () => ({ message: "Sort must be one of: views, name, recent, lastViewed" })
});

// Valid export formats
const ExportFormatSchema = z.enum(['json', 'csv'], {
  errorMap: () => ({ message: "Format must be either json or csv" })
});

// Valid export types
const ExportTypeSchema = z.enum(['summary', 'detailed', 'categories', 'users'], {
  errorMap: () => ({ message: "Type must be one of: summary, detailed, categories, users" })
});

// Pagination schema
const PaginationSchema = z.object({
  page: z.coerce.number().int().min(1).max(10000).default(1),
  limit: z.coerce.number().int().min(1).max(1000).default(20)
});

// General analytics query schema
export const GeneralAnalyticsQuerySchema = z.object({
  timeframe: TimeframeSchema.default(ANALYTICS_CONSTANTS.DEFAULT_TIMEFRAME),
  granularity: GranularitySchema.default(ANALYTICS_CONSTANTS.DEFAULT_GRANULARITY)
});

// User analytics query schema
export const UserAnalyticsQuerySchema = z.object({
  timeframe: TimeframeSchema.default('30d')
});

// Content analytics query schema
export const ContentAnalyticsQuerySchema = z.object({
  timeframe: TimeframeSchema.default('30d'),
  limit: z.coerce.number().int().min(1).max(1000).default(20),
  sort: SortSchema.default('views'),
  page: z.coerce.number().int().min(1).max(10000).default(1)
});

// Category analytics query schema
export const CategoryAnalyticsQuerySchema = z.object({
  timeframe: TimeframeSchema.default('30d')
});

// Export analytics query schema
export const ExportAnalyticsQuerySchema = z.object({
  format: ExportFormatSchema.default('json'),
  timeframe: TimeframeSchema.default('30d'),
  type: ExportTypeSchema.default('summary')
});

// Utility type exports
export type TimeframeType = z.infer<typeof TimeframeSchema>;
export type GranularityType = z.infer<typeof GranularitySchema>;
export type SortType = z.infer<typeof SortSchema>;
export type ExportFormatType = z.infer<typeof ExportFormatSchema>;
export type ExportTypeType = z.infer<typeof ExportTypeSchema>;

export type GeneralAnalyticsQuery = z.infer<typeof GeneralAnalyticsQuerySchema>;
export type UserAnalyticsQuery = z.infer<typeof UserAnalyticsQuerySchema>;
export type ContentAnalyticsQuery = z.infer<typeof ContentAnalyticsQuerySchema>;
export type CategoryAnalyticsQuery = z.infer<typeof CategoryAnalyticsQuerySchema>;
export type ExportAnalyticsQuery = z.infer<typeof ExportAnalyticsQuerySchema>;

/**
 * Utility function to convert timeframe string to days
 */
export function timeframeToDays(timeframe: TimeframeType): number {
  switch (timeframe) {
    case '24h': return 1;
    case '7d': return 7;
    case '30d': return 30;
    default: return 7;
  }
}

/**
 * Middleware factory for validating query parameters
 */
export function validateQuery<T>(schema: z.ZodSchema<T>) {
  return (req: any, res: any, next: any) => {
    try {
      const result = schema.safeParse(req.query);
      
      if (!result.success) {
        return res.status(400).json({
          success: false,
          error: 'Invalid query parameters',
          details: result.error.errors.map(err => ({
            field: err.path.join('.'),
            message: err.message
          }))
        });
      }
      
      // Replace req.query with validated and transformed data
      req.query = result.data;
      next();
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Validation error',
        message: error instanceof Error ? error.message : 'Unknown validation error'
      });
    }
  };
}