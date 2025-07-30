import { Pool } from '@neondatabase/serverless';
import * as schema from '@aiglossarypro/shared/enhancedSchema';
export declare const pool: Pool;
export declare const db: import("drizzle-orm/neon-serverless").NeonDatabase<typeof schema> & {
    $client: Pool;
};
