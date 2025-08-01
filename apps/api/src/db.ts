// Re-export db from database package for backward compatibility
export { db } from '@aiglossarypro/database/db';
export * from '@aiglossarypro/database/db';

// For CacheMetrics compatibility
export const getDb = () => db;