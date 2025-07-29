#!/usr/bin/env node

/**
 * Daily Term Rotation Cron Job
 *
 * This script runs daily to pre-generate the next day's term selection
 * and warm up the cache for better performance.
 */

import { addDays, format } from 'date-fns';
import { DailyTermRotationService } from '../server/services/dailyTermRotation.js';
import { log as logger } from '../server/utils/logger.js';

const dailyTermsService = new DailyTermRotationService();

async function runDailyTermRotation() {
  const today = new Date();
  const tomorrow = addDays(today, 1);

  logger.info('Starting daily term rotation job', {
    today: format(today, 'yyyy-MM-dd'),
    tomorrow: format(tomorrow, 'yyyy-MM-dd'),
  });

  try {
    // 1. Generate today's terms (if not already cached)
    console.log("📚 Generating today's terms...");
    const todaysTerms = await dailyTermsService.getTodaysTerms(today);
    console.log(`✅ Today's terms ready: ${todaysTerms.terms.length} terms selected`);

    // 2. Pre-generate tomorrow's terms to warm cache
    console.log("🔮 Pre-generating tomorrow's terms...");
    const tomorrowsTerms = await dailyTermsService.getTodaysTerms(tomorrow);
    console.log(`✅ Tomorrow's terms ready: ${tomorrowsTerms.terms.length} terms selected`);

    // 3. Log distribution analysis
    console.log("\n📊 Today's Distribution:");
    console.log(`   Difficulty:`, todaysTerms.metadata.distribution.difficulty);
    console.log(
      `   Categories:`,
      Object.keys(todaysTerms.metadata.distribution.category).length,
      'categories'
    );
    console.log(`   Quality:`, todaysTerms.metadata.distribution.quality);

    console.log("\n📊 Tomorrow's Distribution:");
    console.log(`   Difficulty:`, tomorrowsTerms.metadata.distribution.difficulty);
    console.log(
      `   Categories:`,
      Object.keys(tomorrowsTerms.metadata.distribution.category).length,
      'categories'
    );
    console.log(`   Quality:`, tomorrowsTerms.metadata.distribution.quality);

    // 4. Clean up old cache files (older than 7 days)
    console.log('\n🧹 Cleaning up old cache files...');
    await cleanupOldCache();

    // 5. Generate performance metrics
    console.log('\n📈 Generating performance metrics...');
    const metrics = await dailyTermsService.getSelectionMetrics(7);
    console.log(`   Algorithm performance tracked for last 7 days`);

    logger.info('Daily term rotation completed successfully', {
      todaysTermCount: todaysTerms.terms.length,
      tomorrowsTermCount: tomorrowsTerms.terms.length,
      algorithmVersion: todaysTerms.metadata.algorithm_version,
    });

    console.log('\n✨ Daily term rotation completed successfully!');
  } catch (error) {
    logger.error('Daily term rotation failed', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });

    console.error('❌ Daily term rotation failed:', error.message);

    // Exit with error code for monitoring
    process.exit(1);
  }
}

async function cleanupOldCache() {
  try {
    const fs = await import('fs');
    const path = await import('path');
    const { subDays } = await import('date-fns');

    const cacheDir = path.join(process.cwd(), 'cache', 'daily-terms');

    if (!fs.existsSync(cacheDir)) {
      return;
    }

    const files = fs.readdirSync(cacheDir);
    const cutoffDate = subDays(new Date(), 7);

    let deletedCount = 0;

    for (const file of files) {
      if (file.endsWith('.json')) {
        const filePath = path.join(cacheDir, file);
        const stats = fs.statSync(filePath);

        if (stats.mtime < cutoffDate) {
          fs.unlinkSync(filePath);
          deletedCount++;
        }
      }
    }

    if (deletedCount > 0) {
      console.log(`   Deleted ${deletedCount} old cache files`);
    } else {
      console.log(`   No old cache files to delete`);
    }
  } catch (error) {
    logger.warn('Failed to cleanup old cache files', { error });
    console.log('   ⚠️  Failed to cleanup old cache files');
  }
}

// Handle process termination gracefully
process.on('SIGINT', () => {
  logger.info('Daily term rotation job interrupted');
  process.exit(0);
});

process.on('SIGTERM', () => {
  logger.info('Daily term rotation job terminated');
  process.exit(0);
});

// Handle uncaught exceptions
process.on('uncaughtException', error => {
  logger.error('Uncaught exception in daily term rotation', { error });
  console.error('❌ Uncaught exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled rejection in daily term rotation', { reason, promise });
  console.error('❌ Unhandled rejection:', reason);
  process.exit(1);
});

// Run the job
console.log('🚀 Starting AI Glossary Pro Daily Term Rotation');
console.log('='.repeat(60));

runDailyTermRotation()
  .then(() => {
    console.log('='.repeat(60));
    console.log('✅ Daily term rotation job completed successfully');
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ Daily term rotation job failed:', error);
    process.exit(1);
  });
