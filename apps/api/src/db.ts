// Re-export db from database package for backward compatibility
export { db } from '@aiglossarypro/database';
export * from '@aiglossarypro/database';

// For CacheMetrics compatibility
import { db } from '@aiglossarypro/database';
export const getDb = () => db;