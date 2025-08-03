import { checkDatabaseHealth } from '@aiglossarypro/database';
import { validateEnvironment, printValidationResult } from '@aiglossarypro/config';
import { log } from './utils/logger';

export async function bootstrap(): Promise<void> {
  console.log('[BOOTSTRAP] Starting application initialization...');
  
  // Step 1: Validate environment (but don't exit in production)
  const envValidation = validateEnvironment();
  printValidationResult(envValidation);
  
  if (!envValidation.isValid) {
    if (process.env.NODE_ENV === 'production') {
      log.warn('Environment validation failed in production, continuing with defaults');
    } else {
      throw new Error('Environment validation failed');
    }
  }
  
  // Step 2: Check database health
  try {
    const dbHealth = await checkDatabaseHealth();
    if (dbHealth.status !== 'healthy') {
      throw new Error(`Database is not healthy: status=${dbHealth.status}, recommendations=${dbHealth.recommendations?.join(', ')}`);
    }
    log.info('Database connection established successfully');
  } catch (error: any) {
    if (process.env.NODE_ENV === 'production') {
      log.error('Database initialization failed, running in degraded mode:', error);
    } else {
      throw error;
    }
  }
  
  // Step 3: Initialize other services (Redis, Auth, etc.)
  // These should follow the same pattern - log and continue in prod
  
  console.log('[BOOTSTRAP] Application initialization complete');
}
