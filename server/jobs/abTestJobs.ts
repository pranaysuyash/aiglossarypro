import cron from 'node-cron';
import { runDailyReports, runWeeklyReports } from '../services/abTestReportingService';
import { log as logger } from '../utils/logger';

/**
 * Initialize A/B testing scheduled jobs
 */
export function initABTestJobs(): void {
  // Daily reports at 9 AM UTC
  cron.schedule('0 9 * * *', async () => {
    logger.info('Running daily A/B test reports');
    try {
      await runDailyReports();
      logger.info('Daily A/B test reports completed');
    } catch (error) {
      logger.error('Error running daily A/B test reports:', error);
    }
  });

  // Weekly reports on Mondays at 10 AM UTC
  cron.schedule('0 10 * * 1', async () => {
    logger.info('Running weekly A/B test reports');
    try {
      await runWeeklyReports();
      logger.info('Weekly A/B test reports completed');
    } catch (error) {
      logger.error('Error running weekly A/B test reports:', error);
    }
  });

  logger.info('A/B testing scheduled jobs initialized');
}